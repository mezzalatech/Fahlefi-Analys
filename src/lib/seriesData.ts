import type { SeriesPresentationData, MatchTacticalDetail, PlayerStatRow } from './pptxExporter';
import type { MatchData } from './api';
import { api } from './api';

// Preloaded Official Moncongbulo FC Seri 2 Data from presentasi.pptx
export const MONCONGBULO_SERI_2_DATA: SeriesPresentationData = {
  teamName: 'Moncongbulo FC',
  competitionTitle: 'Profesional Futsal League 2023-2024',
  seriesTitle: 'Hasil Rekap Seri 2 PFL 2023-2024',
  season: 'Musim 2023-2024',
  matches: [
    { matchNo: 12, opponent: 'Unggul FC', scoreHome: 2, scoreAway: 4, result: 'L', dateVenue: 'Seri 2' },
    { matchNo: 13, opponent: 'Giga FC', scoreHome: 7, scoreAway: 0, result: 'W', dateVenue: 'Seri 2' },
    { matchNo: 14, opponent: 'Cosmo JNE', scoreHome: 3, scoreAway: 3, result: 'D', dateVenue: 'Seri 2' },
    { matchNo: 15, opponent: 'Kinantan FC', scoreHome: 5, scoreAway: 3, result: 'W', dateVenue: 'Seri 2' },
    { matchNo: 16, opponent: 'Halus FC', scoreHome: 0, scoreAway: 2, result: 'L', dateVenue: 'Seri 2' },
    { matchNo: 17, opponent: 'BTS (Bintang Timur)', scoreHome: 1, scoreAway: 3, result: 'L', dateVenue: 'Seri 2' },
    { matchNo: 18, opponent: 'Sadakata FC', scoreHome: 2, scoreAway: 2, result: 'D', dateVenue: 'Seri 2' },
    { matchNo: 19, opponent: 'Kancil WHW', scoreHome: 3, scoreAway: 4, result: 'L', dateVenue: 'Seri 2' },
    { matchNo: 20, opponent: 'Blacksteel FC', scoreHome: 2, scoreAway: 10, result: 'L', dateVenue: 'Seri 2' },
    { matchNo: 21, opponent: 'Pendekar United', scoreHome: 4, scoreAway: 2, result: 'W', dateVenue: 'Seri 2' },
    { matchNo: 22, opponent: 'Fafage Banua', scoreHome: 4, scoreAway: 10, result: 'L', dateVenue: 'Seri 2' }
  ],
  players: [
    {
      no: 10,
      name: 'NANDI SUKMA',
      nickname: 'Nandi',
      position: 'FLANK_LEFT',
      goalsPerMatch: { 12: 1, 13: 1, 15: 2, 18: 1, 21: 2 },
      totalGoals: 7,
      assistsPerMatch: { 13: 1, 15: 1 },
      totalAssists: 2,
      yellowCards: 1,
      redCards: 0
    },
    {
      no: 9,
      name: 'RAMDHAN JAMALUDDIN',
      nickname: 'Ramdan',
      position: 'PIVOT',
      goalsPerMatch: { 13: 1, 15: 1, 19: 1, 21: 1, 22: 1 },
      totalGoals: 5,
      assistsPerMatch: { 13: 1, 14: 1, 19: 1 },
      totalAssists: 3,
      yellowCards: 3,
      redCards: 0
    },
    {
      no: 7,
      name: 'FANDI PERMANA',
      nickname: 'Fandi',
      position: 'FLANK_RIGHT',
      goalsPerMatch: { 13: 1, 14: 1, 18: 1, 19: 1 },
      totalGoals: 4,
      assistsPerMatch: { 13: 1, 14: 1, 18: 1 },
      totalAssists: 3,
      yellowCards: 3,
      redCards: 0
    },
    {
      no: 11,
      name: 'ZEHDI INSANA',
      nickname: 'Zehdi',
      position: 'PIVOT',
      goalsPerMatch: { 13: 2, 15: 2 },
      totalGoals: 4,
      assistsPerMatch: { 15: 1 },
      totalAssists: 1,
      yellowCards: 2,
      redCards: 0
    },
    {
      no: 4,
      name: 'FACHRI REZA',
      nickname: 'Reza',
      position: 'ANCHOR',
      goalsPerMatch: { 21: 1, 22: 2 },
      totalGoals: 3,
      assistsPerMatch: { 13: 1 },
      totalAssists: 1,
      yellowCards: 2,
      redCards: 0
    },
    {
      no: 6,
      name: 'ANGGA YUDISTIRA',
      nickname: 'Angga',
      position: 'FLANK_LEFT',
      goalsPerMatch: { 12: 1, 14: 1, 20: 1 },
      totalGoals: 3,
      assistsPerMatch: { 14: 1 },
      totalAssists: 1,
      yellowCards: 1,
      redCards: 0
    },
    {
      no: 14,
      name: 'HASRIADY',
      nickname: 'Hasri',
      position: 'FLANK_RIGHT',
      goalsPerMatch: { 20: 1, 22: 1 },
      totalGoals: 2,
      assistsPerMatch: { 21: 1, 22: 2 },
      totalAssists: 3,
      yellowCards: 0,
      redCards: 0
    },
    {
      no: 8,
      name: 'AKBAR MARHAN',
      nickname: 'Akbar',
      position: 'ANCHOR',
      goalsPerMatch: { 13: 1 },
      totalGoals: 1,
      assistsPerMatch: { 13: 1 },
      totalAssists: 1,
      yellowCards: 1,
      redCards: 0
    },
    {
      no: 12,
      name: 'SAHIR',
      nickname: 'Sahir',
      position: 'ANCHOR',
      goalsPerMatch: { 17: 1 },
      totalGoals: 1,
      assistsPerMatch: { 17: 1, 18: 1 },
      totalAssists: 2,
      yellowCards: 5,
      redCards: 0
    },
    {
      no: 13,
      name: 'SYAHRIAL TRI',
      nickname: 'Rial',
      position: 'FLANK_RIGHT',
      goalsPerMatch: { 22: 1 },
      totalGoals: 1,
      assistsPerMatch: { 22: 1 },
      totalAssists: 1,
      yellowCards: 3,
      redCards: 0
    },
    {
      no: 18,
      name: 'FUFUNG ANDI',
      nickname: 'Fufung',
      position: 'PLAYER',
      goalsPerMatch: { 21: 1 },
      totalGoals: 1,
      assistsPerMatch: {},
      totalAssists: 0,
      yellowCards: 0,
      redCards: 0
    },
    {
      no: 99,
      name: 'OWN GOAL (LAWAN)',
      nickname: 'OG',
      position: 'PLAYER',
      goalsPerMatch: { 14: 1 },
      totalGoals: 1,
      assistsPerMatch: {},
      totalAssists: 0,
      yellowCards: 0,
      redCards: 0
    },
    {
      no: 5,
      name: 'FREDIK DALE',
      nickname: 'Fredik',
      position: 'ANCHOR',
      goalsPerMatch: {},
      totalGoals: 0,
      assistsPerMatch: { 12: 1 },
      totalAssists: 1,
      yellowCards: 2,
      redCards: 0
    },
    {
      no: 15,
      name: 'HAMDANI',
      nickname: 'Hamdan',
      position: 'GK',
      goalsPerMatch: {},
      totalGoals: 0,
      assistsPerMatch: { 15: 1 },
      totalAssists: 1,
      yellowCards: 1,
      redCards: 0
    },
    {
      no: 16,
      name: 'FARHAN AL MUTAZZAR',
      nickname: 'Uta',
      position: 'PLAYER',
      goalsPerMatch: {},
      totalGoals: 0,
      assistsPerMatch: {},
      totalAssists: 0,
      yellowCards: 1,
      redCards: 0
    },
    {
      no: 17,
      name: 'ILHAM RAMADHYAN',
      nickname: 'Ilham',
      position: 'PLAYER',
      goalsPerMatch: {},
      totalGoals: 0,
      assistsPerMatch: { 21: 1 },
      totalAssists: 1,
      yellowCards: 2,
      redCards: 0
    }
  ],
  tacticalMatches: [
    {
      matchNo: 12,
      opponent: 'Unggul FC',
      scoreHome: 2,
      scoreAway: 4,
      result: 'L',
      goals: [
        { half: 1, scorer: 'Nandi', assist: 'Fredik', process: 'Free Kick Set-Piece', paketPlayers: ['Fredik', 'Nandi', 'Fandi', 'Reza'] },
        { half: 2, scorer: 'Angga', assist: 'Fandi', process: 'Anti Pressing', paketPlayers: ['Fandi', 'Nandi', 'Angga', 'Reza'] }
      ],
      conceded: [
        { half: 1, process: 'Kick In Dekat', paketPlayers: ['Rial', 'Reza', 'Uta', 'Hamdan'] },
        { half: 1, process: 'At Positional', paketPlayers: ['Reza', 'Fredik', 'Fandi', 'Hamdan'] },
        { half: 2, process: 'At Positional', paketPlayers: ['Rial', 'Fredik', 'Sahir', 'Reza'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Fandi', 'Nandi', 'Uta', 'Hamdan'] }
      ]
    },
    {
      matchNo: 13,
      opponent: 'Giga FC',
      scoreHome: 7,
      scoreAway: 0,
      result: 'W',
      goals: [
        { half: 1, scorer: 'Fandi', assist: 'Akbar', process: 'Counter Attack', paketPlayers: ['Fandi', 'Akbar', 'Zehdi', 'Fredik'] },
        { half: 1, scorer: 'Akbar', assist: 'Reza', process: 'Corner Kick', paketPlayers: ['Akbar', 'Nandi', 'Reza', 'Fredik'] },
        { half: 1, scorer: 'Ramdan', assist: 'Rial', process: 'At Positional', paketPlayers: ['Reza', 'Ramdan', 'Nandi', 'Rial'] },
        { half: 2, scorer: 'Zehdi', assist: 'Uta', process: 'At Positional', paketPlayers: ['Fandi', 'Zehdi', 'Fredik', 'Uta'] },
        { half: 2, scorer: 'Zehdi', assist: 'Nandi', process: 'Def Power Play', paketPlayers: ['Reza', 'Ramdan', 'Rial', 'Nandi'] },
        { half: 2, scorer: 'Nandi', assist: 'Fandi', process: 'Counter Attack', paketPlayers: ['Fandi', 'Nandi', 'Angga', 'Reza'] },
        { half: 2, scorer: 'Fandi', assist: 'Ramdan', process: 'Counter Attack', paketPlayers: ['Reza', 'Ramdan', 'Nandi', 'Fandi'] }
      ],
      conceded: []
    },
    {
      matchNo: 14,
      opponent: 'Cosmo JNE',
      scoreHome: 3,
      scoreAway: 3,
      result: 'D',
      goals: [
        { half: 1, scorer: 'Fandi', assist: 'Angga', process: 'Free Kick', paketPlayers: ['Uta', 'Fandi', 'Angga', 'Nandi'] },
        { half: 2, scorer: 'Angga', assist: 'Reza', process: 'Fast Attack', paketPlayers: ['Angga', 'Reza', 'Nandi', 'Fandi'] },
        { half: 2, scorer: 'Own Goal', assist: 'Ramdan', process: 'Power Play', paketPlayers: ['Uta', 'Sahir', 'Fredik', 'Ramdan'] }
      ],
      conceded: [
        { half: 1, process: 'At Positional', paketPlayers: ['Uta', 'Angga', 'Fandi', 'Nandi'] },
        { half: 2, process: 'Power Play', paketPlayers: ['Reza', 'Rial', 'Ramdan', 'Nandi'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Uta', 'Sahir', 'Fredik', 'Ramdan'] }
      ]
    },
    {
      matchNo: 15,
      opponent: 'Kinantan FC',
      scoreHome: 5,
      scoreAway: 3,
      result: 'W',
      goals: [
        { half: 1, scorer: 'Ramdan', assist: 'Uta', process: 'At Positional', paketPlayers: ['Uta', 'Nandi', 'Ramdan', 'Zehdi'] },
        { half: 1, scorer: 'Nandi', assist: 'Zehdi', process: 'Counter Attack', paketPlayers: ['Zehdi', 'Ramdan', 'Nandi', 'Uta'] },
        { half: 2, scorer: 'Zehdi', assist: 'Sahir', process: 'Corner Kick', paketPlayers: ['Fredik', 'Hamdan', 'Reza', 'Sahir'] },
        { half: 2, scorer: 'Zehdi', assist: 'Hamdan', process: 'Counter Attack', paketPlayers: ['Ramdan', 'Rial', 'Reza', 'Hamdan'] },
        { half: 2, scorer: 'Nandi', assist: 'Ramdan', process: 'At Positional', paketPlayers: ['Uta', 'Nandi', 'Ramdan', 'Zehdi'] }
      ],
      conceded: [
        { half: 1, process: 'At Positional', paketPlayers: ['Uta', 'Nandi', 'Rial', 'Hamdan'] },
        { half: 2, process: 'At Positional', paketPlayers: ['Fredik', 'Hamdan', 'Reza', 'Sahir'] },
        { half: 2, process: 'Corner Kick', paketPlayers: ['Ramdan', 'Rial', 'Reza', 'Hamdan'] }
      ]
    },
    {
      matchNo: 16,
      opponent: 'Halus FC',
      scoreHome: 0,
      scoreAway: 2,
      result: 'L',
      goals: [],
      conceded: [
        { half: 1, process: 'At Positional', paketPlayers: ['Sahir', 'Ramdan', 'Hasri', 'Reza'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Sahir', 'Ramdan', 'Hasri', 'Reza'] }
      ]
    },
    {
      matchNo: 17,
      opponent: 'BTS (Bintang Timur)',
      scoreHome: 1,
      scoreAway: 3,
      result: 'L',
      goals: [
        { half: 2, scorer: 'Sahir', assist: 'Fredik', process: 'At Positional', paketPlayers: ['Reza', 'Sahir', 'Fredik', 'Hamdan'] }
      ],
      conceded: [
        { half: 1, process: 'At Positional', paketPlayers: ['Reza', 'Sahir', 'Fredik', 'Hamdan'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Fandi', 'Angga', 'Uta', 'Hamdan'] },
        { half: 2, process: 'Gagal Power Play', paketPlayers: ['Reza', 'Angga', 'Nandi', 'Hamdan'] }
      ]
    },
    {
      matchNo: 18,
      opponent: 'Sadakata FC',
      scoreHome: 2,
      scoreAway: 2,
      result: 'D',
      goals: [
        { half: 1, scorer: 'Fandi', assist: 'Sahir', process: 'Kick In Dekat', paketPlayers: ['Reza', 'Sahir', 'Hamdan', 'Fredik'] },
        { half: 2, scorer: 'Nandi', assist: 'Fandi', process: 'Counter Attack', paketPlayers: ['Uta', 'Nandi', 'Sahir', 'Ramdan'] }
      ],
      conceded: [
        { half: 1, process: 'Counter Attack', paketPlayers: ['Uta', 'Nandi', 'Sahir', 'Ramdan'] },
        { half: 2, process: 'Kick In Dekat', paketPlayers: ['Reza', 'Fandi', 'Angga', 'Hamdan'] }
      ]
    },
    {
      matchNo: 19,
      opponent: 'Kancil WHW',
      scoreHome: 3,
      scoreAway: 4,
      result: 'L',
      goals: [
        { half: 1, scorer: 'Fandi', assist: 'Ramdan', process: 'Counter Attack', paketPlayers: ['Angga', 'Enda', 'Fandi', 'Reza'] },
        { half: 2, scorer: 'Ramdan', assist: 'Angga', process: 'At Positional', paketPlayers: ['Reza', 'Angga', 'Nandi', 'Ramdan'] },
        { half: 2, scorer: 'Fandi', assist: 'Reza', process: 'Def Power Play', paketPlayers: ['Uta', 'Fredik', 'Nandi', 'Ramdan'] }
      ],
      conceded: [
        { half: 1, process: 'At Positional', paketPlayers: ['Angga', 'Uta', 'Ramdan', 'Fredik'] },
        { half: 1, process: 'Power Play', paketPlayers: ['Uta', 'Fandi', 'Fredik', 'Ramdan'] },
        { half: 2, process: 'Def Power Play', paketPlayers: ['Reza', 'Angga', 'Nandi', 'Fandi'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Reza', 'Angga', 'Nandi', 'Ramdan'] }
      ]
    },
    {
      matchNo: 20,
      opponent: 'Blacksteel FC',
      scoreHome: 2,
      scoreAway: 10,
      result: 'L',
      goals: [
        { half: 1, scorer: 'Hasriady', assist: 'Nandi', process: 'Kick In Medium', paketPlayers: ['Fandi', 'Angga', 'Nandi', 'Reza'] },
        { half: 2, scorer: 'Angga', assist: 'Reza', process: 'Gagal Power Play Lawan', paketPlayers: ['Akbar', 'Sahir', 'Hamdan', 'Hasri'] }
      ],
      conceded: [
        { half: 1, process: 'Kick In Dekat', paketPlayers: ['Akbar', 'Fandi', 'Nandi', 'Fredik'] },
        { half: 1, process: 'Counter Attack', paketPlayers: ['Akbar', 'Rial', 'Sahir', 'Hamdan'] },
        { half: 1, process: 'At Positional', paketPlayers: ['Uta', 'Rial', 'Fredik', 'Hamdan'] },
        { half: 1, process: 'Counter Attack', paketPlayers: ['Akbar', 'Sahir', 'Hasri', 'Hamdan'] },
        { half: 2, process: 'At Positional', paketPlayers: ['Reza', 'Fandi', 'Nandi', 'Angga'] },
        { half: 2, process: 'Kick In Dekat', paketPlayers: ['Akbar', 'Hamdan', 'Angga', 'Fandi'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Hamdan', 'Angga', 'Reza', 'Sahir'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Rian', 'Fredik', 'Nandi', 'Reza'] },
        { half: 2, process: 'Gagal Power Play', paketPlayers: ['Fandi', 'Akbar', 'Nandi', 'Angga'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Akbar', 'Sahir', 'Hamdan', 'Hasri'] }
      ]
    },
    {
      matchNo: 21,
      opponent: 'Pendekar United',
      scoreHome: 4,
      scoreAway: 2,
      result: 'W',
      goals: [
        { half: 1, scorer: 'Nandi', assist: 'Reza', process: 'Def Power Play', paketPlayers: ['Reza', 'Fandi', 'Nandi', 'Ramdan'] },
        { half: 1, scorer: 'Nandi', assist: 'Hasriady', process: 'Counter Attack', paketPlayers: ['Rial', 'Reza', 'Fandi', 'Sahir'] },
        { half: 2, scorer: 'Fufung', assist: 'Ilham', process: 'Power Play', paketPlayers: ['Reza', 'Rial', 'Ramdan', 'Nandi'] },
        { half: 2, scorer: 'Reza', assist: 'Ramdan', process: 'At Positional', paketPlayers: ['Uta', 'Fredik', 'Nandi', 'Ramdan'] }
      ],
      conceded: [
        { half: 1, process: 'At Positional', paketPlayers: ['Uta', 'Sahir', 'Nandi', 'Ramdan'] },
        { half: 2, process: 'Power Play', paketPlayers: ['Ramdan', 'Rial', 'Zehdi', 'Reza'] }
      ]
    },
    {
      matchNo: 22,
      opponent: 'Fafage Banua',
      scoreHome: 4,
      scoreAway: 10,
      result: 'L',
      goals: [
        { half: 1, scorer: 'Hasriady', assist: 'Rial', process: 'At Positional', paketPlayers: ['Reza', 'Fandi', 'Enda', 'Hasri'] },
        { half: 1, scorer: 'Rial', assist: 'Hasriady', process: 'Corner Kick', paketPlayers: ['Reza', 'Hasri', 'Zehdi', 'Hamdan'] },
        { half: 2, scorer: 'Reza', assist: 'Hasriady', process: 'Kick In Dekat', paketPlayers: ['Zehdi', 'Fandi', 'Reza', 'Rial'] },
        { half: 2, scorer: 'Reza', assist: 'Zehdi', process: 'Gagal Power Play Lawan', paketPlayers: ['Akbar', 'Sahir', 'Hamdan', 'Ramdan'] }
      ],
      conceded: [
        { half: 1, process: 'Counter Attack', paketPlayers: ['Aan', 'Alif', 'Fandi', 'Enda'] },
        { half: 1, process: 'At Positional', paketPlayers: ['Rial', 'Zehdi', 'Hasri', 'Akbar'] },
        { half: 1, process: 'Corner Kick', paketPlayers: ['Fandi', 'Sahir', 'Reza', 'Zehdi'] },
        { half: 1, process: 'Kick In Dekat', paketPlayers: ['Enda', 'Alif', 'Reza', 'Fandi'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Ramdan', 'Hamdan', 'Sahir', 'Aan'] },
        { half: 2, process: 'Kick In Dekat', paketPlayers: ['Rial', 'Zehdi', 'Hasri', 'Akbar'] },
        { half: 2, process: 'At Positional', paketPlayers: ['Ramdan', 'Reza', 'Sahir', 'Hasri'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Akbar', 'Sahir', 'Hamdan', 'Ramdan'] },
        { half: 2, process: 'Gagal Power Play', paketPlayers: ['Zehdi', 'Fandi', 'Reza', 'Rial'] },
        { half: 2, process: 'Counter Attack', paketPlayers: ['Aan', 'Alif', 'Fandi', 'Enda'] }
      ]
    }
  ],
  summary: {
    totalMatches: 11,
    wins: 3,
    draws: 2,
    losses: 6,
    points: 11,
    totalGF: 33,
    totalGA: 43,
    goalDiff: -10,
    topScorer: 'Nandi Sukma (7 Gol)',
    topAssist: 'Fandi Permana & Ramdhan & Hasriady (3 Assist)'
  }
};

/**
 * Smart Player Callname / Nickname Helper
 * Uses dedicated nickname if available, or strips generic Indonesian name prefixes (Muhammad, Moch, etc.)
 */
export function getSmartPlayerCallname(fullName: string, nickname?: string): string {
  if (nickname && nickname.trim()) {
    return nickname.trim();
  }
  const cleanName = (fullName || '').trim();
  if (!cleanName) return '';

  const skipWords = new Set([
    'muhammad', 'mochammad', 'moch', 'muh', 'mohammad', 'm.', 'm', 'md', 
    'ahmad', 'achmad', 'nur', 'ali'
  ]);

  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0];

  for (let i = 0; i < words.length; i++) {
    const cleanWord = words[i].replace(/[^a-zA-Z0-9]/g, '');
    if (cleanWord.length > 1 && !skipWords.has(cleanWord.toLowerCase())) {
      return cleanWord;
    }
  }

  return words[1] || words[0];
}

/**
 * Extracts 4-5 outfield player nicknames from pakets or players on the pitch
 */
function getOutfieldPaketNames(d: MatchData, masterPlayers: any[] = []): string[] {
  // Check if there are defined pakets
  if (d.pakets && d.pakets.length > 0) {
    try {
      const p1 = d.pakets[0];
      const numbers: number[] = JSON.parse(p1.playerNumbers || '[]');
      if (numbers.length > 0) {
        return numbers.map(num => {
          const pl = d.players.find(x => x.no === num);
          const mp = masterPlayers.find(x => x.noPunggung === num);
          const nick = mp?.nickname || '';
          const name = pl?.name || mp?.name || '';
          const smart = getSmartPlayerCallname(name, nick);
          return smart || `#${num}`;
        });
      }
    } catch {}
  }

  // Fallback: pick top 4 outfield players from team sheet
  const outfield = (d.players || []).filter(p => !p.isGk && (p.name || p.no)).slice(0, 4);
  if (outfield.length > 0) {
    return outfield.map(p => {
      const mp = masterPlayers.find(x => x.noPunggung === p.no);
      const nick = mp?.nickname || '';
      const smart = getSmartPlayerCallname(p.name, nick);
      return smart || `P#${p.no}`;
    });
  }
  return ['Anchor', 'Flank Ki', 'Flank Ka', 'Pivot'];
}

/**
 * Builds live series data dynamically from all workspace matches
 */
export async function buildSeriesDataFromWorkspaceAsync(
  matchesList: any[],
  currentMatchData?: MatchData | null,
  masterPlayersInput?: any[]
): Promise<SeriesPresentationData> {
  let masterPlayers: any[] = masterPlayersInput || [];
  if (!masterPlayers || masterPlayers.length === 0) {
    try {
      masterPlayers = await api.getMasterPlayers();
    } catch {
      masterPlayers = [];
    }
  }

  // If no matches list or only current match
  const matchesToProcess = (matchesList && matchesList.length > 0) 
    ? matchesList 
    : (currentMatchData ? [currentMatchData.match] : []);

  if (matchesToProcess.length === 0) {
    return MONCONGBULO_SERI_2_DATA;
  }

  const fullMatchesData: MatchData[] = [];
  for (const m of matchesToProcess) {
    try {
      if (currentMatchData && currentMatchData.match.id === m.id) {
        fullMatchesData.push(currentMatchData);
      } else {
        const d = await api.getMatch(m.id);
        if (d && d.match) {
          fullMatchesData.push(d);
        } else {
          fullMatchesData.push({ match: m, players: [], events: [], pakets: [] });
        }
      }
    } catch {
      fullMatchesData.push({
        match: m,
        players: [],
        events: [],
        pakets: []
      });
    }
  }

  const teamName = fullMatchesData[0]?.match.homeTeam || currentMatchData?.match.homeTeam || 'Tim Home';
  const competition = fullMatchesData[0]?.match.competition || currentMatchData?.match.competition || 'PASER FUTSAL CUP';

  let totalWins = 0;
  let totalDraws = 0;
  let totalLosses = 0;
  let totalGF = 0;
  let totalGA = 0;

  const matches = fullMatchesData.map((d, idx) => {
    const m = d.match;
    // Calculate total GF from players table or scoreboard
    const playerGF = (d.players || []).reduce((s, p) => s + (p.gl1 || 0) + (p.gl2 || 0), 0);
    const scoreGF = (m.homeScore1st || 0) + (m.homeScore2nd || 0);
    const gf = Math.max(playerGF, scoreGF);

    const ga = (m.awayScore1st || 0) + (m.awayScore2nd || 0);
    totalGF += gf;
    totalGA += ga;

    let result: 'W' | 'D' | 'L' = 'D';
    if (gf > ga) {
      result = 'W';
      totalWins++;
    } else if (gf < ga) {
      result = 'L';
      totalLosses++;
    } else {
      result = 'D';
      totalDraws++;
    }

    return {
      matchNo: idx + 1,
      opponent: m.awayTeam || `Lawan ${idx + 1}`,
      scoreHome: gf,
      scoreAway: ga,
      result,
      dateVenue: m.date ? `${m.date} • ${m.venue || ''}` : `Matchday ${idx + 1}`
    };
  });

  const points = totalWins * 3 + totalDraws * 1;

  // Aggregate players across all matches
  const playerMap: Record<number, PlayerStatRow> = {};

  fullMatchesData.forEach((d, matchIdx) => {
    const matchNo = matchIdx + 1;
    (d.players || []).forEach(p => {
      if (!p.no && !p.name) return;
      const keyNo = p.no || (matchIdx * 100 + 1);

      if (!playerMap[keyNo]) {
        playerMap[keyNo] = {
          no: p.no || 0,
          name: p.name || `Pemain #${p.no}`,
          goalsPerMatch: {},
          totalGoals: 0,
          assistsPerMatch: {},
          totalAssists: 0,
          yellowCards: 0,
          redCards: 0
        };
      }

      const g = (p.gl1 || 0) + (p.gl2 || 0);
      if (g > 0) {
        playerMap[keyNo].goalsPerMatch[matchNo] = (playerMap[keyNo].goalsPerMatch[matchNo] || 0) + g;
        playerMap[keyNo].totalGoals += g;
      }

      playerMap[keyNo].yellowCards += p.yellowCards || 0;
      playerMap[keyNo].redCards += p.redCards || 0;
    });

    // Extract assists from events
    (d.events || []).forEach(e => {
      if (e.type === 'shot' && e.outcome === 'goal' && e.team === 'home') {
        const note = e.note || '';
        if (note.toLowerCase().includes('assist:')) {
          const matchAssist = note.match(/assist:\s*([^,|]+)/i);
          if (matchAssist && matchAssist[1]) {
            const rawAssist = matchAssist[1].trim();
            const numMatch = rawAssist.match(/#?(\d+)/);
            let foundP: PlayerStatRow | undefined;
            if (numMatch) {
              const num = parseInt(numMatch[1]);
              foundP = playerMap[num] || Object.values(playerMap).find(pl => pl.no === num);
            }
            if (!foundP) {
              foundP = Object.values(playerMap).find(pl => {
                const plName = pl.name.toLowerCase();
                const raw = rawAssist.toLowerCase();
                return plName.includes(raw) || 
                       raw.includes(plName) ||
                       getSmartPlayerCallname(pl.name).toLowerCase() === raw;
              });
            }
            if (foundP) {
              foundP.assistsPerMatch[matchNo] = (foundP.assistsPerMatch[matchNo] || 0) + 1;
              foundP.totalAssists += 1;
            }
          }
        }
      }
    });
  });

  const playersList = Object.values(playerMap);

  // Extract tactical breakdown per match
  const tacticalMatches: MatchTacticalDetail[] = fullMatchesData.map((d, idx) => {
    const m = d.match;
    const defaultPaket = getOutfieldPaketNames(d, masterPlayers);
    
    // 1. Build Goals List (synthesize from players & events)
    const goalsList: MatchTacticalDetail['goals'] = [];
    const recordedGoalEvents = (d.events || []).filter(e => e.type === 'shot' && e.outcome === 'goal' && e.team === 'home');

    // Add recorded events first
    recordedGoalEvents.forEach(e => {
      const scorerPlayer = d.players?.find(p => p.no === e.playerNo);
      const mpScorer = masterPlayers.find(mp => mp.noPunggung === e.playerNo);
      let assistName = '';
      if (e.note && e.note.toLowerCase().includes('assist:')) {
        const ma = e.note.match(/assist:\s*([^,|]+)/i);
        if (ma) assistName = ma[1].trim();
      }

      let paketPlayers = defaultPaket;
      if (e.note && e.note.toLowerCase().includes('paket:')) {
        const mp = e.note.match(/paket:\s*\[?([^\]]+)\]?/i);
        if (mp) {
          const raw = mp[1].split(',').map(s => s.trim());
          paketPlayers = raw.map(token => {
            const numMatch = token.match(/#?(\d+)/);
            if (numMatch) {
              const num = parseInt(numMatch[1]);
              const pl = d.players.find(x => x.no === num);
              const mpP = masterPlayers.find(x => x.noPunggung === num);
              return getSmartPlayerCallname(pl?.name || mpP?.name || '', mpP?.nickname) || token;
            }
            const pl = d.players.find(x => x.name.toLowerCase() === token.toLowerCase());
            const mpP = pl ? masterPlayers.find(x => x.noPunggung === pl.no) : masterPlayers.find(x => x.name.toLowerCase().includes(token.toLowerCase()));
            return getSmartPlayerCallname(pl?.name || token, mpP?.nickname);
          });
        }
      }

      goalsList.push({
        id: e.id,
        half: e.half || 1,
        minute: e.timeStr || '-',
        scorer: scorerPlayer?.name || mpScorer?.name || (e.playerNo ? `No #${e.playerNo}` : 'Pencetak Gol'),
        assist: assistName,
        process: e.note?.split('|')[0]?.trim() || 'Open Play Attack',
        paketPlayers
      });
    });

    // Synthesize goals from player table if not yet tagged as pitch events
    (d.players || []).forEach(p => {
      const gl1 = p.gl1 || 0;
      const gl2 = p.gl2 || 0;
      const taggedH1 = recordedGoalEvents.filter(e => e.playerNo === p.no && e.half === 1).length;
      const taggedH2 = recordedGoalEvents.filter(e => e.playerNo === p.no && e.half === 2).length;

      for (let i = 0; i < gl1 - taggedH1; i++) {
        goalsList.push({
          half: 1,
          minute: '-',
          scorer: p.name,
          assist: '',
          process: 'Open Play Goal',
          paketPlayers: defaultPaket
        });
      }
      for (let i = 0; i < gl2 - taggedH2; i++) {
        goalsList.push({
          half: 2,
          minute: '-',
          scorer: p.name,
          assist: '',
          process: 'Open Play Goal',
          paketPlayers: defaultPaket
        });
      }
    });

    // 2. Build Conceded List
    const concededList: MatchTacticalDetail['conceded'] = [];
    const recordedConcedeEvents = (d.events || []).filter(e => e.type === 'shot' && e.outcome === 'goal' && e.team === 'away');

    recordedConcedeEvents.forEach(e => {
      let paketPlayers = defaultPaket;
      if (e.note && e.note.toLowerCase().includes('paket:')) {
        const mp = e.note.match(/paket:\s*\[?([^\]]+)\]?/i);
        if (mp) {
          const raw = mp[1].split(',').map(s => s.trim());
          paketPlayers = raw.map(token => {
            const numMatch = token.match(/#?(\d+)/);
            if (numMatch) {
              const num = parseInt(numMatch[1]);
              const pl = d.players.find(x => x.no === num);
              const mpP = masterPlayers.find(x => x.noPunggung === num);
              return getSmartPlayerCallname(pl?.name || mpP?.name || '', mpP?.nickname) || token;
            }
            const pl = d.players.find(x => x.name.toLowerCase() === token.toLowerCase());
            const mpP = pl ? masterPlayers.find(x => x.noPunggung === pl.no) : masterPlayers.find(x => x.name.toLowerCase().includes(token.toLowerCase()));
            return getSmartPlayerCallname(pl?.name || token, mpP?.nickname);
          });
        }
      }
      concededList.push({
        id: e.id,
        half: e.half || 1,
        minute: e.timeStr || '-',
        process: e.note?.split('|')[0]?.trim() || 'Serangan Lawan',
        paketPlayers
      });
    });

    // Synthesize conceded from away score if not tagged
    const awayH1 = m.awayScore1st || 0;
    const awayH2 = m.awayScore2nd || 0;
    const taggedAwayH1 = recordedConcedeEvents.filter(e => e.half === 1).length;
    const taggedAwayH2 = recordedConcedeEvents.filter(e => e.half === 2).length;

    for (let i = 0; i < awayH1 - taggedAwayH1; i++) {
      concededList.push({
        half: 1,
        minute: '-',
        process: 'Kebobolan Babak 1',
        paketPlayers: defaultPaket
      });
    }
    for (let i = 0; i < awayH2 - taggedAwayH2; i++) {
      concededList.push({
        half: 2,
        minute: '-',
        process: 'Kebobolan Babak 2',
        paketPlayers: defaultPaket
      });
    }

    const totalHomeGf = Math.max(goalsList.length, (m.homeScore1st || 0) + (m.homeScore2nd || 0));
    const totalAwayGa = Math.max(concededList.length, (m.awayScore1st || 0) + (m.awayScore2nd || 0));

    return {
      matchNo: idx + 1,
      opponent: m.awayTeam || `Lawan ${idx + 1}`,
      scoreHome: totalHomeGf,
      scoreAway: totalAwayGa,
      result: totalHomeGf > totalAwayGa ? 'W' : totalHomeGf < totalAwayGa ? 'L' : 'D',
      dateVenue: m.date,
      goals: goalsList,
      conceded: concededList
    };
  });

  const sortedTop = [...playersList].sort((a, b) => b.totalGoals - a.totalGoals);
  const topScorer = sortedTop[0] && sortedTop[0].totalGoals > 0 
    ? `${sortedTop[0].name} (${sortedTop[0].totalGoals} Gol)` 
    : '-';
    
  const sortedTopAssist = [...playersList].sort((a, b) => b.totalAssists - a.totalAssists);
  const topAssist = sortedTopAssist[0] && sortedTopAssist[0].totalAssists > 0 
    ? `${sortedTopAssist[0].name} (${sortedTopAssist[0].totalAssists} Assist)` 
    : '-';

  return {
    teamName,
    competitionTitle: competition,
    seriesTitle: `Laporan Evaluasi & Rekapitulasi ${competition}`,
    season: fullMatchesData[0]?.match.date ? `Musim ${fullMatchesData[0].match.date.split('/')[2] || fullMatchesData[0].match.date.split('-')[0] || '2024'}` : 'Musim Berjalan',
    matches,
    players: playersList,
    tacticalMatches,
    summary: {
      totalMatches: matches.length,
      wins: totalWins,
      draws: totalDraws,
      losses: totalLosses,
      points,
      totalGF,
      totalGA,
      goalDiff: totalGF - totalGA,
      topScorer,
      topAssist
    }
  };
}

/**
 * Seeds all 11 matches from Moncongbulo FC Seri 2 into user's database
 */
export async function importMoncongbuloMatchesIntoApp(): Promise<void> {
  for (const tm of MONCONGBULO_SERI_2_DATA.tacticalMatches) {
    const mMeta = MONCONGBULO_SERI_2_DATA.matches.find(x => x.matchNo === tm.matchNo);
    const homeScore = mMeta?.scoreHome || 0;
    const awayScore = mMeta?.scoreAway || 0;

    // Create match
    const newMatch = await api.createMatch({
      name: `M${tm.matchNo}: Moncongbulo vs ${tm.opponent}`,
      competition: 'PFL 2023-2024 Seri 2',
      homeTeam: 'Moncongbulo FC',
      awayTeam: tm.opponent,
      venue: 'GOR Futsal Seri 2',
      date: '2024-02-15',
      time: '14:00',
      homeScore1st: Math.ceil(homeScore / 2),
      homeScore2nd: Math.floor(homeScore / 2),
      awayScore1st: Math.ceil(awayScore / 2),
      awayScore2nd: Math.floor(awayScore / 2),
      populateFromMaster: false,
      initPakets: true
    });

    if (newMatch && newMatch.id) {
      // Create players in this match
      for (const p of MONCONGBULO_SERI_2_DATA.players) {
        const goalsInThisMatch = p.goalsPerMatch[tm.matchNo] || 0;
        await api.updatePlayer(newMatch.id, p.no, {
          name: p.name,
          gl1: Math.ceil(goalsInThisMatch / 2),
          gl2: Math.floor(goalsInThisMatch / 2),
          yellowCards: tm.matchNo === 12 ? p.yellowCards : 0,
          redCards: p.redCards
        });
      }

      // Add Goal Events
      for (const g of tm.goals) {
        const pl = MONCONGBULO_SERI_2_DATA.players.find(x => x.name.toLowerCase().includes(g.scorer.toLowerCase()) || (x.nickname && x.nickname.toLowerCase() === g.scorer.toLowerCase()));
        await api.logPitchEvent(newMatch.id, {
          type: 'shot',
          outcome: 'goal',
          team: 'home',
          half: g.half,
          timeStr: g.minute || '10:00',
          x: 750,
          y: 250,
          playerNo: pl?.no || null,
          note: `${g.process}${g.assist ? ` | Assist: ${g.assist}` : ''}${g.paketPlayers ? ` | Paket: [${g.paketPlayers.join(', ')}]` : ''}`
        });
      }

      // Add Conceded Events
      for (const c of tm.conceded) {
        await api.logPitchEvent(newMatch.id, {
          type: 'shot',
          outcome: 'goal',
          team: 'away',
          half: c.half,
          timeStr: c.minute || '10:00',
          x: 50,
          y: 250,
          playerNo: null,
          note: `${c.process}${c.paketPlayers ? ` | Paket: [${c.paketPlayers.join(', ')}]` : ''}`
        });
      }
    }
  }
}
