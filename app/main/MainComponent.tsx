'use client';

import React from 'react';
import CurrentWeekCalendar from './CurrentWeekCalendar';
import NutritionCard from '../components/shared/ui/NutritionCard';

export default function MainComponent() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  return (
    <div className="relative min-h-screen min-w-screen flex flex-col overflow-hidden">
      {/* CalenderSection */}
      <div className="w-full aspect-square  pt-12 px-6 flex flex-col space-y-6">
        <CurrentWeekCalendar />
        <NutritionCard
          title="오늘 남은 식사량"
          nutrition={{
            calories: 2500,
            protein: 20,
            fat: 10,
            carbs: 30,
          }}
        />
      </div>
    </div>
  );
}
