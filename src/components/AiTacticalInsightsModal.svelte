<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { AiTacticalEngine, type TacticalBriefing, type PaketTacticalMetric, type ZoneAnalysis } from '../lib/aiTacticalEngine';
  import { 
    Bot, 
    Sparkles, 
    TrendingUp, 
    TrendingDown, 
    ShieldAlert, 
    CheckCircle2, 
    Target, 
    Users, 
    Copy, 
    X, 
    FileText, 
    Lightbulb,
    Flame,
    Zap,
    Layers,
    Activity
  } from 'lucide-svelte';

  let { onClose } = $props<{ onClose: () => void }>();

  let activeTab = $state<'briefing' | 'pakets' | 'zones'>('briefing');
  let copiedToast = $state<boolean>(false);

  let briefing = $derived<TacticalBriefing | null>(
    matchStore.data ? AiTacticalEngine.generateBriefing(matchStore.data, matchStore.substitutions) : null
  );

  let paketsMetrics = $derived<PaketTacticalMetric[]>(
    matchStore.data ? AiTacticalEngine.analyzePakets(matchStore.data, matchStore.substitutions) : []
  );

  let zonesAnalysis = $derived<ZoneAnalysis[]>(
    matchStore.data ? AiTacticalEngine.analyzeZones(matchStore.data.events) : []
  );

  function copySummaryToClipboard() {
    if (!briefing || !matchStore.data) return;
    const text = `📋 *FAHLEFI FUTSAL AI TACTICAL REPORT*\n` +
      `⚽ *Laga:* ${matchStore.data.match.name} (${matchStore.data.match.homeTeam} vs ${matchStore.data.match.awayTeam})\n` +
      `⏱️ *Skor:* ${(matchStore.data.match.homeScore1st || 0) + (matchStore.data.match.homeScore2nd || 0)} - ${(matchStore.data.match.awayScore1st || 0) + (matchStore.data.match.awayScore2nd || 0)}\n\n` +
      `💡 *Ringkasan Eksekutif:*\n${briefing.executiveSummary.replace(/\*\*/g, '')}\n\n` +
      `✅ *Kekuatan Tim:*\n${briefing.strengths.map(s => `• ${s.replace(/\*\*/g, '')}`).join('\n')}\n\n` +
      `⚠️ *Poin Evaluasi & Kerentanan:*\n${briefing.vulnerabilities.map(v => `• ${v.replace(/\*\*/g, '')}`).join('\n')}\n\n` +
      `🎯 *Rekomendasi Pelatih:*\n${briefing.recommendations.map(r => `👉 ${r}`).join('\n')}\n\n` +
      `_Dibuat otomatis oleh Fahlefi AI Tactical Engine_`;

    navigator.clipboard.writeText(text).then(() => {
      copiedToast = true;
      setTimeout(() => (copiedToast = false), 2500);
    });
  }
</script>

<div 
  class="ai-modal-overlay" 
  onclick={(e) => { if (e.target === e.currentTarget) onClose(); }} 
  onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
  role="presentation">
  <div 
    class="ai-modal-content" 
    role="dialog" 
    aria-modal="true" 
    tabindex="-1">
    <!-- Modal Header -->
    <div class="ai-modal-header">
      <div class="header-brand">
        <div class="ai-icon-bubble">
          <Bot size={22} class="text-cyan" />
        </div>
        <div>
          <div class="header-title-row">
            <h2>AI Tactical Assistant & Match Insights</h2>
            <span class="ai-pill-pro">
              <Sparkles size={12} /> PRO TACTICS
            </span>
          </div>
          <p class="ai-subtitle">Analisis otomatis metrik paket 5-man, zona turnover, dan briefing evaluasi taktis pelatih</p>
        </div>
      </div>
      <button class="btn-close-modal" onclick={onClose} title="Tutup">
        <X size={20} />
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="ai-tabs-bar">
      <button 
        class="ai-tab-btn" 
        class:active={activeTab === 'briefing'} 
        onclick={() => (activeTab = 'briefing')}>
        <Bot size={15} /> Coach Briefing & Strategi
      </button>
      <button 
        class="ai-tab-btn" 
        class:active={activeTab === 'pakets'} 
        onclick={() => (activeTab = 'pakets')}>
        <Users size={15} /> Paket 5-Man (+/-) Rating
      </button>
      <button 
        class="ai-tab-btn" 
        class:active={activeTab === 'zones'} 
        onclick={() => (activeTab = 'zones')}>
        <Layers size={15} /> Peta Kerentanan & Zona
      </button>
    </div>

    <!-- Modal Body -->
    <div class="ai-modal-body">
      {#if briefing}
        {#if activeTab === 'briefing'}
          <!-- TAB 1: COACH BRIEFING -->
          <div class="briefing-layout">
            <!-- Executive Summary Card -->
            <div class="ai-card summary-card">
              <div class="card-header-mini">
                <Activity size={16} class="text-emerald" />
                <h3>Ringkasan Eksekutif Laga</h3>
              </div>
              <p class="summary-text">{@html briefing.executiveSummary}</p>
            </div>

            <!-- Highlights Grid (Strengths & Vulnerabilities) -->
            <div class="highlights-grid">
              <!-- Strengths -->
              <div class="ai-card strengths-card">
                <div class="card-header-mini">
                  <CheckCircle2 size={16} class="text-emerald" />
                  <h3 class="text-emerald">Kekuatan & Peluang Taktis</h3>
                </div>
                <ul class="highlight-list">
                  {#each briefing.strengths as strength}
                    <li>
                      <span class="bullet-dot bullet-green"></span>
                      <div>{@html strength}</div>
                    </li>
                  {/each}
                </ul>
              </div>

              <!-- Vulnerabilities -->
              <div class="ai-card vulnerabilities-card">
                <div class="card-header-mini">
                  <ShieldAlert size={16} class="text-amber" />
                  <h3 class="text-amber">Area Kerentanan & Evaluasi</h3>
                </div>
                <ul class="highlight-list">
                  {#each briefing.vulnerabilities as vuln}
                    <li>
                      <span class="bullet-dot bullet-amber"></span>
                      <div>{@html vuln}</div>
                    </li>
                  {/each}
                </ul>
              </div>
            </div>

            <!-- Tactical Recommendations -->
            <div class="ai-card recommendations-card">
              <div class="card-header-mini">
                <Lightbulb size={16} class="text-cyan" />
                <h3 class="text-cyan">Instruksi & Rekomendasi Taktis Pelatih</h3>
              </div>
              <div class="recs-grid">
                {#each briefing.recommendations as rec, idx}
                  <div class="rec-item">
                    <span class="rec-number">{idx + 1}</span>
                    <p>{rec}</p>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Top Impact Players Row -->
            <div class="performers-row">
              {#if briefing.topScorerPlayer}
                <div class="performer-pill">
                  <Flame size={16} class="text-amber" />
                  <div>
                    <span class="p-role">Lethal Finisher</span>
                    <strong>#{briefing.topScorerPlayer.no} {briefing.topScorerPlayer.name} ({briefing.topScorerPlayer.count} Gol)</strong>
                  </div>
                </div>
              {/if}

              {#if briefing.topRecoveryPlayer}
                <div class="performer-pill">
                  <Zap size={16} class="text-emerald" />
                  <div>
                    <span class="p-role">Top Ball Recovery</span>
                    <strong>#{briefing.topRecoveryPlayer.no} {briefing.topRecoveryPlayer.name} ({briefing.topRecoveryPlayer.count} Rebound)</strong>
                  </div>
                </div>
              {/if}

              {#if briefing.bestPaket}
                <div class="performer-pill">
                  <Users size={16} class="text-cyan" />
                  <div>
                    <span class="p-role">Best Rotation Unit</span>
                    <strong>{briefing.bestPaket.code} (+{briefing.bestPaket.plusMinus} Net Goal)</strong>
                  </div>
                </div>
              {/if}
            </div>
          </div>

        {:else if activeTab === 'pakets'}
          <!-- TAB 2: PAKET 5-MAN NET RATINGS -->
          <div class="pakets-table-layout">
            <div class="table-intro">
              <p>Analisis efektivitas komparatif seluruh paket rotasi 5 pemain selama berada di atas lapangan pertandingan futsal:</p>
            </div>

            <div class="table-responsive">
              <table class="ai-pakets-table">
                <thead>
                  <tr>
                    <th>Paket Unit</th>
                    <th>Komposisi Skuad</th>
                    <th class="text-center">Durasi</th>
                    <th class="text-center">Gol (F - A)</th>
                    <th class="text-center">Plus / Minus (+/-)</th>
                    <th class="text-center">Shots</th>
                    <th class="text-center">Loss / Rec</th>
                  </tr>
                </thead>
                <tbody>
                  {#each paketsMetrics as pkt}
                    <tr>
                      <td>
                        <span class="paket-code-badge">{pkt.code}</span>
                      </td>
                      <td>
                        <div class="player-names-cell">
                          {#each pkt.playerNames as pName, i}
                            <span class="pname-chip">#{pkt.playerNumbers[i]} {pName}</span>
                          {/each}
                        </div>
                      </td>
                      <td class="text-center">
                        <span class="min-pill">{pkt.minutesPlayed} mnt</span>
                      </td>
                      <td class="text-center">
                        <span class="score-ratio">{pkt.goalsFor} - {pkt.goalsAgainst}</span>
                      </td>
                      <td class="text-center">
                        <span 
                          class="plus-minus-badge" 
                          class:positive={pkt.plusMinus > 0} 
                          class:negative={pkt.plusMinus < 0}
                          class:neutral={pkt.plusMinus === 0}>
                          {pkt.plusMinus > 0 ? `+${pkt.plusMinus}` : pkt.plusMinus}
                        </span>
                      </td>
                      <td class="text-center">
                        <span class="shots-cell">{pkt.shotsFor} ({pkt.shotsAgainst} vs)</span>
                      </td>
                      <td class="text-center">
                        <span class="loss-rec-cell">
                          <span class="loss-num">{pkt.losses}L</span> / <span class="rec-num">{pkt.recoveries}R</span>
                        </span>
                      </td>
                    </tr>
                  {/each}
                  {#if paketsMetrics.length === 0}
                    <tr>
                      <td colspan="7" class="empty-state-cell">Belum ada paket rotasi 5-man yang dikonfigurasi.</td>
                    </tr>
                  {/if}
                </tbody>
              </table>
            </div>
          </div>

        {:else if activeTab === 'zones'}
          <!-- TAB 3: ZONE PRESSURE & TURNOVER VULNERABILITY -->
          <div class="zones-layout">
            <div class="table-intro">
              <p>Peta kerentanan kehilangan bola (*Turnover Danger Score*) berdasarkan zona koordinat taktikal futsal:</p>
            </div>

            <div class="zones-grid">
              {#each zonesAnalysis as zone}
                <div class="zone-card" class:high-danger={zone.dangerScore >= 60} class:med-danger={zone.dangerScore >= 30 && zone.dangerScore < 60}>
                  <div class="zone-card-top">
                    <span class="zone-cat-badge cat-{zone.category.toLowerCase()}">{zone.category}</span>
                    <span class="danger-score-pill" class:high={zone.dangerScore >= 60}>{zone.dangerScore}% Danger</span>
                  </div>
                  <h4 class="zone-name">{zone.name}</h4>
                  
                  <div class="danger-bar-track">
                    <div class="danger-bar-fill" style="width: {zone.dangerScore}%;"></div>
                  </div>

                  <div class="zone-stats-row">
                    <div class="z-stat">
                      <span>Loss Ball</span>
                      <strong class="text-amber">{zone.losses}</strong>
                    </div>
                    <div class="z-stat">
                      <span>Recovery</span>
                      <strong class="text-emerald">{zone.recoveries}</strong>
                    </div>
                    <div class="z-stat">
                      <span>Shots (Goals)</span>
                      <strong class="text-cyan">{zone.shots} ({zone.goals})</strong>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {:else}
        <div class="ai-loading-box">
          <Bot size={36} class="animate-bounce text-cyan" />
          <p>Menganalisis matriks data taktikal pertandingan...</p>
        </div>
      {/if}
    </div>

    <!-- Modal Footer Actions -->
    <div class="ai-modal-footer">
      <div class="footer-left">
        {#if copiedToast}
          <span class="toast-copied">
            <CheckCircle2 size={14} /> Berhasil disalin ke clipboard!
          </span>
        {/if}
      </div>
      <div class="footer-actions">
        <button class="btn-ai-copy" onclick={copySummaryToClipboard}>
          <Copy size={15} /> Salin Ringkasan (WhatsApp)
        </button>
        <button class="btn-ai-done" onclick={onClose}>
          Selesai
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .ai-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(4, 9, 20, 0.82);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  }

  .ai-modal-content {
    background: #0d1527;
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 16px;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 229, 255, 0.15);
    overflow: hidden;
  }

  .ai-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    background: linear-gradient(135deg, rgba(13, 21, 39, 0.95), rgba(20, 32, 58, 0.95));
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .ai-icon-bubble {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(0, 229, 255, 0.12);
    border: 1px solid rgba(0, 229, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-title-row h2 {
    font-size: 1.15rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .ai-pill-pro {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #00e5ff, #00b4d8);
    color: #040914;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 999px;
    letter-spacing: 0.05em;
  }

  .ai-subtitle {
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 2px 0 0 0;
  }

  .btn-close-modal {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    border-radius: 8px;
    width: 34px;
    height: 34px;
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

  .ai-tabs-bar {
    display: flex;
    background: rgba(7, 12, 22, 0.6);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding: 0 16px;
    gap: 8px;
  }

  .ai-tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 12px 16px;
    font-size: 0.84rem;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ai-tab-btn:hover {
    color: #f1f5f9;
  }

  .ai-tab-btn.active {
    color: #00e5ff;
    border-bottom-color: #00e5ff;
    background: rgba(0, 229, 255, 0.04);
  }

  .ai-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
  }

  .briefing-layout {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ai-card {
    background: rgba(18, 28, 51, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
  }

  .card-header-mini {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .card-header-mini h3 {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0;
  }

  .summary-text {
    font-size: 0.88rem;
    line-height: 1.6;
    color: #cbd5e1;
    margin: 0;
  }

  .highlights-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  @media (max-width: 768px) {
    .highlights-grid {
      grid-template-columns: 1fr;
    }
  }

  .highlight-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .highlight-list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.84rem;
    color: #e2e8f0;
    line-height: 1.5;
  }

  .bullet-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-top: 6px;
    flex-shrink: 0;
  }

  .bullet-green { background: #10b981; }
  .bullet-amber { background: #f59e0b; }

  .recommendations-card {
    border-left: 3px solid #00e5ff;
  }

  .recs-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rec-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: rgba(0, 229, 255, 0.05);
    border-radius: 8px;
    padding: 10px 14px;
  }

  .rec-number {
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
    flex-shrink: 0;
  }

  .rec-item p {
    font-size: 0.84rem;
    color: #f1f5f9;
    margin: 0;
    line-height: 1.4;
  }

  .performers-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  .performer-pill {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .p-role {
    display: block;
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .performer-pill strong {
    font-size: 0.82rem;
    color: #ffffff;
  }

  /* PAKETS TABLE */
  .table-intro p {
    font-size: 0.84rem;
    color: #94a3b8;
    margin-top: 0;
    margin-bottom: 14px;
  }

  .ai-pakets-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
  }

  .ai-pakets-table th {
    background: rgba(255, 255, 255, 0.04);
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.72rem;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .ai-pakets-table td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: #e2e8f0;
  }

  .paket-code-badge {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    padding: 3px 8px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.78rem;
  }

  .player-names-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .pname-chip {
    background: rgba(255, 255, 255, 0.06);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #cbd5e1;
  }

  .min-pill {
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.75rem;
  }

  .plus-minus-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 0.8rem;
  }

  .plus-minus-badge.positive { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .plus-minus-badge.negative { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
  .plus-minus-badge.neutral { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }

  .loss-num { color: #f59e0b; font-weight: 700; }
  .rec-num { color: #10b981; font-weight: 700; }

  /* ZONES */
  .zones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }

  .zone-card {
    background: rgba(18, 28, 51, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 14px;
  }

  .zone-card.high-danger {
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.06);
  }

  .zone-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .zone-cat-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .cat-defensive { background: rgba(239, 68, 68, 0.2); color: #f87171; }
  .cat-middle { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
  .cat-attacking { background: rgba(16, 185, 129, 0.2); color: #34d399; }

  .danger-score-pill {
    font-size: 0.72rem;
    font-weight: 700;
    color: #94a3b8;
  }

  .danger-score-pill.high { color: #ef4444; }

  .zone-name {
    font-size: 0.84rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 10px 0;
  }

  .danger-bar-track {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin-bottom: 12px;
    overflow: hidden;
  }

  .danger-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
  }

  .zone-stats-row {
    display: flex;
    justify-content: space-between;
  }

  .z-stat {
    display: flex;
    flex-direction: column;
    font-size: 0.72rem;
  }

  .z-stat span { color: #94a3b8; }
  .z-stat strong { font-size: 0.8rem; margin-top: 2px; }

  /* FOOTER */
  .ai-modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 24px;
    background: rgba(7, 12, 22, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .toast-copied {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #10b981;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .footer-actions {
    display: flex;
    gap: 10px;
    margin-left: auto;
  }

  .btn-ai-copy {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid rgba(0, 229, 255, 0.3);
    color: #00e5ff;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-ai-copy:hover {
    background: rgba(0, 229, 255, 0.2);
  }

  .btn-ai-done {
    background: #00e5ff;
    color: #040914;
    border: none;
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-ai-done:hover {
    background: #38bdf8;
  }

  .text-cyan { color: #00e5ff; }
  .text-emerald { color: #10b981; }
  .text-amber { color: #f59e0b; }
  .text-center { text-align: center; }
</style>
