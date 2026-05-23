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
  fromGoalId?: string;
  fromSubtaskId?: string;
  notificationEnabled?: boolean;
  notificationTime?: string;
  notificationSchedule?: 'once' | 'daily' | 'weekly' | 'specific_days';
  notificationDays?: number[];
  notificationDate?: string;
  isYearlyOrigin?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  subtasks?: Subtask[];
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
  fromGoalId?: string;
  fromSubtaskId?: string;
  linkedHabitId?: string;
  notificationEnabled?: boolean;
  notificationTime?: string;
  notificationSchedule?: 'once' | 'daily' | 'weekly' | 'specific_days';
  notificationDays?: number[];
  notificationDate?: string;
  isYearlyOrigin?: boolean;
}

export interface Habit {
  id: string;
  title: string;
  frequency?: string;
  streak: number;
  completedHistory: Record<string, boolean>; // date string -> boolean
  order?: number;
  createdAt?: string;
  notificationEnabled?: boolean;
  notificationTime?: string;
  notificationSchedule?: 'once' | 'daily' | 'weekly' | 'specific_days';
  notificationDays?: number[];
  notificationDate?: string;
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

export interface Automation {
  id: string;
  sourceGoalId: string;
  targetType: 'weekly_goal' | 'daily_task';
  targetId?: string; 
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  itemsToMove: number;
  lastRunTimestamp?: number;
  isActive: boolean;
  createdAt: string;
  ownerId?: string;
}
