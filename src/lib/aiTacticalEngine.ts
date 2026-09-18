import type { MatchData, SubstitutionLog } from './api';

export interface PaketTacticalMetric {
  paketIndex: number;
  code: string;
  playerNumbers: number[];
  playerNames: string[];
  minutesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  plusMinus: number;
  netRatingPer10Min: number;
  shotsFor: number;
  shotsAgainst: number;
  losses: number;
  recoveries: number;
  fouls: number;
}

export interface ZoneAnalysis {
  zoneKey: string;
  name: string;
  category: 'DEFENSIVE' | 'MIDDLE' | 'ATTACKING';
  flank: 'LEFT' | 'CENTER' | 'RIGHT';
  losses: number;
  recoveries: number;
  shots: number;
  goals: number;
  dangerScore: number; // 0 - 100%
}

export interface TacticalBriefing {
  executiveSummary: string;
  strengths: string[];
  vulnerabilities: string[];
  recommendations: string[];
  bestPaket: PaketTacticalMetric | null;
  riskiestPaket: PaketTacticalMetric | null;
  topRecoveryPlayer: { no: number; name: string; count: number } | null;
  topScorerPlayer: { no: number; name: string; count: number } | null;
  lossVulnerabilityZone: ZoneAnalysis | null;
}

export class AiTacticalEngine {
  /**
   * Mengelompokkan event ke dalam zona taktikal futsal
   * Lapangan standar: X = 0..1000 (0 = Gawang Sendiri, 1000 = Gawang Lawan), Y = 0..600 (0 = Sisi Kiri, 600 = Sisi Kanan)
   */
  static getZoneKey(x: number, y: number): { key: string; name: string; cat: 'DEFENSIVE' | 'MIDDLE' | 'ATTACKING'; flank: 'LEFT' | 'CENTER' | 'RIGHT' } {
    let cat: 'DEFENSIVE' | 'MIDDLE' | 'ATTACKING' = 'MIDDLE';
    let catName = 'Mid-Court';
    if (x < 333) {
      cat = 'DEFENSIVE';
      catName = 'Defensive 3rd (Zona Bertahan)';
    } else if (x > 666) {
      cat = 'ATTACKING';
      catName = 'Attacking 3rd (Zona Serang)';
    }

    let flank: 'LEFT' | 'CENTER' | 'RIGHT' = 'CENTER';
    let flankName = 'Tengah (Pivot / Anchor Area)';
    if (y < 200) {
      flank = 'LEFT';
      flankName = 'Flank Kiri';
    } else if (y > 400) {
      flank = 'RIGHT';
      flankName = 'Flank Kanan';
    }

    return {
      key: `${cat}_${flank}`,
      name: `${catName} - ${flankName}`,
      cat,
      flank
    };
  }

  /**
   * Hitung metrik komprehensif paket 5-man (+/- Net Rating, Shot Impact, Ball Possession Quality)
   */
  static analyzePakets(matchData: MatchData, substitutions: SubstitutionLog[]): PaketTacticalMetric[] {
    const pakets = matchData.pakets || [];
    const events = matchData.events || [];
    const players = matchData.players || [];

    const getPlayerName = (no: number) => {
      const p = players.find(pl => pl.no === no);
      return p ? p.name : `#${no}`;
    };

    // Urutkan subs berdasarkan urutan waktu
    const sortedSubs = [...substitutions].sort((a, b) => {
      if (a.half !== b.half) return a.half - b.half;
      return (b.timerRemaining || 0) - (a.timerRemaining || 0);
    });

    return pakets.map((pkt) => {
      let pNums: number[] = [];
      try {
        pNums = typeof pkt.playerNumbers === 'string' ? JSON.parse(pkt.playerNumbers) : (pkt.playerNumbers || []);
      } catch {
        pNums = [];
      }

      const pNames = pNums.map(n => getPlayerName(n));

      // Hitung intervals waktu paket ini berada di lapangan
      let totalSecondsOnPitch = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      let shotsFor = 0;
      let shotsAgainst = 0;
      let losses = 0;
      let recoveries = 0;
      let fouls = 0;

      for (let i = 0; i < sortedSubs.length; i++) {
        const currentSub = sortedSubs[i];
        if (currentSub.paketIndex === pkt.paketIndex) {
          const nextSub = sortedSubs[i + 1];
          const startTimer = currentSub.timerRemaining ?? 1200;
          let endTimer = 0;
          if (nextSub && nextSub.half === currentSub.half) {
            endTimer = nextSub.timerRemaining ?? 0;
          }

          const duration = Math.max(0, startTimer - endTimer);
          totalSecondsOnPitch += duration;

          // Cek event-event yang terjadi dalam interval ini
          const intervalEvents = events.filter(e => {
            if (e.half !== currentSub.half) return false;
            // timeStr to seconds remaining
            const [m, s] = (e.timeStr || '00:00').split(':').map(Number);
            // Standar: 20 menit countdown timer
            const eventSec = isNaN(m) ? 0 : (20 - m) * 60 - (isNaN(s) ? 0 : s);
            return eventSec <= startTimer && eventSec >= endTimer;
          });

          for (const ev of intervalEvents) {
            if (ev.type === 'shot') {
              if (ev.team === 'home') {
                shotsFor++;
                if (ev.outcome === 'goal') goalsFor++;
              } else {
                shotsAgainst++;
                if (ev.outcome === 'goal') goalsAgainst++;
              }
            } else if (ev.type === 'loss' && ev.team === 'home') {
              losses++;
            } else if (ev.type === 'recover' && ev.team === 'home') {
              recoveries++;
            } else if (ev.type === 'foul' && ev.team === 'home') {
              fouls++;
            }
          }
        }
      }

      // Fallback jika tidak ada log subs, hitung langsung dari stats pemain di paket
      if (totalSecondsOnPitch === 0 && events.length > 0) {
        // Asumsikan pembagian merata jika belum ada subs log terperinci
        for (const ev of events) {
          if (ev.playerNo && pNums.includes(ev.playerNo)) {
            if (ev.type === 'shot') {
              shotsFor++;
              if (ev.outcome === 'goal') goalsFor++;
            } else if (ev.type === 'loss') {
              losses++;
            } else if (ev.type === 'recover') {
              recoveries++;
            } else if (ev.type === 'foul') {
              fouls++;
            }
          }
        }
      }

      const minutesPlayed = Math.round(totalSecondsOnPitch / 60);
      const plusMinus = goalsFor - goalsAgainst;
      const netRatingPer10Min = minutesPlayed > 0 ? Number(((plusMinus / minutesPlayed) * 10).toFixed(2)) : plusMinus;

      return {
        paketIndex: pkt.paketIndex,
        code: pkt.code || `Paket ${pkt.paketIndex + 1}`,
        playerNumbers: pNums,
        playerNames: pNames,
        minutesPlayed,
        goalsFor,
        goalsAgainst,
        plusMinus,
        netRatingPer10Min,
        shotsFor,
        shotsAgainst,
        losses,
        recoveries,
        fouls
      };
    });
  }

  /**
   * Analisis Distribusi Zona Tekanan & Kerentanan Turnover
   */
  static analyzeZones(events: MatchData['events']): ZoneAnalysis[] {
    const zoneMap: Record<string, ZoneAnalysis> = {};

    const categories: Array<'DEFENSIVE' | 'MIDDLE' | 'ATTACKING'> = ['DEFENSIVE', 'MIDDLE', 'ATTACKING'];
    const flanks: Array<'LEFT' | 'CENTER' | 'RIGHT'> = ['LEFT', 'CENTER', 'RIGHT'];

    categories.forEach(cat => {
      flanks.forEach(flank => {
        const sample = this.getZoneKey(
          cat === 'DEFENSIVE' ? 150 : cat === 'MIDDLE' ? 500 : 850,
          flank === 'LEFT' ? 100 : flank === 'CENTER' ? 300 : 500
        );
        zoneMap[sample.key] = {
          zoneKey: sample.key,
          name: sample.name,
          category: cat,
          flank,
          losses: 0,
          recoveries: 0,
          shots: 0,
          goals: 0,
          dangerScore: 0
        };
      });
    });

    for (const ev of events || []) {
      const z = this.getZoneKey(ev.x, ev.y);
      if (!zoneMap[z.key]) {
        zoneMap[z.key] = {
          zoneKey: z.key,
          name: z.name,
          category: z.cat,
          flank: z.flank,
          losses: 0,
          recoveries: 0,
          shots: 0,
          goals: 0,
          dangerScore: 0
        };
      }

      const target = zoneMap[z.key];
      if (ev.type === 'loss') target.losses++;
      else if (ev.type === 'recover') target.recoveries++;
      else if (ev.type === 'shot') {
        target.shots++;
        if (ev.outcome === 'goal') target.goals++;
      }
    }

    // Hitung Danger Score (0-100)
    const zonesList = Object.values(zoneMap);
    const maxLosses = Math.max(1, ...zonesList.map(z => z.losses));

    zonesList.forEach(z => {
      const weightDef = z.category === 'DEFENSIVE' ? 1.5 : z.category === 'MIDDLE' ? 1.0 : 0.6;
      z.dangerScore = Math.min(100, Math.round((z.losses / maxLosses) * 100 * weightDef));
    });

    return zonesList.sort((a, b) => b.dangerScore - a.dangerScore);
  }

  /**
   * Menghasilkan Briefing Taktis Otomatis (AI Coach Assistant)
   */
  static generateBriefing(matchData: MatchData, substitutions: SubstitutionLog[]): TacticalBriefing {
    const paketsMetrics = this.analyzePakets(matchData, substitutions);
    const zones = this.analyzeZones(matchData.events || []);
    const players = matchData.players || [];
    const events = matchData.events || [];

    // Cari top performers
    let topRecoveryPlayer: { no: number; name: string; count: number } | null = null;
    let topScorerPlayer: { no: number; name: string; count: number } | null = null;

    let maxRec = 0;
    let maxGoal = 0;

    players.forEach(p => {
      const totalRec = (p.rec1 || 0) + (p.rec2 || 0);
      const totalGoal = (p.gl1 || 0) + (p.gl2 || 0);

      if (totalRec > maxRec) {
        maxRec = totalRec;
        topRecoveryPlayer = { no: p.no, name: p.name, count: totalRec };
      }

      if (totalGoal > maxGoal) {
        maxGoal = totalGoal;
        topScorerPlayer = { no: p.no, name: p.name, count: totalGoal };
      }
    });

    // Cari Best & Riskiest Paket
    let bestPaket: PaketTacticalMetric | null = null;
    let riskiestPaket: PaketTacticalMetric | null = null;

    if (paketsMetrics.length > 0) {
      const sorted = [...paketsMetrics].sort((a, b) => b.plusMinus - a.plusMinus);
      bestPaket = sorted[0];
      riskiestPaket = sorted[sorted.length - 1];
    }

    const lossVulnerabilityZone = zones[0] || null;

    // Susun Strengths & Vulnerabilities
    const strengths: string[] = [];
    const vulnerabilities: string[] = [];
    const recommendations: string[] = [];

    if (bestPaket && bestPaket.plusMinus >= 0) {
      strengths.push(`Kombinasi rotasi **${bestPaket.code}** menghasilkan efektivitas tertinggi dengan selisih gol **+${bestPaket.plusMinus}**.`);
    }

    if (topRecoveryPlayer && topRecoveryPlayer.count > 0) {
      strengths.push(`**#${topRecoveryPlayer.no} ${topRecoveryPlayer.name}** menjadi anchor/ball-winner dominan dengan **${topRecoveryPlayer.count} recoveries**.`);
    }

    const totalLosses = events.filter(e => e.type === 'loss').length;
    const totalRecoveries = events.filter(e => e.type === 'recover').length;

    if (totalRecoveries >= totalLosses && totalRecoveries > 0) {
      strengths.push(`Rasio counter-press positif: Tim memenangkan kembali **${totalRecoveries} bola** dibanding **${totalLosses} turnover**.`);
    } else if (totalLosses > totalRecoveries) {
      vulnerabilities.push(`Turnover tinggi (**${totalLosses} Loss Ball** vs **${totalRecoveries} Recovery**), mengindikasikan risiko transisi negatif lawan.`);
    }

    if (lossVulnerabilityZone && lossVulnerabilityZone.losses > 0) {
      vulnerabilities.push(`Area **${lossVulnerabilityZone.name}** adalah zona paling rentan dengan **${lossVulnerabilityZone.losses} kali kehilangan bola**.`);
    }

    if (riskiestPaket && riskiestPaket.plusMinus < 0) {
      vulnerabilities.push(`Unit **${riskiestPaket.code}** mengalami defisit gol **${riskiestPaket.plusMinus}** saat bertanding di lapangan.`);
    }

    // Rekomendasi Taktis
    if (lossVulnerabilityZone && lossVulnerabilityZone.category === 'DEFENSIVE') {
      recommendations.push('Percepat sirkulasi bola saat build-up keluar dari defensive third untuk menghindari jebakan high-press lawan.');
    } else if (lossVulnerabilityZone && lossVulnerabilityZone.flank === 'LEFT') {
      recommendations.push('Perkuat support flank kiri saat rotasi menyerang agar tidak terisolasi 1v1.');
    }

    if (bestPaket) {
      recommendations.push(`Prioritaskan deployment **${bestPaket.code}** pada menit-menit krusial / fase power-play.`);
    }

    recommendations.push('Lakukan pergantian cepat (rotasi 2-3 menit) untuk menjaga intensitas pressing dan stamina pemain anchor & flank.');

    const homeScore = (matchData.match.homeScore1st || 0) + (matchData.match.homeScore2nd || 0);
    const awayScore = (matchData.match.awayScore1st || 0) + (matchData.match.awayScore2nd || 0);

    const executiveSummary = `Pertandingan berlangsung dengan skor saat ini **${homeScore} - ${awayScore}**. Tim mencatatkan total **${events.filter(e => e.type === 'shot' && e.team === 'home').length} shots**, **${totalLosses} loss balls**, dan **${totalRecoveries} recoveries**. ${
      bestPaket ? `Paket rotasi paling efektif adalah ${bestPaket.code} (+${bestPaket.plusMinus}).` : ''
    }`;

    return {
      executiveSummary,
      strengths: strengths.length > 0 ? strengths : ['Struktur formasi tim solid dalam menjaga kedisiplinan ruang.'],
      vulnerabilities: vulnerabilities.length > 0 ? vulnerabilities : ['Minimalkan kesalahan passing direct di area tengah.'],
      recommendations,
      bestPaket,
      riskiestPaket,
      topRecoveryPlayer,
      topScorerPlayer,
      lossVulnerabilityZone
    };
  }
}
