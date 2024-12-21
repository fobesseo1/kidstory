// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Mic, Square, Play, Save } from 'lucide-react';

// interface Recording {
//   id: number;
//   url: string;
//   date: string;
// }

// const VoiceRecorder: React.FC = () => {
//   const [isRecording, setIsRecording] = useState<boolean>(false);
//   const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
//   const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
//   const [recordings, setRecordings] = useState<Recording[]>([]);
//   const [error, setError] = useState<string>('');

//   useEffect(() => {
//     const loadRecordings = () => {
//       const saved = localStorage.getItem('recordings');
//       if (saved) {
//         try {
//           const parsedRecordings: Recording[] = JSON.parse(saved);
//           setRecordings(parsedRecordings);
//         } catch (err) {
//           console.error('Failed to parse recordings:', err);
//           localStorage.removeItem('recordings');
//         }
//       }
//     };
//     loadRecordings();
//   }, []);

//   const startRecording = async (): Promise<void> => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const recorder = new MediaRecorder(stream);
//       const chunks: Blob[] = [];

//       recorder.ondataavailable = (e: BlobEvent) => {
//         if (e.data.size > 0) {
//           chunks.push(e.data);
//         }
//       };

//       recorder.onstop = () => {
//         const blob = new Blob(chunks, { type: 'audio/mp3' });
//         const url = URL.createObjectURL(blob);
//         const newRecording: Recording = {
//           id: Date.now(),
//           url,
//           date: new Date().toLocaleString(),
//         };

//         const updatedRecordings = [...recordings, newRecording];
//         setRecordings(updatedRecordings);

//         try {
//           localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
//         } catch (err) {
//           console.error('Failed to save recordings:', err);
//           setError('녹음 저장에 실패했습니다.');
//         }
//       };

//       recorder.start();
//       setMediaRecorder(recorder);
//       setIsRecording(true);
//       setAudioChunks([]);
//     } catch (err) {
//       setError('마이크 접근 권한이 필요합니다.');
//       console.error('Error accessing microphone:', err);
//     }
//   };

//   const stopRecording = (): void => {
//     if (mediaRecorder && mediaRecorder.state !== 'inactive') {
//       mediaRecorder.stop();
//       mediaRecorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
//       setIsRecording(false);
//     }
//   };

//   const playRecording = (url: string): void => {
//     const audio = new Audio(url);
//     audio.play().catch((err) => {
//       console.error('Failed to play recording:', err);
//       setError('재생에 실패했습니다.');
//     });
//   };

//   return (
//     <div className="p-4 max-w-md mx-auto">
//       <div className="mb-6 bg-white rounded-lg shadow-md p-4">
//         <div className="flex justify-center space-x-4">
//           {!isRecording ? (
//             <button
//               onClick={startRecording}
//               className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full"
//               type="button"
//             >
//               <Mic className="w-6 h-6" />
//             </button>
//           ) : (
//             <button
//               onClick={stopRecording}
//               className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full"
//               type="button"
//             >
//               <Square className="w-6 h-6" />
//             </button>
//           )}
//         </div>
//         {error && <p className="text-red-500 text-center mt-2">{error}</p>}
//       </div>

//       <div className="space-y-4">
//         {recordings
//           .map((recording: Recording) => (
//             <div
//               key={recording.id}
//               className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
//             >
//               <span className="text-sm text-gray-600">{recording.date}</span>
//               <button
//                 onClick={() => playRecording(recording.url)}
//                 className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
//                 type="button"
//               >
//                 <Play className="w-4 h-4" />
//               </button>
//             </div>
//           ))
//           .reverse()}
//       </div>
//     </div>
//   );
// };

// export default VoiceRecorder;

'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Square, Play, Save } from 'lucide-react';

interface Recording {
  id: number;
  url: string;
  date: string;
  transcription?: string;
  isTranscribing?: boolean;
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

  const transcribeAudio = async (blob: Blob, recordingId: number) => {
    try {
      // API 키 확인을 위한 콘솔 로그
      console.log('API Key exists:', !!process.env.OPENAI_API_KEY);

      const formData = new FormData();
      formData.append('file', blob, 'audio.mp3');
      formData.append('model', 'whisper-1');

      // 요청 전에 헤더 확인
      const headers = {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      };
      console.log('Headers:', headers);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      // 응답 상태 확인
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`Transcription failed: ${errorData}`);
      }

      const data = await response.json();

      // 녹음 데이터 업데이트
      setRecordings((prev) =>
        prev.map((rec) =>
          rec.id === recordingId ? { ...rec, transcription: data.text, isTranscribing: false } : rec
        )
      );

      // 로컬 스토리지 업데이트
      const updatedRecordings = recordings.map((rec) =>
        rec.id === recordingId ? { ...rec, transcription: data.text, isTranscribing: false } : rec
      );
      localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
    } catch (err) {
      console.error('Transcription error:', err);
      setError('음성 텍스트 변환에 실패했습니다.');

      // 에러 상태 업데이트
      setRecordings((prev) =>
        prev.map((rec) => (rec.id === recordingId ? { ...rec, isTranscribing: false } : rec))
      );
    }
  };

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

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const newRecordingId = Date.now();

        const newRecording: Recording = {
          id: newRecordingId,
          url,
          date: new Date().toLocaleString(),
          isTranscribing: true,
        };

        const updatedRecordings = [...recordings, newRecording];
        setRecordings(updatedRecordings);

        try {
          localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
          // 녹음 완료 후 자동으로 텍스트 변환 시작
          await transcribeAudio(blob, newRecordingId);
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
            <div key={recording.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{recording.date}</span>
                <button
                  onClick={() => playRecording(recording.url)}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                  type="button"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
              {recording.isTranscribing && (
                <p className="text-sm text-gray-500 mt-2">텍스트 변환 중...</p>
              )}
              {recording.transcription && (
                <p className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded-lg">
                  {recording.transcription}
                </p>
              )}
            </div>
          ))
          .reverse()}
      </div>
    </div>
  );
};

export default VoiceRecorder;
