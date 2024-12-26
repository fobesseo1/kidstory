// BarcodeScanner.tsx
'use client';

import React, { useState } from 'react';
import { useZxing } from 'react-zxing';

interface BarcodeScannerProps {
  onScanSuccess?: (result: string) => void;
  onScanError?: (error: Error) => void;
}

export function BarcodeScanner({ onScanSuccess, onScanError }: BarcodeScannerProps) {
  const [result, setResult] = useState('');

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
        facingMode: { exact: 'environment' }, // 후면 카메라 강제 설정
      },
    },
  });

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="mb-4">
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          <video ref={ref} className="w-full h-full object-cover" />
        </div>
        {result && (
          <div className="mt-4 p-4 bg-green-100 rounded">
            <p>스캔 결과: {result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
