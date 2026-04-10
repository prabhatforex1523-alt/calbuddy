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
import type { DailyCheckIn } from '../types';

const dailyCheckInsCollection = (uid: string) => collection(db, 'users', uid, 'dailyCheckIns');

export const subscribeToDailyCheckIns = (
  uid: string,
  onData: (checkIns: DailyCheckIn[]) => void,
  onError: (error: Error) => void
) => {
  const q = query(dailyCheckInsCollection(uid), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const checkIns = snapshot.docs.map((d) => {
        const item = d.data() as Omit<DailyCheckIn, 'id'>;
        return { id: d.id, ...item } as DailyCheckIn;
      });
      onData(checkIns);
    },
    (error) => {
      onError(error instanceof Error ? error : new Error('Failed to load daily check-ins.'));
    }
  );
};

export const addDailyCheckIn = async (uid: string, checkIn: Omit<DailyCheckIn, 'id'>): Promise<DailyCheckIn> => {
  const newDoc = doc(dailyCheckInsCollection(uid));
  const docId = newDoc.id;
  await setDoc(newDoc, { ...checkIn, id: docId });
  return { id: docId, ...checkIn };
};

export const deleteDailyCheckIn = async (uid: string, checkInId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid, 'dailyCheckIns', checkInId));
};

export const clearDailyCheckIns = async (uid: string, checkInIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  checkInIds.forEach((id) => batch.delete(doc(db, 'users', uid, 'dailyCheckIns', id)));
  await batch.commit();
};
