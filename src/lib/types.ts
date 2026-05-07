export interface Goal {
  id: string;
  title: string;
  type: 'yearly' | 'monthly' | 'weekly';
  priority: 'A' | 'B' | 'C' | 'D';
  completed: boolean;
  progress: number;
  subtasks: Subtask[];
  createdAt: string;
  parentGoalId?: string;
  parentGoalTitle?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  priority: 'A' | 'B' | 'C' | 'D';
  type?: 'one-off' | 'daily' | 'break';
  completed: boolean;
  tags?: string[];
  subtasks: Subtask[];
  order?: number;
  parentGoalTitle?: string;
  linkedHabitId?: string;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedHistory: Record<string, boolean>; // date string -> boolean
}

export interface FocusSession {
  id: string;
  taskId?: string;
  duration: number; // in minutes
  date: string;
  type: 'work' | 'break';
}

export interface Reflection {
  id: string;
  text: string;
  date: string;
  aiInsight?: string;
}
