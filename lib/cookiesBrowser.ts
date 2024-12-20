'use server';

import { getCurrentUser } from '@/lib/cookies';

export async function getcurrentUserBrowserFromCookie() {
  return await getCurrentUser();
}
