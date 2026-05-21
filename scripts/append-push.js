import fs from 'fs';
import path from 'path';

const swPath = path.join(process.cwd(), 'dist', 'sw.js');
if (fs.existsSync(swPath)) {
  const customCode = `
// Append custom mobile push registration support 
self.addEventListener('push', function(event) {
    let data = { title: 'Drive OS Reminder', body: 'Goal or task schedule triggered' };
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        data = { title: 'Drive OS Reminder', body: event.data ? event.data.text() : 'Goal or task schedule triggered' };
    }
    const options = {
        body: data.body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200, 100, 200],
        data: data.data || {}
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            if (windowClients.length > 0) {
                windowClients[0].focus();
            } else {
                clients.openWindow('/');
            }
        })
    );
});
`;
  fs.appendFileSync(swPath, customCode, 'utf-8');
  console.log('Successfully appended custom Web Push handlers to dist/sw.js');
} else {
  console.warn('Service worker dist/sw.js was not found during append script execution. Is VitePWA active?');
}
