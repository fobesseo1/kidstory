//app/food-description/page.tsx

import FoodDescription from './Description';
import { getUser } from '@/lib/supabse/server';

export default async function FoodDescriptionPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;
  return (
    <div>
      <FoodDescription currentUser_id={currentUser_id} />
    </div>
  );
}
