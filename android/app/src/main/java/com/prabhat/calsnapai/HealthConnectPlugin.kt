package com.prabhat.calsnapai

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.time.Duration
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "HealthConnect")
class HealthConnectPlugin : Plugin() {
    private val pluginScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private lateinit var permissionLauncher: ActivityResultLauncher<Set<String>>
    private var pendingPermissionCall: PluginCall? = null

    private val requiredPermissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
    )

    override fun load() {
        permissionLauncher = bridge.registerForActivityResult(
            PermissionController.createRequestPermissionResultContract(PROVIDER_PACKAGE_NAME)
        ) { grantedPermissions ->
            val call = pendingPermissionCall ?: return@registerForActivityResult
            pendingPermissionCall = null

            pluginScope.launch {
                resolveSyncCall(call, grantedPermissions, true)
            }
        }
    }

    override fun handleOnDestroy() {
        pluginScope.cancel()
        super.handleOnDestroy()
    }

    @PluginMethod
    fun getStatus(call: PluginCall) {
        pluginScope.launch {
            resolveSyncCall(call, null, false)
        }
    }

    @PluginMethod
    fun sync(call: PluginCall) {
        pluginScope.launch {
            resolveSyncCall(call, null, true)
        }
    }

    @PluginMethod
    fun requestHealthAccess(call: PluginCall) {
        when (HealthConnectClient.getSdkStatus(context, PROVIDER_PACKAGE_NAME)) {
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> {
                openProviderStore()
                call.resolve(
                    buildAvailabilityResponse(
                        availability = "setup_required",
                        note = "Install or update Health Connect, then try syncing again.",
                        permissionsGranted = false,
                    )
                )
            }

            HealthConnectClient.SDK_AVAILABLE -> {
                pendingPermissionCall = call
                permissionLauncher.launch(requiredPermissions)
            }

            else -> {
                call.resolve(
                    buildAvailabilityResponse(
                        availability = "unsupported",
                        note = "Health Connect is not available on this device.",
                        permissionsGranted = false,
                    )
                )
            }
        }
    }

    private suspend fun resolveSyncCall(
        call: PluginCall,
        grantedOverride: Set<String>?,
        fetchData: Boolean,
    ) {
        try {
            call.resolve(fetchHealthConnectSnapshot(grantedOverride, fetchData))
        } catch (exception: Exception) {
            call.reject("Health Connect sync failed: ${exception.message}", exception)
        }
    }

    private suspend fun fetchHealthConnectSnapshot(
        grantedOverride: Set<String>?,
        fetchData: Boolean,
    ): JSObject {
        return when (HealthConnectClient.getSdkStatus(context, PROVIDER_PACKAGE_NAME)) {
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> {
                buildAvailabilityResponse(
                    availability = "setup_required",
                    note = "Install or update Health Connect to import steps, sleep, workouts, and weight.",
                    permissionsGranted = false,
                )
            }

            HealthConnectClient.SDK_AVAILABLE -> {
                val client = HealthConnectClient.getOrCreate(context, PROVIDER_PACKAGE_NAME)
                val grantedPermissions =
                    grantedOverride ?: client.permissionController.getGrantedPermissions()
                val permissionsGranted = grantedPermissions.containsAll(requiredPermissions)

                if (!permissionsGranted) {
                    buildAvailabilityResponse(
                        availability = "setup_required",
                        note = "Allow step, sleep, workout, and weight access to sync Health Connect data into CALSNAP AI.",
                        permissionsGranted = false,
                    )
                } else {
                    val response = buildAvailabilityResponse(
                        availability = "ready",
                        note = "Health Connect is attached and ready to import steps, sleep, workouts, and weight.",
                        permissionsGranted = true,
                    )

                    if (!fetchData) {
                        response
                    } else {
                        val end = Instant.now()
                        val weekStart = end.minus(7, ChronoUnit.DAYS)
                        val weightStart = end.minus(180, ChronoUnit.DAYS)

                        val stepsAggregate = client.aggregate(
                            AggregateRequest(
                                metrics = setOf(StepsRecord.COUNT_TOTAL),
                                timeRangeFilter = TimeRangeFilter.between(weekStart, end),
                                dataOriginFilter = emptySet(),
                            )
                        )
                        val workouts = client.readRecords(
                            ReadRecordsRequest(
                                recordType = ExerciseSessionRecord::class,
                                timeRangeFilter = TimeRangeFilter.between(weekStart, end),
                                dataOriginFilter = emptySet(),
                                ascendingOrder = true,
                                pageSize = 200,
                            )
                        ).records
                        val sleepSessions = client.readRecords(
                            ReadRecordsRequest(
                                recordType = SleepSessionRecord::class,
                                timeRangeFilter = TimeRangeFilter.between(weekStart, end),
                                dataOriginFilter = emptySet(),
                                ascendingOrder = true,
                                pageSize = 200,
                            )
                        ).records
                        val weights = client.readRecords(
                            ReadRecordsRequest(
                                recordType = WeightRecord::class,
                                timeRangeFilter = TimeRangeFilter.between(weightStart, end),
                                dataOriginFilter = emptySet(),
                                ascendingOrder = false,
                                pageSize = 20,
                            )
                        ).records

                        stepsAggregate[StepsRecord.COUNT_TOTAL]?.let { response.put("steps7d", it) }
                        response.put("workouts7d", workouts.size)

                        calculateAverageSleepHours(sleepSessions)?.let {
                            response.put("averageSleepHours", it)
                        }

                        weights.firstOrNull()?.let { latestWeight ->
                            response.put("latestWeightKg", latestWeight.weight.inKilograms)
                            response.put("latestWeightAt", latestWeight.time.toEpochMilli())
                        }

                        response.put("lastSyncedAt", System.currentTimeMillis())
                        response.put(
                            "note",
                            buildReadyNote(
                                stepsAggregate[StepsRecord.COUNT_TOTAL],
                                workouts.size,
                                calculateAverageSleepHours(sleepSessions),
                            )
                        )
                        response
                    }
                }
            }

            else -> {
                buildAvailabilityResponse(
                    availability = "unsupported",
                    note = "Health Connect is not available on this device.",
                    permissionsGranted = false,
                )
            }
        }
    }

    private fun calculateAverageSleepHours(sleepSessions: List<SleepSessionRecord>): Double? {
        if (sleepSessions.isEmpty()) {
            return null
        }

        val totalMinutes = sleepSessions.sumOf {
            Duration.between(it.startTime, it.endTime).toMinutes()
        }

        val averageHours = (totalMinutes.toDouble() / sleepSessions.size) / 60.0
        return kotlin.math.round(averageHours * 10.0) / 10.0
    }

    private fun buildReadyNote(
        steps7d: Long?,
        workouts7d: Int,
        averageSleepHours: Double?,
    ): String {
        val stepText =
            if (steps7d != null) {
                String.format(Locale.US, "%,d steps in the last 7 days", steps7d)
            } else {
                "steps ready"
            }
        val workoutText =
            if (workouts7d == 1) {
                "1 workout synced"
            } else {
                "$workouts7d workouts synced"
            }
        val sleepText =
            if (averageSleepHours != null) {
                String.format(Locale.US, "%.1f h average sleep", averageSleepHours)
            } else {
                "sleep ready"
            }

        return "$stepText • $workoutText • $sleepText"
    }

    private fun buildAvailabilityResponse(
        availability: String,
        note: String,
        permissionsGranted: Boolean,
    ) = JSObject().apply {
        put("provider", "health_connect")
        put("availability", availability)
        put("permissionsGranted", permissionsGranted)
        put("note", note)
    }

    private fun openProviderStore() {
        val marketIntent = Intent(
            Intent.ACTION_VIEW,
            Uri.parse("market://details?id=$PROVIDER_PACKAGE_NAME&url=healthconnect%3A%2F%2Fonboarding"),
        ).apply {
            setPackage("com.android.vending")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        try {
            context.startActivity(marketIntent)
        } catch (_: ActivityNotFoundException) {
            val fallbackIntent = Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://play.google.com/store/apps/details?id=$PROVIDER_PACKAGE_NAME"),
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(fallbackIntent)
        }
    }

    companion object {
        private const val PROVIDER_PACKAGE_NAME = "com.google.android.apps.healthdata"
    }
}
