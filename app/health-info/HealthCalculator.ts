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
  totalCalories: number;
  waterIntake: number;
  exerciseMinutes: number;
  weightChangePerWeek: number;
  bmi: number;
  healthWarnings: string[];
  recommendations: string[];
}

// 활동 계수 맵핑
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // 좌식 생활
  light: 1.375, // 가벼운 운동 (주 1-3회)
  moderate: 1.55, // 중간 운동 (주 3-5회)
  active: 1.725, // 활발한 운동 (주 6-7회)
  very_active: 1.9, // 매우 활발한 운동
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
  maintain: 0.25, // 25-30%
  gain: 0.25, // 25-30%
  lose: 0.2, // 20-25%
};

export class HealthCalculator {
  // BMR (기초대사량) 계산 - 수정된 해리스-베네딕트 공식
  static calculateBMR(gender: Gender, weight: number, height: number, age: number): number {
    if (gender === 'male') {
      return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    }
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
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
    } else if (bmi >= 25 && bmi < 30) {
      warnings.push('과체중 상태입니다. 전문의 상담을 권장합니다.');
    } else if (bmi >= 30) {
      warnings.push('비만 상태입니다. 전문의 상담을 권장합니다.');
    }

    return warnings;
  }

  // 물 섭취량 계산 개선
  static calculateWaterIntake(weight: number, activityLevel: ActivityLevel): number {
    const baseWater = weight * 30; // 기본 30ml/kg
    const activityAddition =
      activityLevel === 'active' || activityLevel === 'very_active' ? 500 : 0;
    return baseWater + activityAddition;
  }

  // 운동 시간 계산 개선
  static calculateExerciseMinutes(goal: Goal, bmi: number, activityLevel: ActivityLevel): number {
    let baseMinutes = 30;

    if (goal === 'lose') {
      baseMinutes = bmi >= 25 ? 45 : 40;
    } else if (goal === 'gain') {
      baseMinutes = 50;
    }

    return Math.round(baseMinutes * (activityLevel === 'sedentary' ? 1.2 : 1));
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

    // 칼로리 안전 제한 적용 및 실현 가능한 목표 계산
    const limits = CALORIE_LIMITS[gender];
    const originalCalories = totalCalories;
    totalCalories = Math.min(Math.max(totalCalories, limits.min), limits.max);

    // 칼로리가 최소치로 조정된 경우, 실제 달성 가능한 목표 계산
    if (totalCalories !== originalCalories && targetWeight && targetDuration) {
      // 일일 칼로리 차이
      const calorieDeficit = Math.abs(tdee - totalCalories);
      // 해당 기간 동안 총 소모 가능한 칼로리
      const totalDeficit = calorieDeficit * targetDuration * 7;
      // 실제 감량 가능한 체중 (7700kcal = 1kg)
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
    const protein = weight * PROTEIN_MULTIPLIERS[goal];
    const fat = (totalCalories * FAT_PERCENTAGES[goal]) / 9;
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const carbs = (totalCalories - proteinCalories - fatCalories) / 4;

    // 물 섭취량 및 운동 시간 계산
    const waterIntake = this.calculateWaterIntake(weight, activityLevel);
    const exerciseMinutes = this.calculateExerciseMinutes(goal, bmi, activityLevel);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      protein: Math.round(protein),
      fat: Math.round(fat),
      carbs: Math.round(carbs),
      totalCalories: Math.round(totalCalories),
      waterIntake: Math.round(waterIntake),
      exerciseMinutes,
      weightChangePerWeek,
      bmi,
      healthWarnings,
      recommendations,
    };
  }
}
