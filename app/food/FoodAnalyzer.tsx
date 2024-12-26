'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Beef, Camera, Droplet, Flame, ImageIcon, Minus, Plus, Wheat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';

type AnalysisStep = 'initial' | 'camera' | 'image-selected' | 'analyzing' | 'complete';

interface NutritionData {
  foodName: string;
  ingredients: Array<{
    name: string;
    amount: string;
    originalAmount?: {
      value: number;
      unit: string;
    };
  }>;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

const FoodAnalyzer = () => {
  const [step, setStep] = useState<AnalysisStep>('initial');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<NutritionData | null>(null);
  const [originalAnalysis, setOriginalAnalysis] = useState<NutritionData | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (originalAnalysis) {
      setAnalysis(calculateNutritionByQuantity(originalAnalysis, quantity));
    }
  }, [quantity, originalAnalysis]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const calculateNutritionByQuantity = (
    originalData: NutritionData,
    qty: number
  ): NutritionData => {
    return {
      ...originalData,
      nutrition: {
        calories: Math.round(originalData.nutrition.calories * qty),
        protein: parseFloat((originalData.nutrition.protein * qty).toFixed(1)),
        fat: parseFloat((originalData.nutrition.fat * qty).toFixed(1)),
        carbs: parseFloat((originalData.nutrition.carbs * qty).toFixed(1)),
      },
      ingredients: originalData.ingredients.map((ingredient) => {
        if (ingredient.originalAmount) {
          return {
            ...ingredient,
            amount: `${(ingredient.originalAmount.value * qty).toFixed(1)}${
              ingredient.originalAmount.unit
            }`,
          };
        }
        return ingredient;
      }),
    };
  };

  const handleIncrease = () => {
    if (quantity < 99) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      if (value > 99) {
        setQuantity(99);
      } else if (value < 1) {
        setQuantity(1);
      } else {
        setQuantity(value);
      }
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;

        img.onload = () => {
          console.log('원본 이미지 정보:', {
            width: img.width,
            height: img.height,
            size: (file.size / 1024).toFixed(2) + 'KB',
          });

          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

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

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });

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

  const processApiResponse = (apiData: NutritionData) => {
    const processedData = {
      ...apiData,
      ingredients: apiData.ingredients.map((ingredient) => {
        const match = ingredient.amount.match(/^(\d+\.?\d*)\s*(.+)$/);
        if (match) {
          return {
            ...ingredient,
            originalAmount: {
              value: parseFloat(match[1]),
              unit: match[2],
            },
          };
        }
        return ingredient;
      }),
    };

    setOriginalAnalysis(processedData);
    setAnalysis(processedData);
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
                  text: '이 음식 사진을 분석해서 아래 JSON 형식으로 응답해주세요: { "foodName": "음식 이름", "ingredients": [{"name": "재료명", "amount": "수량 또는 중량"}], "nutrition": {"calories": 칼로리(kcal), "protein": 단백질(g), "fat": 지방(g), "carbs": 탄수화물(g)} }',
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
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const parsedData = JSON.parse(data.choices[0].message.content);
      processApiResponse(parsedData);
      setStep('complete');
    } catch (error) {
      console.error('Error:', error);
      setAnalysis(null);
      setStep('image-selected');
    }
  };

  const resetAnalyzer = () => {
    setStep('initial');
    setSelectedImage(null);
    setImageUrl('');
    setAnalysis(null);
    setOriginalAnalysis(null);
    setQuantity(1);
  };

  return (
    <div className="relative min-h-screen min-w-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Image Section */}
      <div className="w-full aspect-square">
        <AnimatePresence mode="wait">
          <motion.div
            key={imageUrl}
            initial={{ x: 160, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -160, opacity: 0 }}
            className="w-full aspect-square"
          >
            {step === 'camera' ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : imageUrl ? (
              <img src={imageUrl} alt="Selected food" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black relative">
                {/* 모서리 프레임 */}
                <div className="absolute top-16 left-16 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl border-gray-300"></div>
                <div className="absolute top-16 right-16 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl border-gray-300"></div>
                <div className="absolute bottom-16 left-16 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl border-gray-300"></div>
                <div className="absolute bottom-16 right-16 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl border-gray-300"></div>

                {/* 안내 텍스트 */}
                <span className="text-gray-500">음식 사진을 선택해주세요</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Section */}
      <div
        className={`absolute bottom-[92px] w-full ${
          step === 'complete' ? 'h-[calc(100vh-50vw-60px)]' : 'h-[calc(100vh-100vw-60px)]'
        } flex flex-col px-6 py-8 rounded-t-3xl bg-white`}
      >
        <div className="flex-1 overflow-y-auto">
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
                <div className="flex-1 overflow-y-auto space-y-6">
                  {/* Name & Number Card */}
                  <Card className="p-4">
                    <div className="grid grid-cols-10 gap-2 h-16">
                      <div className="col-span-6 py-2 flex items-center">
                        <p className="font-medium text-xl">{analysis.foodName}</p>
                      </div>
                      <div className="col-span-4 py-2">
                        <div className="flex items-center justify-between h-full">
                          <button
                            onClick={handleDecrease}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
                            disabled={quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>

                          <input
                            type="number"
                            value={quantity}
                            onChange={handleInputChange}
                            min="1"
                            max="99"
                            className="w-12 h-12 text-center bg-white rounded-lg text-xl font-semibold"
                          />

                          <button
                            onClick={handleIncrease}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
                            disabled={quantity >= 99}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Nutrition Card */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-3">영양 정보</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
                        <div className="col-span-3 flex items-center justify-center">
                          <Flame size={32} color="#F87171" />
                        </div>
                        <div className="col-span-7 flex flex-col gap-1 justify-center">
                          <p className="text-sm text-gray-600">칼로리</p>
                          <p className="text-lg font-semibold">
                            {analysis.nutrition.calories}{' '}
                            <span className="text-sm text-gray-600">kcal</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
                        <div className="col-span-3 flex items-center justify-center">
                          <Beef size={32} color="#F472B6" />
                        </div>
                        <div className="col-span-7 flex flex-col gap-1 justify-center">
                          <p className="text-sm text-gray-600">단백질</p>
                          <p className="text-lg font-semibold">
                            {analysis.nutrition.protein}{' '}
                            <span className="text-sm text-gray-600">g</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
                        <div className="col-span-3 flex items-center justify-center">
                          <Droplet size={32} color="#94A3B8" />
                        </div>
                        <div className="col-span-7 flex flex-col gap-1 justify-center">
                          <p className="text-sm text-gray-600">지방</p>
                          <p className="text-lg font-semibold">
                            {analysis.nutrition.fat}{' '}
                            <span className="text-sm text-gray-600">g</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
                        <div className="col-span-3 flex items-center justify-center">
                          <Wheat size={32} color="#EAB308" />
                        </div>
                        <div className="col-span-7 flex flex-col gap-1 justify-center">
                          <p className="text-sm text-gray-600">탄수화물</p>
                          <p className="text-lg font-semibold">
                            {analysis.nutrition.carbs}{' '}
                            <span className="text-sm text-gray-600">g</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Ingredients Card */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-3">재료 구성</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {analysis.ingredients.map((ingredient, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg shadow-md">
                          <p className="font-medium">{ingredient.name}</p>
                          <p className="text-sm text-gray-600">{ingredient.amount}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Section */}
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
    </div>
  );
};

export default FoodAnalyzer;

// {
//   type: 'text',
//   text: '이 메뉴 사진에서 현재 다이어트중인 26세 여성인데 어떤 메뉴가 다이어트와 피부미용에 좋을지 골라주세요. 그 이유도 한국어로 자세히 설명해주세요. 그리고 칼로리, 탄수화물, 단백질, 지방 함량(g)을 예측해주세요.',
// },
