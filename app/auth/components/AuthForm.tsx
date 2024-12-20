'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

// 지연 로딩 구현
const SignInForm = dynamic(() => import('./SignInForm'), {
  loading: () => <p>Login is loading...</p>,
});
const RegisterForm = dynamic(() => import('./RegisterForm'), {
  loading: () => <p>SignUp is loading...</p>,
});
const GoogleButton = dynamic(() => import('./OAuthForm_Google'), {
  loading: () => <p>Google Login is loading...</p>,
});
const GithubButton = dynamic(() => import('./OAuthForm_Github'), {
  loading: () => <p>Github Login is loading...</p>,
});
const KakaoButton = dynamic(() => import('./OAuthForm_Kakao'), {
  loading: () => <p>Kakao Login is loading...</p>,
});

export function AuthForm() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (success) {
      setMessage({ type: 'success', content: decodeURIComponent(success) });
    } else if (errorParam) {
      setMessage({ type: 'error', content: decodeURIComponent(errorParam) });
    }
  }, [searchParams]);

  // 메모이제이션 사용
  const memoizedGoogleButton = useMemo(() => <GoogleButton />, []);
  const memoizedGithubButton = useMemo(() => <GithubButton />, []);
  const memoizedKakaoButton = useMemo(() => <KakaoButton />, []);

  return (
    <div className="w-full space-y-6">
      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>{message.type === 'success' ? '성공' : '오류'}</AlertTitle>
          <AlertDescription>{message.content}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="signin" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">로그인</TabsTrigger>
          <TabsTrigger value="register">회원가입</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <SignInForm />
        </TabsContent>
        <TabsContent value="register">
          <RegisterForm />
        </TabsContent>
      </Tabs>
      <hr />
      <div className="flex flex-col gap-4">
        {memoizedGoogleButton}
        {memoizedGithubButton}
        {memoizedKakaoButton}
      </div>
    </div>
  );
}
