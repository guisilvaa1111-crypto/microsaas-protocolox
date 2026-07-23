/* ==================================================================
   PROTOCOLO DE ASSIS — lógica do app (player, filtros, favoritos, login)
   Depende de js/data.js (TRACKS, TAG_ORDER, trackUrl).
   ================================================================== */

"use strict";

/* ---------- Emblema SVG (terceiro olho + geometria sagrada) ---------- */
/* Inspirado na logo: círculo dourado, raios, olho com brilho violeta. */
const EMBLEM_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f4f0ff"/>
      <stop offset="35%" stop-color="#c4b5fd"/>
      <stop offset="70%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#4c2a85"/>
    </radialGradient>
    <linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f2d98b"/>
      <stop offset="100%" stop-color="#c9a24a"/>
    </linearGradient>
  </defs>
  <g fill="none" stroke="url(#goldStroke)" stroke-width="1.1">
    <circle cx="50" cy="50" r="46"/>
    <circle cx="50" cy="35" r="24"/>
    <circle cx="38" cy="55" r="24"/>
    <circle cx="62" cy="55" r="24"/>
  </g>
  <g stroke="url(#goldStroke)" stroke-width="0.7" opacity="0.55">
    ${Array.from({length: 24}).map((_, i) => {
      const a = (i / 24) * Math.PI * 2;
      const x1 = 50 + Math.cos(a) * 40, y1 = 50 + Math.sin(a) * 40;
      const x2 = 50 + Math.cos(a) * 47, y2 = 50 + Math.sin(a) * 47;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }).join("")}
  </g>
  <path d="M28 50 Q50 32 72 50 Q50 68 28 50 Z" fill="#1a1030" stroke="url(#goldStroke)" stroke-width="1.4"/>
  <circle cx="50" cy="50" r="12" fill="url(#eyeGlow)"/>
  <circle cx="50" cy="50" r="4.5" fill="#1a0f2e"/>
  <circle cx="50" cy="50" r="1.6" fill="#fff"/>
</svg>`;

/* ---------- Estado ---------- */
const audio = document.getElementById("audio");
let queue = [];          // faixas atualmente exibidas (após filtro/busca)
let currentId = null;    // id da faixa tocando
let isShuffle = false;
let isRepeat = false;
let activeTag = "Todas";
let searchTerm = "";

const FAV_KEY = "protocolox_favoritos";
const AUTH_KEY = "protocolox_auth";
let favorites = loadFavorites();

/* ================================================================
   LOGIN (Supabase Auth — com fallback em modo demonstração)
   ================================================================ */
let sb = null; // cliente Supabase
let recoveryMode = false; // true enquanto o usuário está redefinindo a senha

// Só considera "configurado" quando os valores em supabase-config.js
// foram realmente preenchidos (não são mais os de exemplo).
function supabaseConfigured() {
  return typeof supabase !== "undefined"
    && typeof SUPABASE_URL === "string" && SUPABASE_URL.startsWith("https://")
    && !SUPABASE_URL.includes("SEU-PROJETO")
    && typeof SUPABASE_ANON_KEY === "string" && SUPABASE_ANON_KEY.length > 30
    && !SUPABASE_ANON_KEY.includes("COLE_AQUI");
}
function getClient() {
  if (!sb && supabaseConfigured()) {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,     // salva a sessão no navegador (localStorage)
        autoRefreshToken: true,   // renova o token sozinho -> não desloga toda hora
        detectSessionInUrl: true, // processa o link de recuperação de senha
        storage: window.localStorage,
      },
    });
  }
  return sb;
}

async function initLogin() {
  document.getElementById("login-emblem").innerHTML = EMBLEM_SVG;

  const form = document.getElementById("login-form");
  const msg = document.getElementById("login-msg");

  // Captura o marcador de recuperação ANTES de criar o cliente
  // (o supabase-js limpa o #hash da URL logo depois de processá-lo).
  const isRecovery = (window.location.hash || "").includes("type=recovery");

  const client = getClient();

  if (client) {
    client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { recoveryMode = true; showRecovery(); }
    });

    if (isRecovery) {
      // Veio do link de redefinição: NÃO entra no app — mostra o campo "nova senha".
      recoveryMode = true;
      showRecovery();
    } else {
      // Fluxo normal: se já existe sessão ativa, entra direto.
      const { data } = await client.auth.getSession();
      if (data.session) enterApp();
    }
  } else {
    // Modo demonstração (ainda sem Supabase configurado).
    document.getElementById("login-note").textContent =
      "Modo demonstração: qualquer e-mail/senha entra. Configure o Supabase para ativar o login real.";
    if (localStorage.getItem(AUTH_KEY)) enterApp();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleLogin(
      document.getElementById("login-email").value.trim(),
      document.getElementById("login-password").value,
      msg
    );
  });

  document.getElementById("login-forgot").addEventListener("click", () => handleForgot(msg));
  document.getElementById("recovery-form").addEventListener("submit", handleRecoverySubmit);
}

async function handleLogin(email, password, msg) {
  if (!email || !password) {
    msg.textContent = "Preencha e-mail e senha.";
    return;
  }
  const client = getClient();
  const btn = document.querySelector('#login-form button[type="submit"]');

  // Sem Supabase configurado -> modo demonstração.
  if (!client) {
    localStorage.setItem(AUTH_KEY, "demo:" + email);
    enterApp();
    return;
  }

  msg.textContent = "";
  btn.disabled = true; btn.textContent = "Entrando…";
  const { error } = await client.auth.signInWithPassword({ email, password });
  btn.disabled = false; btn.textContent = "Entrar";

  if (error) {
    msg.textContent = "E-mail ou senha incorretos. Confira o e-mail que você recebeu após a compra.";
    return;
  }
  enterApp();
}

// "Esqueci minha senha" -> envia link de redefinição por e-mail.
async function handleForgot(msg) {
  const email = document.getElementById("login-email").value.trim();
  const client = getClient();
  if (!email) { msg.textContent = "Digite seu e-mail no campo acima e clique de novo."; return; }
  if (!client) { msg.textContent = "A redefinição de senha fica disponível após configurar o Supabase."; return; }
  msg.textContent = "Enviando…";
  // Chama a nossa função (e-mail em português via Brevo), no lugar do template padrão do Supabase.
  const { error } = await client.functions.invoke("reset-senha", { body: { email } });
  msg.textContent = error
    ? "Não foi possível enviar agora. Tente novamente em instantes."
    : "Se este e-mail tiver acesso, enviamos um link de redefinição. 💜";
}

// Mostra o painel de "nova senha" (fluxo de recuperação).
function showRecovery() {
  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("recovery-form").classList.remove("hidden");
}

async function handleRecoverySubmit(e) {
  e.preventDefault();
  const client = getClient();
  const msg = document.getElementById("recovery-msg");
  const btn = e.target.querySelector('button[type="submit"]');
  const pass = document.getElementById("recovery-password").value;
  if (!client) return;
  if (!pass || pass.length < 6) { msg.textContent = "A senha precisa ter ao menos 6 caracteres."; return; }

  msg.textContent = "";
  btn.disabled = true; btn.textContent = "Salvando…";

  // Garante que a sessão de recuperação (vinda do link do e-mail) está ativa.
  const { data: sess } = await client.auth.getSession();
  if (!sess.session) {
    btn.disabled = false; btn.textContent = "Salvar nova senha";
    msg.textContent = "Link inválido ou expirado. Peça um novo em \"Esqueci minha senha\".";
    return;
  }

  // Grava de fato a nova senha escolhida no banco.
  const { error } = await client.auth.updateUser({ password: pass });
  btn.disabled = false; btn.textContent = "Salvar nova senha";
  if (error) { msg.textContent = "Não foi possível salvar: " + error.message; return; }

  msg.textContent = "Senha alterada com sucesso! Entrando…";
  recoveryMode = false;                                       // libera a entrada
  history.replaceState(null, "", window.location.pathname);   // limpa o #hash
  setTimeout(enterApp, 900);
}

function enterApp() {
  if (recoveryMode) return; // durante a redefinição, só entra depois de salvar a nova senha
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

async function logout() {
  const client = getClient();
  if (client) { await client.auth.signOut(); }
  else { localStorage.removeItem(AUTH_KEY); }
  audio.pause();
  location.reload();
}

/* ================================================================
   FAVORITOS (localStorage)
   ================================================================ */
function loadFavorites() {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY)) || []); }
  catch { return new Set(); }
}
function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
}
function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  saveFavorites();
}

/* ================================================================
   FILTROS + BUSCA
   ================================================================ */
function buildTagFilters() {
  const wrap = document.getElementById("tag-filters");
  const tags = ["Todas", "★ Favoritos", ...TAG_ORDER];
  wrap.innerHTML = tags.map((t) =>
    `<button class="chip${t === "Todas" ? " active" : ""}" data-tag="${t}">${t}</button>`
  ).join("");

  wrap.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      wrap.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeTag = chip.dataset.tag;
      render();
    });
  });
}

const TAG_PRIMEIRO = "Cantos Gregorianos"; // esta categoria aparece no topo da lista

function getFilteredTracks() {
  return TRACKS.filter((t) => {
    // tag
    if (activeTag === "★ Favoritos") {
      if (!favorites.has(t.id)) return false;
    } else if (activeTag !== "Todas") {
      if (!t.tags.includes(activeTag)) return false;
    }
    // busca
    if (searchTerm) {
      const hay = (t.titulo + " " + t.tags.join(" ")).toLowerCase();
      if (!hay.includes(searchTerm)) return false;
    }
    return true;
  })
  // Ordem de exibição: cantos gregorianos primeiro, depois o resto.
  // (o .filter acima já devolve um array novo, então isto NÃO altera TRACKS
  //  nem os ids — favoritos e downloads offline continuam apontando certo)
  .sort((a, b) => {
    const ag = a.tags.includes(TAG_PRIMEIRO) ? 0 : 1;
    const bg = b.tags.includes(TAG_PRIMEIRO) ? 0 : 1;
    if (ag !== bg) return ag - bg;
    return a.id - b.id; // dentro de cada grupo, mantém a ordem original
  });
}

/* ================================================================
   RENDERIZAÇÃO DA LISTA
   ================================================================ */
function render() {
  queue = getFilteredTracks();
  const list = document.getElementById("track-list");
  const empty = document.getElementById("empty-state");
  const count = document.getElementById("track-count");

  count.textContent = `${queue.length} ${queue.length === 1 ? "faixa" : "faixas"}`;
  empty.classList.toggle("hidden", queue.length > 0);

  const isOffline = !navigator.onLine;
  list.innerHTML = queue.map((t, i) => {
    const isFav = favorites.has(t.id);
    const isPlaying = t.id === currentId;
    const saved = offlineKeys.has("audio:" + t.id);
    const locked = isOffline && !saved; // offline e não baixado -> não dá pra tocar
    const tagsHtml = t.tags.map((tag) => `<span class="track__tag">${tag}</span>`).join("");
    return `
      <li class="track${isPlaying ? " playing" : ""}${isPlaying && audio.paused ? " paused" : ""}${saved ? " track--saved" : ""}${locked ? " track--locked" : ""}" data-id="${t.id}">
        <div class="track__num">${String(i + 1).padStart(2, "0")}</div>
        <div class="track__eq"><span></span><span></span><span></span></div>
        <div class="track__body">
          <div class="track__title">${t.titulo}</div>
          <div class="track__tags">${tagsHtml}</div>
        </div>
        <button class="dl-btn${saved ? " dl-btn--saved" : ""}" data-dl="${t.id}" aria-label="${saved ? "Remover download offline" : "Salvar offline"}" title="${saved ? "Salvo no app (toque para remover)" : "Salvar offline"}">
          ${saved ? ICON_CHECK : ICON_DL}
        </button>
        <button class="fav-btn${isFav ? " active" : ""}" data-fav="${t.id}" aria-label="Favoritar">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="${isFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><polygon points="12 2.5 14.85 8.28 21.22 9.2 16.61 13.69 17.69 20.02 12 17.03 6.31 20.02 7.39 13.69 2.78 9.2 9.15 8.28"/></svg>
        </button>
      </li>`;
  }).join("");

  // clique na faixa -> tocar
  list.querySelectorAll(".track").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn") || e.target.closest(".dl-btn")) return;
      playTrack(Number(el.dataset.id));
    });
  });
  // favoritar
  list.querySelectorAll(".fav-btn").forEach((el) => {
    el.addEventListener("click", () => {
      const id = Number(el.dataset.fav);
      toggleFavorite(id);
      render();
    });
  });
  // salvar / remover faixa offline (fica DENTRO do app, não vira arquivo no celular)
  list.querySelectorAll(".dl-btn").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const t = trackById(Number(el.dataset.dl));
      if (!t) return;
      if (offlineKeys.has("audio:" + t.id)) removeTrackOffline(t);
      else saveTrackOffline(t, el);
    });
  });

  updateSaveAllBtn();
}

/* ================================================================
   BÔNUS + DOWNLOADS
   ================================================================ */
const BONUS_BUCKET = "bonus";

// Dispara o download de uma URL como arquivo.
function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Baixa um arquivo de um bucket privado (link assinado que força download).
// Sem Supabase (modo demonstração), usa o arquivo local para testes.
async function downloadFromBucket(bucket, path, filename, btn) {
  const client = getClient();
  const originalHtml = btn ? btn.innerHTML : null;
  if (btn) { btn.disabled = true; btn.textContent = "Baixando…"; }
  try {
    if (!client) {
      triggerDownload((bucket === BONUS_BUCKET ? "bonus/" : "audio/") + path, filename);
    } else {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(path, 120, { download: filename });
      if (error || !data) throw new Error(error ? error.message : "sem URL assinada");
      triggerDownload(data.signedUrl, filename);
    }
  } catch (e) {
    alert("Não foi possível baixar agora. Tente novamente em instantes.");
  } finally {
    if (btn && originalHtml !== null) { btn.disabled = false; btn.innerHTML = originalHtml; }
  }
}

/* ================================================================
   OFFLINE — salva os conteúdos DENTRO do app (IndexedDB) e toca/vê sem net.
   Os arquivos NÃO viram download solto no celular (dificulta pirataria).
   ================================================================ */
const ICON_DL = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_SPIN = `<svg class="spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>`;
const ICON_PAUSE = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`;
const ICON_TRASH = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;

// URL de origem do arquivo (link assinado temporário) ou caminho local (demo).
async function sourceUrl(bucket, path, expires) {
  const client = getClient();
  if (!client) return (bucket === BONUS_BUCKET ? "bonus/" : "audio/") + path;
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expires || 600);
  if (error || !data) throw new Error(error ? error.message : "sem URL assinada");
  return data.signedUrl;
}

// Baixa o arquivo e guarda o Blob no armazenamento interno do app.
async function saveOffline(key, bucket, path) {
  const url = await sourceUrl(bucket, path, 600);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("HTTP " + resp.status);
  const blob = await resp.blob();
  await OfflineStore.put(key, blob);
  offlineKeys.add(key);
}

async function saveTrackOffline(t, btn) {
  if (!navigator.onLine) { alert("Conecte-se à internet para salvar esta faixa offline."); return; }
  if (btn) { btn.disabled = true; btn.innerHTML = ICON_SPIN; }
  try { await saveOffline("audio:" + t.id, AUDIO_BUCKET, t.file); }
  catch (e) { alert("Não foi possível salvar offline agora. Tente novamente."); }
  finally { render(); }
}

async function removeTrackOffline(t) {
  if (!confirm("Remover esta faixa do armazenamento offline do app?")) return;
  await OfflineStore.del("audio:" + t.id);
  offlineKeys.delete("audio:" + t.id);
  render();
}

async function saveBonusOffline(b, btn) {
  if (!navigator.onLine) { alert("Conecte-se à internet para salvar este bônus offline."); return; }
  if (btn) { btn.disabled = true; btn.textContent = "Salvando…"; }
  try { await saveOffline("bonus:" + b.file, BONUS_BUCKET, b.file); }
  catch (e) { alert("Não foi possível salvar offline agora. Tente novamente."); }
  finally { renderBonus(); }
}

async function removeBonusOffline(b) {
  if (!confirm("Remover este bônus do armazenamento offline do app?")) return;
  await OfflineStore.del("bonus:" + b.file);
  offlineKeys.delete("bonus:" + b.file);
  renderBonus();
}

// Estado do botão único "Salvar tudo": está baixando? foi pedido pausar?
let isDownloadingAll = false;
let pauseAllRequested = false;

// TUDO (faixas E bônus) já está salvo offline?
function allSavedNow() {
  return TRACKS.length > 0
    && TRACKS.every((t) => offlineKeys.has("audio:" + t.id))
    && BONUS.every((b) => offlineKeys.has("bonus:" + b.file));
}

// Clique no botão único -> baixa tudo / pausa / exclui tudo, conforme o estado.
function onSaveAllClick() {
  if (isDownloadingAll) { pauseAllRequested = true; return; } // pausar o download
  if (allSavedNow()) { removeAllOffline(); return; }          // excluir todos
  saveAllOffline();                                           // salvar tudo
}

// Salva TODAS as faixas E TODOS os bônus offline (pula os que já estão salvos).
async function saveAllOffline() {
  if (!navigator.onLine) { alert("Conecte-se à internet para baixar tudo offline."); return; }
  const label = document.getElementById("save-all-label");
  const icon = document.getElementById("save-all-icon");

  const pending = [
    ...TRACKS.filter((t) => !offlineKeys.has("audio:" + t.id))
             .map((t) => ({ key: "audio:" + t.id, bucket: AUDIO_BUCKET, path: t.file })),
    ...BONUS.filter((b) => !offlineKeys.has("bonus:" + b.file))
            .map((b) => ({ key: "bonus:" + b.file, bucket: BONUS_BUCKET, path: b.file })),
  ];
  if (pending.length === 0) { alert("Tudo já está salvo offline. 💜"); return; }

  isDownloadingAll = true;
  pauseAllRequested = false;
  if (icon) icon.innerHTML = ICON_PAUSE;

  let done = 0, fail = 0;
  for (let i = 0; i < pending.length; i++) {
    if (pauseAllRequested) break; // usuário tocou para pausar
    if (label) label.textContent = `Pausar (${i + 1}/${pending.length})`;
    try { await saveOffline(pending[i].key, pending[i].bucket, pending[i].path); done++; }
    catch (e) { fail++; }
  }

  const paused = pauseAllRequested;
  isDownloadingAll = false;
  pauseAllRequested = false;
  render();       // atualiza as marcas das faixas + o botão
  renderBonus();  // atualiza as marcas dos bônus
  if (!paused && fail) alert(`Salvei ${done} item(ns) offline. ${fail} não baixaram — toque de novo para tentar os que faltaram.`);
}

// Exclui TODOS os downloads offline (faixas e bônus).
async function removeAllOffline() {
  if (!confirm("Excluir TODOS os downloads offline (faixas e bônus)? Você poderá baixar de novo quando quiser.")) return;
  const keys = await OfflineStore.keys();
  for (const k of keys) await OfflineStore.del(k);
  offlineKeys.clear();
  render();
  renderBonus();
}

// Ajusta ícone/rótulo/estado do botão único conforme a situação.
function updateSaveAllBtn() {
  const btn = document.getElementById("save-all-btn");
  const label = document.getElementById("save-all-label");
  const icon = document.getElementById("save-all-icon");
  if (!btn || !label) return;

  // Durante o download o texto/ícone são definidos no próprio loop (fica clicável p/ pausar).
  if (isDownloadingAll) { btn.disabled = false; btn.classList.remove("save-all--done"); return; }

  const allSaved = allSavedNow();
  btn.classList.toggle("save-all--done", allSaved);
  if (allSaved) {
    if (icon) icon.innerHTML = ICON_TRASH;
    label.textContent = "Excluir todos os downloads";
    btn.disabled = false;
  } else {
    if (icon) icon.innerHTML = ICON_DL;
    label.textContent = "Salvar tudo offline";
    btn.disabled = !navigator.onLine;
  }
}

// Mostra/esconde a faixa de aviso "Você está offline".
function updateOfflineBanner() {
  const el = document.getElementById("offline-banner");
  if (el) el.classList.toggle("hidden", navigator.onLine);
}
function onConnChange() { updateOfflineBanner(); render(); renderBonus(); }

function renderBonus() {
  const list = document.getElementById("bonus-list");
  list.innerHTML = BONUS.map((b, i) => {
    const bsaved = offlineKeys.has("bonus:" + b.file);
    return `
    <li class="bonus-card">
      <img class="bonus-card__cover" src="${b.cover}" alt="${b.titulo}" />
      <div class="bonus-card__body">
        <span class="bonus-card__tag">${b.tag}</span>
        <div class="bonus-card__title">${b.titulo}</div>
        <div class="bonus-card__desc">${b.desc}</div>
        <div class="bonus-card__actions">
          <button class="bonus-card__view" data-view="${i}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
            Ver
          </button>
          <button class="bonus-card__dl${bsaved ? " is-saved" : ""}" data-bonus="${i}" title="${bsaved ? "Salvo no app (toque para remover)" : "Salvar offline"}">
            ${bsaved ? ICON_CHECK : ICON_DL}
            ${bsaved ? "Salvo offline" : "Salvar offline"}
          </button>
        </div>
      </div>
    </li>`;
  }).join("");
  list.querySelectorAll(".bonus-card__dl").forEach((el) => {
    el.addEventListener("click", () => {
      const b = BONUS[Number(el.dataset.bonus)];
      if (offlineKeys.has("bonus:" + b.file)) removeBonusOffline(b);
      else saveBonusOffline(b, el);
    });
  });
  list.querySelectorAll(".bonus-card__view").forEach((el) => {
    el.addEventListener("click", () => previewBonus(Number(el.dataset.view), el));
  });
  updateSaveAllBtn(); // bônus salvos entram na conta do "Salvar/Excluir tudo"
}

// Guarda a URL temporária (blob:) do bônus aberto, para liberar ao fechar.
let previewObjUrl = null;
function setPreviewObjUrl(u) {
  if (previewObjUrl) URL.revokeObjectURL(previewObjUrl);
  previewObjUrl = u;
}

// Abre a visualização do bônus no modal (imagem ou PDF), sem baixar nem sair do app.
async function previewBonus(i, btn) {
  const b = BONUS[i];
  const client = getClient();
  const isPdf = /\.pdf$/i.test(b.file);
  const originalHtml = btn ? btn.innerHTML : null;
  if (btn) { btn.disabled = true; btn.textContent = "Abrindo…"; }
  let url;
  try {
    // 1) Salvo offline? Abre de dentro do app (funciona sem internet).
    const blob = await OfflineStore.get("bonus:" + b.file);
    if (blob) {
      setPreviewObjUrl(URL.createObjectURL(blob));
      url = previewObjUrl;
    } else if (!client) {
      url = "bonus/" + b.file;
    } else if (!navigator.onLine) {
      alert("Você está offline. Toque em \"Salvar offline\" (com internet) para ver este bônus sem conexão.");
      return;
    } else {
      const { data, error } = await client.storage.from(BONUS_BUCKET).createSignedUrl(b.file, 600);
      if (error || !data) throw new Error(error ? error.message : "sem URL");
      url = data.signedUrl;
    }
  } catch (e) {
    alert("Não foi possível abrir a visualização agora. Tente novamente em instantes.");
    return;
  } finally {
    if (btn && originalHtml !== null) { btn.disabled = false; btn.innerHTML = originalHtml; }
  }

  document.getElementById("preview-title").textContent = b.titulo;
  document.getElementById("preview-open").href = url;
  document.getElementById("preview-modal").classList.remove("hidden");

  const content = document.getElementById("preview-content");
  if (isPdf) {
    renderPdf(url, content);
  } else {
    content.innerHTML = `<img src="${url}" alt="${b.titulo}" />`;
  }
}

let pdfToken = 0;      // cancela renderização anterior se abrir outro/fechar
let pdfjsLoading = null; // carrega o PDF.js só na 1ª vez que alguém abre um PDF

// Carrega o PDF.js sob demanda (não pesa no carregamento inicial do app).
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsLoading) return pdfjsLoading;
  pdfjsLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => resolve(window.pdfjsLib);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return pdfjsLoading;
}

// Renderiza um PDF DENTRO do modal, página por página, carregando sob demanda
// (funciona com PDFs grandes e em qualquer navegador — usa PDF.js).
async function renderPdf(url, content) {
  const myToken = ++pdfToken;
  content.innerHTML = '<div class="pdf-msg">Carregando…</div>';

  let lib;
  try { lib = await loadPdfJs(); } catch (e) { lib = null; }
  if (myToken !== pdfToken) return;
  if (!lib) { content.innerHTML = '<div class="pdf-msg">Não foi possível carregar o leitor de PDF.</div>'; return; }
  lib.GlobalWorkerOptions.workerSrc = "js/pdf.worker.min.js"; // mesmo domínio => worker real (rápido)

  let pdf;
  try {
    pdf = await lib.getDocument({ url }).promise;
  } catch (e) {
    content.innerHTML = '<div class="pdf-msg">Não foi possível exibir o PDF. Você pode baixá-lo pelo botão "Baixar".</div>';
    return;
  }
  if (myToken !== pdfToken) return; // fechou/trocou enquanto carregava

  content.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "pdf-pages";
  content.appendChild(wrap);

  // Nitidez: renderiza na resolução real da tela (retina), com teto de 2x.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.min((content.clientWidth || 360) - 24, 900);

  // Descobre a proporção da 1ª página para dar altura aos placeholders
  // (assim só as páginas realmente visíveis são renderizadas).
  let ratio = 1.414;
  try {
    const p1 = await pdf.getPage(1);
    const v = p1.getViewport({ scale: 1 });
    ratio = v.height / v.width;
  } catch (e) { /* usa padrão */ }
  if (myToken !== pdfToken) return;

  const holders = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const h = document.createElement("div");
    h.className = "pdf-page-holder";
    h.style.aspectRatio = `1 / ${ratio.toFixed(3)}`;
    h.dataset.page = String(n);
    wrap.appendChild(h);
    holders.push(h);
  }

  const done = new Set();
  const holderByPage = new Map(holders.map((h) => [Number(h.dataset.page), h]));
  async function renderPage(n) {
    const holder = holderByPage.get(n);
    if (!holder || done.has(n)) return;
    done.add(n);
    try {
      const page = await pdf.getPage(n);
      if (myToken !== pdfToken) return;
      const scale = (cssW * dpr) / page.getViewport({ scale: 1 }).width;
      const vp = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.className = "pdf-page";
      canvas.dataset.page = String(n);
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext("2d", { alpha: false }), viewport: vp }).promise;
      if (myToken !== pdfToken) return;
      holder.replaceWith(canvas);
    } catch (e) { done.delete(n); /* deixa tentar de novo */ }
  }

  // Renderiza já as primeiras páginas (aparecem na hora, sem esperar scroll).
  const EAGER = Math.min(4, pdf.numPages);
  for (let n = 1; n <= EAGER; n++) renderPage(n);

  // Resto sob demanda ao rolar (economiza memória e tempo em PDFs grandes).
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) { io.unobserve(en.target); renderPage(Number(en.target.dataset.page)); }
    }
  }, { root: content, rootMargin: "1000px 0px" });
  requestAnimationFrame(() => {
    if (myToken !== pdfToken) return;
    holders.forEach((h) => { if (!done.has(Number(h.dataset.page))) io.observe(h); });
  });
}

function closePreview() {
  pdfToken++; // cancela qualquer renderização de PDF em andamento
  document.getElementById("preview-modal").classList.add("hidden");
  document.getElementById("preview-content").innerHTML = "";
  setPreviewObjUrl(null); // libera o blob do bônus salvo offline
}

function switchView(view) {
  const musicas = view === "musicas";
  document.getElementById("view-musicas").classList.toggle("hidden", !musicas);
  document.getElementById("view-bonus").classList.toggle("hidden", musicas);
  document.getElementById("tab-musicas").classList.toggle("active", musicas);
  document.getElementById("tab-bonus").classList.toggle("active", !musicas);
}

/* ================================================================
   PLAYER
   ================================================================ */
function trackById(id) { return TRACKS.find((t) => t.id === id); }

// Nome do bucket privado no Supabase Storage (definido em supabase-config.js).
const AUDIO_BUCKET = (typeof SUPABASE_AUDIO_BUCKET !== "undefined") ? SUPABASE_AUDIO_BUCKET : "audios";
const signedCache = new Map(); // id -> { url, exp }  (evita gerar link a cada play)

/*
 * resolveSrc — decide de onde o áudio vem:
 *   • Com Supabase configurado: gera um LINK ASSINADO temporário do bucket
 *     privado. Só funciona para usuário autenticado -> conteúdo protegido.
 *   • Sem Supabase (modo demonstração/local): usa o arquivo local audio/.
 */
async function resolveSrc(t) {
  // 1) Salvo offline? Toca de DENTRO do app (funciona sem internet).
  const blob = await OfflineStore.get("audio:" + t.id);
  if (blob) return { url: URL.createObjectURL(blob), isObj: true };

  const client = getClient();
  if (!client) return { url: trackUrl(t), isObj: false }; // modo local/demonstração

  // 2) Offline e não salvo -> não há como tocar.
  if (!navigator.onLine) throw new Error("OFFLINE_NAO_SALVO");

  // 3) Link assinado temporário (conteúdo protegido; só para logado).
  const cached = signedCache.get(t.id);
  if (cached && cached.exp > Date.now() + 30000) return { url: cached.url, isObj: false };

  const { data, error } = await client.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(t.file, 3600); // válido por 1 hora
  if (error || !data) throw new Error(error ? error.message : "sem URL assinada");

  signedCache.set(t.id, { url: data.signedUrl, exp: Date.now() + 3600 * 1000 });
  return { url: data.signedUrl, isObj: false };
}

let playToken = 0; // protege contra corrida quando trocam de faixa rápido
let currentObjUrl = null;

// Define o src do áudio, liberando a URL temporária (blob:) anterior, se houver.
function setAudioSrc(url, isObj) {
  if (currentObjUrl) { URL.revokeObjectURL(currentObjUrl); currentObjUrl = null; }
  if (isObj) currentObjUrl = url;
  audio.src = url;
}

async function playTrack(id) {
  const t = trackById(id);
  if (!t) return;
  currentId = id;
  updateNowPlaying(t);
  document.getElementById("player").classList.remove("hidden");
  render();

  const myToken = ++playToken;
  try {
    const { url, isObj } = await resolveSrc(t);
    if (myToken !== playToken) { if (isObj) URL.revokeObjectURL(url); return; } // trocou de faixa
    setAudioSrc(url, isObj);
    await audio.play().catch(() => {/* autoplay bloqueado -> toca no botão */});
  } catch (e) {
    if (myToken !== playToken) return;
    document.getElementById("np-tags").textContent =
      String(e && e.message).indexOf("OFFLINE_NAO_SALVO") !== -1
        ? "Offline: salve esta faixa (ícone ↓) com internet para ouvir sem conexão."
        : "Não foi possível carregar o áudio.";
  }
}

function updateNowPlaying(t) {
  document.getElementById("np-title").textContent = t.titulo;
  document.getElementById("np-tags").textContent = t.tags.join(" · ");
}

function togglePlay() {
  if (!currentId) { if (queue[0]) playTrack(queue[0].id); return; }
  if (audio.paused) audio.play(); else audio.pause();
}

function playAdjacent(dir) {
  if (!queue.length) return;
  if (isShuffle && dir === 1) {
    playTrack(queue[Math.floor(Math.random() * queue.length)].id);
    return;
  }
  const idx = queue.findIndex((t) => t.id === currentId);
  let next;
  if (idx === -1) next = 0;
  else next = (idx + dir + queue.length) % queue.length;
  playTrack(queue[next].id);
}

function fmt(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function initPlayer() {
  document.getElementById("np-emblem").innerHTML = EMBLEM_SVG;
  document.getElementById("header-emblem").innerHTML = EMBLEM_SVG;

  const playBtn = document.getElementById("play-btn");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");
  const seek = document.getElementById("seek");

  playBtn.addEventListener("click", togglePlay);
  document.getElementById("prev-btn").addEventListener("click", () => playAdjacent(-1));
  document.getElementById("next-btn").addEventListener("click", () => playAdjacent(1));

  document.getElementById("shuffle-btn").addEventListener("click", (e) => {
    isShuffle = !isShuffle;
    e.currentTarget.classList.toggle("active", isShuffle);
  });
  document.getElementById("repeat-btn").addEventListener("click", (e) => {
    isRepeat = !isRepeat;
    e.currentTarget.classList.toggle("active", isRepeat);
  });

  // sincroniza ícone play/pause
  audio.addEventListener("play", () => {
    iconPlay.classList.add("hidden");
    iconPause.classList.remove("hidden");
    document.querySelector(".track.playing")?.classList.remove("paused");
  });
  audio.addEventListener("pause", () => {
    iconPause.classList.add("hidden");
    iconPlay.classList.remove("hidden");
    document.querySelector(".track.playing")?.classList.add("paused");
  });

  // progresso
  audio.addEventListener("timeupdate", () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    seek.value = audio.duration ? (audio.currentTime / audio.duration) * 1000 : 0;
    seek.style.setProperty("--seek", pct + "%");
    document.getElementById("cur-time").textContent = fmt(audio.currentTime);
  });
  audio.addEventListener("loadedmetadata", () => {
    document.getElementById("dur-time").textContent = fmt(audio.duration);
  });
  audio.addEventListener("ended", () => {
    if (isRepeat) { audio.currentTime = 0; audio.play(); }
    else playAdjacent(1);
  });

  // seek manual
  seek.addEventListener("input", () => {
    if (audio.duration) {
      audio.currentTime = (seek.value / 1000) * audio.duration;
    }
  });

  // Media Session (controles na tela de bloqueio do celular)
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", togglePlay);
    navigator.mediaSession.setActionHandler("pause", togglePlay);
    navigator.mediaSession.setActionHandler("previoustrack", () => playAdjacent(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => playAdjacent(1));
  }
}

/* ================================================================
   BOOT
   ================================================================ */
function init() {
  initLogin();
  initPlayer();
  buildTagFilters();

  document.getElementById("search-input").addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    render();
  });
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("save-all-btn").addEventListener("click", onSaveAllClick);

  // Abas Músicas / Bônus
  document.getElementById("tab-musicas").addEventListener("click", () => switchView("musicas"));
  document.getElementById("tab-bonus").addEventListener("click", () => switchView("bonus"));

  // Modal de visualização (fechar no X ou clicando no fundo)
  document.getElementById("preview-close").addEventListener("click", closePreview);
  document.getElementById("preview-modal").addEventListener("click", (e) => {
    if (e.target.id === "preview-modal") closePreview();
  });

  // Offline: carrega o índice do que já está salvo e re-renderiza com o estado certo.
  requestPersistentStorage();
  OfflineStore.keys().then((ks) => {
    ks.forEach((k) => offlineKeys.add(k));
    render();
    renderBonus();
  });

  // Reage a ficar online/offline (mostra aviso e atualiza a lista).
  window.addEventListener("online", onConnChange);
  window.addEventListener("offline", onConnChange);
  updateOfflineBanner();

  render();
  renderBonus();
}

document.addEventListener("DOMContentLoaded", init);

/* ================================================================
   PWA — registra o service worker (app instalável + carregamento rápido)
   ================================================================ */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {/* sem SW, o app funciona igual */});
  });
}
