import { getUser } from '@/lib/supabse/server';
import React from 'react';

export default async function Home() {
  const currentUser = await getUser();
  console.log(currentUser);
  return (
    <div>
      <p>test</p>
      <h2>KidStory</h2>
      <h2>KidStory</h2>
      <h2>KidStory</h2>
      <h2>KidStory</h2>
    </div>
  );
}
