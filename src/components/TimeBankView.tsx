import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Clock, Lock, Unlock, Play, Square, BellRing, Target, CheckSquare, BookOpen, Flame, AlertCircle, History } from 'lucide-react';
import { addTimeBankBalance, updateUserMetadata } from '../lib/HubContext';
import { pushNotification, scheduleBackgroundNotification, cancelBackgroundNotification } from '../lib/notify';

export const TimeBankView = ({ setActiveView }: { setActiveView?: React.Dispatch<React.SetStateAction<string>> }) => {
  const [timeBalance, setTimeBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('timeBankBalance');
      return saved !== null ? parseInt(saved, 10) : 45;
    } catch {
      return 45;
    }
  });
  const [activeTimer, setActiveTimer] = useState<number | null>(() => {
    try {
      const end = Number(localStorage.getItem('timeBankEndTime'));
      if (end) {
        if (end > Date.now()) {
          return Math.round((end - Date.now()) / 1000);
        } else {
          return 0; // finished but not cleared
        }
      }
      return null;
    } catch {
      return null;
    }
  });
  const [timerRemaining, setTimerRemaining] = useState<number>(() => {
    try {
      const end = Number(localStorage.getItem('timeBankEndTime'));
      if (end) {
        if (end > Date.now()) {
          return Math.round((end - Date.now()) / 1000);
        } else {
          return 0;
        }
      }
      return 0;
    } catch {
      return 0;
    }
  });
  const [customAmount, setCustomAmount] = useState<string>('');
  const [timerFinished, setTimerFinished] = useState(() => {
    try {
      const end = Number(localStorage.getItem('timeBankEndTime'));
      return end && end <= Date.now();
    } catch {
      return false;
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('timeBankHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notificationState, setNotificationState] = useState<string>('default');

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotificationState(Notification.permission);
    } else {
      setNotificationState('unsupported');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setNotificationState(permission);
    }
  };

  const playLoudChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0, audioCtx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      // Play a beautiful, clear arpeggio (C5 -> E5 -> G5 -> C6)
      playTone(523.25, 0, 0.4);      // C5
      playTone(659.25, 0.15, 0.4);   // E5
      playTone(783.99, 0.3, 0.5);    // G5
      playTone(1046.50, 0.45, 0.8);  // C6
    } catch (e) {
      console.warn("Audio chime failed to play:", e);
    }
  };

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
    if (activeTimer !== null) {
      interval = setInterval(() => {
        const expectedEndTime = Number(localStorage.getItem('timeBankEndTime'));
        if (expectedEndTime) {
           const now = Date.now();
           const remaining = Math.max(0, Math.round((expectedEndTime - now) / 1000));
           if (remaining <= 0) {
             handleTimerComplete();
             setTimerRemaining(0);
             setActiveTimer(null);
           } else {
             setTimerRemaining(remaining);
           }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);
  
  // Handle visibility change specifically for mobile background resumption
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && activeTimer !== null) {
        const expectedEndTime = Number(localStorage.getItem('timeBankEndTime'));
        if (expectedEndTime) {
          const now = Date.now();
          const remaining = Math.max(0, Math.round((expectedEndTime - now) / 1000));
          if (remaining <= 0) {
            handleTimerComplete();
            setTimerRemaining(0);
          } else {
            setTimerRemaining(remaining);
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeTimer]);

  const handleTimerComplete = () => {
    setTimerFinished(true);
    pushNotification("Time's up!", "Close your apps and get back to work.");
    
    // Vibrate phone to alert in pocket
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([400, 150, 400, 150, 400]);
    }
    
    playLoudChime();
  };

  const startTimer = (minutes: number) => {
    if (timeBalance >= minutes) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationState(permission);
        });
      }
      addTimeBankBalance(-minutes, `Started Break Timer (${minutes}m)`);
      setActiveTimer(minutes * 60);
      setTimerRemaining(minutes * 60);
      setTimerFinished(false);
      const targetTimeMs = Date.now() + minutes * 60 * 1000;
      localStorage.setItem('timeBankEndTime', targetTimeMs.toString());
      
      scheduleBackgroundNotification("Time's up!", "Your break has ended. Close your apps and get back to work.", targetTimeMs, 'timebank-timer');
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
      addTimeBankBalance(minutesToRefund, `Refunded early end of break (${minutesToRefund}m)`);
    }
    setActiveTimer(null);
    setTimerRemaining(0);
    setTimerFinished(false);
    localStorage.removeItem('timeBankEndTime');
    cancelBackgroundNotification('timebank-timer');
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
    { icon: Flame, label: "All Habits Complete", value: "+20", color: "text-emerald-500", targetView: "habits" },
    { icon: AlertCircle, label: "Weekend Bonus", value: "+120", color: "text-cyan-400", targetView: "info" },
    { icon: AlertCircle, label: "Skipped Habits", value: "-10", color: "text-rose-400", targetView: "habits" },
  ];

  const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = typeof window !== "undefined" && (("standalone" in window.navigator && (window.navigator as any).standalone) || window.matchMedia("(display-mode: standalone)").matches);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4 pb-24 md:pb-8">
      {/* Immersive Full Screen overlay when break completes to ensure user wakes up */}
      <AnimatePresence>
        {timerFinished && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-rose-950/40 via-transparent to-transparent opacity-60" />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-slate-900 border border-rose-800/40 p-8 rounded-[36px] shadow-2xl relative z-10 flex flex-col items-center justify-center space-y-6"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full border border-rose-500/20 flex items-center justify-center animate-pulse">
                <BellRing className="w-10 h-10 text-rose-500 animate-wiggle" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">Time's Up!</h2>
                <p className="text-rose-400 font-bold text-sm tracking-wide uppercase">Break Session Finished</p>
                <p className="text-slate-400 text-sm leading-relaxed mt-2">
                  Avoid the screen of lock. Your redeemed time is completely spent. Close your applications and register back to deep focus!
                </p>
              </div>

              <button 
                onClick={() => {
                  playLoudChime();
                  endBreak();
                }}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Acknowledge & Return to Focus Hub
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <Unlock className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">Redemption Center</h2>
          </div>
          
          <div className="flex items-center">
            {notificationState === "granted" && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Alarm Notifications Active
              </span>
            )}
            {notificationState === "default" && (
              <button 
                onClick={requestNotificationPermission}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/20 flex items-center gap-1.5 transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                Enable System Notifications
              </button>
            )}
            {notificationState === "denied" && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
                ⚠️ Notifications Denied (Unblock in settings for audio alarms)
              </span>
            )}
            {notificationState === "unsupported" && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Fallback Sound Alerts Active
              </span>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTimer === null ? (
            <div className="space-y-6">
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
                        ? "bg-slate-950 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 shadow-xl" 
                        : "bg-slate-950/50 border-slate-800/50 opacity-50 cursor-not-allowed"}`}
                  >
                    <Clock className={`w-6 h-6 ${timeBalance >= mins ? "text-cyan-400" : "text-slate-600"} group-hover:scale-110 transition-transform`} />
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

              {isIOS && !isStandalone && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 flex items-start space-x-3 text-left"
                >
                  <span className="text-lg leading-none mt-0.5">📱</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-cyan-300">Apple iOS Background Notice</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Safari suspends background browser tabs. To get active alarms when your break completes: tap the <span className="text-white underline font-semibold">Share</span> icon below, click <span className="text-white underline font-semibold">"Add to Home Screen"</span>, and launch the app as a standalone web icon!
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
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
                    ? "bg-gradient-to-br from-rose-400 to-rose-600 drop-shadow-[0_0_40px_rgba(244,63,94,0.6)]" 
                    : "bg-gradient-to-br from-white to-slate-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                }`}>
                  {formatTime(timerRemaining)}
                </h2>
              </div>

              {timerFinished ? (
                <div className="flex flex-col items-center animate-bounce-short">
                  <BellRing className="w-8 h-8 text-rose-500 mb-4 animate-wiggle" />
                  <p className="text-rose-400 font-bold mb-8 text-xl">Time's up! Close your apps.</p>
                  <button 
                    onClick={() => {
                      playLoudChime();
                      endBreak();
                    }}
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
