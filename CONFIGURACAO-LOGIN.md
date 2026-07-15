# 🔐 Login funcional + envio de acesso por e-mail — Guia de configuração

Este guia liga o **login do app** a um banco de dados real e faz o cliente **receber
e-mail com login e senha automaticamente após a compra**.

**Tecnologias (todas com plano grátis):**
- **Supabase** → banco de dados + login (autenticação) + a função do webhook.
- **Brevo** → envio do e-mail com as credenciais.

Tempo estimado: ~30 minutos. Você não precisa instalar nada (faz tudo pelo navegador).

```
Compra aprovada → Checkout chama o Webhook → Função no Supabase:
   1) gera senha aleatória
   2) cria o usuário no banco
   3) manda e-mail (Brevo) com e-mail + senha
→ Cliente entra no app e faz login de verdade
```

---

## Parte 1 — Criar o projeto no Supabase

1. Acesse **https://supabase.com** → **Start your project** → entre com o Google/GitHub.
2. **New project**. Dê um nome (ex.: `protocolo-x`), crie uma senha do banco (guarde) e
   escolha a região **South America (São Paulo)**. Clique **Create new project** e aguarde ~2 min.
3. No menu, vá em **Project Settings** (engrenagem) → **API**. Anote dois valores:
   - **Project URL** (ex.: `https://abcdefgh.supabase.co`)
   - **anon public** key (uma chave longa começando com `eyJ...`)

4. Abra o arquivo **`js/supabase-config.js`** e cole os dois valores:
   ```js
   const SUPABASE_URL = "https://abcdefgh.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...sua-anon-key-completa...";
   ```
   > ⚠️ Use a **anon public** (é pública, pode ficar no site). **Nunca** use a `service_role` aqui.

5. Salve, faça commit e push (ou me peça para fazer). Pronto: o login já valida de verdade.

---

## Parte 2 — Criar a função do Webhook

1. No Supabase, menu lateral → **Edge Functions** → **Create a function** (ou **Deploy a new function**).
2. Nome da função: **`checkout-webhook`**.
3. Vai abrir um editor. **Apague o conteúdo de exemplo** e **cole todo o conteúdo** do arquivo
   [`supabase/functions/checkout-webhook/index.ts`](supabase/functions/checkout-webhook/index.ts) deste projeto.
4. Clique **Deploy**. Ao final, o Supabase mostra a **URL da função**, algo como:
   `https://abcdefgh.supabase.co/functions/v1/checkout-webhook`
   **Anote essa URL** — é ela que o checkout vai chamar.

---

## Parte 3 — Configurar o Brevo (envio de e-mail)

1. Crie conta em **https://www.brevo.com** (grátis, 300 e-mails/dia).
2. **Verifique um remetente**: menu **Senders, Domains & Dedicated IPs** → **Senders** →
   **Add a sender** com um e-mail seu (ex.: `contato@seudominio.com` ou até um Gmail seu).
   O Brevo envia um e-mail de confirmação — clique no link para verificar.
   > Para melhor entregabilidade (não cair no spam), o ideal é verificar um **domínio próprio**.
3. Pegue a **chave da API**: menu do perfil → **SMTP & API** → aba **API Keys** →
   **Generate a new API key**. Copie (começa com `xkeysib-...`).

---

## Parte 4 — Colocar os segredos na função

No Supabase: **Edge Functions** → função `checkout-webhook` → aba **Secrets**
(ou **Project Settings → Edge Functions → Secrets**). Adicione:

| Nome              | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| `WEBHOOK_SECRET`  | Um texto secreto que você inventa (ex.: `px_a1b2c3d4e5`)              |
| `BREVO_API_KEY`   | A chave `xkeysib-...` do Brevo                                         |
| `SENDER_EMAIL`    | O e-mail remetente que você verificou no Brevo                        |
| `SENDER_NAME`     | `Protocolo X`                                                          |
| `APP_URL`         | O link do seu app (ex.: `https://guisilvaa1111-crypto.github.io/microsaas-protocolox/`) |

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são fornecidos automaticamente — não precisa criar.

Depois de salvar os secrets, **faça Deploy da função de novo** (para ela pegar os valores).

---

## Parte 5 — Ligar ao seu checkout

Na sua plataforma de venda, cadastre um **Webhook / Postback** para o evento de
**compra aprovada**, apontando para a URL da função **com o segredo na ponta**:

```
https://abcdefgh.supabase.co/functions/v1/checkout-webhook?secret=px_a1b2c3d4e5
```

A função já entende os formatos mais comuns de e-mail do comprador (Kiwify, Hotmart, Stripe…).
Quando você definir a plataforma, me avise que eu ajusto:
- **Kiwify**: Webhooks → adicionar → evento *Compra aprovada*.
- **Hotmart**: Ferramentas → Webhook (Postback) → evento *Compra completa*.
- **Stripe**: Developers → Webhooks → evento `checkout.session.completed`.

Também recomendo, na tela de login, apontar o botão **"Adquira o Protocolo X"** para o link do seu
checkout (no `js/app.js`, procure por `SUA_URL_DE_CHECKOUT`).

---

## Parte 6 — Testar

**Teste rápido do e-mail/criação de usuário** (simula uma compra) — no terminal:
```bash
curl -X POST "https://abcdefgh.supabase.co/functions/v1/checkout-webhook?secret=px_a1b2c3d4e5" \
  -H "content-type: application/json" \
  -d '{"email":"voce@gmail.com","name":"Teste"}'
```
Deve responder `{"ok":true,...}` e chegar um e-mail com a senha. Depois, entre no app com esse
e-mail e a senha recebida. ✅

---

## ⚠️ Importante: proteção do conteúdo (próximo passo recomendado)

Hoje o login controla **o acesso à tela**, mas os arquivos de áudio ficam na pasta pública
`audio/` do GitHub Pages — ou seja, quem souber o link direto de um `.mp3` consegue baixar
sem login. Para um produto pago, o ideal é **proteger os áudios de verdade**:

> Mover os `.mp3` para o **Supabase Storage** (bucket privado) e gerar links temporários
> (*signed URLs*) só depois do login. Assim, sem comprar, ninguém acessa os áudios.

Isso é uma evolução natural depois que o login estiver no ar — é só me pedir que eu implemento.
