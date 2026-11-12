import { CLUBS, LEAGUE_MAP, getClub } from "../data/clubs";
import { countryName } from "../data/countries";
import type { Career, TransferOffer } from "../types";
import { clamp, mulberry32, pick, randInt, shuffle, type Rand } from "./rng";
import { addNews, cloneCareer, uid } from "./careerUtils";
import { marketValue, suggestedSalary } from "./attributes";

export function roleFor(overall: number, clubOverall: number): TransferOffer["role"] {
  const diff = overall - clubOverall;
  if (diff >= 5) return "Titular indiscutível";
  if (diff >= -2) return "Titular";
  if (diff >= -7) return "Rotação";
  if (diff >= -12) return "Suplente";
  return "Promessa";
}

const ROLE_MULT: Record<TransferOffer["role"], number> = {
  "Titular indiscutível": 1.25,
  Titular: 1,
  Rotação: 0.78,
  Suplente: 0.6,
  Promessa: 0.45,
};

function makeOffer(career: Career, clubId: string, rand: Rand, renewal = false): TransferOffer {
  const club = getClub(clubId);
  const league = LEAGUE_MAP[club.leagueId];
  const role = roleFor(career.overall, club.overall);
  const value = marketValue(career);
  const base = suggestedSalary(value, club.overall) * ROLE_MULT[role];
  const salary = Math.round(base * (0.9 + rand() * 0.25));
  const interest = clamp(
    Math.round(
      24 +
        (career.overall - club.overall + 9) * 3.1 +
        career.popularity / 9 +
        career.reputation / 5 +
        (career.form - 50) / 4 +
        (career.requestedTransfer ? 9 : 0),
    ),
    8,
    99,
  );
  return {
    id: uid("offer"),
    clubId,
    clubName: club.name,
    clubShort: club.short,
    country: countryName(club.country),
    leagueName: league?.name ?? "Liga",
    clubOverall: club.overall,
    interest,
    salary,
    years: randInt(rand, 2, 4),
    role,
    type: "permanent",
    marketValue: value,
    objectives:
      role === "Titular indiscutível"
        ? "Ser a estrela da equipa e lutar pelo título."
        : role === "Titular"
          ? "Garantir um lugar no onze e impressionar o treinador."
          : role === "Rotação"
            ? "Lutar por minutos e crescer no plantel."
            : "Mostrar valor nos treinos e conquistar espaço.",
    expiresWeek: career.week + 3,
    isRenewal: renewal,
  };
}

export function generateOffers(career: Career, seedSalt = 0, count = 3): TransferOffer[] {
  const rand = (() => {
    let a = (career.seed + career.week * 977 + career.season * 131 + seedSalt) >>> 0;
    return () => {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();

  const offers: TransferOffer[] = [];
  const contractExpiring = career.contract.years <= 1;
  const club = getClub(career.clubId);
  const renewInterest =
    !career.requestedTransfer &&
    (contractExpiring || career.coachTrust >= 65) &&
    (career.coachTrust >= 42 || contractExpiring);

  if (renewInterest) {
    const renewal = makeOffer(career, career.clubId, rand, true);
    renewal.salary = Math.round(Math.max(career.contract.salary * 1.18, renewal.salary));
    renewal.years = randInt(rand, 2, 4);
    renewal.interest = clamp(Math.round(55 + career.coachTrust * 0.4), 40, 99);
    offers.push(renewal);
  }

  const candidateClubs = CLUBS.filter((c) => {
    if (c.id === career.clubId) return false;
    if (c.overall < career.overall - 6) return false;
    if (c.overall > career.overall + 18) return false;
    const foreign = c.country !== "POR";
    if (foreign && career.reputation < 58) return false;
    const league = LEAGUE_MAP[c.leagueId];
    if (league && league.tier === 3 && career.overall > 62) return false;
    return true;
  });

  const scored = shuffle(rand, candidateClubs)
    .map((c) => {
      const interest = clamp(
        22 +
          (career.overall - c.overall + 10) * 3.2 +
          career.reputation / 5 +
          career.form / 8 +
          (career.requestedTransfer ? 10 : 0) +
          randInt(rand, -6, 6),
        5,
        99,
      );
      return { club: c, interest };
    })
    .filter((x) => x.interest >= 38)
    .sort((a, b) => b.interest - a.interest);

  for (const entry of scored.slice(0, count)) {
    const offer = makeOffer(career, entry.club.id, rand);
    offer.interest = Math.round(entry.interest);
    offers.push(offer);
  }

  if (!offers.length && contractExpiring) {
    const renewal = makeOffer(career, career.clubId, rand, true);
    renewal.salary = Math.round(career.contract.salary * 1.05);
    offers.push(renewal);
  }

  void club;
  return offers;
}

export function refreshOffers(career: Career): Career {
  if (career.pendingTransfer) return career;
  if (!career.offers.length) {
    career.offers = generateOffers(career);
    if (career.offers.length) {
      addNews(career, {
        title: "Propostas no mercado",
        body: `${career.offers.length} clubes demonstraram interesse em ti. Consulta a secção de transferências.`,
        type: "transfer",
        icon: "ArrowRightLeft",
      });
    }
  }
  return career;
}

export function acceptOffer(careerInput: Career, offerId: string): { career: Career; ok: boolean; message: string } {
  const career = cloneCareer(careerInput);
  const offer = career.offers.find((o) => o.id === offerId);
  if (!offer) return { career, ok: false, message: "Proposta indisponível." };

  if (offer.clubId === career.clubId || offer.isRenewal) {
    career.contract = {
      ...career.contract,
      salary: offer.salary,
      years: Math.max(offer.years, 1),
      role: offer.role,
      signedSeason: career.season,
      releaseClause: Math.round(offer.marketValue * 2.4),
    };
    career.offers = career.offers.filter((o) => o.id !== offerId);
    career.pendingTransfer = null;
    career.captain = false;
    addNews(career, {
      title: "Contrato renovado",
      body: `Renovaste com o ${getClub(career.clubId).name} até ${career.season + offer.years}. Salário semanal: €${offer.salary.toLocaleString("pt-PT")}.`,
      type: "transfer",
      icon: "FileSignature",
    });
    return { career, ok: true, message: "Contrato renovado com sucesso." };
  }

  career.pendingTransfer = offer;
  career.offers = career.offers.filter((o) => o.id !== offerId);
  addNews(career, {
    title: `Acordo com o ${offer.clubName}`,
    body: `Chegaste a acordo com o ${offer.clubName} (${offer.leagueName}). A transferência será concluída no fim da época.`,
    type: "transfer",
    icon: "ArrowRightLeft",
  });
  return { career, ok: true, message: `Transferência acordada com o ${offer.clubName}.` };
}

export function rejectOffer(careerInput: Career, offerId: string): Career {
  const career = cloneCareer(careerInput);
  career.offers = career.offers.filter((o) => o.id !== offerId);
  return career;
}

export function negotiateOffer(
  careerInput: Career,
  offerId: string,
): { career: Career; ok: boolean; message: string } {
  const career = cloneCareer(careerInput);
  const offerIndex = career.offers.findIndex((o) => o.id === offerId);
  const offer = offerIndex >= 0 ? career.offers[offerIndex] : undefined;
  if (!offer) return { career, ok: false, message: "Proposta indisponível." };
  if (offer.negotiated) return { career, ok: false, message: "Já negociaste esta proposta." };
  const successChance = clamp(0.42 + career.reputation / 260 + offer.interest / 400, 0.2, 0.9);
  offer.negotiated = true;
  const rand = mulberry32(career.seed + career.season * 101 + career.week * 37 + offerIndex * 17);
  if (rand() < successChance) {
    offer.salary = Math.round(offer.salary * (1.12 + rand() * 0.15));
    offer.years = Math.max(2, offer.years + (rand() < 0.35 ? 1 : 0));
    offer.interest = clamp(offer.interest + 4, 0, 99);
    return { career, ok: true, message: `O clube melhorou a proposta: €${offer.salary.toLocaleString("pt-PT")}/semana.` };
  }
  offer.interest = clamp(offer.interest - 6, 0, 99);
  return { career, ok: false, message: "A direção recusou melhorar a proposta. Podes aceitar ou recusar." };
}

export function requestTransfer(careerInput: Career): { career: Career; message: string } {
  const career = cloneCareer(careerInput);
  if (career.requestedTransfer) return { career: careerInput, message: "Já pediste para sair." };
  career.requestedTransfer = true;
  career.coachTrust = clamp(career.coachTrust - 14, 0, 100);
  career.morale = clamp(career.morale - 6, 0, 100);
  addNews(career, {
    title: "Pedido de transferência",
    body: `Comunicaste ao ${getClub(career.clubId).name} a vontade de sair. O clube vai ouvir propostas.`,
    type: "transfer",
    icon: "LogOut",
  });
  return { career, message: "Pedido de transferência entregue. O interesse de outros clubes vai aumentar." };
}

export function renewContract(careerInput: Career): { career: Career; ok: boolean; message: string } {
  const career = cloneCareer(careerInput);
  if (career.contract.years > 1) {
    return { career: careerInput, ok: false, message: "Ainda tens contrato. Podes renovar na última época." };
  }
  const club = getClub(career.clubId);
  const raise = 1.1 + career.coachTrust / 500;
  const salary = Math.round(Math.max(career.contract.salary * raise, suggestedSalary(marketValue(career), club.overall)));
  career.contract = {
    ...career.contract,
    salary,
    years: 3,
    role: roleFor(career.overall, club.overall),
    signedSeason: career.season,
  };
  addNews(career, {
    title: "Renovação concretizada",
    body: `Assinaste um novo contrato de 3 anos com o ${club.name}. Salário semanal: €${salary.toLocaleString("pt-PT")}.`,
    type: "transfer",
    icon: "FileSignature",
  });
  return { career, ok: true, message: "Contrato renovado por 3 anos." };
}

export function completePendingTransfer(career: Career): void {
  if (!career.pendingTransfer) return;
  const offer = career.pendingTransfer;
  const club = getClub(offer.clubId);
  career.clubId = club.id;
  career.seasonLeagueId = club.leagueId;
  career.contract = {
    clubId: club.id,
    salary: offer.salary,
    years: offer.years,
    role: offer.role,
    signedSeason: career.season,
    releaseClause: Math.round(offer.marketValue * 2.4),
    bonuses: { goals: 5000, assists: 2500, apps: 3000 },
  };
  career.captain = false;
  career.coachTrust = 58;
  career.requestedTransfer = false;
  career.offers = [];
  career.pendingTransfer = null;
  addNews(career, {
    title: `Novo clube: ${club.name}`,
    body: `Foste apresentado como reforço do ${club.name} (${LEAGUE_MAP[club.leagueId]?.name}). Papel: ${offer.role}.`,
    type: "transfer",
    icon: "PartyPopper",
  });
}

export function pickReplacementOffer(career: Career): TransferOffer | null {
  return career.offers.find((o) => !o.isRenewal && o.clubId !== career.clubId) ?? null;
}

export function randomOfferClub(rand: Rand, minOverall: number): string {
  const pool = CLUBS.filter((c) => c.overall >= minOverall);
  return pick(rand, pool).id;
}
