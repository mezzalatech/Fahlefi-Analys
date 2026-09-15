// Local Database Engine for Offline-First & Vercel Static Deployments
import type { User, MasterPlayer, MatchData, SubstitutionLog } from './api';

const USERS_KEY = 'ffta_offline_users';
const MASTER_PLAYERS_KEY = 'ffta_offline_master_players';
const MATCHES_KEY = 'ffta_offline_matches';
const ACTIVE_MATCH_KEY = 'ffta_active_match_id';

export const INITIAL_USERS: User[] = [
  { id: 'usr_coach', username: 'coach', email: 'coach@fahlefi.com', name: 'Coach Achmad Reza Fahlefi', role: 'coach', avatarUrl: '/icon.png' },
  { id: 'usr_analyst', username: 'analyst', email: 'analyst@fahlefi.com', name: 'Tactical Analyst & Scorer', role: 'analyst', avatarUrl: '' },
  { id: 'usr_player', username: 'player', email: 'player@fahlefi.com', name: 'Squad Player / Viewer', role: 'player', avatarUrl: '' }
];

export const INITIAL_USER_PASSWORDS: Record<string, string> = {
  coach: 'coach123',
  analyst: 'analyst123',
  player: 'player123'
};

const PASSWORDS_KEY = 'ffta_offline_passwords';

export const INITIAL_MASTER_PLAYERS: MasterPlayer[] = [
  { id: 'mp_1', noPunggung: 1, name: 'M. Rizky Pratama', nickname: 'Rizky', position: 'GK', dominantFoot: 'KANAN', height: 182, weight: 74, status: 'ACTIVE' },
  { id: 'mp_2', noPunggung: 2, name: 'Dimas Aldi Setiawan', nickname: 'Dimas', position: 'GK', dominantFoot: 'KANAN', height: 180, weight: 72, status: 'ACTIVE' },
  { id: 'mp_3', noPunggung: 3, name: 'Aldo Bagus Prasetyo', nickname: 'Aldo', position: 'ANCHOR', dominantFoot: 'KANAN', height: 176, weight: 69, status: 'ACTIVE' },
  { id: 'mp_4', noPunggung: 4, name: 'Galang Tri Wicaksono', nickname: 'Galang', position: 'ANCHOR', dominantFoot: 'KIRI', height: 178, weight: 70, status: 'ACTIVE' },
  { id: 'mp_5', noPunggung: 5, name: 'Rian Syahputra', nickname: 'Rian', position: 'ANCHOR', dominantFoot: 'KANAN', height: 175, weight: 68, status: 'ACTIVE' },
  { id: 'mp_6', noPunggung: 6, name: 'Ibnu Hibban', nickname: 'Ibnu', position: 'FLANK_LEFT', dominantFoot: 'KIRI', height: 172, weight: 65, status: 'ACTIVE' },
  { id: 'mp_7', noPunggung: 7, name: 'Ryan Maulana', nickname: 'Ryan', position: 'FLANK_RIGHT', dominantFoot: 'KANAN', height: 174, weight: 66, status: 'ACTIVE' },
  { id: 'mp_8', noPunggung: 8, name: 'M. Zikri Ramadhan', nickname: 'Zikri', position: 'PIVOT', dominantFoot: 'KANAN', height: 179, weight: 75, status: 'ACTIVE' },
  { id: 'mp_9', noPunggung: 9, name: 'Fikri Haikal', nickname: 'Fikri', position: 'PIVOT', dominantFoot: 'KIRI', height: 181, weight: 76, status: 'ACTIVE' },
  { id: 'mp_10', noPunggung: 10, name: 'Reza Fahlefi', nickname: 'Reza', position: 'FLANK_LEFT', dominantFoot: 'KIRI', height: 173, weight: 67, status: 'ACTIVE' },
  { id: 'mp_11', noPunggung: 11, name: 'Bagas Aditya', nickname: 'Bagas', position: 'FLANK_RIGHT', dominantFoot: 'KANAN', height: 170, weight: 64, status: 'ACTIVE' },
  { id: 'mp_12', noPunggung: 12, name: 'Fajar Nugraha', nickname: 'Fajar', position: 'PLAYER', dominantFoot: 'KANAN', height: 175, weight: 68, status: 'ACTIVE' },
  { id: 'mp_13', noPunggung: 13, name: 'Rangga Saputra', nickname: 'Rangga', position: 'PLAYER', dominantFoot: 'KANAN', height: 177, weight: 70, status: 'ACTIVE' },
  { id: 'mp_14', noPunggung: 14, name: 'Dedi Kurniawan', nickname: 'Dedi', position: 'PLAYER', dominantFoot: 'KIRI', height: 174, weight: 68, status: 'ACTIVE' },
  { id: 'mp_15', noPunggung: 15, name: 'Ilham Ramadhan', nickname: 'Ilham', position: 'PLAYER', dominantFoot: 'KANAN', height: 176, weight: 69, status: 'ACTIVE' },
  { id: 'mp_16', noPunggung: 16, name: 'Wahyu Hidayat', nickname: 'Wahyu', position: 'PLAYER', dominantFoot: 'KANAN', height: 173, weight: 66, status: 'ACTIVE' },
  { id: 'mp_17', noPunggung: 17, name: 'Agus Triono', nickname: 'Agus', position: 'PLAYER', dominantFoot: 'KANAN', height: 175, weight: 67, status: 'ACTIVE' },
  { id: 'mp_18', noPunggung: 18, name: 'Hendra Gunawan', nickname: 'Hendra', position: 'PLAYER', dominantFoot: 'KANAN', height: 176, weight: 70, status: 'ACTIVE' },
  { id: 'mp_19', noPunggung: 19, name: 'Bima Satria', nickname: 'Bima', position: 'PLAYER', dominantFoot: 'KIRI', height: 174, weight: 68, status: 'ACTIVE' },
  { id: 'mp_20', noPunggung: 20, name: 'Teguh Prakoso', nickname: 'Teguh', position: 'PLAYER', dominantFoot: 'KANAN', height: 178, weight: 71, status: 'ACTIVE' },
  { id: 'mp_21', noPunggung: 21, name: 'Rizaldi Nur', nickname: 'Rizal', position: 'PLAYER', dominantFoot: 'KANAN', height: 172, weight: 65, status: 'ACTIVE' },
  { id: 'mp_22', noPunggung: 22, name: 'Aris Munandar', nickname: 'Aris', position: 'PLAYER', dominantFoot: 'KANAN', height: 175, weight: 68, status: 'ACTIVE' },
  { id: 'mp_23', noPunggung: 23, name: 'Doni Pratama', nickname: 'Doni', position: 'PLAYER', dominantFoot: 'KIRI', height: 173, weight: 66, status: 'ACTIVE' },
  { id: 'mp_24', noPunggung: 24, name: 'Eko Wahyudi', nickname: 'Eko', position: 'PLAYER', dominantFoot: 'KANAN', height: 177, weight: 70, status: 'ACTIVE' },
  { id: 'mp_25', noPunggung: 25, name: 'Farhan Maulana', nickname: 'Farhan', position: 'PLAYER', dominantFoot: 'KANAN', height: 179, weight: 72, status: 'ACTIVE' }
];

function createDefaultMatch(): MatchData {
  const squadPlayers = INITIAL_MASTER_PLAYERS.map((p, idx) => ({
    id: idx + 1,
    matchId: 1,
    no: p.noPunggung,
    name: p.name,
    isGk: p.position === 'GK' ? 1 : 0,
    yellowCards: 0,
    redCards: 0,
    loss1: 0,
    loss2: 0,
    rec1: 0,
    rec2: 0,
    fl1: 0,
    fl2: 0,
    sh1: 0,
    sh2: 0,
    gl1: 0,
    gl2: 0
  }));

  const initialPakets = [
    { id: 1, matchId: 1, paketIndex: 0, code: 'PAKET 1 (STARTING)', playerNumbers: JSON.stringify([1, 3, 6, 7, 8]) },
    { id: 2, matchId: 1, paketIndex: 1, code: 'PAKET 2 (ROTASI A)', playerNumbers: JSON.stringify([1, 4, 10, 11, 9]) },
    { id: 3, matchId: 1, paketIndex: 2, code: 'PAKET 3 (ROTASI B)', playerNumbers: JSON.stringify([2, 5, 12, 13, 14]) },
    { id: 4, matchId: 1, paketIndex: 3, code: 'PAKET 4 (POWER PLAY)', playerNumbers: JSON.stringify([10, 3, 6, 7, 8]) }
  ];

  return {
    match: {
      id: 1,
      name: 'Match Analysis Porprov Paser',
      competition: 'Porprov Paser',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      venue: 'GOR Sadurengas Paser',
      homeTeam: 'Hewah Paser',
      awayTeam: 'Lawan',
      homeScore1st: 0,
      homeScore2nd: 0,
      awayScore1st: 0,
      awayScore2nd: 0,
      homeFouls1st: 0,
      homeFouls2nd: 0,
      awayFouls1st: 0,
      awayFouls2nd: 0,
      period: '1',
      timerRemaining: 1200,
      timeouts: JSON.stringify({ home1: false, home2: false, away1: false, away2: false })
    },
    players: squadPlayers,
    events: [],
    pakets: initialPakets,
    substitutions: []
  };
}

class LocalDatabase {
  private initStorage() {
    if (typeof localStorage === 'undefined') return;

    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(PASSWORDS_KEY)) {
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(INITIAL_USER_PASSWORDS));
    }
    if (!localStorage.getItem(MASTER_PLAYERS_KEY)) {
      localStorage.setItem(MASTER_PLAYERS_KEY, JSON.stringify(INITIAL_MASTER_PLAYERS));
    }
    if (!localStorage.getItem(MATCHES_KEY)) {
      const defaultMatch = createDefaultMatch();
      localStorage.setItem(MATCHES_KEY, JSON.stringify([defaultMatch]));
    }
  }

  constructor() {
    this.initStorage();
  }

  // Auth
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    this.initStorage();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const passwords: Record<string, string> = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');

    const u = users.find(x => x.username.toLowerCase() === username.trim().toLowerCase());
    if (!u) {
      throw new Error('Username tidak ditemukan.');
    }

    const validPass = passwords[u.username.toLowerCase()] || `${u.username}123`;
    if (password !== validPass) {
      throw new Error('Kata sandi salah.');
    }

    return {
      user: u,
      token: `local_token_${u.id}_${Date.now()}`
    };
  }

  async getUsers(): Promise<User[]> {
    this.initStorage();
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  }

  async createUser(userData: { username: string; email?: string; name: string; role: string; password?: string }): Promise<User> {
    this.initStorage();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const passwords: Record<string, string> = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');

    const un = userData.username.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === un)) {
      throw new Error(`Username @${un} sudah terdaftar.`);
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: un,
      email: userData.email || `${un}@fahlefi.com`,
      name: userData.name.trim(),
      role: userData.role as any,
      avatarUrl: userData.role === 'coach' ? '/icon.png' : ''
    };

    users.push(newUser);
    passwords[un] = userData.password || `${un}123`;

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    return newUser;
  }

  async updateUser(id: string, userData: { username?: string; email?: string; name?: string; role?: string; password?: string }): Promise<User> {
    this.initStorage();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const passwords: Record<string, string> = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');

    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Pengguna tidak ditemukan.');

    const oldUsername = users[idx].username.toLowerCase();
    const newUsername = userData.username ? userData.username.trim().toLowerCase() : oldUsername;

    if (newUsername !== oldUsername && users.some(u => u.id !== id && u.username.toLowerCase() === newUsername)) {
      throw new Error(`Username @${newUsername} sudah digunakan oleh akun lain.`);
    }

    users[idx] = {
      ...users[idx],
      name: userData.name !== undefined ? userData.name.trim() : users[idx].name,
      username: newUsername,
      email: userData.email !== undefined ? userData.email.trim() : users[idx].email,
      role: userData.role !== undefined ? (userData.role as any) : users[idx].role
    };

    if (userData.password) {
      passwords[newUsername] = userData.password;
    } else if (newUsername !== oldUsername && passwords[oldUsername]) {
      passwords[newUsername] = passwords[oldUsername];
      delete passwords[oldUsername];
    }

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    return users[idx];
  }

  async deleteUser(id: string): Promise<any> {
    this.initStorage();
    let users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const passwords: Record<string, string> = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');

    const target = users.find(u => u.id === id);
    if (target) {
      delete passwords[target.username.toLowerCase()];
    }

    users = users.filter(u => u.id !== id);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    return { success: true };
  }

  // Master Players
  async getMasterPlayers(): Promise<MasterPlayer[]> {
    this.initStorage();
    const players: MasterPlayer[] = JSON.parse(localStorage.getItem(MASTER_PLAYERS_KEY) || '[]');
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');

    return players.map(p => {
      let totalMatches = 0;
      let totalGoals = 0;
      let totalShots = 0;
      let totalRec = 0;
      let totalLoss = 0;
      let totalFouls = 0;
      let yellowCards = 0;
      let redCards = 0;
      let subAppearances = 0;

      for (const m of matches) {
        const mp = m.players.find(x => x.no === p.noPunggung);
        if (mp) {
          totalMatches++;
          totalGoals += (mp.gl1 + mp.gl2);
          totalShots += (mp.sh1 + mp.sh2);
          totalRec += (mp.rec1 + mp.rec2);
          totalLoss += (mp.loss1 + mp.loss2);
          totalFouls += (mp.fl1 + mp.fl2);
          yellowCards += mp.yellowCards;
          redCards += mp.redCards;
        }
        if (m.substitutions) {
          const hasSub = m.substitutions.some(s => {
            try {
              const nos = JSON.parse(s.playerNumbers || '[]');
              return Array.isArray(nos) && nos.includes(p.noPunggung);
            } catch { return false; }
          });
          if (hasSub) subAppearances++;
        }
      }

      const shotAccuracy = totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0;

      return {
        ...p,
        stats: {
          totalMatches,
          totalGoals,
          totalShots,
          shotAccuracy,
          totalRec,
          totalLoss,
          totalFouls,
          yellowCards,
          redCards,
          subAppearances
        }
      };
    });
  }

  async createMasterPlayer(player: Partial<MasterPlayer>): Promise<MasterPlayer> {
    this.initStorage();
    const list: MasterPlayer[] = JSON.parse(localStorage.getItem(MASTER_PLAYERS_KEY) || '[]');
    const newPlayer: MasterPlayer = {
      id: `mp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      noPunggung: Number(player.noPunggung) || 1,
      name: player.name || 'Pemain Baru',
      nickname: player.nickname || '',
      position: player.position || 'PLAYER',
      dominantFoot: player.dominantFoot || 'KANAN',
      height: Number(player.height) || 175,
      weight: Number(player.weight) || 68,
      photoUrl: player.photoUrl || '',
      status: player.status || 'ACTIVE'
    };
    list.push(newPlayer);
    list.sort((a, b) => a.noPunggung - b.noPunggung);
    localStorage.setItem(MASTER_PLAYERS_KEY, JSON.stringify(list));
    return newPlayer;
  }

  async updateMasterPlayer(id: string, partial: Partial<MasterPlayer>): Promise<MasterPlayer> {
    this.initStorage();
    const list: MasterPlayer[] = JSON.parse(localStorage.getItem(MASTER_PLAYERS_KEY) || '[]');
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Pemain master tidak ditemukan.');

    list[idx] = { ...list[idx], ...partial };
    list.sort((a, b) => a.noPunggung - b.noPunggung);
    localStorage.setItem(MASTER_PLAYERS_KEY, JSON.stringify(list));
    return list[idx];
  }

  async deleteMasterPlayer(id: string): Promise<any> {
    this.initStorage();
    let list: MasterPlayer[] = JSON.parse(localStorage.getItem(MASTER_PLAYERS_KEY) || '[]');
    list = list.filter(p => p.id !== id);
    localStorage.setItem(MASTER_PLAYERS_KEY, JSON.stringify(list));
    return { success: true };
  }

  // Matches
  async getMatches(): Promise<any[]> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    return matches.map(m => m.match);
  }

  async getMatch(id: number): Promise<MatchData> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    let match = matches.find(m => m.match.id === id);
    if (!match) {
      if (matches.length > 0) return matches[0];
      const defaultMatch = createDefaultMatch();
      matches.push(defaultMatch);
      localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
      return defaultMatch;
    }
    return match;
  }

  async createMatch(data: any): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const newId = matches.length > 0 ? Math.max(...matches.map(m => m.match.id)) + 1 : 1;
    const master: MasterPlayer[] = JSON.parse(localStorage.getItem(MASTER_PLAYERS_KEY) || '[]');

    const squad = master.map((p, idx) => ({
      id: idx + 1,
      matchId: newId,
      no: p.noPunggung,
      name: p.name,
      isGk: p.position === 'GK' ? 1 : 0,
      yellowCards: 0,
      redCards: 0,
      loss1: 0,
      loss2: 0,
      rec1: 0,
      rec2: 0,
      fl1: 0,
      fl2: 0,
      sh1: 0,
      sh2: 0,
      gl1: 0,
      gl2: 0
    }));

    const newMatchData: MatchData = {
      match: {
        id: newId,
        name: data.name || `Match #${newId}`,
        competition: data.competition || 'Porprov Paser',
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || '19:00',
        venue: data.venue || 'GOR Sadurengas Paser',
        homeTeam: data.homeTeam || 'Hewah Paser',
        awayTeam: data.awayTeam || 'Lawan',
        homeScore1st: 0,
        homeScore2nd: 0,
        awayScore1st: 0,
        awayScore2nd: 0,
        homeFouls1st: 0,
        homeFouls2nd: 0,
        awayFouls1st: 0,
        awayFouls2nd: 0,
        period: '1',
        timerRemaining: 1200,
        timeouts: JSON.stringify({ home1: false, home2: false, away1: false, away2: false })
      },
      players: squad,
      events: [],
      pakets: [
        { id: 1, matchId: newId, paketIndex: 0, code: 'PAKET 1 (STARTING)', playerNumbers: JSON.stringify([1, 3, 6, 7, 8]) },
        { id: 2, matchId: newId, paketIndex: 1, code: 'PAKET 2 (ROTASI A)', playerNumbers: JSON.stringify([1, 4, 10, 11, 9]) },
        { id: 3, matchId: newId, paketIndex: 2, code: 'PAKET 3 (ROTASI B)', playerNumbers: JSON.stringify([2, 5, 12, 13, 14]) },
        { id: 4, matchId: newId, paketIndex: 3, code: 'PAKET 4 (POWER PLAY)', playerNumbers: JSON.stringify([10, 3, 6, 7, 8]) }
      ],
      substitutions: []
    };

    matches.push(newMatchData);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return newMatchData.match;
  }

  async duplicateMatch(id: number): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const source = matches.find(m => m.match.id === id);
    if (!source) throw new Error('Match asal tidak ditemukan.');

    const newId = Math.max(...matches.map(m => m.match.id)) + 1;
    const duplicated: MatchData = {
      match: {
        ...source.match,
        id: newId,
        name: `${source.match.name} (Salinan)`
      },
      players: source.players.map((p, idx) => ({ ...p, id: idx + 1, matchId: newId })),
      events: [],
      pakets: source.pakets.map((pkt, idx) => ({ ...pkt, id: idx + 1, matchId: newId })),
      substitutions: []
    };

    matches.push(duplicated);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return duplicated.match;
  }

  async deleteMatch(id: number): Promise<any> {
    this.initStorage();
    let matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    if (matches.length <= 1) {
      throw new Error('Tidak dapat menghapus satu-satunya laga yang tersisa.');
    }
    matches = matches.filter(m => m.match.id !== id);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return { success: true };
  }

  async updateMatch(id: number, data: Partial<MatchData['match']>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const match = matches.find(m => m.match.id === id);
    if (match) {
      match.match = { ...match.match, ...data };
      localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    }
    return { success: true };
  }

  async updatePlayer(id: number, data: Partial<MatchData['players'][0]>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    for (const m of matches) {
      const p = m.players.find(x => x.id === id);
      if (p) {
        Object.assign(p, data);
        break;
      }
    }
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return { success: true };
  }

  async addPlayer(matchId: number, data: Omit<MatchData['players'][0], 'id' | 'matchId'>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const match = matches.find(m => m.match.id === matchId);
    if (match) {
      const newPlayerId = match.players.length > 0 ? Math.max(...match.players.map(p => p.id)) + 1 : 1;
      const newP = { ...data, id: newPlayerId, matchId };
      match.players.push(newP);
      localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
      return newP;
    }
    throw new Error('Match not found');
  }

  async deletePlayer(id: number): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    for (const m of matches) {
      m.players = m.players.filter(p => p.id !== id);
    }
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return { success: true };
  }

  // Events
  async addEvent(matchId: number, event: Omit<MatchData['events'][0], 'matchId'>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const match = matches.find(m => m.match.id === matchId);
    if (match) {
      const newEvent = {
        ...event,
        id: (event as any).id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        matchId
      };
      match.events.push(newEvent);
      localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
      return newEvent;
    }
    throw new Error('Match not found');
  }

  async updateEvent(id: string, partial: Partial<MatchData['events'][0]>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    for (const m of matches) {
      const ev = m.events.find(e => e.id === id);
      if (ev) {
        Object.assign(ev, partial);
        break;
      }
    }
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return { success: true };
  }

  async deleteEvent(id: string): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    for (const m of matches) {
      m.events = m.events.filter(e => e.id !== id);
    }
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return { success: true };
  }

  // Pakets
  async savePakets(matchId: number, pakets: Array<{ paketIndex: number; code: string; playerNumbers: string }>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const match = matches.find(m => m.match.id === matchId);
    if (match) {
      match.pakets = pakets.map((pkt, idx) => ({
        id: idx + 1,
        matchId,
        paketIndex: pkt.paketIndex,
        code: pkt.code,
        playerNumbers: pkt.playerNumbers
      }));
      localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
      return { success: true };
    }
    throw new Error('Match not found');
  }

  // Substitutions
  async getSubstitutions(matchId: number): Promise<SubstitutionLog[]> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const match = matches.find(m => m.match.id === matchId);
    return match?.substitutions || [];
  }

  async logSubstitution(matchId: number, sub: Partial<SubstitutionLog>): Promise<SubstitutionLog> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const match = matches.find(m => m.match.id === matchId);
    if (!match) throw new Error('Match not found');

    if (!match.substitutions) match.substitutions = [];
    const newSub: SubstitutionLog = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matchId,
      half: sub.half || 1,
      timeStr: sub.timeStr || '20:00',
      timerRemaining: sub.timerRemaining || 1200,
      paketIndex: sub.paketIndex !== undefined ? sub.paketIndex : null,
      playerNumbers: sub.playerNumbers || '[]',
      type: sub.type || 'ROTASI_PAKET',
      note: sub.note || '',
      createdAt: new Date().toISOString()
    };

    match.substitutions.unshift(newSub);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return newSub;
  }

  async deleteSubstitution(matchId: number, subId: string): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const match = matches.find(m => m.match.id === matchId);
    if (match && match.substitutions) {
      match.substitutions = match.substitutions.filter(s => s.id !== subId);
      localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    }
    return { success: true };
  }

  // Excel Helper (In-Browser Generator)
  async downloadMasterTemplate() {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Master Pemain Futsal');
    sheet.columns = [
      { header: 'No Punggung', key: 'no', width: 14 },
      { header: 'Nama Lengkap', key: 'name', width: 28 },
      { header: 'Nama Panggilan', key: 'nickname', width: 18 },
      { header: 'Posisi', key: 'pos', width: 16 },
      { header: 'Kaki Dominan', key: 'foot', width: 16 },
      { header: 'Tinggi (cm)', key: 'height', width: 14 },
      { header: 'Berat (kg)', key: 'weight', width: 14 },
      { header: 'Status', key: 'status', width: 14 }
    ];

    INITIAL_MASTER_PLAYERS.forEach(p => {
      sheet.addRow({
        no: p.noPunggung,
        name: p.name,
        nickname: p.nickname,
        pos: p.position,
        foot: p.dominantFoot,
        height: p.height,
        weight: p.weight,
        status: p.status
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Master_Pemain_Futsal.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  async downloadPaketTemplate() {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Paket Rotasi 5-Man');
    sheet.columns = [
      { header: 'Index Paket', key: 'idx', width: 14 },
      { header: 'Nama Paket', key: 'code', width: 26 },
      { header: 'Daftar Nomor Pemain (5 Nomor Dipisahkan Koma)', key: 'players', width: 45 }
    ];

    sheet.addRow({ idx: 1, code: 'PAKET 1 (STARTING)', players: '1, 3, 6, 7, 8' });
    sheet.addRow({ idx: 2, code: 'PAKET 2 (ROTASI A)', players: '1, 4, 10, 11, 9' });
    sheet.addRow({ idx: 3, code: 'PAKET 3 (ROTASI B)', players: '2, 5, 12, 13, 14' });
    sheet.addRow({ idx: 4, code: 'PAKET 4 (POWER PLAY)', players: '10, 3, 6, 7, 8' });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Paket_Rotasi_5Man.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const localDb = new LocalDatabase();
