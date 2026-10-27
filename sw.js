// Família Steam: cache simples para o app abrir rápido e funcionar como instalado.
// Dados (Supabase), Discord e bibliotecas externas NUNCA passam por aqui: só arquivos do próprio site.
const V = "fs-v3";
const SHELL = ["./", "index.html", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;

  // Página e listas (.json): sempre tenta a rede primeiro, para as atualizações chegarem na hora.
  if (r.mode === "navigate" || u.pathname.endsWith(".json")) {
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(r.mode === "navigate" ? "index.html" : r, c)); }
        return res;
      }).catch(() => caches.match(r.mode === "navigate" ? "index.html" : r))
    );
    return;
  }

  // Imagens e demais arquivos: mostra o que já tem e atualiza em segundo plano.
  e.respondWith(
    caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

// Avisos de vencimento (push): mostra a notificação e abre o jogo ao tocar.
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: "Família Steam", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Família Steam", {
    body: d.body || "",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: d.tag || "familia-steam",
    data: { url: d.url || "./" }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.startsWith(self.registration.scope) && "navigate" in c) return c.navigate(url).then(w => w && w.focus()); }
    return self.clients.openWindow(url);
  }));
});
