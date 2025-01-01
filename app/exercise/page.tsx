// app/exercise/page.tsx

import { getUser } from '@/lib/supabse/server';
import ExerciseDescription from './ExerciseDescription';

export default async function ExercisePage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  return (
    <div>
      <ExerciseDescription currentUser_id={currentUser_id} />
    </div>
  );
}
