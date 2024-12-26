'use client';

import React, { useState, useRef, useEffect } from 'react';
import Quagga from 'quagga';
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

  const videoRef = useRef<HTMLDivElement>(null);

  const API_KEY = process.env.NEXT_PUBLIC_FOOD_SAFETY_API_KEY;
  const BASE_URL = 'http://openapi.foodsafetykorea.go.kr/api';

  const startScanner = () => {
    setStep('scanning');
    setDialogOpen(false);

    if (videoRef.current) {
      Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: videoRef.current,
            constraints: {
              facingMode: 'environment',
            },
          },
          decoder: {
            readers: [
              'ean_reader',
              'ean_8_reader',
              'code_128_reader',
              'code_39_reader',
              'upc_reader',
              'upc_e_reader',
            ],
            debug: {
              drawBoundingBox: true,
              showFrequency: true,
              drawScanline: true,
              showPattern: true,
            },
          },
        },
        function (err) {
          if (err) {
            console.error(err);
            setErrorMessage('카메라를 시작할 수 없습니다.');
            setStep('error');
            return;
          }
          console.log('QuaggaJS initialization succeeded');
          Quagga.start();
        }
      );

      // 바코드 인식 성공 시
      Quagga.onDetected((result) => {
        if (result.codeResult.code) {
          // 진동 피드백
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }

          // 스캐너 정지
          Quagga.stop();

          // 상품 정보 조회
          fetchProductInfo(result.codeResult.code);
        }
      });
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
    Quagga.stop();
    setStep('initial');
    setProductInfo(null);
    setErrorMessage('');
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      Quagga.stop();
    };
  }, []);

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Scanner View */}
      <div className="w-full aspect-square bg-black relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 160, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -160, opacity: 0 }}
            className="w-full h-full"
          >
            {step === 'scanning' && (
              <>
                <div ref={videoRef} className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white rounded-lg opacity-50" />
                  <div className="absolute bottom-16 left-0 right-0 text-center text-white">
                    바코드를 스캔 영역 안에 위치시켜주세요
                  </div>
                </div>
              </>
            )}

            {step === 'loading' && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                  <p className="text-white">상품 정보를 가져오는 중...</p>
                </div>
              </div>
            )}

            {(step === 'initial' || step === 'error') && (
              <div className="w-full h-full flex items-center justify-center relative">
                <div className="absolute top-16 left-16 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl border-gray-300" />
                <div className="absolute top-16 right-16 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl border-gray-300" />
                <div className="absolute bottom-16 left-16 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl border-gray-300" />
                <div className="absolute bottom-16 right-16 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl border-gray-300" />
                <span className="text-gray-500">바코드를 스캔해주세요</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {step === 'error' && errorMessage && (
        <div className="absolute top-4 left-4 right-4">
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-red-600">{errorMessage}</p>
          </Card>
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
                <button
                  onClick={startScanner}
                  className="w-full p-4 bg-black text-white rounded-xl flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>카메라로 스캔하기</span>
                </button>
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
