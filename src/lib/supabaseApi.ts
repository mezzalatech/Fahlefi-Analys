import { getSupabase, broadcastFutsalAction } from './supabase';
import type { User, MasterPlayer, MatchData, SubstitutionLog } from './api';

export const supabaseApi = {
  // Auth & Users
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const cleanUsername = username.trim().toLowerCase();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (error || !user) {
      // Also try by role for demo convenience
      const { data: userByRole } = await supabase
        .from('users')
        .select('*')
        .ilike('role', cleanUsername)
        .maybeSingle();

      if (userByRole && userByRole.password_hash === password) {
        return {
          user: {
            id: userByRole.id,
            username: userByRole.username,
            email: userByRole.email,
            name: userByRole.name,
            role: userByRole.role,
            avatarUrl: userByRole.avatar_url
          },
          token: `token_${userByRole.id}_${Date.now()}`
        };
      }
      throw new Error('Username atau kata sandi salah.');
    }

    if (user.password_hash !== password) {
      throw new Error('Kata sandi salah.');
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url
      },
      token: `token_${user.id}_${Date.now()}`
    };
  },

  async getUsers(): Promise<User[]> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, name, role, avatar_url, created_at')
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      name: u.name,
      role: u.role,
      avatarUrl: u.avatar_url
    }));
  },

  async createUser(userData: { username: string; email?: string; name: string; role: string; password?: string }): Promise<User> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const cleanUsername = userData.username.trim().toLowerCase();
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const row = {
      id,
      username: cleanUsername,
      email: userData.email || `${cleanUsername}@fahlefi.com`,
      name: userData.name.trim(),
      role: userData.role || 'player',
      password_hash: userData.password || `${cleanUsername}123`,
      avatar_url: userData.role === 'coach' ? '/icon.png' : ''
    };

    const { data, error } = await supabase.from('users').insert(row).select().single();
    if (error) throw new Error(error.message);

    const user: User = {
      id: data.id,
      username: data.username,
      email: data.email,
      name: data.name,
      role: data.role,
      avatarUrl: data.avatar_url
    };

    broadcastFutsalAction('user_created', user);
    return user;
  },

  async updateUser(id: string, userData: { username?: string; email?: string; name?: string; role?: string; password?: string }): Promise<User> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const updates: any = {};
    if (userData.username) updates.username = userData.username.trim().toLowerCase();
    if (userData.email) updates.email = userData.email.trim();
    if (userData.name) updates.name = userData.name.trim();
    if (userData.role) updates.role = userData.role;
    if (userData.password) updates.password_hash = userData.password;

    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);

    const user: User = {
      id: data.id,
      username: data.username,
      email: data.email,
      name: data.name,
      role: data.role,
      avatarUrl: data.avatar_url
    };

    broadcastFutsalAction('user_updated', user);
    return user;
  },

  async deleteUser(id: string): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);

    broadcastFutsalAction('user_deleted', { id });
    return { success: true };
  },

  // Master Players
  async getMasterPlayers(): Promise<MasterPlayer[]> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const [playersRes, matchPlayersRes, subsRes] = await Promise.all([
      supabase.from('master_players').select('*').order('no_punggung', { ascending: true }),
      supabase.from('players').select('*'),
      supabase.from('substitutions').select('*')
    ]);

    if (playersRes.error) throw new Error(playersRes.error.message);
    const playersList = playersRes.data || [];
    const allMatchPlayers = matchPlayersRes.data || [];
    const allSubs = subsRes.data || [];

    return playersList.map(p => {
      let totalMatches = 0;
      let totalGoals = 0;
      let totalShots = 0;
      let totalRec = 0;
      let totalLoss = 0;
      let totalFouls = 0;
      let yellowCards = 0;
      let redCards = 0;
      let subAppearances = 0;

      for (const mp of allMatchPlayers) {
        if (mp.no === p.no_punggung) {
          totalMatches++;
          totalGoals += ((mp.gl_1 || 0) + (mp.gl_2 || 0));
          totalShots += ((mp.sh_1 || 0) + (mp.sh_2 || 0));
          totalRec += ((mp.rec_1 || 0) + (mp.rec_2 || 0));
          totalLoss += ((mp.loss_1 || 0) + (mp.loss_2 || 0));
          totalFouls += ((mp.fl_1 || 0) + (mp.fl_2 || 0));
          yellowCards += (mp.yellow_cards || 0);
          redCards += (mp.red_cards || 0);
        }
      }

      for (const s of allSubs) {
        try {
          const nos = JSON.parse(s.player_numbers || '[]');
          if (Array.isArray(nos) && nos.includes(p.no_punggung)) {
            subAppearances++;
          }
        } catch {}
      }

      const shotAccuracy = totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0;

      return {
        id: p.id,
        noPunggung: p.no_punggung,
        name: p.name,
        nickname: p.nickname || '',
        position: p.position as any,
        dominantFoot: p.dominant_foot as any,
        height: p.height || 175,
        weight: p.weight || 68,
        photoUrl: p.photo_url || '',
        status: p.status as any,
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
  },

  async createMasterPlayer(player: Partial<MasterPlayer>): Promise<MasterPlayer> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const id = player.id || `mp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const row = {
      id,
      no_punggung: Number(player.noPunggung) || 1,
      name: player.name || 'Pemain Baru',
      nickname: player.nickname || '',
      position: player.position || 'PLAYER',
      dominant_foot: player.dominantFoot || 'KANAN',
      height: Number(player.height) || 175,
      weight: Number(player.weight) || 68,
      photo_url: player.photoUrl || '',
      status: player.status || 'ACTIVE'
    };

    const { data, error } = await supabase.from('master_players').insert(row).select().single();
    if (error) throw new Error(error.message);

    const created: MasterPlayer = {
      id: data.id,
      noPunggung: data.no_punggung,
      name: data.name,
      nickname: data.nickname || '',
      position: data.position,
      dominantFoot: data.dominant_foot,
      height: data.height,
      weight: data.weight,
      photoUrl: data.photo_url,
      status: data.status
    };

    broadcastFutsalAction('master_player_created', created);
    return created;
  },

  async updateMasterPlayer(id: string, partial: Partial<MasterPlayer>): Promise<MasterPlayer> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const updates: any = {};
    if (partial.noPunggung !== undefined) updates.no_punggung = Number(partial.noPunggung);
    if (partial.name !== undefined) updates.name = partial.name;
    if (partial.nickname !== undefined) updates.nickname = partial.nickname;
    if (partial.position !== undefined) updates.position = partial.position;
    if (partial.dominantFoot !== undefined) updates.dominant_foot = partial.dominantFoot;
    if (partial.height !== undefined) updates.height = Number(partial.height);
    if (partial.weight !== undefined) updates.weight = Number(partial.weight);
    if (partial.photoUrl !== undefined) updates.photo_url = partial.photoUrl;
    if (partial.status !== undefined) updates.status = partial.status;

    const { data, error } = await supabase.from('master_players').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);

    const updated: MasterPlayer = {
      id: data.id,
      noPunggung: data.no_punggung,
      name: data.name,
      nickname: data.nickname || '',
      position: data.position,
      dominantFoot: data.dominant_foot,
      height: data.height,
      weight: data.weight,
      photoUrl: data.photo_url,
      status: data.status
    };

    broadcastFutsalAction('master_player_updated', updated);
    return updated;
  },

  async deleteMasterPlayer(id: string): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase.from('master_players').delete().eq('id', id);
    if (error) throw new Error(error.message);

    broadcastFutsalAction('master_player_deleted', { id });
    return { success: true };
  },

  // Matches
  async getMatches(): Promise<any[]> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase.from('matches').select('*').order('id', { ascending: true });
    if (error) throw new Error(error.message);

    return (data || []).map(m => ({
      id: Number(m.id),
      name: m.name,
      competition: m.competition,
      date: m.date,
      time: m.time,
      venue: m.venue,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      homeScore1st: m.home_score_1st,
      homeScore2nd: m.home_score_2nd,
      awayScore1st: m.away_score_1st,
      awayScore2nd: m.away_score_2nd,
      homeFouls1st: m.home_fouls_1st,
      homeFouls2nd: m.home_fouls_2nd,
      awayFouls1st: m.away_fouls_1st,
      awayFouls2nd: m.away_fouls_2nd,
      period: m.period,
      timerRemaining: m.timer_remaining,
      timeouts: m.timeouts
    }));
  },

  async getMatch(id: number): Promise<MatchData> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const [matchRes, playersRes, eventsRes, paketsRes, subsRes] = await Promise.all([
      supabase.from('matches').select('*').eq('id', id).maybeSingle(),
      supabase.from('players').select('*').eq('match_id', id).order('no', { ascending: true }),
      supabase.from('pitch_events').select('*').eq('match_id', id).order('created_at', { ascending: true }),
      supabase.from('lineup_pakets').select('*').eq('match_id', id).order('paket_index', { ascending: true }),
      supabase.from('substitutions').select('*').eq('match_id', id).order('created_at', { ascending: false })
    ]);

    if (matchRes.error) throw new Error(matchRes.error.message);
    let m = matchRes.data;

    // If match not found, fallback to first match or create default
    if (!m) {
      const allMatches = await this.getMatches();
      if (allMatches.length > 0) {
        return this.getMatch(allMatches[0].id);
      }
      m = await this.createMatch({ name: 'Match Analysis Baru' });
      return this.getMatch(m.id);
    }

    let matchPlayers = (playersRes.data || []);
    if (matchPlayers.length === 0) {
      try {
        const { data: masterList } = await supabase.from('master_players').select('*').order('no_punggung', { ascending: true });
        if (masterList && masterList.length > 0) {
          const toInsert = masterList.map((mp, idx) => ({
            id: id * 1000 + (idx + 1),
            match_id: id,
            no: mp.no_punggung,
            name: mp.name,
            is_gk: mp.position === 'GK' ? 1 : 0,
            yellow_cards: 0,
            red_cards: 0,
            loss_1: 0,
            loss_2: 0,
            rec_1: 0,
            rec_2: 0,
            fl_1: 0,
            fl_2: 0,
            sh_1: 0,
            sh_2: 0,
            gl_1: 0,
            gl_2: 0
          }));
          await supabase.from('players').insert(toInsert);
          matchPlayers = toInsert;
        }
      } catch (err) {
        console.warn('Auto-populate match players warning:', err);
      }
    }

    const formattedMatch: MatchData = {
      match: {
        id: Number(m.id),
        name: m.name,
        competition: m.competition,
        date: m.date,
        time: m.time,
        venue: m.venue,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        homeScore1st: m.home_score_1st,
        homeScore2nd: m.home_score_2nd,
        awayScore1st: m.away_score_1st,
        awayScore2nd: m.away_score_2nd,
        homeFouls1st: m.home_fouls_1st,
        homeFouls2nd: m.home_fouls_2nd,
        awayFouls1st: m.away_fouls_1st,
        awayFouls2nd: m.away_fouls_2nd,
        period: m.period,
        timerRemaining: m.timer_remaining,
        timeouts: m.timeouts
      },
      players: matchPlayers.map(p => ({
        id: Number(p.id),
        matchId: Number(p.match_id),
        no: p.no,
        name: p.name,
        isGk: p.is_gk,
        yellowCards: p.yellow_cards,
        redCards: p.red_cards,
        loss1: p.loss_1,
        loss2: p.loss_2,
        rec1: p.rec_1,
        rec2: p.rec_2,
        fl1: p.fl_1,
        fl2: p.fl_2,
        sh1: p.sh_1,
        sh2: p.sh_2,
        gl1: p.gl_1,
        gl2: p.gl_2
      })),
      events: (eventsRes.data || []).map(e => ({
        id: e.id,
        matchId: Number(e.match_id),
        type: e.type,
        outcome: e.outcome,
        team: e.team,
        half: e.half,
        timeStr: e.time_str,
        x: e.x,
        y: e.y,
        playerNo: e.player_no,
        note: e.note || ''
      })),
      pakets: (paketsRes.data || []).map(pkt => ({
        id: Number(pkt.id),
        matchId: Number(pkt.match_id),
        paketIndex: pkt.paket_index,
        code: pkt.code,
        playerNumbers: pkt.player_numbers
      })),
      substitutions: (subsRes.data || []).map(s => ({
        id: s.id,
        matchId: Number(s.match_id),
        half: s.half,
        timeStr: s.time_str,
        timerRemaining: s.timer_remaining,
        paketIndex: s.paket_index,
        playerNumbers: s.player_numbers,
        type: s.type,
        note: s.note || '',
        createdAt: s.created_at
      }))
    };

    return formattedMatch;
  },

  async createMatch(matchData: any): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const matches = await this.getMatches();
    const newId = matches.length > 0 ? Math.max(...matches.map(m => m.id)) + 1 : 1;

    const row = {
      id: newId,
      name: matchData.name || `Match #${newId}`,
      competition: matchData.competition || 'Porprov Paser',
      date: matchData.date || new Date().toISOString().split('T')[0],
      time: matchData.time || '19:00',
      venue: matchData.venue || 'GOR Sadurengas Paser',
      home_team: matchData.homeTeam || 'Hewah Paser',
      away_team: matchData.awayTeam || 'Lawan',
      home_score_1st: 0,
      home_score_2nd: 0,
      away_score_1st: 0,
      away_score_2nd: 0,
      home_fouls_1st: 0,
      home_fouls_2nd: 0,
      away_fouls_1st: 0,
      away_fouls_2nd: 0,
      period: '1',
      timer_remaining: 1200,
      timeouts: JSON.stringify({ home1: false, home2: false, away1: false, away2: false })
    };

    const { data: createdMatch, error } = await supabase.from('matches').insert(row).select().single();
    if (error) throw new Error(error.message);

    // Auto-populate players from master players
    const master = await this.getMasterPlayers();
    if (master.length > 0) {
      const pRows = master.map((p, idx) => ({
        id: newId * 1000 + (idx + 1),
        match_id: newId,
        no: p.noPunggung,
        name: p.name,
        is_gk: p.position === 'GK' ? 1 : 0,
        yellow_cards: 0,
        red_cards: 0,
        loss_1: 0,
        loss_2: 0,
        rec_1: 0,
        rec_2: 0,
        fl_1: 0,
        fl_2: 0,
        sh_1: 0,
        sh_2: 0,
        gl_1: 0,
        gl_2: 0
      }));
      await supabase.from('players').insert(pRows);
    }

    // Default pakets
    const defaultPakets = [
      { id: newId * 10 + 1, match_id: newId, paket_index: 0, code: 'PAKET 1 (STARTING)', player_numbers: JSON.stringify([1, 3, 6, 7, 8]) },
      { id: newId * 10 + 2, match_id: newId, paket_index: 1, code: 'PAKET 2 (ROTASI A)', player_numbers: JSON.stringify([1, 4, 10, 11, 9]) },
      { id: newId * 10 + 3, match_id: newId, paket_index: 2, code: 'PAKET 3 (ROTASI B)', player_numbers: JSON.stringify([2, 5, 12, 13, 14]) },
      { id: newId * 10 + 4, match_id: newId, paket_index: 3, code: 'PAKET 4 (POWER PLAY)', player_numbers: JSON.stringify([10, 3, 6, 7, 8]) }
    ];
    await supabase.from('lineup_pakets').insert(defaultPakets);

    broadcastFutsalAction('match_created', { matchId: newId });
    return { id: newId, ...matchData };
  },

  async duplicateMatch(id: number): Promise<any> {
    const original = await this.getMatch(id);
    const newMatch = await this.createMatch({
      ...original.match,
      name: `${original.match.name} (Salinan)`
    });
    return newMatch;
  },

  async deleteMatch(id: number): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) throw new Error(error.message);

    broadcastFutsalAction('match_deleted', { matchId: id });
    return { success: true };
  },

  async updateMatch(id: number, data: Partial<MatchData['match']>): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.competition !== undefined) updates.competition = data.competition;
    if (data.date !== undefined) updates.date = data.date;
    if (data.time !== undefined) updates.time = data.time;
    if (data.venue !== undefined) updates.venue = data.venue;
    if (data.homeTeam !== undefined) updates.home_team = data.homeTeam;
    if (data.awayTeam !== undefined) updates.away_team = data.awayTeam;
    if (data.homeScore1st !== undefined) updates.home_score_1st = data.homeScore1st;
    if (data.homeScore2nd !== undefined) updates.home_score_2nd = data.homeScore2nd;
    if (data.awayScore1st !== undefined) updates.away_score_1st = data.awayScore1st;
    if (data.awayScore2nd !== undefined) updates.away_score_2nd = data.awayScore2nd;
    if (data.homeFouls1st !== undefined) updates.home_fouls_1st = data.homeFouls1st;
    if (data.homeFouls2nd !== undefined) updates.home_fouls_2nd = data.homeFouls2nd;
    if (data.awayFouls1st !== undefined) updates.away_fouls_1st = data.awayFouls1st;
    if (data.awayFouls2nd !== undefined) updates.away_fouls_2nd = data.awayFouls2nd;
    if (data.period !== undefined) updates.period = data.period;
    if (data.timerRemaining !== undefined) updates.timer_remaining = data.timerRemaining;
    if (data.timeouts !== undefined) updates.timeouts = typeof data.timeouts === 'string' ? data.timeouts : JSON.stringify(data.timeouts);

    const { error } = await supabase.from('matches').update(updates).eq('id', id);
    if (error) throw new Error(error.message);

    broadcastFutsalAction('match_updated', { matchId: id, data });
    return { success: true };
  },

  async updatePlayer(id: number, data: Partial<MatchData['players'][0]>): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.isGk !== undefined) updates.is_gk = data.isGk;
    if (data.yellowCards !== undefined) updates.yellow_cards = data.yellowCards;
    if (data.redCards !== undefined) updates.red_cards = data.redCards;
    if (data.loss1 !== undefined) updates.loss_1 = data.loss1;
    if (data.loss2 !== undefined) updates.loss_2 = data.loss2;
    if (data.rec1 !== undefined) updates.rec_1 = data.rec1;
    if (data.rec2 !== undefined) updates.rec_2 = data.rec2;
    if (data.fl1 !== undefined) updates.fl_1 = data.fl1;
    if (data.fl2 !== undefined) updates.fl_2 = data.fl2;
    if (data.sh1 !== undefined) updates.sh_1 = data.sh1;
    if (data.sh2 !== undefined) updates.sh_2 = data.sh2;
    if (data.gl1 !== undefined) updates.gl_1 = data.gl1;
    if (data.gl2 !== undefined) updates.gl_2 = data.gl2;

    const { error } = await supabase.from('players').update(updates).eq('id', id);
    if (error) throw new Error(error.message);

    broadcastFutsalAction('player_stats_updated', { playerId: id, data });
    return { success: true };
  },

  async addPlayer(matchId: number, data: Omit<MatchData['players'][0], 'id' | 'matchId'>): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const newId = Date.now();
    const row = {
      id: newId,
      match_id: matchId,
      no: data.no,
      name: data.name,
      is_gk: data.isGk || 0,
      yellow_cards: data.yellowCards || 0,
      red_cards: data.redCards || 0,
      loss_1: data.loss1 || 0,
      loss_2: data.loss2 || 0,
      rec_1: data.rec1 || 0,
      rec_2: data.rec2 || 0,
      fl_1: data.fl1 || 0,
      fl_2: data.fl2 || 0,
      sh_1: data.sh1 || 0,
      sh_2: data.sh2 || 0,
      gl_1: data.gl1 || 0,
      gl_2: data.gl2 || 0
    };

    const { error } = await supabase.from('players').insert(row);
    if (error) throw new Error(error.message);

    broadcastFutsalAction('player_added', { matchId, player: { id: newId, ...data } });
    return { id: newId, matchId, ...data };
  },

  async deletePlayer(id: number): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw new Error(error.message);

    broadcastFutsalAction('player_deleted', { playerId: id });
    return { success: true };
  },

  // Events
  async addEvent(matchId: number, event: Omit<MatchData['events'][0], 'matchId'>): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const id = event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const row = {
      id,
      match_id: matchId,
      type: event.type,
      outcome: event.outcome,
      team: event.team,
      half: event.half,
      time_str: event.timeStr,
      x: event.x,
      y: event.y,
      player_no: event.playerNo,
      note: event.note || ''
    };

    const { error } = await supabase.from('pitch_events').insert(row);
    if (error) throw new Error(error.message);

    const fullEvent = { ...event, id, matchId };
    broadcastFutsalAction('event_added', { matchId, event: fullEvent });
    return fullEvent;
  },

  async updateEvent(id: string, partial: Partial<MatchData['events'][0]>): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const updates: any = {};
    if (partial.type !== undefined) updates.type = partial.type;
    if (partial.outcome !== undefined) updates.outcome = partial.outcome;
    if (partial.team !== undefined) updates.team = partial.team;
    if (partial.half !== undefined) updates.half = partial.half;
    if (partial.timeStr !== undefined) updates.time_str = partial.timeStr;
    if (partial.x !== undefined) updates.x = partial.x;
    if (partial.y !== undefined) updates.y = partial.y;
    if (partial.playerNo !== undefined) updates.player_no = partial.playerNo;
    if (partial.note !== undefined) updates.note = partial.note;

    const { error } = await supabase.from('pitch_events').update(updates).eq('id', id);
    if (error) throw new Error(error.message);

    broadcastFutsalAction('event_updated', { id, partial });
    return { success: true };
  },

  async deleteEvent(id: string): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase.from('pitch_events').delete().eq('id', id);
    if (error) throw new Error(error.message);

    broadcastFutsalAction('event_deleted', { id });
    return { success: true };
  },

  // Pakets
  async savePakets(matchId: number, pakets: Array<{ paketIndex: number; code: string; playerNumbers: string }>): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    // Delete existing pakets for this match
    await supabase.from('lineup_pakets').delete().eq('match_id', matchId);

    const rows = pakets.map((pkt, idx) => ({
      id: matchId * 100 + (idx + 1),
      match_id: matchId,
      paket_index: pkt.paketIndex,
      code: pkt.code,
      player_numbers: pkt.playerNumbers
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from('lineup_pakets').insert(rows);
      if (error) throw new Error(error.message);
    }

    broadcastFutsalAction('pakets_saved', { matchId, pakets });
    return rows.map((r) => ({
      id: r.id,
      matchId: r.match_id,
      paketIndex: r.paket_index,
      code: r.code,
      playerNumbers: r.player_numbers
    }));
  },

  // Substitutions
  async getSubstitutions(matchId: number): Promise<SubstitutionLog[]> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('substitutions')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(s => ({
      id: s.id,
      matchId: Number(s.match_id),
      half: s.half,
      timeStr: s.time_str,
      timerRemaining: s.timer_remaining,
      paketIndex: s.paket_index,
      playerNumbers: s.player_numbers,
      type: s.type,
      note: s.note || '',
      createdAt: s.created_at
    }));
  },

  async logSubstitution(matchId: number, sub: Partial<SubstitutionLog>): Promise<SubstitutionLog> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const id = sub.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const row = {
      id,
      match_id: matchId,
      half: sub.half || 1,
      time_str: sub.timeStr || '20:00',
      timer_remaining: sub.timerRemaining || 1200,
      paket_index: sub.paketIndex !== undefined ? sub.paketIndex : null,
      player_numbers: sub.playerNumbers || '[]',
      type: sub.type || 'PAKET_DEPLOY',
      note: sub.note || ''
    };

    const { data, error } = await supabase.from('substitutions').insert(row).select().single();
    if (error) throw new Error(error.message);

    const createdSub: SubstitutionLog = {
      id: data.id,
      matchId: Number(data.match_id),
      half: data.half,
      timeStr: data.time_str,
      timerRemaining: data.timer_remaining,
      paketIndex: data.paket_index,
      playerNumbers: data.player_numbers,
      type: data.type,
      note: data.note || '',
      createdAt: data.created_at
    };

    broadcastFutsalAction('substitution_logged', { matchId, sub: createdSub });
    return createdSub;
  },

  async deleteSubstitution(matchId: number, subId: string): Promise<any> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase.from('substitutions').delete().eq('id', subId);
    if (error) throw new Error(error.message);

    broadcastFutsalAction('substitution_deleted', { matchId, subId });
    return { success: true };
  }
};
