//app/auth/components/OAuthForm_Github.tsx

'use client';

import { createBrowserClient } from '@supabase/ssr';
import React, { useCallback } from 'react';
import { FaGithub } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

export default function GithubButton() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loginWithGithub = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }, [supabase.auth]);

  return (
    <Button onClick={loginWithGithub} className="w-full flex gap-2">
      <FaGithub size="1.6rem" fill="#eee" />
      Sign in with GitHub
    </Button>
  );
}
