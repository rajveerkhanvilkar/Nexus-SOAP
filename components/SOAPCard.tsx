"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SOAPItem {
  text: string;
  confidence: number;
  source: string;
}

export default function SOAPCard({ title, letter, children, delay = 0, items = [], variant = 'green' }: { 
  title: string; 
  letter: string; 
  children?: ReactNode; 
  delay?: number;
  items?: SOAPItem[];
  variant?: 'green' | 'gold';
}) {
  const borderColor = variant === 'green' ? 'border-emerald-500/20' : 'border-amber-500/20';
  const textColor = variant === 'green' ? 'text-emerald-400' : 'text-amber-400';
  const bgColor = variant === 'green' ? 'bg-emerald-500/5' : 'bg-amber-500/5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass rounded-3xl p-6 border ${borderColor} relative overflow-hidden group h-full`}
    >
      <div className={`absolute top-[-20px] right-[-20px] text-[120px] font-black text-white/[0.01] select-none`}>
        {letter}
      </div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <h3 className={`text-lg font-black tracking-widest ${textColor}`}>{letter} - {title.toUpperCase()}</h3>
      </div>

      <div className="space-y-4 relative z-10">
        {items.length > 0 ? items.map((item, i) => {
          const isQuote = item.text.includes("[QUOTE]");
          const cleanText = item.text.replace("[QUOTE]", '"').replace("[/QUOTE]", '"');
          const isHeader = item.text.includes("Vitals:") || item.text.includes("Exams:");
          
          return (
            <div key={i} className={`group/item relative ${isQuote ? 'bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20' : ''}`}>
              <p className={`text-sm leading-relaxed font-medium ${isQuote ? 'text-emerald-400 italic' : 'text-foreground/90'}`}>
                {!isQuote && <span className={textColor}>• </span>}
                {isHeader ? (
                  <>
                    <span className="font-black text-white">{cleanText.split(':')[0]}:</span>
                    {cleanText.split(':')[1]}
                  </>
                ) : cleanText}
              </p>
              {isQuote && <p className="text-[8px] font-bold text-emerald-500/40 mt-1 uppercase tracking-tighter">Patient's Exact Quote Highlighted</p>}
              {!isQuote && (
                <div className="flex items-center gap-2 mt-1 opacity-40">
                  <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${variant === 'green' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${item.confidence}%` }} />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-tighter">Conf: {item.confidence}%</span>
                </div>
              )}
            </div>
          );
        }) : children}
      </div>
    </motion.div>
  );
}
