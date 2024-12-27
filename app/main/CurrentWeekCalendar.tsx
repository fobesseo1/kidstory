import React from 'react';

const CurrentWeekCalendar = () => {
  // 현재 주의 날짜들을 가져오는 함수
  const getCurrentWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = 일요일, 1 = 월요일, ...
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // 월요일부터 시작하도록 조정

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(now.setDate(diff + i));
      weekDates.push(day);
    }
    return weekDates;
  };

  const weekDays = getCurrentWeekDates();
  const today = new Date();

  return (
    <div className="rounded-lg shadow p-4 max-w-sm">
      {/* <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">
          {weekDays[0].toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' })}
        </div>
      </div> */}
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
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          return (
            <div
              key={index}
              className={`p-2 text-sm rounded-full ${
                isToday
                  ? 'bg-gray-900 text-white text-lg font-semibold'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
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
