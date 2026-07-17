# 📱 Protocolo X — App instalável (APK Android)

O app já está preparado como **PWA completo** (manifesto + ícones + service worker).
Isso significa que ele pode virar um **APK instalável** — e o APK é o **seu próprio app**,
com login, Supabase, músicas e bônus funcionando exatamente igual.

Existem 2 caminhos. Comece pelo 1 (leva 10 segundos) e faça o 2 quando quiser o arquivo `.apk`.

---

## ✅ Caminho 1 — Instalar direto do navegador (mais rápido, sem APK)

No **Android (Chrome)**:
1. Abra **https://protocolox.online**
2. Menu (⋮) → **Instalar aplicativo** (ou "Adicionar à tela inicial")
3. Pronto: o Protocolo X aparece na gaveta de apps, com ícone próprio e **em tela cheia**
   (sem barra de endereço), igual a um app nativo.

No **iPhone (Safari)**:
1. Abra **https://protocolox.online**
2. Botão **Compartilhar** → **Adicionar à Tela de Início**

> Já funciona hoje. A diferença para o APK é que aqui não existe um arquivo `.apk` para
> distribuir/publicar — a instalação sai do navegador.

---

## 📦 Caminho 2 — Gerar o arquivo APK (PWABuilder, grátis, sem instalar nada)

1. Acesse **https://www.pwabuilder.com**
2. Cole a URL do app: **`https://protocolox.online`** → clique em **Start**
3. Ele analisa o PWA (deve passar em Manifesto, Service Worker e Segurança ✅)
4. Clique em **Package for stores** → cartão **Android** → **Generate Package**
5. Nas opções, confira:
   - **Package ID**: algo como `online.protocolox.app` (é a identidade do app — **não mude depois**)
   - **App name**: `Protocolo X`
   - **Signing key**: deixe **"Create new"** na primeira vez
6. Baixe o `.zip`. Dentro dele vêm:
   - **`app-release-signed.apk`** → é **este** que você instala no celular
   - `app-release-bundle.aab` → só serve para publicar na Play Store
   - **`signing.keystore` + `signing-key-info.txt`** → ⚠️ **GUARDE COM CUIDADO**
     (sem eles você não consegue publicar atualizações do mesmo app depois)
   - `assetlinks.json` → veja o passo abaixo

### Instalar o APK no celular
1. Envie o `app-release-signed.apk` para o celular (WhatsApp, Drive, cabo…)
2. Toque no arquivo → o Android pede para permitir **"Instalar apps desconhecidos"** → permita
3. Instala e pronto. 🎉

### (Importante) Tirar a barra de endereço — `assetlinks.json`
O APK é uma **TWA** (o app abre seu site em tela cheia). Para o Android confiar que o app e o
site são seus — e assim **remover a barra de endereço** — é preciso publicar um arquivo:

1. No `.zip` do PWABuilder, pegue o **`assetlinks.json`**
2. Suba-o na Hostinger em: **`public_html/.well-known/assetlinks.json`**
   (crie a pasta `.well-known` se não existir)
3. Confira abrindo: `https://protocolox.online/.well-known/assetlinks.json`
4. Reinstale/reabra o app — a barra de endereço some.

> Sem esse arquivo o app funciona, mas mostra uma barrinha com o endereço no topo.

---

## 🏪 (Opcional) Publicar na Google Play
1. Crie uma conta de desenvolvedor Google Play (taxa única de ~US$ 25)
2. Envie o **`app-release-bundle.aab`** (não o APK)
3. Preencha ficha, ícone, capturas de tela e política de privacidade
4. Use **sempre o mesmo `signing.keystore`** nas atualizações

---

## 🔄 Como atualizar o app depois
A melhor parte: **você quase nunca precisa gerar um APK novo.**

Como o APK carrega o site, **toda mudança que você publica no site aparece no app automaticamente**
(adicionar músicas, mexer no visual, etc.). Só é preciso gerar um APK novo se você mudar:
- o **ícone** do app,
- o **nome** do app,
- ou algo do próprio manifesto.

---

## ❓ Perguntas comuns

**O login vai funcionar no APK?** Sim. É o mesmo app, mesma sessão do Supabase — e o login
continua salvo (a pessoa não precisa logar toda hora).

**Funciona offline?** A tela do app abre offline (graças ao service worker), mas músicas e
bônus precisam de internet (ficam no Supabase).

**Preciso da Play Store?** Não. O APK instala direto no celular.

**E o iPhone?** A Apple não permite APK. No iOS, use o **Caminho 1** (Adicionar à Tela de Início),
que dá a mesma experiência de app.
