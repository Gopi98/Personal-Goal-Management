import { toLocalDateStr } from './dateUtils';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Goal, Task, Habit, Subtask, Reflection, FocusSession, Automation } from './types';
import { db, auth } from './firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getReflectionInsight, smartTaskPrioritization } from './gemini';
import confetti from 'canvas-confetti';

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

let lastLocalWriteTime = 0;

export const mergeHistories = (h1: any[], h2: any[]): any[] => {
  const map = new Map<string, any>();
  const getKey = (item: any) => {
    return item.id || `${item.date}_${item.amount}_${item.reason}`;
  };
  if (Array.isArray(h2)) {
    h2.forEach(item => {
      if (item && item.date) {
        map.set(getKey(item), item);
      }
    });
  }
  if (Array.isArray(h1)) {
    h1.forEach(item => {
      if (item && item.date) {
        map.set(getKey(item), item);
      }
    });
  }
  return Array.from(map.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);
};

export const updateUserMetadata = async (updates: Record<string, any>) => {
  lastLocalWriteTime = Date.now();
  try {
    Object.entries(updates).forEach(([key, val]) => {
       if (val !== null && val !== undefined) {
          localStorage.setItem(key, val);
       } else {
          localStorage.removeItem(key);
       }
    });

    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updates, { merge: true });
    }
  } catch(e) {
    console.warn('Metadata sync failed:', e);
  }
};

export const addTimeBankBalance = async (amount: number, reason: string = "System Adjustment") => {
  lastLocalWriteTime = Date.now();
  try {
    const saved = localStorage.getItem('timeBankBalance');
    let balance = saved !== null ? parseInt(saved, 10) : 45;
    
    let actualAmount = amount;
    if (balance + actualAmount < 0) {
        actualAmount = -balance;
    }
    balance += actualAmount;
    if (balance < 0) balance = 0;
    
    localStorage.setItem('timeBankBalance', balance.toString());

    // Update History
    const historySaved = localStorage.getItem('timeBankHistory');
    let history = historySaved ? JSON.parse(historySaved) : [];
    
    // Create new log entry
    const log = {
      id: Math.random().toString(36).substr(2, 9),
      amount: actualAmount,
      reason,
      date: new Date().toISOString()
    };
    
    history.unshift(log);
    // Keep last 50 entries
    history = history.slice(0, 50);
    localStorage.setItem('timeBankHistory', JSON.stringify(history));

    window.dispatchEvent(new CustomEvent('timeBankUpdated', { detail: { balance, history } }));

    // Firebase Sync
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, { 
          timeBankBalance: balance,
          timeBankHistory: history,
          // Sync current temporal state parameters to secure database
          timeBankLastVisit: localStorage.getItem('timeBankLastVisit') || null,
          timeBankWeekStart: localStorage.getItem('timeBankWeekStart') || null,
          lastHabitDeductionCheck: localStorage.getItem('lastHabitDeductionCheck') || null,
          lastWeekendBonusCheck: localStorage.getItem('lastWeekendBonusCheck') || null,
        }, { merge: true });
      } catch (fbErr) {
        console.warn('Firebase time bank sync error:', fbErr);
      }
    }
  } catch (e) {
    console.warn('Could not update time bank balance', e);
  }
};

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
  
  automations: Automation[];
  addAutomation: (auto: Omit<Automation, 'id' | 'createdAt' | 'ownerId'>) => Promise<void>;
  updateAutomation: (id: string, updates: any) => Promise<void>;
  deleteAutomation: (id: string) => Promise<void>;
  
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress' | 'subtasks'> & { parentGoalId?: string, subtasks?: any[] }) => Promise<string | undefined>;
  addSubtask: (goalId: string, title: string) => void;
  bulkAddGoalSubtasks: (goalId: string, subtasks: any[], parentSubtaskId?: string) => void;
  toggleSubtask: (goalId: string, subtaskId: string) => void;
  updateGoal: (goalId: string, updates: any) => void;
  deleteSubtask: (goalId: string, subtaskId: string) => void;
  addGoalChildSubtask: (goalId: string, parentSubtaskId: string, title: string) => void;
  updateGoalSubtask: (goalId: string, subtaskId: string, title: string) => void;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'subtasks'> & { subtasks?: any[] }) => Promise<string | undefined>;
  updateTask: (taskId: string, updates: any) => void;
  addTaskSubtask: (taskId: string, title: string) => void;
  addTaskChildSubtask: (taskId: string, parentSubtaskId: string, title: string) => void;
  bulkAddTaskSubtasks: (taskId: string, subtasks: any[]) => void;
  toggleTaskSubtask: (taskId: string, subtaskId: string) => void;
  deleteTaskSubtask: (taskId: string, subtaskId: string) => void;
  updateTaskSubtask: (taskId: string, subtaskId: string, title: string) => void;
  addHabit: (title: string, frequency?: string) => void;
  updateHabit: (habitId: string, updates: any) => void;
  toggleGoal: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleHabit: (id: string, date: string) => void;
  deleteGoal: (id: string) => void;
  deleteTask: (id: string) => void;
  postponeTask: (id: string) => void;
  deleteHabit: (id: string) => void;
  reorderTasks: (id: string, direction: 'up' | 'down') => void;
  reorderHabits: (id: string, direction: 'up' | 'down') => void;
  reorderGoals: (id: string, direction: 'up' | 'down') => void;
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
  const [automations, setAutomations] = useState<Automation[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign-in error:", error);
      alert(`Sign in failed. If you are viewing this in an iframe/preview, try opening the app in a new tab. Error: ${error.message}`);
    }
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
      automations: `users/${user.uid}/automations`,
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

    const unsubAutomations = onSnapshot(query(collection(db, paths.automations), where('ownerId', '==', user.uid)), snap => {
      setAutomations(snap.docs.map(d => ({ ...d.data(), id: d.id } as Automation)));
    }, err => handleFirestoreError(err, OperationType.LIST, paths.automations));

    const unsubUserDoc = onSnapshot(doc(db, `users/${user.uid}`), snap => {
      if (snap.exists()) {
        const data = snap.data();
        
        // Merge history robustly in ALL cases so no local or remote transactions are ever lost!
        const serverHistory = data.timeBankHistory ?? [];
        const localHistory = JSON.parse(localStorage.getItem('timeBankHistory') || '[]');
        const mergedHistory = mergeHistories(localHistory, serverHistory);
        localStorage.setItem('timeBankHistory', JSON.stringify(mergedHistory));

        // If the client has pending writes or a write occurred in the last 4 seconds,
        // we do NOT overwrite local storage balance or metadata to avoid race conditions.
        const isRacing = snap.metadata.hasPendingWrites || (Date.now() - lastLocalWriteTime < 4000);
        
        let balance = parseInt(localStorage.getItem('timeBankBalance') || '45', 10);
        
        if (!isRacing) {
           if (data.timeBankBalance !== undefined) {
             balance = data.timeBankBalance;
             localStorage.setItem('timeBankBalance', balance.toString());
           }

           // Sync/restore temporal configuration parameters
           const metadataKeys = [
             'timeBankLastVisit',
             'timeBankWeekStart',
             'lastHabitDeductionCheck',
             'lastWeekendBonusCheck',
             'restorationProcessed_v2'
           ];
           metadataKeys.forEach(key => {
             if (data[key] !== undefined && data[key] !== null) {
               localStorage.setItem(key, data[key]);
             }
           });
        }

        window.dispatchEvent(new CustomEvent('timeBankUpdated', { detail: { balance, history: mergedHistory } }));
      }
    }, err => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    return () => {
      unsubGoals(); unsubTasks(); unsubHabits(); unsubReflections(); unsubFocusSessions(); unsubAutomations(); unsubUserDoc();
    };
  }, [user]);

  // General Daily Check-ins & Bonuses
  useEffect(() => {
    if (!user) return;
    
    try {
        const now = new Date();
        const todayStr = toLocalDateStr(now);
        const todayStringDate = now.toDateString();

        // 1. Week start check-in
        const getWeekStart = (d: Date) => {
          const date = new Date(d);
          date.setHours(0, 0, 0, 0);
          const day = date.getDay(); // Sunday is 0
          date.setDate(date.getDate() - day);
          return date.toDateString();
        };
        const currentWeekStart = getWeekStart(now);
        const lastWeekStart = localStorage.getItem('timeBankWeekStart');
        if (lastWeekStart !== currentWeekStart) {
          updateUserMetadata({ timeBankWeekStart: currentWeekStart });
        }

        // 2. Daily Login Bonus check-in
        const lastVisit = localStorage.getItem('timeBankLastVisit');
        let shouldAddDaily = false;
        if (lastVisit) {
          if (lastVisit !== todayStringDate) {
            shouldAddDaily = true;
          }
        } else {
          shouldAddDaily = true;
        }

        if (lastVisit !== todayStringDate) {
          updateUserMetadata({ timeBankLastVisit: todayStringDate });
        }

        if (shouldAddDaily) {
           addTimeBankBalance(10, "Daily Login Bonus");
        }

        // 3. One-time restoration check-in
        const hasProcessedRestoration = localStorage.getItem('restorationProcessed_v2');
        if (!hasProcessedRestoration) {
           addTimeBankBalance(100, "Restoration of Erroneous Deductions (System Fix)");
           updateUserMetadata({ restorationProcessed_v2: "true" });
        }

        // 4. Weekend logic: extra 120 minutes for Saturday or Sunday
        const lastWeekendCheck = localStorage.getItem('lastWeekendBonusCheck');
        if (lastWeekendCheck !== todayStr) {
            if (now.getDay() === 0 || now.getDay() === 6) {
               addTimeBankBalance(120, `Weekend Holiday Bonus`);
            }
            updateUserMetadata({ lastWeekendBonusCheck: todayStr });
        }
    } catch(e) {
       console.warn('Could not process general temporal rules', e);
    }
  }, [user]);

  // Daily rules for TimeBank (auto-deducting missed habits)
  useEffect(() => {
    if (!user || habits.length === 0) return;
    
    try {
        const lastCheck = localStorage.getItem('lastHabitDeductionCheck');
        const now = new Date();
        const todayStr = toLocalDateStr(now);

        if (lastCheck !== todayStr) {
            // First time ever? Don't deduct.
            if (lastCheck !== null) {
              let missedCount = 0;
              const yesterdayDate = new Date(now);
              yesterdayDate.setDate(yesterdayDate.getDate() - 1);
              const yStr = toLocalDateStr(yesterdayDate);

              habits.forEach(h => {
                 if (!h.completedHistory || !h.completedHistory[yStr]) {
                     missedCount++;
                 }
              });

              if (missedCount > 0) {
                 const penalty = Math.min(10, missedCount * 2);
                 addTimeBankBalance(-penalty, `Missed habits deduction (${missedCount} missed, capped at -${penalty})`);
              }
            }
            
            updateUserMetadata({ lastHabitDeductionCheck: todayStr });
        }
    } catch(e) {
       console.warn('Could not process habit missed rules', e);
    }
  }, [user, habits]);

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
    
    // Check for duplicate uncompleted goal of the same type
    const existingGoal = goals.find(x => 
      !x.completed && 
      x.title.toLowerCase().trim() === g.title.toLowerCase().trim() && 
      x.type === g.type
    );
    
    if (existingGoal) {
      return existingGoal.id;
    }

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
    
    // Also remove any other undefined fields thoroughly (deeply) to prevent setDoc errors
    const deepClean = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(deepClean).filter(v => v !== undefined);
      } else if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, val] of Object.entries(obj)) {
          if (val !== undefined) {
             cleaned[key] = deepClean(val);
          }
        }
        return cleaned;
      }
      return obj;
    };
    
    const cleanedData = deepClean(data);
    
    try { await setDoc(docRef, cleanedData); } catch(e) { handleFirestoreError(e, OperationType.CREATE, docRef.path); }
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
  
  const bulkAddGoalSubtasks = async (goalId: string, subtasksToAdd: any[], parentSubtaskId?: string) => {
    if (!user) return;
    const g = goals.find(x => x.id === goalId);
    if (!g) return;
    const newSubs = subtasksToAdd.map(item => typeof item === 'string' ? { id: Math.random().toString(36).substr(2, 9), title: item, completed: false } : item);
    
    let subtasks = g.subtasks || [];
    let added = false;
    
    if (parentSubtaskId) {
        const addRecursive = (subs: any[]): any[] => {
            return subs.map(s => {
                if (s.id === parentSubtaskId) {
                    added = true;
                    return { ...s, subtasks: [...(s.subtasks || []), ...newSubs] };
                }
                if (s.subtasks) {
                    return { ...s, subtasks: addRecursive(s.subtasks) };
                }
                return s;
            });
        };
        subtasks = addRecursive(subtasks);
    }
    
    if (!added) {
        subtasks = [...subtasks, ...newSubs];
    }
    
    const countCompleted = (subs: any[]): { c: number, t: number } => {
       let c = 0, t = 0;
       for (const s of subs) {
          t++;
          if (s.completed) c++;
          if (s.subtasks) {
             const inner = countCompleted(s.subtasks);
             c += inner.c; t += inner.t;
          }
       }
       return { c, t };
    };
    const stats = countCompleted(subtasks);
    const progress = stats.t === 0 ? 0 : Math.round((stats.c / stats.t) * 100);
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    try { await updateDoc(docRef, { subtasks, progress }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const addGoalChildSubtask = async (goalId: string, parentSubtaskId: string, title: string) => {
    if (!user) return;
    const g = goals.find(x => x.id === goalId);
    if (!g) return;

    const addRecursive = (subs: any[]): any[] => {
      return subs.map(s => {
        if (s.id === parentSubtaskId) {
           return { ...s, subtasks: [...(s.subtasks || []), { id: Math.random().toString(36).substr(2, 9), title, completed: false }] };
        }
        if (s.subtasks) return { ...s, subtasks: addRecursive(s.subtasks) };
        return s;
      });
    };

    const subtasks = addRecursive(g.subtasks || []);
    
    const countCompleted = (subs: any[]): { c: number, t: number } => {
       let c = 0, t = 0;
       for (const s of subs) {
           t++;
           if (s.completed) c++;
           if (s.subtasks) {
              const inner = countCompleted(s.subtasks);
              c += inner.c; t += inner.t;
           }
       }
       return { c, t };
    };

    const stats = countCompleted(subtasks);
    const progress = stats.t === 0 ? 0 : Math.round((stats.c / stats.t) * 100);
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    try { await updateDoc(docRef, { subtasks, progress }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const addTaskChildSubtask = async (taskId: string, parentSubtaskId: string, title: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;

    const addRecursive = (subs: any[]): any[] => {
      return subs.map(s => {
        if (s.id === parentSubtaskId) {
           return { ...s, subtasks: [...(s.subtasks || []), { id: Math.random().toString(36).substr(2, 9), title, completed: false }] };
        }
        if (s.subtasks) return { ...s, subtasks: addRecursive(s.subtasks) };
        return s;
      });
    };

    const subtasks = addRecursive(t.subtasks || []);
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, { subtasks }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const toggleSubtask = async (goalId: string, subtaskId: string) => {
    if (!user) return;
    const g = goals.find(x => x.id === goalId);
    if (!g) return;

    const toggleRecursive = (subs: any[]): any[] => {
      return subs.map(s => {
        if (s.id === subtaskId) return { ...s, completed: !s.completed };
        if (s.subtasks) return { ...s, subtasks: toggleRecursive(s.subtasks) };
        return s;
      });
    };

    const subtasks = toggleRecursive(g.subtasks || []);
    
    // Calculate total progress: count all completed vs total for all subtasks
    const countCompleted = (subs: any[]): { c: number, t: number } => {
       let c = 0, t = 0;
       for (const s of subs) {
           t++;
           if (s.completed) c++;
           if (s.subtasks) {
              const inner = countCompleted(s.subtasks);
              c += inner.c; t += inner.t;
           }
       }
       return { c, t };
    };
    
    const stats = countCompleted(subtasks);
    const progress = stats.t === 0 ? 0 : Math.round((stats.c / stats.t) * 100);
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    try { await updateDoc(docRef, { subtasks, progress, completed: progress === 100 }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const updateGoal = async (goalId: string, updates: any) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    const deepClean = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(deepClean).filter(v => v !== undefined);
      if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, val] of Object.entries(obj)) if (val !== undefined) cleaned[key] = deepClean(val);
        return cleaned;
      }
      return obj;
    };
    try { await updateDoc(docRef, deepClean(updates)); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const updateGoalSubtask = async (goalId: string, subtaskId: string, title: string) => {
    if (!user) return;
    const g = goals.find(x => x.id === goalId);
    if (!g) return;

    const updateRecursive = (subs: any[]): any[] => {
      return subs.map(s => {
        if (s.id === subtaskId) return { ...s, title };
        if (s.subtasks) return { ...s, subtasks: updateRecursive(s.subtasks) };
        return s;
      });
    };

    const subtasks = updateRecursive(g.subtasks || []);
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    try { await updateDoc(docRef, { subtasks }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const deleteSubtask = async (goalId: string, subtaskId: string) => {
    if (!user) return;
    const g = goals.find(x => x.id === goalId);
    if (!g) return;

    const deleteRecursive = (subs: any[]): any[] => {
      return subs.filter(s => s.id !== subtaskId).map(s => {
        if (s.subtasks) return { ...s, subtasks: deleteRecursive(s.subtasks) };
        return s;
      });
    };

    const subtasks = deleteRecursive(g.subtasks || []);
    
    const countCompleted = (subs: any[]): { c: number, t: number } => {
       let c = 0, t = 0;
       for (const s of subs) {
           t++;
           if (s.completed) c++;
           if (s.subtasks) {
              const inner = countCompleted(s.subtasks);
              c += inner.c; t += inner.t;
           }
       }
       return { c, t };
    };

    const stats = countCompleted(subtasks);
    const progress = stats.t === 0 ? g.progress : Math.round((stats.c / stats.t) * 100);
    const docRef = doc(db, `users/${user.uid}/goals`, goalId);
    try { await updateDoc(docRef, { subtasks, progress }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const addTask = async (t: any): Promise<string | undefined> => {
    if (!user) return undefined;
    
    // Check for duplicate uncompleted task on the same date
    const existingTask = tasks.find(x => 
      !x.completed && 
      x.title.toLowerCase().trim() === t.title.toLowerCase().trim() && 
      (t.date ? x.date === t.date : true)
    );
    
    if (existingTask) {
      return existingTask.id;
    }

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
    if (t.fromGoalId) data.fromGoalId = t.fromGoalId;
    if (t.fromSubtaskId) data.fromSubtaskId = t.fromSubtaskId;
    if (t.isYearlyOrigin !== undefined) data.isYearlyOrigin = t.isYearlyOrigin;
    
    const deepClean = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(deepClean).filter(v => v !== undefined);
      } else if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, val] of Object.entries(obj)) {
          if (val !== undefined) {
             cleaned[key] = deepClean(val);
          }
        }
        return cleaned;
      }
      return obj;
    };
    
    const cleanedData = deepClean(data);
    
    try { await setDoc(docRef, cleanedData); } catch(e) { handleFirestoreError(e, OperationType.CREATE, docRef.path); }
    return id;
  };

  const updateTask = async (taskId: string, updates: any) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    const deepClean = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(deepClean).filter(v => v !== undefined);
      if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, val] of Object.entries(obj)) if (val !== undefined) cleaned[key] = deepClean(val);
        return cleaned;
      }
      return obj;
    };
    try { await updateDoc(docRef, deepClean(updates)); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const addTaskSubtask = async (taskId: string, title: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const newSub = { id: Math.random().toString(36).substr(2, 9), title, completed: false };
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, { subtasks: [...t.subtasks, newSub] }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const bulkAddTaskSubtasks = async (taskId: string, subtasksToAdd: any[]) => {
    if (!user) return;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const newSubs = subtasksToAdd.map(item => typeof item === 'string' ? { id: Math.random().toString(36).substr(2, 9), title: item, completed: false } : item);
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, { subtasks: [...t.subtasks, ...newSubs] }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const toggleTaskSubtask = async (taskId: string, subtaskId: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    
    const toggleRecursive = (subs: any[]): any[] => {
      return subs.map(s => {
        if (s.id === subtaskId) return { ...s, completed: !s.completed };
        if (s.subtasks) return { ...s, subtasks: toggleRecursive(s.subtasks) };
        return s;
      });
    };
    
    const subtasks = toggleRecursive(t.subtasks || []);
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, { subtasks }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const updateTaskSubtask = async (taskId: string, subtaskId: string, title: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;

    const updateRecursive = (subs: any[]): any[] => {
      return subs.map(s => {
        if (s.id === subtaskId) return { ...s, title };
        if (s.subtasks) return { ...s, subtasks: updateRecursive(s.subtasks) };
        return s;
      });
    };

    const subtasks = updateRecursive(t.subtasks || []);
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, { subtasks }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const deleteTaskSubtask = async (taskId: string, subtaskId: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;

    const deleteRecursive = (subs: any[]): any[] => {
      return subs.filter(s => s.id !== subtaskId).map(s => {
        if (s.subtasks) return { ...s, subtasks: deleteRecursive(s.subtasks) };
        return s;
      });
    };

    const subtasks = deleteRecursive(t.subtasks || []);
    const docRef = doc(db, `users/${user.uid}/tasks`, taskId);
    try { await updateDoc(docRef, { subtasks }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const addHabit = async (title: string, frequency: string = 'daily') => {
    if (!user) return;
    const existingHabit = habits.find(x => x.title.toLowerCase().trim() === title.toLowerCase().trim());
    if (existingHabit) return;
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
    const isNowCompleted = !g.completed;
    const docRef = doc(db, `users/${user.uid}/goals`, id);
    try { 
      await updateDoc(docRef, { completed: isNowCompleted, progress: isNowCompleted ? 100 : 0 }); 
      if (isNowCompleted) {
        const isYearlyOrigin = g.type === 'yearly' || g.isYearlyOrigin;

        if (isYearlyOrigin) {
          addTimeBankBalance(30, `Completed Goal: ${g.title}`);
        } else {
          if (g.priority === 'A') addTimeBankBalance(15, `Completed Priority A Goal: ${g.title}`);
          else if (g.priority === 'B') addTimeBankBalance(10, `Completed Priority B Goal: ${g.title}`);
          else if (g.priority === 'C') addTimeBankBalance(5, `Completed Priority C Goal: ${g.title}`);
          else addTimeBankBalance(2, `Completed Goal: ${g.title}`);
        }

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#ffffff']
        });
      }
    } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const toggleTask = async (id: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const isNowCompleted = !t.completed;
    const docRef = doc(db, `users/${user.uid}/tasks`, id);
    try {
      await updateDoc(docRef, { completed: isNowCompleted });
      if (isNowCompleted) {
        if (t.isYearlyOrigin) {
          addTimeBankBalance(30, `Completed Yearly Goal Task: ${t.title}`);
        } else {
          if (t.priority === 'A') addTimeBankBalance(15, `Completed Priority A task: ${t.title}`);
          else if (t.priority === 'B') addTimeBankBalance(10, `Completed Priority B task: ${t.title}`);
          else if (t.priority === 'C') addTimeBankBalance(5, `Completed Priority C task: ${t.title}`);
          else addTimeBankBalance(2, `Completed task: ${t.title}`);
        }

        confetti({
          particleCount: 100,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#3b82f6', '#ffffff']
        });
      }
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
    const isNowCompleted = !h.completedHistory[date];
    const docRef = doc(db, `users/${user.uid}/habits`, id);

    const nowLocalDate = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const getSunday = (dStr: string) => {
      const d = new Date(dStr + 'T12:00:00');
      const day = d.getDay(); // 0 is Sunday
      return new Date(d.setDate(d.getDate() - day)).toISOString().split('T')[0];
    };
    const isCurrentWeek = getSunday(date) === getSunday(nowLocalDate);

    try { 
        await updateDoc(docRef, { completedHistory: { ...h.completedHistory, [date]: isNowCompleted } }); 
        
        if (isCurrentWeek) {
            if (isNowCompleted) {
                addTimeBankBalance(5, `Completed Habit: ${h.title}`);
                const allHabitsCompleted = habits.every(habit => {
                  if (habit.id === id) return true;
                  return habit.completedHistory[date];
                });
                if (allHabitsCompleted && habits.length > 0) {
                   addTimeBankBalance(20, `Daily Habits Bonus`);
                }
            } else {
                addTimeBankBalance(-5, `Undo Habit: ${h.title}`);
                const wasAllHabitsCompleted = habits.every(habit => {
                  if (habit.id === id) return true;
                  return habit.completedHistory[date];
                });
                if (wasAllHabitsCompleted && habits.length > 0) {
                   addTimeBankBalance(-20, `Lost Daily Habits Bonus`);
                }
            }
        }
    } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
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
    try { await updateDoc(docRef, { date: toLocalDateStr(d) }); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const deleteHabit = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/habits`, id);
    try { await deleteDoc(docRef); } catch(e) { handleFirestoreError(e, OperationType.DELETE, docRef.path); }
  };

  const addAutomation = async (auto: Omit<Automation, 'id' | 'createdAt' | 'ownerId'>): Promise<void> => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const docRef = doc(db, `users/${user.uid}/automations`, id);
    const data: any = {
      ...auto,
      createdAt: new Date().toISOString(),
      ownerId: user.uid
    };
    try { await setDoc(docRef, data); } catch(e) { handleFirestoreError(e, OperationType.CREATE, docRef.path); }
  };

  const updateAutomation = async (id: string, updates: any): Promise<void> => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/automations`, id);
    try { await updateDoc(docRef, updates); } catch(e) { handleFirestoreError(e, OperationType.UPDATE, docRef.path); }
  };

  const deleteAutomation = async (id: string): Promise<void> => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/automations`, id);
    try { await deleteDoc(docRef); } catch(e) { handleFirestoreError(e, OperationType.DELETE, docRef.path); }
  };

  const addReflection = async (text: string) => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const date = new Date().toISOString();
    const docRef = doc(db, `users/${user.uid}/reflections`, id);
    try {
      await setDoc(docRef, { text, date, ownerId: user.uid });
      addTimeBankBalance(10, `Daily Reflection`);
      const aiInsight = await getReflectionInsight(text);
      await updateDoc(docRef, { aiInsight });
    } catch(e) { handleFirestoreError(e, OperationType.CREATE, docRef.path); }
  };

  const smartPrioritizeTasks = async () => {
    if (!user) return;
    try {
      const today = toLocalDateStr();
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

  const moveOrder = async (collectionName: string, items: any[], id: string, direction: 'up'|'down') => {
    if (!user) return;
    
    // Sort all items uniformly
    const sorted = [...items].sort((a,b) => (a.order || 0) - (b.order || 0));
    const index = sorted.findIndex(item => item.id === id);
    if (index === -1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    
    // Swap items in memory
    const temp = sorted[index];
    sorted[index] = sorted[targetIndex];
    sorted[targetIndex] = temp;
    
    const batch = writeBatch(db);
    sorted.forEach((item, i) => {
      batch.update(doc(db, `users/${user.uid}/${collectionName}`, item.id), { order: i });
    });
    try { await batch.commit(); } catch(e) { console.error(`Move order failed for ${collectionName}`, e); }
  };

  const reorderTasks = async (id: string, direction: 'up' | 'down') => moveOrder('tasks', tasks.filter(t => !t.completed), id, direction);
  const reorderGoals = async (id: string, direction: 'up' | 'down') => moveOrder('goals', goals.filter(g => !g.completed), id, direction);
  const reorderHabits = async (id: string, direction: 'up' | 'down') => moveOrder('habits', habits, id, direction);

  return (
    <HubContext.Provider value={{ 
      user, signIn, signOut: signOutUser,
      goals, tasks, habits, selectedMood, setSelectedMood, reflections, addReflection,
      focusTaskId, setFocusTaskId, focusSessions, addFocusSession, smartPrioritizeTasks,
      automations, addAutomation, updateAutomation, deleteAutomation,
      addGoal, addSubtask, bulkAddGoalSubtasks, toggleSubtask, updateGoal, deleteSubtask, updateGoalSubtask, addGoalChildSubtask,
      addTask, updateTask, addTaskSubtask, bulkAddTaskSubtasks, toggleTaskSubtask, deleteTaskSubtask, updateTaskSubtask, addTaskChildSubtask,
      addHabit, updateHabit,
      toggleGoal, toggleTask, toggleHabit,
      deleteGoal, deleteTask, postponeTask, deleteHabit, reorderTasks, reorderHabits, reorderGoals
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

