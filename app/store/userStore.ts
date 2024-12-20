// app/store/userStore.ts

import { create } from 'zustand';
import { CurrentUserType } from '../types/types';

type UserStore = {
  currentUser: CurrentUserType | null;
  setCurrentUser: (user: CurrentUserType | null) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}));
