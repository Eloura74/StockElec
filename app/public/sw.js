/**
 * Service Worker Hors-Ligne — StockElec (CédricElec / LittoralElec)
 *
 * Règles strictes :
 *  1. Ne JAMAIS couper une requête réseau avec un timeout court quand l'utilisateur est connecté
 *     (les requêtes serveur avec 13 000+ articles ou un cold-start Vercel peuvent prendre > 4s).
 *  2. Ne JAMAIS intercepter les requêtes internes Next.js RSC (`RSC: 1`, `_rsc=`) pour éviter
 *     de renvoyer du HTML à la place d'un flux RSC lors d'un changement d'onglet.
 *  3. Utiliser le cache de secours UNIQUEMENT en cas de vraie coupure réseau (`fetch` rejeté).
 */

const CACHE_STATIC = "stockelec-static-v2";
const CACHE_PAGES = "stockelec-pages-v2";

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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Ignorer toutes les routes API et les requêtes RSC / prefetch internes de Next.js
  if (
    url.pathname.startsWith("/api/") ||
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1"
  ) {
    return;
  }

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

  // 2. Navigations de page complètes (mode === "navigate") -> Réseau d'abord sans timeout agressif,
  //    repli sur le cache UNIQUEMENT si le réseau est réellement coupé.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_PAGES).then((c) => {
              c.put(url.pathname, copy);
            });
          }
          return res;
        })
        .catch(async () => {
          // Si le navigateur indique qu'on est en ligne, retenter une fois en direct
          if (self.navigator && self.navigator.onLine) {
            try {
              return await fetch(request);
            } catch {
              // Vraiment hors-ligne : passer au cache ci-dessous
            }
          }

          const cachedByPath = await caches.match(url.pathname);
          if (cachedByPath) return cachedByPath;

          const cachedExact = await caches.match(request);
          if (cachedExact) return cachedExact;

          const fallbackDepart = await caches.match("/depart-matin");
          if (fallbackDepart) return fallbackDepart;

          const fallbackRoot = await caches.match("/");
          if (fallbackRoot) return fallbackRoot;

          return new Response(
            "<!doctype html><html lang='fr'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>StockElec — Hors-Ligne</title><style>body{font-family:system-ui,sans-serif;background:#0b0f17;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100dvh;margin:0;padding:24px;text-align:center}.card{max-width:420px;background:#111622;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px}button{margin-top:16px;background:#2563eb;color:#fff;border:0;padding:12px 20px;border-radius:12px;font-weight:700;cursor:pointer}</style></head><body><div class='card'><h2>📡 Connexion interrompue</h2><p>Vérifiez votre connexion réseau ou ouvrez l'écran Départ Matin.</p><button onclick='location.reload()'>Réessayer</button></div></body></html>",
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
