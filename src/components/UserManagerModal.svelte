<script lang="ts">
  import { onMount } from 'svelte';
  import { matchStore } from '../lib/store.svelte';
  import type { User } from '../lib/api';
  import { 
    Users, 
    UserPlus, 
    Shield, 
    X, 
    Search, 
    Edit2, 
    Trash2, 
    Key, 
    Check, 
    AlertCircle, 
    Lock, 
    Mail, 
    User as UserIcon,
    RefreshCw,
    ShieldAlert,
    Eye,
    EyeOff
  } from 'lucide-svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose } = $props<Props>();

  let searchQuery = $state<string>('');
  let filterRole = $state<string>('ALL');

  // Form modal state (Create / Edit)
  let showFormModal = $state<boolean>(false);
  let isEditing = $state<boolean>(false);
  let editUserId = $state<string | null>(null);

  let formName = $state<string>('');
  let formUsername = $state<string>('');
  let formEmail = $state<string>('');
  let formRole = $state<'coach' | 'analyst' | 'player' | 'admin'>('coach');
  let formPassword = $state<string>('');
  let showFormPassword = $state<boolean>(false);

  let formLoading = $state<boolean>(false);
  let formError = $state<string | null>(null);
  let successNotification = $state<string | null>(null);

  // Delete confirm state
  let deleteConfirmUser = $state<User | null>(null);
  let deleteLoading = $state<boolean>(false);

  onMount(() => {
    matchStore.loadUsers();
  });

  function getRoleInfo(role: string) {
    switch (role) {
      case 'coach':
        return { label: 'Head Coach / Pelatih', icon: '👑', badgeClass: 'badge-coach' };
      case 'analyst':
        return { label: 'Match Analyst & Scorer', icon: '📊', badgeClass: 'badge-analyst' };
      case 'player':
        return { label: 'Squad Player / Pemain', icon: '⚽', badgeClass: 'badge-player' };
      case 'admin':
        return { label: 'System Admin', icon: '🛡️', badgeClass: 'badge-admin' };
      default:
        return { label: role, icon: '👤', badgeClass: 'badge-default' };
    }
  }

  let filteredUsers = $derived.by(() => {
    let list = matchStore.usersList;
    if (filterRole !== 'ALL') {
      list = list.filter(u => u.role === filterRole);
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

  function openCreateModal() {
    isEditing = false;
    editUserId = null;
    formName = '';
    formUsername = '';
    formEmail = '';
    formRole = 'coach';
    formPassword = '';
    formError = null;
    showFormModal = true;
  }

  function openEditModal(user: User) {
    isEditing = true;
    editUserId = user.id;
    formName = user.name;
    formUsername = user.username;
    formEmail = user.email || '';
    formRole = (user.role as any) || 'coach';
    formPassword = ''; // Optional when editing
    formError = null;
    showFormModal = true;
  }

  async function handleSaveUser(e: Event) {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      formError = 'Nama dan Username wajib diisi.';
      return;
    }

    if (!isEditing && !formPassword) {
      formError = 'Kata sandi / Password wajib diisi untuk pengguna baru.';
      return;
    }

    formLoading = true;
    formError = null;

    try {
      if (isEditing && editUserId) {
        const payload: any = {
          name: formName.trim(),
          username: formUsername.trim().toLowerCase(),
          email: formEmail.trim(),
          role: formRole
        };
        if (formPassword) {
          payload.password = formPassword;
        }
        await matchStore.updateUser(editUserId, payload);
        showSuccess(`Pengguna "${formName}" berhasil diperbarui!`);
      } else {
        await matchStore.createUser({
          name: formName.trim(),
          username: formUsername.trim().toLowerCase(),
          email: formEmail.trim(),
          role: formRole,
          password: formPassword
        });
        showSuccess(`Pengguna "${formName}" berhasil ditambahkan!`);
      }
      showFormModal = false;
    } catch (err: any) {
      formError = err.message || 'Gagal menyimpan data pengguna.';
    } finally {
      formLoading = false;
    }
  }

  async function handleDeleteUser() {
    if (!deleteConfirmUser) return;
    deleteLoading = true;
    try {
      await matchStore.deleteUser(deleteConfirmUser.id);
      showSuccess(`Pengguna "${deleteConfirmUser.name}" berhasil dihapus.`);
      deleteConfirmUser = null;
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengguna.');
    } finally {
      deleteLoading = false;
    }
  }

  function showSuccess(msg: string) {
    successNotification = msg;
    setTimeout(() => {
      if (successNotification === msg) successNotification = null;
    }, 4000);
  }
</script>

<div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget && !showFormModal && !deleteConfirmUser) onClose(); }} role="presentation">
  <div class="user-manager-card">
    <!-- Header -->
    <div class="manager-header">
      <div class="header-left">
        <div class="header-icon-box">
          <Shield size={24} class="text-cyan" />
        </div>
        <div>
          <h2 class="manager-title">Manajemen Hak Akses & Pengguna</h2>
          <p class="manager-subtitle">Kelola akun staf pelatih, analis taktikal, scorer, dan pemain tim</p>
        </div>
      </div>
      <div class="header-actions">
        <button type="button" class="btn-primary-add" onclick={openCreateModal}>
          <UserPlus size={16} />
          <span>Tambah Pengguna</span>
        </button>
        <button type="button" class="btn-close" onclick={onClose} title="Tutup">
          <X size={20} />
        </button>
      </div>
    </div>

    <!-- Success banner -->
    {#if successNotification}
      <div class="success-banner">
        <Check size={16} class="text-emerald" />
        <span>{successNotification}</span>
      </div>
    {/if}

    <!-- Toolbar: Search & Role Filter -->
    <div class="manager-toolbar">
      <div class="search-box">
        <Search size={16} class="search-icon" />
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="Cari berdasarkan nama, username, atau email..." 
        />
        {#if searchQuery}
          <button class="btn-clear-search" onclick={() => (searchQuery = '')}>
            <X size={14} />
          </button>
        {/if}
      </div>

      <div class="role-filter-pills">
        <button 
          type="button" 
          class="pill-btn {filterRole === 'ALL' ? 'pill-active' : ''}" 
          onclick={() => (filterRole = 'ALL')}>
          Semua ({matchStore.usersList.length})
        </button>
        <button 
          type="button" 
          class="pill-btn {filterRole === 'coach' ? 'pill-active' : ''}" 
          onclick={() => (filterRole = 'coach')}>
          👑 Coach ({matchStore.usersList.filter(u => u.role === 'coach').length})
        </button>
        <button 
          type="button" 
          class="pill-btn {filterRole === 'analyst' ? 'pill-active' : ''}" 
          onclick={() => (filterRole = 'analyst')}>
          📊 Analyst ({matchStore.usersList.filter(u => u.role === 'analyst').length})
        </button>
        <button 
          type="button" 
          class="pill-btn {filterRole === 'player' ? 'pill-active' : ''}" 
          onclick={() => (filterRole = 'player')}>
          ⚽ Player ({matchStore.usersList.filter(u => u.role === 'player').length})
        </button>
      </div>
    </div>

    <!-- Users Table Content -->
    <div class="table-container">
      {#if matchStore.loadingUsers}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Memuat daftar pengguna...</p>
        </div>
      {:else if filteredUsers.length === 0}
        <div class="empty-state">
          <Users size={40} class="empty-icon" />
          <h4>Tidak ada pengguna ditemukan</h4>
          <p>Coba gunakan kata kunci pencarian lain atau tambahkan akun pengguna baru.</p>
        </div>
      {:else}
        <table class="users-table">
          <thead>
            <tr>
              <th style="width: 32%;">PENGGUNA / NAMA</th>
              <th style="width: 20%;">USERNAME</th>
              <th style="width: 22%;">HAK AKSES / PERAN</th>
              <th style="width: 14%;">EMAIL</th>
              <th style="width: 12%; text-align: center;">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredUsers as user (user.id)}
              {@const roleInfo = getRoleInfo(user.role)}
              {@const isSelf = matchStore.currentUser?.id === user.id || matchStore.currentUser?.username === user.username}
              <tr class={isSelf ? 'row-self' : ''}>
                <td>
                  <div class="user-cell">
                    <div class="user-avatar-badge">
                      {roleInfo.icon}
                    </div>
                    <div class="user-meta">
                      <div class="user-fullname">
                        <span>{user.name}</span>
                        {#if isSelf}
                          <span class="badge-self">AKUN ANDA</span>
                        {/if}
                      </div>
                      <span class="user-subtext">ID: {user.id}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <code class="username-code">@{user.username}</code>
                </td>
                <td>
                  <span class="role-tag {roleInfo.badgeClass}">
                    <span>{roleInfo.icon}</span>
                    <span>{roleInfo.label}</span>
                  </span>
                </td>
                <td>
                  <span class="email-text">{user.email || '-'}</span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button 
                      type="button" 
                      class="btn-action-edit" 
                      onclick={() => openEditModal(user)}
                      title="Edit Pengguna / Ubah Sandi">
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    {#if !isSelf}
                      <button 
                        type="button" 
                        class="btn-action-delete" 
                        onclick={() => (deleteConfirmUser = user)}
                        title="Hapus Pengguna">
                        <Trash2 size={14} />
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>

    <!-- Footer Summary -->
    <div class="manager-footer">
      <div class="footer-info">
        <span>Menampilkan <strong>{filteredUsers.length}</strong> dari total <strong>{matchStore.usersList.length}</strong> pengguna terdaftar</span>
      </div>
      <button type="button" class="btn-secondary" onclick={onClose}>
        Tutup
      </button>
    </div>
  </div>
</div>

<!-- Modal Form Create / Edit User -->
{#if showFormModal}
  <div class="nested-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget && !formLoading) showFormModal = false; }} role="presentation">
    <div class="form-modal-card">
      <div class="nested-header">
        <div class="nested-title-row">
          <Key size={18} class="text-cyan" />
          <h3>{isEditing ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}</h3>
        </div>
        <button type="button" class="btn-close" onclick={() => (showFormModal = false)} disabled={formLoading}>
          <X size={18} />
        </button>
      </div>

      <form onsubmit={handleSaveUser} class="nested-form">
        {#if formError}
          <div class="error-banner">
            <AlertCircle size={16} class="text-rose flex-shrink-0" />
            <span>{formError}</span>
          </div>
        {/if}

        <div class="form-grid">
          <div class="form-group">
            <label for="form-name">Nama Lengkap *</label>
            <div class="input-wrapper">
              <UserIcon size={16} class="input-icon" />
              <input 
                id="form-name" 
                type="text" 
                bind:value={formName} 
                placeholder="Contoh: Achmad Reza Fahlefi" 
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <label for="form-username">Username *</label>
            <div class="input-wrapper">
              <span class="input-prefix">@</span>
              <input 
                id="form-username" 
                type="text" 
                bind:value={formUsername} 
                placeholder="username (huruf kecil & angka)" 
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <label for="form-email">Email (Opsional)</label>
            <div class="input-wrapper">
              <Mail size={16} class="input-icon" />
              <input 
                id="form-email" 
                type="email" 
                bind:value={formEmail} 
                placeholder="email@fahlefi.com" 
              />
            </div>
          </div>

          <div class="form-group">
            <label for="form-role">Hak Akses / Peran (Role) *</label>
            <select id="form-role" bind:value={formRole} class="select-input">
              <option value="coach">👑 Head Coach (Akses Penuh & Taktik)</option>
              <option value="analyst">📊 Match Analyst & Scorer (Catat Event)</option>
              <option value="player">⚽ Squad Player / Viewer (Lihat Data)</option>
              <option value="admin">🛡️ System Administrator</option>
            </select>
          </div>

          <div class="form-group full-width">
            <label for="form-password">
              Kata Sandi / Password {isEditing ? '(Kosongkan jika tidak ingin diubah)' : '*'}
            </label>
            <div class="input-wrapper">
              <Lock size={16} class="input-icon" />
              <input 
                id="form-password" 
                type={showFormPassword ? 'text' : 'password'} 
                bind:value={formPassword} 
                placeholder={isEditing ? 'Masukkan kata sandi baru untuk mengganti...' : 'Masukkan kata sandi akun...'} 
                required={!isEditing} 
              />
              <button 
                type="button" 
                class="btn-toggle-eye" 
                onclick={() => (showFormPassword = !showFormPassword)}
                tabindex="-1">
                {#if showFormPassword}
                  <EyeOff size={16} />
                {:else}
                  <Eye size={16} />
                {/if}
              </button>
            </div>
          </div>
        </div>

        <div class="nested-footer">
          <button type="button" class="btn-secondary" onclick={() => (showFormModal = false)} disabled={formLoading}>
            Batal
          </button>
          <button type="submit" class="btn-primary-add" disabled={formLoading}>
            {#if formLoading}
              <span class="spinner-small"></span>
              <span>Menyimpan...</span>
            {:else}
              <Check size={16} />
              <span>{isEditing ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal Delete Confirmation -->
{#if deleteConfirmUser}
  <div class="nested-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget && !deleteLoading) deleteConfirmUser = null; }} role="presentation">
    <div class="confirm-modal-card">
      <div class="confirm-header">
        <ShieldAlert size={28} class="text-rose" />
        <div>
          <h3 class="confirm-title">Hapus Pengguna?</h3>
          <p class="confirm-desc">
            Apakah Anda yakin ingin menghapus akun <strong>{deleteConfirmUser.name}</strong> (@{deleteConfirmUser.username})? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
      </div>
      <div class="confirm-actions">
        <button type="button" class="btn-secondary" onclick={() => (deleteConfirmUser = null)} disabled={deleteLoading}>
          Batal
        </button>
        <button type="button" class="btn-danger" onclick={handleDeleteUser} disabled={deleteLoading}>
          {#if deleteLoading}
            <span class="spinner-small"></span>
            <span>Menghapus...</span>
          {:else}
            <Trash2 size={16} />
            <span>Hapus Pengguna</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(6, 11, 20, 0.88);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9990;
    padding: 1.5rem;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.99); }
    to { opacity: 1; transform: scale(1); }
  }

  .user-manager-card {
    background: #0f172a;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 16px;
    width: 100%;
    max-width: 980px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.1);
    overflow: hidden;
  }

  .manager-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.75rem;
    background: #1e293b;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .header-icon-box {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .text-cyan {
    color: #38bdf8;
  }

  .manager-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    color: #f8fafc;
    letter-spacing: -0.01em;
  }

  .manager-subtitle {
    margin: 2px 0 0 0;
    font-size: 0.78rem;
    color: #94a3b8;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn-primary-add {
    display: flex;
    align-items: center;
    gap: 7px;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #ffffff;
    font-size: 0.84rem;
    font-weight: 700;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
    transition: all 0.15s;
  }

  .btn-primary-add:hover:not(:disabled) {
    background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
    border-color: #38bdf8;
    transform: translateY(-1px);
  }

  .btn-close {
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

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .success-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(16, 185, 129, 0.15);
    border-bottom: 1px solid rgba(16, 185, 129, 0.3);
    color: #6ee7b7;
    padding: 0.75rem 1.75rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .text-emerald {
    color: #34d399;
  }

  .manager-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 1rem 1.75rem;
    background: #0b1329;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    flex-wrap: wrap;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 260px;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    color: #64748b;
    pointer-events: none;
  }

  .search-box input {
    width: 100%;
    padding: 0.55rem 2rem 0.55rem 2.2rem;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.85rem;
  }

  .search-box input:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }

  .btn-clear-search {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
  }

  .role-filter-pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .pill-btn {
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.2);
    color: #94a3b8;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .pill-btn:hover {
    color: #f8fafc;
    background: rgba(51, 65, 85, 0.8);
  }

  .pill-btn.pill-active {
    background: rgba(56, 189, 248, 0.18);
    border-color: #38bdf8;
    color: #38bdf8;
  }

  .table-container {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  .users-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .users-table th {
    background: #131d36;
    padding: 0.75rem 1.25rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #94a3b8;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .users-table td {
    padding: 0.9rem 1.25rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.08);
    font-size: 0.84rem;
    color: #cbd5e1;
  }

  .users-table tr:hover {
    background: rgba(30, 41, 59, 0.5);
  }

  .row-self {
    background: rgba(56, 189, 248, 0.04);
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-avatar-badge {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .user-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-fullname {
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .badge-self {
    font-size: 0.62rem;
    font-weight: 800;
    background: #0284c7;
    color: #ffffff;
    padding: 1px 6px;
    border-radius: 4px;
    letter-spacing: 0.04em;
  }

  .user-subtext {
    font-size: 0.7rem;
    color: #64748b;
  }

  .username-code {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.2);
    padding: 3px 8px;
    border-radius: 6px;
    font-family: monospace;
    font-size: 0.82rem;
    color: #7dd3fc;
  }

  .role-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 0.74rem;
    font-weight: 700;
  }

  .badge-coach {
    background: rgba(234, 179, 8, 0.15);
    border: 1px solid rgba(234, 179, 8, 0.35);
    color: #facc15;
  }

  .badge-analyst {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
  }

  .badge-player {
    background: rgba(52, 211, 153, 0.15);
    border: 1px solid rgba(52, 211, 153, 0.35);
    color: #34d399;
  }

  .badge-admin {
    background: rgba(168, 85, 247, 0.15);
    border: 1px solid rgba(168, 85, 247, 0.35);
    color: #c084fc;
  }

  .email-text {
    color: #94a3b8;
    font-size: 0.8rem;
  }

  .actions-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .btn-action-edit {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-action-edit:hover {
    background: rgba(56, 189, 248, 0.2);
    border-color: #38bdf8;
  }

  .btn-action-delete {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
    padding: 5px;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .btn-action-delete:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: #ef4444;
  }

  .empty-state, .loading-state {
    padding: 3.5rem 2rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #94a3b8;
  }

  .empty-icon {
    color: #475569;
    margin-bottom: 0.5rem;
  }

  .empty-state h4 {
    margin: 0;
    color: #f1f5f9;
    font-size: 1rem;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.82rem;
    color: #64748b;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(56, 189, 248, 0.2);
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .manager-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.75rem;
    background: #1e293b;
    border-top: 1px solid rgba(148, 163, 184, 0.15);
  }

  .footer-info {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .btn-secondary {
    background: rgba(51, 65, 85, 0.6);
    border: 1px solid rgba(148, 163, 184, 0.25);
    color: #e2e8f0;
    padding: 0.55rem 1.2rem;
    border-radius: 8px;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(71, 85, 105, 0.8);
    color: #ffffff;
  }

  /* Nested Modals (Form & Confirm) */
  .nested-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(3, 7, 18, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
  }

  .form-modal-card {
    background: #0f172a;
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 14px;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
    overflow: hidden;
  }

  .nested-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: #1e293b;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  .nested-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nested-title-row h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .nested-form {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .full-width {
    grid-column: span 2;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .form-group label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  :global(.input-wrapper .input-icon) {
    position: absolute;
    left: 10px;
    color: #64748b;
    pointer-events: none;
  }

  .input-prefix {
    position: absolute;
    left: 12px;
    color: #64748b;
    font-weight: 700;
    pointer-events: none;
  }

  .input-wrapper input {
    width: 100%;
    padding: 0.6rem 2.2rem 0.6rem 2.2rem;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.85rem;
  }

  .input-wrapper input:focus, .select-input:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }

  .select-input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    background: #0b1329;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.85rem;
  }

  .btn-toggle-eye {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
  }

  .nested-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(148, 163, 184, 0.1);
  }

  /* Confirm modal */
  .confirm-modal-card {
    background: #0f172a;
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: 14px;
    width: 100%;
    max-width: 440px;
    padding: 1.5rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
  }

  .confirm-header {
    display: flex;
    gap: 14px;
    margin-bottom: 1.25rem;
  }

  .confirm-title {
    margin: 0 0 0.25rem 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .confirm-desc {
    margin: 0;
    font-size: 0.82rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  .confirm-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .btn-danger {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #dc2626;
    border: 1px solid #ef4444;
    color: #ffffff;
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    font-size: 0.8rem;
  }

  .text-rose {
    color: #f87171;
  }

  .spinner-small {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
