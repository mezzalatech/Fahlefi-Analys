<script lang="ts">
  import { onMount } from 'svelte';
  import { matchStore } from '../lib/store.svelte';
  import { api, type MasterPlayer } from '../lib/api';
  import { 
    Users, 
    UserPlus, 
    Edit2, 
    Trash2, 
    Download, 
    Search, 
    Filter, 
    Award, 
    Target, 
    Shield, 
    Activity, 
    Plus,
    X,
    Check,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    RotateCcw,
    FileSpreadsheet,
    UploadCloud,
    AlertCircle
  } from 'lucide-svelte';

  let searchQuery = $state<string>('');
  let filterPosition = $state<string>('ALL');
  let filterFoot = $state<string>('ALL');
  let filterStatus = $state<string>('ALL');
  let filterMetric = $state<'ALL' | 'GOALS' | 'SHOTS' | 'RECOVERY'>('ALL');

  // Sort State
  type MasterSortKey = 'no' | 'name' | 'pos' | 'foot' | 'height' | 'weight' | 'status' | 'match' | 'goal' | 'shot' | 'acc' | 'rec' | 'loss';
  let sortKey = $state<MasterSortKey>('no');
  let sortOrder = $state<'asc' | 'desc'>('asc');

  let showPlayerModal = $state<boolean>(false);
  let editingPlayer = $state<MasterPlayer | null>(null);

  // Import State
  let isImporting = $state<boolean>(false);
  let importMessage = $state<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  let formNo = $state<number>(1);
  let formName = $state<string>('');
  let formNickname = $state<string>('');
  let formPosition = $state<'GK' | 'ANCHOR' | 'FLANK_LEFT' | 'FLANK_RIGHT' | 'PIVOT' | 'PLAYER'>('PLAYER');
  let formDominantFoot = $state<'KANAN' | 'KIRI' | 'KEDUA'>('KANAN');
  let formHeight = $state<number>(175);
  let formWeight = $state<number>(68);
  let formStatus = $state<'ACTIVE' | 'INJURED' | 'SUSPENDED'>('ACTIVE');

  onMount(() => {
    matchStore.loadMasterPlayers();
  });

  function handleSort(key: MasterSortKey) {
    if (sortKey === key) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      // Default descending for stats, ascending for no/name/pos
      sortOrder = (key === 'no' || key === 'name' || key === 'pos') ? 'asc' : 'desc';
    }
  }

  function resetFilters() {
    searchQuery = '';
    filterPosition = 'ALL';
    filterFoot = 'ALL';
    filterStatus = 'ALL';
    filterMetric = 'ALL';
    sortKey = 'no';
    sortOrder = 'asc';
  }

  const filteredPlayers = $derived.by(() => {
    let list = matchStore.masterPlayers.filter(p => {
      // 1. Search filter
      const matchSearch = (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (p.nickname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.noPunggung.toString().includes(searchQuery));
      
      // 2. Position filter
      const matchPos = filterPosition === 'ALL' || 
                       p.position === filterPosition || 
                       (filterPosition === 'FLANK' && p.position.startsWith('FLANK'));
      
      // 3. Foot filter
      const matchFoot = filterFoot === 'ALL' || p.dominantFoot === filterFoot;

      // 4. Status filter
      const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;

      // 5. Metric filter
      let matchMetric = true;
      if (filterMetric === 'GOALS') matchMetric = (p.stats?.totalGoals || 0) > 0;
      else if (filterMetric === 'SHOTS') matchMetric = (p.stats?.totalShots || 0) > 0;
      else if (filterMetric === 'RECOVERY') matchMetric = (p.stats?.totalRec || 0) > 0;

      return matchSearch && matchPos && matchFoot && matchStatus && matchMetric;
    });

    // Sort
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortKey) {
        case 'no': valA = a.noPunggung; valB = b.noPunggung; break;
        case 'name': valA = (a.name || '').toLowerCase(); valB = (b.name || '').toLowerCase(); break;
        case 'pos': valA = a.position || ''; valB = b.position || ''; break;
        case 'foot': valA = a.dominantFoot || ''; valB = b.dominantFoot || ''; break;
        case 'height': valA = a.height || 0; valB = b.height || 0; break;
        case 'weight': valA = a.weight || 0; valB = b.weight || 0; break;
        case 'status': valA = a.status || ''; valB = b.status || ''; break;
        case 'match': valA = a.stats?.totalMatches || 0; valB = b.stats?.totalMatches || 0; break;
        case 'goal': valA = a.stats?.totalGoals || 0; valB = b.stats?.totalGoals || 0; break;
        case 'shot': valA = a.stats?.totalShots || 0; valB = b.stats?.totalShots || 0; break;
        case 'acc': valA = a.stats?.shotAccuracy || 0; valB = b.stats?.shotAccuracy || 0; break;
        case 'rec': valA = a.stats?.totalRec || 0; valB = b.stats?.totalRec || 0; break;
        case 'loss': valA = a.stats?.totalLoss || 0; valB = b.stats?.totalLoss || 0; break;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  });

  const totalGoalsSquad = $derived.by(() => {
    return matchStore.masterPlayers.reduce((sum, p) => sum + (p.stats?.totalGoals || 0), 0);
  });

  const totalShotsSquad = $derived.by(() => {
    return matchStore.masterPlayers.reduce((sum, p) => sum + (p.stats?.totalShots || 0), 0);
  });

  const totalRecoveriesSquad = $derived.by(() => {
    return matchStore.masterPlayers.reduce((sum, p) => sum + (p.stats?.totalRec || 0), 0);
  });

  function openAddModal() {
    editingPlayer = null;
    formNo = (matchStore.masterPlayers.length > 0 ? Math.max(...matchStore.masterPlayers.map(p => p.noPunggung)) + 1 : 1);
    formName = '';
    formNickname = '';
    formPosition = 'PLAYER';
    formDominantFoot = 'KANAN';
    formHeight = 175;
    formWeight = 68;
    formStatus = 'ACTIVE';
    showPlayerModal = true;
  }

  function openEditModal(player: MasterPlayer) {
    editingPlayer = player;
    formNo = player.noPunggung;
    formName = player.name;
    formNickname = player.nickname || '';
    formPosition = player.position;
    formDominantFoot = player.dominantFoot;
    formHeight = player.height || 175;
    formWeight = player.weight || 68;
    formStatus = player.status;
    showPlayerModal = true;
  }

  async function handleSavePlayer(e: Event) {
    e.preventDefault();
    if (editingPlayer) {
      await matchStore.updateMasterPlayer(editingPlayer.id, {
        noPunggung: formNo,
        name: formName,
        nickname: formNickname,
        position: formPosition,
        dominantFoot: formDominantFoot,
        height: formHeight,
        weight: formWeight,
        status: formStatus
      });
    } else {
      await matchStore.createMasterPlayer({
        noPunggung: formNo,
        name: formName,
        nickname: formNickname,
        position: formPosition,
        dominantFoot: formDominantFoot,
        height: formHeight,
        weight: formWeight,
        status: formStatus
      });
    }
    showPlayerModal = false;
  }

  async function handleDelete(player: MasterPlayer) {
    if (confirm(`Hapus master pemain #${player.noPunggung} ${player.name}?`)) {
      await matchStore.deleteMasterPlayer(player.id);
    }
  }

  async function importToMatch(player: MasterPlayer) {
    await matchStore.importMasterPlayerToMatch(player);
    alert(`Pemain #${player.noPunggung} ${player.name} berhasil dimuat ke roster pertandingan aktif!`);
  }

  async function handleFileImport(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    isImporting = true;
    importMessage = null;

    try {
      const res = await api.importMasterPlayersFromExcel(file);
      await matchStore.loadMasterPlayers();
      importMessage = { text: res.message || `Berhasil mengimpor ${res.count} pemain dari Excel!`, type: 'success' };
    } catch (err: any) {
      importMessage = { text: err.message || 'Gagal mengimpor file Excel.', type: 'error' };
    } finally {
      isImporting = false;
      input.value = '';
    }
  }

  function getPositionBadge(pos: string) {
    switch (pos) {
      case 'GK': return { text: 'GK', class: 'badge-gk' };
      case 'ANCHOR': return { text: 'ANCHOR', class: 'badge-anchor' };
      case 'FLANK_LEFT': return { text: 'FLANK (L)', class: 'badge-flank' };
      case 'FLANK_RIGHT': return { text: 'FLANK (R)', class: 'badge-flank' };
      case 'PIVOT': return { text: 'PIVOT', class: 'badge-pivot' };
      default: return { text: 'PLAYER', class: 'badge-general' };
    }
  }
</script>

<div class="master-db-container">
  <!-- Import Notification Toast/Banner -->
  {#if importMessage}
    <div class="import-alert alert-{importMessage.type}">
      {#if importMessage.type === 'success'}
        <Check size={16} />
      {:else}
        <AlertCircle size={16} />
      {/if}
      <span>{importMessage.text}</span>
      <button class="alert-close" onclick={() => (importMessage = null)}>×</button>
    </div>
  {/if}

  <!-- Top Stat Highlights -->
  <div class="kpi-banner">
    <div class="kpi-card">
      <div class="kpi-icon-wrap bg-blue-subtle">
        <Users size={20} class="text-cyan" />
      </div>
      <div class="kpi-info">
        <span class="kpi-label">TOTAL SKUAD MASTER</span>
        <span class="kpi-val">{matchStore.masterPlayers.length} Pemain</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon-wrap bg-green-subtle">
        <Target size={20} class="text-emerald" />
      </div>
      <div class="kpi-info">
        <span class="kpi-label">TOTAL GOL TERCATAT</span>
        <span class="kpi-val">{totalGoalsSquad} Gol</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon-wrap bg-purple-subtle">
        <Activity size={20} class="text-purple" />
      </div>
      <div class="kpi-info">
        <span class="kpi-label">TOTAL SHOOTS AKUMULASI</span>
        <span class="kpi-val">{totalShotsSquad} Shots</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon-wrap bg-amber-subtle">
        <Shield size={20} class="text-amber" />
      </div>
      <div class="kpi-info">
        <span class="kpi-label">TOTAL RECOVERIES</span>
        <span class="kpi-val">{totalRecoveriesSquad} Rec</span>
      </div>
    </div>
  </div>

  <!-- Header Controls Bar -->
  <div class="toolbar-header">
    <div class="search-filter-group">
      <!-- Search Input -->
      <div class="search-box">
        <Search size={15} class="search-icon" />
        <input 
          type="text" 
          placeholder="Cari nama, panggilan, atau no..." 
          bind:value={searchQuery} 
        />
        {#if searchQuery}
          <button class="clear-btn" onclick={() => (searchQuery = '')}>×</button>
        {/if}
      </div>

      <!-- Position Filters -->
      <div class="filter-pill-group">
        <button 
          class="filter-pill {filterPosition === 'ALL' ? 'active' : ''}" 
          onclick={() => filterPosition = 'ALL'}>
          Semua Posisi
        </button>
        <button 
          class="filter-pill {filterPosition === 'GK' ? 'active' : ''}" 
          onclick={() => filterPosition = 'GK'}>
          GK
        </button>
        <button 
          class="filter-pill {filterPosition === 'ANCHOR' ? 'active' : ''}" 
          onclick={() => filterPosition = 'ANCHOR'}>
          Anchor
        </button>
        <button 
          class="filter-pill {filterPosition === 'FLANK' ? 'active' : ''}" 
          onclick={() => filterPosition = 'FLANK'}>
          Flank
        </button>
        <button 
          class="filter-pill {filterPosition === 'PIVOT' ? 'active' : ''}" 
          onclick={() => filterPosition = 'PIVOT'}>
          Pivot
        </button>
      </div>

      <!-- Foot Filter Select -->
      <select bind:value={filterFoot} class="dropdown-filter">
        <option value="ALL">Kaki (Semua)</option>
        <option value="KANAN">Kanan</option>
        <option value="KIRI">Kiri</option>
        <option value="KEDUA">Kedua Kaki</option>
      </select>

      <!-- Status Filter Select -->
      <select bind:value={filterStatus} class="dropdown-filter">
        <option value="ALL">Status (Semua)</option>
        <option value="ACTIVE">Active</option>
        <option value="INJURED">Injured</option>
        <option value="SUSPENDED">Suspended</option>
      </select>

      <!-- Reset Filter Button -->
      {#if searchQuery || filterPosition !== 'ALL' || filterFoot !== 'ALL' || filterStatus !== 'ALL' || filterMetric !== 'ALL' || sortKey !== 'no'}
        <button class="btn-reset" onclick={resetFilters} title="Reset Filter & Urutan">
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      {/if}
    </div>

    <!-- Excel & Player Actions -->
    <div class="toolbar-actions-group">
      <button 
        type="button"
        onclick={() => api.downloadMasterPlayerTemplate()}
        class="btn-excel-tool btn-template"
        title="Unduh Format Template Excel untuk Mengisi Data Pemain">
        <FileSpreadsheet size={15} class="text-emerald" />
        <span>Unduh Template</span>
      </button>

      {#if matchStore.currentUser?.role === 'coach' || matchStore.currentUser?.role === 'admin'}
        <label class="btn-excel-tool btn-upload {isImporting ? 'disabled' : ''}" title="Impor Data Pemain dari File Excel (.xlsx)">
          {#if isImporting}
            <span class="spinner-micro"></span>
            <span>Mengimpor...</span>
          {:else}
            <UploadCloud size={15} class="text-cyan" />
            <span>Impor Excel</span>
          {/if}
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            class="hidden-file-input" 
            onchange={handleFileImport} 
            disabled={isImporting} 
          />
        </label>

        <button class="btn-add-player" onclick={openAddModal}>
          <UserPlus size={16} />
          <span>Tambah Pemain</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Master Player Table with Freeze Panes (Sticky Header & First 2 Columns) -->
  <div class="table-freeze-wrapper">
    <table class="master-table">
      <thead>
        <tr>
          <!-- Sticky Header 1: No -->
          <th class="th-sticky th-no-col sortable-th {sortKey === 'no' ? 'sorted' : ''}" onclick={() => handleSort('no')}>
            <div class="th-inner">
              <span>NO</span>
              {#if sortKey === 'no'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {:else}
                <ArrowUpDown size={11} class="sort-hint" />
              {/if}
            </div>
          </th>

          <!-- Sticky Header 2: Nama -->
          <th class="th-sticky th-name-col sortable-th {sortKey === 'name' ? 'sorted' : ''}" onclick={() => handleSort('name')}>
            <div class="th-inner">
              <span>NAMA LENGKAP & PANGGILAN</span>
              {#if sortKey === 'name'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {:else}
                <ArrowUpDown size={11} class="sort-hint" />
              {/if}
            </div>
          </th>

          <!-- Other Headers -->
          <th style="width: 110px;" class="sortable-th {sortKey === 'pos' ? 'sorted' : ''}" onclick={() => handleSort('pos')}>
            <div class="th-inner">
              <span>POSISI</span>
              {#if sortKey === 'pos'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </th>

          <th style="width: 80px;" class="sortable-th {sortKey === 'foot' ? 'sorted' : ''}" onclick={() => handleSort('foot')}>
            <div class="th-inner">
              <span>KAKI</span>
              {#if sortKey === 'foot'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </th>

          <th style="width: 100px;" class="sortable-th {sortKey === 'height' ? 'sorted' : ''}" onclick={() => handleSort('height')}>
            <div class="th-inner">
              <span>POSTUR</span>
              {#if sortKey === 'height'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </th>

          <th style="width: 90px;" class="sortable-th {sortKey === 'status' ? 'sorted' : ''}" onclick={() => handleSort('status')}>
            <div class="th-inner">
              <span>STATUS</span>
              {#if sortKey === 'status'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </th>

          <th class="th-stat sortable-th {sortKey === 'match' ? 'sorted' : ''}" onclick={() => handleSort('match')} title="Total Penampilan Pertandingan">
            <div class="th-inner">
              <span>MATCH</span>
              {#if sortKey === 'match'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </th>

          <th class="th-stat sortable-th {sortKey === 'goal' ? 'sorted' : ''}" onclick={() => handleSort('goal')} title="Total Gol">
            <div class="th-inner">
              <span>GOL</span>
              {#if sortKey === 'goal'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </th>

          <th class="th-stat sortable-th {sortKey === 'shot' ? 'sorted' : ''}" onclick={() => handleSort('shot')} title="Total Shots">
            <div class="th-inner">
              <span>SHOT</span>
              {#if sortKey === 'shot'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </th>

          <th class="th-stat sortable-th {sortKey === 'acc' ? 'sorted' : ''}" onclick={() => handleSort('acc')} title="Akurasi Tembakan (%)">
            <div class="th-inner">
              <span>AKURASI</span>
              {#if sortKey === 'acc'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </th>

          <th class="th-stat sortable-th {sortKey === 'rec' ? 'sorted' : ''}" onclick={() => handleSort('rec')} title="Total Ball Recoveries">
            <div class="th-inner">
              <span>REC</span>
              {#if sortKey === 'rec'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </th>

          <th class="th-stat sortable-th {sortKey === 'loss' ? 'sorted' : ''}" onclick={() => handleSort('loss')} title="Total Turnover / Ball Losses">
            <div class="th-inner">
              <span>LOSS</span>
              {#if sortKey === 'loss'}
                <span class="sort-tag">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </th>

          <th class="th-action" style="width: 140px;">AKSI</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredPlayers.length === 0}
          <tr>
            <td colspan="13" class="empty-row">
              Tidak ada data pemain master yang sesuai dengan filter atau kata kunci pencarian.
            </td>
          </tr>
        {:else}
          {#each filteredPlayers as p, pIdx (p.id ? `mp_${p.id}` : `mp_idx_${pIdx}`)}
            {@const posBadge = getPositionBadge(p.position)}
            <tr class="player-master-row">
              <!-- Frozen Column 1: No Punggung -->
              <td class="td-sticky td-no">
                <span class="jersey-circle">#{p.noPunggung}</span>
              </td>

              <!-- Frozen Column 2: Nama & Panggilan -->
              <td class="td-sticky td-name">
                <div class="player-name-cell">
                  <span class="fullname">{p.name}</span>
                  {#if p.nickname}
                    <span class="nickname">"{p.nickname}"</span>
                  {/if}
                </div>
              </td>

              <!-- Position -->
              <td>
                <span class="pos-badge {posBadge.class}">{posBadge.text}</span>
              </td>

              <!-- Foot -->
              <td class="td-foot">{p.dominantFoot}</td>

              <!-- Posture -->
              <td class="td-posture">{p.height || '-'} cm / {p.weight || '-'} kg</td>

              <!-- Status -->
              <td>
                <span class="status-badge status-{p.status.toLowerCase()}">{p.status}</span>
              </td>

              <!-- Stats -->
              <td class="td-stat font-mono">{p.stats?.totalMatches || 0}</td>
              <td class="td-stat font-mono stat-highlight-goal">{p.stats?.totalGoals || 0}</td>
              <td class="td-stat font-mono">{p.stats?.totalShots || 0}</td>
              <td class="td-stat font-mono">{p.stats?.shotAccuracy || 0}%</td>
              <td class="td-stat font-mono stat-highlight-rec">{p.stats?.totalRec || 0}</td>
              <td class="td-stat font-mono stat-highlight-loss">{p.stats?.totalLoss || 0}</td>

              <!-- Action Buttons -->
              <td class="td-actions">
                <button 
                  class="action-btn btn-import" 
                  title="Impor ke Slot Pertandingan Aktif" 
                  onclick={() => importToMatch(p)}>
                  <Download size={13} />
                </button>
                {#if matchStore.currentUser?.role === 'coach' || matchStore.currentUser?.role === 'admin'}
                  <button 
                    class="action-btn btn-edit" 
                    title="Edit Profil Pemain" 
                    onclick={() => openEditModal(p)}>
                    <Edit2 size={13} />
                  </button>
                  <button 
                    class="action-btn btn-delete" 
                    title="Hapus Pemain" 
                    onclick={() => handleDelete(p)}>
                    <Trash2 size={13} />
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<!-- Add/Edit Player Modal -->
{#if showPlayerModal}
  <div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) showPlayerModal = false; }} role="presentation">
    <div class="modal-card">
      <div class="modal-card-header">
        <div class="header-title-group">
          <Users size={18} class="text-cyan" />
          <h3>{editingPlayer ? 'Edit Profil Pemain Master' : 'Tambah Pemain Master Baru'}</h3>
        </div>
        <button class="btn-close-modal" onclick={() => showPlayerModal = false}>
          <X size={18} />
        </button>
      </div>

      <form onsubmit={handleSavePlayer} class="modal-form">
        <div class="form-row-2">
          <div class="form-item">
            <label for="p-no">No. Punggung</label>
            <input id="p-no" type="number" bind:value={formNo} min="1" max="99" required />
          </div>
          <div class="form-item">
            <label for="p-nickname">Nama Panggilan</label>
            <input id="p-nickname" type="text" bind:value={formNickname} placeholder="Contoh: Zikri" />
          </div>
        </div>

        <div class="form-item">
          <label for="p-fullname">Nama Lengkap</label>
          <input id="p-fullname" type="text" bind:value={formName} placeholder="Contoh: M. Zikri Ramadhan" required />
        </div>

        <div class="form-row-2">
          <div class="form-item">
            <label for="p-pos">Posisi Utama</label>
            <select id="p-pos" bind:value={formPosition}>
              <option value="GK">GK (Penjaga Gawang)</option>
              <option value="ANCHOR">ANCHOR (Bertahan/Playmaker)</option>
              <option value="FLANK_LEFT">FLANK KIRI (Sayap)</option>
              <option value="FLANK_RIGHT">FLANK KANAN (Sayap)</option>
              <option value="PIVOT">PIVOT (Target Man / Striker)</option>
              <option value="PLAYER">PLAYER (Umum)</option>
            </select>
          </div>

          <div class="form-item">
            <label for="p-foot">Kaki Dominan</label>
            <select id="p-foot" bind:value={formDominantFoot}>
              <option value="KANAN">Kanan</option>
              <option value="KIRI">Kiri</option>
              <option value="KEDUA">Kedua Kaki (Ambidextrous)</option>
            </select>
          </div>
        </div>

        <div class="form-row-3">
          <div class="form-item">
            <label for="p-h">Tinggi (cm)</label>
            <input id="p-h" type="number" bind:value={formHeight} min="140" max="210" />
          </div>
          <div class="form-item">
            <label for="p-w">Berat (kg)</label>
            <input id="p-w" type="number" bind:value={formWeight} min="40" max="120" />
          </div>
          <div class="form-item">
            <label for="p-status">Status Kebugaran</label>
            <select id="p-status" bind:value={formStatus}>
              <option value="ACTIVE">ACTIVE (Siap Main)</option>
              <option value="INJURED">INJURED (Cedera)</option>
              <option value="SUSPENDED">SUSPENDED (Akumulasi)</option>
            </select>
          </div>
        </div>

        <div class="modal-card-footer">
          <button type="button" class="btn-cancel" onclick={() => showPlayerModal = false}>Batal</button>
          <button type="submit" class="btn-submit">
            <Check size={16} />
            <span>{editingPlayer ? 'Perbarui Profil' : 'Simpan Pemain'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .master-db-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* Import Alert Banner */
  .import-alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .alert-success {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #34d399;
  }
  .alert-error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #f87171;
  }
  .alert-close {
    margin-left: auto;
    background: transparent;
    border: none;
    color: inherit;
    font-size: 1.1rem;
    cursor: pointer;
  }

  /* KPI Highlights */
  .kpi-banner {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .kpi-card {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    backdrop-filter: blur(8px);
  }

  .kpi-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bg-blue-subtle { background: rgba(56, 189, 248, 0.12); }
  .bg-green-subtle { background: rgba(16, 185, 129, 0.12); }
  .bg-purple-subtle { background: rgba(192, 132, 252, 0.12); }
  .bg-amber-subtle { background: rgba(245, 158, 11, 0.12); }

  :global(.text-cyan) { color: #38bdf8 !important; }
  :global(.text-emerald) { color: #34d399 !important; }
  :global(.text-purple) { color: #c084fc !important; }
  :global(.text-amber) { color: #fbbf24 !important; }

  .kpi-info {
    display: flex;
    flex-direction: column;
  }

  .kpi-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }

  .kpi-val {
    font-size: 1.3rem;
    font-weight: 800;
    color: #ffffff;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Toolbar */
  .toolbar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.85rem 1.15rem;
    flex-wrap: wrap;
  }

  .search-filter-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    flex: 1;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 200px;
    flex: 1;
    max-width: 280px;
  }

  :global(.search-icon) {
    position: absolute;
    left: 10px;
    color: #64748b;
  }

  .search-box input {
    width: 100%;
    background: #090f1a;
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 8px;
    padding: 0.45rem 1.8rem 0.45rem 2rem;
    color: #ffffff;
    font-size: 0.8rem;
  }
  .search-box input:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }

  .clear-btn {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1rem;
    cursor: pointer;
  }

  .filter-pill-group {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .filter-pill {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .filter-pill:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
  .filter-pill.active {
    background: rgba(56, 189, 248, 0.2);
    border-color: #38bdf8;
    color: #38bdf8;
    font-weight: 700;
  }

  .dropdown-filter {
    background: #090f1a;
    border: 1px solid rgba(156, 179, 204, 0.25);
    color: #cbd5e1;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .btn-reset {
    display: flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
    font-size: 0.74rem;
    font-weight: 600;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    cursor: pointer;
  }
  .btn-reset:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .toolbar-actions-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn-excel-tool {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.15s;
  }
  .btn-template {
    background: rgba(16, 185, 129, 0.12);
    color: #34d399;
    border-color: rgba(16, 185, 129, 0.3);
  }
  .btn-template:hover {
    background: rgba(16, 185, 129, 0.22);
    color: #6ee7b7;
  }

  .btn-upload {
    background: rgba(56, 189, 248, 0.12);
    color: #38bdf8;
    border-color: rgba(56, 189, 248, 0.3);
  }
  .btn-upload:hover {
    background: rgba(56, 189, 248, 0.22);
  }

  .hidden-file-input {
    display: none;
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
  }
  .btn-add-player:hover {
    filter: brightness(1.15);
  }

  /* ========================================== */
  /* FREEZE PANES TABLE CONTAINER               */
  /* ========================================== */
  .table-freeze-wrapper {
    max-height: 68vh;
    overflow: auto;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    background: #090f1a;
    -webkit-overflow-scrolling: touch;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }

  .master-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.8rem;
    white-space: nowrap;
  }

  /* Sticky Top Header */
  thead {
    position: sticky;
    top: 0;
    z-index: 20;
  }

  thead tr th {
    background: #101c2e;
    color: #94a3b8;
    font-weight: 700;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    padding: 10px 8px;
    text-align: left;
    border-bottom: 2px solid #38bdf8;
    border-right: 1px solid rgba(156, 179, 204, 0.1);
  }

  .th-stat {
    text-align: center !important;
  }

  .th-action {
    text-align: center !important;
  }

  .sortable-th {
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;
  }
  .sortable-th:hover {
    background: #1a2f4c !important;
    color: #ffffff !important;
  }
  .sortable-th.sorted {
    background: #173454 !important;
    color: #38bdf8 !important;
  }

  .th-inner {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .th-stat .th-inner {
    justify-content: center;
  }

  .sort-hint {
    color: #64748b;
  }

  .sort-tag {
    color: #38bdf8;
    font-size: 0.65rem;
  }

  /* Sticky Left Columns (Freeze Panes) */
  .th-sticky {
    position: sticky;
    z-index: 30 !important;
  }

  .td-sticky {
    position: sticky;
    z-index: 15;
  }

  .th-no-col, .td-no {
    left: 0;
    width: 54px;
    min-width: 54px;
    max-width: 54px;
    text-align: center !important;
    background: #0f1c2e !important;
    border-right: 1px solid rgba(156, 179, 204, 0.2) !important;
  }

  .th-name-col, .td-name {
    left: 54px;
    width: 220px;
    min-width: 220px;
    max-width: 280px;
    background: #0f1c2e !important;
    border-right: 2px solid #38bdf8 !important;
    box-shadow: 4px 0 10px rgba(0, 0, 0, 0.4);
  }

  .td-no {
    background: #090f1a !important;
  }
  .td-name {
    background: #090f1a !important;
  }

  .player-master-row td {
    padding: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    border-right: 1px solid rgba(255, 255, 255, 0.03);
    color: #cbd5e1;
  }

  .player-master-row:hover td {
    background: #132238;
  }
  .player-master-row:hover .td-no,
  .player-master-row:hover .td-name {
    background: #152740 !important;
  }

  .jersey-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #142236;
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
    font-weight: 800;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
  }

  .player-name-cell {
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
  }

  .fullname {
    color: #f1f5f9;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nickname {
    color: #94a3b8;
    font-size: 0.72rem;
    font-style: italic;
  }

  /* Badges */
  .pos-badge {
    font-size: 0.68rem;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 4px;
    display: inline-block;
  }

  .badge-gk { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
  .badge-anchor { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
  .badge-flank { background: rgba(192, 132, 252, 0.2); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.4); }
  .badge-pivot { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
  .badge-general { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.4); }

  .status-badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    display: inline-block;
  }
  .status-active { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
  .status-injured { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
  .status-suspended { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }

  .td-stat {
    text-align: center;
  }
  .font-mono {
    font-family: 'JetBrains Mono', monospace;
  }

  .stat-highlight-goal {
    color: #4ade80 !important;
    font-weight: 800;
  }
  .stat-highlight-rec {
    color: #38bdf8 !important;
  }
  .stat-highlight-loss {
    color: #f87171 !important;
  }

  .td-actions {
    text-align: center;
  }

  .action-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0 1px;
    transition: all 0.15s;
  }
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }
  .btn-import:hover {
    color: #38bdf8;
    border-color: #38bdf8;
  }
  .btn-edit:hover {
    color: #fbbf24;
    border-color: #fbbf24;
  }
  .btn-delete:hover {
    color: #ef4444;
    border-color: #ef4444;
  }

  .empty-row {
    text-align: center;
    padding: 3rem 1rem !important;
    color: #64748b;
    font-style: italic;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-card {
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    width: 100%;
    max-width: 520px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  }

  .modal-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .header-title-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .header-title-group h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .btn-close-modal {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
  }

  .modal-form {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .form-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .form-row-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1.2fr;
    gap: 0.75rem;
  }

  .form-item label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 0.35rem;
  }

  .form-item input,
  .form-item select {
    width: 100%;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    color: #ffffff;
    font-size: 0.82rem;
  }
  .form-item input:focus,
  .form-item select:focus {
    outline: none;
    border-color: #38bdf8;
  }

  .modal-card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    margin-top: 0.5rem;
    padding-top: 0.85rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .btn-cancel {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-submit {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: #10b981;
    border: none;
    color: #064e3b;
    padding: 0.5rem 1.15rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
  }

  .spinner-micro {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(56, 189, 248, 0.2);
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    display: inline-block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
