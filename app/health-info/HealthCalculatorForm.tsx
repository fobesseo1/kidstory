'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HealthCalculator, type UserInput, type NutritionResult } from './HealthCalculator';

const HealthCalculateForm = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedResult = HealthCalculator.calculateNutrition(formData);
    setResult(calculatedResult);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        value === ''
          ? undefined
          : ['age', 'height', 'weight', 'targetWeight', 'targetDuration'].includes(name)
          ? Number(value)
          : value,
    }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>건강 관리 계산기</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="age" className="block text-sm font-medium">
                  나이
                </label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  className="w-full p-2 border rounded"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="120"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="gender" className="block text-sm font-medium">
                  성별
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="w-full p-2 border rounded"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="height" className="block text-sm font-medium">
                  신장 (cm)
                </label>
                <input
                  id="height"
                  type="number"
                  name="height"
                  className="w-full p-2 border rounded"
                  value={formData.height}
                  onChange={handleInputChange}
                  required
                  min="100"
                  max="250"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="weight" className="block text-sm font-medium">
                  체중 (kg)
                </label>
                <input
                  id="weight"
                  type="number"
                  name="weight"
                  className="w-full p-2 border rounded"
                  value={formData.weight}
                  onChange={handleInputChange}
                  required
                  min="30"
                  max="200"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="activityLevel" className="block text-sm font-medium">
                  활동 수준
                </label>
                <select
                  id="activityLevel"
                  name="activityLevel"
                  className="w-full p-2 border rounded"
                  value={formData.activityLevel}
                  onChange={handleInputChange}
                >
                  <option value="sedentary">좌식 생활</option>
                  <option value="light">가벼운 운동 (주 1-3회)</option>
                  <option value="moderate">중간 운동 (주 3-5회)</option>
                  <option value="active">활발한 운동 (주 6-7회)</option>
                  <option value="very_active">매우 활발한 운동</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="goal" className="block text-sm font-medium">
                  목표
                </label>
                <select
                  id="goal"
                  name="goal"
                  className="w-full p-2 border rounded"
                  value={formData.goal}
                  onChange={handleInputChange}
                >
                  <option value="maintain">현재 체중 유지</option>
                  <option value="lose">체중 감량</option>
                  <option value="gain">근육량 증가</option>
                </select>
              </div>

              {formData.goal !== 'maintain' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="targetWeight" className="block text-sm font-medium">
                      목표 체중 (kg)
                    </label>
                    <input
                      id="targetWeight"
                      type="number"
                      name="targetWeight"
                      className="w-full p-2 border rounded"
                      value={formData.targetWeight || ''}
                      onChange={handleInputChange}
                      step="0.1"
                      min="30"
                      max="200"
                      placeholder="목표 체중을 입력하세요"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="targetDuration" className="block text-sm font-medium">
                      목표 기간 (주)
                    </label>
                    <input
                      id="targetDuration"
                      type="number"
                      name="targetDuration"
                      className="w-full p-2 border rounded"
                      value={formData.targetDuration || ''}
                      onChange={handleInputChange}
                      min="1"
                      max="52"
                      placeholder="1-52주 사이로 입력하세요"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              계산하기
            </button>
          </form>

          {result && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold">계산 결과</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">기초대사량 (BMR)</p>
                  <p>{result.bmr.toLocaleString()} kcal</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">일일 권장 칼로리</p>
                  <p>{result.totalCalories.toLocaleString()} kcal</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">단백질</p>
                  <p>{result.protein.toLocaleString()}g</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">지방</p>
                  <p>{result.fat.toLocaleString()}g</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">탄수화물</p>
                  <p>{result.carbs.toLocaleString()}g</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">물 섭취량</p>
                  <p>{result.waterIntake.toLocaleString()}ml</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">권장 운동 시간</p>
                  <p>하루 {result.exerciseMinutes}분</p>
                </div>
              </div>

              {result.weightChangePerWeek !== 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded">
                  <p className="font-medium">주간 목표 변화량</p>
                  <p>
                    {Math.abs(result.weightChangePerWeek).toFixed(2)}kg/
                    {result.weightChangePerWeek > 0 ? '증량' : '감량'}
                  </p>
                </div>
              )}

              {result.healthWarnings && result.healthWarnings.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                  <p className="font-medium">⚠️ 건강 관리 참고사항</p>
                  {result.healthWarnings.map((warning, index) => (
                    <p key={index}>{warning}</p>
                  ))}
                </div>
              )}

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-700">
                  <p className="font-medium">💡 권장사항</p>
                  {result.recommendations.map((recommendation, index) => (
                    <p key={index}>{recommendation}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthCalculateForm;
