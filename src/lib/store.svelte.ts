import { api, type MatchData, type User, type MasterPlayer, type SubstitutionLog, type Team } from './api';
import confetti from 'canvas-confetti';
import { HapticEngine } from './haptic';
import { 
  initRealtimeSync, 
  testSupabaseConnection, 
  isSupabaseConfigured 
} from './supabase';

class MatchStore {
  data = $state<MatchData | null>(null);
  loading = $state<boolean>(true);
  error = $state<string | null>(null);
  
  // Auth State
  currentUser = $state<User | null>(null);
  showLoginModal = $state<boolean>(false);
  usersList = $state<User[]>([]);
  loadingUsers = $state<boolean>(false);
  showUserManagerModal = $state<boolean>(false);

  // Multi-Tenancy (Multi-Team & Super Admin) State
  teamsList = $state<Team[]>([]);
  activeTeamId = $state<string>('team_paser');
  activeTeam = $state<Team | null>(null);
  showSuperAdminModal = $state<boolean>(false);
  loadingTeams = $state<boolean>(false);

  // Team Scope & Analytics Privacy State (Confidential Isolation per Team)
  teamScope = $state<'home' | 'away' | 'all'>('home');

  // Master Players State
  masterPlayers = $state<MasterPlayer[]>([]);
  loadingMaster = $state<boolean>(false);

  // Multi-Match State
  matchesList = $state<any[]>([]);
  activeMatchId = $state<number>(1);
  showMatchManagerModal = $state<boolean>(false);

  // Substitution History State
  substitutions = $state<SubstitutionLog[]>([]);

  // Cloud Realtime Sync State
  cloudStatus = $state<'connected' | 'connecting' | 'offline' | 'unconfigured'>('unconfigured');
  cloudLatency = $state<number | null>(null);
  showCloudSyncModal = $state<boolean>(false);

  // UI & Timer State
  timerRunning = $state<boolean>(false);
  private timerInterval: any = null;
  activeHalf = $state<number>(1);
  activeTab = $state<'sheet' | 'matrix' | 'pitch' | 'pakets' | 'substitutions' | 'master_db'>('sheet');
  activePaketIndex = $state<number | null>(null);
  onPitchPlayers = $state<number[]>([]);

  constructor() {
    this.initAuth();
    this.initTeamScope();
    this.initActiveMatch();
    this.loadTeams();
    this.setupRealtimeSync();
  }

  get isSuperAdmin(): boolean {
    return this.currentUser?.role === 'superadmin' || this.currentUser?.role === 'admin';
  }

  get currentTeamName(): string {
    if (this.activeTeam?.name) return this.activeTeam.name;
    if (this.currentUser?.teamName) return this.currentUser.teamName;
    return 'Porprov Paser';
  }

  get currentTeamLogo(): string {
    return this.activeTeam?.logoUrl || '/icon.png';
  }

  private initTeamScope() {
    try {
      const savedScope = localStorage.getItem('ffta_team_scope');
      if (savedScope === 'home' || savedScope === 'away' || savedScope === 'all') {
        this.teamScope = savedScope;
      } else if (this.currentUser?.teamScope) {
        this.teamScope = (this.currentUser.teamScope as any) || 'home';
      }
    } catch {}
  }

  setTeamScope(scope: 'home' | 'away' | 'all') {
    this.teamScope = scope;
    try {
      localStorage.setItem('ffta_team_scope', scope);
    } catch {}
  }

  get activeTeamName(): string {
    if (this.activeTeam?.name) return this.activeTeam.name;
    if (!this.data) return 'Tim Analisis';
    if (this.teamScope === 'away') return this.data.match.awayTeam || 'Tim Lawan (Away)';
    if (this.teamScope === 'all') return 'Semua Tim (Panitia/Admin)';
    return this.data.match.homeTeam || 'Tim Tuan Rumah (Home)';
  }

  get isPrivateAway(): boolean {
    return this.teamScope === 'away';
  }

  get scopedEvents(): MatchData['events'] {
    if (!this.data || !Array.isArray(this.data.events)) return [];
    if (this.teamScope === 'all') return this.data.events;
    return this.data.events.filter(e => !e.teamScope || e.teamScope === this.teamScope);
  }

  get scopedPakets(): MatchData['pakets'] {
    if (!this.data || !Array.isArray(this.data.pakets)) return [];
    if (this.teamScope === 'all') return this.data.pakets;
    return this.data.pakets.filter(p => !p.teamScope || p.teamScope === this.teamScope);
  }

  async setupRealtimeSync() {
    if (!isSupabaseConfigured()) {
      this.cloudStatus = 'unconfigured';
      return;
    }

    this.cloudStatus = 'connecting';
    const test = await testSupabaseConnection();
    if (test.ok) {
      this.cloudStatus = 'connected';
      this.cloudLatency = test.latencyMs || null;
    } else {
      this.cloudStatus = 'offline';
    }

    initRealtimeSync(async (event, payload) => {
      this.cloudStatus = 'connected';

      // 1. Master player updates
      if (
        event === 'master_player_created' || 
        event === 'master_player_updated' || 
        event === 'master_player_deleted' ||
        event.includes('master_players')
      ) {
        await this.loadMasterPlayers();
      }

      // 2. Match updates
      if (event === 'match_updated' || event.includes('_matches')) {
        const mId = payload?.matchId || payload?.new?.id;
        if (mId === this.activeMatchId && this.data) {
          if (payload?.data) {
            const d = payload.data;
            for (const k in d) {
              if ((this.data.match as any)[k] !== d[k]) {
                (this.data.match as any)[k] = d[k];
              }
            }
          } else if (payload?.new) {
            const n = payload.new;
            if (n.name !== undefined && this.data.match.name !== n.name) this.data.match.name = n.name;
            if (n.competition !== undefined && this.data.match.competition !== n.competition) this.data.match.competition = n.competition;
            if (n.date !== undefined && this.data.match.date !== n.date) this.data.match.date = n.date;
            if (n.time !== undefined && this.data.match.time !== n.time) this.data.match.time = n.time;
            if (n.venue !== undefined && this.data.match.venue !== n.venue) this.data.match.venue = n.venue;
            if (n.home_team !== undefined && this.data.match.homeTeam !== n.home_team) this.data.match.homeTeam = n.home_team;
            if (n.away_team !== undefined && this.data.match.awayTeam !== n.away_team) this.data.match.awayTeam = n.away_team;
            if (n.home_score_1st !== undefined && this.data.match.homeScore1st !== n.home_score_1st) this.data.match.homeScore1st = n.home_score_1st;
            if (n.home_score_2nd !== undefined && this.data.match.homeScore2nd !== n.home_score_2nd) this.data.match.homeScore2nd = n.home_score_2nd;
            if (n.away_score_1st !== undefined && this.data.match.awayScore1st !== n.away_score_1st) this.data.match.awayScore1st = n.away_score_1st;
            if (n.away_score_2nd !== undefined && this.data.match.awayScore2nd !== n.away_score_2nd) this.data.match.awayScore2nd = n.away_score_2nd;
            if (n.home_fouls_1st !== undefined && this.data.match.homeFouls1st !== n.home_fouls_1st) this.data.match.homeFouls1st = n.home_fouls_1st;
            if (n.home_fouls_2nd !== undefined && this.data.match.homeFouls2nd !== n.home_fouls_2nd) this.data.match.homeFouls2nd = n.home_fouls_2nd;
            if (n.away_fouls_1st !== undefined && this.data.match.awayFouls1st !== n.away_fouls_1st) this.data.match.awayFouls1st = n.away_fouls_1st;
            if (n.away_fouls_2nd !== undefined && this.data.match.awayFouls2nd !== n.away_fouls_2nd) this.data.match.awayFouls2nd = n.away_fouls_2nd;
            if (n.period !== undefined && this.data.match.period !== n.period) this.data.match.period = n.period;
            if (n.timer_remaining !== undefined && !this.timerRunning && this.data.match.timerRemaining !== n.timer_remaining) this.data.match.timerRemaining = n.timer_remaining;
            if (n.timeouts !== undefined && this.data.match.timeouts !== n.timeouts) this.data.match.timeouts = n.timeouts;
          }
        }
      }

      // 3. Player stats updates
      if (event === 'player_stats_updated' || event.includes('_players')) {
        const pId = payload?.playerId || payload?.new?.id;
        if (this.data && pId) {
          const p = this.data.players.find(x => x.id === pId);
          if (p) {
            if (payload?.data) {
              const d = payload.data;
              for (const k in d) {
                if ((p as any)[k] !== d[k]) {
                  (p as any)[k] = d[k];
                }
              }
            } else if (payload?.new) {
              const n = payload.new;
              if (n.no !== undefined && p.no !== n.no) p.no = n.no;
              if (n.name !== undefined && p.name !== n.name) p.name = n.name;
              if (n.is_gk !== undefined && p.isGk !== n.is_gk) p.isGk = n.is_gk;
              if (n.yellow_cards !== undefined && p.yellowCards !== n.yellow_cards) p.yellowCards = n.yellow_cards;
              if (n.red_cards !== undefined && p.redCards !== n.red_cards) p.redCards = n.red_cards;
              if (n.loss_1 !== undefined && p.loss1 !== n.loss_1) p.loss1 = n.loss_1;
              if (n.loss_2 !== undefined && p.loss2 !== n.loss_2) p.loss2 = n.loss_2;
              if (n.rec_1 !== undefined && p.rec1 !== n.rec_1) p.rec1 = n.rec_1;
              if (n.rec_2 !== undefined && p.rec2 !== n.rec_2) p.rec2 = n.rec_2;
              if (n.fl_1 !== undefined && p.fl1 !== n.fl_1) p.fl1 = n.fl_1;
              if (n.fl_2 !== undefined && p.fl2 !== n.fl_2) p.fl2 = n.fl_2;
              if (n.sh_1 !== undefined && p.sh1 !== n.sh_1) p.sh1 = n.sh_1;
              if (n.sh_2 !== undefined && p.sh2 !== n.sh_2) p.sh2 = n.sh_2;
              if (n.gl_1 !== undefined && p.gl1 !== n.gl_1) p.gl1 = n.gl_1;
              if (n.gl_2 !== undefined && p.gl2 !== n.gl_2) p.gl2 = n.gl_2;
            }
          }
        }
      }

      // 4. Pitch Events
      if (event === 'event_added' || event.includes('_pitch_events')) {
        const newEv = payload?.event || payload?.new;
        if (this.data && newEv && (newEv.matchId === this.activeMatchId || newEv.match_id === this.activeMatchId)) {
          const formattedEv = {
            id: newEv.id,
            matchId: newEv.matchId || newEv.match_id,
            type: newEv.type,
            outcome: newEv.outcome,
            team: newEv.team,
            half: newEv.half,
            timeStr: newEv.timeStr || newEv.time_str,
            x: newEv.x,
            y: newEv.y,
            playerNo: newEv.playerNo || newEv.player_no,
            note: newEv.note || ''
          };
          if (!this.data.events.some(e => e.id === formattedEv.id)) {
            this.data.events = [...this.data.events, formattedEv];
          }
        }
      } else if (event === 'event_deleted') {
        if (this.data && payload?.id) {
          this.data.events = this.data.events.filter(e => e.id !== payload.id);
        }
      }

      // 5. Substitutions
      if (event === 'substitution_logged' || event.includes('_substitutions')) {
        const newSub = payload?.sub || payload?.new;
        if (newSub && (newSub.matchId === this.activeMatchId || newSub.match_id === this.activeMatchId)) {
          const formattedSub = {
            id: newSub.id,
            matchId: newSub.matchId || newSub.match_id,
            half: newSub.half,
            timeStr: newSub.timeStr || newSub.time_str,
            timerRemaining: newSub.timerRemaining || newSub.timer_remaining,
            paketIndex: newSub.paketIndex !== undefined ? newSub.paketIndex : newSub.paket_index,
            playerNumbers: newSub.playerNumbers || newSub.player_numbers,
            type: newSub.type,
            note: newSub.note || '',
            createdAt: newSub.createdAt || newSub.created_at
          };
          if (!this.substitutions.some(s => s.id === formattedSub.id)) {
            this.substitutions = [formattedSub, ...this.substitutions];
          }
          // Synchronize active on-pitch players & active paket tag!
          try {
            const parsed = JSON.parse(formattedSub.playerNumbers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.onPitchPlayers = parsed;
              this.activePaketIndex = formattedSub.paketIndex ?? null;
            }
          } catch {}
        }
      } else if (event === 'substitution_deleted') {
        const subId = payload?.subId || payload?.id || payload?.old?.id;
        if (subId) {
          this.substitutions = this.substitutions.filter(s => s.id !== subId);
          if (this.substitutions.length > 0) {
            const latest = this.substitutions[0];
            try {
              const parsed = JSON.parse(latest.playerNumbers);
              if (Array.isArray(parsed) && parsed.length > 0) {
                this.onPitchPlayers = parsed;
                this.activePaketIndex = latest.paketIndex ?? null;
              }
            } catch {}
          }
        }
      }

      // 6. Pakets
      if (event === 'pakets_saved' || event.includes('_lineup_pakets')) {
        const mId = payload?.matchId || payload?.new?.match_id;
        if (this.data && mId === this.activeMatchId) {
          if (payload?.pakets && Array.isArray(payload.pakets)) {
            this.data.pakets = payload.pakets;
          } else if (payload?.new) {
            const n = payload.new;
            const existing = this.data.pakets.find(x => x.id === n.id || x.paketIndex === n.paket_index);
            if (existing) {
              if (n.code !== undefined) existing.code = n.code;
              if (n.player_numbers !== undefined) existing.playerNumbers = n.player_numbers;
            } else {
              this.data.pakets.push({
                id: n.id,
                matchId: n.match_id,
                paketIndex: n.paket_index,
                code: n.code,
                playerNumbers: n.player_numbers
              });
            }
          }
        }
      }

      // 7. Migration completed
      if (event === 'migration_completed') {
        await this.loadMasterPlayers();
        await this.loadMatch(this.activeMatchId);
      }
    });
  }

  async checkCloudConnection() {
    if (!isSupabaseConfigured()) {
      this.cloudStatus = 'unconfigured';
      this.cloudLatency = null;
      return { ok: false, error: 'Belum dikonfigurasi' };
    }
    this.cloudStatus = 'connecting';
    const res = await testSupabaseConnection();
    if (res.ok) {
      this.cloudStatus = 'connected';
      this.cloudLatency = res.latencyMs || null;
    } else {
      this.cloudStatus = 'offline';
      this.cloudLatency = null;
    }
    return res;
  }

  private initActiveMatch() {
    try {
      const savedMatchId = localStorage.getItem('ffta_active_match_id');
      if (savedMatchId) {
        this.activeMatchId = parseInt(savedMatchId, 10) || 1;
      }
    } catch {}
  }

  private initAuth() {
    try {
      const savedUser = localStorage.getItem('ffta_current_user');
      const savedToken = localStorage.getItem('ffta_token');
      const savedTeamId = localStorage.getItem('ffta_active_team_id');

      if (savedUser && savedToken) {
        this.currentUser = JSON.parse(savedUser);

        // Auto-fix legacy stored user missing teamId
        if (this.currentUser && !this.currentUser.teamId) {
          if (this.currentUser.username?.toLowerCase().includes('nazara')) {
            this.currentUser.teamId = 'team_nazara';
            this.currentUser.teamName = 'Nazara FC';
          } else {
            this.currentUser.teamId = 'team_paser';
            this.currentUser.teamName = 'Porprov Paser';
          }
          localStorage.setItem('ffta_current_user', JSON.stringify(this.currentUser));
        }

        if (this.currentUser?.teamId && this.currentUser.role !== 'superadmin') {
          this.activeTeamId = this.currentUser.teamId;
        } else if (savedTeamId) {
          this.activeTeamId = savedTeamId;
        } else if (this.currentUser?.teamId) {
          this.activeTeamId = this.currentUser.teamId;
        }
        this.showLoginModal = false;
      } else {
        this.currentUser = null;
        this.showLoginModal = true;
      }
    } catch {
      this.currentUser = null;
      this.showLoginModal = true;
    }
  }

  // ==================== MULTI-TENANCY & TEAMS ====================
  async loadTeams() {
    try {
      this.loadingTeams = true;
      const teams = await api.getTeams();
      this.teamsList = teams;
      
      const savedTeamId = localStorage.getItem('ffta_active_team_id');
      if (this.currentUser?.teamId && this.currentUser.role !== 'superadmin') {
        this.activeTeamId = this.currentUser.teamId;
      } else if (savedTeamId && teams.some(t => t.id === savedTeamId)) {
        this.activeTeamId = savedTeamId;
      } else if (this.currentUser?.teamId) {
        this.activeTeamId = this.currentUser.teamId;
      } else if (!this.activeTeamId && teams.length > 0) {
        this.activeTeamId = teams[0].id;
      }
      this.activeTeam = this.teamsList.find(t => t.id === this.activeTeamId) || this.teamsList[0] || null;
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      this.loadingTeams = false;
    }
  }

  async switchTeam(teamId: string) {
    if (!this.isSuperAdmin && this.currentUser?.teamId && teamId !== this.currentUser.teamId) {
      console.warn('Akses Ditolak: Hanya Super Admin yang diizinkan berpindah ruang kerja tim.');
      return;
    }
    this.pauseTimer();
    this.activeTeamId = teamId;
    try {
      localStorage.setItem('ffta_active_team_id', teamId);
    } catch {}
    this.activeTeam = this.teamsList.find(t => t.id === teamId) || null;
    await this.loadMasterPlayers(teamId);
    await this.loadMatchesList(teamId);
    if (this.matchesList.length > 0) {
      await this.switchMatch(this.matchesList[0].id);
    } else {
      await this.createNewMatch({
        name: `Match Analisis ${this.currentTeamName}`,
        homeTeam: this.currentTeamName,
        awayTeam: 'Lawan'
      });
    }
  }

  async createTeam(teamData: Partial<Team>) {
    const created = await api.createTeam(teamData);
    await this.loadTeams();
    return created;
  }

  async updateTeam(id: string, teamData: Partial<Team>) {
    const updated = await api.updateTeam(id, teamData);
    await this.loadTeams();
    return updated;
  }

  async deleteTeam(id: string) {
    const res = await api.deleteTeam(id);
    await this.loadTeams();
    return res;
  }

  // ==================== AUTH ACTIONS ====================
  async login(username: string, password: string) {
    const res = await api.login(username, password);
    this.currentUser = res.user;
    if (res.user.teamId) {
      this.activeTeamId = res.user.teamId;
      try {
        localStorage.setItem('ffta_active_team_id', res.user.teamId);
      } catch {}
    }
    localStorage.setItem('ffta_current_user', JSON.stringify(res.user));
    localStorage.setItem('ffta_token', res.token);
    this.showLoginModal = false;

    await this.loadTeams();
    this.activeTeam = this.teamsList.find(t => t.id === this.activeTeamId) || null;
    await this.loadMasterPlayers(this.activeTeamId);
    await this.loadMatchesList(this.activeTeamId);

    if (this.matchesList.length > 0) {
      await this.switchMatch(this.matchesList[0].id);
    } else {
      await this.createNewMatch({
        name: `Match Analisis ${this.currentTeamName}`,
        homeTeam: this.currentTeamName,
        awayTeam: 'Lawan'
      });
    }
    return res.user;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('ffta_current_user');
    localStorage.removeItem('ffta_token');
    this.showLoginModal = true;
  }

  // User Management Actions
  async loadUsers(teamId?: string) {
    try {
      this.loadingUsers = true;
      const targetTeamId = teamId || (this.isSuperAdmin ? undefined : this.activeTeamId);
      const list = await api.getUsers(targetTeamId);
      this.usersList = list;
    } catch (err: any) {
      console.error('Failed to load users list:', err);
    } finally {
      this.loadingUsers = false;
    }
  }

  async createUser(userData: { username: string; email?: string; name: string; role: string; password?: string; teamId?: string }) {
    const payload = {
      ...userData,
      teamId: userData.teamId || (this.isSuperAdmin ? (userData.role === 'superadmin' ? undefined : this.activeTeamId) : this.activeTeamId)
    };
    const created = await api.createUser(payload);
    await this.loadUsers();
    return created;
  }

  async updateUser(id: string, userData: { username?: string; email?: string; name?: string; role?: string; password?: string; teamId?: string }) {
    const updated = await api.updateUser(id, userData);
    await this.loadUsers();
    if (this.currentUser && (this.currentUser.id === id || this.currentUser.username.toLowerCase() === userData.username?.toLowerCase())) {
      this.currentUser = { ...this.currentUser, ...updated };
      localStorage.setItem('ffta_current_user', JSON.stringify(this.currentUser));
      if (updated.teamId && updated.teamId !== this.activeTeamId) {
        await this.switchTeam(updated.teamId);
      }
    }
    return updated;
  }

  async deleteUser(id: string) {
    const res = await api.deleteUser(id);
    await this.loadUsers();
    return res;
  }

  switchRole(role: 'superadmin' | 'coach' | 'analyst' | 'player') {
    const names = {
      superadmin: 'Super Admin Platform',
      coach: `Coach ${this.currentTeamName}`,
      analyst: `Tactical Analyst ${this.currentTeamName}`,
      player: `Pemain ${this.currentTeamName}`
    };
    this.currentUser = {
      id: `usr_${role}`,
      username: role,
      email: `${role}@fahlefi.com`,
      name: names[role],
      role: role as any,
      teamId: role === 'superadmin' ? undefined : this.activeTeamId,
      teamName: role === 'superadmin' ? 'Super User' : this.currentTeamName,
      avatarUrl: (role === 'coach' || role === 'superadmin') ? '/icon.png' : ''
    };
    localStorage.setItem('ffta_current_user', JSON.stringify(this.currentUser));
  }

  // Master Players Actions
  async loadMasterPlayers(teamId?: string) {
    try {
      this.loadingMaster = true;
      const targetTeam = teamId || (this.isSuperAdmin ? this.activeTeamId : this.currentUser?.teamId || this.activeTeamId);
      const res = await api.getMasterPlayers(targetTeam);
      this.masterPlayers = res;
    } catch (err: any) {
      console.error('Failed to load master players:', err);
    } finally {
      this.loadingMaster = false;
    }
  }

  async createMasterPlayer(player: Partial<MasterPlayer>) {
    const payload = {
      ...player,
      teamId: player.teamId || this.activeTeamId
    };
    const created = await api.createMasterPlayer(payload);
    await this.loadMasterPlayers();
    return created;
  }

  async updateMasterPlayer(id: string, player: Partial<MasterPlayer>) {
    const updated = await api.updateMasterPlayer(id, player);
    await this.loadMasterPlayers();
    return updated;
  }

  async deleteMasterPlayer(id: string) {
    await api.deleteMasterPlayer(id);
    this.masterPlayers = this.masterPlayers.filter(p => p.id !== id);
  }

  async importMasterPlayerToMatch(masterPlayer: MasterPlayer, targetSlotNo?: number) {
    if (!this.data) return;
    const targetNo = targetSlotNo ?? masterPlayer.noPunggung;
    const existing = this.data.players.find(p => p.no === targetNo);
    
    if (existing) {
      await api.updatePlayer(existing.id, {
        name: masterPlayer.name,
        isGk: masterPlayer.position === 'GK' ? 1 : 0
      });
      existing.name = masterPlayer.name;
      existing.isGk = masterPlayer.position === 'GK' ? 1 : 0;
    }
  }

  async syncSquadFromMaster(matchId?: number) {
    const mId = matchId ?? this.activeMatchId;
    await this.loadMasterPlayers();
    if (!this.data || this.masterPlayers.length === 0) return;

    for (const mp of this.masterPlayers) {
      const existing = this.data.players.find(p => p.no === mp.noPunggung);
      if (existing) {
        if (!existing.name || existing.name !== mp.name) {
          await api.updatePlayer(existing.id, {
            name: mp.name,
            isGk: mp.position === 'GK' ? 1 : 0
          });
          existing.name = mp.name;
          existing.isGk = mp.position === 'GK' ? 1 : 0;
        }
      } else {
        const newPlayer = await api.addPlayer(mId, {
          no: mp.noPunggung,
          name: mp.name,
          isGk: mp.position === 'GK' ? 1 : 0,
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
        });
        this.data.players.push(newPlayer);
      }
    }
  }

  // Multi-Match Actions
  async loadMatchesList(teamId?: string) {
    try {
      const targetTeam = teamId || (this.isSuperAdmin ? this.activeTeamId : this.currentUser?.teamId || this.activeTeamId);
      const list = await api.getMatches(targetTeam);
      this.matchesList = list;
    } catch (err) {
      console.error('Failed to load matches list:', err);
    }
  }

  async switchMatch(matchId: number) {
    this.pauseTimer();
    this.activeMatchId = matchId;
    localStorage.setItem('ffta_active_match_id', matchId.toString());
    await this.loadMatch(matchId);
    this.showMatchManagerModal = false;
  }

  async createNewMatch(matchData: any) {
    const payload = {
      ...matchData,
      teamId: matchData.teamId || this.activeTeamId,
      homeTeam: matchData.homeTeam || this.currentTeamName
    };
    const created = await api.createMatch(payload, this.activeTeamId);
    await this.loadMatchesList(this.activeTeamId);
    await this.switchMatch(created.id);
    return created;
  }

  async duplicateMatch(matchId: number) {
    const duplicated = await api.duplicateMatch(matchId);
    await this.loadMatchesList(this.activeTeamId);
    await this.switchMatch(duplicated.id);
    return duplicated;
  }

  async deleteMatch(matchId: number) {
    await api.deleteMatch(matchId);
    await this.loadMatchesList(this.activeTeamId);
    if (this.activeMatchId === matchId) {
      const nextMatch = this.matchesList[0];
      if (nextMatch) {
        await this.switchMatch(nextMatch.id);
      } else {
        await this.createNewMatch({ name: `Match Analisis ${this.currentTeamName}` });
      }
    }
  }

  // Load Match & Subs
  async loadMatch(matchId?: number) {
    let mId = matchId ?? this.activeMatchId;
    this.activeMatchId = mId;
    try {
      this.loading = true;
      this.error = null;
      let res = await api.getMatch(mId);

      // Strict confidentiality: if match belongs to another team, load this team's match
      if (!this.isSuperAdmin && res?.match?.teamId && this.activeTeamId && res.match.teamId !== this.activeTeamId) {
        await this.loadMatchesList(this.activeTeamId);
        if (this.matchesList.length > 0) {
          mId = this.matchesList[0].id;
          this.activeMatchId = mId;
          localStorage.setItem('ffta_active_match_id', mId.toString());
          res = await api.getMatch(mId);
        } else {
          await this.createNewMatch({
            name: `Match Analisis ${this.currentTeamName}`,
            homeTeam: this.currentTeamName,
            awayTeam: 'Lawan'
          });
          return;
        }
      }

      if (res) {
        if (!Array.isArray(res.players)) res.players = [];
        if (!Array.isArray(res.events)) res.events = [];
        if (!Array.isArray(res.pakets)) res.pakets = [];
        if (!Array.isArray(res.substitutions)) res.substitutions = [];
      }
      this.data = res;
      if (res.substitutions && res.substitutions.length > 0) {
        this.substitutions = res.substitutions;
        const latestSub = res.substitutions[0];
        try {
          const parsed = JSON.parse(latestSub.playerNumbers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.onPitchPlayers = parsed;
            this.activePaketIndex = latestSub.paketIndex ?? null;
          }
        } catch {}
      } else {
        await this.loadSubstitutions(mId);
      }
      // Auto-populate 5 players on pitch if still empty for ultra-fast futsal tagging
      if (this.onPitchPlayers.length === 0) {
        const firstPaket = res.pakets?.[0];
        if (firstPaket) {
          try {
            const parsed = JSON.parse(firstPaket.playerNumbers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.onPitchPlayers = parsed;
              this.activePaketIndex = firstPaket.paketIndex;
            }
          } catch {
            const parsed = firstPaket.code.split('-').map((n: string) => parseInt(n.trim())).filter((n: number) => !isNaN(n));
            if (parsed.length > 0) {
              this.onPitchPlayers = parsed;
              this.activePaketIndex = firstPaket.paketIndex;
            }
          }
        }
        if (this.onPitchPlayers.length === 0 && res.players && res.players.length > 0) {
          this.onPitchPlayers = res.players.slice(0, 5).map((p: any) => p.no);
        }
      }
      await this.loadMasterPlayers(this.activeTeamId);
      // Auto-populate match roster from master players if empty or all names blank
      const hasNamedPlayers = this.data?.players?.some(p => Boolean(p.name?.trim()));
      if (!hasNamedPlayers && this.masterPlayers.length > 0) {
        await this.syncSquadFromMaster(mId);
      }
      await this.loadMatchesList(this.activeTeamId);
    } catch (err: any) {
      this.error = err.message || 'Failed to load match';
    } finally {
      this.loading = false;
    }
  }

  async loadSubstitutions(matchId?: number) {
    const mId = matchId ?? this.activeMatchId;
    try {
      const subs = await api.getSubstitutions(mId);
      this.substitutions = subs;
      if (subs && subs.length > 0) {
        const latestSub = subs[0];
        try {
          const parsed = JSON.parse(latestSub.playerNumbers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.onPitchPlayers = parsed;
            this.activePaketIndex = latestSub.paketIndex ?? null;
          }
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load substitutions:', err);
    }
  }

  // Deploy coach's preset paket to active pitch
  async deployPaket(paketIndex: number) {
    if (!this.data || !Array.isArray(this.data.pakets)) return;
    const pkt = this.data.pakets.find(p => p.paketIndex === paketIndex);
    if (pkt) {
      try {
        this.onPitchPlayers = JSON.parse(pkt.playerNumbers);
      } catch {
        this.onPitchPlayers = pkt.code.split('-').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      }
      this.activePaketIndex = paketIndex;

      // Log substitution rotation
      await this.logSubstitution({
        paketIndex,
        playerNumbers: JSON.stringify(this.onPitchPlayers),
        type: 'PAKET_DEPLOY',
        note: `Deploy Paket ${paketIndex} (${pkt.code})`
      });
    }
  }

  // Toggle individual player on pitch (substitution / custom dynamic lineup)
  async toggleOnPitch(playerNo: number) {
    if (this.onPitchPlayers.includes(playerNo)) {
      this.onPitchPlayers = this.onPitchPlayers.filter(n => n !== playerNo);
    } else {
      this.onPitchPlayers = [...this.onPitchPlayers, playerNo];
    }

    // Check if current onPitchPlayers matches any preset paket
    if (this.data && Array.isArray(this.data.pakets)) {
      const matchPkt = this.data.pakets.find(p => {
        try {
          const pNums: number[] = JSON.parse(p.playerNumbers);
          return pNums.length === this.onPitchPlayers.length && pNums.every(n => this.onPitchPlayers.includes(n));
        } catch {
          return false;
        }
      });
      this.activePaketIndex = matchPkt ? matchPkt.paketIndex : null;

      // Log substitution
      await this.logSubstitution({
        paketIndex: this.activePaketIndex,
        playerNumbers: JSON.stringify(this.onPitchPlayers),
        type: this.activePaketIndex ? 'PAKET_DEPLOY' : 'INDIVIDUAL_SUB',
        note: `On Pitch: #${this.onPitchPlayers.join(', #')}`
      });
    }
  }

  // Substitution Logger
  async logSubstitution(subData: Partial<SubstitutionLog>) {
    if (!this.data) return;
    try {
      const newSub = await api.logSubstitution(this.data.match.id, {
        half: this.activeHalf,
        timeStr: this.formattedTime,
        timerRemaining: this.data.match.timerRemaining,
        ...subData
      });
      this.substitutions = [newSub, ...this.substitutions];
      HapticEngine.triggerSubstitution();
    } catch (err) {
      console.error('Failed to log substitution:', err);
    }
  }

  async deleteSubstitution(subId: string) {
    if (!this.data) return;
    try {
      await api.deleteSubstitution(this.data.match.id, subId);
      this.substitutions = this.substitutions.filter(s => s.id !== subId);
      if (this.substitutions.length > 0) {
        const latest = this.substitutions[0];
        try {
          const parsed = JSON.parse(latest.playerNumbers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.onPitchPlayers = parsed;
            this.activePaketIndex = latest.paketIndex ?? null;
          }
        } catch {}
      }
    } catch (err) {
      console.error('Failed to delete substitution:', err);
    }
  }

  // Record Timeout (Slot 0: H1 Home, Slot 1: H1 Away, Slot 2: H2 Home, Slot 3: H2 Away)
  async recordTimeout(team: 'home' | 'away') {
    if (!this.data) return;
    let timeouts: string[] = [];
    try {
      timeouts = JSON.parse(this.data.match.timeouts || '[]');
    } catch {}

    // Ensure 4 slots
    while (timeouts.length < 4) timeouts.push('');

    const prefix = team === 'home' ? 'H' : 'L';
    const timeEntry = `${prefix}: ${this.formattedTime}`;

    if (this.activeHalf === 1) {
      if (team === 'home') timeouts[0] = timeEntry;
      else timeouts[1] = timeEntry;
    } else {
      if (team === 'home') timeouts[2] = timeEntry;
      else timeouts[3] = timeEntry;
    }

    this.data.match.timeouts = JSON.stringify(timeouts);
    await api.updateMatch(this.data.match.id, { timeouts: this.data.match.timeouts });
  }

  // Timer controls (Countdown 20:00 -> 00:00)
  toggleTimer() {
    if (!this.data) return;
    if (this.timerRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (this.timerRunning || !this.data) return;
    this.timerRunning = true;
    this.timerInterval = setInterval(() => {
      if (this.data && this.data.match.timerRemaining > 0) {
        this.data.match.timerRemaining -= 1;
        // Debounced sync every 5 seconds
        if (this.data.match.timerRemaining % 5 === 0) {
          api.updateMatch(this.data.match.id, { timerRemaining: this.data.match.timerRemaining });
        }
      } else {
        this.pauseTimer();
      }
    }, 1000);
  }

  pauseTimer() {
    this.timerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.data) {
      api.updateMatch(this.data.match.id, { timerRemaining: this.data.match.timerRemaining });
    }
  }

  resetTimer(seconds: number = 1200) {
    this.pauseTimer();
    if (this.data) {
      this.data.match.timerRemaining = seconds;
      api.updateMatch(this.data.match.id, { timerRemaining: seconds });
    }
  }

  setTimer(seconds: number) {
    if (!this.data) return;
    const clamped = Math.max(0, Math.min(3600, Math.round(seconds)));
    this.data.match.timerRemaining = clamped;
    api.updateMatch(this.data.match.id, { timerRemaining: clamped });
  }

  adjustTimer(deltaSeconds: number) {
    if (!this.data) return;
    const current = this.data.match.timerRemaining || 0;
    const nextVal = Math.max(0, Math.min(3600, current + deltaSeconds));
    this.data.match.timerRemaining = nextVal;
    api.updateMatch(this.data.match.id, { timerRemaining: nextVal });
  }

  setTimeByMinutesSeconds(minutes: number, seconds: number) {
    const total = (Math.max(0, minutes) * 60) + Math.max(0, Math.min(59, seconds));
    this.setTimer(total);
  }

  get formattedTime(): string {
    if (!this.data) return '20:00';
    const total = this.data.match.timerRemaining;
    const mins = Math.floor(total / 60).toString().padStart(2, '0');
    const secs = (total % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  // Match updates
  async updateMatchMeta(partial: Partial<MatchData['match']>) {
    if (!this.data) return;
    Object.assign(this.data.match, partial);
    await api.updateMatch(this.data.match.id, partial);
  }

  // Fouls
  async incrementFoul(team: 'home' | 'away', half: 1 | 2) {
    if (!this.data) return;
    const key = `${team}Fouls${half === 1 ? '1st' : '2nd'}` as keyof MatchData['match'];
    const current = (this.data.match[key] as number) || 0;
    if (current < 5) {
      (this.data.match as any)[key] = current + 1;
      await api.updateMatch(this.data.match.id, { [key]: current + 1 });
    }
  }

  async decrementFoul(team: 'home' | 'away', half: 1 | 2) {
    if (!this.data) return;
    const key = `${team}Fouls${half === 1 ? '1st' : '2nd'}` as keyof MatchData['match'];
    const current = (this.data.match[key] as number) || 0;
    if (current > 0) {
      (this.data.match as any)[key] = current - 1;
      await api.updateMatch(this.data.match.id, { [key]: current - 1 });
    }
  }

  // Score adjustments
  async updateScore(team: 'home' | 'away', half: 1 | 2, delta: number) {
    if (!this.data) return;
    const key = `${team}Score${half === 1 ? '1st' : '2nd'}` as keyof MatchData['match'];
    const current = (this.data.match[key] as number) || 0;
    const newVal = Math.max(0, current + delta);
    (this.data.match as any)[key] = newVal;
    await api.updateMatch(this.data.match.id, { [key]: newVal });

    if (delta > 0) {
      this.triggerGoalCelebration();
    }
  }

  // Player stats adjustments
  async updatePlayerStat(playerId: number, field: string, delta: number) {
    if (!this.data) return;
    const player = this.data.players.find((p) => p.id === playerId);
    if (!player) return;

    const currentVal = (player as any)[field] || 0;
    const newVal = Math.max(0, currentVal + delta);
    (player as any)[field] = newVal;

    // Check if goal was scored or reverted -> sync to scoreboard
    if (field.startsWith('gl')) {
      const half = field === 'gl1' ? 1 : 2;
      await this.updateScore('home', half, delta);
    }

    // Check if foul was updated -> sync to home fouls scoreboard
    if (field === 'fl1') {
      const sumFl1 = this.data.players.reduce((sum, p) => sum + (p.fl1 || 0), 0);
      this.data.match.homeFouls1st = Math.min(5, sumFl1);
      await api.updateMatch(this.data.match.id, { homeFouls1st: this.data.match.homeFouls1st });
    } else if (field === 'fl2') {
      const sumFl2 = this.data.players.reduce((sum, p) => sum + (p.fl2 || 0), 0);
      this.data.match.homeFouls2nd = Math.min(5, sumFl2);
      await api.updateMatch(this.data.match.id, { homeFouls2nd: this.data.match.homeFouls2nd });
    }

    await api.updatePlayer(playerId, { [field]: newVal });
  }

  // Pitch Events
  async addPitchEvent(event: Omit<MatchData['events'][0], 'matchId'>) {
    if (!this.data) return;
    if (!event.teamScope) {
      event.teamScope = this.teamScope;
    }
    const newEvent = await api.addEvent(this.data.match.id, event);
    this.data.events = [...this.data.events, newEvent];

    const half = (event.half === 1 ? 1 : 2) as 1 | 2;
    const halfKey = event.half === 1 ? '1' : '2';

    // 1. Synchronize to Player Matrix Stats if home player is assigned
    if (event.team === 'home' && event.playerNo) {
      let player = this.data.players.find((p) => Number(p.no) === Number(event.playerNo));
      if (!player) {
        const masterP = this.masterPlayers.find(mp => mp.noPunggung === Number(event.playerNo));
        player = await api.addPlayer(this.data.match.id, {
          no: Number(event.playerNo),
          name: masterP?.name || `Pemain #${event.playerNo}`,
          isGk: masterP?.position === 'GK' ? 1 : 0
        });
        this.data.players = [...this.data.players, player];
      }

      if (player) {
        if (event.type === 'recovery') {
          await this.updatePlayerStat(player.id, `rec${halfKey}`, 1);
        } else if (event.type === 'turnover') {
          await this.updatePlayerStat(player.id, `loss${halfKey}`, 1);
        } else if (event.type === 'foul') {
          await this.updatePlayerStat(player.id, `fl${halfKey}`, 1);
        } else if (event.type === 'shot') {
          await this.updatePlayerStat(player.id, `sh${halfKey}`, 1);
          if (event.outcome === 'goal') {
            await this.updatePlayerStat(player.id, `gl${halfKey}`, 1);
          }
        }
      }
    }

    // 2. Synchronize fouls to scoreboard if foul without player or away foul
    if (event.type === 'foul') {
      if (event.team === 'away' || !event.playerNo) {
        await this.incrementFoul(event.team === 'home' ? 'home' : 'away', half);
      }
    }

    // 3. Synchronize score to scoreboard if goal without player or away goal
    if (event.outcome === 'goal') {
      this.triggerGoalCelebration();
      if (event.team === 'away' || !event.playerNo) {
        const team = event.team === 'home' ? 'home' : 'away';
        await this.updateScore(team, half, 1);
      }
    }

    return newEvent;
  }

  async updatePitchEvent(eventId: string, partial: Partial<MatchData['events'][0]>) {
    if (!this.data) return;
    const evt = this.data.events.find((e) => e.id === eventId);
    if (!evt) return;

    const oldEvt = { ...evt };
    const newEvt = { ...evt, ...partial };

    const oldHalf = (oldEvt.half === 1 ? 1 : 2) as 1 | 2;
    const oldHalfKey = oldEvt.half === 1 ? '1' : '2';

    // 1. Revert old player stat
    if (oldEvt.team === 'home' && oldEvt.playerNo) {
      const oldPlayer = this.data.players.find((p) => Number(p.no) === Number(oldEvt.playerNo));
      if (oldPlayer) {
        if (oldEvt.type === 'recovery') {
          await this.updatePlayerStat(oldPlayer.id, `rec${oldHalfKey}`, -1);
        } else if (oldEvt.type === 'turnover') {
          await this.updatePlayerStat(oldPlayer.id, `loss${oldHalfKey}`, -1);
        } else if (oldEvt.type === 'foul') {
          await this.updatePlayerStat(oldPlayer.id, `fl${oldHalfKey}`, -1);
        } else if (oldEvt.type === 'shot') {
          await this.updatePlayerStat(oldPlayer.id, `sh${oldHalfKey}`, -1);
          if (oldEvt.outcome === 'goal') {
            await this.updatePlayerStat(oldPlayer.id, `gl${oldHalfKey}`, -1);
          }
        }
      }
    }

    if (oldEvt.type === 'foul' && (oldEvt.team === 'away' || !oldEvt.playerNo)) {
      await this.decrementFoul(oldEvt.team === 'home' ? 'home' : 'away', oldHalf);
    }
    if (oldEvt.outcome === 'goal' && (oldEvt.team === 'away' || !oldEvt.playerNo)) {
      const team = oldEvt.team === 'home' ? 'home' : 'away';
      await this.updateScore(team, oldHalf, -1);
    }

    // 2. Apply new player stat
    const newHalf = (newEvt.half === 1 ? 1 : 2) as 1 | 2;
    const newHalfKey = newEvt.half === 1 ? '1' : '2';

    if (newEvt.team === 'home' && newEvt.playerNo) {
      let newPlayer = this.data.players.find((p) => Number(p.no) === Number(newEvt.playerNo));
      if (!newPlayer) {
        const masterP = this.masterPlayers.find(mp => mp.noPunggung === Number(newEvt.playerNo));
        newPlayer = await api.addPlayer(this.data.match.id, {
          no: Number(newEvt.playerNo),
          name: masterP?.name || `Pemain #${newEvt.playerNo}`,
          isGk: masterP?.position === 'GK' ? 1 : 0
        });
        this.data.players = [...this.data.players, newPlayer];
      }

      if (newPlayer) {
        if (newEvt.type === 'recovery') {
          await this.updatePlayerStat(newPlayer.id, `rec${newHalfKey}`, 1);
        } else if (newEvt.type === 'turnover') {
          await this.updatePlayerStat(newPlayer.id, `loss${newHalfKey}`, 1);
        } else if (newEvt.type === 'foul') {
          await this.updatePlayerStat(newPlayer.id, `fl${newHalfKey}`, 1);
        } else if (newEvt.type === 'shot') {
          await this.updatePlayerStat(newPlayer.id, `sh${newHalfKey}`, 1);
          if (newEvt.outcome === 'goal') {
            await this.updatePlayerStat(newPlayer.id, `gl${newHalfKey}`, 1);
          }
        }
      }
    }

    if (newEvt.type === 'foul' && (newEvt.team === 'away' || !newEvt.playerNo)) {
      await this.incrementFoul(newEvt.team === 'home' ? 'home' : 'away', newHalf);
    }
    if (newEvt.outcome === 'goal') {
      this.triggerGoalCelebration();
      if (newEvt.team === 'away' || !newEvt.playerNo) {
        const team = newEvt.team === 'home' ? 'home' : 'away';
        await this.updateScore(team, newHalf, 1);
      }
    }

    Object.assign(evt, partial);
    await api.updateEvent(eventId, partial);
  }

  async deletePitchEvent(eventId: string) {
    if (!this.data) return;
    const evt = this.data.events.find((e) => e.id === eventId);
    
    // Reverse player stat & score & fouls if associated
    if (evt) {
      const half = (evt.half === 1 ? 1 : 2) as 1 | 2;
      const halfKey = evt.half === 1 ? '1' : '2';

      // 1. Revert Player Matrix Stats
      if (evt.team === 'home' && evt.playerNo) {
        const player = this.data.players.find((p) => Number(p.no) === Number(evt.playerNo));
        if (player) {
          if (evt.type === 'recovery') {
            await this.updatePlayerStat(player.id, `rec${halfKey}`, -1);
          } else if (evt.type === 'turnover') {
            await this.updatePlayerStat(player.id, `loss${halfKey}`, -1);
          } else if (evt.type === 'foul') {
            await this.updatePlayerStat(player.id, `fl${halfKey}`, -1);
          } else if (evt.type === 'shot') {
            await this.updatePlayerStat(player.id, `sh${halfKey}`, -1);
            if (evt.outcome === 'goal') {
              await this.updatePlayerStat(player.id, `gl${halfKey}`, -1);
            }
          }
        }
      }

      // 2. Revert scoreboard fouls
      if (evt.type === 'foul') {
        if (evt.team === 'away' || !evt.playerNo) {
          await this.decrementFoul(evt.team === 'home' ? 'home' : 'away', half);
        }
      }

      // 3. Revert scoreboard score
      if (evt.outcome === 'goal') {
        if (evt.team === 'away' || !evt.playerNo) {
          const team = evt.team === 'home' ? 'home' : 'away';
          await this.updateScore(team, half, -1);
        }
      }
    }

    this.data.events = this.data.events.filter((e) => e.id !== eventId);
    await api.deleteEvent(eventId);
  }

  // Clear all pitch events and atomically reset all player statistics and scoreboard metrics
  async clearAllPitchEvents() {
    if (!this.data) return;
    const matchId = this.data.match.id;

    // 1. Clear events from backend & local state
    await api.clearEvents(matchId);
    this.data.events = [];

    // 2. Reset all player matrix stats in local state & database
    for (const p of this.data.players) {
      p.loss1 = 0;
      p.loss2 = 0;
      p.rec1 = 0;
      p.rec2 = 0;
      p.fl1 = 0;
      p.fl2 = 0;
      p.sh1 = 0;
      p.sh2 = 0;
      p.gl1 = 0;
      p.gl2 = 0;
      await api.updatePlayer(p.id, {
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
      });
    }

    // 3. Reset scores and fouls in scoreboard
    this.data.match.homeScore1st = 0;
    this.data.match.homeScore2nd = 0;
    this.data.match.awayScore1st = 0;
    this.data.match.awayScore2nd = 0;
    this.data.match.homeFouls1st = 0;
    this.data.match.homeFouls2nd = 0;
    this.data.match.awayFouls1st = 0;
    this.data.match.awayFouls2nd = 0;

    await api.updateMatch(matchId, {
      homeScore1st: 0,
      homeScore2nd: 0,
      awayScore1st: 0,
      awayScore2nd: 0,
      homeFouls1st: 0,
      homeFouls2nd: 0,
      awayFouls1st: 0,
      awayFouls2nd: 0
    });
  }

  // Recalculate all player stats, scoreboard scores, and fouls strictly from current pitch events
  async recalculateAllStatsFromEvents() {
    if (!this.data) return;
    const matchId = this.data.match.id;
    const evts = this.data.events || [];

    // 1. Reset each player's stats accumulator
    const playerStatsMap: Record<number, {
      rec1: number; rec2: number;
      loss1: number; loss2: number;
      fl1: number; fl2: number;
      sh1: number; sh2: number;
      gl1: number; gl2: number;
    }> = {};

    for (const p of this.data.players) {
      playerStatsMap[p.id] = {
        rec1: 0, rec2: 0,
        loss1: 0, loss2: 0,
        fl1: 0, fl2: 0,
        sh1: 0, sh2: 0,
        gl1: 0, gl2: 0
      };
    }

    let hScore1 = 0;
    let hScore2 = 0;
    let aScore1 = 0;
    let aScore2 = 0;
    let hFouls1 = 0;
    let hFouls2 = 0;
    let aFouls1 = 0;
    let aFouls2 = 0;

    for (const e of evts) {
      const half = e.half === 1 ? 1 : 2;
      const isHome = e.team === 'home';

      // Player stats
      if (isHome && e.playerNo) {
        const player = this.data.players.find(p => Number(p.no) === Number(e.playerNo));
        if (player && playerStatsMap[player.id]) {
          const stats = playerStatsMap[player.id];
          if (e.type === 'recovery') {
            if (half === 1) stats.rec1++; else stats.rec2++;
          } else if (e.type === 'turnover') {
            if (half === 1) stats.loss1++; else stats.loss2++;
          } else if (e.type === 'foul') {
            if (half === 1) stats.fl1++; else stats.fl2++;
          } else if (e.type === 'shot') {
            if (half === 1) stats.sh1++; else stats.sh2++;
            if (e.outcome === 'goal') {
              if (half === 1) stats.gl1++; else stats.gl2++;
            }
          }
        }
      }

      // Match fouls
      if (e.type === 'foul') {
        if (isHome) {
          if (half === 1) hFouls1++; else hFouls2++;
        } else {
          if (half === 1) aFouls1++; else aFouls2++;
        }
      }

      // Match goals
      if (e.outcome === 'goal') {
        if (isHome) {
          if (half === 1) hScore1++; else hScore2++;
        } else {
          if (half === 1) aScore1++; else aScore2++;
        }
      }
    }

    // Apply to players
    for (const p of this.data.players) {
      const st = playerStatsMap[p.id];
      if (st) {
        Object.assign(p, st);
        await api.updatePlayer(p.id, st);
      }
    }

    // Apply to match
    this.data.match.homeScore1st = hScore1;
    this.data.match.homeScore2nd = hScore2;
    this.data.match.awayScore1st = aScore1;
    this.data.match.awayScore2nd = aScore2;
    this.data.match.homeFouls1st = Math.min(5, hFouls1);
    this.data.match.homeFouls2nd = Math.min(5, hFouls2);
    this.data.match.awayFouls1st = Math.min(5, aFouls1);
    this.data.match.awayFouls2nd = Math.min(5, aFouls2);

    await api.updateMatch(matchId, {
      homeScore1st: hScore1,
      homeScore2nd: hScore2,
      awayScore1st: aScore1,
      awayScore2nd: aScore2,
      homeFouls1st: Math.min(5, hFouls1),
      homeFouls2nd: Math.min(5, hFouls2),
      awayFouls1st: Math.min(5, aFouls1),
      awayFouls2nd: Math.min(5, aFouls2)
    });
  }

  // Pakets
  async savePakets(newPakets: Array<{ id?: number; paketIndex: number; code: string; playerNumbers: string; teamScope?: string }>) {
    if (!this.data) return;
    const scopedPakets = newPakets.map((p, idx) => ({
      id: p.id || idx + 1,
      matchId: this.data!.match.id,
      paketIndex: p.paketIndex,
      code: p.code,
      playerNumbers: p.playerNumbers,
      teamScope: p.teamScope || this.teamScope
    }));
    const res = await api.savePakets(this.data.match.id, scopedPakets);
    if (Array.isArray(res)) {
      this.data.pakets = res;
    } else {
      this.data.pakets = scopedPakets;
    }
  }

  triggerGoalCelebration() {
    try {
      HapticEngine.triggerGoal();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
  }
}

export const matchStore = new MatchStore();
