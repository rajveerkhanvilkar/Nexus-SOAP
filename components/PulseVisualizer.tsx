"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface PulseVisualizerProps {
  isProcessing: boolean;
  volume: number;
}

const PulseVisualizer: React.FC<PulseVisualizerProps> = ({ isProcessing, volume }) => {
  const bars = Array.from({ length: 40 });
  const isActive = isProcessing || volume > 2;

  return (
    <div className="relative flex items-center justify-center gap-[4px] h-32 w-full max-w-4xl px-4 overflow-hidden">
      {bars.map((_, i) => {
        // Create a mathematical wave pattern so bars aren't random
        const multiplier = 0.3 + Math.sin(i * 0.5) * 0.5;
        
        return (
          <motion.div
            key={i}
            animate={{
              // Silky smooth height calculation based on volume and wave position
              height: isActive 
                ? Math.max(4, (volume / 100) * 100 * multiplier + 5) 
                : 4,
              opacity: isActive ? 1 : 0.1
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
            className={`w-1.5 rounded-full ${
              isActive ? 'bg-emerald-400' : 'bg-white/10'
            }`}
            style={{
              boxShadow: isActive ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          />
        );
      })}

      {/* STABILIZED AMBIENT GLOW */}
      <div className={`absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

export default PulseVisualizer;
