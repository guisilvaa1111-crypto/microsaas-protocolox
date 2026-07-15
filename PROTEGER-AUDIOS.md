# 🔒 Proteger os áudios com Supabase Storage

Antes, os `.mp3` ficavam na pasta pública do GitHub Pages — qualquer um com o link baixava
sem comprar. Agora os áudios ficam num **bucket privado** no Supabase e o app gera **links
temporários (signed URLs)** que só funcionam para quem está **logado**. Sem login = sem áudio.

> Os áudios foram **removidos do repositório público** (inclusive do histórico do Git).
> Eles continuam salvos na sua máquina, na pasta `audio/` (que agora é ignorada pelo Git).
> **O app só vai tocar depois que você subir os áudios para o bucket** (passos abaixo).

---

## Passo 1 — Criar o bucket privado

1. No Supabase: menu **Storage** → **New bucket**.
2. Nome: **`audios`** (tudo minúsculo).
3. **Deixe "Public bucket" DESMARCADO** (é isso que protege).
4. **Save**.

## Passo 2 — Liberar acesso só para usuários logados

No Supabase: **SQL Editor** → **New query** → cole e clique **Run**:

```sql
create policy "Audios: leitura para autenticados"
on storage.objects for select
to authenticated
using ( bucket_id = 'audios' );
```

Isso permite que **apenas quem está autenticado** gere os links dos áudios.

## Passo 3 — Subir os 50 áudios para o bucket

**Opção A — pelo script (recomendado):**
1. Pegue a **service_role key**: Supabase → **Project Settings → API** → seção *Project API keys*
   → **service_role** (é secreta! nunca coloque no site).
2. Rode o script: clique com o direito em [`scripts/subir-audios-supabase.ps1`](scripts/subir-audios-supabase.ps1)
   → **Executar com o PowerShell**. Cole a chave quando pedir. Ele envia os 50 arquivos.

**Opção B — pelo painel (manual):**
- **Storage** → bucket `audios` → **Upload files** → selecione todos os `.mp3` da pasta `audio/`.
- ⚠️ Importante: os nomes precisam bater com o campo `file` do `js/data.js`
  (ex.: `01-deriva-celestial.mp3`). Pelo script isso já é garantido.

## Passo 4 — Publicar

O código do app já está pronto para usar o bucket (`js/supabase-config.js` → `SUPABASE_AUDIO_BUCKET = "audios"`).
Basta o commit/push já feito. Teste: faça login no app e toque uma faixa — deve tocar
normalmente. Abra o app **sem logar** (aba anônima) e confirme que os áudios **não** tocam. ✅

---

## Como testar se está realmente protegido

1. Logado no app: as faixas tocam. ✔️
2. Pegue o link direto de um áudio antigo do GitHub (ex.:
   `https://guisilvaa1111-crypto.github.io/microsaas-protocolox/audio/01-deriva-celestial.mp3`)
   → deve dar **404** (não existe mais no site público). ✔️
3. No painel do Supabase, o bucket `audios` aparece como **Private**. ✔️

Qualquer erro de "Não foi possível carregar o áudio" no app geralmente significa que:
faltou subir os arquivos ao bucket, ou faltou rodar o SQL do Passo 2.
