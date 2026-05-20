export const pushNotification = (title: string, body: string) => {
  if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico" });
    } catch (e) {
      console.warn("System notification failed, attempting Service Worker fallback:", e);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.showNotification(title, { body, icon: "/favicon.ico" });
          } else {
            navigator.serviceWorker.register('/sw.js').then(newReg => {
              newReg.showNotification(title, { body, icon: "/favicon.ico" });
            });
          }
        }).catch(err => console.warn("SW notification failed:", err));
      }
    }
  }
  window.dispatchEvent(new CustomEvent('app-notification', { detail: { title, body } }));
};
