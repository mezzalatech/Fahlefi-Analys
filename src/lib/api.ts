// Eden Treaty / Fetch API Client

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

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login gagal, periksa username dan password');
    }
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  // Master Players
  async getMasterPlayers(): Promise<MasterPlayer[]> {
    const res = await fetch(`${API_BASE}/master-players`);
    if (!res.ok) throw new Error('Failed to fetch master players');
    return res.json();
  },

  async createMasterPlayer(player: Partial<MasterPlayer>): Promise<MasterPlayer> {
    const res = await fetch(`${API_BASE}/master-players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player)
    });
    if (!res.ok) throw new Error('Failed to create master player');
    return res.json();
  },

  async updateMasterPlayer(id: string, player: Partial<MasterPlayer>): Promise<MasterPlayer> {
    const res = await fetch(`${API_BASE}/master-players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player)
    });
    if (!res.ok) throw new Error('Failed to update master player');
    return res.json();
  },

  async deleteMasterPlayer(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/master-players/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  getPlayerImportTemplateUrl(): string {
    return `${API_BASE}/master-players/template`;
  },

  async importMasterPlayersFromExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/master-players/import-excel`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal mengimpor data pemain dari Excel');
    }
    return res.json();
  },

  // Substitutions
  async getSubstitutions(matchId: number): Promise<SubstitutionLog[]> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/substitutions`);
    if (!res.ok) throw new Error('Failed to fetch substitutions');
    return res.json();
  },

  async logSubstitution(matchId: number, sub: Partial<SubstitutionLog>): Promise<SubstitutionLog> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/substitutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub)
    });
    if (!res.ok) throw new Error('Failed to log substitution');
    return res.json();
  },

  async deleteSubstitution(matchId: number, subId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/substitutions/${subId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Matches
  async getMatches(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/matches`);
    if (!res.ok) throw new Error('Failed to fetch matches list');
    return res.json();
  },

  async getMatch(id: number): Promise<MatchData> {
    const res = await fetch(`${API_BASE}/matches/${id}`);
    if (!res.ok) throw new Error('Failed to fetch match');
    return res.json();
  },

  async createMatch(matchData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchData)
    });
    if (!res.ok) throw new Error('Failed to create match');
    return res.json();
  },

  async duplicateMatch(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/matches/${id}/duplicate`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to duplicate match');
    return res.json();
  },

  async deleteMatch(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/matches/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete match');
    return res.json();
  },

  async updateMatch(id: number, data: Partial<MatchData['match']>): Promise<any> {
    const res = await fetch(`${API_BASE}/matches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updatePlayer(id: number, data: Partial<MatchData['players'][0]>): Promise<any> {
    const res = await fetch(`${API_BASE}/players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async addPlayer(matchId: number, data: Omit<MatchData['players'][0], 'id' | 'matchId'>): Promise<any> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deletePlayer(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/players/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async addEvent(matchId: number, event: Omit<MatchData['events'][0], 'matchId'>): Promise<any> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    return res.json();
  },

  async updateEvent(id: string, partial: Partial<MatchData['events'][0]>): Promise<any> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial)
    });
    return res.json();
  },

  async deleteEvent(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async savePakets(matchId: number, pakets: Array<{ paketIndex: number; code: string; playerNumbers: string }>): Promise<any> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/pakets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pakets)
    });
    return res.json();
  },

  getPaketTemplateUrl(): string {
    return `${API_BASE}/pakets/template`;
  },

  getMatchPaketsExportUrl(matchId: number): string {
    return `${API_BASE}/matches/${matchId}/pakets/export`;
  },

  async importPaketsFromExcel(matchId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/matches/${matchId}/pakets/import-excel`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal mengimpor paket rotasi dari Excel');
    }
    return res.json();
  },

  getExportUrl(matchId: number): string {
    return `${API_BASE}/matches/${matchId}/export`;
  }
};

