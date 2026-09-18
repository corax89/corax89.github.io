/* coi-serviceworker.js — cross-origin isolation для статического хостинга.
 *
 * Ядру nojme нужен SharedArrayBuffer (Java-потоки Thread.start() как
 * настоящие воркеры), а браузер даёт его только на изолированных страницах
 * (COOP: same-origin + COEP: require-corp). Не каждый хостинг позволяет
 * выставить заголовки, поэтому service worker добавляет их сам — при
 * первом заходе страница перезагружается один раз.
 *
 * Если страница уже изолирована (или SW не поддерживается) — ничего не делает.
 * Навязать reload повторно не пытается (семафор в sessionStorage).
 */
'use strict';
(function () {
    if (typeof SharedArrayBuffer !== 'undefined' && window.crossOriginIsolated) return;

    // уже пробовали — не зацикливаемся
    if (sessionStorage.getItem('coi-reloaded') === '1') {
        window.coiSwFailed = true;
        return;
    }
    if (!('serviceWorker' in navigator)) { window.coiSwFailed = true; return; }

    const SW_SOURCE = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
    const r = e.request;
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;
    e.respondWith(
        fetch(r).then((resp) => {
            const headers = new Headers(resp.headers);
            const type = resp.type || 'basic';
            if (type === 'basic' || type === 'default' || type === 'cors') {
                // документу — изоляцию, ресурсам — явный CORP
                if ((r.mode === 'navigate') || (resp.headers.get('content-type') || '').includes('text/html')) {
                    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
                    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
                } else if (!headers.has('Cross-Origin-Resource-Policy')) {
                    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
                }
            }
            return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: headers });
        }).catch(() => new Response('offline', { status: 503 }))
    );
});
`;

    const url = URL.createObjectURL(new Blob([SW_SOURCE], { type: 'text/javascript' }));
    navigator.serviceWorker.register(url, { scope: './' }).then((reg) => {
        reg.addEventListener('updatefound', () => sessionStorage.setItem('coi-reloaded', '1'));
        // после активации SW страница должна перезагрузиться под его контроль
        sessionStorage.setItem('coi-reloaded', '1');
        setTimeout(() => location.reload(), 350);
    }).catch(() => { window.coiSwFailed = true; });
})();
