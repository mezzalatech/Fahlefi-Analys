// Local Database Engine for Offline-First & Multi-Tenant Deployments
import type { User, MasterPlayer, MatchData, SubstitutionLog, Team, GkStat } from './api';

const TEAMS_KEY = 'ffta_offline_teams';
const USERS_KEY = 'ffta_offline_users';
const MASTER_PLAYERS_KEY = 'ffta_offline_master_players';
const MATCHES_KEY = 'ffta_offline_matches';
const ACTIVE_MATCH_KEY = 'ffta_active_match_id';
const PASSWORDS_KEY = 'ffta_offline_passwords';

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team_paser',
    name: 'Porprov Paser',
    shortName: 'PASER',
    city: 'Kabupaten Paser',
    logoUrl: '/icon.png',
    status: 'ACTIVE',
    createdAt: '2024-08-01T00:00:00.000Z'
  },
  {
    id: 'team_nazara',
    name: 'Nazara FC',
    shortName: 'NAZARA',
    city: 'Samarinda / Tanah Grogot',
    logoUrl: '/icon.png',
    status: 'ACTIVE',
    createdAt: '2024-08-02T00:00:00.000Z'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_superadmin',
    username: 'admin',
    email: 'admin@fahlefi.com',
    name: 'Super Admin (Owner Platform)',
    role: 'superadmin',
    avatarUrl: '/icon.png',
    teamId: undefined,
    teamName: 'Platform Owner'
  },
  {
    id: 'usr_coach_paser',
    username: 'coach',
    email: 'coach.paser@fahlefi.com',
    name: 'Coach Achmad Reza Fahlefi',
    role: 'coach',
    avatarUrl: '/icon.png',
    teamId: 'team_paser',
    teamName: 'Porprov Paser'
  },
  {
    id: 'usr_analyst_paser',
    username: 'analyst',
    email: 'analyst.paser@fahlefi.com',
    name: 'Tactical Analyst Porprov Paser',
    role: 'analyst',
    avatarUrl: '',
    teamId: 'team_paser',
    teamName: 'Porprov Paser'
  },
  {
    id: 'usr_coach_nazara',
    username: 'coach_nazara',
    email: 'coach.nazara@fahlefi.com',
    name: 'Head Coach Nazara FC',
    role: 'coach',
    avatarUrl: '',
    teamId: 'team_nazara',
    teamName: 'Nazara FC'
  },
  {
    id: 'usr_analyst_nazara',
    username: 'analyst_nazara',
    email: 'analyst.nazara@fahlefi.com',
    name: 'Match Analyst Nazara FC',
    role: 'analyst',
    avatarUrl: '',
    teamId: 'team_nazara',
    teamName: 'Nazara FC'
  },
  {
    id: 'usr_player_paser',
    username: 'player',
    email: 'player.paser@fahlefi.com',
    name: 'Pemain Porprov Paser',
    role: 'player',
    avatarUrl: '',
    teamId: 'team_paser',
    teamName: 'Porprov Paser'
  }
];

export const INITIAL_USER_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  coach: 'coach123',
  analyst: 'analyst123',
  coach_paser: 'coach123',
  analyst_paser: 'analyst123',
  coach_nazara: 'nazara123',
  analyst_nazara: 'nazara123',
  player: 'player123'
};

export const INITIAL_MASTER_PLAYERS: MasterPlayer[] = [
  // Porprov Paser Official Squad (15 Players)
  { id: 'mp_1789522350661_prv0', teamId: 'team_paser', noPunggung: 1, name: 'Muhammad Galang Ramadhan Akbar', nickname: 'Galang', position: 'ANCHOR', dominantFoot: 'KANAN', height: 162, weight: 54, status: 'ACTIVE' },
  { id: 'mp_1789522350871_c2zs', teamId: 'team_paser', noPunggung: 2, name: 'Rakha Ahmadin Maulid', nickname: 'Rakha', position: 'FLANK_RIGHT', dominantFoot: 'KIRI', height: 167, weight: 62, status: 'ACTIVE' },
  { id: 'mp_1789522351029_0u5y', teamId: 'team_paser', noPunggung: 3, name: 'Rasya Rahmadan', nickname: 'Sakur', position: 'FLANK_LEFT', dominantFoot: 'KANAN', height: 169, weight: 54, status: 'ACTIVE' },
  { id: 'mp_1789522351187_xrti', teamId: 'team_paser', noPunggung: 4, name: 'M Tsaqif Alkautsar Rahman', nickname: 'Aqif', position: 'ANCHOR', dominantFoot: 'KANAN', height: 170, weight: 68, status: 'ACTIVE' },
  { id: 'mp_1789522351355_xnt2', teamId: 'team_paser', noPunggung: 5, name: 'Aderian Rizqon Toyba', nickname: 'Rizqon', position: 'PIVOT', dominantFoot: 'KANAN', height: 161, weight: 48, status: 'ACTIVE' },
  { id: 'mp_1789522351524_3oj2', teamId: 'team_paser', noPunggung: 6, name: 'Muhammad Afghan Trihartanto', nickname: 'Afgan', position: 'FLANK_LEFT', dominantFoot: 'KANAN', height: 161, weight: 50, status: 'ACTIVE' },
  { id: 'mp_1789522351690_r3r6', teamId: 'team_paser', noPunggung: 7, name: 'Bintang Yakusa Sugiarto', nickname: 'Bintang', position: 'FLANK_RIGHT', dominantFoot: 'KIRI', height: 168, weight: 60, status: 'ACTIVE' },
  { id: 'mp_1789522351852_yxqs', teamId: 'team_paser', noPunggung: 8, name: 'Arya Alfiansyah', nickname: 'Arya Pivot', position: 'PIVOT', dominantFoot: 'KIRI', height: 163, weight: 65, status: 'ACTIVE' },
  { id: 'mp_1789522355201_3lgl', teamId: 'team_paser', noPunggung: 9, name: 'Muhammad Arya Firjatullah Al Malik', nickname: 'Arya', position: 'FLANK_RIGHT', dominantFoot: 'KIRI', height: 161, weight: 52, status: 'ACTIVE' },
  { id: 'mp_1789522352172_uc1h', teamId: 'team_paser', noPunggung: 10, name: 'Muhammad Arifin Nurcahyo', nickname: 'Arifin', position: 'GK', dominantFoot: 'KANAN', height: 173, weight: 64, status: 'ACTIVE' },
  { id: 'mp_1789522352338_2mic', teamId: 'team_paser', noPunggung: 11, name: 'Zevano Adelio Wibowo', nickname: 'Zevano', position: 'GK', dominantFoot: 'KANAN', height: 177, weight: 80, status: 'ACTIVE' },
  { id: 'mp_1789522352500_blhc', teamId: 'team_paser', noPunggung: 12, name: 'Muhammad Pahrul Zaini', nickname: 'Pahrul', position: 'FLANK_LEFT', dominantFoot: 'KANAN', height: 165, weight: 65, status: 'ACTIVE' },
  { id: 'mp_1789522352662_jvnb', teamId: 'team_paser', noPunggung: 13, name: 'Dwi Maulana Muhammad Ibrahim Rumy', nickname: 'Ibra', position: 'PIVOT', dominantFoot: 'KANAN', height: 177, weight: 61, status: 'ACTIVE' },
  { id: 'mp_1789522352832_nvma', teamId: 'team_paser', noPunggung: 14, name: 'Hari Akmal Risqullah', nickname: 'Akmal', position: 'GK', dominantFoot: 'KANAN', height: 169, weight: 73, status: 'ACTIVE' },
  { id: 'mp_1789522352995_76m0', teamId: 'team_paser', noPunggung: 15, name: 'Muhammad Wirawan', nickname: 'Wirawan', position: 'FLANK_RIGHT', dominantFoot: 'KIRI', height: 165, weight: 55, status: 'ACTIVE' },

  // Nazara FC Squad
  { id: 'mp_nazara_1', teamId: 'team_nazara', noPunggung: 1, name: 'Aditya Nazara', nickname: 'Adit', position: 'GK', dominantFoot: 'KANAN', height: 181, weight: 73, status: 'ACTIVE' },
  { id: 'mp_nazara_4', teamId: 'team_nazara', noPunggung: 4, name: 'Bayu Pratama', nickname: 'Bayu', position: 'ANCHOR', dominantFoot: 'KANAN', height: 177, weight: 71, status: 'ACTIVE' },
  { id: 'mp_nazara_7', teamId: 'team_nazara', noPunggung: 7, name: 'Rendi Juliansyah', nickname: 'Rendi', position: 'FLANK_LEFT', dominantFoot: 'KIRI', height: 171, weight: 63, status: 'ACTIVE' },
  { id: 'mp_nazara_9', teamId: 'team_nazara', noPunggung: 9, name: 'Sultan Nazara', nickname: 'Sultan', position: 'PIVOT', dominantFoot: 'KANAN', height: 180, weight: 75, status: 'ACTIVE' },
  { id: 'mp_nazara_10', teamId: 'team_nazara', noPunggung: 10, name: 'Arif Maulana', nickname: 'Arif', position: 'FLANK_RIGHT', dominantFoot: 'KANAN', height: 174, weight: 66, status: 'ACTIVE' },
  { id: 'mp_nazara_11', teamId: 'team_nazara', noPunggung: 11, name: 'Danang Saputra', nickname: 'Danang', position: 'PLAYER', dominantFoot: 'KANAN', height: 175, weight: 68, status: 'ACTIVE' },
  { id: 'mp_nazara_12', teamId: 'team_nazara', noPunggung: 12, name: 'Gilang Ramadhan', nickname: 'Gilang', position: 'PLAYER', dominantFoot: 'KIRI', height: 173, weight: 65, status: 'ACTIVE' }
];

function createDefaultMatchForTeam(teamId: string, matchId: number, teamName: string, opponent: string): MatchData {
  const teamPlayers = INITIAL_MASTER_PLAYERS.filter(p => p.teamId === teamId);
  const squadPlayers = teamPlayers.map((p, idx) => ({
    id: idx + 1,
    matchId,
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

  const startingNos = teamPlayers.slice(0, 5).map(p => p.noPunggung);

  return {
    match: {
      id: matchId,
      teamId,
      name: `Match Analisis ${teamName}`,
      competition: 'Paser Championship 2024',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      venue: 'GOR Sadurengas Paser',
      homeTeam: teamName,
      awayTeam: opponent,
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
    pakets: [
      { id: 1, matchId, paketIndex: 0, code: 'PAKET 1 (STARTING)', playerNumbers: JSON.stringify(startingNos) },
      { id: 2, matchId, paketIndex: 1, code: 'PAKET 2 (ROTASI A)', playerNumbers: JSON.stringify(teamPlayers.slice(1, 6).map(p => p.noPunggung)) },
      { id: 3, matchId, paketIndex: 2, code: 'PAKET 3 (ROTASI B)', playerNumbers: JSON.stringify(teamPlayers.slice(2, 7).map(p => p.noPunggung)) },
      { id: 4, matchId, paketIndex: 3, code: 'PAKET 4 (POWER PLAY)', playerNumbers: JSON.stringify(startingNos) }
    ],
    substitutions: [],
    gkStats: []
  };
}

class LocalDatabase {
  private initStorage() {
    if (typeof localStorage === 'undefined') return;

    // 1. Teams
    if (!localStorage.getItem(TEAMS_KEY)) {
      localStorage.setItem(TEAMS_KEY, JSON.stringify(INITIAL_TEAMS));
    }

    // 2. Users (Ensure superadmin and teamId mappings)
    const existingUsersRaw = localStorage.getItem(USERS_KEY);
    if (!existingUsersRaw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    } else {
      try {
        let users: User[] = JSON.parse(existingUsersRaw);
        let updated = false;
        if (!users.some(u => u.username === 'admin' || u.role === 'superadmin')) {
          users.unshift(INITIAL_USERS[0]);
          updated = true;
        }
        users = users.map(u => {
          if (!u.teamId && u.role !== 'superadmin' && u.role !== 'admin') {
            updated = true;
            return { ...u, teamId: 'team_paser', teamName: u.teamName || 'Porprov Paser' };
          }
          return u;
        });
        if (updated) localStorage.setItem(USERS_KEY, JSON.stringify(users));
      } catch {}
    }

    // 3. Passwords
    const existingPassRaw = localStorage.getItem(PASSWORDS_KEY);
    if (!existingPassRaw) {
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(INITIAL_USER_PASSWORDS));
    } else {
      try {
        const passwords = JSON.parse(existingPassRaw);
        let updated = false;
        for (const [k, v] of Object.entries(INITIAL_USER_PASSWORDS)) {
          if (!passwords[k]) {
            passwords[k] = v;
            updated = true;
          }
        }
        if (updated) localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
      } catch {}
    }

    // 4. Master Players
    const existingMpRaw = localStorage.getItem(MASTER_PLAYERS_KEY);
    if (!existingMpRaw) {
      localStorage.setItem(MASTER_PLAYERS_KEY, JSON.stringify(INITIAL_MASTER_PLAYERS));
    } else {
      try {
        let mps: MasterPlayer[] = JSON.parse(existingMpRaw);
        let updated = false;
        // Tag legacy players with team_paser
        mps = mps.map(p => {
          if (!p.teamId) {
            updated = true;
            return { ...p, teamId: 'team_paser' };
          }
          return p;
        });
        // Ensure Nazara FC sample players exist
        if (!mps.some(p => p.teamId === 'team_nazara')) {
          mps.push(...INITIAL_MASTER_PLAYERS.filter(p => p.teamId === 'team_nazara'));
          updated = true;
        }
        if (updated) localStorage.setItem(MASTER_PLAYERS_KEY, JSON.stringify(mps));
      } catch {}
    }

    // 5. Matches
    const existingMatchesRaw = localStorage.getItem(MATCHES_KEY);
    if (!existingMatchesRaw) {
      const matchPaser = createDefaultMatchForTeam('team_paser', 1, 'Porprov Paser', 'Nazara FC');
      const matchNazara = createDefaultMatchForTeam('team_nazara', 2, 'Nazara FC', 'Porprov Paser');
      localStorage.setItem(MATCHES_KEY, JSON.stringify([matchPaser, matchNazara]));
    } else {
      try {
        let matches: MatchData[] = JSON.parse(existingMatchesRaw);
        let updated = false;
        matches = matches.map(m => {
          if (!m.match.teamId) {
            updated = true;
            m.match.teamId = 'team_paser';
          }
          return m;
        });
        if (!matches.some(m => m.match.teamId === 'team_nazara')) {
          const matchNazara = createDefaultMatchForTeam('team_nazara', matches.length + 1, 'Nazara FC', 'Porprov Paser');
          matches.push(matchNazara);
          updated = true;
        }
        if (updated) localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
      } catch {}
    }
  }

  constructor() {
    this.initStorage();
  }

  // ==================== TEAMS (Multi-Tenant) ====================
  async getTeams(): Promise<Team[]> {
    this.initStorage();
    return JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');
  }

  async getTeam(id: string): Promise<Team | null> {
    this.initStorage();
    const teams: Team[] = JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');
    return teams.find(t => t.id === id) || null;
  }

  async createTeam(teamData: Partial<Team>): Promise<Team> {
    this.initStorage();
    const teams: Team[] = JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');
    const name = (teamData.name || 'Tim Baru').trim();
    const newId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newTeam: Team = {
      id: newId,
      name,
      shortName: teamData.shortName ? teamData.shortName.trim().toUpperCase() : name.substring(0, 6).toUpperCase(),
      city: teamData.city ? teamData.city.trim() : 'Indonesia',
      logoUrl: teamData.logoUrl || '/icon.png',
      status: teamData.status || 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    teams.push(newTeam);
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
    return newTeam;
  }

  async updateTeam(id: string, teamData: Partial<Team>): Promise<Team> {
    this.initStorage();
    const teams: Team[] = JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');
    const idx = teams.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tim tidak ditemukan.');

    teams[idx] = {
      ...teams[idx],
      ...teamData,
      name: teamData.name ? teamData.name.trim() : teams[idx].name
    };

    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
    return teams[idx];
  }

  async deleteTeam(id: string): Promise<any> {
    this.initStorage();
    let teams: Team[] = JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');
    teams = teams.filter(t => t.id !== id);
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));

    // Optional: cascade cleanup or dissociate
    return { success: true };
  }

  // ==================== AUTH & USERS ====================
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    this.initStorage();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const passwords: Record<string, string> = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    const teams: Team[] = JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');

    const u = users.find(x => x.username.toLowerCase() === username.trim().toLowerCase());
    if (!u) {
      throw new Error('Username tidak ditemukan.');
    }

    const validPass = passwords[u.username.toLowerCase()] || `${u.username}123`;
    if (password !== validPass) {
      throw new Error('Kata sandi salah.');
    }

    // Attach team info if user belongs to a team
    if (u.teamId) {
      const team = teams.find(t => t.id === u.teamId);
      if (team) {
        if (team.status === 'INACTIVE' && u.role !== 'superadmin') {
          throw new Error(`Akses untuk tim "${team.name}" sedang dinonaktifkan oleh Administrator.`);
        }
        u.teamName = team.name;
      }
    }

    return {
      user: u,
      token: `local_token_${u.id}_${Date.now()}`
    };
  }

  async getUsers(teamId?: string): Promise<User[]> {
    this.initStorage();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const teams: Team[] = JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');

    const populated = users.map(u => {
      if (u.teamId) {
        const t = teams.find(team => team.id === u.teamId);
        return { ...u, teamName: t?.name || u.teamName || 'Tim' };
      }
      return u;
    });

    if (teamId && teamId !== 'ALL' && teamId !== 'system') {
      return populated.filter(u => u.teamId === teamId);
    }
    return populated;
  }

  async createUser(userData: { username: string; email?: string; name: string; role: string; password?: string; teamId?: string }): Promise<User> {
    this.initStorage();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const passwords: Record<string, string> = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    const teams: Team[] = JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');

    const un = userData.username.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === un)) {
      throw new Error(`Username @${un} sudah terdaftar.`);
    }

    const team = userData.teamId ? teams.find(t => t.id === userData.teamId) : undefined;

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: un,
      email: userData.email || `${un}@fahlefi.com`,
      name: userData.name.trim(),
      role: userData.role as any,
      teamId: userData.teamId,
      teamName: team?.name,
      avatarUrl: userData.role === 'coach' ? '/icon.png' : ''
    };

    users.push(newUser);
    passwords[un] = userData.password || `${un}123`;

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    return newUser;
  }

  async updateUser(id: string, userData: { username?: string; email?: string; name?: string; role?: string; password?: string; teamId?: string; avatarUrl?: string }): Promise<User> {
    this.initStorage();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const passwords: Record<string, string> = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    const teams: Team[] = JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');

    let idx = users.findIndex(u => u.id === id);
    if (idx === -1 && userData.username) {
      idx = users.findIndex(u => u.username.toLowerCase() === userData.username!.trim().toLowerCase());
    }

    if (idx === -1) {
      // If user record doesn't exist locally, create it smoothly
      const newUser = await this.createUser({
        username: userData.username || `user_${Date.now()}`,
        email: userData.email,
        name: userData.name || 'User',
        role: userData.role || 'coach',
        password: userData.password,
        teamId: userData.teamId
      });
      return newUser;
    }

    const oldUsername = users[idx].username.toLowerCase();
    const newUsername = userData.username ? userData.username.trim().toLowerCase() : oldUsername;

    const teamId = userData.teamId !== undefined ? userData.teamId : users[idx].teamId;
    const team = teamId ? teams.find(t => t.id === teamId) : undefined;

    users[idx] = {
      ...users[idx],
      name: userData.name !== undefined ? userData.name.trim() : users[idx].name,
      username: newUsername,
      email: userData.email !== undefined ? userData.email.trim() : users[idx].email,
      role: userData.role !== undefined ? (userData.role as any) : users[idx].role,
      teamId: teamId,
      teamName: team ? team.name : users[idx].teamName,
      avatarUrl: userData.avatarUrl !== undefined ? userData.avatarUrl : users[idx].avatarUrl
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

  // ==================== MASTER PLAYERS (Team Scoped) ====================
  async getMasterPlayers(teamId?: string): Promise<MasterPlayer[]> {
    this.initStorage();
    let players: MasterPlayer[] = JSON.parse(localStorage.getItem(MASTER_PLAYERS_KEY) || '[]');
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');

    if (teamId && teamId !== 'ALL') {
      players = players.filter(p => (p.teamId || 'team_paser') === teamId);
    }

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

      // Filter matches by same team if player has teamId
      const targetTeam = p.teamId || 'team_paser';
      const relevantMatches = matches.filter(m => (m.match.teamId || 'team_paser') === targetTeam);

      for (const m of relevantMatches) {
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
      teamId: player.teamId || 'team_paser',
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

  // ==================== MATCHES (Team Scoped) ====================
  async getMatches(teamId?: string): Promise<any[]> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    if (teamId && teamId !== 'ALL') {
      return matches.filter(m => (m.match.teamId || 'team_paser') === teamId).map(m => m.match);
    }
    return matches.map(m => m.match);
  }

  async getMatch(id: number): Promise<MatchData> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    let match = matches.find(m => m.match.id === id);
    if (!match) {
      if (matches.length > 0) return matches[0];
      const defaultMatch = createDefaultMatchForTeam('team_paser', 1, 'Porprov Paser', 'Nazara FC');
      matches.push(defaultMatch);
      localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
      return defaultMatch;
    }

    // Auto-populate from master players for this match's team if match players are missing
    if (!match.players || match.players.length === 0 || !match.players.some(p => Boolean(p.name?.trim()))) {
      const matchTeamId = match.match.teamId || 'team_paser';
      const allMaster: MasterPlayer[] = JSON.parse(localStorage.getItem(MASTER_PLAYERS_KEY) || '[]');
      const teamMaster = allMaster.filter(p => p.teamId === matchTeamId);
      if (teamMaster.length > 0) {
        match.players = teamMaster.map((p, idx) => ({
          id: idx + 1,
          matchId: id,
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
        localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
      }
    }

    return match;
  }

  async createMatch(data: any, teamId?: string): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const newId = matches.length > 0 ? Math.max(...matches.map(m => m.match.id)) + 1 : 1;
    
    const effectiveTeamId = teamId || data.teamId || 'team_paser';
    const allMaster: MasterPlayer[] = JSON.parse(localStorage.getItem(MASTER_PLAYERS_KEY) || '[]');
    const teamMaster = allMaster.filter(p => p.teamId === effectiveTeamId);

    const squad = teamMaster.map((p, idx) => ({
      id: newId * 1000 + (idx + 1),
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

    const top5Nos = teamMaster.slice(0, 5).map(p => p.noPunggung);

    const newMatchData: MatchData = {
      match: {
        id: newId,
        teamId: effectiveTeamId,
        name: data.name || `Match #${newId}`,
        competition: data.competition || 'Kompetisi Futsal',
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || '19:00',
        venue: data.venue || 'GOR Lapangan Futsal',
        homeTeam: data.homeTeam || 'Tim Saya',
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
        { id: 1, matchId: newId, paketIndex: 0, code: 'PAKET 1 (STARTING)', playerNumbers: JSON.stringify(top5Nos.length > 0 ? top5Nos : [1, 2, 3, 4, 5]) },
        { id: 2, matchId: newId, paketIndex: 1, code: 'PAKET 2 (ROTASI A)', playerNumbers: JSON.stringify(teamMaster.slice(1, 6).map(p => p.noPunggung)) },
        { id: 3, matchId: newId, paketIndex: 2, code: 'PAKET 3 (ROTASI B)', playerNumbers: JSON.stringify(teamMaster.slice(2, 7).map(p => p.noPunggung)) },
        { id: 4, matchId: newId, paketIndex: 3, code: 'PAKET 4 (POWER PLAY)', playerNumbers: JSON.stringify(top5Nos.length > 0 ? top5Nos : [1, 2, 3, 4, 5]) }
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
    const src = matches.find(m => m.match.id === id);
    if (!src) throw new Error('Match sumber tidak ditemukan.');

    const newId = matches.length > 0 ? Math.max(...matches.map(m => m.match.id)) + 1 : 1;
    const clone: MatchData = JSON.parse(JSON.stringify(src));
    clone.match.id = newId;
    clone.match.name = `${src.match.name} (Salinan)`;
    clone.players.forEach(p => (p.matchId = newId));
    clone.events.forEach(e => {
      e.id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      e.matchId = newId;
    });
    clone.pakets.forEach((p, idx) => {
      p.id = idx + 1;
      p.matchId = newId;
    });
    if (clone.substitutions) {
      clone.substitutions.forEach(s => {
        s.id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        s.matchId = newId;
      });
    }

    matches.push(clone);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return clone.match;
  }

  async deleteMatch(id: number): Promise<any> {
    this.initStorage();
    let matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    matches = matches.filter(m => m.match.id !== id);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return { success: true };
  }

  async updateMatch(id: number, data: Partial<MatchData['match']>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const idx = matches.findIndex(m => m.match.id === id);
    if (idx === -1) throw new Error('Match tidak ditemukan.');

    matches[idx].match = {
      ...matches[idx].match,
      ...data,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return matches[idx].match;
  }

  // ==================== PLAYERS IN MATCH ====================
  async updatePlayer(id: number, data: Partial<MatchData['players'][0]>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    for (const m of matches) {
      const pIdx = m.players.findIndex(p => p.id === id);
      if (pIdx !== -1) {
        m.players[pIdx] = { ...m.players[pIdx], ...data };
        localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
        return m.players[pIdx];
      }
    }
    throw new Error('Pemain tidak ditemukan.');
  }

  async addPlayer(matchId: number, data: Omit<MatchData['players'][0], 'id' | 'matchId'>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const m = matches.find(x => x.match.id === matchId);
    if (!m) throw new Error('Match tidak ditemukan.');

    const maxExisting = m.players.length > 0 ? Math.max(...m.players.map(p => p.id)) : 0;
    const newId = maxExisting >= matchId * 1000 ? maxExisting + 1 : matchId * 1000 + m.players.length + 1;
    const newPlayer = {
      ...data,
      id: newId,
      matchId
    };

    m.players.push(newPlayer);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return newPlayer;
  }

  async deletePlayer(id: number): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    for (const m of matches) {
      const idx = m.players.findIndex(p => p.id === id);
      if (idx !== -1) {
        m.players.splice(idx, 1);
        localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
        return { success: true };
      }
    }
    return { success: true };
  }

  // ==================== PITCH EVENTS ====================
  async addEvent(matchId: number, event: Omit<MatchData['events'][0], 'matchId'>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const m = matches.find(x => x.match.id === matchId);
    if (!m) throw new Error('Match tidak ditemukan.');

    const newEvent = {
      ...event,
      matchId,
      id: event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    m.events.push(newEvent);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return newEvent;
  }

  async updateEvent(id: string, partial: Partial<MatchData['events'][0]>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    for (const m of matches) {
      const idx = m.events.findIndex(e => e.id === id);
      if (idx !== -1) {
        m.events[idx] = { ...m.events[idx], ...partial };
        localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
        return m.events[idx];
      }
    }
    throw new Error('Event tidak ditemukan.');
  }

  async deleteEvent(id: string): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    for (const m of matches) {
      const idx = m.events.findIndex(e => e.id === id);
      if (idx !== -1) {
        m.events.splice(idx, 1);
        localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
        return { success: true };
      }
    }
    return { success: true };
  }

  async clearEvents(matchId: number): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const m = matches.find(x => x.match.id === matchId);
    if (m) {
      m.events = [];
      localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    }
    return { success: true };
  }

  // ==================== PAKETS ====================
  async savePakets(matchId: number, pakets: Array<{ paketIndex: number; code: string; playerNumbers: string }>): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const m = matches.find(x => x.match.id === matchId);
    if (!m) throw new Error('Match tidak ditemukan.');

    m.pakets = pakets.map((p, idx) => ({
      id: idx + 1,
      matchId,
      paketIndex: p.paketIndex,
      code: p.code,
      playerNumbers: p.playerNumbers
    }));

    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return m.pakets;
  }

  // ==================== SUBSTITUTIONS ====================
  async getSubstitutions(matchId: number): Promise<SubstitutionLog[]> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const m = matches.find(x => x.match.id === matchId);
    return m?.substitutions || [];
  }

  async logSubstitution(matchId: number, sub: Partial<SubstitutionLog>): Promise<SubstitutionLog> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const m = matches.find(x => x.match.id === matchId);
    if (!m) throw new Error('Match tidak ditemukan.');

    if (!m.substitutions) m.substitutions = [];

    const newSub: SubstitutionLog = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matchId,
      half: sub.half || 1,
      timeStr: sub.timeStr || '20:00',
      timerRemaining: sub.timerRemaining || 1200,
      paketIndex: sub.paketIndex !== undefined ? sub.paketIndex : null,
      playerNumbers: sub.playerNumbers || '[]',
      type: sub.type || 'PAKET_DEPLOY',
      note: sub.note || '',
      createdAt: new Date().toISOString(),
      teamScope: sub.teamScope
    };

    m.substitutions.unshift(newSub);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return newSub;
  }

  async deleteSubstitution(matchId: number, subId: string): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const m = matches.find(x => x.match.id === matchId);
    if (m && m.substitutions) {
      m.substitutions = m.substitutions.filter(s => s.id !== subId);
      localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    }
    return { success: true };
  }

  // ==================== GK STATS ====================
  async getGkStats(matchId: number): Promise<GkStat[]> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const m = matches.find(x => x.match.id === matchId);
    return m?.gkStats || [];
  }

  async saveGkStat(matchId: number, stat: Partial<GkStat>): Promise<GkStat> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    const m = matches.find(x => x.match.id === matchId);
    if (!m) throw new Error('Match not found');

    if (!m.gkStats) m.gkStats = [];
    const statId = stat.id || `gks_${matchId}_${stat.playerNo || 1}`;
    const existingIdx = m.gkStats.findIndex(g => g.id === statId);

    const fullStat: GkStat = {
      id: statId,
      matchId,
      playerId: stat.playerId || null,
      playerNo: stat.playerNo || 1,
      playerName: stat.playerName || 'Goalkeeper',
      minutesPlayed: stat.minutesPlayed || '40 minutes full match',
      oppShotsOn1: stat.oppShotsOn1 || 0,
      oppShotsOff1: stat.oppShotsOff1 || 0,
      oppShotsOn2: stat.oppShotsOn2 || 0,
      oppShotsOff2: stat.oppShotsOff2 || 0,
      saveCatch: stat.saveCatch || 0,
      saveBlock: stat.saveBlock || 0,
      saveCross: stat.saveCross || 0,
      saveSplit: stat.saveSplit || 0,
      saveDive: stat.saveDive || 0,
      coveringZ1: stat.coveringZ1 || 0,
      coveringZ2: stat.coveringZ2 || 0,
      coveringZ3: stat.coveringZ3 || 0,
      coveringZ4: stat.coveringZ4 || 0,
      handShortSuccess: stat.handShortSuccess || 0,
      handShortFail: stat.handShortFail || 0,
      handMidSuccess: stat.handMidSuccess || 0,
      handMidFail: stat.handMidFail || 0,
      handLongSuccess: stat.handLongSuccess || 0,
      handLongFail: stat.handLongFail || 0,
      feetShortSuccess: stat.feetShortSuccess || 0,
      feetShortFail: stat.feetShortFail || 0,
      feetMidSuccess: stat.feetMidSuccess || 0,
      feetMidFail: stat.feetMidFail || 0,
      feetLongSuccess: stat.feetLongSuccess || 0,
      feetLongFail: stat.feetLongFail || 0,
      shootingOpenPlay: stat.shootingOpenPlay || 0,
      shootingDropKick: stat.shootingDropKick || 0,
      shootingSetPlay: stat.shootingSetPlay || 0,
      assistThrowing: stat.assistThrowing || 0,
      assistPassing: stat.assistPassing || 0,
      concededGoals: typeof stat.concededGoals === 'string' ? stat.concededGoals : JSON.stringify(stat.concededGoals || []),
      anticipationNotes: stat.anticipationNotes || '',
      reboundNotes: stat.reboundNotes || '',
      secondPostNotes: stat.secondPostNotes || '',
      generalNotes: stat.generalNotes || '',
      createdAt: stat.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      m.gkStats[existingIdx] = { ...m.gkStats[existingIdx], ...fullStat, updatedAt: new Date().toISOString() };
    } else {
      m.gkStats.push(fullStat);
    }

    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return existingIdx >= 0 ? m.gkStats[existingIdx] : fullStat;
  }

  async updateGkStat(statId: string, partial: Partial<GkStat>): Promise<GkStat> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    for (const m of matches) {
      if (m.gkStats) {
        const idx = m.gkStats.findIndex(g => g.id === statId);
        if (idx >= 0) {
          m.gkStats[idx] = { ...m.gkStats[idx], ...partial, updatedAt: new Date().toISOString() };
          localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
          return m.gkStats[idx];
        }
      }
    }
    throw new Error('GK Stat not found');
  }

  async deleteGkStat(statId: string): Promise<any> {
    this.initStorage();
    const matches: MatchData[] = JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
    for (const m of matches) {
      if (m.gkStats) {
        m.gkStats = m.gkStats.filter(g => g.id !== statId);
      }
    }
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    return { success: true };
  }

  // ==================== TEMPLATES ====================
  async downloadMasterTemplate(): Promise<void> {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Master Pemain');

    sheet.columns = [
      { header: 'No Punggung', key: 'no', width: 14 },
      { header: 'Nama Lengkap', key: 'name', width: 28 },
      { header: 'Nama Panggilan', key: 'nickname', width: 18 },
      { header: 'Posisi (GK/ANCHOR/FLANK_LEFT/FLANK_RIGHT/PIVOT/PLAYER)', key: 'position', width: 35 },
      { header: 'Kaki Dominan (KANAN/KIRI/KEDUA)', key: 'dominantFoot', width: 25 },
      { header: 'Tinggi (cm)', key: 'height', width: 14 },
      { header: 'Berat (kg)', key: 'weight', width: 14 },
      { header: 'Status (ACTIVE/INJURED/SUSPENDED)', key: 'status', width: 25 }
    ];

    sheet.addRow([1, 'M. Rizky Pratama', 'Rizky', 'GK', 'KANAN', 182, 74, 'ACTIVE']);
    sheet.addRow([3, 'Aldo Bagus Prasetyo', 'Aldo', 'ANCHOR', 'KANAN', 176, 69, 'ACTIVE']);
    sheet.addRow([6, 'Ibnu Hibban', 'Ibnu', 'FLANK_LEFT', 'KIRI', 172, 65, 'ACTIVE']);
    sheet.addRow([7, 'Ryan Maulana', 'Ryan', 'FLANK_RIGHT', 'KANAN', 174, 66, 'ACTIVE']);
    sheet.addRow([8, 'M. Zikri Ramadhan', 'Zikri', 'PIVOT', 'KANAN', 179, 75, 'ACTIVE']);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Master_Pemain_Futsal.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  async downloadPaketTemplate(): Promise<void> {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Paket Rotasi');

    sheet.columns = [
      { header: 'Paket Index (1-4)', key: 'index', width: 18 },
      { header: 'Kode / Nama Paket', key: 'code', width: 28 },
      { header: 'Nomor Pemain (Pisahkan Koma)', key: 'players', width: 32 }
    ];

    sheet.addRow([1, 'PAKET 1 (STARTING)', '1, 3, 6, 7, 8']);
    sheet.addRow([2, 'PAKET 2 (ROTASI A)', '1, 4, 10, 11, 9']);
    sheet.addRow([3, 'PAKET 3 (ROTASI B)', '2, 5, 12, 13, 14']);
    sheet.addRow([4, 'PAKET 4 (POWER PLAY)', '10, 3, 6, 7, 8']);

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
