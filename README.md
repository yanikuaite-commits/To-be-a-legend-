# To Be a Legend

Jogo de carreira de futebol: começas como promessa de 16 anos e constróis o teu legado época após época.

Existem duas implementações jogáveis no mesmo repositório:

- **Web** (`src/`) — React 18 + TypeScript + Vite, o jogo principal.
- **Godot** (`godot/`) — port nativo em Godot 4.3 (GDScript), para desktop e browser.

## Requisitos

- Node.js 20+
- Godot 4.3 (só para o port nativo)

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

Os presets `Linux` e `Web` estão em `godot/export_presets.cfg`. É necessário ter os export templates 4.3 instalados.

```bash
mkdir -p godot/exports/linux godot/exports/web
godot --headless --path godot --export-release "Linux"
godot --headless --path godot --export-release "Web"
```

## CI e releases

- `.github/workflows/ci.yml` corre em cada push para `main` e em cada pull request: faz o build web e importa e testa o projeto Godot.
- `.github/workflows/release.yml` corre ao empurrar uma tag `v*` (ou manualmente pela aba Actions) e publica uma GitHub Release com três arquivos:
  - `to-be-a-legend-web-*.zip` — jogo web.
  - `to-be-a-legend-godot-web-*.zip` — port Godot para browser (WebAssembly).
  - `to-be-a-legend-linux-*.zip` — port Godot nativo para Linux x86_64.

Para publicar uma nova versão:

```bash
git tag v1.0.0
git push origin v1.0.0
```
