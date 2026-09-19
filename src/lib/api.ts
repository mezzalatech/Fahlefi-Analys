import { localDb } from './localDb';
import { isSupabaseConfigured } from './supabase';
import { supabaseApi } from './supabaseApi';

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  city?: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'superadmin' | 'coach' | 'analyst' | 'player' | 'admin';
  avatarUrl?: string;
  teamId?: string;
  teamName?: string;
  teamScope?: 'home' | 'away' | 'all' | string;
}

export interface MasterPlayer {
  id: string;
  teamId?: string;
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
  teamScope?: 'home' | 'away' | 'all' | string;
}

export interface MatchData {
  match: {
    id: number;
    teamId?: string;
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
    teamScope?: 'home' | 'away' | 'all' | string;
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
    teamScope?: 'home' | 'away' | 'all' | string;
  }>;
  pakets: Array<{
    id: number;
    matchId: number;
    paketIndex: number;
    code: string;
    playerNumbers: string;
    teamScope?: 'home' | 'away' | 'all' | string;
  }>;
  substitutions?: SubstitutionLog[];
}

const API_BASE = '/api';

// Check if running on static host (Vercel, Netlify, GitHub Pages, or offline mode)
function isStaticHostOrOffline(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (
    host.includes('vercel.app') || 
    host.includes('pages.dev') || 
    host.includes('netlify.app') || 
    host.includes('github.io') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    return true;
  }
  return false;
}

// Helper to determine if we should fallback to LocalDB
async function tryFetchOrFallback<T>(fetchFn: () => Promise<Response>, fallbackFn: () => Promise<T>): Promise<T> {
  // If hosted on static cloud (Vercel) or offline, immediately use LocalDB (Prevents 405 console logs)
  if (isStaticHostOrOffline()) {
    return await fallbackFn();
  }

  try {
    const res = await fetchFn();
    const contentType = res.headers.get('content-type') || '';

    // If server returned 404/405/502/503 OR returned HTML (SPA rewrite to index.html on Vercel)
    if (
      res.status === 404 || 
      res.status === 405 || 
      res.status === 502 || 
      res.status === 503 ||
      contentType.includes('text/html')
    ) {
      return await fallbackFn();
    }

    const text = await res.text();
    if (!text || text.trim().startsWith('<') || !contentType.includes('application/json')) {
      return await fallbackFn();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return await fallbackFn();
    }

    if (!res.ok) {
      if (parsed && parsed.message && res.status !== 500) {
        throw new Error(parsed.message);
      }
      return await fallbackFn();
    }

    return parsed;
  } catch (error: any) {
    if (
      error.message && 
      !error.message.includes('fetch') && 
      !error.message.includes('NetworkError') && 
      !error.message.includes('Failed to fetch') &&
      !error.message.includes('JSON') &&
      !error.message.includes('Unexpected token')
    ) {
      // Re-throw genuine business validation error
      throw error;
    }
    return await fallbackFn();
  }
}

// Primary Hybrid Executor: Supabase Cloud -> Elysia Backend -> LocalDB
async function executeWithCloudFallback<T>(
  supabaseFn: () => Promise<T>,
  fetchFn: () => Promise<Response>,
  fallbackFn: () => Promise<T>
): Promise<T> {
  if (isSupabaseConfigured()) {
    try {
      return await supabaseFn();
    } catch (err: any) {
      console.warn('Supabase cloud error, falling back:', err.message || err);
    }
  }
  return tryFetchOrFallback(fetchFn, fallbackFn);
}

export const api = {
  // Teams (Multi-Tenant Management)
  async getTeams(): Promise<Team[]> {
    return executeWithCloudFallback(
      () => supabaseApi.getTeams ? supabaseApi.getTeams() : localDb.getTeams(),
      () => fetch(`${API_BASE}/teams`),
      () => localDb.getTeams()
    );
  },

  async createTeam(teamData: Partial<Team>): Promise<Team> {
    return executeWithCloudFallback(
      () => supabaseApi.createTeam ? supabaseApi.createTeam(teamData) : localDb.createTeam(teamData),
      () => fetch(`${API_BASE}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      }),
      () => localDb.createTeam(teamData)
    );
  },

  async updateTeam(id: string, teamData: Partial<Team>): Promise<Team> {
    return executeWithCloudFallback(
      () => supabaseApi.updateTeam ? supabaseApi.updateTeam(id, teamData) : localDb.updateTeam(id, teamData),
      () => fetch(`${API_BASE}/teams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      }),
      () => localDb.updateTeam(id, teamData)
    );
  },

  async deleteTeam(id: string): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.deleteTeam ? supabaseApi.deleteTeam(id) : localDb.deleteTeam(id),
      () => fetch(`${API_BASE}/teams/${id}`, { method: 'DELETE' }),
      () => localDb.deleteTeam(id)
    );
  },

  // Auth
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    return executeWithCloudFallback(
      () => supabaseApi.login(username, password),
      () => fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      }),
      () => localDb.login(username, password)
    );
  },

  async getUsers(teamId?: string): Promise<User[]> {
    return executeWithCloudFallback(
      () => supabaseApi.getUsers(),
      () => fetch(`${API_BASE}/auth/users${teamId ? `?teamId=${teamId}` : ''}`),
      () => localDb.getUsers(teamId)
    );
  },

  async createUser(userData: { username: string; email?: string; name: string; role: string; password?: string; teamId?: string }): Promise<User> {
    return executeWithCloudFallback(
      () => supabaseApi.createUser(userData),
      () => fetch(`${API_BASE}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      }),
      () => localDb.createUser(userData)
    );
  },

  async updateUser(id: string, userData: { username?: string; email?: string; name?: string; role?: string; password?: string; teamId?: string; avatarUrl?: string }): Promise<User> {
    return executeWithCloudFallback(
      () => supabaseApi.updateUser(id, userData),
      () => fetch(`${API_BASE}/auth/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      }),
      () => localDb.updateUser(id, userData)
    );
  },

  async deleteUser(id: string): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.deleteUser(id),
      () => fetch(`${API_BASE}/auth/users/${id}`, { method: 'DELETE' }),
      () => localDb.deleteUser(id)
    );
  },

  // Master Players
  async getMasterPlayers(teamId?: string): Promise<MasterPlayer[]> {
    return executeWithCloudFallback(
      () => supabaseApi.getMasterPlayers(teamId),
      () => fetch(`${API_BASE}/master-players${teamId ? `?teamId=${teamId}` : ''}`),
      () => localDb.getMasterPlayers(teamId)
    );
  },

  async createMasterPlayer(player: Partial<MasterPlayer>): Promise<MasterPlayer> {
    return executeWithCloudFallback(
      () => supabaseApi.createMasterPlayer(player),
      () => fetch(`${API_BASE}/master-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player)
      }),
      () => localDb.createMasterPlayer(player)
    );
  },

  async updateMasterPlayer(id: string, player: Partial<MasterPlayer>): Promise<MasterPlayer> {
    return executeWithCloudFallback(
      () => supabaseApi.updateMasterPlayer(id, player),
      () => fetch(`${API_BASE}/master-players/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player)
      }),
      () => localDb.updateMasterPlayer(id, player)
    );
  },

  async deleteMasterPlayer(id: string): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.deleteMasterPlayer(id),
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
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const no = Number(row.getCell(1).value);
      const name = String(row.getCell(2).value || '').trim();
      const nickname = String(row.getCell(3).value || '').trim();
      const pos = String(row.getCell(4).value || 'PLAYER').trim();
      const foot = String(row.getCell(5).value || 'KANAN').trim();
      const height = Number(row.getCell(6).value) || 175;
      const weight = Number(row.getCell(7).value) || 68;
      const status = String(row.getCell(8).value || 'ACTIVE').trim();

      if (no && name) {
        await api.createMasterPlayer({
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
    }

    return { success: true, count };
  },

  // Substitutions
  async getSubstitutions(matchId: number): Promise<SubstitutionLog[]> {
    return executeWithCloudFallback(
      () => supabaseApi.getSubstitutions(matchId),
      () => fetch(`${API_BASE}/matches/${matchId}/substitutions`),
      () => localDb.getSubstitutions(matchId)
    );
  },

  async logSubstitution(matchId: number, sub: Partial<SubstitutionLog>): Promise<SubstitutionLog> {
    return executeWithCloudFallback(
      () => supabaseApi.logSubstitution(matchId, sub),
      () => fetch(`${API_BASE}/matches/${matchId}/substitutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      }),
      () => localDb.logSubstitution(matchId, sub)
    );
  },

  async deleteSubstitution(matchId: number, subId: string): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.deleteSubstitution(matchId, subId),
      () => fetch(`${API_BASE}/matches/${matchId}/substitutions/${subId}`, { method: 'DELETE' }),
      () => localDb.deleteSubstitution(matchId, subId)
    );
  },

  // Matches
  async getMatches(teamId?: string): Promise<any[]> {
    return executeWithCloudFallback(
      () => supabaseApi.getMatches(teamId),
      () => fetch(`${API_BASE}/matches${teamId ? `?teamId=${teamId}` : ''}`),
      () => localDb.getMatches(teamId)
    );
  },

  async getMatch(id: number): Promise<MatchData> {
    return executeWithCloudFallback(
      () => supabaseApi.getMatch(id),
      () => fetch(`${API_BASE}/matches/${id}`),
      () => localDb.getMatch(id)
    );
  },

  async createMatch(matchData: any, teamId?: string): Promise<any> {
    const payload = teamId ? { ...matchData, teamId } : matchData;
    return executeWithCloudFallback(
      () => supabaseApi.createMatch(payload),
      () => fetch(`${API_BASE}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
      () => localDb.createMatch(payload, teamId)
    );
  },

  async duplicateMatch(id: number): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.duplicateMatch(id),
      () => fetch(`${API_BASE}/matches/${id}/duplicate`, { method: 'POST' }),
      () => localDb.duplicateMatch(id)
    );
  },

  async deleteMatch(id: number): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.deleteMatch(id),
      () => fetch(`${API_BASE}/matches/${id}`, { method: 'DELETE' }),
      () => localDb.deleteMatch(id)
    );
  },

  async updateMatch(id: number, data: Partial<MatchData['match']>): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.updateMatch(id, data),
      () => fetch(`${API_BASE}/matches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      () => localDb.updateMatch(id, data)
    );
  },

  async updatePlayer(id: number, data: Partial<MatchData['players'][0]>): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.updatePlayer(id, data),
      () => fetch(`${API_BASE}/players/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      () => localDb.updatePlayer(id, data)
    );
  },

  async addPlayer(matchId: number, data: Omit<MatchData['players'][0], 'id' | 'matchId'>): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.addPlayer(matchId, data),
      () => fetch(`${API_BASE}/matches/${matchId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      () => localDb.addPlayer(matchId, data)
    );
  },

  async deletePlayer(id: number): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.deletePlayer(id),
      () => fetch(`${API_BASE}/players/${id}`, { method: 'DELETE' }),
      () => localDb.deletePlayer(id)
    );
  },

  async addEvent(matchId: number, event: Omit<MatchData['events'][0], 'matchId'>): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.addEvent(matchId, event),
      () => fetch(`${API_BASE}/matches/${matchId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }),
      () => localDb.addEvent(matchId, event)
    );
  },

  async updateEvent(id: string, partial: Partial<MatchData['events'][0]>): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.updateEvent(id, partial),
      () => fetch(`${API_BASE}/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial)
      }),
      () => localDb.updateEvent(id, partial)
    );
  },

  async deleteEvent(id: string): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.deleteEvent(id),
      () => fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' }),
      () => localDb.deleteEvent(id)
    );
  },

  async clearEvents(matchId: number): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.clearEvents(matchId),
      () => fetch(`${API_BASE}/matches/${matchId}/events`, { method: 'DELETE' }),
      () => localDb.clearEvents(matchId)
    );
  },

  async savePakets(matchId: number, pakets: Array<{ paketIndex: number; code: string; playerNumbers: string }>): Promise<any> {
    return executeWithCloudFallback(
      () => supabaseApi.savePakets(matchId, pakets),
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
