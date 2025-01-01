import React from 'react';
import HealthCalculateForm from './HealthCalculatorFormBene';
import { getUser } from '@/lib/supabse/server';

export default async function HealthCalculatorPageBene() {
  const currentUser = await getUser();
  const currentUser_id = currentUser?.id;

  return (
    <div>
      <HealthCalculateForm currentUser_id={currentUser_id} />
    </div>
  );
}
