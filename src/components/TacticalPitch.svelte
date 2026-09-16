<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { 
    Target, 
    Trash2, 
    X, 
    CheckCircle2, 
    AlertCircle, 
    Shield, 
    Flame,
    PlusCircle,
    Printer
  } from 'lucide-svelte';

  let pitchRef: HTMLDivElement;
  let showModal = $state<boolean>(false);
  let clickCoords = $state<{ x: number; y: number }>({ x: 0, y: 0 });

  function handlePrint() {
    window.print();
  }

  // Event form
  let eventType = $state<'shot' | 'turnover' | 'recovery' | 'foul'>('shot');
  let eventOutcome = $state<'goal' | 'ontarget' | 'out' | 'rejected'>('goal');
  let eventTeam = $state<'home' | 'away'>('home');
  let eventHalf = $state<number>(1);
  let eventPlayerNo = $state<number | null>(8);
  let eventNote = $state<string>('');

  // Filters
  let filterHalf = $state<number | 'all'>('all');
  let filterType = $state<string>('all');

  let events = $derived(matchStore.data?.events || []);
  let players = $derived(matchStore.data?.players || []);

  let filteredEvents = $derived.by(() => {
    return events.filter((e) => {
      if (filterHalf !== 'all' && e.half !== filterHalf) return false;
      if (filterType !== 'all' && e.type !== filterType) return false;
      return true;
    });
  });

  function handlePitchClick(e: MouseEvent) {
    if (!pitchRef) return;
    const rect = pitchRef.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 800);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 480);

    clickCoords = { x, y };
    eventHalf = matchStore.activeHalf;
    showModal = true;
  }

  async function handleSaveEvent() {
    if (!matchStore.data) return;

    await matchStore.addPitchEvent({
      id: `evt_${Date.now()}`,
      type: eventType,
      outcome: eventType === 'shot' ? eventOutcome : 'success',
      team: eventTeam,
      half: eventHalf,
      timeStr: matchStore.formattedTime,
      x: clickCoords.x,
      y: clickCoords.y,
      playerNo: eventPlayerNo,
      note: eventNote.trim()
    });

    showModal = false;
    eventNote = '';
  }

  function getMarkerColor(evt: typeof events[0]): string {
    if (evt.type === 'shot') {
      if (evt.outcome === 'goal') return '#10b981'; // Green
      if (evt.outcome === 'ontarget') return '#3b82f6'; // Blue
      if (evt.outcome === 'rejected') return '#f59e0b'; // Amber
      return '#ef4444'; // Red
    }
    if (evt.type === 'recovery') return '#06b6d4'; // Cyan
    if (evt.type === 'turnover') return '#f43f5e'; // Rose
    return '#8b5cf6'; // Purple
  }
</script>

<div class="pitch-section glass-card">
  <!-- Pitch Controls Bar -->
  <div class="pitch-toolbar">
    <div class="toolbar-left">
      <h2 class="section-title">Papan Taktik & Shot Map Interaktif</h2>
      <span class="pitch-tip">Ketuk / Klik area lapangan untuk mencatat aksi & tembakan</span>
    </div>

    <!-- Filters -->
    <div class="toolbar-right">
      <div class="filter-group">
        <span class="filter-label">Babak:</span>
        <button 
          class="pill-btn {filterHalf === 'all' ? 'active' : ''}" 
          onclick={() => (filterHalf = 'all')}>Semua</button>
        <button 
          class="pill-btn {filterHalf === 1 ? 'active' : ''}" 
          onclick={() => (filterHalf = 1)}>H1</button>
        <button 
          class="pill-btn {filterHalf === 2 ? 'active' : ''}" 
          onclick={() => (filterHalf = 2)}>H2</button>
      </div>

      <div class="filter-group">
        <span class="filter-label">Aksi:</span>
        <button 
          class="pill-btn {filterType === 'all' ? 'active' : ''}" 
          onclick={() => (filterType = 'all')}>Semua</button>
        <button 
          class="pill-btn {filterType === 'shot' ? 'active' : ''}" 
          onclick={() => (filterType = 'shot')}>Shots</button>
        <button 
          class="pill-btn {filterType === 'recovery' ? 'active' : ''}" 
          onclick={() => (filterType = 'recovery')}>Rec</button>
        <button 
          class="pill-btn {filterType === 'turnover' ? 'active' : ''}" 
          onclick={() => (filterType = 'turnover')}>Loss</button>
      </div>

      <button type="button" class="btn-print-pitch" onclick={handlePrint} title="Cetak atau Simpan Tampilan Taktik & Shot Map ke PDF">
        <Printer size={14} />
        <span>Cetak PDF</span>
      </button>
    </div>
  </div>

  <!-- Interactive Pitch Container -->
  <div class="pitch-wrapper">
    <!-- Futsal Field SVG -->
    <div 
      class="futsal-court" 
      bind:this={pitchRef} 
      onclick={handlePitchClick} 
      role="button" 
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && (showModal = true)}>
      
      <!-- Real Futsal Court Background Image -->
      <img src="/lapangan.png" alt="Lapangan Futsal" class="court-bg-img" />

      <!-- Rendered Events Markers -->
      {#each filteredEvents as evt (evt.id)}
        <div 
          class="pitch-marker {evt.outcome === 'goal' ? 'is-goal' : ''}" 
          style="left: {(evt.x / 800) * 100}%; top: {(evt.y / 480) * 100}%; --marker-color: {getMarkerColor(evt)}"
          title="{evt.team.toUpperCase()} - {evt.outcome} #{evt.playerNo || ''} ({evt.timeStr}) {evt.note}">
          <div class="marker-dot">
            {#if evt.outcome === 'goal'}
              ⚽
            {:else if evt.playerNo}
              <span>{evt.playerNo}</span>
            {:else}
              <span class="dot-inner"></span>
            {/if}
          </div>

          <!-- Tooltip on hover -->
          <div class="marker-tooltip">
            <div class="tip-header">
              <span class="tip-badge" style="background: {getMarkerColor(evt)}">{evt.outcome.toUpperCase()}</span>
              <span class="tip-time">{evt.timeStr} (H{evt.half})</span>
            </div>
            {#if evt.playerNo}
              <div class="tip-player">Pemain #{evt.playerNo}</div>
            {/if}
            {#if evt.note}
              <div class="tip-note">{evt.note}</div>
            {/if}
            <button class="tip-del-btn" onclick={(e) => { e.stopPropagation(); matchStore.deletePitchEvent(evt.id); }}>
              <Trash2 size={12} /> Hapus
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Legend Bar -->
  <div class="pitch-legend">
    <div class="legend-item"><span class="leg-dot" style="background: #10b981;"></span> <span>Goal</span></div>
    <div class="legend-item"><span class="leg-dot" style="background: #3b82f6;"></span> <span>On Target</span></div>
    <div class="legend-item"><span class="leg-dot" style="background: #ef4444;"></span> <span>Off Target</span></div>
    <div class="legend-item"><span class="leg-dot" style="background: #f59e0b;"></span> <span>Blocked</span></div>
    <div class="legend-item"><span class="leg-dot" style="background: #06b6d4;"></span> <span>Recovery</span></div>
    <div class="legend-item"><span class="leg-dot" style="background: #f43f5e;"></span> <span>Turnover</span></div>
  </div>

  <!-- Add Event Modal Popover -->
  {#if showModal}
    <div class="event-modal-overlay" onclick={() => (showModal = false)} role="presentation">
      <div class="event-modal-card" onclick={(e) => e.stopPropagation()} role="dialog">
        <div class="modal-header">
          <h3>Plot Aksi Lapangan ({clickCoords.x}, {clickCoords.y})</h3>
          <button class="close-btn" onclick={() => (showModal = false)}><X size={18} /></button>
        </div>

        <div class="modal-body">
          <!-- Type -->
          <div class="m-field">
            <label>Jenis Aksi:</label>
            <div class="btn-toggle-group">
              <button class="t-btn {eventType === 'shot' ? 'active' : ''}" onclick={() => (eventType = 'shot')}>Tembakan (Shot)</button>
              <button class="t-btn {eventType === 'recovery' ? 'active' : ''}" onclick={() => (eventType = 'recovery')}>Recovery</button>
              <button class="t-btn {eventType === 'turnover' ? 'active' : ''}" onclick={() => (eventType = 'turnover')}>Loss (Turnover)</button>
              <button class="t-btn {eventType === 'foul' ? 'active' : ''}" onclick={() => (eventType = 'foul')}>Foul</button>
            </div>
          </div>

          <!-- Outcome if shot -->
          {#if eventType === 'shot'}
            <div class="m-field">
              <label>Hasil Tembakan:</label>
              <div class="btn-toggle-group">
                <button class="t-btn {eventOutcome === 'goal' ? 'active-green' : ''}" onclick={() => (eventOutcome = 'goal')}>⚽ Gol</button>
                <button class="t-btn {eventOutcome === 'ontarget' ? 'active-blue' : ''}" onclick={() => (eventOutcome = 'ontarget')}>🎯 On Target</button>
                <button class="t-btn {eventOutcome === 'out' ? 'active-red' : ''}" onclick={() => (eventOutcome = 'out')}>❌ Out</button>
                <button class="t-btn {eventOutcome === 'rejected' ? 'active-amber' : ''}" onclick={() => (eventOutcome = 'rejected')}>🛡️ Blocked</button>
              </div>
            </div>
          {/if}

          <!-- Team & Half -->
          <div class="m-row">
            <div class="m-field">
              <label>Tim:</label>
              <select bind:value={eventTeam} class="m-select">
                <option value="home">{matchStore.data?.match.homeTeam || 'Home'}</option>
                <option value="away">{matchStore.data?.match.awayTeam || 'Away'}</option>
              </select>
            </div>
            <div class="m-field">
              <label>Babak:</label>
              <select bind:value={eventHalf} class="m-select">
                <option value={1}>Babak 1</option>
                <option value={2}>Babak 2</option>
              </select>
            </div>
          </div>

          <!-- Player selection -->
          <div class="m-field">
            <label>Pemain Pelaksana:</label>
            <select bind:value={eventPlayerNo} class="m-select">
              <option value={null}>-- Tanpa Pemain Spesifik --</option>
              {#each players as p}
                <option value={p.no}>#{p.no} - {p.name}</option>
              {/each}
            </select>
          </div>

          <!-- Notes -->
          <div class="m-field">
            <label>Catatan / Keterangan:</label>
            <input type="text" bind:value={eventNote} placeholder="cth. Cut-inside & tendangan kaki kiri" class="m-input" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-save-event" onclick={handleSaveEvent}>Simpan Aksi</button>
          <button class="btn-cancel-event" onclick={() => (showModal = false)}>Batal</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .pitch-section {
    position: relative;
  }

  .pitch-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .pitch-tip {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 2px;
    display: block;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .btn-print-pitch {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.4);
    padding: 0.35rem 0.75rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-print-pitch:hover {
    background: rgba(56, 189, 248, 0.25);
    border-color: #38bdf8;
    color: #ffffff;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .filter-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
  }

  .pill-btn {
    font-size: 0.72rem;
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.15s;
  }

  .pill-btn.active {
    background: #10b981;
    color: #0f172a;
    border-color: #10b981;
    font-weight: 700;
  }

  .pitch-wrapper {
    position: relative;
    width: 100%;
    background: radial-gradient(circle at center, #064e3b 0%, #022c22 100%);
    border: 2px solid rgba(16, 185, 129, 0.35);
    border-radius: 14px;
    padding: 12px;
    box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.6);
  }

  .futsal-court {
    position: relative;
    width: 100%;
    max-width: 980px;
    aspect-ratio: 800 / 480;
    margin: 0 auto;
    cursor: crosshair;
    user-select: none;
    touch-action: manipulation;
  }

  .court-bg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    border-radius: 8px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
    user-select: none;
    pointer-events: none;
  }

  .pitch-marker {
    position: absolute;
    transform: translate(-50%, -50%);
    cursor: pointer;
    z-index: 10;
    touch-action: manipulation;
  }

  .marker-dot {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--marker-color);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 800;
    box-shadow: 0 0 10px var(--marker-color);
    transition: transform 0.15s;
    border: 2px solid rgba(255, 255, 255, 0.9);
  }

  .pitch-marker:hover .marker-dot, .pitch-marker:active .marker-dot {
    transform: scale(1.35);
  }

  .is-goal .marker-dot {
    background: #10b981;
    border-color: #ffffff;
    animation: goalGlow 1.5s infinite;
  }

  @keyframes goalGlow {
    0%, 100% { box-shadow: 0 0 12px #10b981; }
    50% { box-shadow: 0 0 24px #34d399; }
  }

  .marker-tooltip {
    display: none;
    position: absolute;
    bottom: 34px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0.6rem 0.85rem;
    border-radius: 10px;
    width: 180px;
    z-index: 30;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
    font-size: 0.75rem;
  }

  .pitch-marker:hover .marker-tooltip, .pitch-marker:focus .marker-tooltip {
    display: block;
  }

  .tip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .tip-badge {
    font-size: 0.65rem;
    font-weight: 800;
    color: #ffffff;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .tip-time {
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
  }

  .tip-player {
    font-weight: 700;
    color: #f1f5f9;
  }

  .tip-note {
    color: #cbd5e1;
    margin: 3px 0;
    font-size: 0.7rem;
  }

  .tip-del-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.68rem;
    cursor: pointer;
    margin-top: 4px;
    width: 100%;
    justify-content: center;
  }

  .pitch-legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 0.85rem;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .leg-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  /* Modal */
  .event-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .event-modal-card {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    width: 90%;
    max-width: 440px;
    padding: 1.25rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #f1f5f9;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
  }

  .m-field {
    margin-bottom: 0.85rem;
  }

  .m-field label {
    display: block;
    font-size: 0.75rem;
    color: #94a3b8;
    margin-bottom: 0.35rem;
    font-weight: 600;
  }

  .m-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .btn-toggle-group {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .t-btn {
    flex: 1;
    min-width: 80px;
    padding: 0.4rem;
    font-size: 0.72rem;
    border-radius: 6px;
    background: #0c1524;
    color: #9cb3cc;
    border: 1px solid rgba(156, 179, 204, 0.2);
    cursor: pointer;
    transition: all 0.15s;
  }

  .t-btn.active {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    color: #ffffff;
    border-color: #38bdf8;
    font-weight: 700;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.35);
  }

  .t-btn.active-green {
    background: #059669;
    color: #ffffff;
    border-color: #34d399;
    font-weight: 700;
  }

  .t-btn.active-blue {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    color: #ffffff;
    border-color: #38bdf8;
    font-weight: 700;
  }

  .t-btn.active-red {
    background: #ef4444;
    color: #ffffff;
    border-color: #f87171;
    font-weight: 700;
  }

  .t-btn.active-amber {
    background: #d97706;
    color: #ffffff;
    border-color: #fbbf24;
    font-weight: 700;
  }

  .m-select, .m-input {
    width: 100%;
    background: #0c1524;
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 6px;
    padding: 0.45rem 0.6rem;
    color: #ffffff;
    font-size: 0.82rem;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.25rem;
  }

  .btn-save-event {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    color: #ffffff;
    border: 1px solid #38bdf8;
    padding: 0.5rem 1.2rem;
    border-radius: 6px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
  }

  .btn-cancel-event {
    background: transparent;
    color: #9cb3cc;
    border: 1px solid rgba(156, 179, 204, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
  }

  /* Print Styles for Tactical Pitch */
  @media print {
    .pitch-section {
      background: #ffffff !important;
      color: #000000 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    .filter-group,
    .btn-print-pitch,
    .pitch-tip,
    .marker-tooltip {
      display: none !important;
    }
    .section-title {
      color: #000000 !important;
    }
    .pitch-wrapper {
      background: #064e3b !important;
      border: 1px solid #cbd5e1 !important;
      box-shadow: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
</style>
