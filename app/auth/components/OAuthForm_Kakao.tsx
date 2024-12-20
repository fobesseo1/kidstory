'use client';

import { createBrowserClient } from '@supabase/ssr';
import React, { useCallback } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { Button } from '@/components/ui/button';

export default function KakaoButton() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loginWithKakao = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }, [supabase.auth]);

  return (
    <Button onClick={loginWithKakao} className="w-full flex gap-2 bg-yellow-400 text-gray-600">
      <RiKakaoTalkFill size="24" fill="#333" />
      Sign in with Kakao
    </Button>
  );
}
