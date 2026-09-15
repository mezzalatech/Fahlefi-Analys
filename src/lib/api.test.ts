import { describe, it, expect, beforeEach } from 'bun:test';
import { localDb, INITIAL_USERS, INITIAL_MASTER_PLAYERS } from './localDb';

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

describe('Fahlefi Tactical Local Database & Offline Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Authentication & RBAC', () => {
    it('should authenticate default coach account with valid credentials', async () => {
      const res = await localDb.login('coach', 'coach123');
      expect(res.user.username).toBe('coach');
      expect(res.user.role).toBe('coach');
      expect(res.token).toBeDefined();
    });

    it('should authenticate analyst account with valid credentials', async () => {
      const res = await localDb.login('analyst', 'analyst123');
      expect(res.user.username).toBe('analyst');
      expect(res.user.role).toBe('analyst');
    });

    it('should authenticate player account with valid credentials', async () => {
      const res = await localDb.login('player', 'player123');
      expect(res.user.username).toBe('player');
      expect(res.user.role).toBe('player');
    });

    it('should reject invalid password', async () => {
      expect(localDb.login('coach', 'wrongpass')).rejects.toThrow('Kata sandi salah.');
    });

    it('should reject non-existent username', async () => {
      expect(localDb.login('nonexistent', '123456')).rejects.toThrow('Username tidak ditemukan.');
    });
  });

  describe('User Management CRUD', () => {
    it('should list all initial users', async () => {
      const users = await localDb.getUsers();
      expect(users.length).toBeGreaterThanOrEqual(3);
    });

    it('should create a new user and allow login with new credentials', async () => {
      const newUser = await localDb.createUser({
        name: 'Asisten Pelatih Futsal',
        username: 'asisten',
        email: 'asisten@fahlefi.com',
        role: 'coach',
        password: 'asistenpass123'
      });

      expect(newUser.id).toBeDefined();
      expect(newUser.username).toBe('asisten');

      // Test login with new user
      const loginRes = await localDb.login('asisten', 'asistenpass123');
      expect(loginRes.user.name).toBe('Asisten Pelatih Futsal');
    });

    it('should update user information and password', async () => {
      const users = await localDb.getUsers();
      const target = users[0];

      const updated = await localDb.updateUser(target.id, {
        name: 'Coach Achmad Reza Fahlefi Updated',
        password: 'newcoachpass'
      });

      expect(updated.name).toBe('Coach Achmad Reza Fahlefi Updated');

      // Verify login with new password
      const loginRes = await localDb.login(target.username, 'newcoachpass');
      expect(loginRes.user.name).toBe('Coach Achmad Reza Fahlefi Updated');
    });

    it('should delete a user and prevent subsequent login', async () => {
      const tempUser = await localDb.createUser({
        name: 'User Sementara',
        username: 'temporary',
        password: 'temppassword'
      });

      await localDb.deleteUser(tempUser.id);
      expect(localDb.login('temporary', 'temppassword')).rejects.toThrow('Username tidak ditemukan.');
    });
  });

  describe('Master Squad Players (25 Player Roster)', () => {
    it('should load 25 squad players by default', async () => {
      const players = await localDb.getMasterPlayers();
      expect(players.length).toBe(25);
      expect(players[0].noPunggung).toBe(1);
      expect(players[24].noPunggung).toBe(25);
    });

    it('should create a new master player with sequential numbering', async () => {
      const newPlayer = await localDb.createMasterPlayer({
        noPunggung: 26,
        name: 'Pemain Tambahan',
        nickname: 'Tambahan',
        position: 'FLANK_RIGHT',
        status: 'ACTIVE'
      });

      expect(newPlayer.noPunggung).toBe(26);
      const players = await localDb.getMasterPlayers();
      expect(players.length).toBe(26);
    });

    it('should update player attributes and position', async () => {
      const players = await localDb.getMasterPlayers();
      const first = players[0];

      const updated = await localDb.updateMasterPlayer(first.id, {
        name: 'M. Rizky Pratama (Senior)',
        height: 185
      });

      expect(updated.name).toBe('M. Rizky Pratama (Senior)');
      expect(updated.height).toBe(185);
    });
  });

  describe('Match Management & Tactical Data', () => {
    it('should get default match data with 25 players and 4 pakets', async () => {
      const matchData = await localDb.getMatch(1);
      expect(matchData.match.id).toBe(1);
      expect(matchData.players.length).toBe(25);
      expect(matchData.pakets.length).toBe(4);
      expect(matchData.match.competition).toBe('Porprov Paser');
      expect(matchData.match.venue).toBe('GOR Sadurengas Paser');
    });

    it('should create and duplicate match', async () => {
      const newMatch = await localDb.createMatch({
        name: 'Final Porprov Paser',
        competition: 'Porprov Paser Final'
      });
      expect(newMatch.id).toBeDefined();

      const duplicated = await localDb.duplicateMatch(newMatch.id);
      expect(duplicated.id).toBeGreaterThan(newMatch.id);
      expect(duplicated.name).toContain('(Salinan)');
    });

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
