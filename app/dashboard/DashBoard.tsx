'use client';

import { useEffect, useState } from 'react';
import createSupabaseBrowserClient from '@/lib/supabse/client';

export type DailyStatus = {
  totalCalories: number;
  remainingCalories: number;
  totalExerciseMinutes: number;
  remainingExerciseMinutes: number;
  protein: number;
  fat: number;
  carbs: number;
};

export default function DashboardPage({ currentUser_id }: { currentUser_id: string }) {
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  const fetchDailyStatus = async () => {
    try {
      const response = await fetch('/api/daily-status');
      if (!response.ok) throw new Error('Failed to fetch daily status');
      const data = await response.json();
      setDailyStatus(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyStatus();

    // 실시간 업데이트 구독
    const foodChannel = supabase
      .channel('food_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_logs' }, () =>
        fetchDailyStatus()
      )
      .subscribe();

    const exerciseChannel = supabase
      .channel('exercise_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exercise_logs' }, () =>
        fetchDailyStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(foodChannel);
      supabase.removeChannel(exerciseChannel);
    };
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (!dailyStatus) return <div>No data available</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">오늘의 건강 현황</h1>

      {/* 칼로리 섹션 */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">칼로리</h2>
        <div className="space-y-2">
          <p>섭취한 칼로리: {dailyStatus.totalCalories}kcal</p>
          <p>남은 칼로리: {dailyStatus.remainingCalories}kcal</p>
        </div>
      </div>

      {/* 운동 섹션 */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">운동</h2>
        <div className="space-y-2">
          <p>완료한 운동 시간: {dailyStatus.totalExerciseMinutes}분</p>
          <p>남은 운동 시간: {dailyStatus.remainingExerciseMinutes}분</p>
        </div>
      </div>

      {/* 영양소 섹션 */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">영양소</h2>
        <div className="space-y-2">
          <p>단백질: {dailyStatus.protein}g</p>
          <p>지방: {dailyStatus.fat}g</p>
          <p>탄수화물: {dailyStatus.carbs}g</p>
        </div>
      </div>
    </div>
  );
}
