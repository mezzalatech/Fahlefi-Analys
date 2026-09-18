<script lang="ts">
  import { onMount } from 'svelte';
  import { matchStore } from '../lib/store.svelte';
  import { voiceEngine, type ParsedVoiceCommand } from '../lib/voiceTacticalEngine';
  import { 
    Mic, 
    MicOff, 
    Sparkles, 
    Zap, 
    CheckCircle2, 
    AlertCircle, 
    Volume2, 
    X,
    Radio,
    HelpCircle,
    Info,
    ArrowRight,
    Play,
    Check
  } from 'lucide-svelte';

  let isListening = $state<boolean>(false);
  let latestCommand = $state<ParsedVoiceCommand | null>(null);
  let errorMessage = $state<string | null>(null);
  let showVoiceModal = $state<boolean>(false);
  let showIntroPopover = $state<boolean>(false);
  let dontShowAgain = $state<boolean>(false);

  // Live test transcript preview inside modal
  let testTranscript = $state<string>('');
  let testParsed = $state<ParsedVoiceCommand | null>(null);

  onMount(() => {
    try {
      const dismissed = localStorage.getItem('ffta_voice_intro_dismissed');
      if (!dismissed) {
        // Show gentle onboarding tooltip to first-time users after 1.5 seconds
        setTimeout(() => {
          showIntroPopover = true;
        }, 1500);
      }
    } catch {}
  });

  function dismissIntro() {
    showIntroPopover = false;
    if (dontShowAgain) {
      try {
        localStorage.setItem('ffta_voice_intro_dismissed', 'true');
      } catch {}
    }
  }

  function toggleVoice() {
    // If intro is still open, close it when mic is clicked
    if (showIntroPopover) {
      dismissIntro();
    }

    isListening = voiceEngine.toggle(
      (cmd) => {
        handleExecuteVoiceCommand(cmd);
      },
      (err) => {
        errorMessage = err;
        setTimeout(() => (errorMessage = null), 3500);
      },
      (active) => {
        isListening = active;
      }
    );
  }

  function handleExecuteVoiceCommand(cmd: ParsedVoiceCommand) {
    latestCommand = cmd;
    testTranscript = cmd.rawTranscript;
    testParsed = cmd;

    if (cmd.intent === 'GOAL') {
      if (cmd.playerNo) {
        matchStore.recordFastTag('shot', 850, 300, cmd.playerNo);
      } else {
        matchStore.updateScore('home', matchStore.activeHalf as any, 1);
      }
    } else if (cmd.intent === 'LOSS') {
      matchStore.recordFastTag('loss', 500, 300, cmd.playerNo);
    } else if (cmd.intent === 'RECOVERY') {
      matchStore.recordFastTag('recover', 500, 300, cmd.playerNo);
    } else if (cmd.intent === 'FOUL') {
      if (cmd.playerNo) {
        matchStore.recordFastTag('foul', 500, 300, cmd.playerNo);
      } else {
        matchStore.incrementFoul('home', matchStore.activeHalf as any);
      }
    } else if (cmd.intent === 'PAKET_DEPLOY' && cmd.paketIndex !== undefined) {
      matchStore.deployPaket(cmd.paketIndex);
    } else if (cmd.intent === 'TIMER_START') {
      matchStore.startTimer();
    } else if (cmd.intent === 'TIMER_STOP') {
      matchStore.pauseTimer();
    } else if (cmd.intent === 'TIMEOUT') {
      matchStore.recordTimeout(cmd.team || 'home');
    }

    setTimeout(() => {
      if (latestCommand?.rawTranscript === cmd.rawTranscript) {
        latestCommand = null;
      }
    }, 3000);
  }

  function testCommandSimulation(sampleText: string) {
    const parsed = voiceEngine.parseTranscript(sampleText);
    handleExecuteVoiceCommand(parsed);
  }
</script>

<!-- Floating Voice Activation Pill on Bottom Right -->
<div class="voice-floating-container">
  <!-- First-Time Friendly Onboarding Tooltip Popover -->
  {#if showIntroPopover && !isListening}
    <div class="voice-intro-popover" role="dialog" aria-modal="false">
      <div class="intro-pop-header">
        <div class="intro-tag">
          <Sparkles size={12} class="text-cyan" />
          <span>FITUR BARU: VOICE TAGGING</span>
        </div>
        <button class="btn-close-pop" onclick={dismissIntro} title="Tutup">
          <X size={14} />
        </button>
      </div>

      <div class="intro-pop-body">
        <h4>🎙️ Analisis Futsal Hands-Free dengan Suara</h4>
        <p>Anda tidak perlu mengetik atau menyentuh layar saat laga berlangsung. Cukup nyalakan mic dan bicara bahasa Indonesia:</p>

        <div class="intro-examples-box">
          <div class="example-chip"><code>"Gol nomor 10"</code> ➔ Catat Gol</div>
          <div class="example-chip"><code>"Loss nomor 4"</code> ➔ Catat Turnover</div>
          <div class="example-chip"><code>"Ganti paket 2"</code> ➔ Rotasi Pemain</div>
        </div>

        <div class="intro-footer-row">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={dontShowAgain} />
            <span>Jangan tampilkan lagi</span>
          </label>

          <div class="intro-btn-group">
            <button class="btn-pop-guide" onclick={() => { showIntroPopover = false; showVoiceModal = true; }}>
              Panduan Lengkap
            </button>
            <button class="btn-pop-try" onclick={toggleVoice}>
              <Mic size={13} /> Coba Bicara
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Live Command Action Feedback Toast -->
  {#if latestCommand}
    <div class="voice-live-toast" class:is-unknown={latestCommand.intent === 'UNKNOWN'}>
      <div class="toast-indicator">
        {#if latestCommand.intent !== 'UNKNOWN'}
          <CheckCircle2 size={16} class="text-emerald" />
        {:else}
          <AlertCircle size={16} class="text-amber" />
        {/if}
      </div>
      <div class="toast-body">
        <span class="transcript-text">"{latestCommand.rawTranscript}"</span>
        <strong class="action-desc">{latestCommand.description}</strong>
      </div>
    </div>
  {/if}

  {#if errorMessage}
    <div class="voice-error-toast">
      <AlertCircle size={14} />
      <span>{errorMessage}</span>
    </div>
  {/if}

  <div class="voice-btn-group">
    <button 
      class="btn-floating-mic" 
      class:is-active={isListening} 
      onclick={toggleVoice}
      title={isListening ? "Suara Aktif: Klik untuk Mematikan Mic" : "Nyalakan Perintah Suara (Voice Tagging)"}>
      {#if isListening}
        <span class="mic-wave-pulse"></span>
        <Mic size={20} class="text-white" />
        <span class="mic-status-text">MENDENGARKAN...</span>
      {:else}
        <Mic size={18} />
        <span class="mic-status-text">VOICE TAG</span>
      {/if}
    </button>

    <button 
      class="btn-voice-help" 
      onclick={() => (showVoiceModal = true)}
      title="Buka Panduan Lengkap & Tes Suara">
      ?
    </button>
  </div>
</div>

<!-- Voice Commands Comprehensive Guide & Simulator Modal -->
{#if showVoiceModal}
  <div 
    class="voice-modal-overlay" 
    onclick={(e) => { if (e.target === e.currentTarget) showVoiceModal = false; }} 
    onkeydown={(e) => { if (e.key === 'Escape') showVoiceModal = false; }}
    role="presentation">
    <div class="voice-modal-card" role="dialog" aria-modal="true" tabindex="-1">
      <div class="voice-modal-header">
        <div class="header-left-v">
          <div class="v-icon-bubble">
            <Radio size={22} class="text-cyan" />
          </div>
          <div>
            <h3>Panduan Lengkap & Simulator Voice Tagging</h3>
            <p>Pencatatan data pertandingan futsal instan menggunakan suara bahasa Indonesia</p>
          </div>
        </div>
        <button class="btn-close-v" onclick={() => (showVoiceModal = false)}>
          <X size={18} />
        </button>
      </div>

      <div class="voice-modal-body">
        <!-- Explanatory Banner -->
        <div class="voice-how-it-works-banner">
          <div class="step-card">
            <span class="step-badge">1</span>
            <strong>Nyalakan Mic</strong>
            <span>Klik tombol merah/biru di pojok kanan bawah</span>
          </div>
          <div class="step-card">
            <span class="step-badge">2</span>
            <strong>Bicara Jelas</strong>
            <span>Sebutkan aksi & nomor punggung pemain</span>
          </div>
          <div class="step-card">
            <span class="step-badge">3</span>
            <strong>Otomatis Tersimpan</strong>
            <span>Data langsung masuk ke tabel & papan taktik</span>
          </div>
        </div>

        <!-- Interactive Voice Test Simulator Bar -->
        <div class="voice-tester-box">
          <div class="tester-head">
            <div class="tester-title">
              <Zap size={14} class="text-amber" />
              <span>Coba Simulasi / Uji Perintah Suara:</span>
            </div>
            {#if isListening}
              <span class="listening-live-chip">● Mic Aktif & Mendengarkan</span>
            {/if}
          </div>

          <div class="test-quick-buttons">
            <button class="btn-sample-cmd" onclick={() => testCommandSimulation('Gol nomor 10')}>
              🎯 "Gol nomor 10"
            </button>
            <button class="btn-sample-cmd" onclick={() => testCommandSimulation('Loss nomor 4')}>
              ⚠️ "Loss nomor 4"
            </button>
            <button class="btn-sample-cmd" onclick={() => testCommandSimulation('Recover nomor 7')}>
              🛡️ "Recover nomor 7"
            </button>
            <button class="btn-sample-cmd" onclick={() => testCommandSimulation('Ganti paket 2')}>
              🔄 "Ganti paket 2"
            </button>
            <button class="btn-sample-cmd" onclick={() => testCommandSimulation('Start timer')}>
              ▶ "Start timer"
            </button>
          </div>

          {#if testTranscript}
            <div class="test-result-box">
              <span>Hasil deteksi: <strong>"{testTranscript}"</strong> ➔ {testParsed?.description}</span>
            </div>
          {/if}
        </div>

        <!-- Commands Dictionary Grid -->
        <div class="commands-grid">
          <div class="cmd-category-card">
            <h4>⚽ Pencatatan Gol & Tembakan</h4>
            <ul>
              <li><code>"Gol nomor 10"</code> ➔ Catat gol pemain #10</li>
              <li><code>"Gol"</code> ➔ Tambah +1 skor tim</li>
            </ul>
          </div>

          <div class="cmd-category-card">
            <h4>⚠️ Turnover & Rebound</h4>
            <ul>
              <li><code>"Loss nomor 4"</code> ➔ Catat turnover pemain #4</li>
              <li><code>"Recover nomor 7"</code> ➔ Catat recovery pemain #7</li>
            </ul>
          </div>

          <div class="cmd-category-card">
            <h4>🔄 Rotasi Paket 5-Man</h4>
            <ul>
              <li><code>"Ganti paket 2"</code> ➔ Deploy paket rotasi 2</li>
              <li><code>"Paket 1 masuk"</code> ➔ Deploy starting unit</li>
            </ul>
          </div>

          <div class="cmd-category-card">
            <h4>⏱️ Waktu & Pelanggaran</h4>
            <ul>
              <li><code>"Start timer"</code> / <code>"Mulai"</code> ➔ Jalankan jam</li>
              <li><code>"Stop timer"</code> / <code>"Jeda"</code> ➔ Pause waktu</li>
              <li><code>"Foul nomor 12"</code> ➔ Catat pelanggaran</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="voice-modal-footer">
        <button class="btn-v-done" onclick={() => (showVoiceModal = false)}>
          Saya Mengerti & Siap Menggunakan
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .voice-floating-container {
    position: fixed;
    bottom: 20px;
    right: 24px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    z-index: 900;
  }

  /* INTRO POPOVER */
  .voice-intro-popover {
    background: #0f172a;
    border: 1.5px solid #00e5ff;
    border-radius: 14px;
    padding: 16px;
    width: 320px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 229, 255, 0.3);
    animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  @keyframes popIn {
    from { opacity: 0; transform: translateY(12px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .intro-pop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .intro-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 229, 255, 0.12);
    color: #00e5ff;
    font-size: 0.65rem;
    font-weight: 900;
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.05em;
  }

  .btn-close-pop {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 2px;
    display: flex;
  }

  .btn-close-pop:hover {
    color: #ffffff;
  }

  .intro-pop-body h4 {
    margin: 0 0 6px 0;
    font-size: 0.92rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.3;
  }

  .intro-pop-body p {
    margin: 0 0 10px 0;
    font-size: 0.76rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  .intro-examples-box {
    background: rgba(4, 9, 20, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
  }

  .example-chip {
    font-size: 0.74rem;
    color: #cbd5e1;
  }

  .example-chip code {
    background: rgba(0, 229, 255, 0.12);
    color: #00e5ff;
    padding: 1px 4px;
    border-radius: 4px;
    font-weight: 700;
  }

  .intro-footer-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    color: #64748b;
    cursor: pointer;
  }

  .checkbox-label input {
    accent-color: #00e5ff;
  }

  .intro-btn-group {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .btn-pop-guide {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #cbd5e1;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-pop-try {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #00e5ff;
    color: #040914;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.74rem;
    font-weight: 800;
    cursor: pointer;
  }

  /* TOAST */
  .voice-live-toast {
    background: #0f172a;
    border: 1.5px solid #00e5ff;
    border-radius: 12px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 30px rgba(0, 229, 255, 0.35);
    animation: slideIn 0.2s ease-out;
    max-width: 320px;
  }

  .voice-live-toast.is-unknown {
    border-color: #f59e0b;
    box-shadow: 0 10px 30px rgba(245, 158, 11, 0.35);
  }

  .toast-body {
    display: flex;
    flex-direction: column;
  }

  .transcript-text {
    font-size: 0.72rem;
    color: #94a3b8;
    font-style: italic;
  }

  .action-desc {
    font-size: 0.82rem;
    color: #ffffff;
  }

  .voice-error-toast {
    background: rgba(239, 68, 68, 0.9);
    color: #ffffff;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .voice-btn-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-floating-mic {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border: 1px solid rgba(0, 229, 255, 0.3);
    color: #00e5ff;
    padding: 10px 16px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 800;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    position: relative;
    transition: all 0.2s;
  }

  .btn-floating-mic:hover {
    border-color: #00e5ff;
    box-shadow: 0 0 16px rgba(0, 229, 255, 0.4);
    transform: translateY(-2px);
  }

  .btn-floating-mic.is-active {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: #ffffff;
    border-color: #f87171;
    box-shadow: 0 0 24px rgba(239, 68, 68, 0.6);
  }

  .mic-wave-pulse {
    position: absolute;
    inset: -4px;
    border-radius: 999px;
    border: 2px solid #ef4444;
    animation: ripple 1.2s infinite;
  }

  @keyframes ripple {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(1.25); opacity: 0; }
  }

  .btn-voice-help {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #94a3b8;
    font-weight: 800;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-voice-help:hover {
    color: #ffffff;
    border-color: #00e5ff;
  }

  /* MODAL */
  .voice-modal-overlay {
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

  .voice-modal-card {
    background: #0d1527;
    border: 1px solid rgba(0, 229, 255, 0.3);
    border-radius: 16px;
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
  }

  .voice-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: rgba(18, 28, 51, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .header-left-v {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .v-icon-bubble {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(0, 229, 255, 0.15);
    border: 1px solid rgba(0, 229, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-left-v h3 {
    margin: 0;
    font-size: 1rem;
    color: #ffffff;
  }

  .header-left-v p {
    margin: 2px 0 0 0;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .btn-close-v {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
  }

  .voice-modal-body {
    padding: 18px 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .voice-how-it-works-banner {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
  }

  @media (max-width: 600px) {
    .voice-how-it-works-banner {
      grid-template-columns: 1fr;
    }
  }

  .step-card {
    background: rgba(18, 28, 51, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 4px;
  }

  .step-badge {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #00e5ff;
    color: #040914;
    font-size: 0.75rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .step-card strong {
    font-size: 0.84rem;
    color: #ffffff;
  }

  .step-card span {
    font-size: 0.7rem;
    color: #94a3b8;
  }

  /* TESTER */
  .voice-tester-box {
    background: rgba(4, 9, 20, 0.8);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .tester-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tester-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fbbf24;
  }

  .listening-live-chip {
    font-size: 0.7rem;
    color: #ef4444;
    font-weight: 700;
    animation: pulse 1s infinite;
  }

  .test-quick-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .btn-sample-cmd {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #f1f5f9;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-sample-cmd:hover {
    background: #00e5ff;
    color: #040914;
    border-color: #00e5ff;
  }

  .test-result-box {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 0.78rem;
    color: #34d399;
  }

  .commands-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  @media (max-width: 600px) {
    .commands-grid {
      grid-template-columns: 1fr;
    }
  }

  .cmd-category-card {
    background: rgba(18, 28, 51, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 12px;
  }

  .cmd-category-card h4 {
    margin: 0 0 8px 0;
    font-size: 0.82rem;
    color: #00e5ff;
  }

  .cmd-category-card ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.75rem;
    color: #cbd5e1;
  }

  .cmd-category-card code {
    background: rgba(255, 255, 255, 0.08);
    color: #fbbf24;
    padding: 1px 5px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.72rem;
  }

  .voice-modal-footer {
    padding: 14px 20px;
    background: rgba(7, 12, 22, 0.8);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: flex-end;
  }

  .btn-v-done {
    background: #00e5ff;
    color: #040914;
    border: none;
    padding: 8px 20px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
  }

  .text-cyan { color: #00e5ff; }
  .text-emerald { color: #10b981; }
  .text-amber { color: #f59e0b; }
</style>
