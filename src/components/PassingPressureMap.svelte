<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { 
    Activity, 
    Layers, 
    Share2, 
    Users, 
    Target, 
    ShieldAlert, 
    Zap,
    Flame,
    Eye
  } from 'lucide-svelte';

  let match = $derived(matchStore.data?.match);
  let events = $derived(matchStore.data?.events || []);
  let players = $derived(matchStore.data?.players || []);

  let viewMode = $state<'passing' | 'pressure' | 'shots'>('passing');

  // Standard Futsal 5-Man Positional Node Coordinates on Pitch (1000 x 600)
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
    // Ambil 5 pemain on pitch atau top 5 pemain aktif
    const onPitch = matchStore.onPitchPlayers;
    const activeSquad = players.filter(p => onPitch.includes(p.no));

    // Fallback jika belum pilih paket: ambil 5 pemain pertama
    const displayPlayers = (activeSquad.length >= 4 ? activeSquad : players.slice(0, 5)).slice(0, 5);

    // Pisahkan GK dan Pemain Lapangan (Outfield) secara cerdas
    let gkPlayer = displayPlayers.find(p => p.isGk === 1);
    let outfieldPlayers = displayPlayers.filter(p => p !== gkPlayer);

    // Jika tidak ada yang ditandai GK, jadikan pemain pertama sebagai penjaga gawang
    if (!gkPlayer && displayPlayers.length > 0) {
      gkPlayer = displayPlayers[0];
      outfieldPlayers = displayPlayers.slice(1);
    }

    const tacticalRoles = [
      { role: 'ANC', x: 340, y: 300 },
      { role: 'FL-L', x: 520, y: 140 },
      { role: 'FL-R', x: 520, y: 460 },
      { role: 'PIV', x: 740, y: 300 }
    ];

    const result: PlayerNode[] = [];

    // 1. Tempatkan Kiper di Gawang
    if (gkPlayer) {
      const touches = (gkPlayer.rec1 || 0) + (gkPlayer.rec2 || 0) + (gkPlayer.sh1 || 0) + (gkPlayer.sh2 || 0) + (gkPlayer.loss1 || 0) + (gkPlayer.loss2 || 0);
      result.push({
        id: gkPlayer.id,
        no: gkPlayer.no,
        name: gkPlayer.name,
        role: 'GK',
        x: 120,
        y: 300,
        touches: Math.max(5, touches)
      });
    }

    // 2. Tempatkan 4 Pemain Lapangan sesuai formasi Anchor - Flank - Pivot
    outfieldPlayers.forEach((p, idx) => {
      const pos = tacticalRoles[idx] || { role: `FP-${idx + 1}`, x: 400 + idx * 60, y: 200 + (idx % 2 === 0 ? -100 : 100) };
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

  // Calculate synthetic passing links based on proximity & tactical connections
  let links = $derived(() => {
    const nodeList = nodes();
    const linkList: Array<{ source: PlayerNode; target: PlayerNode; weight: number }> = [];

    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const p1 = nodeList[i];
        const p2 = nodeList[j];
        // Weight based on mutual touches
        const weight = Math.min(8, Math.max(1, Math.round((p1.touches + p2.touches) / 6)));
        linkList.push({ source: p1, target: p2, weight });
      }
    }
    return linkList;
  });

  // Zone Pressure Statistics for Pitch Overlays
  let zoneData = $derived(() => {
    const list = events;
    let defLoss = 0, defRec = 0;
    let midLoss = 0, midRec = 0;
    let attLoss = 0, attRec = 0;

    list.forEach(e => {
      if (e.x < 333) {
        if (e.type === 'loss') defLoss++;
        if (e.type === 'recover') defRec++;
      } else if (e.x > 666) {
        if (e.type === 'loss') attLoss++;
        if (e.type === 'recover') attRec++;
      } else {
        if (e.type === 'loss') midLoss++;
        if (e.type === 'recover') midRec++;
      }
    });

    return {
      def: { loss: defLoss, rec: defRec, control: defRec >= defLoss ? 'DOMINAN' : 'RENTAN' },
      mid: { loss: midLoss, rec: midRec, control: midRec >= midLoss ? 'STABIL' : 'KETAT' },
      att: { loss: attLoss, rec: attRec, control: attRec >= attLoss ? 'EFEKTIF' : 'NORMAL' }
    };
  });
</script>

<div class="passing-network-wrapper">
  <!-- Top Control Bar -->
  <div class="network-top-bar">
    <div class="bar-title-group">
      <Activity size={20} class="text-cyan" />
      <div>
        <h3>Passing Network & Tactical Pressure Heatmap</h3>
        <p>Visualisasi matriks interaksi operan 5-man dan pemetaan zona tekanan taktik</p>
      </div>
    </div>

    <!-- Mode Selector Tabs -->
    <div class="mode-tabs-group">
      <button 
        class="mode-btn" 
        class:active={viewMode === 'passing'} 
        onclick={() => (viewMode = 'passing')}>
        <Users size={14} /> Passing Matrix 5-Man
      </button>
      <button 
        class="mode-btn" 
        class:active={viewMode === 'pressure'} 
        onclick={() => (viewMode = 'pressure')}>
        <Layers size={14} /> Zone Pressure Heatmap
      </button>
      <button 
        class="mode-btn" 
        class:active={viewMode === 'shots'} 
        onclick={() => (viewMode = 'shots')}>
        <Target size={14} /> Shot & Threat Density
      </button>
    </div>
  </div>

  <!-- SVG Pitch Diagram Canvas -->
  <div class="pitch-canvas-box">
    <svg viewBox="0 0 1000 600" class="tactical-svg-pitch">
      <!-- Pitch Background -->
      <rect x="0" y="0" width="1000" height="600" fill="#0d3b66" rx="8" />
      
      <!-- Grass Pattern Stripes -->
      {#each Array(10) as _, i}
        <rect x={i * 100} y="0" width="50" height="600" fill="rgba(255,255,255,0.02)" />
      {/each}

      <!-- Pitch Boundary Lines -->
      <rect x="30" y="30" width="940" height="540" fill="none" stroke="#ffffff" stroke-width="3" />
      <line x1="500" y1="30" x2="500" y2="570" stroke="#ffffff" stroke-width="3" />
      <circle cx="500" cy="300" r="75" fill="none" stroke="#ffffff" stroke-width="3" />
      <circle cx="500" cy="300" r="4" fill="#ffffff" />

      <!-- Goal Areas -->
      <!-- Left D-Area -->
      <path d="M 30,150 L 90,150 A 150,150 0 0,1 90,450 L 30,450 Z" fill="none" stroke="#ffffff" stroke-width="3" />
      <circle cx="180" cy="300" r="3" fill="#ffffff" />

      <!-- Right D-Area -->
      <path d="M 970,150 L 910,150 A 150,150 0 0,0 910,450 L 970,450 Z" fill="none" stroke="#ffffff" stroke-width="3" />
      <circle cx="820" cy="300" r="3" fill="#ffffff" />

      <!-- Goals -->
      <rect x="5" y="240" width="25" height="120" fill="none" stroke="#ffffff" stroke-width="3" />
      <rect x="970" y="240" width="25" height="120" fill="none" stroke="#ffffff" stroke-width="3" />

      <!-- VIEW MODE 1: PASSING NETWORK MATRIX -->
      {#if viewMode === 'passing'}
        <!-- Passing Lines -->
        {#each links() as link}
          <line 
            x1={link.source.x} 
            y1={link.source.y} 
            x2={link.target.x} 
            y2={link.target.y} 
            stroke="#00e5ff" 
            stroke-width={link.weight} 
            stroke-opacity={0.3 + (link.weight * 0.08)} 
            stroke-dasharray={link.weight < 2 ? "4 4" : "none"}
          />
        {/each}

        <!-- Player Nodes -->
        {#each nodes() as node}
          <g class="player-node-group" transform="translate({node.x}, {node.y})">
            <!-- Node Outer Glow -->
            <circle class="node-glow" cx="0" cy="0" r={22 + (node.touches * 0.4)} fill="rgba(0, 229, 255, 0.15)" stroke="#00e5ff" stroke-width="2" />
            <!-- Node Core -->
            <circle class="node-core" cx="0" cy="0" r="18" fill="#040914" stroke="#ffffff" stroke-width="2" />
            <!-- Jersey Number -->
            <text class="node-num" x="0" y="5" font-size="12" font-weight="900" fill="#00e5ff" text-anchor="middle">#{node.no}</text>
            <!-- Player Name & Role Label -->
            <rect class="node-badge-rect" x="-45" y="24" width="90" height="18" rx="4" fill="rgba(4, 9, 20, 0.85)" stroke="rgba(255,255,255,0.2)" />
            <text class="node-badge-text" x="0" y="36" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">{node.role} • {node.name.split(' ')[0]}</text>
          </g>
        {/each}

      <!-- VIEW MODE 2: ZONE PRESSURE HEATMAP -->
      {:else if viewMode === 'pressure'}
        <!-- 3 Thirds Overlay Bands -->
        <!-- Defensive 3rd -->
        <rect x="30" y="30" width="313" height="540" fill="rgba(239, 68, 68, 0.12)" stroke="rgba(239, 68, 68, 0.4)" stroke-dasharray="6 6" />
        <text x="186" y="70" font-size="14" font-weight="800" fill="#f87171" text-anchor="middle">DEFENSIVE 3RD (LOW BLOCK)</text>
        <text x="186" y="90" font-size="11" fill="#fca5a5" text-anchor="middle">Loss: {zoneData().def.loss} | Rec: {zoneData().def.rec} ({zoneData().def.control})</text>

        <!-- Middle 3rd -->
        <rect x="343" y="30" width="313" height="540" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(245, 158, 11, 0.4)" stroke-dasharray="6 6" />
        <text x="500" y="70" font-size="14" font-weight="800" fill="#fbbf24" text-anchor="middle">MIDDLE 3RD (MID BLOCK)</text>
        <text x="500" y="90" font-size="11" fill="#fde68a" text-anchor="middle">Loss: {zoneData().mid.loss} | Rec: {zoneData().mid.rec} ({zoneData().mid.control})</text>

        <!-- Attacking 3rd -->
        <rect x="656" y="30" width="314" height="540" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(16, 185, 129, 0.4)" stroke-dasharray="6 6" />
        <text x="813" y="70" font-size="14" font-weight="800" fill="#34d399" text-anchor="middle">ATTACKING 3RD (HIGH PRESS)</text>
        <text x="813" y="90" font-size="11" fill="#a7f3d0" text-anchor="middle">Loss: {zoneData().att.loss} | Rec: {zoneData().att.rec} ({zoneData().att.control})</text>

        <!-- Event Plot Dots -->
        {#each events as ev}
          <circle 
            cx={ev.x} 
            cy={ev.y} 
            r={ev.type === 'shot' ? 7 : 5} 
            fill={ev.type === 'shot' ? '#38bdf8' : ev.type === 'loss' ? '#ef4444' : '#10b981'} 
            opacity="0.8" 
          />
        {/each}

      <!-- VIEW MODE 3: SHOTS & THREAT -->
      {:else}
        {#each events.filter(e => e.type === 'shot') as ev}
          <g transform="translate({ev.x}, {ev.y})">
            <circle cx="0" cy="0" r={ev.outcome === 'goal' ? 14 : 9} fill={ev.outcome === 'goal' ? '#10b981' : '#38bdf8'} opacity="0.8" stroke="#ffffff" stroke-width="2" />
            {#if ev.outcome === 'goal'}
              <text x="0" y="4" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">GOL</text>
            {/if}
          </g>
        {/each}
      {/if}
    </svg>
  </div>

  <!-- Bottom Legend & Tactical Insight -->
  <div class="network-legend-bar">
    <div class="legend-items">
      {#if viewMode === 'passing'}
        <div class="leg-item"><span class="leg-line thick"></span> <strong>Tebal:</strong> Frekuensi Umpan Tinggi</div>
        <div class="leg-item"><span class="leg-line dash"></span> <strong>Garis Putus:</strong> Distribusi Sekunder</div>
        <div class="leg-item"><span class="leg-dot cyan"></span> Node 5-Man Posisi Futsal</div>
      {:else if viewMode === 'pressure'}
        <div class="leg-item"><span class="leg-dot red"></span> Loss Ball (Turnover)</div>
        <div class="leg-item"><span class="leg-dot green"></span> Recovery Ball</div>
        <div class="leg-item"><span class="leg-dot blue"></span> Shot / Threat</div>
      {:else}
        <div class="leg-item"><span class="leg-dot green"></span> Gol Berhasil</div>
        <div class="leg-item"><span class="leg-dot blue"></span> Tembakan (Saved / Off-target)</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .passing-network-wrapper {
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: #080f1d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 16px;
  }

  .network-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.06);
    padding: 10px 16px;
    border-radius: 10px;
  }

  .bar-title-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bar-title-group h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #ffffff;
  }

  .bar-title-group p {
    margin: 2px 0 0 0;
    font-size: 0.76rem;
    color: #94a3b8;
  }

  .mode-tabs-group {
    display: flex;
    gap: 6px;
  }

  .mode-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-btn.active {
    background: #00e5ff;
    color: #040914;
    border-color: #00e5ff;
    font-weight: 700;
  }

  /* PITCH CANVAS */
  .pitch-canvas-box {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    background: #040914;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tactical-svg-pitch {
    width: 100%;
    height: auto;
    display: block;
  }

  .player-node-group {
    cursor: pointer;
  }

  .player-node-group .node-glow {
    transition: all 0.2s ease-out;
  }

  .player-node-group .node-core {
    transition: all 0.2s ease-out;
  }

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

  /* LEGEND */
  .network-legend-bar {
    background: rgba(13, 21, 39, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 8px 16px;
  }

  .legend-items {
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: #cbd5e1;
  }

  .leg-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .leg-line {
    width: 20px;
    height: 3px;
    background: #00e5ff;
    display: inline-block;
  }

  .leg-line.thick { height: 5px; }
  .leg-line.dash { border-top: 2px dashed #00e5ff; background: transparent; }

  .leg-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }

  .leg-dot.cyan { background: #00e5ff; }
  .leg-dot.red { background: #ef4444; }
  .leg-dot.green { background: #10b981; }
  .leg-dot.blue { background: #38bdf8; }

  .text-cyan { color: #00e5ff; }
</style>
