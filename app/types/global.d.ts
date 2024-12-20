// types/global.d.ts 파일 생성
interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}

type SpeechRecognitionErrorEvent = {
  error: 'no-speech' | 'audio-capture' | 'not-allowed' | 'network' | string;
  message?: string;
};
