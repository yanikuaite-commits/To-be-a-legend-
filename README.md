# To Be a Legend

Jogo de carreira de futebol: começas como promessa de 16 anos e constróis o teu legado época após época.

Existem duas implementações jogáveis no mesmo repositório:

- **Web** (`src/`) — React 18 + TypeScript + Vite, o jogo principal.
- **Godot** (`godot/`) — port nativo em Godot 4.3 (GDScript), para desktop, browser e Android.

## Requisitos

- Node.js 20+
- Godot 4.3 (só para o port nativo)
- Para Android: JDK 17, Android SDK (build-tools + platform) e os export templates 4.3

## Telemóvel

Há duas formas de jogar no telemóvel.

**Android (app nativo)** — `to-be-a-legend-android-*.apk` na release. Basta instalar; pode ser preciso autorizar "instalar de fontes desconhecidas". Build é arm64-v8a.

**iOS e Android (PWA)** — as versões de browser (`to-be-a-legend-web-*.zip` e `to-be-a-legend-godot-web-*.zip`) são Progressive Web Apps. Extrai, serve por HTTP e abre no browser do telemóvel; depois escolhe "Adicionar ao ecrã principal" (iOS Safari) ou "Instalar aplicação" (Android Chrome). Fica com ícone próprio e corre em ecrã inteiro, sem barra de browser.

Não há ficheiro nativo para iOS: compilar para iOS exige macOS com Xcode. Em iOS usa sempre a versão PWA.

## Jogo web

```bash
npm ci          # instala dependências exatamente como no lockfile
npm run dev     # servidor de desenvolvimento
npm run build   # typecheck + build para dist/
npm run preview # serve o build de dist/
```

## Port Godot

```bash
godot --path godot            # abre o editor
godot --path godot --import   # importa recursos sem abrir o editor
```

Testes (headless, com código de saída):

```bash
for scene in CareerTest MatchTest MatchBatchTest CharacterTest UiTest; do
  godot --headless --path godot "res://tests/${scene}.tscn"
done
```

Cada teste termina com `TEST PASSED` ou `TEST FAILED` e devolve código de saída 1 em caso de falha, para que o CI os consiga validar.

### Exportar

Os presets `Linux`, `Web` e `Android` estão em `godot/export_presets.cfg`. É necessário ter os export templates 4.3 instalados.

```bash
mkdir -p godot/exports/linux godot/exports/web godot/exports/android
godot --headless --path godot --export-release "Linux"
godot --headless --path godot --export-release "Web"
godot --headless --path godot --export-debug "Android"
```

O export Android precisa de três coisas configuradas no editor (Settings → Export → Android), ou por variáveis de ambiente em CI:

- **Java SDK path** (`export/android/java_sdk_path`) — JDK 17.
- **Android SDK path** (`export/android/android_sdk_path`) — precisa de `platform-tools` (adb) e `build-tools` (apksigner).
- **Debug keystore** — ou define `GODOT_ANDROID_KEYSTORE_DEBUG_PATH`, `GODOT_ANDROID_KEYSTORE_DEBUG_USER` e `GODOT_ANDROID_KEYSTORE_DEBUG_PASSWORD`.

Notas que já nos custaram tempo:

- O `apksigner` invoca `java` a partir do `PATH`; se o `java` não estiver no `PATH`, o APK sai **sem assinatura** e o Godot só emite um aviso.
- O Godot recusa exportar para Android se `rendering/textures/vram_compression/import_etc2_astc` estiver a `false`, e nesse caso o erro sai vazio. Está ativo em `project.godot`.
- O Godot descobre o `apksigner` por *glob* em `build-tools`, por isso é preciso ter pelo menos uma versão de build-tools instalada.
- A pasta de destino do export tem de existir antes de exportar.

## CI e releases

- `.github/workflows/ci.yml` corre em cada push para `main` e em cada pull request: faz o build web, importa e testa o projeto Godot, e constrói o APK Android de debug (com verificação de assinatura).
- `.github/workflows/release.yml` corre ao empurrar uma tag `v*` (ou manualmente pela aba Actions) e publica uma GitHub Release com quatro artefactos:
  - `to-be-a-legend-web-*.zip` — jogo web (PWA instalável).
  - `to-be-a-legend-godot-web-*.zip` — port Godot para browser (WebAssembly, PWA instalável).
  - `to-be-a-legend-linux-*.zip` — port Godot nativo para Linux x86_64.
  - `to-be-a-legend-android-*.apk` — app Android (arm64-v8a).

Para publicar uma nova versão:

```bash
git tag v1.0.0
git push origin v1.0.0
```
