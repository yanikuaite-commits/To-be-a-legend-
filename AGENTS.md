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

Presets `Linux` e `Web` em `godot/export_presets.cfg`. Os testes ficam fora do
pacote (`exclude_filter="tests/*"`). Requer export templates 4.3 instalados em
`~/.local/share/godot/export_templates/4.3.stable/`.

```bash
mkdir -p godot/exports/linux godot/exports/web
godot --headless --path godot --export-release "Linux"
godot --headless --path godot --export-release "Web"
```

O destino do export tem de existir antes de exportar, senão o Godot falha com
"Prepare Template: The given export path doesn't exist".

## CI e releases

- `.github/workflows/ci.yml` — push para `main` e pull requests: build web + import e testes Godot.
- `.github/workflows/release.yml` — tag `v*` ou dispatch manual: `verify` → `package` → `publish`.
  Publica três zips: jogo web, port Godot para browser e port Godot para Linux x86_64.

Para publicar: `git tag vX.Y.Z && git push origin vX.Y.Z`.

## Notas do ambiente

- O push para este repo exige `GH_PUSH_TOKEN`; o `GITHUB_TOKEN` é read-only aqui (403).
- `zip` e `unzip` não estão instalados na imagem local — usar `python3 zipfile`.
- O binário do editor Godot vive em `.tools/godot.zip` (não versionado).
