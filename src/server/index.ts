import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { db } from '../db';
import { matches, players, pitchEvents, lineupPakets, users, masterPlayers, substitutions } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { initDb } from '../db/seed';
import { exportMatchToExcel } from './services/excel';

// Initialize DB schema & seed on startup if needed
await initDb();

export const app = new Elysia({ prefix: '/api' })
  .use(cors())

  // ==========================================
  // AUTH & USER MANAGEMENT
  // ==========================================
  .post('/auth/login', async ({ body, error }) => {
    const { username, password } = body as { username?: string; password?: string };
    if (!username || !password) return error(400, 'Username and password required');

    const user = db.select().from(users).where(eq(users.username, username.trim().toLowerCase())).get();
    if (!user || user.passwordHash !== password) {
      // Also check by role for demo convenience
      const userByRole = db.select().from(users).where(eq(users.role, username.trim().toLowerCase())).get();
      if (userByRole && userByRole.passwordHash === password) {
        return {
          user: {
            id: userByRole.id,
            username: userByRole.username,
            email: userByRole.email,
            name: userByRole.name,
            role: userByRole.role,
            avatarUrl: userByRole.avatarUrl
          },
          token: `token_${userByRole.id}_${Date.now()}`
        };
      }
      return error(401, 'Username atau password salah');
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl
      },
      token: `token_${user.id}_${Date.now()}`
    };
  })

  .get('/auth/users', async () => {
    const allUsers = db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt
    }).from(users).all();
    return allUsers;
  })

  .post('/auth/users', async ({ body, error }) => {
    const { username, email, name, role = 'player', password } = body as any;
    if (!username || !password || !name) {
      return error(400, 'Username, nama, dan password wajib diisi');
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = (email || `${cleanUsername}@fahlefi.com`).trim().toLowerCase();

    const existing = db.select().from(users).where(eq(users.username, cleanUsername)).get();
    if (existing) {
      return error(400, `Username "${cleanUsername}" sudah digunakan`);
    }

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const created = db.insert(users).values({
      id,
      username: cleanUsername,
      email: cleanEmail,
      name: name.trim(),
      role: role || 'player',
      passwordHash: password,
      avatarUrl: ''
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt
    }).get();

    return created;
  })

  .patch('/auth/users/:id', async ({ params, body, error }) => {
    const { username, email, name, role, password } = body as any;
    const updateData: any = {};
    if (username) updateData.username = username.trim().toLowerCase();
    if (email) updateData.email = email.trim().toLowerCase();
    if (name) updateData.name = name.trim();
    if (role) updateData.role = role;
    if (password) updateData.passwordHash = password;

    const updated = db.update(users)
      .set(updateData)
      .where(eq(users.id, params.id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt
      })
      .get();

    if (!updated) return error(404, 'User not found');
    return updated;
  })

  .delete('/auth/users/:id', async ({ params, error }) => {
    const user = db.select().from(users).where(eq(users.id, params.id)).get();
    if (!user) return error(404, 'User not found');
    
    db.delete(users).where(eq(users.id, params.id)).run();
    return { success: true, message: `Pengguna "${user.name}" berhasil dihapus` };
  })

  // ==========================================
  // MASTER PLAYER ROSTER & CUMULATIVE STATS
  // ==========================================
  .get('/master-players', async () => {
    const mPlayers = db.select().from(masterPlayers).orderBy(masterPlayers.noPunggung).all();
    const allMatchPlayers = db.select().from(players).all();
    const allEvents = db.select().from(pitchEvents).all();
    const allSubs = db.select().from(substitutions).all();

    // Calculate aggregated career stats per player
    const enriched = mPlayers.map(mp => {
      // Find all match player instances for this jersey number
      const instances = allMatchPlayers.filter(p => p.no === mp.noPunggung);
      const matchIds = new Set(instances.map(p => p.matchId));

      const totalMatches = matchIds.size;
      const totalGoals = instances.reduce((acc, p) => acc + p.gl1 + p.gl2, 0);
      const totalShots = instances.reduce((acc, p) => acc + p.sh1 + p.sh2, 0);
      const totalRec = instances.reduce((acc, p) => acc + p.rec1 + p.rec2, 0);
      const totalLoss = instances.reduce((acc, p) => acc + p.loss1 + p.loss2, 0);
      const totalFouls = instances.reduce((acc, p) => acc + p.fl1 + p.fl2, 0);
      const yellowCards = instances.reduce((acc, p) => acc + p.yellowCards, 0);
      const redCards = instances.reduce((acc, p) => acc + p.redCards, 0);

      // Total pitch events tagged
      const playerEvents = allEvents.filter(e => e.playerNo === mp.noPunggung);
      const goalEvents = playerEvents.filter(e => e.type === 'shot' && e.outcome === 'goal').length;

      // Calculate On-Pitch appearances from substitutions
      const subAppearances = allSubs.filter(s => {
        try {
          const pNums: number[] = JSON.parse(s.playerNumbers || '[]');
          return pNums.includes(mp.noPunggung);
        } catch {
          return false;
        }
      }).length;

      const shotAccuracy = totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0;

      return {
        ...mp,
        stats: {
          totalMatches,
          totalGoals: Math.max(totalGoals, goalEvents),
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

    return enriched;
  })

  // Download Player Excel Import Template
  .get('/master-players/template', async ({ set, error }) => {
    try {
      const { generatePlayerImportTemplate } = await import('./services/playerExcel');
      const buffer = await generatePlayerImportTemplate();
      set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      set.headers['Content-Disposition'] = 'attachment; filename="Template_Import_Pemain_FAHLEFI.xlsx"';
      return buffer;
    } catch (err: any) {
      return error(500, err.message || 'Failed to generate template');
    }
  })

  // Import Players from Excel
  .post('/master-players/import-excel', async ({ body, error }) => {
    try {
      const { parsePlayerExcel } = await import('./services/playerExcel');
      let parsedList: any[] = [];

      // Check if body is formData with file or base64
      if ((body as any).file) {
        const file = (body as any).file as File;
        const arrayBuf = await file.arrayBuffer();
        parsedList = await parsePlayerExcel(Buffer.from(arrayBuf));
      } else if ((body as any).base64) {
        const base64Data = (body as any).base64.replace(/^data:.*?;base64,/, '');
        parsedList = await parsePlayerExcel(Buffer.from(base64Data, 'base64'));
      } else if (Array.isArray((body as any).players)) {
        parsedList = (body as any).players;
      }

      if (parsedList.length === 0) {
        return error(400, 'Tidak ada data pemain valid yang terbaca dari Excel');
      }

      // Upsert into master_players
      const existing = db.select().from(masterPlayers).all();
      const results = [];

      for (const p of parsedList) {
        const matchFound = existing.find(e => e.noPunggung === p.noPunggung);
        if (matchFound) {
          const updated = db.update(masterPlayers)
            .set({
              name: p.name,
              nickname: p.nickname || '',
              position: p.position || 'PLAYER',
              dominantFoot: p.dominantFoot || 'KANAN',
              height: p.height || 175,
              weight: p.weight || 68,
              status: p.status || 'ACTIVE'
            })
            .where(eq(masterPlayers.id, matchFound.id))
            .returning()
            .get();
          results.push(updated);
        } else {
          const id = `mp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const inserted = db.insert(masterPlayers)
            .values({
              id,
              noPunggung: p.noPunggung,
              name: p.name,
              nickname: p.nickname || '',
              position: p.position || 'PLAYER',
              dominantFoot: p.dominantFoot || 'KANAN',
              height: p.height || 175,
              weight: p.weight || 68,
              status: p.status || 'ACTIVE'
            })
            .returning()
            .get();
          results.push(inserted);
        }
      }

      return {
        success: true,
        count: results.length,
        message: `Berhasil mengimpor ${results.length} data pemain ke Master Database!`
      };
    } catch (err: any) {
      return error(500, err.message || 'Import failed');
    }
  })

  .post('/master-players', async ({ body }) => {
    const id = (body as any).id || `mp_${Date.now()}`;
    const created = db.insert(masterPlayers).values({ ...(body as any), id }).returning().get();
    return created;
  })

  .patch('/master-players/:id', async ({ params, body, error }) => {
    const updated = db.update(masterPlayers)
      .set(body as any)
      .where(eq(masterPlayers.id, params.id))
      .returning()
      .get();
    if (!updated) return error(404, 'Master player not found');
    return updated;
  })

  .delete('/master-players/:id', async ({ params }) => {
    db.delete(masterPlayers).where(eq(masterPlayers.id, params.id)).run();
    return { success: true };
  })

  // ==========================================
  // SUBSTITUTIONS & 5-MAN ROTATION LOGS
  // ==========================================
  .get('/matches/:id/substitutions', async ({ params }) => {
    const matchId = parseInt(params.id);
    const logs = db.select().from(substitutions)
      .where(eq(substitutions.matchId, matchId))
      .orderBy(desc(substitutions.createdAt))
      .all();
    return logs;
  })

  .post('/matches/:id/substitutions', async ({ params, body }) => {
    const matchId = parseInt(params.id);
    const subId = (body as any).id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const created = db.insert(substitutions).values({
      ...(body as any),
      id: subId,
      matchId
    }).returning().get();
    return created;
  })

  .delete('/matches/:id/substitutions/:subId', async ({ params }) => {
    db.delete(substitutions).where(eq(substitutions.id, params.subId)).run();
    return { success: true };
  })
  
  // ==========================================
  // MATCHES & IN-MATCH REAL-TIME ENDPOINTS
  // ==========================================
  // Get all matches with summary
  .get('/matches', async () => {
    const allMatches = db.select().from(matches).orderBy(desc(matches.id)).all();
    const allEvents = db.select().from(pitchEvents).all();
    const allPlayers = db.select().from(players).all();

    const enriched = allMatches.map(m => {
      const matchEvents = allEvents.filter(e => e.matchId === m.id);
      const matchPlayers = allPlayers.filter(p => p.matchId === m.id);
      const totalScoreHome = m.homeScore1st + m.homeScore2nd;
      const totalScoreAway = m.awayScore1st + m.awayScore2nd;

      return {
        ...m,
        totalScoreHome,
        totalScoreAway,
        eventsCount: matchEvents.length,
        playersCount: matchPlayers.length
      };
    });

    return enriched;
  })

  // Get full match details (match + players + events + pakets)
  .get('/matches/:id', async ({ params, error }) => {
    const matchId = parseInt(params.id);
    const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
    if (!match) return error(404, 'Match not found');

    const matchPlayers = db.select().from(players).where(eq(players.matchId, matchId)).all();
    const events = db.select().from(pitchEvents).where(eq(pitchEvents.matchId, matchId)).all();
    const pakets = db.select().from(lineupPakets).where(eq(lineupPakets.matchId, matchId)).all();
    const subs = db.select().from(substitutions).where(eq(substitutions.matchId, matchId)).orderBy(desc(substitutions.createdAt)).all();

    return {
      match,
      players: matchPlayers.sort((a, b) => a.no - b.no),
      events,
      pakets: pakets.sort((a, b) => a.paketIndex - b.paketIndex),
      substitutions: subs
    };
  })

  // Create match with options
  .post('/matches', async ({ body }) => {
    const { populateFromMaster = true, initPakets = true, ...matchData } = body as any;
    
    const created = db.insert(matches).values({
      name: matchData.name || 'Match Analysis',
      competition: matchData.competition || 'Porprov Paser',
      date: matchData.date || new Date().toISOString().split('T')[0],
      time: matchData.time || '19:00',
      venue: matchData.venue || 'GOR Sadurengas Paser',
      homeTeam: matchData.homeTeam || '',
      awayTeam: matchData.awayTeam || '',
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

    const matchId = created.id;

    // 1. Populate 25 Players
    if (populateFromMaster) {
      const masterList = db.select().from(masterPlayers).orderBy(masterPlayers.noPunggung).all();
      for (let i = 1; i <= 25; i++) {
        const mp = masterList.find(p => p.noPunggung === i);
        db.insert(players).values({
          matchId,
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
    } else {
      for (let i = 1; i <= 25; i++) {
        db.insert(players).values({
          matchId,
          no: i,
          name: '',
          isGk: i === 1 || i === 2 || i === 22 ? 1 : 0,
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

    // 2. Initialize 9 Pakets
    if (initPakets) {
      for (let i = 1; i <= 9; i++) {
        db.insert(lineupPakets).values({
          matchId,
          paketIndex: i,
          code: '',
          playerNumbers: '[]'
        }).run();
      }
    }

    return created;
  })

  // Duplicate Match
  .post('/matches/:id/duplicate', async ({ params, error }) => {
    const sourceMatchId = parseInt(params.id);
    const sourceMatch = db.select().from(matches).where(eq(matches.id, sourceMatchId)).get();
    if (!sourceMatch) return error(404, 'Match to duplicate not found');

    const newMatch = db.insert(matches).values({
      name: `${sourceMatch.name} (Copy)`,
      competition: sourceMatch.competition,
      date: new Date().toISOString().split('T')[0],
      time: sourceMatch.time,
      venue: sourceMatch.venue,
      homeTeam: sourceMatch.homeTeam,
      awayTeam: sourceMatch.awayTeam,
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

    // Copy player roster names and numbers
    const sourcePlayers = db.select().from(players).where(eq(players.matchId, sourceMatchId)).all();
    for (const p of sourcePlayers) {
      db.insert(players).values({
        matchId: newMatch.id,
        no: p.no,
        name: p.name,
        isGk: p.isGk,
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

    // Copy pakets
    const sourcePakets = db.select().from(lineupPakets).where(eq(lineupPakets.matchId, sourceMatchId)).all();
    for (const pkt of sourcePakets) {
      db.insert(lineupPakets).values({
        matchId: newMatch.id,
        paketIndex: pkt.paketIndex,
        code: pkt.code,
        playerNumbers: pkt.playerNumbers
      }).run();
    }

    return newMatch;
  })

  // Delete Match
  .delete('/matches/:id', async ({ params }) => {
    const matchId = parseInt(params.id);
    db.delete(pitchEvents).where(eq(pitchEvents.matchId, matchId)).run();
    db.delete(players).where(eq(players.matchId, matchId)).run();
    db.delete(lineupPakets).where(eq(lineupPakets.matchId, matchId)).run();
    db.delete(substitutions).where(eq(substitutions.matchId, matchId)).run();
    db.delete(matches).where(eq(matches.id, matchId)).run();
    return { success: true };
  })

  // Update match header / score / timer / fouls
  .patch('/matches/:id', async ({ params, body, error }) => {
    const matchId = parseInt(params.id);
    const updated = db.update(matches)
      .set({ ...(body as any), updatedAt: new Date().toISOString() })
      .where(eq(matches.id, matchId))
      .returning()
      .get();
    if (!updated) return error(404, 'Match not found');
    return updated;
  })

  // Update player stats
  .patch('/players/:id', async ({ params, body, error }) => {
    const playerId = parseInt(params.id);
    const updated = db.update(players)
      .set(body as any)
      .where(eq(players.id, playerId))
      .returning()
      .get();
    if (!updated) return error(404, 'Player not found');
    return updated;
  })

  // Add player to match
  .post('/matches/:id/players', async ({ params, body }) => {
    const matchId = parseInt(params.id);
    const created = db.insert(players)
      .values({ ...(body as any), matchId })
      .returning()
      .get();
    return created;
  })

  // Delete player
  .delete('/players/:id', async ({ params }) => {
    const playerId = parseInt(params.id);
    db.delete(players).where(eq(players.id, playerId)).run();
    return { success: true };
  })

  // Add Pitch Event
  .post('/matches/:id/events', async ({ params, body }) => {
    const matchId = parseInt(params.id);
    const eventId = (body as any).id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const created = db.insert(pitchEvents)
      .values({ ...(body as any), id: eventId, matchId })
      .returning()
      .get();
    return created;
  })

  // Update Pitch Event
  .patch('/events/:id', async ({ params, body }) => {
    db.update(pitchEvents)
      .set(body as any)
      .where(eq(pitchEvents.id, params.id))
      .run();
    return db.select().from(pitchEvents).where(eq(pitchEvents.id, params.id)).get();
  })

  // Delete Pitch Event
  .delete('/events/:id', async ({ params }) => {
    db.delete(pitchEvents).where(eq(pitchEvents.id, params.id)).run();
    return { success: true };
  })

  // Save/Replace Pakets
  .post('/matches/:id/pakets', async ({ params, body }) => {
    const matchId = parseInt(params.id);
    const newPakets = body as Array<{ paketIndex: number; code: string; playerNumbers: string }>;
    
    // Clear old pakets
    db.delete(lineupPakets).where(eq(lineupPakets.matchId, matchId)).run();

    for (const pkt of newPakets) {
      db.insert(lineupPakets).values({
        matchId,
        paketIndex: pkt.paketIndex,
        code: pkt.code,
        playerNumbers: pkt.playerNumbers
      }).run();
    }

    return db.select().from(lineupPakets).where(eq(lineupPakets.matchId, matchId)).all();
  })

  // Download 5-Man Rotation Packages Excel Template
  .get('/pakets/template', async ({ set, error }) => {
    try {
      const { generatePaketImportTemplate } = await import('./services/paketExcel');
      const buffer = await generatePaketImportTemplate();
      set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      set.headers['Content-Disposition'] = 'attachment; filename="Template_Paket_Rotasi_FAHLEFI.xlsx"';
      return buffer;
    } catch (err: any) {
      return error(500, err.message || 'Failed to generate paket template');
    }
  })

  // Export Match 5-Man Pakets to Excel
  .get('/matches/:id/pakets/export', async ({ params, set, error }) => {
    const matchId = parseInt(params.id);
    try {
      const { exportMatchPaketsToExcel } = await import('./services/paketExcel');
      const buffer = await exportMatchPaketsToExcel(matchId);
      const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
      const filename = `Paket_Rotasi_${(match?.homeTeam || 'Tim').replace(/\s+/g, '_')}.xlsx`;

      set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      set.headers['Content-Disposition'] = `attachment; filename="${filename}"`;
      return buffer;
    } catch (err: any) {
      return error(500, err.message || 'Export pakets failed');
    }
  })

  // Import Pakets from Excel
  .post('/matches/:id/pakets/import-excel', async ({ params, body, error }) => {
    const matchId = parseInt(params.id);
    try {
      const { parsePaketExcel } = await import('./services/paketExcel');
      let parsedList: any[] = [];

      if ((body as any).file) {
        const file = (body as any).file as File;
        const arrayBuf = await file.arrayBuffer();
        parsedList = await parsePaketExcel(Buffer.from(arrayBuf));
      } else if ((body as any).base64) {
        const base64Data = (body as any).base64.replace(/^data:.*?;base64,/, '');
        parsedList = await parsePaketExcel(Buffer.from(base64Data, 'base64'));
      } else if (Array.isArray((body as any).pakets)) {
        parsedList = (body as any).pakets;
      }

      if (parsedList.length === 0) {
        return error(400, 'Tidak ada data paket rotasi valid yang terbaca dari Excel');
      }

      // Replace match pakets
      db.delete(lineupPakets).where(eq(lineupPakets.matchId, matchId)).run();

      for (const pkt of parsedList) {
        db.insert(lineupPakets).values({
          matchId,
          paketIndex: pkt.paketIndex,
          code: pkt.code,
          playerNumbers: pkt.playerNumbers
        }).run();
      }

      const allUpdated = db.select().from(lineupPakets).where(eq(lineupPakets.matchId, matchId)).orderBy(lineupPakets.paketIndex).all();

      return {
        success: true,
        count: allUpdated.length,
        pakets: allUpdated,
        message: `Berhasil mengimpor ${allUpdated.length} paket rotasi 5 pemain!`
      };
    } catch (err: any) {
      return error(500, err.message || 'Import pakets failed');
    }
  })

  // Export Excel
  .get('/matches/:id/export', async ({ params, set, error }) => {
    const matchId = parseInt(params.id);
    try {
      const buffer = await exportMatchToExcel(matchId);
      const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
      const filename = `Match_Analysis_${(match?.homeTeam || 'Home').replace(/\s+/g, '_')}_vs_${(match?.awayTeam || 'Away').replace(/\s+/g, '_')}.xlsx`;

      set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      set.headers['Content-Disposition'] = `attachment; filename="${filename}"`;
      return buffer;
    } catch (err: any) {
      return error(500, err.message || 'Export failed');
    }
  })

  .listen(3000);

console.log(`🚀 Elysia API Server is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
