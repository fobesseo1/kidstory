import React from 'react';
import OnboardingScreen from './Start';
import { Suspense } from 'react';

export default function StartPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const slide = typeof searchParams.slide === 'string' ? parseInt(searchParams.slide) : 0;

  return (
    <Suspense>
      <OnboardingScreen defaultSlide={slide} />
    </Suspense>
  );
}
