# 📘 Guia Completo — Protocolo X

Tudo que você precisa para: **comprar domínio próprio**, **ter e-mail próprio**,
**hospedar na Hostinger**, ajustar todas as configurações (Brevo, Supabase, Wiven) e
**adicionar novas músicas**. Feito passo a passo, sem enrolação.

## Índice
1. [Visão geral — o que muda e o que NÃO muda](#1-visão-geral)
2. [Comprar domínio e e-mail próprio](#2-comprar-domínio-e-e-mail)
3. [Hospedar o site na Hostinger](#3-hospedar-o-site-na-hostinger)
4. [Autenticar o domínio no Brevo (e-mail não cai no spam)](#4-brevo--autenticar-domínio)
5. [Ajustes no Supabase](#5-ajustes-no-supabase)
6. [Wiven (o que muda)](#6-wiven)
7. [Checklist final da migração](#7-checklist-final-da-migração)
8. [Como adicionar novas músicas](#8-como-adicionar-novas-músicas)

---

## 1. Visão geral

Pensa no seu produto em 2 camadas:
- **Frente (o site/app)** — os arquivos HTML/CSS/JS. Hoje no GitHub Pages; podem ir para a Hostinger.
- **Cérebro (o backend)** — Supabase (login + banco + áudios) · Wiven (checkout) · Brevo (e-mail).

> **Regra de ouro:** ao mudar de domínio/hospedagem, o **cérebro continua o mesmo**.
> Você só troca **onde o site mora** e **avisa o backend qual é o novo endereço**.

### O que MUDA na migração
| Item | Ação |
|---|---|
| Onde o site está | Subir os arquivos para a Hostinger |
| Supabase → Site URL / Redirect URLs | Passa a ser o novo domínio |
| Supabase → secret `APP_URL` | Novo domínio |
| Supabase → secret `SENDER_EMAIL` | E-mail próprio |
| Supabase → SMTP (e-mails de login) | Remetente com e-mail próprio |
| Brevo | Autenticar o domínio (registros DNS) |

### O que NÃO muda (nunca)
- `js/supabase-config.js` (URL + anon key continuam iguais)
- A URL do webhook na Wiven (aponta para o Supabase, não para o seu site)
- O bucket de áudios e os links assinados
- Os segredos `WEBHOOK_SECRET` e `BREVO_API_KEY`

---

## 2. Comprar domínio e e-mail

### 2.1 Domínio
1. Na **Hostinger** (ou onde preferir), compre o domínio, ex.: `protocolox.com.br`.
2. Se comprar na Hostinger junto com a hospedagem, ela já conecta tudo sozinha.
   Se comprar em outro lugar, você vai apontar os **nameservers** para a Hostinger (ela informa quais).

### 2.2 E-mail próprio
Você tem duas necessidades diferentes — atenção, porque muita gente confunde:
- **ENVIAR** e-mails automáticos (acesso na compra, recuperação de senha) → quem faz é o **Brevo**.
  Para isso não precisa de "caixa de e-mail", só **autenticar o domínio** no Brevo (Parte 4).
- **RECEBER** respostas em `contato@protocolox.com.br` → aí sim precisa de uma **caixa de e-mail**.
  Contrate o **e-mail da Hostinger** (Hostinger Email/Titan) ou Google Workspace e crie o endereço.

> Recomendado: crie `contato@protocolox.com.br` (ou `acesso@`, `suporte@`) para usar como remetente
> e receber respostas dos clientes.

---

## 3. Hospedar o site na Hostinger

1. No **hPanel → Gerenciador de Arquivos**, entre na pasta **`public_html`**.
2. Suba **apenas os arquivos do site**:
   - ✅ `index.html`
   - ✅ pasta `css/`
   - ✅ pasta `js/`
   - ✅ pasta `assets/`
   - ✅ `manifest.webmanifest`
   - ❌ **NÃO** suba: `audio/`, `scripts/`, `supabase/`, `.git`, nem os arquivos `.md`
3. Ative o **SSL grátis** (hPanel → **SSL** → ativar). O site precisa abrir em **https://**.
4. Se comprou o domínio fora da Hostinger, configure os **nameservers** apontando para ela.
5. Teste: abra `https://protocolox.com.br` e veja se o app carrega.

> Os caminhos do app são **relativos**, então funciona igual na raiz do domínio — não precisa mudar código.

---

## 4. Brevo — autenticar domínio

Isso faz seus e-mails saírem como `@protocolox.com.br` e **não caírem no spam**.

1. No **Brevo → Senders, Domains & Dedicated IPs → Domains → Authenticate a domain**: informe `protocolox.com.br`.
2. O Brevo vai te dar alguns **registros DNS** (SPF, DKIM, DMARC — tipos TXT/CNAME).
3. Na **Hostinger → hPanel → DNS / Zona DNS** do domínio, **adicione cada registro** exatamente como o Brevo mostrou.
4. Volte no Brevo e clique em **verificar**. Pode levar de minutos a algumas horas para validar.
5. Em **Senders**, deixe `contato@protocolox.com.br` como remetente verificado.

---

## 5. Ajustes no Supabase

### 5.1 URL do app (senão login e "esqueci a senha" quebram)
**Authentication → URL Configuration:**
- **Site URL:** `https://protocolox.com.br`
- **Redirect URLs:** adicione `https://protocolox.com.br/**`
  (pode deixar também a URL antiga do GitHub Pages, não atrapalha)

### 5.2 Secrets da função (Edge Functions → Secrets)
- **`APP_URL`** = `https://protocolox.com.br`  → link do botão no e-mail de compra
- **`SENDER_EMAIL`** = `contato@protocolox.com.br`  → remetente do e-mail de compra
- (os demais secrets continuam iguais)
- Depois de salvar, **faça Deploy da função de novo** para pegar os novos valores.

### 5.3 SMTP dos e-mails de login (recuperação de senha)
Para o e-mail de "esqueci minha senha" sair confiável pelo Brevo:
**Authentication → Emails → SMTP Settings → Enable Custom SMTP:**
| Campo | Valor |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | seu **login SMTP** do Brevo (aba SMTP & API → SMTP) |
| Password | a **chave SMTP** do Brevo (`xsmtpsib-...`) |
| Sender email | `contato@protocolox.com.br` |
| Sender name | `Protocolo X` |

> A anon key e a URL do projeto **não mudam** — não mexa no `js/supabase-config.js`.

---

## 6. Wiven

**Nada muda.** A URL do webhook aponta para o Supabase, não para o seu site:
```
https://ihdccpxqjjysjsxkdrlm.supabase.co/functions/v1/checkout-webhook?secret=SEU_WEBHOOK_SECRET
```
Continue com os 4 eventos marcados: **Transação paga · estornada · Chargeback · MED**.

> Só reveja se o botão/link de compra do seu site aponta para o **checkout da Wiven** correto.

---

## 7. Checklist final da migração

- [ ] Domínio comprado e conectado à Hostinger
- [ ] Site subido em `public_html` (sem `audio/`, `scripts/`, `supabase/`, `.md`)
- [ ] SSL (https) ativo
- [ ] Caixa de e-mail `contato@...` criada (para receber respostas)
- [ ] Domínio autenticado no Brevo (registros DNS na Hostinger)
- [ ] Supabase → Site URL + Redirect URLs com o novo domínio
- [ ] Supabase → secrets `APP_URL` e `SENDER_EMAIL` atualizados + função redeployada
- [ ] Supabase → SMTP do Brevo configurado (e-mails de login)
- [ ] Teste real: compra → e-mail chega → login funciona → "esqueci a senha" funciona

> 💡 Se você só quer um domínio bonito (sem e-mail próprio), dá pra usar domínio personalizado
> **de graça no próprio GitHub Pages** (Settings → Pages → Custom domain) — sem migrar para a Hostinger.

---

## 8. Como adicionar novas músicas

Os áudios ficam no **bucket privado do Supabase** (não no site). Adicionar uma faixa tem 4 passos:

1. **Prepare o arquivo:** nomeie no padrão `51-nome-da-faixa.mp3` e coloque na pasta local `audio/`.
2. **Cadastre no app:** abra `js/data.js` e adicione uma linha no array `TRACKS`:
   ```js
   { titulo: "Nome da Faixa", tags: ["Meditação", "Cura"], file: "51-nome-da-faixa.mp3" },
   ```
   - As tags devem ter a **mesma grafia** da lista `TAG_ORDER`.
   - Para criar uma **categoria nova**, adicione o nome dela também em `TAG_ORDER`.
3. **Envie o áudio ao bucket:** 2 cliques em `scripts/SUBIR-AUDIOS.bat` (envia/atualiza todos)
   — ou arraste só o novo `.mp3` no painel **Supabase → Storage → bucket `audios`**.
4. **Publique o cadastro** (o `js/data.js` que você alterou):
   - **Se estiver no GitHub Pages:** faça commit e push do `js/data.js`.
   - **Se estiver na Hostinger:** suba o `js/data.js` atualizado para `public_html/js/`, substituindo o antigo.

Pronto — a nova faixa aparece no app. 🎧

> ⚠️ Nunca suba os `.mp3` para o site/`public_html` nem para o GitHub — eles ficam **só** no bucket
> privado do Supabase. É isso que impede que baixem suas músicas sem comprar.

---

## Resumo rápido — "onde mexo em quê?"

| Você quer… | Onde mexe |
|---|---|
| Trocar o endereço do site | Hostinger (upload) + Supabase (Site URL, Redirect, APP_URL) |
| Ter e-mail próprio | Brevo (autenticar domínio) + Supabase (SENDER_EMAIL, SMTP) + Hostinger (caixa de e-mail) |
| Adicionar música | `js/data.js` + bucket `audios` + republicar o `data.js` |
| Mudar preço/checkout | Só na Wiven (o app não muda) |
| Nada disso afeta | `supabase-config.js`, URL do webhook, `WEBHOOK_SECRET`, `BREVO_API_KEY` |
