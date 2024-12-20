'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkle, Moon, Heart, Flower } from 'lucide-react';

interface BubbleState {
  id: number;
  x: number;
  y: number;
  size: number;
  symbolIndex: number;
}

const MysticSymbolsEffect = () => {
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const MAX_BUBBLES = 5; // 동시에 표시될 최대 버블 수

  // 심볼 컴포넌트 배열
  const symbols = [
    (props: any) => <Star {...props} />,
    (props: any) => <Sparkle {...props} />,
    (props: any) => <Moon {...props} />,
    (props: any) => <Heart {...props} />,
    (props: any) => <Flower {...props} />,
  ];

  // 심볼 색상 배열
  const symbolColors = [
    'text-violet-300',
    'text-pink-300',
    'text-blue-300',
    'text-indigo-300',
    'text-purple-300',
  ];

  const createBubble = useCallback((x: number, y: number) => {
    const size = Math.random() * (100 - 60) + 60; // 60px to 100px
    const offset = 20;
    const newBubble: BubbleState = {
      id: Date.now(),
      x: x + (Math.random() - 0.5) * offset,
      y: y + (Math.random() - 0.5) * offset,
      size,
      symbolIndex: Math.floor(Math.random() * symbols.length),
    };

    setBubbles((prevBubbles) => [...prevBubbles, newBubble].slice(-MAX_BUBBLES));

    setTimeout(() => {
      setBubbles((prevBubbles) => prevBubbles.filter((bubble) => bubble.id !== newBubble.id));
    }, 1000);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      createBubble(e.clientX, e.clientY);
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [createBubble]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {bubbles.map((bubble) => {
          const SymbolComponent = symbols[bubble.symbolIndex];
          const colorClass = symbolColors[bubble.symbolIndex];

          return (
            <motion.div
              key={bubble.id}
              className="absolute"
              style={{
                left: bubble.x,
                top: bubble.y,
                width: bubble.size,
                height: bubble.size,
                x: '-50%',
                y: '-50%',
              }}
              initial={{
                scale: 0,
                opacity: 0,
                rotate: -30,
              }}
              animate={{
                scale: 1,
                opacity: 0.8,
                rotate: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                rotate: 30,
              }}
              transition={{
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              <div className="w-full h-full relative">
                {/* 배경 블러 효과 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/20 backdrop-blur-sm" />

                {/* 심볼 */}
                <div className={`absolute inset-0 flex items-center justify-center ${colorClass}`}>
                  <SymbolComponent className="w-2/3 h-2/3" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default MysticSymbolsEffect;
