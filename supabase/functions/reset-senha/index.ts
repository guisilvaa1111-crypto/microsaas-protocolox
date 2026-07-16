// ==================================================================
// PROTOCOLO X — Recuperação de senha (Supabase Edge Function / Deno)
// ------------------------------------------------------------------
// Envia o e-mail de "esqueci minha senha" em PORTUGUÊS, com a cara da
// marca, pelo Brevo — sem depender do template padrão do Supabase.
//
// Fluxo:
//   1. o app chama esta função com { email }
//   2. gera o link de recuperação (API admin do Supabase)
//   3. envia o e-mail (Brevo) com o botão "Redefinir minha senha"
//   4. o link cai no app, que mostra o campo de nova senha (já pronto)
//
// Usa os MESMOS secrets já configurados no projeto:
//   BREVO_API_KEY · SENDER_EMAIL · SENDER_NAME · APP_URL
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são fornecidos automaticamente.)
//
// ⚠️ Deixe "Verify JWT with legacy secret" LIGADO (padrão) nesta função —
//    o app chama via supabase.functions.invoke, que já envia a anon key.
// ==================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

async function sendEmail(to: string, link: string) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#0a0918;color:#ece9ff;padding:32px;border-radius:16px">
      <h1 style="color:#f2d98b;letter-spacing:2px;text-align:center;margin:0 0 4px">PROTOCOLO <span style="color:#c4b5fd">X</span></h1>
      <p style="text-align:center;color:#9a93c4;margin:0 0 24px;font-size:13px">Redefinição de senha</p>
      <p>Olá! Recebemos um pedido para redefinir a senha do seu acesso ao Protocolo X.</p>
      <p>Clique no botão abaixo para escolher uma nova senha:</p>
      <p style="text-align:center;margin:24px 0">
        <a href="${link}" style="background-color:#e8c874;color:#1a1330;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:10px;display:inline-block">Redefinir minha senha</a>
      </p>
      <p style="color:#9a93c4;font-size:12px">Se você não solicitou isso, pode ignorar este e-mail com segurança. O link expira em pouco tempo.</p>
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
      to: [{ email: to }],
      subject: "🔮 Redefinição de senha — Protocolo X",
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error("Brevo " + res.status + ": " + (await res.text()));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  let body: any = {};
  try { body = await req.json(); } catch { /* corpo vazio/!json */ }
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  if (!email || !email.includes("@")) return json({ error: "E-mail inválido" }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Gera o link de recuperação apontando de volta para o app.
  const appUrl = Deno.env.get("APP_URL") ?? "";
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: appUrl },
  });

  // Segurança: não revela se o e-mail existe (evita descobrir quem é cliente).
  // Se o usuário não existir, apenas responde ok sem enviar nada.
  if (error || !data?.properties?.action_link) {
    console.log("[reset-senha] sem link (e-mail provavelmente não cadastrado):", email);
    return json({ ok: true });
  }

  try {
    await sendEmail(email, data.properties.action_link);
  } catch (e) {
    console.log("[reset-senha] falha ao enviar e-mail:", String(e));
    return json({ error: "Falha ao enviar o e-mail" }, 502);
  }

  console.log("[reset-senha] e-mail de recuperação enviado para:", email);
  return json({ ok: true });
});
