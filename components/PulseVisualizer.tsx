"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface PulseVisualizerProps {
  isProcessing: boolean;
  volume: number;
}

const PulseVisualizer: React.FC<PulseVisualizerProps> = ({ isProcessing, volume }) => {
  // Creating a high-fidelity spectral array for the bar-graph look
  const bars = Array.from({ length: 32 });

  return (
    <div className="relative flex items-center justify-center gap-[2px] h-20 w-full max-w-2xl px-4">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: isProcessing 
              ? [10, Math.random() * 60 + 20, 10] 
              : [4, Math.max(4, (volume / 255) * 100 * Math.random() + 4), 4],
            opacity: isProcessing ? [0.2, 0.6, 0.2] : 1
          }}
          transition={{
            duration: isProcessing ? 0.8 : 0.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.02
          }}
          className={`w-1 sm:w-1.5 rounded-full ${
            isProcessing ? 'bg-white/20' : 'bg-emerald-500/40'
          }`}
          style={{
            boxShadow: isProcessing ? 'none' : '0 0 15px rgba(16, 185, 129, 0.2)'
          }}
        />
      ))}

      {/* CENTER GLOW */}
      <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full opacity-50" />
    </div>
  );
};

export default PulseVisualizer;
