import { describe, it, expect, beforeEach } from 'bun:test';
import { localDb, INITIAL_USERS, INITIAL_MASTER_PLAYERS, INITIAL_TEAMS } from './localDb';

// Mock localStorage for Bun test environment if needed
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index: number) => Array.from(store.keys())[index] || null
  };
}

describe('Fahlefi Tactical Multi-Tenant & Offline Database Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Authentication & Multi-Tenant Roles', () => {
    it('should authenticate Super Admin account with admin credentials', async () => {
      const res = await localDb.login('admin', 'admin123');
      expect(res.user.username).toBe('admin');
      expect(res.user.role).toBe('superadmin');
      expect(res.token).toBeDefined();
    });

    it('should authenticate Porprov Paser coach account', async () => {
      const res = await localDb.login('coach', 'coach123');
      expect(res.user.username).toBe('coach');
      expect(res.user.role).toBe('coach');
      expect(res.user.teamId).toBe('team_paser');
      expect(res.user.teamName).toBe('Porprov Paser');
      expect(res.token).toBeDefined();
    });

    it('should authenticate Nazara FC coach account', async () => {
      const res = await localDb.login('coach_nazara', 'nazara123');
      expect(res.user.username).toBe('coach_nazara');
      expect(res.user.role).toBe('coach');
      expect(res.user.teamId).toBe('team_nazara');
      expect(res.user.teamName).toBe('Nazara FC');
    });

    it('should reject invalid password', async () => {
      expect(localDb.login('coach', 'wrongpass')).rejects.toThrow('Kata sandi salah.');
    });

    it('should reject non-existent username', async () => {
      expect(localDb.login('nonexistent', '123456')).rejects.toThrow('Username tidak ditemukan.');
    });
  });

  describe('Team Management (Multi-Tenancy CRUD)', () => {
    it('should list all registered teams (Porprov Paser & Nazara FC)', async () => {
      const teams = await localDb.getTeams();
      expect(teams.length).toBeGreaterThanOrEqual(2);
      expect(teams.some(t => t.id === 'team_paser')).toBe(true);
      expect(teams.some(t => t.id === 'team_nazara')).toBe(true);
    });

    it('should create a new club/team', async () => {
      const newTeam = await localDb.createTeam({
        name: 'Giga FC Kota',
        shortName: 'GIGA',
        city: 'Balikpapan',
        status: 'ACTIVE'
      });

      expect(newTeam.id).toBeDefined();
      expect(newTeam.name).toBe('Giga FC Kota');

      const teams = await localDb.getTeams();
      expect(teams.some(t => t.id === newTeam.id)).toBe(true);
    });

    it('should update team details', async () => {
      const teams = await localDb.getTeams();
      const target = teams[0];

      const updated = await localDb.updateTeam(target.id, {
        city: 'Kota Paser Tanah Grogot'
      });

      expect(updated.city).toBe('Kota Paser Tanah Grogot');
    });
  });

  describe('User Management CRUD by Team', () => {
    it('should create a new user for specific team and allow login', async () => {
      const newUser = await localDb.createUser({
        name: 'Asisten Pelatih Nazara',
        username: 'asisten_nazara',
        email: 'asisten@nazara.com',
        role: 'coach',
        teamId: 'team_nazara',
        password: 'nazaraasisten123'
      });

      expect(newUser.id).toBeDefined();
      expect(newUser.teamId).toBe('team_nazara');

      const loginRes = await localDb.login('asisten_nazara', 'nazaraasisten123');
      expect(loginRes.user.name).toBe('Asisten Pelatih Nazara');
      expect(loginRes.user.teamName).toBe('Nazara FC');
    });

    it('should filter users by team', async () => {
      const paserUsers = await localDb.getUsers('team_paser');
      expect(paserUsers.every(u => u.teamId === 'team_paser')).toBe(true);

      const nazaraUsers = await localDb.getUsers('team_nazara');
      expect(nazaraUsers.every(u => u.teamId === 'team_nazara')).toBe(true);
    });
  });

  describe('Data Privacy & Isolation (Master Squad & Matches)', () => {
    it('should isolate master players per team', async () => {
      const paserPlayers = await localDb.getMasterPlayers('team_paser');
      expect(paserPlayers.length).toBe(20);
      expect(paserPlayers.every(p => p.teamId === 'team_paser')).toBe(true);

      const nazaraPlayers = await localDb.getMasterPlayers('team_nazara');
      expect(nazaraPlayers.length).toBe(7);
      expect(nazaraPlayers.every(p => p.teamId === 'team_nazara')).toBe(true);
    });

    it('should isolate match records per team', async () => {
      const paserMatches = await localDb.getMatches('team_paser');
      expect(paserMatches.length).toBeGreaterThanOrEqual(1);
      expect(paserMatches.every(m => m.teamId === 'team_paser')).toBe(true);

      const nazaraMatches = await localDb.getMatches('team_nazara');
      expect(nazaraMatches.length).toBeGreaterThanOrEqual(1);
      expect(nazaraMatches.every(m => m.teamId === 'team_nazara')).toBe(true);
    });

    it('should create match tagged to specific team', async () => {
      const match = await localDb.createMatch({
        name: 'Semi Final Nazara',
        competition: 'Paser Cup'
      }, 'team_nazara');

      expect(match.teamId).toBe('team_nazara');

      const nazaraMatches = await localDb.getMatches('team_nazara');
      expect(nazaraMatches.some(m => m.id === match.id)).toBe(true);

      const paserMatches = await localDb.getMatches('team_paser');
      expect(paserMatches.some(m => m.id === match.id)).toBe(false);
    });
  });

  describe('Tactical Match Tagging & Substitutions', () => {
    it('should log substitutions and retrieve timeline', async () => {
      const sub = await localDb.logSubstitution(1, {
        half: 1,
        timeStr: '15:20',
        timerRemaining: 920,
        paketIndex: 1,
        playerNumbers: JSON.stringify([1, 4, 10, 11, 9]),
        type: 'PAKET_DEPLOY',
        note: 'Rotasi Taktik Menyerang'
      });

      expect(sub.id).toBeDefined();
      const subs = await localDb.getSubstitutions(1);
      expect(subs.length).toBeGreaterThanOrEqual(1);
      expect(subs[0].timeStr).toBe('15:20');
    });

    it('should add, update, and delete pitch events', async () => {
      const ev = await localDb.addEvent(1, {
        type: 'shot',
        outcome: 'goal',
        team: 'home',
        half: 1,
        timeStr: '12:30',
        x: 650,
        y: 240,
        playerNo: 10,
        note: 'Gol tendangan keras kaki kiri'
      });

      expect(ev.id).toBeDefined();

      await localDb.updateEvent(ev.id, { outcome: 'saved' });
      const match = await localDb.getMatch(1);
      const found = match.events.find(e => e.id === ev.id);
      expect(found?.outcome).toBe('saved');

      await localDb.deleteEvent(ev.id);
      const matchAfter = await localDb.getMatch(1);
      expect(matchAfter.events.some(e => e.id === ev.id)).toBe(false);
    });
  });
});
