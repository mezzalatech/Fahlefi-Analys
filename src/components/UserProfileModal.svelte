<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { 
    User, 
    Camera, 
    KeyRound, 
    Mail, 
    ShieldCheck, 
    Building, 
    X, 
    Save, 
    Check, 
    AlertCircle,
    Upload,
    Sparkles
  } from 'lucide-svelte';

  import { compressImageFile } from '../lib/imageCompressor';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let name = $state<string>(matchStore.currentUser?.name || '');
  let username = $state<string>(matchStore.currentUser?.username || '');
  let email = $state<string>(matchStore.currentUser?.email || '');
  let avatarUrl = $state<string>(matchStore.currentUser?.avatarUrl || '');
  let newPassword = $state<string>('');
  let confirmPassword = $state<string>('');

  let isSaving = $state<boolean>(false);
  let errorMessage = $state<string | null>(null);
  let successMessage = $state<string | null>(null);
  let fileInputRef: HTMLInputElement | null = null;

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      try {
        errorMessage = null;
        avatarUrl = await compressImageFile(file, 256, 256, 0.85);
      } catch (err) {
        console.error('Error compressing avatar:', err);
      }
    }
  }

  async function handleSaveProfile(e: Event) {
    e.preventDefault();
    errorMessage = null;
    successMessage = null;

    if (!name.trim()) {
      errorMessage = 'Nama Lengkap wajib diisi.';
      return;
    }

    if (newPassword && newPassword.length < 4) {
      errorMessage = 'Kata sandi baru minimal 4 karakter.';
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      errorMessage = 'Konfirmasi kata sandi tidak cocok.';
      return;
    }

    isSaving = true;
    try {
      if (!matchStore.currentUser?.id) throw new Error('User ID tidak ditemukan.');

      await matchStore.updateUser(matchStore.currentUser.id, {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        avatarUrl: avatarUrl.trim(),
        password: newPassword ? newPassword : undefined
      });

      successMessage = 'Profil & Akun berhasil diperbarui!';
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      errorMessage = err.message || 'Gagal menyimpan pembaruan profil.';
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="user-modal-overlay" onclick={onClose} role="presentation">
  <div class="user-modal-card" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
    <!-- Header -->
    <div class="modal-header">
      <div class="header-title-box">
        <div class="icon-bubble">
          <User size={20} class="text-cyan" />
        </div>
        <div>
          <h3>Pengaturan Profil & Akun</h3>
          <p>Kelola identitas staf, foto profil, dan kredensial akses Anda</p>
        </div>
      </div>
      <button class="btn-close-modal" onclick={onClose} title="Tutup Modal">
        <X size={18} />
      </button>
    </div>

    {#if errorMessage}
      <div class="banner-alert error">
        <AlertCircle size={16} />
        <span>{errorMessage}</span>
      </div>
    {/if}

    {#if successMessage}
      <div class="banner-alert success">
        <Check size={16} />
        <span>{successMessage}</span>
      </div>
    {/if}

    <!-- Form -->
    <form onsubmit={handleSaveProfile} class="profile-form">
      <!-- Avatar Section -->
      <div class="avatar-upload-row">
        <div class="avatar-preview-wrapper">
          {#if avatarUrl}
            <img src={avatarUrl} alt="Avatar" class="avatar-img" />
          {:else}
            <div class="avatar-placeholder">
              <User size={36} class="text-slate" />
            </div>
          {/if}
          <button 
            type="button" 
            class="btn-camera-trigger" 
            onclick={() => fileInputRef?.click()}
            title="Unggah Foto Profil Baru">
            <Camera size={14} />
          </button>
          <input 
            type="file" 
            accept="image/*" 
            class="hidden-file-input" 
            bind:this={fileInputRef} 
            onchange={handleFileSelect} 
          />
        </div>

        <div class="avatar-info-box">
          <div class="avatar-badge-role">
            <ShieldCheck size={12} class="text-emerald" />
            <span>ROLE: {(matchStore.currentUser?.role || 'COACH').toUpperCase()}</span>
          </div>
          <p class="avatar-hint">Format JPG, PNG atau WebP (Maks. 2MB). Foto ini akan muncul pada header dan catatan evaluasi taktik.</p>
          {#if avatarUrl}
            <button type="button" class="btn-remove-avatar" onclick={() => (avatarUrl = '')}>
              Hapus Foto
            </button>
          {/if}
        </div>
      </div>

      <!-- Identity Fields -->
      <div class="form-grid">
        <div class="form-group">
          <label for="prof-name">Nama Lengkap / Panggilan Staf</label>
          <div class="input-wrap">
            <User size={15} class="field-icon" />
            <input 
              id="prof-name"
              type="text" 
              bind:value={name} 
              placeholder="Contoh: Azhar Rahman / Yohan" 
              required 
            />
          </div>
        </div>

        <div class="form-group">
          <label for="prof-user">Username Login</label>
          <div class="input-wrap">
            <span class="field-prefix">@</span>
            <input 
              id="prof-user"
              type="text" 
              bind:value={username} 
              placeholder="username_anda" 
              required 
            />
          </div>
        </div>

        <div class="form-group">
          <label for="prof-email">Alamat Email (Opsional)</label>
          <div class="input-wrap">
            <Mail size={15} class="field-icon" />
            <input 
              id="prof-email"
              type="email" 
              bind:value={email} 
              placeholder="coach@klubfutsal.com" 
            />
          </div>
        </div>

        <div class="form-group">
          <label for="prof-team">Tim / Unit Terafiliasi</label>
          <div class="input-wrap disabled">
            <Building size={15} class="field-icon" />
            <input 
              id="prof-team"
              type="text" 
              value={matchStore.currentTeamName} 
              disabled 
              title="Afiliasi tim dikelola oleh Super Admin"
            />
          </div>
        </div>
      </div>

      <!-- Password Section -->
      <div class="password-box-card">
        <div class="pw-head">
          <KeyRound size={15} class="text-amber" />
          <h4>Ubah Kata Sandi (Kosongkan jika tidak ingin mengubah)</h4>
        </div>
        <div class="pw-inputs-row">
          <div class="form-group">
            <label for="prof-newpw">Kata Sandi Baru</label>
            <input 
              id="prof-newpw"
              type="password" 
              bind:value={newPassword} 
              placeholder="Minimal 4 karakter..." 
            />
          </div>
          <div class="form-group">
            <label for="prof-confpw">Ulangi Kata Sandi Baru</label>
            <input 
              id="prof-confpw"
              type="password" 
              bind:value={confirmPassword} 
              placeholder="Ketik ulang kata sandi..." 
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-footer-actions">
        <button type="button" class="btn-cancel" onclick={onClose}>
          Batal
        </button>
        <button type="submit" class="btn-save-profile" disabled={isSaving}>
          <Save size={16} />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .user-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(2, 6, 23, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: fadeIn 0.15s ease-out;
  }

  .user-modal-card {
    background: #0b1329;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    width: 100%;
    max-width: 580px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    color: #f1f5f9;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    background: rgba(15, 23, 42, 0.6);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .header-title-box {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon-bubble {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(6, 182, 212, 0.15);
    border: 1px solid rgba(6, 182, 212, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-title-box h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    color: #ffffff;
  }

  .header-title-box p {
    margin: 2px 0 0 0;
    font-size: 0.76rem;
    color: #94a3b8;
  }

  .btn-close-modal {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-close-modal:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.4);
  }

  .banner-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .banner-alert.error {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border-bottom: 1px solid rgba(239, 68, 68, 0.25);
  }

  .banner-alert.success {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border-bottom: 1px solid rgba(16, 185, 129, 0.25);
  }

  .profile-form {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* AVATAR */
  .avatar-upload-row {
    display: flex;
    align-items: center;
    gap: 18px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 14px 16px;
  }

  .avatar-preview-wrapper {
    position: relative;
    width: 72px;
    height: 72px;
    flex-shrink: 0;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #06b6d4;
    box-shadow: 0 4px 14px rgba(6, 182, 212, 0.25);
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    border: 2px dashed rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-camera-trigger {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #0284c7;
    color: #ffffff;
    border: 2px solid #0b1329;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    transition: all 0.2s;
  }

  .btn-camera-trigger:hover {
    background: #0ea5e9;
    transform: scale(1.08);
  }

  .hidden-file-input {
    display: none;
  }

  .avatar-info-box {
    flex: 1;
  }

  .avatar-badge-role {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 4px;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }

  .avatar-hint {
    margin: 0;
    font-size: 0.74rem;
    color: #94a3b8;
    line-height: 1.35;
  }

  .btn-remove-avatar {
    margin-top: 6px;
    background: none;
    border: none;
    color: #ef4444;
    font-size: 0.72rem;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  /* FORM GRID */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #cbd5e1;
  }

  .input-wrap {
    display: flex;
    align-items: center;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0 10px;
    transition: all 0.2s;
  }

  .input-wrap:focus-within {
    border-color: #06b6d4;
    box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
  }

  .input-wrap.disabled {
    background: rgba(15, 23, 42, 0.3);
    opacity: 0.7;
  }

  :global(.field-icon) {
    color: #64748b;
    margin-right: 8px;
  }

  .field-prefix {
    color: #64748b;
    font-weight: 700;
    font-size: 0.85rem;
    margin-right: 6px;
  }

  .input-wrap input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    padding: 9px 0;
    color: #ffffff;
    font-size: 0.85rem;
  }

  /* PASSWORD BOX */
  .password-box-card {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 10px;
    padding: 12px 16px;
  }

  .pw-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .pw-head h4 {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: #fbbf24;
  }

  .pw-inputs-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .pw-inputs-row input {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px 12px;
    color: #ffffff;
    font-size: 0.85rem;
    outline: none;
  }

  .pw-inputs-row input:focus {
    border-color: #f59e0b;
  }

  /* FOOTER */
  .modal-footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 6px;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .btn-cancel {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    padding: 9px 18px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .btn-save-profile {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #0284c7, #0369a1);
    border: 1px solid rgba(6, 182, 212, 0.4);
    color: #ffffff;
    padding: 9px 20px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
    transition: all 0.2s;
  }

  .btn-save-profile:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(2, 132, 199, 0.4);
  }

  .btn-save-profile:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  .text-cyan { color: #06b6d4; }
  .text-emerald { color: #10b981; }
  .text-amber { color: #f59e0b; }
  .text-slate { color: #64748b; }
</style>
