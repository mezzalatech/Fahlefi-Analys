<script lang="ts">
  import { onMount } from 'svelte';
  import { matchStore } from './lib/store.svelte';
  import HeaderScoreboard from './components/HeaderScoreboard.svelte';
  import OfficialSheetView from './components/OfficialSheetView.svelte';
  import StatsTable from './components/StatsTable.svelte';
  import TacticalPitch from './components/TacticalPitch.svelte';
  import PaketManager from './components/PaketManager.svelte';
  import SubstitutionTimeline from './components/SubstitutionTimeline.svelte';
  import MasterPlayerDatabase from './components/MasterPlayerDatabase.svelte';
  import MatchManagerModal from './components/MatchManagerModal.svelte';
  import LoginModal from './components/LoginModal.svelte';
  import AnalyticsModal from './components/AnalyticsModal.svelte';
  import MatchConfigModal from './components/MatchConfigModal.svelte';
  import { 
    FileText, 
    Table, 
    MapPin, 
    Users, 
    ArrowRightLeft,
    Database,
    AlertCircle,
    UserCircle,
    LogOut,
    Crown,
    Trophy,
    ChevronDown
  } from 'lucide-svelte';

  let currentView = $state<'sheet' | 'matrix' | 'pitch' | 'pakets' | 'substitutions' | 'master_db'>('sheet');
  let showConfigModal = $state<boolean>(false);
  let showAnalyticsModal = $state<boolean>(false);

  onMount(() => {
    matchStore.loadMatch();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        matchStore.toggleTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  function getRoleBadge(role?: string) {
    switch (role) {
      case 'coach': return { label: 'HEAD COACH', class: 'user-badge-coach', icon: '👑' };
      case 'analyst': return { label: 'ANALYST', class: 'user-badge-analyst', icon: '📊' };
      case 'player': return { label: 'PLAYER', class: 'user-badge-player', icon: '⚽' };
      default: return { label: 'GUEST', class: 'user-badge-guest', icon: '👤' };
    }
  }

  let userRoleBadge = $derived(getRoleBadge(matchStore.currentUser?.role));
</script>

<div class="futsal-app">
  <!-- Minimalist Compact App Header Bar (Hidden in print) -->
  <header class="app-compact-header no-print">
    <div class="brand-left">
      <img src="/icon.png" alt="Futsal Analysis" class="app-brand-logo" />
      <div class="brand-text">
        <h1 class="brand-title">FAHLEFI FUTSAL ANALYTICS</h1>
        <span class="brand-subtitle">Official Sheet & Multi-Match Tactical Platform</span>
      </div>
    </div>

    <!-- Match Selector Pill -->
    <button 
      type="button" 
      class="match-selector-pill" 
      onclick={() => (matchStore.showMatchManagerModal = true)}
      title="Klik untuk memilih laga, membuat laga baru, atau melihat arsip pertandingan">
      <Trophy size={14} class="text-cyan" />
      <span class="active-match-title">
        {matchStore.data?.match.competition || 'PASER FUTSAL CUP'}: {matchStore.data?.match.homeTeam || 'Hewah Paser'} vs {matchStore.data?.match.awayTeam || 'Lawan'}
      </span>
      <ChevronDown size={13} class="chevron-icon" />
    </button>

    <!-- Central Timer & Half Controller -->
    <div class="header-timer-pill">
      <button 
        type="button" 
        class="btn-half-pill {matchStore.activeHalf === 1 ? 'half-active' : ''}" 
        onclick={() => (matchStore.activeHalf = 1)}
        title="Set Babak 1 Aktif">
        1ºH Babak 1
      </button>
      <button 
        type="button" 
        class="btn-half-pill {matchStore.activeHalf === 2 ? 'half-active' : ''}" 
        onclick={() => (matchStore.activeHalf = 2)}
        title="Set Babak 2 Aktif">
        2ºH Babak 2
      </button>
      <div class="timer-clock-display" onclick={() => matchStore.toggleTimer()} role="button" tabindex="0" title="Klik Spasi atau Tombol untuk Play/Pause">
        <span class="clock-digits">{matchStore.formattedTime}</span>
        <span class="clock-status-dot {matchStore.timerRunning ? 'dot-running' : 'dot-paused'}">●</span>
      </div>
    </div>

    <!-- Navigation Tabs Bar -->
    <nav class="compact-nav-tabs">
      <button 
        class="tab-btn {currentView === 'sheet' ? 'active' : ''}" 
        onclick={() => (currentView = 'sheet')}>
        <FileText size={14} />
        <span>Lembar Dokumen</span>
      </button>

      <button 
        class="tab-btn {currentView === 'matrix' ? 'active' : ''}" 
        onclick={() => (currentView = 'matrix')}>
        <Table size={14} />
        <span>Matrix Pemain</span>
      </button>

      <button 
        class="tab-btn {currentView === 'pitch' ? 'active' : ''}" 
        onclick={() => (currentView = 'pitch')}>
        <MapPin size={14} />
        <span>Papan Taktik</span>
      </button>

      <button 
        class="tab-btn {currentView === 'pakets' ? 'active' : ''}" 
        onclick={() => (currentView = 'pakets')}>
        <Users size={14} />
        <span>Paket 5-Man</span>
      </button>

      <button 
        class="tab-btn {currentView === 'substitutions' ? 'active' : ''}" 
        onclick={() => (currentView = 'substitutions')}>
        <ArrowRightLeft size={14} />
        <span>Rotasi & Substitusi</span>
      </button>

      <button 
        class="tab-btn {currentView === 'master_db' ? 'active' : ''}" 
        onclick={() => (currentView = 'master_db')}>
        <Database size={14} />
        <span>Database Master</span>
      </button>
    </nav>

    <!-- User Profile & RBAC Switcher -->
    <div class="user-auth-section">
      <button 
        class="user-profile-btn" 
        onclick={() => (matchStore.showLoginModal = true)}
        title="Klik untuk ganti hak akses / login">
        <span class="user-role-tag {userRoleBadge.class}">
          <span>{userRoleBadge.icon}</span>
          <span>{userRoleBadge.label}</span>
        </span>
        <span class="user-display-name">{matchStore.currentUser?.name || 'Masuk Akun'}</span>
      </button>
    </div>
  </header>

  <main class="app-main-content">
    {#if matchStore.loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Memuat Data Pertandingan Futsal...</p>
      </div>
    {:else if matchStore.error}
      <div class="error-state">
        <AlertCircle size={32} class="text-rose" />
        <p>{matchStore.error}</p>
        <button class="btn-retry" onclick={() => matchStore.loadMatch()}>Coba Lagi</button>
      </div>
    {:else}
      <!-- Tab Panels -->
      <div class="tab-content-area">
        {#if currentView === 'sheet'}
          <OfficialSheetView />
        {:else if currentView === 'matrix'}
          <StatsTable />
        {:else if currentView === 'pitch'}
          <TacticalPitch />
        {:else if currentView === 'pakets'}
          <PaketManager />
        {:else if currentView === 'substitutions'}
          <SubstitutionTimeline />
        {:else if currentView === 'master_db'}
          <MasterPlayerDatabase />
        {/if}
      </div>
    {/if}
  </main>

  <!-- Modals -->
  {#if matchStore.showMatchManagerModal}
    <MatchManagerModal onClose={() => (matchStore.showMatchManagerModal = false)} />
  {/if}

  {#if !matchStore.currentUser || matchStore.showLoginModal}
    <LoginModal onClose={() => {
      if (matchStore.currentUser) matchStore.showLoginModal = false;
    }} />
  {/if}

  {#if showAnalyticsModal}
    <AnalyticsModal onClose={() => (showAnalyticsModal = false)} />
  {/if}

  {#if showConfigModal}
    <MatchConfigModal onClose={() => (showConfigModal = false)} />
  {/if}

  <!-- Footer Info Bar (Hidden in print) -->
  <footer class="app-footer no-print">
    <div class="footer-left">
      <span class="status-indicator">
        <span class="live-pulse"></span>
        <span>Elysia API & Drizzle SQLite (Bun 1.4.2)</span>
      </span>
      <span class="shortcut-tip">Pintasan: <code>Spasi</code> (Start/Pause Timer)</span>
    </div>
    <div class="footer-right">
      <span>Auto-Saved to SQLite • Futsal Match Analytics Pro</span>
    </div>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #080e18;
    color: #f1f5f9;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  :global(*), :global(*::before), :global(*::after) {
    box-sizing: border-box;
  }

  .futsal-app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: radial-gradient(ellipse at 50% 0%, #15253e 0%, #0c1524 50%, #060a12 100%);
  }

  /* Compact Header Bar */
  .app-compact-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(0.6rem + var(--sat, 0px)) 1.25rem 0.6rem 1.25rem;
    background: rgba(12, 21, 36, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(156, 179, 204, 0.18);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
    position: sticky;
    top: 0;
    z-index: 100;
    flex-wrap: wrap;
    gap: 10px;
  }

  .brand-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .app-brand-logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
    border-radius: 8px;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 40%, #7dd3fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .brand-subtitle {
    font-size: 0.68rem;
    color: #9cb3cc;
    font-weight: 500;
  }

  /* Match Selector Pill */
  .match-selector-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(18, 32, 54, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.35);
    padding: 6px 14px;
    min-height: 36px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .match-selector-pill:hover, .match-selector-pill:active {
    background: rgba(24, 44, 74, 0.95);
    border-color: #38bdf8;
    box-shadow: 0 0 14px rgba(56, 189, 248, 0.4);
    transform: translateY(-1px);
  }

  .active-match-title {
    font-size: 0.78rem;
    font-weight: 800;
    color: #ffffff;
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
  }

  :global(.chevron-icon) {
    color: #9cb3cc;
    transition: transform 0.15s;
  }

  .match-selector-pill:hover :global(.chevron-icon) {
    color: #ffffff;
    transform: translateY(1px);
  }

  .header-timer-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(8, 14, 24, 0.75);
    border: 1px solid rgba(156, 179, 204, 0.22);
    padding: 4px 8px;
    min-height: 36px;
    border-radius: 20px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  .btn-half-pill {
    background: transparent;
    border: 1px solid transparent;
    color: #9cb3cc;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    min-height: 28px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-half-pill:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.06);
  }

  .btn-half-pill.half-active {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    color: #ffffff;
    border-color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.45);
  }

  .timer-clock-display {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(16, 28, 48, 0.95);
    border: 1px solid rgba(56, 189, 248, 0.4);
    padding: 4px 12px;
    min-height: 28px;
    border-radius: 6px;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s;
  }

  .timer-clock-display:hover, .timer-clock-display:active {
    border-color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
  }

  .clock-digits {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.95rem;
    font-weight: 800;
    color: #7dd3fc;
    letter-spacing: 0.05em;
  }

  .clock-status-dot {
    font-size: 9px;
  }

  .dot-running { color: #10b981; animation: pulse 1s infinite; }
  .dot-paused { color: #f59e0b; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  .compact-nav-tabs {
    display: flex;
    gap: 4px;
    background: rgba(8, 14, 24, 0.65);
    padding: 4px;
    border-radius: 10px;
    border: 1px solid rgba(156, 179, 204, 0.18);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
  }

  .compact-nav-tabs::-webkit-scrollbar {
    display: none;
  }

  .compact-nav-tabs .tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 13px;
    min-height: 34px;
    border-radius: 7px;
    font-size: 0.78rem;
    font-weight: 600;
    background: transparent;
    color: #9cb3cc;
    border: 1px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .compact-nav-tabs .tab-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .compact-nav-tabs .tab-btn.active {
    background: linear-gradient(135deg, #1b3558 0%, #274b7c 100%);
    color: #ffffff;
    font-weight: 700;
    border-color: #38bdf8;
    box-shadow: 0 2px 12px rgba(56, 189, 248, 0.35);
  }

  /* User Auth Section */
  .user-auth-section {
    display: flex;
    align-items: center;
  }

  .user-profile-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(18, 32, 54, 0.75);
    border: 1px solid rgba(156, 179, 204, 0.22);
    padding: 5px 12px 5px 7px;
    min-height: 36px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .user-profile-btn:hover, .user-profile-btn:active {
    background: rgba(24, 44, 74, 0.9);
    border-color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
  }

  .user-role-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.64rem;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 12px;
    letter-spacing: 0.04em;
  }

  .user-badge-coach {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.4);
  }

  .user-badge-analyst {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.4);
  }

  .user-badge-player {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  .user-badge-guest {
    background: rgba(148, 163, 184, 0.2);
    color: #cbd5e1;
    border: 1px solid rgba(148, 163, 184, 0.4);
  }

  .user-display-name {
    font-size: 0.78rem;
    font-weight: 700;
    color: #e2e8f0;
    max-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .app-main-content {
    flex: 1;
    max-width: 1720px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem 1.25rem;
  }

  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 0;
    gap: 1rem;
    color: #9cb3cc;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(56, 189, 248, 0.2);
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .btn-retry {
    background: linear-gradient(135deg, #1b3558 0%, #254674 100%);
    color: #ffffff;
    border: 1px solid #38bdf8;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-retry:hover {
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
  }

  .tab-content-area {
    margin-bottom: 2rem;
  }

  /* Footer */
  .app-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem calc(0.75rem + var(--sab, 0px)) 1.5rem;
    background: rgba(10, 18, 30, 0.92);
    border-top: 1px solid rgba(156, 179, 204, 0.12);
    font-size: 0.75rem;
    color: #64748b;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #9cb3cc;
  }

  .live-pulse {
    width: 8px;
    height: 8px;
    background: #38bdf8;
    border-radius: 50%;
    box-shadow: 0 0 8px #38bdf8;
  }

  .shortcut-tip code {
    background: rgba(255, 255, 255, 0.1);
    padding: 1px 5px;
    border-radius: 4px;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  /* iPad Specific Layout Rules */
  @media (max-width: 1024px) {
    .app-compact-header {
      padding: 0.5rem 0.8rem;
    }

    .app-main-content {
      padding: 0.75rem 0.75rem;
    }

    .active-match-title {
      max-width: 180px;
    }

    .brand-title {
      font-size: 0.88rem;
    }

    .compact-nav-tabs {
      order: 3;
      width: 100%;
      justify-content: flex-start;
    }
  }

  @media print {
    .no-print {
      display: none !important;
    }
    .futsal-app {
      background: #ffffff !important;
    }
    .app-main-content {
      padding: 0 !important;
      max-width: 100% !important;
    }
  }
</style>
