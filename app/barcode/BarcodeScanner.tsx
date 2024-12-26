'use client';

import React, { useState } from 'react';
import { useZxing } from 'react-zxing';

interface BarcodeScannerProps {
  onScanSuccess?: (result: string) => void;
  onScanError?: (error: Error) => void;
}

export function BarcodeScanner({ onScanSuccess, onScanError }: BarcodeScannerProps) {
  const [result, setResult] = useState('');
  const [isEnvironment, setIsEnvironment] = useState(true);

  const { ref } = useZxing({
    onDecodeResult(result) {
      const scannedText = result.getText();
      setResult(scannedText);
      onScanSuccess?.(scannedText);
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

  const toggleCamera = async () => {
    // 현재 스트림 중지
    if (ref.current && ref.current.srcObject instanceof MediaStream) {
      ref.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    // 카메라 방향 전환
    setIsEnvironment(!isEnvironment);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="mb-4">
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          <video ref={ref} className="w-full h-full object-cover" />
        </div>
        {/* <button
          onClick={toggleCamera}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isEnvironment ? '전면 카메라로 전환' : '후면 카메라로 전환'}
        </button> */}
        {result && (
          <div className="mt-4 p-4 bg-green-100 rounded">
            <p>스캔 결과: {result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
