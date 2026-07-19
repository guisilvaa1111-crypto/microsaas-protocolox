/*
 * PROTOCOLO DE ASSIS — Armazenamento offline (IndexedDB)
 * ------------------------------------------------------------------
 * Guarda os áudios/bônus DENTRO do app, numa área privada do navegador
 * (sandbox do app), NÃO como arquivo solto no celular. É a base do modo
 * offline e dificulta o compartilhamento/pirataria dos conteúdos.
 *
 * Chaves usadas:  "audio:<id>"  e  "bonus:<arquivo>"
 * Cada valor: { blob, savedAt }.
 */
const OfflineStore = (() => {
  const DB_NAME = "assis-offline";
  const STORE = "blobs";
  let _db = null;

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onerror = () => reject(req.error);
    });
  }

  function store(mode) {
    return open().then((db) => db.transaction(STORE, mode).objectStore(STORE));
  }

  return {
    // Existe algo salvo com essa chave?
    async has(key) {
      try {
        const s = await store("readonly");
        return await new Promise((res) => {
          const r = s.count(key);
          r.onsuccess = () => res(r.result > 0);
          r.onerror = () => res(false);
        });
      } catch { return false; }
    },
    // Recupera o Blob salvo (ou null).
    async get(key) {
      try {
        const s = await store("readonly");
        return await new Promise((res) => {
          const r = s.get(key);
          r.onsuccess = () => res(r.result ? r.result.blob : null);
          r.onerror = () => res(null);
        });
      } catch { return null; }
    },
    // Salva um Blob.
    async put(key, blob) {
      const s = await store("readwrite");
      return new Promise((res, rej) => {
        const r = s.put({ blob, savedAt: Date.now() }, key);
        r.onsuccess = () => res(true);
        r.onerror = () => rej(r.error);
      });
    },
    // Remove um item salvo.
    async del(key) {
      try {
        const s = await store("readwrite");
        return await new Promise((res) => {
          const r = s.delete(key);
          r.onsuccess = () => res(true);
          r.onerror = () => res(false);
        });
      } catch { return false; }
    },
    // Lista todas as chaves salvas (para marcar o que já está offline).
    async keys() {
      try {
        const s = await store("readonly");
        return await new Promise((res) => {
          const r = s.getAllKeys();
          r.onsuccess = () => res(r.result || []);
          r.onerror = () => res([]);
        });
      } catch { return []; }
    },
    // Estimativa de espaço usado/disponível (bytes), se o navegador permitir.
    async estimate() {
      if (navigator.storage && navigator.storage.estimate) {
        try { return await navigator.storage.estimate(); } catch { return null; }
      }
      return null;
    },
  };
})();

// Conjunto em memória com as chaves salvas — permite a UI mostrar o estado
// "baixado" na hora, sem consultar o banco a cada render. Preenchido no init().
const offlineKeys = new Set();

// Pede ao navegador para NÃO apagar os dados offline sob pressão de espaço.
async function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
  } catch { /* ok */ }
}
