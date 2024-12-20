//app>layout-component>>StoreInitializer.tsx

'use client';

import { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { CurrentUserType } from '../types/types';

export default function StoreInitializer({ currentUser }: { currentUser: CurrentUserType | null }) {
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);

  useEffect(() => {
    setCurrentUser(currentUser);
  }, [currentUser, setCurrentUser]);

  return null;
}
