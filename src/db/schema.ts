import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name').default(''),
  city: text('city').default(''),
  logoUrl: text('logo_url').default('/icon.png'),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: text('team_id').references(() => teams.id).default('team_paser'),
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
  teamId: text('team_id').references(() => teams.id),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('coach'), // 'superadmin' | 'coach' | 'analyst' | 'player' | 'admin'
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url').default(''),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const masterPlayers = sqliteTable('master_players', {
  id: text('id').primaryKey(),
  teamId: text('team_id').references(() => teams.id).default('team_paser'),
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

export const gkStats = sqliteTable('gk_stats', {
  id: text('id').primaryKey(),
  matchId: integer('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  playerId: integer('player_id'),
  playerNo: integer('player_no').notNull().default(1),
  playerName: text('player_name').notNull().default('Goalkeeper'),
  minutesPlayed: text('minutes_played').notNull().default('40 minutes full match'),
  // Opponent shooting
  oppShotsOn1: integer('opp_shots_on_1').notNull().default(0),
  oppShotsOff1: integer('opp_shots_off_1').notNull().default(0),
  oppShotsOn2: integer('opp_shots_on_2').notNull().default(0),
  oppShotsOff2: integer('opp_shots_off_2').notNull().default(0),
  // Saves
  saveCatch: integer('save_catch').notNull().default(0),
  saveBlock: integer('save_block').notNull().default(0),
  saveCross: integer('save_cross').notNull().default(0),
  saveSplit: integer('save_split').notNull().default(0),
  saveDive: integer('save_dive').notNull().default(0),
  // Covering
  coveringZ1: integer('covering_z1').notNull().default(0),
  coveringZ2: integer('covering_z2').notNull().default(0),
  coveringZ3: integer('covering_z3').notNull().default(0),
  coveringZ4: integer('covering_z4').notNull().default(0),
  // Distribution Hand
  handShortSuccess: integer('hand_short_success').notNull().default(0),
  handShortFail: integer('hand_short_fail').notNull().default(0),
  handMidSuccess: integer('hand_mid_success').notNull().default(0),
  handMidFail: integer('hand_mid_fail').notNull().default(0),
  handLongSuccess: integer('hand_long_success').notNull().default(0),
  handLongFail: integer('hand_long_fail').notNull().default(0),
  // Distribution Feet
  feetShortSuccess: integer('feet_short_success').notNull().default(0),
  feetShortFail: integer('feet_short_fail').notNull().default(0),
  feetMidSuccess: integer('feet_mid_success').notNull().default(0),
  feetMidFail: integer('feet_mid_fail').notNull().default(0),
  feetLongSuccess: integer('feet_long_success').notNull().default(0),
  feetLongFail: integer('feet_long_fail').notNull().default(0),
  // Shooting & Assists
  shootingOpenPlay: integer('shooting_open_play').notNull().default(0),
  shootingDropKick: integer('shooting_drop_kick').notNull().default(0),
  shootingSetPlay: integer('shooting_set_play').notNull().default(0),
  assistThrowing: integer('assist_throwing').notNull().default(0),
  assistPassing: integer('assist_passing').notNull().default(0),
  // Conceded Goals Array (JSON)
  concededGoals: text('conceded_goals').notNull().default('[]'),
  // Qualitative & Tactical Notes
  anticipationNotes: text('anticipation_notes').default(''),
  reboundNotes: text('rebound_notes').default(''),
  secondPostNotes: text('second_post_notes').default(''),
  generalNotes: text('general_notes').default(''),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;
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
export type GkStat = typeof gkStats.$inferSelect;
export type InsertGkStat = typeof gkStats.$inferInsert;

