// app/exercise/exerciseDatabase.ts

import { FaWalking, FaRunning, FaSwimmer } from 'react-icons/fa';
import { GrYoga } from 'react-icons/gr';
import { Bike, Dumbbell, Plus, Mountain } from 'lucide-react';

export interface Exercise {
  id: string;
  name: string;
  caloriesPerHour: number;
  icon?: string;
}

// 자주 사용되는 운동 목록 (퀵 액세스용)
export const quickAccessExercises: Exercise[] = [
  {
    id: 'walking',
    name: '걷기',
    caloriesPerHour: 250,
    icon: 'Walk',
  },
  {
    id: 'running',
    name: '달리기',
    caloriesPerHour: 600,
    icon: 'Run',
  },
  {
    id: 'cycling',
    name: '자전거',
    caloriesPerHour: 400,
    icon: 'Bike',
  },
  {
    id: 'swimming',
    name: '수영',
    caloriesPerHour: 500,
    icon: 'Swim',
  },
  {
    id: 'weightlifting',
    name: '웨이트',
    caloriesPerHour: 350,
    icon: 'Dumbbell',
  },
  {
    id: 'yoga',
    name: '요가',
    caloriesPerHour: 200,
    icon: 'Yoga',
  },

  {
    id: 'custom',
    name: '직접입력',
    caloriesPerHour: 0,
    icon: 'Plus',
  },
];

// 전체 운동 데이터베이스
export const exerciseDatabase: Exercise[] = [
  ...quickAccessExercises,
  {
    id: 'hiking',
    name: '등산',
    caloriesPerHour: 450,
    icon: 'Mountain',
  },
  {
    id: 'basketball',
    name: '농구',
    caloriesPerHour: 450,
  },
  {
    id: 'tennis',
    name: '테니스',
    caloriesPerHour: 400,
  },
  {
    id: 'dancing',
    name: '댄스',
    caloriesPerHour: 350,
  },
];

// 칼로리 계산 헬퍼 함수
export const calculateCalories = (caloriesPerHour: number, durationMinutes: number): number => {
  return Math.round((caloriesPerHour / 60) * durationMinutes);
};

// 아이콘 매핑 함수 추가
export const getExerciseIcon = (iconName: string | undefined) => {
  if (!iconName) return null;

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

// 운동 ID로 운동 정보 찾기
export const findExerciseById = (id: string): Exercise | undefined => {
  return exerciseDatabase.find((exercise) => exercise.id === id);
};
