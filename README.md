# 🔮 Protocolo X

Mini app **mobile-first** de áudios espirituais para **descalcificação da pineal** —
relaxamento, meditação, autoconhecimento e prosperidade.

Feito em **HTML + CSS + JavaScript puro** (sem build, sem dependências). Publica direto no GitHub Pages.

---

## ✨ Recursos

- 🎧 Player completo: play/pause, anterior/próxima, barra de progresso com seek, aleatório e repetir.
- 🔍 Busca por nome ou tag.
- 🏷️ Filtros por categoria: Relaxamento, Meditação, Autoconhecimento, Prosperidade, Sono, Cura, Foco, Terceiro Olho.
- ⭐ Favoritos salvos no dispositivo (localStorage).
- 📱 Controles na tela de bloqueio do celular (Media Session API) + app instalável (PWA).
- 🔐 Tela de login já pronta visualmente (hoje em modo demonstração) para conectar a um banco de dados real.
- 🎨 Paleta e estilo guiados pela logo (navy profundo · roxo místico · dourado · brilho violeta).

**50 faixas** já incluídas.

---

## 📂 Estrutura

```
protocolo x/
├── index.html                 # estrutura da página
├── manifest.webmanifest       # app instalável (PWA)
├── css/styles.css             # estilo visual (paleta da logo)
├── js/
│   ├── data.js                # ← as 50 músicas (nomes, tags e arquivos)
│   └── app.js                 # player, filtros, favoritos, login
├── audio/                     # ← os arquivos .mp3 (hospedados junto do app)
├── scripts/
│   └── baixar-audios.ps1      # baixa/repõe os áudios a partir do Google Drive
└── assets/
    └── favicon.svg            # ícone (troque por logo.png se quiser)
```

> **Por que os áudios ficam na pasta `audio/` e não no Google Drive?**
> O Google Drive **não permite tocar áudio direto num site** (bloqueia o acesso
> por segurança/CORS). Hospedando os `.mp3` no mesmo domínio do app, a reprodução
> fica 100% confiável, com barra de progresso e avanço automático.

---

## ➕ Como adicionar novas músicas (rumo às 70+)

1. Coloque o novo arquivo `.mp3` na pasta `audio/` (ex.: `audio/51-nome-da-faixa.mp3`).
2. Abra [`js/data.js`](js/data.js) e adicione uma linha no array `TRACKS`:

```js
{ titulo: "Nome da Faixa", tags: ["Meditação", "Cura"], file: "51-nome-da-faixa.mp3" },
```

> As tags precisam ter a mesma grafia da lista `TAG_ORDER` para os filtros funcionarem.

Se um dia precisar **rebaixar todos os áudios** do Drive, rode:
`powershell -ExecutionPolicy Bypass -File scripts\baixar-audios.ps1`

---

## 🔐 Login funcional (próximo passo)

Hoje o login é apenas visual (qualquer e-mail/senha entra). Para torná-lo **funcional com banco de dados**
— para que, ao comprar, a pessoa receba o acesso por e-mail — basta trocar o miolo da função
`handleLogin` em [`js/app.js`](js/app.js). Há um exemplo comentado usando **Supabase** no próprio arquivo.

Fluxo recomendado para o futuro:
1. Cliente compra na plataforma de pagamento (ex.: Hotmart/Kiwify/Stripe).
2. Um webhook cria o usuário no banco (Supabase) e dispara o e-mail com o acesso.
3. O login passa a validar de verdade contra esse banco.

---

## 🚀 Publicar (GitHub Pages)

1. Faça o push deste repositório para o GitHub.
2. No repositório: **Settings → Pages → Branch: `main` / `/root` → Save**.
3. Em ~1 min o app fica no ar em `https://guisilvaa1111-crypto.github.io/microsaas-protocolox/`.

---

## ⚠️ Escala futura

Hospedar os áudios no próprio repositório funciona muito bem para começar. Se o produto
crescer bastante (muitos acessos simultâneos), o ideal é mover os `.mp3` para um
armazenamento com CDN (Cloudflare R2, Bunny.net, Supabase Storage). A troca é simples:
o campo `url` de cada faixa em `data.js` já permite apontar para qualquer link direto.
