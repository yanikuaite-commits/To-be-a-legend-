import { getClub } from "../data/clubs";
import { COUNTRY_MAP } from "../data/countries";
import { kitForClub, kitForNational } from "../data/appearance";
import type { Career, Fixture, Kit, PositionCode } from "../types";
import { hashString } from "../engine/rng";
import type { MatchSetup } from "./types";

function colorDistance(a: string, b: string): number {
  const parse = (hex: string) => {
    const c = hex.replace("#", "");
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function buildMatchSetup(career: Career, fixture: Fixture): MatchSetup {
  const club = getClub(career.clubId);
  const isNational = fixture.competition === "national" || fixture.competition === "worldcup";
  const playerTeam: 0 | 1 = fixture.home ? 0 : 1;
  const opponentCountry = isNational ? fixture.opponentShort : undefined;

  let playerKit: Kit;
  let opponentKit: Kit;
  let playerGkKit: Kit;
  let opponentGkKit: Kit;
  let playerName: string;
  let opponentName: string;
  let playerShort: string;
  let opponentShort: string;
  let playerOverall: number;
  let opponentOverall: number;
  let playerCountry: string;
  let opponentCountryName: string;

  if (isNational) {
    playerKit = kitForNational(career.nationality, "home");
    opponentKit = kitForNational(opponentCountry ?? "BRA", "away");
    if (colorDistance(playerKit.primary, opponentKit.primary) < 110) {
      opponentKit = kitForNational(opponentCountry ?? "BRA", "home");
    }
    playerGkKit = kitForClub(club, "gk");
    opponentGkKit = kitForClub(club, "gk");
    opponentGkKit = { ...opponentGkKit, primary: "#f59e0b", socks: "#f59e0b" };
    playerName = COUNTRY_MAP[career.nationality]?.name ?? "Seleção";
    opponentName = fixture.opponentName;
    playerShort = career.nationality;
    opponentShort = fixture.opponentShort;
    playerOverall = Math.round(74 + career.overall * 0.16);
    opponentOverall = fixture.opponentOverall;
    playerCountry = career.nationality;
    opponentCountryName = opponentCountry ?? "BRA";
  } else {
    const opponentClub = getClub(fixture.opponentId);
    const basePlayerKit = kitForClub(club, "home");
    const baseOpponentKit = kitForClub(opponentClub, "away");
    playerKit = basePlayerKit;
    opponentKit = colorDistance(basePlayerKit.primary, baseOpponentKit.primary) < 115
      ? kitForClub(opponentClub, "third")
      : baseOpponentKit;
    if (colorDistance(playerKit.primary, opponentKit.primary) < 85) {
      opponentKit = kitForClub(opponentClub, "home");
    }
    playerGkKit = kitForClub(club, "gk");
    opponentGkKit = kitForClub(opponentClub, "gk");
    if (lineDistance(playerGkKit.socks, opponentGkKit.socks) < 100) {
      opponentGkKit = { ...opponentGkKit, primary: "#c084fc", socks: "#c084fc" };
    }
    playerName = club.name;
    opponentName = opponentClub.name;
    playerShort = club.short;
    opponentShort = opponentClub.short;
    playerOverall = club.overall;
    opponentOverall = opponentClub.overall;
    playerCountry = club.country;
    opponentCountryName = opponentClub.country;
  }

  return {
    fixtureId: fixture.id,
    competitionName: fixture.competitionName,
    playerTeam,
    teamName: playerTeam === 0 ? [playerName, opponentName] : [opponentName, playerName],
    teamShort: playerTeam === 0 ? [playerShort, opponentShort] : [opponentShort, playerShort],
    teamOverall: playerTeam === 0 ? [playerOverall, opponentOverall] : [opponentOverall, playerOverall],
    teamCountry: playerTeam === 0 ? [playerCountry, opponentCountryName] : [opponentCountryName, playerCountry],
    kit: playerTeam === 0 ? [playerKit, opponentKit] : [opponentKit, playerKit],
    gkKit: playerTeam === 0 ? [playerGkKit, opponentGkKit] : [opponentGkKit, playerGkKit],
    player: {
      name: `${career.firstName} ${career.lastName}`,
      number: career.shirtNumber,
      position: career.position,
      attributes: { ...career.attributes },
      appearance: career.appearance,
    },
    seed: hashString(fixture.id) ^ career.seed,
  };
}

function lineDistance(a: string, b: string): number {
  return colorDistance(a.startsWith("#") ? a : "#ffffff", b.startsWith("#") ? b : "#ffffff");
}

export const FORMATION_ROLES: (PositionCode | "GK")[] = [
  "GK",
  "DD",
  "DC",
  "DC",
  "DE",
  "MD",
  "MC",
  "MO",
  "ED",
  "PL",
  "EE",
];
