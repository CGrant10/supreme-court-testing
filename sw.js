// Court Timer service worker — mirrors the budget app's update pattern.
// On each release bump BOTH this CACHE name and version.txt (and APP_VERSION
// in test_timer_controls.html) together, or the update button can't reconcile.
const CACHE = "test-sc-timer-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./test_timer_controls.html",
  "./test_timer_display.html",
  "./test_case_overlay.html",
  "./ndseal.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(url => c.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && !/fonts/i.test(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const FONT_CACHE = "test-sc-timer-fonts-v1";

self.addEventListener("fetch", e => {
  if (e.request.url.includes("version.txt")) {
    e.respondWith(fetch(e.request, { cache: "no-cache" }).catch(() => new Response("")));
    return;
  }
  if (e.request.url.includes("fonts.googleapis.com") || e.request.url.includes("fonts.gstatic.com")) {
    e.respondWith(
      caches.open(FONT_CACHE).then(c =>
        c.match(e.request).then(cached => cached || fetch(e.request).then(res => {
          if (res.ok) c.put(e.request, res.clone());
          return res;
        }))
      )
    );
    return;
  }
  e.respondWith(
    fetch(new Request(e.request, { cache: "no-cache" }))
      .then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
