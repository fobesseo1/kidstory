'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronLeft, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { HealthCalculator, type UserInput, type NutritionResult } from './HealthCalculatorBene';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

const HealthCalculateFormBene = ({ currentUser_id }: { currentUser_id: string }) => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState<UserInput>({
    age: 30,
    gender: 'male',
    height: 170,
    weight: 70,
    activityLevel: 'sedentary',
    goal: 'maintain',
    targetWeight: undefined,
    targetDuration: undefined,
  });
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showWarnings, setShowWarnings] = useState(true);

  // health_records에서 데이터 가져오기
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
      // 가져온 데이터로 formData 업데이트
      const birthDate = new Date(data.birth_date);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      setFormData((prev) => ({
        ...prev,
        age,
        gender: data.gender as 'male' | 'female',
        height: data.height,
        weight: data.weight,
        activityLevel: data.workout_frequency as any,
      }));
    };

    fetchHealthRecord();
  }, [currentUser_id, supabase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedResult = HealthCalculator.calculateNutrition(formData);
    setResult(calculatedResult);

    // 경고나 권장사항이 있으면 다이얼로그 표시
    if (calculatedResult.healthWarnings.length > 0 || calculatedResult.recommendations.length > 0) {
      setShowWarningDialog(true);
    } else {
      setCurrentSlide(1);
    }
  };

  const handleBack = () => {
    if (currentSlide === 0) {
      router.back();
    } else {
      setCurrentSlide(0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        value === ''
          ? undefined
          : ['targetWeight', 'targetDuration'].includes(name)
          ? Number(value)
          : value,
    }));
  };

  const handleSave = async () => {
    if (!result) return;

    try {
      const goalData = {
        user_id: currentUser_id,
        goal_type: formData.goal,
        target_weight: formData.targetWeight,
        target_date: new Date(
          Date.now() + (formData.targetDuration || 0) * 7 * 24 * 60 * 60 * 1000
        ),
        daily_calories_target: result.totalCalories,
        daily_protein_target: result.protein,
        daily_fat_target: result.fat,
        daily_carbs_target: result.carbs,
        daily_exercise_minutes_target: result.exerciseMinutes,
        status: 'active',
      };

      const { error } = await supabase.from('fitness_goals').insert([goalData]);

      if (error) throw error;

      // 저장 성공 후 메인 페이지로 이동
      router.push('/main');
    } catch (error) {
      console.error('Error saving goal:', error);
      // 에러 처리 (토스트 메시지 등)
    }
  };

  const slides = [
    {
      id: 'input',
      title: '목표 설정',
      subtitle: '목표 체중과 기간을 입력해주세요',
    },
    {
      id: 'result',
      title: '분석 결과',
      subtitle: '입력하신 정보를 바탕으로 분석한 결과입니다.',
    },
  ];

  if (!healthRecord) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header - Back button and Progress bar */}
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

      {/* Title Section */}
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

      {/* Content Section */}
      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
          >
            {currentSlide === 0 ? (
              // 입력 폼
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 현재 상태 표시 */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="font-medium text-lg mb-2">현재 신체 정보</div>
                    <div className="space-y-2">
                      <div>키: {healthRecord.height}cm</div>
                      <div>체중: {healthRecord.weight}kg</div>
                      <div>
                        BMI: {healthRecord.bmi.toFixed(1)} ({healthRecord.bmi_status})
                      </div>
                    </div>
                  </div>
                </div>

                {/* 목표 입력 */}
                <div className="space-y-4">
                  <select
                    name="goal"
                    className="w-full p-4 rounded-xl bg-gray-50"
                    value={formData.goal}
                    onChange={handleInputChange}
                  >
                    <option value="maintain">현재 체중 유지</option>
                    <option value="lose">체중 감량</option>
                    <option value="gain">근육량 증가</option>
                  </select>

                  {formData.goal !== 'maintain' && (
                    <>
                      <div className="relative">
                        <input
                          type="number"
                          name="targetWeight"
                          className="w-full p-4 rounded-xl bg-gray-50"
                          value={formData.targetWeight || ''}
                          onChange={handleInputChange}
                          placeholder="목표 체중을 입력하세요"
                          step="0.1"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                          kg
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          name="targetDuration"
                          className="w-full p-4 rounded-xl bg-gray-50"
                          value={formData.targetDuration || ''}
                          onChange={handleInputChange}
                          placeholder="목표 기간을 입력하세요"
                          min="1"
                          max="52"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                          주
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-black text-white text-lg font-medium"
                >
                  계산하기
                </button>
              </form>
            ) : (
              // 결과 표시
              <div className="space-y-4">
                {result && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="font-medium text-lg mb-2">기초대사량 (BMR)</div>
                      <div className="text-2xl font-bold">{result.bmr.toLocaleString()} kcal</div>
                      <div className="text-sm text-gray-500 mt-1">
                        하루 동안 생명 유지에 필요한 최소한의 에너지량
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="font-medium text-lg mb-2">일일 권장 칼로리</div>
                      <div className="text-2xl font-bold">
                        {result.totalCalories.toLocaleString()} kcal
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="font-medium">단백질</div>
                        <div className="text-xl font-bold">{result.protein}g</div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="font-medium">지방</div>
                        <div className="text-xl font-bold">{result.fat}g</div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="font-medium">탄수화물</div>
                        <div className="text-xl font-bold">{result.carbs}g</div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="font-medium">물 섭취량</div>
                        <div className="text-xl font-bold">{result.waterIntake}ml</div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="font-medium">권장 운동 시간</div>
                      <div className="text-xl font-bold">하루 {result.exerciseMinutes}분</div>
                    </div>
                    {result.weightChangePerWeek !== 0 && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                        <div className="font-medium">주간 목표 변화량</div>
                        <div className="text-xl">
                          {Math.abs(result.weightChangePerWeek).toFixed(2)}kg/
                          {result.weightChangePerWeek > 0 ? '증량' : '감량'}
                        </div>
                      </div>
                    )}
                    {showWarnings &&
                      result.recommendations &&
                      result.recommendations.length > 0 && (
                        <Alert className="mt-4">
                          <Info className="h-4 w-4" />
                          <AlertTitle>권장사항</AlertTitle>
                          {result.recommendations.map((recommendation, index) => (
                            <AlertDescription key={index}>{recommendation}</AlertDescription>
                          ))}
                        </Alert>
                      )}
                    {showWarnings && result.healthWarnings && result.healthWarnings.length > 0 && (
                      <Alert className="mt-4" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>건강 관리 참고사항</AlertTitle>
                        {result.healthWarnings.map((warning, index) => (
                          <AlertDescription key={index}>{warning}</AlertDescription>
                        ))}
                      </Alert>
                    )}

                    <div className="mt-6">
                      <button
                        onClick={handleSave}
                        className="w-full py-4 rounded-xl bg-black text-white text-lg font-medium"
                      >
                        저장하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>건강한 목표 설정 검토</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {result?.healthWarnings && result.healthWarnings.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-red-600">⚠️ 건강 관리 참고사항:</p>
                  {result.healthWarnings.map((warning, index) => (
                    <p key={index} className="text-sm">
                      {warning}
                    </p>
                  ))}
                </div>
              )}

              {result?.recommendations && result.recommendations.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="font-medium text-blue-600">💡 권장사항:</p>
                  {result.recommendations.map((rec, index) => (
                    <p key={index} className="text-sm">
                      {rec}
                    </p>
                  ))}
                </div>
              )}

              <p className="mt-4">
                {formData.goal === 'lose'
                  ? `현재 체중 ${healthRecord?.weight}kg에서 ${formData.targetWeight}kg까지 
            ${formData.targetDuration}주 동안 감량하시려면 주당 
            ${Math.abs(
              (healthRecord?.weight! - formData.targetWeight!) / formData.targetDuration!
            ).toFixed(1)}kg의 
            체중 감소가 필요합니다.`
                  : `현재 체중 ${healthRecord?.weight}kg에서 ${formData.targetWeight}kg까지 
            ${formData.targetDuration}주 동안 증량하시려면 주당 
            ${Math.abs(
              (formData.targetWeight! - healthRecord?.weight!) / formData.targetDuration!
            ).toFixed(1)}kg의 
            체중 증가가 필요합니다.`}
              </p>

              <p className="mt-2">
                목표를 다시 설정하시겠습니까? 아니면 현재 설정된 목표로 진행하시겠습니까?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowWarningDialog(false);
                setCurrentSlide(0);
              }}
            >
              목표 다시 설정하기
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowWarningDialog(false);
                setShowWarnings(false);
                setCurrentSlide(1);
              }}
            >
              현재 목표로 진행하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HealthCalculateFormBene;
