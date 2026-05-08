"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface PulseVisualizerProps {
  isProcessing: boolean;
  volume: number;
}

const PulseVisualizer: React.FC<PulseVisualizerProps> = ({ isProcessing, volume }) => {
  const bars = Array.from({ length: 40 });
  const isActive = isProcessing || volume > 5;

  return (
    <div className="relative flex items-center justify-center gap-[3px] h-24 w-full max-w-3xl px-4">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: isActive 
              ? [4, Math.max(4, (volume / 255) * 120 * Math.random() + 10), 4] 
              : 4,
            opacity: isActive ? [0.4, 1, 0.4] : 0.2
          }}
          transition={{
            duration: isActive ? 0.15 : 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.01
          }}
          className={`w-1 sm:w-1.5 rounded-full ${
            isActive ? 'bg-emerald-400' : 'bg-white/10'
          }`}
          style={{
            boxShadow: isActive ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
          }}
        />
      ))}

      {/* AMBIENT GLOW */}
      <div className={`absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

export default PulseVisualizer;
