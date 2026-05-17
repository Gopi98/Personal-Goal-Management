import React from 'react';
import { motion } from 'framer-motion';
import { Info, Target, CheckSquare, Flame, PieChart, Sparkles, Wallet, Zap, Calendar, Bot, List, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const PageInfo = ({ icon: Icon, title, description, features }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-950/50 border border-white/10 rounded-[32px] p-6 lg:p-8 space-y-6"
  >
    <div className="flex items-center space-x-4 border-b border-white/5 pb-6">
      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="text-slate-400 mt-1">{description}</p>
      </div>
    </div>
    
    <div className="space-y-4">
      {features.map((feature: any, idx: number) => (
        <div key={idx} className="flex items-start space-x-3">
          <div className="mt-1 flex-shrink-0 text-blue-500/70">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200">{feature.title}</h3>
            <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{feature.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

export const InfoView = () => {
  return (
    <div className="max-w-4xl mx-auto pb-32 pt-8 space-y-8 px-4 sm:px-0">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest shadow-lg">
                <Info className="w-4 h-4" />
                <span>Reference Guide</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tight">System Manual</h1>
              <p className="text-xl text-slate-400 leading-relaxed font-medium">
                Welcome to the Trojan Task Scheduler. This platform is designed as an end-to-end life operating system. 
                Below is a breakdown of how each tool works and how it helps you manage your time and energy.
              </p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <PageInfo
          icon={Wallet}
          title="Vault (Time Bank)"
          description="The gamified core of the app. Your completed real-life work translates into time."
          features={[
            { title: "Earning Time Balance", desc: "Earn +30m for Goals, +15m for Priority A tasks, +10m for Priority B, +5m for Priority C, and +2m for other tasks. Completing a habit earns you +5m, and completing ALL habits gives a massive +20m bonus. Weekends automatically grant a +120m holiday bonus." },
            { title: "Penalties", desc: "Skipping a habit deducts -10m from your bank. Undoing your complete daily habits also costs you the completion bonus." },
            { title: "Spending Time (Timers)", desc: "Use the balance you've earned to unlock 'Break Time' or leisure activities. By starting a timer, you withdraw time from your Vault to take a well-deserved guilt-free break." },
            { title: "Transaction History", desc: "View the log of exactly when you earned or spent time to hold yourself accountable." }
          ]}
        />

        <PageInfo
          icon={Target}
          title="Goals (Yearly, Monthly, Weekly)"
          description="The big-picture planner for long-term vision."
          features={[
            { title: "Hierarchical Planning", desc: "Set Yearly goals, then break them down into Monthly milestones, and further into actionable Weekly goals." },
            { title: "Goal Promotion & Demotion", desc: "Use the upward arrow to promote a Weekly goal into your daily Task List. If you didn't finish something, demote it back to a Weekly or Monthly backlog." },
            { title: "AI Auto-Split", desc: "With one click, AI can analyze a large goal ('Launch a startup') and automatically generate step-by-step subtasks to get you started." }
          ]}
        />

        <PageInfo
          icon={CheckSquare}
          title="Tasks"
          description="Your day-to-day execution engine with 3 dedicated tabs for execution."
          features={[
            { title: "List Tab", desc: "A chronological timeline of your day. See exactly what you need to do and when. You can seamlessly hit 'Push back 15m' if your schedule slips." },
            { title: "Board Tab", desc: "Your tasks laid out in the Eisenhower Matrix. Quickly triage tasks into Priority A (Do), B (Schedule), C (Delegate), or D (Eliminate)." },
            { title: "Focus Tab", desc: "Your focused smart scheduling view. Plan tasks at specific times, use AI auto-scheduling, and jump right into work without distractions." },
            { title: "Deep Focus (Mission Control)", desc: "Click the lightning bolt on any task to enter 'Deep Focus Mode'. This takes over your screen with a Zen timer and ambient noise, hiding all distractions until the task is complete." }
          ]}
        />

        <PageInfo
          icon={Flame}
          title="Habits"
          description="Daily recurring routines to build discipline."
          features={[
            { title: "Habit Tracking Grid", desc: "A simple visualization showing whether you completed your habits each day of the week." },
            { title: "Streak Counter", desc: "Maintains a history of consecutive completions, helping keep momentum." },
            { title: "Task Conversion", desc: "If you need more structure for catching up on a habit today, click the plus icon to add today's instance directly into your Task List as a one-off item." }
          ]}
        />

        <PageInfo
          icon={PieChart}
          title="Pulse (Insights & Reflection)"
          description="The progress analysis and journaling hub."
          features={[
            { title: "Progress Charts", desc: "Visualizations showing the ratio of completed vs pending objectives across tasks and goals." },
            { title: "AI Daily Reflection", desc: "End your day here. Write a journal entry, and our AI will summarize your wins, provide actionable advice, and deposit 15 minutes into your Time Bank." }
          ]}
        />

        <PageInfo
          icon={Sparkles}
          title="Automations"
          description="The autopilot system. Rules that run in the background."
          features={[
            { title: "Automatic Goal Promotion", desc: "Set a rule like 'Every Sunday at 9 AM, move 3 subtasks from my Yearly Goal to my Tasks List'. The app runs this check and auto-promotes subtasks so you never have to manually pull work into your week." }
          ]}
        />

        <PageInfo
          icon={Bot}
          title="Trojan AI Assistant"
          description="Your personal coaching and scheduling assistant."
          features={[
            { title: "Contextual Awareness", desc: "Trojan AI knows what tasks are pending and what your goals are. You can ask: 'What should I do today based on priority?' or 'Analyze my progress'." },
            { title: "Quick Actions", desc: "Use the quick chips to trigger specific routines like the Morning Journal or get AI to write out your Daily Plan." }
          ]}
        />
      </div>
    </div>
  );
};
