<script lang="ts">
  import { onMount } from 'svelte';
  import { CloudProvisioner, type CloudHealthReport } from '../lib/cloudProvisioner';
  import { SUPABASE_SQL_SETUP, migrateLocalToSupabase } from '../lib/supabase';
  import { 
    Cloud, 
    ShieldCheck, 
    CheckCircle2, 
    AlertTriangle, 
    X, 
    Copy, 
    UploadCloud, 
    RefreshCw, 
    Database, 
    Terminal, 
    Check, 
    ExternalLink,
    Zap
  } from 'lucide-svelte';

  let { onClose } = $props<{ onClose: () => void }>();

  let report = $state<CloudHealthReport | null>(null);
  let loading = $state<boolean>(true);
  let isMigrating = $state<boolean>(false);
  let migrationResult = $state<any | null>(null);
  let copiedSql = $state<boolean>(false);

  async function runDiagnosis() {
    loading = true;
    try {
      report = await CloudProvisioner.runDiagnostic();
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function handleAutoMigrate() {
    isMigrating = true;
    migrationResult = null;
    try {
      const res = await migrateLocalToSupabase();
      migrationResult = res;
      await runDiagnosis();
    } catch (e: any) {
      migrationResult = { success: false, error: e.message };
    } finally {
      isMigrating = false;
    }
  }

  function copySqlScript() {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP).then(() => {
      copiedSql = true;
      setTimeout(() => (copiedSql = false), 2500);
    });
  }

  onMount(() => {
    runDiagnosis();
  });
</script>

<div 
  class="cloud-diag-overlay" 
  onclick={(e) => { if (e.target === e.currentTarget) onClose(); }} 
  onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
  role="presentation">
  <div class="cloud-diag-card" role="dialog" aria-modal="true" tabindex="-1">
    <!-- Header -->
    <div class="cloud-diag-header">
      <div class="header-left-cd">
        <div class="cloud-icon-bubble">
          <Cloud size={22} class="text-cyan" />
        </div>
        <div>
          <h3>Supabase Cloud Health & Auto-Provisioner</h3>
          <p>Diagnostik kesehatan tabel cloud real-time dan wizard perbaikan schema</p>
        </div>
      </div>
      <button class="btn-close-cd" onclick={onClose}>
        <X size={18} />
      </button>
    </div>

    <!-- Body -->
    <div class="cloud-diag-body">
      {#if loading}
        <div class="diag-loading-box">
          <RefreshCw size={28} class="spin text-cyan mb-2" />
          <p>Mendiagnosis koneksi dan integritas tabel Supabase...</p>
        </div>
      {:else if report}
        <!-- Health Score Strip -->
        <div class="score-strip">
          <div class="score-main">
            <span class="score-num {report.healthScore === 100 ? 'text-emerald' : 'text-amber'}">{report.healthScore}%</span>
            <div class="score-meta">
              <strong>Kesiapan Database Cloud</strong>
              <span>Latency Ping: {report.latencyMs}ms • {report.isConnected ? 'Terhubung' : 'Terputus'}</span>
            </div>
          </div>

          <div class="strip-actions">
            <button class="btn-action-refresh" onclick={runDiagnosis} title="Cek Ulang Status">
              <RefreshCw size={14} /> Cek Status
            </button>
            <button class="btn-action-migrate" onclick={handleAutoMigrate} disabled={isMigrating}>
              <UploadCloud size={14} />
              <span>{isMigrating ? 'Mengunggah Data...' : '1-Klik Migrasi Data Lokal'}</span>
            </button>
          </div>
        </div>

        {#if migrationResult}
          <div class="migration-alert" class:success={migrationResult.success} class:fail={!migrationResult.success}>
            {#if migrationResult.success}
              <CheckCircle2 size={16} /> <span>Data lokal berhasil disinkronkan ke Supabase Cloud!</span>
            {:else}
              <AlertTriangle size={16} /> <span>{migrationResult.error || 'Gagal sinkronisasi data'}</span>
            {/if}
          </div>
        {/if}

        <!-- 8 Tables Status Grid -->
        <div class="tables-status-section">
          <h4 class="section-subhead">Status 8 Tabel Sistem:</h4>
          <div class="tables-grid">
            {#each report.tables as t}
              <div class="table-card" class:ready={t.status === 'READY'} class:missing={t.status === 'MISSING'}>
                <div class="table-card-top">
                  <Database size={15} class={t.status === 'READY' ? 'text-emerald' : 'text-amber'} />
                  <span class="t-status-badge {t.status.toLowerCase()}">{t.status}</span>
                </div>
                <div class="t-name">public.{t.name}</div>
                <div class="t-label">{t.label}</div>
                <div class="t-rows">{t.rowCount} Baris Data</div>
              </div>
            {/each}
          </div>
        </div>

        <!-- SQL Schema Box -->
        <div class="sql-box-card">
          <div class="sql-head">
            <div class="sql-title">
              <Terminal size={14} class="text-cyan" />
              <span>Skrip Inisialisasi SQL Lengkap (Supabase SQL Editor)</span>
            </div>
            <button class="btn-copy-sql" onclick={copySqlScript}>
              {#if copiedSql}
                <Check size={14} class="text-emerald" /> <span>Tersalin!</span>
              {:else}
                <Copy size={14} /> <span>Salin Skrip SQL</span>
              {/if}
            </button>
          </div>
          <pre class="sql-code-preview"><code>{SUPABASE_SQL_SETUP.slice(0, 320)}...</code></pre>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="cloud-diag-footer">
      <button class="btn-cd-done" onclick={onClose}>
        Tutup Diagnostik
      </button>
    </div>
  </div>
</div>

<style>
  .cloud-diag-overlay {
    position: fixed;
    inset: 0;
    background: rgba(4, 9, 20, 0.85);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }

  .cloud-diag-card {
    background: #0d1527;
    border: 1px solid rgba(0, 229, 255, 0.3);
    border-radius: 16px;
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  }

  .cloud-diag-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: rgba(18, 28, 51, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .header-left-cd {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .cloud-icon-bubble {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(0, 229, 255, 0.15);
    border: 1px solid rgba(0, 229, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-left-cd h3 {
    margin: 0;
    font-size: 1rem;
    color: #ffffff;
  }

  .header-left-cd p {
    margin: 2px 0 0 0;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .btn-close-cd {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
  }

  .cloud-diag-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .score-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(18, 28, 51, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 14px 18px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .score-main {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .score-num {
    font-size: 2.2rem;
    font-weight: 900;
  }

  .score-meta {
    display: flex;
    flex-direction: column;
  }

  .score-meta strong {
    font-size: 0.9rem;
    color: #ffffff;
  }

  .score-meta span {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .strip-actions {
    display: flex;
    gap: 8px;
  }

  .btn-action-refresh, .btn-action-migrate {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-action-refresh {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #f1f5f9;
  }

  .btn-action-migrate {
    background: #00e5ff;
    color: #040914;
    border: none;
  }

  .btn-action-migrate:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .migration-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .migration-alert.success {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #10b981;
  }

  .migration-alert.fail {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #ef4444;
  }

  /* TABLES GRID */
  .section-subhead {
    margin: 0 0 10px 0;
    font-size: 0.82rem;
    color: #94a3b8;
  }

  .tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 10px;
  }

  .table-card {
    background: rgba(18, 28, 51, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .table-card.ready {
    border-color: rgba(16, 185, 129, 0.3);
  }

  .table-card.missing {
    border-color: rgba(245, 158, 11, 0.3);
  }

  .table-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .t-status-badge {
    font-size: 0.62rem;
    font-weight: 800;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .t-status-badge.ready { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .t-status-badge.missing { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

  .t-name {
    font-size: 0.78rem;
    font-weight: 700;
    color: #ffffff;
    font-family: monospace;
  }

  .t-label {
    font-size: 0.68rem;
    color: #94a3b8;
  }

  .t-rows {
    font-size: 0.72rem;
    color: #00e5ff;
    font-weight: 600;
    margin-top: 4px;
  }

  /* SQL BOX */
  .sql-box-card {
    background: rgba(4, 9, 20, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 12px;
  }

  .sql-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .sql-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #cbd5e1;
    font-weight: 700;
  }

  .btn-copy-sql {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 229, 255, 0.12);
    border: 1px solid rgba(0, 229, 255, 0.3);
    color: #00e5ff;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
  }

  .sql-code-preview {
    margin: 0;
    background: #060a12;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.7rem;
    color: #94a3b8;
    overflow-x: auto;
  }

  /* FOOTER */
  .cloud-diag-footer {
    padding: 12px 20px;
    background: rgba(7, 12, 22, 0.8);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: flex-end;
  }

  .btn-cd-done {
    background: #00e5ff;
    color: #040914;
    border: none;
    padding: 6px 18px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .text-cyan { color: #00e5ff; }
  .text-emerald { color: #10b981; }
  .text-amber { color: #f59e0b; }
  .mb-2 { margin-bottom: 8px; }
  .diag-loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #94a3b8;
    font-size: 0.82rem;
  }
</style>
