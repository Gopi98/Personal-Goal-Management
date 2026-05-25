// Service worker for mobile background notifications
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
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    // @ts-ignore
    event.notification.close();
    // @ts-ignore
    event.waitUntil(
        // @ts-ignore
        clients.matchAll({ type: 'window' }).then(windowClients => {
            if (windowClients.length > 0) {
                windowClients[0].focus();
                // Send view navigation signal to React client
                windowClients[0].postMessage({ type: 'NAVIGATE_VIEW', view: 'vault' });
            } else {
                // @ts-ignore
                clients.openWindow('/?view=vault');
            }
        })
    );
});

