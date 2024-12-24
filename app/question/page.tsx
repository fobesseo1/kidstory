import React from 'react';
import QuestionSlidePage from './Question';

export default function QuestionPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const slide = typeof searchParams.slide === 'string' ? parseInt(searchParams.slide) : 0;

  return (
    <div>
      <QuestionSlidePage defaultSlide={slide} />
    </div>
  );
}
