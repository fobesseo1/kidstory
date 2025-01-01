//app/components/shared/ui/NutritionCard.tsx

import React, { useState } from 'react';
import { Beef, Droplet, Flame, Wheat, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface NutritionData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface NutritionCardProps {
  nutrition: NutritionData;
  className?: string;
  title?: string;
  editable?: boolean;
  onNutritionChange?: (newNutrition: NutritionData) => void;
}

export const NutritionCard = ({
  nutrition,
  className,
  title = '영양 정보',
  editable = false,
  onNutritionChange,
}: NutritionCardProps) => {
  const [editMode, setEditMode] = useState({
    calories: false,
    protein: false,
    fat: false,
    carbs: false,
  });

  const [editValues, setEditValues] = useState(nutrition);

  const handleEdit = (field: keyof NutritionData, value: string) => {
    // 빈 문자열이면 0으로 설정
    if (value === '') {
      const newNutrition = { ...editValues, [field]: 0 };
      setEditValues(newNutrition);
      onNutritionChange?.(newNutrition);
      return;
    }

    // 0으로 시작하고 다른 숫자가 입력되면 앞의 0을 제거
    if (value.startsWith('0') && value.length > 1) {
      value = value.replace(/^0+/, '');
    }

    const numValue = Math.max(0, parseInt(value) || 0);
    const newNutrition = { ...editValues, [field]: numValue };
    setEditValues(newNutrition);
    onNutritionChange?.(newNutrition);
  };

  const toggleEdit = (field: keyof typeof editMode) => {
    setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const renderEditableValue = (field: keyof NutritionData, value: number, unit: string) => {
    return editMode[field] ? (
      <Input
        type="number"
        value={editValues[field] === 0 ? '' : editValues[field]} // 0일때는 빈 문자열로
        onChange={(e) => {
          if (e.target.value === '') {
            handleEdit(field, '0');
          } else {
            const newValue = e.target.value.replace(/^0+/, ''); // 앞의 0 제거
            handleEdit(field, newValue);
          }
        }}
        onBlur={() => {
          toggleEdit(field);
        }}
        className="w-20 h-8 text-lg font-semibold"
        autoFocus
      />
    ) : (
      <div className="flex items-center">
        <p className="text-lg font-semibold">
          {value} <span className="text-sm text-gray-600">{unit}</span>
        </p>
        {editable && (
          <button
            onClick={() => toggleEdit(field)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors ml-1"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    );
  };

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
            {renderEditableValue('calories', nutrition.calories, 'kcal')}
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
          <div className="col-span-3 flex items-center justify-center">
            <Beef size={32} color="#F472B6" />
          </div>
          <div className="col-span-7 flex flex-col gap-1 justify-center">
            <p className="text-sm text-gray-600">단백질</p>
            {renderEditableValue('protein', nutrition.protein, 'g')}
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
          <div className="col-span-3 flex items-center justify-center">
            <Droplet size={32} color="#94A3B8" />
          </div>
          <div className="col-span-7 flex flex-col gap-1 justify-center">
            <p className="text-sm text-gray-600">지방</p>
            {renderEditableValue('fat', nutrition.fat, 'g')}
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
          <div className="col-span-3 flex items-center justify-center">
            <Wheat size={32} color="#EAB308" />
          </div>
          <div className="col-span-7 flex flex-col gap-1 justify-center">
            <p className="text-sm text-gray-600">탄수화물</p>
            {renderEditableValue('carbs', nutrition.carbs, 'g')}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NutritionCard;
