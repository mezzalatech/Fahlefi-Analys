<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { api } from '../lib/api';
  import { 
    Plus, Minus, UserPlus, Filter, Search, ArrowUpDown, ArrowUp, ArrowDown, 
    RotateCcw, Shield, Award, AlertTriangle, Check, Printer, Download
  } from 'lucide-svelte';

  let filterPaket = $state<boolean>(false);
  let filterRole = $state<'ALL' | 'GK' | 'OUTFIELD' | 'GOAL_SCORERS' | 'CARDED'>('ALL');
  let searchQuery = $state<string>('');
  
  // Sort State
  type SortKey = 'no' | 'name' | 'yc' | 'rc' | 'loss1' | 'rec1' | 'fl1' | 'sh1' | 'gl1' | 'loss2' | 'rec2' | 'fl2' | 'sh2' | 'gl2' | 'totLoss' | 'totRec' | 'totFl' | 'totSh' | 'totGl';
  let sortKey = $state<SortKey>('no');
  let sortOrder = $state<'asc' | 'desc'>('asc');

  let showAddPlayer = $state<boolean>(false);
  let newPlayerName = $state<string>('');
  let newPlayerNo = $state<number>(26);
  let newPlayerIsGk = $state<boolean>(false);

  let rawPlayers = $derived(matchStore.data?.players || []);
  let activePaket = $derived(
    matchStore.data?.pakets?.find((p) => p.paketIndex === matchStore.activePaketIndex)
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      // Default descending for stats, ascending for no/name
      sortOrder = (key === 'no' || key === 'name') ? 'asc' : 'desc';
    }
  }

  function resetFilters() {
    searchQuery = '';
    filterPosition = 'ALL';
    filterRole = 'ALL';
    filterPaket = false;
    sortKey = 'no';
    sortOrder = 'asc';
  }

  let displayedPlayers = $derived.by(() => {
    let list = [...rawPlayers];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => (p.name || '').toLowerCase().includes(q) || p.no.toString().includes(q));
    }

    // 2. Paket Filter
    if (filterPaket && activePaket) {
      try {
        const nums: number[] = JSON.parse(activePaket.playerNumbers);
        list = list.filter((p) => nums.includes(p.no));
      } catch {}
    }

    // 3. Role / Stat Filter
    if (filterRole === 'GK') {
      list = list.filter(p => p.isGk === 1);
    } else if (filterRole === 'OUTFIELD') {
      list = list.filter(p => p.isGk === 0);
    } else if (filterRole === 'GOAL_SCORERS') {
      list = list.filter(p => (p.gl1 + p.gl2) > 0);
    } else if (filterRole === 'CARDED') {
      list = list.filter(p => (p.yellowCards + p.redCards) > 0);
    }

    // 4. Sorting
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortKey) {
        case 'no': valA = a.no; valB = b.no; break;
        case 'name': valA = (a.name || '').toLowerCase(); valB = (b.name || '').toLowerCase(); break;
        case 'yc': valA = a.yellowCards || 0; valB = b.yellowCards || 0; break;
        case 'rc': valA = a.redCards || 0; valB = b.redCards || 0; break;
        case 'loss1': valA = a.loss1 || 0; valB = b.loss1 || 0; break;
        case 'rec1': valA = a.rec1 || 0; valB = b.rec1 || 0; break;
        case 'fl1': valA = a.fl1 || 0; valB = b.fl1 || 0; break;
        case 'sh1': valA = a.sh1 || 0; valB = b.sh1 || 0; break;
        case 'gl1': valA = a.gl1 || 0; valB = b.gl1 || 0; break;
        case 'loss2': valA = a.loss2 || 0; valB = b.loss2 || 0; break;
        case 'rec2': valA = a.rec2 || 0; valB = b.rec2 || 0; break;
        case 'fl2': valA = a.fl2 || 0; valB = b.fl2 || 0; break;
        case 'sh2': valA = a.sh2 || 0; valB = b.sh2 || 0; break;
        case 'gl2': valA = a.gl2 || 0; valB = b.gl2 || 0; break;
        case 'totLoss': valA = (a.loss1 + a.loss2); valB = (b.loss1 + b.loss2); break;
        case 'totRec': valA = (a.rec1 + a.rec2); valB = (b.rec1 + b.rec2); break;
        case 'totFl': valA = (a.fl1 + a.fl2); valB = (b.fl1 + b.fl2); break;
        case 'totSh': valA = (a.sh1 + a.sh2); valB = (b.sh1 + b.sh2); break;
        case 'totGl': valA = (a.gl1 + a.gl2); valB = (b.gl1 + b.gl2); break;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  });

  // Totals calculations
  let totals = $derived.by(() => {
    return displayedPlayers.reduce(
      (acc, p) => {
        acc.loss1 += p.loss1;
        acc.loss2 += p.loss2;
        acc.rec1 += p.rec1;
        acc.rec2 += p.rec2;
        acc.fl1 += p.fl1;
        acc.fl2 += p.fl2;
        acc.sh1 += p.sh1;
        acc.sh2 += p.sh2;
        acc.gl1 += p.gl1;
        acc.gl2 += p.gl2;
        acc.yc += p.yellowCards;
        acc.rc += p.redCards;
        return acc;
      },
      { loss1: 0, loss2: 0, rec1: 0, rec2: 0, fl1: 0, fl2: 0, sh1: 0, sh2: 0, gl1: 0, gl2: 0, yc: 0, rc: 0 }
    );
  });

  async function handleAddPlayer() {
    if (!newPlayerName.trim() || !matchStore.data) return;
    await api.addPlayer(matchStore.data.match.id, {
      no: newPlayerNo,
      name: newPlayerName.trim(),
      isGk: newPlayerIsGk ? 1 : 0,
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
    await matchStore.loadMatch(matchStore.data.match.id);
    newPlayerName = '';
    newPlayerNo += 1;
    showAddPlayer = false;
  }

  function handlePrint() {
    window.print();
  }
</script>

<div class="table-container glass-card">
  <!-- Table Controls Bar -->
  <div class="table-header-bar">
    <div class="header-left-tools">
      <div class="title-with-badge">
        <h2 class="section-title">Matrix Statistik Pemain</h2>
        <span class="player-count-badge">{displayedPlayers.length} / {rawPlayers.length} Pemain</span>
      </div>
      <p class="section-subtitle">Tabel interaktif dengan fitur sortir kolom, filter cepat, dan freeze panes header.</p>
    </div>

    <div class="header-right-tools">
      <button type="button" class="btn-print-stats" onclick={handlePrint} title="Cetak atau Simpan Laporan Matrix Statistik ke PDF">
        <Printer size={15} />
        <span>Cetak PDF</span>
      </button>
      <a href={`/api/matches/${matchStore.data?.match.id || 1}/export`} target="_blank" class="btn-export-stats-excel" title="Ekspor Data Statistik ke File Excel">
        <Download size={15} />
        <span>Ekspor Excel</span>
      </a>
      <button type="button" class="btn-add-player" onclick={() => (showAddPlayer = !showAddPlayer)}>
        <UserPlus size={15} />
        <span>Tambah Pemain</span>
      </button>
    </div>
  </div>

  <!-- Filter & Search Toolbar -->
  <div class="filter-toolbar">
    <!-- Search Box -->
    <div class="search-input-wrap">
      <Search size={15} class="search-icon" />
      <input 
        type="text" 
        bind:value={searchQuery} 
        placeholder="Cari nama atau no punggung..." 
        class="search-input" />
      {#if searchQuery}
        <button class="clear-search-btn" onclick={() => (searchQuery = '')}>×</button>
      {/if}
    </div>

    <!-- Role Filter Pills -->
    <div class="filter-pills-group">
      <button 
        class="filter-pill {filterRole === 'ALL' ? 'active' : ''}" 
        onclick={() => (filterRole = 'ALL')}>
        Semua
      </button>
      <button 
        class="filter-pill {filterRole === 'GK' ? 'active' : ''}" 
        onclick={() => (filterRole = 'GK')}>
        🛡️ Kiper (GK)
      </button>
      <button 
        class="filter-pill {filterRole === 'OUTFIELD' ? 'active' : ''}" 
        onclick={() => (filterRole = 'OUTFIELD')}>
        🏃 Pemain Lapangan
      </button>
      <button 
        class="filter-pill {filterRole === 'GOAL_SCORERS' ? 'active' : ''}" 
        onclick={() => (filterRole = 'GOAL_SCORERS')}>
        ⚽ Pencetak Gol
      </button>
      <button 
        class="filter-pill {filterRole === 'CARDED' ? 'active' : ''}" 
        onclick={() => (filterRole = 'CARDED')}>
        🟨 Kartu
      </button>
    </div>

    <!-- Active Paket Filter Pill -->
    {#if activePaket}
      <button 
        class="filter-chip {filterPaket ? 'active' : ''}" 
        onclick={() => (filterPaket = !filterPaket)}>
        <Filter size={13} />
        <span>Hanya Paket #{activePaket.paketIndex} ({activePaket.code})</span>
      </button>
    {/if}

    <!-- Reset Filter Button -->
    {#if searchQuery || filterRole !== 'ALL' || filterPaket || sortKey !== 'no'}
      <button class="btn-reset-filters" onclick={resetFilters} title="Reset Filter & Sortir">
        <RotateCcw size={13} />
        <span>Reset</span>
      </button>
    {/if}
  </div>

  <!-- Add Player Inline Form -->
  {#if showAddPlayer}
    <div class="add-player-panel">
      <div class="form-group">
        <label for="new-p-no">No. Punggung:</label>
        <input id="new-p-no" type="number" bind:value={newPlayerNo} min="1" max="99" class="input-no" />
      </div>
      <div class="form-group">
        <label for="new-p-name">Nama Pemain:</label>
        <input id="new-p-name" type="text" bind:value={newPlayerName} placeholder="cth. Bambang Bayu Saptaji" class="input-name" />
      </div>
      <div class="form-group-checkbox">
        <label>
          <input type="checkbox" bind:checked={newPlayerIsGk} />
          <span>Kiper (GK)</span>
        </label>
      </div>
      <div class="form-actions">
        <button class="btn-save-p" onclick={handleAddPlayer}>Simpan</button>
        <button class="btn-cancel-p" onclick={() => (showAddPlayer = false)}>Batal</button>
      </div>
    </div>
  {/if}

  <!-- Stats Data Matrix with Freeze Panes (Sticky Header & Left Columns) -->
  <div class="table-freeze-container">
    <table class="matrix-table">
      <thead>
        <!-- Top Multi-column Header (Sticky Top) -->
        <tr class="header-row-top">
          <th rowspan="2" class="th-sticky th-no sortable-th {sortKey === 'no' ? 'sorted' : ''}" onclick={() => handleSort('no')}>
            <div class="th-content">
              <span>NO</span>
              {#if sortKey === 'no'}
                <span class="sort-arrow">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {:else}
                <ArrowUpDown size={11} class="sort-hint" />
              {/if}
            </div>
          </th>
          <th rowspan="2" class="th-sticky th-name sortable-th {sortKey === 'name' ? 'sorted' : ''}" onclick={() => handleSort('name')}>
            <div class="th-content">
              <span>NAMA PEMAIN</span>
              {#if sortKey === 'name'}
                <span class="sort-arrow">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {:else}
                <ArrowUpDown size={11} class="sort-hint" />
              {/if}
            </div>
          </th>
          <th colspan="2" class="th-cards">KARTU</th>
          <th colspan="5" class="th-half th-h1">BABAK 1 (1ºH)</th>
          <th colspan="5" class="th-half th-h2">BABAK 2 (2ºH)</th>
          <th colspan="5" class="th-total">TOTAL PERTANDINGAN</th>
        </tr>
        
        <!-- Sub-header for stats metrics (Sticky Top Row 2) -->
        <tr class="header-row-sub">
          <!-- Cards -->
          <th class="th-yc sortable-th {sortKey === 'yc' ? 'sorted' : ''}" onclick={() => handleSort('yc')} title="Kartu Kuning">
            Y {sortKey === 'yc' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-rc sortable-th {sortKey === 'rc' ? 'sorted' : ''}" onclick={() => handleSort('rc')} title="Kartu Merah">
            R {sortKey === 'rc' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          
          <!-- H1 -->
          <th class="th-stat sortable-th {sortKey === 'loss1' ? 'sorted' : ''}" onclick={() => handleSort('loss1')} title="Turnover / Bola Hilang Babak 1">
            LOSS {sortKey === 'loss1' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat sortable-th {sortKey === 'rec1' ? 'sorted' : ''}" onclick={() => handleSort('rec1')} title="Rebut Bola / Recovery Babak 1">
            REC {sortKey === 'rec1' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat sortable-th {sortKey === 'fl1' ? 'sorted' : ''}" onclick={() => handleSort('fl1')} title="Pelanggaran / Fouls Babak 1">
            FL {sortKey === 'fl1' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat sortable-th {sortKey === 'sh1' ? 'sorted' : ''}" onclick={() => handleSort('sh1')} title="Tembakan / Shots Babak 1">
            SH {sortKey === 'sh1' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat sortable-th {sortKey === 'gl1' ? 'sorted' : ''}" onclick={() => handleSort('gl1')} title="Gol Babak 1">
            GL {sortKey === 'gl1' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>

          <!-- H2 -->
          <th class="th-stat sortable-th {sortKey === 'loss2' ? 'sorted' : ''}" onclick={() => handleSort('loss2')} title="Turnover / Bola Hilang Babak 2">
            LOSS {sortKey === 'loss2' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat sortable-th {sortKey === 'rec2' ? 'sorted' : ''}" onclick={() => handleSort('rec2')} title="Rebut Bola / Recovery Babak 2">
            REC {sortKey === 'rec2' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat sortable-th {sortKey === 'fl2' ? 'sorted' : ''}" onclick={() => handleSort('fl2')} title="Pelanggaran / Fouls Babak 2">
            FL {sortKey === 'fl2' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat sortable-th {sortKey === 'sh2' ? 'sorted' : ''}" onclick={() => handleSort('sh2')} title="Tembakan / Shots Babak 2">
            SH {sortKey === 'sh2' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat sortable-th {sortKey === 'gl2' ? 'sorted' : ''}" onclick={() => handleSort('gl2')} title="Gol Babak 2">
            GL {sortKey === 'gl2' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>

          <!-- Total -->
          <th class="th-stat-tot sortable-th {sortKey === 'totLoss' ? 'sorted' : ''}" onclick={() => handleSort('totLoss')} title="Total Loss">
            LOSS {sortKey === 'totLoss' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat-tot sortable-th {sortKey === 'totRec' ? 'sorted' : ''}" onclick={() => handleSort('totRec')} title="Total Recovery">
            REC {sortKey === 'totRec' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat-tot sortable-th {sortKey === 'totFl' ? 'sorted' : ''}" onclick={() => handleSort('totFl')} title="Total Fouls">
            FL {sortKey === 'totFl' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat-tot sortable-th {sortKey === 'totSh' ? 'sorted' : ''}" onclick={() => handleSort('totSh')} title="Total Shots">
            SH {sortKey === 'totSh' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
          <th class="th-stat-tot sortable-th {sortKey === 'totGl' ? 'sorted' : ''}" onclick={() => handleSort('totGl')} title="Total Goals">
            GL {sortKey === 'totGl' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </th>
        </tr>
      </thead>

      <tbody>
        {#each displayedPlayers as player, plIdx (player.id ? `pl_${player.id}` : `pl_idx_${plIdx}`)}
          <tr class="player-row {player.isGk ? 'is-gk-row' : ''}">
            <!-- Frozen Column 1: No -->
            <td class="td-sticky td-no">
              <span class="no-badge">{player.no}</span>
            </td>

            <!-- Frozen Column 2: Player Name -->
            <td class="td-sticky td-name">
              <div class="name-container">
                <span class="p-name">{player.name || `Pemain #${player.no}`}</span>
                {#if player.isGk}
                  <span class="gk-tag">GK</span>
                {/if}
              </div>
            </td>

            <!-- CARDS Y -->
            <td class="td-card">
              <button 
                class="btn-card-toggle {player.yellowCards > 0 ? 'active-yc' : ''}"
                onclick={() => matchStore.updatePlayerStat(player.id, 'yellowCards', player.yellowCards > 0 ? -1 : 1)}>
                {player.yellowCards > 0 ? player.yellowCards : '-'}
              </button>
            </td>

            <!-- CARDS R -->
            <td class="td-card">
              <button 
                class="btn-card-toggle {player.redCards > 0 ? 'active-rc' : ''}"
                onclick={() => matchStore.updatePlayerStat(player.id, 'redCards', player.redCards > 0 ? -1 : 1)}>
                {player.redCards > 0 ? player.redCards : '-'}
              </button>
            </td>

            <!-- H1: LOSS -->
            <td class="td-stat-val">
              <div class="stat-stepper">
                <span class="stat-value {player.loss1 > 0 ? 'highlight-loss' : ''}">{player.loss1 || 0}</span>
                <div class="stepper-btns">
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'loss1', 1)}>+</button>
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'loss1', -1)}>-</button>
                </div>
              </div>
            </td>

            <!-- H1: REC -->
            <td class="td-stat-val">
              <div class="stat-stepper">
                <span class="stat-value {player.rec1 > 0 ? 'highlight-rec' : ''}">{player.rec1 || 0}</span>
                <div class="stepper-btns">
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'rec1', 1)}>+</button>
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'rec1', -1)}>-</button>
                </div>
              </div>
            </td>

            <!-- H1: FL -->
            <td class="td-stat-val">
              <div class="stat-stepper">
                <span class="stat-value {player.fl1 > 0 ? 'highlight-fl' : ''}">{player.fl1 || 0}</span>
                <div class="stepper-btns">
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'fl1', 1)}>+</button>
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'fl1', -1)}>-</button>
                </div>
              </div>
            </td>

            <!-- H1: SH -->
            <td class="td-stat-val">
              <div class="stat-stepper">
                <span class="stat-value {player.sh1 > 0 ? 'highlight-sh' : ''}">{player.sh1 || 0}</span>
                <div class="stepper-btns">
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'sh1', 1)}>+</button>
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'sh1', -1)}>-</button>
                </div>
              </div>
            </td>

            <!-- H1: GL -->
            <td class="td-stat-val">
              <div class="stat-stepper">
                <span class="stat-value {player.gl1 > 0 ? 'highlight-gl' : ''}">{player.gl1 || 0}</span>
                <div class="stepper-btns">
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'gl1', 1)}>+</button>
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'gl1', -1)}>-</button>
                </div>
              </div>
            </td>

            <!-- H2: LOSS -->
            <td class="td-stat-val">
              <div class="stat-stepper">
                <span class="stat-value {player.loss2 > 0 ? 'highlight-loss' : ''}">{player.loss2 || 0}</span>
                <div class="stepper-btns">
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'loss2', 1)}>+</button>
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'loss2', -1)}>-</button>
                </div>
              </div>
            </td>

            <!-- H2: REC -->
            <td class="td-stat-val">
              <div class="stat-stepper">
                <span class="stat-value {player.rec2 > 0 ? 'highlight-rec' : ''}">{player.rec2 || 0}</span>
                <div class="stepper-btns">
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'rec2', 1)}>+</button>
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'rec2', -1)}>-</button>
                </div>
              </div>
            </td>

            <!-- H2: FL -->
            <td class="td-stat-val">
              <div class="stat-stepper">
                <span class="stat-value {player.fl2 > 0 ? 'highlight-fl' : ''}">{player.fl2 || 0}</span>
                <div class="stepper-btns">
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'fl2', 1)}>+</button>
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'fl2', -1)}>-</button>
                </div>
              </div>
            </td>

            <!-- H2: SH -->
            <td class="td-stat-val">
              <div class="stat-stepper">
                <span class="stat-value {player.sh2 > 0 ? 'highlight-sh' : ''}">{player.sh2 || 0}</span>
                <div class="stepper-btns">
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'sh2', 1)}>+</button>
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'sh2', -1)}>-</button>
                </div>
              </div>
            </td>

            <!-- H2: GL -->
            <td class="td-stat-val">
              <div class="stat-stepper">
                <span class="stat-value {player.gl2 > 0 ? 'highlight-gl' : ''}">{player.gl2 || 0}</span>
                <div class="stepper-btns">
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'gl2', 1)}>+</button>
                  <button class="btn-step" onclick={() => matchStore.updatePlayerStat(player.id, 'gl2', -1)}>-</button>
                </div>
              </div>
            </td>

            <!-- TOTALS -->
            <td class="td-tot-cell">{player.loss1 + player.loss2}</td>
            <td class="td-tot-cell highlight-tot-rec">{player.rec1 + player.rec2}</td>
            <td class="td-tot-cell highlight-tot-fl">{player.fl1 + player.fl2}</td>
            <td class="td-tot-cell highlight-tot-sh">{player.sh1 + player.sh2}</td>
            <td class="td-tot-cell highlight-tot-gl">{player.gl1 + player.gl2}</td>
          </tr>
        {/each}
      </tbody>

      <!-- Table Footer / Totals (Sticky Bottom) -->
      <tfoot>
        <tr class="footer-totals-row">
          <td class="td-sticky td-no-foot" colspan="2">
            <span class="totals-label">TOTAL AKUMULASI SKUAD:</span>
          </td>
          <td class="td-foot-card">{totals.yc}</td>
          <td class="td-foot-card">{totals.rc}</td>
          
          <!-- H1 Totals -->
          <td>{totals.loss1}</td>
          <td>{totals.rec1}</td>
          <td>{totals.fl1}</td>
          <td>{totals.sh1}</td>
          <td class="tot-gl-cell">{totals.gl1}</td>

          <!-- H2 Totals -->
          <td>{totals.loss2}</td>
          <td>{totals.rec2}</td>
          <td>{totals.fl2}</td>
          <td>{totals.sh2}</td>
          <td class="tot-gl-cell">{totals.gl2}</td>

          <!-- Match Totals -->
          <td class="tot-main-cell">{totals.loss1 + totals.loss2}</td>
          <td class="tot-main-cell">{totals.rec1 + totals.rec2}</td>
          <td class="tot-main-cell">{totals.fl1 + totals.fl2}</td>
          <td class="tot-main-cell">{totals.sh1 + totals.sh2}</td>
          <td class="tot-main-cell tot-gl-main">{totals.gl1 + totals.gl2}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>

<style>
  .glass-card {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  /* Header Bar */
  .table-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .title-with-badge {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .section-title {
    font-size: 1.2rem;
    font-weight: 800;
    color: #f1f5f9;
    margin: 0;
  }

  .player-count-badge {
    font-size: 0.72rem;
    font-weight: 700;
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.3);
    padding: 2px 8px;
    border-radius: 12px;
  }

  .header-right-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .btn-print-stats {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.4);
    padding: 0.45rem 0.85rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-print-stats:hover {
    background: rgba(56, 189, 248, 0.25);
    border-color: #38bdf8;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
  }

  .btn-export-stats-excel {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.4);
    padding: 0.45rem 0.85rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s;
  }
  .btn-export-stats-excel:hover {
    background: rgba(16, 185, 129, 0.25);
    border-color: #10b981;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
  }

  .btn-add-player {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    color: #ffffff;
    border: 1px solid #38bdf8;
    padding: 0.45rem 0.9rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
    transition: all 0.15s;
  }
  .btn-add-player:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 14px rgba(56, 189, 248, 0.4);
  }

  /* Filter Toolbar */
  .filter-toolbar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    background: rgba(14, 24, 40, 0.6);
    padding: 0.6rem 0.85rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .search-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 220px;
    flex: 1;
    max-width: 320px;
  }

  :global(.search-icon) {
    position: absolute;
    left: 10px;
    color: #64748b;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    background: #0f172a;
    border: 1px solid rgba(156, 179, 204, 0.2);
    border-radius: 8px;
    padding: 0.45rem 1.8rem 0.45rem 2rem;
    color: #ffffff;
    font-size: 0.8rem;
  }
  .search-input:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }

  .clear-search-btn {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1rem;
    cursor: pointer;
    line-height: 1;
  }

  .filter-pills-group {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .filter-pill {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    font-size: 0.74rem;
    font-weight: 600;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .filter-pill:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f1f5f9;
  }
  .filter-pill.active {
    background: rgba(56, 189, 248, 0.2);
    border-color: #38bdf8;
    color: #38bdf8;
    font-weight: 700;
  }

  .filter-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
  }
  .filter-chip.active {
    background: #10b981;
    color: #064e3b;
    border-color: #10b981;
  }

  .btn-reset-filters {
    display: flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    cursor: pointer;
    margin-left: auto;
  }
  .btn-reset-filters:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  /* Add Player Panel */
  .add-player-panel {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #142236;
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .form-group label {
    font-size: 0.75rem;
    color: #9cb3cc;
    margin-right: 0.4rem;
  }

  .input-no {
    width: 60px;
    background: #0c1524;
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 6px;
    padding: 0.35rem 0.5rem;
    color: #ffffff;
    font-size: 0.8rem;
  }

  .input-name {
    width: 220px;
    background: #0c1524;
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 6px;
    padding: 0.35rem 0.65rem;
    color: #ffffff;
    font-size: 0.8rem;
  }

  .form-group-checkbox label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #f59e0b;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
  }

  .form-actions {
    display: flex;
    gap: 0.4rem;
    margin-left: auto;
  }

  .btn-save-p {
    background: #10b981;
    color: #064e3b;
    border: none;
    padding: 0.35rem 0.85rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
  }

  .btn-cancel-p {
    background: transparent;
    color: #9cb3cc;
    border: 1px solid rgba(156, 179, 204, 0.2);
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    font-size: 0.78rem;
    cursor: pointer;
  }

  /* ========================================== */
  /* FREEZE PANES TABLE CONTAINER               */
  /* ========================================== */
  .table-freeze-container {
    max-height: 68vh;
    overflow: auto;
    border: 1px solid rgba(156, 179, 204, 0.2);
    border-radius: 12px;
    background: #0a1322;
    -webkit-overflow-scrolling: touch;
    box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.5);
  }

  .matrix-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.76rem;
    text-align: center;
    white-space: nowrap;
  }

  /* Sticky Headers (Top Freeze) */
  thead {
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .header-row-top th {
    background: #101c2e;
    color: #e2e8f0;
    font-weight: 800;
    padding: 7px 4px;
    border-bottom: 1px solid rgba(156, 179, 204, 0.2);
    border-right: 1px solid rgba(156, 179, 204, 0.12);
  }

  .header-row-sub th {
    background: #14243b;
    color: #94a3b8;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 5px 2px;
    border-bottom: 2px solid #38bdf8;
    border-right: 1px solid rgba(156, 179, 204, 0.12);
  }

  .th-cards {
    background: #1a2333 !important;
    color: #fbbf24 !important;
  }
  .th-h1 {
    background: #122844 !important;
    color: #38bdf8 !important;
  }
  .th-h2 {
    background: #1c2242 !important;
    color: #c084fc !important;
  }
  .th-total {
    background: #0e3d36 !important;
    color: #34d399 !important;
  }

  .sortable-th {
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;
  }
  .sortable-th:hover {
    background: #1e3556 !important;
    color: #ffffff !important;
  }
  .sortable-th.sorted {
    background: #1b3a60 !important;
    color: #38bdf8 !important;
  }

  .th-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .sort-hint {
    color: #64748b;
  }
  .sort-arrow {
    color: #38bdf8;
    font-size: 0.65rem;
  }

  /* Sticky Left Columns (Freeze Pane) */
  .th-sticky {
    position: sticky;
    z-index: 30 !important;
  }

  .td-sticky {
    position: sticky;
    z-index: 15;
  }

  .th-no, .td-no {
    left: 0;
    width: 44px;
    min-width: 44px;
    max-width: 44px;
    background: #0f1c2e !important;
    border-right: 1px solid rgba(156, 179, 204, 0.25) !important;
  }

  .th-name, .td-name {
    left: 44px;
    width: 170px;
    min-width: 170px;
    max-width: 220px;
    text-align: left;
    padding-left: 8px !important;
    background: #0f1c2e !important;
    border-right: 2px solid #38bdf8 !important;
    box-shadow: 4px 0 10px rgba(0, 0, 0, 0.35);
  }

  .td-no {
    background: #0c1828 !important;
  }
  .td-name {
    background: #0c1828 !important;
  }

  .is-gk-row .td-no,
  .is-gk-row .td-name {
    background: #162438 !important;
  }

  .no-badge {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    color: #38bdf8;
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .name-container {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
  }

  .p-name {
    color: #f1f5f9;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .gk-tag {
    font-size: 0.62rem;
    font-weight: 800;
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.4);
    padding: 1px 4px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  /* Body Rows & Cells */
  .player-row td {
    padding: 5px 3px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    border-right: 1px solid rgba(255, 255, 255, 0.04);
  }

  .player-row:hover td {
    background: #14243b;
  }
  .player-row:hover .td-no,
  .player-row:hover .td-name {
    background: #162942 !important;
  }

  .td-card {
    width: 32px;
  }

  .btn-card-toggle {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: #64748b;
    font-weight: 800;
    font-size: 0.72rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .active-yc {
    background: #eab308 !important;
    color: #000000 !important;
    border-color: #eab308 !important;
    box-shadow: 0 0 8px rgba(234, 179, 8, 0.5);
  }

  .active-rc {
    background: #ef4444 !important;
    color: #ffffff !important;
    border-color: #ef4444 !important;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
  }

  .stat-stepper {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: rgba(0, 0, 0, 0.25);
    padding: 2px 4px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    min-width: 14px;
    color: #94a3b8;
  }

  .highlight-loss { color: #f87171 !important; }
  .highlight-rec { color: #34d399 !important; }
  .highlight-fl { color: #fbbf24 !important; }
  .highlight-sh { color: #38bdf8 !important; }
  .highlight-gl { 
    color: #4ade80 !important; 
    font-weight: 800 !important;
    text-shadow: 0 0 6px rgba(74, 222, 128, 0.4);
  }

  .stepper-btns {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .btn-step {
    width: 14px;
    height: 10px;
    font-size: 0.6rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #cbd5e1;
    border-radius: 2px;
    cursor: pointer;
  }
  .btn-step:hover {
    background: #38bdf8;
    color: #000000;
  }

  /* Totals Columns */
  .td-tot-cell {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    color: #cbd5e1;
    background: rgba(14, 61, 54, 0.15);
  }
  .highlight-tot-rec { color: #34d399; }
  .highlight-tot-fl { color: #fbbf24; }
  .highlight-tot-sh { color: #38bdf8; }
  .highlight-tot-gl { color: #4ade80; font-weight: 800; }

  /* Footer Totals (Sticky Bottom) */
  tfoot {
    position: sticky;
    bottom: 0;
    z-index: 18;
  }

  .footer-totals-row td {
    background: #0f243b;
    border-top: 2px solid #38bdf8;
    padding: 7px 4px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    color: #ffffff;
    font-size: 0.78rem;
  }

  .td-no-foot {
    left: 0;
    z-index: 25;
    background: #0f243b !important;
    text-align: left;
    padding-left: 10px !important;
    border-right: 2px solid #38bdf8 !important;
    box-shadow: 4px 0 10px rgba(0, 0, 0, 0.35);
  }

  .totals-label {
    font-family: 'Outfit', sans-serif;
    font-size: 0.74rem;
    color: #38bdf8;
    letter-spacing: 0.03em;
  }

  .tot-gl-cell {
    color: #4ade80 !important;
  }

  .tot-main-cell {
    background: #0d4137 !important;
    color: #6ee7b7 !important;
  }
  .tot-gl-main {
    color: #facc15 !important;
    font-size: 0.85rem !important;
  }

  /* Print Styles for Matrix Report */
  @media print {
    .table-container {
      background: #ffffff !important;
      color: #000000 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    .filter-toolbar,
    .header-right-tools,
    .btn-del-player,
    .btn-stat-adj {
      display: none !important;
    }
    .section-title {
      color: #000000 !important;
    }
    .section-subtitle {
      color: #475569 !important;
    }
    .table-freeze-container {
      max-height: none !important;
      overflow: visible !important;
    }
    .stats-table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    .stats-table th, .stats-table td {
      border: 1px solid #94a3b8 !important;
      color: #000000 !important;
      padding: 4px 6px !important;
      background: #ffffff !important;
    }
    .header-row-top th {
      background: #f1f5f9 !important;
      color: #0f172a !important;
    }
    .header-row-sub th {
      background: #f8fafc !important;
      color: #334155 !important;
    }
    .td-sticky, .th-sticky {
      position: static !important;
    }
  }
</style>
