'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
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

type ScanStep = 'initial' | 'camera' | 'scanning' | 'loading' | 'complete';

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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const API_KEY = process.env.NEXT_PUBLIC_FOOD_SAFETY_API_KEY;
  const BASE_URL = 'http://openapi.foodsafetykorea.go.kr/api';

  useEffect(() => {
    // Initialize code reader
    if (!codeReader.current) {
      codeReader.current = new BrowserMultiFormatReader();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStep('camera');
      setDialogOpen(false);

      // Start scanning after camera is initialized
      startScanning();
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return;

    try {
      setStep('scanning');

      const constraints = {
        video: { facingMode: 'environment' },
      };

      // deviceId를 명시적으로 null로 전달
      await codeReader.current.decodeFromVideoDevice(
        null, // deviceId
        videoRef.current,
        async (result, error) => {
          if (result) {
            // Provide vibration feedback
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }

            // Stop scanning and camera
            if (stream) {
              stream.getTracks().forEach((track) => track.stop());
            }
            if (codeReader.current) {
              codeReader.current.reset();
            }

            // Fetch product information
            await fetchProductInfo(result.getText());
          }
        }
      );
    } catch (error) {
      console.error('Error starting scanner:', error);
      setStep('initial');
    }
  };

  const fetchProductInfo = async (barcodeNo: string) => {
    setStep('loading');
    try {
      const response = await fetch(`${BASE_URL}/${API_KEY}/I2570/json/1/5/BRCD_NO=${barcodeNo}`);

      const data = await response.json();

      if (data.I2570?.row?.[0]) {
        setProductInfo(data.I2570.row[0]);
        setStep('complete');
      } else {
        throw new Error('상품을 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('Error fetching product info:', error);
      setStep('initial');
    }
  };

  const resetScanner = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setStream(null);
    setStep('initial');
    setProductInfo(null);
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
            {(step === 'camera' || step === 'scanning') && (
              <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white rounded-lg opacity-50" />
                  <div className="absolute bottom-16 left-0 right-0 text-center text-white">
                    바코드를 스캔 영역 안에 위치시켜주세요
                  </div>
                </div>
              </div>
            )}

            {step === 'loading' && (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                  <p className="text-white">상품 정보를 가져오는 중...</p>
                </div>
              </div>
            )}

            {step === 'initial' && (
              <div className="w-full h-full flex items-center justify-center bg-black relative">
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
        {step === 'initial' ? (
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
                  onClick={startCamera}
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
