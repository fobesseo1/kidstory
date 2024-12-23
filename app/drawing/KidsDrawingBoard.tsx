'use client';

import React, { useState, useRef, useEffect } from 'react';

const KidsDrawingBoard: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState<string>('#FF4B4B');
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasStartedDrawing, setHasStartedDrawing] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(() => {
    const neverShow = localStorage.getItem('neverShowDrawingGuide');
    return neverShow !== 'true';
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const colors: string[] = [
    '#FF4B4B', // 빨강
    '#FFD93D', // 노랑
    '#6BCB77', // 초록
    '#4D96FF', // 파랑
    '#FF6B6B', // 산호색
    '#9B72CF', // 보라
    '#000000', // 검정
    '#FFFFFF', // 하얀색 (지우개)
  ];

  const strokeWidths = [
    { size: 5, name: '가늘게' },
    { size: 15, name: '중간' },
    { size: 25, name: '굵게' },
  ];

  // 터치 이벤트 리스너 설정
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // 안내 메시지 타이머
  useEffect(() => {
    if (showGuide) {
      const timer = setTimeout(() => {
        setShowGuide(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showGuide]);

  // 캔버스 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth - 64; // 도구 영역 제외
      canvas.height = window.innerHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (!hasStartedDrawing) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    updateCanvasSize();
  }, [hasStartedDrawing]);

  // 화면 방향 잠금 함수
  const lockOrientation = async () => {
    try {
      // 1. 전체 화면 모드로 전환 시도
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }

      // 2. 화면 방향 잠금 시도
      const isLandscape = window.innerWidth > window.innerHeight;

      // screen.orientation API 사용 시도
      if ('orientation' in screen && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock(isLandscape ? 'landscape' : 'portrait');
        return true;
      }

      // 3. iOS Safari를 위한 대체 방법
      if ('webkitLockOrientation' in window.screen) {
        (window.screen as any).webkitLockOrientation(isLandscape ? 'landscape' : 'portrait');
        return true;
      }

      // 4. Mozilla 브라우저를 위한 대체 방법
      if ('mozLockOrientation' in window.screen) {
        (window.screen as any).mozLockOrientation(isLandscape ? 'landscape' : 'portrait');
        return true;
      }

      return false;
    } catch (error) {
      console.error('화면 잠금 실패:', error);
      return false;
    }
  };

  // 화면 방향 잠금 해제 함수
  const unlockOrientation = () => {
    try {
      // 1. 전체 화면 모드 해제
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      // 2. 화면 방향 잠금 해제
      if ('orientation' in screen && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      } else if ('webkitUnlockOrientation' in window.screen) {
        (window.screen as any).webkitUnlockOrientation();
      } else if ('mozUnlockOrientation' in window.screen) {
        (window.screen as any).mozUnlockOrientation();
      }
    } catch (error) {
      console.error('화면 잠금 해제 실패:', error);
    }
  };

  const startDrawing = async (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!hasStartedDrawing) {
      const locked = await lockOrientation();
      setHasStartedDrawing(true);
    }

    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    lastPoint.current = { x, y };

    if ('touches' in e) {
      e.preventDefault();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint.current) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    lastPoint.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const handleNeverShow = () => {
    localStorage.setItem('neverShowDrawingGuide', 'true');
    setShowGuide(false);
  };

  const clearCanvas = () => {
    if (window.confirm('그림을 모두 지울까요?')) {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !canvasRef.current) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasStartedDrawing(false);
      unlockOrientation();
    }
  };

  // 컴포넌트가 언마운트될 때 화면 잠금 해제
  useEffect(() => {
    return () => {
      if (hasStartedDrawing) {
        unlockOrientation();
      }
    };
  }, [hasStartedDrawing]);

  return (
    <div className="flex h-screen bg-blue-50">
      {/* 그리기 영역 */}
      <div className="flex-1 relative bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* 도구 영역 */}
      <div className="w-16 bg-white shadow-lg p-2 flex flex-col justify-start gap-4">
        {/* 색상 선택 */}
        <div className="grid grid-cols-2 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded-full border-2 ${
                selectedColor === color ? 'border-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`색상: ${color}`}
            />
          ))}
        </div>

        {/* 선 굵기 선택 */}
        <div className="flex flex-col gap-2">
          {strokeWidths.map((width) => (
            <button
              key={width.size}
              onClick={() => setStrokeWidth(width.size)}
              className={`p-1 rounded ${strokeWidth === width.size ? 'bg-blue-100' : ''}`}
            >
              <div
                className="bg-black rounded-full mx-auto"
                style={{
                  width: width.size,
                  height: width.size,
                }}
              />
            </button>
          ))}
        </div>

        {/* 전체 지우기 */}
        <button
          onClick={clearCanvas}
          className="w-full p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          🧹
        </button>
      </div>

      {/* 안내 메시지 */}
      {!hasStartedDrawing && showGuide && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          <div className="relative p-6 bg-blue-600 rounded-lg max-w-sm">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-700"
            >
              ✕
            </button>
            <p className="text-lg mb-4">화면을 원하는 방향으로 돌린 후 그리기를 시작하세요!</p>
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={handleNeverShow} className="text-sm underline hover:text-blue-200">
                다시 보지 않기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsDrawingBoard;
