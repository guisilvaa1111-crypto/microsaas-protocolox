/*
 * PROTOCOLO X — configuração do Supabase (login real)
 * ------------------------------------------------------------------
 * Cole aqui os dados do seu projeto Supabase:
 *   Painel Supabase → Project Settings → Data API / API Keys
 *
 * ⚠️ Estes DOIS valores são PÚBLICOS e podem ficar no site (a "anon key"
 * foi feita para isso). NUNCA cole aqui a "service_role key" — ela é secreta
 * e só entra na função do webhook, no lado do servidor.
 *
 * Enquanto estiver com os valores de exemplo abaixo, o app funciona em
 * "modo demonstração" (qualquer e-mail/senha entra), para você testar o
 * visual. Assim que preencher, o login passa a validar de verdade.
 * ------------------------------------------------------------------
 */

const SUPABASE_URL = "https://ihdccpxqjjysjsxkdrlm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZGNjcHhxamp5c2pzeGtkcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDMzMzksImV4cCI6MjA5OTcxOTMzOX0.XHDmSwneiAxOm2xyN6kVC4JJRTb4xsBaz4CGV0vMYeA";

// Nome do bucket PRIVADO onde ficam os áudios (Supabase Storage).
// Deixe "audios" a menos que você crie o bucket com outro nome.
const SUPABASE_AUDIO_BUCKET = "audios";
