/**
 * Service Worker Hors-Ligne — StockElec (CédricElec / LittoralElec)
 *
 * Stratégie :
 *  - Assets statiques (/_next/static/*, icônes, images) : Cache-First
 *  - Pages & Navigations (/depart-matin, /catalogue, etc.) : Network-First avec timeout court (3,5s)
 *    et repli immédiat sur le cache local si le téléphone est en sous-sol / zone blanche.
 *  - Synchronisation en arrière-plan : réveille les clients ouverts dès le retour du réseau.
 */

const CACHE_STATIC = "stockelec-static-v1";
const CACHE_PAGES = "stockelec-pages-v1";

const PRECACHE_URLS = [
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/images/cedricelec_bg.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_STATIC)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_STATIC && k !== CACHE_PAGES)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function fetchWithTimeout(request, timeoutMs = 3500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("NETWORK_TIMEOUT")), timeoutMs);
    fetch(request)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Ignorer les routes API dynamiques
  if (url.pathname.startsWith("/api/")) return;

  // 1. Fichiers statiques Next.js, images et icônes -> Cache-First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_STATIC).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // 2. Navigations HTML et requêtes RSC -> Network-First (timeout 3.5s) + Fallback Cache
  const isNavigation =
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html") ||
    request.headers.get("RSC") === "1";

  if (isNavigation) {
    event.respondWith(
      fetchWithTimeout(request, 3500)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_PAGES).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cachedExact = await caches.match(request);
          if (cachedExact) return cachedExact;

          // Recherche par chemin sans query string
          const cachedByPath = await caches.match(url.pathname);
          if (cachedByPath) return cachedByPath;

          // Dernier recours pour une navigation HTML : renvoyer /depart-matin ou / en cache
          if (request.mode === "navigate") {
            const fallbackDepart = await caches.match("/depart-matin");
            if (fallbackDepart) return fallbackDepart;
            const fallbackRoot = await caches.match("/");
            if (fallbackRoot) return fallbackRoot;
          }
          return new Response(
            "<!doctype html><html lang='fr'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>StockElec — Hors-Ligne</title><style>body{font-family:system-ui,sans-serif;background:#0b0f17;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100dvh;margin:0;padding:24px;text-align:center}.card{max-width:420px;background:#111622;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px}button{margin-top:16px;background:#2563eb;color:#fff;border:0;padding:12px 20px;border-radius:12px;font-weight:700;cursor:pointer}</style></head><body><div class='card'><h2>📡 Mode Hors-Ligne</h2><p>Ouvrez l'écran Départ Matin ou reconnectez-vous quelques secondes pour mettre en cache le catalogue.</p><button onclick='location.href=\"/depart-matin\"'>Ouvrir Départ Matin</button></div></body></html>",
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        })
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "stockelec-sync-outbox") {
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "STOCKELEC_TRIGGER_SYNC" });
        }
      })
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

