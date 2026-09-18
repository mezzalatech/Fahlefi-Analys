import type { MatchData } from './api';
import { localDb } from './localDb';

export interface PlayerSeriesStat {
  no: number;
  name: string;
  isGk: boolean;
  matchesPlayed: number;
  totalGoals: number;
  totalShots: number;
  shotConversionPct: number;
  totalRecoveries: number;
  totalLosses: number;
  recoverLossRatio: number;
  totalFouls: number;
  yellowCards: number;
  redCards: number;
  fatigueScore: number; // 0 - 100%
}

export interface TournamentSummary {
  teamName: string;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  winRatePct: number;
  totalShots: number;
  totalRecoveries: number;
  totalLosses: number;
  playerStats: PlayerSeriesStat[];
  matchHistory: Array<{
    id: number;
    name: string;
    competition: string;
    opponent: string;
    date: string;
    scoreFor: number;
    scoreAgainst: number;
    result: 'WIN' | 'DRAW' | 'LOSS';
  }>;
}

export class SeriesAggregator {
  static async aggregateTeamSeries(teamId: string = 'team_paser'): Promise<TournamentSummary> {
    const rawMatches = await localDb.getMatches(teamId);
    const detailedMatches: MatchData[] = [];

    for (const m of rawMatches) {
      try {
        const full = await localDb.getMatch(m.id);
        if (full) detailedMatches.push(full);
      } catch {}
    }

    let totalGoalsFor = 0;
    let totalGoalsAgainst = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let totalShots = 0;
    let totalRecoveries = 0;
    let totalLosses = 0;

    const playerAgg: Record<number, {
      no: number;
      name: string;
      isGk: boolean;
      matchesCount: number;
      goals: number;
      shots: number;
      recoveries: number;
      losses: number;
      fouls: number;
      yellow: number;
      red: number;
    }> = {};

    const matchHistory: TournamentSummary['matchHistory'] = [];

    for (const m of detailedMatches) {
      const matchMeta = m.match;
      const hScore = (matchMeta.homeScore1st || 0) + (matchMeta.homeScore2nd || 0);
      const aScore = (matchMeta.awayScore1st || 0) + (matchMeta.awayScore2nd || 0);

      totalGoalsFor += hScore;
      totalGoalsAgainst += aScore;

      let result: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
      if (hScore > aScore) {
        wins++;
        result = 'WIN';
      } else if (hScore < aScore) {
        losses++;
        result = 'LOSS';
      } else {
        draws++;
      }

      matchHistory.push({
        id: matchMeta.id,
        name: matchMeta.name,
        competition: matchMeta.competition,
        opponent: matchMeta.awayTeam,
        date: matchMeta.date,
        scoreFor: hScore,
        scoreAgainst: aScore,
        result
      });

      // Pemain
      for (const p of m.players || []) {
        if (!playerAgg[p.no]) {
          playerAgg[p.no] = {
            no: p.no,
            name: p.name,
            isGk: Boolean(p.isGk),
            matchesCount: 0,
            goals: 0,
            shots: 0,
            recoveries: 0,
            losses: 0,
            fouls: 0,
            yellow: 0,
            red: 0
          };
        }

        const agg = playerAgg[p.no];
        agg.matchesCount++;
        const pGoals = (p.gl1 || 0) + (p.gl2 || 0);
        const pShots = (p.sh1 || 0) + (p.sh2 || 0);
        const pRec = (p.rec1 || 0) + (p.rec2 || 0);
        const pLoss = (p.loss1 || 0) + (p.loss2 || 0);
        const pFoul = (p.fl1 || 0) + (p.fl2 || 0);

        agg.goals += pGoals;
        agg.shots += pShots;
        agg.recoveries += pRec;
        agg.losses += pLoss;
        agg.fouls += pFoul;
        agg.yellow += (p.yellowCards || 0);
        agg.red += (p.redCards || 0);

        totalShots += pShots;
        totalRecoveries += pRec;
        totalLosses += pLoss;
      }
    }

    const totalMatches = detailedMatches.length;
    const goalDiff = totalGoalsFor - totalGoalsAgainst;
    const winRatePct = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    const playerStats: PlayerSeriesStat[] = Object.values(playerAgg).map(p => {
      const shotConversionPct = p.shots > 0 ? Math.round((p.goals / p.shots) * 100) : 0;
      const recoverLossRatio = p.losses > 0 ? Number((p.recoveries / p.losses).toFixed(2)) : p.recoveries;
      const fatigueScore = Math.min(100, Math.round((p.matchesCount / Math.max(1, totalMatches)) * 75 + (p.recoveries + p.shots) * 2));

      return {
        no: p.no,
        name: p.name,
        isGk: p.isGk,
        matchesPlayed: p.matchesCount,
        totalGoals: p.goals,
        totalShots: p.shots,
        shotConversionPct,
        totalRecoveries: p.recoveries,
        totalLosses: p.losses,
        recoverLossRatio,
        totalFouls: p.fouls,
        yellowCards: p.yellow,
        redCards: p.red,
        fatigueScore
      };
    }).sort((a, b) => b.totalGoals - a.totalGoals || b.totalRecoveries - a.totalRecoveries);

    return {
      teamName: detailedMatches[0]?.match.homeTeam || 'Tim Analisis',
      totalMatches,
      wins,
      draws,
      losses,
      goalsFor: totalGoalsFor,
      goalsAgainst: totalGoalsAgainst,
      goalDiff,
      winRatePct,
      totalShots,
      totalRecoveries,
      totalLosses,
      playerStats,
      matchHistory
    };
  }
}
