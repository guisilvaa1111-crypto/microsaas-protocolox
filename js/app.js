/* ==================================================================
   PROTOCOLO X — lógica do app (player, filtros, favoritos, login)
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

  list.innerHTML = queue.map((t) => {
    const isFav = favorites.has(t.id);
    const isPlaying = t.id === currentId;
    const tagsHtml = t.tags.map((tag) => `<span class="track__tag">${tag}</span>`).join("");
    return `
      <li class="track${isPlaying ? " playing" : ""}${isPlaying && audio.paused ? " paused" : ""}" data-id="${t.id}">
        <div class="track__num">${String(t.id).padStart(2, "0")}</div>
        <div class="track__eq"><span></span><span></span><span></span></div>
        <div class="track__body">
          <div class="track__title">${t.titulo}</div>
          <div class="track__tags">${tagsHtml}</div>
        </div>
        <button class="fav-btn${isFav ? " active" : ""}" data-fav="${t.id}" aria-label="Favoritar">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="${isFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2 5 5.3 5c2 0 3.4 1.2 4.7 2.8C11.3 6.2 12.7 5 14.7 5 18 5 19.6 8.4 22 11.7 19.5 16.4 12 21 12 21z"/></svg>
        </button>
      </li>`;
  }).join("");

  // clique na faixa -> tocar
  list.querySelectorAll(".track").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;
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
  const client = getClient();
  if (!client) return trackUrl(t); // modo local/demonstração

  const cached = signedCache.get(t.id);
  if (cached && cached.exp > Date.now() + 30000) return cached.url;

  const { data, error } = await client.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(t.file, 3600); // válido por 1 hora
  if (error || !data) throw new Error(error ? error.message : "sem URL assinada");

  signedCache.set(t.id, { url: data.signedUrl, exp: Date.now() + 3600 * 1000 });
  return data.signedUrl;
}

let playToken = 0; // protege contra corrida quando trocam de faixa rápido

async function playTrack(id) {
  const t = trackById(id);
  if (!t) return;
  currentId = id;
  updateNowPlaying(t);
  document.getElementById("player").classList.remove("hidden");
  render();

  const myToken = ++playToken;
  try {
    const src = await resolveSrc(t);
    if (myToken !== playToken) return; // o usuário já pediu outra faixa
    audio.src = src;
    await audio.play().catch(() => {/* autoplay bloqueado -> toca no botão */});
  } catch (e) {
    if (myToken !== playToken) return;
    document.getElementById("np-tags").textContent = "Não foi possível carregar o áudio.";
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

  render();
}

document.addEventListener("DOMContentLoaded", init);
