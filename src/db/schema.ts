import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().default('Match Analysis'),
  competition: text('competition').notNull().default('PASER FUTSAL CUP'),
  date: text('date').notNull().default('07/08/2024'),
  time: text('time').notNull().default('19:00'),
  venue: text('venue').notNull().default('Moncong Bulo'),
  homeTeam: text('home_team').notNull().default('Hewah Paser'),
  awayTeam: text('away_team').notNull().default('Lima Putra Jaya'),
  homeScore1st: integer('home_score_1st').notNull().default(0),
  homeScore2nd: integer('home_score_2nd').notNull().default(0),
  awayScore1st: integer('away_score_1st').notNull().default(0),
  awayScore2nd: integer('away_score_2nd').notNull().default(0),
  homeFouls1st: integer('home_fouls_1st').notNull().default(0),
  homeFouls2nd: integer('home_fouls_2nd').notNull().default(0),
  awayFouls1st: integer('away_fouls_1st').notNull().default(0),
  awayFouls2nd: integer('away_fouls_2nd').notNull().default(0),
  period: text('period').notNull().default('1'),
  timerRemaining: integer('timer_remaining').notNull().default(1200),
  timeouts: text('timeouts').notNull().default('[]'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matchId: integer('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  no: integer('no').notNull(),
  name: text('name').notNull(),
  isGk: integer('is_gk').notNull().default(0),
  yellowCards: integer('yellow_cards').notNull().default(0),
  redCards: integer('red_cards').notNull().default(0),
  loss1: integer('loss_1').notNull().default(0),
  loss2: integer('loss_2').notNull().default(0),
  rec1: integer('rec_1').notNull().default(0),
  rec2: integer('rec_2').notNull().default(0),
  fl1: integer('fl_1').notNull().default(0),
  fl2: integer('fl_2').notNull().default(0),
  sh1: integer('sh_1').notNull().default(0),
  sh2: integer('sh_2').notNull().default(0),
  gl1: integer('gl_1').notNull().default(0),
  gl2: integer('gl_2').notNull().default(0)
});

export const pitchEvents = sqliteTable('pitch_events', {
  id: text('id').primaryKey(),
  matchId: integer('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull().default('shot'), // shot, foul, turnover, recovery
  outcome: text('outcome').notNull().default('goal'), // goal, ontarget, out, rejected
  team: text('team').notNull().default('home'), // home, away
  half: integer('half').notNull().default(1),
  timeStr: text('time_str').notNull().default('00:00'),
  x: real('x').notNull(),
  y: real('y').notNull(),
  playerNo: integer('player_no'),
  note: text('note').notNull().default('')
});

export const lineupPakets = sqliteTable('lineup_pakets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matchId: integer('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  paketIndex: integer('paket_index').notNull(),
  code: text('code').notNull(),
  playerNumbers: text('player_numbers').notNull().default('[]')
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('coach'), // 'coach' | 'analyst' | 'player' | 'admin'
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url').default(''),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const masterPlayers = sqliteTable('master_players', {
  id: text('id').primaryKey(),
  noPunggung: integer('no_punggung').notNull(),
  name: text('name').notNull(),
  nickname: text('nickname').default(''),
  position: text('position').notNull().default('PLAYER'), // 'GK' | 'ANCHOR' | 'FLANK_LEFT' | 'FLANK_RIGHT' | 'PIVOT' | 'PLAYER'
  dominantFoot: text('dominant_foot').notNull().default('KANAN'), // 'KANAN' | 'KIRI' | 'KEDUA'
  height: integer('height').default(175),
  weight: integer('weight').default(68),
  photoUrl: text('photo_url').default(''),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INJURED' | 'SUSPENDED'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const substitutions = sqliteTable('substitutions', {
  id: text('id').primaryKey(),
  matchId: integer('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  half: integer('half').notNull().default(1),
  timeStr: text('time_str').notNull().default('20:00'),
  timerRemaining: integer('timer_remaining').notNull().default(1200),
  paketIndex: integer('paket_index'),
  playerNumbers: text('player_numbers').notNull().default('[]'),
  type: text('type').notNull().default('PAKET_DEPLOY'), // 'PAKET_DEPLOY' | 'INDIVIDUAL_SUB'
  note: text('note').default(''),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;
export type PitchEvent = typeof pitchEvents.$inferSelect;
export type InsertPitchEvent = typeof pitchEvents.$inferInsert;
export type LineupPaket = typeof lineupPakets.$inferSelect;
export type InsertLineupPaket = typeof lineupPakets.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MasterPlayer = typeof masterPlayers.$inferSelect;
export type InsertMasterPlayer = typeof masterPlayers.$inferInsert;
export type Substitution = typeof substitutions.$inferSelect;
export type InsertSubstitution = typeof substitutions.$inferInsert;

