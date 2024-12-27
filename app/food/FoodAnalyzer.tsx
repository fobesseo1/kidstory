'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card } from '@/components/ui/card';
import { compressImage, fileToBase64 } from '@/utils/image';
import NutritionCard from '../components/shared/ui/NutritionCard';
import NavigationButtonSection from '../components/shared/ui/NavigationButtonSection';

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
                  <NutritionCard nutrition={analysis.nutrition} />

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
      <NavigationButtonSection
        step={step}
        setStep={setStep}
        setSelectedImage={setSelectedImage}
        setImageUrl={setImageUrl}
        onAnalyze={analyzeImage}
        stream={stream}
        setStream={setStream}
        videoRef={videoRef}
      />
    </div>
  );
};

export default FoodAnalyzer;
