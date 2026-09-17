<script lang="ts">
  import { onMount } from 'svelte';
  import { matchStore } from '../lib/store.svelte';
  import { api } from '../lib/api';
  import { 
    Folder, 
    Plus, 
    X, 
    Check, 
    Calendar, 
    MapPin, 
    Clock, 
    Copy, 
    Trash2, 
    FileSpreadsheet, 
    Play, 
    Trophy,
    Shield,
    Users,
    Sparkles
  } from 'lucide-svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose } = $props<Props>();

  let activeTab = $state<'list' | 'create'>('list');

  // Form State for New Match
  let formName = $state<string>(`Match Analysis ${matchStore.currentTeamName}`);
  let formCompetition = $state<string>('Paser Futsal Cup');
  let formHomeTeam = $state<string>(matchStore.currentTeamName);
  let formAwayTeam = $state<string>('');
  let formVenue = $state<string>('GOR Sadurengas Paser');
  let formDate = $state<string>(new Date().toISOString().split('T')[0]);
  let formTime = $state<string>('19:00');
  let formPopulateMaster = $state<boolean>(true);
  let formInitPakets = $state<boolean>(true);
  let isSubmitting = $state<boolean>(false);

  onMount(() => {
    formHomeTeam = matchStore.currentTeamName;
    formName = `Match Analysis ${matchStore.currentTeamName}`;
    matchStore.loadMatchesList(matchStore.activeTeamId);
  });

  async function handleCreateMatch(e: Event) {
    e.preventDefault();
    isSubmitting = true;
    try {
      await matchStore.createNewMatch({
        name: formName,
        competition: formCompetition,
        homeTeam: formHomeTeam,
        awayTeam: formAwayTeam,
        venue: formVenue,
        date: formDate,
        time: formTime,
        populateFromMaster: formPopulateMaster,
        initPakets: formInitPakets
      });
      onClose();
    } catch (err: any) {
      alert('Gagal membuat pertandingan: ' + err.message);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleSwitch(matchId: number) {
    await matchStore.switchMatch(matchId);
    onClose();
  }

  async function handleDuplicate(matchId: number) {
    if (confirm('Duplikat data pertandingan dan susunan pemain ini?')) {
      await matchStore.duplicateMatch(matchId);
      onClose();
    }
  }

  async function handleDelete(matchId: number, matchName: string) {
    if (confirm(`Yakin ingin menghapus pertandingan "${matchName}"? Seluruh statistik dan tag terkait akan dihapus permanen.`)) {
      await matchStore.deleteMatch(matchId);
    }
  }
</script>

<div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="presentation">
  <div class="match-manager-card">
    <!-- Header -->
    <div class="modal-header">
      <div class="header-left">
        <Trophy size={20} class="text-cyan" />
        <div>
          <h2 class="modal-title">MANAJEMEN ARSIP & PENYIMPANAN PER-MATCH</h2>
          <span class="modal-subtitle">Pilih pertandingan aktif, kelola arsip, atau buat laga baru</span>
        </div>
      </div>
      <button class="btn-close" onclick={onClose}>
        <X size={18} />
      </button>
    </div>

    <!-- Tabs switcher -->
    <div class="manager-tabs">
      <button 
        class="mgr-tab {activeTab === 'list' ? 'active' : ''}" 
        onclick={() => activeTab = 'list'}>
        <Folder size={15} />
        <span>Daftar Pertandingan ({matchStore.matchesList.length})</span>
      </button>
      <button 
        class="mgr-tab {activeTab === 'create' ? 'active' : ''}" 
        onclick={() => activeTab = 'create'}>
        <Plus size={15} />
        <span>Buat Pertandingan Baru (+)</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="manager-body">
      {#if activeTab === 'list'}
        <div class="match-cards-grid">
          {#if matchStore.matchesList.length === 0}
            <div class="empty-state">
              <Folder size={36} class="text-slate" />
              <p>Belum ada rekaman pertandingan.</p>
              <button class="btn-create-now" onclick={() => activeTab = 'create'}>
                Buat Pertandingan Sekarang
              </button>
            </div>
          {:else}
            {#each matchStore.matchesList as m}
              {@const isActive = matchStore.activeMatchId === m.id}
              <div class="match-card {isActive ? 'active-match' : ''}">
                <div class="match-card-top">
                  <div class="comp-badge-group">
                    <span class="comp-name">{m.competition || 'Pertandingan Futsal'}</span>
                    {#if isActive}
                      <span class="badge-active-tag">SEDANG DIBUKA</span>
                    {/if}
                  </div>
                  <span class="match-id-pill">ID #{m.id}</span>
                </div>

                <!-- Scoreboard vs -->
                <div class="match-score-row">
                  <div class="team-block team-home">
                    <span class="team-name">{m.homeTeam || 'Home'}</span>
                  </div>
                  <div class="score-box">
                    <span class="score-digits">{m.totalScoreHome ?? (m.homeScore1st + m.homeScore2nd)}</span>
                    <span class="score-divider">-</span>
                    <span class="score-digits">{m.totalScoreAway ?? (m.awayScore1st + m.awayScore2nd)}</span>
                  </div>
                  <div class="team-block team-away">
                    <span class="team-name">{m.awayTeam || 'Away'}</span>
                  </div>
                </div>

                <!-- Meta Details -->
                <div class="match-meta-pills">
                  {#if m.date}
                    <span class="meta-item"><Calendar size={12} /> {m.date}</span>
                  {/if}
                  {#if m.venue}
                    <span class="meta-item"><MapPin size={12} /> {m.venue}</span>
                  {/if}
                  <span class="meta-item"><Users size={12} /> {m.playersCount || 17} Pemain</span>
                  <span class="meta-item"><Sparkles size={12} /> {m.eventsCount || 0} Tag Lapangan</span>
                </div>

                <!-- Action Toolbar -->
                <div class="match-card-actions">
                  {#if !isActive}
                    <button class="btn-action-primary" onclick={() => handleSwitch(m.id)}>
                      <Play size={13} />
                      <span>Buka Laga</span>
                    </button>
                  {:else}
                    <div class="current-badge">
                      <Check size={13} />
                      <span>Laga Aktif</span>
                    </div>
                  {/if}

                  <a 
                    href={api.getExportUrl(m.id)} 
                    download 
                    class="btn-action-icon" 
                    title="Ekspor Excel (.xlsx)">
                    <FileSpreadsheet size={14} class="text-emerald" />
                  </a>

                  <button 
                    class="btn-action-icon" 
                    title="Duplikat Laga" 
                    onclick={() => handleDuplicate(m.id)}>
                    <Copy size={14} />
                  </button>

                  <button 
                    class="btn-action-icon btn-delete" 
                    title="Hapus Pertandingan" 
                    onclick={() => handleDelete(m.id, `${m.homeTeam} vs ${m.awayTeam}`)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      {:else}
        <!-- Form Create New Match -->
        <form class="create-match-form" onsubmit={handleCreateMatch}>
          <div class="form-grid-2">
            <div class="form-group">
              <label for="new-comp">Kompetisi / Turnamen:</label>
              <input id="new-comp" type="text" bind:value={formCompetition} placeholder="cth. Porprov Paser" />
            </div>
            <div class="form-group">
              <label for="new-title">Judul Dokumen / Header:</label>
              <input id="new-title" type="text" bind:value={formName} placeholder="cth. Match Analysis Babak 8 Besar" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="new-home">Tim Home (Tuan Rumah):</label>
              <input id="new-home" type="text" bind:value={formHomeTeam} placeholder="cth. Porprov Paser" class="text-home" />
            </div>
            <div class="form-group">
              <label for="new-away">Tim Away (Lawan):</label>
              <input id="new-away" type="text" bind:value={formAwayTeam} placeholder="cth. Tim Lawan" class="text-away" />
            </div>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label for="new-venue">Venue / Lapangan:</label>
              <input id="new-venue" type="text" bind:value={formVenue} placeholder="cth. GOR Sadurengas Paser" />
            </div>
            <div class="form-group">
              <label for="new-date">Tanggal:</label>
              <input id="new-date" type="date" bind:value={formDate} />
            </div>
            <div class="form-group">
              <label for="new-time">Waktu Kickoff:</label>
              <input id="new-time" type="time" bind:value={formTime} />
            </div>
          </div>

          <!-- Master Sync Toggles -->
          <div class="toggles-box">
            <label class="checkbox-label">
              <input type="checkbox" bind:checked={formPopulateMaster} />
              <div class="checkbox-desc">
                <strong>Otomatis isi 25 pemain dari Database Master Skuad FAHLEFI</strong>
                <span>Nama pemain, posisi GK/Anchor/Flank/Pivot, dan no punggung akan langsung siap digunakan</span>
              </div>
            </label>

            <label class="checkbox-label">
              <input type="checkbox" bind:checked={formInitPakets} />
              <div class="checkbox-desc">
                <strong>Inisialisasi 9 Slot Formasi Paket 5-Man</strong>
                <span>Menyiapkan slot Paket 1 s/d Paket 9 untuk rotasi cepat tim</span>
              </div>
            </label>
          </div>

          <div class="form-footer">
            <button type="button" class="btn-cancel" onclick={() => activeTab = 'list'}>Kembali ke Arsip</button>
            <button type="submit" class="btn-submit" disabled={isSubmitting}>
              {#if isSubmitting}
                <span>Memproses...</span>
              {:else}
                <Plus size={16} />
                <span>Buat & Buka Pertandingan Ini</span>
              {/if}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(6, 11, 20, 0.85);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .match-manager-card {
    background: linear-gradient(145deg, #101d30 0%, #0c1524 60%, #080d18 100%);
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 14px;
    width: 100%;
    max-width: 780px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.12);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.15rem 1.5rem;
    background: rgba(14, 25, 42, 0.9);
    border-bottom: 1px solid rgba(156, 179, 204, 0.18);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .modal-title {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #7dd3fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .modal-subtitle {
    font-size: 0.7rem;
    color: #9cb3cc;
  }

  .btn-close {
    background: transparent;
    border: none;
    color: #9cb3cc;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .manager-tabs {
    display: flex;
    background: rgba(8, 14, 24, 0.7);
    padding: 6px 1.5rem;
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
    gap: 8px;
  }

  .mgr-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: #9cb3cc;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .mgr-tab:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
  }

  .mgr-tab.active {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    color: #ffffff;
    border-color: #38bdf8;
    box-shadow: 0 2px 10px rgba(56, 189, 248, 0.3);
  }

  .manager-body {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .match-cards-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .match-card {
    background: rgba(16, 28, 48, 0.65);
    border: 1px solid rgba(156, 179, 204, 0.2);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: all 0.15s;
  }

  .match-card:hover {
    border-color: rgba(56, 189, 248, 0.5);
    background: rgba(20, 36, 62, 0.85);
  }

  .match-card.active-match {
    background: linear-gradient(145deg, rgba(27, 53, 88, 0.6) 0%, rgba(14, 25, 42, 0.9) 100%);
    border-color: #38bdf8;
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.25);
  }

  .match-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .comp-badge-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .comp-name {
    font-size: 0.75rem;
    font-weight: 800;
    color: #7dd3fc;
    letter-spacing: 0.04em;
  }

  .badge-active-tag {
    background: #10b981;
    color: #ffffff;
    font-size: 0.6rem;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .match-id-pill {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: #64748b;
  }

  .match-score-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(8, 14, 24, 0.7);
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid rgba(156, 179, 204, 0.12);
  }

  .team-block {
    flex: 1;
  }

  .team-home { text-align: right; }
  .team-away { text-align: left; }

  .team-name {
    font-size: 0.88rem;
    font-weight: 800;
    color: #ffffff;
  }

  .score-box {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 18px;
  }

  .score-digits {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.25rem;
    font-weight: 900;
    color: #38bdf8;
  }

  .score-divider {
    color: #64748b;
    font-weight: 800;
  }

  .match-meta-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(8, 14, 24, 0.6);
    border: 1px solid rgba(156, 179, 204, 0.15);
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.68rem;
    color: #9cb3cc;
  }

  .match-card-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    border-top: 1px solid rgba(156, 179, 204, 0.1);
    padding-top: 8px;
  }

  .btn-action-primary {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    border: 1px solid #38bdf8;
    color: #ffffff;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s;
  }

  .btn-action-primary:hover {
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
  }

  .current-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #34d399;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 4px 8px;
    background: rgba(16, 185, 129, 0.15);
    border-radius: 6px;
  }

  .btn-action-icon {
    background: rgba(8, 14, 24, 0.7);
    border: 1px solid rgba(156, 179, 204, 0.2);
    color: #cbd5e1;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }

  .btn-action-icon:hover {
    border-color: #38bdf8;
    color: #ffffff;
  }

  .btn-delete:hover {
    border-color: #f43f5e;
    color: #f43f5e;
    background: rgba(244, 63, 94, 0.15);
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #9cb3cc;
  }

  .btn-create-now {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    border: 1px solid #38bdf8;
    color: #ffffff;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 800;
    cursor: pointer;
  }

  /* Form Create */
  .create-match-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .form-grid-3 {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr;
    gap: 12px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .form-group label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #cbd5e1;
  }

  .form-group input {
    background: rgba(8, 14, 24, 0.85);
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 6px;
    padding: 8px 10px;
    color: #ffffff;
    font-size: 0.82rem;
    outline: none;
  }

  .form-group input:focus {
    border-color: #38bdf8;
  }

  .text-home { color: #60a5fa !important; font-weight: 700; }
  .text-away { color: #f87171 !important; font-weight: 700; }

  .toggles-box {
    background: rgba(14, 25, 42, 0.8);
    border: 1px solid rgba(156, 179, 204, 0.2);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
  }

  .checkbox-label input {
    margin-top: 3px;
    accent-color: #38bdf8;
    width: 16px;
    height: 16px;
  }

  .checkbox-desc {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .checkbox-desc strong {
    font-size: 0.78rem;
    color: #ffffff;
  }

  .checkbox-desc span {
    font-size: 0.68rem;
    color: #9cb3cc;
  }

  .form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
  }

  .btn-cancel {
    background: transparent;
    border: 1px solid rgba(156, 179, 204, 0.25);
    color: #cbd5e1;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-submit {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    border: 1px solid #38bdf8;
    color: #ffffff;
    padding: 8px 18px;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-submit:hover:not(:disabled) {
    box-shadow: 0 4px 14px rgba(56, 189, 248, 0.4);
  }

  @media (max-width: 650px) {
    .form-grid-2, .form-grid-3 {
      grid-template-columns: 1fr;
    }
  }
</style>
