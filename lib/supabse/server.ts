//lib/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

interface ExtendedCookieMethods {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
  getAll(): { name: string; value: string }[];
  setAll(cookies: { name: string; value: string; options?: CookieOptions }[]): void;
}

// 쿠키 스토어 인스턴스를 캐시
const getCookieStore = cache(() => cookies());

// Supabase 클라이언트 생성을 캐시
export const createSupabaseServerClient = cache(() => {
  const cookieStore = getCookieStore();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          return () => cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          return () => cookieStore.delete({ name, ...options });
        },
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          return () =>
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            );
        },
      } as ExtendedCookieMethods,
    }
  );
});

// userId를 가져오는 함수를 별도로 캐시
const getUserId = cache(() => {
  const cookieStore = getCookieStore();
  const currentUserCookie = cookieStore.get('currentUser');

  if (!currentUserCookie) {
    return null;
  }

  try {
    const cookieData = JSON.parse(currentUserCookie.value);
    return cookieData.id;
  } catch (error) {
    console.error('Error parsing user cookie:', error);
    return null;
  }
});

// 사용자 데이터를 가져오는 함수를 캐시
export const getUser = cache(async () => {
  const userId = await getUserId();
  if (!userId) {
    console.log('No userId found, returning null');
    return null;
  }

  console.log('Found userId from cookie:', userId);

  try {
    const supabase = await createSupabaseServerClient();

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
});
