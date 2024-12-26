'use client';

import React, { useState, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import { Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess?: (result: string) => void;
  onScanError?: (error: Error) => void;
}

export function BarcodeScanner({ onScanSuccess, onScanError }: BarcodeScannerProps) {
  const [result, setResult] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);

  const { ref } = useZxing({
    onDecodeResult(result) {
      const scannedText = result.getText();
      setResult(scannedText);

      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }

      onScanSuccess?.(scannedText);
    },
    onError(error: unknown) {
      console.error('Scanner error:', error);
      if (error instanceof Error) {
        onScanError?.(error);
      } else {
        onScanError?.(new Error(String(error)));
      }
    },
    constraints: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { exact: 'environment' },
        aspectRatio: 4 / 3,
      },
    },
    timeBetweenDecodingAttempts: 300,
  });

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: 'environment' },
          },
        });
        stream.getTracks().forEach((track) => track.stop());
        setHasPermission(true);
      } catch (error) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-gray-600">카메라 초기화 중...</div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="p-4 bg-red-100 rounded-lg">
        <p className="text-red-700 mb-4">카메라 접근 권한이 필요합니다.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          권한 다시 요청
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ minHeight: '300px' }}
      >
        <video ref={ref} className="absolute inset-0 w-full h-full object-cover" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-blue-500 rounded-lg relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-scan" />
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-700 mb-2">스캔 결과: {result}</p>
          <button
            onClick={() => setResult('')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            다시 스캔
          </button>
        </div>
      )}
    </div>
  );
}
