'use client';

import { Button } from '@/components/ui/button';
import { logout } from '../actions/logoutAction';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function SignOut() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  return (
    <div className="w-full flex justify-end -mt-4 mb-12">
      <Button variant="outline" className="w-1/3" onClick={handleLogout}>
        <LogOut size={24} className="text-gray-600" />
        &nbsp;로그아웃
      </Button>
    </div>
  );
}
