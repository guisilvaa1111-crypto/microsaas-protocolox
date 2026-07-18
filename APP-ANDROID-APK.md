# 📱 Protocolo de Assis — App instalável (Android e iPhone)

O app já é um **PWA completo** (manifesto + ícones + service worker). Isso permite instalá-lo
como app de verdade — e o app **é o seu próprio site**: login, Supabase, músicas e bônus
funcionam exatamente igual, e toda atualização do site aparece no app sozinha.

---

# 🤖 ANDROID

## Opção A — Instalar direto (10 segundos, sem APK)
1. Abra **https://protocolox.online** no **Chrome**
2. Menu (⋮) → **Instalar aplicativo**
3. Pronto: ícone próprio, tela cheia, igual app nativo.

## Opção B — Gerar o arquivo APK (PWABuilder, grátis, sem instalar nada)
1. Acesse **https://www.pwabuilder.com** → cole `https://protocolox.online` → **Start**
2. **Package for stores** → **Android** → **Generate Package**
3. Confira: **Package ID** (ex.: `online.protocolox.app` — **não mude depois**) e **App name**: `Protocolo de Assis`
4. Baixe o `.zip`:
   - **`app-release-signed.apk`** → é este que você instala no celular
   - `app-release-bundle.aab` → só para a Play Store
   - ⚠️ **`signing.keystore` + `signing-key-info.txt`** → **GUARDE!** Sem eles você não publica atualizações
   - `assetlinks.json` → usado no passo abaixo

**Instalar:** mande o `.apk` para o celular → toque → permita "Instalar apps desconhecidos" → instala. 🎉

---

## 🔗 Tirar a barra de endereço (assetlinks) — jeito fácil

O APK é uma **TWA** (abre seu site em tela cheia). Para o Android confiar que o app e o site são
seus — e sumir com a barrinha de endereço — é preciso publicar um arquivo de verificação.

✅ **Já deixei o arquivo pronto no projeto**, em `.well-known/assetlinks.json`. Assim ele vai para
a Hostinger **automaticamente** no Deploy — você **não precisa** criar pasta com ponto no
Gerenciador de Arquivos (que é chato) nem refazer isso a cada deploy.

**Você só preenche 2 valores:**

1. Abra o `assetlinks.json` que veio no `.zip` do PWABuilder. Ele terá algo assim:
   ```json
   "package_name": "online.protocolox.app",
   "sha256_cert_fingerprints": ["A1:B2:C3:...:F9"]
   ```
2. Abra o arquivo do projeto: [`.well-known/assetlinks.json`](.well-known/assetlinks.json) e
   substitua os dois marcadores:
   - `COLE_AQUI_O_PACKAGE_ID` → o **package_name** (ex.: `online.protocolox.app`)
   - `COLE_AQUI_A_IMPRESSAO_DIGITAL_SHA256` → a **impressão digital** (aquele monte de `AA:BB:CC…`)
3. Faça commit/push (ou me peça) → **hPanel → GIT → Deploy**
4. Confira abrindo: **https://protocolox.online/.well-known/assetlinks.json**
   (tem que aparecer o JSON com os seus valores)
5. Reinstale/reabra o app — a barra de endereço some. ✨

> **Alternativa manual** (se preferir): suba o `assetlinks.json` do PWABuilder direto em
> `public_html/.well-known/` pelo Gerenciador de Arquivos da Hostinger. Funciona igual, mas você
> teria que refazer caso o deploy sobrescreva.

> ⚠️ Sem esse arquivo o app funciona normalmente — só aparece uma barrinha com o endereço no topo.

---

# 🍎 IPHONE (iOS)

**A Apple não permite APK nem instalar apps "de fora" da App Store.** Então no iPhone existem
2 caminhos — e o primeiro é o que praticamente todo mundo usa:

## Opção A — Instalar pela Tela de Início (recomendado, grátis, funciona hoje)
1. Abra **https://protocolox.online** no **Safari** (precisa ser o Safari)
2. Toque no botão **Compartilhar** (quadrado com seta pra cima)
3. **Adicionar à Tela de Início** → **Adicionar**

Resultado: ícone do Protocolo de Assis na tela do iPhone, abre **em tela cheia, sem a barra do Safari** —
a experiência é de app nativo. Eu já configurei as meta tags da Apple para isso funcionar direito.

> É o equivalente ao APK no mundo iOS. Login, sessão salva, músicas e bônus: tudo igual.

## Opção B — App na App Store (caro e com risco)
Só vale se você quiser mesmo estar na loja. É bem mais trabalhoso:
- **Conta Apple Developer: US$ 99/ano** (a Google cobra US$ 25 uma vez só)
- Precisa de um **Mac com Xcode** para compilar (o PWABuilder gera o projeto iOS, mas quem compila é você no Mac)
- ⚠️ **Risco real de reprovação:** a Apple tem a regra 4.2 ("Minimum Functionality") e costuma
  **rejeitar apps que são só um site embrulhado**. Para passar, o app precisa de recursos nativos
  de verdade (notificações, download offline, etc.).

**Minha recomendação:** fique na Opção A no iPhone. Você tem 95% da experiência de app, sem custo,
sem Mac e sem risco de reprovação.

---

---

# 📊 Compatibilidade e problemas de instalação

## Em quais Androids o APK funciona?
O APK é uma **TWA**, que usa o Chrome por baixo (precisa de **Chrome 72+**, de 2019).

| Versão | Funciona? |
|---|---|
| **Android 5.0+** (2014 em diante) | ✅ Sim — **~99% dos aparelhos em uso** |
| Android 4.x (2013 e antes) | ⚠️ Provavelmente não |
| Celular sem Chrome (alguns Huawei) | ⚠️ Pode falhar |

> **Rede de segurança:** quem não conseguir instalar o APK pode sempre usar o
> **"Instalar aplicativo" pelo navegador** (Opção A lá em cima) — funciona em praticamente
> qualquer celular. Vale deixar essa alternativa no seu e-mail/suporte.

## "App não instalado" / erros — as causas REAIS
Quase nunca é a versão do Android. Na ordem de frequência:

1. **Já existe uma versão antiga instalada com outra chave de assinatura**
   → Peça para **desinstalar** o app antigo antes de instalar o novo. (É por isso que você deve
   sempre usar o **mesmo `signing.keystore`** nas atualizações.)

2. **"Instalar apps desconhecidos" bloqueado**
   → No aviso que aparece, tocar em **Configurações** → permitir para o app que está abrindo o
   arquivo (Arquivos, Chrome, Drive…).

3. **Play Protect avisa "app não reconhecido"**
   → Normal em APK fora da Play Store. Tocar em **"Instalar mesmo assim"**.
   (Some se você publicar na Play Store.)

4. **Arquivo corrompido no envio** ⚠️ *(erro silencioso e comum)*
   → **Não mande o APK por WhatsApp** — ele pode renomear/comprimir e corromper.
   → Use **Google Drive**, um **link direto de download** ou cabo USB.

5. **Armazenamento cheio** → liberar espaço.

## Dicas para maximizar a compatibilidade
- No PWABuilder (opções avançadas), deixe **Fallback behavior: Custom Tabs** (padrão). Assim,
  em aparelhos sem suporte total a TWA, o app ainda abre.
- **Distribua por link direto** (Drive/site), não por WhatsApp.
- **Publicar na Play Store** resolve tudo de vez: a loja cuida da compatibilidade, some o aviso do
  Play Protect e as atualizações ficam automáticas.

---

## 🔄 Atualizações
Como o app carrega o site, **tudo que você publica aparece no app automaticamente** (músicas novas,
visual, etc.). Só precisa gerar APK novo se mudar **ícone**, **nome** ou o manifesto.

⚠️ **Sempre reutilize o mesmo `signing.keystore`** ao gerar um APK novo. Se usar uma chave
diferente, quem já tem o app instalado recebe "App não instalado" e precisa desinstalar antes —
e você ainda teria que atualizar o `assetlinks.json` com a nova impressão digital.

## ❓ Dúvidas comuns
- **Login funciona no app?** Sim, e continua salvo (não precisa logar toda hora).
- **Funciona offline?** A tela abre offline; músicas e bônus precisam de internet (ficam no Supabase).
- **Preciso da Play Store?** Não. O APK instala direto.
