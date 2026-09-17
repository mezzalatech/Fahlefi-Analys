import pptxgen from 'pptxgenjs';

export interface MatchTacticalDetail {
  matchNo: number;
  opponent: string;
  scoreHome: number;
  scoreAway: number;
  result: 'W' | 'D' | 'L';
  dateVenue?: string;
  goals: Array<{
    id?: string;
    half: number;
    minute?: string;
    scorer: string;
    assist?: string;
    process: string; // e.g. "Counter Attack", "At Positional", "Corner Kick", "Free Kick", "Anti Press", "Power Play"
    paketPlayers: string[]; // 4 outfield players e.g. ["Fredik", "Nandi", "Fandi", "Reza"]
  }>;
  conceded: Array<{
    id?: string;
    half: number;
    minute?: string;
    concedeBy?: string;
    process: string; // e.g. "Counter Attack", "At Positional", "Kick In Dekat", "Corner Kick", "Gagal Power Play", "Def Power Play"
    paketPlayers: string[]; // 4 outfield players at time of conceding
  }>;
}

export interface PlayerStatRow {
  no: number;
  name: string;
  nickname?: string;
  position?: string;
  goalsPerMatch: Record<number, number>; // matchNo -> goals
  totalGoals: number;
  assistsPerMatch: Record<number, number>; // matchNo -> assists
  totalAssists: number;
  yellowCards: number;
  redCards: number;
}

export interface SeriesPresentationData {
  teamName: string;
  competitionTitle: string;
  seriesTitle: string;
  season: string;
  logoUrl?: string;
  matches: Array<{
    matchNo: number;
    opponent: string;
    scoreHome: number;
    scoreAway: number;
    result: 'W' | 'D' | 'L';
    dateVenue?: string;
  }>;
  players: PlayerStatRow[];
  tacticalMatches: MatchTacticalDetail[];
  summary?: {
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    totalGF: number;
    totalGA: number;
    goalDiff: number;
    topScorer: string;
    topAssist: string;
  };
}

// Brand Colors
const BG_DARK = '0B132B'; // Dark Navy Pitch
const TEXT_WHITE = 'FFFFFF';
const TEXT_MUTED = '94A3B8';
const EMERALD_ACCENT = '10B981'; // Green Accent
const AMBER_ACCENT = 'F59E0B'; // Gold/Yellow
const RED_ACCENT = 'EF4444'; // Red
const CYAN_ACCENT = '06B6D4'; // Cyan

export async function generatePptx(data: SeriesPresentationData): Promise<void> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = `${data.seriesTitle} - ${data.teamName} Tactical Analysis`;
  pres.author = 'Fahlefi Futsal Analytics';

  // -------------------------------------------------------------
  // SLIDE 1: COVER
  // -------------------------------------------------------------
  const slide1 = pres.addSlide();
  slide1.background = { color: BG_DARK };

  // Decorative header bar
  slide1.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.15,
    fill: { color: EMERALD_ACCENT }
  });

  // Series Badge / Category
  slide1.addText(data.competitionTitle.toUpperCase(), {
    x: 1.0,
    y: 1.8,
    w: 11.33,
    h: 0.5,
    fontSize: 16,
    color: EMERALD_ACCENT,
    bold: true,
    fontFace: 'Arial',
    align: 'center'
  });

  // Main Title
  slide1.addText(data.seriesTitle.toUpperCase(), {
    x: 1.0,
    y: 2.3,
    w: 11.33,
    h: 1.2,
    fontSize: 32,
    color: TEXT_WHITE,
    bold: true,
    fontFace: 'Arial',
    align: 'center'
  });

  // Team Subtitle
  slide1.addText(`LAPORAN EVALUASI & REKAPITULASI TAKTIKAL • ${data.teamName.toUpperCase()} • ${data.season}`, {
    x: 1.0,
    y: 3.5,
    w: 11.33,
    h: 0.6,
    fontSize: 14,
    color: TEXT_MUTED,
    fontFace: 'Arial',
    align: 'center'
  });

  // Footer Tagline
  slide1.addText('FAHLEFI FUTSAL ANALYTICS PLATFORM • EXECUTIVE INTELLIGENCE', {
    x: 1.0,
    y: 6.8,
    w: 11.33,
    h: 0.4,
    fontSize: 10,
    color: '64748B',
    fontFace: 'Arial',
    align: 'center'
  });

  // -------------------------------------------------------------
  // SLIDE 2: HASIL REKAP PERTANDINGAN SERI
  // -------------------------------------------------------------
  const slide2 = pres.addSlide();
  slide2.background = { color: BG_DARK };

  // Header Title
  slide2.addText('HASIL REKAPITULASI PERTANDINGAN SERI', {
    x: 0.8,
    y: 0.5,
    w: 8.0,
    h: 0.5,
    fontSize: 20,
    color: TEXT_WHITE,
    bold: true,
    fontFace: 'Arial'
  });

  slide2.addText(`Total Pertandingan: ${data.matches.length} Laga | Poin: ${data.summary?.points || 0} | GF: ${data.summary?.totalGF || 0} | GA: ${data.summary?.totalGA || 0}`, {
    x: 0.8,
    y: 1.0,
    w: 11.5,
    h: 0.35,
    fontSize: 12,
    color: EMERALD_ACCENT,
    fontFace: 'Arial'
  });

  // Table Data
  const matchTableRows: any[] = [
    [
      { text: 'MATCH', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } },
      { text: 'TIM HOME', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } },
      { text: 'SKOR', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } },
      { text: 'SKOR', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } },
      { text: 'TIM AWAY', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } },
      { text: 'HASIL', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } }
    ]
  ];

  data.matches.forEach((m, idx) => {
    const isWin = m.result === 'W';
    const isDraw = m.result === 'D';
    const resultColor = isWin ? EMERALD_ACCENT : isDraw ? AMBER_ACCENT : RED_ACCENT;
    const resultText = isWin ? 'MENANG' : isDraw ? 'IMBANG' : 'KALAH';
    const rowBg = idx % 2 === 0 ? '111827' : '1F2937';

    matchTableRows.push([
      { text: `M-${m.matchNo}`, options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'center', bold: true } },
      { text: data.teamName, options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'center' } },
      { text: String(m.scoreHome), options: { color: isWin ? EMERALD_ACCENT : TEXT_WHITE, fill: { color: rowBg }, align: 'center', bold: true } },
      { text: String(m.scoreAway), options: { color: !isWin && !isDraw ? RED_ACCENT : TEXT_WHITE, fill: { color: rowBg }, align: 'center', bold: true } },
      { text: m.opponent, options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'center' } },
      { text: resultText, options: { color: resultColor, fill: { color: rowBg }, align: 'center', bold: true } }
    ]);
  });

  slide2.addTable(matchTableRows, {
    x: 0.8,
    y: 1.5,
    w: 11.7,
    colW: [1.2, 3.2, 1.0, 1.0, 3.5, 1.8],
    rowH: 0.38,
    fontSize: 10,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: '334155' }
  });

  // -------------------------------------------------------------
  // SLIDE 3: TABEL AKUMULASI GOL PEMAIN
  // -------------------------------------------------------------
  const slide3 = pres.addSlide();
  slide3.background = { color: BG_DARK };

  slide3.addText('TABEL AKUMULASI GOL PEMAIN (PER MATCH)', {
    x: 0.8,
    y: 0.5,
    w: 11.0,
    h: 0.5,
    fontSize: 20,
    color: TEXT_WHITE,
    bold: true,
    fontFace: 'Arial'
  });

  const goalMatchCols = data.matches.map(m => `M${m.matchNo}`);
  const goalHeaderRow: any[] = [
    { text: 'NO', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } },
    { text: 'NAMA PEMAIN', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'left' } },
    ...goalMatchCols.map(c => ({ text: c, options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } })),
    { text: 'TOTAL GOL', options: { bold: true, color: EMERALD_ACCENT, fill: { color: '1E293B' }, align: 'center' } }
  ];

  const goalTableRows: any[] = [goalHeaderRow];
  const sortedByGoals = [...data.players].sort((a, b) => b.totalGoals - a.totalGoals);

  sortedByGoals.slice(0, 14).forEach((p, idx) => {
    const rowBg = idx % 2 === 0 ? '111827' : '1F2937';
    const matchVals = data.matches.map(m => {
      const g = p.goalsPerMatch[m.matchNo] || 0;
      return {
        text: g > 0 ? String(g) : '-',
        options: { color: g > 0 ? EMERALD_ACCENT : '64748B', fill: { color: rowBg }, align: 'center', bold: g > 0 }
      };
    });

    goalTableRows.push([
      { text: String(p.no), options: { color: TEXT_MUTED, fill: { color: rowBg }, align: 'center' } },
      { text: p.name, options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'left', bold: p.totalGoals > 0 } },
      ...matchVals,
      { text: String(p.totalGoals), options: { color: p.totalGoals > 0 ? EMERALD_ACCENT : TEXT_WHITE, fill: { color: rowBg }, align: 'center', bold: true } }
    ]);
  });

  slide3.addTable(goalTableRows, {
    x: 0.8,
    y: 1.3,
    w: 11.7,
    rowH: 0.35,
    fontSize: 9.5,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: '334155' }
  });

  // -------------------------------------------------------------
  // SLIDE 4: TABEL AKUMULASI ASSIST PEMAIN
  // -------------------------------------------------------------
  const slide4 = pres.addSlide();
  slide4.background = { color: BG_DARK };

  slide4.addText('TABEL AKUMULASI ASSIST PEMAIN (PER MATCH)', {
    x: 0.8,
    y: 0.5,
    w: 11.0,
    h: 0.5,
    fontSize: 20,
    color: TEXT_WHITE,
    bold: true,
    fontFace: 'Arial'
  });

  const assistHeaderRow: any[] = [
    { text: 'NO', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } },
    { text: 'NAMA PEMAIN', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'left' } },
    ...goalMatchCols.map(c => ({ text: c, options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } })),
    { text: 'TOTAL ASSIST', options: { bold: true, color: CYAN_ACCENT, fill: { color: '1E293B' }, align: 'center' } }
  ];

  const assistTableRows: any[] = [assistHeaderRow];
  const sortedByAssists = [...data.players].sort((a, b) => b.totalAssists - a.totalAssists);

  sortedByAssists.slice(0, 14).forEach((p, idx) => {
    const rowBg = idx % 2 === 0 ? '111827' : '1F2937';
    const matchVals = data.matches.map(m => {
      const a = p.assistsPerMatch[m.matchNo] || 0;
      return {
        text: a > 0 ? String(a) : '-',
        options: { color: a > 0 ? CYAN_ACCENT : '64748B', fill: { color: rowBg }, align: 'center', bold: a > 0 }
      };
    });

    assistTableRows.push([
      { text: String(p.no), options: { color: TEXT_MUTED, fill: { color: rowBg }, align: 'center' } },
      { text: p.name, options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'left', bold: p.totalAssists > 0 } },
      ...matchVals,
      { text: String(p.totalAssists), options: { color: p.totalAssists > 0 ? CYAN_ACCENT : TEXT_WHITE, fill: { color: rowBg }, align: 'center', bold: true } }
    ]);
  });

  slide4.addTable(assistTableRows, {
    x: 0.8,
    y: 1.3,
    w: 11.7,
    rowH: 0.35,
    fontSize: 9.5,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: '334155' }
  });

  // -------------------------------------------------------------
  // SLIDE 5: TABEL KARTU & KEDISIPLINAN
  // -------------------------------------------------------------
  const slide5 = pres.addSlide();
  slide5.background = { color: BG_DARK };

  slide5.addText('REKAPITULASI KEDISIPLINAN & KARTU (SERI)', {
    x: 0.8,
    y: 0.5,
    w: 11.0,
    h: 0.5,
    fontSize: 20,
    color: TEXT_WHITE,
    bold: true,
    fontFace: 'Arial'
  });

  const cardHeaderRow: any[] = [
    { text: 'NO', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } },
    { text: 'NAMA PEMAIN', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'left' } },
    { text: 'KARTU KUNING', options: { bold: true, color: AMBER_ACCENT, fill: { color: '1E293B' }, align: 'center' } },
    { text: 'KARTU MERAH', options: { bold: true, color: RED_ACCENT, fill: { color: '1E293B' }, align: 'center' } },
    { text: 'TOTAL KARTU', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } },
    { text: 'STATUS AKUMULASI', options: { bold: true, color: TEXT_WHITE, fill: { color: '1E293B' }, align: 'center' } }
  ];

  const cardTableRows: any[] = [cardHeaderRow];
  const sortedByCards = [...data.players].sort((a, b) => (b.yellowCards + b.redCards * 3) - (a.yellowCards + a.redCards * 3));

  sortedByCards.slice(0, 14).forEach((p, idx) => {
    const rowBg = idx % 2 === 0 ? '111827' : '1F2937';
    const total = p.yellowCards + p.redCards;
    const isWarning = p.yellowCards >= 3 || p.redCards >= 1;
    const statusText = p.redCards >= 1 ? 'HUKUMAN MERAH' : p.yellowCards >= 5 ? 'AKUMULASI SANKSI' : p.yellowCards >= 3 ? 'RAWAN AKUMULASI' : 'AMAN';
    const statusColor = p.redCards >= 1 ? RED_ACCENT : p.yellowCards >= 3 ? AMBER_ACCENT : EMERALD_ACCENT;

    cardTableRows.push([
      { text: String(p.no), options: { color: TEXT_MUTED, fill: { color: rowBg }, align: 'center' } },
      { text: p.name, options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'left', bold: total > 0 } },
      { text: p.yellowCards > 0 ? String(p.yellowCards) : '-', options: { color: p.yellowCards > 0 ? AMBER_ACCENT : '64748B', fill: { color: rowBg }, align: 'center', bold: p.yellowCards > 0 } },
      { text: p.redCards > 0 ? String(p.redCards) : '-', options: { color: p.redCards > 0 ? RED_ACCENT : '64748B', fill: { color: rowBg }, align: 'center', bold: p.redCards > 0 } },
      { text: String(total), options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'center', bold: true } },
      { text: statusText, options: { color: statusColor, fill: { color: rowBg }, align: 'center', bold: isWarning } }
    ]);
  });

  slide5.addTable(cardTableRows, {
    x: 0.8,
    y: 1.3,
    w: 11.7,
    colW: [0.8, 3.5, 1.8, 1.8, 1.8, 2.0],
    rowH: 0.35,
    fontSize: 9.5,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: '334155' }
  });

  // -------------------------------------------------------------
  // SLIDES 6 s/d N: ANALISIS TAKTIKAL PER PERTANDINGAN
  // -------------------------------------------------------------
  data.tacticalMatches.forEach((tm) => {
    const slide = pres.addSlide();
    slide.background = { color: BG_DARK };

    // Header Title: VS OPPONENT
    slide.addText(`ANALISA TAKTIKAL: ${data.teamName.toUpperCase()} VS ${tm.opponent.toUpperCase()}`, {
      x: 0.8,
      y: 0.45,
      w: 8.5,
      h: 0.45,
      fontSize: 18,
      color: TEXT_WHITE,
      bold: true,
      fontFace: 'Arial'
    });

    // Score Badge Box
    const isWin = tm.result === 'W';
    const isDraw = tm.result === 'D';
    const badgeColor = isWin ? EMERALD_ACCENT : isDraw ? AMBER_ACCENT : RED_ACCENT;
    slide.addText(`HASIL: ${tm.scoreHome} - ${tm.scoreAway} (${isWin ? 'MENANG' : isDraw ? 'IMBANG' : 'KALAH'})`, {
      x: 9.5,
      y: 0.45,
      w: 3.0,
      h: 0.45,
      fontSize: 14,
      color: badgeColor,
      bold: true,
      fontFace: 'Arial',
      align: 'right'
    });

    // Left Column: ANALISA GOL (CETAK GOL)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 1.1,
      w: 5.7,
      h: 5.8,
      rectRadius: 0.1,
      fill: { color: '0F172A' },
      line: { color: EMERALD_ACCENT, width: 1 }
    });

    slide.addText(`⚽ ANALISA GOL (${tm.goals.length} GOL)`, {
      x: 1.0,
      y: 1.25,
      w: 5.3,
      h: 0.4,
      fontSize: 13,
      color: EMERALD_ACCENT,
      bold: true,
      fontFace: 'Arial'
    });

    if (tm.goals.length === 0) {
      slide.addText('Tidak ada gol tercipta pada laga ini.', {
        x: 1.0,
        y: 2.0,
        w: 5.3,
        h: 0.5,
        fontSize: 11,
        color: '64748B',
        fontFace: 'Arial'
      });
    } else {
      let yGoal = 1.75;
      tm.goals.slice(0, 6).forEach((g, gIdx) => {
        const paketStr = g.paketPlayers?.length > 0 ? g.paketPlayers.join(' - ') : '-';
        slide.addText(`Gol ${gIdx + 1}: ${g.scorer} (Babak ${g.half})`, {
          x: 1.0,
          y: yGoal,
          w: 5.3,
          h: 0.28,
          fontSize: 10.5,
          color: TEXT_WHITE,
          bold: true,
          fontFace: 'Arial'
        });
        slide.addText(`• Proses: ${g.process || 'Open Play'}${g.assist ? ` | Assist: ${g.assist}` : ''}`, {
          x: 1.2,
          y: yGoal + 0.26,
          w: 5.1,
          h: 0.22,
          fontSize: 9.5,
          color: CYAN_ACCENT,
          fontFace: 'Arial'
        });
        slide.addText(`• Paket Lineup: [ ${paketStr} ]`, {
          x: 1.2,
          y: yGoal + 0.48,
          w: 5.1,
          h: 0.22,
          fontSize: 9.0,
          color: TEXT_MUTED,
          fontFace: 'Arial'
        });
        yGoal += 0.82;
      });
    }

    // Right Column: ANALISA KEBOBOLAN
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.8,
      y: 1.1,
      w: 5.7,
      h: 5.8,
      rectRadius: 0.1,
      fill: { color: '0F172A' },
      line: { color: RED_ACCENT, width: 1 }
    });

    slide.addText(`🛡️ ANALISA KEBOBOLAN (${tm.conceded.length} GOL LAWAN)`, {
      x: 7.0,
      y: 1.25,
      w: 5.3,
      h: 0.4,
      fontSize: 13,
      color: RED_ACCENT,
      bold: true,
      fontFace: 'Arial'
    });

    if (tm.conceded.length === 0) {
      slide.addText('Clean Sheet! Pertahanan sempurna tanpa kebobolan.', {
        x: 7.0,
        y: 2.0,
        w: 5.3,
        h: 0.5,
        fontSize: 11,
        color: EMERALD_ACCENT,
        fontFace: 'Arial'
      });
    } else {
      let yCon = 1.75;
      tm.conceded.slice(0, 6).forEach((c, cIdx) => {
        const paketStr = c.paketPlayers?.length > 0 ? c.paketPlayers.join(' - ') : '-';
        slide.addText(`Kebobolan ${cIdx + 1} (Babak ${c.half})`, {
          x: 7.0,
          y: yCon,
          w: 5.3,
          h: 0.28,
          fontSize: 10.5,
          color: TEXT_WHITE,
          bold: true,
          fontFace: 'Arial'
        });
        slide.addText(`• Proses: ${c.process || 'Individual / Positional Error'}`, {
          x: 7.2,
          y: yCon + 0.26,
          w: 5.1,
          h: 0.22,
          fontSize: 9.5,
          color: AMBER_ACCENT,
          fontFace: 'Arial'
        });
        slide.addText(`• Paket Lineup Bertahan: [ ${paketStr} ]`, {
          x: 7.2,
          y: yCon + 0.48,
          w: 5.1,
          h: 0.22,
          fontSize: 9.0,
          color: TEXT_MUTED,
          fontFace: 'Arial'
        });
        yCon += 0.82;
      });
    }
  });

  // Save / Trigger Download
  const filename = `${data.seriesTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Tactical_Presentation.pptx`;
  await pres.writeFile({ fileName: filename });
}
