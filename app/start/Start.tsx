'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChartBar, Sparkles } from 'lucide-react';

const OnboardingScreen = ({ defaultSlide }: { defaultSlide: number }) => {
  const [currentSlide, setCurrentSlide] = useState(defaultSlide);

  useEffect(() => {
    if (defaultSlide >= 0 && defaultSlide < slides.length) {
      setCurrentSlide(defaultSlide);
    }
  }, [defaultSlide]);

  const slides = [
    {
      title: '칼로리 계산 너무 쉬워요',
      subtitle: '그냥 사진만 찍으시면 저희가 알려드릴게요',
      icon: <Camera className="w-8 h-8" />,
      image: '/start/start-1.png',
    },
    {
      title: 'AI를 통한 분석',
      subtitle: '여러분이 드시는\n식사의 칼로리와 영양소를 분석해드릴게요',
      icon: <ChartBar className="w-8 h-8" />,
      image: '/start/start-2.png',
    },
    {
      title: '이제 시작해요',
      subtitle: '오늘이 여러분이 꿈꾸던 핏을 시작하기\n가장 좋은 날이에요',
      icon: <Sparkles className="w-8 h-8" />,
      image: '/start/start-3.png',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="min-h-screen min-w-screen flex flex-col bg-gray-900">
      {/* Image Section - Fixed at top */}
      <div className="w-full aspect-square">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 160, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -160, opacity: 0 }}
            className="h-full"
          >
            <img
              src={slides[currentSlide].image}
              alt="Onboarding"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Section - Flexible space */}
      <div className="flex-1 flex flex-col px-6 py-8 rounded-t-3xl bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex-1 flex flex-col "
          >
            {/* Icon and Title in one line */}
            <div className="flex flex-col justify-center gap-4 mb-4 ">
              <h2 className="text-2xl font-semibold text-gray-900">{slides[currentSlide].title}</h2>
            </div>

            {/* Subtitle with line breaks */}
            <p className="text-gray-600  leading-relaxed whitespace-pre-line">
              {slides[currentSlide].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Section - Fixed at bottom */}
      <div className="px-6 pb-8 space-y-4 bg-white">
        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mb-4">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                currentSlide === index ? 'bg-black' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Next/Start Button */}
        <button
          onClick={handleNext}
          className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
        >
          {currentSlide === slides.length - 1 ? '시작하기' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
