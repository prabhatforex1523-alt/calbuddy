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
import type { WaterEntry } from '../types';

const waterEntriesCollection = (uid: string) => collection(db, 'users', uid, 'waterEntries');

export const subscribeToWaterEntries = (
  uid: string,
  onData: (entries: WaterEntry[]) => void,
  onError: (error: Error) => void
) => {
  const q = query(waterEntriesCollection(uid), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((d) => {
        const item = d.data() as Omit<WaterEntry, 'id'>;
        return { id: d.id, ...item } as WaterEntry;
      });
      onData(entries);
    },
    (error) => {
      onError(error instanceof Error ? error : new Error('Failed to load water entries.'));
    }
  );
};

export const addWaterEntry = async (uid: string, entry: Omit<WaterEntry, 'id'>): Promise<WaterEntry> => {
  const newDoc = doc(waterEntriesCollection(uid));
  const docId = newDoc.id;
  await setDoc(newDoc, { ...entry, id: docId });
  return { id: docId, ...entry };
};

export const deleteWaterEntry = async (uid: string, entryId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid, 'waterEntries', entryId));
};

export const clearWaterEntries = async (uid: string, entryIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  entryIds.forEach((id) => batch.delete(doc(db, 'users', uid, 'waterEntries', id)));
  await batch.commit();
};
