'use client';

import React, { useState } from 'react';
import { useZxing } from 'react-zxing';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess?: (result: string) => void;
  onScanError?: (error: Error) => void;
}

export function BarcodeScanner({ onScanSuccess, onScanError }: BarcodeScannerProps) {
  const [result, setResult] = useState('');

  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.UPC_E,
    BarcodeFormat.UPC_A,
    BarcodeFormat.CODABAR,
  ]);

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
        facingMode: 'environment',
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
      },
    },
    timeBetweenDecodingAttempts: 100,
    hints: hints,
  });

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="mb-4">
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          <video ref={ref} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-blue-500 rounded-lg"></div>
          </div>
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
