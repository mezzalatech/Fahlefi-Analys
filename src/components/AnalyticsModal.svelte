<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { X, Award, Flame, Target, ShieldCheck, AlertTriangle } from 'lucide-svelte';

  let { onClose } = $props<{ onClose: () => void }>();

  let match = $derived(matchStore.data?.match);
  let players = $derived(matchStore.data?.players || []);
  let events = $derived(matchStore.data?.events || []);

  // Compute analytics
  let totalLoss = $derived(players.reduce((s, p) => s + p.loss1 + p.loss2, 0));
  let totalRec = $derived(players.reduce((s, p) => s + p.rec1 + p.rec2, 0));
  let totalShots = $derived(players.reduce((s, p) => s + p.sh1 + p.sh2, 0));
  let totalGoals = $derived(players.reduce((s, p) => s + p.gl1 + p.gl2, 0));
  let totalFouls = $derived(players.reduce((s, p) => s + p.fl1 + p.fl2, 0));

  let shotAccuracy = $derived(totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0);
  let recLossRatio = $derived(totalLoss > 0 ? (totalRec / totalLoss).toFixed(2) : totalRec.toFixed(2));

  // Top performers
  let topScorers = $derived(
    [...players]
      .filter((p) => p.gl1 + p.gl2 > 0)
      .sort((a, b) => b.gl1 + b.gl2 - (a.gl1 + a.gl2))
  );

  let topRecoverers = $derived(
    [...players]
      .filter((p) => p.rec1 + p.rec2 > 0)
      .sort((a, b) => b.rec1 + b.rec2 - (a.rec1 + a.rec2))
      .slice(0, 3)
  );

  let topShooters = $derived(
    [...players]
      .filter((p) => p.sh1 + p.sh2 > 0)
      .sort((a, b) => b.sh1 + b.sh2 - (a.sh1 + a.sh2))
      .slice(0, 3)
  );
</script>

<div class="modal-overlay" onclick={onClose} role="presentation">
  <div class="analytics-card" onclick={(e) => e.stopPropagation()} role="dialog">
    <div class="modal-head">
      <div class="head-title">
        <Award size={22} class="text-emerald" />
        <div>
          <h2>Executive Match Intelligence & Performance</h2>
          <span class="sub-h">{match?.homeTeam} vs {match?.awayTeam} • {match?.competition}</span>
        </div>
      </div>
      <button class="close-x" onclick={onClose}><X size={20} /></button>
    </div>

    <div class="modal-scroll-area">
      <!-- High-level KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-box box-emerald">
          <div class="kpi-title"><Target size={16} /> Total Goals / Shots</div>
          <div class="kpi-val">{totalGoals} <span class="kpi-sub">/ {totalShots}</span></div>
          <div class="kpi-meta">Shot Conversion: {shotAccuracy}%</div>
        </div>

        <div class="kpi-box box-blue">
          <div class="kpi-title"><ShieldCheck size={16} /> Recovery vs Loss</div>
          <div class="kpi-val">{totalRec} <span class="kpi-sub">/ {totalLoss}</span></div>
          <div class="kpi-meta">Net Ratio: {recLossRatio}x</div>
        </div>

        <div class="kpi-box box-amber">
          <div class="kpi-title"><AlertTriangle size={16} /> Akumulasi Fouls</div>
          <div class="kpi-val">{totalFouls}</div>
          <div class="kpi-meta">H1: {match?.homeFouls1st || 0} • H2: {match?.homeFouls2nd || 0}</div>
        </div>
      </div>

      <!-- Leaders Section -->
      <div class="leaders-section">
        <!-- Top Scorers -->
        <div class="leader-col glass-inner">
          <div class="col-title">
            <Flame size={16} class="text-amber" />
            <span>Top Pencetak Gol</span>
          </div>
          <div class="leader-list">
            {#if topScorers.length === 0}
              <div class="empty-text">Belum ada gol tercatat</div>
            {:else}
              {#each topScorers as p}
                <div class="leader-item">
                  <span class="l-no">#{p.no}</span>
                  <span class="l-name">{p.name}</span>
                  <span class="l-val text-emerald">{p.gl1 + p.gl2} GOL</span>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <!-- Top Recoveries -->
        <div class="leader-col glass-inner">
          <div class="col-title">
            <ShieldCheck size={16} class="text-blue" />
            <span>Top Ball Recoveries</span>
          </div>
          <div class="leader-list">
            {#if topRecoverers.length === 0}
              <div class="empty-text">Belum ada recovery</div>
            {:else}
              {#each topRecoverers as p}
                <div class="leader-item">
                  <span class="l-no">#{p.no}</span>
                  <span class="l-name">{p.name}</span>
                  <span class="l-val text-blue">{p.rec1 + p.rec2} REC</span>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <!-- Top Shooters -->
        <div class="leader-col glass-inner">
          <div class="col-title">
            <Target size={16} class="text-purple" />
            <span>Top Shot Attempts</span>
          </div>
          <div class="leader-list">
            {#if topShooters.length === 0}
              <div class="empty-text">Belum ada shots</div>
            {:else}
              {#each topShooters as p}
                <div class="leader-item">
                  <span class="l-no">#{p.no}</span>
                  <span class="l-name">{p.name}</span>
                  <span class="l-val text-purple">{p.sh1 + p.sh2} SHOTS</span>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
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

  .analytics-card {
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    width: 90%;
    max-width: 800px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  }

  .modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .head-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .head-title h2 {
    margin: 0;
    font-size: 1.15rem;
    color: #f8fafc;
  }

  .sub-h {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .close-x {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
  }

  .modal-scroll-area {
    padding: 1.5rem;
    overflow-y: auto;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .kpi-box {
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(30, 41, 59, 0.5);
  }

  .box-emerald { border-color: rgba(16, 185, 129, 0.3); }
  .box-blue { border-color: rgba(59, 130, 246, 0.3); }
  .box-amber { border-color: rgba(245, 158, 11, 0.3); }

  .kpi-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }

  .kpi-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.8rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1;
    margin-bottom: 0.4rem;
  }

  .kpi-sub {
    font-size: 1.1rem;
    color: #64748b;
  }

  .kpi-meta {
    font-size: 0.72rem;
    color: #cbd5e1;
  }

  .leaders-section {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .glass-inner {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 1rem;
  }

  .col-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.85rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .leader-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .leader-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.78rem;
    background: rgba(15, 23, 42, 0.6);
    padding: 4px 8px;
    border-radius: 6px;
  }

  .l-no {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    color: #94a3b8;
    width: 26px;
  }

  .l-name {
    flex: 1;
    color: #e2e8f0;
  }

  .l-val {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    font-size: 0.72rem;
  }

  :global(.text-amber) { color: #f59e0b; }
  :global(.text-blue) { color: #38bdf8; }
  :global(.text-purple) { color: #a78bfa; }

  .empty-text {
    font-size: 0.75rem;
    color: #64748b;
    text-align: center;
    padding: 1rem 0;
  }
</style>
