/*
 * PROTOCOLO DE ASSIS — Service Worker
 * ------------------------------------------------------------------
 * O que ele faz:
 *   • Torna o app instalável (requisito do Android/Chrome para virar APK/PWA)
 *   • Deixa o carregamento instantâneo em visitas repetidas
 *   • Permite abrir o app offline (a tela carrega; áudios/bônus precisam de net)
 *
 * Estratégia (pensada para NÃO servir versão velha):
 *   • Página (HTML): rede primeiro -> sempre a versão mais nova quando online;
 *     cai no cache só se estiver sem internet.
 *   • Arquivos do app (css/js/imagens): responde do cache na hora e atualiza
 *     em segundo plano. Como css/js têm versão na URL (?v=N), uma versão nova
 *     é sempre uma URL nova — nunca fica preso no antigo.
 *   • Supabase, fontes, CDN, áudios e PDFs: NÃO passam pelo cache (vão direto
 *     à rede), pois são de outro domínio e/ou grandes demais.
 * ------------------------------------------------------------------
 */

const CACHE = "protocolox-v1";

self.addEventListener("install", () => {
  self.skipWaiting(); // ativa a versão nova do SW imediatamente
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // Só cuida do próprio domínio. Supabase/fontes/CDN/áudio passam direto.
  if (url.origin !== self.location.origin) return;

  // Nunca cachear mídia pesada, caso um dia fique no mesmo domínio.
  if (/\.(mp3|pdf)$/i.test(url.pathname)) return;

  // Página: rede primeiro (sempre atualizado), cache como reserva offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./")))
    );
    return;
  }

  // Demais arquivos do app: cache na hora + atualiza em segundo plano.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
