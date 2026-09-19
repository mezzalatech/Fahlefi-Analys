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

// Brand Luxury Palette (Broadcast Standard)
const BG_DARK = '070D18'; // Deep Navy Pitch
const BG_CARD = '0F1D36'; // Card Background
const BG_CARD_LIGHT = '152747'; // Highlight Card
const BG_TABLE_HEADER = '1E293B';
const TEXT_WHITE = 'FFFFFF';
const TEXT_MUTED = '94A3B8';
const TEXT_DARK_SLATE = '64748B';
const EMERALD_ACCENT = '10B981'; // Green Highlight
const CYAN_ACCENT = '06B6D4'; // Cyan Highlight
const AMBER_ACCENT = 'F59E0B'; // Gold / Warning
const RED_ACCENT = 'EF4444'; // Red Danger
const BORDER_COLOR = '1E3A8A';

export async function generatePptx(data: SeriesPresentationData): Promise<void> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 13.33 x 7.5 inches
  pres.title = `${data.seriesTitle} - ${data.teamName} Tactical Analysis`;
  pres.author = 'FAHLEFI Futsal Analytics Platform';
  pres.company = 'FAHLEFI Tactical Suite';

  const totalMatches = data.matches.length;
  const wins = data.summary?.wins ?? data.matches.filter(m => m.result === 'W').length;
  const draws = data.summary?.draws ?? data.matches.filter(m => m.result === 'D').length;
  const losses = data.summary?.losses ?? data.matches.filter(m => m.result === 'L').length;
  const totalGF = data.summary?.totalGF ?? data.matches.reduce((s, m) => s + m.scoreHome, 0);
  const totalGA = data.summary?.totalGA ?? data.matches.reduce((s, m) => s + m.scoreAway, 0);
  const goalDiff = totalGF - totalGA;
  const points = data.summary?.points ?? (wins * 3 + draws * 1);
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // -------------------------------------------------------------
  // SLIDE 1: EXECUTIVE HERO COVER
  // -------------------------------------------------------------
  const slide1 = pres.addSlide();
  slide1.background = { color: BG_DARK };

  // Top Glowing Accent Bar
  slide1.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.12,
    fill: { color: EMERALD_ACCENT }
  });

  // Hero Card Container
  slide1.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 0.8,
    w: 11.73,
    h: 5.9,
    rectRadius: 0.15,
    fill: { color: BG_CARD },
    line: { color: '1E3A8A', width: 1.5 }
  });

  // Competition Tag Pill
  slide1.addShape(pres.ShapeType.roundRect, {
    x: 1.3,
    y: 1.2,
    w: 4.8,
    h: 0.42,
    rectRadius: 0.2,
    fill: { color: '132545' },
    line: { color: CYAN_ACCENT, width: 1 }
  });

  slide1.addText(`🏆 ${data.competitionTitle.toUpperCase()}`, {
    x: 1.3,
    y: 1.2,
    w: 4.8,
    h: 0.42,
    fontSize: 11,
    color: CYAN_ACCENT,
    bold: true,
    fontFace: 'Arial',
    align: 'center',
    valign: 'middle'
  });

  // Main Deck Title
  slide1.addText(data.seriesTitle.toUpperCase(), {
    x: 1.3,
    y: 1.9,
    w: 10.73,
    h: 1.1,
    fontSize: 28,
    color: TEXT_WHITE,
    bold: true,
    fontFace: 'Arial',
    valign: 'middle'
  });

  // Team Big Name Highlight
  slide1.addText(`${data.teamName.toUpperCase()}`, {
    x: 1.3,
    y: 2.9,
    w: 10.73,
    h: 0.7,
    fontSize: 24,
    color: EMERALD_ACCENT,
    bold: true,
    fontFace: 'Arial'
  });

  slide1.addText(`LAPORAN EVALUASI TAKTIKAL & DOSSIER KINERJA SKUAD • ${data.season}`, {
    x: 1.3,
    y: 3.6,
    w: 10.73,
    h: 0.4,
    fontSize: 13,
    color: TEXT_MUTED,
    fontFace: 'Arial'
  });

  // 3 Mini Metadata Summary Cards at Bottom of Cover
  const coverCards = [
    { label: 'TOTAL PERTANDINGAN', val: `${totalMatches} Laga`, sub: `${wins}W • ${draws}D • ${losses}L`, color: CYAN_ACCENT },
    { label: 'WIN RATE & POIN', val: `${winRate}% (${points} Pts)`, sub: `Selisih Gol: ${goalDiff >= 0 ? `+${goalDiff}` : goalDiff}`, color: EMERALD_ACCENT },
    { label: 'PRODUKTIVITAS GOL', val: `${totalGF} Gol`, sub: `Kebobolan: ${totalGA} Gol`, color: AMBER_ACCENT }
  ];

  coverCards.forEach((c, idx) => {
    const xPos = 1.3 + idx * 3.6;
    slide1.addShape(pres.ShapeType.roundRect, {
      x: xPos,
      y: 4.5,
      w: 3.4,
      h: 1.6,
      rectRadius: 0.1,
      fill: { color: '0A1324' },
      line: { color: '1E293B', width: 1 }
    });

    slide1.addText(c.label, {
      x: xPos + 0.2,
      y: 4.65,
      w: 3.0,
      h: 0.25,
      fontSize: 9,
      color: TEXT_MUTED,
      bold: true,
      fontFace: 'Arial'
    });

    slide1.addText(c.val, {
      x: xPos + 0.2,
      y: 4.95,
      w: 3.0,
      h: 0.5,
      fontSize: 18,
      color: c.color,
      bold: true,
      fontFace: 'Arial'
    });

    slide1.addText(c.sub, {
      x: xPos + 0.2,
      y: 5.5,
      w: 3.0,
      h: 0.3,
      fontSize: 9.5,
      color: TEXT_DARK_SLATE,
      fontFace: 'Arial'
    });
  });

  // Bottom Tagline
  slide1.addText('FAHLEFI FUTSAL ANALYTICS • OFFICIAL PERFORMANCE INTELLIGENCE', {
    x: 0.8,
    y: 6.9,
    w: 11.73,
    h: 0.35,
    fontSize: 9,
    color: '475569',
    fontFace: 'Arial',
    align: 'center'
  });

  // -------------------------------------------------------------
  // SLIDE 2: RINGKASAN EKSEKUTIF & HASIL PERTANDINGAN
  // -------------------------------------------------------------
  const slide2 = pres.addSlide();
  slide2.background = { color: BG_DARK };

  // Header Title
  slide2.addText('HASIL REKAPITULASI PERTANDINGAN SERI', {
    x: 0.8,
    y: 0.4,
    w: 8.5,
    h: 0.45,
    fontSize: 20,
    color: TEXT_WHITE,
    bold: true,
    fontFace: 'Arial'
  });

  slide2.addText(`${data.competitionTitle} • ${data.teamName}`, {
    x: 0.8,
    y: 0.85,
    w: 8.5,
    h: 0.3,
    fontSize: 11,
    color: CYAN_ACCENT,
    fontFace: 'Arial'
  });

  // 4 Top KPI Cards
  const kpis = [
    { title: 'TOTAL MATCH', val: String(totalMatches), sub: `${wins}M • ${draws}S • ${losses}K`, color: TEXT_WHITE },
    { title: 'WIN RATE', val: `${winRate}%`, sub: 'Tingkat Kemenangan', color: EMERALD_ACCENT },
    { title: 'GOALS (GF - GA)', val: `${totalGF} - ${totalGA}`, sub: `Selisih Gol: ${goalDiff >= 0 ? `+${goalDiff}` : goalDiff}`, color: CYAN_ACCENT },
    { title: 'POIN SERI', val: `${points} PTS`, sub: `Rasio ${(points / Math.max(totalMatches, 1)).toFixed(1)} Pts/Game`, color: AMBER_ACCENT }
  ];

  kpis.forEach((k, idx) => {
    const xPos = 0.8 + idx * 2.98;
    slide2.addShape(pres.ShapeType.roundRect, {
      x: xPos,
      y: 1.25,
      w: 2.82,
      h: 1.1,
      rectRadius: 0.1,
      fill: { color: BG_CARD },
      line: { color: '1E3A8A', width: 1 }
    });

    slide2.addText(k.title, {
      x: xPos + 0.15,
      y: 1.35,
      w: 2.5,
      h: 0.2,
      fontSize: 8.5,
      color: TEXT_MUTED,
      bold: true,
      fontFace: 'Arial'
    });

    slide2.addText(k.val, {
      x: xPos + 0.15,
      y: 1.55,
      w: 2.5,
      h: 0.45,
      fontSize: 16,
      color: k.color,
      bold: true,
      fontFace: 'Arial'
    });

    slide2.addText(k.sub, {
      x: xPos + 0.15,
      y: 2.02,
      w: 2.5,
      h: 0.22,
      fontSize: 8.5,
      color: TEXT_DARK_SLATE,
      fontFace: 'Arial'
    });
  });

  // Table Data
  const matchTableRows: any[] = [
    [
      { text: 'MATCH', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
      { text: 'TIM KITA', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
      { text: 'SKOR', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
      { text: 'SKOR', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
      { text: 'TIM LAWAN', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
      { text: 'STATUS HASIL', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } }
    ]
  ];

  data.matches.forEach((m, idx) => {
    const isWin = m.result === 'W';
    const isDraw = m.result === 'D';
    const resultColor = isWin ? EMERALD_ACCENT : isDraw ? AMBER_ACCENT : RED_ACCENT;
    const resultText = isWin ? 'MENANG (W)' : isDraw ? 'SERI (D)' : 'KALAH (L)';
    const rowBg = idx % 2 === 0 ? '0B1528' : '101E38';

    matchTableRows.push([
      { text: `Match #${m.matchNo}`, options: { color: TEXT_MUTED, fill: { color: rowBg }, align: 'center', bold: true } },
      { text: data.teamName, options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'center', bold: true } },
      { text: String(m.scoreHome), options: { color: isWin ? EMERALD_ACCENT : TEXT_WHITE, fill: { color: rowBg }, align: 'center', bold: true } },
      { text: String(m.scoreAway), options: { color: !isWin && !isDraw ? RED_ACCENT : TEXT_WHITE, fill: { color: rowBg }, align: 'center', bold: true } },
      { text: m.opponent, options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'center' } },
      { text: resultText, options: { color: resultColor, fill: { color: rowBg }, align: 'center', bold: true } }
    ]);
  });

  slide2.addTable(matchTableRows, {
    x: 0.8,
    y: 2.55,
    w: 11.73,
    colW: [1.3, 3.2, 0.9, 0.9, 3.4, 2.03],
    rowH: 0.36,
    fontSize: 9.5,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: '1E3A8A' }
  });

  // -------------------------------------------------------------
  // SLIDE 3: LEADERBOARD GOL & PENYELESAIAN AKHIR
  // -------------------------------------------------------------
  const slide3 = pres.addSlide();
  slide3.background = { color: BG_DARK };

  slide3.addText('LEADERBOARD GOL & PENYELESAIAN AKHIR', {
    x: 0.8,
    y: 0.4,
    w: 8.5,
    h: 0.45,
    fontSize: 20,
    color: TEXT_WHITE,
    bold: true,
    fontFace: 'Arial'
  });

  slide3.addText('Akumulasi & Distribusi Gol Seluruh Pemain per Pertandingan', {
    x: 0.8,
    y: 0.85,
    w: 8.5,
    h: 0.3,
    fontSize: 11,
    color: EMERALD_ACCENT,
    fontFace: 'Arial'
  });

  const sortedByGoals = [...data.players].sort((a, b) => b.totalGoals - a.totalGoals);
  const top1 = sortedByGoals[0];
  const top2 = sortedByGoals[1];
  const top3 = sortedByGoals[2];

  // Top 3 Podium Cards on Left
  const podiumCards = [
    { rank: '🏆 TOP SCORER #1', player: top1, color: AMBER_ACCENT, bg: '172554' },
    { rank: '🥈 RUNNER UP #2', player: top2, color: 'CBD5E1', bg: '0F1D36' },
    { rank: '🥉 3RD BEST #3', player: top3, color: 'F97316', bg: '0F1D36' }
  ];

  podiumCards.forEach((pod, idx) => {
    const yPos = 1.3 + idx * 1.8;
    slide3.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: yPos,
      w: 3.4,
      h: 1.65,
      rectRadius: 0.1,
      fill: { color: pod.bg },
      line: { color: pod.color, width: 1 }
    });

    slide3.addText(pod.rank, {
      x: 1.0,
      y: yPos + 0.15,
      w: 3.0,
      h: 0.25,
      fontSize: 9.5,
      color: pod.color,
      bold: true,
      fontFace: 'Arial'
    });

    slide3.addText(pod.player ? `#${pod.player.no} ${pod.player.name}` : '-', {
      x: 1.0,
      y: yPos + 0.42,
      w: 3.0,
      h: 0.45,
      fontSize: 13,
      color: TEXT_WHITE,
      bold: true,
      fontFace: 'Arial'
    });

    slide3.addText(`${pod.player?.totalGoals || 0} GOL`, {
      x: 1.0,
      y: yPos + 0.9,
      w: 3.0,
      h: 0.5,
      fontSize: 18,
      color: EMERALD_ACCENT,
      bold: true,
      fontFace: 'Arial'
    });

    slide3.addText(`Posisi: ${pod.player?.position || 'FP'}`, {
      x: 1.0,
      y: yPos + 1.38,
      w: 3.0,
      h: 0.2,
      fontSize: 8.5,
      color: TEXT_MUTED,
      fontFace: 'Arial'
    });
  });

  // Table of Goals on Right
  const goalMatchCols = data.matches.map(m => `M${m.matchNo}`);
  const goalHeaderRow: any[] = [
    { text: 'NO', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
    { text: 'NAMA PEMAIN', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'left' } },
    ...goalMatchCols.map(c => ({ text: c, options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } })),
    { text: 'TOTAL GOL', options: { bold: true, color: EMERALD_ACCENT, fill: { color: BG_TABLE_HEADER }, align: 'center' } }
  ];

  const goalTableRows: any[] = [goalHeaderRow];
  sortedByGoals.slice(0, 12).forEach((p, idx) => {
    const rowBg = idx % 2 === 0 ? '0B1528' : '101E38';
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
    x: 4.5,
    y: 1.3,
    w: 8.03,
    rowH: 0.36,
    fontSize: 9,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: '1E3A8A' }
  });

  // -------------------------------------------------------------
  // SLIDE 4: LEADERBOARD ASSIST & KREASI PELUANG
  // -------------------------------------------------------------
  const slide4 = pres.addSlide();
  slide4.background = { color: BG_DARK };

  slide4.addText('LEADERBOARD ASSIST & KREASI PELUANG', {
    x: 0.8,
    y: 0.4,
    w: 8.5,
    h: 0.45,
    fontSize: 20,
    color: TEXT_WHITE,
    bold: true,
    fontFace: 'Arial'
  });

  slide4.addText('Daftar Playmaker & Umpan Gol Akumulatif per Pertandingan', {
    x: 0.8,
    y: 0.85,
    w: 8.5,
    h: 0.3,
    fontSize: 11,
    color: CYAN_ACCENT,
    fontFace: 'Arial'
  });

  const sortedByAssists = [...data.players].sort((a, b) => b.totalAssists - a.totalAssists);
  const aTop1 = sortedByAssists[0];
  const aTop2 = sortedByAssists[1];
  const aTop3 = sortedByAssists[2];

  const assistPodiumCards = [
    { rank: '🎯 TOP PLAYMAKER #1', player: aTop1, color: CYAN_ACCENT, bg: '083344' },
    { rank: '🥈 RUNNER UP #2', player: aTop2, color: 'CBD5E1', bg: '0F1D36' },
    { rank: '🥉 3RD BEST #3', player: aTop3, color: 'F97316', bg: '0F1D36' }
  ];

  assistPodiumCards.forEach((pod, idx) => {
    const yPos = 1.3 + idx * 1.8;
    slide4.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: yPos,
      w: 3.4,
      h: 1.65,
      rectRadius: 0.1,
      fill: { color: pod.bg },
      line: { color: pod.color, width: 1 }
    });

    slide4.addText(pod.rank, {
      x: 1.0,
      y: yPos + 0.15,
      w: 3.0,
      h: 0.25,
      fontSize: 9.5,
      color: pod.color,
      bold: true,
      fontFace: 'Arial'
    });

    slide4.addText(pod.player ? `#${pod.player.no} ${pod.player.name}` : '-', {
      x: 1.0,
      y: yPos + 0.42,
      w: 3.0,
      h: 0.45,
      fontSize: 13,
      color: TEXT_WHITE,
      bold: true,
      fontFace: 'Arial'
    });

    slide4.addText(`${pod.player?.totalAssists || 0} ASSIST`, {
      x: 1.0,
      y: yPos + 0.9,
      w: 3.0,
      h: 0.5,
      fontSize: 18,
      color: CYAN_ACCENT,
      bold: true,
      fontFace: 'Arial'
    });

    slide4.addText(`Posisi: ${pod.player?.position || 'FP'}`, {
      x: 1.0,
      y: yPos + 1.38,
      w: 3.0,
      h: 0.2,
      fontSize: 8.5,
      color: TEXT_MUTED,
      fontFace: 'Arial'
    });
  });

  const assistHeaderRow: any[] = [
    { text: 'NO', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
    { text: 'NAMA PEMAIN', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'left' } },
    ...goalMatchCols.map(c => ({ text: c, options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } })),
    { text: 'TOTAL ASSIST', options: { bold: true, color: CYAN_ACCENT, fill: { color: BG_TABLE_HEADER }, align: 'center' } }
  ];

  const assistTableRows: any[] = [assistHeaderRow];
  sortedByAssists.slice(0, 12).forEach((p, idx) => {
    const rowBg = idx % 2 === 0 ? '0B1528' : '101E38';
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
    x: 4.5,
    y: 1.3,
    w: 8.03,
    rowH: 0.36,
    fontSize: 9,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: '1E3A8A' }
  });

  // -------------------------------------------------------------
  // SLIDE 5: REKAPITULASI KEDISIPLINAN & KARTU
  // -------------------------------------------------------------
  const slide5 = pres.addSlide();
  slide5.background = { color: BG_DARK };

  slide5.addText('REKAPITULASI KEDISIPLINAN & KARTU', {
    x: 0.8,
    y: 0.4,
    w: 8.5,
    h: 0.45,
    fontSize: 20,
    color: TEXT_WHITE,
    bold: true,
    fontFace: 'Arial'
  });

  slide5.addText('Monitoring Pelanggaran, Kartu Kuning, & Resiko Akumulasi Sanksi Laga', {
    x: 0.8,
    y: 0.85,
    w: 8.5,
    h: 0.3,
    fontSize: 11,
    color: AMBER_ACCENT,
    fontFace: 'Arial'
  });

  const cardHeaderRow: any[] = [
    { text: 'NO', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
    { text: 'NAMA PEMAIN', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'left' } },
    { text: 'KARTU KUNING', options: { bold: true, color: AMBER_ACCENT, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
    { text: 'KARTU MERAH', options: { bold: true, color: RED_ACCENT, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
    { text: 'TOTAL', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } },
    { text: 'STATUS SANKSI', options: { bold: true, color: TEXT_WHITE, fill: { color: BG_TABLE_HEADER }, align: 'center' } }
  ];

  const cardTableRows: any[] = [cardHeaderRow];
  const sortedByCards = [...data.players].sort((a, b) => (b.yellowCards + b.redCards * 3) - (a.yellowCards + a.redCards * 3));

  sortedByCards.slice(0, 12).forEach((p, idx) => {
    const rowBg = idx % 2 === 0 ? '0B1528' : '101E38';
    const total = p.yellowCards + p.redCards;
    const isWarning = p.yellowCards >= 3 || p.redCards >= 1;
    const statusText = p.redCards >= 1 ? 'HUKUMAN MERAH' : p.yellowCards >= 5 ? 'AKUMULASI SANKSI' : p.yellowCards >= 3 ? 'RAWAN AKUMULASI' : 'AMAN';
    const statusColor = p.redCards >= 1 ? RED_ACCENT : p.yellowCards >= 3 ? AMBER_ACCENT : EMERALD_ACCENT;

    cardTableRows.push([
      { text: String(p.no), options: { color: TEXT_MUTED, fill: { color: rowBg }, align: 'center' } },
      { text: p.name, options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'left', bold: total > 0 } },
      { text: p.yellowCards > 0 ? `🟨 ${p.yellowCards}` : '-', options: { color: p.yellowCards > 0 ? AMBER_ACCENT : '64748B', fill: { color: rowBg }, align: 'center', bold: p.yellowCards > 0 } },
      { text: p.redCards > 0 ? `🟥 ${p.redCards}` : '-', options: { color: p.redCards > 0 ? RED_ACCENT : '64748B', fill: { color: rowBg }, align: 'center', bold: p.redCards > 0 } },
      { text: String(total), options: { color: TEXT_WHITE, fill: { color: rowBg }, align: 'center', bold: true } },
      { text: statusText, options: { color: statusColor, fill: { color: rowBg }, align: 'center', bold: isWarning } }
    ]);
  });

  slide5.addTable(cardTableRows, {
    x: 0.8,
    y: 1.3,
    w: 11.73,
    colW: [0.9, 4.0, 1.8, 1.8, 1.2, 2.03],
    rowH: 0.38,
    fontSize: 9.5,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: '1E3A8A' }
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
      y: 0.4,
      w: 8.5,
      h: 0.45,
      fontSize: 18,
      color: TEXT_WHITE,
      bold: true,
      fontFace: 'Arial'
    });

    const isWin = tm.result === 'W';
    const isDraw = tm.result === 'D';
    const badgeColor = isWin ? EMERALD_ACCENT : isDraw ? AMBER_ACCENT : RED_ACCENT;
    const badgeText = isWin ? 'MENANG' : isDraw ? 'SERI' : 'KALAH';

    slide.addText(`HASIL: ${tm.scoreHome} - ${tm.scoreAway} (${badgeText}) • Match #${tm.matchNo}`, {
      x: 7.5,
      y: 0.4,
      w: 5.0,
      h: 0.45,
      fontSize: 13,
      color: badgeColor,
      bold: true,
      fontFace: 'Arial',
      align: 'right'
    });

    // LEFT CARD: ANALISA GOL & SERANGAN (EMERALD)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 1.0,
      w: 5.7,
      h: 6.0,
      rectRadius: 0.12,
      fill: { color: BG_CARD },
      line: { color: EMERALD_ACCENT, width: 1.2 }
    });

    slide.addText(`⚽ ANALISA GOL (${tm.goals.length} GOL TERCIPTA)`, {
      x: 1.0,
      y: 1.15,
      w: 5.3,
      h: 0.35,
      fontSize: 12,
      color: EMERALD_ACCENT,
      bold: true,
      fontFace: 'Arial'
    });

    if (tm.goals.length === 0) {
      slide.addText('Tidak ada gol tercipta pada pertandingan ini.', {
        x: 1.0,
        y: 2.0,
        w: 5.3,
        h: 0.5,
        fontSize: 11,
        color: TEXT_MUTED,
        fontFace: 'Arial'
      });
    } else {
      let yGoal = 1.6;
      tm.goals.slice(0, 5).forEach((g, gIdx) => {
        const paketStr = g.paketPlayers?.length > 0 ? g.paketPlayers.join(' • ') : '-';
        
        // Goal Item Sub-box
        slide.addShape(pres.ShapeType.roundRect, {
          x: 1.0,
          y: yGoal,
          w: 5.3,
          h: 0.95,
          rectRadius: 0.08,
          fill: { color: '091222' },
          line: { color: '1E293B', width: 0.8 }
        });

        slide.addText(`Gol #${gIdx + 1} (Babak ${g.half}${g.minute ? ` - ${g.minute}` : ''}) • ${g.scorer}`, {
          x: 1.15,
          y: yGoal + 0.08,
          w: 5.0,
          h: 0.26,
          fontSize: 10,
          color: TEXT_WHITE,
          bold: true,
          fontFace: 'Arial'
        });

        slide.addText(`Proses: [ ${g.process || 'Open Play'} ]${g.assist ? ` • Assist: ${g.assist}` : ''}`, {
          x: 1.15,
          y: yGoal + 0.35,
          w: 5.0,
          h: 0.22,
          fontSize: 9,
          color: CYAN_ACCENT,
          fontFace: 'Arial'
        });

        slide.addText(`Unit 4 Pemain: [ ${paketStr} ]`, {
          x: 1.15,
          y: yGoal + 0.60,
          w: 5.0,
          h: 0.22,
          fontSize: 8.5,
          color: TEXT_MUTED,
          fontFace: 'Arial'
        });

        yGoal += 1.05;
      });
    }

    // RIGHT CARD: ANALISA KEBOBOLAN & PERTAHANAN (RED)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.83,
      y: 1.0,
      w: 5.7,
      h: 6.0,
      rectRadius: 0.12,
      fill: { color: BG_CARD },
      line: { color: RED_ACCENT, width: 1.2 }
    });

    slide.addText(`🛡️ ANALISA KEBOBOLAN (${tm.conceded.length} GOL LAWAN)`, {
      x: 7.03,
      y: 1.15,
      w: 5.3,
      h: 0.35,
      fontSize: 12,
      color: RED_ACCENT,
      bold: true,
      fontFace: 'Arial'
    });

    if (tm.conceded.length === 0) {
      slide.addShape(pres.ShapeType.roundRect, {
        x: 7.03,
        y: 2.0,
        w: 5.3,
        h: 1.2,
        rectRadius: 0.1,
        fill: { color: '052E16' },
        line: { color: EMERALD_ACCENT, width: 1 }
      });

      slide.addText('CLEAN SHEET! Pertahanan Sempurna', {
        x: 7.2,
        y: 2.2,
        w: 5.0,
        h: 0.35,
        fontSize: 13,
        color: EMERALD_ACCENT,
        bold: true,
        fontFace: 'Arial'
      });

      slide.addText('Tim berhasil menjaga gawang tanpa kebobolan sepanjang 40 menit pertandingan.', {
        x: 7.2,
        y: 2.6,
        w: 5.0,
        h: 0.4,
        fontSize: 9.5,
        color: 'A7F3D0',
        fontFace: 'Arial'
      });
    } else {
      let yCon = 1.6;
      tm.conceded.slice(0, 5).forEach((c, cIdx) => {
        const paketStr = c.paketPlayers?.length > 0 ? c.paketPlayers.join(' • ') : '-';

        slide.addShape(pres.ShapeType.roundRect, {
          x: 7.03,
          y: yCon,
          w: 5.3,
          h: 0.95,
          rectRadius: 0.08,
          fill: { color: '091222' },
          line: { color: '1E293B', width: 0.8 }
        });

        slide.addText(`Kebobolan #${cIdx + 1} (Babak ${c.half}${c.minute ? ` - ${c.minute}` : ''})`, {
          x: 7.18,
          y: yCon + 0.08,
          w: 5.0,
          h: 0.26,
          fontSize: 10,
          color: TEXT_WHITE,
          bold: true,
          fontFace: 'Arial'
        });

        slide.addText(`Proses: [ ${c.process || 'Individual / Positional Error'} ]`, {
          x: 7.18,
          y: yCon + 0.35,
          w: 5.0,
          h: 0.22,
          fontSize: 9,
          color: AMBER_ACCENT,
          fontFace: 'Arial'
        });

        slide.addText(`Unit Bertahan: [ ${paketStr} ]`, {
          x: 7.18,
          y: yCon + 0.60,
          w: 5.0,
          h: 0.22,
          fontSize: 8.5,
          color: TEXT_MUTED,
          fontFace: 'Arial'
        });

        yCon += 1.05;
      });
    }
  });

  // Save / Trigger Download
  const filename = `${data.seriesTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Tactical_Presentation.pptx`;
  await pres.writeFile({ fileName: filename });
}
