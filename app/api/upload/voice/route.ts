import { createSupabaseServerClient } from '@/lib/supabse/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;
    const transcript = formData.get('text') as string;
    const fileName = formData.get('fileName') as string;
    const userId = formData.get('userId') as string;

    console.log('API Route 시작:', {
      hasTranscript: !!transcript,
      hasAudio: !!audioBlob,
      fileName,
      hasUserId: !!userId,
    });

    const supabase = await createSupabaseServerClient();
    let audioUrl = null;

    // 회원이고 오디오가 있는 경우만 Storage에 저장
    if (userId && audioBlob) {
      const filePath = `${userId}/${fileName}`;

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('diary-audio')
          .upload(filePath, audioBlob, {
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
      }
    }

    // DB에 저장 (모든 경우)
    const { data, error: insertError } = await supabase
      .from('diary_entries')
      .insert([
        {
          content: transcript,
          audio_url: audioUrl,
          user_id: userId || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (insertError) throw insertError;

    return Response.json({
      success: true,
      processedText: transcript,
      audioUrl,
      data,
    });
  } catch (error) {
    console.error('API Route 에러:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
