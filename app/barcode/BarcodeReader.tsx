'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const API_KEY = process.env.NEXT_PUBLIC_FOOD_SAFETY_API_KEY;
  const BASE_URL = 'http://openapi.foodsafetykorea.go.kr/api';

  useEffect(() => {
    // Initialize code reader
    try {
      const reader = new BrowserMultiFormatReader();
      codeReader.current = reader;
      console.log('Code reader initialized');
    } catch (error) {
      console.error('Error initializing code reader:', error);
      setErrorMessage('바코드 스캐너 초기화에 실패했습니다.');
      setStep('error');
    }

    // Cleanup
    return () => {
      if (codeReader.current) {
        try {
          console.log('Cleaning up code reader');
          codeReader.current.reset();
        } catch (error) {
          console.error('Error cleaning up:', error);
        }
      }
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  };

  const startScanner = async () => {
    console.log('Starting scanner...');
    if (!codeReader.current || !videoRef.current) {
      console.error('Code reader or video ref not initialized');
      setErrorMessage('스캐너를 초기화할 수 없습니다.');
      setStep('error');
      return;
    }

    try {
      // Check camera permission first
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        setErrorMessage(
          '카메라 접근 권한이 없습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
        );
        setStep('error');
        return;
      }

      setDialogOpen(false);
      setStep('scanning');
      console.log('Starting decode from constraints');

      await codeReader.current.decodeFromConstraints(
        {
          video: {
            facingMode: 'environment',
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
          },
        },
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log('Barcode detected:', result.getText());
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            fetchProductInfo(result.getText());
          }
          if (error && error?.name !== 'NotFoundException') {
            console.error('Scan error:', error);
          }
        }
      );

      console.log('Camera started successfully');
    } catch (error) {
      console.error('Error starting scanner:', error);
      setErrorMessage('카메라를 시작할 수 없습니다. 카메라 권한을 확인해주세요.');
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
        if (codeReader.current) {
          codeReader.current.reset();
        }
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
    if (codeReader.current) {
      try {
        codeReader.current.reset();
      } catch (error) {
        console.error('Error resetting scanner:', error);
      }
    }
    setStep('initial');
    setProductInfo(null);
    setErrorMessage('');
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col bg-gray-900">
      {/* Scanner View */}
      <div className="w-full aspect-square bg-black relative">
        {step === 'scanning' && (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white rounded-lg opacity-50" />
              <div className="absolute bottom-16 left-0 right-0 text-center text-white">
                바코드를 스캔 영역 안에 위치시켜주세요
              </div>
            </div>
          </>
        )}

        {step === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
              <p className="text-white">상품 정보를 가져오는 중...</p>
            </div>
          </div>
        )}

        {(step === 'initial' || step === 'error') && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center px-4">
              <span className="text-gray-500">하단의 버튼을 눌러 바코드 스캔을 시작해주세요</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {step === 'error' && errorMessage && (
        <div className="absolute top-4 left-4 right-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
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
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
        {step === 'initial' || step === 'error' ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium">
                바코드 스캔하기
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
