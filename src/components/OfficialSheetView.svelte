<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { api } from '../lib/api';
  import MatchConfigModal from './MatchConfigModal.svelte';
  import { Printer, Download, Plus, Minus, RotateCcw, Maximize2, LayoutGrid, Columns, X, Edit3, Trash2, ListOrdered, Check, AlertTriangle, Search, Filter, Folder, Trophy, Settings, Clock, Sparkles, Users } from 'lucide-svelte';

  // Sheet and Pitch Layout State
  let sheetWidth = $state<'standard' | 'wide' | 'ultrawide' | 'full'>('ultrawide');
  let pitchSize = $state<'large' | 'grid2x2' | 'compact'>('large');
  let activePitchHalfFilter = $state<'all' | 1 | 2>('all');
  let expandedPitch = $state<'rec' | 'lost' | 'shot_tim' | 'shot_lawan' | null>(null);

  // Tag Management & Edit State
  let editingEvent = $state<any | null>(null);
  let showEventsManager = $state<boolean>(false);
  let showConfigModal = $state<boolean>(false);
  let eventFilterType = $state<string>('all');
  let eventFilterTeam = $state<string>('all');
  let eventSearchQuery = $state<string>('');

  let match = $derived(matchStore.data?.match);
  let players = $derived(matchStore.data?.players || []);
  let events = $derived(matchStore.data?.events || []);
  let pakets = $derived(matchStore.data?.pakets || []);

  // Timeouts parsed
  let timeouts = $derived.by(() => {
    try {
      return JSON.parse(match?.timeouts || '[]');
    } catch {
      return [];
    }
  });

  // Calculate Recovered Balls (Kesepakatan: KIRI = OWN FIELD / Lapangan Kita, KANAN = OPPOSITE FIELD / Lapangan Lawan)
  let recBallsTimOwn = $derived(events.filter(e => e.type === 'recovery' && e.team === 'home' && e.x < 400).length);
  let recBallsTimOpp = $derived(events.filter(e => e.type === 'recovery' && e.team === 'home' && e.x >= 400).length);
  let recBallsLawanOwn = $derived(events.filter(e => e.type === 'recovery' && e.team === 'away' && e.x < 400).length);
  let recBallsLawanOpp = $derived(events.filter(e => e.type === 'recovery' && e.team === 'away' && e.x >= 400).length);

  // Fallback if player table has stats
  let totalRecFromPlayers = $derived(players.reduce((sum, p) => sum + p.rec1 + p.rec2, 0));
  let displayRecTimOwn = $derived(recBallsTimOwn > 0 ? recBallsTimOwn : (totalRecFromPlayers > 0 ? totalRecFromPlayers : 0));

  // Lost Balls (KIRI = OWN FIELD, KANAN = OPPOSITE FIELD)
  let lostBallsTimOwn = $derived(events.filter(e => e.type === 'turnover' && e.team === 'home' && e.x < 400).length);
  let lostBallsTimOpp = $derived(events.filter(e => e.type === 'turnover' && e.team === 'home' && e.x >= 400).length);
  let lostBallsLawanOwn = $derived(events.filter(e => e.type === 'turnover' && e.team === 'away' && e.x < 400).length);
  let lostBallsLawanOpp = $derived(events.filter(e => e.type === 'turnover' && e.team === 'away' && e.x >= 400).length);

  let totalLossFromPlayers = $derived(players.reduce((sum, p) => sum + p.loss1 + p.loss2, 0));
  let displayLostTimOwn = $derived(lostBallsTimOwn > 0 ? lostBallsTimOwn : (totalLossFromPlayers > 0 ? totalLossFromPlayers : 0));

  // Shots Tim
  let shotsTimOnTarget = $derived(events.filter(e => e.type === 'shot' && e.team === 'home' && e.outcome === 'ontarget').length);
  let shotsTimOut = $derived(events.filter(e => e.type === 'shot' && e.team === 'home' && e.outcome === 'out').length);
  let shotsTimRejected = $derived(events.filter(e => e.type === 'shot' && e.team === 'home' && e.outcome === 'rejected').length);
  let shotsTimPost = $derived(events.filter(e => e.type === 'shot' && e.team === 'home' && e.outcome === 'post').length);
  let shotsTimGoal = $derived(
    events.filter(e => e.type === 'shot' && e.team === 'home' && e.outcome === 'goal').length || 
    (match ? match.homeScore1st + match.homeScore2nd : 0)
  );

  // Shots Lawan
  let shotsLawanOnTarget = $derived(events.filter(e => e.type === 'shot' && e.team === 'away' && e.outcome === 'ontarget').length);
  let shotsLawanOut = $derived(events.filter(e => e.type === 'shot' && e.team === 'away' && e.outcome === 'out').length);
  let shotsLawanRejected = $derived(events.filter(e => e.type === 'shot' && e.team === 'away' && e.outcome === 'rejected').length);
  let shotsLawanPost = $derived(events.filter(e => e.type === 'shot' && e.team === 'away' && e.outcome === 'post').length);
  let shotsLawanGoal = $derived(
    events.filter(e => e.type === 'shot' && e.team === 'away' && e.outcome === 'goal').length || 
    (match ? match.awayScore1st + match.awayScore2nd : 0)
  );

  // 25 rows template (Maksimal 25 Pemain)
  let rowsCount = 25;
  let allRows = $derived.by(() => {
    const list = [];
    const maxNo = Math.max(rowsCount, ...players.map(p => p.no || 0));
    for (let i = 1; i <= maxNo; i++) {
      const p = players.find(item => item.no === i);
      list.push({
        no: i,
        player: p || null
      });
    }
    return list;
  });

  // Fast Tagging Modes (Zero-Delay Live Tagging)
  let activeRecTeam = $state<'home' | 'away'>('home');
  let activeLostTeam = $state<'home' | 'away'>('home');
  let activeShotTimOutcome = $state<'ontarget' | 'out' | 'rejected' | 'post' | 'goal'>('ontarget');
  let activeShotLawanOutcome = $state<'ontarget' | 'out' | 'rejected' | 'post' | 'goal'>('ontarget');
  let selectedTagPlayerNo = $state<number | null>(null);
  let activeRecPlayerNo = $state<number | null>(null);
  let activeLostPlayerNo = $state<number | null>(null);
  let activeShotShooterNo = $state<number | null>(null);

  // Filtered Events for Event Manager
  let filteredEvents = $derived.by(() => {
    return events.filter(e => {
      // Filter Type
      if (eventFilterType !== 'all') {
        if (eventFilterType === 'recovery' && e.type !== 'recovery') return false;
        if (eventFilterType === 'turnover' && e.type !== 'turnover') return false;
        if (eventFilterType === 'shot' && e.type !== 'shot') return false;
      }
      // Filter Team
      if (eventFilterTeam !== 'all') {
        if (eventFilterTeam === 'home' && e.team !== 'home') return false;
        if (eventFilterTeam === 'away' && e.team !== 'away') return false;
      }
      // Search query
      if (eventSearchQuery.trim()) {
        const q = eventSearchQuery.toLowerCase();
        const matchesNote = (e.note || '').toLowerCase().includes(q);
        const matchesPlayer = (e.playerNo ? `#${e.playerNo}` : '').includes(q);
        const matchesTime = (e.timeStr || '').toLowerCase().includes(q);
        const matchesOutcome = (e.outcome || '').toLowerCase().includes(q);
        if (!matchesNote && !matchesPlayer && !matchesTime && !matchesOutcome) return false;
      }
      return true;
    }).slice().reverse(); // newest first
  });

  // Pitch click helper for the 4 mini pitches (INSTANT 1-CLICK RECORDING WITH PLAYER STATS SYNC)
  async function handleMiniPitchClick(
    category: 'rec' | 'lost' | 'shot_tim' | 'shot_lawan', 
    e: MouseEvent,
    overrideTeam?: 'home' | 'away'
  ) {
    if (!match) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 800);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 480);

    // If Right Click (button === 2), alternate team for instant tagging
    const isRightClick = e.button === 2;
    const team: 'home' | 'away' = overrideTeam || (isRightClick ? 'away' : (category === 'rec' ? activeRecTeam : activeLostTeam));

    if (category === 'rec') {
      const pNo = team === 'home' ? (activeRecPlayerNo !== null ? activeRecPlayerNo : selectedTagPlayerNo) : null;
      await matchStore.addPitchEvent({
        id: `rec_${Date.now()}`,
        type: 'recovery',
        outcome: 'success',
        team,
        half: matchStore.activeHalf,
        timeStr: matchStore.formattedTime,
        x,
        y,
        playerNo: pNo,
        note: `Recovery (${team === 'home' ? 'Tim Kita' : 'Lawan'})${pNo ? ` #${pNo}` : ''}`
      });
    } else if (category === 'lost') {
      const pNo = team === 'home' ? (activeLostPlayerNo !== null ? activeLostPlayerNo : selectedTagPlayerNo) : null;
      await matchStore.addPitchEvent({
        id: `loss_${Date.now()}`,
        type: 'turnover',
        outcome: 'fail',
        team,
        half: matchStore.activeHalf,
        timeStr: matchStore.formattedTime,
        x,
        y,
        playerNo: pNo,
        note: `Lost Ball (${team === 'home' ? 'Tim Kita' : 'Lawan'})${pNo ? ` #${pNo}` : ''}`
      });
    } else if (category === 'shot_tim') {
      const pNo = activeShotShooterNo !== null ? activeShotShooterNo : selectedTagPlayerNo;
      await matchStore.addPitchEvent({
        id: `sh_t_${Date.now()}`,
        type: 'shot',
        outcome: activeShotTimOutcome,
        team: 'home',
        half: matchStore.activeHalf,
        timeStr: matchStore.formattedTime,
        x,
        y,
        playerNo: pNo,
        note: `Shot Tim (${activeShotTimOutcome})${pNo ? ` oleh #${pNo}` : ''}`
      });
    } else if (category === 'shot_lawan') {
      await matchStore.addPitchEvent({
        id: `sh_l_${Date.now()}`,
        type: 'shot',
        outcome: activeShotLawanOutcome,
        team: 'away',
        half: matchStore.activeHalf,
        timeStr: matchStore.formattedTime,
        x,
        y,
        playerNo: null,
        note: `Shot Lawan (${activeShotLawanOutcome})`
      });
    }
  }

  // Open Edit Dialog for a tag
  function openEditTag(evt: any, e: MouseEvent) {
    e.stopPropagation();
    editingEvent = { ...evt };
  }

  // Save changes to editingEvent
  async function saveEditedEvent() {
    if (!editingEvent) return;
    await matchStore.updatePitchEvent(editingEvent.id, {
      team: editingEvent.team,
      half: editingEvent.half,
      outcome: editingEvent.outcome,
      timeStr: editingEvent.timeStr,
      playerNo: editingEvent.playerNo ? Number(editingEvent.playerNo) : null,
      note: editingEvent.note,
      x: editingEvent.x,
      y: editingEvent.y
    });
    editingEvent = null;
  }

  // Delete specific event
  async function deleteSpecificEvent(evtId: string, e?: MouseEvent) {
    if (e) e.stopPropagation();
    if (confirm('Yakin ingin menghapus tag aksi ini?')) {
      await matchStore.deletePitchEvent(evtId);
      if (editingEvent?.id === evtId) {
        editingEvent = null;
      }
    }
  }

  // Delete all events
  async function deleteAllEvents() {
    if (confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA (${events.length}) tag pada lapangan?`)) {
      for (const evt of events) {
        await matchStore.deletePitchEvent(evt.id);
      }
      showEventsManager = false;
      editingEvent = null;
    }
  }

  function handlePrint() {
    window.print();
  }
</script>

<div class="sheet-viewport">
  <!-- Top Action Toolbar for Print / Export -->
  <div class="sheet-toolbar no-print">
    <div class="toolbar-left-group">
      <div class="sheet-title-badge">
        <span class="badge-dot"></span>
        <span class="sheet-title-main">LEMBAR ANALISIS PERTANDINGAN RESMI</span>
      </div>
      <div class="toolbar-action-buttons">
        <button type="button" class="btn-tool-action btn-tool-match" onclick={() => (matchStore.showMatchManagerModal = true)} title="Kelola Arsip & Ganti Pertandingan">
          <Trophy size={14} class="text-cyan" />
          <span>Ganti Laga (#{match?.id || 1})</span>
        </button>
        <button type="button" class="btn-tool-action btn-tool-cfg" onclick={() => (showConfigModal = true)} title="Pengaturan Laga (Judul, Turnamen, Venue, Tim, Tanggal)">
          <Settings size={14} class="text-emerald" />
          <span>Pengaturan Laga</span>
        </button>
        <button type="button" class="btn-tool-action btn-tool-print" onclick={handlePrint} title="Cetak atau Simpan sebagai PDF">
          <Printer size={14} />
          <span>Cetak PDF</span>
        </button>
        <a href={`/api/matches/${match?.id || 1}/export`} target="_blank" class="btn-tool-action btn-tool-excel" title="Ekspor ke File Excel Spreadsheet">
          <Download size={14} />
          <span>Ekspor Excel (.xlsx)</span>
        </a>
        <button type="button" class="btn-tool-action btn-tool-manage" onclick={() => (showEventsManager = true)} title="Buka Daftar Log Semua Tag Lapangan">
          <ListOrdered size={14} />
          <span>Log Tag Lapangan ({events.length})</span>
        </button>
      </div>
    </div>

    <!-- Sheet Width Switcher (Segmented Control) -->
    <div class="sheet-width-switcher">
      <span class="layout-lbl">Lebar Tampilan:</span>
      <div class="segmented-pill-group">
        <button 
          type="button"
          class="btn-size-chip {sheetWidth === 'standard' ? 'active' : ''}" 
          onclick={() => (sheetWidth = 'standard')}>
          Standar (1200px)
        </button>
        <button 
          type="button"
          class="btn-size-chip {sheetWidth === 'wide' ? 'active' : ''}" 
          onclick={() => (sheetWidth = 'wide')}>
          Lebar (1440px)
        </button>
        <button 
          type="button"
          class="btn-size-chip {sheetWidth === 'ultrawide' ? 'active' : ''}" 
          onclick={() => (sheetWidth = 'ultrawide')}>
          Ultra (1680px)
        </button>
        <button 
          type="button"
          class="btn-size-chip {sheetWidth === 'full' ? 'active' : ''}" 
          onclick={() => (sheetWidth = 'full')}>
          Penuh
        </button>
      </div>
    </div>
  </div>

  <!-- Main Sheet Container (Exact Ratio & Look of contoh.pdf) -->
  <div class="analysis-document-sheet sheet-width-{sheetWidth}" id="printSection">
    
    <!-- 1. TOP HEADER INFO BAR -->
    <div class="doc-header-row">
      <div class="hdr-cell cell-game">
        <div class="hdr-label">GAME</div>
        <input class="hdr-input" placeholder="" bind:value={match.name} onchange={() => matchStore.updateMatchMeta({ name: match.name })} />
      </div>
      <div class="hdr-cell cell-comp">
        <div class="hdr-label">COMPETITION</div>
        <input class="hdr-input" placeholder="" bind:value={match.competition} onchange={() => matchStore.updateMatchMeta({ competition: match.competition })} />
      </div>
      <div class="hdr-cell cell-date">
        <div class="hdr-label">DATE</div>
        <input type="date" class="hdr-input hdr-input-date" bind:value={match.date} onchange={() => matchStore.updateMatchMeta({ date: match.date })} />
      </div>
      <div class="hdr-cell cell-time">
        <div class="hdr-label">TIME</div>
        <input type="time" class="hdr-input hdr-input-time" bind:value={match.time} onchange={() => matchStore.updateMatchMeta({ time: match.time })} />
      </div>
      <div class="hdr-cell cell-place">
        <div class="hdr-label">PLACE</div>
        <input class="hdr-input" placeholder="" bind:value={match.venue} onchange={() => matchStore.updateMatchMeta({ venue: match.venue })} />
      </div>
    </div>

    <!-- 2. SECOND ROW: SCORE, FOULS, T.O MINUTE, PAKET -->
    <div class="doc-sub-row">
      
      <!-- Score Box -->
      <div class="box-score-container">
        <table class="doc-table table-score">
          <thead>
            <tr>
              <th class="th-blue th-score-title">SCORE</th>
              <th class="th-blue">1st HALF</th>
              <th class="th-blue">2nd HALF</th>
              <th class="th-blue">FINAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="td-team-label">
                <input class="cell-input text-left font-bold" placeholder="Tim Home" bind:value={match.homeTeam} onchange={() => matchStore.updateMatchMeta({ homeTeam: match.homeTeam })} />
              </td>
              <td><input type="number" class="cell-input" value={match.homeScore1st ? match.homeScore1st : ''} placeholder="" onchange={(e) => matchStore.updateMatchMeta({ homeScore1st: +e.currentTarget.value || 0 })} /></td>
              <td><input type="number" class="cell-input" value={match.homeScore2nd ? match.homeScore2nd : ''} placeholder="" onchange={(e) => matchStore.updateMatchMeta({ homeScore2nd: +e.currentTarget.value || 0 })} /></td>
              <td class="td-final-score">{match.homeScore1st + match.homeScore2nd > 0 ? match.homeScore1st + match.homeScore2nd : ''}</td>
            </tr>
            <tr>
              <td class="td-team-label">
                <input class="cell-input text-left font-bold" placeholder="Tim Lawan" bind:value={match.awayTeam} onchange={() => matchStore.updateMatchMeta({ awayTeam: match.awayTeam })} />
              </td>
              <td><input type="number" class="cell-input" value={match.awayScore1st ? match.awayScore1st : ''} placeholder="" onchange={(e) => matchStore.updateMatchMeta({ awayScore1st: +e.currentTarget.value || 0 })} /></td>
              <td><input type="number" class="cell-input" value={match.awayScore2nd ? match.awayScore2nd : ''} placeholder="" onchange={(e) => matchStore.updateMatchMeta({ awayScore2nd: +e.currentTarget.value || 0 })} /></td>
              <td class="td-final-score">{match.awayScore1st + match.awayScore2nd > 0 ? match.awayScore1st + match.awayScore2nd : ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Fouls Box -->
      <div class="box-fouls-container">
        <table class="doc-table table-fouls">
          <thead>
            <tr>
              <th class="th-blue" style="width: 32px;"></th>
              <th colspan="5" class="th-blue">FOULS</th>
              <th class="th-blue" style="width: 44px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <!-- 1st Half Fouls -->
            <tr>
              <td class="td-half-tag">1ºH</td>
              {#each [1, 2, 3, 4, 5] as idx}
                <td 
                  class="td-foul-box {idx === 5 ? 'td-foul-5th' : ''} {match.homeFouls1st >= idx ? 'foul-filled' : ''}"
                  onclick={() => matchStore.updateMatchMeta({ homeFouls1st: match.homeFouls1st === idx ? idx - 1 : idx })}
                  title="Klik Foul 1ºH Home">
                  {#if match.homeFouls1st >= idx}✓{/if}
                </td>
              {/each}
              <td class="td-foul-total">{match.homeFouls1st > 0 ? match.homeFouls1st : ''}</td>
            </tr>
            <!-- 2nd Half Fouls -->
            <tr>
              <td class="td-half-tag">2ºH</td>
              {#each [1, 2, 3, 4, 5] as idx}
                <td 
                  class="td-foul-box {idx === 5 ? 'td-foul-5th' : ''} {match.homeFouls2nd >= idx ? 'foul-filled' : ''}"
                  onclick={() => matchStore.updateMatchMeta({ homeFouls2nd: match.homeFouls2nd === idx ? idx - 1 : idx })}
                  title="Klik Foul 2ºH Home">
                  {#if match.homeFouls2nd >= idx}✓{/if}
                </td>
              {/each}
              <td class="td-foul-total">{match.homeFouls2nd > 0 ? match.homeFouls2nd : ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- T.O MINUTE Box (4 Rows: H1 Home, H1 Away, H2 Home, H2 Away) -->
      <div class="box-to-container">
        <div class="to-header">
          <span>T.O MINUTE</span>
          <span class="to-hint">(mm:ss)</span>
        </div>
        <div class="to-rows">
          <div class="to-input-wrapper" title="Timeout 1ºH Tim Home (Format mm:ss)">
            <span class="to-row-tag tag-h1-home">1H:</span>
            <input class="to-input-row" value={timeouts[0] || ''} placeholder="mm:ss" onchange={(e) => {
              const next = [e.currentTarget.value, timeouts[1] || '', timeouts[2] || '', timeouts[3] || ''];
              matchStore.updateMatchMeta({ timeouts: JSON.stringify(next) });
            }} />
            <button 
              type="button" 
              class="btn-stamp-to no-print" 
              onclick={() => {
                const next = [matchStore.formattedTime, timeouts[1] || '', timeouts[2] || '', timeouts[3] || ''];
                matchStore.updateMatchMeta({ timeouts: JSON.stringify(next) });
              }} 
              title="Cap Waktu Saat Ini ({matchStore.formattedTime})">
              ⏱️
            </button>
          </div>
          <div class="to-input-wrapper" title="Timeout 1ºH Tim Lawan (Format mm:ss)">
            <span class="to-row-tag tag-h1-away">1L:</span>
            <input class="to-input-row" value={timeouts[1] || ''} placeholder="mm:ss" onchange={(e) => {
              const next = [timeouts[0] || '', e.currentTarget.value, timeouts[2] || '', timeouts[3] || ''];
              matchStore.updateMatchMeta({ timeouts: JSON.stringify(next) });
            }} />
            <button 
              type="button" 
              class="btn-stamp-to no-print" 
              onclick={() => {
                const next = [timeouts[0] || '', matchStore.formattedTime, timeouts[2] || '', timeouts[3] || ''];
                matchStore.updateMatchMeta({ timeouts: JSON.stringify(next) });
              }} 
              title="Cap Waktu Saat Ini ({matchStore.formattedTime})">
              ⏱️
            </button>
          </div>
          <div class="to-input-wrapper" title="Timeout 2ºH Tim Home (Format mm:ss)">
            <span class="to-row-tag tag-h2-home">2H:</span>
            <input class="to-input-row" value={timeouts[2] || ''} placeholder="mm:ss" onchange={(e) => {
              const next = [timeouts[0] || '', timeouts[1] || '', e.currentTarget.value, timeouts[3] || ''];
              matchStore.updateMatchMeta({ timeouts: JSON.stringify(next) });
            }} />
            <button 
              type="button" 
              class="btn-stamp-to no-print" 
              onclick={() => {
                const next = [timeouts[0] || '', timeouts[1] || '', matchStore.formattedTime, timeouts[3] || ''];
                matchStore.updateMatchMeta({ timeouts: JSON.stringify(next) });
              }} 
              title="Cap Waktu Saat Ini ({matchStore.formattedTime})">
              ⏱️
            </button>
          </div>
          <div class="to-input-wrapper" title="Timeout 2ºH Tim Lawan (Format mm:ss)">
            <span class="to-row-tag tag-h2-away">2L:</span>
            <input class="to-input-row" value={timeouts[3] || ''} placeholder="mm:ss" onchange={(e) => {
              const next = [timeouts[0] || '', timeouts[1] || '', timeouts[2] || '', e.currentTarget.value];
              matchStore.updateMatchMeta({ timeouts: JSON.stringify(next) });
            }} />
            <button 
              type="button" 
              class="btn-stamp-to no-print" 
              onclick={() => {
                const next = [timeouts[0] || '', timeouts[1] || '', timeouts[2] || '', matchStore.formattedTime];
                matchStore.updateMatchMeta({ timeouts: JSON.stringify(next) });
              }} 
              title="Cap Waktu Saat Ini ({matchStore.formattedTime})">
              ⏱️
            </button>
          </div>
        </div>
      </div>

      <!-- PAKET Box (Coach presets + Dynamic On-Pitch Lineup) -->
      <div class="box-paket-container">
        <div class="paket-header">
          <span>PAKET</span>
          {#if matchStore.onPitchPlayers.length > 0}
            <span class="paket-onpitch-tag">
              Lapangan: {matchStore.onPitchPlayers.join('-')} 
              {#if matchStore.activePaketIndex}
                (P#{matchStore.activePaketIndex})
              {:else}
                <span class="sub-indicator">(Sub/Custom)</span>
              {/if}
            </span>
          {/if}
        </div>
        <div class="paket-content-list">
          {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as pIdx}
            {@const pkt = pakets.find(p => p.paketIndex === pIdx)}
            {@const isThisPktActive = matchStore.activePaketIndex === pIdx}
            <div 
              class="pkt-line {isThisPktActive ? 'pkt-active' : ''}">
              <span 
                class="pkt-num" 
                onclick={() => matchStore.deployPaket(pIdx)} 
                title="Klik untuk pasang Paket #{pIdx} ke lapangan">{pIdx}.</span>
              <input 
                class="pkt-inline-input" 
                value={pkt ? pkt.code : ''} 
                placeholder="" 
                onchange={async (e) => {
                  const code = e.currentTarget.value.trim();
                  const nums = code.split('-').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                  const updated = pakets.map(p => p.paketIndex === pIdx ? { ...p, code, playerNumbers: JSON.stringify(nums) } : p);
                  await matchStore.savePakets(updated);
                }} 
              />
              {#if isThisPktActive}
                <span class="pkt-dot-active">●</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

    </div>

    <!-- 3. MIDDLE STATS MATRIX (17 ROWS PLAYER STATS) -->
    <div class="doc-matrix-section">
      <table class="doc-table matrix-sheet-table">
        <thead>
          <!-- Row 1: Main Categories -->
          <tr class="tr-matrix-row1">
            <th rowspan="3" class="th-main-blue th-num-col">NO</th>
            <th rowspan="3" class="th-main-blue th-player-col">PLAYER</th>
            <th colspan="2" class="th-main-blue th-cards-col">CARDS</th>
            <th colspan="10" class="th-stats-banner">STATS</th>
          </tr>
          <!-- Row 2: Sub Metric Titles & Y/R Cards -->
          <tr class="tr-matrix-row2">
            <th rowspan="2" class="th-card-y">Y</th>
            <th rowspan="2" class="th-card-r">R</th>
            <!-- LOSS -->
            <th class="th-cat-title" colspan="2">LOSS</th>
            <!-- RECOVER -->
            <th class="th-cat-title" colspan="2">RECOVER</th>
            <!-- FOULS -->
            <th class="th-cat-title" colspan="2">FOULS</th>
            <!-- SHOOTS -->
            <th class="th-cat-title" colspan="2">SHOOTS</th>
            <!-- GOALS -->
            <th class="th-cat-title" colspan="2">GOALS</th>
          </tr>
          <!-- Row 3: 1st Half / 2nd Half Labels -->
          <tr class="tr-matrix-row3">
            <!-- LOSS -->
            <th class="th-half-label">1st<br>HALF</th>
            <th class="th-half-label">2nd<br>HALF</th>
            <!-- RECOVER -->
            <th class="th-half-label">1st<br>HALF</th>
            <th class="th-half-label">2nd<br>HALF</th>
            <!-- FOULS -->
            <th class="th-half-label">1st<br>HALF</th>
            <th class="th-half-label">2nd<br>HALF</th>
            <!-- SHOOTS -->
            <th class="th-half-label">1st<br>HALF</th>
            <th class="th-half-label">2nd<br>HALF</th>
            <!-- GOALS -->
            <th class="th-half-label">1st<br>HALF</th>
            <th class="th-half-label">2nd<br>HALF</th>
          </tr>
        </thead>

        <tbody>
          {#each allRows as item}
            {@const p = item.player}
            {@const isOnCourt = matchStore.onPitchPlayers.includes(item.no)}
            <tr class="tr-player-data {isOnCourt ? 'row-on-court' : ''}">
              <!-- NO (Click to toggle on-pitch active status) -->
              <td 
                class="td-row-no {isOnCourt ? 'td-no-on-court' : ''}" 
                onclick={() => matchStore.toggleOnPitch(item.no)}
                title="Klik untuk masukkan/keluarkan #{item.no} dari lapangan">
                <div class="no-cell-flex">
                  <span class="no-digit">{item.no}</span>
                  {#if isOnCourt}
                    <span class="court-dot-badge" title="Sedang di Lapangan">●</span>
                  {/if}
                </div>
              </td>

              <!-- PLAYER NAME -->
              <td class="td-row-player">
                <input 
                  class="player-name-cell {isOnCourt ? 'name-on-court' : ''}" 
                  value={p ? p.name : ''} 
                  placeholder="" 
                  onchange={async (e) => {
                    const name = e.currentTarget.value.trim();
                    if (p) {
                      await api.updatePlayer(p.id, { name });
                      p.name = name;
                    } else if (name) {
                      const newP = await api.addPlayer(match!.id, {
                        no: item.no,
                        name,
                        position: 'PLAYER',
                        starter: false,
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
                      matchStore.data!.players = [...players, newP];
                    }
                  }} 
                />
              </td>

              <!-- CARDS Y -->
              <td 
                class="td-matrix-stat {p && p.yellowCards > 0 ? 'bg-yellow-card' : ''}" 
                onclick={() => p && matchStore.updatePlayerStat(p.id, 'yellowCards', p.yellowCards > 0 ? -1 : 1)}>
                {p && p.yellowCards > 0 ? p.yellowCards : ''}
              </td>

              <!-- CARDS R -->
              <td 
                class="td-matrix-stat {p && p.redCards > 0 ? 'bg-red-card' : ''}" 
                onclick={() => p && matchStore.updatePlayerStat(p.id, 'redCards', p.redCards > 0 ? -1 : 1)}>
                {p && p.redCards > 0 ? p.redCards : ''}
              </td>

              <!-- LOSS 1st -->
              <td class="td-matrix-stat" onclick={() => p && matchStore.updatePlayerStat(p.id, 'loss1', 1)} oncontextmenu={(e) => { e.preventDefault(); p && matchStore.updatePlayerStat(p.id, 'loss1', -1); }}>
                {p && p.loss1 > 0 ? p.loss1 : ''}
              </td>
              <!-- LOSS 2nd -->
              <td class="td-matrix-stat" onclick={() => p && matchStore.updatePlayerStat(p.id, 'loss2', 1)} oncontextmenu={(e) => { e.preventDefault(); p && matchStore.updatePlayerStat(p.id, 'loss2', -1); }}>
                {p && p.loss2 > 0 ? p.loss2 : ''}
              </td>

              <!-- RECOVER 1st -->
              <td class="td-matrix-stat" onclick={() => p && matchStore.updatePlayerStat(p.id, 'rec1', 1)} oncontextmenu={(e) => { e.preventDefault(); p && matchStore.updatePlayerStat(p.id, 'rec1', -1); }}>
                {p && p.rec1 > 0 ? p.rec1 : ''}
              </td>
              <!-- RECOVER 2nd -->
              <td class="td-matrix-stat" onclick={() => p && matchStore.updatePlayerStat(p.id, 'rec2', 1)} oncontextmenu={(e) => { e.preventDefault(); p && matchStore.updatePlayerStat(p.id, 'rec2', -1); }}>
                {p && p.rec2 > 0 ? p.rec2 : ''}
              </td>

              <!-- FOULS 1st -->
              <td class="td-matrix-stat" onclick={() => p && matchStore.updatePlayerStat(p.id, 'fl1', 1)} oncontextmenu={(e) => { e.preventDefault(); p && matchStore.updatePlayerStat(p.id, 'fl1', -1); }}>
                {p && p.fl1 > 0 ? p.fl1 : ''}
              </td>
              <!-- FOULS 2nd -->
              <td class="td-matrix-stat" onclick={() => p && matchStore.updatePlayerStat(p.id, 'fl2', 1)} oncontextmenu={(e) => { e.preventDefault(); p && matchStore.updatePlayerStat(p.id, 'fl2', -1); }}>
                {p && p.fl2 > 0 ? p.fl2 : ''}
              </td>

              <!-- SHOOTS 1st -->
              <td class="td-matrix-stat" onclick={() => p && matchStore.updatePlayerStat(p.id, 'sh1', 1)} oncontextmenu={(e) => { e.preventDefault(); p && matchStore.updatePlayerStat(p.id, 'sh1', -1); }}>
                {p && p.sh1 > 0 ? p.sh1 : ''}
              </td>
              <!-- SHOOTS 2nd -->
              <td class="td-matrix-stat" onclick={() => p && matchStore.updatePlayerStat(p.id, 'sh2', 1)} oncontextmenu={(e) => { e.preventDefault(); p && matchStore.updatePlayerStat(p.id, 'sh2', -1); }}>
                {p && p.sh2 > 0 ? p.sh2 : ''}
              </td>

              <!-- GOALS 1st -->
              <td class="td-matrix-stat td-gl-cell" onclick={() => p && matchStore.updatePlayerStat(p.id, 'gl1', 1)} oncontextmenu={(e) => { e.preventDefault(); p && matchStore.updatePlayerStat(p.id, 'gl1', -1); }}>
                {p && p.gl1 > 0 ? p.gl1 : ''}
              </td>
              <!-- GOALS 2nd -->
              <td class="td-matrix-stat td-gl-cell" onclick={() => p && matchStore.updatePlayerStat(p.id, 'gl2', 1)} oncontextmenu={(e) => { e.preventDefault(); p && matchStore.updatePlayerStat(p.id, 'gl2', -1); }}>
                {p && p.gl2 > 0 ? p.gl2 : ''}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- 4. BOTTOM 4 PITCH BOARDS (TAMPILAN LAPANGAN LEBIH BESAR & LEGA) -->
    <div class="pitch-section-container">
      <div class="pitch-section-toolbar no-print">
        <div class="pitch-toolbar-left">
          <span class="pitch-toolbar-heading">⚽ 4 LAPANGAN TAKTIS & SHOT MAP</span>
          <span class="pitch-toolbar-sub">({matchStore.activeHalf === 1 ? '1ºH Babak 1' : '2ºH Babak 2'} Aktif • Klik lapangan untuk catat aksi)</span>
        </div>

        <div class="pitch-toolbar-right">
          <!-- Active Pitch Half Filter Toggle (Horizontal Capsule) -->
          <div class="toolbar-capsule-group">
            <span class="lbl-capsule-title">Filter Lapangan:</span>
            <div class="segmented-pill-group">
              <button 
                type="button" 
                class="btn-segment-pill {activePitchHalfFilter === 'all' ? 'active' : ''}" 
                onclick={() => (activePitchHalfFilter = 'all')}
                title="Tampilkan Semua Tag (Babak 1 + Babak 2)">
                🔘 Semua
              </button>
              <button 
                type="button" 
                class="btn-segment-pill {activePitchHalfFilter === 1 ? 'active' : ''}" 
                onclick={() => (activePitchHalfFilter = 1)}
                title="Tampilkan Tag Babak 1 Saja">
                1ºH
              </button>
              <button 
                type="button" 
                class="btn-segment-pill {activePitchHalfFilter === 2 ? 'active' : ''}" 
                onclick={() => (activePitchHalfFilter = 2)}
                title="Tampilkan Tag Babak 2 Saja">
                2ºH
              </button>
            </div>
          </div>

          <!-- Log Tag Lapangan Button -->
          <button 
            type="button" 
            class="btn-toolbar-tags" 
            onclick={() => (showEventsManager = true)}
            title="Kelola dan Hapus Semua Tag">
            <ListOrdered size={14} />
            <span>Log Tag ({events.length})</span>
          </button>
          
          <!-- Tata Letak Grid Capsule -->
          <div class="toolbar-capsule-group">
            <span class="lbl-capsule-title">Tata Letak:</span>
            <div class="segmented-pill-group">
              <button 
                type="button"
                class="btn-segment-pill {pitchSize === 'large' ? 'active' : ''}" 
                onclick={() => (pitchSize = 'large')}
                title="Tampilan 4 Kolom Sejajar (Sesuai PDF)">
                <Columns size={13} /> <span>4 Kolom</span>
              </button>
              <button 
                type="button"
                class="btn-segment-pill {pitchSize === 'grid2x2' ? 'active' : ''}" 
                onclick={() => (pitchSize = 'grid2x2')}
                title="Tampilan Lapangan 2x2 Grid Besar">
                <LayoutGrid size={13} /> <span>2x2 Grid</span>
              </button>
              <button 
                type="button"
                class="btn-segment-pill {pitchSize === 'compact' ? 'active' : ''}" 
                onclick={() => (pitchSize = 'compact')}
                title="Tampilan 1 Kolom Ultra">
                <Maximize2 size={13} /> <span>1 Kolom</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Tagger Player Strip (Tautkan aksi lapangan langsung ke statistik pemain) -->
      <div class="active-player-tagger-bar no-print">
        <div class="tagger-label-group">
          <Users size={14} class="text-cyan" />
          <span class="tagger-heading">TAUTKAN AKSI KE PEMAIN (SINKRON MATRIX):</span>
        </div>
        <div class="tagger-player-chips">
          <button 
            type="button" 
            class="chip-tagger {selectedTagPlayerNo === null ? 'chip-tagger-active' : ''}" 
            onclick={() => (selectedTagPlayerNo = null)}
            title="Klik untuk mode tanpa pemain / netral">
            <span>Tanpa Pemain Spesifik</span>
          </button>
          
          {#if matchStore.onPitchPlayers.length > 0}
            {#each matchStore.onPitchPlayers as pNo}
              {@const pObj = players.find(x => x.no === pNo)}
              <button 
                type="button" 
                class="chip-tagger chip-tagger-court {selectedTagPlayerNo === pNo ? 'chip-tagger-active' : ''}" 
                onclick={() => (selectedTagPlayerNo = pNo)}
                title="Klik untuk menautkan tag aksi ke #{pNo} {pObj ? pObj.name : ''}">
                <span class="chip-court-dot">●</span>
                <span class="chip-pno">#{pNo}</span>
                <span class="chip-pname">{pObj ? pObj.name.split(' ')[0] : ''}</span>
              </button>
            {/each}
          {/if}

          <div class="tagger-dropdown-wrap">
            <select bind:value={selectedTagPlayerNo} class="select-tagger-player">
              <option value={null}>-- Pilih Dari 25 Pemain --</option>
              {#each players as p}
                <option value={p.no}>#{p.no} - {p.name}</option>
              {/each}
            </select>
          </div>

          {#if selectedTagPlayerNo}
            {@const activeP = players.find(x => x.no === selectedTagPlayerNo)}
            <span class="tagger-active-badge">
              ✓ Terpilih: <strong>#{selectedTagPlayerNo} {activeP ? activeP.name : ''}</strong> (Setiap klik lapangan langsung update Matrix)
            </span>
          {/if}
        </div>
      </div>

      <div class="doc-pitches-grid pitch-layout-{pitchSize}">
        
        <!-- PITCH 1: RECOVERED BALLS -->
        <div class="pitch-column-card">
          <div class="pitch-title-bar">
            <div class="title-with-toggle">
              <span>RECOVERED BALLS</span>
              <div class="card-team-toggle no-print">
                <button type="button" class="toggle-pill {activeRecTeam === 'home' ? 'active-home' : ''}" onclick={(e) => { e.stopPropagation(); activeRecTeam = 'home'; }}>🔵 Tim</button>
                <button type="button" class="toggle-pill {activeRecTeam === 'away' ? 'active-away' : ''}" onclick={(e) => { e.stopPropagation(); activeRecTeam = 'away'; }}>🟣 Lawan</button>
              </div>
            </div>
            <div class="pitch-bar-right no-print">
              {#if activeRecTeam === 'home'}
                <select bind:value={activeRecPlayerNo} class="select-mini-player" title="Pilih Pemain Pelaksana Recovery (Sinkron ke Matrix REC)">
                  <option value={null}>{selectedTagPlayerNo ? `Pemain: #${selectedTagPlayerNo}` : 'Pilih Pemain'}</option>
                  {#each players as p}
                    <option value={p.no}>#{p.no} {p.name.split(' ')[0]}</option>
                  {/each}
                </select>
              {/if}
              <button type="button" class="btn-expand-pitch" onclick={() => (expandedPitch = 'rec')} title="Perbesar Layar Penuh">
                <Maximize2 size={13} />
              </button>
            </div>
          </div>
          <div 
            class="mini-futsal-pitch" 
            onclick={(e) => handleMiniPitchClick('rec', e)}
            oncontextmenu={(e) => { e.preventDefault(); handleMiniPitchClick('rec', e, 'away'); }}
            role="button"
            tabindex="0"
            onkeydown={() => {}}>
            <!-- Real Futsal Pitch Image from lapangan.png -->
            <img src="/lapangan.png" alt="Lapangan Futsal" class="pitch-bg-img" />

            <!-- Recovered Balls Dots with Half Filter -->
            {#each events.filter(e => e.type === 'recovery' && (activePitchHalfFilter === 'all' || e.half === activePitchHalfFilter)) as evt}
              <div 
                class="mini-pitch-dot {evt.team === 'home' ? 'dot-rec' : 'dot-rec-lawan'}" 
                style="left: {(evt.x / 800) * 100}%; top: {(evt.y / 480) * 100}%;"
                onclick={(e) => openEditTag(evt, e)}
                title="Recovery ({evt.team === 'home' ? 'Tim Kita' : 'Lawan'}) {evt.playerNo ? `oleh #${evt.playerNo}` : ''} @ {evt.x < 400 ? 'OWN' : 'OPP'} [{evt.half === 1 ? '1ºH' : '2ºH'}] - Klik untuk Edit/Hapus">
                {#if evt.playerNo}
                  <span class="dot-pno">{evt.playerNo}</span>
                {:else}
                  R
                {/if}
              </div>
            {/each}
          </div>
          <!-- Table Recovered Balls -->
          <table class="doc-table mini-table">
            <thead>
              <tr>
                <th style="width: 50%;"></th>
                <th class="th-blue">TIM</th>
                <th class="th-blue">LAWAN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="td-pitch-metric-label">OWN FIELD</td>
                <td>{displayRecTimOwn}</td>
                <td>{recBallsLawanOwn}</td>
              </tr>
              <tr>
                <td class="td-pitch-metric-label">OPPOSITE FIELD</td>
                <td>{recBallsTimOpp}</td>
                <td>{recBallsLawanOpp}</td>
              </tr>
              <tr class="tr-pitch-total">
                <td class="td-pitch-metric-label font-bold">TOTAL</td>
                <td>{displayRecTimOwn + recBallsTimOpp}</td>
                <td>{recBallsLawanOwn + recBallsLawanOpp}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PITCH 2: LOST BALLS -->
        <div class="pitch-column-card">
          <div class="pitch-title-bar">
            <div class="title-with-toggle">
              <span>LOST BALLS</span>
              <div class="card-team-toggle no-print">
                <button type="button" class="toggle-pill {activeLostTeam === 'home' ? 'active-home' : ''}" onclick={(e) => { e.stopPropagation(); activeLostTeam = 'home'; }}>🔵 Tim</button>
                <button type="button" class="toggle-pill {activeLostTeam === 'away' ? 'active-away' : ''}" onclick={(e) => { e.stopPropagation(); activeLostTeam = 'away'; }}>🟠 Lawan</button>
              </div>
            </div>
            <div class="pitch-bar-right no-print">
              {#if activeLostTeam === 'home'}
                <select bind:value={activeLostPlayerNo} class="select-mini-player" title="Pilih Pemain Lost Ball (Sinkron ke Matrix LOSS)">
                  <option value={null}>{selectedTagPlayerNo ? `Pemain: #${selectedTagPlayerNo}` : 'Pilih Pemain'}</option>
                  {#each players as p}
                    <option value={p.no}>#{p.no} {p.name.split(' ')[0]}</option>
                  {/each}
                </select>
              {/if}
              <button type="button" class="btn-expand-pitch" onclick={() => (expandedPitch = 'lost')} title="Perbesar Layar Penuh">
                <Maximize2 size={13} />
              </button>
            </div>
          </div>
          <div 
            class="mini-futsal-pitch" 
            onclick={(e) => handleMiniPitchClick('lost', e)}
            oncontextmenu={(e) => { e.preventDefault(); handleMiniPitchClick('lost', e, 'away'); }}
            role="button"
            tabindex="0"
            onkeydown={() => {}}>
            <!-- Real Futsal Pitch Image from lapangan.png -->
            <img src="/lapangan.png" alt="Lapangan Futsal" class="pitch-bg-img" />

            <!-- Lost Balls Dots with Half Filter -->
            {#each events.filter(e => e.type === 'turnover' && (activePitchHalfFilter === 'all' || e.half === activePitchHalfFilter)) as evt}
              <div 
                class="mini-pitch-dot {evt.team === 'home' ? 'dot-lost' : 'dot-lost-lawan'}" 
                style="left: {(evt.x / 800) * 100}%; top: {(evt.y / 480) * 100}%;"
                onclick={(e) => openEditTag(evt, e)}
                title="Lost Ball ({evt.team === 'home' ? 'Tim Kita' : 'Lawan'}) {evt.playerNo ? `oleh #${evt.playerNo}` : ''} @ {evt.x < 400 ? 'OWN' : 'OPP'} [{evt.half === 1 ? '1ºH' : '2ºH'}] - Klik untuk Edit/Hapus">
                {#if evt.playerNo}
                  <span class="dot-pno">{evt.playerNo}</span>
                {:else}
                  L
                {/if}
              </div>
            {/each}
          </div>
          <!-- Table Lost Balls -->
          <table class="doc-table mini-table">
            <thead>
              <tr>
                <th style="width: 50%;"></th>
                <th class="th-blue">TIM</th>
                <th class="th-blue">LAWAN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="td-pitch-metric-label">OWN FIELD</td>
                <td>{displayLostTimOwn}</td>
                <td>{lostBallsLawanOwn}</td>
              </tr>
              <tr>
                <td class="td-pitch-metric-label">OPPOSITE FIELD</td>
                <td>{lostBallsTimOpp}</td>
                <td>{lostBallsLawanOpp}</td>
              </tr>
              <tr class="tr-pitch-total">
                <td class="td-pitch-metric-label font-bold">TOTAL</td>
                <td>{displayLostTimOwn + lostBallsTimOpp}</td>
                <td>{lostBallsLawanOwn + lostBallsLawanOpp}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PITCH 3: SHOTS TIM -->
        <div class="pitch-column-card">
          <div class="pitch-title-bar bar-green">
            <div class="title-with-outcomes">
              <span>SHOTS TIM</span>
              <div class="card-outcome-chips no-print">
                <button type="button" class="chip-outcome {activeShotTimOutcome === 'ontarget' ? 'chip-active' : ''}" onclick={(e) => { e.stopPropagation(); activeShotTimOutcome = 'ontarget'; }}>Ⓣ Target</button>
                <button type="button" class="chip-outcome {activeShotTimOutcome === 'out' ? 'chip-active' : ''}" onclick={(e) => { e.stopPropagation(); activeShotTimOutcome = 'out'; }}>Ⓞ Out</button>
                <button type="button" class="chip-outcome {activeShotTimOutcome === 'rejected' ? 'chip-active' : ''}" onclick={(e) => { e.stopPropagation(); activeShotTimOutcome = 'rejected'; }}>Ⓡ Reject</button>
                <button type="button" class="chip-outcome {activeShotTimOutcome === 'post' ? 'chip-active' : ''}" onclick={(e) => { e.stopPropagation(); activeShotTimOutcome = 'post'; }}>Ⓟ Post</button>
                <button type="button" class="chip-outcome chip-goal {activeShotTimOutcome === 'goal' ? 'chip-active' : ''}" onclick={(e) => { e.stopPropagation(); activeShotTimOutcome = 'goal'; }}>⚽ Goal</button>
              </div>
            </div>
            <div class="pitch-bar-right no-print">
              <select bind:value={activeShotShooterNo} class="select-mini-player" title="Pilih Penembak (Sinkron ke Matrix SH & GL)">
                <option value={null}>{selectedTagPlayerNo ? `Penembak: #${selectedTagPlayerNo}` : 'Pilih Penembak'}</option>
                {#each players as p}
                  <option value={p.no}>#{p.no} {p.name.split(' ')[0]}</option>
                {/each}
              </select>
              <button type="button" class="btn-expand-pitch" onclick={() => (expandedPitch = 'shot_tim')} title="Perbesar Layar Penuh">
                <Maximize2 size={13} />
              </button>
            </div>
          </div>
          <div 
            class="mini-futsal-pitch" 
            onclick={(e) => handleMiniPitchClick('shot_tim', e)}
            role="button"
            tabindex="0"
            onkeydown={() => {}}>
            <!-- Real Futsal Pitch Image from lapangan.png -->
            <img src="/lapangan.png" alt="Lapangan Futsal" class="pitch-bg-img" />

            <!-- Shots Tim Dots with Half Filter -->
            {#each events.filter(e => e.type === 'shot' && e.team === 'home' && (activePitchHalfFilter === 'all' || e.half === activePitchHalfFilter)) as evt}
              <div 
                class="mini-pitch-dot dot-shot-tim" 
                style="left: {(evt.x / 800) * 100}%; top: {(evt.y / 480) * 100}%;"
                onclick={(e) => openEditTag(evt, e)}
                title="Shot Tim ({evt.outcome?.toUpperCase()}) {evt.playerNo ? `oleh #${evt.playerNo}` : ''} [{evt.half === 1 ? '1ºH' : '2ºH'}] - Klik untuk Edit/Hapus">
                {#if evt.outcome === 'goal'}
                  ⚽{#if evt.playerNo}<span class="dot-sub-no">{evt.playerNo}</span>{/if}
                {:else if evt.playerNo}
                  <span class="dot-pno">{evt.playerNo}</span>
                {:else if evt.outcome === 'ontarget'}
                  T
                {:else if evt.outcome === 'rejected'}
                  R
                {:else if evt.outcome === 'post'}
                  P
                {:else}
                  O
                {/if}
              </div>
            {/each}
          </div>
          <!-- Table Shots Tim -->
          <table class="doc-table mini-table">
            <tbody>
              <tr>
                <td class="td-icon-circle">Ⓣ</td>
                <td class="td-pitch-metric-label">ON TARGET</td>
                <td class="td-shot-count">{shotsTimOnTarget}</td>
              </tr>
              <tr>
                <td class="td-icon-circle">Ⓞ</td>
                <td class="td-pitch-metric-label">OUT</td>
                <td class="td-shot-count">{shotsTimOut}</td>
              </tr>
              <tr>
                <td class="td-icon-circle">Ⓡ</td>
                <td class="td-pitch-metric-label">REJECTED</td>
                <td class="td-shot-count">{shotsTimRejected}</td>
              </tr>
              <tr>
                <td class="td-icon-circle">Ⓟ</td>
                <td class="td-pitch-metric-label">POST</td>
                <td class="td-shot-count">{shotsTimPost}</td>
              </tr>
              <tr class="tr-pitch-total">
                <td class="td-icon-circle font-bold">Ⓖ</td>
                <td class="td-pitch-metric-label font-bold">GOAL</td>
                <td class="td-shot-count font-bold">{shotsTimGoal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PITCH 4: SHOTS LAWAN -->
        <div class="pitch-column-card">
          <div class="pitch-title-bar">
            <div class="title-with-outcomes">
              <span>SHOTS LAWAN</span>
              <div class="card-outcome-chips no-print">
                <button type="button" class="chip-outcome {activeShotLawanOutcome === 'ontarget' ? 'chip-active' : ''}" onclick={(e) => { e.stopPropagation(); activeShotLawanOutcome = 'ontarget'; }}>Ⓣ Target</button>
                <button type="button" class="chip-outcome {activeShotLawanOutcome === 'out' ? 'chip-active' : ''}" onclick={(e) => { e.stopPropagation(); activeShotLawanOutcome = 'out'; }}>Ⓞ Out</button>
                <button type="button" class="chip-outcome {activeShotLawanOutcome === 'rejected' ? 'chip-active' : ''}" onclick={(e) => { e.stopPropagation(); activeShotLawanOutcome = 'rejected'; }}>Ⓡ Reject</button>
                <button type="button" class="chip-outcome {activeShotLawanOutcome === 'post' ? 'chip-active' : ''}" onclick={(e) => { e.stopPropagation(); activeShotLawanOutcome = 'post'; }}>Ⓟ Post</button>
                <button type="button" class="chip-outcome chip-goal {activeShotLawanOutcome === 'goal' ? 'chip-active' : ''}" onclick={(e) => { e.stopPropagation(); activeShotLawanOutcome = 'goal'; }}>⚽ Goal</button>
              </div>
            </div>
            <button type="button" class="btn-expand-pitch no-print" onclick={() => (expandedPitch = 'shot_lawan')} title="Perbesar Layar Penuh">
              <Maximize2 size={13} />
            </button>
          </div>
          <div 
            class="mini-futsal-pitch" 
            onclick={(e) => handleMiniPitchClick('shot_lawan', e)}
            role="button"
            tabindex="0"
            onkeydown={() => {}}>
            <!-- Real Futsal Pitch Image from lapangan.png -->
            <img src="/lapangan.png" alt="Lapangan Futsal" class="pitch-bg-img" />

            <!-- Shots Lawan Dots with Half Filter -->
            {#each events.filter(e => e.type === 'shot' && e.team === 'away' && (activePitchHalfFilter === 'all' || e.half === activePitchHalfFilter)) as evt}
              <div 
                class="mini-pitch-dot dot-shot-lawan" 
                style="left: {(evt.x / 800) * 100}%; top: {(evt.y / 480) * 100}%;"
                onclick={(e) => openEditTag(evt, e)}
                title="Shot Lawan ({evt.outcome?.toUpperCase()}) [{evt.half === 1 ? '1ºH' : '2ºH'}] - Klik untuk Edit/Hapus">
                {#if evt.outcome === 'goal'}⚽{:else if evt.outcome === 'ontarget'}T{:else if evt.outcome === 'rejected'}R{:else if evt.outcome === 'post'}P{:else}O{/if}
              </div>
            {/each}
          </div>
          <!-- Table Shots Lawan -->
          <table class="doc-table mini-table">
            <tbody>
              <tr>
                <td class="td-icon-circle">Ⓣ</td>
                <td class="td-pitch-metric-label">ON TARGET</td>
                <td class="td-shot-count">{shotsLawanOnTarget}</td>
              </tr>
              <tr>
                <td class="td-icon-circle">Ⓞ</td>
                <td class="td-pitch-metric-label">OUT</td>
                <td class="td-shot-count">{shotsLawanOut}</td>
              </tr>
              <tr>
                <td class="td-icon-circle">Ⓡ</td>
                <td class="td-pitch-metric-label">REJECTED</td>
                <td class="td-shot-count">{shotsLawanRejected}</td>
              </tr>
              <tr>
                <td class="td-icon-circle">Ⓟ</td>
                <td class="td-pitch-metric-label">POST</td>
                <td class="td-shot-count">{shotsLawanPost}</td>
              </tr>
              <tr class="tr-pitch-total">
                <td class="td-icon-circle font-bold">Ⓖ</td>
                <td class="td-pitch-metric-label font-bold">GOAL</td>
                <td class="td-shot-count font-bold">{shotsLawanGoal}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <!-- FULLSCREEN / EXPANDED PITCH MODAL -->
    {#if expandedPitch}
      <div class="expanded-modal-overlay" onclick={() => (expandedPitch = null)} role="presentation">
        <div class="expanded-modal-card" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
          <div class="modal-header-pitch">
            <h3>
              {#if expandedPitch === 'rec'}Papan Taktis: RECOVERED BALLS
              {:else if expandedPitch === 'lost'}Papan Taktis: LOST BALLS
              {:else if expandedPitch === 'shot_tim'}Papan Taktis: SHOTS TIM (Home)
              {:else}Papan Taktis: SHOTS LAWAN (Away){/if}
            </h3>
            <button type="button" class="btn-close-modal" onclick={() => (expandedPitch = null)}>
              <X size={18} />
            </button>
          </div>

          <div class="modal-body-pitch">
            <p class="modal-pitch-hint">Klik titik mana pun pada lapangan futsal untuk mencatat event ({matchStore.activeHalf === 1 ? 'Babak 1' : 'Babak 2'}). Klik tag yang ada untuk mengedit atau menghapusnya:</p>
            <div 
              class="expanded-pitch-canvas"
              onclick={(e) => handleMiniPitchClick(expandedPitch!, e)}
              role="button"
              tabindex="0"
              onkeydown={() => {}}>
              <img src="/lapangan.png" alt="Lapangan Futsal" class="pitch-bg-img" />

              <!-- Render Dots in Expanded Modal with Half Filter -->
              {#if expandedPitch === 'rec'}
                {#each events.filter(e => e.type === 'recovery' && (activePitchHalfFilter === 'all' || e.half === activePitchHalfFilter)) as evt}
                  <div 
                    class="mini-pitch-dot {evt.team === 'home' ? 'dot-rec' : 'dot-rec-lawan'} dot-large" 
                    style="left: {(evt.x / 800) * 100}%; top: {(evt.y / 480) * 100}%;"
                    onclick={(e) => openEditTag(evt, e)}>
                    R
                  </div>
                {/each}
              {:else if expandedPitch === 'lost'}
                {#each events.filter(e => e.type === 'turnover' && (activePitchHalfFilter === 'all' || e.half === activePitchHalfFilter)) as evt}
                  <div 
                    class="mini-pitch-dot {evt.team === 'home' ? 'dot-lost' : 'dot-lost-lawan'} dot-large" 
                    style="left: {(evt.x / 800) * 100}%; top: {(evt.y / 480) * 100}%;"
                    onclick={(e) => openEditTag(evt, e)}>
                    L
                  </div>
                {/each}
              {:else if expandedPitch === 'shot_tim'}
                {#each events.filter(e => e.type === 'shot' && e.team === 'home' && (activePitchHalfFilter === 'all' || e.half === activePitchHalfFilter)) as evt}
                  <div 
                    class="mini-pitch-dot dot-shot-tim dot-large" 
                    style="left: {(evt.x / 800) * 100}%; top: {(evt.y / 480) * 100}%;"
                    onclick={(e) => openEditTag(evt, e)}>
                    {#if evt.outcome === 'goal'}⚽{:else if evt.outcome === 'ontarget'}T{:else if evt.outcome === 'rejected'}R{:else if evt.outcome === 'post'}P{:else}O{/if}
                  </div>
                {/each}
              {:else if expandedPitch === 'shot_lawan'}
                {#each events.filter(e => e.type === 'shot' && e.team === 'away' && (activePitchHalfFilter === 'all' || e.half === activePitchHalfFilter)) as evt}
                  <div 
                    class="mini-pitch-dot dot-shot-lawan dot-large" 
                    style="left: {(evt.x / 800) * 100}%; top: {(evt.y / 480) * 100}%;"
                    onclick={(e) => openEditTag(evt, e)}>
                    {#if evt.outcome === 'goal'}⚽{:else if evt.outcome === 'ontarget'}T{:else if evt.outcome === 'rejected'}R{:else if evt.outcome === 'post'}P{:else}O{/if}
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- 5. MODAL EDIT & HAPUS TAG (INTERAKTIF & TERINTEGRASI PEMAIN) -->
    {#if editingEvent}
      <div class="tag-modal-overlay" onclick={() => (editingEvent = null)} role="presentation">
        <div class="tag-modal-dialog" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
          <div class="tag-modal-header">
            <div class="tag-modal-title">
              <Edit3 size={18} class="text-sky-400" />
              <span>Edit / Hapus Tag Aksi</span>
            </div>
            <button type="button" class="btn-close-tag-modal" onclick={() => (editingEvent = null)}>
              <X size={16} />
            </button>
          </div>

          <div class="tag-modal-body">
            <!-- Event Type & Pitch Zone Badge -->
            <div class="tag-meta-summary">
              <div class="meta-badge-type">
                {#if editingEvent.type === 'recovery'}🔵 RECOVERY BALL
                {:else if editingEvent.type === 'turnover'}🔴 LOST BALL
                {:else}🎯 SHOT {editingEvent.team === 'home' ? 'TIM KITA' : 'LAWAN'}{/if}
              </div>
              <div class="meta-badge-zone {editingEvent.x < 400 ? 'zone-own' : 'zone-opp'}">
                {editingEvent.x < 400 ? '🛡️ OWN FIELD (Bidang Sendiri / Kiri)' : '⚡ OPPOSITE FIELD (Bidang Lawan / Kanan)'}
              </div>
            </div>

            <!-- Form Edit -->
            <div class="tag-form-grid">
              
              <!-- Team Selector -->
              <div class="tag-form-group">
                <label class="tag-form-label">Tim Pelaku:</label>
                <div class="tag-team-switch">
                  <button 
                    type="button" 
                    class="btn-team-switch {editingEvent.team === 'home' ? 'selected-home' : ''}" 
                    onclick={() => (editingEvent.team = 'home')}>
                    🔵 Tim Kita (Home)
                  </button>
                  <button 
                    type="button" 
                    class="btn-team-switch {editingEvent.team === 'away' ? 'selected-away' : ''}" 
                    onclick={() => (editingEvent.team = 'away')}>
                    🟣 Lawan (Away)
                  </button>
                </div>
              </div>

              <!-- Half Selector -->
              <div class="tag-form-group">
                <label class="tag-form-label">Babak Pertandingan:</label>
                <div class="tag-half-switch">
                  <button 
                    type="button" 
                    class="btn-half-switch {editingEvent.half === 1 ? 'selected-half' : ''}" 
                    onclick={() => (editingEvent.half = 1)}>
                    Babak 1 (1ºH)
                  </button>
                  <button 
                    type="button" 
                    class="btn-half-switch {editingEvent.half === 2 ? 'selected-half' : ''}" 
                    onclick={() => (editingEvent.half = 2)}>
                    Babak 2 (2ºH)
                  </button>
                </div>
              </div>

              <!-- Outcome / Hasil (Khusus Shot) -->
              {#if editingEvent.type === 'shot'}
                <div class="tag-form-group full-width">
                  <label class="tag-form-label">Hasil Tembakan (Outcome):</label>
                  <div class="tag-outcomes-pills">
                    <button 
                      type="button" 
                      class="btn-outcome-pill {editingEvent.outcome === 'ontarget' ? 'pill-active' : ''}"
                      onclick={() => (editingEvent.outcome = 'ontarget')}>
                      Ⓣ On Target
                    </button>
                    <button 
                      type="button" 
                      class="btn-outcome-pill {editingEvent.outcome === 'out' ? 'pill-active' : ''}"
                      onclick={() => (editingEvent.outcome = 'out')}>
                      Ⓞ Out
                    </button>
                    <button 
                      type="button" 
                      class="btn-outcome-pill {editingEvent.outcome === 'rejected' ? 'pill-active' : ''}"
                      onclick={() => (editingEvent.outcome = 'rejected')}>
                      Ⓡ Rejected
                    </button>
                    <button 
                      type="button" 
                      class="btn-outcome-pill {editingEvent.outcome === 'post' ? 'pill-active' : ''}"
                      onclick={() => (editingEvent.outcome = 'post')}>
                      Ⓟ Post
                    </button>
                    <button 
                      type="button" 
                      class="btn-outcome-pill pill-goal {editingEvent.outcome === 'goal' ? 'pill-active' : ''}"
                      onclick={() => (editingEvent.outcome = 'goal')}>
                      ⚽ GOAL
                    </button>
                  </div>
                </div>
              {/if}

              <!-- Pemain Pelaksana Dropdown (Terkoneksi ke Matrix) -->
              <div class="tag-form-group full-width">
                <label class="tag-form-label">Pemain Pelaksana (Sinkron Otomatis ke Matrix):</label>
                <select class="tag-form-input" bind:value={editingEvent.playerNo}>
                  <option value={null}>-- Tanpa Pemain Spesifik --</option>
                  {#each allRows as item}
                    {#if item.player?.name}
                      <option value={item.no}>#{item.no} - {item.player.name}</option>
                    {:else}
                      <option value={item.no}>#{item.no} (Pemain #{item.no})</option>
                    {/if}
                  {/each}
                </select>
              </div>

              <!-- Waktu & Player No -->
              <div class="tag-form-group">
                <label class="tag-form-label">Waktu Tag (Menit:Detik):</label>
                <input class="tag-form-input" bind:value={editingEvent.timeStr} placeholder="20:00" />
              </div>

              <!-- Posisi X & Y (Bisa digeser/diatur) -->
              <div class="tag-form-group">
                <label class="tag-form-label">Posisi Koordinat X (0-800):</label>
                <div class="coord-input-wrap">
                  <input type="number" min="0" max="800" class="tag-form-input" bind:value={editingEvent.x} />
                  <span class="coord-hint">{editingEvent.x < 400 ? 'Own Field' : 'Opp Field'}</span>
                </div>
              </div>

              <div class="tag-form-group full-width">
                <label class="tag-form-label">Posisi Koordinat Y (0-480):</label>
                <input type="number" min="0" max="480" class="tag-form-input" bind:value={editingEvent.y} />
              </div>

              <!-- Catatan -->
              <div class="tag-form-group full-width">
                <label class="tag-form-label">Catatan Tambahan:</label>
                <input class="tag-form-input" bind:value={editingEvent.note} placeholder="Tuliskan catatan kejadian..." />
              </div>

            </div>
          </div>

          <div class="tag-modal-footer">
            <button type="button" class="btn-tag-delete" onclick={() => deleteSpecificEvent(editingEvent.id)}>
              <Trash2 size={15} />
              <span>Hapus Tag</span>
            </button>
            <div class="footer-right-actions">
              <button type="button" class="btn-tag-cancel" onclick={() => (editingEvent = null)}>
                Batal
              </button>
              <button type="button" class="btn-tag-save" onclick={saveEditedEvent}>
                <Check size={15} />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- 6. MODAL KELOLA SEMUA TAG (ALL EVENTS MANAGER) -->
    {#if showEventsManager}
      <div class="events-manager-overlay" onclick={() => (showEventsManager = false)} role="presentation">
        <div class="events-manager-dialog" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
          <div class="events-manager-header">
            <div class="manager-title-group">
              <ListOrdered size={20} class="text-sky-400" />
              <div>
                <h3 class="manager-title">Kelola Semua Tag Lapangan</h3>
                <p class="manager-sub">Total {events.length} aksi tercatat pada pertandingan ini</p>
              </div>
            </div>
            <button type="button" class="btn-close-manager" onclick={() => (showEventsManager = false)}>
              <X size={18} />
            </button>
          </div>

          <!-- Controls Bar (Filter + Search) -->
          <div class="manager-controls-bar">
            <!-- Filter Type -->
            <div class="filter-group">
              <span class="filter-lbl"><Filter size={13} /> Tipe:</span>
              <button 
                type="button" 
                class="filter-pill {eventFilterType === 'all' ? 'pill-selected' : ''}" 
                onclick={() => (eventFilterType = 'all')}>
                Semua ({events.length})
              </button>
              <button 
                type="button" 
                class="filter-pill {eventFilterType === 'recovery' ? 'pill-selected' : ''}" 
                onclick={() => (eventFilterType = 'recovery')}>
                Recovery ({events.filter(e => e.type === 'recovery').length})
              </button>
              <button 
                type="button" 
                class="filter-pill {eventFilterType === 'turnover' ? 'pill-selected' : ''}" 
                onclick={() => (eventFilterType = 'turnover')}>
                Lost Ball ({events.filter(e => e.type === 'turnover').length})
              </button>
              <button 
                type="button" 
                class="filter-pill {eventFilterType === 'shot' ? 'pill-selected' : ''}" 
                onclick={() => (eventFilterType = 'shot')}>
                Shots ({events.filter(e => e.type === 'shot').length})
              </button>
            </div>

            <!-- Filter Team -->
            <div class="filter-group">
              <span class="filter-lbl">Tim:</span>
              <button 
                type="button" 
                class="filter-pill {eventFilterTeam === 'all' ? 'pill-selected' : ''}" 
                onclick={() => (eventFilterTeam = 'all')}>
                Semua
              </button>
              <button 
                type="button" 
                class="filter-pill {eventFilterTeam === 'home' ? 'pill-selected' : ''}" 
                onclick={() => (eventFilterTeam = 'home')}>
                🔵 Tim Kita
              </button>
              <button 
                type="button" 
                class="filter-pill {eventFilterTeam === 'away' ? 'pill-selected' : ''}" 
                onclick={() => (eventFilterTeam = 'away')}>
                🟣 Lawan
              </button>
            </div>

            <!-- Search -->
            <div class="manager-search-box">
              <Search size={14} class="search-icon" />
              <input class="manager-search-input" placeholder="Cari waktu, pemain, catatan..." bind:value={eventSearchQuery} />
            </div>
          </div>

          <!-- Events List Table -->
          <div class="events-table-wrapper">
            {#if filteredEvents.length === 0}
              <div class="events-empty-state">
                <p>Tidak ada tag aksi yang sesuai dengan filter.</p>
              </div>
            {:else}
              <table class="events-mgmt-table">
                <thead>
                  <tr>
                    <th>WAKTU</th>
                    <th>BABAK</th>
                    <th>TIPE AKSI</th>
                    <th>TIM</th>
                    <th>AREA LAPANGAN</th>
                    <th>PEMAIN</th>
                    <th>CATATAN</th>
                    <th style="width: 110px;">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {#each filteredEvents as evt}
                    <tr>
                      <td class="td-event-time">{evt.timeStr || '-'}</td>
                      <td>{evt.half === 1 ? '1ºH' : '2ºH'}</td>
                      <td>
                        {#if evt.type === 'recovery'}
                          <span class="badge-evt-type badge-recovery">Recovery</span>
                        {:else if evt.type === 'turnover'}
                          <span class="badge-evt-type badge-loss">Lost Ball</span>
                        {:else}
                          <span class="badge-evt-type badge-shot">
                            Shot ({evt.outcome?.toUpperCase()})
                          </span>
                        {/if}
                      </td>
                      <td>
                        <span class="badge-team {evt.team === 'home' ? 'badge-team-home' : 'badge-team-away'}">
                          {evt.team === 'home' ? '🔵 Tim' : '🟣 Lawan'}
                        </span>
                      </td>
                      <td>
                        <span class="badge-zone {evt.x < 400 ? 'zone-own-badge' : 'zone-opp-badge'}">
                          {evt.x < 400 ? 'OWN (Kiri)' : 'OPPOSITE (Kanan)'}
                        </span>
                      </td>
                      <td>{evt.playerNo ? `#${evt.playerNo}` : '-'}</td>
                      <td class="td-event-note">{evt.note || '-'}</td>
                      <td>
                        <div class="table-row-actions">
                          <button 
                            type="button" 
                            class="btn-row-edit" 
                            onclick={(e) => openEditTag(evt, e)}
                            title="Edit Tag">
                            <Edit3 size={13} />
                          </button>
                          <button 
                            type="button" 
                            class="btn-row-delete" 
                            onclick={(e) => deleteSpecificEvent(evt.id, e)}
                            title="Hapus Tag">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>

          <!-- Footer with Delete All -->
          <div class="events-manager-footer">
            <button type="button" class="btn-clear-all-tags" onclick={deleteAllEvents} disabled={events.length === 0}>
              <Trash2 size={15} />
              <span>Hapus Semua Tag ({events.length})</span>
            </button>
            <button type="button" class="btn-tag-cancel" onclick={() => (showEventsManager = false)}>
              Tutup
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if showConfigModal}
      <MatchConfigModal onClose={() => (showConfigModal = false)} />
    {/if}

  </div>
</div>

<style>
  /* Viewport and print setup */
  .sheet-viewport {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding-bottom: 3rem;
  }

  /* 0. TOP ACTION BAR (Hidden in print) */
  .sheet-toolbar,
  .sheet-top-controls {
    width: 100%;
    max-width: 1680px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(14, 24, 40, 0.95);
    border: 1px solid rgba(156, 179, 204, 0.22);
    padding: 0.55rem 1.15rem;
    border-radius: 10px;
    margin-bottom: 0.85rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    flex-wrap: wrap;
    gap: 12px;
  }

  .toolbar-left-group {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .sheet-title-badge {
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 800;
    font-size: 0.84rem;
    color: #f1f5f9;
    letter-spacing: 0.04em;
  }

  .badge-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 8px #38bdf8;
  }

  .toolbar-action-buttons {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .btn-tool-action {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    border-radius: 6px;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-tool-print {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    color: #ffffff;
    border: 1px solid #38bdf8;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.25);
  }

  .btn-tool-print:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
  }

  .btn-tool-excel {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  .btn-tool-excel:hover {
    background: rgba(16, 185, 129, 0.28);
    color: #ffffff;
  }

  .btn-tool-manage {
    background: rgba(56, 189, 248, 0.12);
    color: #7dd3fc;
    border: 1px solid rgba(56, 189, 248, 0.35);
  }

  .btn-tool-manage:hover {
    background: #1b3558;
    color: #ffffff;
  }

  .sheet-width-switcher {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .layout-lbl {
    font-size: 0.72rem;
    color: #9cb3cc;
    font-weight: 600;
  }

  .segmented-pill-group {
    display: flex;
    align-items: center;
    background: rgba(8, 14, 24, 0.85);
    border: 1px solid rgba(156, 179, 204, 0.2);
    border-radius: 7px;
    padding: 2px;
    gap: 2px;
  }

  .btn-size-chip, .btn-segment-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: 1px solid transparent;
    color: #9cb3cc;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .btn-size-chip:hover, .btn-segment-pill:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .btn-size-chip.active, .btn-segment-pill.active {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    border-color: #38bdf8;
    color: #ffffff;
    font-weight: 700;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.35);
  }

  /* Document Sheet Styling (Exact replication of contoh.pdf) */
  .analysis-document-sheet {
    background: #ffffff;
    color: #000000;
    width: 100%;
    padding: 18px 24px;
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    border-radius: 4px;
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.5);
    transition: max-width 0.2s ease-in-out;
  }

  .sheet-width-standard {
    max-width: 1200px;
  }

  .sheet-width-wide {
    max-width: 1440px;
  }

  .sheet-width-ultrawide {
    max-width: 1680px;
  }

  .sheet-width-full {
    max-width: 98vw;
    width: 98%;
  }

  /* 1. TOP HEADER */
  .doc-header-row {
    display: flex;
    border: 1.5px solid #000000;
    margin-bottom: 6px;
    background: #ffffff;
  }

  .hdr-cell {
    display: flex;
    align-items: center;
    border-right: 1.5px solid #000000;
  }

  .hdr-cell:last-child {
    border-right: none;
  }

  .cell-game { flex: 2.5; }
  .cell-comp { flex: 2; }
  .cell-date { flex: 1.2; }
  .cell-time { flex: 1; }
  .cell-place { flex: 1.5; }

  .hdr-label {
    background: #162a45;
    color: #ffffff;
    font-weight: bold;
    font-size: 9.5px;
    padding: 4px 8px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.05em;
    min-width: 48px;
  }

  .hdr-input {
    flex: 1;
    border: none;
    outline: none;
    padding: 3px 6px;
    font-size: 10.5px;
    font-weight: bold;
    color: #000000;
    background: transparent;
  }

  /* 2. SUB ROW: SCORE, FOULS, TO, PAKET */
  .doc-sub-row {
    display: flex;
    gap: 8px;
    margin-bottom: 6px;
    height: 78px;
  }

  .box-score-container {
    flex: 2.2;
  }

  .box-fouls-container {
    flex: 2.2;
  }

  .box-to-container {
    width: 105px;
    border: 1.5px solid #000000;
    display: flex;
    flex-direction: column;
  }

  .to-header {
    background: #162a45;
    color: #ffffff;
    font-weight: bold;
    font-size: 8px;
    text-align: center;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
  }

  .to-hint {
    font-size: 6.5px;
    color: #9cb3cc;
    font-weight: normal;
  }

  .to-rows {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .to-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #000000;
    padding: 0 2px;
    position: relative;
  }

  .to-input-wrapper:last-child {
    border-bottom: none;
  }

  .to-row-tag {
    font-size: 7px;
    font-weight: 800;
    color: #64748b;
    font-family: 'JetBrains Mono', monospace;
    min-width: 14px;
  }

  .tag-h1-home, .tag-h2-home { color: #2563eb; }
  .tag-h1-away, .tag-h2-away { color: #dc2626; }

  .to-input-row {
    flex: 1;
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    text-align: center;
    font-size: 8px;
    font-weight: bold;
    font-family: 'JetBrains Mono', monospace;
    padding: 0 2px;
    background: transparent;
  }

  .btn-stamp-to {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 9px;
    padding: 0 1px;
    opacity: 0.5;
    transition: opacity 0.15s;
    line-height: 1;
  }

  .to-input-wrapper:hover .btn-stamp-to {
    opacity: 1;
  }

  .to-input-row::placeholder {
    color: #94a3b8;
    font-weight: normal;
    font-size: 7.5px;
  }

  .box-paket-container {
    flex: 3.5;
    border: 1.5px solid #000000;
    display: flex;
    flex-direction: column;
  }

  .paket-header {
    background: #162a45;
    color: #ffffff;
    font-weight: bold;
    font-size: 8.5px;
    text-align: center;
    padding: 2px 6px;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .paket-onpitch-tag {
    font-size: 7.5px;
    font-weight: normal;
    background: rgba(255, 255, 255, 0.2);
    padding: 1px 4px;
    border-radius: 3px;
    color: #fef08a;
  }

  .sub-indicator {
    color: #fb923c;
    font-weight: bold;
  }

  .paket-content-list {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-flow: column;
    grid-template-rows: repeat(3, 1fr);
    padding: 2px 4px;
    font-size: 8.5px;
    column-gap: 6px;
    row-gap: 1px;
  }

  .pkt-line {
    display: flex;
    gap: 3px;
    align-items: center;
    cursor: pointer;
    padding: 1px 2px;
    border-radius: 2px;
    transition: background 0.12s;
  }

  .pkt-line:hover {
    background: #e2e8f0;
  }

  .pkt-active {
    background: #cbd5e1;
    font-weight: bold;
  }

  .pkt-num {
    font-weight: bold;
    color: #000000;
    width: 12px;
    cursor: pointer;
    user-select: none;
  }

  .pkt-num:hover {
    color: #162a45;
  }

  .pkt-inline-input {
    flex: 1;
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-family: monospace;
    font-weight: 600;
    font-size: 8.5px;
    color: #000000;
    padding: 0;
  }

  .pkt-code {
    font-family: monospace;
    font-weight: 600;
  }

  .hdr-input-date, .hdr-input-time {
    cursor: pointer;
    font-family: Arial, sans-serif;
  }

  .pkt-dot-active {
    color: #059669;
    font-size: 8px;
  }

  /* Player rows on-court highlights */
  .row-on-court {
    background: rgba(16, 185, 129, 0.08);
  }

  .td-no-on-court {
    background: #e2e8f0;
    cursor: pointer;
  }

  .no-cell-flex {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .court-dot-badge {
    color: #059669;
    font-size: 8px;
    line-height: 1;
  }

  .name-on-court {
    font-weight: bold;
    color: #0f172a !important;
  }

  /* Tables */
  .doc-table {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
    border: 1.5px solid #000000;
    text-align: center;
  }

  .doc-table th, .doc-table td {
    border: 1px solid #000000;
    padding: 2px;
  }

  .th-blue {
    background: #162a45;
    color: #ffffff;
    font-size: 9px;
    font-weight: bold;
    padding: 2px 4px;
  }

  .td-team-label {
    width: 110px;
    text-align: left;
    padding-left: 4px;
  }

  .cell-input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    text-align: center;
    font-size: 10px;
    padding: 0;
  }

  .text-left { text-align: left; }
  .font-bold { font-weight: bold; }

  .td-final-score {
    font-weight: bold;
    font-size: 11px;
    background: #f1f5f9;
  }

  /* Fouls Table */
  .td-half-tag {
    background: #162a45;
    color: #ffffff;
    font-weight: bold;
    font-size: 9px;
  }

  .td-foul-box {
    width: 18px;
    cursor: pointer;
    font-size: 10px;
    font-weight: bold;
    user-select: none;
  }

  .td-foul-5th {
    background: #f59e0b;
  }

  .foul-filled {
    background: #e2e8f0;
    color: #000000;
  }

  .td-foul-total {
    font-weight: bold;
    background: #f8fafc;
  }

  /* 3. STATS MATRIX TABLE */
  .doc-matrix-section {
    margin-bottom: 6px;
  }

  .matrix-sheet-table {
    width: 100%;
    border-collapse: collapse;
    border: 1.5px solid #000000;
  }

  .matrix-sheet-table th, .matrix-sheet-table td {
    border: 1px solid #000000;
    font-size: 9px;
    padding: 1px 2px;
    height: 15px;
  }

  .th-num-col { width: 24px; vertical-align: middle; }
  .th-player-col { width: 140px; text-align: left; padding-left: 6px; vertical-align: middle; }
  .th-cards-col { width: 44px; vertical-align: middle; }

  .th-main-blue {
    background: #162a45;
    color: #ffffff;
    font-weight: bold;
    font-size: 9px;
    padding: 3px 4px;
    vertical-align: middle;
  }

  .th-stats-banner {
    background: #dce3eb;
    color: #0f172a;
    font-weight: 800;
    font-size: 9px;
    letter-spacing: 0.12em;
    padding: 2px 4px;
    vertical-align: middle;
  }

  .th-card-y {
    background: #facc15;
    color: #000000;
    font-weight: 900;
    font-size: 9px;
    width: 22px;
    vertical-align: middle;
  }

  .th-card-r {
    background: #ef4444;
    color: #ffffff;
    font-weight: 900;
    font-size: 9px;
    width: 22px;
    vertical-align: middle;
  }

  .th-cat-title {
    background: #ffffff;
    color: #0f172a;
    font-weight: bold;
    font-size: 8.5px;
    padding: 2px 4px;
  }

  .th-half-label {
    background: #ffffff;
    color: #334155;
    font-size: 7.5px;
    line-height: 1.1;
    font-weight: bold;
    padding: 2px 1px;
    width: 32px;
  }

  .tr-player-data {
    height: 15px;
  }

  .td-row-no {
    font-weight: bold;
    text-align: center;
  }

  .td-row-player {
    text-align: left;
    padding-left: 4px !important;
  }

  .player-name-cell {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: 9.5px;
    color: #000000;
    padding: 0;
  }

  .td-matrix-stat {
    text-align: center;
    cursor: pointer;
    user-select: none;
    font-weight: 600;
    font-size: 9px;
  }

  .td-matrix-stat:hover {
    background: #e2e8f0;
  }

  .bg-yellow-card { background: #facc15 !important; font-weight: bold; }
  .bg-red-card { background: #ef4444 !important; color: #ffffff; font-weight: bold; }

  .td-gl-cell {
    font-weight: bold;
    color: #047857;
  }

  /* 4. BOTTOM 4 PITCHES SECTION */
  .pitch-section-container {
    margin-top: 10px;
  }

  .pitch-section-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #142236 0%, #1e3352 100%);
    padding: 6px 14px;
    border-radius: 8px 8px 0 0;
    border: 1.5px solid #000000;
    border-bottom: none;
    color: #ffffff;
    min-height: 42px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pitch-toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pitch-toolbar-heading {
    font-size: 0.84rem;
    font-weight: 800;
    color: #7dd3fc;
    letter-spacing: 0.04em;
  }

  .pitch-toolbar-sub {
    font-size: 0.72rem;
    color: #9cb3cc;
  }

  .pitch-toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .toolbar-capsule-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .lbl-capsule-title {
    font-size: 0.72rem;
    color: #cbd5e1;
    font-weight: 600;
    white-space: nowrap;
  }

  .btn-toolbar-tags {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #7dd3fc;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  /* Active Player Tagger Bar */
  .active-player-tagger-bar {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    background: #0b1526;
    border-left: 1.5px solid #000000;
    border-right: 1.5px solid #000000;
    border-bottom: 1.5px solid #000000;
    padding: 6px 14px;
    color: #ffffff;
    flex-wrap: wrap;
  }

  .tagger-label-group {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.74rem;
    font-weight: 800;
    color: #38bdf8;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .tagger-heading {
    color: #38bdf8;
  }

  .tagger-player-chips {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .chip-tagger {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.3);
    color: #cbd5e1;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .chip-tagger:hover {
    background: rgba(51, 65, 85, 0.9);
    border-color: #38bdf8;
    color: #ffffff;
  }

  .chip-tagger.chip-tagger-active {
    background: #0284c7;
    border-color: #38bdf8;
    color: #ffffff;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
  }

  .chip-court-dot {
    color: #34d399;
    font-size: 8px;
  }

  .chip-pno {
    color: #facc15;
    font-weight: 800;
  }

  .select-tagger-player {
    background: #0f172a;
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #f8fafc;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .tagger-active-badge {
    font-size: 0.72rem;
    color: #34d399;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.35);
    padding: 2px 8px;
    border-radius: 6px;
  }

  .pitch-bar-right {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .select-mini-player {
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #f8fafc;
    font-size: 7.5px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 4px;
    max-width: 105px;
  }

  .dot-pno {
    font-size: 8px;
    font-weight: 900;
  }

  .dot-sub-no {
    font-size: 7px;
    font-weight: 900;
    margin-left: 1px;
  }

  .doc-pitches-grid {
    display: grid;
    gap: 12px;
  }

  /* 4 Kolom Sejajar (Standar Template PDF) */
  .doc-pitches-grid.pitch-layout-large {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  /* 2x2 Grid (Ukuran Lapangan Besar - Sangat Lega) */
  .doc-pitches-grid.pitch-layout-grid2x2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  /* 1 Kolom (Ukuran Ultra Besar) */
  .doc-pitches-grid.pitch-layout-compact {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }

  .pitch-column-card {
    display: flex;
    flex-direction: column;
    border: 1.5px solid #000000;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  .pitch-title-bar {
    background: #142236;
    color: #ffffff;
    font-weight: bold;
    font-size: 9px;
    padding: 3px 6px;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(156, 179, 204, 0.2);
  }

  .title-with-toggle, .title-with-outcomes {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .card-team-toggle {
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 4px;
    padding: 1px;
  }

  .toggle-pill {
    background: transparent;
    border: none;
    color: #cbd5e1;
    font-size: 7.5px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .toggle-pill.active-home {
    background: linear-gradient(135deg, #1b3558 0%, #294b79 100%);
    color: #ffffff;
    border: 1px solid #38bdf8;
    box-shadow: 0 0 6px rgba(56, 189, 248, 0.45);
  }

  .toggle-pill.active-away {
    background: #7c3aed;
    color: #ffffff;
    box-shadow: 0 0 6px rgba(124, 58, 237, 0.6);
  }

  .card-outcome-chips {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .chip-outcome {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    font-size: 7px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .chip-outcome:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .chip-outcome.chip-active {
    background: #ffffff;
    color: #000000;
    border-color: #ffffff;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
  }

  .chip-goal.chip-active {
    background: #facc15;
    color: #000000;
    border-color: #facc15;
  }

  .bar-green {
    background: #0e3d36 !important;
  }

  .btn-expand-pitch {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 8px;
    opacity: 0.9;
    transition: all 0.15s;
  }

  .btn-expand-pitch:hover {
    opacity: 1;
    background: #1b3558;
    border-color: #38bdf8;
    color: #ffffff;
  }

  .mini-futsal-pitch {
    position: relative;
    width: 100%;
    aspect-ratio: 640 / 379; /* Exact aspect ratio of lapangan.png */
    background: #ea4335;
    cursor: crosshair;
    border-bottom: 1.5px solid #000000;
    overflow: hidden;
  }

  .pitch-bg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    display: block;
    user-select: none;
    pointer-events: none;
  }

  .mini-pitch-dot {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    font-size: 9px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    border: 1.5px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
    z-index: 10;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .mini-pitch-dot:hover {
    transform: translate(-50%, -50%) scale(1.35);
    z-index: 20;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  }

  .dot-large {
    width: 22px;
    height: 22px;
    font-size: 11px;
    border-width: 2px;
  }

  .dot-rec { background: #0284c7; }
  .dot-rec-lawan { background: #7c3aed; } /* Ungu / Violet untuk recovery lawan */
  .dot-lost { background: #ef4444; }
  .dot-lost-lawan { background: #f97316; } /* Oranye untuk lost ball lawan */
  .dot-shot-tim { background: #059669; }
  .dot-shot-lawan { background: #d97706; }

  .mini-table {
    border: none;
    font-size: 8.5px;
    width: 100%;
    border-collapse: collapse;
  }

  .mini-table td, .mini-table th {
    padding: 3px 4px;
    font-size: 9px;
    height: 16px;
    border: 1px solid #000000;
  }

  .td-pitch-metric-label {
    text-align: left;
    padding-left: 6px !important;
    font-weight: 500;
  }

  .td-icon-circle {
    width: 22px;
    font-weight: bold;
    text-align: center;
    font-size: 10px;
  }

  .td-shot-count {
    width: 36px;
    font-weight: bold;
    text-align: center;
  }

  .tr-pitch-total {
    background: #f1f5f9;
    font-weight: bold;
  }

  /* FULLSCREEN EXPANDED MODAL */
  .expanded-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(6, 10, 18, 0.88);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    padding: 1rem;
  }

  .expanded-modal-card {
    background: #0c1524;
    border: 1.5px solid rgba(56, 189, 248, 0.4);
    border-radius: 16px;
    width: 95%;
    max-width: 980px;
    padding: 1.5rem;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.9);
    outline: none;
  }

  .modal-header-pitch {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
  }

  .modal-header-pitch h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    color: #7dd3fc;
    letter-spacing: 0.05em;
  }

  .btn-close-modal {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(156, 179, 204, 0.2);
    color: #ffffff;
    border-radius: 8px;
    padding: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .btn-close-modal:hover {
    background: #ef4444;
    border-color: #ef4444;
  }

  .modal-body-pitch {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .modal-pitch-hint {
    font-size: 0.85rem;
    color: #9cb3cc;
    margin: 0;
  }

  .expanded-pitch-canvas {
    position: relative;
    width: 100%;
    aspect-ratio: 800 / 480;
    background: #94a3b8;
    border: 2px solid #38bdf8;
    border-radius: 8px;
    overflow: hidden;
    cursor: crosshair;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  /* TAG EDIT MODAL STYLING */
  .tag-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(6, 10, 18, 0.85);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 400;
    padding: 1rem;
  }

  .tag-modal-dialog {
    background: #0c1524;
    border: 1.5px solid rgba(56, 189, 248, 0.4);
    border-radius: 14px;
    width: 100%;
    max-width: 580px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modalPop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes modalPop {
    from { transform: scale(0.94); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .tag-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: #142236;
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
  }

  .tag-modal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.05rem;
    font-weight: 800;
    color: #ffffff;
  }

  .btn-close-tag-modal {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(156, 179, 204, 0.2);
    color: #cbd5e1;
    border-radius: 6px;
    padding: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .btn-close-tag-modal:hover {
    background: #ef4444;
    border-color: #ef4444;
    color: #ffffff;
  }

  .tag-modal-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
    max-height: 70vh;
  }

  .tag-meta-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    flex-wrap: wrap;
    gap: 6px;
  }

  .meta-badge-type {
    font-size: 0.8rem;
    font-weight: 800;
    color: #38bdf8;
    letter-spacing: 0.04em;
  }

  .meta-badge-zone {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .zone-own {
    background: rgba(14, 165, 233, 0.2);
    color: #38bdf8;
    border: 1px solid rgba(14, 165, 233, 0.4);
  }

  .zone-opp {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.4);
  }

  .tag-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .tag-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tag-form-group.full-width {
    grid-column: span 2;
  }

  .tag-form-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #9cb3cc;
  }

  .tag-team-switch, .tag-half-switch {
    display: flex;
    gap: 6px;
  }

  .btn-team-switch, .btn-half-switch, .btn-switch-team, .btn-switch-half {
    flex: 1;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(156, 179, 204, 0.2);
    color: #cbd5e1;
    transition: all 0.15s;
  }

  .btn-team-switch.selected-home, .btn-switch-team.active-home {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    border-color: #38bdf8;
    color: #ffffff;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.35);
  }

  .btn-team-switch.selected-away, .btn-switch-team.active-away {
    background: #7c3aed;
    border-color: #a78bfa;
    color: #ffffff;
  }

  .btn-half-switch.selected-half, .btn-switch-half.active-half {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    border-color: #38bdf8;
    color: #ffffff;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.35);
  }

  .tag-outcomes-pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .btn-outcome-pill, .tag-outcome-btn {
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(156, 179, 204, 0.2);
    color: #cbd5e1;
    transition: all 0.15s;
  }

  .btn-outcome-pill:hover, .tag-outcome-btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .btn-outcome-pill.pill-active, .tag-outcome-btn.active-outcome {
    background: #ffffff;
    color: #0c1524;
    border-color: #ffffff;
    font-weight: 800;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  .btn-outcome-pill.pill-goal.pill-active {
    background: #facc15;
    color: #000000;
    border-color: #facc15;
  }

  .tag-form-input {
    background: rgba(8, 14, 24, 0.8);
    border: 1px solid rgba(156, 179, 204, 0.25);
    color: #ffffff;
    padding: 7px 10px;
    border-radius: 6px;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s;
  }

  .tag-form-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
  }

  .coord-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .coord-hint {
    font-size: 0.72rem;
    font-weight: 700;
    color: #38bdf8;
    white-space: nowrap;
  }

  .tag-modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1.25rem;
    background: #142236;
    border-top: 1px solid rgba(156, 179, 204, 0.15);
  }

  .footer-left-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-tag-delete, .btn-delete-tag {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    color: #f87171;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-tag-delete:hover, .btn-delete-tag:hover {
    background: #ef4444;
    color: #ffffff;
  }

  .footer-right-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-tag-cancel, .btn-cancel-tag {
    padding: 6px 12px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid rgba(156, 179, 204, 0.2);
    color: #9cb3cc;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-tag-cancel:hover, .btn-cancel-tag:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.06);
  }

  .btn-tag-save, .btn-save-tag {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border-radius: 6px;
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    border: 1px solid #38bdf8;
    color: #ffffff;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-tag-save:hover, .btn-save-tag:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
  }

  /* EVENTS MANAGER DRAWER / MODAL */
  .events-manager-overlay {
    position: fixed;
    inset: 0;
    background: rgba(6, 10, 18, 0.88);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 350;
    padding: 1.5rem;
  }

  .events-manager-dialog {
    background: #0c1524;
    border: 1.5px solid rgba(56, 189, 248, 0.4);
    border-radius: 16px;
    width: 100%;
    max-width: 960px;
    height: 82vh;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.9);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modalPop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .events-manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.4rem;
    background: #142236;
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
  }

  .manager-title-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .manager-title-group h3, .manager-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffffff;
  }

  .manager-sub {
    margin: 0;
    font-size: 0.75rem;
    color: #9cb3cc;
  }

  .tag-count-badge {
    background: #1b3558;
    color: #7dd3fc;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
    border: 1px solid #38bdf8;
  }

  .btn-close-manager {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(156, 179, 204, 0.2);
    color: #cbd5e1;
    border-radius: 6px;
    padding: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .btn-close-manager:hover {
    background: #ef4444;
    border-color: #ef4444;
    color: #ffffff;
  }

  .manager-controls-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    background: #101c2e;
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
    gap: 12px;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .filter-lbl {
    font-size: 0.75rem;
    color: #9cb3cc;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .filter-pill {
    padding: 3px 8px;
    border-radius: 5px;
    font-size: 0.72rem;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(156, 179, 204, 0.2);
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.1s;
  }

  .filter-pill:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .filter-pill.pill-selected {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    border-color: #38bdf8;
    color: #ffffff;
    font-weight: 700;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
  }

  .manager-search-box {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #080e18;
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 6px;
    padding: 4px 8px;
  }

  .search-icon {
    color: #9cb3cc;
  }

  .manager-search-input {
    background: transparent;
    border: none;
    outline: none;
    color: #ffffff;
    font-size: 0.78rem;
    width: 170px;
  }

  .events-table-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  .events-empty-state {
    padding: 3rem;
    text-align: center;
    color: #9cb3cc;
    font-size: 0.85rem;
  }

  .events-mgmt-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    color: #e2e8f0;
    text-align: left;
  }

  .events-mgmt-table th {
    background: #142236;
    color: #9cb3cc;
    font-weight: 700;
    font-size: 0.72rem;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
    position: sticky;
    top: 0;
    z-index: 5;
  }

  .events-mgmt-table td {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(156, 179, 204, 0.08);
    vertical-align: middle;
  }

  .events-mgmt-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .td-event-time {
    font-weight: 700;
    color: #7dd3fc;
  }

  .badge-evt-type {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .badge-recovery {
    background: rgba(56, 189, 248, 0.15);
    color: #7dd3fc;
    border: 1px solid rgba(56, 189, 248, 0.4);
  }

  .badge-loss {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.4);
  }

  .badge-shot {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  .badge-team {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .badge-team-home {
    background: rgba(56, 189, 248, 0.15);
    color: #7dd3fc;
  }

  .badge-team-away {
    background: rgba(124, 58, 237, 0.2);
    color: #a78bfa;
  }

  .badge-zone {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .zone-own-badge {
    background: rgba(56, 189, 248, 0.15);
    color: #7dd3fc;
  }

  .zone-opp-badge {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
  }

  .td-event-note {
    color: #9cb3cc;
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .table-row-actions {
    display: flex;
    gap: 6px;
  }

  .btn-row-edit, .btn-row-delete {
    padding: 4px 7px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .btn-row-edit {
    background: rgba(56, 189, 248, 0.15);
    color: #7dd3fc;
  }

  .btn-row-edit:hover {
    background: #1b3558;
    color: #ffffff;
  }

  .btn-row-delete {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }

  .btn-row-delete:hover {
    background: #ef4444;
    color: #ffffff;
  }

  .events-manager-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.25rem;
    background: #142236;
    border-top: 1px solid rgba(156, 179, 204, 0.15);
  }

  .btn-clear-all-tags {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    color: #f87171;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-clear-all-tags:hover:not(:disabled) {
    background: #ef4444;
    color: #ffffff;
  }

  .btn-clear-all-tags:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ==========================================================
     IPAD PRO M1 (11" & 12.9") & TABLET OPTIMIZATIONS
     ========================================================== */
  @media (max-width: 1366px) {
    .sheet-toolbar {
      padding: 0.5rem 0.85rem;
      gap: 8px;
    }

    .sheet-title-main {
      font-size: 0.78rem;
    }

    .btn-tool-action {
      padding: 4px 8px;
      font-size: 0.72rem;
    }

    .analysis-document-sheet {
      padding: 12px 14px;
    }

    .doc-pitches-grid.pitch-layout-large {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
  }

  @media (max-width: 1024px) {
    .sheet-viewport {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding: 0 4px 2rem 4px;
    }

    .analysis-document-sheet {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 8px 10px;
      margin: 0 auto;
    }

    .doc-matrix-section {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .doc-pitches-grid.pitch-layout-large,
    .doc-pitches-grid.pitch-layout-grid2x2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .sheet-toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .toolbar-left-group {
      justify-content: space-between;
    }

    .toolbar-action-buttons {
      flex-wrap: wrap;
    }

    .sheet-width-switcher {
      justify-content: flex-end;
    }

    .td-matrix-stat {
      min-height: 24px;
      font-size: 10px;
    }
  }

  @media (max-width: 768px) {
    .doc-pitches-grid.pitch-layout-large,
    .doc-pitches-grid.pitch-layout-grid2x2 {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }
  }

  /* PRINT STYLES: Perfect A4 Landscape match to contoh.pdf */
  @media print {
    .no-print {
      display: none !important;
    }

    body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .sheet-viewport {
      padding: 0 !important;
    }

    .analysis-document-sheet {
      box-shadow: none !important;
      max-width: 100% !important;
      padding: 0 !important;
      width: 100% !important;
    }

    @page {
      size: A4 landscape;
      margin: 6mm 8mm;
    }
  }
</style>
