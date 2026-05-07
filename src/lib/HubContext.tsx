import React, { createContext, useContext, useState, useEffect } from 'react';
import { Goal, Task, Habit, Subtask, Reflection, FocusSession } from './types';
import { db, auth } from './firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getReflectionInsight, smartTaskPrioritization } from './gemini';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface HubContextType {
  user: User | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  
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
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress' | 'subtasks'> & { parentGoalId?: string, subtasks?: any[] }) => Promise<string | undefined>;
  addSubtask: (goalId: string, title: string) => void;
  bulkAddGoalSubtasks: (goalId: string, subtasks: string[]) => void;
  toggleSubtask: (goalId: string, subtaskId: string) => void;
  updateGoal: (goalId: string, updates: any) => void;
  deleteSubtask: (goalId: string, subtaskId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'subtasks'> & { subtasks?: any[] }) => Promise<string | undefined>;
  updateTask: (taskId: string, updates: any) => void;
  addTaskSubtask: (taskId: string, title: string) => void;
  bulkAddTaskSubtasks: (taskId: string, subtasks: string[]) => void;
  toggleTaskSubtask: (taskId: string, subtaskId: string) => void;
  deleteTaskSubtask: (taskId: string, subtaskId: string) => void;
  addHabit: (title: string, frequency?: string) => void;
  updateHabit: (habitId: string, updates: any) => void;
  toggleGoal: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleHabit: (id: string, date: string) => void;
  deleteGoal: (id: string) => void;
  deleteTask: (id: string) => void;
  postponeTask: (id: string) => void;
  deleteHabit: (id: string) => void;
  reorderTasks: (startIndex: number, endIndex: number) => void;
}

const HubContext = createContext<HubContextType | undefined>(undefined);

export const HubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(() => localStorage.getItem('hub_mood'));
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };
  
  const signOutUser = async () => {
    await auth.signOut();
  };

  useEffect(() => {
    if (!user) return;
    
    const paths = {
      goals: `users/${user.uid}/goals`,
      tasks: `users/${user.uid}/tasks`,
      habits: `users/${user.uid}/habits`,
      reflections: `users/${user.uid}/reflections`,
      focusSessions: `users/${user.uid}/focusSessions`,
    };

    const unsubGoals = onSnapshot(query(collection(db, paths.goals), where('ownerId', '==', user.uid)), snap => {
      setGoals(snap.docs.map(d => ({ ...d.data(), id: d.id } as Goal)));
    }, err => handleFirestoreError(err, OperationType.LIST, paths.goals));

    const unsubTasks = onSnapshot(query(collection(db, paths.tasks), where('ownerId', '==', user.uid)), snap => {
      setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id } as Task)));
    }, err => handleFirestoreError(err, OperationType.LIST, paths.tasks));

    const unsubHabits = onSnapshot(query(collection(db, paths.habits), where('ownerId', '==', user.uid)), snap => {
      setHabits(snap.docs.map(d => ({ ...d.data(), id: d.id } as Habit)));
    }, err => handleFirestoreError(err, OperationType.LIST, paths.habits));

    const unsubReflections = onSnapshot(query(collection(db, paths.reflections), where('ownerId', '==', user.uid)), snap => {
      setReflections(snap.docs.map(d => ({ ...d.data(), id: d.id } as Reflection)));
    }, err => handleFirestoreError(err, OperationType.LIST, paths.reflections));

    const unsubFocusSessions = onSnapshot(query(collection(db, paths.focusSessions), where('ownerId', '==', user.uid)), snap => {
      setFocusSessions(snap.docs.map(d => ({ ...d.data(), id: d.id } as FocusSession)));
    }, err => handleFirestoreError(err, OperationType.LIST, paths.focusSessions));

    return () => {
      unsubGoals(); unsubTasks(); unsubHabits(); unsubReflections(); unsubFocusSessions();
    };
  }, [user]);

  useEffect(() => {
    if (selectedMood) localStorage.setItem('hub_mood', selectedMood);
    else localStorage.removeItem('hub_mood');
  }, [selectedMood]);

  const addFocusSession = async (duration: number, type: 'work' | 'break', taskId?: string) => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const docRef = doc(db, `users/${user.uid}/focusSessions`, id);
    const data: any = { duration, type, date: new Date().toISOString(), ownerId: user.uid };
    if (taskId) data.taskId = taskId;
    try {
      await setDoc(docRef, data);
    } catch(e) { handleFirestoreError(e, OperationType.CREATE, docRef.path); }
  };

  const addGoal = async (g: any): Promise<string | undefined> => {
    if (!user) return undefined;
    const id = Math.random().toString(36).substr(2, 9);
    const docRef = doc(db, `users/${user.uid}/goals`, id);
    const data: any = {
      ...g,
      createdAt: new Date().toISOString(),
      progress: 0,
      subtasks: g.subtasks || [],
      ownerId: user.uid
    };
    if (data.parentGoalId === undefined) {
      delete data.parentGoalId;
    }
    
    // Also remove any other undefined fields just in case
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
    
    try { await setDoc(docRef, data); } catch(e) { handleFirestoreError(e, OperationType.CREATE, docRef.path); }
    return id;
  };

  const addSubtask = async (goalId: string, title: string) => {
    if (!user) return;
    const g = goals.find(x => x.id === goalId);
    if (!g) return;
    const newSub: Subtask = { id: Math.random().toString(36).substr(2, 9), title, completed: false };
    const subtasks = [...g.subtasks, newSub];
    const progress = Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100);
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    try { await updateDoc(docRef, { subtasks, progress }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };
  
  const bulkAddGoalSubtasks = async (goalId: string, subtaskTitles: string[]) => {
    if (!user) return;
    const g = goals.find(x => x.id === goalId);
    if (!g) return;
    const newSubs = subtaskTitles.map(title => ({ id: Math.random().toString(36).substr(2, 9), title, completed: false }));
    const subtasks = [...g.subtasks, ...newSubs];
    const progress = Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100);
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    try { await updateDoc(docRef, { subtasks, progress }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const toggleSubtask = async (goalId: string, subtaskId: string) => {
    if (!user) return;
    const g = goals.find(x => x.id === goalId);
    if (!g) return;
    const subtasks = g.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    const progress = Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100);
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    try { await updateDoc(docRef, { subtasks, progress, completed: progress === 100 }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const updateGoal = async (goalId: string, updates: any) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    try { await updateDoc(docRef, updates); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const deleteSubtask = async (goalId: string, subtaskId: string) => {
    if (!user) return;
    const g = goals.find(x => x.id === goalId);
    if (!g) return;
    const subtasks = g.subtasks.filter(s => s.id !== subtaskId);
    const progress = subtasks.length === 0 ? g.progress : Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100);
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    try { await updateDoc(docRef, { subtasks, progress }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const addTask = async (t: any): Promise<string | undefined> => {
    if (!user) return undefined;
    const id = Math.random().toString(36).substr(2, 9);
    const docRef = doc(db, `users/${user.uid}/tasks`, id);
    const data: any = {
      title: t.title,
      date: t.date,
      priority: t.priority,
      completed: false,
      subtasks: t.subtasks || [],
      ownerId: user.uid
    };
    if (t.duration) data.duration = t.duration;
    if (t.type) data.type = t.type;
    if (t.tags) data.tags = t.tags;
    if (t.startTime) data.startTime = t.startTime;
    if (t.endTime) data.endTime = t.endTime;
    if (t.parentGoalTitle) data.parentGoalTitle = t.parentGoalTitle;
    if (t.linkedHabitId) data.linkedHabitId = t.linkedHabitId;
    
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
    
    try { await setDoc(docRef, data); } catch(e) { handleFirestoreError(e, OperationType.CREATE, docRef.path); }
    return id;
  };

  const updateTask = async (taskId: string, updates: any) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, updates); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const addTaskSubtask = async (taskId: string, title: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const newSub = { id: Math.random().toString(36).substr(2, 9), title, completed: false };
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, { subtasks: [...t.subtasks, newSub] }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const bulkAddTaskSubtasks = async (taskId: string, subtaskTitles: string[]) => {
    if (!user) return;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const newSubs = subtaskTitles.map(title => ({ id: Math.random().toString(36).substr(2, 9), title, completed: false }));
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, { subtasks: [...t.subtasks, ...newSubs] }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const toggleTaskSubtask = async (taskId: string, subtaskId: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const subtasks = t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, { subtasks }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const deleteTaskSubtask = async (taskId: string, subtaskId: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const subtasks = t.subtasks.filter(s => s.id !== subtaskId);
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, { subtasks }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const addHabit = async (title: string, frequency: string = 'daily') => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const docRef = doc(db, `users/${user.uid}/habits`, id);
    try { await setDoc(docRef, { title, frequency, streak: 0, completedHistory: {}, ownerId: user.uid }); } catch(e) { handleFirestoreError(e, OperationType.CREATE, docRef.path); }
  };

  const updateHabit = async (habitId: string, updates: any) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/habits`, habitId);
    try { await updateDoc(docRef, updates); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const toggleGoal = async (id: string) => {
    if (!user) return;
    const g = goals.find(x => x.id === id);
    if (!g) return;
    const docRef = doc(db, `users/${user.uid}/goals`, id);
    try { await updateDoc(docRef, { completed: !g.completed, progress: !g.completed ? 100 : 0 }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const toggleTask = async (id: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const isNowCompleted = !t.completed;
    const docRef = doc(db, `users/${user.uid}/tasks`, id);
    try {
      await updateDoc(docRef, { completed: isNowCompleted });
      if (t.linkedHabitId) {
        const h = habits.find(x => x.id === t.linkedHabitId);
        if (h && !!h.completedHistory[t.date] !== isNowCompleted) {
          toggleHabit(t.linkedHabitId, t.date);
        }
      }
    } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const toggleHabit = async (id: string, date: string) => {
    if (!user) return;
    const h = habits.find(x => x.id === id);
    if (!h) return;
    const docRef = doc(db, `users/${user.uid}/habits`, id);
    try { await updateDoc(docRef, { completedHistory: { ...h.completedHistory, [date]: !h.completedHistory[date] } }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/goals`, id);
    try { await deleteDoc(docRef); } catch(e) { handleFirestoreError(e, OperationType.DELETE, docRef.path); }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/tasks`, id);
    try { await deleteDoc(docRef); } catch(e) { handleFirestoreError(e, OperationType.DELETE, docRef.path); }
  };
  
  const postponeTask = async (id: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const d = new Date(t.date);
    d.setDate(d.getDate() + 1);
    const docRef = doc(db, `users/${user.uid}/tasks`, id);
    try { await updateDoc(docRef, { date: d.toISOString().split('T')[0] }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const deleteHabit = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/habits`, id);
    try { await deleteDoc(docRef); } catch(e) { handleFirestoreError(e, OperationType.DELETE, docRef.path); }
  };

  const addReflection = async (text: string) => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const date = new Date().toISOString();
    const docRef = doc(db, `users/${user.uid}/reflections`, id);
    try {
      await setDoc(docRef, { text, date, ownerId: user.uid });
      const aiInsight = await getReflectionInsight(text);
      await updateDoc(docRef, { aiInsight });
    } catch(e) { handleFirestoreError(e, OperationType.CREATE, docRef.path); }
  };

  const smartPrioritizeTasks = async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayTasksList = tasks.filter(t => t.date === today && !t.completed);
      if (todayTasksList.length < 2) return;

      const rankedTitles = await smartTaskPrioritization(todayTasksList);
      
      if (rankedTitles.length > 0) {
        const sortedTasks = [...todayTasksList].sort((a, b) => {
          const aIndex = rankedTitles.indexOf(a.title);
          const bIndex = rankedTitles.indexOf(b.title);
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        
        const batch = writeBatch(db);
        sortedTasks.forEach((t, i) => {
          const docRef = doc(db, `users/${user.uid}/tasks`, t.id!);
          batch.update(docRef, { order: i });
        });
        await batch.commit();
      }
    } catch (e) {
      console.error("Smart Prioritize Error:", e);
    }
  };

  const reorderTasks = async (startIndex: number, endIndex: number) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === today && !t.completed).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (startIndex < 0 || startIndex >= todayTasks.length || endIndex < 0 || endIndex >= todayTasks.length) return;
    
    const result = Array.from(todayTasks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    const batch = writeBatch(db);
    result.forEach((t, i) => {
      const docRef = doc(db, `users/${user.uid}/tasks`, t.id!);
      batch.update(docRef, { order: i });
    });
    try { await batch.commit(); } catch(e) { console.error('Reorder update failed', e); }
  };

  return (
    <HubContext.Provider value={{ 
      user, signIn, signOut: signOutUser,
      goals, tasks, habits, selectedMood, setSelectedMood, reflections, addReflection,
      focusTaskId, setFocusTaskId, focusSessions, addFocusSession, smartPrioritizeTasks,
      addGoal, addSubtask, bulkAddGoalSubtasks, toggleSubtask, updateGoal, deleteSubtask,
      addTask, updateTask, addTaskSubtask, bulkAddTaskSubtasks, toggleTaskSubtask, deleteTaskSubtask,
      addHabit, updateHabit,
      toggleGoal, toggleTask, toggleHabit,
      deleteGoal, deleteTask, postponeTask, deleteHabit, reorderTasks
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

