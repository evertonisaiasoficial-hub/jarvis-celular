// Jarvis iPhone v10.7: guarda a "casca" do app (abre rápido) e mostra as notificações. Os dados sempre vêm da rede (Supabase).
// Cada versão nova tem um nome de cache novo: o iPhone baixa a versão nova ao abrir, troca sozinho e o app avisa "Atualizado para vX".
const V = "jarvis-v10.7";
const CASCA = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-v2-180.png", "icon-v2-192.png", "icon-v2-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CASCA.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if(e.request.method !== "GET" || u.origin !== location.origin) return;          // Supabase e fontes: direto da rede
  if(u.pathname.endsWith("version.json")) return;                                // versão: sempre da rede
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { if(r.ok){ const c = r.clone(); caches.open(V).then(ca => ca.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});
self.addEventListener("push", e => {
  let d = {}; try{ d = e.data ? e.data.json() : {}; }catch(_){ d = { titulo: "Jarvis", texto: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Jarvis", { body: d.texto || "", icon: "icon-v2-192.png", badge: "icon-v2-192.png", tag: (d.tipo || "aviso") + "-" + Date.now(), data: { url: d.tipo === "captcha" ? "./?p=pCaptcha" : (d.tipo === "permissao" || d.tipo === "risco" || d.tipo === "decisao") ? "./?p=pAvisos&d=1" : "./?p=pAvisos" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(l => { for(const c of l){ if("focus" in c) return c.focus(); } return self.clients.openWindow((e.notification.data || {}).url || "./"); }));
});
