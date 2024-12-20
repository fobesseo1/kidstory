'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import createSupabaseBrowserClient from '@/lib/supabse/client';

export default function ConfirmEmail() {
  const router = useRouter();
  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    description: string;
    variant: 'default' | 'destructive';
  } | null>(null);
  const supabase = createSupabaseBrowserClient();

  const handleEmailConfirmation = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session) {
        setAlertInfo({
          title: '이메일 확인 성공',
          description: '이메일이 성공적으로 확인되었습니다. 잠시 후 메인 페이지로 이동합니다.',
          variant: 'default',
        });

        setTimeout(() => router.push('/'), 3000);
      } else {
        throw new Error('세션을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('확인 처리 중 오류:', error);
      setAlertInfo({
        title: '이메일 확인 실패',
        description: '이메일 확인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
        variant: 'destructive',
      });
    }
  }, [router, supabase.auth]);

  useEffect(() => {
    handleEmailConfirmation();
  }, [handleEmailConfirmation]);

  return (
    <div className="container mx-auto mt-8">
      {alertInfo && (
        <Alert variant={alertInfo.variant}>
          <AlertTitle>{alertInfo.title}</AlertTitle>
          <AlertDescription>{alertInfo.description}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
