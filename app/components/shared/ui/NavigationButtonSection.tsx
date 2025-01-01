'use client';

import { useState, useRef } from 'react';
import { Camera, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { compressImage } from '@/utils/image';

interface NavigationButtonSectionProps {
  step: 'initial' | 'camera' | 'image-selected' | 'analyzing' | 'complete';
  setStep: (step: 'initial' | 'camera' | 'image-selected' | 'analyzing' | 'complete') => void;
  setSelectedImage: (file: File | null) => void;
  setImageUrl: (url: string) => void;
  onAnalyze: () => Promise<void>;
  onSave?: () => Promise<void>;
  resetAnalyzer?: () => void; // 추가
  stream?: MediaStream | null;
  setStream?: (stream: MediaStream | null) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export default function NavigationButtonSection({
  step,
  setStep,
  setSelectedImage,
  setImageUrl,
  onAnalyze,
  stream,
  setStream,
  videoRef,
  onSave,
  resetAnalyzer,
}: NavigationButtonSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressedFile = await compressImage(file);
        setSelectedImage(compressedFile);
        setImageUrl(URL.createObjectURL(compressedFile));
        setStep('image-selected');
        setDialogOpen(false);
      } catch (error) {
        console.error('이미지 처리 오류:', error);
        setSelectedImage(file);
        setImageUrl(URL.createObjectURL(file));
        setStep('image-selected');
        setDialogOpen(false);
      }
    }
  };

  const takePicture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
            setSelectedImage(file);
            setImageUrl(URL.createObjectURL(file));
            setStep('image-selected');

            if (stream && setStream) {
              stream.getTracks().forEach((track) => track.stop());
              setStream(null);
            }
          }
        }, 'image/jpeg');
      }
    }
  };

  // const resetAnalyzer = () => {
  //   setStep('initial');
  //   setSelectedImage(null);
  //   setImageUrl('');
  // };

  return (
    <div className="absolute bottom-0 w-full px-6 pb-8 bg-white">
      {step === 'camera' ? (
        <button
          onClick={takePicture}
          className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
        >
          사진 촬영하기
        </button>
      ) : step === 'image-selected' ? (
        <button
          onClick={onAnalyze}
          className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
        >
          분석하기
        </button>
      ) : step === 'complete' ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={resetAnalyzer}
            className="w-full bg-gray-100 text-gray-900 rounded-xl py-4 text-lg font-medium"
          >
            다른 음식
          </button>
          <button
            onClick={onSave}
            className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
          >
            저장하기
          </button>
        </div>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium flex items-center justify-center gap-4">
              <Camera className="w-8 h-8" />
              <p>촬영하기 / 불러오기</p>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>촬영하기 / 불러오기</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="w-full p-4 bg-black text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                  <Camera className="w-5 h-5" />
                  <span>카메라로 촬영하기</span>
                </div>
              </label>

              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="w-full p-4 bg-gray-100 text-gray-900 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                  <ImageIcon className="w-5 h-5" />
                  <span>갤러리에서 선택하기</span>
                </div>
              </label>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
