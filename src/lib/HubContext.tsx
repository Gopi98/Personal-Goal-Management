import React, { createContext, useContext, useState, useEffect } from 'react';
import { Goal, Task, Habit, Subtask, Reflection, FocusSession } from './types';

interface HubContextType {
  goals: Goal[];
  tasks: Task[];
  habits: Habit[];
  selectedMood: string | null;
  setSelectedMood: (mood: string | null) => void;
  reflections: Reflection[];
  addReflection: (text: string) => void;
  focusSessions: FocusSession[];
  addFocusSession: (duration: number, type: 'work' | 'break', taskId?: string) => void;
  focusTaskId: string | null;
  setFocusTaskId: (id: string | null) => void;
  smartPrioritizeTasks: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress' | 'subtasks'> & { parentGoalId?: string }) => void;
  addSubtask: (goalId: string, title: string) => void;
  bulkAddGoalSubtasks: (goalId: string, subtasks: string[]) => void;
  toggleSubtask: (goalId: string, subtaskId: string) => void;
  deleteSubtask: (goalId: string, subtaskId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'subtasks'>) => void;
  addTaskSubtask: (taskId: string, title: string) => void;
  bulkAddTaskSubtasks: (taskId: string, subtasks: string[]) => void;
  toggleTaskSubtask: (taskId: string, subtaskId: string) => void;
  deleteTaskSubtask: (taskId: string, subtaskId: string) => void;
  addHabit: (title: string) => void;
  toggleGoal: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleHabit: (id: string, date: string) => void;
  deleteGoal: (id: string) => void;
  deleteTask: (id: string) => void;
  postponeTask: (id: string) => void;
  deleteHabit: (id: string) => void;
}

const HubContext = createContext<HubContextType | undefined>(undefined);

export const HubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('hub_goals');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((g: any) => ({
        ...g,
        subtasks: g.subtasks || []
      }));
    }
    return [
      { id: '1', title: 'Land Data Engineer Role', type: 'yearly', priority: 'A', completed: false, progress: 33, subtasks: [], createdAt: new Date().toISOString() },
      { id: '2', title: 'Assess skills & update resume/portfolio.', type: 'monthly', priority: 'A', completed: false, progress: 33, subtasks: [], createdAt: new Date().toISOString() },
      { id: '3', title: 'Review one core skill and note recent achievements.', type: 'weekly', priority: 'A', completed: true, progress: 100, subtasks: [], createdAt: new Date().toISOString() },
    ];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('hub_tasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((t: any) => ({
        ...t,
        subtasks: t.subtasks || [],
        tags: t.tags || []
      }));
    }
    return [
      { id: '1', title: 'Study PySpark', date: '2026-05-05', priority: 'A', duration: '60m', energy: 'High', type: 'daily', completed: false, tags: ['#study'], subtasks: [] },
    ];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('hub_habits');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Morning workout', streak: 0, completedHistory: {} },
    ];
  });

  const [selectedMood, setSelectedMood] = useState<string | null>(() => localStorage.getItem('hub_mood'));
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem('hub_focus_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [reflections, setReflections] = useState<Reflection[]>(() => {
    const saved = localStorage.getItem('hub_reflections');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem('hub_goals', JSON.stringify(goals));
    localStorage.setItem('hub_tasks', JSON.stringify(tasks));
    localStorage.setItem('hub_habits', JSON.stringify(habits));
    localStorage.setItem('hub_reflections', JSON.stringify(reflections));
    localStorage.setItem('hub_focus_sessions', JSON.stringify(focusSessions));
    if (selectedMood) localStorage.setItem('hub_mood', selectedMood);
    else localStorage.removeItem('hub_mood');
  }, [goals, tasks, habits, reflections, selectedMood, focusSessions]);

  const addFocusSession = (duration: number, type: 'work' | 'break', taskId?: string) => {
    const session: FocusSession = {
      id: Math.random().toString(36).substr(2, 9),
      duration,
      type,
      taskId,
      date: new Date().toISOString()
    };
    setFocusSessions(prev => [session, ...prev]);
  };
  const addGoal = (g: any) => {
    const newGoal: Goal = {
      ...g,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      progress: 0,
      subtasks: [],
      parentGoalId: g.parentGoalId
    };
    setGoals([...goals, newGoal]);
  };

  const addSubtask = (goalId: string, title: string) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        const newSub: Subtask = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          completed: false
        };
        const updatedSubtasks = [...g.subtasks, newSub];
        const progress = Math.round((updatedSubtasks.filter(s => s.completed).length / updatedSubtasks.length) * 100);
        return { ...g, subtasks: updatedSubtasks, progress };
      }
      return g;
    }));
  };
  
  const bulkAddGoalSubtasks = (goalId: string, subtaskTitles: string[]) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        const newSubs = subtaskTitles.map(title => ({
          id: Math.random().toString(36).substr(2, 9),
          title,
          completed: false
        }));
        const updatedSubtasks = [...g.subtasks, ...newSubs];
        const progress = Math.round((updatedSubtasks.filter(s => s.completed).length / updatedSubtasks.length) * 100);
        return { ...g, subtasks: updatedSubtasks, progress };
      }
      return g;
    }));
  };

  const toggleSubtask = (goalId: string, subtaskId: string) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        const updatedSubtasks = g.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        const progress = Math.round((updatedSubtasks.filter(s => s.completed).length / updatedSubtasks.length) * 100);
        return { ...g, subtasks: updatedSubtasks, progress, completed: progress === 100 };
      }
      return g;
    }));
  };

  const deleteSubtask = (goalId: string, subtaskId: string) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        const updatedSubtasks = g.subtasks.filter(s => s.id !== subtaskId);
        const progress = updatedSubtasks.length === 0 ? g.progress : Math.round((updatedSubtasks.filter(s => s.completed).length / updatedSubtasks.length) * 100);
        return { ...g, subtasks: updatedSubtasks, progress };
      }
      return g;
    }));
  };

  const addTask = (t: any) => {
    const newTask: Task = {
      ...t,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
      subtasks: []
    };
    setTasks([...tasks, newTask]);
  };

  const addTaskSubtask = (taskId: string, title: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const newSub = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          completed: false
        };
        return { ...t, subtasks: [...t.subtasks, newSub] };
      }
      return t;
    }));
  };

  const bulkAddTaskSubtasks = (taskId: string, subtaskTitles: string[]) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const newSubs = subtaskTitles.map(title => ({
          id: Math.random().toString(36).substr(2, 9),
          title,
          completed: false
        }));
        return { ...t, subtasks: [...t.subtasks, ...newSubs] };
      }
      return t;
    }));
  };

  const toggleTaskSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        return { ...t, subtasks: updatedSubtasks };
      }
      return t;
    }));
  };

  const deleteTaskSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
      }
      return t;
    }));
  };

  const addHabit = (title: string) => {
    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      streak: 0,
      completedHistory: {}
    };
    setHabits([...habits, newHabit]);
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed, progress: !g.completed ? 100 : 0 } : g));
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const toggleHabit = (id: string, date: string) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        const newHistory = { ...h.completedHistory, [date]: !h.completedHistory[date] };
        return { ...h, completedHistory: newHistory };
      }
      return h;
    }));
  };

  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));
  
  const postponeTask = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const d = new Date(t.date);
        d.setDate(d.getDate() + 1);
        return { ...t, date: d.toISOString().split('T')[0] };
      }
      return t;
    }));
  };

  const deleteHabit = (id: string) => setHabits(habits.filter(h => h.id !== id));

  const addReflection = async (text: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newRef: Reflection = { id, text, date: new Date().toISOString() };
    
    setReflections(prev => [newRef, ...prev]);

    try {
      const { getReflectionInsight } = await import('./gemini');
      const aiInsight = await getReflectionInsight(text);
      setReflections(prev => prev.map(r => r.id === id ? { ...r, aiInsight } : r));
    } catch (e) {
      console.error("AI Reflection error:", e);
    }
  };

  const smartPrioritizeTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayTasksList = tasks.filter(t => t.date === today && !t.completed);
      if (todayTasksList.length < 2) return;

      const { smartTaskPrioritization } = await import('./gemini');
      const rankedTitles = await smartTaskPrioritization(todayTasksList);
      
      if (rankedTitles.length > 0) {
        const sortedTasks = [...tasks].sort((a, b) => {
          // If neither is today/pending, keep original order relative to each other
          if ((a.date !== today || a.completed) && (b.date !== today || b.completed)) return 0;
          
          // Move non-today/completed to the end
          if (a.date !== today || a.completed) return 1;
          if (b.date !== today || b.completed) return -1;
          
          const aIndex = rankedTitles.indexOf(a.title);
          const bIndex = rankedTitles.indexOf(b.title);
          
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setTasks(sortedTasks);
      }
    } catch (e) {
      console.error("Smart Prioritize Error:", e);
    }
  };

  return (
    <HubContext.Provider value={{ 
      goals, tasks, habits, selectedMood, setSelectedMood, reflections, addReflection,
      focusTaskId, setFocusTaskId, focusSessions, addFocusSession, smartPrioritizeTasks,
      addGoal, addSubtask, bulkAddGoalSubtasks, toggleSubtask, deleteSubtask,
      addTask, addTaskSubtask, bulkAddTaskSubtasks, toggleTaskSubtask, deleteTaskSubtask,
      addHabit,
      toggleGoal, toggleTask, toggleHabit,
      deleteGoal, deleteTask, postponeTask, deleteHabit
    }}>
      {children}
    </HubContext.Provider>
  );
};

export const useHub = () => {
  const context = useContext(HubContext);
  if (!context) throw new Error('useHub must be used within HubProvider');
  return context;
};
