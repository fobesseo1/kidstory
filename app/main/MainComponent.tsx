'use client';

import React from 'react';
import CurrentWeekCalendar from './CurrentWeekCalendar';
import NutritionCard from '../components/shared/ui/NutritionCard';
import FoodLogCard from '../components/shared/ui/FoodLogCard';
import ExerciseLogCard from '../components/shared/ui/ExerciseLogCard';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { getKoreanDateRange } from '@/lib/utils/dateAudit';
import { FoodLog, ExerciseLog } from '../types/types';

export type DailyStatus = {
  totalCalories: number;
  remainingCalories: number;
  totalExerciseMinutes: number;
  remainingExerciseMinutes: number;
  remainingProtein: number;
  remainingFat: number;
  remainingCarbs: number;
};

export default function MainComponent() {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [dailyStatus, setDailyStatus] = React.useState<DailyStatus | null>(null);
  const [foodLogs, setFoodLogs] = React.useState<FoodLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = React.useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const supabase = createSupabaseBrowserClient();

  // 선택된 날짜의 시작과 끝 시간을 가져오는 함수
  const getSelectedDateRange = (date: Date) => {
    const koreanDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const start = new Date(koreanDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(koreanDate);
    end.setHours(23, 59, 59, 999);

    return {
      utcStart: start,
      utcEnd: end,
    };
  };

  // 데이터 fetch 함수
  const fetchData = React.useCallback(
    async (date: Date) => {
      try {
        setIsLoading(true);
        // API 요청 시 선택된 날짜 정보 전달
        const response = await fetch(`/api/daily-status?date=${date.toISOString()}`);
        const statusData = await response.json();
        setDailyStatus(statusData);

        const { utcStart, utcEnd } = getSelectedDateRange(date);

        // Fetch food logs for selected date
        const { data: foodData } = await supabase
          .from('food_logs')
          .select('*')
          .gte('logged_at', utcStart.toISOString())
          .lte('logged_at', utcEnd.toISOString())
          .order('logged_at', { ascending: false });

        if (foodData) {
          setFoodLogs(foodData as FoodLog[]);
        }

        // Fetch exercise logs for selected date
        const { data: exerciseData } = await supabase
          .from('exercise_logs')
          .select('*')
          .gte('logged_at', utcStart.toISOString())
          .lte('logged_at', utcEnd.toISOString())
          .order('logged_at', { ascending: false });

        if (exerciseData) {
          setExerciseLogs(exerciseData as ExerciseLog[]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  // 날짜가 변경될 때마다 데이터 다시 불러오기
  React.useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleFoodDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('food_logs').delete().eq('id', id);
      if (error) throw error;
      setFoodLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));
      await updateDailyStatus(); // 삭제 후 상태 업데이트
    } catch (error) {
      console.error('Error deleting food log:', error);
    }
  };

  const handleExerciseDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('exercise_logs').delete().eq('id', id);
      if (error) throw error;
      setExerciseLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));
      await updateDailyStatus(); // 삭제 후 상태 업데이트
    } catch (error) {
      console.error('Error deleting exercise log:', error);
    }
  };

  const updateDailyStatus = async () => {
    await fetchData(selectedDate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen min-w-screen flex flex-col overflow-hidden">
      <div className="w-full aspect-square py-12 px-6 flex flex-col space-y-6">
        <div className="flex flex-col space-y-6">
          <CurrentWeekCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
          <NutritionCard
            title={`${selectedDate.toLocaleDateString('ko-KR')} 남은 식사량`}
            nutrition={{
              calories: dailyStatus?.remainingCalories || 0,
              protein: dailyStatus?.remainingProtein || 0,
              fat: dailyStatus?.remainingFat || 0,
              carbs: dailyStatus?.remainingCarbs || 0,
            }}
          />
        </div>

        <div className="flex flex-col space-y-6">
          <div className="relative w-full">
            <div className="min-h-[162px]">
              <FoodLogCard
                foodLogs={foodLogs}
                onDelete={handleFoodDelete}
                onDeleteSuccess={updateDailyStatus}
                maxItems={3}
              />
            </div>
          </div>

          <div className="relative w-full">
            <div className="min-h-[162px]">
              <ExerciseLogCard
                exerciseLogs={exerciseLogs}
                onDelete={handleExerciseDelete}
                onDeleteSuccess={updateDailyStatus}
                maxItems={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
