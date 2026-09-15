// Hybrid API Client with Transparent Local Database Fallback (Offline-First for GOR & Vercel)
import { localDb } from './localDb';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'coach' | 'analyst' | 'player' | 'admin';
  avatarUrl?: string;
}

export interface MasterPlayer {
  id: string;
  noPunggung: number;
  name: string;
  nickname: string;
  position: 'GK' | 'ANCHOR' | 'FLANK_LEFT' | 'FLANK_RIGHT' | 'PIVOT' | 'PLAYER';
  dominantFoot: 'KANAN' | 'KIRI' | 'KEDUA';
  height: number;
  weight: number;
  photoUrl?: string;
  status: 'ACTIVE' | 'INJURED' | 'SUSPENDED';
  stats?: {
    totalMatches: number;
    totalGoals: number;
    totalShots: number;
    shotAccuracy: number;
    totalRec: number;
    totalLoss: number;
    totalFouls: number;
    yellowCards: number;
    redCards: number;
    subAppearances: number;
  };
}

export interface SubstitutionLog {
  id: string;
  matchId: number;
  half: number;
  timeStr: string;
  timerRemaining: number;
  paketIndex?: number | null;
  playerNumbers: string;
  type: string;
  note?: string;
  createdAt?: string;
}

export interface MatchData {
  match: {
    id: number;
    name: string;
    competition: string;
    date: string;
    time: string;
    venue: string;
    homeTeam: string;
    awayTeam: string;
    homeScore1st: number;
    homeScore2nd: number;
    awayScore1st: number;
    awayScore2nd: number;
    homeFouls1st: number;
    homeFouls2nd: number;
    awayFouls1st: number;
    awayFouls2nd: number;
    period: string;
    timerRemaining: number;
    timeouts: string;
    createdAt?: string;
    updatedAt?: string;
  };
  players: Array<{
    id: number;
    matchId: number;
    no: number;
    name: string;
    isGk: number;
    yellowCards: number;
    redCards: number;
    loss1: number;
    loss2: number;
    rec1: number;
    rec2: number;
    fl1: number;
    fl2: number;
    sh1: number;
    sh2: number;
    gl1: number;
    gl2: number;
  }>;
  events: Array<{
    id: string;
    matchId: number;
    type: string;
    outcome: string;
    team: string;
    half: number;
    timeStr: string;
    x: number;
    y: number;
    playerNo: number | null;
    note: string;
  }>;
  pakets: Array<{
    id: number;
    matchId: number;
    paketIndex: number;
    code: string;
    playerNumbers: string;
  }>;
  substitutions?: SubstitutionLog[];
}

const API_BASE = '/api';

// Helper to determine if we should fallback to LocalDB
async function tryFetchOrFallback<T>(fetchFn: () => Promise<Response>, fallbackFn: () => Promise<T>): Promise<T> {
  try {
    const res = await fetchFn();
    // If running on Vercel static or server returns 404/405/502/503
    if (res.status === 404 || res.status === 405 || res.status === 502 || res.status === 503) {
      return await fallbackFn();
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // If error message is provided by backend, throw it, unless server is unavailable
      if (err.message && res.status !== 500) {
        throw new Error(err.message);
      }
      return await fallbackFn();
    }
    return await res.json();
  } catch (error: any) {
    if (error.message && !error.message.includes('fetch') && !error.message.includes('NetworkError') && !error.message.includes('Failed to fetch')) {
      // Re-throw genuine backend validation error
      throw error;
    }
    return await fallbackFn();
  }
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      }),
      () => localDb.login(username, password)
    );
  },

  async getUsers(): Promise<User[]> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/auth/users`),
      () => localDb.getUsers()
    );
  },

  async createUser(userData: { username: string; email?: string; name: string; role: string; password?: string }): Promise<User> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      }),
      () => localDb.createUser(userData)
    );
  },

  async updateUser(id: string, userData: { username?: string; email?: string; name?: string; role?: string; password?: string }): Promise<User> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/auth/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      }),
      () => localDb.updateUser(id, userData)
    );
  },

  async deleteUser(id: string): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/auth/users/${id}`, { method: 'DELETE' }),
      () => localDb.deleteUser(id)
    );
  },

  // Master Players
  async getMasterPlayers(): Promise<MasterPlayer[]> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/master-players`),
      () => localDb.getMasterPlayers()
    );
  },

  async createMasterPlayer(player: Partial<MasterPlayer>): Promise<MasterPlayer> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/master-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player)
      }),
      () => localDb.createMasterPlayer(player)
    );
  },

  async updateMasterPlayer(id: string, player: Partial<MasterPlayer>): Promise<MasterPlayer> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/master-players/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player)
      }),
      () => localDb.updateMasterPlayer(id, player)
    );
  },

  async deleteMasterPlayer(id: string): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/master-players/${id}`, { method: 'DELETE' }),
      () => localDb.deleteMasterPlayer(id)
    );
  },

  getPlayerImportTemplateUrl(): string {
    return `${API_BASE}/master-players/template`;
  },

  async downloadMasterPlayerTemplate(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/master-players/template`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Template_Master_Pemain_Futsal.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {}
    await localDb.downloadMasterTemplate();
  },

  async importMasterPlayersFromExcel(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/master-players/import-excel`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) return await res.json();
    } catch {}

    // In-browser Excel parsing fallback
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('Lembar Excel kosong.');

    let count = 0;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const no = Number(row.getCell(1).value);
      const name = String(row.getCell(2).value || '').trim();
      const nickname = String(row.getCell(3).value || '').trim();
      const pos = String(row.getCell(4).value || 'PLAYER').trim();
      const foot = String(row.getCell(5).value || 'KANAN').trim();
      const height = Number(row.getCell(6).value) || 175;
      const weight = Number(row.getCell(7).value) || 68;
      const status = String(row.getCell(8).value || 'ACTIVE').trim();

      if (no && name) {
        localDb.createMasterPlayer({
          noPunggung: no,
          name,
          nickname,
          position: pos as any,
          dominantFoot: foot as any,
          height,
          weight,
          status: status as any
        });
        count++;
      }
    });

    return { success: true, count };
  },

  // Substitutions
  async getSubstitutions(matchId: number): Promise<SubstitutionLog[]> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches/${matchId}/substitutions`),
      () => localDb.getSubstitutions(matchId)
    );
  },

  async logSubstitution(matchId: number, sub: Partial<SubstitutionLog>): Promise<SubstitutionLog> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches/${matchId}/substitutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      }),
      () => localDb.logSubstitution(matchId, sub)
    );
  },

  async deleteSubstitution(matchId: number, subId: string): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches/${matchId}/substitutions/${subId}`, { method: 'DELETE' }),
      () => localDb.deleteSubstitution(matchId, subId)
    );
  },

  // Matches
  async getMatches(): Promise<any[]> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches`),
      () => localDb.getMatches()
    );
  },

  async getMatch(id: number): Promise<MatchData> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches/${id}`),
      () => localDb.getMatch(id)
    );
  },

  async createMatch(matchData: any): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
      }),
      () => localDb.createMatch(matchData)
    );
  },

  async duplicateMatch(id: number): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches/${id}/duplicate`, { method: 'POST' }),
      () => localDb.duplicateMatch(id)
    );
  },

  async deleteMatch(id: number): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches/${id}`, { method: 'DELETE' }),
      () => localDb.deleteMatch(id)
    );
  },

  async updateMatch(id: number, data: Partial<MatchData['match']>): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      () => localDb.updateMatch(id, data)
    );
  },

  async updatePlayer(id: number, data: Partial<MatchData['players'][0]>): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/players/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      () => localDb.updatePlayer(id, data)
    );
  },

  async addPlayer(matchId: number, data: Omit<MatchData['players'][0], 'id' | 'matchId'>): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches/${matchId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      () => localDb.addPlayer(matchId, data)
    );
  },

  async deletePlayer(id: number): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/players/${id}`, { method: 'DELETE' }),
      () => localDb.deletePlayer(id)
    );
  },

  async addEvent(matchId: number, event: Omit<MatchData['events'][0], 'matchId'>): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches/${matchId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }),
      () => localDb.addEvent(matchId, event)
    );
  },

  async updateEvent(id: string, partial: Partial<MatchData['events'][0]>): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial)
      }),
      () => localDb.updateEvent(id, partial)
    );
  },

  async deleteEvent(id: string): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' }),
      () => localDb.deleteEvent(id)
    );
  },

  async savePakets(matchId: number, pakets: Array<{ paketIndex: number; code: string; playerNumbers: string }>): Promise<any> {
    return tryFetchOrFallback(
      () => fetch(`${API_BASE}/matches/${matchId}/pakets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pakets)
      }),
      () => localDb.savePakets(matchId, pakets)
    );
  },

  getPaketTemplateUrl(): string {
    return `${API_BASE}/pakets/template`;
  },

  async downloadPaketTemplate(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/pakets/template`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Template_Paket_Rotasi_5Man.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {}
    await localDb.downloadPaketTemplate();
  },

  getMatchPaketsExportUrl(matchId: number): string {
    return `${API_BASE}/matches/${matchId}/pakets/export`;
  },

  async importPaketsFromExcel(matchId: number, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/matches/${matchId}/pakets/import-excel`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) return await res.json();
    } catch {}

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('Lembar Excel kosong.');

    const paketsList: Array<{ paketIndex: number; code: string; playerNumbers: string }> = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const idxVal = Number(row.getCell(1).value);
      const code = String(row.getCell(2).value || '').trim();
      const rawPlayers = String(row.getCell(3).value || '').trim();
      const pNums = rawPlayers.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);

      if (code && pNums.length > 0) {
        const pIdx = (!isNaN(idxVal) && idxVal >= 1) ? idxVal - 1 : paketsList.length;
        paketsList.push({
          paketIndex: pIdx,
          code,
          playerNumbers: JSON.stringify(pNums)
        });
      }
    });

    if (paketsList.length > 0) {
      await localDb.savePakets(matchId, paketsList);
    }
    return { success: true, count: paketsList.length };
  },

  getExportUrl(matchId: number): string {
    return `${API_BASE}/matches/${matchId}/export`;
  }
};
