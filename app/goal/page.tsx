// app/goal/page.tsx
import React from 'react';
import { getUser } from '@/lib/supabse/server';
import GoalForm from './GoalForm';

export default async function GoalPage() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  return (
    <div>
      <GoalForm currentUser_id={currentUser_id} />
    </div>
  );
}
