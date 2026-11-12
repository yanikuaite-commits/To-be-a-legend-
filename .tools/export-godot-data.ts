import { mkdir } from "node:fs/promises";
import { CLUBS, LEAGUES, START_CLUBS } from "../src/game/data/clubs";
import { COUNTRIES } from "../src/game/data/countries";
import { NAME_SUGGESTIONS } from "../src/game/data/names";
import {
  ATTR_META,
  LINEUP_SLOTS,
  POSITION_LABEL,
  POSITION_SHORT,
  POSITIONS,
  OVERALL_WEIGHTS,
  TRAINING_PROGRAMS,
} from "../src/game/config";

function snake(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

function snakeKeys<T>(value: T): unknown {
  if (Array.isArray(value)) return value.map(snakeKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [snake(k), snakeKeys(v)]),
    );
  }
  return value;
}

const data = {
  version: 1,
  leagues: snakeKeys(LEAGUES),
  clubs: snakeKeys(CLUBS),
  countries: snakeKeys(COUNTRIES),
  start_clubs: START_CLUBS,
  positions: POSITIONS,
  position_labels: POSITION_LABEL,
  position_short: POSITION_SHORT,
  attr_meta: snakeKeys(ATTR_META),
  overall_weights: snakeKeys(OVERALL_WEIGHTS),
  training: snakeKeys(TRAINING_PROGRAMS),
  lineup: snakeKeys(LINEUP_SLOTS),
  name_pools: NAME_SUGGESTIONS,
};

await mkdir("godot/data", { recursive: true });
await Bun.write("godot/data/game_data.json", JSON.stringify(data, null, 2));
console.log(`wrote ${data.clubs.length} clubs, ${data.leagues.length} leagues, ${data.countries.length} countries`);
