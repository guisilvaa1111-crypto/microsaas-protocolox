/*
 * PROTOCOLO X — base de dados das faixas
 * ------------------------------------------------------------------
 * Os áudios ficam hospedados na pasta local "audio/" (mesmo domínio do
 * app). Isso é o que garante reprodução confiável, com barra de progresso
 * e avanço — o Google Drive NÃO permite tocar áudio direto num site.
 *
 * Cada faixa guarda também o "driveId" original (para referência e para
 * baixar de novo, se precisar).
 *
 * COMO ADICIONAR NOVAS MÚSICAS (para chegar às 70+):
 *   1. Coloque o novo .mp3 na pasta "audio/" (ex.: audio/51-nome.mp3).
 *   2. Adicione um objeto no array TRACKS com: titulo, tags e file.
 *
 * TAGS disponíveis (mantenha a grafia igual para os filtros funcionarem):
 *   "Relaxamento" · "Meditação" · "Autoconhecimento" · "Prosperidade"
 *   "Sono" · "Cura" · "Foco" · "Terceiro Olho"
 * ------------------------------------------------------------------
 */

// Gera a URL de reprodução de uma faixa.
function trackUrl(track) {
  if (track.url) return track.url;        // permite apontar para outro host (CDN)
  return "audio/" + track.file;           // arquivo local (padrão)
}

const TRACKS = [
  { titulo: "Deriva Celestial",           tags: ["Relaxamento", "Meditação"],          file: "01-deriva-celestial.mp3",          driveId: "1EYvjBDyrq9A_gM9gxu0WlfJ6JV_am_Ps" },
  { titulo: "Voo das Estrelas",           tags: ["Relaxamento", "Sono"],               file: "02-voo-das-estrelas.mp3",          driveId: "1T2CXynTqIdSx9LCmx20pWAT6i8VgbRwb" },
  { titulo: "Ressonância Celeste",        tags: ["Meditação", "Cura"],                 file: "03-ressonancia-celeste.mp3",       driveId: "1FR606hv1tQ1S3BcdjTZEHY3zys8qqVTv" },
  { titulo: "Frequência do Cosmos",       tags: ["Meditação", "Terceiro Olho"],        file: "04-frequencia-do-cosmos.mp3",      driveId: "1fsWkp5OJigwg52LR9nw7jCB4UyVtR9sE" },
  { titulo: "Quietude Celestial",         tags: ["Relaxamento", "Sono"],               file: "05-quietude-celestial.mp3",        driveId: "1IOwQEyK15BLTfM98ep6QaDUDkVeq58jq" },
  { titulo: "Profundezas Azuis",          tags: ["Relaxamento", "Cura"],               file: "06-profundezas-azuis.mp3",         driveId: "11ys3PYgCV5KvsGWr543p9cCr11fN-OWw" },
  { titulo: "Oceano Interior",            tags: ["Autoconhecimento", "Cura"],          file: "07-oceano-interior.mp3",           driveId: "1Ix8Niwn6e-HNqCBNLxLkyNEnkGmI6v7C" },
  { titulo: "Silêncio Cósmico",           tags: ["Meditação", "Sono"],                 file: "08-silencio-cosmico.mp3",          driveId: "1fLRCxA6B7uK5z_27stsRKn5Q94HErWEo" },
  { titulo: "Floresta Sagrada",           tags: ["Relaxamento", "Cura"],               file: "09-floresta-sagrada.mp3",          driveId: "1zkKAC0SNTVHA0fsNLrd-qSAb6ADj0qkD" },
  { titulo: "Respiro da Mata",            tags: ["Relaxamento", "Meditação"],          file: "10-respiro-da-mata.mp3",           driveId: "10NrPYJYR5bKEtLu95_r_MhkFw3z9oynu" },
  { titulo: "Flutuando no Zumbido",       tags: ["Meditação", "Foco"],                 file: "11-flutuando-no-zumbido.mp3",      driveId: "19Pl7JteDS8V5T5ib0DEDOVu4SK9jq7Js" },
  { titulo: "Vibração Suave",             tags: ["Relaxamento", "Cura"],               file: "12-vibracao-suave.mp3",            driveId: "1n0FjE_T9bTWhfM0h_JgX_6gEyopE8SaN" },
  { titulo: "Alvorada Dourada",           tags: ["Prosperidade", "Meditação"],         file: "13-alvorada-dourada.mp3",          driveId: "1nODuLTd1QsusweP-z_nVfLcjjjJFhLho" },
  { titulo: "Despertar do Sol Interior",  tags: ["Prosperidade", "Autoconhecimento"],  file: "14-despertar-do-sol-interior.mp3", driveId: "1GOsLDqp8MPCVjP4jfZOBRPyg1UNTkgBO" },
  { titulo: "Luz Dourada Ascendente",     tags: ["Prosperidade", "Cura"],              file: "15-luz-dourada-ascendente.mp3",    driveId: "1TKjeXe4BD0T0a6gyDCX_WprngyqHc76M" },
  { titulo: "Elevação da Chama",          tags: ["Prosperidade", "Foco"],              file: "16-elevacao-da-chama.mp3",         driveId: "1PI92O_dHgaxYtMl2RlZk-sXRyrAzocH-" },
  { titulo: "Brilho Interior",            tags: ["Autoconhecimento", "Prosperidade"],  file: "17-brilho-interior.mp3",           driveId: "1RDjBg26QihDHXSGsEQJ1laGAN5tuxW5B" },
  { titulo: "Ressonância Luminosa",       tags: ["Meditação", "Terceiro Olho"],        file: "18-ressonancia-luminosa.mp3",      driveId: "1B1FywZQB9orozm8_wG-JYru1EMKJLrix" },
  { titulo: "Aura de Luz",                tags: ["Cura", "Autoconhecimento"],          file: "19-aura-de-luz.mp3",               driveId: "1W4XGCvRklES-FnGE7hVZfSnhzClzY7yj" },
  { titulo: "Silêncio Luminoso",          tags: ["Meditação", "Sono"],                 file: "20-silencio-luminoso.mp3",         driveId: "1GxN4katOg3I8YuMNaQihI-X19O-5r1Jz" },
  { titulo: "Véu de Cristal",             tags: ["Relaxamento", "Cura"],               file: "21-veu-de-cristal.mp3",            driveId: "1o5TwqRwk2qjPDeIEbqpqveK9MS06ie4T" },
  { titulo: "Chuva de Frequências",       tags: ["Relaxamento", "Sono"],               file: "22-chuva-de-frequencias.mp3",      driveId: "1q2nUAHWihMfmqHv04JDpdR0y0F_iRW0z" },
  { titulo: "Gotas de Cura",              tags: ["Cura", "Relaxamento"],               file: "23-gotas-de-cura.mp3",             driveId: "11gWk5AprYN5OwpFLNN2q43rwlFB2weB5" },
  { titulo: "Geometria Sagrada",          tags: ["Terceiro Olho", "Meditação"],        file: "24-geometria-sagrada.mp3",         driveId: "1h_eGyQQWvxvLKZhZ-_f7fehaFM_U9Rma" },
  { titulo: "Padrões do Universo",        tags: ["Terceiro Olho", "Foco"],             file: "25-padroes-do-universo.mp3",       driveId: "1JhnNKCQJtRFEu2Q6BoOuh_mb5St3o1kL" },
  { titulo: "Silêncio Ressonante",        tags: ["Meditação", "Autoconhecimento"],     file: "26-silencio-ressonante.mp3",       driveId: "1aXsJ-kJ6Cg45z12KIonpxW2DwUPTP3EA" },
  { titulo: "Espaço Vazio",               tags: ["Meditação", "Foco"],                 file: "27-espaco-vazio.mp3",              driveId: "1M8USfQ3G6FeU8HO-lvyuYfqTR3B-Msvo" },
  { titulo: "Quietude Vibrante",          tags: ["Relaxamento", "Meditação"],          file: "28-quietude-vibrante.mp3",         driveId: "1TQPlNv6HN2AS8OkQC56sLzbbsLv-ySub" },
  { titulo: "Centro Imóvel",              tags: ["Foco", "Meditação"],                 file: "29-centro-imovel.mp3",             driveId: "1PTWUkxT7E64MBL1FPMHkSvC01oIVOtr6" },
  { titulo: "Deriva Silenciosa",          tags: ["Relaxamento", "Sono"],               file: "30-deriva-silenciosa.mp3",         driveId: "1JYiQTIRnVPQodTpR2CTjSXH825ex5eqI" },
  { titulo: "Órbita do Silêncio",         tags: ["Sono", "Meditação"],                 file: "31-orbita-do-silencio.mp3",        driveId: "1HpwsWV5UzQApDbemvJnxlvRvgK1F6y3u" },
  { titulo: "Órbita Solitária",           tags: ["Meditação", "Autoconhecimento"],     file: "32-orbita-solitaria.mp3",          driveId: "1DUuIZldsqGup8Jk9h-zRGQ6E8MImJd86" },
  { titulo: "Ponto de Paz",               tags: ["Relaxamento", "Foco"],               file: "33-ponto-de-paz.mp3",              driveId: "1td_DaMrv_V-yh4DM9UJzdQOcYkQTSF3l" },
  { titulo: "Estrela Silenciosa",         tags: ["Sono", "Relaxamento"],               file: "34-estrela-silenciosa.mp3",        driveId: "1xiEg8TfsVnUNK4cz6CbGKwhJhTEzrTBU" },
  { titulo: "Luz das Constelações",       tags: ["Meditação", "Terceiro Olho"],        file: "35-luz-das-constelacoes.mp3",      driveId: "1A3fF8kcZwH-afPQM5P0YmgbSx9QmwwLF" },
  { titulo: "Ressonância Estelar",        tags: ["Meditação", "Cura"],                 file: "36-ressonancia-estelar.mp3",       driveId: "19Gc1SKgJFa_D8QWLsD-IaTq4eOOW-Wnc" },
  { titulo: "Canto das Estrelas",         tags: ["Relaxamento", "Sono"],               file: "37-canto-das-estrelas.mp3",        driveId: "1Qc8iD5MrhBtfhsVOe402Iun7_pTdyleA" },
  { titulo: "Águas Serenas",              tags: ["Relaxamento", "Cura"],               file: "38-aguas-serenas.mp3",             driveId: "1uDWsO88ornAeXvUZJMtvJgy8IHzGFDM2" },
  { titulo: "Espelho das Águas",          tags: ["Autoconhecimento", "Relaxamento"],   file: "39-espelho-das-aguas.mp3",         driveId: "1icQQVSonbiX3GlOmvtme-09noR2b3yBM" },
  { titulo: "Correnteza Tranquila",       tags: ["Relaxamento", "Sono"],               file: "40-correnteza-tranquila.mp3",      driveId: "1cC20oinCdRquzx0fDOp4F4h_-V5t_14Y" },
  { titulo: "Canto das Águas",            tags: ["Cura", "Relaxamento"],               file: "41-canto-das-aguas.mp3",           driveId: "1jif2knFTVFbRn_okUnqOLGlrffBumgxT" },
  { titulo: "Voz do Rio",                 tags: ["Relaxamento", "Meditação"],          file: "42-voz-do-rio.mp3",                driveId: "16jfwb2Sm5q4XthSr0UTojMf_wPjb0qC2" },
  { titulo: "Lago Interior",              tags: ["Autoconhecimento", "Meditação"],     file: "43-lago-interior.mp3",             driveId: "1_EsKuMFzbS-jcbHBOeLMpHpkpWmbLl4X" },
  { titulo: "Quietude na Correnteza",     tags: ["Relaxamento", "Sono"],               file: "44-quietude-na-correnteza.mp3",    driveId: "1sftH716WudciWDLJ9GgjZXG9xQh8La-u" },
  { titulo: "Paz Interior",               tags: ["Autoconhecimento", "Cura"],          file: "45-paz-interior.mp3",              driveId: "1Y7rWdl8AXmu2_w5PH3fjKwmfXafSc-Mp" },
  { titulo: "Recolhimento",               tags: ["Meditação", "Autoconhecimento"],     file: "46-recolhimento.mp3",              driveId: "1iwFR-6BlrxSYQyVqrPpTmRelh6CJnDlB" },
  { titulo: "Despertar do Terceiro Olho", tags: ["Terceiro Olho", "Autoconhecimento"], file: "47-despertar-do-terceiro-olho.mp3", driveId: "123UfCZ8GHBRZ5OvGHZXldKb7557c3UNb" },
  { titulo: "Maré da Quietude",           tags: ["Relaxamento", "Sono"],               file: "48-mare-da-quietude.mp3",          driveId: "1bfWf_m_LEGu1yLnkshVkB5Jf91YE7dXo" },
  { titulo: "Ondas de Serenidade",        tags: ["Relaxamento", "Cura"],               file: "49-ondas-de-serenidade.mp3",       driveId: "1iUNrkEihtfSGkRMJZctuZDYTXQ9X9bs3" },
  { titulo: "Portal do Silêncio",         tags: ["Terceiro Olho", "Meditação"],        file: "50-portal-do-silencio.mp3",        driveId: "18HFq7FC-ZTXJp8NDyuXCboweOn4j2cJm" },
];

// Ordem em que os filtros de tag aparecem na interface.
const TAG_ORDER = [
  "Relaxamento", "Meditação", "Autoconhecimento", "Prosperidade",
  "Sono", "Cura", "Foco", "Terceiro Olho",
];

// Atribui um id estável a cada faixa (usado por favoritos e player).
TRACKS.forEach((t, i) => { t.id = i + 1; });
