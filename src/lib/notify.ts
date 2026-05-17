export const pushNotification = (title: string, body: string) => {
  if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico" });
    } catch (e) {
      console.warn("System notification failed:", e);
    }
  }
  window.dispatchEvent(new CustomEvent('app-notification', { detail: { title, body } }));
};
