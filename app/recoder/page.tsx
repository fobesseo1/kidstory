'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Square, Play, Save } from 'lucide-react';

interface Recording {
  id: number;
  url: string;
  date: string;
}

const VoiceRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadRecordings = () => {
      const saved = localStorage.getItem('recordings');
      if (saved) {
        try {
          const parsedRecordings: Recording[] = JSON.parse(saved);
          setRecordings(parsedRecordings);
        } catch (err) {
          console.error('Failed to parse recordings:', err);
          localStorage.removeItem('recordings');
        }
      }
    };
    loadRecordings();
  }, []);

  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const newRecording: Recording = {
          id: Date.now(),
          url,
          date: new Date().toLocaleString(),
        };

        const updatedRecordings = [...recordings, newRecording];
        setRecordings(updatedRecordings);

        try {
          localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
        } catch (err) {
          console.error('Failed to save recordings:', err);
          setError('녹음 저장에 실패했습니다.');
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks([]);
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

  const playRecording = (url: string): void => {
    const audio = new Audio(url);
    audio.play().catch((err) => {
      console.error('Failed to play recording:', err);
      setError('재생에 실패했습니다.');
    });
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full"
              type="button"
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
        </div>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      </div>

      <div className="space-y-4">
        {recordings
          .map((recording: Recording) => (
            <div
              key={recording.id}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
            >
              <span className="text-sm text-gray-600">{recording.date}</span>
              <button
                onClick={() => playRecording(recording.url)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                type="button"
              >
                <Play className="w-4 h-4" />
              </button>
            </div>
          ))
          .reverse()}
      </div>
    </div>
  );
};

export default VoiceRecorder;
