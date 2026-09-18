<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { 
    Play, 
    Pause, 
    RotateCcw, 
    Flame, 
    ShieldAlert, 
    Zap, 
    Flag, 
    Clock, 
    Users, 
    Check, 
    AlertTriangle,
    Volume2,
    Plus,
    Minus
  } from 'lucide-svelte';

  let match = $derived(matchStore.data?.match);
  let pakets = $derived(matchStore.data?.pakets || []);
  let players = $derived(matchStore.data?.players || []);

  let homeGoals = $derived((match?.homeScore1st || 0) + (match?.homeScore2nd || 0));
  let awayGoals = $derived((match?.awayScore1st || 0) + (match?.awayScore2nd || 0));

  let flashActionMessage = $state<string>('');
  let flashTimer: any = null;

  function showFlash(msg: string) {
    flashActionMessage = msg;
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      flashActionMessage = '';
    }, 1800);
  }

  function handleDeployPaket(paketIndex: number) {
    matchStore.deployPaket(paketIndex);
    const pkt = pakets.find(p => p.paketIndex === paketIndex);
    showFlash(`🔄 ROTASI: ${pkt?.code || `Paket ${paketIndex + 1}`} MASUK LAPANGAN!`);
  }

  function handleQuickGoal(team: 'home' | 'away') {
    if (team === 'home') {
      matchStore.incrementScore('home');
      showFlash('⚽ GOOOL UNTUK KITA! (+1)');
    } else {
      matchStore.incrementScore('away');
      showFlash('⚠️ GOL LAWAN! (+1)');
    }
  }

  function handleQuickFoul(team: 'home' | 'away') {
    if (team === 'home') {
      matchStore.incrementFoul('home');
      showFlash('🚩 FOUL TERCATAT (KITA)');
    } else {
      matchStore.incrementFoul('away');
      showFlash('🚩 FOUL LAWAN TERCATAT');
    }
  }

  function handleQuickTurnover(type: 'loss' | 'recover') {
    if (type === 'loss') {
      matchStore.recordFastTag('loss', 500, 300);
      showFlash('⚠️ LOSS BALL DICATAT');
    } else {
      matchStore.recordFastTag('recover', 500, 300);
      showFlash('🛡️ RECOVERY BOLA BERHASIL (+1)');
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
</script>

<div class="bench-touch-container">
  <!-- Flash Alert Banner for Bench Verification -->
  {#if flashActionMessage}
    <div class="bench-flash-toast">
      <Zap size={20} class="text-amber" />
      <span>{flashActionMessage}</span>
    </div>
  {/if}

  <!-- Top Jumbo Scoreboard & Timer Panel -->
  <div class="bench-top-scoreboard">
    <!-- Home Team Column -->
    <div class="bench-team-box home-box">
      <span class="bench-team-label">HOME</span>
      <h2 class="bench-team-name">{match?.homeTeam || 'HOME'}</h2>
      <div class="bench-score-number">{homeGoals}</div>
      
      <!-- Home Fast Actions -->
      <div class="bench-fast-btn-row">
        <button class="bench-btn-goal home-btn" onclick={() => handleQuickGoal('home')}>
          +1 GOL
        </button>
        <button class="bench-btn-foul" onclick={() => handleQuickFoul('home')}>
          +1 FOUL ({(match?.homeFouls1st || 0) + (match?.homeFouls2nd || 0)})
        </button>
      </div>
    </div>

    <!-- Center Giant Stop Clock -->
    <div class="bench-center-timer">
      <div class="half-pill-selector">
        <button 
          class="bench-half-btn" 
          class:active={matchStore.activeHalf === 1}
          onclick={() => matchStore.setHalf(1)}>
          BABAK 1
        </button>
        <button 
          class="bench-half-btn" 
          class:active={matchStore.activeHalf === 2}
          onclick={() => matchStore.setHalf(2)}>
          BABAK 2
        </button>
      </div>

      <div class="giant-clock-display" class:running={matchStore.timerRunning}>
        {formatTime(match?.timerRemaining || 1200)}
      </div>

      <!-- Giant Play/Pause Button -->
      <div class="timer-touch-controls">
        <button 
          class="btn-giant-play" 
          class:is-running={matchStore.timerRunning}
          onclick={() => matchStore.toggleTimer()}>
          {#if matchStore.timerRunning}
            <Pause size={28} /> STOP TIMER
          {:else}
            <Play size={28} /> START TIMER
          {/if}
        </button>

        <div class="sub-timer-adjust">
          <button class="btn-micro-adj" onclick={() => matchStore.adjustTimer(-10)}>-10s</button>
          <button class="btn-micro-adj" onclick={() => matchStore.adjustTimer(10)}>+10s</button>
          <button class="btn-micro-adj" onclick={() => matchStore.resetTimer()}>Reset</button>
        </div>
      </div>
    </div>

    <!-- Away Team Column -->
    <div class="bench-team-box away-box">
      <span class="bench-team-label">AWAY</span>
      <h2 class="bench-team-name">{match?.awayTeam || 'AWAY'}</h2>
      <div class="bench-score-number away-score">{awayGoals}</div>

      <!-- Away Fast Actions -->
      <div class="bench-fast-btn-row">
        <button class="bench-btn-goal away-btn" onclick={() => handleQuickGoal('away')}>
          +1 GOL LAWAN
        </button>
        <button class="bench-btn-foul" onclick={() => handleQuickFoul('away')}>
          +1 FOUL ({(match?.awayFouls1st || 0) + (match?.awayFouls2nd || 0)})
        </button>
      </div>
    </div>
  </div>

  <!-- Active 5 Players On Pitch Ribbon -->
  <div class="on-pitch-ribbon">
    <div class="ribbon-title">
      <Users size={16} class="text-cyan" />
      <span>5 PEMAIN AKTIF DI LAPANGAN:</span>
    </div>
    <div class="ribbon-players-list">
      {#each matchStore.onPitchPlayers as pNo}
        {@const p = players.find(pl => pl.no === pNo)}
        <div class="ribbon-player-chip" class:gk={p?.isGk}>
          <span class="p-num">#{pNo}</span>
          <span class="p-name">{p ? p.name.split(' ')[0] : 'Pemain'}</span>
          {#if p?.isGk}<span class="gk-tag">GK</span>{/if}
        </div>
      {/each}
      {#if matchStore.onPitchPlayers.length === 0}
        <span class="no-pitch-prompt">Pilih paket di bawah untuk menurunkan 5 pemain ke lapangan</span>
      {/if}
    </div>
  </div>

  <!-- Jumbo 1-Tap Paket 5-Man Rotations Section -->
  <div class="bench-pakets-section">
    <div class="section-label-bench">
      <h3>ROTASI 1-TAP (PILIH PAKET UNTUK LANGSUNG DEPLOY)</h3>
    </div>

    <div class="pakets-touch-grid">
      {#each pakets as pkt}
        {@const isCurrentActive = matchStore.activePaketIndex === pkt.paketIndex}
        {@const pNums = typeof pkt.playerNumbers === 'string' ? JSON.parse(pkt.playerNumbers) : (pkt.playerNumbers || [])}
        <button 
          class="paket-touch-card" 
          class:active-card={isCurrentActive}
          onclick={() => handleDeployPaket(pkt.paketIndex)}>
          
          <div class="card-top-info">
            <span class="paket-touch-code">{pkt.code}</span>
            {#if isCurrentActive}
              <span class="active-badge-live">
                <span class="pulse-dot"></span> DI LAPANGAN
              </span>
            {/if}
          </div>

          <div class="card-numbers-row">
            {#each pNums as pNo}
              <span class="touch-num-pill">#{pNo}</span>
            {/each}
          </div>

          <div class="deploy-action-hint">
            {#if isCurrentActive}
              <span class="text-emerald font-bold">✓ SEDANG BERMAIN</span>
            {:else}
              <span>TAP UNTUK MASUK (GANTI) ➔</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Bench Fast Pitch Tagging Actions (Loss / Recovery) -->
  <div class="bench-turnover-toolbar">
    <button class="btn-touch-loss" onclick={() => handleQuickTurnover('loss')}>
      <ShieldAlert size={24} />
      <div class="btn-text-col">
        <strong>CATAT LOSS BALL (TURNOVER)</strong>
        <span>Sentuh saat tim kita kehilangan penguasaan bola</span>
      </div>
    </button>

    <button class="btn-touch-rec" onclick={() => handleQuickTurnover('recover')}>
      <Zap size={24} />
      <div class="btn-text-col">
        <strong>CATAT BALL RECOVERY</strong>
        <span>Sentuh saat pemain berhasil memenangkan kembali bola</span>
      </div>
    </button>
  </div>
</div>

<style>
  .bench-touch-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 12px;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
  }

  .bench-flash-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #0f172a;
    border: 2px solid #00e5ff;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 999px;
    font-size: 1rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 30px rgba(0, 229, 255, 0.4);
    z-index: 10000;
    animation: bounceIn 0.3s ease-out;
  }

  /* TOP SCOREBOARD & TIMER */
  .bench-top-scoreboard {
    display: grid;
    grid-template-columns: 1fr 1.3fr 1fr;
    gap: 16px;
    background: #0a1122;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px;
  }

  @media (max-width: 850px) {
    .bench-top-scoreboard {
      grid-template-columns: 1fr;
    }
  }

  .bench-team-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(18, 28, 51, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
  }

  .bench-team-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.1em;
  }

  .bench-team-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffffff;
    margin: 4px 0 8px 0;
    text-align: center;
  }

  .bench-score-number {
    font-size: 3.8rem;
    font-weight: 900;
    color: #00e5ff;
    line-height: 1;
    margin-bottom: 14px;
  }

  .away-score {
    color: #f87171;
  }

  .bench-fast-btn-row {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .bench-btn-goal {
    flex: 1;
    background: #10b981;
    color: #040914;
    border: none;
    border-radius: 8px;
    padding: 12px 8px;
    font-size: 0.95rem;
    font-weight: 900;
    cursor: pointer;
    transition: transform 0.1s;
  }

  .bench-btn-goal:active {
    transform: scale(0.96);
  }

  .away-btn {
    background: #ef4444;
    color: #ffffff;
  }

  .bench-btn-foul {
    flex: 1;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fbbf24;
    border-radius: 8px;
    padding: 12px 8px;
    font-size: 0.8rem;
    font-weight: 800;
    cursor: pointer;
  }

  /* GIANT TIMER */
  .bench-center-timer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(4, 9, 20, 0.8);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
  }

  .half-pill-selector {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }

  .bench-half-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 800;
    cursor: pointer;
  }

  .bench-half-btn.active {
    background: #00e5ff;
    color: #040914;
    border-color: #00e5ff;
  }

  .giant-clock-display {
    font-size: 4.2rem;
    font-weight: 900;
    color: #ffffff;
    font-family: monospace;
    letter-spacing: 2px;
    margin: 4px 0 12px 0;
  }

  .giant-clock-display.running {
    color: #00e5ff;
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
  }

  .timer-touch-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .btn-giant-play {
    width: 100%;
    max-width: 260px;
    background: #10b981;
    color: #040914;
    border: none;
    border-radius: 12px;
    padding: 14px 20px;
    font-size: 1.1rem;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
  }

  .btn-giant-play.is-running {
    background: #ef4444;
    color: #ffffff;
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
  }

  .sub-timer-adjust {
    display: flex;
    gap: 8px;
  }

  .btn-micro-adj {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #cbd5e1;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
  }

  /* ON PITCH RIBBON */
  .on-pitch-ribbon {
    background: rgba(0, 229, 255, 0.08);
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 12px;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .ribbon-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    font-weight: 800;
    color: #00e5ff;
    letter-spacing: 0.04em;
  }

  .ribbon-players-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .ribbon-player-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 6px 12px;
    color: #ffffff;
  }

  .ribbon-player-chip.gk {
    border-color: #facc15;
    background: rgba(250, 204, 21, 0.15);
  }

  .p-num {
    font-weight: 900;
    color: #00e5ff;
    font-size: 0.9rem;
  }

  .p-name {
    font-size: 0.82rem;
    font-weight: 700;
  }

  .gk-tag {
    background: #facc15;
    color: #040914;
    font-size: 0.65rem;
    font-weight: 900;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .no-pitch-prompt {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  /* PAKETS TOUCH GRID */
  .bench-pakets-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-label-bench h3 {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }

  .pakets-touch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .paket-touch-card {
    background: rgba(18, 28, 51, 0.7);
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
  }

  .paket-touch-card:active {
    transform: scale(0.97);
  }

  .paket-touch-card.active-card {
    border-color: #00e5ff;
    background: rgba(0, 229, 255, 0.12);
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.25);
  }

  .card-top-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .paket-touch-code {
    font-size: 0.95rem;
    font-weight: 800;
    color: #ffffff;
  }

  .active-badge-live {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    animation: pulse 1.5s infinite;
  }

  .card-numbers-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .touch-num-pill {
    background: rgba(255, 255, 255, 0.08);
    color: #f1f5f9;
    font-size: 0.78rem;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .deploy-action-hint {
    font-size: 0.72rem;
    color: #64748b;
    font-weight: 700;
  }

  /* TURNOVER TOOLBAR */
  .bench-turnover-toolbar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 6px;
  }

  @media (max-width: 640px) {
    .bench-turnover-toolbar {
      grid-template-columns: 1fr;
    }
  }

  .btn-touch-loss, .btn-touch-rec {
    display: flex;
    align-items: center;
    gap: 14px;
    border-radius: 12px;
    padding: 16px 20px;
    cursor: pointer;
    text-align: left;
    transition: transform 0.1s;
  }

  .btn-touch-loss {
    background: rgba(239, 68, 68, 0.15);
    border: 2px solid rgba(239, 68, 68, 0.4);
    color: #ef4444;
  }

  .btn-touch-rec {
    background: rgba(16, 185, 129, 0.15);
    border: 2px solid rgba(16, 185, 129, 0.4);
    color: #10b981;
  }

  .btn-touch-loss:active, .btn-touch-rec:active {
    transform: scale(0.97);
  }

  .btn-text-col {
    display: flex;
    flex-direction: column;
  }

  .btn-text-col strong {
    font-size: 0.95rem;
    font-weight: 800;
  }

  .btn-text-col span {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .text-amber { color: #f59e0b; }
  .text-cyan { color: #00e5ff; }
  .text-emerald { color: #10b981; }
</style>
