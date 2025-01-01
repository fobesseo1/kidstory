//app/food-description/Description.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Beef, Droplet, Flame, Wheat, Plus, Minus, X, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { foodDatabase, FoodItem, Nutrition } from './foodDatabase';
import NutritionCard from '../components/shared/ui/NutritionCard';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { useRouter } from 'next/navigation';
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

interface SelectedFoodItem extends FoodItem {
  quantity: number;
}

interface Analysis {
  foodName: string;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export default function FoodDescription({ currentUser_id }: { currentUser_id: string }) {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFoodItem[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [totalNutrition, setTotalNutrition] = useState<Nutrition>({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  });
  const [showResultAlert, setShowResultAlert] = useState(false); // 추가
  const [error, setError] = useState<string | null>(null); // 추가

  const supabase = createSupabaseBrowserClient();
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 검색어에 따른 필터링된 음식 목록(검색관련함수 getInitialConsonant ,matchesInitialConsonant, filteredFoods )
  const getInitialConsonant = (text: string) => {
    const initialConsonants = [
      'ㄱ',
      'ㄲ',
      'ㄴ',
      'ㄷ',
      'ㄸ',
      'ㄹ',
      'ㅁ',
      'ㅂ',
      'ㅃ',
      'ㅅ',
      'ㅆ',
      'ㅇ',
      'ㅈ',
      'ㅉ',
      'ㅊ',
      'ㅋ',
      'ㅌ',
      'ㅍ',
      'ㅎ',
    ];
    let result = '';
    for (let char of text) {
      const code = char.charCodeAt(0) - 0xac00;
      if (code > -1 && code < 11172) {
        result += initialConsonants[Math.floor(code / 588)];
      }
    }
    return result;
  };

  const matchesInitialConsonant = (name: string, search: string) => {
    return getInitialConsonant(name).includes(search);
  };

  const normalizeKorean = (text: string) => {
    // 받침이 있는 글자를 받침 없는 형태로도 변환 (예: '춧'-> '추')
    return text.replace(/[가-힣]/g, (char) => {
      const code = char.charCodeAt(0) - 0xac00;
      const final = code % 28; // 받침
      if (final === 0) return char; // 받침 없는 경우

      // 받침이 있는 경우, 받침 없는 형태로 변환
      const initial = Math.floor(code / 588);
      const medial = Math.floor((code % 588) / 28);
      return String.fromCharCode(0xac00 + initial * 588 + medial * 28);
    });
  };

  // filteredFoods 수정
  const filteredFoods = foodDatabase.filter((food) => {
    const searchLower = search.toLowerCase();
    const nameLower = food.name.toLowerCase();
    const normalizedName = normalizeKorean(food.name);

    // 기본 문자열 검색
    if (nameLower.includes(searchLower)) return true;

    // 정규화된 이름으로 검색
    if (normalizedName.includes(searchLower)) return true;

    // 초성 검색
    if (search.match(/^[ㄱ-ㅎ]+$/)) {
      return matchesInitialConsonant(food.name, search);
    }

    // 자음 포함 검색
    if (search.match(/[ㄱ-ㅎ]/)) {
      const searchRegex = new RegExp(search.replace(/[ㄱ-ㅎ]/g, (char) => `[${char}가-힣]`));
      return searchRegex.test(food.name) || searchRegex.test(normalizedName);
    }

    return false;
  });

  // 클릭 이벤트 감지하여 외부 클릭시 자동완성 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 음식 선택 시 처리
  const handleFoodSelect = (food: FoodItem) => {
    if (!selectedFoods.find((item) => item.id === food.id)) {
      setSelectedFoods((prev) => [...prev, { ...food, quantity: 1 }]);
    }
    setShowSuggestions(false);
    setSearch('');
  };

  const handleQuantityChange = (foodId: string, value: string) => {
    const newQuantity = value === '' ? 0 : parseFloat(value);
    if (!isNaN(newQuantity) && newQuantity >= 0 && newQuantity <= 9999) {
      setSelectedFoods((prev) =>
        prev.map((food) =>
          food.id === foodId
            ? {
                ...food,
                quantity: parseFloat(newQuantity.toFixed(1)),
              }
            : food
        )
      );
    }
  };

  // 음식 제거 처리
  const handleRemoveFood = (foodId: string) => {
    setSelectedFoods((prev) => prev.filter((food) => food.id !== foodId));
  };

  // 총 영양소 계산
  useEffect(() => {
    const total = selectedFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + Math.round(food.nutrition.calories * food.quantity),
        protein: acc.protein + food.nutrition.protein * food.quantity,
        fat: acc.fat + food.nutrition.fat * food.quantity,
        carbs: acc.carbs + food.nutrition.carbs * food.quantity,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    // totalNutrition은 기존처럼 소수점 유지 (화면 표시용)
    setTotalNutrition({
      calories: Math.round(total.calories),
      protein: parseFloat(total.protein.toFixed(1)),
      fat: parseFloat(total.fat.toFixed(1)),
      carbs: parseFloat(total.carbs.toFixed(1)),
    });

    // analysis는 모든 값을 정수로 변환 (DB 저장용)
    if (selectedFoods.length > 0) {
      let foodName;
      if (selectedFoods.length === 1) {
        foodName = selectedFoods[0].name;
      } else {
        foodName = `${selectedFoods[0].name} 등`;
      }

      setAnalysis({
        foodName: foodName,
        nutrition: {
          calories: Math.round(total.calories),
          protein: Math.floor(total.protein), // Math.floor로 소수점 버림
          fat: Math.floor(total.fat), // Math.floor로 소수점 버림
          carbs: Math.floor(total.carbs), // Math.floor로 소수점 버림
        },
      });
    } else {
      setAnalysis(null);
    }
  }, [selectedFoods]);

  // resetDescription 함수 구현
  const resetDescription = () => {
    setSelectedFoods([]);
    setSearch('');
    setShowSuggestions(false);
    setAnalysis(null);
    setTotalNutrition({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    });
  };

  const successSave = () => {
    router.push('/main');
    return null;
  };

  const saveFoodDescriptionLog = async () => {
    if (!analysis) return;

    try {
      const { error: insertError } = await supabase.from('food_logs').insert({
        user_id: currentUser_id,
        logged_at: new Date().toISOString(),
        food_name: analysis.foodName,
        calories: analysis.nutrition.calories,
        protein: analysis.nutrition.protein,
        fat: analysis.nutrition.fat,
        carbs: analysis.nutrition.carbs,
      });

      if (insertError) throw insertError;

      setShowResultAlert(true); // 성공 Alert 표시
    } catch (error) {
      console.error('Error saving food log:', error);
      setError('저장 중 오류가 발생했습니다.');
      setShowResultAlert(true); // 실패 Alert 표시
    }
  };

  return (
    <div className="w-full h-screen max-w-md p-4 py-12 flex flex-col relative ">
      <div className="flex-1 overflow-y-auto pb-16 space-y-4">
        {/* 음식 검색 */}
        <Card className="p-4">
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Input
                type="text"
                placeholder="음식 또는 재료 검색..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {showSuggestions && search && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                {filteredFoods.length > 0 ? (
                  <ul className="py-1">
                    {filteredFoods.map((food) => (
                      <li
                        key={food.id}
                        onClick={() => handleFoodSelect(food)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {food.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-2 text-gray-500">검색 결과가 없습니다</div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* 선택된 음식 목록 */}
        {selectedFoods.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">선택된 음식</h3>
            <div className="space-y-3">
              {selectedFoods.map((food) => (
                <div key={food.id} className="grid grid-cols-10">
                  <div className="col-span-1 flex items-center justify-center ">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <button
                        onClick={() => handleRemoveFood(food.id)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  {/* 재료 및 음식이름 */}
                  <div className="col-span-6 flex items-center justify-between px-2">
                    <p className="text-gray-900 text-lg tracking-tighter">{food.name}</p>

                    <div className="flex flex-col text-end ">
                      <p className="text-sm text-gray-600 font-bold leading-none">
                        {Math.round(food.nutrition.calories * food.quantity)}
                      </p>
                      <p className="text-xs text-gray-400 leading-none">kcal</p>
                    </div>
                  </div>

                  {/* 수량 */}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <div className="grid grid-cols-12 items-end gap-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={
                          food.quantity === 0
                            ? ''
                            : Number.isInteger(food.quantity)
                            ? food.quantity
                            : food.quantity.toFixed(1)
                        }
                        onChange={(e) => handleQuantityChange(food.id, e.target.value)}
                        min={0}
                        max={9999}
                        placeholder="0"
                        className="col-span-8 w-16 text-center text-lg font-semibold"
                      />
                      <p className="col-span-4 text-gray-600 text-xs tracking-tighter ml-1 text-start">
                        {food.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 총 영양소 정보 카드 */}
        {selectedFoods.length > 0 && <NutritionCard nutrition={totalNutrition} />}
      </div>

      <div className="absolute bottom-0 left-0 w-full px-6 pb-8 bg-white">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={resetDescription}
            className="w-full bg-gray-100 text-gray-900 rounded-xl py-4 text-lg font-medium"
          >
            다른 음식
          </button>
          <button
            onClick={saveFoodDescriptionLog}
            className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
          >
            저장하기
          </button>
        </div>
      </div>

      {/* 저장 결과 Alert */}
      <AlertDialog open={showResultAlert} onOpenChange={setShowResultAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{error ? '저장 실패' : '저장 완료'}</AlertDialogTitle>
            <AlertDialogDescription>
              {error ? error : '제품 정보가 성공적으로 저장되었습니다.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={successSave}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
