# 🎁 Seção de Bônus + Downloads

O app agora tem uma aba **Bônus** (3 bônus para todos os usuários logados) e um botão de
**download em cada música**. Assim como os áudios, os bônus ficam num **bucket privado** e só
podem ser baixados por quem está logado (link assinado temporário).

## Os 3 bônus (pasta local `bonus/`)
| # | Bônus | Arquivo |
|---|---|---|
| 1 | Guia Prático Passo a Passo | `guia-pratico-passo-a-passo.png` |
| 2 | A Oração do Sexto Sentido | `oracao-do-sexto-sentido.pdf` |
| 3 | Bônus Secreto — Oração de São Bento | `oracao-de-sao-bento-prosperidade.pdf` |

---

## Como publicar (3 passos, ~5 min)

### 1. Criar o bucket privado `bonus`
Supabase → **Storage** → **New bucket** → nome **`bonus`** → deixe **"Public" DESMARCADO** → Save.

### 2. Liberar leitura só para usuários logados
Supabase → **SQL Editor** → cole e **Run**:
```sql
create policy "Bonus: leitura para autenticados"
on storage.objects for select
to authenticated
using ( bucket_id = 'bonus' );
```

### 3. Subir os arquivos
Dê 2 cliques em [`scripts/SUBIR-BONUS.bat`](scripts/SUBIR-BONUS.bat) e cole a **service_role key**
quando pedir (não fica salva). Ele envia os 3 arquivos da pasta `bonus/`.
> Ou arraste os arquivos no painel **Storage → bucket `bonus`** (mantendo os mesmos nomes).

---

## Download das músicas
Já funciona automaticamente — usa o bucket **`audios`** que você já criou (mesmo esquema de link
assinado). Cada faixa tem o ícone de download ⬇️.

## Trocar/atualizar um bônus depois
1. Coloque o arquivo novo em `bonus/` (mesmo nome, para substituir).
2. Rode o `SUBIR-BONUS.bat` de novo (ele sobrescreve).
3. Se mudar o nome do arquivo, atualize o campo `file` do bônus em [`js/data.js`](js/data.js).

## Observação
Esta seção está na branch **`tela-de-bonus-protocolox`**. Quando você aprovar, a gente junta na
`main` (que é o que vai pro site). Enquanto isso, dá pra testar tudo nesta branch.
