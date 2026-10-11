<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { X, Settings, Save } from 'lucide-svelte';

  let { onClose } = $props<{ onClose: () => void }>();

  let match = $derived(matchStore.data?.match);

  let name = $state<string>('');
  let competition = $state<string>('');
  let venue = $state<string>('');
  let date = $state<string>('');
  let time = $state<string>('');
  let homeTeam = $state<string>('');
  let awayTeam = $state<string>('');
  let timeout1Home = $state<string>('');
  let timeout1Away = $state<string>('');
  let timeout2Home = $state<string>('');
  let timeout2Away = $state<string>('');

  import { onMount } from 'svelte';

  onMount(() => {
    matchStore.pauseTimer();
    if (match) {
      name = match.name || '';
      competition = match.competition || '';
      venue = match.venue || '';
      date = match.date || '';
      time = match.time || '';
      homeTeam = match.homeTeam || '';
      awayTeam = match.awayTeam || '';
      try {
        const t = JSON.parse(match.timeouts || '[]');
        timeout1Home = t[0] || '';
        timeout1Away = t[1] || '';
        timeout2Home = t[2] || '';
        timeout2Away = t[3] || '';
      } catch {}
    }
  });

  async function handleSave() {
    await matchStore.updateMatchMeta({
      name,
      competition,
      venue,
      date,
      time,
      homeTeam,
      awayTeam,
      timeouts: JSON.stringify([timeout1Home, timeout1Away, timeout2Home, timeout2Away])
    });
    onClose();
  }
</script>

<div class="modal-overlay" onclick={onClose} role="presentation">
  <div class="config-card" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
    <div class="modal-head">
      <div class="head-title">
        <Settings size={20} class="text-emerald" />
        <h2>Pengaturan Informasi Pertandingan</h2>
      </div>
      <button class="close-x" onclick={onClose}><X size={18} /></button>
    </div>

    <div class="modal-form">
      <div class="form-row full-span">
        <div class="f-group">
          <label for="cfg-name">Judul Laga (Header Excel):</label>
          <input id="cfg-name" type="text" bind:value={name} placeholder="cth. PASER FUTSAL CUP 2026 - MATCH 01" class="cfg-input" />
        </div>
      </div>

      <div class="form-row">
        <div class="f-group">
          <label for="cfg-comp">Kompetisi / Turnamen:</label>
          <input id="cfg-comp" type="text" bind:value={competition} placeholder="cth. LIGA FUTSAL NUSANTARA" class="cfg-input" />
        </div>
        <div class="f-group">
          <label for="cfg-venue">Venue / Lapangan:</label>
          <input id="cfg-venue" type="text" bind:value={venue} placeholder="cth. GOR Sadurengas Paser" class="cfg-input" />
        </div>
      </div>

      <div class="form-row">
        <div class="f-group">
          <label for="cfg-date">Tanggal:</label>
          <input id="cfg-date" type="date" bind:value={date} class="cfg-input" />
        </div>
        <div class="f-group">
          <label for="cfg-time">Waktu Kickoff:</label>
          <input id="cfg-time" type="time" bind:value={time} class="cfg-input" />
        </div>
      </div>

      <div class="form-row">
        <div class="f-group">
          <label for="cfg-home">Tim Home (Tuan Rumah):</label>
          <input id="cfg-home" type="text" bind:value={homeTeam} placeholder="cth. Hewah Paser" class="cfg-input text-home" />
        </div>
        <div class="f-group">
          <label for="cfg-away">Tim Away (Lawan):</label>
          <input id="cfg-away" type="text" bind:value={awayTeam} placeholder="cth. Tim Lawan" class="cfg-input text-away" />
        </div>
      </div>

      <!-- Timeouts Section (Home & Away for both 1st and 2nd Half) -->
      <div class="timeouts-section">
        <div class="section-title-tag">⏱️ TIME-OUT MINUTE (Format mm:ss)</div>
        <div class="form-row">
          <div class="f-group">
            <label for="cfg-to1h">T.O 1ºH Tim Home:</label>
            <input id="cfg-to1h" type="text" bind:value={timeout1Home} placeholder="07:53" class="cfg-input" />
          </div>
          <div class="f-group">
            <label for="cfg-to1a">T.O 1ºH Tim Lawan:</label>
            <input id="cfg-to1a" type="text" bind:value={timeout1Away} placeholder="12:40" class="cfg-input" />
          </div>
        </div>
        <div class="form-row" style="margin-top: 0.5rem;">
          <div class="f-group">
            <label for="cfg-to2h">T.O 2ºH Tim Home:</label>
            <input id="cfg-to2h" type="text" bind:value={timeout2Home} placeholder="15:20" class="cfg-input" />
          </div>
          <div class="f-group">
            <label for="cfg-to2a">T.O 2ºH Tim Lawan:</label>
            <input id="cfg-to2a" type="text" bind:value={timeout2Away} placeholder="18:45" class="cfg-input" />
          </div>
        </div>
      </div>
    </div>

    <div class="modal-foot">
      <button class="btn-save" onclick={handleSave}>
        <Save size={15} /> Simpan Perubahan
      </button>
      <button class="btn-cancel" onclick={onClose}>Batal</button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .config-card {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    width: 90%;
    max-width: 540px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  }

  .modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .head-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .head-title h2 {
    margin: 0;
    font-size: 1.05rem;
    color: #f8fafc;
  }

  .close-x {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
  }

  .modal-form {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }

  .f-group label {
    display: block;
    font-size: 0.75rem;
    color: #94a3b8;
    margin-bottom: 0.35rem;
  }

  .cfg-input {
    width: 100%;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    padding: 0.45rem 0.6rem;
    color: #ffffff;
    font-size: 0.82rem;
  }

  .text-home { color: #60a5fa; font-weight: 700; }
  .text-away { color: #f87171; font-weight: 700; }

  .form-row.full-span {
    grid-template-columns: 1fr;
  }

  .timeouts-section {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 8px;
    padding: 0.75rem;
    margin-top: 0.25rem;
  }

  .section-title-tag {
    font-size: 0.72rem;
    font-weight: 800;
    color: #38bdf8;
    margin-bottom: 0.5rem;
    letter-spacing: 0.05em;
  }

  .modal-foot {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .btn-save {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: #10b981;
    color: #0f172a;
    border: none;
    padding: 0.45rem 1rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-save:hover {
    filter: brightness(1.1);
  }

  .btn-cancel {
    background: transparent;
    color: #94a3b8;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.45rem 0.9rem;
    border-radius: 6px;
    font-size: 0.82rem;
    cursor: pointer;
  }
</style>
