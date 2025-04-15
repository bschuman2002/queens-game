'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  isRunning: boolean;
  onReset?: () => void;
  shouldReset?: boolean;
}

export default function Timer({ isRunning, onReset, shouldReset = false }: TimerProps) {
  const [seconds, setSeconds] = useState(0);
  const prevRunningRef = useRef(isRunning);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);
  
  // Reset only when shouldReset is true
  useEffect(() => {
    if (shouldReset) {
      setSeconds(0);
    }
  }, [shouldReset]);
  
  // Track changes in running state
  useEffect(() => {
    prevRunningRef.current = isRunning;
  }, [isRunning]);
  
  // Format time as mm:ss
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="text-xl font-mono bg-slate-100 px-3 py-1 rounded-md shadow">
      {formatTime(seconds)}
    </div>
  );
} 