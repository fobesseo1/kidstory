// app>diary>page.tsx
'use client';

import { useState } from 'react';
import { processTranscript } from '../basicComponet/voiceRecoder/actions/voiceRecoderAction';
import VoiceRecorder from '../basicComponet/voiceRecoder/VoiceRecorder';

export default function DiaryPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedText, setProcessedText] = useState<string>('');

  const handleTranscript = async (text: string) => {
    try {
      setIsProcessing(true);
      const result = await processTranscript(text);

      if (result.success && result.processedText) {
        setProcessedText(result.processedText);
      } else {
        console.error('처리 중 오류:', result.error);
      }
    } catch (error) {
      console.error('오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">음성 일기</h1>

      <VoiceRecorder
        onTranscript={handleTranscript}
        isProcessing={isProcessing}
        onRecordingStart={() => console.log('녹음 시작')}
        onRecordingEnd={() => console.log('녹음 종료')}
      />

      {processedText && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-2">변환된 텍스트:</h2>
          <p>{processedText}</p>
        </div>
      )}
    </div>
  );
}
