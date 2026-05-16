import React, { useState } from 'react';
import { useHub } from '../lib/HubContext';
import { motion } from 'motion/react';
import { Plus, Trash2, Webhook, Workflow, Clock, RefreshCw } from 'lucide-react';

export const AutomationsView = () => {
    const { automations, addAutomation, updateAutomation, deleteAutomation, goals } = useHub();
    const [isCreating, setIsCreating] = useState(false);
    const [sourceGoalId, setSourceGoalId] = useState("");
    const [targetType, setTargetType] = useState<'weekly_goal' | 'daily_task'>('weekly_goal');
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [dayOfWeek, setDayOfWeek] = useState(1);
    const [dayOfMonth, setDayOfMonth] = useState(1);
    
    // Check if goal has subtasks
    const sourceGoal = goals.find(g => g.id === sourceGoalId);
    
    const handleSave = () => {
        if (!sourceGoalId) return;
        addAutomation({
            sourceGoalId,
            targetType,
            frequency,
            itemsToMove: 1,
            isActive: true,
            ...(frequency === 'weekly' ? { dayOfWeek } : {}),
            ...(frequency === 'monthly' ? { dayOfMonth } : {})
        });
        setIsCreating(false);
        setSourceGoalId("");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            <header>
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                        <Workflow className="w-5 h-5 text-purple-400" />
                    </div>
                    <h1 className="text-3xl font-display font-black tracking-tight text-white">
                        Automations
                    </h1>
                </div>
                <p className="text-slate-400">Put your life on autopilot. Move subtasks dynamically based on a schedule.</p>
            </header>
            
            <div className="flex justify-start">
               <button onClick={() => setIsCreating(!isCreating)} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center space-x-2 transition-all">
                  <Plus className="w-4 h-4" />
                  <span>New Automation</span>
               </button>
            </div>
            
            {isCreating && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-6">
                    <h3 className="text-xl font-bold text-white">Create Workflow</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Source Goal</label>
                            <select 
                                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-white"
                                value={sourceGoalId}
                                onChange={e => setSourceGoalId(e.target.value)}
                            >
                                <option value="" className="bg-[#111] text-white">Select a Goal</option>
                                {goals.filter(g => g.type === 'yearly' || g.type === 'monthly').map(g => (
                                    <option key={g.id} value={g.id} className="bg-[#111] text-white">{g.title} ({g.subtasks?.length || 0} subtasks)</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Frequency</label>
                                <select 
                                    className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-white"
                                    value={frequency}
                                    onChange={e => setFrequency(e.target.value as any)}
                                >
                                    <option value="daily" className="bg-[#111] text-white">Daily</option>
                                    <option value="weekly" className="bg-[#111] text-white">Weekly</option>
                                    <option value="monthly" className="bg-[#111] text-white">Monthly</option>
                                </select>
                            </div>
                            
                            {frequency === 'weekly' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Day of Week</label>
                                    <select 
                                        className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-white"
                                        value={dayOfWeek}
                                        onChange={e => setDayOfWeek(Number(e.target.value))}
                                    >
                                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                                            <option key={idx} value={idx} className="bg-[#111] text-white">{day}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {frequency === 'monthly' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Day of Month</label>
                                    <select 
                                        className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-white"
                                        value={dayOfMonth}
                                        onChange={e => setDayOfMonth(Number(e.target.value))}
                                    >
                                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day} className="bg-[#111] text-white">{day}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Destination</label>
                            <select 
                                className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-white"
                                value={targetType}
                                onChange={e => setTargetType(e.target.value as any)}
                            >
                                <option value="weekly_goal" className="bg-[#111] text-white">Weekly Goals</option>
                                <option value="daily_task" className="bg-[#111] text-white">Daily Tasks</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-2">One subtask (or the goal itself if no subtasks remain) will be popped from the source and promoted to the target destination.</p>
                        </div>
                        
                        <div className="flex justify-end pt-4 border-t border-white/5">
                            <button onClick={handleSave} disabled={!sourceGoalId} className="px-6 py-2 bg-white text-black font-bold rounded-xl disabled:opacity-50">
                                Save Automation
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
            
            <div className="space-y-4">
                {automations.map(auto => {
                    const goal = goals.find(g => g.id === auto.sourceGoalId);
                    return (
                        <div key={auto.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl flex-shrink-0 ${auto.isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                                    <RefreshCw className={`w-5 h-5 ${auto.isActive ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '4s' }} />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-lg flex items-center gap-2">
                                        Take from <span className="px-2 py-0.5 bg-white/10 rounded text-sm">{goal?.title || 'Unknown Goal'}</span>
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {auto.frequency === 'daily' ? 'Every day' : auto.frequency === 'weekly' ? `Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][auto.dayOfWeek || 0]}` : `On the ${auto.dayOfMonth || 1}${([1, 21, 31].includes(auto.dayOfMonth || 1)) ? 'st' : ([2, 22].includes(auto.dayOfMonth || 1)) ? 'nd' : ([3, 23].includes(auto.dayOfMonth || 1)) ? 'rd' : 'th'} of the month`}
                                        {' '}→ move to{' '}
                                        <span className="font-medium text-slate-300">{auto.targetType === 'weekly_goal' ? 'Weekly Goals' : 'Daily Tasks'}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 w-full md:w-auto mt-2 md:mt-0 justify-end">
                                <button
                                    onClick={() => updateAutomation(auto.id, { isActive: !auto.isActive })}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${auto.isActive ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-transparent border border-white/20 text-slate-400 hover:text-white'}`}
                                >
                                    {auto.isActive ? 'Active' : 'Paused'}
                                </button>
                                <button className="p-2 text-slate-500 hover:text-red-400 transition-colors" onClick={() => { if(window.confirm('Delete automation?')) deleteAutomation(auto.id) }}>
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                
                {automations.length === 0 && !isCreating && (
                    <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/5 rounded-3xl">
                        <Webhook className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-slate-300 mb-2">No Automations</h3>
                        <p className="text-slate-500">Create a workflow to steadily make progress on your long-term goals.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
