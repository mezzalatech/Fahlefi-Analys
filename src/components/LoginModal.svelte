<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { Shield, UserCheck, Lock, X, Eye, EyeOff, User, AlertCircle } from 'lucide-svelte';

  interface Props {
    onClose?: () => void;
  }

  let { onClose } = $props<Props>();

  let username = $state<string>('');
  let password = $state<string>('');
  let showPassword = $state<boolean>(false);
  let loading = $state<boolean>(false);
  let errorMessage = $state<string | null>(null);

  async function handleLogin(e?: Event) {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      errorMessage = 'Mohon masukkan username dan password.';
      return;
    }

    loading = true;
    errorMessage = null;

    try {
      await matchStore.login(username.trim(), password);
      if (onClose) onClose();
    } catch (err: any) {
      errorMessage = err.message || 'Login gagal. Periksa username dan password Anda.';
    } finally {
      loading = false;
    }
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
          <span class="modal-subtitle">Sistem Analisis Multi-Tim & Hak Akses Taktis</span>
        </div>
      </div>
      {#if onClose && matchStore.currentUser}
        <button class="btn-close" onclick={onClose} title="Tutup">
          <X size={18} />
        </button>
      {/if}
    </div>

    <!-- Login Form -->
    <form class="login-form" onsubmit={handleLogin}>
      <div class="form-header-intro">
        <h3 class="form-heading">Masuk ke Ruang Tim</h3>
        <p class="form-subheading">Masukkan kredensial akun Anda. Data statistik & taktik diisolasi khusus untuk tim Anda.</p>
      </div>

      {#if errorMessage}
        <div class="error-banner">
          <AlertCircle size={16} class="text-rose flex-shrink-0" />
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
            placeholder="Masukkan username..." 
            autocomplete="username"
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
            type={showPassword ? 'text' : 'password'} 
            bind:value={password} 
            placeholder="Masukkan kata sandi..." 
            autocomplete="current-password"
            required 
          />
          <button 
            type="button" 
            class="btn-toggle-eye" 
            onclick={() => (showPassword = !showPassword)}
            tabindex="-1"
            title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}>
            {#if showPassword}
              <EyeOff size={16} />
            {:else}
              <Eye size={16} />
            {/if}
          </button>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-submit" disabled={loading}>
          {#if loading}
            <span class="spinner-small"></span>
            <span>Memverifikasi Akses...</span>
          {:else}
            <UserCheck size={17} />
            <span>Masuk ke Dashboard</span>
          {/if}
        </button>
      </div>



      <div class="login-footer-info">
        <Shield size={13} class="text-muted" />
        <span>Pembuatan tim baru & akun resmi dikelola eksklusif oleh Super Administrator.</span>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(6, 11, 20, 0.88);
    backdrop-filter: blur(14px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  .login-modal-card {
    background: linear-gradient(145deg, #101d30 0%, #0c1524 60%, #080d18 100%);
    border: 1px solid rgba(156, 179, 204, 0.25);
    border-radius: 16px;
    width: 100%;
    max-width: 470px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65), 0 0 35px rgba(56, 189, 248, 0.1);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    background: rgba(14, 25, 42, 0.95);
    border-bottom: 1px solid rgba(156, 179, 204, 0.18);
  }

  .brand-badge-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .modal-emblem {
    width: 40px;
    height: 40px;
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
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .login-form {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .form-header-intro {
    text-align: left;
    margin-bottom: 0.15rem;
  }

  .form-heading {
    margin: 0 0 0.25rem 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .form-subheading {
    margin: 0;
    font-size: 0.78rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    padding: 0.75rem 0.9rem;
    border-radius: 8px;
    font-size: 0.82rem;
  }

  .text-rose {
    color: #f87171;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-group label {
    font-size: 0.76rem;
    font-weight: 600;
    color: #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  :global(.input-wrapper .input-icon) {
    position: absolute;
    left: 12px;
    color: #64748b;
    pointer-events: none;
  }

  .input-wrapper input {
    width: 100%;
    padding: 0.72rem 2.5rem 0.72rem 2.4rem;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.88rem;
    font-family: inherit;
    transition: all 0.2s;
  }

  .input-wrapper input:focus {
    outline: none;
    border-color: #38bdf8;
    background: rgba(15, 23, 42, 0.95);
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
  }

  .input-wrapper input::placeholder {
    color: #64748b;
  }

  .btn-toggle-eye {
    position: absolute;
    right: 10px;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
  }

  .btn-toggle-eye:hover {
    color: #e2e8f0;
  }

  .form-actions {
    margin-top: 0.25rem;
  }

  .btn-submit {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0.8rem;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 8px;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(2, 132, 199, 0.35);
    transition: all 0.2s;
  }

  .btn-submit:hover:not(:disabled) {
    background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
    border-color: #38bdf8;
    box-shadow: 0 6px 20px rgba(2, 132, 199, 0.5);
    transform: translateY(-1px);
  }

  .btn-submit:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }



  .spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .login-footer-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.72rem;
    color: #64748b;
    line-height: 1.35;
    margin-top: 0.2rem;
  }

  :global(.text-muted) {
    color: #64748b;
  }
</style>
