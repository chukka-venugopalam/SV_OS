'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSimulationEngineOptions {
  totalSteps: number;
  initialSpeed?: number;
  onStepChange?: (step: number) => void;
}

export function useSimulationEngine({
  totalSteps,
  initialSpeed = 500,
  onStepChange,
}: UseSimulationEngineOptions) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);

  const stepRef = useRef(currentStep);
  stepRef.current = currentStep;

  const totalStepsRef = useRef(totalSteps);
  totalStepsRef.current = totalSteps;

  const stepForward = useCallback(() => {
    if (stepRef.current < totalStepsRef.current) {
      const nextStep = stepRef.current + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
      return true;
    } else {
      setIsPlaying(false);
      return false;
    }
  }, [onStepChange]);

  const stepBackward = useCallback(() => {
    if (stepRef.current > 0) {
      const prevStep = stepRef.current - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  }, [onStepChange]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    onStepChange?.(0);
  }, [onStepChange]);

  const play = useCallback(() => {
    if (stepRef.current >= totalStepsRef.current) {
      setCurrentStep(0);
      onStepChange?.(0);
    }
    setIsPlaying(true);
  }, [onStepChange]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        const advanced = stepForward();
        if (!advanced) {
          clearInterval(timer!);
        }
      }, speed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, speed, stepForward]);

  return {
    currentStep,
    setCurrentStep,
    isPlaying,
    speed,
    setSpeed,
    play,
    pause,
    togglePlay,
    reset,
    stepForward,
    stepBackward,
  };
}
