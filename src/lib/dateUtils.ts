export const toLocalDateStr = (d: Date = new Date()) => {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

export const getCountdownText = (type: string, targetDateStr?: string) => {
  const now = new Date();
  if (type === 'yearly') {
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    const days = Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  } else if (type === 'monthly') {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const days = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  } else if (type === 'weekly') {
    const day = now.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day; // 0 is Sunday
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday, 23, 59, 59);
    const days = Math.ceil((endOfWeek.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  } else if (type === 'daily' || type === 'one-off') {
    let taskEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    if (targetDateStr) {
      taskEnd = new Date(targetDateStr + "T23:59:59");
    }
    const diff = taskEnd.getTime() - now.getTime();
    if (diff < 0) return "Overdue";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  }
  return "";
};
