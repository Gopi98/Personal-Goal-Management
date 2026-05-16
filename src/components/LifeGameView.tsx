import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Target, BookOpen, Star, Sparkles, Trophy, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useLifeGame } from '../hooks/useLifeGame';

export const LifeGameView = () => {
  const { 
    stats, 
    isStormActive, 
    stormReason, 
    activeMainQuest, 
    currentXP, 
    currentLevel, 
    levelProgress, 
    xpForNextLevel, 
    oracleBannerMessage,
    goals,
    tasks,
    habits
  } = useLifeGame();

  const getPlantStage = (level: number) => {
    if(level >= 10) return { name: 'World Tree', icon: '🌳', color: 'from-emerald-400 to-green-600', description: 'A massive beacon of life.' };
    if(level >= 7) return { name: 'Ancient Oak', icon: '🌲', color: 'from-green-400 to-emerald-500', description: 'Strong and unyielding.' };
    if(level >= 4) return { name: 'Blooming Plant', icon: '🪴', color: 'from-lime-400 to-green-500', description: 'Flourishing with potential.' };
    if(level >= 2) return { name: 'Sprout', icon: '🌿', color: 'from-yellow-400 to-lime-500', description: 'Reaching for the sun.' };
    return { name: 'Seed', icon: '🌰', color: 'from-amber-600 to-amber-800', description: 'Dormant power waiting to awaken.' };
  };

  const plantInfo = getPlantStage(currentLevel);

  const completedGoals = goals?.filter(g => g.completed).length || 0;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalHabitCompletions = habits.reduce((acc, h) => acc + Object.values(h.completedHistory).filter(Boolean).length, 0);

  return (
    <div className="bg-[#0b0f19] text-slate-100 min-h-screen p-4 md:p-8 font-sans overflow-x-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-[20%] w-[60%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 pt-4 pb-16">
        
        {/* Header & Oracle Banner */}
        <header className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 inline-block"
              >
                Life Mechanics
              </motion.h1>
              <p className="text-slate-400 mt-2 text-lg">Your attributes and progress in the game of life.</p>
            </div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/80 border border-slate-700 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 shadow-xl"
            >
              <div className="flex -space-x-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg border-2 border-slate-800 z-10 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  Lvl {currentLevel}
                </div>
              </div>
              <div className="min-w-[120px]">
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>TOTAL XP</span>
                  <span className="text-emerald-400">{currentXP}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden shadow-inner border border-slate-800/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    className="bg-gradient-to-r from-emerald-400 to-blue-500 h-2 rounded-full relative"
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 blur-[2px]" />
                  </motion.div>
                </div>
                <p className="text-[10px] text-slate-500 text-right mt-1 font-mono uppercase">Next Level: {xpForNextLevel} XP</p>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-xl border flex items-center gap-3 backdrop-blur-md ${isStormActive ? 'bg-red-950/40 border-red-500/30 text-red-200' : 'bg-slate-800/50 border-slate-700 text-emerald-100'}`}
          >
            {isStormActive ? <AlertTriangle className="text-red-400 animate-pulse" /> : <Sparkles className="text-emerald-400" />}
            <span className="font-medium text-sm md:text-base leading-relaxed tracking-wide">
              {oracleBannerMessage}
            </span>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Visual: The Stage / Plant */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4"
          >
            <div className={`bg-gradient-to-b ${plantInfo.color} p-[1px] rounded-3xl h-full shadow-[0_0_40px_rgba(16,185,129,0.1)]`}>
              <div className="bg-[#111827] rounded-[23px] h-full p-8 flex flex-col items-center justify-center relative overflow-hidden text-center backdrop-blur-xl">
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[250%] bg-emerald-500/10 mix-blend-screen blur-3xl pointer-events-none animate-pulse-slow" />
                
                <h3 className="text-slate-500 uppercase tracking-[0.2em] text-xs font-bold mb-8 z-10">Current Manifestation</h3>
                
                <motion.div 
                  key={plantInfo.name}
                  initial={{ scale: 0.5, opacity: 0, filter: 'blur(10px)' }}
                  animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ type: "spring", bounce: 0.6, duration: 1 }}
                  className="text-9xl drop-shadow-[0_0_30px_rgba(52,211,153,0.3)] filter relative z-10 hover:scale-105 transition-transform duration-500 cursor-default"
                >
                  {plantInfo.icon}
                  {currentLevel >= 4 && (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-dashed border-emerald-500/30 rounded-full scale-[1.3]" 
                    />
                  )}
                </motion.div>
                
                <div className="mt-10 z-10 space-y-2">
                  <h2 className="text-2xl font-bold text-slate-100">{plantInfo.name}</h2>
                  <p className="text-slate-400 text-sm">{plantInfo.description}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mechanics & Stats */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Real-time Hero Attributes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Shield className="text-emerald-400" size={24} />} title="Vitality" value={stats.vitality} max={100} delay={0.4} color="bg-emerald-500" />
              <StatCard icon={<Trophy className="text-orange-400" size={24} />} title="Mastery" value={stats.mastery} max={100} delay={0.5} color="bg-orange-500" />
              <StatCard icon={<Zap className="text-amber-400" size={24} />} title="Intellect" value={stats.intellect} max={100} delay={0.6} color="bg-amber-500" />
              <StatCard icon={<Star className="text-purple-400" size={24} />} title="Wealth" value={stats.wealth} max={100} delay={0.7} color="bg-purple-500" />
            </div>

            {/* Mechanics Breakdown Table */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Target size={20} className="text-blue-400" /> Experience Sources
              </h3>
              
              <div className="space-y-4">
                <XPBar 
                  label="Completed Goals" 
                  multiplier={500} 
                  count={completedGoals} 
                  icon={<Target size={18} className="text-indigo-400" />} 
                  color="from-indigo-500 to-purple-500"
                />
                <XPBar 
                  label="Completed Tasks" 
                  multiplier={50} 
                  count={completedTasks} 
                  icon={<CheckCircle2 size={18} className="text-teal-400" />} 
                  color="from-teal-400 to-emerald-500"
                />
                <XPBar 
                  label="Habit Consistencies" 
                  multiplier={10} 
                  count={totalHabitCompletions} 
                  icon={<TrendingUp size={18} className="text-blue-400" />} 
                  color="from-blue-400 to-cyan-500"
                />
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex bg-slate-900/50 p-3 rounded-lg items-center gap-4">
                  <div className="p-2 bg-indigo-500/20 rounded-md"><BookOpen size={20} className="text-indigo-400" /></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">Active Main Quest</h4>
                    <p className="text-indigo-300 font-medium">{activeMainQuest}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Total Accumulated Experience</p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                    {currentXP} XP
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

// Helper Components

const StatCard = ({ icon, title, value, max, delay, color }: { icon: React.ReactNode, title: string, value: number, max: number, delay: number, color: string }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#1e293b]/60 border border-slate-700 backdrop-blur-md rounded-2xl p-5 hover:bg-[#1e293b]/80 transition-colors group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        {icon}
      </div>
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="p-2 bg-slate-800 rounded-lg shadow-inner">
          {icon}
        </div>
        <h4 className="font-bold text-slate-300 tracking-wide text-sm">{title}</h4>
      </div>
      
      <div className="flex items-end gap-2 mb-2 relative z-10">
        <span className="text-2xl font-black text-slate-100">{value}</span>
        <span className="text-slate-500 text-sm mb-1 font-medium">/ {max}</span>
      </div>
      
      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 relative z-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, delay: delay + 0.2, ease: "easeOut" }}
          className={`${color} h-full`}
        />
      </div>
    </motion.div>
  );
};

const XPBar = ({ label, multiplier, count, icon, color }: { label: string, multiplier: number, count: number, icon: React.ReactNode, color: string }) => {
  const generatedXP = multiplier * count;
  
  return (
    <div className="group flex items-center gap-4 bg-[#0f172a]/50 hover:bg-[#0f172a]/80 p-3 rounded-xl border border-transparent hover:border-slate-700/50 transition-all">
      <div className="p-2.5 bg-slate-800 rounded-lg shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-semibold text-slate-200 text-sm truncate">{label}</h4>
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">+{multiplier} XP / ea</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">Completed: {count}</span>
          <div className="h-[1px] flex-1 bg-slate-800" />
          <span className={`text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r ${color}`}>
            {generatedXP} XP
          </span>
        </div>
      </div>
    </div>
  );
};
