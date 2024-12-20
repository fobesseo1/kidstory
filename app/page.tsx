import { getUser } from '@/lib/supabse/server';
import React from 'react';

export default async function Home() {
  const currentUser = await getUser();
  console.log(currentUser);
  return (
    <div>
      <h2>KidStory</h2>
    </div>
  );
}
