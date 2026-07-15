# 🌐 Migrar para domínio próprio + Hostinger (e e-mail próprio)

Guia para quando você comprar um domínio (ex.: `protocolox.com.br`), hospedar o site na
Hostinger e usar um e-mail próprio (ex.: `contato@protocolox.com.br`).

> **Regra de ouro:** o *backend* (Supabase + Wiven + Brevo) **continua o mesmo**. Muda só
> **onde o site está** e **qual e-mail envia**. São poucos ajustes — nenhuma reprogramação.

---

## Parte A — Hospedar o site na Hostinger

1. Compre o domínio (na Hostinger ou onde preferir) e um plano de hospedagem.
2. No **hPanel → Gerenciador de Arquivos**, entre em **`public_html`** e suba **apenas** o site:
   - ✅ `index.html`, pastas `css/`, `js/`, `assets/`, e `manifest.webmanifest`
   - ❌ **NÃO** suba: `audio/`, `scripts/`, `supabase/`, `.git`, nem os arquivos `.md`
3. Ative o **SSL grátis** (hPanel → **SSL**) para o site abrir com `https://` (obrigatório).
4. Se comprou o domínio fora da Hostinger, aponte os **nameservers** para a Hostinger
   (ela mostra quais usar).

> Os links do app são **relativos**, então funciona igual na raiz do domínio. Não precisa mudar caminho.

## Parte B — Avisar o Supabase do novo endereço (senão o login/“esqueci a senha” quebra)

1. **Authentication → URL Configuration**:
   - **Site URL:** `https://protocolox.com.br`
   - **Redirect URLs:** adicione `https://protocolox.com.br/**`
2. **Edge Functions → Secrets** → troque:
   - **`APP_URL`** = `https://protocolox.com.br`  (é o link do botão no e-mail de acesso)

Nada muda em `js/supabase-config.js` (URL e anon key continuam iguais).
A URL do webhook na **Wiven também não muda** (ela aponta para o Supabase, não para o seu site).

## Parte C — E-mail próprio (melhora a entrega e o profissionalismo)

Hoje o Brevo envia de um remetente simples. Com domínio próprio, o ideal é **autenticar o domínio**
no Brevo (evita cair no spam):

1. No **Brevo → Senders, Domains & Dedicated IPs → Domains → Authenticate a domain**:
   informe `protocolox.com.br`. O Brevo vai te dar alguns **registros DNS** (SPF, DKIM, DMARC).
2. Na **Hostinger → hPanel → DNS / Zona DNS** do seu domínio, **adicione esses registros** (TXT/CNAME)
   exatamente como o Brevo mostrou. Aguarde a validação (pode levar de minutos a algumas horas).
3. (Opcional, para **receber** respostas) Crie a caixa de e-mail `contato@protocolox.com.br`
   no e-mail da Hostinger (ou Google Workspace/Titan).
4. No **Supabase → Edge Functions → Secrets**, troque:
   - **`SENDER_EMAIL`** = `contato@protocolox.com.br`
   - **`SENDER_NAME`** = `Protocolo X` (se quiser)
5. Faça uma compra-teste e confira se o e-mail chega bonito e não cai no spam.

---

## ✅ Checklist rápido da migração

- [ ] Site subido em `public_html` (sem `audio/`, `scripts/`, `supabase/`, `.md`)
- [ ] SSL (https) ativo na Hostinger
- [ ] Supabase **Site URL** + **Redirect URLs** com o novo domínio
- [ ] Secret **`APP_URL`** atualizado
- [ ] Domínio autenticado no Brevo (DNS na Hostinger)
- [ ] Secret **`SENDER_EMAIL`** com o e-mail próprio
- [ ] Compra-teste: e-mail chega + login funciona no novo endereço

> **Dica:** se o único objetivo for ter um domínio bonito, dá pra usar domínio próprio **de graça
> no GitHub Pages** (Settings → Pages → Custom domain) — sem precisar migrar para a Hostinger.
> A Hostinger vale a pena se você também quiser e-mail próprio, outros sites, ou um painel único.

## O que **NUNCA** muda na migração
- `js/supabase-config.js` (URL + anon key)
- O bucket de áudios e os links assinados
- A função do webhook e a URL dela na Wiven
- Os segredos `WEBHOOK_SECRET` e `BREVO_API_KEY`
