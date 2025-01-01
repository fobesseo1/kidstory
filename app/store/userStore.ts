// app/store/userStore.ts
import { create } from 'zustand';
import { CurrentUserType } from '../types/types';

type UserStore = {
  currentUser: CurrentUserType | null;
  isInitialized: boolean; // 추가된 부분
  setCurrentUser: (user: CurrentUserType | null) => void;
  initializeStore: () => void; // 추가된 부분
};

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  isInitialized: false, // 추가된 부분
  setCurrentUser: (user) =>
    set({
      currentUser: user,
      isInitialized: true, // 사용자 설정 시 초기화 상태도 업데이트
    }),
  initializeStore: () =>
    set({
      isInitialized: true,
    }),
}));
