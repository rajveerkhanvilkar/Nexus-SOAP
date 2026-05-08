"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface PulseVisualizerProps {
  isProcessing: boolean;
  volume: number;
}

const PulseVisualizer: React.FC<PulseVisualizerProps> = ({ isProcessing, volume }) => {
  const bars = Array.from({ length: 40 });
  // Increased sensitivity: volume > 1 is enough to trigger motion
  const isActive = isProcessing || volume > 1;

  return (
    <div className="relative flex items-center justify-center gap-[3px] h-24 w-full max-w-3xl px-4">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={{
            // High-reactivity scaling
            height: isActive 
              ? [4, Math.max(4, (volume / 128) * 100 * (0.5 + Math.random())), 4] 
              : 4,
            opacity: isActive ? 1 : 0.2
          }}
          transition={{
            duration: 0.1, // Ultra-fast response
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.005
          }}
          className={`w-1 sm:w-1.5 rounded-full transition-colors duration-300 ${
            isActive ? 'bg-emerald-400' : 'bg-white/10'
          }`}
          style={{
            boxShadow: isActive ? '0 0 15px rgba(16, 185, 129, 0.5)' : 'none'
          }}
        />
      ))}

      {/* AMBIENT GLOW */}
      <div className={`absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

export default PulseVisualizer;
