import { db, sqlite } from './index';
import { matches, players, pitchEvents, lineupPakets, masterPlayers } from './schema';
import { count } from 'drizzle-orm';

export async function initDb() {
  // Create tables directly if not already created
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT DEFAULT '',
      city TEXT DEFAULT '',
      logo_url TEXT DEFAULT '/icon.png',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id TEXT DEFAULT 'team_paser',
      name TEXT NOT NULL DEFAULT 'Match Analysis',
      competition TEXT NOT NULL DEFAULT 'PASER FUTSAL CUP',
      date TEXT NOT NULL DEFAULT '07/08/2024',
      time TEXT NOT NULL DEFAULT '19:00',
      venue TEXT NOT NULL DEFAULT 'Moncong Bulo',
      home_team TEXT NOT NULL DEFAULT 'Hewah Paser',
      away_team TEXT NOT NULL DEFAULT 'Lima Putra Jaya',
      home_score_1st INTEGER NOT NULL DEFAULT 0,
      home_score_2nd INTEGER NOT NULL DEFAULT 0,
      away_score_1st INTEGER NOT NULL DEFAULT 0,
      away_score_2nd INTEGER NOT NULL DEFAULT 0,
      home_fouls_1st INTEGER NOT NULL DEFAULT 0,
      home_fouls_2nd INTEGER NOT NULL DEFAULT 0,
      away_fouls_1st INTEGER NOT NULL DEFAULT 0,
      away_fouls_2nd INTEGER NOT NULL DEFAULT 0,
      period TEXT NOT NULL DEFAULT '1',
      timer_remaining INTEGER NOT NULL DEFAULT 1200,
      timeouts TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      no INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_gk INTEGER NOT NULL DEFAULT 0,
      yellow_cards INTEGER NOT NULL DEFAULT 0,
      red_cards INTEGER NOT NULL DEFAULT 0,
      loss_1 INTEGER NOT NULL DEFAULT 0,
      loss_2 INTEGER NOT NULL DEFAULT 0,
      rec_1 INTEGER NOT NULL DEFAULT 0,
      rec_2 INTEGER NOT NULL DEFAULT 0,
      fl_1 INTEGER NOT NULL DEFAULT 0,
      fl_2 INTEGER NOT NULL DEFAULT 0,
      sh_1 INTEGER NOT NULL DEFAULT 0,
      sh_2 INTEGER NOT NULL DEFAULT 0,
      gl_1 INTEGER NOT NULL DEFAULT 0,
      gl_2 INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pitch_events (
      id TEXT PRIMARY KEY,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'shot',
      outcome TEXT NOT NULL DEFAULT 'goal',
      team TEXT NOT NULL DEFAULT 'home',
      half INTEGER NOT NULL DEFAULT 1,
      time_str TEXT NOT NULL DEFAULT '00:00',
      x REAL NOT NULL,
      y REAL NOT NULL,
      player_no INTEGER,
      note TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS lineup_pakets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      paket_index INTEGER NOT NULL,
      code TEXT NOT NULL,
      player_numbers TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'coach',
      password_hash TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS master_players (
      id TEXT PRIMARY KEY,
      no_punggung INTEGER NOT NULL,
      name TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      position TEXT NOT NULL DEFAULT 'PLAYER',
      dominant_foot TEXT NOT NULL DEFAULT 'KANAN',
      height INTEGER DEFAULT 175,
      weight INTEGER DEFAULT 68,
      photo_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS substitutions (
      id TEXT PRIMARY KEY,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      half INTEGER NOT NULL DEFAULT 1,
      time_str TEXT NOT NULL DEFAULT '20:00',
      timer_remaining INTEGER NOT NULL DEFAULT 1200,
      paket_index INTEGER,
      player_numbers TEXT NOT NULL DEFAULT '[]',
      type TEXT NOT NULL DEFAULT 'PAKET_DEPLOY',
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gk_stats (
      id TEXT PRIMARY KEY,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      player_id INTEGER,
      player_no INTEGER NOT NULL DEFAULT 1,
      player_name TEXT NOT NULL DEFAULT 'Goalkeeper',
      minutes_played TEXT NOT NULL DEFAULT '40 minutes full match',
      opp_shots_on_1 INTEGER NOT NULL DEFAULT 0,
      opp_shots_off_1 INTEGER NOT NULL DEFAULT 0,
      opp_shots_on_2 INTEGER NOT NULL DEFAULT 0,
      opp_shots_off_2 INTEGER NOT NULL DEFAULT 0,
      save_catch INTEGER NOT NULL DEFAULT 0,
      save_block INTEGER NOT NULL DEFAULT 0,
      save_cross INTEGER NOT NULL DEFAULT 0,
      save_split INTEGER NOT NULL DEFAULT 0,
      save_dive INTEGER NOT NULL DEFAULT 0,
      covering_z1 INTEGER NOT NULL DEFAULT 0,
      covering_z2 INTEGER NOT NULL DEFAULT 0,
      covering_z3 INTEGER NOT NULL DEFAULT 0,
      covering_z4 INTEGER NOT NULL DEFAULT 0,
      hand_short_success INTEGER NOT NULL DEFAULT 0,
      hand_short_fail INTEGER NOT NULL DEFAULT 0,
      hand_mid_success INTEGER NOT NULL DEFAULT 0,
      hand_mid_fail INTEGER NOT NULL DEFAULT 0,
      hand_long_success INTEGER NOT NULL DEFAULT 0,
      hand_long_fail INTEGER NOT NULL DEFAULT 0,
      feet_short_success INTEGER NOT NULL DEFAULT 0,
      feet_short_fail INTEGER NOT NULL DEFAULT 0,
      feet_mid_success INTEGER NOT NULL DEFAULT 0,
      feet_mid_fail INTEGER NOT NULL DEFAULT 0,
      feet_long_success INTEGER NOT NULL DEFAULT 0,
      feet_long_fail INTEGER NOT NULL DEFAULT 0,
      shooting_open_play INTEGER NOT NULL DEFAULT 0,
      shooting_drop_kick INTEGER NOT NULL DEFAULT 0,
      shooting_set_play INTEGER NOT NULL DEFAULT 0,
      assist_throwing INTEGER NOT NULL DEFAULT 0,
      assist_passing INTEGER NOT NULL DEFAULT 0,
      conceded_goals TEXT NOT NULL DEFAULT '[]',
      anticipation_notes TEXT DEFAULT '',
      rebound_notes TEXT DEFAULT '',
      second_post_notes TEXT DEFAULT '',
      general_notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe ALTER TABLE additions for existing sqlite databases
  try { sqlite.run(`ALTER TABLE matches ADD COLUMN team_id TEXT DEFAULT 'team_paser';`); } catch {}
  try { sqlite.run(`ALTER TABLE master_players ADD COLUMN team_id TEXT DEFAULT 'team_paser';`); } catch {}
  try { sqlite.run(`ALTER TABLE users ADD COLUMN team_id TEXT;`); } catch {}

  // Seed default demo users if none exist
  const userCount = sqlite.query('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    console.log('Seeding initial demo user accounts...');
    const demoUsers = [
      { id: 'usr_coach', username: 'coach', email: 'coach@fahlefi.com', name: 'Coach Achmad Reza Fahlefi', role: 'coach', passwordHash: 'coach123', avatarUrl: '/icon.png' },
      { id: 'usr_analyst', username: 'analyst', email: 'analyst@fahlefi.com', name: 'Tactical Analyst & Scorer', role: 'analyst', passwordHash: 'analyst123', avatarUrl: '' },
      { id: 'usr_player', username: 'player', email: 'player@fahlefi.com', name: 'Squad Player / Viewer', role: 'player', passwordHash: 'player123', avatarUrl: '' }
    ];
    for (const u of demoUsers) {
      sqlite.run(`INSERT INTO users (id, username, email, name, role, password_hash, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.username, u.email, u.name, u.role, u.passwordHash, u.avatarUrl]
      );
    }
  }

  // Seed master squad players if none exist (25 players)
  const masterCount = sqlite.query('SELECT count(*) as count FROM master_players').get() as { count: number };
  if (masterCount.count < 25) {
    console.log('Seeding / updating master players roster to 25 players...');
    const initialMaster = [
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
      { id: 'mp_18', noPunggung: 18, name: 'Hendra Wijaya', nickname: 'Hendra', position: 'PIVOT', dominantFoot: 'KANAN', height: 180, weight: 75, status: 'ACTIVE' },
      { id: 'mp_19', noPunggung: 19, name: 'Rizky Fauzi', nickname: 'Fauzi', position: 'FLANK_RIGHT', dominantFoot: 'KANAN', height: 171, weight: 65, status: 'ACTIVE' },
      { id: 'mp_20', noPunggung: 20, name: 'Bayu Pratama', nickname: 'Bayu', position: 'ANCHOR', dominantFoot: 'KIRI', height: 177, weight: 71, status: 'ACTIVE' },
      { id: 'mp_21', noPunggung: 21, name: 'Tegar Prasetyo', nickname: 'Tegar', position: 'PLAYER', dominantFoot: 'KANAN', height: 174, weight: 68, status: 'ACTIVE' },
      { id: 'mp_22', noPunggung: 22, name: 'Eko Prasetya', nickname: 'Eko', position: 'GK', dominantFoot: 'KANAN', height: 183, weight: 77, status: 'ACTIVE' },
      { id: 'mp_23', noPunggung: 23, name: 'Satria Ramadhan', nickname: 'Satria', position: 'PLAYER', dominantFoot: 'KANAN', height: 176, weight: 69, status: 'ACTIVE' },
      { id: 'mp_24', noPunggung: 24, name: 'Faisal Akbar', nickname: 'Faisal', position: 'FLANK_LEFT', dominantFoot: 'KIRI', height: 172, weight: 64, status: 'ACTIVE' },
      { id: 'mp_25', noPunggung: 25, name: 'Dani Setiawan', nickname: 'Dani', position: 'PLAYER', dominantFoot: 'KANAN', height: 175, weight: 68, status: 'ACTIVE' }
    ];
    for (const p of initialMaster) {
      sqlite.run(`INSERT OR IGNORE INTO master_players (id, no_punggung, name, nickname, position, dominant_foot, height, weight, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.noPunggung, p.name, p.nickname, p.position, p.dominantFoot, p.height, p.weight, p.status]
      );
    }
  }

  const matchCount = db.select({ value: count() }).from(matches).get()?.value ?? 0;

  if (matchCount === 0) {
    console.log('Seeding initial match data...');
    
    // Insert clean initial match template
    const insertedMatch = db.insert(matches).values({
      name: 'Paser Futsal Cup - Match 1',
      competition: 'PASER FUTSAL CUP 2024',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      venue: 'Moncong Bulo Stadium',
      homeTeam: 'Hewah Paser',
      awayTeam: 'Lima Putra Jaya',
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
      timeouts: JSON.stringify(['', '', '', ''])
    }).returning().get();

    const matchId = insertedMatch.id;

    // Insert 25 player slots
    for (let i = 1; i <= 25; i++) {
      db.insert(players).values({
        matchId,
        no: i,
        name: '',
        isGk: i === 1 || i === 2 ? 1 : 0,
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
      }).run();
    }

    // Insert 9 empty Pakets
    for (let i = 1; i <= 9; i++) {
      db.insert(lineupPakets).values({
        matchId,
        paketIndex: i,
        code: '',
        playerNumbers: '[]'
      }).run();
    }

    // Insert initial pitch events
    const initialEvents = [
      { id: 'e1', matchId, type: 'shot', outcome: 'goal', team: 'home', half: 1, timeStr: '08:14', x: 670, y: 240, playerNo: 8, note: 'Gol #8 Zikri Babak 1' },
      { id: 'e2', matchId, type: 'shot', outcome: 'ontarget', team: 'home', half: 2, timeStr: '14:22', x: 620, y: 170, playerNo: 4, note: 'Shot On Target Galang' },
      { id: 'e3', matchId, type: 'shot', outcome: 'out', team: 'home', half: 1, timeStr: '03:45', x: 590, y: 310, playerNo: 6, note: 'Shot Out Ibnu' },
      { id: 'e4', matchId, type: 'shot', outcome: 'rejected', team: 'home', half: 2, timeStr: '11:05', x: 640, y: 130, playerNo: 7, note: 'Blocked Shot Ryan' },
      { id: 'e5', matchId, type: 'shot', outcome: 'goal', team: 'away', half: 2, timeStr: '16:50', x: 130, y: 220, playerNo: 0, note: 'Gol Lawan Babak 2' }
    ];

    for (const evt of initialEvents) {
      db.insert(pitchEvents).values(evt).run();
    }

    console.log('Database seeded successfully!');
  }

  // Ensure all existing matches have up to 25 player slots
  const allExistingMatches = db.select().from(matches).all();
  const allExistingPlayers = db.select().from(players).all();
  const masterRoster = db.select().from(masterPlayers).orderBy(masterPlayers.noPunggung).all();

  for (const m of allExistingMatches) {
    const matchPls = allExistingPlayers.filter(p => p.matchId === m.id);
    const existingNos = new Set(matchPls.map(p => p.no));
    for (let i = 1; i <= 25; i++) {
      if (!existingNos.has(i)) {
        const mp = masterRoster.find(p => p.noPunggung === i);
        db.insert(players).values({
          matchId: m.id,
          no: i,
          name: mp ? mp.name : '',
          isGk: mp ? (mp.position === 'GK' ? 1 : 0) : (i === 1 || i === 2 || i === 22 ? 1 : 0),
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
        }).run();
      }
    }
  }
}

// Run directly if called as a script
if (import.meta.main) {
  await initDb();
}
