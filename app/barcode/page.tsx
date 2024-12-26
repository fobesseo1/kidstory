import BarcodeReader from './BarcodeReader';
import CameraComponent from './BarcodeCamera';
import BarcodeScanner from './BarcodeScanner';
// import dynamic from 'next/dynamic';

// const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), {
//   ssr: false,
// });

export default function BarcodePage() {
  // const handleScanSuccess = (result: string) => {
  //   // 스캔 결과 처리
  //   console.log('스캔된 바코드:', result);
  // };
  return (
    <div>
      <p>cjflcjfl</p>
      {/* <BarcodeReader /> */}
      {/* <CameraComponent /> */}
      <BarcodeScanner />
    </div>
  );
}

//https://www.data.go.kr/data/15064775/openapi.do
