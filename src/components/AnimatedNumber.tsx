import { Capacitor } from '@capacitor/core';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

function AnimatedNumberMotion({ value }: { value: number }) {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { damping: 25, stiffness: 150 });
  const displayValue = useTransform(springValue, (current) => Math.round(current));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span>{displayValue}</motion.span>;
}

export function AnimatedNumber({ value }: { value: number }) {
  const prefersReducedMotion = useReducedMotion();
  const shouldRenderStaticValue =
    prefersReducedMotion ||
    Capacitor.isNativePlatform() ||
    (typeof window !== 'undefined' && window.innerWidth < 640);

  if (shouldRenderStaticValue) {
    return <span>{Math.round(value)}</span>;
  }

  return <AnimatedNumberMotion value={value} />;
}
