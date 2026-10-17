/* π Trainer: offline werken.
   De app zelf (index.html) halen we eerst van internet, zodat iedereen meteen de nieuwste versie krijgt.
   Lukt dat niet (geen of slechte wifi), dan gebruiken we de bewaarde kopie. Spraak werkt offline niet. */
const CACHE = "pi-trainer-v3";
const BESTANDEN = ["./", "index.html", "pi-decimalenlijst.pdf", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-512-maskable.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(namen => Promise.all(namen.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    // Netwerk eerst, met een korte wachttijd; daarna de bewaarde versie
    e.respondWith(
      Promise.race([
        fetch(req).then(res => { const kopie = res.clone(); caches.open(CACHE).then(c => c.put("index.html", kopie)); return res; }),
        new Promise((_, nee) => setTimeout(() => nee(new Error("traag")), 4000))
      ]).catch(() => caches.match("index.html").then(r => r || caches.match("./")))
    );
    return;
  }
  // Andere bestanden (PDF, iconen): eerst uit de bewaarde kopie, anders van internet (en dan bewaren)
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok) { const kopie = res.clone(); caches.open(CACHE).then(c => c.put(req, kopie)); }
      return res;
    }))
  );
});
