'use client';

import { BarcodeScanner } from './BarcodeScanner';

export default function ScanPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">바코드 스캐너</h1>
      <BarcodeScanner
        onScanSuccess={(result) => {
          console.log('Scanned result:', result);
        }}
        onScanError={(error) => {
          console.error('Scan error:', error);
        }}
      />
    </div>
  );
}
//https://www.data.go.kr/data/15064775/openapi.do
