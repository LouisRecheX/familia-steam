// Família Steam: cache simples para o app abrir rápido e funcionar como instalado.
// Dados (Supabase), Discord e bibliotecas externas NUNCA passam por aqui: só arquivos do próprio site.
const V = "fs-v2";
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
