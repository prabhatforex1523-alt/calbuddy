import { format } from 'date-fns';

import type { HealthData } from '../types';
import { migrateStoredData } from './appData';

export const BACKUP_VERSION = 2;

export type AppBackupPayload = {
  exportedAt: string;
  version: number;
  data: HealthData;
};

export const createBackupPayload = (
  data: HealthData,
  now: Date = new Date()
): AppBackupPayload => ({
  exportedAt: now.toISOString(),
  version: BACKUP_VERSION,
  data,
});

export const getBackupFilename = (date: Date = new Date()) =>
  `calsnap-backup-${format(date, 'yyyy-MM-dd')}.json`;

export const serializeBackupPayload = (payload: AppBackupPayload) =>
  JSON.stringify(payload, null, 2);

export const parseBackupText = (text: string) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid backup file: could not parse JSON.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup file: unexpected format.');
  }
  const obj = parsed as Record<string, unknown>;
  return migrateStoredData(obj?.data ?? obj);
};
