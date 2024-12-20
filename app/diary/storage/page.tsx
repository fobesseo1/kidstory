'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioFile {
  key: string;
  date: string;
  time: string;
}

export default function StoragePage() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // localStorage에서 오디오 파일 목록 가져오기
    const files: AudioFile[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('audio_')) {
        // 파일명 형식: audio_YYYYMMDD_HHMM
        const dateStr = key.slice(6, 14); // YYYYMMDD
        const timeStr = key.slice(15, 19); // HHMM

        // 날짜 형식화
        const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        const time = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;

        files.push({ key, date, time });
      }
    }

    // 날짜순으로 정렬
    files.sort((a, b) => b.key.localeCompare(a.key));
    setAudioFiles(files);
  }, []);

  const playAudio = (key: string) => {
    try {
      const audioData = localStorage.getItem(key);
      if (!audioData) {
        console.error('오디오 데이터를 찾을 수 없습니다.');
        return;
      }

      // 현재 재생 중인 오디오가 있다면 중지
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // 새로운 오디오 재생
      const audio = new Audio(audioData);
      audioRef.current = audio;
      audio.play();
      setCurrentlyPlaying(key);

      // 재생 완료 시 상태 초기화
      audio.onended = () => {
        setCurrentlyPlaying(null);
      };
    } catch (error) {
      console.error('오디오 재생 중 에러:', error);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setCurrentlyPlaying(null);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">녹음된 음성 목록</h1>

      <div className="space-y-4">
        {audioFiles.length === 0 ? (
          <p className="text-gray-500">저장된 음성 파일이 없습니다.</p>
        ) : (
          audioFiles.map((file) => (
            <div
              key={file.key}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <Volume2 className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{file.date}</p>
                  <p className="text-sm text-gray-500">{file.time}</p>
                </div>
              </div>
              <Button
                onClick={() => (currentlyPlaying === file.key ? stopAudio() : playAudio(file.key))}
                variant="outline"
                size="sm"
              >
                {currentlyPlaying === file.key ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    정지
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    재생
                  </>
                )}
              </Button>
            </div>
          ))
        )}
      </div>

      {audioFiles.length > 0 && (
        <p className="mt-4 text-sm text-gray-500 text-center">
          총 {audioFiles.length}개의 음성 파일이 있습니다.
        </p>
      )}
    </div>
  );
}
