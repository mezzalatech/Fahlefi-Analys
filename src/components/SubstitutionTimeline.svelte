<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { 
    Users, 
    Clock, 
    ArrowRightLeft, 
    RotateCcw, 
    Play, 
    TrendingUp, 
    TrendingDown, 
    Sparkles, 
    Check, 
    Trash2,
    Layers,
    Activity
  } from 'lucide-svelte';

  const pakets = $derived.by(() => matchStore.data?.pakets || []);
  const substitutions = $derived.by(() => matchStore.substitutions || []);
  const onPitch = $derived.by(() => matchStore.onPitchPlayers || []);

  function getPlayerName(no: number): string {
    const p = matchStore.data?.players.find(pl => pl.no === no);
    if (p && p.name) return p.name;
    const mp = matchStore.masterPlayers.find(mpl => mpl.noPunggung === no);
    if (mp && mp.nickname) return mp.nickname;
    if (mp && mp.name) return mp.name;
    return `Player #${no}`;
  }

  function getPaketDisplay(pktIndex: number | null | undefined, pNumbersStr: string) {
    if (pktIndex) {
      const pkt = pakets.find(p => p.paketIndex === pktIndex);
      if (pkt && pkt.code) return `Paket ${pktIndex} (${pkt.code})`;
      return `Paket ${pktIndex}`;
    }
    try {
      const nums: number[] = JSON.parse(pNumbersStr);
      return `Unit: #${nums.join(', #')}`;
    } catch {
      return 'Unit Dynamic';
    }
  }

  function parseNumbers(pNumbersStr: string): number[] {
    try {
      return JSON.parse(pNumbersStr);
    } catch {
      return [];
    }
  }

  async function handleDeploy(index: number) {
    await matchStore.deployPaket(index);
  }

  async function handleDeleteSub(id: string) {
    if (confirm('Hapus catatan rotasi ini?')) {
      await matchStore.deleteSubstitution(id);
    }
  }
</script>

<div class="sub-timeline-container">
  <!-- Active Unit Banner -->
  <div class="active-unit-card">
    <div class="active-unit-header">
      <div class="unit-title-group">
        <div class="live-dot"></div>
        <div>
          <h3 class="unit-title">5-MAN UNIT AKTIF DI LAPANGAN</h3>
          <span class="unit-subtitle">
            {#if matchStore.activePaketIndex}
              Terhubung ke Paket {matchStore.activePaketIndex}
            {:else if onPitch.length === 5}
              Formasi Kustom (5 Pemain)
            {:else}
              {onPitch.length} Pemain Aktif Terpilih
            {/if}
          </span>
        </div>
      </div>

      <div class="timer-badge">
        <Clock size={14} class="text-cyan" />
        <span class="font-mono">{matchStore.formattedTime} ({matchStore.activeHalf}ºH)</span>
      </div>
    </div>

    <!-- Active 5 Players Chips -->
    <div class="active-chips-grid">
      {#if onPitch.length === 0}
        <div class="no-active-players">
          <span>Belum ada pemain aktif di lapangan. Klik Paket di bawah atau pilih pemain dari Matrix!</span>
        </div>
      {:else}
        {#each onPitch as pNo}
          <div class="player-chip">
            <span class="chip-no">#{pNo}</span>
            <span class="chip-name">{getPlayerName(pNo)}</span>
            <button 
              class="btn-sub-out" 
              title="Tarik Keluar" 
              onclick={() => matchStore.toggleOnPitch(pNo)}>
              ×
            </button>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Quick Deploy Paket Bar -->
  <div class="quick-deploy-card">
    <div class="deploy-title-row">
      <div class="deploy-label">
        <Layers size={15} class="text-cyan" />
        <span>ROTASI CEPAT PAKET 1-9 (1-KLIK DEPLOY)</span>
      </div>
      <span class="deploy-tip">Pergantian langsung tercatat otomatis ke histori & analisis waktu</span>
    </div>

    <div class="paket-grid">
      {#each pakets as pkt}
        {@const isActive = matchStore.activePaketIndex === pkt.paketIndex}
        <button 
          class="btn-deploy-pkt {isActive ? 'active-deploy' : ''}" 
          onclick={() => handleDeploy(pkt.paketIndex)}>
          <div class="pkt-num">P{pkt.paketIndex}</div>
          <div class="pkt-code-text">{pkt.code || 'Kosong'}</div>
          {#if isActive}
            <span class="active-pill">ON PITCH</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Timeline Rotation Log -->
  <div class="timeline-card">
    <div class="timeline-header">
      <div class="timeline-title-row">
        <ArrowRightLeft size={16} class="text-cyan" />
        <h3>HISTORI PERGANTIAN & CATATAN ROTASI PERTANDINGAN</h3>
      </div>
      <span class="log-count">{substitutions.length} Rotasi Tercatat</span>
    </div>

    {#if substitutions.length === 0}
      <div class="empty-timeline">
        <RotateCcw size={32} class="text-slate" />
        <p>Belum ada catatan pergantian pemain pada pertandingan ini.</p>
        <span>Klik deploy Paket di atas atau ganti pemain di Matrix untuk mencatat rotasi otomatis.</span>
      </div>
    {:else}
      <div class="timeline-list">
        {#each substitutions as sub, idx}
          {@const pNums = parseNumbers(sub.playerNumbers)}
          <div class="timeline-item">
            <!-- Time Indicator -->
            <div class="time-col">
              <span class="time-half">{sub.half}ºH</span>
              <span class="time-clock font-mono">{sub.timeStr}</span>
            </div>

            <div class="timeline-node">
              <div class="node-circle"></div>
              {#if idx < substitutions.length - 1}
                <div class="node-line"></div>
              {/if}
            </div>

            <!-- Content Card -->
            <div class="item-content-card">
              <div class="item-head">
                <div class="item-badge-group">
                  {#if sub.paketIndex}
                    <span class="badge-pkt">PAKET {sub.paketIndex}</span>
                  {:else}
                    <span class="badge-custom">CUSTOM LINEUP</span>
                  {/if}
                  <span class="item-note">{sub.note || 'Rotasi Pemain'}</span>
                </div>
                {#if matchStore.currentUser?.role === 'coach' || matchStore.currentUser?.role === 'admin'}
                  <button 
                    class="btn-delete-log" 
                    title="Hapus Log" 
                    onclick={() => handleDeleteSub(sub.id)}>
                    <Trash2 size={13} />
                  </button>
                {/if}
              </div>

              <!-- Players list -->
              <div class="sub-players-row">
                {#each pNums as pNo}
                  <span class="sub-player-pill">
                    <strong>#{pNo}</strong> {getPlayerName(pNo)}
                  </span>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .sub-timeline-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    color: #f1f5f9;
  }

  /* Active Unit Card */
  .active-unit-card {
    background: linear-gradient(145deg, #13243a 0%, #0c1524 100%);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 12px;
    padding: 1.15rem 1.4rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(56, 189, 248, 0.1);
  }

  .active-unit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 10px;
  }

  .unit-title-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .live-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.9); }
  }

  .unit-title {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    color: #ffffff;
  }

  .unit-subtitle {
    font-size: 0.7rem;
    color: #7dd3fc;
    font-weight: 600;
  }

  .timer-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(8, 14, 24, 0.8);
    border: 1px solid rgba(156, 179, 204, 0.25);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.8rem;
    color: #cbd5e1;
  }

  .active-chips-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .no-active-players {
    color: #9cb3cc;
    font-size: 0.78rem;
    font-style: italic;
    padding: 6px 0;
  }

  .player-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(22, 42, 69, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.4);
    padding: 6px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }

  .chip-no {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 900;
    color: #38bdf8;
    font-size: 0.9rem;
  }

  .chip-name {
    font-size: 0.8rem;
    font-weight: 700;
    color: #ffffff;
  }

  .btn-sub-out {
    background: transparent;
    border: none;
    color: #9cb3cc;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    padding: 0 2px;
    transition: all 0.15s;
  }

  .btn-sub-out:hover {
    color: #f43f5e;
  }

  /* Quick Deploy Card */
  .quick-deploy-card {
    background: rgba(12, 21, 36, 0.85);
    border: 1px solid rgba(156, 179, 204, 0.18);
    border-radius: 10px;
    padding: 1rem 1.25rem;
  }

  .deploy-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.85rem;
    flex-wrap: wrap;
    gap: 6px;
  }

  .deploy-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #7dd3fc;
  }

  .deploy-tip {
    font-size: 0.68rem;
    color: #64748b;
  }

  .paket-grid {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 8px;
  }

  .btn-deploy-pkt {
    background: rgba(18, 32, 54, 0.7);
    border: 1px solid rgba(156, 179, 204, 0.2);
    border-radius: 8px;
    padding: 8px 4px;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    position: relative;
  }

  .btn-deploy-pkt:hover {
    background: rgba(24, 44, 74, 0.9);
    border-color: #38bdf8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25);
  }

  .btn-deploy-pkt.active-deploy {
    background: linear-gradient(145deg, #1b3558 0%, #254b7c 100%);
    border-color: #38bdf8;
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
  }

  .pkt-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
    font-weight: 900;
    color: #ffffff;
  }

  .pkt-code-text {
    font-size: 0.65rem;
    color: #9cb3cc;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .active-pill {
    font-size: 0.55rem;
    font-weight: 900;
    background: #10b981;
    color: #ffffff;
    padding: 1px 4px;
    border-radius: 3px;
    letter-spacing: 0.05em;
  }

  /* Timeline */
  .timeline-card {
    background: rgba(12, 21, 36, 0.9);
    border: 1px solid rgba(156, 179, 204, 0.2);
    border-radius: 10px;
    padding: 1.25rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
    padding-bottom: 0.75rem;
  }

  .timeline-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .timeline-title-row h3 {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 800;
    color: #ffffff;
  }

  .log-count {
    font-size: 0.72rem;
    color: #9cb3cc;
    font-weight: 600;
  }

  .empty-timeline {
    text-align: center;
    padding: 3rem 1rem;
    color: #64748b;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .empty-timeline p {
    margin: 0;
    font-weight: 700;
    color: #9cb3cc;
  }

  .empty-timeline span {
    font-size: 0.75rem;
  }

  .timeline-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    position: relative;
    padding-bottom: 1.25rem;
  }

  .time-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 55px;
  }

  .time-half {
    font-size: 0.65rem;
    font-weight: 800;
    color: #38bdf8;
  }

  .time-clock {
    font-size: 0.85rem;
    font-weight: 800;
    color: #ffffff;
  }

  .timeline-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    padding-top: 4px;
  }

  .node-circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 6px #38bdf8;
    z-index: 2;
  }

  .node-line {
    position: absolute;
    top: 14px;
    bottom: -20px;
    width: 2px;
    background: rgba(156, 179, 204, 0.2);
  }

  .item-content-card {
    flex: 1;
    background: rgba(16, 28, 48, 0.65);
    border: 1px solid rgba(156, 179, 204, 0.18);
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .item-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .item-badge-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badge-pkt {
    background: linear-gradient(135deg, #1b3558 0%, #254b7c 100%);
    border: 1px solid #38bdf8;
    color: #ffffff;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 4px;
  }

  .badge-custom {
    background: rgba(148, 163, 184, 0.15);
    border: 1px solid rgba(148, 163, 184, 0.3);
    color: #cbd5e1;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 4px;
  }

  .item-note {
    font-size: 0.75rem;
    color: #cbd5e1;
    font-weight: 600;
  }

  .btn-delete-log {
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 3px;
    border-radius: 4px;
    transition: all 0.15s;
  }

  .btn-delete-log:hover {
    color: #f43f5e;
    background: rgba(244, 63, 94, 0.15);
  }

  .sub-players-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .sub-player-pill {
    background: rgba(8, 14, 24, 0.8);
    border: 1px solid rgba(156, 179, 204, 0.15);
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.72rem;
    color: #cbd5e1;
  }

  .sub-player-pill strong {
    color: #38bdf8;
    font-family: 'JetBrains Mono', monospace;
  }

  .font-mono {
    font-family: 'JetBrains Mono', monospace;
  }

  @media (max-width: 900px) {
    .paket-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
