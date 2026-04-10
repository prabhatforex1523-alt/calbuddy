import { useEffect, useRef } from 'react';

import type { HealthData } from '../types';
import { reportError } from '../services/telemetry';
import { INITIAL_PROFILE } from '../services/appData';
import {
  subscribeToUserProfile,
  saveUserProfile,
} from '../services/userProfileFirestore';
import {
  subscribeToWeightEntries,
  addWeightEntry,
  deleteWeightEntry,
} from '../services/weightFirestore';
import {
  subscribeToWaterEntries,
  addWaterEntry,
  deleteWaterEntry,
} from '../services/waterFirestore';
import {
  subscribeToHabitLogs,
  addHabitLog,
  deleteHabitLog,
} from '../services/habitLogFirestore';
import {
  subscribeToDailyCheckIns,
  addDailyCheckIn,
  deleteDailyCheckIn,
} from '../services/dailyCheckInFirestore';
import {
  subscribeToMealTemplates,
  addMealTemplate,
  updateMealTemplate,
  deleteMealTemplate,
} from '../services/mealTemplateFirestore';

type CloudSyncOptions = {
  data: HealthData;
  setData: (updater: (prev: HealthData) => HealthData) => void;
  userId: string | undefined;
  showToast: (message: string, type?: 'success' | 'error') => void;
};

export const useCloudDataSync = ({ data, setData, userId, showToast }: CloudSyncOptions) => {
  // Keep showToast ref current without re-running effects
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  // Profile — read from Firestore on login, then save changes back
  useEffect(() => {
    if (!userId) return;

    const unsub = subscribeToUserProfile(
      userId,
      (profile) => {
        if (profile) {
          // Merge: prefer Firestore data but keep onboardingCompleted/local-only fields
          setData((prev) => ({
            ...prev,
            profile: {
              ...INITIAL_PROFILE,
              ...profile,
              // Never overwrite local-only fields from cloud
              wallpaperUrl: prev.profile.wallpaperUrl,
              wallpaperOpacity: prev.profile.wallpaperOpacity,
              wallpaperBlur: prev.profile.wallpaperBlur,
            },
          }));
        }
      },
      (err) => {
        reportError(err, { scope: 'user_profile_subscribe', userId });
      }
    );
    return () => unsub();
  }, [userId, setData]);

  // Profile sync — save to Firestore whenever profile changes locally
  useEffect(() => {
    if (!userId) return;
    saveUserProfile(userId, data.profile).catch((err) => {
      reportError(err, { scope: 'user_profile_save', userId });
    });
  }, [data.profile, userId]);

  // Weight entries
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToWeightEntries(
      userId,
      (entries) => setData((prev) => ({ ...prev, weightEntries: entries })),
      (err) => {
        reportError(err, { scope: 'weight_subscribe', userId });
        showToastRef.current('Could not sync weight data from cloud.', 'error');
      }
    );
    return () => unsub();
  }, [userId, setData]);

  // Water entries
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToWaterEntries(
      userId,
      (entries) => setData((prev) => ({ ...prev, waterEntries: entries })),
      (err) => {
        reportError(err, { scope: 'water_subscribe', userId });
        showToastRef.current('Could not sync water data from cloud.', 'error');
      }
    );
    return () => unsub();
  }, [userId, setData]);

  // Habit logs
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToHabitLogs(
      userId,
      (logs) => setData((prev) => ({ ...prev, habitLogs: logs })),
      (err) => {
        reportError(err, { scope: 'habit_log_subscribe', userId });
        showToastRef.current('Could not sync habit data from cloud.', 'error');
      }
    );
    return () => unsub();
  }, [userId, setData]);

  // Daily check-ins
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToDailyCheckIns(
      userId,
      (checkIns) => setData((prev) => ({ ...prev, dailyCheckIns: checkIns })),
      (err) => {
        reportError(err, { scope: 'daily_checkin_subscribe', userId });
        showToastRef.current('Could not sync check-in data from cloud.', 'error');
      }
    );
    return () => unsub();
  }, [userId, setData]);

  // Meal templates
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToMealTemplates(
      userId,
      (templates) => setData((prev) => ({ ...prev, mealTemplates: templates })),
      (err) => {
        reportError(err, { scope: 'meal_template_subscribe', userId });
        showToastRef.current('Could not sync meal templates from cloud.', 'error');
      }
    );
    return () => unsub();
  }, [userId, setData]);
};

// Expose cloud write helpers for use from App.tsx event handlers
export const cloudAddWeightEntry = (userId: string, entry: Parameters<typeof addWeightEntry>[1]) =>
  addWeightEntry(userId, entry);

export const cloudDeleteWeightEntry = (userId: string, entryId: string) =>
  deleteWeightEntry(userId, entryId);

export const cloudAddWaterEntry = (userId: string, entry: Parameters<typeof addWaterEntry>[1]) =>
  addWaterEntry(userId, entry);

export const cloudDeleteWaterEntry = (userId: string, entryId: string) =>
  deleteWaterEntry(userId, entryId);

export const cloudAddHabitLog = (userId: string, log: Parameters<typeof addHabitLog>[1]) =>
  addHabitLog(userId, log);

export const cloudDeleteHabitLog = (userId: string, logId: string) =>
  deleteHabitLog(userId, logId);

export const cloudAddDailyCheckIn = (userId: string, checkIn: Parameters<typeof addDailyCheckIn>[1]) =>
  addDailyCheckIn(userId, checkIn);

export const cloudDeleteDailyCheckIn = (userId: string, checkInId: string) =>
  deleteDailyCheckIn(userId, checkInId);

export const cloudAddMealTemplate = (userId: string, template: Parameters<typeof addMealTemplate>[1]) =>
  addMealTemplate(userId, template);

export const cloudUpdateMealTemplate = (
  userId: string,
  templateId: string,
  updates: Parameters<typeof updateMealTemplate>[2]
) => updateMealTemplate(userId, templateId, updates);

export const cloudDeleteMealTemplate = (userId: string, templateId: string) =>
  deleteMealTemplate(userId, templateId);
