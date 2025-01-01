'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CurrentWeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const CurrentWeekCalendar: React.FC<CurrentWeekCalendarProps> = ({
  selectedDate,
  onDateSelect,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const getKoreanTime = (date: Date = new Date()): Date => {
    return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  };

  const getCurrentWeekDates = (): Date[] => {
    const now = getKoreanTime(selectedDate);
    now.setDate(now.getDate() + weekOffset * 7);

    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);

    const weekDates: Date[] = [];
    const tempDate = new Date(now);
    tempDate.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(tempDate);
      weekDates.push(getKoreanTime(day));
      tempDate.setDate(tempDate.getDate() + 1);
    }

    return weekDates;
  };

  const weekDays = getCurrentWeekDates();
  const today = getKoreanTime();

  const getMonthDisplay = (): string => {
    return selectedDate.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
    });
  };

  const isSameDate = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const goToPreviousWeek = (): void => {
    setWeekOffset((prev) => prev - 1);
  };

  const goToNextWeek = (): void => {
    setWeekOffset((prev) => prev + 1);
  };

  const handleDateClick = (date: Date): void => {
    // 현재 날짜보다 미래의 날짜는 선택할 수 없음
    if (date > today) return;
    onDateSelect(date);
  };

  return (
    <div className="rounded-lg shadow p-4 max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPreviousWeek}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="이전 주"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-lg font-semibold">{getMonthDisplay()}</div>

        <button
          onClick={goToNextWeek}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="다음 주"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        <div className="text-sm text-gray-500">월</div>
        <div className="text-sm text-gray-500">화</div>
        <div className="text-sm text-gray-500">수</div>
        <div className="text-sm text-gray-500">목</div>
        <div className="text-sm text-gray-500">금</div>
        <div className="text-sm text-gray-500">토</div>
        <div className="text-sm text-gray-500">일</div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((date, index) => {
          const isToday = isSameDate(date, today);
          const isSelected = isSameDate(date, selectedDate);
          const isFutureDate = date > today;

          return (
            <div
              key={index}
              onClick={() => !isFutureDate && handleDateClick(date)}
              className={`p-2 text-sm rounded-full cursor-pointer transition-colors
                ${
                  isSelected
                    ? 'bg-gray-900 text-white text-lg font-semibold'
                    : isToday
                    ? 'bg-blue-500 text-white text-lg font-semibold'
                    : 'text-gray-400 hover:bg-gray-100'
                }
                ${date.getMonth() !== selectedDate.getMonth() ? 'text-gray-300' : ''}
                ${isFutureDate ? 'cursor-not-allowed opacity-50' : ''}
              `}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CurrentWeekCalendar;
