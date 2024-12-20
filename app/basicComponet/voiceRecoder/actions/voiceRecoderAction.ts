'use server';

import { createSupabaseServerClient } from '@/lib/supabse/server';

export async function processTranscript(
  transcript: string,
  audioData: number[] | null, // null 허용
  fileName: string,
  userId?: string // optional로 변경
) {
  console.log('서버 액션 시작:', {
    transcriptLength: transcript?.length,
    hasAudioData: !!audioData,
    fileName,
    hasUserId: !!userId,
  });

  try {
    const supabase = await createSupabaseServerClient();
    let audioUrl = null;

    // 회원이고 오디오 데이터가 있는 경우만 Storage에 저장
    if (userId && audioData?.length) {
      const uint8Array = new Uint8Array(audioData);
      const filePath = `${userId}/${fileName}`;

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('diary-audio')
          .upload(filePath, uint8Array, {
            contentType: 'audio/mp3',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('diary-audio').getPublicUrl(uploadData?.path || '');

        audioUrl = publicUrl;
        console.log('오디오 URL 생성됨:', audioUrl);
      } catch (storageError) {
        console.error('Storage 처리 중 에러:', storageError);
        // Storage 저장 실패해도 계속 진행
      }
    }

    // DB에 저장 (모든 경우)
    const { data, error: insertError } = await supabase
      .from('diary_entries')
      .insert([
        {
          content: transcript,
          audio_url: audioUrl, // 회원인 경우만 URL 있음
          user_id: userId, // 회원인 경우만 ID 있음
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (insertError) throw insertError;

    return { success: true, processedText: transcript, audioUrl, data };
  } catch (error) {
    console.error('서버 액션 에러:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}
