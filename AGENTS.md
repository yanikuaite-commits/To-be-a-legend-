# AGENTS.md

## Repositório

`To-be-a-legend-` — jogo de carreira de futebol, em duas implementações no mesmo repo:

- **Web** (`src/`) — React 18 + TypeScript + Vite. É o jogo principal (~12k linhas).
- **Godot** (`godot/`) — port em Godot 4.3 (GDScript), desktop e browser. É uma
  reimplementação **parcial** (~4k linhas): só tem liga, tabela, calendário,
  atributos, treino e notícias. Faltam taça, continental, seleção, mundial,
  transferências, conquistas, evolução, contrato e histórico.

O APK Android **não** vem do Godot: empacota o jogo React com Capacitor (ver
`android/`), para que o telemóvel tenha o jogo completo. O Godot só é publicado
como build de browser e Linux.

## Comandos

```bash
npm ci            # o package-lock.json está versionado; usa sempre npm ci
npm run build     # tsc -b && vite build -> dist/

npm run android:sync   # build web + cap sync android (copia dist/ para o projeto nativo)

godot --path godot --import          # importar recursos
godot --headless --path godot "res://tests/CareerTest.tscn"   # correr um teste
```

Testes: `CareerTest`, `MatchTest`, `MatchBatchTest`, `CharacterTest`, `UiTest`.
Cada um termina com `TEST PASSED`/`TEST FAILED` e devolve exit code 1 em falha
(via `godot/tests/test_helper.gd`). Não remover o exit code: sem ele o CI não
deteta regressões, porque o Godot sai com 0 por omissão.

## Export Godot

Presets `Linux`, `Web` e `Android` em `godot/export_presets.cfg`. Os testes ficam
fora do pacote (`exclude_filter="tests/*,exports/*"`). Requer export templates 4.3
instalados em `~/.local/share/godot/export_templates/4.3.stable/`.

```bash
mkdir -p godot/exports/linux godot/exports/web godot/exports/android
godot --headless --path godot --export-release "Linux"
godot --headless --path godot --export-release "Web"
godot --headless --path godot --export-debug "Android"
```

O destino do export tem de existir antes de exportar, senão o Godot falha com
"Prepare Template: The given export path doesn't exist".

### Armadilhas do export Android

Três coisas que só se descobrem a perder tempo com elas:

1. `apksigner` chama `java` a partir do `PATH`. Sem `java` no `PATH` o APK sai
   **sem assinatura** e o Godot apenas emite um warning — o build passa e o
   artefacto é inválido. Pôr o `bin` do JDK no `PATH`, não só `JAVA_HOME`.
2. Se `rendering/textures/vram_compression/import_etc2_astc` for `false`, o
   Godot recusa o export e o erro sai **vazio** (o ramo de validação não anexa
   mensagem). Está a `true` no `project.godot`.
3. O `sdkmanager` do `cmdline-tools` só instala `platform-tools` por omissão;
   `build-tools` (apksigner, aapt) tem de ser pedido explicitamente.
4. `godot/exports/` fica **dentro** da árvore do projeto, por isso sem o excluir
   os builds anteriores eram embutidos no build seguinte (e o APK crescia a cada
   export). O `exclude_filter` aceita padrões separados por vírgula:
   `tests/*,exports/*`.

O preset Android compila só arm64-v8a para manter o APK nos ~27 MB; ativar
`x86_64` duplica o tamanho e só serve para emuladores.

## Android (Capacitor)

O APK é gerado a partir do jogo React, não do Godot:

```bash
npm run build
npx cap sync android          # copia dist/ -> android/app/src/main/assets/public
cd android && ./gradlew assembleRelease    # -> app/build/outputs/apk/release/app-release.apk
```

- `capacitor.config.json` define `appId com.tobealegend.game` e `webDir dist`.
- `android/app/build.gradle` lê `TBAL_VERSION_NAME` e `TBAL_VERSION_CODE` do
  ambiente (o CI deriva-os da tag: `v1.2.3` → versionCode 10203), para que uma
  versão nova instale por cima da anterior.
- Assinatura: `TBAL_KEYSTORE`, `TBAL_KEYSTORE_PASSWORD`, `TBAL_KEY_ALIAS`,
  `TBAL_KEY_PASSWORD`. Sem estas variáveis o Gradle produz
  `app-release-unsigned.apk` — não `app-release.apk` — e a verificação falha.
- Ícones e splash vivem em `android/app/src/main/res/`, gerados a partir da arte
  do jogo; não são os genéricos do Capacitor.
- O service worker é desativado no shell nativo (ver `src/main.tsx`): os assets
  já vêm locais e o cache-first só arriscava prender ficheiros desatualizados.
- iOS não tem export nativo em Linux (exige macOS + Xcode); o caminho é PWA.

### PWA (web)

O jogo web tem `public/manifest.webmanifest` + `public/sw.js`. O service worker
só é registado em produção e fora do shell nativo (`src/main.tsx`). O port Godot
tem `progressive_web_app/enabled=true` no preset `Web`.

## CI e releases

- `.github/workflows/ci.yml` — push para `main` e pull requests: build web, import
  e testes Godot, e APK Android de debug do Capacitor (com verificação de assinatura).
- `.github/workflows/release.yml` — tag `v*` ou dispatch manual: `verify` → `package` → `publish`.
  Publica quatro artefactos: jogo web (PWA), port Godot para browser (PWA), port
  Godot para Linux x86_64 e o APK Android do Capacitor (jogo React completo).

Nos passos de workflow, valores escritos em `$GITHUB_ENV` só ficam disponíveis no
passo **seguinte**. Referenciá-los dentro do mesmo passo devolve vazio — foi assim
que o APK saiu sem assinatura. Resolver em variáveis locais primeiro.

Para publicar: `git tag vX.Y.Z && git push origin vX.Y.Z`.

## Notas do ambiente

- O push para este repo exige `GH_PUSH_TOKEN`; o `GITHUB_TOKEN` é read-only aqui (403).
- `zip` e `unzip` não estão instalados na imagem local — usar `python3 zipfile`.
- O binário do editor Godot vive em `.tools/godot.zip` (não versionado).
- Para builds Android locais: JDK 17, Android SDK em `/tmp/android-sdk`, keystore
  em `~/.local/share/godot/keystores/debug.keystore` e os caminhos configurados
  em `~/.config/godot/editor_settings-4.3.tres`. Nesta imagem o Godot não tem
  KVM nem emulador, por isso o APK só se valida por inspeção (`apksigner`,
  `aapt`), não a correr.

## Uniformes e mapa de cores

Os sprites de partida (`public/assets/animations/*.png`) são **neutros**: cinzento
`#2e2e32` para a roupa e tons de pele. Não têm cor de clube nenhuma, por isso um
único jogo de sheets serve todas as equipas e as transferências não partem os
uniformes. A cor é aplicada em runtime.

- `kitForClub()` / `kitForNational()` em `src/game/data/appearance.ts` derivam o
  uniforme (camisola, detalhe, calções, meias, gola, número) das cores do clube.
  O padrão (`solid|stripes|halves|sash|hoops`) sai de `hash(club.id) % 5` — é
  determinístico, o mesmo clube dá sempre o mesmo padrão.
- Em partida, `setup.ts` troca para `away`/`third` quando as camisolas das duas
  equipas ficam demasiado parecidas (`colorDistance`).
- `npm run colors:export` regenera `public/assets/config/team-kits.json` (dados
  completos, incl. `away`/`third`/`gk`) e `docs/mapa-de-cores.md` a partir do
  código. O script replica `hash`/`PATTERNS` e foi validado contra `kitForClub`
  para os 50 clubes — se mexeres na derivação, corre-o outra vez.
- Escudos: `Crest` em `src/components/ui.tsx` é um SVG (escudo com faixa diagonal,
  gradiente e contorno) que usa `primary`/`secondary`/`accent` do clube. O CSS
  está em `src/index.css` (`.crest`, `.crest-svg`, `.crest-letter`).
