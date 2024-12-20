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
  const isRecordingRef = useRef<boolean>(false);

  // 모바일 감지
  const isMobile =
    typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const startTimer = useCallback(() => {
    stopTimer();
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

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      const audioBlob = new Blob(audioChunksRef.current, {
        type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      onRecordingEnd?.(audioBlob);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    stopTimer();
  }, [onRecordingEnd, stopTimer]);

  const startRecording = useCallback(async () => {
    try {
      if (!recognitionRef.current) {
        throw new Error('음성 인식이 초기화되지 않았습니다.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      isRecordingRef.current = true;

      // MediaRecorder 설정
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000);
      recognitionRef.current.start();
    } catch (error: any) {
      console.error('Recording start error:', error);
      setError(error.message || '음성 인식을 시작할 수 없습니다.');
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';

    if (isMobile) {
      recognition.continuous = false;
      recognition.interimResults = false;
    } else {
      recognition.continuous = true;
      recognition.interimResults = true;
    }

    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('음성 인식 시작');
      setIsRecording(true);
      setError('');
      startTimer();
      onRecordingStart?.();
    };

    recognition.onend = () => {
      console.log('음성 인식 종료');
      if (isRecordingRef.current) {
        if (isMobile) {
          setTimeout(() => {
            if (isRecordingRef.current) {
              try {
                recognition.start();
                console.log('모바일 음성 인식 재시작');
              } catch (err) {
                console.error('재시작 실패:', err);
              }
            }
          }, 100);
        } else {
          recognition.start();
        }
      }
    };

    recognition.onresult = (event: any) => {
      console.log('음성 인식 결과 받음', event.results);

      if (isMobile) {
        const transcript = event.results[0][0].transcript;
        console.log('모바일 음성 인식 결과:', transcript);
        onTranscript(transcript.trim());
      } else {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            console.log('PC 음성 인식 결과:', transcript);
            onTranscript(transcript.trim());
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('음성 인식 에러:', event.error);

      if (event.error === 'no-speech') {
        return;
      }

      let errorMessage = '음성 인식 중 오류가 발생했습니다.';
      if (event.error === 'not-allowed') {
        errorMessage = '마이크 접근 권한이 필요합니다.';
      } else if (event.error === 'audio-capture') {
        errorMessage = '마이크를 찾을 수 없습니다.';
      }

      setError(errorMessage);
      setIsRecording(false);
      isRecordingRef.current = false;
      stopTimer();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isMobile, onRecordingStart, onTranscript]);

  const handleClick = async () => {
    if (isProcessing) return;

    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      stopTimer();
    };
  }, [stopTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VoiceRecorder;
