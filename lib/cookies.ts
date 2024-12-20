//lib>>utils>cookies.ts

import { CurrentUserType } from '@/app/types/types';
import { getCurrentUser } from './actions/auth';

export { getCurrentUser };

let cachedUserInfo: (Partial<CurrentUserType> & { id: string }) | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1시간

export async function getCurrentUserInfo(): Promise<
  (Partial<CurrentUserType> & { id: string }) | null
> {
  const currentTime = Date.now();

  if (cachedUserInfo && currentTime - lastFetchTime < CACHE_DURATION) {
    return cachedUserInfo;
  }

  const currentUser = await getCurrentUser();

  if (!currentUser || !currentUser.id) {
    cachedUserInfo = null;
  } else {
    cachedUserInfo = {
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      avatar_url: currentUser.avatar_url,
    };
  }

  lastFetchTime = currentTime;
  return cachedUserInfo;
}
