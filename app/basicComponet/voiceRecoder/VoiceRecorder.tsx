'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Settings, Timer } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingEnd?: (audioBlob: Blob | null) => void;
  buttonLabel?: string;
  isProcessing?: boolean;
  maxDuration?: number;
}

const VoiceRecorder = ({
  onTranscript,
  onRecordingStart,
  onRecordingEnd,
  buttonLabel = '말하기',
  isProcessing = false,
  maxDuration = 180,
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= maxDuration) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, [maxDuration]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopRecording = useCallback(() => {
    console.log('녹음 중지 시작');
    setIsRecording(false);

    // MediaRecorder 중지
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('MediaRecorder 상태:', mediaRecorderRef.current.state);
      try {
        // 마지막 데이터 조각 요청
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder 중지 요청됨');
      } catch (error) {
        console.error('MediaRecorder 중지 에러:', error);
      }
    }

    // Recognition 중지
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // 스트림 트랙 중지
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('오디오 트랙 중지됨');
      });
    }

    stopTimer();
  }, [stopTimer]);

  const startRecording = useCallback(async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
        return;
      }

      // 마이크 스트림 설정
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        console.log('스트림 얻기 성공');

        // MediaRecorder 설정
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        // 데이터 수집 이벤트
        mediaRecorder.ondataavailable = (event) => {
          console.log('데이터 수집:', event.data.size);
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        // 녹음 중지 이벤트
        mediaRecorder.onstop = () => {
          console.log('MediaRecorder 중지됨');
          console.log('수집된 청크 수:', audioChunksRef.current.length);

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          console.log('Blob 생성됨:', audioBlob.size);

          onRecordingEnd?.(audioBlob);
        };

        // 시작할 때 데이터 수집 간격 설정 (100ms)
        mediaRecorder.start(100);
        console.log('MediaRecorder 시작됨');
      } catch (error) {
        console.error('마이크 설정 에러:', error);
        setError('마이크 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.');
        return;
      }

      // Speech Recognition 설정
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setError('');
        startTimer();
        onRecordingStart?.();
      };

      recognition.onend = () => {
        if (isRecording) {
          recognition.start();
        }
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            onTranscript(transcript.trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') return;

        setIsRecording(false);
        stopTimer();

        switch (event.error) {
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

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setError('음성 인식을 시작할 수 없습니다.');
    }
  }, [onRecordingStart, onRecordingEnd, onTranscript, startTimer, isRecording]);

  const handleClick = async () => {
    if (isProcessing) return;

    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      stopTimer();
    };
  }, [stopTimer]);

  const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
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
        {isRecording && (
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            <span>
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </span>
          </div>
        )}
      </div>

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
