import VoiceChat from './VoiceChat';

export default function ChatPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">AI 음성 대화</h1>
      <VoiceChat />
    </div>
  );
}
