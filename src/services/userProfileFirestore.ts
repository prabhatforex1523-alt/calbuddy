import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firestore';
import type { UserProfile } from '../types';

const userProfileDoc = (uid: string) => doc(db, 'users', uid, 'profile', 'data');

export const subscribeToUserProfile = (
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError: (error: Error) => void
) => {
  return onSnapshot(
    userProfileDoc(uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const data = snapshot.data() as UserProfile;
      onData({ ...data });
    },
    (error) => {
      onError(error instanceof Error ? error : new Error('Failed to load user profile.'));
    }
  );
};

export const saveUserProfile = async (uid: string, profile: UserProfile): Promise<void> => {
  await setDoc(userProfileDoc(uid), profile, { merge: true });
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  await updateDoc(userProfileDoc(uid), updates as Record<string, unknown>);
};
