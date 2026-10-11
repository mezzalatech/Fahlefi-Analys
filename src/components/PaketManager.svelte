<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { api } from '../lib/api';
  import { 
    Users, Plus, Check, Trash2, ArrowRightLeft, Download, Upload, 
    FileSpreadsheet, Sparkles, Edit3, X, AlertCircle, CheckCircle2, Shield,
    Database, RefreshCw
  } from 'lucide-svelte';

  let pakets = $derived(matchStore.scopedPakets);
  let players = $derived(matchStore.data?.players || []);

  let isSyncingMaster = $state<boolean>(false);
  let syncFeedbackMsg = $state<string | null>(null);

  let showAddPaket = $state<boolean>(false);
  let newPaketCode = $state<string>('');
  
  // Edit Paket State
  let editingPaket = $state<{
    paketIndex: number;
    code: string;
    selectedNumbers: number[];
  } | null>(null);

  // Import Excel State
  let fileInputRef: HTMLInputElement | null = null;
  let showImportModal = $state<boolean>(false);
  let importFile = $state<File | null>(null);
  let isImporting = $state<boolean>(false);
  let importSuccessMsg = $state<string | null>(null);
  let importErrorMsg = $state<string | null>(null);

  function getPlayer(num: number) {
    return players.find((pl) => pl.no === num);
  }

  function getPlayerName(num: number): string {
    const p = getPlayer(num);
    return p && p.name ? p.name : `Pemain #${num}`;
  }

  function getPaketNumbers(pkt: typeof pakets[0]): number[] {
    try {
      const parsed = JSON.parse(pkt.playerNumbers);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return (pkt.code || '')
      .split(/[-,\s/]+/)
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
  }

  function selectActivePaket(index: number) {
    if (matchStore.activePaketIndex === index) {
      matchStore.activePaketIndex = null;
    } else {
      matchStore.activePaketIndex = index;
    }
  }

  // Add Simple Paket
  async function handleAddPaket() {
    if (!newPaketCode.trim() || !matchStore.data) return;
    const nums = newPaketCode.split(/[-,\s/]+/).map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
    const nextIndex = (pakets.length > 0 ? Math.max(...pakets.map((p) => p.paketIndex)) : 0) + 1;

    const updated = [
      ...pakets.map((p) => ({
        paketIndex: p.paketIndex,
        code: p.code,
        playerNumbers: p.playerNumbers
      })),
      {
        paketIndex: nextIndex,
        code: newPaketCode.trim(),
        playerNumbers: JSON.stringify(nums)
      }
    ];

    await matchStore.savePakets(updated);
    newPaketCode = '';
    showAddPaket = false;
  }

  // Delete Single Paket
  async function handleDeletePaket(index: number) {
    if (!matchStore.data) return;
    const remaining = pakets
      .filter((p) => p.paketIndex !== index)
      .map((p, idx) => ({
        paketIndex: idx + 1,
        code: p.code,
        playerNumbers: p.playerNumbers
      }));

    await matchStore.savePakets(remaining);
    if (matchStore.activePaketIndex === index) {
      matchStore.activePaketIndex = null;
    }
  }

  // Open Edit Modal
  function openEditModal(pkt: typeof pakets[0]) {
    editingPaket = {
      paketIndex: pkt.paketIndex,
      code: pkt.code || `Paket #${pkt.paketIndex}`,
      selectedNumbers: [...getPaketNumbers(pkt)]
    };
  }

  function togglePlayerSelection(no: number) {
    if (!editingPaket) return;
    const exists = editingPaket.selectedNumbers.includes(no);
    if (exists) {
      editingPaket.selectedNumbers = editingPaket.selectedNumbers.filter(n => n !== no);
    } else {
      if (editingPaket.selectedNumbers.length < 5) {
        editingPaket.selectedNumbers = [...editingPaket.selectedNumbers, no];
      }
    }
  }

  // Save Edited Paket
  async function saveEditedPaket() {
    if (!editingPaket || !matchStore.data) return;
    const updated = pakets.map(p => {
      if (p.paketIndex === editingPaket!.paketIndex) {
        return {
          paketIndex: p.paketIndex,
          code: editingPaket!.code.trim() || editingPaket!.selectedNumbers.join('-') || `Paket #${p.paketIndex}`,
          playerNumbers: JSON.stringify(editingPaket!.selectedNumbers)
        };
      }
      return {
        paketIndex: p.paketIndex,
        code: p.code,
        playerNumbers: p.playerNumbers
      };
    });

    await matchStore.savePakets(updated);
    editingPaket = null;
  }

  // Auto-Generate 9 Default Presets based on Active Squad Roster
  async function generateAutoPresets() {
    if (!matchStore.data) return;
    const availableNos = players.map(p => p.no).filter(n => n > 0);
    const gkNo = players.find(p => p.isGk === 1)?.no || 1;
    const fieldPlayers = availableNos.filter(n => n !== gkNo);

    const defaultPresets = [
      {
        index: 1,
        name: 'Paket 1 - Starter Utama',
        nums: [gkNo, fieldPlayers[0] || 4, fieldPlayers[1] || 7, fieldPlayers[2] || 8, fieldPlayers[3] || 10]
      },
      {
        index: 2,
        name: 'Paket 2 - Rotasi Unit 2',
        nums: [gkNo, fieldPlayers[4] || 3, fieldPlayers[5] || 6, fieldPlayers[6] || 9, fieldPlayers[7] || 11]
      },
      {
        index: 3,
        name: 'Paket 3 - High Pressing',
        nums: [gkNo, fieldPlayers[0] || 4, fieldPlayers[1] || 6, fieldPlayers[2] || 7, fieldPlayers[3] || 8]
      },
      {
        index: 4,
        name: 'Paket 4 - Powerplay Attacking',
        nums: [fieldPlayers[3] || 10, fieldPlayers[0] || 4, fieldPlayers[1] || 7, fieldPlayers[2] || 8, fieldPlayers[4] || 9]
      },
      {
        index: 5,
        name: 'Paket 5 - Defensive Solid Block',
        nums: [gkNo, fieldPlayers[4] || 3, fieldPlayers[0] || 4, fieldPlayers[5] || 5, fieldPlayers[2] || 8]
      },
      {
        index: 6,
        name: 'Paket 6 - Corner Set-Piece',
        nums: [gkNo, fieldPlayers[0] || 4, fieldPlayers[2] || 8, fieldPlayers[4] || 9, fieldPlayers[3] || 10]
      },
      {
        index: 7,
        name: 'Paket 7 - Flank Kilat Counter',
        nums: [gkNo, fieldPlayers[0] || 4, fieldPlayers[5] || 6, fieldPlayers[7] || 11, fieldPlayers[3] || 10]
      },
      {
        index: 8,
        name: 'Paket 8 - Dual Pivot Offense',
        nums: [gkNo, fieldPlayers[4] || 3, fieldPlayers[1] || 7, fieldPlayers[2] || 8, fieldPlayers[4] || 9]
      },
      {
        index: 9,
        name: 'Paket 9 - Closing Match Control',
        nums: [gkNo, fieldPlayers[4] || 3, fieldPlayers[0] || 4, fieldPlayers[5] || 5, fieldPlayers[3] || 10]
      }
    ];

    const payload = defaultPresets.map(dp => ({
      paketIndex: dp.index,
      code: dp.name,
      playerNumbers: JSON.stringify(dp.nums.filter(n => n !== undefined))
    }));

    await matchStore.savePakets(payload);
  }

  // Handle Excel File Selected
  function onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      importFile = input.files[0];
      showImportModal = true;
      importErrorMsg = null;
      importSuccessMsg = null;
    }
  }

  // Execute Excel Import
  async function handleImportExcel() {
    if (!importFile || !matchStore.data) return;
    try {
      isImporting = true;
      importErrorMsg = null;
      const res = await api.importPaketsFromExcel(matchStore.data.match.id, importFile);
      if (res.pakets && Array.isArray(res.pakets)) {
        matchStore.data.pakets = res.pakets;
      } else {
        await matchStore.loadMatch(matchStore.data.match.id);
      }
      importSuccessMsg = res.message || 'Paket rotasi berhasil diimpor!';
      setTimeout(() => {
        showImportModal = false;
        importFile = null;
        importSuccessMsg = null;
      }, 1400);
    } catch (err: any) {
      importErrorMsg = err.message || 'Gagal mengimpor file Excel';
    } finally {
      isImporting = false;
      if (fileInputRef) fileInputRef.value = '';
    }
  }

  async function handleSyncMaster() {
    isSyncingMaster = true;
    syncFeedbackMsg = null;
    try {
      const res = await matchStore.syncSquadFromMaster();
      syncFeedbackMsg = res.message;
      setTimeout(() => {
        syncFeedbackMsg = null;
      }, 4000);
    } catch (err: any) {
      alert('Gagal menyinkronkan Database Master: ' + err.message);
    } finally {
      isSyncingMaster = false;
    }
  }
</script>

<div class="paket-section glass-card">
  <!-- Section Top Bar -->
  <div class="section-header">
    <div class="title-group">
      <div class="icon-circle">
        <Users size={22} class="text-emerald" />
      </div>
      <div>
        <h2 class="section-title">Manajemen Paket Rotasi 5 Pemain (Lineups)</h2>
        <p class="section-desc">Atur kombinasi 5 pemain on-pitch, unduh template, dan impor strategi rotasi via Excel</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="actions-toolbar">
      <!-- Download Template Excel -->
      <button 
        type="button"
        onclick={() => api.downloadPaketTemplate()}
        class="tool-btn btn-template"
        title="Unduh Template Excel Resmi untuk Paket 5-Man">
        <Download size={15} />
        <span>Download Template</span>
      </button>

      <!-- Import Excel -->
      <button 
        class="tool-btn btn-import" 
        onclick={() => fileInputRef?.click()}
        title="Impor susunan paket rotasi dari file Excel">
        <Upload size={15} />
        <span>Import Excel</span>
      </button>
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        bind:this={fileInputRef} 
        onchange={onFileSelected} 
        style="display: none;" />

      <!-- Export Current Match Pakets -->
      {#if matchStore.data}
        <a 
          href={api.getMatchPaketsExportUrl(matchStore.data.match.id)} 
          download="Paket_Rotasi.xlsx" 
          class="tool-btn btn-export"
          title="Ekspor paket pertandingan ini ke Excel">
          <FileSpreadsheet size={15} />
          <span>Export Excel</span>
        </a>
      {/if}

      <!-- Auto Presets from Roster -->
      <button 
        class="tool-btn btn-preset" 
        onclick={generateAutoPresets}
        title="Buat otomatis 9 preset standar dari skuad pemain aktif">
        <Sparkles size={15} />
        <span>Auto-Preset</span>
      </button>

      <!-- Sync Master Squad Button -->
      <button 
        type="button" 
        class="tool-btn btn-sync-master" 
        onclick={handleSyncMaster}
        disabled={isSyncingMaster}
        title="Sinkronkan nama dan nomor punggung skuad dari Database Master ke Laga ini">
        <RefreshCw size={14} class={isSyncingMaster ? 'spin text-cyan' : 'text-cyan'} />
        <span>{isSyncingMaster ? 'Menyinkronkan...' : 'Sinkronkan Master'}</span>
      </button>

      <!-- Add New Paket -->
      <button 
        class="tool-btn btn-add-pkt" 
        onclick={() => (showAddPaket = !showAddPaket)}>
        <Plus size={15} />
        <span>Tambah Paket</span>
      </button>
    </div>
  </div>

  {#if syncFeedbackMsg}
    <div class="sync-banner-alert">
      <CheckCircle2 size={16} class="text-emerald" />
      <span>{syncFeedbackMsg}</span>
    </div>
  {/if}

  <!-- Quick Add Box -->
  {#if showAddPaket}
    <div class="add-pkt-box">
      <div class="box-title">Tambah Paket Baru:</div>
      <label for="new-pkt-input">Format: Masukkan nomor punggung dipisah tanda hubung (cth. <code>1-4-7-8-10</code>) atau Nama Paket:</label>
      <div class="input-row">
        <input 
          id="new-pkt-input"
          type="text" 
          bind:value={newPaketCode} 
          placeholder="cth. 1-4-7-8-10 atau Paket Pressing" 
          class="pkt-input" />
        <button class="btn-save-pkt" onclick={handleAddPaket}>Simpan</button>
        <button class="btn-cancel-pkt" onclick={() => (showAddPaket = false)}>Batal</button>
      </div>
    </div>
  {/if}

  <!-- Pakets Grid -->
  <div class="pakets-grid">
    {#each pakets as pkt, pktIdx (pkt.id ? `pkt_${pkt.id}` : `pkt_idx_${pktIdx}`)}
      {@const nums = getPaketNumbers(pkt)}
      {@const isActive = matchStore.activePaketIndex === pkt.paketIndex}
      
      <div 
        class="paket-card {isActive ? 'active-card' : ''}" 
        onclick={() => selectActivePaket(pkt.paketIndex)}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && selectActivePaket(pkt.paketIndex)}>
        
        <div class="card-top">
          <div class="badge-index">Paket #{pkt.paketIndex}</div>
          {#if isActive}
            <span class="active-tag"><Check size={12} /> ON PITCH</span>
          {/if}
          
          <div class="card-actions">
            <!-- Edit Button -->
            <button 
              class="icon-action-btn edit-btn" 
              onclick={(e) => { e.stopPropagation(); openEditModal(pkt); }} 
              title="Edit Susunan Pemain">
              <Edit3 size={13} />
            </button>
            
            <!-- Delete Button -->
            <button 
              class="icon-action-btn del-btn" 
              onclick={(e) => { e.stopPropagation(); handleDeletePaket(pkt.paketIndex); }} 
              title="Hapus Paket">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <!-- Paket Code / Name -->
        <div class="pkt-code-display" title={pkt.code || `Paket #${pkt.paketIndex}`}>
          {pkt.code || (nums.length > 0 ? nums.join('-') : `Paket #${pkt.paketIndex}`)}
        </div>

        <!-- Players List (5-Man Lineup) -->
        <div class="players-chips-list">
          {#if nums.length > 0}
            {#each nums as num}
              {@const pl = getPlayer(num)}
              <div class="player-chip {pl?.isGk ? 'is-gk' : ''}">
                <span class="num-tag">#{num}</span>
                <span class="name-tag">{getPlayerName(num)}</span>
                {#if pl?.isGk}
                  <span class="gk-badge">GK</span>
                {/if}
              </div>
            {/each}
          {:else}
            <div class="empty-players-hint">
              <span>Klik Edit untuk memilih 5 pemain</span>
            </div>
          {/if}
        </div>

        <!-- Footer Action -->
        <div class="card-footer">
          <button class="deploy-btn {isActive ? 'btn-active-deploy' : ''}">
            <ArrowRightLeft size={13} />
            <span>{isActive ? 'Sedang Aktif di Lapangan' : 'Pasang di Lapangan'}</span>
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<!-- ========================================== -->
<!-- MODAL: EDIT SUSUNAN PAKET 5 PEMAIN         -->
<!-- ========================================== -->
{#if editingPaket}
  <div class="modal-backdrop" onclick={() => (editingPaket = null)} role="presentation">
    <div class="modal-dialog" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
      <div class="modal-header">
        <div class="modal-title-group">
          <Edit3 size={18} class="text-emerald" />
          <h3>Edit Paket #{editingPaket.paketIndex}</h3>
        </div>
        <button class="btn-close-modal" onclick={() => (editingPaket = null)}>
          <X size={18} />
        </button>
      </div>

      <div class="modal-body">
        <!-- Paket Name / Label -->
        <div class="form-group">
          <label for="edit-pkt-name">Nama / Kode Strategi Paket:</label>
          <input 
            id="edit-pkt-name"
            type="text" 
            class="form-input" 
            bind:value={editingPaket.code} 
            placeholder="cth. Paket 1 - Starter Utama, Powerplay, dll" />
        </div>

        <!-- Selected Summary -->
        <div class="selected-summary-bar">
          <div class="summary-label">
            <span>Pemain Terpilih:</span>
            <span class="count-pill {editingPaket.selectedNumbers.length === 5 ? 'complete' : ''}">
              {editingPaket.selectedNumbers.length} / 5 Pemain
            </span>
          </div>
          <div class="selected-tags-row">
            {#each editingPaket.selectedNumbers as num}
              <span class="selected-tag">
                #{num} {getPlayerName(num)}
                <button class="tag-remove" onclick={() => togglePlayerSelection(num)}>×</button>
              </span>
            {/each}
            {#if editingPaket.selectedNumbers.length === 0}
              <span class="empty-tag">Belum ada pemain dipilih</span>
            {/if}
          </div>
        </div>

        <!-- Roster Player Picker -->
        <div class="roster-picker-header">
          <div class="roster-picker-label">Pilih 5 Pemain dari Skuad:</div>
          <button 
            type="button" 
            class="btn-sync-picker" 
            onclick={handleSyncMaster} 
            disabled={isSyncingMaster}
            title="Muat ulang nama pemain laga ini langsung dari Database Master">
            <RefreshCw size={12} class={isSyncingMaster ? 'spin text-cyan' : 'text-cyan'} />
            <span>{isSyncingMaster ? 'Menyinkronkan...' : 'Sinkronkan Master'}</span>
          </button>
        </div>
        <div class="roster-picker-grid">
          {#each players as p}
            {@const isSelected = editingPaket.selectedNumbers.includes(p.no)}
            <button 
              type="button" 
              class="roster-card {isSelected ? 'selected-card' : ''} {p.isGk ? 'gk-card' : ''}"
              onclick={() => togglePlayerSelection(p.no)}>
              <div class="jersey-circle">
                {p.no}
              </div>
              <div class="player-info">
                <div class="player-name">{p.name || `Pemain #${p.no}`}</div>
                <div class="player-role">{p.isGk ? 'Goalkeeper' : 'Outfield Player'}</div>
              </div>
              {#if isSelected}
                <div class="check-icon"><Check size={14} /></div>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick={() => (editingPaket = null)}>Batal</button>
        <button class="btn-primary" onclick={saveEditedPaket}>
          <Check size={15} />
          <span>Simpan Susunan Paket</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ========================================== -->
<!-- MODAL: IMPORT EXCEL PAKET ROTASI           -->
<!-- ========================================== -->
{#if showImportModal}
  <div class="modal-backdrop" onclick={() => (showImportModal = false)} role="presentation">
    <div class="modal-dialog import-dialog" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
      <div class="modal-header">
        <div class="modal-title-group">
          <Upload size={18} class="text-emerald" />
          <h3>Import Paket Rotasi 5-Man dari Excel</h3>
        </div>
        <button class="btn-close-modal" onclick={() => (showImportModal = false)}>
          <X size={18} />
        </button>
      </div>

      <div class="modal-body">
        {#if importSuccessMsg}
          <div class="alert-box success">
            <CheckCircle2 size={20} />
            <span>{importSuccessMsg}</span>
          </div>
        {:else if importErrorMsg}
          <div class="alert-box error">
            <AlertCircle size={20} />
            <span>{importErrorMsg}</span>
          </div>
        {/if}

        <div class="import-preview-box">
          <div class="file-icon-wrap">
            <FileSpreadsheet size={36} class="text-emerald" />
          </div>
          <div class="file-details">
            <div class="file-name">{importFile?.name || 'File Excel'}</div>
            <div class="file-size">{Math.round((importFile?.size || 0) / 1024)} KB</div>
          </div>
        </div>

        <p class="import-hint">
          Sistem akan membaca susunan paket rotasi 5 pemain dari file Excel dan menggantikan data paket di pertandingan ini.
        </p>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick={() => (showImportModal = false)} disabled={isImporting}>Batal</button>
        <button class="btn-primary btn-confirm-import" onclick={handleImportExcel} disabled={isImporting}>
          {#if isImporting}
            <div class="spinner"></div>
            <span>Mengimpor Data...</span>
          {:else}
            <Upload size={15} />
            <span>Terapkan Paket ke Pertandingan</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .glass-card {
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .icon-circle {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.text-emerald) {
    color: #10b981 !important;
  }

  .section-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 2px 0;
  }

  .section-desc {
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 0;
  }

  /* Actions Toolbar */
  .actions-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tool-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }

  .btn-template {
    background: rgba(16, 185, 129, 0.12);
    color: #34d399;
    border-color: rgba(16, 185, 129, 0.3);
  }
  .btn-template:hover {
    background: rgba(16, 185, 129, 0.25);
    color: #6ee7b7;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
  }

  .btn-import {
    background: rgba(56, 189, 248, 0.12);
    color: #38bdf8;
    border-color: rgba(56, 189, 248, 0.3);
  }
  .btn-import:hover {
    background: rgba(56, 189, 248, 0.25);
    color: #7dd3fc;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
  }

  .btn-export {
    background: rgba(139, 92, 246, 0.12);
    color: #a78bfa;
    border-color: rgba(139, 92, 246, 0.3);
  }
  .btn-export:hover {
    background: rgba(139, 92, 246, 0.25);
    color: #c4b5fd;
  }

  .btn-preset {
    background: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.3);
  }
  .btn-preset:hover {
    background: rgba(245, 158, 11, 0.25);
    color: #fde68a;
  }

  .btn-add-pkt {
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
    color: #ffffff;
    border-color: #60a5fa;
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.3);
  }
  .btn-add-pkt:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 14px rgba(37, 99, 235, 0.5);
  }

  /* Quick Add Box */
  .add-pkt-box {
    background: #142236;
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 12px;
    padding: 1rem 1.2rem;
    margin-bottom: 1.25rem;
  }

  .box-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #38bdf8;
    margin-bottom: 0.25rem;
  }

  .add-pkt-box label {
    display: block;
    font-size: 0.78rem;
    color: #9cb3cc;
    margin-bottom: 0.5rem;
  }

  .add-pkt-box code {
    background: rgba(0, 0, 0, 0.3);
    padding: 1px 4px;
    border-radius: 4px;
    color: #38bdf8;
  }

  .input-row {
    display: flex;
    gap: 0.5rem;
  }

  .pkt-input {
    flex: 1;
    max-width: 350px;
    background: #0c1524;
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 6px;
    padding: 0.45rem 0.75rem;
    color: #ffffff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
  }

  .btn-save-pkt {
    background: #10b981;
    color: #064e3b;
    border: none;
    padding: 0.45rem 1rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .btn-cancel-pkt {
    background: transparent;
    color: #9cb3cc;
    border: 1px solid rgba(156, 179, 204, 0.2);
    padding: 0.45rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
  }

  /* Pakets Grid */
  .pakets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 1rem;
  }

  .paket-card {
    background: #121e30;
    border: 1px solid rgba(156, 179, 204, 0.15);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .paket-card:hover {
    background: #162842;
    border-color: #38bdf8;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .active-card {
    background: #152d48;
    border-color: #10b981;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .badge-index {
    font-size: 0.75rem;
    font-weight: 800;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 7px;
    border-radius: 4px;
  }

  .active-tag {
    font-size: 0.68rem;
    font-weight: 800;
    color: #10b981;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 1px 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .icon-action-btn {
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .edit-btn:hover {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
  }

  .del-btn:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .pkt-code-display {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.05rem;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.02em;
    margin-bottom: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .players-chips-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 1rem;
    flex: 1;
    min-height: 120px;
  }

  .player-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(15, 23, 42, 0.6);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.78rem;
    border: 1px solid rgba(255, 255, 255, 0.03);
  }

  .player-chip.is-gk {
    border-left: 2px solid #f59e0b;
    background: rgba(245, 158, 11, 0.08);
  }

  .num-tag {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    color: #10b981;
    width: 28px;
  }

  .name-tag {
    color: #e2e8f0;
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .gk-badge {
    font-size: 0.62rem;
    font-weight: 800;
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .empty-players-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #64748b;
    font-size: 0.75rem;
    font-style: italic;
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1rem;
  }

  .card-footer {
    margin-top: auto;
  }

  .deploy-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.48rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.15s;
  }

  .deploy-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .btn-active-deploy {
    background: #10b981;
    color: #064e3b;
    border-color: #10b981;
    font-weight: 700;
  }

  /* ========================================== */
  /* MODAL STYLES                               */
  /* ========================================== */
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

  .modal-dialog {
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    overflow: hidden;
  }

  .import-dialog {
    max-width: 480px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .modal-title-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .modal-title-group h3 {
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
    padding: 4px;
    border-radius: 4px;
  }
  .btn-close-modal:hover {
    color: #ffffff;
  }

  .modal-body {
    padding: 1.25rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 0.4rem;
  }

  .form-input {
    width: 100%;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.55rem 0.85rem;
    color: #ffffff;
    font-size: 0.85rem;
  }
  .form-input:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }

  .selected-summary-bar {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 0.75rem 1rem;
  }

  .summary-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
    margin-bottom: 0.5rem;
  }

  .count-pill {
    font-size: 0.72rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 12px;
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  .count-pill.complete {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border-color: rgba(16, 185, 129, 0.4);
  }

  .selected-tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .selected-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #6ee7b7;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
  }

  .tag-remove {
    background: transparent;
    border: none;
    color: #6ee7b7;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }

  .empty-tag {
    font-size: 0.75rem;
    color: #64748b;
    font-style: italic;
  }

  .roster-picker-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #94a3b8;
  }

  .roster-picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.5rem;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .roster-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.65rem;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    position: relative;
  }

  .roster-card:hover {
    background: #27354a;
    border-color: rgba(56, 189, 248, 0.4);
  }

  .roster-card.selected-card {
    background: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
  }

  .jersey-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    font-size: 0.78rem;
    color: #38bdf8;
    flex-shrink: 0;
  }

  .gk-card .jersey-circle {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.3);
  }

  .player-info {
    flex: 1;
    overflow: hidden;
  }

  .player-name {
    font-size: 0.75rem;
    font-weight: 600;
    color: #f1f5f9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .player-role {
    font-size: 0.65rem;
    color: #94a3b8;
  }

  .check-icon {
    color: #10b981;
  }

  /* Modal Footer */
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .btn-secondary {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-primary {
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
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
  }
  .btn-primary:hover {
    filter: brightness(1.1);
  }

  /* Import Modal Preview */
  .import-preview-box {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #1e293b;
    border: 1px dashed rgba(16, 185, 129, 0.4);
    border-radius: 10px;
    padding: 1rem;
  }

  .file-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .file-size {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .import-hint {
    font-size: 0.8rem;
    color: #94a3b8;
    line-height: 1.4;
    margin: 0;
  }

  .alert-box {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
  }
  .alert-box.success {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
  }
  .alert-box.error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: #000000;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .btn-sync-master {
    background: rgba(6, 182, 212, 0.12) !important;
    border: 1px solid rgba(6, 182, 212, 0.35) !important;
    color: #38bdf8 !important;
  }
  .btn-sync-master:hover:not(:disabled) {
    background: rgba(6, 182, 212, 0.25) !important;
    border-color: #38bdf8 !important;
    color: #ffffff !important;
  }
  .btn-sync-picker {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    background: rgba(6, 182, 212, 0.12);
    border: 1px solid rgba(6, 182, 212, 0.35);
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 600;
    color: #38bdf8;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-sync-picker:hover:not(:disabled) {
    background: rgba(6, 182, 212, 0.25);
    border-color: #38bdf8;
    color: #ffffff;
  }
  .roster-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }
  .sync-banner-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    margin-bottom: 1rem;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    color: #34d399;
    font-size: 0.85rem;
    font-weight: 600;
  }
</style>
