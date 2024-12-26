'use client';

import React, { useState } from 'react';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  NotFoundException,
} from '@zxing/library';
import { Camera, ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ScanStep = 'initial' | 'scanning' | 'loading' | 'complete' | 'error';

interface ProductInfo {
  PRDT_NM: string;
  CMPNY_NM: string;
  BRCD_NO: string;
  PRDLST_NM: string;
  HTRK_PRDLST_NM: string;
  HRNK_PRDLST_NM: string;
}

const BarcodeReader = () => {
  const [step, setStep] = useState<ScanStep>('initial');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');

  const API_KEY = process.env.NEXT_PUBLIC_FOOD_SAFETY_API_KEY;
  const BASE_URL = 'http://openapi.foodsafetykorea.go.kr/api';

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStep('scanning');
      setDialogOpen(false);
      setImageUrl(URL.createObjectURL(file));

      const hints = new Map();
      const formats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODABAR,
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new MultiFormatReader();
      reader.setHints(hints);

      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          // 이미지 처리를 위한 여러 캔버스 준비
          const processings = [
            // 원본
            {
              process: (ctx: CanvasRenderingContext2D) => {
                ctx.drawImage(img, 0, 0);
              },
            },
            // 대비 강화
            {
              process: (ctx: CanvasRenderingContext2D) => {
                ctx.filter = 'contrast(150%) brightness(120%)';
                ctx.drawImage(img, 0, 0);
              },
            },
            // 흑백 변환
            {
              process: (ctx: CanvasRenderingContext2D) => {
                ctx.filter = 'grayscale(100%)';
                ctx.drawImage(img, 0, 0);
              },
            },
            // 반전
            {
              process: (ctx: CanvasRenderingContext2D) => {
                ctx.filter = 'invert(100%)';
                ctx.drawImage(img, 0, 0);
              },
            },
          ];

          // 각 처리 방식 시도
          for (const processing of processings) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            // 이미지 처리 적용
            processing.process(ctx);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const width = imageData.width;
            const height = imageData.height;

            // RGB 데이터 준비
            const rgbArray = new Uint8ClampedArray(width * height * 3);
            let j = 0;
            for (let i = 0; i < imageData.data.length; i += 4) {
              rgbArray[j++] = imageData.data[i]; // R
              rgbArray[j++] = imageData.data[i + 1]; // G
              rgbArray[j++] = imageData.data[i + 2]; // B
            }

            try {
              // 바코드 읽기 시도
              const luminanceSource = new RGBLuminanceSource(rgbArray, width, height);
              const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
              const result = reader.decode(binaryBitmap);

              if (result) {
                // 진동 피드백
                if (navigator.vibrate) {
                  navigator.vibrate(200);
                }

                const barcodeValue = result.getText();
                console.log('Detected barcode:', barcodeValue);

                await fetchProductInfo(barcodeValue);
                return; // 성공하면 종료
              }
            } catch (error) {
              if (!(error instanceof NotFoundException)) {
                throw error;
              }
              // ZXing 관련 에러는 다음 처리 방식 시도
              console.log('Attempt failed:', error);
              continue;
            }
          }

          // 모든 시도 실패
          throw new Error('바코드를 찾을 수 없습니다');
        } catch (error) {
          console.error('Barcode scanning error:', error);
          setErrorMessage('바코드를 인식할 수 없습니다. 다시 시도해주세요.');
          setStep('error');
        }
      };

      img.onerror = () => {
        setErrorMessage('이미지를 불러올 수 없습니다.');
        setStep('error');
      };
    } catch (error) {
      console.error('Error processing image:', error);
      setErrorMessage('이미지 처리 중 오류가 발생했습니다.');
      setStep('error');
    }
  };

  const fetchProductInfo = async (barcodeNo: string) => {
    setStep('loading');
    try {
      const response = await fetch(`${BASE_URL}/${API_KEY}/I2570/json/1/5/BRCD_NO=${barcodeNo}`);

      if (!response.ok) {
        throw new Error('API 응답 오류');
      }

      const data = await response.json();

      if (data.I2570?.row?.[0]) {
        setProductInfo(data.I2570.row[0]);
        setStep('complete');
      } else {
        throw new Error('상품을 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('Error fetching product info:', error);
      setErrorMessage('상품 정보를 가져오는데 실패했습니다.');
      setStep('error');
    }
  };

  const resetScanner = () => {
    setStep('initial');
    setProductInfo(null);
    setErrorMessage('');
    setImageUrl('');
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Scanner View */}
      <div className="w-full aspect-square">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 160, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -160, opacity: 0 }}
            className="w-full aspect-square"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Scanned" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black relative">
                <div className="absolute top-16 left-16 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl border-gray-300" />
                <div className="absolute top-16 right-16 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl border-gray-300" />
                <div className="absolute bottom-16 left-16 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl border-gray-300" />
                <div className="absolute bottom-16 right-16 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl border-gray-300" />
                <span className="text-gray-500">바코드를 스캔해주세요</span>
              </div>
            )}

            {step === 'scanning' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                  <p className="text-white">바코드를 스캔하는 중...</p>
                </div>
              </div>
            )}

            {step === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                  <p className="text-white">상품 정보를 가져오는 중...</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error Alert */}
      {step === 'error' && errorMessage && (
        <div className="absolute top-4 left-4 right-4">
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Product Info */}
      {step === 'complete' && productInfo && (
        <div className="flex-1 p-6 bg-white rounded-t-3xl -mt-6 space-y-4 overflow-y-auto">
          <Card className="p-4">
            <h2 className="text-xl font-bold mb-2">{productInfo.PRDT_NM}</h2>
            <p className="text-gray-600">{productInfo.CMPNY_NM}</p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">제품 정보</h3>
            <div className="space-y-2">
              <p>바코드: {productInfo.BRCD_NO}</p>
              <p>분류: {productInfo.PRDLST_NM}</p>
              <p>대분류: {productInfo.HTRK_PRDLST_NM}</p>
              <p>중분류: {productInfo.HRNK_PRDLST_NM}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Control Button */}
      <div className="absolute bottom-0 w-full px-6 pb-8 bg-white">
        {step === 'initial' || step === 'error' ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium flex items-center justify-center gap-4">
                <Camera className="w-8 h-8" />
                <p>바코드 스캔하기</p>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>바코드 스캔</DialogTitle>
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
        ) : step === 'complete' ? (
          <button
            onClick={resetScanner}
            className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
          >
            다시 스캔하기
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default BarcodeReader;
