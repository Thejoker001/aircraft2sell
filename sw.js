/* Aircraft2Sell — Service Worker v2.0 */
var CACHE = 'a2s-v2';
var OFFLINE_URL = '/404.html';

/* Ressources pré-cachées au premier chargement */
var PRECACHE = [
  '/homepage.html',
  '/search.html',
  '/guide-acheteur.html',
  '/faq.html',
  '/legal.html',
  '/404.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600&display=swap'
];

/* Installation */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return Promise.allSettled(
        PRECACHE.map(function(url) {
          return cache.add(new Request(url, { mode: 'no-cors' })).catch(function(){});
        })
      );
    }).then(function() { return self.skipWaiting(); })
  );
});

/* Activation — nettoyage anciens caches */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

/* Fetch — stratégies adaptées par type de ressource */
self.addEventListener('fetch', function(e) {
  var req = e.request;

  /* Ignorer non-GET et APIs externes */
  if (req.method !== 'GET') return;
  if (req.url.includes('supabase.co')) return;
  if (req.url.includes('api.frankfurter')) return;
  if (req.url.includes('api.anthropic')) return;
  if (req.url.includes('brevo') || req.url.includes('sendinblue')) return;
  if (req.url.includes('wa.me')) return;
  if (req.url.includes('placehold.co')) return;

  /* Pages HTML — Network-first pour avoir contenu frais */
  if (req.destination === 'document') {
    e.respondWith(
      fetch(req).then(function(res) {
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function(cache) { cache.put(req, clone); });
        }
        return res;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  /* Polices Google Fonts — Cache-first (immuables) */
  if (req.url.includes('fonts.googleapis') || req.url.includes('fonts.gstatic')) {
    e.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(res) {
          var clone = res.clone();
          caches.open(CACHE).then(function(cache) { cache.put(req, clone); });
          return res;
        });
      })
    );
    return;
  }

  /* Images — Cache-first avec fallback réseau */
  if (req.destination === 'image') {
    e.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(res) {
          if (res.ok) {
            var clone = res.clone();
            caches.open(CACHE).then(function(cache) { cache.put(req, clone); });
          }
          return res;
        }).catch(function() { return new Response('', {status: 404}); });
      })
    );
    return;
  }

  /* Autres ressources — Network-first */
  e.respondWith(
    fetch(req).catch(function() { return caches.match(req); })
  );
});