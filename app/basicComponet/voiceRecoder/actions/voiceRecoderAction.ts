// app>basicComponet>voiceRecoder>actions>voiceRecoderAction.ts
'use server';

export async function processTranscript(transcript: string) {
  try {
    // 여기에서 음성 텍스트 처리 로직 구현
    // 예: DB 저장, AI 처리 등
    return {
      success: true,
      processedText: transcript,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}
