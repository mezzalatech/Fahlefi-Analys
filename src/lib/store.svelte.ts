import { api, type MatchData, type User, type MasterPlayer, type SubstitutionLog } from './api';
import confetti from 'canvas-confetti';

class MatchStore {
  data = $state<MatchData | null>(null);
  loading = $state<boolean>(true);
  error = $state<string | null>(null);
  
  // Auth State
  currentUser = $state<User | null>(null);
  showLoginModal = $state<boolean>(false);

  // Master Players State
  masterPlayers = $state<MasterPlayer[]>([]);
  loadingMaster = $state<boolean>(false);

  // Multi-Match State
  matchesList = $state<any[]>([]);
  activeMatchId = $state<number>(1);
  showMatchManagerModal = $state<boolean>(false);

  // Substitution History State
  substitutions = $state<SubstitutionLog[]>([]);

  // UI & Timer State
  timerRunning = $state<boolean>(false);
  private timerInterval: any = null;
  activeHalf = $state<number>(1);
  activeTab = $state<'sheet' | 'matrix' | 'pitch' | 'pakets' | 'substitutions' | 'master_db'>('sheet');
  activePaketIndex = $state<number | null>(null);
  onPitchPlayers = $state<number[]>([]);

  constructor() {
    this.initAuth();
    this.initActiveMatch();
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
      if (savedUser && savedToken) {
        this.currentUser = JSON.parse(savedUser);
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

  async login(username: string, password: string) {
    const res = await api.login(username, password);
    this.currentUser = res.user;
    localStorage.setItem('ffta_current_user', JSON.stringify(res.user));
    localStorage.setItem('ffta_token', res.token);
    this.showLoginModal = false;
    return res.user;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('ffta_current_user');
    localStorage.removeItem('ffta_token');
    this.showLoginModal = true;
  }

  switchRole(role: 'coach' | 'analyst' | 'player') {
    const names = {
      coach: 'Coach Achmad Reza Fahlefi',
      analyst: 'Tactical Analyst & Scorer',
      player: 'Squad Player / Viewer'
    };
    this.currentUser = {
      id: `usr_${role}`,
      username: role,
      email: `${role}@fahlefi.com`,
      name: names[role],
      role: role,
      avatarUrl: role === 'coach' ? '/icon.png' : ''
    };
    localStorage.setItem('ffta_current_user', JSON.stringify(this.currentUser));
  }

  // Master Players Actions
  async loadMasterPlayers() {
    try {
      this.loadingMaster = true;
      const res = await api.getMasterPlayers();
      this.masterPlayers = res;
    } catch (err: any) {
      console.error('Failed to load master players:', err);
    } finally {
      this.loadingMaster = false;
    }
  }

  async createMasterPlayer(player: Partial<MasterPlayer>) {
    const created = await api.createMasterPlayer(player);
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

  // Multi-Match Actions
  async loadMatchesList() {
    try {
      const list = await api.getMatches();
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
    const created = await api.createMatch(matchData);
    await this.loadMatchesList();
    await this.switchMatch(created.id);
    return created;
  }

  async duplicateMatch(matchId: number) {
    const duplicated = await api.duplicateMatch(matchId);
    await this.loadMatchesList();
    await this.switchMatch(duplicated.id);
    return duplicated;
  }

  async deleteMatch(matchId: number) {
    await api.deleteMatch(matchId);
    await this.loadMatchesList();
    if (this.activeMatchId === matchId) {
      const nextMatch = this.matchesList[0];
      if (nextMatch) {
        await this.switchMatch(nextMatch.id);
      } else {
        await this.createNewMatch({ name: 'Match Analysis Baru' });
      }
    }
  }

  // Load Match & Subs
  async loadMatch(matchId?: number) {
    const mId = matchId ?? this.activeMatchId;
    this.activeMatchId = mId;
    try {
      this.loading = true;
      this.error = null;
      const res = await api.getMatch(mId);
      this.data = res;
      if (res.substitutions) {
        this.substitutions = res.substitutions;
      } else {
        this.loadSubstitutions(mId);
      }
      this.loadMasterPlayers();
      this.loadMatchesList();
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
    } catch (err) {
      console.error('Failed to load substitutions:', err);
    }
  }

  // Deploy coach's preset paket to active pitch
  async deployPaket(paketIndex: number) {
    if (!this.data) return;
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
    if (this.data) {
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
    } catch (err) {
      console.error('Failed to log substitution:', err);
    }
  }

  async deleteSubstitution(subId: string) {
    if (!this.data) return;
    try {
      await api.deleteSubstitution(this.data.match.id, subId);
      this.substitutions = this.substitutions.filter(s => s.id !== subId);
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

    // Check if goal was scored
    if (field.startsWith('gl') && delta > 0) {
      const half = field === 'gl1' ? 1 : 2;
      await this.updateScore('home', half, 1);
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
    const newEvent = await api.addEvent(this.data.match.id, event);
    this.data.events = [...this.data.events, newEvent];

    const half = (event.half === 1 ? 1 : 2) as 1 | 2;
    const halfKey = event.half === 1 ? '1' : '2';

    // Synchronize to Player Matrix Stats if home player is assigned
    if (event.team === 'home' && event.playerNo) {
      const player = this.data.players.find((p) => p.no === event.playerNo);
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
    } else if (event.type === 'foul') {
      await this.incrementFoul(event.team === 'home' ? 'home' : 'away', half);
    } else if (event.outcome === 'goal') {
      // Goal celebration & score update
      this.triggerGoalCelebration();
      const team = event.team === 'home' ? 'home' : 'away';
      await this.updateScore(team, half, 1);
    }
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
      const oldPlayer = this.data.players.find((p) => p.no === oldEvt.playerNo);
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
    } else if (oldEvt.type === 'foul') {
      await this.decrementFoul(oldEvt.team === 'home' ? 'home' : 'away', oldHalf);
    } else if (oldEvt.outcome === 'goal') {
      const team = oldEvt.team === 'home' ? 'home' : 'away';
      await this.updateScore(team, oldHalf, -1);
    }

    // 2. Apply new player stat
    const newHalf = (newEvt.half === 1 ? 1 : 2) as 1 | 2;
    const newHalfKey = newEvt.half === 1 ? '1' : '2';

    if (newEvt.team === 'home' && newEvt.playerNo) {
      const newPlayer = this.data.players.find((p) => p.no === newEvt.playerNo);
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
    } else if (newEvt.type === 'foul') {
      await this.incrementFoul(newEvt.team === 'home' ? 'home' : 'away', newHalf);
    } else if (newEvt.outcome === 'goal') {
      this.triggerGoalCelebration();
      const team = newEvt.team === 'home' ? 'home' : 'away';
      await this.updateScore(team, newHalf, 1);
    }

    Object.assign(evt, partial);
    await api.updateEvent(eventId, partial);
  }

  async deletePitchEvent(eventId: string) {
    if (!this.data) return;
    const evt = this.data.events.find((e) => e.id === eventId);
    
    // Reverse player stat if associated
    if (evt) {
      const half = (evt.half === 1 ? 1 : 2) as 1 | 2;
      const halfKey = evt.half === 1 ? '1' : '2';
      if (evt.team === 'home' && evt.playerNo) {
        const player = this.data.players.find((p) => p.no === evt.playerNo);
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
      } else if (evt.type === 'foul') {
        await this.decrementFoul(evt.team === 'home' ? 'home' : 'away', half);
      } else if (evt.outcome === 'goal') {
        const team = evt.team === 'home' ? 'home' : 'away';
        await this.updateScore(team, half, -1);
      }
    }

    await api.deleteEvent(eventId);
    this.data.events = this.data.events.filter((e) => e.id !== eventId);
  }

  // Pakets
  async savePakets(newPakets: Array<{ paketIndex: number; code: string; playerNumbers: string }>) {
    if (!this.data) return;
    const saved = await api.savePakets(this.data.match.id, newPakets);
    this.data.pakets = saved;
  }

  triggerGoalCelebration() {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
  }
}

export const matchStore = new MatchStore();
