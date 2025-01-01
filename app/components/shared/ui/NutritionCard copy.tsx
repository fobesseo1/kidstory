import React from 'react';
import { Beef, Droplet, Flame, Wheat } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface NutritionData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface NutritionCardProps {
  nutrition: NutritionData;
  className?: string;
  title?: string; // 새로 추가된 title prop
}

export const NutritionCard = ({
  nutrition,
  className,
  title = '영양 정보', // 기본값 설정
}: NutritionCardProps) => {
  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow">
          <div className="col-span-3 flex items-center justify-center">
            <Flame size={32} color="#F87171" />
          </div>
          <div className="col-span-7 flex flex-col gap-1 justify-center">
            <p className="text-sm text-gray-600">칼로리</p>
            <p className="text-lg font-semibold">
              {nutrition.calories} <span className="text-sm text-gray-600">kcal</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
          <div className="col-span-3 flex items-center justify-center">
            <Beef size={32} color="#F472B6" />
          </div>
          <div className="col-span-7 flex flex-col gap-1 justify-center">
            <p className="text-sm text-gray-600">단백질</p>
            <p className="text-lg font-semibold">
              {nutrition.protein} <span className="text-sm text-gray-600">g</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
          <div className="col-span-3 flex items-center justify-center">
            <Droplet size={32} color="#94A3B8" />
          </div>
          <div className="col-span-7 flex flex-col gap-1 justify-center">
            <p className="text-sm text-gray-600">지방</p>
            <p className="text-lg font-semibold">
              {nutrition.fat} <span className="text-sm text-gray-600">g</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
          <div className="col-span-3 flex items-center justify-center">
            <Wheat size={32} color="#EAB308" />
          </div>
          <div className="col-span-7 flex flex-col gap-1 justify-center">
            <p className="text-sm text-gray-600">탄수화물</p>
            <p className="text-lg font-semibold">
              {nutrition.carbs} <span className="text-sm text-gray-600">g</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NutritionCard;
