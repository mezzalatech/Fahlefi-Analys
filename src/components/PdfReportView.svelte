<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { PdfReportGenerator } from '../lib/pdfReportGenerator';
  import { AiTacticalEngine } from '../lib/aiTacticalEngine';
  import { 
    Printer, 
    Download, 
    Share2, 
    FileText, 
    Trophy, 
    Clock, 
    Users, 
    ShieldCheck, 
    Check,
    Sparkles,
    Calendar,
    MapPin,
    Flame,
    Zap,
    ShieldAlert,
    Lightbulb
  } from 'lucide-svelte';

  let match = $derived(matchStore.data?.match);
  let players = $derived(matchStore.data?.players || []);
  let pakets = $derived(matchStore.data?.pakets || []);
  let briefing = $derived(matchStore.data ? AiTacticalEngine.generateBriefing(matchStore.data, matchStore.substitutions) : null);

  let homeGoals = $derived((match?.homeScore1st || 0) + (match?.homeScore2nd || 0));
  let awayGoals = $derived((match?.awayScore1st || 0) + (match?.awayScore2nd || 0));

  function handlePrintPdf() {
    if (matchStore.data) {
      PdfReportGenerator.printReport(matchStore.data, matchStore.substitutions);
    }
  }
</script>

<div class="pdf-report-wrapper">
  <!-- Toolbar Header (Hidden on Print) -->
  <div class="pdf-toolbar no-print">
    <div class="toolbar-info">
      <div class="report-icon-box">
        <FileText size={22} class="text-emerald" />
      </div>
      <div>
        <h3>Laporan Pertandingan Resmi (Official Match Report)</h3>
        <p>Pratinjau dokumen siap cetak & ekspor PDF resolusi tinggi untuk staf pelatih dan manajemen</p>
      </div>
    </div>

    <div class="toolbar-actions">
      <button class="btn-print-action" onclick={handlePrintPdf}>
        <Printer size={16} /> Cetak / Simpan PDF
      </button>
    </div>
  </div>

  <!-- Document Sheet Page -->
  {#if match}
    <div class="a4-document-page">
      <!-- Header Banner -->
      <div class="doc-header">
        <div class="brand-row">
          <div class="brand-left-doc">
            <img src="/icon.png" alt="Logo" class="doc-logo" />
            <div>
              <h2 class="doc-title">FAHLEFI FUTSAL ANALYTICS</h2>
              <span class="doc-subtitle">Official Match Report & Performance Dossier</span>
            </div>
          </div>
          <div class="doc-status-box">
            <span class="status-badge-official">OFFICIAL REPORT</span>
            <span class="report-date">{match.date} {match.time}</span>
          </div>
        </div>

        <!-- Competition & Venue Metadata -->
        <div class="meta-strip">
          <div class="meta-item">
            <Trophy size={13} class="text-amber" />
            <span>Kompetisi: <strong>{match.competition}</strong></span>
          </div>
          <div class="meta-item">
            <MapPin size={13} class="text-cyan" />
            <span>Venue: <strong>{match.venue}</strong></span>
          </div>
          <div class="meta-item">
            <Calendar size={13} class="text-emerald" />
            <span>Nama Match: <strong>{match.name}</strong></span>
          </div>
        </div>
      </div>

      <!-- Main Scoreboard Banner -->
      <div class="scoreboard-banner">
        <div class="team-side home">
          <h3 class="team-display-name">{match.homeTeam}</h3>
          <span class="team-label-pill">TIM TUAN RUMAH</span>
          <div class="team-fouls-info">
            Fouls: <strong>{(match.homeFouls1st || 0) + (match.homeFouls2nd || 0)}</strong> (H1: {match.homeFouls1st || 0} | H2: {match.homeFouls2nd || 0})
          </div>
        </div>

        <div class="score-center-side">
          <div class="big-score">{homeGoals} - {awayGoals}</div>
          <div class="half-breakdown">
            <span>Babak 1: <strong>{match.homeScore1st || 0} - {match.awayScore1st || 0}</strong></span>
            <span class="divider-dot">•</span>
            <span>Babak 2: <strong>{match.homeScore2nd || 0} - {match.awayScore2nd || 0}</strong></span>
          </div>
        </div>

        <div class="team-side away">
          <h3 class="team-display-name">{match.awayTeam}</h3>
          <span class="team-label-pill away-pill">TIM TAMU</span>
          <div class="team-fouls-info">
            Fouls: <strong>{(match.awayFouls1st || 0) + (match.awayFouls2nd || 0)}</strong> (H1: {match.awayFouls1st || 0} | H2: {match.awayFouls2nd || 0})
          </div>
        </div>
      </div>

      <!-- Squad Performance Stats Table -->
      <div class="doc-section">
        <div class="section-title-bar">
          <Users size={14} class="text-emerald" />
          <h4>STATISTIK & KINERJA SKUAD PEMAIN</h4>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 32px;">NO</th>
              <th class="text-left">NAMA PEMAIN</th>
              <th style="width: 36px;">POS</th>
              <th style="width: 50px;">LOSS (H1/H2)</th>
              <th style="width: 50px;">REC (H1/H2)</th>
              <th style="width: 50px;">SHOT (H1/H2)</th>
              <th style="width: 44px;">GOL</th>
              <th style="width: 44px;">FOUL</th>
              <th style="width: 44px;">KARTU</th>
            </tr>
          </thead>
          <tbody>
            {#each players as p}
              <tr>
                <td class="cell-no">#{p.no}</td>
                <td class="text-left cell-name">
                  <strong>{p.name}</strong>
                </td>
                <td>
                  <span class="pos-badge" class:gk={p.isGk}>{p.isGk ? 'GK' : 'FP'}</span>
                </td>
                <td>{p.loss1 || 0} / {p.loss2 || 0}</td>
                <td>{p.rec1 || 0} / {p.rec2 || 0}</td>
                <td>{p.sh1 || 0} / {p.sh2 || 0}</td>
                <td class="cell-goal" class:has-goal={(p.gl1 || 0) + (p.gl2 || 0) > 0}>
                  {(p.gl1 || 0) + (p.gl2 || 0)}
                </td>
                <td>{(p.fl1 || 0) + (p.fl2 || 0)}</td>
                <td>
                  {#if (p.yellowCards || 0) > 0}
                    <span class="card-pill yellow">🟨{p.yellowCards}</span>
                  {/if}
                  {#if (p.redCards || 0) > 0}
                    <span class="card-pill red">🟥{p.redCards}</span>
                  {/if}
                  {#if !(p.yellowCards || 0) && !(p.redCards || 0)}
                    -
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- AI Tactical Recommendations & Summary (Replacing signatures) -->
      {#if briefing}
        <div class="doc-ai-section">
          <div class="ai-section-header">
            <div class="ai-title-wrap">
              <Sparkles size={16} class="text-emerald" />
              <h4>REKOMENDASI & INSIGHT TAKTIKAL ASISTEN AI</h4>
            </div>
            <span class="ai-badge-label">AI TACTICAL DOSSIER</span>
          </div>

          <div class="ai-summary-text">
            <p>{briefing.executiveSummary.replace(/\*\*/g, '')}</p>
          </div>

          <div class="ai-grid-blocks">
            <!-- Strengths -->
            <div class="ai-block-card strengths">
              <div class="ai-block-title text-emerald">
                <Zap size={13} />
                <span>KEUNGGULAN TAKTIKAL</span>
              </div>
              <ul class="ai-points-list">
                {#each briefing.strengths as s}
                  <li>{s.replace(/\*\*/g, '')}</li>
                {/each}
              </ul>
            </div>

            <!-- Vulnerabilities -->
            <div class="ai-block-card vulnerabilities">
              <div class="ai-block-title text-rose">
                <ShieldAlert size={13} />
                <span>AREA EVALUASI & RISIKO</span>
              </div>
              <ul class="ai-points-list">
                {#each briefing.vulnerabilities as v}
                  <li>{v.replace(/\*\*/g, '')}</li>
                {/each}
              </ul>
            </div>
          </div>

          <!-- Actionable Recommendations -->
          {#if briefing.recommendations.length > 0}
            <div class="ai-recommendations-box">
              <div class="rec-head">
                <Lightbulb size={14} class="text-amber" />
                <span>REKOMENDASI AKSI PELATIH</span>
              </div>
              <ul class="rec-list">
                {#each briefing.recommendations as r}
                  <li>{r}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .pdf-report-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    padding: 10px;
  }

  .pdf-toolbar {
    width: 100%;
    max-width: 850px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px 20px;
  }

  .toolbar-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .report-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toolbar-info h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #ffffff;
  }

  .toolbar-info p {
    margin: 2px 0 0 0;
    font-size: 0.78rem;
    color: #94a3b8;
  }

  .btn-print-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 8px 18px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    transition: all 0.2s;
  }

  .btn-print-action:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  /* A4 DOCUMENT PAGE CONTAINER */
  .a4-document-page {
    width: 100%;
    max-width: 850px;
    background: #ffffff;
    color: #0f172a;
    border-radius: 8px;
    padding: 32px 36px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    box-sizing: border-box;
  }

  .doc-header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }

  .brand-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .brand-left-doc {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .doc-logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }

  .doc-title {
    font-size: 1.15rem;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: 0.04em;
    margin: 0;
  }

  .doc-subtitle {
    font-size: 0.72rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .doc-status-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .status-badge-official {
    background: #0f172a;
    color: #ffffff;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  .report-date {
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 4px;
  }

  .meta-strip {
    display: flex;
    gap: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 12px;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #475569;
  }

  /* SCOREBOARD BANNER */
  .scoreboard-banner {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 16px;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 14px 20px;
    margin-bottom: 18px;
  }

  .team-side {
    text-align: center;
  }

  .team-display-name {
    font-size: 1.05rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 4px 0;
  }

  .team-label-pill {
    display: inline-block;
    background: #0284c7;
    color: #ffffff;
    font-size: 0.62rem;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 3px;
    letter-spacing: 0.04em;
  }

  .away-pill {
    background: #64748b;
  }

  .team-fouls-info {
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 6px;
  }

  .score-center-side {
    text-align: center;
    padding: 0 16px;
  }

  .big-score {
    font-size: 2rem;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: 2px;
  }

  .half-breakdown {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 2px;
  }

  .divider-dot {
    color: #cbd5e1;
  }

  /* TABLES */
  .doc-section {
    margin-bottom: 20px;
  }

  .section-title-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1.5px solid #0f172a;
    padding-bottom: 4px;
    margin-bottom: 8px;
  }

  .section-title-bar h4 {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.03em;
  }

  .report-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.78rem;
  }

  .report-table th {
    background: #f1f5f9;
    color: #334155;
    font-weight: 700;
    font-size: 0.7rem;
    text-transform: uppercase;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    text-align: center;
  }

  .report-table td {
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    text-align: center;
    color: #1e293b;
  }

  .cell-no {
    font-weight: 800;
    background: #f8fafc;
  }

  .cell-name {
    font-weight: 700;
  }

  .pos-badge {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    background: #e2e8f0;
    color: #475569;
  }

  .pos-badge.gk {
    background: #fef08a;
    color: #854d0e;
  }

  .cell-goal.has-goal {
    font-weight: 800;
    color: #16a34a;
    background: #f0fdf4;
  }

  .card-pill {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
  }

  /* AI TACTICAL SECTION */
  .doc-ai-section {
    margin-top: 18px;
    background: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    padding: 14px 16px;
  }

  .ai-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }

  .ai-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ai-title-wrap h4 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.02em;
  }

  .ai-badge-label {
    font-size: 0.62rem;
    font-weight: 800;
    background: #0f172a;
    color: #ffffff;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.04em;
  }

  .ai-summary-text p {
    margin: 0 0 10px 0;
    font-size: 0.76rem;
    line-height: 1.45;
    color: #334155;
  }

  .ai-grid-blocks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }

  .ai-block-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
  }

  .ai-block-card.strengths {
    border-left: 3px solid #10b981;
  }

  .ai-block-card.vulnerabilities {
    border-left: 3px solid #ef4444;
  }

  .ai-block-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 800;
    margin-bottom: 6px;
    letter-spacing: 0.03em;
  }

  .ai-points-list {
    margin: 0;
    padding-left: 16px;
    font-size: 0.72rem;
    color: #475569;
    line-height: 1.4;
  }

  .ai-points-list li {
    margin-bottom: 3px;
  }

  .ai-recommendations-box {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 10px 12px;
  }

  .rec-head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.74rem;
    font-weight: 800;
    color: #92400e;
    margin-bottom: 6px;
  }

  .rec-list {
    margin: 0;
    padding-left: 16px;
    font-size: 0.73rem;
    color: #78350f;
    line-height: 1.4;
  }

  .rec-list li {
    margin-bottom: 3px;
  }

  .text-left { text-align: left; }
  .text-amber { color: #d97706; }
  .text-cyan { color: #0284c7; }
  .text-emerald { color: #16a34a; }
  .text-rose { color: #e11d48; }
</style>
