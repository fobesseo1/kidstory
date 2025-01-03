

'use client';

import { useState, useRef } from 'react';
// import { processTranscript } from '../basicComponet/voiceRecoder/actions/voiceRecoderAction';
import VoiceRecorder from '../basicComponet/voiceRecoder/VoiceRecorder';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUserStore } from '../store/userStore';

export default function DiaryPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const transcriptsRef = useRef<string[]>([]); // ref 추가

  const currentUser = useUserStore((state) => state.currentUser);
  console.log('currentUser', currentUser);

  const handleTranscript = (text: string) => {
    console.log('새로운 텍스트 수신:', text);
    // state와 ref 모두 업데이트
    setTranscripts((prev) => [...prev, text]);
    transcriptsRef.current = [...transcriptsRef.current, text];
  };

  const handleRecordingStart = () => {
    console.log('녹음 시작');
    // 녹음 시작할 때 초기화
    setTranscripts([]);
    transcriptsRef.current = [];
  };

  const handleRecordingEnd = async (audioBlob: Blob | null) => {
    console.log('handleRecordingEnd 호출됨', {
      hasAudio: !!audioBlob,
      transcriptsLength: transcriptsRef.current.length,
      isLoggedIn: !!currentUser?.id,
    });

    if (!audioBlob || transcriptsRef.current.length === 0) {
      console.log('오디오나 텍스트가 없어서 저장 취소');
      return;
    }

    try {
      setIsProcessing(true);

      const now = new Date();
      const fileName = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(
        now.getMinutes()
      ).padStart(2, '0')}.mp3`;

      // localStorage에 content 저장
      const fullText = transcriptsRef.current.join(' ');
      localStorage.setItem(`content_${fileName}`, fullText);
      console.log('localStorage content 저장 성공:', fileName);

      // localStorage에 mp3 저장
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = () => {
        try {
          const base64data = reader.result as string;
          localStorage.setItem(`audio_${fileName}`, base64data);
          console.log('localStorage 오디오 저장 성공:', fileName);
        } catch (error) {
          console.error('localStorage 오디오 저장 실패:', error);
        }
      };

      // API 호출을 위한 FormData 생성
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('text', fullText);
      formData.append('fileName', fileName);
      if (currentUser?.id) {
        formData.append('userId', currentUser.id);
      }

      // API 호출
      const response = await fetch('/api/upload/voice', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('API 응답:', result);

      if (result.success) {
        console.log('전체 저장 완료');
        setTranscripts([]);
        transcriptsRef.current = [];
      }
    } catch (error) {
      console.error('저장 중 에러:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <p>currentUser: {currentUser?.id}</p>
      <h1 className="text-2xl font-bold mb-4">음성 일기</h1>

      <VoiceRecorder
        onTranscript={handleTranscript}
        onRecordingStart={handleRecordingStart}
        onRecordingEnd={handleRecordingEnd}
        isProcessing={isProcessing}
      />

      <Link href="/diary/storage">
        <Button>Storage</Button>
      </Link>

      {transcripts.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-2">변환된 텍스트:</h2>
          <div className="space-y-2">
            {transcripts.map((text, index) => (
              <p key={index} className="text-gray-700">
                {text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
