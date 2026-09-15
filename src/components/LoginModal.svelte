<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { Shield, UserCheck, Lock, X, Check, Eye, User, Sparkles } from 'lucide-svelte';

  interface Props {
    onClose?: () => void;
  }

  let { onClose } = $props<Props>();

  let username = $state<string>('coach');
  let password = $state<string>('coach123');
  let loading = $state<boolean>(false);
  let errorMessage = $state<string | null>(null);

  const demoAccounts = [
    {
      role: 'coach' as const,
      title: 'Head Coach',
      desc: 'Akses penuh strategi, formasi paket 5-man, & konfigurasi match',
      badge: 'Admin / Coach',
      badgeClass: 'badge-coach',
      user: 'coach',
      pass: 'coach123',
      icon: '👑'
    },
    {
      role: 'analyst' as const,
      title: 'Match Analyst & Scorer',
      desc: 'Pencatatan real-time tag lapangan, shot mapping, fouls & loss',
      badge: 'Operator / Scorer',
      badgeClass: 'badge-analyst',
      user: 'analyst',
      pass: 'analyst123',
      icon: '📊'
    },
    {
      role: 'player' as const,
      title: 'Squad Player / Viewer',
      desc: 'Melihat lembar rekap statistik, papan taktik, & histori rotasi',
      badge: 'Read-Only / Viewer',
      badgeClass: 'badge-player',
      user: 'player',
      pass: 'player123',
      icon: '⚽'
    }
  ];

  async function handleLogin(e?: Event) {
    if (e) e.preventDefault();
    loading = true;
    errorMessage = null;

    try {
      await matchStore.login(username, password);
      if (onClose) onClose();
    } catch (err: any) {
      errorMessage = err.message || 'Login gagal. Periksa username dan password.';
    } finally {
      loading = false;
    }
  }

  function selectDemoAccount(acc: typeof demoAccounts[0]) {
    username = acc.user;
    password = acc.pass;
    matchStore.switchRole(acc.role);
    if (onClose) onClose();
  }
</script>

<div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget && onClose && matchStore.currentUser) onClose(); }} role="presentation">
  <div class="login-modal-card">
    <!-- Header -->
    <div class="modal-header">
      <div class="brand-badge-row">
        <img src="/icon.png" alt="FAHLEFI FFTA" class="modal-emblem" />
        <div>
          <h2 class="modal-title">FAHLEFI FUTSAL TACTICAL</h2>
          <span class="modal-subtitle">Sistem Autentikasi & Hak Akses Tim (RBAC)</span>
        </div>
      </div>
      {#if onClose && matchStore.currentUser}
        <button class="btn-close" onclick={onClose} title="Tutup">
          <X size={18} />
        </button>
      {/if}
    </div>

    <!-- Quick Role Switcher (One-Click) -->
    <div class="quick-roles-section">
      <div class="section-label">
        <Sparkles size={14} class="text-cyan" />
        <span>PILIH PROFIL CEPAT (DEMO 1-KLIK)</span>
      </div>
      <div class="role-grid">
        {#each demoAccounts as acc}
          <button 
            type="button" 
            class="role-card {matchStore.currentUser?.role === acc.role ? 'active-role' : ''}" 
            onclick={() => selectDemoAccount(acc)}>
            <div class="role-card-header">
              <span class="role-icon">{acc.icon}</span>
              <span class="role-badge {acc.badgeClass}">{acc.badge}</span>
            </div>
            <div class="role-card-name">{acc.title}</div>
            <div class="role-card-desc">{acc.desc}</div>
            <div class="role-card-creds">
              <code>{acc.user}</code> • <code>{acc.pass}</code>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <div class="divider">
      <span>atau Masuk dengan Kredensial Khusus</span>
    </div>

    <!-- Login Form -->
    <form class="login-form" onsubmit={handleLogin}>
      {#if errorMessage}
        <div class="error-banner">
          <span>{errorMessage}</span>
        </div>
      {/if}

      <div class="form-group">
        <label for="login-username">Username / ID Pengguna</label>
        <div class="input-wrapper">
          <User size={16} class="input-icon" />
          <input 
            id="login-username" 
            type="text" 
            bind:value={username} 
            placeholder="Masukkan username (coach, analyst, player)..." 
            required 
          />
        </div>
      </div>

      <div class="form-group">
        <label for="login-password">Kata Sandi / Password</label>
        <div class="input-wrapper">
          <Lock size={16} class="input-icon" />
          <input 
            id="login-password" 
            type="password" 
            bind:value={password} 
            placeholder="Masukkan kata sandi..." 
            required 
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-submit" disabled={loading}>
          {#if loading}
            <span class="spinner-small"></span>
            <span>Memverifikasi...</span>
          {:else}
            <UserCheck size={16} />
            <span>Masuk ke Dashboard Futsal</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(6, 11, 20, 0.85);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .login-modal-card {
    background: linear-gradient(145deg, #101d30 0%, #0c1524 60%, #080d18 100%);
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 14px;
    width: 100%;
    max-width: 580px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.12);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    background: rgba(14, 25, 42, 0.9);
    border-bottom: 1px solid rgba(156, 179, 204, 0.18);
  }

  .brand-badge-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .modal-emblem {
    width: 42px;
    height: 42px;
    object-fit: contain;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
  }

  .modal-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #7dd3fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .modal-subtitle {
    font-size: 0.72rem;
    color: #9cb3cc;
  }

  .btn-close {
    background: transparent;
    border: none;
    color: #9cb3cc;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .quick-roles-section {
    padding: 1.25rem 1.5rem 0.75rem;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #7dd3fc;
    margin-bottom: 0.75rem;
  }

  .role-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .role-card {
    background: rgba(18, 32, 54, 0.6);
    border: 1px solid rgba(156, 179, 204, 0.2);
    border-radius: 10px;
    padding: 12px 10px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .role-card:hover {
    background: rgba(24, 44, 74, 0.85);
    border-color: #38bdf8;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  }

  .role-card.active-role {
    background: linear-gradient(145deg, #1b3558 0%, #224370 100%);
    border-color: #38bdf8;
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
  }

  .role-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .role-icon {
    font-size: 1.2rem;
  }

  .role-badge {
    font-size: 0.62rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.03em;
  }

  .badge-coach {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.4);
  }

  .badge-analyst {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.4);
  }

  .badge-player {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  .role-card-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: #ffffff;
  }

  .role-card-desc {
    font-size: 0.65rem;
    color: #9cb3cc;
    line-height: 1.3;
    flex: 1;
  }

  .role-card-creds {
    font-size: 0.62rem;
    color: #64748b;
  }

  .role-card-creds code {
    background: rgba(0, 0, 0, 0.3);
    padding: 1px 4px;
    border-radius: 3px;
    color: #9cb3cc;
  }

  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 1rem 1.5rem 0.5rem;
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .divider::before, .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid rgba(156, 179, 204, 0.15);
  }

  .divider span {
    padding: 0 10px;
  }

  .login-form {
    padding: 1rem 1.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .error-banner {
    background: rgba(244, 63, 94, 0.15);
    border: 1px solid rgba(244, 63, 94, 0.4);
    color: #fda4af;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.78rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .form-group label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #cbd5e1;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  :global(.input-icon) {
    position: absolute;
    left: 12px;
    color: #64748b;
    pointer-events: none;
  }

  .input-wrapper input {
    width: 100%;
    background: rgba(8, 14, 24, 0.85);
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 8px;
    padding: 9px 12px 9px 36px;
    color: #ffffff;
    font-size: 0.85rem;
    outline: none;
    transition: all 0.15s;
  }

  .input-wrapper input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
  }

  .form-actions {
    margin-top: 6px;
  }

  .btn-submit {
    width: 100%;
    background: linear-gradient(135deg, #1e3a5f 0%, #254b7c 100%);
    border: 1px solid #38bdf8;
    color: #ffffff;
    padding: 10px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .btn-submit:hover:not(:disabled) {
    box-shadow: 0 4px 18px rgba(56, 189, 248, 0.4);
    transform: translateY(-1px);
  }

  .spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 600px) {
    .role-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
