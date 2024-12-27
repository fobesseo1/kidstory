'use client';

import { BarcodeScanner } from './BarcodeScanner';

export default function ScanPage() {
  return (
    <div className="">
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
