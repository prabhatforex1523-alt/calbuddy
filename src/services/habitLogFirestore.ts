import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firestore';
import type { HabitLog } from '../types';

const habitLogsCollection = (uid: string) => collection(db, 'users', uid, 'habitLogs');

export const subscribeToHabitLogs = (
  uid: string,
  onData: (logs: HabitLog[]) => void,
  onError: (error: Error) => void
) => {
  const q = query(habitLogsCollection(uid), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((d) => {
        const item = d.data() as Omit<HabitLog, 'id'>;
        return { id: d.id, ...item } as HabitLog;
      });
      onData(logs);
    },
    (error) => {
      onError(error instanceof Error ? error : new Error('Failed to load habit logs.'));
    }
  );
};

export const addHabitLog = async (uid: string, log: Omit<HabitLog, 'id'>): Promise<HabitLog> => {
  const newDoc = doc(habitLogsCollection(uid));
  const docId = newDoc.id;
  await setDoc(newDoc, { ...log, id: docId });
  return { id: docId, ...log };
};

export const deleteHabitLog = async (uid: string, logId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid, 'habitLogs', logId));
};

export const clearHabitLogs = async (uid: string, logIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  logIds.forEach((id) => batch.delete(doc(db, 'users', uid, 'habitLogs', id)));
  await batch.commit();
};
