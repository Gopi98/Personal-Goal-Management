export const toLocalDateStr = (d: Date = new Date()) => {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};
