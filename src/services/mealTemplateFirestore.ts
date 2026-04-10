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
import type { MealTemplate } from '../types';

const mealTemplatesCollection = (uid: string) => collection(db, 'users', uid, 'mealTemplates');

export const subscribeToMealTemplates = (
  uid: string,
  onData: (templates: MealTemplate[]) => void,
  onError: (error: Error) => void
) => {
  const q = query(mealTemplatesCollection(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const templates = snapshot.docs.map((d) => {
        const item = d.data() as Omit<MealTemplate, 'id'>;
        return { id: d.id, ...item } as MealTemplate;
      });
      onData(templates);
    },
    (error) => {
      onError(error instanceof Error ? error : new Error('Failed to load meal templates.'));
    }
  );
};

export const addMealTemplate = async (uid: string, template: Omit<MealTemplate, 'id'>): Promise<MealTemplate> => {
  const newDoc = doc(mealTemplatesCollection(uid));
  const docId = newDoc.id;
  await setDoc(newDoc, { ...template, id: docId });
  return { id: docId, ...template };
};

export const updateMealTemplate = async (
  uid: string,
  templateId: string,
  updates: Partial<MealTemplate>
): Promise<void> => {
  await setDoc(doc(db, 'users', uid, 'mealTemplates', templateId), updates, { merge: true });
};

export const deleteMealTemplate = async (uid: string, templateId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid, 'mealTemplates', templateId));
};

export const clearMealTemplates = async (uid: string, templateIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  templateIds.forEach((id) => batch.delete(doc(db, 'users', uid, 'mealTemplates', id)));
  await batch.commit();
};
