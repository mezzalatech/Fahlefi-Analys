<script lang="ts">
  import { onMount } from 'svelte';
  import { matchStore } from '../lib/store.svelte';
  import { SeriesAggregator, type TournamentSummary, type PlayerSeriesStat } from '../lib/seriesAggregator';
  import { 
    Trophy, 
    Flame, 
    Zap, 
    ShieldAlert, 
    Users, 
    Activity, 
    TrendingUp, 
    Calendar, 
    Target,
    Award,
    RefreshCw
  } from 'lucide-svelte';

  let summary = $state<TournamentSummary | null>(null);
  let loading = $state<boolean>(true);

  let topScorer = $derived<PlayerSeriesStat | null>(summary?.playerStats[0] || null);
  let topRecoveryPlayer = $derived.by<PlayerSeriesStat | null>(() => {
    if (!summary?.playerStats || summary.playerStats.length === 0) return null;
    return [...summary.playerStats].sort((a, b) => b.totalRecoveries - a.totalRecoveries)[0] || null;
  });

  async function loadData() {
    loading = true;
    try {
      summary = await SeriesAggregator.aggregateTeamSeries(matchStore.activeTeamId);
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="tournament-dashboard-wrapper">
  <!-- Top Banner -->
  <div class="tournament-header-banner">
    <div class="header-left-t">
      <div class="trophy-bubble">
        <Trophy size={24} class="text-amber" />
      </div>
      <div>
        <h2>Dashboard Akumulasi Turnamen & Seri Laga</h2>
        <p>Agregasi performa multi-pertandingan, top leaderboard tim, dan manajemen beban pemain</p>
      </div>
    </div>

    <button class="btn-refresh-t" onclick={loadData} title="Muat Ulang Data">
      <RefreshCw size={15} class={loading ? 'spin' : ''} />
      <span>Segarkan</span>
    </button>
  </div>

  {#if loading}
    <div class="t-loading-state">
      <div class="spinner"></div>
      <p>Mengompilasi seluruh statistik arsip pertandingan...</p>
    </div>
  {:else if summary && summary.totalMatches === 0}
    <div class="empty-tourn-state">
      <Trophy size={48} class="text-amber opacity-60" />
      <h3>Belum Ada Riwayat Pertandingan</h3>
      <p>Data akumulasi seri turnamen akan otomatis terakumulasi secara real-time setelah pertandingan dicatat dan disimpan di <strong>Lembar Dokumen</strong>.</p>
    </div>
  {:else if summary}
    <!-- Key Record Metrics Cards Grid -->
    <div class="t-metrics-grid">
      <div class="metric-t-card">
        <span class="m-label">TOTAL PERTANDINGAN</span>
        <div class="m-val">{summary.totalMatches}</div>
        <span class="m-sub">{summary.wins} Menang • {summary.draws} Seri • {summary.losses} Kalah</span>
      </div>

      <div class="metric-t-card">
        <span class="m-label">WIN RATE</span>
        <div class="m-val text-emerald">{summary.winRatePct}%</div>
        <span class="m-sub">Tingkat Kemenangan Tim</span>
      </div>

      <div class="metric-t-card">
        <span class="m-label">PRODUKTIVITAS GOL</span>
        <div class="m-val text-cyan">{summary.goalsFor} - {summary.goalsAgainst}</div>
        <span class="m-sub">Selisih Gol: {summary.goalDiff > 0 ? `+${summary.goalDiff}` : summary.goalDiff}</span>
      </div>

      <div class="metric-t-card">
        <span class="m-label">DEFENSIVE RECOVERIES</span>
        <div class="m-val text-indigo">{summary.totalRecoveries}</div>
        <span class="m-sub">{summary.totalLosses} Loss Ball Terjadi</span>
      </div>
    </div>

    <!-- Leaderboard Highlights & Match History Grid -->
    <div class="t-two-columns">
      <!-- LEFT: Top Performers Podium -->
      <div class="t-panel">
        <div class="panel-head">
          <Award size={18} class="text-amber" />
          <h3>Leaderboard Performa Skuad</h3>
        </div>

        <div class="podium-row">
          <!-- Top Scorer -->
          {#if topScorer}
            <div class="podium-card gold">
              <span class="badge-award">🏆 TOP SCORER</span>
              <div class="p-jersey">#{topScorer.no}</div>
              <h4 class="p-name">{topScorer.name}</h4>
              <div class="p-stat-score">{topScorer.totalGoals} GOL</div>
              <span class="p-sub-stat">{topScorer.shotConversionPct}% Konversi ({topScorer.totalShots} Shots)</span>
            </div>
          {/if}

          <!-- Top Recovery -->
          {#if topRecoveryPlayer}
            {@const topRec = topRecoveryPlayer}
            <div class="podium-card emerald">
              <span class="badge-award green">🛡️ TOP BALL WINNER</span>
              <div class="p-jersey">#{topRec.no}</div>
              <h4 class="p-name">{topRec.name}</h4>
              <div class="p-stat-score green">{topRec.totalRecoveries} REC</div>
              <span class="p-sub-stat">Rasio {topRec.recoverLossRatio} vs Turnover</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- RIGHT: Match History Timeline -->
      <div class="t-panel">
        <div class="panel-head">
          <Calendar size={18} class="text-cyan" />
          <h3>Riwayat Seri Pertandingan</h3>
        </div>

        <div class="history-list">
          {#each summary.matchHistory as mh}
            <div class="history-card" class:win={mh.result === 'WIN'} class:loss={mh.result === 'LOSS'} class:draw={mh.result === 'DRAW'}>
              <div class="h-top">
                <span class="h-comp">{mh.competition}</span>
                <span class="h-date">{mh.date}</span>
              </div>
              <div class="h-match-name">{mh.name}</div>
              <div class="h-score-row">
                <span class="h-vs">vs {mh.opponent}</span>
                <div class="h-score-badge {mh.result.toLowerCase()}">
                  {mh.scoreFor} - {mh.scoreAgainst} ({mh.result})
                </div>
              </div>
            </div>
          {/each}
          {#if summary.matchHistory.length === 0}
            <div class="empty-h-box">Belum ada rekaman laga tersimpan.</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- FULL CUMULATIVE SQUAD TABLE -->
    <div class="t-panel full-width-panel">
      <div class="panel-head">
        <Users size={18} class="text-emerald" />
        <h3>Statistik Akumulatif Seluruh Skuad Pemain</h3>
      </div>

      <div class="table-responsive">
        <table class="t-squad-table">
          <thead>
            <tr>
              <th>No</th>
              <th class="text-left">Nama Pemain</th>
              <th>Pos</th>
              <th class="text-center">Main</th>
              <th class="text-center">Gol</th>
              <th class="text-center">Shots</th>
              <th class="text-center">Conversion %</th>
              <th class="text-center">Recoveries</th>
              <th class="text-center">Turnover</th>
              <th class="text-center">Fouls</th>
              <th class="text-center">Kartu</th>
            </tr>
          </thead>
          <tbody>
            {#each summary.playerStats as p}
              <tr>
                <td class="cell-no">#{p.no}</td>
                <td class="text-left"><strong>{p.name}</strong></td>
                <td>{p.isGk ? 'GK' : 'FP'}</td>
                <td class="text-center">{p.matchesPlayed}</td>
                <td class="text-center cell-goals">{p.totalGoals}</td>
                <td class="text-center">{p.totalShots}</td>
                <td class="text-center">{p.shotConversionPct}%</td>
                <td class="text-center text-emerald font-bold">{p.totalRecoveries}</td>
                <td class="text-center text-amber">{p.totalLosses}</td>
                <td class="text-center">{p.totalFouls}</td>
                <td class="text-center">
                  {#if p.yellowCards > 0}🟨{p.yellowCards}{/if}
                  {#if p.redCards > 0}🟥{p.redCards}{/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  .tournament-dashboard-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 10px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .tournament-header-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #0d1527;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 16px 20px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-left-t {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .trophy-bubble {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-left-t h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffffff;
  }

  .header-left-t p {
    margin: 2px 0 0 0;
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .btn-refresh-t {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #f1f5f9;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-refresh-t:hover {
    background: #00e5ff;
    color: #040914;
    border-color: #00e5ff;
  }

  /* METRICS GRID */
  .t-metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  .metric-t-card {
    background: rgba(18, 28, 51, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  .m-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.05em;
  }

  .m-val {
    font-size: 1.8rem;
    font-weight: 900;
    color: #ffffff;
    margin: 4px 0 2px 0;
  }

  .m-sub {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  /* 2 COLUMNS */
  .t-two-columns {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 16px;
  }

  @media (max-width: 850px) {
    .t-two-columns {
      grid-template-columns: 1fr;
    }
  }

  .t-panel {
    background: rgba(13, 21, 39, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .panel-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-head h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 800;
    color: #ffffff;
  }

  /* PODIUM */
  .podium-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .podium-card {
    background: rgba(18, 28, 51, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .podium-card.gold {
    border-color: rgba(245, 158, 11, 0.4);
    background: rgba(245, 158, 11, 0.06);
  }

  .podium-card.emerald {
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.06);
  }

  .badge-award {
    font-size: 0.65rem;
    font-weight: 800;
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .badge-award.green {
    color: #34d399;
    background: rgba(16, 185, 129, 0.15);
  }

  .p-jersey {
    font-size: 1.4rem;
    font-weight: 900;
    color: #ffffff;
    margin-top: 6px;
  }

  .p-name {
    margin: 2px 0 6px 0;
    font-size: 0.85rem;
    color: #f1f5f9;
  }

  .p-stat-score {
    font-size: 1.1rem;
    font-weight: 900;
    color: #fbbf24;
  }

  .p-stat-score.green {
    color: #10b981;
  }

  .p-sub-stat {
    font-size: 0.7rem;
    color: #94a3b8;
    margin-top: 2px;
  }

  /* HISTORY */
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .history-card {
    background: rgba(18, 28, 51, 0.6);
    border-left: 3px solid #64748b;
    border-radius: 8px;
    padding: 10px 14px;
  }

  .history-card.win { border-left-color: #10b981; }
  .history-card.loss { border-left-color: #ef4444; }
  .history-card.draw { border-left-color: #f59e0b; }

  .h-top {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: #94a3b8;
  }

  .h-match-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: #ffffff;
    margin: 3px 0;
  }

  .h-score-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .h-vs {
    font-size: 0.75rem;
    color: #cbd5e1;
  }

  .h-score-badge {
    font-size: 0.75rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .h-score-badge.win { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .h-score-badge.loss { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
  .h-score-badge.draw { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

  /* TABLE */
  .t-squad-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }

  .t-squad-table th {
    background: rgba(255, 255, 255, 0.04);
    color: #94a3b8;
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.72rem;
    text-transform: uppercase;
  }

  .t-squad-table td {
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: #cbd5e1;
  }

  .empty-tourn-state {
    background: #0d1527;
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 14px;
    padding: 3rem 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .empty-tourn-state h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #ffffff;
  }
  .empty-tourn-state p {
    margin: 0;
    font-size: 0.82rem;
    color: #94a3b8;
    max-width: 450px;
    line-height: 1.4;
  }

  .text-amber { color: #f59e0b; }
  .text-emerald { color: #10b981; }
  .text-cyan { color: #00e5ff; }
  .text-indigo { color: #818cf8; }
  .text-rose { color: #f43f5e; }
  .text-left { text-align: left; }
  .text-center { text-align: center; }
</style>
