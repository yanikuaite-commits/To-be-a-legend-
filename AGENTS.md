# AGENTS.md

## Repositório

`To-be-a-legend-` — jogo de carreira de futebol, em duas implementações no mesmo repo:

- **Web** (`src/`) — React 18 + TypeScript + Vite. É o jogo principal.
- **Godot** (`godot/`) — port em Godot 4.3 (GDScript), desktop e browser.

## Comandos

```bash
npm ci            # o package-lock.json está versionado; usa sempre npm ci
npm run build     # tsc -b && vite build -> dist/

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

### Telemóvel

- Android nativo: preset `Android` → `.apk` (debug e release, ambos assinados).
- iOS: não há export nativo em Linux (exige macOS + Xcode). O caminho é PWA.
- PWA: o preset `Web` tem `progressive_web_app/enabled=true` e o jogo web tem
  `public/manifest.webmanifest` + `public/sw.js` (o service worker só é
  registado em produção, ver `src/main.tsx`).

## CI e releases

- `.github/workflows/ci.yml` — push para `main` e pull requests: build web, import
  e testes Godot, e APK Android de debug (com verificação de assinatura).
- `.github/workflows/release.yml` — tag `v*` ou dispatch manual: `verify` → `package` → `publish`.
  Publica quatro artefactos: jogo web (PWA), port Godot para browser (PWA), port
  Godot para Linux x86_64 e APK Android.

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
