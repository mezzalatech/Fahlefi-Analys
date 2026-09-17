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
  import UserManagerModal from './components/UserManagerModal.svelte';
  import AnalyticsModal from './components/AnalyticsModal.svelte';
  import MatchConfigModal from './components/MatchConfigModal.svelte';
  import CloudSyncModal from './components/CloudSyncModal.svelte';
  import SeriesPresentationView from './components/SeriesPresentationView.svelte';
  import { 
    FileText, 
    Table, 
    MapPin, 
    Users, 
    ArrowRightLeft, 
    Database, 
    AlertCircle, 
    UserCircle, 
    UserCog, 
    LogOut, 
    Crown, 
    Trophy, 
    Shield, 
    ChevronDown,
    Cloud,
    CloudOff,
    RefreshCw,
    Share2,
    Smartphone,
    Presentation,
    X,
    Clock,
    Play,
    Pause,
    RotateCcw,
    Check,
    Zap,
    Plus,
    Minus
  } from 'lucide-svelte';

  let currentView = $state<'sheet' | 'matrix' | 'pitch' | 'pakets' | 'substitutions' | 'master_db' | 'presentation'>('sheet');
  let showConfigModal = $state<boolean>(false);
  let showAnalyticsModal = $state<boolean>(false);
  let showIpadInstallModal = $state<boolean>(false);
  let showTimeSyncPopover = $state<boolean>(false);
  let inputMinutes = $state<number>(20);
  let inputSeconds = $state<number>(0);

  function openTimeSyncPopover() {
    if (matchStore.data) {
      const total = matchStore.data.match.timerRemaining || 0;
      inputMinutes = Math.floor(total / 60);
      inputSeconds = total % 60;
    }
    showTimeSyncPopover = true;
  }

  function applyCustomTime() {
    matchStore.setTimeByMinutesSeconds(inputMinutes, inputSeconds);
    showTimeSyncPopover = false;
  }

  function handleShareApp() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'FAHLEFI Futsal Analytics',
        text: 'Aplikasi Analisis Pertandingan Futsal & Papan Taktis Real-Time',
        url: window.location.href
      }).catch(() => {
        showIpadInstallModal = true;
      });
    } else {
      showIpadInstallModal = true;
    }
  }

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
    <!-- Top Row: Identity, Match Context, & User Actions -->
    <div class="header-top-row">
      <div class="header-left-group">
        <div class="brand-left">
          <img src="/icon.png" alt="Futsal Analysis" class="app-brand-logo" />
          <h1 class="brand-title">FAHLEFI FUTSAL ANALYTICS</h1>
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
      </div>

      <!-- User Profile & RBAC Switcher & Quick Actions -->
      <div class="header-right-group user-auth-section">
        <!-- Team Scope & Confidentiality Switcher -->
        <div class="team-scope-switcher" title="Ruang Kerja Analisis & Data Rahasia Tim: {matchStore.activeTeamName}">
          <button 
            type="button" 
            class="scope-chip {matchStore.teamScope === 'home' ? 'scope-active-home' : ''}" 
            onclick={() => matchStore.setTeamScope('home')}
            title="Analisis Tim Home (Data Rahasia): {matchStore.data?.match.homeTeam || 'Home'}">
            <Shield size={12} class={matchStore.teamScope === 'home' ? 'text-cyan' : ''} />
            <span class="scope-text">{matchStore.data?.match.homeTeam || 'Home'}</span>
          </button>
          <button 
            type="button" 
            class="scope-chip {matchStore.teamScope === 'away' ? 'scope-active-away' : ''}" 
            onclick={() => matchStore.setTeamScope('away')}
            title="Analisis Tim Away (Data Rahasia): {matchStore.data?.match.awayTeam || 'Away'}">
            <Shield size={12} class={matchStore.teamScope === 'away' ? 'text-amber' : ''} />
            <span class="scope-text">{matchStore.data?.match.awayTeam || 'Away'}</span>
          </button>
          {#if matchStore.currentUser?.role === 'admin'}
            <button 
              type="button" 
              class="scope-chip {matchStore.teamScope === 'all' ? 'scope-active-all' : ''}" 
              onclick={() => matchStore.setTeamScope('all')}
              title="Mode Panitia / Admin: Akses Semua Olahan Data">
              <span class="scope-text">Semua</span>
            </button>
          {/if}
        </div>

        <!-- Cloud Realtime Sync Pill Button -->
        <button 
          type="button" 
          class="cloud-sync-pill status-{matchStore.cloudStatus}" 
          onclick={() => (matchStore.showCloudSyncModal = true)}
          title="Status Real-Time Cloud: Klik untuk menghubungkan MacBook & iPad">
          {#if matchStore.cloudStatus === 'connected'}
            <span class="live-dot-ping"></span>
            <Cloud size={14} class="text-emerald" />
            <span class="cloud-pill-label">Cloud Realtime</span>
            {#if matchStore.cloudLatency}
              <span class="cloud-ms">{matchStore.cloudLatency}ms</span>
            {/if}
          {:else if matchStore.cloudStatus === 'connecting'}
            <RefreshCw size={14} class="text-amber spin" />
            <span class="cloud-pill-label">Connecting...</span>
          {:else if matchStore.cloudStatus === 'offline'}
            <CloudOff size={14} class="text-rose" />
            <span class="cloud-pill-label">Cloud Offline</span>
          {:else}
            <CloudOff size={14} class="text-slate" />
            <span class="cloud-pill-label">⚡ Sinkron Realtime</span>
          {/if}
        </button>

        {#if matchStore.currentUser?.role === 'coach' || matchStore.currentUser?.role === 'admin'}
          <button 
            type="button" 
            class="btn-user-manager-nav" 
            onclick={() => (matchStore.showUserManagerModal = true)}
            title="Kelola Akun, Kredensial, & Hak Akses Pengguna">
            <UserCog size={15} class="text-cyan" />
            <span class="user-mgr-label">User Management</span>
          </button>
        {/if}

        <button 
          class="user-profile-btn" 
          onclick={() => (matchStore.showLoginModal = true)}
          title="Klik untuk ganti hak akses / profil">
          <span class="user-role-tag {userRoleBadge.class}">
            <span>{userRoleBadge.icon}</span>
            <span>{userRoleBadge.label}</span>
          </span>
          <span class="user-display-name">{matchStore.currentUser?.name || 'Masuk Akun'}</span>
        </button>

        <!-- Share / Install to iPad Button -->
        <button 
          type="button" 
          class="btn-share-header" 
          onclick={handleShareApp} 
          title="Pasang ke Layar Utama iPad / Bagikan Link">
          <Share2 size={13} class="text-cyan" />
          <span class="share-header-label">Pasang di iPad</span>
        </button>

        {#if matchStore.currentUser}
          <button 
            type="button" 
            class="btn-logout-header" 
            onclick={() => matchStore.logout()} 
            title="Keluar / Ganti Akun">
            <LogOut size={14} />
          </button>
        {/if}
      </div>
    </div>

    <!-- Bottom Row: Navigation Tabs & Match Clock Toolbar -->
    <div class="header-bottom-row">
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

        <button 
          class="tab-btn tab-btn-highlight {currentView === 'presentation' ? 'active' : ''}" 
          onclick={() => (currentView = 'presentation')}
          title="Buka Deck Presentasi Evaluasi Seri & Export PowerPoint (.pptx)">
          <Presentation size={14} class="text-emerald" />
          <span>Presentasi Seri (PPTX)</span>
        </button>
      </nav>

      <!-- Match Timer & Half Controller in Toolbar (Clean & Distinct) -->
      <div class="header-timer-pill-wrapper">
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
          
          <!-- Clock Display (Click to open Time Sync Popover) -->
          <div 
            class="timer-clock-display {showTimeSyncPopover ? 'clock-open' : ''}" 
            onclick={openTimeSyncPopover} 
            role="button" 
            tabindex="0" 
            title="Klik untuk Pengaturan Waktu Cepat (Sinkron Meja Panitia)">
            <Clock size={13} class="clock-icon text-cyan" />
            <span class="clock-digits">{matchStore.formattedTime}</span>
            <span class="clock-status-dot {matchStore.timerRunning ? 'dot-running' : 'dot-paused'}">●</span>
          </div>

          <!-- Play/Pause Toggle Button -->
          <button 
            type="button" 
            class="btn-timer-toggle {matchStore.timerRunning ? 'is-running' : 'is-paused'}" 
            onclick={() => matchStore.toggleTimer()} 
            title={matchStore.timerRunning ? 'Pause Waktu (Pintasan: Spasi)' : 'Jalankan Waktu (Pintasan: Spasi)'}>
            {#if matchStore.timerRunning}
              <Pause size={13} />
            {:else}
              <Play size={13} />
            {/if}
          </button>
        </div>

        <!-- Quick Time Sync Popover -->
        {#if showTimeSyncPopover}
          <div class="time-sync-backdrop" onclick={() => (showTimeSyncPopover = false)} role="presentation"></div>
          <div class="time-sync-popover" role="dialog">
            <div class="popover-header">
              <div class="popover-title">
                <Clock size={16} class="text-cyan" />
                <span>Quick Time Sync (Waktu Bersih Futsal)</span>
              </div>
              <button type="button" class="btn-close-pop" onclick={() => (showTimeSyncPopover = false)}>
                <X size={15} />
              </button>
            </div>

            <div class="popover-body">
              <!-- Current Running State & Play/Pause -->
              <div class="sync-status-row">
                <div class="sync-status-indicator">
                  <span class="status-badge {matchStore.timerRunning ? 'badge-running' : 'badge-paused'}">
                    {matchStore.timerRunning ? '▶ TIMER SEDANG BERJALAN' : '⏸ TIMER BERHENTI / PAUSED'}
                  </span>
                  <span class="hotkey-tip">Pintasan keyboard: Tekan <b>[Spasi]</b></span>
                </div>
                <button 
                  type="button" 
                  class="btn-sync-playpause {matchStore.timerRunning ? 'btn-pop-pause' : 'btn-pop-play'}" 
                  onclick={() => matchStore.toggleTimer()}>
                  {#if matchStore.timerRunning}
                    <Pause size={14} /> <span>Pause</span>
                  {:else}
                    <Play size={14} /> <span>Mulai</span>
                  {/if}
                </button>
              </div>

              <!-- Manual Minute:Second Input -->
              <div class="sync-input-card">
                <label class="sync-card-label">Set Waktu Langsung (Menit : Detik):</label>
                <div class="sync-digits-inputs">
                  <div class="input-digit-group">
                    <input 
                      type="number" 
                      min="0" 
                      max="40" 
                      class="time-num-input" 
                      bind:value={inputMinutes} 
                    />
                    <span class="unit-lbl">MENIT</span>
                  </div>
                  <span class="colon-separator">:</span>
                  <div class="input-digit-group">
                    <input 
                      type="number" 
                      min="0" 
                      max="59" 
                      class="time-num-input" 
                      bind:value={inputSeconds} 
                    />
                    <span class="unit-lbl">DETIK</span>
                  </div>
                  <button type="button" class="btn-apply-time" onclick={applyCustomTime}>
                    <Check size={14} />
                    <span>Terapkan</span>
                  </button>
                </div>
              </div>

              <!-- Quick Nudge Seconds (+/- Buttons) -->
              <div class="sync-nudge-section">
                <label class="sync-card-label">Penyesuaian Cepat Detik (Nudge Table Clock):</label>
                <div class="nudge-buttons-grid">
                  <button type="button" class="btn-nudge btn-nudge-minus" onclick={() => matchStore.adjustTimer(-60)} title="Kurangi 1 Menit">-1m</button>
                  <button type="button" class="btn-nudge btn-nudge-minus" onclick={() => matchStore.adjustTimer(-30)} title="Kurangi 30 Detik">-30s</button>
                  <button type="button" class="btn-nudge btn-nudge-minus" onclick={() => matchStore.adjustTimer(-10)} title="Kurangi 10 Detik">-10s</button>
                  <button type="button" class="btn-nudge btn-nudge-minus" onclick={() => matchStore.adjustTimer(-5)} title="Kurangi 5 Detik">-5s</button>
                  <button type="button" class="btn-nudge btn-nudge-plus" onclick={() => matchStore.adjustTimer(5)} title="Tambah 5 Detik">+5s</button>
                  <button type="button" class="btn-nudge btn-nudge-plus" onclick={() => matchStore.adjustTimer(10)} title="Tambah 10 Detik">+10s</button>
                  <button type="button" class="btn-nudge btn-nudge-plus" onclick={() => matchStore.adjustTimer(30)} title="Tambah 30 Detik">+30s</button>
                  <button type="button" class="btn-nudge btn-nudge-plus" onclick={() => matchStore.adjustTimer(60)} title="Tambah 1 Menit">+1m</button>
                </div>
              </div>

              <!-- Futsal Presets -->
              <div class="sync-presets-section">
                <label class="sync-card-label">Preset Standar Pertandingan Futsal:</label>
                <div class="presets-buttons-grid">
                  <button type="button" class="btn-preset" onclick={() => { matchStore.setTimer(1200); showTimeSyncPopover = false; }}>
                    <span class="p-time">20:00</span>
                    <span class="p-desc">Awal Babak</span>
                  </button>
                  <button type="button" class="btn-preset" onclick={() => { matchStore.setTimer(600); showTimeSyncPopover = false; }}>
                    <span class="p-time">10:00</span>
                    <span class="p-desc">Tengah Babak</span>
                  </button>
                  <button type="button" class="btn-preset" onclick={() => { matchStore.setTimer(300); showTimeSyncPopover = false; }}>
                    <span class="p-time">05:00</span>
                    <span class="p-desc">Fase Kritis</span>
                  </button>
                  <button type="button" class="btn-preset" onclick={() => { matchStore.setTimer(120); showTimeSyncPopover = false; }}>
                    <span class="p-time">02:00</span>
                    <span class="p-desc">Power Play</span>
                  </button>
                  <button type="button" class="btn-preset btn-preset-danger" onclick={() => { matchStore.setTimer(0); showTimeSyncPopover = false; }}>
                    <span class="p-time">00:00</span>
                    <span class="p-desc">Babak Habis</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
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
        {:else if currentView === 'presentation'}
          <SeriesPresentationView />
        {/if}
      </div>
    {/if}
  </main>

  <!-- Modals -->
  {#if matchStore.showMatchManagerModal}
    <MatchManagerModal onClose={() => (matchStore.showMatchManagerModal = false)} />
  {/if}

  {#if matchStore.showUserManagerModal}
    <UserManagerModal onClose={() => (matchStore.showUserManagerModal = false)} />
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

  {#if matchStore.showCloudSyncModal}
    <CloudSyncModal />
  {/if}

  {#if showIpadInstallModal}
    <div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) showIpadInstallModal = false; }} role="presentation">
      <div class="ipad-install-card" role="dialog" aria-modal="true" tabindex="-1">
        <div class="install-card-header">
          <div class="install-title-group">
            <Smartphone size={22} class="text-cyan" />
            <div>
              <h3 class="install-modal-title">Pasang Aplikasi ke Layar Utama iPad</h3>
              <p class="install-modal-sub">Jadikan seperti aplikasi iPad asli tanpa bingkai browser</p>
            </div>
          </div>
          <button type="button" class="btn-close-modal" onclick={() => showIpadInstallModal = false}>
            <X size={18} />
          </button>
        </div>

        <div class="install-card-body">
          <div class="install-steps">
            <div class="step-item">
              <span class="step-num">1</span>
              <div>
                <strong>Buka di Browser Safari iPad</strong>
                <p>Buka alamat web Vercel ini menggunakan browser <strong>Safari</strong> di iPad Anda.</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-num">2</span>
              <div>
                <strong>Ketuk Tombol Share (Bagikan)</strong>
                <p>Di bilah atas Safari, ketuk tombol <strong>Share</strong> (ikon kotak dengan panah ke atas: <span class="share-icon-preview">⎋</span>).</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-num">3</span>
              <div>
                <strong>Pilih "Tambahkan ke Layar Utama"</strong>
                <p>Gulir ke bawah pada menu yang muncul, lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-num">4</span>
              <div>
                <strong>Ketuk "Tambah" di Pojok Kanan Atas</strong>
                <p>Ikon aplikasi resmi <strong>Futsal Analys</strong> akan langsung terpasang di menu beranda iPad Anda!</p>
              </div>
            </div>
          </div>
        </div>

        <div class="install-card-footer">
          <button type="button" class="btn-primary-sync" onclick={() => {
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator.share({ title: 'FAHLEFI Futsal Analytics', url: window.location.href }).catch(() => {});
            }
          }}>
            <Share2 size={14} />
            <span>Buka Menu Share iPad Sekarang</span>
          </button>
          <button type="button" class="btn-done" onclick={() => showIpadInstallModal = false}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Footer Info Bar (Hidden in print) -->
  <footer class="app-footer no-print">
    <div class="footer-left">
      <span class="status-indicator">
        <span class="live-pulse"></span>
        <span>Tactical Offline-First Engine (Resilient & Arena Ready)</span>
      </span>
      <span class="shortcut-tip">Pintasan: <code>Spasi</code> (Start/Pause Timer)</span>
    </div>
    <div class="footer-right">
      <span>Auto-Saved • FAHLEFI Futsal Tactical Analytics Pro</span>
    </div>
  </footer>
</div>

<style>
  :global(:root) {
    --sat: env(safe-area-inset-top, 0px);
    --sar: env(safe-area-inset-right, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left, 0px);
  }

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
    flex-direction: column;
    gap: 8px;
    padding-top: max(14px, calc(env(safe-area-inset-top, 0px) + 12px));
    padding-left: max(14px, calc(env(safe-area-inset-left, 0px) + 12px));
    padding-right: max(14px, calc(env(safe-area-inset-right, 0px) + 12px));
    padding-bottom: 8px;
    background: rgba(12, 21, 36, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(156, 179, 204, 0.18);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  /* When running as iPad Standalone / Home Screen App */
  @media all and (display-mode: standalone) {
    .app-compact-header {
      padding-top: max(32px, calc(env(safe-area-inset-top, 0px) + 12px));
    }
  }

  .header-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    min-width: 0;
    flex-wrap: nowrap;
  }

  .header-left-group {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 0 1 auto;
  }

  .header-right-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    margin-left: auto;
  }

  .header-bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
  }

  .brand-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .app-brand-logo {
    width: 32px;
    height: 32px;
    object-fit: contain;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
    border-radius: 8px;
  }

  .brand-title {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    white-space: nowrap;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 40%, #7dd3fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Match Selector Pill */
  .match-selector-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(18, 32, 54, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.35);
    padding: 0 12px;
    height: 34px;
    min-height: 34px;
    border-radius: 18px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    min-width: 0;
    flex: 0 1 auto;
  }

  .match-selector-pill:hover, .match-selector-pill:active {
    background: rgba(24, 44, 74, 0.95);
    border-color: #38bdf8;
    box-shadow: 0 0 14px rgba(56, 189, 248, 0.4);
    transform: translateY(-1px);
  }

  .active-match-title {
    font-size: 0.76rem;
    font-weight: 800;
    color: #ffffff;
    max-width: clamp(110px, 13vw, 200px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
  }

  :global(.chevron-icon) {
    color: #9cb3cc;
    transition: transform 0.15s;
    flex-shrink: 0;
  }

  .match-selector-pill:hover :global(.chevron-icon) {
    color: #ffffff;
    transform: translateY(1px);
  }

  .header-timer-pill-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
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
    padding: 4px 10px;
    min-height: 28px;
    border-radius: 8px;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s;
  }

  .timer-clock-display:hover, .timer-clock-display.clock-open {
    border-color: #38bdf8;
    background: rgba(24, 44, 76, 0.98);
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.5);
    transform: translateY(-1px);
  }

  .btn-timer-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-timer-toggle.is-paused {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.5);
    color: #10b981;
  }

  .btn-timer-toggle.is-paused:hover {
    background: #10b981;
    color: #ffffff;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
  }

  .btn-timer-toggle.is-running {
    background: rgba(245, 158, 11, 0.2);
    border-color: rgba(245, 158, 11, 0.5);
    color: #f59e0b;
  }

  .btn-timer-toggle.is-running:hover {
    background: #f59e0b;
    color: #ffffff;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
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

  /* Quick Time Sync Popover Styles */
  .time-sync-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
  }

  .time-sync-popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 360px;
    background: #0d1624;
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 14px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.2);
    z-index: 1001;
    overflow: hidden;
    animation: popFade 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes popFade {
    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .popover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(14, 26, 44, 0.95);
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
  }

  .popover-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.02em;
  }

  .btn-close-pop {
    background: transparent;
    border: none;
    color: #9cb3cc;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: all 0.15s;
  }

  .btn-close-pop:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }

  .popover-body {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sync-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    background: rgba(18, 30, 48, 0.6);
    border-radius: 8px;
    border: 1px solid rgba(156, 179, 204, 0.12);
  }

  .sync-status-indicator {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .status-badge {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .badge-running { color: #10b981; }
  .badge-paused { color: #f59e0b; }

  .hotkey-tip {
    font-size: 0.68rem;
    color: #9cb3cc;
  }

  .btn-sync-playpause {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
  }

  .btn-pop-play {
    background: #10b981;
    color: #ffffff;
  }
  .btn-pop-play:hover {
    background: #059669;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  }

  .btn-pop-pause {
    background: #f59e0b;
    color: #0b1320;
  }
  .btn-pop-pause:hover {
    background: #d97706;
    color: #ffffff;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  }

  .sync-card-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #9cb3cc;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
    display: block;
  }

  .sync-input-card {
    background: rgba(14, 24, 38, 0.7);
    border: 1px solid rgba(156, 179, 204, 0.15);
    border-radius: 8px;
    padding: 10px;
  }

  .sync-digits-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-digit-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    flex: 1;
  }

  .time-num-input {
    width: 100%;
    height: 36px;
    background: #070d18;
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 6px;
    color: #ffffff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.1rem;
    font-weight: 800;
    text-align: center;
  }

  .time-num-input:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
  }

  .unit-lbl {
    font-size: 0.6rem;
    font-weight: 700;
    color: #64748b;
  }

  .colon-separator {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.4rem;
    font-weight: 800;
    color: #7dd3fc;
    margin-bottom: 12px;
  }

  .btn-apply-time {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 14px;
    height: 36px;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    border: 1px solid #38bdf8;
    border-radius: 6px;
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .btn-apply-time:hover {
    background: #0284c7;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
  }

  .nudge-buttons-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .btn-nudge {
    padding: 6px 0;
    border-radius: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.76rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;
  }

  .btn-nudge-minus {
    background: rgba(244, 63, 94, 0.12);
    border-color: rgba(244, 63, 94, 0.3);
    color: #fda4af;
  }

  .btn-nudge-minus:hover {
    background: #f43f5e;
    color: #ffffff;
    box-shadow: 0 0 8px rgba(244, 63, 94, 0.4);
  }

  .btn-nudge-plus {
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.3);
    color: #6ee7b7;
  }

  .btn-nudge-plus:hover {
    background: #10b981;
    color: #ffffff;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
  }

  .presets-buttons-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .btn-preset {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 4px;
    background: rgba(18, 30, 48, 0.7);
    border: 1px solid rgba(156, 179, 204, 0.15);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-preset:hover {
    background: rgba(30, 52, 84, 0.9);
    border-color: #38bdf8;
    transform: translateY(-1px);
  }

  .btn-preset .p-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    font-weight: 800;
    color: #ffffff;
  }

  .btn-preset .p-desc {
    font-size: 0.62rem;
    font-weight: 600;
    color: #9cb3cc;
  }

  .btn-preset-danger {
    border-color: rgba(244, 63, 94, 0.3);
  }
  .btn-preset-danger:hover {
    border-color: #f43f5e;
    background: rgba(244, 63, 94, 0.2);
  }
  .btn-preset-danger .p-time {
    color: #fda4af;
  }

  .compact-nav-tabs {
    display: flex;
    gap: 6px;
    background: rgba(8, 14, 24, 0.65);
    padding: 4px;
    border-radius: 10px;
    border: 1px solid rgba(156, 179, 204, 0.18);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    min-width: 0;
  }

  .compact-nav-tabs::-webkit-scrollbar {
    display: none;
  }

  .compact-nav-tabs .tab-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 12px;
    min-height: 36px;
    border-radius: 7px;
    font-size: 0.78rem;
    font-weight: 600;
    background: transparent;
    color: #9cb3cc;
    border: 1px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    flex: 1;
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

  /* Cloud Sync Pill */
  .cloud-sync-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px;
    height: 34px;
    border-radius: 20px;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #e2e8f0;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    position: relative;
  }

  .cloud-sync-pill:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .cloud-sync-pill.status-connected {
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.4);
    color: #6ee7b7;
  }

  .cloud-sync-pill.status-connected:hover {
    background: rgba(16, 185, 129, 0.2);
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.25);
  }

  .cloud-sync-pill.status-connecting {
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.4);
    color: #fcd34d;
  }

  .cloud-sync-pill.status-offline, .cloud-sync-pill.status-unconfigured {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
    color: #94a3b8;
  }

  .cloud-sync-pill.status-offline:hover, .cloud-sync-pill.status-unconfigured:hover {
    border-color: #38bdf8;
    color: #f1f5f9;
  }

  .live-dot-ping {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
    animation: pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulseDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }

  .cloud-ms {
    font-size: 0.68rem;
    padding: 1px 6px;
    background: rgba(16, 185, 129, 0.25);
    border-radius: 10px;
    color: #a7f3d0;
    font-family: monospace;
  }

  /* User Auth Section */
  .user-auth-section {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  /* Team Scope & Confidentiality Switcher */
  .team-scope-switcher {
    display: flex;
    align-items: center;
    background: rgba(8, 14, 24, 0.75);
    border: 1px solid rgba(156, 179, 204, 0.22);
    padding: 2px;
    border-radius: 18px;
    gap: 2px;
    height: 34px;
    box-sizing: border-box;
  }

  .scope-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: 1px solid transparent;
    color: #94a3b8;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0 8px;
    height: 28px;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .scope-chip:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.06);
  }

  .scope-active-home {
    background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%);
    color: #ffffff;
    border-color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
  }

  .scope-active-away {
    background: linear-gradient(135deg, #78350f 0%, #b45309 100%);
    color: #ffffff;
    border-color: #f59e0b;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
  }

  .scope-active-all {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    color: #ffffff;
    border-color: #9ca3af;
  }

  .scope-text {
    max-width: clamp(45px, 6vw, 75px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cloud-sync-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    min-height: 34px;
    padding: 0 10px;
    border-radius: 18px;
    font-size: 0.73rem;
    font-weight: 700;
    border: 1px solid rgba(156, 179, 204, 0.22);
    cursor: pointer;
    background: rgba(8, 14, 24, 0.75);
    color: #e2e8f0;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
  }

  .btn-user-manager-nav {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(14, 165, 233, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;
    padding: 0 10px;
    height: 34px;
    min-height: 34px;
    border-radius: 9px;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
    box-sizing: border-box;
  }

  .btn-user-manager-nav:hover {
    background: rgba(14, 165, 233, 0.22);
    border-color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
    color: #ffffff;
  }

  .user-profile-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(18, 32, 54, 0.75);
    border: 1px solid rgba(156, 179, 204, 0.22);
    padding: 0 10px 0 4px;
    height: 34px;
    min-height: 34px;
    border-radius: 18px;
    cursor: pointer;
    transition: all 0.15s;
    box-sizing: border-box;
  }

  .btn-logout-header {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #f87171;
    padding: 0;
    border-radius: 9px;
    height: 34px;
    width: 34px;
    min-height: 34px;
    min-width: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    box-sizing: border-box;
  }

  .btn-logout-header:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: #ef4444;
    color: #ffffff;
  }

  .btn-share-header {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(56, 189, 248, 0.08);
    border: 1px solid rgba(56, 189, 248, 0.25);
    color: #e2e8f0;
    padding: 0 10px;
    height: 34px;
    min-height: 34px;
    border-radius: 9px;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
    box-sizing: border-box;
  }

  .btn-share-header:hover {
    background: rgba(56, 189, 248, 0.22);
    border-color: #38bdf8;
    color: #ffffff;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
  }

  /* iPad Install Card */
  .ipad-install-card {
    background: #0f172a;
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 16px;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    color: #f1f5f9;
    overflow: hidden;
  }

  .install-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #131d38;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .install-title-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .install-modal-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    color: #f8fafc;
  }

  .install-modal-sub {
    margin: 2px 0 0;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .install-card-body {
    padding: 20px;
  }

  .install-steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: rgba(30, 41, 59, 0.6);
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .step-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0284c7, #0369a1);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.75rem;
    flex-shrink: 0;
  }

  .step-item strong {
    display: block;
    font-size: 0.84rem;
    color: #f1f5f9;
    margin-bottom: 3px;
  }

  .step-item p {
    margin: 0;
    font-size: 0.76rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  .share-icon-preview {
    display: inline-block;
    padding: 1px 6px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 900;
  }

  .install-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: #090d16;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
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
    font-size: 0.76rem;
    font-weight: 700;
    color: #e2e8f0;
    max-width: 100px;
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

  .loading-spinner {
    width: 38px;
    height: 38px;
    border: 3px solid rgba(56, 189, 248, 0.2);
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .btn-retry {
    padding: 8px 18px;
    background: #0284c7;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-retry:hover {
    background: #0369a1;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .shortcut-tip {
    font-size: 0.72rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .shortcut-dot {
    width: 5px;
    height: 5px;
    background: #38bdf8;
    border-radius: 50%;
    box-shadow: 0 0 8px #38bdf8;
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

  /* Progressive Header Responsive Breakpoints */
  @media (max-width: 1440px) {
    .user-mgr-label,
    .share-header-label {
      display: none;
    }
    .btn-user-manager-nav,
    .btn-share-header {
      padding: 0;
      width: 34px;
      min-width: 34px;
      justify-content: center;
    }
    .active-match-title {
      max-width: 160px;
    }
    .scope-text {
      max-width: 65px;
    }
  }

  @media (max-width: 1240px) {
    .cloud-pill-label {
      display: none;
    }
    .cloud-sync-pill {
      padding: 0 8px;
    }
    .active-match-title {
      max-width: 130px;
    }
    .user-display-name {
      max-width: 80px;
    }
  }

  @media (max-width: 1060px) {
    .brand-title {
      display: none;
    }
    .scope-text {
      display: none;
    }
    .scope-chip {
      padding: 0 6px;
    }
    .active-match-title {
      max-width: 150px;
    }
    .header-top-row {
      gap: 6px;
    }
  }

  @media (max-width: 860px) {
    .app-compact-header {
      padding-top: max(24px, calc(env(safe-area-inset-top, 0px) + 10px));
      padding-left: max(10px, calc(env(safe-area-inset-left, 0px) + 8px));
      padding-right: max(10px, calc(env(safe-area-inset-right, 0px) + 8px));
      padding-bottom: 6px;
      gap: 6px;
    }

    .header-bottom-row {
      flex-wrap: wrap;
      gap: 8px;
    }

    .compact-nav-tabs {
      width: 100%;
      flex: none;
      order: 1;
    }

    .header-timer-pill {
      width: 100%;
      justify-content: center;
      order: 2;
    }

    .brand-title {
      font-size: 0.85rem;
    }

    .app-main-content {
      padding: 0.75rem 0.75rem;
    }
  }

  @media (max-width: 600px) {
    .user-profile-btn {
      padding: 0 4px;
    }
    .user-display-name {
      display: none;
    }
    .active-match-title {
      max-width: 95px;
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
