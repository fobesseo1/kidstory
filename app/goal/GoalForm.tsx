// app/goal/GoalForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { HealthCalculator } from '../health-info/HealthCalculator';

interface HealthRecord {
  gender: string;
  workout_frequency: string;
  height: number;
  weight: number;
  birth_date: string;
  bmr: number;
  bmi: number;
  bmi_status: string;
}

interface GoalInputs {
  targetWeight?: number;
  targetDuration?: number;
}

const GoalForm = ({ currentUser_id }: { currentUser_id: string }) => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [goalInputs, setGoalInputs] = useState<GoalInputs>({});
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const slides = [
    {
      id: 'initial',
      title: '현재 건강 상태',
      subtitle: '입력하신 정보를 바탕으로 한 현재 상태입니다',
      type: 'status',
    },
    {
      id: 'goal-setting',
      title: '목표 설정',
      subtitle: '목표 체중과 기간을 설정해주세요',
      type: 'goal-inputs',
    },
    {
      id: 'result',
      title: '분석 결과',
      subtitle: '설정하신 목표 달성을 위한 일일 권장량입니다',
      type: 'result',
    },
  ];

  useEffect(() => {
    const fetchHealthRecord = async () => {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', currentUser_id)
        .single();

      if (error) {
        console.error('Error fetching health record:', error);
        return;
      }

      setHealthRecord(data);
    };

    fetchHealthRecord();
  }, [currentUser_id, supabase]);

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // handleBack 함수 추가
  const handleBack = () => {
    if (currentSlide === 0) {
      router.push('/question');
    } else {
      setCurrentSlide(currentSlide - 1);
      setError(null);
      if (currentSlide === 1) {
        // 목표 설정 화면에서 뒤로 가면 목표 선택 초기화
        setGoalInputs({});
      }
    }
  };

  const validateGoalInputs = (): string | null => {
    if (!healthRecord || !goalInputs.targetWeight || !goalInputs.targetDuration) return null;

    const weightDiff = Math.abs(healthRecord.weight - goalInputs.targetWeight);
    if (weightDiff > healthRecord.weight * 0.15) {
      return '한 번에 현재 체중의 15% 이상 변화는 건강하지 않을 수 있습니다.';
    }

    const weeklyChange = weightDiff / goalInputs.targetDuration;
    if (weeklyChange > 0.75) {
      return '주당 0.75kg 이상의 체중 변화는 건강하지 않을 수 있습니다.';
    }

    return null;
  };

  const calculateResults = () => {
    if (!healthRecord) return;

    const age = calculateAge(healthRecord.birth_date);
    const result = HealthCalculator.calculateNutrition({
      age,
      gender: healthRecord.gender as 'male' | 'female',
      height: healthRecord.height,
      weight: healthRecord.weight,
      activityLevel: healthRecord.workout_frequency as any,
      goal: selectedGoal as any,
      targetWeight: goalInputs.targetWeight,
      targetDuration: goalInputs.targetDuration,
    });

    setCalculationResult(result);
    setCurrentSlide(currentSlide + 1);
  };

  const handleNext = () => {
    if (currentSlide === 0 && selectedGoal === 'maintain') {
      calculateResults();
      return;
    }

    if (currentSlide === 1) {
      const error = validateGoalInputs();
      if (error) {
        setError(error);
        return;
      }
      calculateResults();
      return;
    }

    if (currentSlide === 2) {
      // Save goals and navigate to main
      router.push('/main');
      return;
    }

    setCurrentSlide(currentSlide + 1);
    setError(null);
  };

  // 첫 번째 화면: 현재 상태 + 목표 선택
  const renderCurrentStatus = () => {
    if (!healthRecord) return null;

    return (
      <div className="space-y-6">
        {/* 현재 상태 표시 */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium text-lg mb-2">기본 정보</div>
            <div className="space-y-2">
              <div>나이: {calculateAge(healthRecord.birth_date)}세</div>
              <div>성별: {healthRecord.gender === 'male' ? '남성' : '여성'}</div>
              <div>신장: {healthRecord.height}cm</div>
              <div>체중: {healthRecord.weight}kg</div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium text-lg mb-2">신체 상태</div>
            <div className="space-y-2">
              <div>BMI: {healthRecord.bmi.toFixed(1)}</div>
              <div>상태: {healthRecord.bmi_status}</div>
              <div>기초대사량: {healthRecord.bmr.toLocaleString()} kcal</div>
            </div>
          </div>
        </div>

        {/* 목표 선택 버튼들 */}
        <div className="space-y-3">
          <div className="font-medium text-lg">목표 선택</div>
          {[
            {
              value: 'maintain',
              label: '현재 체중 유지',
              description: '현재 체중을 건강하게 유지',
            },
            { value: 'lose', label: '체중 감량', description: '건강한 체중 감량' },
            { value: 'gain', label: '근육량 증가', description: '건강한 근육량 증가' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedGoal(option.value)}
              className={`w-full p-4 rounded-xl text-left transition-all
                ${
                  selectedGoal === option.value ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
                }`}
            >
              <div className="font-medium">{option.label}</div>
              <div
                className={`text-sm ${
                  selectedGoal === option.value ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 두 번째 화면: 목표 설정 (체중 유지 제외)
  const renderGoalInputs = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">목표 체중 (kg)</label>
            <div className="relative">
              <input
                type="number"
                className="w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg"
                value={goalInputs.targetWeight || ''}
                onChange={(e) =>
                  setGoalInputs((prev) => ({
                    ...prev,
                    targetWeight: Number(e.target.value),
                  }))
                }
                step="0.1"
                min={healthRecord ? healthRecord.weight * 0.85 : 0}
                max={healthRecord ? healthRecord.weight * 1.15 : 100}
                placeholder="목표 체중을 입력하세요"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">kg</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">목표 기간 (주)</label>
            <div className="relative">
              <input
                type="number"
                className="w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg"
                value={goalInputs.targetDuration || ''}
                onChange={(e) =>
                  setGoalInputs((prev) => ({
                    ...prev,
                    targetDuration: Number(e.target.value),
                  }))
                }
                min="1"
                max="52"
                placeholder="1-52주 사이로 입력하세요"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">주</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 rounded-xl text-red-600">
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  };

  // 결과 화면 렌더링 함수...
  const renderResult = () => {
    if (!calculationResult) return null;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="font-medium text-lg mb-2">기초대사량 (BMR)</div>
          <div className="text-2xl font-bold">{calculationResult.bmr.toLocaleString()} kcal</div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="font-medium text-lg mb-2">일일 권장 칼로리</div>
          <div className="text-2xl font-bold">
            {calculationResult.totalCalories.toLocaleString()} kcal
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium">단백질</div>
            <div className="text-xl font-bold">{calculationResult.protein}g</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium">지방</div>
            <div className="text-xl font-bold">{calculationResult.fat}g</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium">탄수화물</div>
            <div className="text-xl font-bold">{calculationResult.carbs}g</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium">물 섭취량</div>
            <div className="text-xl font-bold">{calculationResult.waterIntake}ml</div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="font-medium">권장 운동 시간</div>
          <div className="text-xl font-bold">하루 {calculationResult.exerciseMinutes}분</div>
        </div>

        {calculationResult.weightChangePerWeek !== 0 && (
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="font-medium">주간 목표 변화량</div>
            <div className="text-xl font-bold">
              {Math.abs(calculationResult.weightChangePerWeek).toFixed(2)}kg/
              {calculationResult.weightChangePerWeek > 0 ? '증량' : '감량'}
            </div>
          </div>
        )}

        {calculationResult.healthWarnings && calculationResult.healthWarnings.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
            <p className="font-medium">⚠️ 건강 관리 참고사항</p>
            {calculationResult.healthWarnings.map((warning: string, index: number) => (
              <p key={index}>{warning}</p>
            ))}
          </div>
        )}

        {calculationResult.recommendations && calculationResult.recommendations.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-700">
            <p className="font-medium">💡 권장사항</p>
            {calculationResult.recommendations.map((recommendation: string, index: number) => (
              <p key={index}>{recommendation}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!healthRecord) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 헤더 및 프로그레스 바 */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300 ease-out"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="px-4 py-6"
        >
          <h1 className="text-2xl font-semibold">{slides[currentSlide].title}</h1>
          <p className="text-gray-500 text-sm mt-2">{slides[currentSlide].subtitle}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
          >
            {currentSlide === 0 && renderCurrentStatus()}
            {currentSlide === 1 && renderGoalInputs()}
            {currentSlide === 2 && renderResult()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 버튼 */}
      <div className="p-4">
        <button
          onClick={handleNext}
          disabled={
            !selectedGoal ||
            (currentSlide === 1 && (!goalInputs.targetWeight || !goalInputs.targetDuration))
          }
          className={`w-full py-4 rounded-xl text-lg font-medium transition-all
            ${
              !selectedGoal ||
              (currentSlide === 1 && (!goalInputs.targetWeight || !goalInputs.targetDuration))
                ? 'bg-gray-100 text-gray-400'
                : 'bg-black text-white'
            }`}
        >
          {currentSlide === slides.length - 1 ? '완료' : '다음'}
        </button>
      </div>
    </div>
  );
};

export default GoalForm;
