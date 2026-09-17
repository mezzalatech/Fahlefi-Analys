<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { 
    Menu, 
    X, 
    Crown, 
    Building2, 
    Users, 
    UserCog, 
    Trophy, 
    Database, 
    Cloud, 
    CloudOff, 
    RefreshCw, 
    LogOut, 
    Share2, 
    Smartphone, 
    Shield, 
    ChevronRight, 
    ChevronDown, 
    Check, 
    Activity, 
    FileSpreadsheet, 
    Layers, 
    UserCheck,
    ArrowRightLeft,
    SlidersHorizontal
  } from 'lucide-svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onOpenIpadInstall?: () => void;
    onSelectView?: (view: 'sheet' | 'matrix' | 'pitch' | 'pakets' | 'substitutions' | 'master_db' | 'presentation') => void;
  }

  let { isOpen, onClose, onOpenIpadInstall, onSelectView } = $props<Props>();

  let showTeamDropdown = $state<boolean>(false);

  function getRoleBadge(role?: string) {
    switch (role) {
      case 'superadmin':
      case 'admin':
        return { label: 'SUPER ADMIN', class: 'badge-superadmin', icon: '👑' };
      case 'coach': 
        return { label: 'HEAD COACH', class: 'badge-coach', icon: '👔' };
      case 'analyst': 
        return { label: 'ANALYST', class: 'badge-analyst', icon: '📊' };
      case 'player': 
        return { label: 'PLAYER', class: 'badge-player', icon: '⚽' };
      default: 
        return { label: 'GUEST', class: 'badge-guest', icon: '👤' };
    }
  }

  let roleInfo = $derived(getRoleBadge(matchStore.currentUser?.role));

  async function handleSwitchTeam(teamId: string) {
    await matchStore.switchTeam(teamId);
    showTeamDropdown = false;
  }
</script>

<!-- Backdrop Overlay (When Sidebar is Open) -->
{#if isOpen}
  <div 
    class="sidebar-backdrop" 
    onclick={onClose} 
    onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
    role="presentation">
  </div>
{/if}

<!-- Slide-out Sidebar Drawer -->
<aside class="app-sidebar-drawer {isOpen ? 'sidebar-open' : ''}" aria-hidden={!isOpen}>
  <!-- Sidebar Header -->
  <div class="sidebar-header">
    <div class="brand-group">
      <img src="/icon.png" alt="FAHLEFI" class="sidebar-brand-emblem" />
      <div>
        <h2 class="sidebar-brand-title">FAHLEFI ANALYTICS</h2>
        <span class="sidebar-brand-sub">Futsal Tactical Suite</span>
      </div>
    </div>
    <button class="btn-close-sidebar" onclick={onClose} title="Tutup Menu">
      <X size={18} />
    </button>
  </div>

  <!-- User Profile Card -->
  <div class="user-card-section">
    <div class="user-profile-box">
      <div class="user-avatar-circle">
        {matchStore.currentUser?.name ? matchStore.currentUser.name.charAt(0).toUpperCase() : 'U'}
      </div>
      <div class="user-info-text">
        <div class="user-full-name">{matchStore.currentUser?.name || 'Pengguna Tamu'}</div>
        <div class="user-meta-row">
          <span class="role-pill {roleInfo.class}">
            <span>{roleInfo.icon}</span>
            <span>{roleInfo.label}</span>
          </span>
          {#if matchStore.currentUser?.username}
            <span class="username-tag">@{matchStore.currentUser.username}</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Active Team Workspace Widget -->
    <div class="team-workspace-widget">
      <div class="team-widget-label">
        <Building2 size={12} class="text-emerald-400" />
        <span>RUANG KERJA TIM:</span>
      </div>
      
      <div class="team-active-card">
        <div class="team-active-left">
          <img src={matchStore.currentTeamLogo} alt={matchStore.currentTeamName} class="team-mini-img" />
          <div class="team-active-name">{matchStore.currentTeamName}</div>
        </div>

        {#if matchStore.isSuperAdmin}
          <button 
            type="button" 
            class="btn-team-switch-toggle" 
            onclick={() => (showTeamDropdown = !showTeamDropdown)}
            title="Ganti Tim Workspace">
            <ArrowRightLeft size={13} />
          </button>
        {/if}
      </div>

      <!-- Quick Team Switcher Dropdown for Super Admin -->
      {#if showTeamDropdown && matchStore.isSuperAdmin}
        <div class="team-dropdown-menu">
          <div class="dropdown-head">PILIH RUANG KERJA TIM:</div>
          {#each matchStore.teamsList as t}
            {@const isSelected = matchStore.activeTeamId === t.id}
            <button 
              type="button" 
              class="team-option-item {isSelected ? 'selected' : ''}" 
              onclick={() => handleSwitchTeam(t.id)}>
              <img src={t.logoUrl || '/icon.png'} alt={t.name} class="option-logo" />
              <span class="option-name">{t.name}</span>
              {#if isSelected}
                <Check size={14} class="text-emerald-400 ml-auto" />
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Main Navigation Items -->
  <div class="sidebar-nav-section">
    <div class="nav-category-title">MANAJEMEN & KONTROL</div>

    <!-- Super Admin Console (For Super Admin only) -->
    {#if matchStore.isSuperAdmin}
      <button 
        type="button" 
        class="nav-menu-btn btn-superadmin-highlight" 
        onclick={() => { matchStore.showSuperAdminModal = true; onClose(); }}>
        <Crown size={17} class="text-amber-400" />
        <div class="menu-label-wrap">
          <span class="menu-primary-label">👑 Super Admin Portal</span>
          <span class="menu-sub-label">Kelola Semua Tim & Pengguna Global</span>
        </div>
        <ChevronRight size={15} class="menu-arrow" />
      </button>
    {/if}

    <!-- Team User Management (For Coaches and Admins) -->
    {#if matchStore.currentUser?.role === 'coach' || matchStore.isSuperAdmin}
      <button 
        type="button" 
        class="nav-menu-btn" 
        onclick={() => { matchStore.showUserManagerModal = true; onClose(); }}>
        <UserCog size={17} class="text-sky-400" />
        <div class="menu-label-wrap">
          <span class="menu-primary-label">Manajemen Staf & Pengguna</span>
          <span class="menu-sub-label">Kelola akun pelatih, analis, & pemain</span>
        </div>
        <ChevronRight size={15} class="menu-arrow" />
      </button>
    {/if}

    <!-- Match Manager -->
    <button 
      type="button" 
      class="nav-menu-btn" 
      onclick={() => { matchStore.showMatchManagerModal = true; onClose(); }}>
      <Trophy size={17} class="text-cyan-400" />
      <div class="menu-label-wrap">
        <span class="menu-primary-label">Manajemen Arsip Pertandingan</span>
        <span class="menu-sub-label">Pilih laga, buat match baru, atau salin</span>
      </div>
      <ChevronRight size={15} class="menu-arrow" />
    </button>

    <!-- Master Players Database -->
    <button 
      type="button" 
      class="nav-menu-btn" 
      onclick={() => { if (onSelectView) onSelectView('master_db'); onClose(); }}>
      <Database size={17} class="text-purple-400" />
      <div class="menu-label-wrap">
        <span class="menu-primary-label">Database Master Pemain</span>
        <span class="menu-sub-label">Roster squad & profil statistik akumulasi</span>
      </div>
      <ChevronRight size={15} class="menu-arrow" />
    </button>

    <!-- Cloud Realtime Sync -->
    <button 
      type="button" 
      class="nav-menu-btn" 
      onclick={() => { matchStore.showCloudSyncModal = true; onClose(); }}>
      <Cloud size={17} class="text-emerald-400" />
      <div class="menu-label-wrap">
        <span class="menu-primary-label">Sinkronisasi Cloud Real-Time</span>
        <span class="menu-sub-label">Hubungkan MacBook & iPad di lapangan</span>
      </div>
      <span class="cloud-status-chip status-{matchStore.cloudStatus}">
        {matchStore.cloudStatus === 'connected' ? 'Live' : 'Offline'}
      </span>
    </button>

    <div class="nav-category-title mt-4">AKUN & APLIKASI</div>

    <!-- iPad Installation / Share -->
    <button 
      type="button" 
      class="nav-menu-btn" 
      onclick={() => { if (onOpenIpadInstall) onOpenIpadInstall(); onClose(); }}>
      <Smartphone size={17} class="text-sky-400" />
      <div class="menu-label-wrap">
        <span class="menu-primary-label">Pasang di iPad / Bagikan</span>
        <span class="menu-sub-label">Tampilan fullscreen seperti aplikasi asli</span>
      </div>
      <ChevronRight size={15} class="menu-arrow" />
    </button>

    <!-- Switch Account / Login -->
    <button 
      type="button" 
      class="nav-menu-btn" 
      onclick={() => { matchStore.showLoginModal = true; onClose(); }}>
      <UserCheck size={17} class="text-indigo-400" />
      <div class="menu-label-wrap">
        <span class="menu-primary-label">Ganti Akun / Masuk</span>
        <span class="menu-sub-label">Beralih profil pelatih, analis, atau admin</span>
      </div>
      <ChevronRight size={15} class="menu-arrow" />
    </button>

    <!-- Logout -->
    {#if matchStore.currentUser}
      <button 
        type="button" 
        class="nav-menu-btn btn-logout-danger" 
        onclick={() => { matchStore.logout(); onClose(); }}>
        <LogOut size={17} class="text-rose-400" />
        <div class="menu-label-wrap">
          <span class="menu-primary-label text-rose-400">Keluar dari Akun</span>
          <span class="menu-sub-label">Tutup sesi di perangkat ini</span>
        </div>
      </button>
    {/if}
  </div>

  <!-- Sidebar Footer -->
  <div class="sidebar-footer">
    <div class="app-version-info">
      <span class="live-dot"></span>
      <span>FAHLEFI FUTSAL ANALYTICS PRO • MULTI-TENANT READY</span>
    </div>
  </div>
</aside>

<style>
  /* Backdrop */
  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(3, 7, 18, 0.7);
    backdrop-filter: blur(4px);
    z-index: 9998;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Drawer Container */
  .app-sidebar-drawer {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 320px;
    max-width: 85vw;
    background: linear-gradient(180deg, #0a1322 0%, #070d18 100%);
    border-right: 1px solid rgba(56, 189, 248, 0.25);
    box-shadow: 10px 0 35px rgba(0, 0, 0, 0.75);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
  }

  .app-sidebar-drawer.sidebar-open {
    transform: translateX(0);
  }

  /* Header */
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.15rem 1.25rem;
    background: rgba(14, 25, 42, 0.95);
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
  }

  .brand-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sidebar-brand-emblem {
    width: 32px;
    height: 32px;
    object-fit: contain;
    border-radius: 8px;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5));
  }

  .sidebar-brand-title {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #7dd3fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .sidebar-brand-sub {
    font-size: 0.68rem;
    color: #94a3b8;
  }

  .btn-close-sidebar {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .btn-close-sidebar:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  /* User Card Section */
  .user-card-section {
    padding: 1.1rem 1.25rem;
    background: rgba(12, 22, 38, 0.7);
    border-bottom: 1px solid rgba(156, 179, 204, 0.12);
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .user-profile-box {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-avatar-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    color: #ffffff;
    font-weight: 800;
    font-size: 1.05rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(56, 189, 248, 0.4);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    flex-shrink: 0;
  }

  .user-info-text {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .user-full-name {
    font-size: 0.88rem;
    font-weight: 700;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-meta-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 3px;
  }

  .role-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.64rem;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 6px;
    letter-spacing: 0.03em;
  }

  .badge-superadmin { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.45); }
  .badge-coach { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
  .badge-analyst { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }
  .badge-player { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); }
  .badge-guest { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; }

  .username-tag {
    font-size: 0.68rem;
    color: #64748b;
    font-family: monospace;
  }

  /* Team Workspace Widget */
  .team-workspace-widget {
    background: rgba(15, 27, 48, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 10px;
    padding: 8px 10px;
    position: relative;
  }

  .team-widget-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.64rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.05em;
    margin-bottom: 5px;
  }

  .team-active-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .team-active-left {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
  }

  .team-mini-img {
    width: 22px;
    height: 22px;
    object-fit: contain;
    border-radius: 4px;
  }

  .team-active-name {
    font-size: 0.84rem;
    font-weight: 800;
    color: #4ade80;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-team-switch-toggle {
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;
    padding: 4px 6px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-team-switch-toggle:hover {
    background: rgba(56, 189, 248, 0.25);
    color: #ffffff;
  }

  /* Team Dropdown */
  .team-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: #0d1a2d;
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 10px;
    padding: 6px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 4px;
    animation: fadeIn 0.15s ease-out;
  }

  .dropdown-head {
    font-size: 0.62rem;
    font-weight: 800;
    color: #64748b;
    padding: 4px 8px;
    letter-spacing: 0.05em;
  }

  .team-option-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: #cbd5e1;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
  }

  .team-option-item:hover {
    background: rgba(56, 189, 248, 0.15);
    color: #ffffff;
  }

  .team-option-item.selected {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    font-weight: 700;
  }

  .option-logo {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }

  .option-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Navigation Section */
  .sidebar-nav-section {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .nav-category-title {
    font-size: 0.66rem;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.06em;
    padding: 0 8px 4px 8px;
  }

  .nav-menu-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0.7rem 0.85rem;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    transition: all 0.18s;
  }

  .nav-menu-btn:hover {
    background: rgba(56, 189, 248, 0.1);
    border-color: rgba(56, 189, 248, 0.3);
    transform: translateX(3px);
  }

  .btn-superadmin-highlight {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%);
    border-color: rgba(245, 158, 11, 0.35);
  }

  .btn-superadmin-highlight:hover {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.12) 100%);
    border-color: #fbbf24;
  }

  .menu-label-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .menu-primary-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .menu-sub-label {
    font-size: 0.68rem;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
  }

  .menu-arrow {
    color: #64748b;
    transition: transform 0.15s;
    flex-shrink: 0;
  }

  .nav-menu-btn:hover .menu-arrow {
    color: #ffffff;
    transform: translateX(2px);
  }

  .cloud-status-chip {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 999px;
  }

  .cloud-status-chip.status-connected {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.4);
  }

  .cloud-status-chip.status-offline, .cloud-status-chip.status-unconfigured {
    background: rgba(148, 163, 184, 0.15);
    color: #94a3b8;
  }

  .btn-logout-danger:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.35);
  }

  /* Footer */
  .sidebar-footer {
    padding: 0.9rem 1.25rem;
    background: rgba(10, 18, 30, 0.95);
    border-top: 1px solid rgba(156, 179, 204, 0.12);
  }

  .app-version-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.62rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.04em;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 6px #10b981;
  }

  .mt-4 {
    margin-top: 1rem;
  }

  .ml-auto {
    margin-left: auto;
  }
</style>
