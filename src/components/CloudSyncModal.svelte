<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { 
    getStoredSupabaseConfig, 
    saveSupabaseConfig, 
    clearSupabaseConfig, 
    testSupabaseConnection, 
    migrateLocalToSupabase,
    SUPABASE_SQL_SETUP 
  } from '../lib/supabase';
  import { 
    Cloud, 
    CloudOff, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    Copy, 
    UploadCloud, 
    Key, 
    Globe, 
    ExternalLink, 
    X,
    Radio,
    Terminal,
    Check
  } from 'lucide-svelte';

  let config = $state(getStoredSupabaseConfig());
  let inputUrl = $state(config.url);
  let inputKey = $state(config.key);

  let testing = $state(false);
  let testResult = $state<{ ok: boolean; latencyMs?: number; error?: string } | null>(null);

  let migrating = $state(false);
  let migrationResult = $state<any | null>(null);

  let copiedSql = $state(false);
  let showSqlCode = $state(false);

  async function handleSaveAndConnect() {
    testing = true;
    testResult = null;
    saveSupabaseConfig(inputUrl, inputKey);
    
    const res = await testSupabaseConnection();
    testing = false;
    testResult = res;

    if (res.ok) {
      matchStore.cloudStatus = 'connected';
      matchStore.cloudLatency = res.latencyMs || null;
      await matchStore.setupRealtimeSync();
      await matchStore.loadMasterPlayers();
      await matchStore.loadMatch(matchStore.activeMatchId);
    } else {
      matchStore.cloudStatus = 'offline';
    }
  }

  async function handleTestConnection() {
    testing = true;
    testResult = null;
    const res = await testSupabaseConnection();
    testing = false;
    testResult = res;
    if (res.ok) {
      matchStore.cloudStatus = 'connected';
      matchStore.cloudLatency = res.latencyMs || null;
    }
  }

  function handleReset() {
    clearSupabaseConfig();
    inputUrl = '';
    inputKey = '';
    testResult = null;
    migrationResult = null;
    matchStore.cloudStatus = 'unconfigured';
    matchStore.cloudLatency = null;
  }

  async function handleMigrate() {
    migrating = true;
    migrationResult = null;
    const res = await migrateLocalToSupabase();
    migrating = false;
    migrationResult = res;
    if (res.success) {
      await matchStore.loadMasterPlayers();
      await matchStore.loadMatch(matchStore.activeMatchId);
    }
  }

  function copySqlScript() {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    copiedSql = true;
    setTimeout(() => {
      copiedSql = false;
    }, 2500);
  }
</script>

<div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) matchStore.showCloudSyncModal = false; }} role="presentation">
  <div class="cloud-sync-card" role="dialog" aria-modal="true" tabindex="-1">
    <!-- Header -->
    <div class="cloud-card-header">
      <div class="header-title-group">
        <div class="cloud-icon-badge {matchStore.cloudStatus}">
          {#if matchStore.cloudStatus === 'connected'}
            <Cloud size={24} class="text-emerald" />
          {:else if matchStore.cloudStatus === 'connecting'}
            <RefreshCw size={24} class="text-amber spin" />
          {:else}
            <CloudOff size={24} class="text-rose" />
          {/if}
        </div>
        <div>
          <h2 class="cloud-modal-title">Sinkronisasi Cloud Real-Time (Supabase)</h2>
          <p class="cloud-modal-sub">Sinkron instan antara MacBook, iPad, dan smartphone tanpa lag lapangan</p>
        </div>
      </div>
      <button 
        type="button" 
        class="btn-close-modal" 
        onclick={() => matchStore.showCloudSyncModal = false}
        aria-label="Tutup">
        <X size={18} />
      </button>
    </div>

    <!-- Live Status Banner -->
    <div class="status-banner banner-{matchStore.cloudStatus}">
      <div class="status-indicator-dot">
        <span class="ping-circle"></span>
        <span class="solid-circle"></span>
      </div>
      <div class="status-banner-text">
        <div class="status-name">
          {#if matchStore.cloudStatus === 'connected'}
            <strong>TERHUBUNG KE CLOUD REALTIME</strong>
            {#if matchStore.cloudLatency}
              <span class="latency-pill">⚡ Latency {matchStore.cloudLatency}ms</span>
            {/if}
          {:else if matchStore.cloudStatus === 'connecting'}
            <strong>MENGHUBUNGKAN KE SUPABASE...</strong>
          {:else if matchStore.cloudStatus === 'offline'}
            <strong>OFFLINE / GAGAL TERSAMBUNG</strong> (Menggunakan Penyimpanan Lokal)
          {:else}
            <strong>MODE LOKAL</strong> (Belum Dikonfigurasi Cloud)
          {/if}
        </div>
        <div class="status-desc">
          {#if matchStore.cloudStatus === 'connected'}
            Data pemain, taktik, skor, dan rotasi otomatis tersinkron ke semua perangkat secara real-time.
          {:else}
            Data saat ini hanya tersimpan di memori browser perangkat ini. Masukkan konfigurasi Supabase di bawah agar iPad otomatis terhubung.
          {/if}
        </div>
      </div>
    </div>

    <div class="modal-scrollable-body">
      <!-- Form Kredensial Supabase -->
      <div class="settings-group">
        <div class="group-title">
          <Key size={16} class="text-cyan" />
          <span>Kredensial Proyek Supabase</span>
        </div>

        <div class="field-item">
          <label for="sb-url">Project URL (Supabase API Endpoint):</label>
          <div class="input-with-icon">
            <Globe size={15} class="input-icon" />
            <input 
              id="sb-url"
              type="text" 
              bind:value={inputUrl} 
              placeholder="https://xyzabcdefghijklm.supabase.co" 
              class="styled-input" />
          </div>
        </div>

        <div class="field-item">
          <label for="sb-key">Project API Anon Key (Public Key):</label>
          <div class="input-with-icon">
            <Key size={15} class="input-icon" />
            <input 
              id="sb-key"
              type="password" 
              bind:value={inputKey} 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
              class="styled-input" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="credential-actions">
          <button 
            type="button" 
            class="btn-primary-sync" 
            disabled={testing || !inputUrl || !inputKey}
            onclick={handleSaveAndConnect}>
            {#if testing}
              <RefreshCw size={14} class="spin" />
              <span>Menghubungkan...</span>
            {:else}
              <Radio size={14} />
              <span>Simpan & Aktifkan Realtime</span>
            {/if}
          </button>

          <button 
            type="button" 
            class="btn-secondary-sync" 
            disabled={testing || !inputUrl}
            onclick={handleTestConnection}>
            <CheckCircle2 size={14} />
            <span>Test Koneksi</span>
          </button>

          {#if inputUrl || inputKey}
            <button 
              type="button" 
              class="btn-danger-sync" 
              onclick={handleReset}>
              Reset ke Lokal
            </button>
          {/if}
        </div>

        <!-- Result Feedback -->
        {#if testResult}
          <div class="test-feedback {testResult.ok ? 'test-success' : 'test-error'}">
            {#if testResult.ok}
              <CheckCircle2 size={16} />
              <span>Koneksi Supabase Sukses! Latensi respon: <strong>{testResult.latencyMs}ms</strong></span>
            {:else}
              <AlertCircle size={16} />
              <span>{testResult.error}</span>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Migrasi Data MacBook ke Cloud -->
      <div class="settings-group highlight-box">
        <div class="group-title">
          <UploadCloud size={16} class="text-emerald" />
          <span>Migrasikan Data MacBook ke Cloud (1-Klik)</span>
        </div>
        <p class="section-desc">
          Tekan tombol di bawah dari MacBook Anda untuk mengunggah semua <strong>Daftar Pemain Master</strong>, <strong>Laga Pertandingan</strong>, dan <strong>Paket Rotasi</strong> yang sudah Anda buat sebelumnya ke Supabase Cloud, sehingga iPad langsung menerima data lengkap tersebut.
        </p>
        
        <button 
          type="button" 
          class="btn-migrate" 
          disabled={migrating || matchStore.cloudStatus !== 'connected'}
          onclick={handleMigrate}>
          {#if migrating}
            <RefreshCw size={15} class="spin" />
            <span>Mengunggah data ke Cloud Supabase...</span>
          {:else}
            <UploadCloud size={15} />
            <span>Unggah & Migrasikan Semua Data ke Cloud Sekarang</span>
          {/if}
        </button>

        {#if migrationResult}
          <div class="migration-alert {migrationResult.success ? 'alert-success' : 'alert-error'}">
            {#if migrationResult.success}
              <CheckCircle2 size={18} />
              <div>
                <strong>Migrasi Berhasil!</strong>
                <p>
                  {migrationResult.stats.uploadedMaster} Pemain Master, {migrationResult.stats.uploadedMatches} Laga, {migrationResult.stats.uploadedPlayers} Skuad Laga, {migrationResult.stats.uploadedPakets} Paket, dan {migrationResult.stats.uploadedSubs} Pergantian telah aktif di Cloud.
                </p>
              </div>
            {:else}
              <AlertCircle size={18} />
              <div>
                <strong>Gagal Migrasi:</strong> {migrationResult.error}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Quick Step Guide & SQL Setup Script -->
      <div class="settings-group">
        <div class="group-title">
          <Terminal size={16} class="text-cyan" />
          <span>Langkah Cepat Setup Supabase (Gratis & 1 Kali Saja)</span>
        </div>

        <ol class="step-list">
          <li>
            Buka <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" class="link-inline">supabase.com <ExternalLink size={12} /></a> dan buat akun / project baru (100% gratis).
          </li>
          <li>
            Pilih menu <strong>SQL Editor</strong> di dashboard Supabase, klik <em>New Query</em>, salin skrip di bawah dan klik tombol <strong>Run</strong>.
          </li>
          <li>
            Buka menu <strong>Project Settings &rarr; API</strong>, salin <em>Project URL</em> dan <em>anon key</em> ke dalam kotak di atas.
          </li>
        </ol>

        <div class="sql-box-header">
          <button 
            type="button" 
            class="btn-copy-sql {copiedSql ? 'copied' : ''}" 
            onclick={copySqlScript}>
            {#if copiedSql}
              <Check size={14} class="text-emerald" />
              <span>Skrip SQL Berhasil Disalin!</span>
            {:else}
              <Copy size={14} />
              <span>Salin Skrip SQL Supabase (1-Klik)</span>
            {/if}
          </button>
          <button 
            type="button" 
            class="btn-toggle-code" 
            onclick={() => showSqlCode = !showSqlCode}>
            {showSqlCode ? 'Sembunyikan Skrip' : 'Lihat Skrip SQL'}
          </button>
        </div>

        {#if showSqlCode}
          <pre class="sql-preview-box"><code>{SUPABASE_SQL_SETUP}</code></pre>
        {/if}
      </div>
    </div>

    <!-- Footer -->
    <div class="cloud-card-footer">
      <div class="footer-tip">
        💡 <em>Tips:</em> Anda juga bisa menambahkan <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di Environment Variables Vercel agar iPad langsung otomatis terhubung tanpa perlu login ulang.
      </div>
      <button 
        type="button" 
        class="btn-done" 
        onclick={() => matchStore.showCloudSyncModal = false}>
        Selesai
      </button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(4, 9, 20, 0.82);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 16px;
  }

  .cloud-sync-card {
    background: #0f172a;
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 16px;
    width: 100%;
    max-width: 660px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.15);
    color: #e2e8f0;
    overflow: hidden;
  }

  .cloud-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    background: #131d38;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .header-title-group {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .cloud-icon-badge {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .cloud-icon-badge.connected {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.4);
  }

  .cloud-icon-badge.offline {
    background: rgba(244, 63, 94, 0.15);
    border-color: rgba(244, 63, 94, 0.4);
  }

  .cloud-modal-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
  }

  .cloud-modal-sub {
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 2px 0 0;
  }

  .btn-close-modal {
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: all 0.15s ease;
  }

  .btn-close-modal:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.08);
  }

  /* Status Banner */
  .status-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.82rem;
  }

  .banner-connected {
    background: rgba(16, 185, 129, 0.12);
    color: #6ee7b7;
  }

  .banner-connecting {
    background: rgba(245, 158, 11, 0.12);
    color: #fcd34d;
  }

  .banner-offline, .banner-unconfigured {
    background: rgba(244, 63, 94, 0.1);
    color: #fca5a5;
  }

  .status-indicator-dot {
    position: relative;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .solid-circle {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  .ping-circle {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.6;
    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  @keyframes ping {
    75%, 100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  .latency-pill {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    background: rgba(16, 185, 129, 0.25);
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 600;
  }

  .status-desc {
    font-size: 0.76rem;
    opacity: 0.85;
    margin-top: 1px;
  }

  /* Body Scrollable */
  .modal-scrollable-body {
    padding: 20px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .settings-group {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px 18px;
  }

  .highlight-box {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08));
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.92rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 12px;
  }

  .field-item {
    margin-bottom: 12px;
  }

  .field-item label {
    display: block;
    font-size: 0.78rem;
    color: #94a3b8;
    margin-bottom: 5px;
    font-weight: 500;
  }

  .input-with-icon {
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

  .styled-input {
    width: 100%;
    padding: 10px 12px 10px 38px;
    background: #090d16;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.85rem;
    font-family: monospace;
    outline: none;
    transition: all 0.15s ease;
  }

  .styled-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }

  .credential-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }

  .btn-primary-sync {
    background: linear-gradient(135deg, #0284c7, #0369a1);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 9px 16px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    transition: all 0.15s ease;
  }

  .btn-primary-sync:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .btn-secondary-sync {
    background: rgba(255, 255, 255, 0.08);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 9px 14px;
    font-size: 0.82rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
  }

  .btn-secondary-sync:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
  }

  .btn-danger-sync {
    background: transparent;
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 9px 14px;
    font-size: 0.82rem;
    cursor: pointer;
  }

  .btn-danger-sync:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .test-feedback {
    margin-top: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
  }

  .test-success {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #6ee7b7;
  }

  .test-error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  /* Migration */
  .section-desc {
    font-size: 0.8rem;
    color: #94a3b8;
    line-height: 1.5;
    margin: 0 0 14px;
  }

  .btn-migrate {
    width: 100%;
    background: linear-gradient(135deg, #059669, #047857);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 11px 16px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
    transition: all 0.15s ease;
  }

  .btn-migrate:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .btn-migrate:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .migration-alert {
    margin-top: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    display: flex;
    gap: 12px;
    font-size: 0.82rem;
  }

  .alert-success {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #a7f3d0;
  }

  .alert-error {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fecaca;
  }

  /* Step guide */
  .step-list {
    margin: 0 0 14px 18px;
    padding: 0;
    font-size: 0.82rem;
    color: #cbd5e1;
    line-height: 1.6;
  }

  .step-list li {
    margin-bottom: 6px;
  }

  .link-inline {
    color: #38bdf8;
    text-decoration: underline;
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .sql-box-header {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .btn-copy-sql {
    background: #1e293b;
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
  }

  .btn-copy-sql:hover {
    background: rgba(56, 189, 248, 0.15);
  }

  .btn-copy-sql.copied {
    border-color: #10b981;
    color: #10b981;
  }

  .btn-toggle-code {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.78rem;
    cursor: pointer;
    text-decoration: underline;
  }

  .sql-preview-box {
    margin-top: 10px;
    background: #090d16;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 12px;
    max-height: 160px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 0.72rem;
    color: #94a3b8;
    white-space: pre-wrap;
  }

  /* Footer */
  .cloud-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    background: #090d16;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    gap: 16px;
  }

  .footer-tip {
    font-size: 0.75rem;
    color: #64748b;
  }

  .footer-tip code {
    background: rgba(255, 255, 255, 0.06);
    padding: 1px 4px;
    border-radius: 4px;
    color: #38bdf8;
  }

  .btn-done {
    background: #334155;
    color: #f8fafc;
    border: none;
    border-radius: 8px;
    padding: 8px 18px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-done:hover {
    background: #475569;
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  :global(.text-emerald) { color: #10b981; }
  :global(.text-cyan) { color: #06b6d4; }
  :global(.text-amber) { color: #f59e0b; }
  :global(.text-rose) { color: #f43f5e; }
</style>
