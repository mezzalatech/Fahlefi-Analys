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

  /**
   * Menghasilkan Evaluasi Eksekutif Taktikal Seri Turnamen Otomatis (AI Series Tactical Evaluation)
   */
  static generateSeriesEvaluation(
    seriesData: {
      teamName?: string;
      summary?: {
        totalMatches: number;
        wins: number;
        draws: number;
        losses: number;
        totalGF: number;
        totalGA: number;
        topScorer?: string;
        topAssist?: string;
      };
      tacticalMatches?: Array<{
        matchNo: number;
        opponent: string;
        scoreHome: number;
        scoreAway: number;
        result: string;
        goals: Array<{ process: string; scorer: string; assist?: string; paketPlayers?: string[] }>;
        conceded: Array<{ process: string; half: number; paketPlayers?: string[] }>;
      }>;
      players?: Array<{ name: string; totalGoals: number; totalAssists: number }>;
    },
    allMatchesData: MatchData[] = []
  ): {
    winRatePct: number;
    strengths: Array<{ title: string; desc: string }>;
    vulnerabilities: Array<{ title: string; desc: string }>;
    recommendations: string[];
  } {
    const summary = seriesData.summary || {
      totalMatches: 1,
      wins: 1,
      draws: 0,
      losses: 0,
      totalGF: 0,
      totalGA: 0
    };

    const totalMatches = Math.max(1, summary.totalMatches);
    const winRatePct = Math.round(((summary.wins || 0) / totalMatches) * 100);
    const tacticalMatches = seriesData.tacticalMatches || [];

    // 1. Analisis Semua Gol yang Dicetak Tim
    const allGoals = tacticalMatches.flatMap(m => m.goals || []);
    const goalProcessMap: Record<string, number> = {};
    allGoals.forEach(g => {
      const proc = (g.process || 'Open Play').trim();
      goalProcessMap[proc] = (goalProcessMap[proc] || 0) + 1;
    });

    const sortedGoalProcs = Object.entries(goalProcessMap).sort((a, b) => b[1] - a[1]);
    const topGoalProc = sortedGoalProcs[0];

    // 2. Analisis Semua Kebobolan
    const allConceded = tacticalMatches.flatMap(m => m.conceded || []);
    const concedeProcessMap: Record<string, number> = {};
    let concedeH1Count = 0;
    let concedeH2Count = 0;
    const concedePaketMap: Record<string, number> = {};

    allConceded.forEach(c => {
      const proc = (c.process || 'Serangan Lawan').trim();
      concedeProcessMap[proc] = (concedeProcessMap[proc] || 0) + 1;
      if (c.half === 1) concedeH1Count++;
      else if (c.half === 2) concedeH2Count++;

      if (c.paketPlayers && c.paketPlayers.length > 0) {
        const key = c.paketPlayers.slice(0, 3).join(', ');
        concedePaketMap[key] = (concedePaketMap[key] || 0) + 1;
      }
    });

    const sortedConcedeProcs = Object.entries(concedeProcessMap).sort((a, b) => b[1] - a[1]);
    const topConcedeProc = sortedConcedeProcs[0];
    const sortedConcedePakets = Object.entries(concedePaketMap).sort((a, b) => b[1] - a[1]);
    const topConcedingUnit = sortedConcedePakets[0];

    // 3. Analisis Events (Turnovers, Recoveries, Zona Lapangan)
    const allEvents = allMatchesData.flatMap(m => m.events || []);
    const totalLosses = allEvents.filter(e => e.type === 'loss' && e.team === 'home').length;
    const totalRecoveries = allEvents.filter(e => e.type === 'recover' && e.team === 'home').length;
    const zones = this.analyzeZones(allEvents);
    const dangerZone = zones.find(z => z.category === 'DEFENSIVE' && z.losses > 0) || zones[0];

    // 4. Susun Kekuatan (Strengths)
    const strengths: Array<{ title: string; desc: string }> = [];

    if (topGoalProc && topGoalProc[1] > 0) {
      const pct = Math.round((topGoalProc[1] / Math.max(1, allGoals.length)) * 100);
      strengths.push({
        title: `Efektivitas Pola ${topGoalProc[0]}`,
        desc: `Sebanyak ${topGoalProc[1]} gol (${pct}% dari total gol) tercipta melalui skema ${topGoalProc[0].toLowerCase()}, menjadi senjata utama penyerangan tim.`
      });
    } else {
      strengths.push({
        title: 'Transisi Penyerangan Dinamis',
        desc: 'Variasi serangan dari sektor flank dan pivot berjalan agresif dalam membongkar pertahanan lawan.'
      });
    }

    if (summary.topScorer && summary.topScorer !== '-') {
      const topAssistText = summary.topAssist && summary.topAssist !== '-' ? ` didukung distribusi assist oleh ${summary.topAssist}` : '';
      strengths.push({
        title: 'Ketajaman & Kolektivitas Lini Serang',
        desc: `Produktivitas tinggi dipimpin oleh Top Scorer ${summary.topScorer}${topAssistText}.`
      });
    }

    if (totalRecoveries > 0) {
      strengths.push({
        title: 'Disiplin Ball Recovery & Counter-Press',
        desc: `Tim mencatatkan ${totalRecoveries} kali perebutan bola (recoveries) sukses untuk memutus progresi serangan lawan.`
      });
    } else if (winRatePct >= 50) {
      strengths.push({
        title: 'Konsistensi Hasil Seri Turnamen',
        desc: `Tingkat kemenangan ${winRatePct}% dengan produktivitas ${summary.totalGF} gol membuktikan dominasi strategi tim sepanjang seri.`
      });
    }

    // 5. Susun Titik Lemah & Evaluasi (Vulnerabilities)
    const vulnerabilities: Array<{ title: string; desc: string }> = [];

    if (allConceded.length > 0) {
      if (topConcedeProc) {
        vulnerabilities.push({
          title: `Kerentanan Terhadap ${topConcedeProc[0]}`,
          desc: `Catatan ${topConcedeProc[1]} gol kebobolan berakar dari situasi ${topConcedeProc[0].toLowerCase()} yang perlu diantisipasi dengan disiplin covering.`
        });
      }

      if (concedeH1Count > concedeH2Count && concedeH1Count > 0) {
        vulnerabilities.push({
          title: 'Konsentrasi Menit Awal (Babak 1)',
          desc: `Mayoritas kebobolan (${concedeH1Count} dari ${allConceded.length} gol) terjadi pada Babak 1, mengindikasikan perlunya fokus lebih cepat sejak kickoff.`
        });
      } else if (concedeH2Count > 0) {
        vulnerabilities.push({
          title: 'Manajemen Stamina & Menit Akhir',
          desc: `Kebobolan di Babak 2 (${concedeH2Count} gol) menuntut rotasi pemain yang lebih disiplin untuk menjaga intensitas bertahan.`
        });
      }

      if (topConcedingUnit && topConcedingUnit[1] > 1) {
        vulnerabilities.push({
          title: 'Koordinasi Unit Bertahan',
          desc: `Kombinasi rotasi unit [${topConcedingUnit[0]}] mencatatkan ${topConcedingUnit[1]} kali kebobolan dan perlu pematangan komunikasi man-to-man marking.`
        });
      }
    } else {
      vulnerabilities.push({
        title: 'Pertahanan Solid (Clean Sheet)',
        desc: 'Tidak ada catatan kebobolan signifikan, pertahankan struktur zonal marking dan penjagaan ruang antarlini.'
      });
    }

    if (dangerZone && dangerZone.losses > 0) {
      vulnerabilities.push({
        title: `Zona Rawan Turnover: ${dangerZone.name}`,
        desc: `Terdeteksi ${dangerZone.losses} kali kehilangan bola di area ${dangerZone.name}, hindari passing spekulatif di zona bertahan.`
      });
    } else if (vulnerabilities.length < 3) {
      vulnerabilities.push({
        title: 'Antisipasi Situasi Restart & Set-Piece Lawan',
        desc: 'Peningkatan konsistensi blocking dan wall formation saat menghadapi corner kick dan kick-in dekat kotak penalti lawan.'
      });
    }

    const recommendations = [
      'Tingkatkan kecepatan sirkulasi bola saat menghadapi pertahanan low block lawan.',
      'Disiplinkan covering anchor saat flank melakukan overlap menyerang.',
      'Maksimalkan rotasi paket berdurasi 2-3 menit untuk menjaga level pressing tetap maksimal.'
    ];

    return {
      winRatePct,
      strengths: strengths.slice(0, 3),
      vulnerabilities: vulnerabilities.slice(0, 3),
      recommendations
    };
  }
}

