// ==================================================================
// PROTOCOLO X — Webhook de compra (Supabase Edge Function / Deno)
// ------------------------------------------------------------------
// Fluxo: o checkout chama esta URL quando a compra é aprovada.
//   1. valida o segredo (para ninguém criar acesso de graça)
//   2. extrai o e-mail do comprador
//   3. gera uma senha aleatória e cria o usuário no Supabase Auth
//   4. envia e-mail (via Brevo) com e-mail + senha de acesso
//
// Segredos necessários (Supabase → Edge Functions → Secrets):
//   WEBHOOK_SECRET   -> um texto secreto que você inventa (ex.: px_9f3k...)
//   BREVO_API_KEY    -> chave da API do Brevo
//   SENDER_EMAIL     -> remetente verificado no Brevo (ex.: contato@seudominio.com)
//   SENDER_NAME      -> nome do remetente (ex.: Protocolo X)
//   APP_URL          -> link do app (ex.: https://guisilvaa1111-crypto.github.io/microsaas-protocolox/)
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são fornecidos automaticamente.)
// ==================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

// Gera senha aleatória forte, sem caracteres ambíguos (0/O, 1/l).
function randomPassword(len = 10): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#%";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// Procura o e-mail do comprador em vários formatos comuns de webhook
// (Kiwify, Hotmart, Stripe, etc.). Adapte se sua plataforma usar outro campo.
function extractEmail(p: any): string | null {
  const candidates = [
    p?.client?.email,                          // Wiven
    p?.email,
    p?.customer?.email,
    p?.customer_email,
    p?.buyer?.email,
    p?.Customer?.email,
    p?.data?.customer?.email,
    p?.data?.object?.customer_details?.email, // Stripe
    p?.data?.buyer?.email,                     // Hotmart
    p?.order?.customer?.email,
  ];
  const email = candidates.find((e) => typeof e === "string" && e.includes("@"));
  return email ? String(email).trim().toLowerCase() : null;
}

function extractName(p: any): string {
  return (
    p?.client?.name ?? p?.name ?? p?.customer?.name ?? p?.buyer?.name ??
    p?.data?.buyer?.name ?? p?.customer_name ?? "Cliente"
  );
}

async function sendEmail(to: string, name: string, password: string) {
  const appUrl = Deno.env.get("APP_URL") ?? "";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#0a0918;color:#ece9ff;padding:32px;border-radius:16px">
      <h1 style="color:#f2d98b;letter-spacing:2px;text-align:center;margin:0 0 4px">PROTOCOLO <span style="color:#c4b5fd">X</span></h1>
      <p style="text-align:center;color:#9a93c4;margin:0 0 24px;font-size:13px">Seu acesso foi liberado 👁️</p>
      <p>Olá, ${name}! Sua compra foi confirmada. Aqui estão seus dados de acesso:</p>
      <div style="background-color:#171235;border:1px solid #c9a24a;border-radius:12px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px"><b>E-mail:</b> ${to}</p>
        <p style="margin:0"><b>Senha:</b> <code style="font-size:16px;color:#f2d98b">${password}</code></p>
      </div>
      <p style="text-align:center;margin:24px 0">
        <a href="${appUrl}" style="background-color:#e8c874;color:#1a1330;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:10px;display:inline-block">Acessar o Protocolo X</a>
      </p>
      <p style="color:#9a93c4;font-size:12px">Recomendamos trocar sua senha depois de entrar, em "Esqueci minha senha". Guarde este e-mail.</p>
    </div>`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": Deno.env.get("BREVO_API_KEY") ?? "",
      "content-type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: Deno.env.get("SENDER_NAME") ?? "Protocolo X", email: Deno.env.get("SENDER_EMAIL") },
      to: [{ email: to, name }],
      subject: "🔮 Seu acesso ao Protocolo X",
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error("Brevo " + res.status + ": " + (await res.text()));
}

// Classifica o evento do webhook a partir de palavras-chave nos campos de
// evento/status (robusto a formatos diferentes de plataforma).
//   grant  -> liberar acesso (compra paga/aprovada)
//   revoke -> remover acesso (estorno, reembolso, chargeback, MED)
//   ignore -> não faz nada (ex.: transação criada/pendente)
function classifyEvent(p: any): "grant" | "revoke" | "ignore" {
  const raw = [
    p?.event, p?.type, p?.status, p?.event_type, p?.current_status,
    p?.transaction?.status, p?.transaction?.event,
    p?.data?.status, p?.data?.event, p?.data?.transaction?.status,
    p?.order_status, p?.payment_status,
  ].filter((v) => typeof v === "string").join(" ").toLowerCase();

  // Revogar: estorno / reembolso / chargeback / MED / disputa perdida.
  // (Wiven usa nomes em inglês, ex.: TRANSACTION_REFUNDED, CHARGEBACK, MED_*)
  if (/estorn|refund|reembols|charge.?back|devolu|disput|contest|(^|[^a-z])med([^a-z]|$)/.test(raw)) return "revoke";
  // Liberar: pago / aprovado / concluído (Wiven: TRANSACTION_PAID / COMPLETED).
  if (/paid|pag[ao]|approv|aprovad|complet|conclu|success|autoriz/.test(raw)) return "grant";
  return "ignore";
}

// Localiza o id de um usuário pelo e-mail (paginação do Admin API).
async function findUserId(admin: any, email: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const found = data?.users?.find((u: any) => (u.email ?? "").toLowerCase() === email);
    if (found) return found.id;
    if (!data?.users || data.users.length < 200) break;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  // 1) valida o segredo (via ?secret=... na URL ou header x-webhook-secret)
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") ?? req.headers.get("x-webhook-secret");
  if (!secret || secret !== Deno.env.get("WEBHOOK_SECRET")) {
    return json({ error: "Não autorizado" }, 401);
  }

  // 2) lê o corpo e extrai o e-mail
  let payload: any = {};
  try { payload = await req.json(); } catch { /* corpo vazio/!json */ }

  // LOG do payload recebido (aparece em Supabase → Edge Functions → Logs).
  // Serve para descobrir o formato exato da sua plataforma (ex.: Wiven).
  console.log("[checkout-webhook] payload recebido:", JSON.stringify(payload));

  // Modo inspeção: chame a URL com &debug=1 para ver o payload SEM criar usuário.
  if (url.searchParams.get("debug") === "1") {
    return json({ debug: true, payloadRecebido: payload });
  }

  const email = extractEmail(payload);
  const name = extractName(payload);
  if (!email) return json({ error: "E-mail do comprador não encontrado no webhook", payloadRecebido: payload }, 400);

  const decision = classifyEvent(payload);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // ---- REVOGAR ACESSO (estorno / reembolso / chargeback / MED) ----
  // Apaga o usuário: ele deixa de conseguir logar. Se recomprar, o evento
  // de compra paga recria o acesso automaticamente.
  if (decision === "revoke") {
    const userId = await findUserId(admin, email);
    if (userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: "Falha ao revogar acesso: " + error.message }, 500);
    }
    console.log("[checkout-webhook] acesso REVOGADO:", email);
    return json({ ok: true, revoked: true, email });
  }

  // ---- IGNORAR (transação criada/pendente e outros eventos sem ação) ----
  if (decision !== "grant") {
    console.log("[checkout-webhook] evento ignorado para:", email);
    return json({ ignored: true, motivo: "evento sem ação (não é compra paga nem revogação)" });
  }

  // ---- LIBERAR ACESSO (transação paga) ----
  const password = randomPassword();

  // cria o usuário (já confirmado, pode logar na hora)
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  // Se já existe (recompra/reenvio), redefine a senha para uma nova.
  if (createErr) {
    const already = /registered|already|exists|duplicate/i.test(createErr.message);
    if (!already) return json({ error: "Falha ao criar usuário: " + createErr.message }, 500);

    const userId = await findUserId(admin, email);
    if (!userId) return json({ error: "Usuário existe mas não foi localizado" }, 500);
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
    if (updErr) return json({ error: "Falha ao redefinir senha: " + updErr.message }, 500);
  }

  // envia o e-mail com as credenciais
  try {
    await sendEmail(email, name, password);
  } catch (e) {
    // usuário criado, mas e-mail falhou: retorne erro para o checkout reenviar.
    return json({ error: "Usuário criado, mas o e-mail falhou: " + String(e) }, 502);
  }

  console.log("[checkout-webhook] acesso LIBERADO:", email);
  return json({ ok: true, message: "Acesso liberado e e-mail enviado para " + email });
});
