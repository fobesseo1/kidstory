// lib/actions/auth.ts
'use server';

import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '../supabse/server';

export async function getCurrentUser() {
  const cookieStore = cookies();
  let userId = null;

  // 쿠키에서 사용자 ID 확인
  const currentUserCookie = cookieStore.get('currentUser');
  if (currentUserCookie) {
    try {
      const cookieData = JSON.parse(currentUserCookie.value);
      userId = cookieData.id;
    } catch (error) {
      console.error('Error parsing user cookie:', error);
    }
  }

  // userId가 있을 때만 Supabase 클라이언트 생성 및 데이터베이스 조회
  if (userId) {
    const supabase = await createSupabaseServerClient();
    try {
      const { data: userData, error: dataError } = await supabase
        .from('userdata')
        .select('*')
        .eq('id', userId)
        .single();

      if (dataError) {
        console.error('Database query error:', dataError);
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Unexpected error querying database:', error);
      return null;
    }
  }

  // userId가 없으면 (로그인하지 않은 사용자) null 반환
  return null;
}

// 새로운 서버 액션: 쿠키 업데이트
export async function updateUserCookie(userData: any) {
  'use server';

  const cookieStore = cookies();
  cookieStore.set('currentUser', JSON.stringify(userData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}
