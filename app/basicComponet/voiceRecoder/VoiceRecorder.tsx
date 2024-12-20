'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingEnd?: () => void;
  buttonLabel?: string;
  isProcessing?: boolean;
}

const VoiceRecorder = ({
  onTranscript,
  onRecordingStart,
  onRecordingEnd,
  buttonLabel = '말하기',
  isProcessing = false,
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string>('');

  const startRecording = useCallback(async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
        return;
      }

      // 마이크 권한 요청
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        setError('마이크 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setError('');
        onRecordingStart?.();
      };

      recognition.onend = () => {
        setIsRecording(false);
        onRecordingEnd?.();
      };

      recognition.onresult = (event: any) => {
        if (event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);

        switch (event.error) {
          case 'no-speech':
            setError('음성이 감지되지 않았습니다. 다시 시도해주세요.');
            break;
          case 'audio-capture':
            setError('마이크를 찾을 수 없습니다.');
            break;
          case 'not-allowed':
            setError('마이크 권한이 거부되었습니다.');
            break;
          default:
            setError('음성 인식 중 오류가 발생했습니다.');
        }
      };

      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setError('음성 인식을 시작할 수 없습니다.');
    }
  }, [onRecordingStart, onRecordingEnd, onTranscript]);

  const stopRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.stop();
    setIsRecording(false);
  }, []);

  const handleClick = async () => {
    if (isProcessing) return;

    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);

  return (
    <div className="space-y-4">
      <Button
        onClick={handleClick}
        disabled={isProcessing}
        variant={isRecording ? 'destructive' : 'default'}
        className="gap-2"
      >
        {isRecording ? (
          <>
            <Square className="h-4 w-4" />
            녹음 중지
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            {buttonLabel}
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <Settings className="h-4 w-4" />
          <AlertTitle>오류 발생</AlertTitle>
          <AlertDescription>
            {error}
            {error.includes('마이크 권한') && isAndroid && (
              <div className="mt-2 text-sm">
                <p className="font-semibold">안드로이드 설정 방법:</p>
                <ol className="list-decimal list-inside mt-1">
                  <li>Chrome 주소창 왼쪽의 자물쇠(🔒) 아이콘을 탭하세요</li>
                  <li>사이트 설정을 선택하세요</li>
                  <li>마이크 권한을 '허용'으로 변경해주세요</li>
                  <li>페이지를 새로고침하세요</li>
                </ol>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VoiceRecorder;
