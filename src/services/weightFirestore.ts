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
import type { WeightEntry } from '../types';

const weightEntriesCollection = (uid: string) => collection(db, 'users', uid, 'weightEntries');

export const subscribeToWeightEntries = (
  uid: string,
  onData: (entries: WeightEntry[]) => void,
  onError: (error: Error) => void
) => {
  const q = query(weightEntriesCollection(uid), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((d) => {
        const item = d.data() as Omit<WeightEntry, 'id'>;
        return { id: d.id, ...item } as WeightEntry;
      });
      onData(entries);
    },
    (error) => {
      onError(error instanceof Error ? error : new Error('Failed to load weight entries.'));
    }
  );
};

export const addWeightEntry = async (uid: string, entry: Omit<WeightEntry, 'id'>): Promise<WeightEntry> => {
  const newDoc = doc(weightEntriesCollection(uid));
  const docId = newDoc.id;
  await setDoc(newDoc, { ...entry, id: docId });
  return { id: docId, ...entry };
};

export const deleteWeightEntry = async (uid: string, entryId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid, 'weightEntries', entryId));
};

export const clearWeightEntries = async (uid: string, entryIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  entryIds.forEach((id) => batch.delete(doc(db, 'users', uid, 'weightEntries', id)));
  await batch.commit();
};
