'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ExerciseLog } from '@/app/types/types';
import { Timer, Flame, Eraser } from 'lucide-react';
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
import { FaWalking, FaRunning, FaSwimmer } from 'react-icons/fa';
import { GrYoga } from 'react-icons/gr';
import { Bike, Dumbbell, Plus, Mountain } from 'lucide-react';
import Link from 'next/link';

interface ExerciseLogCardProps {
  exerciseLogs: ExerciseLog[];
  className?: string;
  onDelete: (id: string) => Promise<void>;
  onDeleteSuccess?: () => Promise<void>;
  maxItems?: number;
}

// 아이콘 매핑 함수
const getExerciseIcon = (exerciseName: string) => {
  const iconMap = {
    걷기: FaWalking,
    달리기: FaRunning,
    수영: FaSwimmer,
    요가: GrYoga,
    자전거: Bike,
    웨이트: Dumbbell,
    등산: Mountain,
    직접입력: Plus,
  };
  return iconMap[exerciseName as keyof typeof iconMap];
};

export const ExerciseLogCard = ({
  exerciseLogs,
  className,
  onDelete,
  onDeleteSuccess,
  maxItems,
}: ExerciseLogCardProps) => {
  const displayLogs = maxItems ? exerciseLogs.slice(0, maxItems) : exerciseLogs;

  const formatTime = (dateString: string) => {
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
      console.error('Failed to delete exercise log:', error);
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold mb-3">오늘 한 운동</h3>
        <Link href="/exercise">
          <h3 className="font-semibold mb-3 text-gray-400">...더보기</h3>
        </Link>
      </div>
      <div className="space-y-4 min-h-28">
        {displayLogs.map((log) => {
          const IconComponent = getExerciseIcon(log.exercise_name);

          return (
            <div key={log.id} className="flex items-center gap-4  rounded-lg shadow-sm">
              <div className="relative min-h-28 aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-red-200">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                  {IconComponent ? (
                    <IconComponent className="w-12 h-12 text-gray-400" />
                  ) : (
                    <span className="text-xl font-semibold text-gray-600">
                      {log.exercise_name[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-full flex-1 flex flex-col">
                <div className="grid grid-cols-4 items-end tracking-tighter">
                  <p className="col-span-3 text-lg font-bold text-gray-900 line-clamp-1 ">
                    {log.exercise_name}
                  </p>
                  <p className="col-span-1 text-sm text-gray-600 text-end">
                    {formatTime(log.logged_at)}
                  </p>
                </div>
                <div className="flex items-center  tracking-tighter gap-1 ">
                  <div className="flex items-center gap-1">
                    <Flame size={16} color="#F87171" />
                    <div className="flex items-center gap-[2px]">
                      <p className=" text-gray-600 font-bold">{log.calories_burned}</p>
                      <span className="text-gray-600 text-xs">kcal</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center  tracking-tighter gap-1 ">
                  <div className="flex items-center gap-1">
                    <Timer size={16} className="text-blue-400" />
                    <div className="flex items-center gap-[2px]">
                      <p className="text-gray-500 font-bold">{log.duration_minutes}</p>
                      <span className="text-gray-500 text-xs">분</span>
                    </div>
                  </div>
                </div>

                {/* 삭제 버튼 */}
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
                        <AlertDialogTitle>운동 기록 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          {log.exercise_name} 기록을 삭제하시겠습니까?
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
          );
        })}
        {exerciseLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">오늘 기록된 운동이 없습니다</div>
        )}
      </div>
    </Card>
  );
};

export default ExerciseLogCard;
