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

const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_SUA_ANON_PUBLIC_KEY";
