// components/shared/ui/FoodLogCard.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { FoodLog } from '@/app/types/types'; // 기존 타입 임포트
import { Beef, Droplet, Eraser, Flame, Pencil, Wheat } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

interface FoodLogCardProps {
  foodLogs: FoodLog[];
  className?: string;
  onDelete: (id: string) => Promise<void>;
  onDeleteSuccess?: () => Promise<void>;
  maxItems?: number;
}

export const FoodLogCard = ({
  foodLogs,
  className,
  onDelete,
  onDeleteSuccess,
  maxItems,
}: FoodLogCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const displayLogs = maxItems ? foodLogs.slice(0, maxItems) : foodLogs;

  const formatTime = (dateString: string) => {
    // UTC 시간을 한국 시간으로 변환하여 표시
    const date = new Date(dateString);
    const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

    return kstDate.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      if (onDeleteSuccess) {
        await onDeleteSuccess();
      }
    } catch (error) {
      console.error('Failed to delete food log:', error);
    }
  };

  return (
    <Card className={`p-4 ${className} `}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold mb-3 ">오늘 먹은 음식</h3>
        <Link href="/start">
          <h3 className=" font-semibold mb-3 text-gray-400 ">...더보기</h3>
        </Link>
      </div>
      <div className="space-y-4 min-h-28 ">
        {displayLogs.map((log) => (
          <div key={log.id} className="flex items-center gap-4  rounded-lg shadow-sm">
            <div className="relative min-h-28 aspect-square rounded-lg overflow-hidden">
              {log.image_url ? ( // null 체크 추가
                <Image
                  src={log.image_url}
                  alt={log.food_name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>
            <div className="h-full flex-1 flex flex-col  ">
              <div className="grid grid-cols-4  items-end tracking-tighter  ">
                <p className="col-span-3 text-lg font-bold text-gray-900 line-clamp-1 ">
                  {log.food_name}
                </p>

                <p className="col-span-1 text-sm text-gray-900 text-end">
                  {formatTime(log.logged_at)}
                </p>
              </div>
              <div className="flex items-center  tracking-tighter gap-1 ">
                <Flame size={16} color="#F87171" />
                <div className="flex items-center gap-[2px]">
                  <p className=" text-gray-600 font-bold">{log.calories}</p>
                  <span className="text-gray-600 text-xs">kcal</span>
                </div>
              </div>
              <div className="flex justify-between items-center tracking-tighter text-sm gap-1 ">
                <div className="flex items-center tracking-tighter gap-1">
                  <Beef size={16} color="#F472B6" />
                  <div className="flex items-center gap-[2px]">
                    <p className=" text-gray-600 font-bold">{log.protein}</p>
                    <span className="text-gray-600 text-xs">g</span>
                  </div>
                </div>
                <div className="flex items-center tracking-tighter gap-1">
                  <Droplet size={16} color="#94A3B8" />
                  <div className="flex items-center gap-[2px]">
                    <p className=" text-gray-600 font-bold">{log.fat}</p>
                    <span className="text-gray-600 text-xs">g</span>
                  </div>
                </div>
                <div className="flex items-center tracking-tighter gap-1">
                  <Wheat size={16} color="#EAB308" />
                  <div className="flex items-center gap-[2px]">
                    <p className=" text-gray-600 font-bold">{log.carbs}</p>
                    <span className="text-gray-600 text-xs">g</span>
                  </div>
                </div>
              </div>

              {/* 수정버튼 */}
              <div className="w-full mt-3 flex justify-end items-center ">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div className="py-1 px-3 bg-red-50 flex justify-center items-center gap-1 cursor-pointer rounded-lg  hover:bg-red-600">
                      <Eraser size={16} color="#f87171" />
                      <p className="text-sm text-red-400 ho">삭제</p>
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>음식 기록 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        {log.food_name}을(를) 삭제하시겠습니까?
                        <br />
                        삭제된 기록은 복구할 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>돌아가기</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(log.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        삭제하기
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
        {foodLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">오늘 기록된 음식이 없습니다</div>
        )}
      </div>
    </Card>
  );
};

export default FoodLogCard;
