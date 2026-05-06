import React, { useState, useEffect } from 'react';
import { 
  Home, Target, CheckSquare, Zap, PieChart, 
  Wallet, Settings, Moon, Sun, Search, 
  Plus, Bell, ChevronDown, Flame, Sparkles,
  TrendingUp, Calendar, Clock, Battery, Coffee,
  ChevronRight, Trash2, Edit3, Filter, Menu,
  ArrowUpRight, ArrowDownRight, CornerDownRight, CalendarRange,
  MoreVertical, Share2, Download, Play, Pause, RotateCcw, Trophy, Timer, Quote,
  CheckCircle2, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, 
  Cell, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';

// --- Shared Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <Tooltip text={`Go to ${label}`}>
    <button 
      onClick={onClick}
      aria-label={label}
      className={`w-full flex items-center space-x-4 px-6 py-4 rounded-[20px] transition-all group relative overflow-hidden ${
        active 
          ? 'bg-blue-600/10 text-white border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
          : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="sidebarActive"
          className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none" 
        />
      )}
      <Icon className={`w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${active ? 'text-blue-500' : 'group-hover:text-slate-200'}`} />
      <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10">{label}</span>
      {active && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-4 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,1)]" 
        />
      )}
    </button>
  </Tooltip>
);

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`glass-card p-6 ${className} ${onClick ? 'cursor-pointer' : ''}`}>
    {children}
  </div>
);

const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center justify-center overflow-visible" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.1 }}
            className="absolute z-[100] bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-[#1a1a1e] border border-white/10 text-[9px] font-black text-blue-400 uppercase tracking-widest whitespace-normal text-center min-w-[max-content] max-w-[180px] rounded-md pointer-events-none shadow-2xl backdrop-blur-md"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-white/10" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PomodoroTimer = ({ onComplete, length = 25 }: { onComplete: () => void, length?: number }) => {
  const [timeLeft, setTimeLeft] = useState(length * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    setTimeLeft(mode === 'work' ? length * 60 : 5 * 60);
  }, [length, mode]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      setIsActive(false);
      
      const nextMode = mode === 'work' ? 'break' : 'work';
      setMode(nextMode);
      setTimeLeft(nextMode === 'work' ? 25 * 60 : 5 * 60);
      
      const { addFocusSession } = useHub();
      addFocusSession(length, mode);
      
      onComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, onComplete]);

  const toggle = () => {
    setIsActive(!isActive);
  };
  
  const reset = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl space-y-6">
      <div className="flex items-center space-x-2">
        <Timer className="w-4 h-4 text-blue-400" />
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{mode === 'work' ? 'Deep Work' : 'Refuel Break'}</span>
      </div>
      <div className="text-6xl font-display font-black text-white tabular-nums tracking-tighter">
        {formatTime(timeLeft)}
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggle}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
        >
          {isActive ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white translate-x-0.5" />}
        </button>
        <button onClick={reset} className="p-3 text-slate-500 hover:text-white transition-colors">
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

import { HubProvider, useHub } from './lib/HubContext';
import { getAICoachInsight } from './lib/gemini';

const getMoodTheme = (mood: string | null) => {
  switch (mood) {
    case 'Focus': return 'bg-[#0a0a0c] selection:bg-blue-500/30';
    case 'Calm': return 'bg-[#0d1117] selection:bg-teal-500/30';
    case 'Energized': return 'bg-[#0f0a0a] selection:bg-orange-500/30';
    case 'Stress': return 'bg-[#120e16] selection:bg-purple-500/30';
    case 'Tired': return 'bg-[#0a0c10] selection:bg-slate-500/30';
    default: return 'bg-[#0a0a0c] selection:bg-blue-500/30';
  }
};

const getMoodAccent = (mood: string | null) => {
  switch (mood) {
    case 'Focus': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    case 'Calm': return 'text-teal-400 border-teal-500/30 bg-teal-500/10';
    case 'Energized': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    case 'Stress': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    case 'Tired': return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    default: return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  }
};

// --- Sub-views ---

const HomeView = () => {
  const { goals, tasks, selectedMood, setSelectedMood, reflections } = useHub();
  const [insight, setInsight] = useState<string | null>(null);
  const [motivation, setMotivation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMotivation = async () => {
      try {
        const { getDailyMotivation } = await import('./lib/gemini');
        const m = await getDailyMotivation(selectedMood);
        setMotivation(m);
      } catch (e) {
        console.error("Motivation error:", e);
      }
    };
    fetchMotivation();
  }, [selectedMood]);

  const activeGoals = goals.filter(g => !g.completed).length;
  const todayTasks = tasks.filter(t => t.date === new Date().toISOString().split('T')[0]);
  const completedToday = todayTasks.filter(t => t.completed).length;

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.date === dateStr);
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      completed: dayTasks.filter(t => t.completed).length,
      total: dayTasks.length
    };
  });

  const moodResponses: Record<string, string> = {
    'Focus': 'Great choice. Eliminate all notifications and dive deep.',
    'Calm': 'Peace is the foundation of clarity. Take a breath.',
    'Energized': 'Momentum is on your side. Tackle the hardest task now.',
    'Stress': 'Break tasks into tiny pieces. You can handle this.',
    'Tired': 'Focus on low-energy tasks or take a short active break.'
  };

  const handleGetInsight = async () => {
    setLoading(true);
    const data = {
      activeGoals: goals.filter(g => !g.completed).map(g => g.title),
      todayTasks: todayTasks.map(t => t.title),
      completedCount: completedToday
    };
    const { getAICoachInsight } = await import('./lib/gemini');
    const res = await getAICoachInsight(data);
    setInsight(res);
    setLoading(false);
  };

  return (
    <div className="space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section with better hierarchy */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 text-blue-500"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono">Mission Status</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white leading-[0.9]">
            System <span className="text-blue-600">Operational.</span><br />
            Good afternoon.
          </h2>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
            Your command center is synchronized. Current trajectory: <span className="text-slate-200">Optimal.</span>
          </p>
        </div>

        {selectedMood && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 flex items-center space-x-6 min-w-[320px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/[0.05]"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl shadow-inner border border-white/[0.05]">
              {selectedMood === 'Focus' && '🎯'}
              {selectedMood === 'Calm' && '🧘'}
              {selectedMood === 'Energized' && '⚡'}
              {selectedMood === 'Stress' && '🌪️'}
              {selectedMood === 'Tired' && '☕'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Intelligence</p>
              <p className="text-sm text-slate-200 font-medium leading-snug">{moodResponses[selectedMood]}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Hero Quote Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden group rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.1] via-indigo-600/[0.05] to-purple-600/[0.1] backdrop-blur-3xl border border-white/[0.08]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full -mr-32 -mt-32 opacity-50" />
        <div className="relative p-12 sm:p-20 flex flex-col items-center text-center space-y-8">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-3 text-blue-500">
              <Quote className="w-5 h-5 opacity-40" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] font-mono opacity-60">Quote of the Day</span>
            </div>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Cognitive Priming Protocol</p>
          </div>
          <blockquote className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white leading-[1] tracking-tighter max-w-4xl drop-shadow-2xl">
             {motivation || 'Focus is the art of knowing what to ignore.'}
          </blockquote>
          <div className="flex items-center space-x-8">
             <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-white/10" />
             <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Intelligence Signal Active</span>
             </div>
             <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>
      </motion.div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {['Focus', 'Calm', 'Energized', 'Stress', 'Tired'].map((m, i) => (
          <button 
            key={m}
            onClick={() => setSelectedMood(m)}
            className={`group p-4 sm:p-6 rounded-[32px] border transition-all duration-300 relative overflow-hidden ${selectedMood === m ? 'bg-blue-600 border-blue-500 shadow-[0_20px_40px_rgba(37,99,235,0.4)]' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10'}`}
          >
            {selectedMood === m && (
               <motion.div 
                 layoutId="activeMoodHome"
                 className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" 
               />
            )}
            <div className="relative z-10 flex flex-col items-center space-y-3">
              <span className={`text-2xl sm:text-3xl transition-transform duration-500 ${selectedMood === m ? 'scale-110' : 'group-hover:scale-125'}`}>
                {m === 'Focus' && '🎯'}
                {m === 'Calm' && '🧘'}
                {m === 'Energized' && '⚡'}
                {m === 'Stress' && '🌪️'}
                {m === 'Tired' && '☕'}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${selectedMood === m ? 'text-white' : 'text-slate-500'}`}>{m}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI & Stats */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
           <GlassCard className="md:col-span-2 p-8 group hover:border-blue-500/30 transition-all shadow-2xl backdrop-blur-3xl overflow-visible">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
                <div className="space-y-6 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 text-blue-500">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">Expert System Insight</span>
                  </div>
                  <div className="min-h-[100px]">
                    <h4 className="text-2xl font-display font-bold text-white mb-3">
                      {insight ? 'Strategic Audit Complete' : 'Perform Strategic Audit'}
                    </h4>
                    <p className="text-slate-400 text-base leading-relaxed line-clamp-3">
                      {insight || 'Synthesize your task velocity and goal trajectories into a personalized coaching plan.'}
                    </p>
                  </div>
                  <button 
                    onClick={handleGetInsight}
                    disabled={loading}
                    className="flex items-center space-x-4 bg-white text-black px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>{loading ? 'Processing...' : 'Run Audit'}</span>
                  </button>
                </div>
                {insight && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="w-32 h-32 hidden md:flex items-center justify-center bg-blue-600/10 rounded-3xl border border-blue-500/20"
                   >
                     <Zap className="w-12 h-12 text-blue-400" />
                   </motion.div>
                )}
              </div>
           </GlassCard>

           <GlassCard className="p-8 flex flex-col justify-between">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-8">Performance Score</p>
              <div className="flex items-baseline space-x-1">
                <span className="text-6xl font-display font-black text-white">{completedToday * 20 + 42}</span>
                <span className="text-blue-500 font-bold">PTS</span>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Daily Target</span>
                    <span className="text-white font-black">{Math.min(100, completedToday * 25)}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, completedToday * 25)}%` }}
                      className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                    />
                 </div>
              </div>
           </GlassCard>
        </div>

        {/* Detailed Analytics Grid */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'ACTIVE MISSIONS', value: activeGoals.toString(), icon: Target, color: 'text-blue-400', sub: 'Critical Path' },
            { label: 'OP VELOCITY', value: `${completedToday}/${todayTasks.length}`, icon: CheckSquare, color: 'text-orange-400', sub: 'Today Completion' },
            { label: 'SYNC STREAK', value: '1d', icon: Flame, color: 'text-rose-400', sub: 'Rhythm Consistency' },
            { label: 'DEEP WORK', value: '2.5h', icon: Timer, color: 'text-blue-400', sub: 'Focus Duration' },
          ].map((card, i) => (
            <GlassCard key={i} className="p-6 group hover:translate-y-[-4px] transition-all duration-300">
               <div className={`w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6 group-hover:bg-white/[0.08] transition-all border border-white/[0.05]`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{card.label}</p>
                 <h4 className="text-3xl font-display font-black text-white">{card.value}</h4>
                 <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mt-2">{card.sub}</p>
               </div>
            </GlassCard>
          ))}
        </div>

        {/* Chart Card */}
        <div className="lg:col-span-12">
           <GlassCard className="p-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase font-mono">Operations Log</p>
                  <h3 className="text-3xl font-display font-black text-white">Efficiency Matrix</h3>
                </div>
                <div className="flex items-center space-x-6">
                   <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-[10px] font-black text-slate-500 uppercase">Completed</span>
                   </div>
                   <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <span className="text-[10px] font-black text-slate-500 uppercase">Backlog</span>
                   </div>
                </div>
              </div>
              <div className="h-[250px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={chartData} barGap={4}>
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: '#475569', fontSize: 11, fontWeight: 900}} 
                       dy={10}
                    />
                    <ReTooltip 
                      cursor={{fill: 'rgba(255,255,255,0.03)'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#0c0c0e] border border-white/10 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                              <p className="text-[10px] font-black text-blue-400 uppercase mb-1 tracking-widest">{payload[0].payload.name} Statistics</p>
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-white">{payload[0].value} Tasks Finished</p>
                                <p className="text-[9px] text-slate-500 uppercase">Total Capacity: {payload[0].payload.total}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="completed" radius={[6, 6, 6, 6]} barSize={24}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 6 ? '#2563eb' : 'rgba(255,255,255,0.1)'} strokeWidth={0} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
};

const GoalsView = () => {
  const { goals, addGoal, toggleGoal, deleteGoal, addTask, addSubtask, toggleSubtask, deleteSubtask, bulkAddGoalSubtasks } = useHub();
  const [newTitle, setNewTitle] = useState('');
  const [newSubtask, setNewSubtask] = useState<{ [key: string]: string }>({});
  const [priority, setPriority] = useState<'A' | 'B' | 'C' | 'D'>('B');
  const [filter, setFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [promotionFeedback, setPromotionFeedback] = useState<string | null>(null);
  const [isSplitting, setIsSplitting] = useState<{ [key: string]: boolean }>({});
  const [parentGoalId, setParentGoalId] = useState<string | undefined>();

  const handleAutoSplit = async (goal: any) => {
    setIsSplitting({ ...isSplitting, [goal.id]: true });
    const { getGoalBreakdown } = await import('./lib/gemini');
    const steps = await getGoalBreakdown(goal.title);
    if (steps.length > 0) {
      bulkAddGoalSubtasks(goal.id, steps);
    }
    setIsSplitting({ ...isSplitting, [goal.id]: false });
  };

  const filteredGoals = filter === 'All' ? goals : goals.filter(g => g.type === filter.toLowerCase());

  const handleAdd = (type: 'yearly' | 'monthly' | 'weekly') => {
    if (!newTitle.trim()) return;
    addGoal({
      title: newTitle,
      type,
      priority,
      completed: false,
      parentGoalId
    });
    setNewTitle('');
    setParentGoalId(undefined);
  };

  const handleAddSub = (goalId: string) => {
    const title = newSubtask[goalId];
    if (!title?.trim()) return;
    addSubtask(goalId, title);
    setNewSubtask({ ...newSubtask, [goalId]: '' });
  };

  const handlePromote = (goal: any, item: { title: string }) => {
    let nextType = '';
    if (goal.type === 'yearly') {
      addGoal({ title: item.title, type: 'monthly', priority: goal.priority, completed: false });
      nextType = 'Monthly Goal';
    } else if (goal.type === 'monthly') {
      addGoal({ title: item.title, type: 'weekly', priority: goal.priority, completed: false });
      nextType = 'Weekly Goal';
    } else if (goal.type === 'weekly') {
      addTask({ title: item.title, date: new Date().toISOString().split('T')[0], priority: goal.priority, type: 'one-off', tags: ['#from-goals'] });
      nextType = 'Daily Task';
    }
    
    setPromotionFeedback(`Promoted to ${nextType}!`);
    setTimeout(() => setPromotionFeedback(null), 3000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <AnimatePresence>
        {promotionFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center space-x-4 font-black text-xs uppercase tracking-widest"
          >
            <Trophy className="w-5 h-5" />
            <span>{promotionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-blue-500">
             <Target className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono opacity-60">Strategic Layer</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white">Missions.</h2>
          <p className="text-slate-500 font-medium">Architect your long-term success. Filter by temporal scope.</p>
        </div>

        <div className="flex bg-white/[0.03] border border-white/10 rounded-3xl p-1 gap-1">
          {['All', 'Yearly', 'Monthly', 'Weekly'].map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${filter === t ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <GlassCard className="p-1 max-w-4xl mx-auto !rounded-[40px] overflow-hidden group focus-within:border-blue-500/30 transition-all shadow-2xl">
        <div className="p-10 space-y-8">
           <input 
            type="text" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Define your next objective..." 
            className="w-full bg-transparent border-none focus:ring-0 text-white text-3xl placeholder:text-slate-800 font-display font-black text-center"
          />

          <div className="flex flex-wrap items-center justify-center gap-4">
             <div className="flex items-center space-x-3 bg-white/5 rounded-2xl px-5 py-3 border border-white/10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</span>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-black text-white focus:ring-0 p-0 cursor-pointer [&>option]:bg-[#0a0a0c] [&>option]:text-white"
                >
                  <option value="A">Priority A</option>
                  <option value="B">Priority B</option>
                  <option value="C">Priority C</option>
                </select>
             </div>

             <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handleAdd('yearly')} className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all shadow-lg active:scale-95">Yearly</button>
                <button onClick={() => handleAdd('monthly')} className="bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all shadow-lg active:scale-95">Monthly</button>
                <button onClick={() => handleAdd('weekly')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all shadow-lg active:scale-95">Weekly</button>
             </div>
          </div>
        </div>
      </GlassCard>

      <Tooltip text="Get AI advice on where to direct your energy next">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-3 text-blue-400 cursor-pointer hover:bg-white/10 transition-all max-w-4xl mx-auto">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">Tell me what to focus on</span>
        </div>
      </Tooltip>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGoals.map((goal) => (
          <motion.div layout key={goal.id} className={`glass-card group hover:border-white/20 transition-all ${goal.completed ? 'opacity-60 grayscale-[0.5]' : ''} p-1 rounded-[32px]`}>
            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <button 
                  onClick={() => toggleGoal(goal.id)}
                  className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${goal.completed ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'border-white/10 hover:border-white/30 text-white'}`}
                >
                  {goal.completed ? <CheckSquare className="w-6 h-6" /> : <div className="w-3 h-3 rounded-full bg-white/10" />}
                </button>
                <div className="flex items-center space-x-1">
                   {goal.type !== 'weekly' && !goal.completed && (
                      <button 
                        onClick={() => handlePromote(goal, { title: goal.title })}
                        className="p-3 bg-white/5 rounded-xl text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        <ArrowUpRight className="w-5 h-5" />
                      </button>
                   )}
                   <button 
                     onClick={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
                     className={`p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all ${expandedId === goal.id ? 'rotate-180 bg-white/10' : ''}`}
                   >
                     <ChevronDown className="w-5 h-5" />
                   </button>
                   <button onClick={() => deleteGoal(goal.id)} className="p-3 hover:text-red-500 transition-colors text-slate-700">
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className={`text-2xl font-display font-black tracking-tight ${goal.completed ? 'line-through text-slate-600' : 'text-white'}`}>{goal.title}</h4>
                <div className="flex items-center space-x-3">
                   <span className="text-[9px] font-black bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest">{goal.type}</span>
                   <span className="text-[9px] font-black bg-white/10 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">Priority {goal.priority}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Progress</span>
                  <span className="text-[10px] font-black text-white font-mono">{goal.progress}% COMPLETE</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    className={`h-full transition-all duration-1000 ${
                      goal.completed ? 'bg-blue-600' : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                    }`} 
                  />
                </div>
              </div>

              <AnimatePresence>
                {expandedId === goal.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="pt-6 border-t border-white/5 space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        value={newSubtask[goal.id] || ''}
                        onChange={(e) => setNewSubtask({ ...newSubtask, [goal.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSub(goal.id)}
                        placeholder="Add sub-mission..."
                        className="flex-1 bg-white/5 border border-white/5 rounded-[20px] px-6 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                      <button 
                        onClick={() => handleAutoSplit(goal)}
                        disabled={isSplitting[goal.id]}
                        className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl hover:bg-blue-600/20 transition-all border border-blue-500/10 disabled:opacity-50"
                      >
                         {isSplitting[goal.id] ? <Clock className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(goal.subtasks || []).map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl group/sub hover:bg-white/[0.04] transition-all">
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => toggleSubtask(goal.id, sub.id)}
                              className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center ${sub.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10'}`}
                            >
                              {sub.completed && <CheckSquare className="w-3.5 h-3.5" />}
                            </button>
                            <span className={`text-sm font-bold ${sub.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{sub.title}</span>
                          </div>
                          <button onClick={() => deleteSubtask(goal.id, sub.id)} className="opacity-0 group-hover/sub:opacity-100 transition-all text-slate-700 hover:text-red-500">
                             <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
        {filteredGoals.length === 0 && (
          <div className="text-center py-24 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] md:col-span-2">
            <p className="text-slate-600 font-bold uppercase tracking-widest">No active mission clusters</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TasksView = () => {
  const { tasks, addTask, toggleTask, deleteTask, postponeTask, goals, addTaskSubtask, toggleTaskSubtask, deleteTaskSubtask, bulkAddTaskSubtasks, focusTaskId, setFocusTaskId, smartPrioritizeTasks } = useHub();
  const [newTitle, setNewTitle] = useState('');
  const [newSubtask, setNewSubtask] = useState<{ [key: string]: string }>({});
  const [priority, setPriority] = useState<'A' | 'B' | 'C' | 'D'>('B');
  const [duration, setDuration] = useState('30m');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [energy, setEnergy] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [type, setType] = useState<'one-off' | 'daily' | 'break'>('one-off');
  const [tags, setTags] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [pomoLength, setPomoLength] = useState(25);
  const [freeTime, setFreeTime] = useState({ start: '09:00', end: '18:00' });
  const [isSplitting, setIsSplitting] = useState<{ [key: string]: boolean }>({});
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const handleApplySmartPrioritize = async () => {
    setIsPrioritizing(true);
    await smartPrioritizeTasks();
    setIsPrioritizing(false);
  };

  const handleAddSub = (taskId: string) => {
    const title = newSubtask[taskId];
    if (!title?.trim()) return;
    addTaskSubtask(taskId, title);
    setNewSubtask({ ...newSubtask, [taskId]: '' });
  };

  const handleTaskAutoSplit = async (task: any) => {
    setIsSplitting({ ...isSplitting, [task.id]: true });
    const { getGoalBreakdown } = await import('./lib/gemini');
    const steps = await getGoalBreakdown(task.title);
    if (steps.length > 0) {
      bulkAddTaskSubtasks(task.id, steps);
    }
    setIsSplitting({ ...isSplitting, [task.id]: false });
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle,
      date: new Date().toISOString().split('T')[0],
      priority,
      startTime,
      endTime,
      duration,
      energy,
      type: type as any,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
    setNewTitle('');
    setTags('');
  };

  const handlePostpone = (task: any) => {
    postponeTask(task.id);
  };

  const handleAutoSchedule = async () => {
    const data = {
      pendingTasks: tasks.filter(t => !t.completed).map(t => t.title),
      goals: goals.filter(g => !g.completed).map(g => g.title),
      freeTime,
      pomodoroFocus: pomoLength
    };
    const res = await getAICoachInsight(data);
    alert(`AI Coach Schedule Suggestion:\n${res}`);
    setShowAutoSchedule(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 text-rose-500"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono opacity-60">Operational Duty</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white">Daily Tasks.</h2>
          <p className="text-slate-500 font-medium max-w-md">Synchronize your daily operations. Execute with precision.</p>
        </div>
        
        <div className="flex items-center space-x-3">
           <button 
             onClick={() => setShowAutoSchedule(true)}
             className="px-6 py-4 bg-white/[0.03] border border-white/10 rounded-[24px] text-white hover:bg-white/[0.08] transition-all flex items-center space-x-3 group"
           >
             <Timer className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
             <span className="text-[10px] font-black uppercase tracking-widest">Auto Schedule</span>
           </button>
           <button 
             onClick={handleApplySmartPrioritize}
             disabled={isPrioritizing}
             className="px-8 py-4 bg-blue-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.2)] disabled:opacity-50 flex items-center space-x-3"
           >
             {isPrioritizing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
             <span>{isPrioritizing ? 'Ranking...' : 'Smart Sort'}</span>
           </button>
        </div>
      </div>

      <AnimatePresence>
        {showAutoSchedule && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card p-6 sm:p-10 border-blue-500/20"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">AI Engine</p>
                <h4 className="text-2xl font-display font-black text-white">Temporal Optimization</h4>
              </div>
              <button onClick={() => setShowAutoSchedule(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <Plus className="w-6 h-6 rotate-45 text-slate-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Window Access</label>
                <div className="flex items-center space-x-2 bg-white/5 p-2 rounded-2xl border border-white/5">
                  <input type="time" value={freeTime.start} onChange={e => setFreeTime({...freeTime, start: e.target.value})} className="bg-transparent border-none text-white font-bold text-sm focus:ring-0 w-24" />
                  <span className="text-slate-700">TO</span>
                  <input type="time" value={freeTime.end} onChange={e => setFreeTime({...freeTime, end: e.target.value})} className="bg-transparent border-none text-white font-bold text-sm focus:ring-0 w-24" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Block Size (M)</label>
                <input type="number" value={pomoLength} onChange={e => setPomoLength(Number(e.target.value))} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:ring-1 focus:ring-blue-500/50" />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleAutoSchedule}
                  className="w-full h-14 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition shadow-2xl active:scale-95"
                >
                  Regenerate Routine
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlassCard className="p-1 max-w-4xl mx-auto !rounded-[32px] sm:!rounded-[40px] overflow-hidden group focus-within:border-blue-500/30 transition-all shadow-2xl">
        <div className="p-4 sm:p-8 space-y-6">
          <input 
            type="text" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What is your next mission?" 
            className="w-full bg-transparent border-none focus:ring-0 text-white text-xl sm:text-3xl placeholder:text-slate-800 font-display font-black text-center"
          />
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center">
            <div className="flex items-center bg-white/5 rounded-2xl px-5 py-3 border border-white/5 text-[10px] font-black text-slate-400">
              <Calendar className="w-4 h-4 mr-2 opacity-30" />
              <span>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
            </div>
            
            <div className="flex items-center bg-white/5 rounded-2xl px-5 py-3 border border-white/5 text-[10px] font-black text-slate-400">
              <Clock className="w-4 h-4 mr-2 opacity-30" />
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer w-16" />
              <span className="mx-2 opacity-20">-</span>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer w-16" />
            </div>
            
            <div className="flex items-center bg-white/5 rounded-2xl px-5 py-3 border border-white/5 text-[10px] font-black text-slate-400">
              <Zap className="w-4 h-4 mr-2 text-blue-500" />
              <select 
                value={energy} 
                onChange={(e) => setEnergy(e.target.value as any)}
                className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-white font-black uppercase [&>option]:bg-[#0a0a0c] [&>option]:text-white"
              >
                <option value="High">Hyper</option>
                <option value="Medium">Steady</option>
                <option value="Low">Mellow</option>
              </select>
            </div>

            <button onClick={handleAdd} className="bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] px-10 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5">+ Deploy</button>
          </div>
          <input 
            type="text" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags: #urgent, #deep, #admin" 
            className="w-full bg-transparent border-t border-white/5 pt-6 text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest placeholder:text-slate-800 focus:outline-none"
          />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <motion.div 
            layout
            key={task.id} 
            className={`glass-card group hover:border-white/20 transition-all h-full flex flex-col p-6 rounded-[32px] ${focusTaskId === task.id ? 'border-blue-500/50 bg-blue-600/[0.03] ring-1 ring-blue-500/20' : ''}`}
          >
            <div className="flex items-start justify-between mb-6">
              <button 
                onClick={() => toggleTask(task.id)}
                className={`w-8 h-8 border-2 rounded-xl flex-shrink-0 transition-all flex items-center justify-center ${task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10 hover:border-white/30'}`}
              >
                {task.completed && <CheckCircle2 className="w-5 h-5" />}
              </button>
              <div className="flex items-center space-x-1">
                {!task.completed && (
                  <button 
                    onClick={() => setFocusTaskId(focusTaskId === task.id ? null : task.id)}
                    className={`p-3 rounded-xl transition-all ${focusTaskId === task.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white bg-white/5 hover:bg-white/10'}`}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                  </button>
                )}
                <button 
                  onClick={() => handlePostpone(task)}
                  className="p-3 text-slate-500 hover:text-orange-500 bg-white/5 hover:bg-orange-500/10 rounded-xl transition-all"
                >
                  <CalendarRange className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4">
                <h5 className={`text-xl font-display font-black tracking-tight leading-tight transition-all ${task.completed ? 'text-slate-600 line-through opacity-50' : 'text-white'}`}>{task.title}</h5>
                <div className="flex flex-wrap gap-2">
                  {task.startTime && (
                    <span className="text-[9px] font-black bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full uppercase">
                      {task.startTime} - {task.endTime || '??:??'}
                    </span>
                  )}
                  <span className="text-[9px] font-black bg-white/10 text-slate-500 px-3 py-1 rounded-full uppercase">{task.energy || 'Steady'}</span>
                  <span className="text-[9px] font-black bg-white/10 text-slate-500 px-3 py-1 rounded-full uppercase">{task.duration || '30m'}</span>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
               <div className="flex -space-x-1">
                  {task.tags?.map(tag => (
                    <span key={tag} className="text-[8px] font-black text-slate-600 uppercase tracking-tighter px-2 py-1 bg-white/[0.03] rounded-md border border-white/[0.04] mr-1">#{tag}</span>
                  ))}
               </div>
               <div className="flex items-center space-x-2">
                 <button 
                   onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                   className={`p-2 text-slate-600 hover:text-white transition-transform ${expandedId === task.id ? 'rotate-180' : ''}`}
                 >
                   <ChevronDown className="w-4 h-4" />
                 </button>
                 <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-700 hover:text-red-500 transition-colors">
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
            </div>
            
            <AnimatePresence>
              {expandedId === task.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-5 pt-0 border-t border-white/5 space-y-4"
                >
                  <div className="flex items-center space-x-2 mt-4">
                    <div className="flex items-center space-x-2 flex-1">
                      <input 
                        type="text" 
                        value={newSubtask[task.id] || ''}
                        onChange={(e) => setNewSubtask({ ...newSubtask, [task.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSub(task.id)}
                        placeholder="Add a step..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                      <Tooltip text="Add manual step">
                        <button 
                          onClick={() => handleAddSub(task.id)}
                          className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                    <Tooltip text="Use AI to break this task into sub-steps">
                      <button 
                        onClick={() => handleTaskAutoSplit(task)}
                        disabled={isSplitting[task.id]}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-tighter text-blue-400 hover:bg-blue-600/20 transition-all disabled:opacity-50"
                      >
                        {isSplitting[task.id] ? <Clock className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span>{isSplitting[task.id] ? 'Splitting...' : 'Auto-split'}</span>
                      </button>
                    </Tooltip>
                  </div>

                  <div className="space-y-2">
                    {(task.subtasks || []).map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between group/sub">
                        <div className="flex items-center space-x-3">
                          <Tooltip text={sub.completed ? "Mark step pending" : "Complete step"}>
                            <button 
                              onClick={() => toggleTaskSubtask(task.id, sub.id)}
                              className={`w-4 h-4 rounded border transition-all ${sub.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/20'}`}
                            >
                              {sub.completed && <CheckSquare className="w-3 h-3 mx-auto" />}
                            </button>
                          </Tooltip>
                          <span className={`text-sm ${sub.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{sub.title}</span>
                        </div>
                        <Tooltip text="Remove step">
                          <button onClick={() => deleteTaskSubtask(task.id, sub.id)} className="lg:opacity-0 lg:group-hover/sub:opacity-100 transition-opacity text-slate-700 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    ))}
                    {(task.subtasks || []).length === 0 && (
                      <p className="text-xs text-slate-600 italic">No steps yet. Break it down for more focus.</p>
                    )}
                  </div>

                  <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest pt-4 border-t border-white/5">Energy level: {task.energy} | Planned Duration: {task.duration}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-2xl">
            <p className="text-slate-500 font-medium">Your schedule is clear! Add your first task above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const InsightsView = () => {
  const { goals, tasks, habits, selectedMood, setSelectedMood, reflections, addReflection, focusSessions } = useHub();
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflection, setReflection] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleGetDeepAnalysis = async () => {
    setIsAnalyzing(true);
    const data = {
      goals: goals.map(g => ({ title: g.title, completed: g.completed, type: g.type })),
      tasks: tasks.map(t => ({ title: t.title, completed: t.completed, priority: t.priority })),
      focusSessions: focusSessions.map(s => ({ duration: s.duration, type: s.type, date: s.date }))
    };
    const { getDeepAnalysis } = await import('./lib/gemini');
    const res = await getDeepAnalysis(data);
    setDeepAnalysis(res);
    setIsAnalyzing(false);
  };

  const handleSave = () => {
    if (reflection.trim()) {
      addReflection(reflection.trim());
      setReflection('');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsReflecting(false);
      }, 1500);
    }
  };

  const completedGoals = goals.filter(g => g.completed).length;
  const taskCompletionRate = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  
  const totalFocusMinutes = focusSessions
    .filter(s => s.type === 'work' && s.date.includes(new Date().toISOString().split('T')[0]))
    .reduce((acc, s) => acc + s.duration, 0);
  
  const focusHours = Math.floor(totalFocusMinutes / 60);
  const focusMins = totalFocusMinutes % 60;

  const focusChartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySessions = focusSessions.filter(s => s.date.includes(dateStr) && s.type === 'work');
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      minutes: daySessions.reduce((acc, s) => acc + s.duration, 0)
    };
  });

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-indigo-500">
           <Zap className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono opacity-60">Intelligence Layer</span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white">Quantum.</h2>
        <p className="text-slate-500 font-medium">Deconstruct your behavioral data. Identify growth vectors.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'MISSION PROGRESS', value: completedGoals.toString(), max: goals.length.toString(), icon: Target, accent: 'text-blue-500' },
          { label: 'EXECUTION FLOW', value: `${taskCompletionRate}%`, max: `${tasks.length} OPS`, icon: CheckSquare, accent: 'text-emerald-500' },
          { label: 'DEEP WORK', value: `${focusHours}H ${focusMins}M`, max: 'TRACKED', icon: Zap, accent: 'text-orange-500' },
          { label: 'HABIT LOOP', value: habits.length.toString(), max: 'CIRCUITS', icon: Flame, accent: 'text-rose-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-1 !rounded-[32px] overflow-hidden group">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className={`p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-hover:scale-110 transition-transform ${stat.accent}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-600 tracking-widest uppercase mb-1">{stat.label}</p>
                   <p className="text-xs font-bold text-slate-800 uppercase tabular-nums">/ {stat.max}</p>
                </div>
              </div>
              <p className="text-5xl font-display font-black text-white tracking-tighter">{stat.value}</p>
            </div>
            <div className="h-1 w-full bg-white/[0.02]">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '100%' }}
                 transition={{ duration: 2, delay: i * 0.2 }}
                 className={`h-full opacity-30 ${stat.accent.replace('text-', 'bg-')}`} 
               />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-1 !rounded-[40px] overflow-hidden">
          <div className="p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                 <Sparkles className="w-5 h-5 text-blue-500" />
                 <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase font-mono">Neural Audit</span>
              </div>
              <button 
                onClick={handleGetDeepAnalysis}
                disabled={isAnalyzing}
                className="bg-blue-600/10 border border-blue-500/20 text-[9px] font-black text-blue-400 px-5 py-2.5 rounded-full uppercase tracking-widest hover:bg-blue-600/20 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? 'Processing...' : 'Engage Audit'}
              </button>
            </div>
            
            <div className="min-h-[280px] flex items-center justify-center">
              {deepAnalysis ? (
                <div className="text-slate-300 text-sm leading-8 font-medium space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  {deepAnalysis.split('\n').filter(Boolean).map((p, i) => (
                    <div key={i} className="flex gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-600/30 mt-3 shrink-0" />
                       <p>{p}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-slate-800" />
                  </div>
                  <p className="text-slate-600 text-xs font-black uppercase tracking-[0.2em] max-w-xs leading-loose">Waiting for deep analysis initialization. Initiate audit to begin.</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-1 !rounded-[40px] overflow-hidden">
          <div className="p-10 space-y-8 h-full">
            <div className="flex items-center space-x-3">
               <TrendingUp className="w-5 h-5 text-emerald-500" />
               <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase font-mono">Focus Trajectory</span>
            </div>
            
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={focusChartData}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                  <ReTooltip 
                    contentStyle={{backgroundColor: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '10px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}
                    labelStyle={{color: '#64748b', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase'}}
                  />
                  <Area type="monotone" dataKey="minutes" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMinutes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-1 !rounded-[40px] overflow-hidden">
         <div className="p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                 <Calendar className="w-5 h-5 text-orange-500" />
                 <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase font-mono">Behavioral Consistency</span>
              </div>
              <div className="flex items-center space-x-4">
                 <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest">System Load: Moderate</span>
              </div>
            </div>

            <div className="grid grid-cols-7 md:grid-cols-10 gap-2">
              {Array.from({ length: 30 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                const dateStr = d.toISOString().split('T')[0];
                const sessionsCount = focusSessions.filter(s => s.date.includes(dateStr)).length;
                const tasksCount = tasks.filter(t => t.date === dateStr && t.completed).length;
                const activityLevel = sessionsCount + tasksCount;
                
                return (
                  <Tooltip key={i} text={`${dateStr}: ${activityLevel} Operations`}>
                    <motion.div 
                      key={i} 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`aspect-square rounded-xl border border-white/[0.03] transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                        activityLevel === 0 ? 'bg-white/[0.02]' : 
                        activityLevel === 1 ? 'bg-blue-600/30' :
                        activityLevel === 2 ? 'bg-blue-600/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]' :
                        activityLevel === 3 ? 'bg-blue-600/70 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)]'
                      }`}
                    />
                  </Tooltip>
                );
              })}
            </div>

            <div className="flex justify-end items-center space-x-4">
              <span className="text-[10px] text-slate-700 font-black tracking-widest uppercase">Idle</span>
              <div className="flex space-x-1.5">
                {[0, 2, 4, 6, 8].map((v) => (
                   <div key={v} className={`w-3 h-3 rounded-md ${v === 0 ? 'bg-white/[0.02]' : `bg-blue-600 opacity-[0.${v}]`}`} />
                ))}
              </div>
              <span className="text-[10px] text-slate-700 font-black tracking-widest uppercase">Peak</span>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-white/5">
        <div className="space-y-8">
           <div className="space-y-2">
             <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] font-mono">Real-time Telemetry</span>
             <h3 className="text-3xl font-display font-black text-white">Affective State.</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             {[
               { icon: '🎯', label: 'Focus', sub: 'Single-tasking excellence' },
               { icon: '🔋', label: 'Energized', sub: 'Maximum output potential' },
               { icon: '🧘', label: 'Calm', sub: 'Sustained parasympathetic state' },
               { icon: '😫', label: 'Stressed', sub: 'High cortisol detection' },
               { icon: '☕', label: 'Tired', sub: 'Energy depletion phase' }
             ].map((mood, i) => (
               <button 
                 key={i}
                 onClick={() => setSelectedMood(mood.label)}
                 className={`p-6 !rounded-[28px] glass-card text-left space-y-4 group transition-all relative overflow-hidden ${selectedMood === mood.label ? 'border-blue-500/50 bg-blue-600/10' : 'hover:border-white/20'}`}
               >
                  <span className="text-4xl block transition-transform group-hover:scale-110">{mood.icon}</span>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${selectedMood === mood.label ? 'text-blue-500' : 'text-slate-500'}`}>{mood.label}</p>
                    <p className="text-[10px] font-bold text-slate-700 mt-1 uppercase tracking-tighter">{mood.sub}</p>
                  </div>
                  {selectedMood === mood.label && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,1)]" />}
               </button>
             ))}
           </div>
        </div>

        <div className="space-y-8">
           <div className="space-y-2">
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] font-mono">Qualitative Analysis</span>
             <h3 className="text-3xl font-display font-black text-white">Daily Reflection.</h3>
           </div>

            {isReflecting ? (
              <GlassCard className="p-10 !rounded-[40px] space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                   <p className="text-xl font-display font-black text-white">Identify your primary victory.</p>
                   <p className="text-xs font-medium text-slate-500">Documenting success reinforces neural pathways associated with achievement.</p>
                </div>
                <textarea 
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="The mission success coordinates were..."
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-[30px] p-8 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[220px] font-medium leading-loose"
                />
                <div className="flex justify-end items-center space-x-6">
                  {showSuccess && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Sync Complete</motion.span>
                  )}
                  <button onClick={() => setIsReflecting(false)} className="text-[10px] font-black text-slate-700 hover:text-white uppercase tracking-widest transition-colors">Abort</button>
                  <button 
                    onClick={handleSave}
                    disabled={showSuccess || !reflection.trim()}
                    className={`bg-white text-black font-black text-[10px] uppercase tracking-widest px-10 py-4 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-20`}
                  >
                    Archive Win
                  </button>
                </div>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                <GlassCard 
                  onClick={() => setIsReflecting(true)}
                  className="p-16 !rounded-[40px] border-dashed border-white/10 hover:border-blue-500/30 group transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-6"
                >
                   <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-800 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                      <Edit3 className="w-8 h-8" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Session Closure Pending</p>
                      <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">Commence Daily Debrief</p>
                   </div>
                </GlassCard>

                <div className="space-y-4">
                  {reflections.map((ref) => (
                    <GlassCard key={ref.id} className="p-8 !rounded-[32px] group relative overflow-hidden hover:border-white/20 transition-all">
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full">
                           <Calendar className="w-3.5 h-3.5 text-blue-500" />
                           <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{new Date(ref.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                         </div>
                      </div>
                      <p className="text-lg font-medium text-slate-300 leading-relaxed mb-6 italic">"{ref.text}"</p>
                      {ref.aiInsight && (
                        <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/10 flex items-start space-x-4">
                           <Sparkles className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                           <p className="text-xs text-blue-300/80 font-bold leading-relaxed">{ref.aiInsight}</p>
                        </div>
                      )}
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- Main Layout ---

const HabitsView = () => {
  const { habits, addHabit, toggleHabit, deleteHabit } = useHub();
  const [newTitle, setNewTitle] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addHabit(newTitle);
    setNewTitle('');
  };

  const getWeekDays = () => {
    const days = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - (7 * weekOffset));
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        date: d.toISOString().split('T')[0],
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-rose-500">
             <Flame className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono opacity-60">Consistency Layer</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white">Rhythm.</h2>
          <p className="text-slate-500 font-medium">Build unbreakable streaks. Calibrate your daily systems.</p>
        </div>

        <div className="flex bg-white/[0.03] border border-white/10 rounded-3xl p-1 items-center">
          <button 
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="p-3 text-slate-500 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-6 text-[10px] font-black text-slate-200 uppercase tracking-widest min-w-[120px] text-center">
            {weekOffset === 0 ? 'Active Now' : `${weekOffset}W AGO`}
          </span>
          <button 
            disabled={weekOffset === 0}
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="p-3 text-slate-500 hover:text-white transition-all disabled:opacity-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <GlassCard className="p-1 max-w-4xl mx-auto !rounded-[40px] overflow-hidden group focus-within:border-blue-500/30 transition-all shadow-2xl">
         <div className="p-8 flex items-center space-x-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
               <Plus className="w-8 h-8 text-blue-500" />
            </div>
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Initialize new behavioral routine..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-white text-2xl placeholder:text-slate-800 font-display font-black"
            />
            <button onClick={handleAdd} className="bg-white text-black font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl">Engage Habit</button>
         </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6">
        {habits.map((habit) => (
          <GlassCard key={habit.id} className="p-8 !rounded-[32px] group">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                      <Flame className="w-6 h-6" />
                   </div>
                   <div>
                     <h4 className="text-2xl font-display font-black text-white">{habit.title}</h4>
                     <div className="flex items-center space-x-3 mt-1">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest font-mono">Streak: {habit.streak} Days</span>
                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Success Rate: 100%</span>
                     </div>
                   </div>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-between xl:justify-end gap-2 overflow-x-auto no-scrollbar pb-2 xl:pb-0">
                {weekDays.map((day) => {
                  const isCompleted = habit.completedHistory[day.date];
                  const today = new Date().toISOString().split('T')[0];
                  const isToday = today === day.date;
                  
                  return (
                    <div key={day.date} className="flex flex-col items-center space-y-3 min-w-[64px]">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{day.label}</span>
                      <button 
                        onClick={() => toggleHabit(habit.id, day.date)}
                        className={`w-14 h-14 rounded-2xl transition-all border flex items-center justify-center relative ${isCompleted ? 'bg-blue-600 border-blue-500 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:border-white/20'} ${isToday && !isCompleted ? 'ring-2 ring-blue-500/30' : ''}`}
                      >
                        {isCompleted ? <CheckSquare className="w-6 h-6 text-white" /> : <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,1)] animate-pulse' : 'bg-white/10'}`} />}
                        {isToday && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-bounce" />}
                      </button>
                      <span className="text-[9px] font-bold text-slate-700 uppercase">{day.fullDate}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 xl:ml-8 border-l border-white/5 pl-8">
                 <button onClick={() => deleteHabit(habit.id)} className="p-3 text-slate-700 hover:text-red-500 transition-all">
                    <Trash2 className="w-5 h-5" />
                 </button>
              </div>
            </div>
          </GlassCard>
        ))}
        {habits.length === 0 && (
          <div className="text-center py-32 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px]">
            <p className="text-slate-600 font-bold uppercase tracking-widest">No active behavioral circuits</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  return (
    <HubProvider>
      <AppContent 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        isZenMode={isZenMode} 
        setIsZenMode={setIsZenMode} 
      />
    </HubProvider>
  );
}

const AppContent = ({ activeView, setActiveView, isSidebarOpen, setIsSidebarOpen, isZenMode, setIsZenMode }: any) => {
  const { focusTaskId, setFocusTaskId, selectedMood, setSelectedMood } = useHub();
  const themeClasses = getMoodTheme(selectedMood);

  return (
    <div className={`min-h-screen ${getMoodTheme(selectedMood)} transition-colors duration-1000 relative selection:bg-blue-500/30 selection:text-white overflow-x-hidden`}>
      <div className="mesh-bg" />
      <div className="noise" />

      {/* Navigation Layer */}
      <nav className="fixed top-0 left-0 right-0 z-[60] px-6 lg:px-12 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-3 pointer-events-auto">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-white tracking-[0.2em] uppercase leading-none">Drive</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Productivity OS</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 pointer-events-auto">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-4 bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-2xl text-white hover:bg-white/[0.08] transition-all shadow-2xl relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {isSidebarOpen ? <Plus className="w-6 h-6 rotate-45" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Sidebar Component with Premium Polish */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70]"
            />
            <motion.aside 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-80 bg-[#050505] border-r border-white/5 z-[80] p-10 flex flex-col shadow-[40px_0_100px_rgba(0,0,0,0.8)]"
            >
              <div className="mb-16">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-display font-black text-white tracking-widest uppercase mb-1">Drive</h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Navigation Control</p>
              </div>

              <div className="flex-1 flex flex-col space-y-2 no-scrollbar overflow-y-auto pr-2">
                <SidebarItem icon={Home} label="Overview" active={activeView === 'home'} onClick={() => { setActiveView('home'); setIsSidebarOpen(false); }} />
                <SidebarItem icon={Target} label="Missions" active={activeView === 'goals'} onClick={() => { setActiveView('goals'); setIsSidebarOpen(false); }} />
                <SidebarItem icon={CheckSquare} label="Tasks" active={activeView === 'tasks'} onClick={() => { setActiveView('tasks'); setIsSidebarOpen(false); }} />
                <SidebarItem icon={Flame} label="Rhythm" active={activeView === 'habits'} onClick={() => { setActiveView('habits'); setIsSidebarOpen(false); }} />
                <SidebarItem icon={PieChart} label="Pulse" active={activeView === 'insights'} onClick={() => { setActiveView('insights'); setIsSidebarOpen(false); }} />
                
                <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Environment</p>
                  <button 
                    onClick={() => setIsZenMode(!isZenMode)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border ${isZenMode ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Zen Focus</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-all relative ${isZenMode ? 'bg-blue-600' : 'bg-slate-800'}`}>
                      <motion.div 
                        animate={{ left: isZenMode ? '22px' : '4px' }}
                        className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-lg" 
                      />
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-white/10">
                 <div className="flex items-center space-x-4 p-4 bg-white/[0.03] border border-white/[0.08] rounded-3xl group cursor-pointer hover:bg-white/[0.06] transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-0.5">
                      <div className="w-full h-full bg-[#050505] rounded-[14px] flex items-center justify-center font-black text-blue-400">GS</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate uppercase">Gurpreet</p>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Pilot Phase 1</p>
                    </div>
                    <Settings className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                 </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className={`transition-all duration-1000 ease-[0.22, 1, 0.36, 1] pt-32 ${isZenMode ? 'scale-[0.96] opacity-80 blur-sm pointer-events-none' : 'scale-100'}`}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 pb-40">
          <AnimatePresence>
            {focusTaskId && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="mb-16 max-w-2xl mx-auto"
              >
                <div className="glass-card !bg-blue-600/5 !border-blue-500/20">
                  <PomodoroTimer onComplete={() => setFocusTaskId(null)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeView === 'home' && <HomeView />}
              {activeView === 'goals' && <GoalsView />}
              {activeView === 'tasks' && <TasksView />}
              {activeView === 'habits' && <HabitsView />}
              {activeView === 'insights' && <InsightsView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {isZenMode && (
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100]"
         >
            <button 
              onClick={() => setIsZenMode(false)}
              className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
            >
              Exit Deep Focus
            </button>
         </motion.div>
      )}
    </div>
  );
}

