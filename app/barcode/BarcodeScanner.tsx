'use client';

import { useZxing } from 'react-zxing';
import { useState, useEffect } from 'react';

interface BarcodeScannerProps {
  onScanSuccess?: (result: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess }) => {
  const [result, setResult] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { ref } = useZxing({
    onDecodeResult(result) {
      const scannedText = result.getText();
      setResult(scannedText);

      // 스캔 성공 시 햅틱 피드백
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }

      // 외부 콜백 실행
      onScanSuccess?.(scannedText);
    },
    onError(error) {
      console.error('스캐너 오류:', error);
    },
  });

  useEffect(() => {
    // 카메라 권한 확인
    const checkPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
      } catch (error) {
        console.error('카메라 권한 오류:', error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, []);

  if (isLoading) {
    return <div>카메라 초기화 중...</div>;
  }

  if (!hasPermission) {
    return (
      <div className="error-container">
        <p>카메라 접근 권한이 필요합니다.</p>
        <button onClick={() => window.location.reload()}>권한 다시 요청</button>
      </div>
    );
  }

  return (
    <div className="scanner-container">
      <div className="video-container">
        <video ref={ref} />
      </div>
      <p>처리</p>
      {result && (
        <div className="result-container">
          <p>스캔 결과: {result}</p>
          <button onClick={() => setResult('')}>다시 스캔</button>
        </div>
      )}

      <style jsx>{`
        .scanner-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        .video-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
        }
        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .result-container {
          margin-top: 1rem;
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .error-container {
          padding: 1rem;
          color: #721c24;
          background-color: #f8d7da;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
