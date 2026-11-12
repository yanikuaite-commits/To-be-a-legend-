import type { AchievementDef } from "../types";

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "debut", title: "Primeiro Jogo Profissional", description: "Entra em campo pela primeira vez na carreira.", icon: "Shirt", rewardCoins: 150, rewardEvo: 2, category: "career" },
  { id: "first-goal", title: "Primeiro Golo", description: "Marca o teu primeiro golo como profissional.", icon: "Target", rewardCoins: 200, rewardEvo: 3, category: "goals" },
  { id: "first-assist", title: "Primeira Assistência", description: "Assiste um companheiro pela primeira vez.", icon: "Handshake", rewardCoins: 150, rewardEvo: 2, category: "goals" },
  { id: "first-motm", title: "Melhor em Campo", description: "Sê eleito o melhor jogador de uma partida.", icon: "Star", rewardCoins: 250, rewardEvo: 3, category: "individual" },
  { id: "first-hattrick", title: "Primeiro Hat-Trick", description: "Marca três golos no mesmo jogo.", icon: "Flame", rewardCoins: 400, rewardEvo: 5, category: "goals" },
  { id: "first-title", title: "Primeiro Título", description: "Conquista o teu primeiro troféu coletivo.", icon: "Trophy", rewardCoins: 500, rewardEvo: 5, category: "titles" },
  { id: "promotion", title: "Subida de Divisão", description: "Ajuda o teu clube a subir de divisão.", icon: "ArrowUpCircle", rewardCoins: 450, rewardEvo: 4, category: "club" },
  { id: "national-debut", title: "Estreia na Seleção", description: "Representa o teu país pela primeira vez.", icon: "Flag", rewardCoins: 500, rewardEvo: 5, category: "national" },
  { id: "top-scorer", title: "Melhor Marcador", description: "Termina uma época como melhor marcador da liga.", icon: "Crown", rewardCoins: 800, rewardEvo: 8, category: "individual" },
  { id: "top-assists", title: "Rei das Assistências", description: "Termina uma época como melhor assistente da liga.", icon: "Wand2", rewardCoins: 700, rewardEvo: 7, category: "individual" },
  { id: "league-champion", title: "Campeão Nacional", description: "Conquista o campeonato da tua liga.", icon: "Trophy", rewardCoins: 900, rewardEvo: 8, category: "titles" },
  { id: "cup-champion", title: "Vencedor da Taça", description: "Conquista a taça nacional.", icon: "Medal", rewardCoins: 700, rewardEvo: 6, category: "titles" },
  { id: "continental-champion", title: "Campeão Continental", description: "Vence a Liga Continental.", icon: "Globe2", rewardCoins: 1200, rewardEvo: 10, category: "titles" },
  { id: "world-champion", title: "Campeão do Mundo", description: "Conquista o Mundial com a seleção.", icon: "Earth", rewardCoins: 1500, rewardEvo: 12, category: "national" },
  { id: "season-mvp", title: "Melhor Jogador da Época", description: "Sê eleito o MVP da liga.", icon: "Sparkles", rewardCoins: 1000, rewardEvo: 10, category: "individual" },
  { id: "ballon-dor", title: "Bola de Ouro", description: "Sê reconhecido como o melhor do mundo.", icon: "Gem", rewardCoins: 2000, rewardEvo: 15, category: "individual" },
  { id: "century", title: "100 Golos", description: "Alcança 100 golos na carreira.", icon: "Target", rewardCoins: 1000, rewardEvo: 10, category: "goals" },
  { id: "club-legend", title: "Lenda do Clube", description: "Chega a 150 jogos e 50 golos por um clube.", icon: "Castle", rewardCoins: 1200, rewardEvo: 12, category: "club" },
  { id: "national-legend", title: "Lenda da Seleção", description: "Chega a 50 internacionalizações.", icon: "Flag", rewardCoins: 1500, rewardEvo: 12, category: "national" },
  { id: "veteran", title: "Veterano", description: "Continua a jogar depois dos 34 anos.", icon: "Hourglass", rewardCoins: 600, rewardEvo: 6, category: "career" },
  { id: "world-star", title: "Estrela Mundial", description: "Alcança reputação mundial acima de 92.", icon: "Globe2", rewardCoins: 1000, rewardEvo: 10, category: "career" },
  { id: "transfer-big", title: "Grande Transferência", description: "Assina por um clube de Overall 85 ou mais.", icon: "ArrowRightLeft", rewardCoins: 800, rewardEvo: 8, category: "career" },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);
