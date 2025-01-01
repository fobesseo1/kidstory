'use client';

import React, { useState } from 'react';
import { useZxing } from 'react-zxing';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Save } from 'lucide-react';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import NutritionCard from '../components/shared/ui/NutritionCard';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { NutritionData } from '../food/FoodAnalyzer';

interface ProductInfo {
  BRCD_NO: string;
  PRDLST_REPORT_NO: string;
  CMPNY_NM: string;
  PRDT_NM: string;
  LAST_UPDT_DTM: string;
  PRDLST_NM: string;
  HRNK_PRDLST_NM: string;
  HTRK_PRDLST_NM: string;
}

interface NutritionInfo {
  foodName: string;
  ingredients: Array<{
    name: string;
    amount: string;
  }>;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

interface ApiResponse {
  I2570: {
    RESULT: {
      CODE: string;
      MSG: string;
    };
    row: ProductInfo[];
  };
}

interface BarcodeScannerProps {
  currentUser_id: string;
  onScanSuccess?: (result: string) => void;
  onScanError?: (error: Error) => void;
}

export function BarcodeScanner({
  currentUser_id,
  onScanSuccess,
  onScanError,
}: BarcodeScannerProps) {
  const [step, setStep] = useState<'initial' | 'scanning' | 'analyzing' | 'complete'>('initial');
  const [result, setResult] = useState('');
  const [isEnvironment, setIsEnvironment] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [nutritionInfo, setNutritionInfo] = useState<NutritionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showResultAlert, setShowResultAlert] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState({
    foodName: false,
  });

  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const { ref } = useZxing({
    onDecodeResult(result) {
      const scannedText = result.getText();
      setResult(scannedText);
      setScannedBarcode(scannedText);
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
      onScanSuccess?.(scannedText);
      setShowAlert(true);
    },
    onError(error: unknown) {
      if (error instanceof Error) {
        onScanError?.(error);
      } else {
        onScanError?.(new Error(String(error)));
      }
    },
    constraints: {
      video: {
        facingMode: isEnvironment ? 'environment' : 'user',
      },
    },
  });

  const handleConfirmSearch = () => {
    if (scannedBarcode) {
      fetchProductInfo(scannedBarcode);
    }
    setShowAlert(false);
  };

  const handleCancelSearch = () => {
    setShowAlert(false);
    setStep('initial');
  };

  const fetchProductInfo = async (barcodeNumber: string) => {
    setIsLoading(true);
    setError(null);
    setStep('analyzing');
    setNutritionInfo(null);

    try {
      const response = await fetch(`/api/barcode?barcodeNo=${barcodeNumber}`);
      const data: ApiResponse = await response.json();

      if (data.I2570.RESULT.CODE === 'INFO-000' && data.I2570.row?.length > 0) {
        const productData = data.I2570.row[0];
        setProductInfo(productData);
        await getProductNutrition(productData);
        setStep('complete');
      } else {
        setError('제품 정보를 찾을 수 없습니다.');
        setStep('scanning');
      }
    } catch (err) {
      setError('제품 정보를 가져오는 중 오류가 발생했습니다.');
      console.error('API Error:', err);
      setStep('scanning');
    } finally {
      setIsLoading(false);
    }
  };

  const getProductNutrition = async (product: ProductInfo) => {
    try {
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
              content: `이 음식의 정보를 분석해서 아래 JSON 형식으로 응답해주세요:
              {
                "foodName": "음식 이름",
                "ingredients": [{"name": "재료명", "amount": "수량 또는 중량"}],
                "nutrition": {
                  "calories": 칼로리(kcal),
                  "protein": 단백질(g),
                  "fat": 지방(g),
                  "carbs": 탄수화물(g)
                }
              }
              분석할 제품 정보:
              제품명: ${product.PRDT_NM}
              품목분류: ${product.HTRK_PRDLST_NM} > ${product.HRNK_PRDLST_NM} > ${product.PRDLST_NM}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('영양 정보 분석 실패');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다.');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      setNutritionInfo(parsedResponse);
    } catch (error) {
      console.error('영양 정보 분석 오류:', error);
      setError('영양 정보를 분석하는 중 오류가 발생했습니다.');
    }
  };

  // 소수점 버림 처리 함수
  const truncateValue = (value: number): number => {
    return Math.floor(value);
  };

  // Supabase에 저장하는 함수
  const saveToSupabase = async () => {
    if (!nutritionInfo || !productInfo) return;

    setIsSaving(true);
    try {
      const { error: insertError } = await supabase.from('food_logs').insert({
        user_id: currentUser_id,
        logged_at: new Date().toISOString(),
        food_name: nutritionInfo.foodName,
        calories: truncateValue(nutritionInfo.nutrition.calories),
        protein: truncateValue(nutritionInfo.nutrition.protein),
        fat: truncateValue(nutritionInfo.nutrition.fat),
        carbs: truncateValue(nutritionInfo.nutrition.carbs),
      });

      if (insertError) throw insertError;

      setShowResultAlert(true);
    } catch (error) {
      console.error('저장 오류:', error);
      setError('저장 중 오류가 발생했습니다.');
      setShowResultAlert(true);
    } finally {
      setIsSaving(false);
    }
  };

  // 스캔 초기화 함수
  const resetScan = () => {
    window.location.reload();
  };

  const successSave = () => {
    router.push('/main');
    return null;
  };

  const handleFoodNameChange = (newName: string) => {
    if (nutritionInfo) {
      setNutritionInfo({
        ...nutritionInfo,
        foodName: newName,
      });
    }
  };

  // 영양소 변경 핸들러 추가

  return (
    <div className="relative min-h-screen min-w-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Scanner Section */}
      <div className="w-full aspect-square">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 160, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -160, opacity: 0 }}
            className="w-full aspect-square"
          >
            <div className="relative w-full h-full">
              <div className="w-full h-full flex items-center justify-center bg-black relative">
                <video ref={ref} className="w-full h-full object-cover" />
                <div className="absolute top-16 left-16 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl border-gray-300"></div>
                <div className="absolute top-16 right-16 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl border-gray-300"></div>
                <div className="absolute bottom-16 left-16 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl border-gray-300"></div>
                <div className="absolute bottom-16 right-16 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl border-gray-300"></div>
                <div className="absolute top-24 left-0 right-0 text-center text-white text-sm">
                  바코드를 사각형 안에 맞춰주세요
                </div>
              </div>
            </div>
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
                  <p className="mt-4 text-gray-500">제품 정보를 분석하고 있어요...</p>
                </div>
              )}

              {nutritionInfo && (
                <div className="flex-1 overflow-y-auto space-y-6">
                  {/* Name Card */}
                  <Card className="p-4">
                    <div className="grid grid-cols-10 gap-2 h-16">
                      <div className="col-span-10 py-2 flex items-center">
                        {editMode.foodName ? (
                          <Input
                            type="text"
                            value={nutritionInfo.foodName}
                            onChange={(e) => handleFoodNameChange(e.target.value)}
                            onBlur={() => setEditMode((prev) => ({ ...prev, foodName: false }))}
                            className="text-xl font-medium"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-xl">{nutritionInfo.foodName}</p>
                            <button
                              onClick={() => setEditMode((prev) => ({ ...prev, foodName: true }))}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <Pencil className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                  <NutritionCard
                    nutrition={nutritionInfo.nutrition}
                    onNutritionChange={(newNutrition) => {
                      setNutritionInfo((prev) =>
                        prev
                          ? {
                              ...prev,
                              nutrition: newNutrition,
                            }
                          : null
                      );
                    }}
                    editable={true}
                  />
                  {/* Ingredients Card */}
                  {nutritionInfo.ingredients.length > 0 && (
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold mb-3">재료 구성</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {nutritionInfo.ingredients.map((ingredient, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg shadow-md">
                            <p className="font-medium">{ingredient.name}</p>
                            <p className="text-sm text-gray-600">{ingredient.amount}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  {/* Product Info Card */}
                  {productInfo && (
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold mb-3">제품 정보</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">바코드:</span> {productInfo.BRCD_NO}
                        </p>
                        <p>
                          <span className="font-medium">제조사:</span> {productInfo.CMPNY_NM}
                        </p>
                        <p>
                          <span className="font-medium">품목분류:</span>{' '}
                          {productInfo.HTRK_PRDLST_NM} &gt; {productInfo.HRNK_PRDLST_NM} &gt;{' '}
                          {productInfo.PRDLST_NM}
                        </p>
                        <p>
                          <span className="font-medium">품목보고번호:</span>{' '}
                          {productInfo.PRDLST_REPORT_NO}
                        </p>
                        <p>
                          <span className="font-medium">최종수정일:</span>{' '}
                          {productInfo.LAST_UPDT_DTM}
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="absolute bottom-0 w-full px-6 pb-8 bg-white">
        {/* 스캔 확인 Alert */}
        <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>제품 정보 검색</AlertDialogTitle>
              <AlertDialogDescription>
                바코드 번호: {scannedBarcode}
                <br />이 제품의 상세 정보를 검색하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelSearch}>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSearch}>검색</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 저장 결과 Alert */}
        <AlertDialog open={showResultAlert} onOpenChange={setShowResultAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{error ? '저장 실패' : '저장 완료'}</AlertDialogTitle>
              <AlertDialogDescription>
                {error ? error : '제품 정보가 성공적으로 저장되었습니다.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={successSave}>확인</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {step === 'initial' && (
          <button className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium flex items-center justify-center gap-4">
            <Camera className="w-8 h-8" />
            <p>바코드 스캔하기</p>
          </button>
        )}

        {(step === 'scanning' || step === 'analyzing') && (
          <button className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium flex items-center justify-center gap-4">
            <Camera className="w-8 h-8" />
            <p>{step === 'scanning' ? '스캔중' : '검색중'}</p>
          </button>
        )}

        {step === 'complete' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={resetScan}
              className="w-full bg-gray-100 text-gray-900 rounded-xl py-4 text-lg font-medium"
            >
              다른 음식
            </button>
            <button
              onClick={saveToSupabase}
              disabled={isSaving}
              className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
            >
              {isSaving ? '저장중...' : '저장하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BarcodeScanner;
