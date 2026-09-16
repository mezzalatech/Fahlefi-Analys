import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { localDb } from './localDb';

export const SUPABASE_URL_KEY = 'ffta_supabase_url';
export const SUPABASE_KEY_KEY = 'ffta_supabase_anon_key';

export function getStoredSupabaseConfig() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem(SUPABASE_URL_KEY) || '' : '';
  const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem(SUPABASE_KEY_KEY) || '' : '';

  return {
    url: (storedUrl || envUrl).trim(),
    key: (storedKey || envKey).trim(),
    source: storedUrl ? 'custom' : (envUrl ? 'env' : 'none')
  };
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getStoredSupabaseConfig();
  if (!url || !key) {
    cachedClient = null;
    cachedConfigKey = '';
    return null;
  }

  const currentKey = `${url}:::${key}`;
  if (cachedClient && cachedConfigKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      realtime: {
        params: {
          eventsPerSecond: 20
        }
      }
    });
    cachedConfigKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
  }
  cachedClient = null;
  cachedConfigKey = '';
}

export function clearSupabaseConfig() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_KEY_KEY);
  }
  cachedClient = null;
  cachedConfigKey = '';
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getStoredSupabaseConfig();
  return Boolean(url && key);
}

// Test Connection & Measure Latency
export async function testSupabaseConnection(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { ok: false, error: 'URL atau Anon Key Supabase belum diatur.' };
  }

  const start = performance.now();
  try {
    const { error } = await client.from('master_players').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      // Check if table missing
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { 
          ok: false, 
          latencyMs, 
          error: 'Tabel database belum dibuat di Supabase. Silakan jalankan Skrip SQL di SQL Editor Supabase.' 
        };
      }
      return { ok: false, latencyMs, error: error.message };
    }

    return { ok: true, latencyMs };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Gagal tersambung ke Supabase' };
  }
}

// Ultra-fast Realtime Broadcast Channel for Instant Futsal Sync
let realtimeChannel: any = null;
const broadcastListeners = new Set<(event: string, payload: any) => void>();

export function initRealtimeSync(onAnyChange?: (event: string, payload: any) => void) {
  if (onAnyChange) {
    broadcastListeners.add(onAnyChange);
  }

  const client = getSupabase();
  if (!client) return null;

  if (realtimeChannel) {
    return realtimeChannel;
  }

  realtimeChannel = client.channel('futsal_realtime_sync', {
    config: { broadcast: { self: false } }
  });

  // 1. Instant Peer Broadcast (Ultra-low latency for bench & analyst)
  realtimeChannel.on('broadcast', { event: 'futsal_action' }, (msg: any) => {
    const { event, payload } = msg.payload || {};
    if (event) {
      broadcastListeners.forEach(listener => {
        try { listener(event, payload); } catch (e) { console.error(e); }
      });
    }
  });

  // 2. Postgres Changes Realtime (Automatic database replication across devices)
  const tables = ['master_players', 'matches', 'players', 'pitch_events', 'lineup_pakets', 'substitutions', 'users'];
  tables.forEach(table => {
    realtimeChannel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload: any) => {
      broadcastListeners.forEach(listener => {
        try { listener(`db_${payload.eventType.toLowerCase()}_${table}`, payload); } catch (e) { console.error(e); }
      });
    });
  });

  realtimeChannel.subscribe((status: string) => {
    if (status === 'SUBSCRIBED') {
      console.log('⚡ Supabase Realtime channel connected! Live sync active.');
    }
  });

  return realtimeChannel;
}

export function broadcastFutsalAction(event: string, payload: any) {
  if (realtimeChannel) {
    realtimeChannel.send({
      type: 'broadcast',
      event: 'futsal_action',
      payload: { event, payload, timestamp: Date.now() }
    });
  }
}

// 1-Click Data Migration from MacBook LocalDB to Supabase
export async function migrateLocalToSupabase(): Promise<{ success: boolean; stats: any; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, stats: null, error: 'Supabase belum terkonfigurasi.' };
  }

  try {
    const masterPlayers = await localDb.getMasterPlayers();
    const matches = JSON.parse(localStorage.getItem('ffta_offline_matches') || '[]');
    const users = await localDb.getUsers();

    let uploadedMaster = 0;
    let uploadedMatches = 0;
    let uploadedPlayers = 0;
    let uploadedEvents = 0;
    let uploadedPakets = 0;
    let uploadedSubs = 0;
    let uploadedUsers = 0;

    // 1. Migrate Users
    if (users.length > 0) {
      const passwords = JSON.parse(localStorage.getItem('ffta_offline_passwords') || '{}');
      const userRows = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        password_hash: passwords[u.username.toLowerCase()] || `${u.username}123`,
        avatar_url: u.avatarUrl || ''
      }));
      const { error } = await client.from('users').upsert(userRows, { onConflict: 'username' });
      if (error) throw new Error(`Gagal migrasi users: ${error.message}`);
      uploadedUsers = userRows.length;
    }

    // 2. Migrate Master Players
    if (masterPlayers.length > 0) {
      const playerRows = masterPlayers.map(p => ({
        id: p.id,
        no_punggung: p.noPunggung,
        name: p.name,
        nickname: p.nickname || '',
        position: p.position || 'PLAYER',
        dominant_foot: p.dominantFoot || 'KANAN',
        height: p.height || 175,
        weight: p.weight || 68,
        photo_url: p.photoUrl || '',
        status: p.status || 'ACTIVE'
      }));
      const { error } = await client.from('master_players').upsert(playerRows, { onConflict: 'id' });
      if (error) throw new Error(`Gagal migrasi master players: ${error.message}`);
      uploadedMaster = playerRows.length;
    }

    // 3. Migrate Matches and relations
    for (const m of matches) {
      const mData = m.match;
      const matchRow = {
        id: mData.id,
        name: mData.name,
        competition: mData.competition,
        date: mData.date,
        time: mData.time,
        venue: mData.venue,
        home_team: mData.homeTeam,
        away_team: mData.awayTeam,
        home_score_1st: mData.homeScore1st || 0,
        home_score_2nd: mData.homeScore2nd || 0,
        away_score_1st: mData.awayScore1st || 0,
        away_score_2nd: mData.awayScore2nd || 0,
        home_fouls_1st: mData.homeFouls1st || 0,
        home_fouls_2nd: mData.homeFouls2nd || 0,
        away_fouls_1st: mData.awayFouls1st || 0,
        away_fouls_2nd: mData.awayFouls2nd || 0,
        period: mData.period || '1',
        timer_remaining: mData.timerRemaining || 1200,
        timeouts: typeof mData.timeouts === 'string' ? mData.timeouts : JSON.stringify(mData.timeouts || {})
      };
      const { error: mErr } = await client.from('matches').upsert(matchRow, { onConflict: 'id' });
      if (mErr) throw new Error(`Gagal migrasi match #${mData.id}: ${mErr.message}`);
      uploadedMatches++;

      // Squad players
      if (m.players && m.players.length > 0) {
        const pRows = m.players.map((p: any) => ({
          id: p.id,
          match_id: mData.id,
          no: p.no,
          name: p.name,
          is_gk: p.isGk ? 1 : 0,
          yellow_cards: p.yellowCards || 0,
          red_cards: p.redCards || 0,
          loss_1: p.loss1 || 0,
          loss_2: p.loss2 || 0,
          rec_1: p.rec1 || 0,
          rec_2: p.rec2 || 0,
          fl_1: p.fl1 || 0,
          fl_2: p.fl2 || 0,
          sh_1: p.sh1 || 0,
          sh_2: p.sh2 || 0,
          gl_1: p.gl1 || 0,
          gl_2: p.gl2 || 0
        }));
        const { error: pErr } = await client.from('players').upsert(pRows, { onConflict: 'id' });
        if (pErr) console.warn('Pemain match warning:', pErr);
        else uploadedPlayers += pRows.length;
      }

      // Pakets
      if (m.pakets && m.pakets.length > 0) {
        const pktRows = m.pakets.map((pkt: any) => ({
          id: pkt.id,
          match_id: mData.id,
          paket_index: pkt.paketIndex,
          code: pkt.code,
          player_numbers: pkt.playerNumbers
        }));
        const { error: pktErr } = await client.from('lineup_pakets').upsert(pktRows, { onConflict: 'id' });
        if (pktErr) console.warn('Pakets warning:', pktErr);
        else uploadedPakets += pktRows.length;
      }

      // Events
      if (m.events && m.events.length > 0) {
        const evRows = m.events.map((e: any) => ({
          id: e.id,
          match_id: mData.id,
          type: e.type,
          outcome: e.outcome,
          team: e.team,
          half: e.half,
          time_str: e.timeStr,
          x: e.x,
          y: e.y,
          player_no: e.playerNo,
          note: e.note || ''
        }));
        const { error: evErr } = await client.from('pitch_events').upsert(evRows, { onConflict: 'id' });
        if (evErr) console.warn('Events warning:', evErr);
        else uploadedEvents += evRows.length;
      }

      // Subs
      if (m.substitutions && m.substitutions.length > 0) {
        const subRows = m.substitutions.map((s: any) => ({
          id: s.id,
          match_id: mData.id,
          half: s.half,
          time_str: s.timeStr,
          timer_remaining: s.timerRemaining,
          paket_index: s.paketIndex,
          player_numbers: s.playerNumbers,
          type: s.type,
          note: s.note || ''
        }));
        const { error: sErr } = await client.from('substitutions').upsert(subRows, { onConflict: 'id' });
        if (sErr) console.warn('Subs warning:', sErr);
        else uploadedSubs += subRows.length;
      }
    }

    broadcastFutsalAction('migration_completed', { timestamp: Date.now() });

    return {
      success: true,
      stats: {
        uploadedMaster,
        uploadedMatches,
        uploadedPlayers,
        uploadedEvents,
        uploadedPakets,
        uploadedSubs,
        uploadedUsers
      }
    };
  } catch (err: any) {
    return { success: false, stats: null, error: err.message || 'Gagal migrasi ke Supabase' };
  }
}

// Ready-to-use SQL Schema for Supabase SQL Editor
export const SUPABASE_SQL_SETUP = `-- ==========================================
-- FAHLEFI FUTSAL ANALYTICS - SUPABASE SCHEMA
-- Jalankan skrip ini di menu SQL Editor Supabase
-- ==========================================

-- 1. Master Pemain (Database Skuad Utama)
CREATE TABLE IF NOT EXISTS public.master_players (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pertandingan (Matches)
CREATE TABLE IF NOT EXISTS public.matches (
  id BIGINT PRIMARY KEY,
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
  timeouts TEXT NOT NULL DEFAULT '{"home1":false,"home2":false,"away1":false,"away2":false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pemain di Laga (Match Players Stats)
CREATE TABLE IF NOT EXISTS public.players (
  id BIGINT PRIMARY KEY,
  match_id BIGINT REFERENCES public.matches(id) ON DELETE CASCADE,
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

-- 4. Event Aksi Lapangan (Pitch Events Tagging)
CREATE TABLE IF NOT EXISTS public.pitch_events (
  id TEXT PRIMARY KEY,
  match_id BIGINT REFERENCES public.matches(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'shot',
  outcome TEXT NOT NULL DEFAULT 'goal',
  team TEXT NOT NULL DEFAULT 'home',
  half INTEGER NOT NULL DEFAULT 1,
  time_str TEXT NOT NULL DEFAULT '00:00',
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  player_no INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Paket Rotasi 5 Pemain (Lineup Pakets)
CREATE TABLE IF NOT EXISTS public.lineup_pakets (
  id BIGINT PRIMARY KEY,
  match_id BIGINT REFERENCES public.matches(id) ON DELETE CASCADE,
  paket_index INTEGER NOT NULL,
  code TEXT NOT NULL,
  player_numbers TEXT NOT NULL DEFAULT '[]'
);

-- 6. Log Pergantian & Rotasi (Substitutions)
CREATE TABLE IF NOT EXISTS public.substitutions (
  id TEXT PRIMARY KEY,
  match_id BIGINT REFERENCES public.matches(id) ON DELETE CASCADE,
  half INTEGER NOT NULL DEFAULT 1,
  time_str TEXT NOT NULL DEFAULT '20:00',
  timer_remaining INTEGER NOT NULL DEFAULT 1200,
  paket_index INTEGER,
  player_numbers TEXT NOT NULL DEFAULT '[]',
  type TEXT NOT NULL DEFAULT 'PAKET_DEPLOY',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Pengguna & RBAC (Users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach',
  password_hash TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AKTIFKAN REALTIME REPLICATION UNTUK SEMUA TABEL
ALTER PUBLICATION supabase_realtime ADD TABLE public.master_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pitch_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lineup_pakets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.substitutions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- AKTIFKAN AKSES PUBLIK ANON (Untuk App Futsal)
ALTER TABLE public.master_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_pakets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write master_players" ON public.master_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write pitch_events" ON public.pitch_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write lineup_pakets" ON public.lineup_pakets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write substitutions" ON public.substitutions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write users" ON public.users FOR ALL USING (true) WITH CHECK (true);
`;
