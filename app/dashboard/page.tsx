import { getUser } from '@/lib/supabse/server';
import DashboardPage from './DashBoard';

export default async function Page() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;
  return (
    <div>
      <DashboardPage currentUser_id={currentUser_id} />
    </div>
  );
}
