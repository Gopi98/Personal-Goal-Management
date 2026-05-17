import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Clock, Lock, Unlock, Play, Square, BellRing, Target, CheckSquare, BookOpen, Flame, AlertCircle, History } from 'lucide-react';
import { addTimeBankBalance } from '../lib/HubContext';

export const TimeBankView = ({ setActiveView }: { setActiveView?: React.Dispatch<React.SetStateAction<string>> }) => {
  const [timeBalance, setTimeBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('timeBankBalance');
      return saved !== null ? parseInt(saved, 10) : 45;
    } catch {
      return 45;
    }
  });
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [timerFinished, setTimerFinished] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('timeBankHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('timeBankBalance', timeBalance.toString());
    } catch (e) {
      console.warn('Could not save time balance', e);
    }
  }, [timeBalance]);

  useEffect(() => {
    try {
      const now = new Date();
      const today = now.toDateString();
      const lastVisit = localStorage.getItem('timeBankLastVisit');
      
      const getWeekStart = (d: Date) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        const day = date.getDay();
        const diff = (day + 6) % 7; // Monday is 0, Sunday is 6
        date.setDate(date.getDate() - diff);
        return date.toDateString();
      };

      const currentWeekStart = getWeekStart(now);
      const lastWeekStart = localStorage.getItem('timeBankWeekStart');

      let shouldResetToZero = false;
      let shouldAddDaily = false;

      if (lastWeekStart !== currentWeekStart) {
        shouldResetToZero = true;
        localStorage.setItem('timeBankWeekStart', currentWeekStart);
      }

      if (lastVisit !== today) {
        shouldAddDaily = true;
        localStorage.setItem('timeBankLastVisit', today);
      }

      if (shouldResetToZero) {
         addTimeBankBalance(-999999, "Weekly Reset");
      }
      if (shouldAddDaily) {
         addTimeBankBalance(10, "Daily Login Bonus");
      }
    } catch (e) {
      console.warn('Could not process temporal rules', e);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'timeBankBalance' && e.newValue !== null) {
        setTimeBalance(parseInt(e.newValue, 10));
      }
      if (e.key === 'timeBankHistory' && e.newValue !== null) {
        setHistory(JSON.parse(e.newValue));
      }
    };
    const handleCustomUpdate = (e: any) => {
      if (e.detail && typeof e.detail.balance === 'number') {
        setTimeBalance(e.detail.balance);
      }
      if (e.detail && e.detail.history) {
        setHistory(e.detail.history);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('timeBankUpdated', handleCustomUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('timeBankUpdated', handleCustomUpdate);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer !== null && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer, timerRemaining]);

  const handleTimerComplete = () => {
    setTimerFinished(true);
    if (Notification.permission === 'granted') {
      new Notification('Time\'s up!', {
        body: 'Close your apps and get back to work.',
        icon: '/favicon.ico',
      });
    }
    // Play a standard web audio chime (using an oscillator as it's built-in, or a data-uri audio)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2); // E5
      oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.4); // G5
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.warn("Audio chime failed to play", e);
    }
  };

  const startTimer = (minutes: number) => {
    if (timeBalance >= minutes) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      setTimeBalance(prev => prev - minutes);
      setActiveTimer(minutes * 60);
      setTimerRemaining(minutes * 60);
      setTimerFinished(false);
    } else {
      alert("Not enough screen time balance.");
    }
  };

  const handleCustomStart = () => {
    const mins = parseInt(customAmount);
    if (!isNaN(mins) && mins > 0) {
      startTimer(mins);
      setCustomAmount('');
    }
  };

  const endBreak = () => {
    if (timerRemaining > 0 && !timerFinished) {
      const minutesToRefund = Math.ceil(timerRemaining / 60);
      setTimeBalance(prev => prev + minutesToRefund);
    }
    setActiveTimer(null);
    setTimerRemaining(0);
    setTimerFinished(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const earningRules = [
    { icon: Target, label: "Goals", value: "+30", color: "text-emerald-400", targetView: "goals" },
    { icon: CheckSquare, label: "Priority A / Morning Check", value: "+15", color: "text-emerald-400", targetView: "tasks" },
    { icon: BookOpen, label: "Journaling / Priority B", value: "+10", color: "text-emerald-400", targetView: "insights" },
    { icon: Flame, label: "Habits / Priority C", value: "+5", color: "text-emerald-400", targetView: "habits" },
    { icon: AlertCircle, label: "Skipped Habits", value: "-5", color: "text-rose-400", targetView: "habits" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4 pb-24 md:pb-8">
      {/* 1. Header / Bank Vault */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-[40px] bg-slate-950/50 border border-slate-800 backdrop-blur-2xl p-8 sm:p-12 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 opacity-50" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 blur-[100px] rounded-full" />
        
        <Lock className="w-6 h-6 text-cyan-400/50 mb-6 relative z-10" />
        
        <div className="text-center relative z-10">
          <h1 className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-[0_0_40px_rgba(45,212,191,0.5)] tracking-tighter">
            {timeBalance}
            <span className="text-3xl sm:text-4xl text-emerald-500/80 ml-2">m</span>
          </h1>
          <p className="uppercase tracking-[0.3em] font-black text-xs text-slate-400 mt-6 filter drop-shadow-md">
            Available Screen Time
          </p>
        </div>
      </motion.div>

      {/* 2. Redemption Center */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full rounded-[32px] bg-slate-900 border border-slate-800 p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="flex items-center space-x-3 mb-8">
          <Unlock className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">Redemption Center</h2>
        </div>

        <AnimatePresence mode="wait">
          {activeTimer === null ? (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[5, 15, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => startTimer(mins)}
                  disabled={timeBalance < mins}
                  className={`relative overflow-hidden group p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center space-y-2
                    ${timeBalance >= mins 
                      ? 'bg-slate-950 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 shadow-xl' 
                      : 'bg-slate-950/50 border-slate-800/50 opacity-50 cursor-not-allowed'}`}
                >
                  <Clock className={`w-6 h-6 ${timeBalance >= mins ? 'text-cyan-400' : 'text-slate-600'} group-hover:scale-110 transition-transform`} />
                  <span className="text-xl font-bold text-white">{mins} Mins</span>
                  <span className="text-xs text-slate-400 font-medium">Redeem Time</span>
                </button>
              ))}
              
              <div className="p-1 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col">
                <div className="flex-1 px-4 py-3 flex flex-col justify-center">
                  <span className="text-xs text-slate-400 font-medium mb-2 text-center uppercase tracking-wider">Custom amount</span>
                  <div className="flex bg-slate-900 rounded-xl overflow-hidden border border-slate-800 focus-within:border-cyan-500/50 transition-colors">
                    <input 
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Mins"
                      className="w-full bg-transparent text-white px-3 py-2 text-center font-bold focus:outline-none appearance-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleCustomStart}
                  disabled={!customAmount || timeBalance < parseInt(customAmount)}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-row items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Start
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="timer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center space-y-8 py-8"
            >
              <div className="relative">
                {/* Pulsing background glow when timer is active */}
                {!timerFinished && (
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-cyan-500/20 blur-[60px] rounded-full"
                  />
                )}
                {timerFinished && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute inset-0 bg-rose-500/30 blur-[80px] rounded-full"
                  />
                )}
                
                <h2 className={`text-[100px] sm:text-[140px] leading-none font-black text-transparent bg-clip-text relative z-10 tabular-nums tracking-tighter ${
                  timerFinished 
                    ? 'bg-gradient-to-br from-rose-400 to-rose-600 drop-shadow-[0_0_40px_rgba(244,63,94,0.6)]' 
                    : 'bg-gradient-to-br from-white to-slate-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                }`}>
                  {formatTime(timerRemaining)}
                </h2>
              </div>

              {timerFinished ? (
                <div className="flex flex-col items-center animate-bounce-short">
                  <BellRing className="w-8 h-8 text-rose-500 mb-4 animate-wiggle" />
                  <p className="text-rose-400 font-bold mb-8 text-xl">Time's up! Close your apps.</p>
                  <button 
                    onClick={endBreak}
                    className="px-8 py-4 bg-white hover:bg-slate-200 text-slate-900 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
                  >
                    End Break
                  </button>
                </div>
              ) : (
                <button 
                  onClick={endBreak}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full border border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  <span className="font-bold text-sm tracking-wide uppercase">Stop Timer</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 3. Earning Rules / Ledger */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full rounded-[32px] border border-slate-800/50 bg-slate-950/30 p-6 sm:p-8"
      >
        <div className="mb-6 flex flex-col space-y-1">
          <h3 className="text-slate-200 font-bold tracking-wide">Exchange Rate</h3>
          <p className="text-slate-500 text-sm">How you earn active screen time</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {earningRules.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <button 
                key={idx} 
                onClick={() => {
                  if (setActiveView) {
                    setActiveView(rule.targetView);
                    if (rule.targetView === 'insights') {
                      setTimeout(() => {
                        const el = document.getElementById('daily-reflection-section');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 600); // Increased timeout to account for AnimatePresence exit/enter animations
                    }
                  }
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/50 hover:border-slate-700 transition-colors text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-800 group-hover:bg-slate-700 transition-colors rounded-lg">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{rule.label}</span>
                </div>
                <div className={`font-black font-mono ${rule.color}`}>
                  {rule.value}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 4. History Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full rounded-[32px] border border-slate-800/50 bg-slate-950/30 p-6 sm:p-8"
      >
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center space-x-3 w-full text-left"
        >
          <div className="p-2 bg-slate-800/50 rounded-lg">
            <History className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-slate-200 font-bold tracking-wide">Time Bank History</h3>
            <p className="text-slate-500 text-sm">{showHistory ? "Hide recent transactions" : "View recent transactions"}</p>
          </div>
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 space-y-3">
                {history.length === 0 ? (
                  <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800/30 text-slate-500 text-sm">
                    No transactions yet.
                  </div>
                ) : (
                  history.map((log: any, idx: number) => (
                    <div key={log.id || idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/30">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-300 truncate">{log.reason}</p>
                        <p className="text-xs text-slate-500">{new Date(log.date).toLocaleString()}</p>
                      </div>
                      <div className={`font-black font-mono flex-shrink-0 ml-4 ${log.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {log.amount > 0 ? `+${log.amount}` : log.amount}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
};
