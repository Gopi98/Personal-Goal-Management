export const pushNotification = (title: string, body: string) => {
  if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico" });
    } catch (e) {
      console.warn("System notification failed, attempting Service Worker fallback:", e);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            // @ts-ignore
            reg.showNotification(title, { body, icon: "/favicon.ico", vibrate: [400, 150, 400, 150, 400] });
          } else {
            navigator.serviceWorker.register('/sw.js').then(newReg => {
              // @ts-ignore
              newReg.showNotification(title, { body, icon: "/favicon.ico", vibrate: [400, 150, 400, 150, 400] });
            });
          }
        }).catch(err => console.warn("SW notification failed:", err));
      }
    }
  }
  window.dispatchEvent(new CustomEvent('app-notification', { detail: { title, body } }));
};

export const scheduleBackgroundNotification = async (title: string, body: string, targetTimeMs: number, tag: string) => {
  if ('serviceWorker' in navigator && typeof Notification !== 'undefined' && Notification.permission === "granted") {
    try {
      const reg = await navigator.serviceWorker.ready;
      // experimental Notification Triggers API for Android Chrome
      if ('showTrigger' in Notification.prototype) {
        await reg.showNotification(title, {
          body,
          tag,
          icon: "/favicon.ico",
          // @ts-ignore: vibrate is widely supported but sometimes missing from standard TS DOM lib
          vibrate: [400, 150, 400, 150, 400],
          // @ts-ignore
          showTrigger: new (window as any).TimestampTrigger(targetTimeMs)
        });
        console.log(`Scheduled background notification '${tag}' for ${new Date(targetTimeMs).toLocaleTimeString()}`);
        return true;
      }
    } catch (e) {
      console.warn("Failed to schedule background notification", e);
    }
  }
  return false;
};

export const cancelBackgroundNotification = async (tag: string) => {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const notifications = await reg.getNotifications({ tag, includeTriggered: true } as any);
      notifications.forEach(n => n.close());
      console.log(`Canceled background notification '${tag}'`);
    } catch (e) {
       console.warn("Failed to cancel background notification", e);
    }
  }
};

