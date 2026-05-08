"use client";

import { motion } from "framer-motion";

export default function PulseVisualizer({ isProcessing, volume = 0 }: { isProcessing: boolean, volume?: number }) {
  const dots = Array.from({ length: 60 });

  return (
    <div className="flex items-center justify-center gap-[4px] h-20 w-full overflow-hidden">
      {dots.map((_, i) => {
        // Calculate a center-weighted sensitivity
        const distanceFromCenter = Math.abs(i - 30) / 30;
        const sensitivity = 1 - Math.pow(distanceFromCenter, 2);
        
        return (
          <motion.div
            key={i}
            animate={{
              height: isProcessing 
                ? Math.max(4, 4 + (volume * 1.8 * sensitivity)) 
                : 4,
              opacity: isProcessing 
                ? Math.max(0.2, (volume / 50) + (1 - distanceFromCenter * 0.8))
                : 0.1,
              backgroundColor: isProcessing ? "#10b981" : "#ffffff"
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
            className="w-[3px] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]"
          />
        );
      })}
    </div>
  );
}
