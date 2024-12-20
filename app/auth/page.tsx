//app>auth>page.tsx

import React from 'react';
import Image from 'next/image';
import { AuthForm } from './components/AuthForm';
import SignOut from './components/SignOut';
import { Sparkles } from 'lucide-react';
import { getUser } from '@/lib/supabse/server';
import { Card, CardContent } from '@/components/ui/card';
import { CurrentUserType } from '../types/types';

const AvatarImage = ({ user }: { user: CurrentUserType }) => {
  if (user.avatar_url) {
    return (
      <div
        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden 
        ring-4 ring-brand-100 ring-offset-2"
      >
        <Image
          src={user.avatar_url}
          alt={`${user.username}'s avatar`}
          width={160}
          height={160}
          className="object-cover w-full h-full"
          priority
        />
      </div>
    );
  } else {
    return (
      <div
        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full 
        bg-gradient-to-br from-brand-100 to-pastel-100 
        flex items-center justify-center
        ring-4 ring-brand-100 ring-offset-2"
      >
        <Sparkles className="w-16 h-16 text-brand-400" />
      </div>
    );
  }
};

export default async function AuthPage() {
  const currentUser: CurrentUserType | null = await getUser();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto space-y-8">
        {/* 로고 */}
        <div className="flex justify-center">
          <div className="relative w-48 h-12 sm:w-56 sm:h-14">
            <Image src="/logo-wissome.svg" alt="Wissome" fill className="object-contain" priority />
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <Card className="border-brand-100">
          <CardContent className="pt-8 pb-6">
            {currentUser ? (
              <div className="flex flex-col items-center gap-6">
                <AvatarImage user={currentUser} />
                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-gradient-brand">
                    {currentUser.username}님 안녕하세요
                  </h2>
                  <p className="text-sm text-gray-500">오늘도 특별한 하루 되세요</p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2 mb-8">
                  <h1 className="text-2xl font-bold text-gradient-brand">환영합니다</h1>
                  <p className="text-sm text-gray-500">
                    당신만의 특별한 공간으로
                    <br />
                    초대합니다
                  </p>
                </div>
                <AuthForm />
              </>
            )}
          </CardContent>
        </Card>

        {/* 로그아웃 버튼 */}
        <div className="flex justify-center">
          <SignOut />
        </div>
      </div>
    </div>
  );
}
