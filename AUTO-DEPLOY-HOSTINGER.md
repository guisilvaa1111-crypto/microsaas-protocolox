# 🔄 Deploy automático: conectar o GitHub à Hostinger

Objetivo: cada `git push` na branch `main` **atualiza o site na Hostinger sozinho**
(igual ao GitHub Pages, mas no seu domínio).

> **Pré-requisito:** plano de hospedagem ativo na Hostinger com o recurso **GIT**
> (planos Premium/Business/Cloud). Sem plano, faça isso depois de contratar.

---

## Passo 1 — Conectar o repositório (no hPanel da Hostinger)

1. hPanel → seu site → **Avançado** → **GIT**.
2. Em **Criar novo repositório**:
   - **Repositório:** `https://github.com/guisilvaa1111-crypto/microsaas-protocolox.git`
   - **Branch:** `main`
   - **Diretório:** `public_html`
3. Clique **Criar**. Como o repositório é **público**, não precisa de usuário/senha.
   A Hostinger clona os arquivos e o site já fica no ar.

## Passo 2 — Ligar o deploy automático (webhook)

1. Ainda na seção **GIT**, encontre **Auto deployment / Implantação automática**.
   Ela mostra uma **URL de Webhook** — **copie**.
2. No GitHub: repositório → **Settings → Webhooks → Add webhook**:
   - **Payload URL:** cole a URL da Hostinger
   - **Content type:** `application/json`
   - **Which events would you like:** *Just the push event*
   - **Add webhook**

Feito! Agora todo push na `main` dispara a atualização automática na Hostinger.

## Como usar no dia a dia
- Alterou algo (ex.: adicionou música no `js/data.js`) → `git push` → o site atualiza sozinho.
- Se preferir forçar na hora, o painel GIT também tem um botão **"Deploy"** manual.

---

## Observações

- **Áudios:** não ficam no repositório (estão no Supabase Storage), então não sobem — correto.
- **Arquivos extras:** a Hostinger clona o repo inteiro, então `scripts/`, `supabase/` e os `.md`
  também vão para `public_html`. Não expõem segredos (as chaves ficam só no Supabase), mas se
  quiser um deploy **só com os arquivos do site**, use **GitHub Actions** (alternativa mais limpa).
- Depois de conectar, faça os ajustes de domínio do **GUIA-COMPLETO.md**
  (Supabase Site URL/Redirect URLs, secret `APP_URL`, SSL na Hostinger).

## Alternativa mais limpa (opcional): GitHub Actions
Em vez do GIT da Hostinger, dá para usar uma automação que envia **só** os arquivos do site por FTP
a cada push. Precisa cadastrar no GitHub (Settings → Secrets) o host/usuário/senha FTP da Hostinger.
Se quiser esse caminho, peça que a configuração (`.github/workflows/deploy.yml`) é montada rapidinho.
