//app>auth>components>page.tsx

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { AiOutlineLoading3Quarters, AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { signInWithEmailAndPassword } from '../actions';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, {
    message: 'Password is required.',
  }),
});

export default function SignInForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<'default' | 'destructive'>('default');

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      //console.log('Submitting form with data:', data); // 폼 제출 데이터 로그
      const result = await signInWithEmailAndPassword(data);

      //console.log('Login result:', result); // 로그인 결과 상세 로그

      if (!result.success) {
        setAlertTitle('Error');
        setAlertMessage(result.message);
        setAlertVariant('destructive');
        console.error('Login failed:', result.message); // 에러 로그
      } else {
        setAlertTitle('Success');
        setAlertMessage('로그인 성공');
        setAlertVariant('default');
        console.log('Login successful, refreshing page'); // 성공 로그
        router.refresh(); // 페이지를 새로고침하여 세션 상태를 반영

        setTimeout(() => {
          console.log('Redirecting to home page'); // 리디렉션 로그
          router.push('/'); // 0.3초 후에 루트 경로로 리디렉션
        }, 500);
      }
    });
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input
                    placeholder="example@gmail.com"
                    {...field}
                    type="email"
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="password"
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      onChange={field.onChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full flex gap-2">
            로그인
            <AiOutlineLoading3Quarters className={cn('animate-spin', { hidden: !isPending })} />
          </Button>
        </form>
      </Form>

      {alertMessage && (
        <Alert className="mt-4" variant={alertVariant}>
          <AlertTitle>{alertTitle}</AlertTitle>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
