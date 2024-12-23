'use client';

import React, { useState, useRef, useEffect } from 'react';

// 타입 정의
type Tool = 'crayon' | 'pencil' | 'eraser';

interface Point {
  x: number;
  y: number;
}

interface ToolOption {
  id: Tool;
  name: string;
  icon: string;
}

interface StrokeWidth {
  size: number;
  name: string;
}

// 메인 드로잉 보드 컴포넌트
const KidsDrawingBoard: React.FC = () => {
  // 상태 관리
  const [selectedTool, setSelectedTool] = useState<Tool>('crayon');
  const [selectedColor, setSelectedColor] = useState<string>('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Canvas 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // 기본 색상 팔레트
  const colors: string[] = [
    '#FF0000',
    '#FF6B00',
    '#FFD700',
    '#4CAF50',
    '#2196F3',
    '#3F51B5',
    '#9C27B0',
    '#795548',
    '#000000',
    '#FF69B4',
    '#00FF00',
    '#FFFFFF',
  ];

  // 도구 설정
  const tools: ToolOption[] = [
    { id: 'crayon', name: '크레파스', icon: '🖍️' },
    { id: 'pencil', name: '색연필', icon: '✏️' },
    { id: 'eraser', name: '지우개', icon: '🧽' },
  ];

  // 선 굵기 옵션
  const strokeWidths: StrokeWidth[] = [
    { size: 5, name: '가늘게' },
    { size: 10, name: '중간' },
    { size: 15, name: '굵게' },
  ];

  // Canvas 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = context;
  }, []);

  // 포인트 계산 함수
  const calculatePoint = (clientX: number, clientY: number): Point => {
    if (!canvasRef.current) {
      return { x: 0, y: 0 };
    }
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const point = calculatePoint(e.clientX, e.clientY);
    setIsDrawing(true);
    setLastPoint(point);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!isDrawing || !lastPoint || !contextRef.current) return;

    const point = calculatePoint(e.clientX, e.clientY);
    draw(lastPoint, point);
  };

  const handleMouseUp = (): void => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>): void => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const point = calculatePoint(touch.clientX, touch.clientY);
      setIsDrawing(true);
      setLastPoint(point);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>): void => {
    e.preventDefault();
    if (!isDrawing || !lastPoint || !contextRef.current || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const point = calculatePoint(touch.clientX, touch.clientY);
    draw(lastPoint, point);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>): void => {
    e.preventDefault();
    setIsDrawing(false);
    setLastPoint(null);
  };

  // 실제 그리기 함수
  const draw = (from: Point, to: Point): void => {
    if (!contextRef.current) return;

    const context = contextRef.current;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.strokeStyle = selectedTool === 'eraser' ? '#FFFFFF' : selectedColor;
    context.lineWidth = strokeWidth;
    context.stroke();

    setLastPoint(to);
  };

  // 전체 지우기
  const clearCanvas = (): void => {
    if (!canvasRef.current || !contextRef.current) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  // 캔버스 크기 조절 핸들러
  const handleResize = (): void => {
    if (!canvasRef.current || !contextRef.current) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;

    // 현재 캔버스 내용 저장
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    if (!tempContext) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempContext.drawImage(canvas, 0, 0);

    // 캔버스 크기 조절
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // 이전 설정 복원
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // 이전 내용 복원
    context.drawImage(tempCanvas, 0, 0);
  };

  // 윈도우 리사이즈 이벤트 리스너
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 캔버스 영역 */}
      <div className="flex-1 relative bg-white border-2 border-gray-300 rounded-lg m-4">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* 도구 선택 영역 */}
      <div className="bg-white p-4 shadow-lg">
        {/* 도구 선택 */}
        <div className="flex justify-around mb-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`p-2 rounded-full ${selectedTool === tool.id ? 'bg-blue-100' : ''}`}
              aria-label={tool.name}
            >
              <span className="text-2xl">{tool.icon}</span>
            </button>
          ))}
        </div>

        {/* 색상 선택 */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-10 h-10 rounded-full border-2 ${
                selectedColor === color ? 'border-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`색상: ${color}`}
            />
          ))}
        </div>

        {/* 선 굵기 선택 */}
        <div className="flex justify-around">
          {strokeWidths.map((width) => (
            <button
              key={width.size}
              onClick={() => setStrokeWidth(width.size)}
              className={`p-2 rounded ${strokeWidth === width.size ? 'bg-blue-100' : ''}`}
              aria-label={`선 굵기: ${width.name}`}
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

        {/* 전체 지우기 버튼 */}
        <button
          onClick={clearCanvas}
          className="mt-4 w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          aria-label="전체 지우기"
        >
          전체 지우기
        </button>
      </div>
    </div>
  );
};

export default KidsDrawingBoard;
