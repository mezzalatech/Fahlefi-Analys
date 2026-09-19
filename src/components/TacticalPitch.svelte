<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { 
    Target, 
    Trash2, 
    X, 
    Flame, 
    MapPin, 
    Share2, 
    Activity, 
    Printer,
    Layers,
    Users,
    Sparkles
  } from 'lucide-svelte';

  let pitchRef: HTMLDivElement;
  let heatmapCanvasRef = $state<HTMLCanvasElement | null>(null);
  let showModal = $state<boolean>(false);
  let clickCoords = $state<{ x: number; y: number }>({ x: 0, y: 0 });

  // Main View Mode inside Tactical Pitch
  let activeTabMode = $state<'pins' | 'heatmap' | 'passing'>('pins');

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
  let heatmapFilter = $state<'all' | 'shot' | 'recovery' | 'turnover'>('all');

  let events = $derived(matchStore.scopedEvents);
  let players = $derived(matchStore.data?.players || []);

  let filteredEvents = $derived.by(() => {
    return events.filter((e) => {
      if (filterHalf !== 'all' && e.half !== filterHalf) return false;
      if (filterType !== 'all' && e.type !== filterType) return false;
      return true;
    });
  });

  let heatmapEvents = $derived.by(() => {
    return events.filter((e) => {
      if (filterHalf !== 'all' && e.half !== filterHalf) return false;
      if (heatmapFilter !== 'all' && e.type !== heatmapFilter) return false;
      return true;
    });
  });

  // ==================== PASSING NETWORK LOGIC ====================
  interface PlayerNode {
    id: number;
    no: number;
    name: string;
    role: string;
    x: number;
    y: number;
    touches: number;
  }

  let nodes = $derived<PlayerNode[]>(() => {
    const onPitch = matchStore.onPitchPlayers;
    const activeSquad = players.filter(p => onPitch.includes(p.no));
    const displayPlayers = (activeSquad.length >= 4 ? activeSquad : players.slice(0, 5)).slice(0, 5);

    let gkPlayer = displayPlayers.find(p => p.isGk === 1);
    let outfieldPlayers = displayPlayers.filter(p => p !== gkPlayer);

    if (!gkPlayer && displayPlayers.length > 0) {
      gkPlayer = displayPlayers[0];
      outfieldPlayers = displayPlayers.slice(1);
    }

    const tacticalRoles = [
      { role: 'ANC', x: 280, y: 240 },
      { role: 'FL-L', x: 440, y: 110 },
      { role: 'FL-R', x: 440, y: 370 },
      { role: 'PIV', x: 620, y: 240 }
    ];

    const result: PlayerNode[] = [];

    if (gkPlayer) {
      const touches = (gkPlayer.rec1 || 0) + (gkPlayer.rec2 || 0) + (gkPlayer.sh1 || 0) + (gkPlayer.sh2 || 0) + (gkPlayer.loss1 || 0) + (gkPlayer.loss2 || 0);
      result.push({
        id: gkPlayer.id,
        no: gkPlayer.no,
        name: gkPlayer.name,
        role: 'GK',
        x: 95,
        y: 240,
        touches: Math.max(5, touches)
      });
    }

    outfieldPlayers.forEach((p, idx) => {
      const pos = tacticalRoles[idx] || { role: `FP-${idx + 1}`, x: 320 + idx * 50, y: 160 + (idx % 2 === 0 ? -60 : 60) };
      const touches = (p.rec1 || 0) + (p.rec2 || 0) + (p.sh1 || 0) + (p.sh2 || 0) + (p.loss1 || 0) + (p.loss2 || 0);
      result.push({
        id: p.id,
        no: p.no,
        name: p.name,
        role: pos.role,
        x: pos.x,
        y: pos.y,
        touches: Math.max(5, touches)
      });
    });

    return result;
  });

  let links = $derived(() => {
    const nodeList = nodes;
    const linkList: Array<{ source: PlayerNode; target: PlayerNode; weight: number }> = [];

    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const p1 = nodeList[i];
        const p2 = nodeList[j];
        const weight = Math.min(8, Math.max(1, Math.round((p1.touches + p2.touches) / 6)));
        linkList.push({ source: p1, target: p2, weight });
      }
    }
    return linkList;
  });

  // ==================== TRUE THERMAL HEATMAP ENGINE ====================
  function getThermalPalette(): Uint8ClampedArray {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 256;
    pCanvas.height = 1;
    const pCtx = pCanvas.getContext('2d', { willReadFrequently: true });
    if (!pCtx) return new Uint8ClampedArray(1024);

    const grad = pCtx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0.0, 'rgba(0, 0, 255, 0)');
    grad.addColorStop(0.18, 'rgba(0, 110, 255, 0.45)');
    grad.addColorStop(0.38, 'rgba(0, 230, 255, 0.75)');
    grad.addColorStop(0.58, 'rgba(0, 255, 80, 0.88)');
    grad.addColorStop(0.76, 'rgba(255, 235, 0, 0.95)');
    grad.addColorStop(0.90, 'rgba(255, 95, 0, 1.0)');
    grad.addColorStop(1.0, 'rgba(235, 0, 0, 1.0)');

    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 256, 1);
    return pCtx.getImageData(0, 0, 256, 1).data;
  }

  function renderThermalHeatmap() {
    if (!heatmapCanvasRef) return;
    const canvas = heatmapCanvasRef;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = 800;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const evts = heatmapEvents;
    if (evts.length === 0) return;

    // Step 1: Draw alpha grayscale blurs on an offscreen canvas
    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = width;
    alphaCanvas.height = height;
    const aCtx = alphaCanvas.getContext('2d', { willReadFrequently: true });
    if (!aCtx) return;

    const radius = 50;

    evts.forEach((ev) => {
      // Scale x, y to 800 x 480
      const x = Math.max(10, Math.min(width - 10, ev.x));
      const y = Math.max(10, Math.min(height - 10, ev.y));

      const radial = aCtx.createRadialGradient(x, y, 0, x, y, radius);
      const intensity = ev.type === 'shot' ? (ev.outcome === 'goal' ? 0.65 : 0.5) : 0.4;
      radial.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');

      aCtx.fillStyle = radial;
      aCtx.beginPath();
      aCtx.arc(x, y, radius, 0, Math.PI * 2);
      aCtx.fill();
    });

    // Step 2: Colorize alpha pixels using the thermal palette lookup
    const imgData = aCtx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const palette = getThermalPalette();

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        const pIdx = alpha * 4;
        data[i] = palette[pIdx];         // R
        data[i + 1] = palette[pIdx + 1]; // G
        data[i + 2] = palette[pIdx + 2]; // B
        data[i + 3] = Math.min(255, Math.round(alpha * 1.5)); // Boosted opacity for clarity
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // Reactive effect to render heatmap when data or mode changes
  $effect(() => {
    if (activeTabMode === 'heatmap') {
      // Small tick timeout to ensure canvas is attached to DOM
      setTimeout(() => {
        renderThermalHeatmap();
      }, 30);
    }
  });

  function handlePitchClick(e: MouseEvent) {
    if (activeTabMode !== 'pins') return; // Only allow logging in Pins mode
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
  <!-- Top Unified Mode Selector & Header -->
  <div class="pitch-header-box">
    <div class="header-main-title">
      <div class="title-with-icon">
        <Activity size={22} class="text-cyan" />
        <div>
          <h2 class="section-title">Papan Taktik, Heatmap & Passing Network</h2>
          <span class="pitch-tip">
            {#if activeTabMode === 'pins'}
              Mode Plotting: Klik / Ketuk lapangan untuk mencatat aksi tembakan, recovery, & turnover
            {:else if activeTabMode === 'heatmap'}
              Mode Heatmap: Gradasi termal densitas sebaran aksi pemain di lapangan secara presisi
            {:else}
              Mode Passing Network: Visualisasi distribusi dan keterhubungan operan 5-Man Unit aktif
            {/if}
          </span>
        </div>
      </div>

      <!-- Mode Selector Segmented Tabs -->
      <div class="segmented-mode-bar">
        <button 
          type="button" 
          class="seg-btn {activeTabMode === 'pins' ? 'active-seg' : ''}" 
          onclick={() => (activeTabMode = 'pins')}
          title="Mode Plotting Titik Kejadian">
          <MapPin size={14} />
          <span>Titik Kejadian</span>
        </button>

        <button 
          type="button" 
          class="seg-btn {activeTabMode === 'heatmap' ? 'active-seg active-heat' : ''}" 
          onclick={() => (activeTabMode = 'heatmap')}
          title="Mode Heatmap Termal Nyata">
          <Flame size={14} />
          <span>Thermal Heatmap</span>
        </button>

        <button 
          type="button" 
          class="seg-btn {activeTabMode === 'passing' ? 'active-seg active-pass' : ''}" 
          onclick={() => (activeTabMode = 'passing')}
          title="Mode Passing Matrix 5-Man">
          <Users size={14} />
          <span>Passing Matrix</span>
        </button>
      </div>
    </div>

    <!-- Filters & Actions Bar -->
    <div class="pitch-filters-bar">
      <!-- Half Filter -->
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

      <!-- Dynamic Sub-Filter depending on Mode -->
      {#if activeTabMode === 'pins'}
        <div class="filter-group">
          <span class="filter-label">Filter Aksi:</span>
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
      {:else if activeTabMode === 'heatmap'}
        <div class="filter-group">
          <span class="filter-label">Kategori Heatmap:</span>
          <button 
            class="pill-btn {heatmapFilter === 'all' ? 'active' : ''}" 
            onclick={() => (heatmapFilter = 'all')}>Semua Kejadian</button>
          <button 
            class="pill-btn {heatmapFilter === 'shot' ? 'active' : ''}" 
            onclick={() => (heatmapFilter = 'shot')}>Tembakan & Gol</button>
          <button 
            class="pill-btn {heatmapFilter === 'recovery' ? 'active' : ''}" 
            onclick={() => (heatmapFilter = 'recovery')}>Recovery</button>
          <button 
            class="pill-btn {heatmapFilter === 'turnover' ? 'active' : ''}" 
            onclick={() => (heatmapFilter = 'turnover')}>Turnover</button>
        </div>
      {/if}

      <button type="button" class="btn-print-pitch ml-auto" onclick={handlePrint} title="Cetak atau Simpan Tampilan Taktik & Shot Map ke PDF">
        <Printer size={14} />
        <span>Cetak PDF</span>
      </button>
    </div>
  </div>

  <!-- Interactive Pitch Container -->
  <div class="pitch-wrapper">
    <!-- Futsal Field Container (800 x 480 Aspect Ratio) -->
    <div 
      class="futsal-court {activeTabMode === 'pins' ? 'court-clickable' : ''}" 
      bind:this={pitchRef} 
      onclick={handlePitchClick} 
      role="button" 
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && activeTabMode === 'pins' && (showModal = true)}>
      
      <!-- Real Futsal Court Background Image -->
      <img src="/lapangan.png" alt="Lapangan Futsal" class="court-bg-img" />

      <!-- ==================== MODE 1: PINS (TITIK KEJADIAN) ==================== -->
      {#if activeTabMode === 'pins'}
        {#each filteredEvents as evt, evtIdx (evt.id ? `evt_${evt.id}` : `evt_idx_${evtIdx}`)}
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

      <!-- ==================== MODE 2: TRUE THERMAL HEATMAP ==================== -->
      {:else if activeTabMode === 'heatmap'}
        <canvas bind:this={heatmapCanvasRef} class="thermal-heatmap-canvas"></canvas>
        {#if heatmapEvents.length === 0}
          <div class="empty-heatmap-notice">
            <span>Belum ada data kejadian untuk kategori heatmap ini.</span>
          </div>
        {/if}

      <!-- ==================== MODE 3: PASSING MATRIX 5-MAN ==================== -->
      {:else if activeTabMode === 'passing'}
        <svg viewBox="0 0 800 480" class="tactical-passing-svg">
          <!-- Passing Interconnection Lines -->
          {#each links as link}
            <line 
              x1={link.source.x} 
              y1={link.source.y} 
              x2={link.target.x} 
              y2={link.target.y} 
              stroke="#00e5ff" 
              stroke-width={link.weight} 
              stroke-opacity={0.35 + (link.weight * 0.08)} 
              stroke-dasharray={link.weight < 2 ? "4 4" : "none"}
            />
          {/each}

          <!-- Player Positional Nodes -->
          {#each nodes as node}
            <g class="player-node-group" transform="translate({node.x}, {node.y})">
              <circle class="node-glow" cx="0" cy="0" r={20 + (node.touches * 0.35)} fill="rgba(0, 229, 255, 0.15)" stroke="#00e5ff" stroke-width="2" />
              <circle class="node-core" cx="0" cy="0" r="16" fill="#040914" stroke="#ffffff" stroke-width="2" />
              <text class="node-num" x="0" y="5" font-size="11" font-weight="900" fill="#00e5ff" text-anchor="middle">#{node.no}</text>
              <rect class="node-badge-rect" x="-42" y="22" width="84" height="17" rx="4" fill="rgba(4, 9, 20, 0.9)" stroke="rgba(255,255,255,0.25)" />
              <text class="node-badge-text" x="0" y="34" font-size="8.5" font-weight="700" fill="#ffffff" text-anchor="middle">{node.role} • {node.name.split(' ')[0]}</text>
            </g>
          {/each}
        </svg>
      {/if}
    </div>
  </div>

  <!-- Legend Bar -->
  <div class="pitch-legend">
    {#if activeTabMode === 'pins'}
      <div class="legend-item"><span class="leg-dot" style="background: #10b981;"></span> <span>Goal</span></div>
      <div class="legend-item"><span class="leg-dot" style="background: #3b82f6;"></span> <span>On Target</span></div>
      <div class="legend-item"><span class="leg-dot" style="background: #ef4444;"></span> <span>Off Target</span></div>
      <div class="legend-item"><span class="leg-dot" style="background: #f59e0b;"></span> <span>Blocked</span></div>
      <div class="legend-item"><span class="leg-dot" style="background: #06b6d4;"></span> <span>Recovery</span></div>
      <div class="legend-item"><span class="leg-dot" style="background: #f43f5e;"></span> <span>Turnover</span></div>
    {:else if activeTabMode === 'heatmap'}
      <div class="thermal-legend-group">
        <span class="therm-lbl">Densitas Rendah (Dingin)</span>
        <div class="thermal-color-bar"></div>
        <span class="therm-lbl font-bold text-rose-400">Densitas Tinggi (Hotspot Panas)</span>
      </div>
    {:else}
      <div class="legend-item"><span class="leg-line thick"></span> <span>Frekuensi Distribusi Tinggi</span></div>
      <div class="legend-item"><span class="leg-line dash"></span> <span>Alur Distribusi Sekunder</span></div>
      <div class="legend-item"><span class="leg-dot cyan"></span> <span>Posisi Unit 5-Man Lapangan</span></div>
    {/if}
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

  .pitch-header-box {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-bottom: 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.85rem 1rem;
  }

  .header-main-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .title-with-icon {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .pitch-tip {
    font-size: 0.74rem;
    color: #94a3b8;
    margin-top: 2px;
    display: block;
  }

  /* Segmented Mode Switcher */
  .segmented-mode-bar {
    display: flex;
    background: #091220;
    padding: 3px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    gap: 2px;
  }

  .seg-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #94a3b8;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .seg-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.06);
  }

  .seg-btn.active-seg {
    background: #0284c7;
    color: #ffffff;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
  }

  .seg-btn.active-heat {
    background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
    box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4);
  }

  .seg-btn.active-pass {
    background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
    box-shadow: 0 2px 10px rgba(6, 182, 212, 0.4);
  }

  .pitch-filters-bar {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 0.7rem;
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
    padding: 3px 10px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.15s;
  }

  .pill-btn:hover {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.25);
  }

  .pill-btn.active {
    background: #0284c7;
    color: #ffffff;
    border-color: #38bdf8;
    font-weight: 700;
  }

  /* PITCH CANVAS CONTAINER */
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
    user-select: none;
    border-radius: 8px;
    overflow: hidden;
    touch-action: manipulation;
  }

  .court-clickable {
    cursor: crosshair;
  }

  .court-bg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    border-radius: 8px;
    user-select: none;
    pointer-events: none;
  }

  /* THERMAL HEATMAP CANVAS OVERLAY */
  .thermal-heatmap-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    mix-blend-mode: hard-light;
    opacity: 0.88;
    z-index: 5;
  }

  .empty-heatmap-notice {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(4, 9, 20, 0.6);
    color: #94a3b8;
    font-size: 0.85rem;
    font-weight: 600;
    z-index: 6;
  }

  /* PASSING NETWORK SVG OVERLAY */
  .tactical-passing-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 8;
  }

  .player-node-group {
    cursor: pointer;
  }

  .player-node-group .node-glow,
  .player-node-group .node-core,
  .player-node-group .node-badge-rect {
    transition: all 0.2s ease-out;
  }

  .player-node-group:hover .node-glow {
    fill: rgba(0, 229, 255, 0.35);
    stroke: #38bdf8;
    stroke-width: 3;
    filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.8));
  }

  .player-node-group:hover .node-core {
    fill: #0c1e3d;
    stroke: #38bdf8;
  }

  .player-node-group:hover .node-badge-rect {
    stroke: #00e5ff;
    fill: rgba(8, 18, 38, 0.95);
  }

  /* PINS MARKER STYLES */
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

  /* LEGENDS */
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

  .leg-dot.cyan { background: #00e5ff; }

  .leg-line {
    width: 20px;
    height: 3px;
    background: #00e5ff;
    display: inline-block;
  }
  .leg-line.thick { height: 5px; }
  .leg-line.dash { border-top: 2px dashed #00e5ff; background: transparent; }

  /* Thermal Legend Bar */
  .thermal-legend-group {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.75rem;
    color: #cbd5e1;
  }

  .thermal-color-bar {
    width: 180px;
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(to right, #0000ff 0%, #00e5ff 30%, #00ff66 55%, #ffff00 75%, #ff6600 90%, #ff0000 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  }

  .therm-lbl {
    font-size: 0.72rem;
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

  .ml-auto {
    margin-left: auto;
  }

  /* Print Styles */
  @media print {
    .pitch-section {
      background: #ffffff !important;
      color: #000000 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    .segmented-mode-bar,
    .pitch-filters-bar,
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
