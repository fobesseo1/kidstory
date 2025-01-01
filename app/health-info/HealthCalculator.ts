export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'maintain' | 'gain' | 'lose';

export interface UserInput {
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  goal: Goal;
  targetWeight?: number; // kg, optional
  targetDuration?: number; // weeks, optional
}

export interface NutritionResult {
  bmr: number;
  tdee: number;
  protein: number;
  fat: number;
  carbs: number;
  macroRatio: {
    protein: number;
    fat: number;
    carbs: number;
  };
  totalCalories: number;
  waterIntake: number;
  exerciseMinutes: number;
  weightChangePerWeek: number;
  bmi: number;
  healthWarnings: string[];
  recommendations: string[];
  strengthTraining: {
    frequency: string;
    sets: string;
    reps: string;
    guide: string;
  };
}

// 활동 계수 맵핑
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // 거의 운동 안함 (하루종일 앉아있는 경우)
  light: 1.375, // 가벼운 활동 (주 1-2회 운동)
  moderate: 1.55, // 보통 활동 (주 3-5회 운동)
  active: 1.7, // 활동적 (거의 매일 운동)
  very_active: 1.8, // 매우 활동적 (하루 2회 운동 또는 강도 높은 운동)
};

// 칼로리 안전 제한
const CALORIE_LIMITS = {
  female: { min: 1200, max: 2500 },
  male: { min: 1500, max: 3000 },
};

// 영양소 비율
const PROTEIN_MULTIPLIERS = {
  maintain: 1.2, // 일반 성인: 1.2-1.4g/kg
  gain: 1.6, // 근육 증가: 1.6-2.0g/kg
  lose: 1.8, // 체중 감량: 1.8-2.0g/kg
};

const FAT_PERCENTAGES = {
  maintain: 0.3, // 30%
  gain: 0.3, // 30%
  lose: 0.25, // 25%
};

export class HealthCalculator {
  // BMR (기초대사량) 계산 - Mifflin-St Jeor 공식
  static calculateBMR(gender: Gender, weight: number, height: number, age: number): number {
    const baseBMR = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? baseBMR + 5 : baseBMR - 161;
  }

  // TDEE (일일 총 에너지 소비량) 계산
  static calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  }

  // BMI 계산
  static calculateBMI(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  // BMI 기반 건강 경고
  static addHealthWarnings(bmi: number, age: number): string[] {
    const warnings: string[] = [];

    if (age < 18 || age > 65) {
      warnings.push('이 계산기는 18-65세 성인 기준입니다. 전문의 상담을 권장합니다.');
    }

    if (bmi < 18.5) {
      warnings.push('저체중 상태입니다. 전문의 상담을 권장합니다.');
    } else if (bmi >= 23 && bmi < 25) {
      warnings.push('과체중 위험군입니다. 생활습관 개선을 권장합니다.');
    } else if (bmi >= 25) {
      warnings.push('과체중 상태입니다. 전문의 상담을 권장합니다.');
    }

    return warnings;
  }

  // 물 섭취량 계산
  static calculateWaterIntake(weight: number, activityLevel: ActivityLevel): number {
    const baseWater = weight * 30; // 기본 30ml/kg
    const activityAddition =
      activityLevel === 'active' || activityLevel === 'very_active' ? 500 : 0;
    return baseWater + activityAddition;
  }

  // 운동 권장사항 계산
  static calculateExerciseRecommendation(
    goal: Goal,
    bmi: number,
    activityLevel: ActivityLevel
  ): {
    cardioMinutes: number;
    strengthTraining: {
      frequency: string;
      sets: string;
      reps: string;
      guide: string;
    };
    recommendations: string[];
  } {
    let cardioMinutes: number;
    const recommendations: string[] = [];

    // 유산소 운동 시간 설정
    switch (goal) {
      case 'lose':
        cardioMinutes = bmi >= 25 ? 45 : 40;
        recommendations.push(
          `중강도 유산소 운동을 주 ${bmi >= 25 ? 5 : 4}회, 회당 ${cardioMinutes}분 실시하세요.`,
          '걷기, 조깅, 수영 등 전신 운동을 선택하세요.'
        );
        break;
      case 'gain':
        cardioMinutes = 30;
        recommendations.push(
          '과도한 유산소 운동은 피하고, 웨이트 트레이닝에 집중하세요.',
          '중강도 유산소 운동을 주 3회, 회당 30분으로 제한하세요.'
        );
        break;
      default: // maintain
        cardioMinutes = 35;
        recommendations.push(
          '중강도 유산소 운동을 주 4회, 회당 35분 실시하세요.',
          '유산소 운동과 근력 운동을 균형있게 병행하세요.'
        );
    }

    // 근력 운동 가이드라인
    const strengthTraining = {
      gain: {
        frequency: '주 3-4회',
        sets: '3-4세트',
        reps: '8-12회',
        guide: '큰 근육군 운동을 먼저하고, 운동 간 1일 휴식',
      },
      lose: {
        frequency: '주 2-3회',
        sets: '2-3세트',
        reps: '12-15회',
        guide: '유산소 운동 후 근력 운동 실시',
      },
      maintain: {
        frequency: '주 2-3회',
        sets: '2-3세트',
        reps: '10-12회',
        guide: '모든 주요 근육군을 골고루 운동',
      },
    }[goal];

    return { cardioMinutes, strengthTraining, recommendations };
  }

  // 건강 모니터링
  static monitorHealthMetrics(
    currentWeight: number,
    targetWeight: number,
    duration: number
  ): { weeklyChange: number; recommendations: string[]; warnings: string[] } {
    const weeklyChange = (targetWeight - currentWeight) / duration;
    const isHealthyRange = Math.abs(weeklyChange) <= 0.75;

    const recommendations = [];
    const warnings = [];

    if (isHealthyRange) {
      recommendations.push('현재 체중 변화 속도는 적절합니다.');
    } else {
      warnings.push('체중 변화가 너무 급격합니다.');
      recommendations.push('체중 변화 속도를 주당 0.5-0.75kg 이내로 조정하세요.');
    }

    return {
      weeklyChange,
      recommendations,
      warnings,
    };
  }

  // 영양소 계산
  static calculateNutrients(weight: number, totalCalories: number, goal: Goal) {
    // 단백질 계산
    let proteinPerKg = PROTEIN_MULTIPLIERS[goal];
    let protein = weight * proteinPerKg;
    let proteinCalories = protein * 4;

    // 단백질이 총 칼로리의 40%를 넘지 않도록 조정
    if (proteinCalories > totalCalories * 0.4) {
      proteinCalories = totalCalories * 0.4;
      protein = proteinCalories / 4;
    }

    // 지방 계산
    let fatRatio = FAT_PERCENTAGES[goal];
    let fatCalories = totalCalories * fatRatio;

    // 최소 필수 지방 섭취량 확인 (체중당 0.5g)
    const minFatGrams = weight * 0.5;
    const minFatCalories = minFatGrams * 9;

    if (fatCalories < minFatCalories) {
      fatCalories = minFatCalories;
    }

    let fat = fatCalories / 9;

    // 탄수화물 계산
    const remainingCalories = totalCalories - proteinCalories - fatCalories;
    let carbs = remainingCalories / 4;

    // 최소 탄수화물 확인 (100g)
    if (carbs < 100) {
      carbs = 100;
      // 탄수화물 최소량을 맞추기 위해 지방 조정
      const carbsCalories = carbs * 4;
      const availableForFat = totalCalories - proteinCalories - carbsCalories;
      fat = availableForFat / 9;
    }

    return {
      nutrients: {
        protein: Math.round(protein),
        fat: Math.round(fat),
        carbs: Math.round(carbs),
      },
      ratio: {
        protein: Math.round(((protein * 4) / totalCalories) * 100),
        fat: Math.round(((fat * 9) / totalCalories) * 100),
        carbs: Math.round(((carbs * 4) / totalCalories) * 100),
      },
    };
  }

  // 영양소 계산
  static calculateNutrition(userInput: UserInput): NutritionResult {
    const { gender, weight, height, age, activityLevel, goal, targetWeight, targetDuration } =
      userInput;

    // BMI 계산
    const bmi = this.calculateBMI(weight, height);

    // 건강 경고 및 권장사항 수집
    const healthWarnings = this.addHealthWarnings(bmi, age);
    let recommendations: string[] = [];

    // 기초 계산
    const bmr = this.calculateBMR(gender, weight, height, age);
    const tdee = this.calculateTDEE(bmr, activityLevel);

    // 목표에 따른 칼로리 조정
    let totalCalories = tdee;
    let weightChangePerWeek = 0;

    if (targetWeight && targetDuration) {
      const healthMetrics = this.monitorHealthMetrics(weight, targetWeight, targetDuration);
      weightChangePerWeek = healthMetrics.weeklyChange;
      recommendations = [...recommendations, ...healthMetrics.recommendations];
      healthWarnings.push(...healthMetrics.warnings);

      // 체중 변화에 따른 칼로리 조정
      const dailyCalorieChange = (weightChangePerWeek * 7700) / 7;
      totalCalories += dailyCalorieChange;
    }

    // 칼로리 안전 제한 적용
    const limits = CALORIE_LIMITS[gender];
    const originalCalories = totalCalories;
    totalCalories = Math.min(Math.max(totalCalories, limits.min), limits.max);

    // 실현 가능한 목표 계산
    if (totalCalories !== originalCalories && targetWeight && targetDuration) {
      const calorieDeficit = Math.abs(tdee - totalCalories);
      const totalDeficit = calorieDeficit * targetDuration * 7;
      const possibleWeightLoss = totalDeficit / 7700;

      if (goal === 'lose') {
        const achievableWeight = weight - possibleWeightLoss;
        recommendations.push(
          `현재 설정하신 목표 기간 동안 안전한 최소 칼로리(${
            limits.min
          }kcal)를 유지하며 도달할 수 있는 체중은 ${achievableWeight.toFixed(1)}kg입니다. ` +
            `목표 달성을 위해서는 기간을 ${Math.ceil(
              (weight - targetWeight) / (possibleWeightLoss / targetDuration)
            )}주로 조정하시거나, ` +
            `운동량을 늘려 소비 칼로리를 증가시키는 것을 권장드립니다.`
        );
      } else if (goal === 'gain') {
        const achievableWeight = weight + possibleWeightLoss;
        recommendations.push(
          `현재 설정하신 목표 기간 동안 안전한 최대 칼로리(${
            limits.max
          }kcal)를 유지하며 도달할 수 있는 체중은 ${achievableWeight.toFixed(1)}kg입니다. ` +
            `목표 달성을 위해서는 기간을 ${Math.ceil(
              (targetWeight - weight) / (possibleWeightLoss / targetDuration)
            )}주로 조정하시는 것을 권장드립니다.`
        );
      }
    }

    // 영양소 계산
    const nutritionInfo = this.calculateNutrients(weight, totalCalories, goal);
    const { nutrients, ratio: macroRatio } = nutritionInfo;

    // 운동 권장사항 및 물 섭취량 계산
    const exercise = this.calculateExerciseRecommendation(goal, bmi, activityLevel);
    const waterIntake = this.calculateWaterIntake(weight, activityLevel);

    // 영양소 관련 권장사항 추가
    recommendations.push(
      `일일 권장 영양소 섭취량:`,
      `- 단백질: ${nutrients.protein}g (${macroRatio.protein}%)`,
      `- 지방: ${nutrients.fat}g (${macroRatio.fat}%)`,
      `- 탄수화물: ${nutrients.carbs}g (${macroRatio.carbs}%)`
    );

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      protein: nutrients.protein,
      fat: nutrients.fat,
      carbs: nutrients.carbs,
      macroRatio,
      totalCalories: Math.round(totalCalories),
      waterIntake: Math.round(waterIntake),
      exerciseMinutes: exercise.cardioMinutes,
      weightChangePerWeek,
      bmi,
      strengthTraining: exercise.strengthTraining,
      healthWarnings,
      recommendations: [
        ...exercise.recommendations,
        `일일 물 섭취량: ${Math.round(waterIntake)}ml`,
        `일일 칼로리 목표: ${Math.round(totalCalories)}kcal`,
        ...recommendations,
      ],
    };
  }
}