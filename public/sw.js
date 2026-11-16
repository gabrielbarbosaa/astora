// Service worker do Astora: deixa o site instalável e acelera visitas repetidas.
// - Páginas: rede primeiro (sempre a versão nova), com cache como reserva offline.
// - /assets (arquivos com hash no nome) e /textures: cache primeiro.
// - Requisições para outros domínios (APIs) não são tocadas.
// Para forçar a atualização das texturas, mude VERSION.
const VERSION = 'astora-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        (await caches.open(VERSION)).put(req, res.clone());
        return res;
      } catch {
        return (await caches.match(req)) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  if (/\/(assets|textures|icons)\//.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    })());
  }
});
