<script lang="ts">
  import { onMount } from 'svelte';
  import { matchStore } from '../lib/store.svelte';
  import type { Team, User } from '../lib/api';
  import { 
    Shield, 
    Crown, 
    Building2, 
    Users, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Check, 
    X, 
    AlertCircle, 
    Lock, 
    Mail, 
    User as UserIcon, 
    ArrowRightLeft, 
    Database, 
    Key, 
    Eye, 
    EyeOff,
    CheckCircle2,
    XCircle,
    Activity,
    FolderKanban,
    Sparkles,
    FileSpreadsheet,
    Camera
  } from 'lucide-svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose } = $props<Props>();

  let activeTab = $state<'teams' | 'users' | 'privacy'>('teams');
  let searchQuery = $state<string>('');
  let successNotification = $state<string | null>(null);
  let errorNotification = $state<string | null>(null);

  // Team Form Modal State
  let showTeamForm = $state<boolean>(false);
  let isEditingTeam = $state<boolean>(false);
  let editTeamId = $state<string | null>(null);
  let formTeamName = $state<string>('');
  import { compressImageFile } from '../lib/imageCompressor';

  let formTeamShortName = $state<string>('');
  let formTeamCity = $state<string>('');
  let formTeamLogoUrl = $state<string>('');
  let formTeamStatus = $state<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  let teamFormLoading = $state<boolean>(false);
  let teamLogoInputRef: HTMLInputElement | null = null;

  async function handleTeamLogoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      try {
        formTeamLogoUrl = await compressImageFile(file, 300, 300, 0.85);
      } catch (err) {
        console.error('Error compressing team logo:', err);
      }
    }
  }

  // User Form Modal State
  let showUserForm = $state<boolean>(false);
  let isEditingUser = $state<boolean>(false);
  let editUserId = $state<string | null>(null);
  let formUserName = $state<string>('');
  let formUserUsername = $state<string>('');
  let formUserEmail = $state<string>('');
  let formUserRole = $state<'superadmin' | 'coach' | 'analyst' | 'player'>('coach');
  let formUserTeamId = $state<string>('team_paser');
  let formUserPassword = $state<string>('');
  let showUserPassword = $state<boolean>(false);
  let userFormLoading = $state<boolean>(false);

  // Filter Users
  let filterUserTeam = $state<string>('ALL');
  let filterUserRole = $state<string>('ALL');

  onMount(async () => {
    await matchStore.loadTeams();
    await matchStore.loadUsers();
    await matchStore.loadMatchesList();
  });

  function showSuccess(msg: string) {
    successNotification = msg;
    errorNotification = null;
    setTimeout(() => { successNotification = null; }, 3500);
  }

  function showError(msg: string) {
    errorNotification = msg;
    successNotification = null;
    setTimeout(() => { errorNotification = null; }, 4000);
  }

  // ==================== TEAM HANDLERS ====================
  function openCreateTeamModal() {
    isEditingTeam = false;
    editTeamId = null;
    formTeamName = '';
    formTeamShortName = '';
    formTeamCity = '';
    formTeamLogoUrl = '';
    formTeamStatus = 'ACTIVE';
    showTeamForm = true;
  }

  function openEditTeamModal(team: Team) {
    isEditingTeam = true;
    editTeamId = team.id;
    formTeamName = team.name;
    formTeamShortName = team.shortName || '';
    formTeamCity = team.city || '';
    formTeamLogoUrl = team.logoUrl || '';
    formTeamStatus = team.status;
    showTeamForm = true;
  }

  async function handleSaveTeam(e: Event) {
    e.preventDefault();
    if (!formTeamName.trim()) {
      showError('Nama Tim wajib diisi.');
      return;
    }

    teamFormLoading = true;
    try {
      if (isEditingTeam && editTeamId) {
        await matchStore.updateTeam(editTeamId, {
          name: formTeamName.trim(),
          shortName: formTeamShortName.trim().toUpperCase(),
          city: formTeamCity.trim(),
          logoUrl: formTeamLogoUrl.trim() || '/icon.png',
          status: formTeamStatus
        });
        showSuccess(`Tim "${formTeamName}" berhasil diperbarui!`);
      } else {
        await matchStore.createTeam({
          name: formTeamName.trim(),
          shortName: formTeamShortName.trim().toUpperCase(),
          city: formTeamCity.trim(),
          logoUrl: formTeamLogoUrl.trim() || '/icon.png',
          status: formTeamStatus
        });
        showSuccess(`Tim baru "${formTeamName}" berhasil didaftarkan!`);
      }
      showTeamForm = false;
    } catch (err: any) {
      showError(err.message || 'Gagal menyimpan data tim.');
    } finally {
      teamFormLoading = false;
    }
  }

  async function handleDeleteTeam(team: Team) {
    if (!confirm(`Hapus tim "${team.name}"? Semua data yang berelasi mungkin akan terpengaruh.`)) return;
    try {
      await matchStore.deleteTeam(team.id);
      showSuccess(`Tim "${team.name}" berhasil dihapus.`);
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus tim.');
    }
  }

  async function handleSwitchToTeam(teamId: string) {
    await matchStore.switchTeam(teamId);
    showSuccess(`Beralih ke ruang kerja: ${matchStore.currentTeamName}`);
  }

  // ==================== USER HANDLERS ====================
  function openCreateUserModal() {
    isEditingUser = false;
    editUserId = null;
    formUserName = '';
    formUserUsername = '';
    formUserEmail = '';
    formUserRole = 'coach';
    formUserTeamId = matchStore.teamsList[0]?.id || 'team_paser';
    formUserPassword = '';
    showUserForm = true;
  }

  function openEditUserModal(user: User) {
    isEditingUser = true;
    editUserId = user.id;
    formUserName = user.name;
    formUserUsername = user.username;
    formUserEmail = user.email || '';
    formUserRole = user.role as any;
    formUserTeamId = user.teamId || matchStore.teamsList[0]?.id || 'team_paser';
    formUserPassword = '';
    showUserForm = true;
  }

  async function handleSaveUser(e: Event) {
    e.preventDefault();
    if (!formUserName.trim() || !formUserUsername.trim()) {
      showError('Nama dan Username wajib diisi.');
      return;
    }
    if (!isEditingUser && !formUserPassword) {
      showError('Kata sandi wajib diisi untuk pengguna baru.');
      return;
    }

    userFormLoading = true;
    try {
      if (isEditingUser && editUserId) {
        const payload: any = {
          name: formUserName.trim(),
          username: formUserUsername.trim().toLowerCase(),
          email: formUserEmail.trim(),
          role: formUserRole,
          teamId: formUserRole === 'superadmin' ? undefined : formUserTeamId
        };
        if (formUserPassword) payload.password = formUserPassword;
        await matchStore.updateUser(editUserId, payload);
        showSuccess(`Akun "${formUserName}" berhasil diperbarui!`);
      } else {
        await matchStore.createUser({
          name: formUserName.trim(),
          username: formUserUsername.trim().toLowerCase(),
          email: formUserEmail.trim(),
          role: formUserRole,
          teamId: formUserRole === 'superadmin' ? undefined : formUserTeamId,
          password: formUserPassword
        });
        showSuccess(`Akun pengguna "${formUserName}" berhasil dibuat!`);
      }
      showUserForm = false;
    } catch (err: any) {
      showError(err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      userFormLoading = false;
    }
  }

  async function handleDeleteUser(user: User) {
    if (user.role === 'superadmin' && matchStore.usersList.filter(u => u.role === 'superadmin').length <= 1) {
      showError('Tidak dapat menghapus satu-satunya akun Super Admin.');
      return;
    }
    if (!confirm(`Hapus akun pengguna @${user.username} (${user.name})?`)) return;
    try {
      await matchStore.deleteUser(user.id);
      showSuccess(`Akun @${user.username} berhasil dihapus.`);
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus pengguna.');
    }
  }

  // Derived filtered lists
  let filteredTeams = $derived.by(() => {
    let list = matchStore.teamsList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => t.name.toLowerCase().includes(q) || (t.city && t.city.toLowerCase().includes(q)));
    }
    return list;
  });

  let filteredUsers = $derived.by(() => {
    let list = matchStore.usersList;
    if (filterUserTeam !== 'ALL') {
      list = list.filter(u => u.teamId === filterUserTeam || (filterUserTeam === 'system' && !u.teamId));
    }
    if (filterUserRole !== 'ALL') {
      list = list.filter(u => u.role === filterUserRole);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.username.toLowerCase().includes(q) || 
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return list;
  });
</script>

<div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="presentation">
  <div class="superadmin-card">
    
    <!-- Top Header -->
    <div class="modal-header">
      <div class="header-left">
        <div class="crown-badge">
          <Crown size={22} class="text-amber-400" />
        </div>
        <div>
          <div class="title-row">
            <h2 class="modal-title">SUPER ADMIN PORTAL</h2>
            <span class="badge-master">Multi-Tenant Owner</span>
          </div>
          <p class="modal-subtitle">Manajemen Organisasi Tim, Hak Akses Akun, dan Pengawasan Isolasi Data Statistik.</p>
        </div>
      </div>
      <button class="btn-close" onclick={onClose} title="Tutup Portal">
        <X size={20} />
      </button>
    </div>

    <!-- Notification Banners -->
    {#if successNotification}
      <div class="notif-banner success">
        <CheckCircle2 size={16} />
        <span>{successNotification}</span>
      </div>
    {/if}
    {#if errorNotification}
      <div class="notif-banner error">
        <AlertCircle size={16} />
        <span>{errorNotification}</span>
      </div>
    {/if}

    <!-- Stat Overview Row -->
    <div class="stats-overview-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap icon-teams">
          <Building2 size={20} />
        </div>
        <div>
          <div class="stat-value">{matchStore.teamsList.length}</div>
          <div class="stat-label">Total Tim / Klub</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap icon-users">
          <Users size={20} />
        </div>
        <div>
          <div class="stat-value">{matchStore.usersList.length}</div>
          <div class="stat-label">Total Pengguna Terdaftar</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap icon-active">
          <Activity size={20} />
        </div>
        <div>
          <div class="stat-value text-sky-400">{matchStore.currentTeamName}</div>
          <div class="stat-label">Ruang Tim Sedang Aktif</div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-nav-bar">
      <div class="tabs-left">
        <button 
          class="tab-item {activeTab === 'teams' ? 'active' : ''}" 
          onclick={() => (activeTab = 'teams')}>
          <Building2 size={16} />
          <span>Daftar Tim / Klub ({matchStore.teamsList.length})</span>
        </button>

        <button 
          class="tab-item {activeTab === 'users' ? 'active' : ''}" 
          onclick={() => (activeTab = 'users')}>
          <Users size={16} />
          <span>Pengguna & Akun Staf ({matchStore.usersList.length})</span>
        </button>

        <button 
          class="tab-item {activeTab === 'privacy' ? 'active' : ''}" 
          onclick={() => (activeTab = 'privacy')}>
          <Shield size={16} />
          <span>Isolasi Data & Keamanan</span>
        </button>
      </div>

      <div class="tabs-right">
        {#if activeTab === 'teams'}
          <button class="btn-primary-action" onclick={openCreateTeamModal}>
            <Plus size={16} />
            <span>Tambah Tim Baru</span>
          </button>
        {:else if activeTab === 'users'}
          <button class="btn-primary-action" onclick={openCreateUserModal}>
            <Plus size={16} />
            <span>Tambah Pengguna</span>
          </button>
        {/if}
      </div>
    </div>

    <!-- TAB 1: TEAMS MANAGEMENT -->
    {#if activeTab === 'teams'}
      <div class="tab-body">
        <div class="filter-search-bar">
          <div class="search-input-wrap">
            <Search size={16} class="search-icon" />
            <input 
              type="text" 
              bind:value={searchQuery} 
              placeholder="Cari nama tim atau kota asal..." 
            />
          </div>
        </div>

        <div class="table-container">
          <table class="super-table">
            <thead>
              <tr>
                <th>Logo & Nama Tim</th>
                <th>Singkatan</th>
                <th>Kota / Asal</th>
                <th>Status Lisensi</th>
                <th>Pengguna Terkait</th>
                <th class="text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredTeams as team (team.id)}
                {@const userCount = matchStore.usersList.filter(u => u.teamId === team.id).length}
                {@const isCurrentActive = matchStore.activeTeamId === team.id}
                <tr class="{isCurrentActive ? 'row-active-team' : ''}">
                  <td>
                    <div class="team-cell">
                      <div class="team-emblem-wrap">
                        <img src={team.logoUrl || '/icon.png'} alt={team.name} class="team-emblem" />
                      </div>
                      <div>
                        <div class="team-name-text">
                          {team.name}
                          {#if isCurrentActive}
                            <span class="active-badge">Ruang Kerja Aktif</span>
                          {/if}
                        </div>
                        <span class="team-id-sub">ID: {team.id}</span>
                      </div>
                    </div>
                  </td>
                  <td><span class="tag-shortname">{team.shortName || '-'}</span></td>
                  <td>{team.city || '-'}</td>
                  <td>
                    {#if team.status === 'ACTIVE'}
                      <span class="badge-status-active">
                        <CheckCircle2 size={12} /> AKTIF
                      </span>
                    {:else}
                      <span class="badge-status-inactive">
                        <XCircle size={12} /> NON-AKTIF
                      </span>
                    {/if}
                  </td>
                  <td>
                    <span class="text-muted-sm">{userCount} Akun Staf</span>
                  </td>
                  <td>
                    <div class="action-btn-group">
                      <button 
                        class="btn-switch-team" 
                        title="Masuk ke Workspace Tim ini"
                        onclick={() => handleSwitchToTeam(team.id)}>
                        <ArrowRightLeft size={14} />
                        <span>{isCurrentActive ? 'Terpilih' : 'Masuk Tim'}</span>
                      </button>
                      <button 
                        class="btn-icon-action" 
                        title="Edit Data Tim"
                        onclick={() => openEditTeamModal(team)}>
                        <Edit2 size={15} />
                      </button>
                      <button 
                        class="btn-icon-action btn-delete" 
                        title="Hapus Tim"
                        onclick={() => handleDeleteTeam(team)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
              {#if filteredTeams.length === 0}
                <tr>
                  <td colspan="6" class="text-center py-6 text-muted">
                    Tidak ada data tim yang sesuai pencarian.
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- TAB 2: USERS MANAGEMENT -->
    {#if activeTab === 'users'}
      <div class="tab-body">
        <div class="filter-search-bar">
          <div class="search-input-wrap">
            <Search size={16} class="search-icon" />
            <input 
              type="text" 
              bind:value={searchQuery} 
              placeholder="Cari nama, username, atau email pengguna..." 
            />
          </div>

          <div class="filter-select-group">
            <select bind:value={filterUserTeam} class="filter-select">
              <option value="ALL">Semua Tim</option>
              <option value="system">👑 Super Admin (Global)</option>
              {#each matchStore.teamsList as team}
                <option value={team.id}>{team.name}</option>
              {/each}
            </select>

            <select bind:value={filterUserRole} class="filter-select">
              <option value="ALL">Semua Role</option>
              <option value="superadmin">👑 Super Admin</option>
              <option value="coach">👔 Head Coach</option>
              <option value="analyst">📊 Match Analyst</option>
              <option value="player">⚽ Player</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="super-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Username</th>
                <th>Role & Izin</th>
                <th>Naungan Tim</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredUsers as user (user.id)}
                {@const teamObj = matchStore.teamsList.find(t => t.id === user.teamId)}
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar-circle">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div class="user-name-text">{user.name}</div>
                        <span class="user-email-text">{user.email || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="username-code">@{user.username}</span>
                  </td>
                  <td>
                    {#if user.role === 'superadmin' || user.role === 'admin'}
                      <span class="badge-role role-superadmin">👑 Super Admin</span>
                    {:else if user.role === 'coach'}
                      <span class="badge-role role-coach">👔 Head Coach</span>
                    {:else if user.role === 'analyst'}
                      <span class="badge-role role-analyst">📊 Match Analyst</span>
                    {:else}
                      <span class="badge-role role-player">⚽ Squad Player</span>
                    {/if}
                  </td>
                  <td>
                    {#if user.role === 'superadmin'}
                      <span class="tag-global-scope">🌍 Seluruh Sistem</span>
                    {:else if teamObj}
                      <div class="team-mini-chip">
                        <img src={teamObj.logoUrl || '/icon.png'} alt={teamObj.name} class="mini-logo" />
                        <span>{teamObj.name}</span>
                      </div>
                    {:else}
                      <span class="text-muted-sm">{user.teamName || 'Tim Default'}</span>
                    {/if}
                  </td>
                  <td>
                    <div class="action-btn-group">
                      <button 
                        class="btn-icon-action" 
                        title="Edit Pengguna"
                        onclick={() => openEditUserModal(user)}>
                        <Edit2 size={15} />
                      </button>
                      <button 
                        class="btn-icon-action btn-delete" 
                        title="Hapus Pengguna"
                        onclick={() => handleDeleteUser(user)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
              {#if filteredUsers.length === 0}
                <tr>
                  <td colspan="5" class="text-center py-6 text-muted">
                    Tidak ada pengguna yang cocok dengan kriteria filter.
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- TAB 3: DATA PRIVACY & ISOLATION CHECKER -->
    {#if activeTab === 'privacy'}
      <div class="tab-body privacy-container">
        <div class="privacy-hero-card">
          <div class="privacy-icon-box">
            <Shield size={36} class="text-sky-400" />
          </div>
          <div class="privacy-hero-content">
            <h3>Arsitektur Isolasi Data Multi-Tenant (Tactic Confidentiality)</h3>
            <p>
              Setiap tim memiliki ruang database terisolasi. Analisis rotasi paket, turnover pemain, evaluasi kelemahan, dan catatan taktik <strong>100% rahasia</strong> dan tidak dapat diakses oleh tim lain meskipun mereka bertanding di laga yang sama.
            </p>
          </div>
        </div>

        <div class="privacy-demo-grid">
          <div class="privacy-box box-paser">
            <div class="privacy-box-header">
              <img src="/icon.png" alt="Porprov Paser" class="privacy-team-img" />
              <div>
                <h4>Porprov Paser</h4>
                <span class="scope-label">Tenant ID: <code>team_paser</code></span>
              </div>
            </div>
            <ul class="privacy-features-list">
              <li>🔒 <strong>Master Squad:</strong> 20+ Pemain Terdaftar Paser</li>
              <li>🔒 <strong>Rotasi Paket:</strong> Formula Paket 1-4 Khusus Paser</li>
              <li>🔒 <strong>Statistik Privat:</strong> Rekap Turnover & Recovery Paser</li>
              <li>🚫 <strong>Data Lawan:</strong> Tidak dapat melihat dapur Nazara FC</li>
            </ul>
            <button class="btn-simulate" onclick={() => handleSwitchToTeam('team_paser')}>
              Simulasi Sebagai Porprov Paser
            </button>
          </div>

          <div class="privacy-divider-col">
            <div class="wall-badge">
              <Lock size={16} />
              <span>DINDING ISOLASI</span>
            </div>
          </div>

          <div class="privacy-box box-nazara">
            <div class="privacy-box-header">
              <img src="/icon.png" alt="Nazara FC" class="privacy-team-img" />
              <div>
                <h4>Nazara FC</h4>
                <span class="scope-label">Tenant ID: <code>team_nazara</code></span>
              </div>
            </div>
            <ul class="privacy-features-list">
              <li>🔒 <strong>Master Squad:</strong> Pemain Resmi Nazara FC</li>
              <li>🔒 <strong>Rotasi Paket:</strong> Formula Paket Khusus Nazara FC</li>
              <li>🔒 <strong>Statistik Privat:</strong> Rekap Taktis Nazara FC</li>
              <li>🚫 <strong>Data Lawan:</strong> Tidak dapat melihat dapur Porprov Paser</li>
            </ul>
            <button class="btn-simulate btn-nazara-sim" onclick={() => handleSwitchToTeam('team_nazara')}>
              Simulasi Sebagai Nazara FC
            </button>
          </div>
        </div>
      </div>
    {/if}

  </div>
</div>

<!-- MODAL FORM: CREATE / EDIT TEAM -->
{#if showTeamForm}
  <div class="modal-backdrop sub-modal" onclick={(e) => { if (e.target === e.currentTarget) showTeamForm = false; }} role="presentation">
    <div class="form-modal-card">
      <div class="form-modal-header">
        <div class="flex items-center gap-2">
          <Building2 size={18} class="text-sky-400" />
          <h3 class="form-modal-title">{isEditingTeam ? 'Edit Data Tim' : 'Tambah Tim / Klub Baru'}</h3>
        </div>
        <button class="btn-close-sm" onclick={() => (showTeamForm = false)}><X size={16} /></button>
      </div>

      <form class="form-body" onsubmit={handleSaveTeam}>
        <div class="form-group">
          <label for="team-name">Nama Lengkap Tim / Klub *</label>
          <input 
            id="team-name"
            type="text" 
            bind:value={formTeamName} 
            placeholder="Contoh: Porprov Paser, Nazara FC..." 
            required 
          />
        </div>

        <!-- Logo Tim Upload & Preview -->
        <div class="form-group">
          <label for="team-logo-url">Logo Tim / Lambang Klub</label>
          <div class="team-logo-upload-box">
            <div class="logo-preview-square">
              <img src={formTeamLogoUrl || '/icon.png'} alt="Preview" class="logo-img-preview" />
            </div>
            <div class="logo-upload-controls">
              <button 
                type="button" 
                class="btn-upload-logo-file" 
                onclick={() => teamLogoInputRef?.click()}>
                <Camera size={14} /> Unggah File Logo
              </button>
              <input 
                type="file" 
                accept="image/*" 
                class="hidden-file-input" 
                bind:this={teamLogoInputRef} 
                onchange={handleTeamLogoSelect} 
              />
              <input 
                id="team-logo-url"
                type="text" 
                bind:value={formTeamLogoUrl} 
                placeholder="Atau tempel URL gambar logo..." 
                class="input-logo-url"
              />
            </div>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="team-short">Singkatan Tim (3-6 Huruf)</label>
            <input 
              id="team-short"
              type="text" 
              bind:value={formTeamShortName} 
              placeholder="Contoh: PASER, NZR..." 
              maxlength="8"
            />
          </div>

          <div class="form-group">
            <label for="team-city">Kota / Asal Klub</label>
            <input 
              id="team-city"
              type="text" 
              bind:value={formTeamCity} 
              placeholder="Contoh: Kabupaten Paser" 
            />
          </div>
        </div>

        <div class="form-group">
          <label for="team-status">Status Lisensi Tim</label>
          <select id="team-status" bind:value={formTeamStatus} class="form-select">
            <option value="ACTIVE">AKTIF (Dapat Mengakses & Menganalisis)</option>
            <option value="INACTIVE">NON-AKTIF (Dibekukan Sementara)</option>
          </select>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick={() => (showTeamForm = false)}>Batal</button>
          <button type="submit" class="btn-submit-form" disabled={teamFormLoading}>
            {teamFormLoading ? 'Menyimpan...' : (isEditingTeam ? 'Simpan Perubahan' : 'Daftarkan Tim')}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- MODAL FORM: CREATE / EDIT USER -->
{#if showUserForm}
  <div class="modal-backdrop sub-modal" onclick={(e) => { if (e.target === e.currentTarget) showUserForm = false; }} role="presentation">
    <div class="form-modal-card">
      <div class="form-modal-header">
        <div class="flex items-center gap-2">
          <UserIcon size={18} class="text-sky-400" />
          <h3 class="form-modal-title">{isEditingUser ? 'Edit Pengguna' : 'Tambah Akun Pengguna Baru'}</h3>
        </div>
        <button class="btn-close-sm" onclick={() => (showUserForm = false)}><X size={16} /></button>
      </div>

      <form class="form-body" onsubmit={handleSaveUser}>
        <div class="form-group">
          <label for="user-name">Nama Lengkap Pengguna *</label>
          <input 
            id="user-name"
            type="text" 
            bind:value={formUserName} 
            placeholder="Contoh: Coach Achmad Reza Fahlefi" 
            required 
          />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="user-username">Username Login *</label>
            <input 
              id="user-username"
              type="text" 
              bind:value={formUserUsername} 
              placeholder="Contoh: coach_paser" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="user-email">Email</label>
            <input 
              id="user-email"
              type="email" 
              bind:value={formUserEmail} 
              placeholder="email@klub.com" 
            />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="user-role">Role / Peran *</label>
            <select id="user-role" bind:value={formUserRole} class="form-select">
              <option value="coach">👑 Head Coach (Pelatih)</option>
              <option value="analyst">📊 Match Analyst & Scorer</option>
              <option value="player">⚽ Squad Player (Read Only)</option>
              <option value="superadmin">🛡️ Super Admin (Platform Owner)</option>
            </select>
          </div>

          {#if formUserRole !== 'superadmin'}
            <div class="form-group">
              <label for="user-team">Ditempatkan di Tim *</label>
              <select id="user-team" bind:value={formUserTeamId} class="form-select">
                {#each matchStore.teamsList as t}
                  <option value={t.id}>{t.name}</option>
                {/each}
              </select>
            </div>
          {/if}
        </div>

        <div class="form-group">
          <label for="user-password">
            Kata Sandi / Password {isEditingUser ? '(Biarkan kosong jika tidak diubah)' : '*'}
          </label>
          <div class="input-password-wrap">
            <input 
              id="user-password"
              type={showUserPassword ? 'text' : 'password'} 
              bind:value={formUserPassword} 
              placeholder={isEditingUser ? 'Masukkan sandi baru...' : 'Masukkan kata sandi...'} 
              required={!isEditingUser}
            />
            <button 
              type="button" 
              class="btn-eye-toggle" 
              onclick={() => (showUserPassword = !showUserPassword)}>
              {#if showUserPassword}<EyeOff size={15} />{:else}<Eye size={15} />{/if}
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick={() => (showUserForm = false)}>Batal</button>
          <button type="submit" class="btn-submit-form" disabled={userFormLoading}>
            {userFormLoading ? 'Menyimpan...' : (isEditingUser ? 'Simpan Perubahan' : 'Buat Akun')}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(4, 9, 18, 0.88);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    padding: 1rem;
    animation: fadeIn 0.18s ease-out;
  }

  .sub-modal {
    z-index: 100000;
    background: rgba(2, 6, 12, 0.92);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  .superadmin-card {
    background: #09121f;
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 16px;
    width: 100%;
    max-width: 1060px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.15);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.75rem;
    background: linear-gradient(90deg, #0e1d33 0%, #0c1728 100%);
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .crown-badge {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.05) 100%);
    border: 1px solid rgba(245, 158, 11, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .badge-master {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 8px;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fbbf24;
    border-radius: 999px;
  }

  .modal-subtitle {
    margin: 3px 0 0 0;
    font-size: 0.78rem;
    color: #94a3b8;
  }

  .btn-close {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  /* Notif Banners */
  .notif-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0.75rem 1.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    animation: fadeIn 0.2s ease-out;
  }

  .notif-banner.success {
    background: rgba(34, 197, 94, 0.15);
    border-bottom: 1px solid rgba(34, 197, 94, 0.3);
    color: #86efac;
  }

  .notif-banner.error {
    background: rgba(239, 68, 68, 0.15);
    border-bottom: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  /* Stats Grid */
  .stats-overview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    padding: 1.25rem 1.75rem;
    background: rgba(10, 18, 32, 0.6);
    border-bottom: 1px solid rgba(156, 179, 204, 0.1);
  }

  .stat-card {
    background: rgba(15, 25, 45, 0.65);
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-radius: 12px;
    padding: 0.9rem 1.1rem;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .stat-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-teams { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
  .icon-users { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
  .icon-active { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }

  .stat-value {
    font-size: 1.2rem;
    font-weight: 800;
    color: #f8fafc;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 0.72rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Nav Tabs */
  .tabs-nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 1.75rem;
    background: rgba(14, 25, 44, 0.95);
    border-bottom: 1px solid rgba(156, 179, 204, 0.12);
  }

  .tabs-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tab-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0.55rem 1rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    color: #94a3b8;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .tab-item:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
  }

  .tab-item.active {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.12);
    border-color: rgba(56, 189, 248, 0.35);
  }

  .btn-primary-action {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.5rem 0.9rem;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 8px;
    color: #ffffff;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);
  }

  .btn-primary-action:hover {
    background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
    border-color: #38bdf8;
    transform: translateY(-1px);
  }

  /* Tab Body */
  .tab-body {
    padding: 1.25rem 1.75rem;
    overflow-y: auto;
    max-height: calc(92vh - 250px);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .filter-search-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .search-input-wrap {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }

  :global(.search-input-wrap .search-icon) {
    position: absolute;
    left: 12px;
    color: #64748b;
  }

  .search-input-wrap input {
    width: 100%;
    padding: 0.6rem 1rem 0.6rem 2.4rem;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.84rem;
  }

  .search-input-wrap input:focus {
    outline: none;
    border-color: #38bdf8;
  }

  .filter-select-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-select {
    padding: 0.55rem 0.8rem;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.82rem;
  }

  /* Table */
  .table-container {
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-radius: 10px;
    overflow: hidden;
    background: rgba(12, 20, 35, 0.7);
  }

  .super-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84rem;
    text-align: left;
  }

  .super-table th {
    background: rgba(15, 27, 48, 0.9);
    padding: 0.75rem 1rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  .super-table td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.08);
    color: #cbd5e1;
    vertical-align: middle;
  }

  .row-active-team {
    background: rgba(56, 189, 248, 0.06);
  }

  .team-cell, .user-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .team-emblem-wrap {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .team-emblem {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .team-name-text {
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .active-badge {
    font-size: 0.64rem;
    background: rgba(34, 197, 94, 0.18);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.4);
    padding: 1px 6px;
    border-radius: 999px;
    font-weight: 700;
  }

  .team-id-sub {
    font-size: 0.7rem;
    color: #64748b;
    font-family: monospace;
  }

  .tag-shortname {
    font-family: monospace;
    font-weight: 700;
    background: rgba(148, 163, 184, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    color: #cbd5e1;
  }

  .badge-status-active {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #4ade80;
    border-radius: 6px;
  }

  .badge-status-inactive {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
    border-radius: 6px;
  }

  .action-btn-group {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }

  .btn-switch-team {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0.4rem 0.75rem;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 6px;
    color: #38bdf8;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-switch-team:hover {
    background: rgba(56, 189, 248, 0.25);
    border-color: #38bdf8;
  }

  .btn-icon-action {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(148, 163, 184, 0.15);
    color: #94a3b8;
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .btn-icon-action:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }

  .btn-delete:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.4);
  }

  /* User items */
  .user-avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    color: #ffffff;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
  }

  .user-name-text {
    font-weight: 700;
    color: #f8fafc;
  }

  .user-email-text {
    font-size: 0.72rem;
    color: #64748b;
  }

  .username-code {
    font-family: monospace;
    color: #7dd3fc;
    font-weight: 600;
  }

  .badge-role {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .role-superadmin { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); }
  .role-coach { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); }
  .role-analyst { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.35); }
  .role-player { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35); }

  .team-mini-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.2);
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.78rem;
    color: #cbd5e1;
  }

  .mini-logo {
    width: 14px;
    height: 14px;
    object-fit: contain;
  }

  .tag-global-scope {
    font-size: 0.74rem;
    color: #fbbf24;
    font-weight: 600;
  }

  /* Privacy Tab */
  .privacy-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .privacy-hero-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    background: linear-gradient(135deg, rgba(14, 30, 54, 0.8) 0%, rgba(8, 18, 33, 0.8) 100%);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 14px;
    padding: 1.25rem 1.5rem;
  }

  .privacy-icon-box {
    padding: 8px;
    background: rgba(56, 189, 248, 0.1);
    border-radius: 10px;
  }

  .privacy-hero-content h3 {
    margin: 0 0 0.4rem 0;
    font-size: 1.05rem;
    color: #f8fafc;
    font-weight: 800;
  }

  .privacy-hero-content p {
    margin: 0;
    font-size: 0.84rem;
    color: #94a3b8;
    line-height: 1.5;
  }

  .privacy-demo-grid {
    display: grid;
    grid-template-columns: 1fr 140px 1fr;
    gap: 1rem;
    align-items: center;
  }

  .privacy-box {
    background: rgba(12, 22, 38, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .box-paser {
    border-color: rgba(34, 197, 94, 0.35);
  }

  .box-nazara {
    border-color: rgba(56, 189, 248, 0.35);
  }

  .privacy-box-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .privacy-team-img {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }

  .privacy-box-header h4 {
    margin: 0;
    font-size: 1rem;
    color: #f8fafc;
    font-weight: 800;
  }

  .scope-label {
    font-size: 0.72rem;
    color: #94a3b8;
  }

  .scope-label code {
    background: rgba(0, 0, 0, 0.3);
    padding: 1px 4px;
    border-radius: 4px;
    color: #7dd3fc;
  }

  .privacy-features-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.8rem;
    color: #cbd5e1;
  }

  .privacy-divider-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .wall-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0.8rem 0.6rem;
    background: rgba(239, 68, 68, 0.15);
    border: 1px dashed rgba(239, 68, 68, 0.4);
    border-radius: 10px;
    color: #f87171;
    font-size: 0.68rem;
    font-weight: 800;
    text-align: center;
  }

  .btn-simulate {
    padding: 0.6rem;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    border: 1px solid rgba(74, 222, 128, 0.4);
    border-radius: 8px;
    color: #ffffff;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-simulate:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
  }

  .btn-nazara-sim {
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    border-color: rgba(56, 189, 248, 0.4);
  }

  .btn-nazara-sim:hover {
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
  }

  /* Form Modal */
  .form-modal-card {
    background: #0d1829;
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 14px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
    overflow: hidden;
  }

  .form-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: rgba(15, 27, 48, 0.95);
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  .form-modal-title {
    margin: 0;
    font-size: 0.98rem;
    font-weight: 800;
    color: #f8fafc;
  }

  .btn-close-sm {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px;
  }

  .form-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-group label {
    font-size: 0.74rem;
    font-weight: 700;
    color: #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .form-group input, .form-select {
    width: 100%;
    padding: 0.65rem 0.8rem;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.86rem;
  }

  .form-group input:focus, .form-select:focus {
    outline: none;
    border-color: #38bdf8;
  }

  .form-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .input-password-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-password-wrap input {
    padding-right: 2.2rem;
  }

  .btn-eye-toggle {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
  }

  .form-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 0.5rem;
  }

  .btn-cancel {
    padding: 0.65rem 1rem;
    background: transparent;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 8px;
    color: #94a3b8;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-submit-form {
    padding: 0.65rem 1.25rem;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 8px;
    color: #ffffff;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
  }

  /* Team Logo Upload in Modal */
  .team-logo-upload-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 10px 12px;
  }

  .logo-preview-square {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .logo-img-preview {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .logo-upload-controls {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .btn-upload-logo-file {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    background: rgba(2, 132, 199, 0.2);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-upload-logo-file:hover {
    background: rgba(2, 132, 199, 0.35);
  }

  .input-logo-url {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 0.76rem;
    color: #ffffff;
    width: 100%;
    box-sizing: border-box;
  }

  .hidden-file-input {
    display: none;
  }

  .text-muted-sm {
    font-size: 0.78rem;
    color: #64748b;
  }

  .text-right {
    text-align: right;
  }
</style>
