// Empty service worker for mobile notifications
self.addEventListener('push', function(event) {
    // Basic push handler
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
            } else {
                // @ts-ignore
                clients.openWindow('/');
            }
        })
    );
});
