'use server';

import { createSupabaseServerClient } from '@/lib/supabse/server';
import { cookies } from 'next/headers';

export async function confirmUser(userId: string) {
  try {
    const supabase = createSupabaseServerClient();

    // 사용자 메타데이터 가져오기
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      throw new Error('사용자 정보를 가져오는데 실패했습니다');
    }

    const userMetadata = userData.user.user_metadata;

    // userdata 테이블에 사용자 정보 삽입
    const { error: userDataError } = await supabase.from('userdata').insert({
      id: userId,
      email: userData.user.email,
      user_type: userMetadata.user_type,
    });

    if (userDataError) {
      throw new Error('userdata 테이블 삽입 실패');
    }

    // 파트너 사용자인 경우 partner_info 테이블에 정보 삽입
    if (userMetadata.user_type === 'partner') {
      const { error: partnerInfoError } = await supabase.from('partner_info').insert({
        user_id: userId,
        category: userMetadata.category,
        description: userMetadata.description,
      });

      if (partnerInfoError) {
        throw new Error('partner_info 테이블 삽입 실패');
      }
    }

    return { success: true };
  } catch (error) {
    console.error('확인 처리 중 오류:', error);
    return { error: '서버 오류가 발생했습니다.' };
  }
}
