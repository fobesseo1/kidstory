//app/auth/callback/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { type CookieOptions, createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      // 세션 데이터를 쿠키에 저장
      cookieStore.set('access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: data.session.expires_in,
        path: '/',
      });

      // userdata 테이블의 사용자 정보 업데이트 또는 삽입
      const { data: existingUser, error: selectError } = await supabase
        .from('userdata')
        .select('id')
        .eq('id', data.session.user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking existing user:', selectError);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

      const userData = {
        id: data.session.user.id,
        email: data.session.user.email,
        username:
          data.session.user.user_metadata.full_name || data.session.user.email?.split('@')[0],
        user_type: 'regular', // 기본값 설정, 필요에 따라 변경
        avatar_url: data.session.user.user_metadata.avatar_url,
        // 추가 필드가 있다면 여기에 포함시키세요
      };

      let upsertError;
      if (existingUser) {
        // 사용자가 이미 존재하면 업데이트
        const { error } = await supabase
          .from('userdata')
          .update(userData)
          .eq('id', data.session.user.id);
        upsertError = error;
      } else {
        // 사용자가 존재하지 않으면 삽입
        const { error } = await supabase.from('userdata').insert(userData);
        upsertError = error;
      }

      if (upsertError) {
        console.error('Error upserting user data:', upsertError);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

      // 사용자 데이터를 쿠키에 저장
      cookieStore.set('currentUser', JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
