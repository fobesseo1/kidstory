// /app/api/daily-status/route.ts
import { createSupabaseServerClient, getUser } from '@/lib/supabse/server';
import { getKoreanDateRange } from '@/lib/utils/dateAudit';

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const currentUser = await getUser();
  const userId = currentUser?.id;

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { utcStart, utcEnd } = getKoreanDateRange();

  try {
    const { data: goals } = await supabase
      .from('fitness_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!goals) {
      return Response.json({ error: 'No active goals found' }, { status: 404 });
    }

    const { data: foodLogs } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', utcStart.toISOString())
      .lte('logged_at', utcEnd.toISOString());

    const { data: exerciseLogs } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', utcStart.toISOString())
      .lte('logged_at', utcEnd.toISOString());

    const totalCalories = foodLogs?.reduce((sum, item) => sum + item.calories, 0) || 0;
    const totalExerciseMinutes =
      exerciseLogs?.reduce((sum, item) => sum + item.duration_minutes, 0) || 0;
    const totalProtein = foodLogs?.reduce((sum, item) => sum + item.protein, 0) || 0;
    const totalFat = foodLogs?.reduce((sum, item) => sum + item.fat, 0) || 0;
    const totalCarbs = foodLogs?.reduce((sum, item) => sum + item.carbs, 0) || 0;

    return Response.json({
      totalCalories,
      remainingCalories: goals.daily_calories_target - totalCalories,
      totalExerciseMinutes,
      remainingExerciseMinutes: goals.daily_exercise_minutes_target - totalExerciseMinutes,
      remainingProtein: goals.daily_protein_target - totalProtein,
      remainingFat: goals.daily_fat_target - totalFat,
      remainingCarbs: goals.daily_carbs_target - totalCarbs,
    });
  } catch (error) {
    console.error('Error fetching daily status:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
