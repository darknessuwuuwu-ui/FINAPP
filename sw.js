// FINAPP: funciona sin conexión. Solo guarda archivos de la propia app;
// las consultas a elTOQUE (otro dominio) nunca se interceptan ni se guardan.
var CACHE = 'finapp-v1';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'favicon-32.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;          // elTOQUE y demás: directo a la red
  // Primero la red (para recibir actualizaciones); si no hay internet, lo guardado.
  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){ return hit || caches.match('index.html'); });
    })
  );
});
