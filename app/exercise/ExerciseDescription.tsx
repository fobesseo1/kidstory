'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Timer, Flame, Search, X, Bike, Dumbbell, Plus, Mountain } from 'lucide-react';
import { GrYoga } from 'react-icons/gr';
import { FaWalking, FaRunning, FaSwimmer } from 'react-icons/fa';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  exerciseDatabase,
  quickAccessExercises,
  Exercise,
  calculateCalories,
} from './exerciseDatabase';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SelectedExercise extends Exercise {
  duration: number;
  totalCalories: number;
}

interface ExerciseCard {
  exerciseName: string;
  duration: number;
  caloriesBurned: number;
}

export default function ExerciseDescription({ currentUser_id }: { currentUser_id: string }) {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise | null>(null);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customCaloriesPerHour, setCustomCaloriesPerHour] = useState<number>(0);
  const [showResultAlert, setShowResultAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 검색어에 따른 필터링된 운동 목록
  const filteredExercises = exerciseDatabase.filter((exercise) =>
    exercise.name.toLowerCase().includes(search.toLowerCase())
  );

  // 클릭 이벤트 감지하여 외부 클릭시 자동완성 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 운동 선택 시 처리
  const handleExerciseSelect = (exercise: Exercise) => {
    if (exercise.id === 'custom') {
      setSelectedExercise({
        ...exercise,
        name: '',
        duration: 0,
        totalCalories: 0,
      });
    } else {
      setSelectedExercise({
        ...exercise,
        duration: 0,
        totalCalories: 0,
      });
    }
    setShowSuggestions(false);
    setSearch('');
  };

  // 운동 시간 변경 처리
  const handleDurationChange = (value: string) => {
    if (!selectedExercise) return;

    const duration = value === '' ? 0 : parseInt(value);
    if (!isNaN(duration) && duration >= 0 && duration <= 999) {
      const totalCalories =
        selectedExercise.id === 'custom'
          ? calculateCalories(customCaloriesPerHour, duration)
          : calculateCalories(selectedExercise.caloriesPerHour, duration);

      setSelectedExercise({
        ...selectedExercise,
        duration,
        totalCalories,
      });
    }
  };

  // 직접 입력 운동명 변경 처리
  const handleCustomExerciseNameChange = (name: string) => {
    setCustomExerciseName(name);
    if (selectedExercise?.id === 'custom') {
      setSelectedExercise({
        ...selectedExercise,
        name,
      });
    }
  };

  // 직접 입력 시간당 칼로리 변경 처리
  const handleCustomCaloriesChange = (calories: number) => {
    setCustomCaloriesPerHour(calories);
    if (selectedExercise?.id === 'custom') {
      const totalCalories = calculateCalories(calories, selectedExercise.duration);
      setSelectedExercise({
        ...selectedExercise,
        caloriesPerHour: calories,
        totalCalories,
      });
    }
  };

  // 운동 초기화
  const resetDescription = () => {
    setSelectedExercise(null);
    setSearch('');
    setShowSuggestions(false);
    setCustomExerciseName('');
    setCustomCaloriesPerHour(0);
  };

  const successSave = () => {
    router.push('/main');
    return null;
  };

  // 운동 기록 저장
  const saveExerciseLog = async () => {
    if (!selectedExercise) return;

    try {
      const exerciseName =
        selectedExercise.id === 'custom' ? customExerciseName : selectedExercise.name;

      const { error: insertError } = await supabase.from('exercise_logs').insert({
        user_id: currentUser_id,
        logged_at: new Date().toISOString(),
        exercise_name: exerciseName,
        duration_minutes: selectedExercise.duration,
        calories_per_hour:
          selectedExercise.id === 'custom'
            ? customCaloriesPerHour
            : selectedExercise.caloriesPerHour,
        calories_burned: selectedExercise.totalCalories,
      });

      if (insertError) throw insertError;

      setShowResultAlert(true);
    } catch (error) {
      console.error('Error saving exercise log:', error);
      setError('저장 중 오류가 발생했습니다.');
      setShowResultAlert(true);
    }
  };

  const canSave =
    selectedExercise &&
    selectedExercise.duration > 0 &&
    (selectedExercise.id !== 'custom' ||
      (customExerciseName.trim() !== '' && customCaloriesPerHour > 0));

  // 아이콘 컴포넌트 매핑
  const getIconComponent = (iconName: string) => {
    const iconMap = {
      Walk: FaWalking,
      Run: FaRunning,
      Bike: Bike,
      Swim: FaSwimmer,
      Yoga: GrYoga,
      Dumbbell: Dumbbell,
      Plus: Plus,
      Mountain: Mountain,
    };
    return iconMap[iconName as keyof typeof iconMap];
  };

  return (
    <div className="w-full h-screen max-w-md p-4 py-12 flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-16 space-y-4">
        {/* 운동 검색 */}
        <Card className="p-4">
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Input
                type="text"
                placeholder="운동 검색..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {showSuggestions && search && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                {filteredExercises.length > 0 ? (
                  <ul className="py-1">
                    {filteredExercises.map((exercise) => (
                      <li
                        key={exercise.id}
                        onClick={() => handleExerciseSelect(exercise)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {exercise.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-2 text-gray-500">검색 결과가 없습니다</div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* 퀵 액세스 운동 버튼 */}
        {!selectedExercise && (
          <div className="grid grid-cols-2 gap-4">
            {quickAccessExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleExerciseSelect(exercise)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    {exercise.icon ? (
                      (() => {
                        const IconComponent = getIconComponent(exercise.icon);
                        return IconComponent ? (
                          <IconComponent className="w-6 h-6 text-gray-600" />
                        ) : (
                          exercise.name[0]
                        );
                      })()
                    ) : (
                      <span className="text-xl font-semibold text-gray-600">
                        {exercise.name[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{exercise.name}</p>
                    {exercise.id !== 'custom' && (
                      <p className="text-sm text-gray-500">{exercise.caloriesPerHour}kcal/h</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 선택된 운동 정보 */}
        {selectedExercise && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">운동 정보</h3>
            <div className="space-y-4">
              {/* 운동명 */}
              {selectedExercise.id === 'custom' ? (
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">운동명</label>
                  <Input
                    type="text"
                    value={customExerciseName}
                    onChange={(e) => handleCustomExerciseNameChange(e.target.value)}
                    placeholder="운동 이름을 입력하세요"
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-gray-900 text-lg">{selectedExercise.name}</p>
                  <button onClick={resetDescription} className="p-1 hover:bg-gray-100 rounded-full">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* 시간당 칼로리 (직접 입력일 경우) */}
              {selectedExercise.id === 'custom' && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">시간당 소모 칼로리</label>
                  <Input
                    type="number"
                    value={customCaloriesPerHour || ''}
                    onChange={(e) => handleCustomCaloriesChange(parseInt(e.target.value) || 0)}
                    placeholder="시간당 소모 칼로리를 입력하세요"
                    min={0}
                    className="w-full"
                  />
                </div>
              )}

              {/* 운동 시간 입력 */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">운동 시간 (분)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={selectedExercise.duration || ''}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    min={0}
                    max={999}
                    placeholder="0"
                    className="w-full text-lg"
                  />
                  <span className="text-gray-600">분</span>
                </div>
              </div>

              {/* 총 소모 칼로리 */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-6 h-6 text-red-400" />
                    <span className="text-gray-600">총 소모 칼로리</span>
                  </div>
                  <p className="text-xl font-bold">
                    {selectedExercise.totalCalories}{' '}
                    <span className="text-sm text-gray-600">kcal</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="absolute bottom-0 left-0 w-full px-6 pb-8 bg-white">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={resetDescription}
            className="w-full bg-gray-100 text-gray-900 rounded-xl py-4 text-lg font-medium"
          >
            다른 운동
          </button>
          <button
            onClick={saveExerciseLog}
            disabled={!canSave}
            className={`w-full ${
              canSave ? 'bg-black' : 'bg-gray-300'
            } text-white rounded-xl py-4 text-lg font-medium`}
          >
            저장하기
          </button>
        </div>
      </div>

      {/* 저장 결과 Alert */}
      <AlertDialog open={showResultAlert} onOpenChange={setShowResultAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{error ? '저장 실패' : '저장 완료'}</AlertDialogTitle>
            <AlertDialogDescription>
              {error ? error : '운동 정보가 성공적으로 저장되었습니다.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={successSave}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
