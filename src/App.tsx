import { toLocalDateStr, getCountdownText } from './lib/dateUtils';
import React, { useState, useEffect, useRef, forwardRef } from "react";
import { HabiticaTestView } from "./components/HabiticaTestView";
import { LifeGameView } from "./components/LifeGameView";
import { AutomationsView } from "./components/AutomationsView";
import { YearlyProgress } from "./components/YearlyProgress";
import {
  Home,
  Target,
  CheckSquare,
  Check,
  Activity,
  Zap,
  PieChart,
  Wallet,
  Settings,
  Moon,
  Sun,
  Search,
  Plus,
  Bell,
  ChevronDown,
  ChevronUp,
  Flame,
  Sparkles,
  TrendingUp,
  Calendar,
  Clock,
  Battery,
  Coffee,
  ChevronRight,
  Trash2,
  Edit3,
  Filter,
  Menu,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  CornerDownRight,
  CalendarRange,
  MoreVertical,
  Share2,
  Download,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Timer,
  Quote,
  CheckCircle2,
  ChevronLeft,
  Info,
  MessageSquare,
  Send,
  Bot,
  Gamepad2,
  CloudLightning,
  Gem,
  Swords,
  Sword,
  Droplets,
  Cloud,
  User,
  X as CloseIcon,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { GoogleGenAI, Modality } from "@google/genai";
import confetti from "canvas-confetti";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
} from "recharts";
import { HubProvider, useHub } from "./lib/HubContext";
import { getAICoachInsight, getTrojanChatResponse, getDailyMotivation, getGoalBreakdown, getDeepAnalysis, getGoalFocusAdvice, getTaskFocusAdvice, getOverviewFocusAdvice } from "./lib/gemini";

// --- Shared Components ---

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <Tooltip text={`Go to ${label}`}>
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-full flex items-center space-x-4 px-6 py-4 rounded-[20px] transition-all group relative overflow-hidden ${
        active
          ? "bg-blue-600/10 text-white border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
          : "text-slate-300 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
      }`}
    >
      {active && (
        <motion.div
          layoutId="sidebarActive"
          className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none"
        />
      )}
      <Icon
        className={`w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${active ? "text-blue-500" : "group-hover:text-slate-200"}`}
      />
      <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10">
        {label}
      </span>
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

const GlassCard = forwardRef<HTMLDivElement, {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}>(({ children, className = "", onClick, ...props }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    className={`glass-card ${!className.includes('p-') ? 'p-6' : ''} ${className} ${onClick ? "cursor-pointer" : ""}`}
    {...props}
  >
    {children}
  </div>
));

const Tooltip = ({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative flex items-center justify-center overflow-visible z-50 hover:z-[100]"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.1 }}
            className="absolute z-[100] bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-[#1a1a1e] border border-white/10 text-xs font-black text-blue-400 uppercase tracking-widest whitespace-normal text-center w-max max-w-xs rounded-md pointer-events-none shadow-2xl backdrop-blur-md"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-white/10" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

let ambientAudio: HTMLAudioElement | null = null;

const playAILoop = (type: "rain" | "birds") => {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio = null;
  }
  
  const url = type === "rain" 
    ? "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg"
    : "https://actions.google.com/sounds/v1/animals/birds_forest_afternoon.ogg";
    
  ambientAudio = new Audio(url);
  ambientAudio.loop = true;
  ambientAudio.volume = 0.4;
  
  ambientAudio.play().catch(e => console.warn("Audio autoplay blocked:", e));
};

const stopAILoop = () => {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio = null;
  }
};

const playBeep = () => {
  try {
    const audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    oscillator.frequency.exponentialRampToValueAtTime(
      880,
      audioCtx.currentTime + 0.1,
    );

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1);
  } catch (error) {
    console.error("Audio beep failed:", error);
  }
};

const sendNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
};

const NotificationEditor = ({
  enabled,
  setEnabled,
  time,
  setTime,
  schedule,
  setSchedule,
  days,
  setDays,
  date,
  setDate,
}: {
  enabled: boolean;
  setEnabled: (e: boolean) => void;
  time: string;
  setTime: (t: string) => void;
  schedule: 'once' | 'daily' | 'weekly' | 'specific_days';
  setSchedule: (s: 'once' | 'daily' | 'weekly' | 'specific_days') => void;
  days: number[];
  setDays: (d: number[]) => void;
  date: string;
  setDate: (d: string) => void;
}) => {
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <div className="space-y-3 mt-4 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              if (e.target.checked && Notification.permission !== "granted") {
                Notification.requestPermission();
              }
            }}
            className="accent-blue-500 w-4 h-4"
          />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Enable Notification</span>
        </label>
      </div>

      {enabled && (
        <div className="pl-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-xl px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
            />
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value as any)}
              className="bg-white/5 border border-white/20 rounded-xl px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="specific_days">Specific Days</option>
            </select>
          </div>

          {schedule === "once" && (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-xl px-3 py-1.5 text-white text-sm focus:border-blue-500 outline-none w-full"
            />
          )}

          {schedule === "specific_days" && (
            <div className="flex gap-1 justify-between max-w-[200px]">
              {dayNames.map((n, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (days.includes(i)) setDays(days.filter(d => d !== i));
                    else setDays([...days, i]);
                  }}
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                    days.includes(i) ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const playAIAudio = async (text: string) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.warn("GEMINI_API_KEY is not set or invalid. Skipping audio.");
      return;
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const buffer = audioContext.createBuffer(1, float32Array.length, 24000);
      buffer.getChannelData(0).set(float32Array);

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    }
  } catch (error) {
    console.error("AI Audio playback failed:", error);
  }
};


const ZenTimer = ({ onExit }: { onExit: () => void }) => {
  const [seconds, setSeconds] = useState(0);
  const { addFocusSession } = useHub();

  useEffect(() => {
    playAILoop("rain");
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      stopAILoop();
    };
  }, []);

  const handleExit = () => {
     const minutes = Math.floor(seconds / 60);
     if (minutes > 0) {
       addFocusSession(minutes, "work");
     }
     onExit();
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-8 w-full px-6"
    >
      <div className="text-[20vw] sm:text-9xl md:text-[140px] leading-none font-black text-white font-mono tracking-tighter drop-shadow-2xl mix-blend-difference pointer-events-none text-center">
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </div>
      <Tooltip text="Exit deep focus HUD mode & save time">
        <button
          onClick={handleExit}
          className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
        >
          Exit Deep Focus
        </button>
      </Tooltip>
    </motion.div>
  );
};

const TaskTimeEditor = ({ task, updateTask, tasksForDate }: any) => {
  const [localDur, setLocalDur] = useState((task.duration || "30").replace("m", ""));
  
  useEffect(() => {
    setLocalDur((task.duration || "30").replace("m", ""));
  }, [task.duration]);

  return (
    <div className="w-24 sm:w-32 flex flex-col items-end pt-2 shrink-0 text-right">
      <input
        type="time"
        value={task.startTime || "09:00"}
        onChange={(e) => {
          const newStart = e.target.value;
          updateTask(task.id, { startTime: newStart });
          
          // Chain Reschedule: Shift subsequent tasks
          let currentTime = newStart;
          const [h, m] = currentTime.split(":").map(Number);
          const d = new Date();
          d.setHours(h, m + parseInt(task.duration || "30") + 5);
          currentTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

          const sortedRemaining = [...tasksForDate]
            .sort((a,b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"))
            .filter(t => (t.startTime || "00:00") > (task.startTime || "00:00") && t.id !== task.id);

          for (const t of sortedRemaining) {
            updateTask(t.id, { startTime: currentTime });
            const [th, tm] = currentTime.split(":").map(Number);
            const td = new Date();
            td.setHours(th, tm + parseInt(t.duration || "30") + 5);
            currentTime = `${String(td.getHours()).padStart(2, "0")}:${String(td.getMinutes()).padStart(2, "0")}`;
          }
        }}
        className="text-sm sm:text-base font-black text-white font-mono tracking-tight leading-none bg-transparent border-none p-0 focus:ring-0 w-full text-right cursor-pointer hover:text-blue-400 transition-colors"
      />
      <div className="flex items-center gap-0.5 mt-1 justify-end text-slate-300 focus-within:text-white transition-colors">
        <input
          type="number"
          value={localDur}
          onChange={(e) => setLocalDur(e.target.value)}
          onBlur={(e) => {
            let val = e.target.value;
            if (!val || parseInt(val) <= 0) val = "1";
            setLocalDur(val);
            const newDur = val + "m";
            if (newDur === task.duration) return;
            updateTask(task.id, { duration: newDur });
            
            // Chain Reschedule: Shift subsequent tasks based on new duration
            const durMins = parseInt(val) || 30;
            let currentTime = task.startTime || "09:00";
            const [h, m] = currentTime.split(":").map(Number);
            const d = new Date();
            d.setHours(h, m + durMins + 5);
            currentTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

            const sortedRemaining = [...tasksForDate]
              .sort((a,b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"))
              .filter(t => (t.startTime || "00:00") > (task.startTime || "00:00") && t.id !== task.id);

            for (const t of sortedRemaining) {
              updateTask(t.id, { startTime: currentTime });
              const [th, tm] = currentTime.split(":").map(Number);
              const td = new Date();
              td.setHours(th, tm + parseInt(t.duration || "30") + 5);
              currentTime = `${String(td.getHours()).padStart(2, "0")}:${String(td.getMinutes()).padStart(2, "0")}`;
            }
          }}
          className="text-xs sm:text-xs font-bold uppercase tracking-widest bg-transparent border-none p-0 focus:ring-0 w-8 text-right"
        />
        <span className="text-xs sm:text-xs font-bold uppercase tracking-widest leading-none mt-px">M</span>
      </div>
    </div>
  );
};

const PomodoroTimer = ({
  onComplete,
  length = 25,
}: {
  onComplete: () => void;
  length?: number;
}) => {
  const [currentLength, setCurrentLength] = useState(length);
  const [timeLeft, setTimeLeft] = useState(currentLength * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const { addFocusSession } = useHub();

  useEffect(() => {
    if (
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    setTimeLeft(mode === "work" ? currentLength * 60 : 5 * 60);
  }, [currentLength, mode]);

  useEffect(() => {
    if (isActive) {
      if (mode === "work") playAILoop("rain");
      else playAILoop("birds");
    } else {
      stopAILoop();
    }
  }, [isActive, mode]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      clearInterval(interval);
      setIsActive(false);
      stopAILoop();

      const nextMode = mode === "work" ? "break" : "work";
      setMode(nextMode);
      setTimeLeft(nextMode === "work" ? currentLength * 60 : 5 * 60);

      addFocusSession(currentLength, mode);

      if (mode === "work") {
        sendNotification(
          "Deep Work Complete",
          "Task accomplished. Time for a refuel break.",
        );
        playBeep();
        playAIAudio(
          "Task accomplished. Deep work cycle complete. Initializing refuel break.",
        );
      } else {
        sendNotification(
          "Break Over",
          "Refuel complete. Ready for high performance operations.",
        );
        playBeep();
        playAIAudio(
          "Refuel break complete. Ready to resume high performance operations.",
        );
      }

      onComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, onComplete, currentLength]);

  const toggle = () => {
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setTimeLeft(mode === "work" ? currentLength * 60 : 5 * 60);
  };

  const setTimerLength = (mins: number) => {
    setCurrentLength(mins);
    if (!isActive && mode === "work") {
      setTimeLeft(mins * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl space-y-6">
      <div className="flex items-center space-x-2">
        <Timer className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">
          {mode === "work" ? "Deep Work" : "Refuel Break"}
        </span>
      </div>
      <div className="flex gap-2">
        {[15, 25, 50, 90].map((mins) => (
          <Tooltip key={mins} text={`Set duration to ${mins}m`}>
            <button
              onClick={() => setTimerLength(mins)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${currentLength === mins && mode === "work" ? "bg-blue-600 text-white shadow-md" : "bg-white/5 text-slate-300 hover:text-white"}`}
            >
              {mins}m
            </button>
          </Tooltip>
        ))}
      </div>
      <div className="text-6xl font-display font-black text-white tabular-nums tracking-tighter">
        {formatTime(timeLeft)}
      </div>
      <div className="flex items-center space-x-4">
        <Tooltip text={isActive ? "Pause timer" : "Start timer"}>
          <button
            onClick={toggle}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isActive ? "bg-orange-600 text-white" : "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"}`}
          >
            {isActive ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white translate-x-0.5" />
            )}
          </button>
        </Tooltip>
        <Tooltip text="Reset timer">
          <button
            onClick={reset}
            className="p-3 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

const getMoodTheme = (mood: string | null) => {
  switch (mood) {
    case "Focus":
      return "bg-[#0a0a0c] selection:bg-blue-500/30";
    case "Calm":
      return "bg-[#0d1117] selection:bg-teal-500/30";
    case "Energized":
      return "bg-[#0a0505] selection:bg-orange-500/30";
    case "Stress":
      return "bg-[#120e16] selection:bg-purple-500/30";
    case "Tired":
      return "bg-[#050507] selection:bg-slate-500/30";
    default:
      return "bg-[#050505] selection:bg-blue-500/30";
  }
};

const getMoodAccent = (mood: string | null) => {
  switch (mood) {
    case "Focus":
      return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    case "Calm":
      return "text-teal-400 border-teal-500/30 bg-teal-500/10";
    case "Energized":
      return "text-orange-400 border-orange-500/30 bg-orange-500/10";
    case "Stress":
      return "text-purple-400 border-purple-500/30 bg-purple-500/10";
    case "Tired":
      return "text-slate-300 border-slate-500/30 bg-slate-500/10";
    default:
      return "text-blue-400 border-blue-500/30 bg-blue-500/10";
  }
};

// --- Sub-views ---

const MiniCalendar = ({ tasks, onDateClick }: { tasks: any[], onDateClick?: (dateStr: string) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
  const numDays = lastDay.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= numDays; i++) {
    days.push(i);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-[0.3em] font-mono text-rose-500 mb-1">Calendar</span>
          <h4 className="text-xl md:text-2xl font-display font-black text-white">{monthNames[month]} {year}</h4>
        </div>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((d, i) => (
          <div key={i} className="text-xs md:text-xs font-black text-slate-300 text-center uppercase tracking-wider">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          let hasTasks = false;
          let dateStr = "";
          if (d) {
            dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            hasTasks = tasks.some(t => t.date === dateStr && !t.completed);
          }
          const isToday = d && new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
          return (
            <div 
              key={i} 
              onClick={() => d && onDateClick && onDateClick(dateStr)}
              className={`h-12 md:h-14 rounded-xl flex flex-col items-center justify-center text-sm md:text-base font-bold transition-all relative ${
                d === null 
                  ? "" 
                  : isToday
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-500 cursor-pointer hover:bg-blue-500"
                  : "bg-white/[0.02] border border-white/[0.05] hover:bg-white/10 hover:border-white/20 text-slate-300 cursor-pointer"
              }`}
            >
              {d && <span>{d}</span>}
              {hasTasks && d && (
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isToday ? 'bg-white' : 'bg-blue-500'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HomeView = ({ setActiveView }: { setActiveView: React.Dispatch<React.SetStateAction<string>> }) => {
  const { goals, tasks, habits, selectedMood, setSelectedMood, reflections, focusSessions, toggleTask, addTask, deleteTask, updateTask, updateTaskSubtask } = useHub();
  const [motivation, setMotivation] = useState<string | null>(null);

  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);
  const [taskCreateDate, setTaskCreateDate] = useState<string|null>(null);
  const [taskCreateTitle, setTaskCreateTitle] = useState("");
  const [taskCreatePriority, setTaskCreatePriority] = useState<"A" | "B" | "C" | "D">("A");

  const handleDateClick = (dateStr: string) => {
    setTaskCreateDate(dateStr);
    setTaskCreateTitle("");
    setTaskCreatePriority("A");
  };

  const handleCreateTask = () => {
    if (!taskCreateTitle.trim() || !taskCreateDate) return;
    addTask({
      title: taskCreateTitle,
      date: taskCreateDate,
      priority: taskCreatePriority,
      type: "one-off"
    });
    setTaskCreateDate(null);
    setTaskCreateTitle("");
    setActiveView("tasks");
  };

  const fetchMotivation = async () => {
    setIsRefreshingQuote(true);
    try {
      const m = await getDailyMotivation(selectedMood);
      setMotivation(m);
    } catch (e) {
      console.error("Motivation error:", e);
    }
    // a small artificial delay so the user feels the refresh if it happens too fast
    setTimeout(() => setIsRefreshingQuote(false), 300);
  };

  useEffect(() => {
    fetchMotivation();
  }, [selectedMood]);

  const activeGoals = goals.filter((g) => !g.completed).length;
  const todayDateStr = toLocalDateStr();
  const todayTasks = tasks.filter(
    (t) => t.date === todayDateStr || (t.date < todayDateStr && !t.completed),
  );
  const completedToday = todayTasks.filter((t) => t.completed).length;

  const focusTimeToday = focusSessions
    .filter((s) => s.type === "work" && s.date.includes(toLocalDateStr()))
    .reduce((acc, s) => acc + s.duration, 0);

  const incompleteTasks = tasks.filter(t => !t.completed);
  
  // Adaptive Suggested Task Based on Mood
  let suggestedTask = null;
  let suggestionTitle = "Eat The Frog";
  let suggestionDesc = "Tackle your hardest or most important task first. If you have two frogs, eat the ugliest one.";
  let suggestionIcon = Target;
  let sStyle = {
    bgGlow: "bg-green-500/10",
    text: "text-green-400",
    pillBg: "bg-green-500/10",
    pillBorder: "border-green-500/20"
  };

  if (incompleteTasks.length > 0) {
    if (selectedMood === "Focus" || selectedMood === "Energized") {
      suggestionTitle = "Eat The Frog";
      suggestionDesc = "You have high energy. Time to tackle your hardest, most important task right now.";
      sStyle = {
        bgGlow: "bg-green-500/10",
        text: "text-green-400",
        pillBg: "bg-green-500/10",
        pillBorder: "border-green-500/20"
      };
      suggestionIcon = Target;
      suggestedTask = [...incompleteTasks].sort((a, b) => {
        return String(a.priority || "D").localeCompare(String(b.priority || "D"));
      })[0];
    } else if (selectedMood === "Stress" || selectedMood === "Tired") {
      suggestionTitle = "Quick Win";
      suggestionDesc = "Your energy is low. Build momentum by checking off something very easy.";
      sStyle = {
        bgGlow: "bg-blue-500/10",
        text: "text-blue-400",
        pillBg: "bg-blue-500/10",
        pillBorder: "border-blue-500/20"
      };
      suggestionIcon = Sparkles;
      suggestedTask = [...incompleteTasks].sort((a, b) => {
        return (b.priority || "D").localeCompare(a.priority || "D"); 
      })[0];
    } else if (selectedMood === "Calm") {
      suggestionTitle = "Flow State";
      suggestionDesc = "You are centered. Steady progress on a moderate, impactful task is ideal.";
      sStyle = {
        bgGlow: "bg-indigo-500/10",
        text: "text-indigo-400",
        pillBg: "bg-indigo-500/10",
        pillBorder: "border-indigo-500/20"
      };
      suggestionIcon = Sparkles;
      suggestedTask = [...incompleteTasks].sort((a, b) => {
        return String(a.priority || "D").localeCompare(String(b.priority || "D"));
      })[0];
    } else {
      // Default (No mood selected) falls back to Eat the frog
      suggestedTask = [...incompleteTasks].sort((a, b) => {
        return String(a.priority || "D").localeCompare(String(b.priority || "D"));
      })[0];
    }
  }

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = toLocalDateStr(d);
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const completed = dayTasks.filter((t) => t.completed).length;
    return {
      name: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      completed: completed,
      backlog: dayTasks.length - completed,
      total: dayTasks.length,
    };
  });

  const moodResponses: Record<string, string> = {
    Focus: "Great choice. Eliminate all notifications and dive deep.",
    Calm: "Peace is the foundation of clarity. Take a breath.",
    Energized: "Momentum is on your side. Tackle the hardest task now.",
    Stress: "Break tasks into tiny pieces. You can handle this.",
    Tired: "Focus on low-energy tasks or take a short active break.",
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
            <span className="text-xs font-black uppercase tracking-[0.4em] font-mono">
              Task Status
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white leading-[0.9]">
            Trojan Task <span className="text-blue-600">Scheduler.</span>
            <br />
            {new Date().getHours() < 5 ? "Good night." : new Date().getHours() < 12 ? "Good morning." : new Date().getHours() < 17 ? "Good afternoon." : "Good evening."}
          </h2>
          <p className="text-slate-300 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
            Your command center is synchronized. Current trajectory:{" "}
            <span className="text-slate-200">Optimal.</span>
          </p>
        </div>

        {selectedMood && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 flex items-center space-x-6 min-w-[320px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/[0.05]"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center text-4xl shadow-inner border border-white/[0.05]">
              {selectedMood === "Focus" && "🎯"}
              {selectedMood === "Calm" && "🧘"}
              {selectedMood === "Energized" && "⚡"}
              {selectedMood === "Stress" && "🌪️"}
              {selectedMood === "Tired" && "☕"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-1">
                Intelligence
              </p>
              <p className="text-sm text-slate-200 font-medium leading-snug">
                {moodResponses[selectedMood]}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <YearlyProgress />

      {/* Hero Quote Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden group rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.1] via-indigo-600/[0.05] to-purple-600/[0.1] backdrop-blur-3xl border border-white/[0.08]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full -mr-32 -mt-32 opacity-50" />
        <div className="relative p-12 sm:p-20 flex flex-col items-center text-center space-y-8">
          <div className="flex flex-col items-center space-y-2 relative">
            <div className="flex items-center space-x-3 text-blue-500">
              <Quote className="w-5 h-5 opacity-40" />
              <span className="text-xs font-black uppercase tracking-[0.5em] font-mono opacity-60">
                Quote of the Day
              </span>
              <button 
                onClick={fetchMotivation}
                disabled={isRefreshingQuote}
                className={`ml-2 p-1.5 rounded-full hover:bg-white/5 transition-colors ${isRefreshingQuote ? 'animate-spin opacity-50' : 'opacity-40 hover:opacity-100 text-blue-400'}`}
                title="Get a new quote"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
              Cognitive Priming Protocol
            </p>
          </div>
          <blockquote className={`text-3xl sm:text-4xl md:text-5xl font-display font-black text-white leading-[1] tracking-tighter max-w-4xl drop-shadow-2xl transition-opacity duration-300 ${isRefreshingQuote ? 'opacity-0' : 'opacity-100'}`}>
            {motivation || "Focus is the art of knowing what to ignore."}
          </blockquote>
          <div className="flex items-center space-x-8">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-white/10" />
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] leading-none">
                Intelligence Signal Active
              </span>
            </div>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>
      </motion.div>

      {/* Quick Access Grid */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 px-2">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Current State Sequence</h2>
          <div className="relative group/tooltip z-50 hover:z-[100]">
            <Info className="w-3 h-3 text-slate-300 cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 bg-slate-700 text-xs text-slate-300 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none font-sans font-normal tracking-normal normal-case">
              Select your current mental or physical state. The AI will adapt your recommended tasks to match what you are capable of handling right now.
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-800"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {["Focus", "Calm", "Energized", "Stress", "Tired"].map((m, i) => (
            <Tooltip key={m} text={`Set state to ${m}`}>
              <button
                onClick={() => setSelectedMood(m)}
                className={`group p-4 sm:p-6 rounded-[32px] border transition-all duration-300 relative overflow-hidden w-full ${selectedMood === m ? "bg-blue-600 border-blue-500 shadow-[0_20px_40px_rgba(37,99,235,0.4)]" : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10"}`}
              >
                {selectedMood === m && (
                  <motion.div
                    layoutId="activeMoodHome"
                    className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"
                  />
                )}
                <div className="relative z-10 flex flex-col items-center space-y-3">
                  <span
                    className={`text-2xl sm:text-3xl transition-transform duration-500 ${selectedMood === m ? "scale-110" : "group-hover:scale-125"}`}
                  >
                    {m === "Focus" && "🎯"}
                    {m === "Calm" && "🧘"}
                    {m === "Energized" && "⚡"}
                    {m === "Stress" && "🌪️"}
                    {m === "Tired" && "☕"}
                  </span>
                  <span
                    className={`text-xs font-black uppercase tracking-widest ${selectedMood === m ? "text-white" : "text-slate-300"}`}
                  >
                    {m}
                  </span>
                </div>
              </button>
            </Tooltip>
          ))}
        </div>

      </div>

      {/* Productivity Frameworks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adaptive Suggested Task */}
        <GlassCard className="p-8 relative group">
          <div className={`absolute top-0 right-0 w-32 h-32 ${sStyle.bgGlow} blur-[50px] rounded-full -mr-10 -mt-10 opacity-50 transition-opacity group-hover:opacity-100`} />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className={`flex items-center space-x-2 ${sStyle.text} mb-4`}>
                {React.createElement(suggestionIcon, { className: "w-5 h-5" })}
                <span className="text-xs font-black uppercase tracking-[0.3em] font-mono">{suggestionTitle}</span>
                <div className="relative group/tooltip z-50 hover:z-[100]">
                  <Info className="w-3 h-3 cursor-help opacity-50" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-3 bg-slate-700 text-xs text-slate-300 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none font-sans font-normal tracking-normal normal-case">
                    This module suggests an optimal task based on your currently selected mood or energy level.
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </div>
              {suggestedTask ? (
                <>
                  <h3 className="text-2xl sm:text-3xl font-display font-black text-white mb-2 leading-tight">
                    {suggestedTask.title}
                  </h3>
                  <p className="text-slate-300 text-sm mb-6 max-w-sm">
                    {suggestionDesc}
                  </p>
                </>
              ) : (
                <div className="py-6">
                  <h3 className="text-xl sm:text-2xl font-display font-black text-slate-300 mb-2">
                    {tasks.length === 0 ? "Welcome to Command Center" : "You're all clear!"}
                  </h3>
                  <p className="text-slate-300 text-sm mt-2">
                    {tasks.length === 0 
                      ? "Get started by adding your first task. Navigate to the Tasks tab below and press the + icon to plan your strategy." 
                      : "You have conquered your tasks for now. Take a deep breath."}
                  </p>
                </div>
              )}
            </div>
            {suggestedTask && (
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 ${sStyle.pillBg} border ${sStyle.pillBorder} ${sStyle.text} text-xs uppercase font-black tracking-widest rounded-full`}>
                  Priority {suggestedTask.priority}
                </span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI & Stats */}
        <div className="lg:col-span-12 grid grid-cols-1 gap-6">
          <GlassCard className="p-8 flex flex-col justify-between overflow-visible">
            <div className="flex items-center space-x-2 mb-8">
              <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                Performance Score
              </p>
              <div className="relative group/tooltip z-50 hover:z-[100]">
                <Info className="w-3 h-3 text-slate-300 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-3 bg-slate-700 text-xs text-slate-300 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                  A dynamic score ({completedToday * 20 + 42} pts) calculated by your completed tasks ({completedToday}) multiplied by 20, plus a base momentum of 42. Keep crushing tasks to boost your score!
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-800"></div>
                </div>
              </div>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-7xl font-display font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                {completedToday * 20 + 42}
              </span>
              <span className="text-blue-500 font-black tracking-widest text-sm">PTS</span>
            </div>
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Daily Target</span>
                <span className="text-white font-black">
                  {Math.min(100, completedToday * 25)}%
                </span>
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
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {[
            {
              label: "ACTIVE GOALS",
              value: activeGoals.toString(),
              icon: Target,
              color: "text-blue-400",
              sub: "Critical Path",
              desc: "Total number of uncompleted goals remaining in the system. Represents your long-term focus.",
            },
            {
              label: "SYNC STREAK",
              value: `${Math.max(1, habits.filter(h => h.completedHistory[toLocalDateStr()]).length)}`,
              icon: Flame,
              color: "text-rose-400",
              sub: "Habit Consistency",
              desc: "Number of active habits completed today. Establishes your baseline operational habit.",
            },
          ].map((card, i) => (
            <GlassCard
              key={i}
              className="p-6 group hover:translate-y-[-4px] transition-all duration-300 relative overflow-visible"
            >
              <div
                className={`w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6 group-hover:bg-white/[0.08] transition-all border border-white/[0.05]`}
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="space-y-1">
                <Tooltip text={card.desc}>
                  <p className="text-xs w-max font-black text-slate-300 uppercase tracking-widest cursor-help border-b border-dashed border-slate-500/50 pb-0.5 inline-block">
                    {card.label}
                  </p>
                </Tooltip>
                <h4 className="text-3xl font-display font-black text-white">
                  {card.value}
                </h4>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-tighter mt-2">
                  {card.sub}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Chart Card */}
        <div className="lg:col-span-12">
          <GlassCard className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="space-y-2">
                <p className="text-xs font-black text-blue-500 tracking-[0.4em] uppercase font-mono">
                  Operations Log
                </p>
                <h3 className="text-3xl font-display font-black text-white">
                  Efficiency Matrix
                </h3>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-xs font-black text-slate-300 uppercase">
                    Completed
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="text-xs font-black text-slate-300 uppercase">
                    Backlog
                  </span>
                </div>
              </div>
            </div>
            <div className="h-[250px] w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <BarChart data={chartData} barGap={4}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#475569", fontSize: 11, fontWeight: 900 }}
                    dy={10}
                  />
                  <ReTooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0c0c0e] border border-white/10 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                            <p className="text-xs font-black text-blue-400 uppercase mb-1 tracking-widest">
                              {payload[0].payload.name} Statistics
                            </p>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-white">
                                {payload[0].payload.completed} Tasks Finished
                              </p>
                              <p className="text-sm font-bold text-slate-300">
                                {payload[0].payload.backlog} Backlog Tasks
                              </p>
                              <p className="text-xs text-slate-300 uppercase">
                                Total Capacity: {payload[0].payload.total}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="completed"
                    stackId="a"
                    radius={[0, 0, 4, 4]}
                    barSize={24}
                    fill="#2563eb"
                  />
                  <Bar
                    dataKey="backlog"
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                    fill="rgba(255,255,255,0.1)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Operations Timeline Widget */}
        <div className="lg:col-span-12">
          <GlassCard className="p-6 md:p-8">
            <MiniCalendar tasks={tasks} onDateClick={handleDateClick} />
          </GlassCard>
        </div>
      </div>

      <AnimatePresence>
        {taskCreateDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6 space-y-6 relative overflow-visible">
                <button
                  onClick={() => setTaskCreateDate(null)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-white/10"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-xl font-display font-black text-white">Create Task</h3>
                  <p className="text-sm text-slate-300">Scheduled for {taskCreateDate}</p>
                </div>
                
                {(() => {
                  const dayTasks = tasks.filter(t => t.date === taskCreateDate && !t.completed);
                  if (dayTasks.length === 0) return (
                    <div className="py-4 text-center border-y border-white/5 border-dashed">
                      <p className="text-sm text-slate-300 font-bold">No pending tasks for this date.</p>
                    </div>
                  );
                  return (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-300 mb-3">Pending Tasks</p>
                      {dayTasks.map(t => (
                        <div key={t.id} className="group relative flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors gap-3">
                           <div className="flex items-center gap-3 min-w-0 flex-1">
                             <button
                               onClick={() => toggleTask(t.id)}
                               className={`w-5 h-5 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
                                 t.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                               }`}
                             >
                               {t.completed && <Check className="w-3 h-3 text-white" />}
                             </button>
                             <div className="min-w-0">
                               <p className={`text-sm truncate font-bold ${t.completed ? 'line-through text-slate-300' : 'text-slate-200'}`}>
                                 {t.title}
                               </p>
                               <span className={`text-xs uppercase font-black tracking-wider px-2 py-0.5 rounded ${
                                 t.priority === 'A' ? 'bg-rose-500/20 text-rose-400' :
                                 t.priority === 'B' ? 'bg-orange-500/20 text-orange-400' :
                                 t.priority === 'C' ? 'bg-blue-500/20 text-blue-400' :
                                 'bg-slate-500/20 text-slate-300'
                               }`}>
                                 Priority {t.priority}
                               </span>
                             </div>
                           </div>
                           <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                               onClick={() => { if (window.confirm("Are you sure you want to delete this task?")) deleteTask(t.id); }}
                               className="p-1.5 text-slate-300 hover:text-red-400 transition-colors rounded hover:bg-white/5"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="space-y-4">
                  <input
                    autoFocus
                    type="text"
                    value={taskCreateTitle}
                    onChange={(e) => setTaskCreateTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateTask();
                    }}
                    placeholder="E.g., Read 10 pages..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <div className="flex bg-white/5 rounded-[20px] p-1 border border-white/10">
                    {["A", "B", "C", "D"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setTaskCreatePriority(p as any)}
                        className={`flex-1 min-w-0 py-2 rounded-2xl font-bold text-sm transition-all flex items-center justify-center ${taskCreatePriority === p ? 'bg-blue-600 border border-blue-500 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleCreateTask}
                    disabled={!taskCreateTitle.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-300 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Add Task
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper to render nested subtasks
const RecursiveSubtaskList = ({ 
  subtasks, 
  onToggle, 
  onEdit, 
  onDelete, 
  onPromote,
  onAddChild,
  editingId, 
  editingTitle, 
  setEditingTitle, 
  setEditingId, 
  saveEdit,
  depth = 0
}: { 
  subtasks: any[]; 
  onToggle: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onPromote?: (sub: any, parentId?: string) => void;
  onAddChild?: (parentId: string, title: string) => void;
  editingId: string | null;
  editingTitle: string;
  setEditingTitle: (t: string) => void;
  setEditingId: (id: string | null) => void;
  saveEdit: (id: string, title: string) => void;
  depth?: number;
}) => {
  const sorted = [...(subtasks || [])].sort((a: any, b: any) => Number(a.completed || false) - Number(b.completed || false));
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [newChildTitle, setNewChildTitle] = useState("");

  return (
    <div className="space-y-2">
      {sorted.map(sub => (
        <div key={sub.id}>
          <div className={`flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl group/sub hover:bg-white/[0.04] transition-all gap-3 ${depth > 0 ? 'ml-6 border-l-2 border-l-white/10' : ''}`}>
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <Tooltip text="Toggle completion">
                <button
                  onClick={() => onToggle(sub.id)}
                  className={`w-4 h-4 mt-0.5 shrink-0 rounded border transition-all flex items-center justify-center ${sub.completed ? "bg-blue-600 border-blue-600 text-white" : "border-white/20"}`}
                >
                  {sub.completed && <CheckSquare className="w-3 h-3" />}
                </button>
              </Tooltip>
              {editingId === sub.id ? (
                <div className="flex-1 min-w-0 flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        saveEdit(sub.id, editingTitle);
                        setEditingId(null);
                      }
                    }}
                    className="bg-white/10 text-white text-sm px-2 py-1 rounded w-full min-w-0 outline-none"
                    autoFocus
                  />
                  <button onClick={() => { saveEdit(sub.id, editingTitle); setEditingId(null); }} className="text-green-500 hover:text-green-400 p-1">
                    <CheckSquare className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className={`text-sm flex-1 min-w-0 break-words text-left ${sub.completed ? "text-slate-300 line-through" : "text-slate-300 font-medium"}`}>
                  {sub.title}
                </span>
              )}
            </div>
            <div className={`flex items-center space-x-2 shrink-0 transition-opacity opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100`}>
              {editingId !== sub.id && (
                <Tooltip text="Edit subtask">
                  <button onClick={() => { setEditingId(sub.id); setEditingTitle(sub.title); }} className="text-slate-300 hover:text-blue-400 p-1">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              )}
              {onAddChild && !sub.completed && (
                 <Tooltip text="Add child step">
                   <button onClick={() => setAddingToId(sub.id)} className="text-slate-300 hover:text-emerald-400 p-1">
                     <Plus className="w-3.5 h-3.5" />
                   </button>
                 </Tooltip>
              )}
              {onPromote && !sub.completed && editingId !== sub.id && (
                <Tooltip text="Promote">
                  <button onClick={() => onPromote(sub)} className="text-slate-300 hover:text-blue-400 p-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              )}
              <Tooltip text="Delete">
                <button onClick={() => { if (window.confirm('Are you sure you want to delete this subtask?')) onDelete(sub.id); }} className="text-slate-300 hover:text-red-500 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
          {addingToId === sub.id && (
            <div className={`mt-2 flex items-center space-x-2 ${depth >= 0 ? 'ml-12' : ''}`}>
              <input
                 type="text"
                 placeholder="Child subtask title..."
                 className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1 text-sm text-white focus:outline-none"
                 value={newChildTitle}
                 onChange={(e) => setNewChildTitle(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && newChildTitle.trim().length > 0) {
                      onAddChild?.(sub.id, newChildTitle.trim());
                      setNewChildTitle("");
                      setAddingToId(null);
                   } else if (e.key === 'Escape') {
                      setAddingToId(null);
                      setNewChildTitle("");
                   }
                 }}
                 autoFocus
              />
            </div>
          )}
          {sub.subtasks && sub.subtasks.length > 0 && (
            <div className="mt-2">
              <RecursiveSubtaskList subtasks={sub.subtasks} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onPromote={onPromote ? ((childSub, pId) => onPromote(childSub, pId || sub.id)) : undefined} onAddChild={onAddChild} editingId={editingId} setEditingId={setEditingId} editingTitle={editingTitle} setEditingTitle={setEditingTitle} saveEdit={saveEdit} depth={depth + 1} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const GoalsView = () => {
  const {
    goals,
    addGoal,
    toggleGoal,
    deleteGoal,
    updateGoal,
    addTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateGoalSubtask,
    bulkAddGoalSubtasks,
    addGoalChildSubtask,
    reorderGoals,
  } = useHub();
  const [newTitle, setNewTitle] = useState("");
  const [newSubtask, setNewSubtask] = useState<{ [key: string]: string }>({});
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [priority, setPriority] = useState<"A" | "B" | "C" | "D">("B");
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [promotionFeedback, setPromotionFeedback] = useState<string | null>(
    null,
  );
  const [isSplitting, setIsSplitting] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [parentGoalId, setParentGoalId] = useState<string | undefined>();
  const [focusAdvice, setFocusAdvice] = useState<string | null>(null);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalData, setEditingGoalData] = useState<{ 
    title: string; 
    priority: string; 
    type: string; 
    notificationEnabled: boolean; 
    notificationTime: string;
    notificationSchedule: 'once' | 'daily' | 'weekly' | 'specific_days';
    notificationDays: number[];
    notificationDate: string;
  }>({ 
    title: "", 
    priority: "B", 
    type: "weekly", 
    notificationEnabled: false, 
    notificationTime: "09:00",
    notificationSchedule: 'specific_days',
    notificationDays: [1, 2, 3, 4, 5],
    notificationDate: ""
  });

  const startEditingGoal = (goal: any) => {
    setEditingGoalId(goal.id);
    setEditingGoalData({ 
      title: goal.title, 
      priority: goal.priority, 
      type: goal.type, 
      notificationEnabled: goal.notificationEnabled || false, 
      notificationTime: goal.notificationTime || "09:00",
      notificationSchedule: goal.notificationSchedule || 'daily',
      notificationDays: goal.notificationDays || [1, 2, 3, 4, 5],
      notificationDate: goal.notificationDate || ""
    });
  };

  const saveEditingGoal = () => {
    if (editingGoalId) {
      updateGoal(editingGoalId, editingGoalData);
      setEditingGoalId(null);
    }
  };

  const handleGetFocusAdvice = async () => {
    setIsGettingAdvice(true);
    const advice = await getGoalFocusAdvice(goals.filter(g => !g.completed));
    setFocusAdvice(advice);
    setIsGettingAdvice(false);
  };

  const handleAutoSplit = async (goal: any) => {
    setIsSplitting({ ...isSplitting, [goal.id]: true });
    const steps = await getGoalBreakdown(goal.title);
    if (steps.length > 0) {
      bulkAddGoalSubtasks(goal.id, steps);
    }
    setIsSplitting({ ...isSplitting, [goal.id]: false });
  };

  const [showCompleted, setShowCompleted] = useState(false);
  const filteredGoals = goals.filter((g) => {
    const matchesFilter = filter === "All" || g.type === filter.toLowerCase();
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedGoals = [...filteredGoals].sort((a,b) => {
    return a.priority.localeCompare(b.priority);
  });
  const incompleteGoals = sortedGoals.filter(t => !t.completed);
  const completedGoals = sortedGoals.filter(t => t.completed);

  const [goalError, setGoalError] = useState("");

  const handleAdd = (type: "yearly" | "monthly" | "weekly") => {
    if (!newTitle.trim()) return;

    const exists = goals.some(g => g.title.toLowerCase() === newTitle.trim().toLowerCase() && g.type === type);
    if (exists) {
      setGoalError(`A ${type} goal with this title already exists.`);
      setTimeout(() => setGoalError(""), 3000);
      return;
    }

    addGoal({
      title: newTitle,
      type,
      priority,
      completed: false,
      parentGoalId,
    });
    setNewTitle("");
    setParentGoalId(undefined);
  };



  const renderGoal = (goal: any, index: number, isDraggable = false) => {
    const cardContent = (
      <div className="p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Tooltip text={goal.completed ? "Mark incomplete" : "Mark complete"}>
            <button
              onClick={() => toggleGoal(goal.id)}
              className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${goal.completed ? "bg-blue-600 border-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]" : "border-white/10 hover:border-white/30 text-white"}`}
            >
              {goal.completed ? (
                <CheckSquare className="w-6 h-6" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-white/10" />
              )}
            </button>
          </Tooltip>
          <div className="flex flex-wrap items-center gap-1">
            {!goal.completed && (
              <Tooltip text="Promote scope (to Task)">
                <button
                  onClick={() => handlePromote(goal, { title: goal.title })}
                  className="p-3 bg-white/5 rounded-xl text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </Tooltip>
            )}
            {!goal.completed && (goal.type === "weekly" || goal.type === "monthly") && (
              <Tooltip text={`Send back to ${goal.type === "weekly" ? "Monthly" : "Yearly"} scope`}>
                <button
                  onClick={() => handleDemote(goal)}
                  className="p-3 bg-white/5 rounded-xl text-orange-400 hover:bg-orange-500/10 transition-colors"
                >
                  <ArrowDownLeft className="w-5 h-5" />
                </button>
              </Tooltip>
            )}
            <Tooltip text="Toggle sub-tasks">
              <button
                onClick={() =>
                  setExpandedId(expandedId === goal.id ? null : goal.id)
                }
                className={`p-3 bg-white/5 rounded-xl text-slate-300 hover:text-white transition-all ${expandedId === goal.id ? "rotate-180 bg-white/10" : ""}`}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </Tooltip>
            {editingGoalId === goal.id ? (
              <Tooltip text="Save">
                <button
                  onClick={saveEditingGoal}
                  className="p-3 text-green-500 hover:text-green-400 transition-colors"
                >
                  <CheckSquare className="w-5 h-5" />
                </button>
              </Tooltip>
            ) : (
              <Tooltip text="Edit goal">
                <button
                  onClick={() => startEditingGoal(goal)}
                  className="p-3 hover:text-blue-500 transition-colors text-slate-300"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </Tooltip>
            )}
            <Tooltip text="Delete goal">
              <button
                onClick={() => { if (window.confirm('Are you sure you want to delete this goal?')) deleteGoal(goal.id); }}
                className="p-3 hover:text-red-500 transition-colors text-slate-300"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="space-y-2">
          {editingGoalId === goal.id ? (
            <div className="space-y-3 relative z-10">
              <input
                type="text"
                value={editingGoalData.title}
                onChange={(e) => setEditingGoalData({ ...editingGoalData, title: e.target.value })}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white font-black tracking-tight"
                placeholder="Goal Title"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <select
                  value={editingGoalData.type}
                  onChange={(e) => setEditingGoalData({ ...editingGoalData, type: e.target.value })}
                  className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white text-xs uppercase"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
                <select
                  value={editingGoalData.priority}
                  onChange={(e) => setEditingGoalData({ ...editingGoalData, priority: e.target.value })}
                  className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white text-xs uppercase"
                >
                  <option value="A">Priority A</option>
                  <option value="B">Priority B</option>
                  <option value="C">Priority C</option>
                  <option value="D">Priority D</option>
                </select>
              </div>
              <NotificationEditor
                enabled={editingGoalData.notificationEnabled}
                setEnabled={(b) => setEditingGoalData({ ...editingGoalData, notificationEnabled: b })}
                time={editingGoalData.notificationTime}
                setTime={(t) => setEditingGoalData({ ...editingGoalData, notificationTime: t })}
                schedule={editingGoalData.notificationSchedule}
                setSchedule={(s) => setEditingGoalData({ ...editingGoalData, notificationSchedule: s })}
                days={editingGoalData.notificationDays}
                setDays={(d) => setEditingGoalData({ ...editingGoalData, notificationDays: d })}
                date={editingGoalData.notificationDate}
                setDate={(d) => setEditingGoalData({ ...editingGoalData, notificationDate: d })}
              />
            </div>
          ) : (
            <>
              <h4
                className={`text-2xl font-display font-black tracking-tight break-words ${goal.completed ? "line-through text-slate-300" : "text-white"}`}
              >
                {goal.title}
              </h4>
              {goal.parentGoalTitle && (
                <p className="text-xs text-blue-400/80 font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Target className="w-3 h-3" />
                  From: {goal.parentGoalTitle}
                </p>
              )}
              <div className="flex items-center space-x-3">
                <span className="text-xs font-black bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest">
                  {goal.type}
                </span>
                <span className="text-xs font-black bg-white/10 text-slate-300 px-3 py-1 rounded-full uppercase tracking-widest">
                  Priority {goal.priority}
                </span>
                {!goal.completed && (
                  (() => {
                    const text = getCountdownText(goal.type);
                    const isOverdue = text === "Overdue";
                    return (
                      <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 ${isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        <Timer className="w-3 h-3" />
                        {text}
                      </span>
                    );
                  })()
                )}
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
              Progress
            </span>
            <span className="text-xs font-black text-white font-mono">
              {goal.progress}% COMPLETE
            </span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              className={`h-full transition-all duration-1000 relative ${
                goal.completed
                  ? "bg-blue-600"
                  : "bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              }`}
            >
              {!goal.completed && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
              )}
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {expandedId === goal.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-6 border-t border-white/5 space-y-6"
            >
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newSubtask[goal.id] || ""}
                  onChange={(e) =>
                    setNewSubtask({
                      ...newSubtask,
                      [goal.id]: e.target.value,
                    })
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddSub(goal.id)
                  }
                  placeholder="Add subtask..."
                  className="flex-1 min-w-0 bg-white/5 border border-white/5 rounded-[20px] px-6 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
                <Tooltip text="Auto-split with AI">
                  <button
                    onClick={() => handleAutoSplit(goal)}
                    disabled={isSplitting[goal.id]}
                    className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl hover:bg-blue-600/20 transition-all border border-blue-500/10 disabled:opacity-50"
                  >
                    {isSplitting[goal.id] ? (
                      <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </button>
                </Tooltip>
              </div>

              <div className="space-y-3">
                <RecursiveSubtaskList 
                   subtasks={goal.subtasks}
                   onToggle={(id) => toggleSubtask(goal.id, id)}
                   onEdit={(id, title) => updateGoalSubtask(goal.id, id, title)}
                   onDelete={(id) => deleteSubtask(goal.id, id)}
                   onPromote={(sub, parentId) => handlePromote(goal, sub, true, parentId)}
                   editingId={editingSubtaskId}
                   editingTitle={editingSubtaskTitle}
                   setEditingId={setEditingSubtaskId}
                   setEditingTitle={setEditingSubtaskTitle}
                   saveEdit={(id, title) => updateGoalSubtask(goal.id, id, title)}
                   onAddChild={(parentId, title) => addGoalChildSubtask(goal.id, parentId, title)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );

    return (
        <motion.div
           layout
           key={goal.id}
           className={`glass-card group hover:border-white/20 transition-all ${goal.completed ? "opacity-60 grayscale-[0.5]" : ""} p-1 rounded-[32px] overflow-hidden relative mb-6`}
         >
           <div className="absolute top-4 -left-4 xl:-left-6 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
             <button onClick={() => reorderGoals(goal.id, 'up')} className="p-1 text-slate-300 hover:text-white bg-[#050505] rounded-lg border border-white/10 hover:border-white/30 backdrop-blur-md transition-all shadow-xl">
               <ChevronUp className="w-4 h-4" />
             </button>
             <button onClick={() => reorderGoals(goal.id, 'down')} className="p-1 text-slate-300 hover:text-white bg-[#050505] rounded-lg border border-white/10 hover:border-white/30 backdrop-blur-md transition-all shadow-xl">
               <ChevronDown className="w-4 h-4" />
             </button>
           </div>
           {cardContent}
         </motion.div>
    );
  };

  const handleAddSub = (goalId: string) => {
    const title = newSubtask[goalId];
    if (!title?.trim()) return;
    addSubtask(goalId, title);
    setNewSubtask({ ...newSubtask, [goalId]: "" });
  };

  const handleDemote = (goal: any) => {
    let nextType = "";
    if (goal.fromGoalId && goals.some((g: any) => g.id === goal.fromGoalId)) {
       bulkAddGoalSubtasks(goal.fromGoalId, [{
           id: Math.random().toString(36).substr(2, 9),
           title: goal.title,
           completed: goal.completed || false,
           subtasks: goal.subtasks || []
       }], goal.fromSubtaskId);
       nextType = "parent Goal's subtasks";
    } else if (goal.type === "weekly") {
      addGoal({
        title: goal.title,
        type: "monthly",
        priority: goal.priority,
        completed: false,
        subtasks: goal.subtasks || [],
      });
      nextType = "Monthly Goal";
    } else if (goal.type === "monthly") {
      addGoal({
        title: goal.title,
        type: "yearly",
        priority: goal.priority,
        completed: false,
        subtasks: goal.subtasks || [],
      });
      nextType = "Yearly Goal";
    }
    
    if (nextType) {
      deleteGoal(goal.id);
      setPromotionFeedback(`Sent back to ${nextType}!`);
      setTimeout(() => setPromotionFeedback(null), 3000);
    }
  };

  const handlePromote = (
    goal: any,
    item: { title: string; id?: string; subtasks?: any[] },
    isSubtask: boolean = false,
    parentId?: string
  ) => {
    let nextType = "";
    const fromGoalId = isSubtask ? goal.id : undefined;
    const promotedSubtasks = isSubtask && item.subtasks ? item.subtasks : (!isSubtask ? goal.subtasks : []);

    if (goal.type === "yearly") {
      addGoal({
        title: item.title,
        type: "monthly",
        priority: goal.priority,
        completed: false,
        subtasks: promotedSubtasks,
        parentGoalTitle: !isSubtask ? undefined : goal.title,
        fromGoalId,
      });
      nextType = "Monthly Goal";
    } else if (goal.type === "monthly") {
      addGoal({
        title: item.title,
        type: "weekly",
        priority: goal.priority,
        completed: false,
        subtasks: promotedSubtasks,
        parentGoalTitle: !isSubtask ? undefined : goal.title,
        fromGoalId,
      });
      nextType = "Weekly Goal";
    } else if (goal.type === "weekly") {
      addTask({
        title: item.title,
        date: toLocalDateStr(),
        priority: goal.priority,
        type: "one-off",
        tags: ["#from-goals"],
        subtasks: promotedSubtasks,
        parentGoalTitle: !isSubtask ? undefined : goal.title,
        fromGoalId,
        fromSubtaskId: parentId,
      });
      nextType = "Daily Task";
    }

    if (isSubtask && item.id) {
      deleteSubtask(goal.id, item.id);
    } else if (!isSubtask) {
      deleteGoal(goal.id);
    }

    setPromotionFeedback(`Moved to ${nextType}!`);
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
            <span className="text-xs font-black uppercase tracking-[0.4em] font-mono opacity-60">
              Strategic Layer
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white">
            Goals.
          </h2>
          <p className="text-slate-300 font-medium">
            Architect your long-term success. Filter by temporal scope.
          </p>
        </div>
      </div>

      <GlassCard className="p-1 max-w-4xl w-full mx-auto !rounded-[40px] overflow-hidden group focus-within:border-blue-500/30 transition-all shadow-2xl">
        <div className="p-6 md:p-8 space-y-6 md:space-y-8">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Define your next objective..."
            className="w-full bg-transparent border-none focus:ring-0 text-white text-xl sm:text-3xl placeholder:text-slate-300 font-display font-black text-center"
          />

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center space-x-3 bg-white/5 rounded-2xl px-5 py-3 border border-white/10">
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
                Priority
              </span>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleAdd("yearly")}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-xs font-black uppercase tracking-widest px-6 py-4 sm:py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 w-full"
              >
                Yearly
              </button>
              <button
                onClick={() => handleAdd("monthly")}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-xs font-black uppercase tracking-widest px-6 py-4 sm:py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 w-full"
              >
                Monthly
              </button>
              <button
                onClick={() => handleAdd("weekly")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-xs font-black uppercase tracking-widest px-6 py-4 sm:py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 w-full"
              >
                Weekly
              </button>
            </div>
          </div>
          {goalError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs font-black uppercase tracking-widest text-center mt-3 animate-pulse"
            >
              {goalError}
            </motion.p>
          )}
        </div>
      </GlassCard>

      <div className="max-w-4xl mx-auto w-full space-y-4">
        <Tooltip text="Get AI advice on where to direct your energy next">
          <button 
            onClick={handleGetFocusAdvice}
            disabled={isGettingAdvice}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-3 text-blue-400 cursor-pointer hover:bg-white/10 transition-all text-left disabled:opacity-50"
          >
            {isGettingAdvice ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="text-sm font-semibold">
              {isGettingAdvice ? "Analyzing targets..." : "Tell me what to focus on"}
            </span>
          </button>
        </Tooltip>
        
        <AnimatePresence>
          {focusAdvice && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
              <div className="relative z-10 flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 space-y-2 text-sm text-blue-100 leading-relaxed">
                  {focusAdvice}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full max-w-4xl mx-auto">
        <div className="flex-1 sm:min-w-[200px]">
           <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-[20px] px-4 py-3 sm:py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
              style={{ appearance: 'none', WebkitAppearance: 'none' }}
           />
        </div>
        <div className="flex bg-white/[0.03] border border-white/10 rounded-3xl p-1 gap-1 overflow-x-auto no-scrollbar max-w-full">
          {["All", "Yearly", "Monthly", "Weekly"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-3 sm:px-6 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex-none sm:flex-1 text-center min-w-[80px] whitespace-nowrap ${filter === t ? "bg-white text-black shadow-lg" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filter === "All" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-x-auto pb-8">
            {["Yearly", "Monthly", "Weekly"].map((colType) => {
              const colGoals = incompleteGoals.filter((g) => g.type === colType.toLowerCase());
              return (
                <div key={colType} className="flex flex-col space-y-4 min-w-[280px]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-black text-white px-2 uppercase tracking-widest">{colType}</h3>
                    <span className="text-xs bg-white/10 text-white font-mono px-2 py-0.5 rounded-full">{colGoals.length}</span>
                  </div>
                      <div
                        className={`flex-1 min-h-[400px] bg-white/[0.02] border border-white/5 rounded-[40px] p-2 transition-colors`}
                      >
                        {colGoals.map((goal, index) => renderGoal(goal, index, true))}
                      </div>
                </div>
              );
            })}
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {incompleteGoals.map((goal, index) => renderGoal(goal, index, false))}
          {incompleteGoals.length === 0 && (
            <div className="text-center py-24 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] md:col-span-2 space-y-4 px-6">
              <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-black text-slate-300">Set Your First Goal</h3>
              <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
                Goals act as strategic containers for your daily actions. Create a high-level objective you want to achieve, then use the AI or manual input to break it down into a sequence of actionable steps. Drop a goal title in the input above and press Enter.
              </p>
            </div>
          )}
        </div>
      )}

      {completedGoals.length > 0 && (
        <div className="mt-8 space-y-4">
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center space-x-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors w-full"
          >
            <div className="flex-1 h-px bg-white/5"></div>
            <span>{showCompleted ? "Hide" : "Show"} Completed Goals ({completedGoals.length})</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </button>

          {showCompleted && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {completedGoals.map(goal => (
                <div key={goal.id} className="flex flex-col p-4 bg-white/[0.02] border border-white/5 rounded-2xl opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Tooltip text="Mark incomplete">
                        <button onClick={() => toggleGoal(goal.id)} className="w-6 h-6 shrink-0 bg-blue-600/20 border-blue-500/30 text-blue-400 rounded-lg flex items-center justify-center transition-all hover:bg-blue-600 hover:text-white">
                          <CheckSquare className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                      <span className="text-sm font-medium text-slate-300 line-through line-clamp-2">{goal.title}</span>
                    </div>
                    <button onClick={() => { if (window.confirm('Are you sure you want to delete this goal?')) deleteGoal(goal.id); }} className="text-slate-300 hover:text-red-400 p-1 shrink-0 ml-2">
                       <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                  <div className="flex space-x-2 mt-3 pl-9">
                    <span className="text-xs font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md text-slate-300">{goal.type}</span>
                    <span className="text-xs font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md text-slate-300">{goal.priority}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

const TasksView = () => {
  const {
    tasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    postponeTask,
    goals,
    addTaskSubtask,
    toggleTaskSubtask,
    deleteTaskSubtask,
    updateTaskSubtask,
    addTaskChildSubtask,
    bulkAddTaskSubtasks,
    focusTaskId,
    setFocusTaskId,
    smartPrioritizeTasks,
    reorderTasks,
    addGoal,
    bulkAddGoalSubtasks,
  } = useHub();
  const [newTitle, setNewTitle] = useState("");
  const [newSubtask, setNewSubtask] = useState<{ [key: string]: string }>({});
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [priority, setPriority] = useState<"A" | "B" | "C" | "D">("B");
  const [duration, setDuration] = useState("30m");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [type, setType] = useState<"one-off" | "daily" | "break">("one-off");
  const [tags, setTags] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [pomoLength, setPomoLength] = useState(25);
  const [freeTime, setFreeTime] = useState({ start: "09:00", end: "18:00" });
  const [isSplitting, setIsSplitting] = useState<{ [key: string]: boolean }>({});
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "matrix" | "planning">("list");
  const [focusAdvice, setFocusAdvice] = useState<string | null>(null);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);
  const [promotionFeedback, setPromotionFeedback] = useState<string | null>(null);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskData, setEditingTaskData] = useState<{ title: string; priority: string }>({ title: "", priority: "B" });

  const startEditingTask = (task: any) => {
    setEditingTaskId(task.id);
    setEditingTaskData({ title: task.title, priority: task.priority || "B" });
  };

  const saveEditingTask = () => {
    if (editingTaskId) {
      updateTask(editingTaskId, editingTaskData);
      setEditingTaskId(null);
    }
  };

  const handleGetFocusAdvice = async () => {
    setIsGettingAdvice(true);
    const advice = await getTaskFocusAdvice(tasks.filter(t => !t.completed));
    setFocusAdvice(advice);
    setIsGettingAdvice(false);
  };

  const handleApplySmartPrioritize = async () => {
    setIsPrioritizing(true);
    if (viewMode === "planning") {
      // Group tasks by date to reschedule within each day
      const grouped = incompleteTasks.reduce((acc, task) => {
        const d = task.date || toLocalDateStr();
        if (!acc[d]) acc[d] = [];
        acc[d].push(task);
        return acc;
      }, {} as Record<string, typeof incompleteTasks>);

      for (const dateStr of Object.keys(grouped)) {
        let currentTime = freeTime.start || "09:00";
        const sorted = grouped[dateStr].sort((a,b) => {
          if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
          return (a.order || 0) - (b.order || 0);
        });

        for (const task of sorted) {
          const durationMins = parseInt(task.duration || "30");
          const [h, m] = currentTime.split(":").map(Number);
          
          updateTask(task.id, { startTime: currentTime });
          
          const dateObj = new Date();
          dateObj.setHours(h, m + durationMins + 5);
          currentTime = `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
        }
      }
      setIsPrioritizing(false);
      return;
    }
    await smartPrioritizeTasks();
    setIsPrioritizing(false);
  };

  const handleAddSub = (taskId: string) => {
    const title = newSubtask[taskId];
    if (!title?.trim()) return;
    addTaskSubtask(taskId, title);
    setNewSubtask({ ...newSubtask, [taskId]: "" });
  };

  const handleTaskAutoSplit = async (task: any) => {
    setIsSplitting({ ...isSplitting, [task.id]: true });
    const steps = await getGoalBreakdown(task.title);
    if (steps.length > 0) {
      bulkAddTaskSubtasks(task.id, steps);
    }
    setIsSplitting({ ...isSplitting, [task.id]: false });
  };

  const [showCompleted, setShowCompleted] = useState(false);
  const displayTasks = [...tasks].sort((a,b) => {
    return (a.order || 0) - (b.order || 0);
  });
  const incompleteTasks = displayTasks.filter(t => !t.completed);
  const completedTasks = displayTasks.filter(t => t.completed);



  const [taskError, setTaskError] = useState("");

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    
    const today = toLocalDateStr();
    const exists = tasks.some(t => t.title.toLowerCase() === newTitle.trim().toLowerCase() && t.date === today);
    
    if (exists) {
      setTaskError("A task with this title already exists today.");
      setTimeout(() => setTaskError(""), 3000);
      return;
    }

    addTask({
      title: newTitle,
      date: today,
      priority,
      startTime,
      endTime,
      duration,
      type: type as any,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setNewTitle("");
    setTags("");
  };

  const exportCalendar = () => {
    const today = toLocalDateStr();
    let icsContent =
      "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Drive Productivity OS//EN\n";
    tasks
      .filter((t) => t.date === today && !t.completed)
      .forEach((task) => {
        if (!task.startTime || !task.endTime) return;
        const startDateTime =
          today.replace(/-/g, "") +
          "T" +
          task.startTime.replace(":", "") +
          "00";
        const endDateTime =
          today.replace(/-/g, "") + "T" + task.endTime.replace(":", "") + "00";
        icsContent += `BEGIN:VEVENT\nSUMMARY:${task.title}\nDTSTART:${startDateTime}\nDTEND:${endDateTime}\nEND:VEVENT\n`;
      });
    icsContent += "END:VCALENDAR";

    const element = document.createElement("a");
    const file = new Blob([icsContent], { type: "text/calendar" });
    element.href = URL.createObjectURL(file);
    element.download = "drive_goals.ics";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePostpone = (task: any) => {
    postponeTask(task.id);
  };

  const handleDemote = (task: any) => {
    let nextType = "";
    if (task.fromGoalId && goals.some(g => g.id === task.fromGoalId)) {
        bulkAddGoalSubtasks(task.fromGoalId, [{
            id: Math.random().toString(36).substr(2, 9),
            title: task.title,
            completed: task.completed || false,
            subtasks: task.subtasks || []
        }], task.fromSubtaskId);
        nextType = "parent Goal's subtasks";
    } else {
        addGoal({
            title: task.title,
            type: "weekly",
            priority: task.priority || "B",
            completed: task.completed || false,
            subtasks: task.subtasks || []
        });
        nextType = "Weekly Goal";
    }
    deleteTask(task.id);
    setPromotionFeedback(`Sent back to ${nextType}!`);
    setTimeout(() => setPromotionFeedback(null), 3000);
  };

  const handleAutoSchedule = async () => {
    const data = {
      pendingTasks: tasks.filter((t) => !t.completed).map((t) => t.title),
      goals: goals.filter((g) => !g.completed).map((g) => g.title),
      freeTime,
      pomodoroFocus: pomoLength,
    };
    const res = await getAICoachInsight(data);
    alert(`AI Coach Schedule Suggestion:\n${res}`);
    setShowAutoSchedule(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <AnimatePresence>
        {promotionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-orange-600 text-white px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(234,88,12,0.4)] flex items-center space-x-4 font-black text-xs uppercase tracking-widest"
          >
            <ArrowDownLeft className="w-5 h-5 text-orange-200" />
            <span>{promotionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 text-rose-500"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.4em] font-mono opacity-60">
              Operational Duty
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white">
            Daily Tasks.
          </h2>
          <p className="text-slate-300 font-medium max-w-md">
            Synchronize your daily operations. Execute with precision.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white/5 rounded-[24px] p-1 border border-white/10">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 sm:px-4 sm:py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all ${viewMode === "list" ? "bg-white text-black shadow-md" : "text-slate-300 hover:text-white"}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("matrix")}
              className={`px-4 py-2 sm:px-4 sm:py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all ${viewMode === "matrix" ? "bg-white text-black shadow-md" : "text-slate-300 hover:text-white"}`}
            >
              Matrix
            </button>
            <button
              onClick={() => setViewMode("planning")}
              className={`px-4 py-2 sm:px-4 sm:py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all ${viewMode === "planning" ? "bg-white text-black shadow-md" : "text-slate-300 hover:text-white"}`}
            >
              Planning
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAutoSchedule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card p-6 sm:p-8 border-blue-500/20"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <p className="text-xs font-black text-blue-500 uppercase tracking-widest">
                  AI Engine
                </p>
                <h4 className="text-2xl font-display font-black text-white">
                  Temporal Optimization
                </h4>
              </div>
              <button
                onClick={() => setShowAutoSchedule(false)}
                className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45 text-slate-300" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-300 uppercase tracking-widest">
                  Window Access
                </label>
                <div className="flex items-center space-x-2 bg-white/5 p-2 rounded-2xl border border-white/5">
                  <input
                    type="time"
                    value={freeTime.start}
                    onChange={(e) =>
                      setFreeTime({ ...freeTime, start: e.target.value })
                    }
                    className="bg-transparent border-none text-white font-bold text-sm focus:ring-0 w-24"
                  />
                  <span className="text-slate-300">TO</span>
                  <input
                    type="time"
                    value={freeTime.end}
                    onChange={(e) =>
                      setFreeTime({ ...freeTime, end: e.target.value })
                    }
                    className="bg-transparent border-none text-white font-bold text-sm focus:ring-0 w-24"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-300 uppercase tracking-widest">
                  Block Size (M)
                </label>
                <input
                  type="number"
                  value={pomoLength}
                  onChange={(e) => setPomoLength(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAutoSchedule}
                  className="w-full h-14 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition shadow-2xl active:scale-95"
                >
                  Regenerate Routine
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode !== "planning" && (
        <GlassCard className="p-1 max-w-4xl mx-auto !rounded-[32px] sm:!rounded-[40px] overflow-hidden group focus-within:border-blue-500/30 transition-all shadow-2xl">
          <div className="p-4 sm:p-8 space-y-6">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What is your next task?"
              className="w-full bg-transparent border-none focus:ring-0 text-white text-xl sm:text-3xl placeholder:text-slate-300 font-display font-black text-center"
            />
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center">
              <div className="flex items-center bg-white/5 rounded-2xl px-5 py-3 border border-white/5 text-xs font-black text-slate-300">
                <Calendar className="w-4 h-4 mr-2 opacity-30" />
                <span>
                  {new Date().toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>

              <div className="flex items-center bg-white/5 rounded-2xl px-5 py-3 border border-white/5 text-xs font-black text-slate-300">
                <Clock className="w-4 h-4 mr-2 opacity-30" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer w-16"
                />
                <span className="mx-2 opacity-20">-</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer w-16"
                />
              </div>
              
              <div className="flex items-center bg-white/5 rounded-2xl px-5 py-3 border border-white/5 text-xs font-black">
                <span className="text-slate-300 mr-2 uppercase tracking-widest opacity-50">PRIORITY</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="bg-transparent border-none p-0 focus:ring-0 text-white font-bold cursor-pointer"
                  style={{ appearance: 'none', WebkitAppearance: 'none' }}
                >
                  <option value="A" className="text-black">A - CRITICAL</option>
                  <option value="B" className="text-black">B - HIGH</option>
                  <option value="C" className="text-black">C - MEDIUM</option>
                  <option value="D" className="text-black">D - LOW</option>
                </select>
              </div>

              <button
                onClick={handleAdd}
                className="w-full sm:w-auto bg-white text-black font-black text-xs uppercase tracking-[0.2em] px-10 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
              >
                + Deploy
              </button>
            </div>
            {taskError && (
              <motion.p
                 initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                 className="text-red-400 text-xs font-black uppercase tracking-widest text-center mt-3 animate-pulse"
              >
                {taskError}
              </motion.p>
            )}
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags: #urgent, #deep, #admin"
              className="w-full bg-transparent border-t border-white/5 pt-6 text-xs font-bold text-slate-300 text-center uppercase tracking-widest placeholder:text-slate-300 focus:outline-none"
            />
          </div>
        </GlassCard>
      )}

      <div className="max-w-4xl mx-auto w-full space-y-4">
        <Tooltip text="Get AI advice on where to direct your energy next">
          <button 
            onClick={handleGetFocusAdvice}
            disabled={isGettingAdvice}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-3 text-blue-400 cursor-pointer hover:bg-white/10 transition-all text-left disabled:opacity-50"
          >
            {isGettingAdvice ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="text-sm font-semibold">
              {isGettingAdvice ? "Analyzing targets..." : "Tell me what to focus on"}
            </span>
          </button>
        </Tooltip>
        
        <AnimatePresence>
          {focusAdvice && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
              <div className="relative z-10 flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 space-y-2 text-sm text-blue-100 leading-relaxed">
                  {focusAdvice}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {viewMode === "planning" ? (
        <div className="space-y-8 max-w-4xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
             <div className="flex flex-col">
               <span className="text-xs font-black uppercase tracking-[0.3em] font-mono text-blue-500">Scheduled Slots</span>
               <h4 className="text-xl font-display font-black text-white">Daily Timeline</h4>
             </div>
             
             <div className="flex flex-wrap items-center gap-4">
               <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                 <div className="flex items-center space-x-2">
                   <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Global Start</span>
                   <input
                     type="time"
                     value={freeTime.start}
                     onChange={(e) => setFreeTime({ ...freeTime, start: e.target.value })}
                     className="bg-transparent border-none text-white font-bold text-xs focus:ring-0 p-0 w-16"
                   />
                 </div>
               </div>
               
               <button
                 onClick={() => {
                   // Reschedule all from current global start
                   let currentTime = freeTime.start || "09:00";
                   const sorted = [...incompleteTasks].sort((a,b) => (a.date || "").localeCompare(b.date || "") || (a.order || 0) - (b.order || 0));
                   for (const task of sorted) {
                     updateTask(task.id, { startTime: currentTime });
                     const [h, m] = currentTime.split(":").map(Number);
                     const d = new Date();
                     d.setHours(h, m + parseInt(task.duration || "30") + 5);
                     currentTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                   }
                 }}
                 className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all"
               >
                 <RotateCcw className="w-3 h-3"/>
                 <span>Reset Timeline</span>
               </button>

               <button
                 onClick={() => {
                    // Shift all tasks forward by 15 mins (simple break)
                    const sorted = [...incompleteTasks].sort((a,b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));
                    sorted.forEach(task => {
                      if (task.startTime) {
                        const [h, m] = task.startTime.split(":").map(Number);
                        const d = new Date();
                        d.setHours(h, m + 15);
                        updateTask(task.id, { startTime: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` });
                      }
                    });
                 }}
                 className="flex items-center space-x-2 px-4 py-2 bg-orange-600/10 border border-orange-500/20 rounded-xl text-xs font-black uppercase tracking-widest text-orange-400 hover:bg-orange-600/20 transition-all"
               >
                 <Coffee className="w-3 h-3"/>
                 <span>Add 15m Break</span>
               </button>
             </div>
          </div>

          <div className="space-y-4">
            {(() => {
              const tasksForDate = incompleteTasks;
              
              if (tasksForDate.length === 0) {
                return (
                  <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] px-6">
                     <CalendarRange className="w-10 h-10 text-slate-300 mx-auto mb-4 opacity-50" />
                     <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">No pending tasks.</p>
                     <p className="text-xs text-slate-300 mt-2">Deploy some tasks to build your mission timeline.</p>
                  </div>
                );
              }

              return tasksForDate
                .sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"))
                .map((task, idx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-4 sm:gap-8 group"
                  >
                    <TaskTimeEditor task={task} updateTask={updateTask} tasksForDate={tasksForDate} />

                          {/* Divider */}
                          <div className="relative flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600 border-4 border-[#0a0a0c] z-10" />
                            <div className="flex-1 w-px bg-white/10 group-last:bg-transparent" />
                          </div>

                          {/* Right Column: Task Content */}
                          <div className="flex-1 pb-10">
                            <GlassCard className="p-5 sm:p-6 !rounded-[24px] border border-white/5 group-hover:border-white/10 transition-all relative overflow-hidden">
                              <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-20 ${
                                task.priority === 'A' ? 'bg-rose-500' :
                                task.priority === 'B' ? 'bg-blue-500' :
                                'bg-slate-500'
                              }`} />
                              
                              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                   <div className="flex items-center gap-2">
                                     <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                                       task.priority === 'A' ? 'bg-rose-500/20 text-rose-400' :
                                       task.priority === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                       'bg-slate-500/20 text-slate-300'
                                     }`}>
                                       Priority {task.priority}
                                     </span>
                                     {task.parentGoalTitle && (
                                       <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                                         {task.parentGoalTitle}
                                       </span>
                                     )}
                                   </div>
                                   <input
                                      value={task.title}
                                      onChange={(e) => updateTask(task.id, { title: e.target.value })}
                                      className="text-lg sm:text-xl font-display font-black text-white leading-tight bg-transparent border-none p-0 focus:ring-0 w-full"
                                   />
                                </div>

                                <div className="flex items-center gap-2">
                                   <div className="flex flex-col gap-1 mr-2">
                                     <button
                                       onClick={() => {
                                         const sorted = [...tasksForDate].sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));
                                         const index = sorted.findIndex(t => t.id === task.id);
                                         if (index > 0) {
                                           const prev = sorted[index - 1];
                                           let currentTime = prev.startTime || "09:00";
                                           
                                           const newSorted = [...sorted];
                                           newSorted[index - 1] = task;
                                           newSorted[index] = prev;

                                           for (let i = index - 1; i < newSorted.length; i++) {
                                             const t = newSorted[i];
                                             const durMins = parseInt(t.duration || "30");
                                             updateTask(t.id, { startTime: currentTime });
                                             const [h, m] = currentTime.split(":").map(Number);
                                             const d = new Date();
                                             d.setHours(h, m + durMins + 5);
                                             currentTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                                           }
                                         }
                                       }}
                                       className="p-1.5 bg-white/5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors disabled:opacity-30"
                                       disabled={idx === 0}
                                     >
                                       <ChevronUp className="w-3 h-3" />
                                     </button>
                                     <button
                                       onClick={() => {
                                         const sorted = [...tasksForDate].sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));
                                         const index = sorted.findIndex(t => t.id === task.id);
                                         if (index < sorted.length - 1) {
                                           const next = sorted[index + 1];
                                           let currentTime = task.startTime || "09:00";
                                           
                                           const newSorted = [...sorted];
                                           newSorted[index + 1] = task;
                                           newSorted[index] = next;

                                           for (let i = index; i < newSorted.length; i++) {
                                             const t = newSorted[i];
                                             const durMins = parseInt(t.duration || "30");
                                             updateTask(t.id, { startTime: currentTime });
                                             const [h, m] = currentTime.split(":").map(Number);
                                             const d = new Date();
                                             d.setHours(h, m + durMins + 5);
                                             currentTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                                           }
                                         }
                                       }}
                                       className="p-1.5 bg-white/5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors disabled:opacity-30"
                                       disabled={idx === tasksForDate.length - 1}
                                     >
                                       <ChevronDown className="w-3 h-3" />
                                     </button>
                                   </div>
                                   <Tooltip text="Mission Control (Pomodoro)">
                                      <button
                                        onClick={() => {
                                          setFocusTaskId(task.id);
                                        }}
                                        className="p-2 bg-purple-600/10 border border-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-600/20 transition-all"
                                      >
                                        <Zap className="w-4 h-4" />
                                      </button>
                                   </Tooltip>
                                   <Tooltip text="Insert 15m Break After">
                                      <button
                                        onClick={() => {
                                          // Shift all tasks that start AFTER this one
                                          const sorted = [...tasksForDate].sort((a,b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));
                                          const index = sorted.findIndex(t => t.id === task.id);
                                          const following = sorted.slice(index + 1);
                                          
                                          following.forEach(t => {
                                            if (t.startTime) {
                                              const [h, m] = t.startTime.split(":").map(Number);
                                              const d = new Date();
                                              d.setHours(h, m + 15);
                                              updateTask(t.id, { startTime: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` });
                                            }
                                          });
                                        }}
                                        className="p-2 bg-orange-600/10 border border-orange-500/20 rounded-lg text-orange-400 hover:bg-orange-600/20 transition-all"
                                      >
                                        <Coffee className="w-4 h-4" />
                                      </button>
                                   </Tooltip>
                                   <div className="w-px h-6 bg-white/10 mx-1" />
                                   <Tooltip text="Complete Task">
                                      <button
                                        onClick={() => toggleTask(task.id)}
                                        className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-600/20 transition-all"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                   </Tooltip>
                                </div>
                              </div>
                            </GlassCard>
                          </div>
                        </motion.div>
                      ));
            })()}
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incompleteTasks.map((task, index) => (
            <div key={task.id}>
              <motion.div
                layout
                className={`glass-card group hover:border-white/20 transition-all h-full flex flex-col p-6 rounded-[32px] relative ${focusTaskId === task.id ? "border-blue-500/50 bg-blue-600/[0.03] ring-1 ring-blue-500/20" : ""}`}
              >
                <div className="absolute top-4 -left-4 xl:-left-6 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => reorderTasks(task.id, 'up')} className="p-1 text-slate-300 hover:text-white bg-[#050505] rounded-lg border border-white/10 hover:border-white/30 backdrop-blur-md transition-all shadow-xl">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => reorderTasks(task.id, 'down')} className="p-1 text-slate-300 hover:text-white bg-[#050505] rounded-lg border border-white/10 hover:border-white/30 backdrop-blur-md transition-all shadow-xl">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                        <div className="flex items-start justify-between mb-6">
                          <Tooltip text={task.completed ? "Mark pending" : "Complete task"}>
                            <button
                              onClick={() => toggleTask(task.id)}
                              className={`w-8 h-8 border-2 rounded-xl flex-shrink-0 transition-all flex items-center justify-center ${task.completed ? "bg-blue-600 border-blue-600 text-white" : "border-white/10 hover:border-white/30"}`}
                            >
                              {task.completed && (
                                <CheckCircle2 className="w-5 h-5" />
                              )}
                            </button>
                          </Tooltip>
                          <div className="flex items-center space-x-1">
                            {!task.completed && (
                              <Tooltip text="Enter Focus Mode">
                                <button
                                  onClick={() =>
                                    setFocusTaskId(
                                      focusTaskId === task.id ? null : task.id,
                                    )
                                  }
                                  className={`p-3 rounded-xl transition-all ${focusTaskId === task.id ? "bg-blue-600 text-white shadow-lg" : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"}`}
                                >
                                  <Zap className="w-4 h-4 fill-current" />
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 space-y-4">
                          {editingTaskId === task.id ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editingTaskData.title}
                                onChange={(e) => setEditingTaskData({ ...editingTaskData, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white font-black tracking-tight"
                                placeholder="Task Title"
                                autoFocus
                              />
                              <div className="flex flex-wrap gap-2">
                                <select
                                  value={editingTaskData.priority}
                                  onChange={(e) => setEditingTaskData({ ...editingTaskData, priority: e.target.value })}
                                  className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white text-xs uppercase"
                                >
                                  <option value="A">Priority A</option>
                                  <option value="B">Priority B</option>
                                  <option value="C">Priority C</option>
                                </select>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h5
                                className={`text-xl font-display font-black tracking-tight leading-tight transition-all ${task.completed ? "text-slate-300 line-through opacity-50" : "text-white"}`}
                              >
                                {task.title}
                              </h5>
                              {task.parentGoalTitle && (
                                <p className="text-xs text-blue-400/80 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                                  <Target className="w-3 h-3" />
                                  From: {task.parentGoalTitle}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-4">
                                {task.startTime && (
                                  <span className="text-xs font-black bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full uppercase">
                                    {task.startTime} - {task.endTime || "??:??"}
                                  </span>
                                )}
                                <span className="text-xs font-black bg-white/10 text-slate-300 px-3 py-1 rounded-full uppercase">
                                  {task.duration || "30m"}
                                </span>
                                {!task.completed && (
                                  (() => {
                                    const text = getCountdownText('daily', task.date);
                                    const isOverdue = text === "Overdue";
                                    return (
                                      <span className={`text-xs font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 ${isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        <Timer className="w-3 h-3" />
                                        {text}
                                      </span>
                                    );
                                  })()
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                          <div className="flex -space-x-1">
                            {task.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="text-[8px] font-black text-slate-300 uppercase tracking-tighter px-2 py-1 bg-white/[0.03] rounded-md border border-white/[0.04] mr-1"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Tooltip text="Toggle details">
                              <button
                                onClick={() =>
                                  setExpandedId(
                                    expandedId === task.id ? null : task.id,
                                  )
                                }
                                className={`p-2 text-slate-300 hover:text-white transition-transform ${expandedId === task.id ? "rotate-180" : ""}`}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            {editingTaskId === task.id ? (
                              <Tooltip text="Save">
                                <button
                                  onClick={saveEditingTask}
                                  className="p-2 text-green-500 hover:text-green-400 transition-colors"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                </button>
                              </Tooltip>
                            ) : (
                              <Tooltip text="Edit task">
                                <button
                                  onClick={() => startEditingTask(task)}
                                  className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </Tooltip>
                            )}
                            {!task.completed && (
                              <Tooltip text="Send back to Weekly Goals">
                                <button
                                  onClick={() => handleDemote(task)}
                                  className="p-2 text-orange-400 hover:text-orange-300 transition-colors"
                                >
                                  <ArrowDownLeft className="w-4 h-4" />
                                </button>
                              </Tooltip>
                            )}
                            <Tooltip text="Delete task">
                              <button
                                onClick={() => { if (window.confirm("Are you sure you want to delete this task?")) deleteTask(task.id); }}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedId === task.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-6 pb-5 pt-0 border-t border-white/5 space-y-4"
                            >
                              <div className="flex items-center space-x-2 mt-4">
                                <div className="flex items-center space-x-2 flex-1">
                                  <input
                                    type="text"
                                    value={newSubtask[task.id] || ""}
                                    onChange={(e) =>
                                      setNewSubtask({
                                        ...newSubtask,
                                        [task.id]: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) =>
                                      e.key === "Enter" && handleAddSub(task.id)
                                    }
                                    placeholder="Add a step..."
                                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20"
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
                                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-xs font-black uppercase tracking-tighter text-blue-400 hover:bg-blue-600/20 transition-all disabled:opacity-50"
                                  >
                                    {isSplitting[task.id] ? (
                                      <Clock className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                    <span>
                                      {isSplitting[task.id]
                                        ? "Splitting..."
                                        : "Auto-split"}
                                    </span>
                                  </button>
                                </Tooltip>
                              </div>

                              <div className="space-y-2">
                                <RecursiveSubtaskList
                                  subtasks={task.subtasks}
                                  onToggle={(subId) => toggleTaskSubtask(task.id, subId)}
                                  onEdit={(subId, title) => updateTaskSubtask(task.id, subId, title)}
                                  onDelete={(subId) => deleteTaskSubtask(task.id, subId)}
                                  editingId={editingSubtaskId}
                                  editingTitle={editingSubtaskTitle}
                                  setEditingId={setEditingSubtaskId}
                                  setEditingTitle={setEditingSubtaskTitle}
                                  saveEdit={(subId, title) => updateTaskSubtask(task.id, subId, title)}
                                  onAddChild={(parentId, title) => addTaskChildSubtask(task.id, parentId, title)}
                                />
                                {(task.subtasks || []).length === 0 && (
                                  <p className="text-xs text-slate-300 italic">
                                    No steps yet. Break it down for more focus.
                                  </p>
                                )}
                              </div>

                              <p className="text-xs uppercase font-black text-slate-300 tracking-widest pt-4 border-t border-white/5">
                                Planned Duration:{" "}
                                {task.duration}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
              ))}
            </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Do (Urgent & Important)", priority: "A", color: "border-green-500/30 bg-green-500/5", header: "text-green-400" },
            { label: "Schedule (Not Urgent & Important)", priority: "B", color: "border-blue-500/30 bg-blue-500/5", header: "text-blue-400" },
            { label: "Delegate (Urgent & Not Important)", priority: "C", color: "border-orange-500/30 bg-orange-500/5", header: "text-orange-400" },
            { label: "Eliminate (Not Urgent & Not Important)", priority: "D", color: "border-red-500/30 bg-red-500/5", header: "text-red-400" }
          ].map((quad) => (
            <div key={quad.priority} className={`rounded-[32px] border p-6 flex flex-col space-y-4 ${quad.color}`}>
              <h3 className={`font-display font-black tracking-tight ${quad.header}`}>{quad.label}</h3>
              <div className="space-y-2 flex-1">
                {incompleteTasks.filter(t => t.priority === quad.priority).map((task) => (
                  <div key={task.id} className={`flex items-center space-x-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl ${task.completed ? "opacity-50 line-through" : ""}`}>
                    <Tooltip text={task.completed ? "Mark pending" : "Complete task"}>
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 border rounded flex-shrink-0 transition-all flex items-center justify-center ${task.completed ? "bg-blue-600 border-blue-600 text-white" : "border-white/20"}`}
                      >
                        {task.completed && <CheckSquare className="w-3 h-3" />}
                      </button>
                    </Tooltip>
                    <span className="text-sm font-medium text-white line-clamp-1 flex-1">{task.title}</span>
                    {!task.completed && (
                      <Tooltip text="Send back to Weekly Goals">
                        <button onClick={() => handleDemote(task)} className="text-slate-300 hover:text-orange-400 p-1 flex-shrink-0">
                          <ArrowDownLeft className="w-4 h-4"/>
                        </button>
                      </Tooltip>
                    )}
                  </div>
                ))}
                {incompleteTasks.filter(t => t.priority === quad.priority).length === 0 && (
                  <p className="text-xs uppercase font-black tracking-widest text-slate-300 pt-2">No goals here</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {tasks.length === 0 && (
        <div className="text-center py-24 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] px-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center mx-auto mb-6">
            <CheckSquare className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-black text-slate-300">Your Action Plan is Empty</h3>
          <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
            Every great achievement starts with a single step. Add a task above using the input field, or hit <kbd className="bg-white/10 px-2 py-1 rounded text-white text-xs mx-1 font-mono">⌘K</kbd> to quick-add. Once you add tasks, you can use the AI Prioritize button to automatically organize your day based on the Eisenhower Matrix.
          </p>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="mt-8 space-y-4">
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center space-x-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors w-full"
          >
            <div className="flex-1 h-px bg-white/5"></div>
            <span>{showCompleted ? "Hide" : "Show"} Completed Tasks ({completedTasks.length})</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </button>

          {showCompleted && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-4 min-w-0">
                    <Tooltip text="Mark pending">
                      <button onClick={() => toggleTask(task.id)} className="w-6 h-6 shrink-0 bg-blue-600/20 border-blue-500/30 text-blue-400 rounded-lg flex items-center justify-center transition-all hover:bg-blue-600 hover:text-white">
                        <CheckSquare className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    <span className="text-sm font-medium text-slate-300 line-through truncate">{task.title}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 pl-4">
                    <span className="text-xs font-black uppercase bg-white/5 px-2 py-1 rounded-md text-slate-300">{task.priority}</span>
                    <button onClick={() => { if (window.confirm('Are you sure you want to delete this task?')) deleteTask(task.id); }} className="text-slate-300 hover:text-red-400 p-1">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

const InsightsView = () => {
  const {
    goals,
    tasks,
    habits,
    selectedMood,
    setSelectedMood,
    reflections,
    addReflection,
    focusSessions,
  } = useHub();
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflection, setReflection] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleGetDeepAnalysis = async () => {
    setIsAnalyzing(true);
    const data = {
      goals: goals.map((g) => ({
        title: g.title,
        completed: g.completed,
        type: g.type,
      })),
      tasks: tasks.map((t) => ({
        title: t.title,
        completed: t.completed,
        priority: t.priority,
      })),
      focusSessions: focusSessions.map((s) => ({
        duration: s.duration,
        type: s.type,
        date: s.date,
      })),
    };
    const res = await getDeepAnalysis(data);
    setDeepAnalysis(res);
    setIsAnalyzing(false);
  };

  const handleSave = () => {
    if (reflection.trim()) {
      addReflection(reflection.trim());
      setReflection("");
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsReflecting(false);
      }, 1500);
    }
  };

  const completedGoals = goals.filter((g) => g.completed).length;
  const taskCompletionRate =
    tasks.length === 0
      ? 0
      : Math.round(
          (tasks.filter((t) => t.completed).length / tasks.length) * 100,
        );

  const totalFocusMinutes = focusSessions
    .filter(
      (s) =>
        s.type === "work" &&
        s.date.includes(toLocalDateStr()),
    )
    .reduce((acc, s) => acc + s.duration, 0);

  const focusHours = Math.floor(totalFocusMinutes / 60);
  const focusMins = totalFocusMinutes % 60;

  const todayDateStr = toLocalDateStr();
  const todayTasks = tasks.filter(
    (t) => t.date === todayDateStr || (t.date < todayDateStr && !t.completed),
  );
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const deepWorkHours = +(totalFocusMinutes / 60).toFixed(1);
  const urgentComplete = todayTasks.filter(t => t.completed && (t.priority === "A" || t.priority === "B")).length;
  const maintenanceComplete = todayTasks.filter(t => t.completed && (t.priority === "C" || t.priority === "D")).length;

  const priorityData = [
    { name: "A: Urgent & Important", value: tasks.filter((t) => t.priority === "A").length, color: "#22c55e" },
    { name: "B: Schedule", value: tasks.filter((t) => t.priority === "B").length, color: "#3b82f6" },
    { name: "C: Delegate", value: tasks.filter((t) => t.priority === "C").length, color: "#f97316" },
    { name: "D: Eliminate", value: tasks.filter((t) => t.priority === "D").length, color: "#ef4444" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-indigo-500">
          <Zap className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-[0.4em] font-mono opacity-60">
            Intelligence Layer
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white">
          Quantum.
        </h2>
        <p className="text-slate-300 font-medium">
          Deconstruct your behavioral data. Identify growth vectors.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            label: "GOAL PROGRESS",
            value: completedGoals.toString(),
            max: goals.length.toString(),
            icon: Target,
            accent: "text-blue-500",
            desc: "The ratio of completed goals versus total goals set.",
          },
          {
            label: "EXECUTION FLOW",
            value: `${taskCompletionRate}%`,
            max: `${tasks.length} OPS`,
            icon: CheckSquare,
            accent: "text-emerald-500",
            desc: "The percentage of all available tasks that have been completed.",
          },
          {
            label: "OP VELOCITY",
            value: `${completedToday}/${todayTasks.length}`,
            max: "TODAY",
            icon: Zap,
            accent: "text-orange-500",
            desc: "Proportion of today's scheduled tasks that have been completed.",
          },
          {
            label: "DEEP WORK",
            value: `${focusHours}H ${focusMins}M`,
            max: "TRACKED",
            icon: Timer,
            accent: "text-blue-500",
            desc: "Total duration accumulated in focus sessions today.",
          },
          {
            label: "HABIT LOOP",
            value: habits.length.toString(),
            max: "CIRCUITS",
            icon: Flame,
            accent: "text-rose-500",
            desc: "The total number of active habits configured in your system.",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="glass-card p-1 !rounded-[32px] overflow-visible group"
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div
                  className={`p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-hover:scale-110 transition-transform ${stat.accent}`}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <Tooltip text={stat.desc}>
                    <p className="text-xs w-max ml-auto font-black cursor-help text-slate-300 tracking-widest uppercase mb-1 border-b border-dashed border-slate-500/50 pb-0.5 inline-block">
                      {stat.label}
                    </p>
                  </Tooltip>
                  <p className="text-xs font-bold text-slate-300 uppercase tabular-nums">
                    / {stat.max}
                  </p>
                </div>
              </div>
              <p className="text-5xl font-display font-black text-white tracking-tighter">
                {stat.value}
              </p>
            </div>
            <div className="h-1 w-full bg-white/[0.02]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, delay: i * 0.2 }}
                className={`h-full opacity-30 ${stat.accent.replace("text-", "bg-")}`}
              />
            </div>
          </div>
        ))}
        {/* 3/3/3 Method Tracker */}
        <div className="glass-card p-1 !rounded-[32px] overflow-visible group lg:col-span-1">
          <div className="p-8 h-full flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-indigo-400 mb-6">
              <PieChart className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-[0.3em] font-mono">3/3/3 Method Tracker</span>
              <div className="relative group/tooltip z-50 hover:z-[100]">
                <Info className="w-3 h-3 text-indigo-400/50 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 bg-slate-700 text-xs text-slate-300 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                  Oliver Burkeman's daily framework: Aim for 3 hours of deep work, 3 urgent/important tasks, and 3 maintenance tasks to cap a productive day without burning out.
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-800"></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { label: "Hours Deep Work", value: deepWorkHours, target: 3 },
                { label: "Urgent Tasks", value: urgentComplete, target: 3 },
                { label: "Maintenance Tasks", value: maintenanceComplete, target: 3 }
              ].map((metric, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs uppercase font-black tracking-widest">
                    <span className="text-slate-300">{metric.label}</span>
                    <span className="text-indigo-400">{metric.value} <span className="text-slate-300">/ {metric.target}</span></span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (metric.value / metric.target) * 100)}%` }}
                      className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-white/5">
        <div className="space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-black text-rose-500 uppercase tracking-[0.4em] font-mono">
              Real-time Telemetry
            </span>
            <h3 className="text-3xl font-display font-black text-white">
              System Resource Allocation.
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              {
                label: "Goals Active",
                desc: "Total number of ongoing goals",
                value: goals.filter((g) => !g.completed).length,
                total: goals.length,
                color: "bg-blue-500",
              },
              {
                label: "Tactical Ops",
                desc: "Pending tasks required for progress",
                value: tasks.filter((t) => !t.completed).length,
                total: tasks.length,
                color: "bg-indigo-500",
              },
              {
                label: "Habitual Circuits",
                desc: "Automated routines tracked",
                value: habits.length,
                total: habits.length,
                color: "bg-rose-500",
              },
            ].map((stat, i) => (
              <GlassCard key={i} className="p-6 !rounded-[28px] relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-widest">{stat.label}</p>
                      <p className="text-xs font-bold text-slate-300 tracking-widest mt-1 uppercase">{stat.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">{stat.value}</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.total === 0 ? 0 : (stat.value / stat.total) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${stat.color}`}
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] font-mono">
              Qualitative Analysis
            </span>
            <h3 className="text-3xl font-display font-black text-white">
              Daily Reflection.
            </h3>
          </div>

          {isReflecting ? (
            <GlassCard className="p-6 md:p-8 !rounded-[40px] space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <p className="text-xl font-display font-black text-white">
                  Identify your primary victory.
                </p>
                <p className="text-xs font-medium text-slate-300">
                  Documenting success reinforces neural pathways associated with
                  achievement.
                </p>
              </div>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="The goal success coordinates were..."
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-[30px] p-8 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[220px] font-medium leading-loose"
              />
              <div className="flex justify-end items-center space-x-6">
                {showSuccess && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-emerald-500 font-black text-xs uppercase tracking-widest"
                  >
                    Sync Complete
                  </motion.span>
                )}
                <Tooltip text="Cancel reflection">
                  <button
                    onClick={() => setIsReflecting(false)}
                    className="text-xs font-black text-slate-300 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    Abort
                  </button>
                </Tooltip>
                <Tooltip text="Save your daily reflection">
                  <button
                    onClick={handleSave}
                    disabled={showSuccess || !reflection.trim()}
                    className={`bg-white text-black font-black text-xs uppercase tracking-widest px-10 py-4 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-20`}
                  >
                    Archive Win
                  </button>
                </Tooltip>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-6">
              <GlassCard
                onClick={() => setIsReflecting(true)}
                className="p-10 !rounded-[40px] border-dashed border-white/10 hover:border-blue-500/30 group transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                  <Edit3 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">
                    Session Closure Pending
                  </p>
                  <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                    Commence Daily Debrief
                  </p>
                </div>
              </GlassCard>

              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                {[...reflections]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((ref) => (
                  <GlassCard
                    key={ref.id}
                    className="p-8 !rounded-[32px] group relative overflow-hidden hover:border-white/20 transition-all"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-black text-slate-200 uppercase tracking-widest">
                          {new Date(ref.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-lg font-medium text-slate-300 leading-relaxed mb-6 italic">
                      "{ref.text}"
                    </p>
                    {ref.aiInsight && (
                      <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/10 flex items-start space-x-4">
                        <Sparkles className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                        <p className="text-xs text-blue-300/80 font-bold leading-relaxed">
                          {ref.aiInsight}
                        </p>
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
  const { habits, addHabit, updateHabit, toggleHabit, deleteHabit, addTask, tasks, reorderHabits } = useHub();
  const [newTitle, setNewTitle] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const today = toLocalDateStr();
  
  const displayHabits = [...habits].sort((a,b) => (a.order || 0) - (b.order || 0));



  const [taskCreatedId, setTaskCreatedId] = useState<string | null>(null);

  const handleMakeTask = (habit: any) => {
    const alreadyExists = tasks.some(t => (t.linkedHabitId === habit.id || t.title.toLowerCase() === habit.title.toLowerCase()) && t.date === today);
    if (!alreadyExists) {
      addTask({
        title: habit.title,
        priority: 'B',
        date: today,
        subtasks: [],
        linkedHabitId: habit.id
      });
    }
    setTaskCreatedId(habit.id);
    setTimeout(() => setTaskCreatedId(null), 2000);
  };

  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitData, setEditingHabitData] = useState<{ 
    title: string; 
    frequency: string; 
    notificationEnabled: boolean; 
    notificationTime: string;
    notificationSchedule: 'once' | 'daily' | 'weekly' | 'specific_days';
    notificationDays: number[];
    notificationDate: string;
  }>({ 
    title: "", 
    frequency: "daily", 
    notificationEnabled: false, 
    notificationTime: "09:00",
    notificationSchedule: 'daily',
    notificationDays: [1, 2, 3, 4, 5],
    notificationDate: ""
  });

  const startEditingHabit = (habit: any) => {
    setEditingHabitId(habit.id);
    setEditingHabitData({ 
      title: habit.title, 
      frequency: habit.frequency || "daily", 
      notificationEnabled: habit.notificationEnabled || false, 
      notificationTime: habit.notificationTime || "09:00",
      notificationSchedule: habit.notificationSchedule || 'daily',
      notificationDays: habit.notificationDays || [1, 2, 3, 4, 5],
      notificationDate: habit.notificationDate || ""
    });
  };

  const saveEditingHabit = () => {
    if (editingHabitId) {
      updateHabit(editingHabitId, editingHabitData);
      setEditingHabitId(null);
    }
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addHabit(newTitle);
    setNewTitle("");
  };

  const getWeekDays = () => {
    const days = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 7 * weekOffset);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        date: toLocalDateStr(d),
        fullDate: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
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
            <span className="text-xs font-black uppercase tracking-[0.4em] font-mono opacity-60">
              Consistency Layer
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white">
            Habits.
          </h2>
          <p className="text-slate-300 font-medium">
            Build unbreakable streaks. Calibrate your daily systems.
          </p>
        </div>

        <div className="flex bg-white/[0.03] border border-white/10 rounded-3xl p-1 items-center">
          <Tooltip text="View older weeks">
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-3 text-slate-300 hover:text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Tooltip>
          <span className="px-6 text-xs font-black text-slate-200 uppercase tracking-widest min-w-[120px] text-center">
            {weekOffset === 0 ? "Active Now" : `${weekOffset}W AGO`}
          </span>
          <Tooltip text="View newer weeks">
            <button
              disabled={weekOffset === 0}
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-3 text-slate-300 hover:text-white transition-all disabled:opacity-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      <GlassCard className="p-1 max-w-4xl mx-auto !rounded-[40px] overflow-hidden group focus-within:border-blue-500/30 transition-all shadow-2xl">
        <div className="p-4 sm:p-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Plus className="w-8 h-8 text-blue-500" />
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Initialize new behavioral routine..."
            className="flex-1 w-full sm:w-auto text-center sm:text-left bg-transparent border-none focus:ring-0 text-white text-xl sm:text-2xl placeholder:text-slate-300 font-display font-black"
          />
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto bg-white text-black font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            Engage Habit
          </button>
        </div>
      </GlassCard>

            <div className="grid grid-cols-1 gap-4">
              {displayHabits.map((habit, index) => (
                <div key={habit.id} className="relative">
                  <div className="absolute top-4 -left-4 xl:-left-6 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <button onClick={() => reorderHabits(habit.id, 'up')} className="p-1 text-slate-300 hover:text-white bg-[#050505] rounded-lg border border-white/10 hover:border-white/30 backdrop-blur-md transition-all shadow-xl">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => reorderHabits(habit.id, 'down')} className="p-1 text-slate-300 hover:text-white bg-[#050505] rounded-lg border border-white/10 hover:border-white/30 backdrop-blur-md transition-all shadow-xl">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                    <GlassCard className="p-8 !rounded-[32px] group">
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    {editingHabitId === habit.id ? (
                      <div className="space-y-2 relative z-10 w-full sm:w-64">
                        <input
                          type="text"
                          value={editingHabitData.title}
                          onChange={(e) => setEditingHabitData({ ...editingHabitData, title: e.target.value })}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white font-black tracking-tight"
                          placeholder="Habit Title"
                          autoFocus
                        />
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={editingHabitData.frequency}
                            onChange={(e) => setEditingHabitData({ ...editingHabitData, frequency: e.target.value })}
                            className="bg-white/5 border border-white/20 rounded-xl px-2 py-2 text-white text-xs uppercase flex-1"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                        <NotificationEditor
                          enabled={editingHabitData.notificationEnabled}
                          setEnabled={(b) => setEditingHabitData({ ...editingHabitData, notificationEnabled: b })}
                          time={editingHabitData.notificationTime}
                          setTime={(t) => setEditingHabitData({ ...editingHabitData, notificationTime: t })}
                          schedule={editingHabitData.notificationSchedule}
                          setSchedule={(s) => setEditingHabitData({ ...editingHabitData, notificationSchedule: s })}
                          days={editingHabitData.notificationDays}
                          setDays={(d) => setEditingHabitData({ ...editingHabitData, notificationDays: d })}
                          date={editingHabitData.notificationDate}
                          setDate={(d) => setEditingHabitData({ ...editingHabitData, notificationDate: d })}
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="text-2xl font-display font-black text-white">
                          {habit.title}
                        </h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs font-black text-rose-500 uppercase tracking-widest font-mono flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-rose-500" />
                            STREAK: {(() => {
                              const history = habit.completedHistory || {};
                              let currentStreak = 0;
                              let d = new Date();
                              const todayStr = toLocalDateStr(d);
                              if (history[todayStr]) { currentStreak++; }
                              d.setDate(d.getDate() - 1);
                              while (true) {
                                const dateStr = toLocalDateStr(d);
                                if (history[dateStr]) {
                                  currentStreak++;
                                  d.setDate(d.getDate() - 1);
                                } else {
                                  break;
                                }
                              }
                              return currentStreak;
                            })()} DAYS
                          </span>
                          <div className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
                            Success Rate: {Math.round(
                                (() => {
                                  const history = habit.completedHistory || {};
                                  const completedDays = Object.values(history).filter(Boolean).length;
                                  const dates = Object.keys(history).sort();
                                  if (dates.length === 0) return 0;
                                  const firstDate = new Date(dates[0]);
                                  const today = new Date();
                                  today.setHours(0,0,0,0);
                                  firstDate.setHours(0,0,0,0);
                                  const allDaysLogged = Math.max(1, Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                  return (completedDays / allDaysLogged) * 100;
                                })()
                            )}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-between xl:justify-end gap-2 overflow-x-auto no-scrollbar pb-2 xl:pb-0">
                {weekDays.map((day) => {
                  const isCompleted = habit.completedHistory[day.date];
                  const today = toLocalDateStr();
                  const isToday = today === day.date;
                  const isPast = day.date < today;

                  return (
                    <div
                      key={day.date}
                      className="flex flex-col items-center space-y-3 min-w-[64px]"
                    >
                      <span className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">
                        {day.label}
                      </span>
                      <Tooltip text={isCompleted ? "Mark missed" : "Mark completed"}>
                        <button
                          onClick={() => toggleHabit(habit.id, day.date)}
                          className={`w-14 h-14 rounded-2xl transition-all border flex items-center justify-center relative ${
                            isCompleted
                              ? "bg-blue-600 border-blue-500 shadow-lg"
                              : isPast
                                ? "bg-red-500/10 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/20"
                                : "bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckSquare className="w-6 h-6 text-white" />
                          ) : (
                            isPast && <CloseIcon className={`w-6 h-6 text-red-500/50`} />
                          )}
                          {isToday && !isCompleted && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-bounce" />
                          )}
                        </button>
                      </Tooltip>
                      <span className="text-xs font-bold text-slate-300 uppercase">
                        {day.fullDate}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 xl:ml-8 border-l border-white/5 pl-8">
                {(() => {
                  const alreadyExists = tasks.some(t => (t.linkedHabitId === habit.id || t.title.toLowerCase() === habit.title.toLowerCase()) && t.date === today);
                  if (taskCreatedId === habit.id || alreadyExists) {
                    return (
                      <Tooltip text="Task Created">
                        <button className="p-3 text-green-500 bg-green-500/10 rounded-xl transition-all cursor-default">
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      </Tooltip>
                    );
                  }
                  return (
                    <Tooltip text="Make Today's Task">
                      <button
                        onClick={() => handleMakeTask(habit)}
                        className="p-3 text-slate-300 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </Tooltip>
                  );
                })()}
                {editingHabitId === habit.id ? (
                  <Tooltip text="Save">
                    <button
                      onClick={saveEditingHabit}
                      className="p-3 text-green-500 hover:text-green-400 transition-colors"
                    >
                      <CheckSquare className="w-5 h-5" />
                    </button>
                  </Tooltip>
                ) : (
                  <Tooltip text="Edit habit">
                    <button
                      onClick={() => startEditingHabit(habit)}
                      className="p-3 text-slate-300 hover:text-blue-500 transition-all"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </Tooltip>
                )}
                <Tooltip text="Delete habit">
                  <button
                    onClick={() => { if (window.confirm('Are you sure you want to delete this habit?')) deleteHabit(habit.id); }}
                    className="p-3 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </GlassCard>
        </div>
      ))}
    </div>
        {habits.length === 0 && (
          <div className="text-center py-24 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] px-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center mx-auto mb-6">
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-black text-slate-300">Design Your Daily Protocol</h3>
            <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
              Habits are the foundation of consistency. Whether you want to "Meditate for 10m" or "Read 10 pages", establish the building blocks of your routine here. Add a new habit above to start tracking your daily streaks and consistency.
            </p>
          </div>
        )}
    </div>
  );
};

const TrojanChat = () => {
  const { tasks, goals, habits, addHabit, updateGoal, updateTask, updateHabit, addTask, addTaskSubtask, addGoal, addSubtask, toggleTask, deleteTask, toggleGoal, deleteGoal, bulkAddTaskSubtasks, bulkAddGoalSubtasks, updateTaskSubtask, deleteTaskSubtask, updateGoalSubtask, deleteSubtask } = useHub();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "model"; parts: { text: string }[] }[]>([
    { role: "model", parts: [{ text: "Trojan AI initialized.\n\nI recommend Oliver Burkeman's daily framework: Aim for 3 hours of deep work, 3 urgent/important tasks, and 3 maintenance tasks to cap a productive day without burning out.\n\nWhat are your top 3 tasks for today?" }] }
  ]);
  const [input, setInput] = useState("");
  const [chatTaskPriority, setChatTaskPriority] = useState<"A"|"B"|"C"|"D">("A");
  const [loading, setLoading] = useState(false);
  const [quotaWaitTime, setQuotaWaitTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quotaWaitTime > 0) {
      timer = setInterval(() => {
        setQuotaWaitTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quotaWaitTime]);

  useEffect(() => {
    if (isOpen) {
      // scroll to bottom after a microtask so rendering finishes
      setTimeout(scrollToBottom, 50);
    }
  }, [messages, isOpen]);

  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    const textToSendVisible = typeof textOverride === 'string' ? textOverride.trim() : input.trim();
    if (!textToSendVisible || loading || quotaWaitTime > 0) return;
    const userMsg = { role: "user" as const, parts: [{ text: textToSendVisible }] };
    setMessages(prev => [...prev, userMsg]);
    if (typeof textOverride !== 'string') {
      setInput("");
    }
    setLoading(true);

    const history = messages.slice(-10); // Limit history for performance but keep enough for context

    const textToSendLLM = textToSendVisible + `\n\n[System Info: User's chosen priority from UI dropdown is ${chatTaskPriority}]`;

    const response = await getTrojanChatResponse(textToSendLLM, history, tasks, goals, habits);

    if (response?.isQuotaError) {
      setQuotaWaitTime(60);
      setMessages(prev => [...prev, { role: "model", parts: [{ text: response.text }] }]);
    } else if (response?.functionCalls) {
      let functionResponses = [];
      const convertSubtasks = (stArray: any[]): any[] => {
          return stArray.map((st: any) => {
             if (typeof st === 'string') {
                 return { id: Math.random().toString(36).substr(2, 9), title: st, completed: false };
             } else if (typeof st === 'object' && st !== null) {
                 const res: any = {
                     id: Math.random().toString(36).substr(2, 9),
                     title: st.title || 'Subtask',
                     completed: false
                 };
                 if (st.subtasks && Array.isArray(st.subtasks)) {
                     res.subtasks = convertSubtasks(st.subtasks);
                 }
                 return res;
             }
             return { id: Math.random().toString(36).substr(2, 9), title: 'Subtask', completed: false };
          });
      };
      
      for (const call of response.functionCalls) {
        if (call.name === "createTask") {
          let { title, priority, subtasks } = call.args;
          const today = toLocalDateStr();
          
          if (!title || typeof title !== 'string') title = 'Untitled Task';
          if (!['A', 'B', 'C', 'D'].includes(priority)) {
            if (String(priority).toUpperCase().startsWith('A')) priority = 'A';
            else if (String(priority).toUpperCase().startsWith('B')) priority = 'B';
            else if (String(priority).toUpperCase().startsWith('C')) priority = 'C';
            else if (String(priority).toUpperCase().startsWith('D')) priority = 'D';
            else priority = 'C'; // default
          }
          
          let initialSubtasks: any[] = [];
          if (subtasks && Array.isArray(subtasks)) {
             initialSubtasks = convertSubtasks(subtasks);
          }
          const newTaskId = await addTask({ title, priority, subtasks: initialSubtasks, date: today });
          functionResponses.push(`Created task: ${title}` + (initialSubtasks.length ? ` with ${initialSubtasks.length} subtasks` : ''));
        } else if (call.name === "createGoal") {
          let { title, type, priority, subtasks } = call.args;
          
          if (!title || typeof title !== 'string') title = 'Untitled Goal';
          if (!['yearly', 'monthly', 'weekly'].includes(type)) {
            type = 'monthly';
          }
          if (!['A', 'B', 'C', 'D'].includes(priority)) {
            if (String(priority).toUpperCase().startsWith('A')) priority = 'A';
            else if (String(priority).toUpperCase().startsWith('B')) priority = 'B';
            else if (String(priority).toUpperCase().startsWith('C')) priority = 'C';
            else if (String(priority).toUpperCase().startsWith('D')) priority = 'D';
            else priority = 'C'; // default
          }
          let initialSubtasks: any[] = [];
          if (subtasks && Array.isArray(subtasks)) {
             initialSubtasks = convertSubtasks(subtasks);
          }
          const newGoalId = await addGoal({ title, type, priority, completed: false, subtasks: initialSubtasks });
          functionResponses.push(`Created ${type} goal: ${title}` + (initialSubtasks.length ? ` with ${initialSubtasks.length} subtasks` : ''));
        } else if (call.name === "createHabit") {
          let { title, frequency } = call.args;
          if (!title || typeof title !== 'string') title = 'Untitled Habit';
          if (!frequency || typeof frequency !== 'string') frequency = 'daily';
          await addHabit(title, frequency);
          functionResponses.push(`Created habit: ${title} (${frequency})`);
        } else if (call.name === "updateTask") {
          let { id, title, priority, subtasks } = call.args;
          if (id) {
            const updates: any = {};
            if (title) updates.title = title;
            if (priority) updates.priority = priority;
            updateTask(id, updates);
            
            if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
              bulkAddTaskSubtasks(id, convertSubtasks(subtasks));
              functionResponses.push(`Updated task id: ${id} and added ${subtasks.length} subtasks`);
            } else {
              functionResponses.push(`Updated task id: ${id}`);
            }
          }
        } else if (call.name === "updateGoal") {
          let { id, title, priority, type, subtasks } = call.args;
          if (id) {
            const updates: any = {};
            if (title) updates.title = title;
            if (priority) updates.priority = priority;
            if (type) updates.type = type;
            updateGoal(id, updates);
            
            if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
              bulkAddGoalSubtasks(id, convertSubtasks(subtasks));
              functionResponses.push(`Updated goal id: ${id} and added ${subtasks.length} subtasks`);
            } else {
              functionResponses.push(`Updated goal id: ${id}`);
            }
          }
        } else if (call.name === "updateTaskSubtask") {
          let { taskId, subtaskId, title } = call.args;
          if (taskId && subtaskId && title) {
            updateTaskSubtask(taskId, subtaskId, title);
            functionResponses.push(`Updated task subtask: ${subtaskId} to ${title}`);
          }
        } else if (call.name === "deleteTaskSubtask") {
          let { taskId, subtaskId } = call.args;
          if (taskId && subtaskId) {
            deleteTaskSubtask(taskId, subtaskId);
            functionResponses.push(`Deleted task subtask: ${subtaskId}`);
          }
        } else if (call.name === "updateGoalSubtask") {
          let { goalId, subtaskId, title } = call.args;
          if (goalId && subtaskId && title) {
            updateGoalSubtask(goalId, subtaskId, title);
            functionResponses.push(`Updated goal subtask: ${subtaskId} to ${title}`);
          }
        } else if (call.name === "deleteGoalSubtask") {
          let { goalId, subtaskId } = call.args;
          if (goalId && subtaskId) {
            deleteSubtask(goalId, subtaskId);
            functionResponses.push(`Deleted goal subtask: ${subtaskId}`);
          }
        } else if (call.name === "updateHabit") {
          let { id, title, frequency } = call.args;
          if (id) {
            const updates: any = {};
            if (title) updates.title = title;
            if (frequency) updates.frequency = frequency;
            updateHabit(id, updates);
            functionResponses.push(`Updated habit id: ${id}`);
          }
        } else if (call.name === "toggleTask") {
          let { id } = call.args;
          if (id) {
            toggleTask(id);
            functionResponses.push(`Toggled task status for id: ${id}`);
          }
        } else if (call.name === "deleteTask") {
          let { id } = call.args;
          if (id) {
            deleteTask(id);
            functionResponses.push(`Deleted task id: ${id}`);
          }
        } else if (call.name === "toggleGoal") {
          let { id } = call.args;
          if (id) {
            toggleGoal(id);
            functionResponses.push(`Toggled goal status for id: ${id}`);
          }
        } else if (call.name === "deleteGoal") {
          let { id } = call.args;
          if (id) {
            deleteGoal(id);
            functionResponses.push(`Deleted goal id: ${id}`);
          }
        }
      }

      setMessages(prev => [...prev, { role: "model", parts: [{ text: `Executed actions:\n${functionResponses.join('\n')}` }] }]);
    } else if (response?.text) {
      setMessages(prev => [...prev, { role: "model", parts: [{ text: response.text }] }]);
    } else {
      setMessages(prev => [...prev, { role: "model", parts: [{ text: "No response from command." }] }]);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[200]">
        <Tooltip text="Talk to Trojan AI">
          <button
            onClick={() => setIsOpen(true)}
            className={`w-14 h-14 rounded-full bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white ${isOpen ? 'opacity-0 pointer-events-none scale-50' : 'opacity-100 scale-100'}`}
          >
            <Bot className="w-6 h-6" />
          </button>
        </Tooltip>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[500px] glass-card p-0 overflow-hidden flex flex-col shadow-[0_0_50px_rgba(37,99,235,0.2)] pointer-events-auto"
              style={{ maxHeight: "calc(100vh - 80px)", height: "600px" }}
            >
              <div className="p-4 bg-[#111116] border-b border-white/10 flex flex-shrink-0 items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Trojan AI</h3>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-500 tracking-wider">ONLINE</span>
                  </div>
                </div>
              </div>
              <Tooltip text="Close Chat">
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-300 hover:text-white transition-colors">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm flex flex-col space-y-2 ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[#1a1a24] border border-white/10 text-slate-300 rounded-bl-sm shadow-xl'}`}>
                    <div className="prose prose-invert prose-sm max-w-none leading-relaxed whitespace-pre-wrap">
                      {m.parts.map(p => p.text).join('\n')}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl p-3 text-sm bg-white/5 border border-white/10 text-slate-300 rounded-bl-sm flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20 flex-shrink-0">
              <div className="flex overflow-x-auto gap-2 mb-3 pb-1 hide-scrollbar">
                <button
                  onClick={() => handleSend("Let's do the Morning AI journal. Ask me 3 questions to set my intention for today.")}
                  className="flex-none bg-orange-600/20 text-orange-300 text-xs sm:text-xs px-3 py-1.5 rounded-full hover:bg-orange-600/40 transition-colors whitespace-nowrap"
                >
                  🌅 Morning Journal
                </button>
                <button
                  onClick={() => handleSend("What should I do today based on priority?")}
                  className="flex-none bg-blue-600/20 text-blue-300 text-xs sm:text-xs px-3 py-1.5 rounded-full hover:bg-blue-600/40 transition-colors whitespace-nowrap"
                >
                  ☀️ Daily Plan
                </button>
                <button
                  onClick={() => handleSend("Analyze my progress and tell me what to improve")}
                  className="flex-none bg-emerald-600/20 text-emerald-300 text-xs sm:text-xs px-3 py-1.5 rounded-full hover:bg-emerald-600/40 transition-colors whitespace-nowrap"
                >
                  📊 Analyze Progress
                </button>
                <button
                  onClick={() => setInput("Suggest some habits I should form ")}
                  className="flex-none bg-purple-600/20 text-purple-300 text-xs sm:text-xs px-3 py-1.5 rounded-full hover:bg-purple-600/40 transition-colors whitespace-nowrap"
                >
                  💡 Suggest Habits
                </button>
                <button
                  onClick={() => setInput("Create a task to ")}
                  className="flex-none bg-orange-600/20 text-orange-300 text-xs sm:text-xs px-3 py-1.5 rounded-full hover:bg-orange-600/40 transition-colors whitespace-nowrap"
                >
                  ➕ Add Task
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={chatTaskPriority}
                  onChange={(e) => setChatTaskPriority(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-full h-10 px-3 text-xs font-black uppercase text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                  style={{ appearance: 'none', WebkitAppearance: 'none' }}
                >
                  <option value="A">Pri A</option>
                  <option value="B">Pri B</option>
                  <option value="C">Pri C</option>
                  <option value="D">Pri D</option>
                </select>
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={quotaWaitTime > 0 ? `Uplink blocked. Resuming in ${quotaWaitTime}s...` : "Command Trojan..."}
                    className={`w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:border-blue-500/50 ${quotaWaitTime > 0 ? 'opacity-50' : ''}`}
                    disabled={loading || quotaWaitTime > 0}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || quotaWaitTime > 0}
                  className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white disabled:opacity-50 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                  <Send className="w-4 h-4 translate-x-[1px]" />
                </button>
              </div>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const shouldNotifyToday = (
  schedule: string | undefined,
  days: number[] | undefined,
  itemDate: string | undefined,
  now: Date
) => {
  if (!schedule || schedule === 'daily') return true;

  if (schedule === 'once') {
    const todayStr = toLocalDateStr(now);
    if (itemDate && itemDate !== todayStr) return false;
  }

  if (schedule === 'weekly') {
    if (now.getDay() !== 1) return false;
  }

  if (schedule === 'specific_days') {
    if (days && days.length > 0) {
      if (!days.includes(now.getDay())) return false;
    }
  }

  return true;
};

const NotificationEngine = () => {
  const { goals, habits, tasks } = useHub();
  const notifiedSet = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = toLocalDateStr(now);

      goals.forEach(goal => {
        if (goal.notificationEnabled && goal.notificationTime === currentTimeStr && !goal.completed) {
          if (!shouldNotifyToday(goal.notificationSchedule, goal.notificationDays, goal.notificationDate, now)) return;

          const key = `goal-${goal.id}-${todayStr}-${currentTimeStr}`;
          if (!notifiedSet.current.has(key)) {
            new Notification("🎯 Target Locked", { body: `Time to execute on your goal: ${goal.title}` });
            notifiedSet.current.add(key);
          }
        }
      });

      habits.forEach(habit => {
        if (habit.notificationEnabled && habit.notificationTime === currentTimeStr) {
           if (!shouldNotifyToday(habit.notificationSchedule, habit.notificationDays, habit.notificationDate, now)) return;

           const history = habit.completedHistory || {};
           if (!history[todayStr]) {
            const key = `habit-${habit.id}-${todayStr}-${currentTimeStr}`;
            if (!notifiedSet.current.has(key)) {
              new Notification("⚡ Momentum Check", { body: `Keep your streak alive. Time for: ${habit.title}` });
              notifiedSet.current.add(key);
            }
           }
        }
      });

      tasks.forEach(task => {
        if (task.notificationEnabled && task.notificationTime === currentTimeStr && !task.completed) {
          if (!shouldNotifyToday(task.notificationSchedule, task.notificationDays, task.notificationDate || task.date, now)) return;
          
          const key = `task-${task.id}-${todayStr}-${currentTimeStr}`;
          if (!notifiedSet.current.has(key)) {
             new Notification("📋 Task Pending", { body: `Time to execute: ${task.title}` });
             notifiedSet.current.add(key);
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [goals, habits, tasks]);

  return null;
};

const AutomationEngine = () => {
  const { automations, updateAutomation, addGoal, addTask, goals, updateGoal } = useHub();
  
  useEffect(() => {
    if (!automations || automations.length === 0 || goals.length === 0) return;
    
    // Check automations when engine mounts, and then every 30 minutes
    const checkAutomations = () => {
      automations.forEach(auto => {
        if (!auto.isActive) return;
        
        const now = new Date();
        let shouldRun = false;
        const lastRun = new Date(auto.lastRunTimestamp || 0);
        
        if (auto.frequency === 'daily') {
          if (now.getDate() !== lastRun.getDate() || now.getTime() - lastRun.getTime() > 24*60*60*1000) {
            shouldRun = true;
          }
        } else if (auto.frequency === 'weekly') {
          const today = now.getDay();
          // if today is the day of week and it hasn't run today
          if (today === auto.dayOfWeek && now.getDate() !== lastRun.getDate()) {
             // Also ensure it didn't run recently in the last few days if we are strictly weekly
             // But checking date difference is simpler: it should not have run in the last 2 days at least? 
             // simplest: if today is right, and date !== lastRun.getDate(), we run it.
             shouldRun = true;
          }
        } else if (auto.frequency === 'monthly') {
          if (now.getDate() === auto.dayOfMonth && now.getMonth() !== lastRun.getMonth()) {
             shouldRun = true;
          }
        }
        
        if (shouldRun) {
           const src = goals.find(g => g.id === auto.sourceGoalId);
           if (src && src.subtasks && src.subtasks.length > 0) {
              const num = auto.itemsToMove || 1;
              const toMove = src.subtasks.filter(s => !s.completed).slice(0, num);
              if (toMove.length === 0) return;
              
              const remaining = src.subtasks.filter(s => !toMove.includes(s));
              updateGoal(src.id, { subtasks: remaining });
              
              toMove.forEach(sub => {
                 if (auto.targetType === 'weekly_goal') {
                     addGoal({
                        title: sub.title,
                        type: 'weekly',
                        priority: 'B',
                        completed: false,
                        fromGoalId: src.id,
                        fromSubtaskId: sub.id
                     });
                 } else {
                     addTask({
                        title: sub.title,
                        date: new Date().toISOString().split('T')[0],
                        priority: 'B',
                        fromGoalId: src.id,
                        fromSubtaskId: sub.id,
                        tags: ['#auto']
                     });
                 }
              });
              
              updateAutomation(auto.id, { lastRunTimestamp: Date.now() });
           }
        }
      });
    };
    
    checkAutomations(); // Initial check
    const interval = setInterval(checkAutomations, 30 * 60 * 1000); // 30 mins
    
    return () => clearInterval(interval);
  }, [automations, goals]); // Reacts if automations update

  return null;
};

export default function App() {
  const [activeView, setActiveView] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  return (
    <HubProvider>
      <NotificationEngine />
      <AutomationEngine />
      <AppContent
        activeView={activeView}
        setActiveView={setActiveView}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isZenMode={isZenMode}
        setIsZenMode={setIsZenMode}
      />
      {!isZenMode && <TrojanChat />}
    </HubProvider>
  );
}

const AppContent = ({
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen,
  isZenMode,
  setIsZenMode,
}: any) => {
  const {
    user,
    signIn,
    signOut,
    focusTaskId,
    setFocusTaskId,
    selectedMood,
    setSelectedMood,
  } = useHub();
  const themeClasses = getMoodTheme(selectedMood);

  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setIsHeaderHidden(true);
    } else {
      setIsHeaderHidden(false);
    }
  });

  if (!user) {
    return (
      <div
        className={`min-h-screen ${getMoodTheme(selectedMood)} flex items-center justify-center p-6 selection:bg-blue-500/30 selection:text-white relative overflow-hidden`}
      >
        <div className="mesh-bg" />
        <div className="noise" />
        <div className="relative z-10 glass-card p-8 sm:p-10 max-w-md w-full text-center space-y-8 rounded-[40px] border border-white/10 bg-white/[0.02]">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)]">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-2">
              Trojan<br/>Task Scheduler
            </h1>
            <p className="text-slate-300 font-medium text-sm">
              Synchronize your life and achieve deep focus.
            </p>
          </div>
          <button
            onClick={signIn}
            className="w-full py-4 bg-white text-black font-bold tracking-widest uppercase rounded-2xl hover:bg-slate-200 transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${getMoodTheme(selectedMood)} transition-colors duration-1000 relative selection:bg-blue-500/30 selection:text-white overflow-x-hidden`}
    >
      <div className="mesh-bg" />
      <div className="noise" />

      {/* Navigation Layer */}
      <nav className="fixed top-0 left-0 right-0 z-[60] px-6 lg:px-12 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-6 pointer-events-auto">
          <Tooltip text="Toggle Menu">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-4 bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-2xl text-white hover:bg-white/[0.08] transition-all shadow-2xl relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {isSidebarOpen ? (
                <Plus className="w-6 h-6 rotate-45" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </Tooltip>
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
              className="fixed inset-y-0 left-0 w-[280px] sm:w-80 bg-[#050505] border-r border-white/5 z-[80] p-6 lg:p-8 flex flex-col shadow-2xl"
            >
              <div className="mb-12">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-display font-black text-white tracking-widest uppercase mb-1">
                  Trojan
                </h1>
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                  Navigation Panel
                </p>
              </div>

              <div className="flex-1 flex flex-col space-y-2 no-scrollbar overflow-y-auto pr-2">
                <SidebarItem
                  icon={Home}
                  label="Overview"
                  active={activeView === "home"}
                  onClick={() => {
                    setActiveView("home");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Target}
                  label="Goals"
                  active={activeView === "goals"}
                  onClick={() => {
                    setActiveView("goals");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={CheckSquare}
                  label="Tasks"
                  active={activeView === "tasks"}
                  onClick={() => {
                    setActiveView("tasks");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Flame}
                  label="Habits"
                  active={activeView === "habits"}
                  onClick={() => {
                    setActiveView("habits");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={PieChart}
                  label="Pulse"
                  active={activeView === "insights"}
                  onClick={() => {
                    setActiveView("insights");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Gamepad2}
                  label="Life is a Game"
                  active={activeView === "lifegame"}
                  onClick={() => {
                    setActiveView("lifegame");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Sword}
                  label="Habitica Test"
                  active={activeView === "habitica"}
                  onClick={() => {
                    setActiveView("habitica");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Sparkles}
                  label="Automations"
                  active={activeView === "automations"}
                  onClick={() => {
                    setActiveView("automations");
                    setIsSidebarOpen(false);
                  }}
                />

                <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                    Environment
                  </p>
                  <div className="relative group/tooltip z-50 hover:z-[100]">
                    <button
                      onClick={() => {
                        const newZenMode = !isZenMode;
                        setIsZenMode(newZenMode);
                        if (newZenMode) {
                          setIsSidebarOpen(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border ${isZenMode ? "bg-blue-600/10 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/10 text-slate-300 hover:text-white"}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">
                          Zen Focus
                        </span>
                      </div>
                      <div
                        className={`w-10 h-5 rounded-full transition-all relative ${isZenMode ? "bg-blue-600" : "bg-slate-700"}`}
                      >
                        <motion.div
                          animate={{ left: isZenMode ? "22px" : "4px" }}
                          className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-lg"
                        />
                      </div>
                    </button>
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-48 p-3 bg-slate-700 text-xs text-slate-300 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none font-sans font-normal normal-case tracking-normal text-left">
                      Blurs and dims the entire HUD interface, locking you into extreme focus mode. Useful when you just want to do deep work without distractions.
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-r-[6px] border-t-[6px] border-b-[6px] border-r-slate-800 border-t-transparent border-b-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-white/10 relative">
                <AnimatePresence>
                  {isSettingsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 w-full mb-4 z-50 rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl p-2"
                    >
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          setIsSidebarOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all hover:bg-red-600/10 text-red-500 group"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`flex items-center space-x-4 p-4 rounded-3xl cursor-pointer transition-all ${isSettingsOpen ? "bg-white/[0.08] border-white/20" : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"} border`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-0.5">
                    <div className="w-full h-full bg-[#050505] rounded-[14px] flex items-center justify-center font-black text-blue-400">
                      GS
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate uppercase">
                      Gurpreet
                    </p>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-tighter">
                      Pilot Phase 1
                    </p>
                  </div>
                  <Settings className={`w-4 h-4 transition-all ${isSettingsOpen ? "text-white rotate-90" : "text-slate-400"}`} />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main
        className={`transition-all duration-1000 ease-[0.22, 1, 0.36, 1] pt-32 ${isZenMode ? "scale-[0.96] opacity-80 blur-sm pointer-events-none" : "scale-100"}`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-12 lg:px-16 pb-40">
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
              {activeView === "home" && <HomeView setActiveView={setActiveView} />}
              {activeView === "goals" && <GoalsView />}
              {activeView === "tasks" && <TasksView />}
              {activeView === "automations" && <AutomationsView />}
              {activeView === "habits" && <HabitsView />}
              {activeView === "insights" && <InsightsView />}
              {activeView === "lifegame" && <LifeGameView />}
              {activeView === "habitica" && <HabiticaTestView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation - Only visible on small screens */}
      {!isZenMode && (
        <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[60]">
          <div className="bg-[#0a0505]/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-2 flex items-center justify-between shadow-2xl safe-area-pb">
            {[
              { id: "home", icon: Home, label: "Home" },
              { id: "goals", icon: Target, label: "Goals" },
              { id: "tasks", icon: CheckSquare, label: "Tasks" },
              { id: "automations", icon: Sparkles, label: "Auto" },
              { id: "habits", icon: Flame, label: "Habits" },
              { id: "lifegame", icon: Gamepad2, label: "Game" },
              { id: "habitica", icon: Sword, label: "Habitica" }
            ].map(({ id, icon: Icon, label }) => {
              const isActive = activeView === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                    isActive 
                      ? "bg-blue-600/10 text-blue-500" 
                      : "text-slate-300 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
                  <span className={`text-[8px] font-black uppercase mt-1 tracking-wider ${isActive ? "opacity-100" : "opacity-0 h-0"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {isZenMode && <ZenTimer onExit={() => setIsZenMode(false)} />}
    </div>
  );
};
