'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

type AnalysisStep = 'initial' | 'camera' | 'image-selected' | 'analyzing' | 'complete';

const MenuAnalyzer = () => {
  const [step, setStep] = useState<AnalysisStep>('initial');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // 이미지 압축 함수
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;

        img.onload = () => {
          // 원본 이미지 정보 출력
          console.log('원본 이미지 정보:', {
            width: img.width,
            height: img.height,
            size: (file.size / 1024).toFixed(2) + 'KB',
          });

          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // 가로나 세로 중 큰 쪽이 512px를 초과하는 경우 비율에 맞게 조정
          const maxDimension = 512;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // JPEG 품질 0.7로 압축
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });

                // 압축된 이미지 정보 출력
                console.log('압축된 이미지 정보:', {
                  width: width,
                  height: height,
                  size: (compressedFile.size / 1024).toFixed(2) + 'KB',
                });

                resolve(compressedFile);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            'image/jpeg',
            0.7
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

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

            if (stream) {
              stream.getTracks().forEach((track) => track.stop());
              setStream(null);
            }
          }
        }, 'image/jpeg');
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setStep('analyzing');
    try {
      const base64Image = await fileToBase64(selectedImage);
      const fileType = selectedImage.type === 'image/png' ? 'png' : 'jpeg';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '이 메뉴 사진에서 현재 다이어트중인 26세 여성인데 어떤 메뉴가 다이어트와 피부미용에 좋을지 골라주세요. 그 이유도 한국어로 자세히 설명해주세요. 그리고 칼로리, 탄수화물, 단백질, 지방 함량(g)을 예측해주세요.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/${fileType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setAnalysis(data.choices[0].message.content);
      setStep('complete');
    } catch (error) {
      console.error('Error:', error);
      setAnalysis('이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setStep('image-selected');
    }
  };

  const resetAnalyzer = () => {
    setStep('initial');
    setSelectedImage(null);
    setImageUrl('');
    setAnalysis('');
  };

  return (
    <div className="min-h-screen min-w-screen flex flex-col bg-gray-900">
      {/* Image Section - Fixed at top */}
      <div className="w-full aspect-square">
        <AnimatePresence mode="wait">
          <motion.div
            key={imageUrl}
            initial={{ x: 160, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -160, opacity: 0 }}
            className="h-full"
          >
            {step === 'camera' ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : imageUrl ? (
              <img src={imageUrl} alt="Selected food" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <span className="text-gray-500">메뉴 사진을 선택해주세요</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Section - Flexible space */}
      <div className="flex-1 flex flex-col px-6 py-8 rounded-t-3xl bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {step === 'analyzing' && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black" />
                <p className="mt-4 text-gray-500">음식을 분석하고 있어요...</p>
              </div>
            )}

            {(step === 'complete' || step === 'image-selected') && analysis && (
              <div className="flex-1 overflow-y-auto">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{analysis}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Section - Fixed at bottom */}
      <div className="px-6 pb-8 bg-white">
        {step === 'camera' ? (
          <button
            onClick={takePicture}
            className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
          >
            사진 촬영하기
          </button>
        ) : step === 'image-selected' ? (
          <button
            onClick={analyzeImage}
            className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
          >
            분석하기
          </button>
        ) : step === 'complete' ? (
          <button
            onClick={resetAnalyzer}
            className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
          >
            다른 사진 분석하기
          </button>
        ) : (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium">
                사진 촬영/불러오기
              </button>
            </DialogTrigger>
            <DialogContent>
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
    </div>
  );
};

export default MenuAnalyzer;
