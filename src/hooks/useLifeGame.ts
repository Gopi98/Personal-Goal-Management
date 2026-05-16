import { useHub } from '../lib/HubContext';
import { toLocalDateStr } from '../lib/dateUtils';

export function useLifeGame() {
  const { tasks, habits, goals } = useHub();

  const todayStr = toLocalDateStr();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toLocalDateStr(yesterdayDate);
  const twoDaysAgoDate = new Date();
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const twoDaysAgoStr = toLocalDateStr(twoDaysAgoDate);

  // Storm Logic & Unfulfilled Habits
  let isStormActive = false;
  let stormReason = "";
  let unfulfilledHabit = "";

  for (const habit of habits) {
    const isCompletedToday = !!habit.completedHistory[todayStr];
    if (!isCompletedToday) {
      if (habit.title.toLowerCase().includes('wake') || habit.title.toLowerCase().includes('6am') || habit.title.toLowerCase().includes('6 am')) {
        isStormActive = true;
        stormReason = habit.title;
        unfulfilledHabit = habit.title;
        break;
      }
    }
  }

  // Fallback: Use yesterday's uncompleted if we need a storm condition
  if (!isStormActive) {
    for (const habit of habits) {
      if (!habit.completedHistory[yesterdayStr] && !habit.completedHistory[todayStr]) {
        unfulfilledHabit = habit.title;
      }
    }
  }

  // Tree Logic / Health
  let vitalityScore = 100;
  if (habits.length > 0) {
    const totalToday = habits.filter(h => !!h.completedHistory[todayStr]).length;
    vitalityScore = Math.floor((totalToday / habits.length) * 100);
  } else {
    vitalityScore = 85; 
  }

  // Mastery Logic
  const completedTasks = tasks.filter(t => t.completed);
  let masteryScore = 68; // Default
  if (tasks.length > 0) {
    masteryScore = Math.floor((completedTasks.length / tasks.length) * 100);
  }

  // Dummy values for Intellect and Wealth, maybe tied to Focus time and subtasks in the future
  const intellectScore = 50;
  const wealthScore = 100;

  // Active Quest
  const pendingA = tasks.find(t => !t.completed && t.priority === 'A');
  const activeMainQuest = pendingA ? pendingA.title : "Optimize Destiny Pipelines";

  // Real XP Mechanics
  const completedGoals = goals?.filter(g => g.completed) || [];
  const totalHabitCompletions = habits.reduce((acc, h) => acc + Object.values(h.completedHistory).filter(Boolean).length, 0);
  
  // Weights setup according to new priority
  const GOAL_XP = 500;
  const TASK_XP = 50;
  const HABIT_XP = 10;

  const currentXP = (completedGoals.length * GOAL_XP) + (completedTasks.length * TASK_XP) + (totalHabitCompletions * HABIT_XP); 
  const currentLevel = Math.max(1, Math.floor(currentXP / 300) + 1);
  const xpForNextLevel = currentLevel * 300;
  const levelProgress = Math.floor(((currentXP % 300) / 300) * 100);

  // The Oracle Engine
  const generateOracleMessage = () => {
    if (isStormActive && stormReason) {
      return `The sky darkens. Execute your \`${stormReason}\` habit today to banish the storm.`;
    }
    if (unfulfilledHabit && !isStormActive) {
      return `Consistency restored. But do not forget your \`${unfulfilledHabit}\` habit to maintain balance.`;
    }
    if (completedGoals.length > 0) {
      return `A monumental achievement. You have conquered major Goals, earning great power.`;
    }
    return `Consistency restored. Gurpreet, your discipline fuels the clearing of your Plot.`;
  };

  const oracleBannerMessage = generateOracleMessage();

  return {
    habits,
    tasks,
    goals,
    stats: {
      vitality: vitalityScore,
      intellect: intellectScore,
      wealth: wealthScore,
      mastery: masteryScore
    },
    isStormActive,
    stormReason,
    activeMainQuest,
    currentXP,
    currentLevel,
    levelProgress,
    xpForNextLevel,
    oracleBannerMessage,
  };
}
