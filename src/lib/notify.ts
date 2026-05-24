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
  let localScheduled = false;
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
        localScheduled = true;
      }
    } catch (e) {
      console.warn("Failed to schedule background notification", e);
    }
  }

  // Fallback to Server-Side Web Push (ensures reliable mobile background delivery even when device sleeps/ignores triggers)
  try {
    const { auth } = await import('./firebase');
    const userId = auth.currentUser?.uid;
    if (userId) {
      const response = await fetch('/api/notifications/schedule-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timerId: tag, userId, title, body, targetTimeMs })
      });
      if (response.ok) {
        console.log(`Scheduled server-side fallback timer push for tag: ${tag}`);
      }
    }
  } catch (err) {
    console.warn("Server notification timer scheduling failed:", err);
  }

  return localScheduled;
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

  try {
    const { auth } = await import('./firebase');
    const userId = auth.currentUser?.uid;
    if (userId) {
      await fetch('/api/notifications/cancel-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timerId: tag, userId })
      });
      console.log(`Canceled server-side fallback timer push for tag: ${tag}`);
    }
  } catch (err) {
    console.warn("Server notification timer cancellation failed:", err);
  }
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToWebPush = async (): Promise<any> => {
  if (!('serviceWorker' in navigator) || typeof Notification === 'undefined') {
    throw new Error('Push notifications are not supported on this browser/environment.');
  }

  // Request system permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied.');
  }

  // Ensure active service worker registration is available
  // Fallback to manual registration if not ready
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    reg = await navigator.serviceWorker.register('/sw.js');
  }
  
  await navigator.serviceWorker.ready;

  // Retrieve the public key from our server
  const res = await fetch('/api/notifications/vapid-key');
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Failed to retrieve the server push configuration. Status: ' + res.status + ' - ' + text.substring(0, 100));
  }
  const { publicKey } = await res.json();

  // Subscribe to Push Service
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });

  return subscription;
};

export const syncPushNotifications = async (
  userId: string,
  subscription: any,
  reminders: any[]
) => {
  try {
    const timezoneOffset = new Date().getTimezoneOffset();
    const response = await fetch('/api/notifications/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        timezoneOffset,
        subscription,
        reminders
      })
    });
    if (!response.ok) {
      console.warn('Backend sync failed:', await response.text());
    } else {
      console.log('Mobile push reminders synchronized with cloud server.');
    }
  } catch (error) {
    console.warn('Network error while syncing push notifications:', error);
  }
};


