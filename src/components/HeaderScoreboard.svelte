<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { 
    Play, 
    Pause, 
    RotateCcw, 
    FileSpreadsheet, 
    BarChart3, 
    Settings, 
    Plus, 
    Minus,
    ShieldAlert
  } from 'lucide-svelte';

  let { onOpenConfig, onOpenAnalytics } = $props<{
    onOpenConfig: () => void;
    onOpenAnalytics: () => void;
  }>();

  let match = $derived(matchStore.data?.match);
  let homeTotalScore = $derived(match ? match.homeScore1st + match.homeScore2nd : 0);
  let awayTotalScore = $derived(match ? match.awayScore1st + match.awayScore2nd : 0);

  let currentHomeFouls = $derived(
    match ? (matchStore.activeHalf === 1 ? match.homeFouls1st : match.homeFouls2nd) : 0
  );
  let currentAwayFouls = $derived(
    match ? (matchStore.activeHalf === 1 ? match.awayFouls1st : match.awayFouls2nd) : 0
  );

  function exportExcel() {
    if (!match) return;
    window.open(`/api/matches/${match.id}/export`, '_blank');
  }
</script>

<header class="glass-header">
  <div class="header-content">
    <!-- Brand / Title -->
    <div class="brand-section">
      <div class="brand-badge">
        <div class="brand-logo-wrapper">
          <img src="/icon.png" alt="Futsal Analytics Logo" class="brand-app-logo" />
        </div>
        <div>
          <h1 class="brand-title">FUTSAL PRO ANALYTICS</h1>
          <div class="brand-meta">
            <span class="comp-tag">{match?.competition || 'MATCH'}</span>
            <span class="venue-tag">{match?.venue || ''}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Match Scoreboard -->
    {#if match}
      <div class="scoreboard-container">
        <!-- Home Team -->
        <div class="team-card home-card">
          <div class="team-details">
            <span class="badge home-badge">HOME</span>
            <span class="team-name">{match.homeTeam}</span>
            <div class="fouls-row">
              <span class="foul-label">Fouls (H{matchStore.activeHalf}):</span>
              <div class="foul-dots">
                {#each [1, 2, 3, 4, 5] as i}
                  <span class="f-dot {currentHomeFouls >= i ? 'active' : ''}"></span>
                {/each}
              </div>
              <div class="foul-btns">
                <button 
                  class="f-btn" 
                  onclick={() => matchStore.incrementFoul('home', matchStore.activeHalf as 1 | 2)} 
                  title="Tambah Foul Home">+</button>
                <button 
                  class="f-btn" 
                  onclick={() => matchStore.decrementFoul('home', matchStore.activeHalf as 1 | 2)} 
                  title="Kurang Foul Home">-</button>
              </div>
            </div>
          </div>
          <div class="score-display">
            <div class="main-score">{homeTotalScore}</div>
            <div class="half-breakdown">
              <span>H1: {match.homeScore1st}</span>
              <span>H2: {match.homeScore2nd}</span>
            </div>
          </div>
        </div>

        <!-- Stop-Clock & Control Center -->
        <div class="timer-center">
          <div class="timer-card">
            <div class="timer-time">{matchStore.formattedTime}</div>
            <div class="period-toggle">
              <button 
                class="period-chip {matchStore.activeHalf === 1 ? 'active' : ''}" 
                onclick={() => { matchStore.activeHalf = 1; matchStore.updateMatchMeta({ period: '1' }); }}>
                BABAK 1
              </button>
              <button 
                class="period-chip {matchStore.activeHalf === 2 ? 'active' : ''}" 
                onclick={() => { matchStore.activeHalf = 2; matchStore.updateMatchMeta({ period: '2' }); }}>
                BABAK 2
              </button>
            </div>
            <div class="timer-actions">
              <button 
                class="btn-icon btn-nudge-mini" 
                onclick={() => matchStore.adjustTimer(-10)} 
                title="Kurangi 10 Detik (-10s)">
                -10s
              </button>
              <button 
                class="btn-icon {matchStore.timerRunning ? 'btn-pause' : 'btn-play'}" 
                onclick={() => matchStore.toggleTimer()} 
                title="Start / Pause Waktu (Spasi)">
                {#if matchStore.timerRunning}
                  <Pause size={18} />
                {:else}
                  <Play size={18} />
                {/if}
              </button>
              <button 
                class="btn-icon btn-nudge-mini" 
                onclick={() => matchStore.adjustTimer(10)} 
                title="Tambah 10 Detik (+10s)">
                +10s
              </button>
              <button 
                class="btn-icon btn-reset" 
                onclick={() => matchStore.resetTimer(1200)} 
                title="Reset ke 20:00">
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>

        <!-- Away Team -->
        <div class="team-card away-card">
          <div class="score-display">
            <div class="main-score">{awayTotalScore}</div>
            <div class="half-breakdown">
              <span>H1: {match.awayScore1st}</span>
              <span>H2: {match.awayScore2nd}</span>
            </div>
          </div>
          <div class="team-details away-details">
            <span class="badge away-badge">AWAY</span>
            <span class="team-name">{match.awayTeam}</span>
            <div class="fouls-row">
              <span class="foul-label">Fouls (H{matchStore.activeHalf}):</span>
              <div class="foul-dots">
                {#each [1, 2, 3, 4, 5] as i}
                  <span class="f-dot {currentAwayFouls >= i ? 'active' : ''}"></span>
                {/each}
              </div>
              <div class="foul-btns">
                <button 
                  class="f-btn" 
                  onclick={() => matchStore.incrementFoul('away', matchStore.activeHalf as 1 | 2)} 
                  title="Tambah Foul Away">+</button>
                <button 
                  class="f-btn" 
                  onclick={() => matchStore.decrementFoul('away', matchStore.activeHalf as 1 | 2)} 
                  title="Kurang Foul Away">-</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Action Tools -->
    <div class="action-tools">
      <button class="tool-btn btn-export" onclick={exportExcel} title="Export ke Excel Template">
        <FileSpreadsheet size={16} />
        <span>Export Excel</span>
      </button>
      <button class="tool-btn btn-stats" onclick={onOpenAnalytics} title="Lihat Analisa Statistik">
        <BarChart3 size={16} />
        <span>Analisa</span>
      </button>
      <button class="tool-btn btn-settings" onclick={onOpenConfig} title="Pengaturan Pertandingan">
        <Settings size={16} />
      </button>
    </div>
  </div>
</header>

<style>
  .glass-header {
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.75rem 1.5rem;
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
  }

  .brand-section {
    display: flex;
    align-items: center;
  }

  .brand-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-logo-wrapper {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(56, 189, 248, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px;
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.25);
    overflow: hidden;
  }

  .brand-app-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
  }

  .brand-title {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    background: linear-gradient(to right, #ffffff, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .brand-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 2px;
  }

  .comp-tag {
    font-size: 0.68rem;
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  .venue-tag {
    font-size: 0.68rem;
    color: #64748b;
  }

  .scoreboard-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    justify-content: center;
  }

  .team-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    padding: 0.5rem 1rem;
    border-radius: 12px;
    min-width: 220px;
  }

  .team-details {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .away-details {
    align-items: flex-end;
  }

  .badge {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    width: fit-content;
  }

  .home-badge {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .away-badge {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .team-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #f8fafc;
    white-space: nowrap;
  }

  .fouls-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 2px;
  }

  .foul-label {
    font-size: 0.68rem;
    color: #94a3b8;
  }

  .foul-dots {
    display: flex;
    gap: 3px;
  }

  .f-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
  }

  .f-dot.active {
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
  }

  .foul-btns {
    display: flex;
    gap: 2px;
  }

  .f-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #cbd5e1;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    font-size: 0.7rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .f-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .score-display {
    text-align: center;
  }

  .main-score {
    font-size: 2rem;
    font-weight: 900;
    font-family: 'JetBrains Mono', monospace;
    color: #ffffff;
    line-height: 1;
  }

  .half-breakdown {
    font-size: 0.65rem;
    color: #64748b;
    display: flex;
    gap: 4px;
    margin-top: 2px;
  }

  .timer-center {
    display: flex;
    align-items: center;
  }

  .timer-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 0.4rem 1rem;
    border-radius: 12px;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);
  }

  .timer-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.5rem;
    font-weight: 800;
    color: #10b981;
    letter-spacing: 0.05em;
  }

  .period-toggle {
    display: flex;
    gap: 4px;
    margin: 4px 0;
  }

  .period-chip {
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.15s;
  }

  .period-chip.active {
    background: #10b981;
    color: #0f172a;
    border-color: #10b981;
  }

  .timer-actions {
    display: flex;
    gap: 6px;
  }

  .btn-icon {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.1s, opacity 0.15s;
  }

  .btn-icon:hover {
    transform: scale(1.05);
  }

  .btn-play {
    background: #10b981;
    color: #0f172a;
  }

  .btn-pause {
    background: #ef4444;
    color: #ffffff;
  }

  .btn-reset {
    background: rgba(255, 255, 255, 0.1);
    color: #94a3b8;
  }

  .btn-nudge-mini {
    background: rgba(56, 189, 248, 0.15);
    color: #7dd3fc;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.62rem;
    font-weight: 800;
    padding: 0 4px;
    width: auto;
    min-width: 26px;
    border: 1px solid rgba(56, 189, 248, 0.3);
  }

  .btn-nudge-mini:hover {
    background: #38bdf8;
    color: #0b1320;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
  }

  .action-tools {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tool-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
  }

  .btn-export {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: #ffffff;
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 2px 10px rgba(5, 150, 105, 0.3);
  }

  .btn-export:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .btn-stats {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border-color: rgba(59, 130, 246, 0.3);
  }

  .btn-stats:hover {
    background: rgba(59, 130, 246, 0.25);
  }

  .btn-settings {
    background: rgba(255, 255, 255, 0.08);
    color: #94a3b8;
    border-color: rgba(255, 255, 255, 0.1);
    padding: 0.45rem;
  }

  .btn-settings:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }
</style>
