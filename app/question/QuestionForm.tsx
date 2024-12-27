//app/question/QuestionForm.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Answers, Question } from './tpye';
import createSupabaseBrowserClient from '@/lib/supabse/client';

const calculateBMR = (gender: string, weight: number, height: number, age: number): number => {
  if (gender === 'male') {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  }
  return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
};

const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

const getBMIStatus = (bmi: number): string => {
  if (bmi < 18.5) return '저체중';
  if (bmi < 23) return '정상체중';
  if (bmi < 25) return '과체중';
  if (bmi < 30) return '경도비만';
  return '중등도 이상 비만';
};

const QuestionSlidePage = ({
  defaultSlide,
  currentUser_id,
}: {
  defaultSlide: number;
  currentUser_id: string;
}) => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(defaultSlide);
  const [answers, setAnswers] = useState<Answers>({});
  const [yearError, setYearError] = useState<string>('');
  const [monthError, setMonthError] = useState<string>('');
  const [dayError, setDayError] = useState<string>('');

  const validateDate = (part: 'year' | 'month' | 'day', value: string): boolean => {
    if (value === '') return true;
    const num = parseInt(value);
    const currentYear = new Date().getFullYear();

    switch (part) {
      case 'year':
        if (num < 1900 || num > currentYear) {
          setYearError(`연도는 1900년에서 ${currentYear}년 사이의 값을 입력해주세요`);
          return false;
        }
        setYearError('');
        break;
      case 'month':
        if (num < 1 || num > 12) {
          setMonthError('월(mm)은 1에서 12 사이의 값을 입력해주세요');
          return false;
        }
        setMonthError('');
        break;
      case 'day':
        if (num < 1 || num > 31) {
          setDayError('일(dd)은 1에서 31 사이의 값을 입력해주세요');
          return false;
        }
        setDayError('');
        break;
    }
    return true;
  };

  useEffect(() => {
    if (defaultSlide >= 0 && defaultSlide < questions.length) {
      setCurrentSlide(defaultSlide);
    }
  }, [defaultSlide]);

  const questions: Question[] = [
    {
      id: 'gender',
      title: '성별을 알려주세요',
      subtitle: '정확한 제안을 위해 필요해요',
      type: 'select',
      options: [
        { value: 'male', label: '남성' },
        { value: 'female', label: '여성' },
      ],
    },
    {
      id: 'workout-frequency',
      title: '평소 활동량은 어느 정도인가요?',
      subtitle: '정확한 제안을 위해 필요해요',
      type: 'select',
      options: [
        { value: 'sedentary', label: '좌식 생활', description: '운동을 거의 하지 않음' },
        { value: 'light', label: '가벼운 활동', description: '가벼운 운동 (주 1-3회)' },
        { value: 'moderate', label: '보통 활동', description: '중간 운동 (주 3-5회)' },
        { value: 'active', label: '활발한 활동', description: '활발한 운동 (주 6-7회)' },
        {
          value: 'very_active',
          label: '매우 활발한 활동',
          description: '매우 활발한 운동 또는 운동선수',
        },
      ],
    },
    {
      id: 'height',
      title: '현재 신장을 알려주세요',
      subtitle: '정확한 제안을 위해 필요해요(BMI 등)',
      type: 'number',
      unit: 'cm',
      placeholder: '신장을 입력해주세요',
      min: 100,
      max: 250,
    },
    {
      id: 'weight',
      title: '현재 체중을 알려주세요',
      subtitle: '정확한 제안을 위해 필요해요(BMI 등)',
      type: 'number',
      unit: 'kg',
      placeholder: '체중을 입력해주세요',
      min: 30,
      max: 200,
    },
    {
      id: 'birthdate',
      title: '생일을 알려주세요',
      subtitle: '정확한 제안을 위해 필요해요.',
      type: 'date',
      placeholder: 'YYYY-MM-DD',
    },
    {
      id: 'result',
      title: '분석 결과',
      subtitle: '입력하신 정보를 바탕으로 분석한 결과입니다.',
      type: 'result',
    },
  ];

  const saveHealthRecord = async () => {
    const results = calculateResults();
    const healthRecord = {
      user_id: currentUser_id,
      gender: answers['gender'],
      workout_frequency: answers['workout-frequency'],
      height: Number(answers['height']),
      weight: Number(answers['weight']),
      birth_date: answers['birthdate'],
      bmr: results.bmr,
      bmi: Number(results.bmi),
      bmi_status: results.bmiStatus,
    };

    try {
      // 먼저 해당 user_id의 데이터가 있는지 확인
      const { data: existingRecord } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', currentUser_id)
        .single();

      if (existingRecord) {
        // 기존 데이터가 있으면 업데이트
        const { error: updateError } = await supabase
          .from('health_records')
          .update(healthRecord)
          .eq('user_id', currentUser_id);

        if (updateError) throw updateError;
      } else {
        // 기존 데이터가 없으면 새로 삽입
        const { error: insertError } = await supabase.from('health_records').insert([healthRecord]);

        if (insertError) throw insertError;
      }

      // 저장 성공 후 다음 페이지로 이동
      router.push('/goal');
    } catch (error) {
      console.error('Error saving health record:', error);
      // 에러 처리 로직 추가 (예: 토스트 메시지 표시)
    }
  };

  const handleNext = () => {
    if (currentSlide < questions.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else if (currentSlide === questions.length - 1) {
      // 마지막 슬라이드에서는 데이터 저장
      saveHealthRecord();
    }
  };

  const handleBack = () => {
    if (currentSlide === 0) {
      router.push('/start/?slide=2');
    } else {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [questions[currentSlide].id]: value });
  };

  const handleInputChange = (value: string) => {
    setAnswers({ ...answers, [questions[currentSlide].id]: value });
  };

  const isSelected = (value: string) => answers[questions[currentSlide].id] === value;

  const calculateResults = () => {
    const birthDate = new Date(answers['birthdate'] as string);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const weight = Number(answers['weight']);
    const height = Number(answers['height']);
    const gender = answers['gender'] as string;

    const bmr = calculateBMR(gender, weight, height, age);
    const bmi = calculateBMI(weight, height);
    const bmiStatus = getBMIStatus(bmi);

    return {
      bmr: Math.round(bmr),
      bmi: bmi.toFixed(1),
      bmiStatus,
      age,
    };
  };

  const renderBirthDateInput = () => {
    const birthdate = (answers['birthdate'] as string) || '';
    let [year, month, day] = birthdate.split('-').map((val) => val || '');

    const displayMonth = month ? parseInt(month).toString() : '';
    const displayDay = day ? parseInt(day).toString() : '';

    const handleDateChange = (part: 'year' | 'month' | 'day', value: string) => {
      if (value !== '' && !/^\d+$/.test(value)) return;

      let dateComponents = birthdate ? birthdate.split('-') : ['', '', ''];

      const maxLengths = { year: 4, month: 2, day: 2 };
      value = value.slice(0, maxLengths[part]);

      if (!validateDate(part, value)) {
        if (part === 'year') dateComponents[0] = value;
        if (part === 'month') dateComponents[1] = value;
        if (part === 'day') dateComponents[2] = value;
      } else {
        if (part === 'year') {
          dateComponents[0] = value;
        } else if (part === 'month') {
          dateComponents[1] = value ? value.padStart(2, '0') : '';
        } else if (part === 'day') {
          dateComponents[2] = value ? value.padStart(2, '0') : '';
        }
      }

      const newDate = dateComponents.every((comp) => comp === '') ? '' : dateComponents.join('-');
      handleInputChange(newDate);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mt-1 px-4">연도</p>
            <input
              type="text"
              placeholder="YYYY"
              value={year}
              onChange={(e) => handleDateChange('year', e.target.value)}
              className={`w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg placeholder:text-gray-400 
                ${yearError ? 'border-2 border-red-500' : ''}`}
              maxLength={4}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mt-1 px-4">월</p>
            <input
              type="text"
              placeholder="MM"
              value={displayMonth}
              onChange={(e) => handleDateChange('month', e.target.value)}
              className={`w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg placeholder:text-gray-400
                ${monthError ? 'border-2 border-red-500' : ''}`}
              maxLength={2}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mt-1 px-4">일</p>
            <input
              type="text"
              placeholder="DD"
              value={displayDay}
              onChange={(e) => handleDateChange('day', e.target.value)}
              className={`w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg placeholder:text-gray-400
                ${dayError ? 'border-2 border-red-500' : ''}`}
              maxLength={2}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {yearError && (
            <p className="text-xs text-red-500 break-keep leading-tight">{yearError}</p>
          )}
          {monthError && (
            <p className="text-xs text-red-500 break-keep leading-tight">{monthError}</p>
          )}
          {dayError && <p className="text-xs text-red-500 break-keep leading-tight">{dayError}</p>}
        </div>
      </div>
    );
  };

  // 결과 페이지 마운트시 실행될 useEffect
  useEffect(() => {
    if (currentSlide === questions.length - 1 && !answers['result']) {
      setAnswers((prev) => ({ ...prev, result: 'completed' }));
    }
  }, [currentSlide]);

  const renderResultContent = () => {
    const results = calculateResults();
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium text-lg mb-2">기초대사량 (BMR)</div>
            <div className="text-2xl font-bold">{results.bmr.toLocaleString()} kcal</div>
            <div className="text-sm text-gray-500 mt-1">
              하루 동안 생명 유지에 필요한 최소한의 에너지량
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium text-lg mb-2">체질량지수 (BMI)</div>
            <div className="text-2xl font-bold">{results.bmi}</div>
            <div className="text-sm text-gray-500 mt-1">현재 상태: {results.bmiStatus}</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium text-lg mb-2">신체 정보</div>
            <div className="space-y-2">
              <div>나이: {results.age}세</div>
              <div>신장: {answers['height']}cm</div>
              <div>체중: {answers['weight']}kg</div>
              <div>
                활동량:{' '}
                {questions[1].type === 'select' &&
                  questions[1].options.find((opt) => opt.value === answers['workout-frequency'])
                    ?.label}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionContent = (question: Question) => {
    switch (question.type) {
      case 'select':
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full p-4 rounded-xl text-left transition-all
                  ${isSelected(option.value) ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}
              >
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div
                    className={`text-sm ${
                      isSelected(option.value) ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {option.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        );

      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              value={answers[question.id] || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={question.placeholder}
              min={question.min}
              max={question.max}
              className="w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {question.unit}
            </span>
          </div>
        );

      case 'date':
        return renderBirthDateInput();

      case 'result':
        return renderResultContent();
    }
  };

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
              style={{ width: `${((currentSlide + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Title Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="px-4 py-6"
        >
          <h1 className="text-2xl font-semibold whitespace-pre-line">
            {questions[currentSlide].title}
          </h1>
          <p className="text-gray-500 text-sm mt-2">{questions[currentSlide].subtitle}</p>
        </motion.div>
      </AnimatePresence>

      {/* Answer Options Section */}
      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
          >
            {renderQuestionContent(questions[currentSlide])}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next Button Section */}
      <div className="p-4">
        <button
          onClick={handleNext}
          disabled={!answers[questions[currentSlide].id]}
          className={`w-full py-4 rounded-xl text-lg font-medium transition-all
            ${
              answers[questions[currentSlide].id]
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default QuestionSlidePage;
