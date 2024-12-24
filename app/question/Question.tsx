'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Option = {
  value: string;
  label: string;
  description?: string;
};

type BaseQuestion = {
  id: string;
  title: string;
  subtitle: string;
};

type SelectQuestion = BaseQuestion & {
  type: 'select';
  options: Option[];
};

type NumberInputQuestion = BaseQuestion & {
  type: 'number';
  unit: string;
  placeholder: string;
  min?: number;
  max?: number;
};

type DateInputQuestion = BaseQuestion & {
  type: 'date';
  placeholder: string;
};

type Question = SelectQuestion | NumberInputQuestion | DateInputQuestion;

type Answers = {
  [key: string]: string | number;
};

const QuestionSlidePage = ({ defaultSlide }: { defaultSlide: number }) => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(defaultSlide);
  const [answers, setAnswers] = useState<Answers>({});

  // defaultSlide가 변경될 때 currentSlide 업데이트
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
      title: '일주일에 운동을 몇 번 하세요?',
      subtitle: '정확한 제안을 위해 필요해요',
      type: 'select',
      options: [
        { value: '0-2', label: '0 - 2 회', description: '안하거나 혹은 하루이틀' },
        { value: '3-5', label: '3 - 5 회', description: '3일에서 5일' },
        { value: '6+', label: '6+ 회', description: '6일 이상' },
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
  ];

  const handleNext = () => {
    if (currentSlide < questions.length - 1) {
      setCurrentSlide(currentSlide + 1);
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

  const renderBirthDateInput = () => {
    const birthdate = (answers['birthdate'] as string) || '';
    const [year, month, day] = birthdate.split('-');

    const handleDateChange = (part: 'year' | 'month' | 'day', value: string) => {
      let newDate = '';
      const dateComponents = birthdate ? birthdate.split('-') : ['', '', ''];

      if (part === 'year') dateComponents[0] = value.slice(0, 4);
      if (part === 'month') dateComponents[1] = value.slice(0, 2).padStart(2, '0');
      if (part === 'day') dateComponents[2] = value.slice(0, 2).padStart(2, '0');

      newDate = dateComponents.join('-');
      handleInputChange(newDate);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mt-1 px-4">연도</p>
            <input
              type="number"
              placeholder="YYYY"
              value={year || ''}
              onChange={(e) => handleDateChange('year', e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg placeholder:text-gray-400"
              min={1900}
              max={new Date().getFullYear()}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mt-1 px-4">월</p>
            <input
              type="number"
              placeholder="MM"
              value={month || ''}
              onChange={(e) => handleDateChange('month', e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg placeholder:text-gray-400"
              min={1}
              max={12}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mt-1 px-4">일</p>
            <input
              type="number"
              placeholder="DD"
              value={day || ''}
              onChange={(e) => handleDateChange('day', e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg placeholder:text-gray-400"
              min={1}
              max={31}
            />
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
    }
  };

  const currentQuestion = questions[currentSlide];

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
          <h1 className="text-2xl font-semibold whitespace-pre-line">{currentQuestion.title}</h1>
          <p className="text-gray-500 text-sm mt-2">{currentQuestion.subtitle}</p>
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
            {renderQuestionContent(currentQuestion)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next Button Section */}
      <div className="p-4">
        <button
          onClick={handleNext}
          disabled={!answers[currentQuestion.id]}
          className={`w-full py-4 rounded-xl text-lg font-medium transition-all
            ${answers[currentQuestion.id] ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default QuestionSlidePage;
