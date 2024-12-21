'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, VolumeX } from 'lucide-react';

interface ChatMessage {
  id: number;
  type: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const VoiceChat: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const audioContext = useRef<AudioContext | null>(null);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // AudioContext 초기화
    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContext.current?.close();
    };
  }, []);

  const transcribeAudio = async (blob: Blob): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.mp3');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      return data.text;
    } catch (err) {
      console.error('Transcription error:', err);
      throw err;
    }
  };

  const getGPTResponse = async (text: string): Promise<string> => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                '당신은 친절하고 도움이 되는 AI 어시스턴트입니다. 짧고 자연스러운 대화체로 응답해주세요.',
            },
            {
              role: 'user',
              content: text,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get GPT response');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.error('GPT error:', err);
      throw err;
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'shimmer',
        }),
      });

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }

      const audio = new Audio(audioUrl);
      currentAudio.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
      setError('음성 변환에 실패했습니다.');
    }
  };

  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const options = {
        mimeType: 'audio/webm',
      };

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const blob = new Blob(chunks, { type: 'audio/mp3' });

          // 음성을 텍스트로 변환
          const transcribedText = await transcribeAudio(blob);

          // 사용자 메시지 추가
          const userMessage: ChatMessage = {
            id: Date.now(),
            type: 'user',
            text: transcribedText,
            timestamp: new Date().toLocaleString(),
          };
          setMessages((prev) => [...prev, userMessage]);

          // GPT 응답 받기
          const gptResponse = await getGPTResponse(transcribedText);

          // 어시스턴트 메시지 추가
          const assistantMessage: ChatMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            text: gptResponse,
            timestamp: new Date().toLocaleString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // TTS로 응답 읽기
          await speakText(gptResponse);
        } catch (err) {
          console.error('Processing error:', err);
          setError('처리 중 오류가 발생했습니다.');
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks([]);
      setError('');
    } catch (err) {
      setError('마이크 접근 권한이 필요합니다.');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setIsRecording(false);
    }
  };

  const stopSpeaking = () => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
      setIsSpeaking(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full disabled:opacity-50"
              type="button"
              disabled={isProcessing || isSpeaking}
            >
              <Mic className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full"
              type="button"
            >
              <Square className="w-6 h-6" />
            </button>
          )}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full"
              type="button"
            >
              <VolumeX className="w-6 h-6" />
            </button>
          )}
        </div>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        {isProcessing && <p className="text-blue-500 text-center mt-2">처리 중...</p>}
      </div>

      <div className="space-y-4">
        {messages
          .map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.type === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">{message.type === 'user' ? '나' : 'AI'}</p>
              <p className="text-gray-800">{message.text}</p>
              <p className="text-xs text-gray-500 mt-1">{message.timestamp}</p>
            </div>
          ))
          .reverse()}
      </div>
    </div>
  );
};

export default VoiceChat;
