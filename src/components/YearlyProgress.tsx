import React from 'react';
import { motion } from 'motion/react';
import { CalendarDays } from 'lucide-react';

export const YearlyProgress = () => {
  const now = new Date();
  const year = now.getFullYear();
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeapYear ? 366 : 365;
  
  const start = new Date(year, 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const daysPending = totalDays - dayOfYear;
  
  // Generating grid
  const days = Array.from({ length: totalDays }).map((_, i) => {
      const passed = i < dayOfYear;
      const isToday = i === dayOfYear - 1;
      return { passed, isToday };
  });

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 md:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/[0.05]"
    >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-[0.4em] font-mono">
                        Life Calendar
                    </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-black text-white">
                    Year {year} Progress
                </h3>
            </div>
            
            <div className="flex gap-4 sm:gap-6">
                <div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Days Passed</p>
                   <p className="text-xl font-bold text-white font-mono">{dayOfYear}</p>
                </div>
                <div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Days Pending</p>
                   <p className="text-xl font-bold text-indigo-400 font-mono">{daysPending}</p>
                </div>
            </div>
        </div>

        <div className="w-full flex-wrap flex gap-[3px] md:gap-[4px]">
            {days.map((day, idx) => (
                <div 
                    key={idx}
                    className={`w-[6px] h-[6px] md:w-[8px] md:h-[8px] rounded-[1px] md:rounded-sm transition-colors duration-500
                        ${day.isToday ? 'bg-indigo-400 animate-pulse' : day.passed ? 'bg-white/30' : 'bg-white/5'}
                    `}
                    title={`Day ${idx + 1}`}
                />
            ))}
        </div>
    </motion.div>
  );
};
