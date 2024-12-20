'use server';

import { createSupabaseServerClient } from '@/lib/supabse/server';
import { cookies } from 'next/headers';

export async function logout() {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('로그아웃 중 오류 발생:', error);
    throw new Error('로그아웃 실패');
  }

  // 쿠키 삭제
  cookies().delete('currentUser');
  cookies().delete('sb-access-token');
  cookies().delete('sb-refresh-token');

  // 여기서는 리다이렉트를 하지 않습니다.
  // 리다이렉트는 클라이언트 측에서 처리합니다.
}
