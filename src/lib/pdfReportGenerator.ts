import type { MatchData, SubstitutionLog } from './api';
import { AiTacticalEngine } from './aiTacticalEngine';

export class PdfReportGenerator {
  static generatePrintableHtml(matchData: MatchData, substitutions: SubstitutionLog[]): string {
    const m = matchData.match;
    const players = matchData.players || [];
    const pakets = matchData.pakets || [];
    const briefing = AiTacticalEngine.generateBriefing(matchData, substitutions);

    const homeGoals = (m.homeScore1st || 0) + (m.homeScore2nd || 0);
    const awayGoals = (m.awayScore1st || 0) + (m.awayScore2nd || 0);

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Official Match Report - ${m.name}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 0;
            font-size: 11px;
            background: #ffffff;
          }
          .report-container {
            max-width: 100%;
            margin: 0 auto;
          }
          .header-banner {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand-title {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.5px;
          }
          .match-meta {
            font-size: 10px;
            color: #64748b;
          }
          .scoreboard-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
          }
          .team-col {
            flex: 1;
            text-align: center;
          }
          .team-name {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
          }
          .score-col {
            text-align: center;
            padding: 0 20px;
          }
          .final-score {
            font-size: 24px;
            font-weight: 900;
            color: #0f172a;
          }
          .half-scores {
            font-size: 9px;
            color: #64748b;
          }
          .section-title {
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin: 12px 0 6px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 10px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 700;
            padding: 5px 6px;
            border: 1px solid #cbd5e1;
            text-align: center;
          }
          th.text-left { text-align: left; }
          td {
            padding: 4px 6px;
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          td.text-left { text-align: left; }
          .highlight-cell {
            font-weight: 700;
            background: #f8fafc;
          }
          /* AI Tactical Box */
          .ai-dossier-box {
            background: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px 14px;
            margin-top: 14px;
          }
          .ai-dossier-header {
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
          }
          .ai-summary-p {
            font-size: 9.5px;
            color: #334155;
            line-height: 1.4;
            margin: 0 0 8px 0;
          }
          .ai-two-col {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
          }
          .ai-col-card {
            flex: 1;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 6px 8px;
          }
          .ai-col-card.green {
            border-left: 3px solid #16a34a;
          }
          .ai-col-card.red {
            border-left: 3px solid #dc2626;
          }
          .col-card-title {
            font-size: 9px;
            font-weight: 800;
            margin-bottom: 4px;
          }
          .col-card-title.green { color: #16a34a; }
          .col-card-title.red { color: #dc2626; }
          .ai-bullet-list {
            margin: 0;
            padding-left: 14px;
            font-size: 8.5px;
            color: #475569;
            line-height: 1.35;
          }
          .ai-bullet-list li {
            margin-bottom: 2px;
          }
          .ai-rec-box {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 4px;
            padding: 6px 8px;
          }
          .rec-title {
            font-size: 9px;
            font-weight: 800;
            color: #92400e;
            margin-bottom: 3px;
          }
          .rec-bullet-list {
            margin: 0;
            padding-left: 14px;
            font-size: 8.5px;
            color: #78350f;
            line-height: 1.35;
          }
          .rec-bullet-list li {
            margin-bottom: 2px;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- Header -->
          <div class="header-banner">
            <div>
              <div class="brand-title">FAHLEFI FUTSAL ANALYTICS — OFFICIAL MATCH REPORT</div>
              <div class="match-meta">Kompetisi: ${m.competition || 'Futsal Championship'} | Venue: ${m.venue || 'Indoor Stadium'} | Tanggal: ${m.date} ${m.time}</div>
            </div>
            <div style="text-align: right; font-size: 9px; color: #64748b;">
              Status: <strong>OFFICIAL COMPLETED</strong>
            </div>
          </div>

          <!-- Scoreboard -->
          <div class="scoreboard-box">
            <div class="team-col">
              <div class="team-name">${m.homeTeam || 'HOME TEAM'}</div>
              <div style="font-size: 9px; color: #64748b;">Fouls: ${(m.homeFouls1st || 0) + (m.homeFouls2nd || 0)} (H1: ${m.homeFouls1st || 0}, H2: ${m.homeFouls2nd || 0})</div>
            </div>
            <div class="score-col">
              <div class="final-score">${homeGoals} - ${awayGoals}</div>
              <div class="half-scores">Babak 1: ${m.homeScore1st || 0} - ${m.awayScore1st || 0} | Babak 2: ${m.homeScore2nd || 0} - ${m.awayScore2nd || 0}</div>
            </div>
            <div class="team-col">
              <div class="team-name">${m.awayTeam || 'AWAY TEAM'}</div>
              <div style="font-size: 9px; color: #64748b;">Fouls: ${(m.awayFouls1st || 0) + (m.awayFouls2nd || 0)} (H1: ${m.awayFouls1st || 0}, H2: ${m.awayFouls2nd || 0})</div>
            </div>
          </div>

          <!-- Player Match Performance Stats Table -->
          <div class="section-title">STATISTIK PERFORMA SKUAD PEMAIN</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">NO</th>
                <th class="text-left">NAMA PEMAIN</th>
                <th style="width: 30px;">POS</th>
                <th style="width: 40px;">LOSS (H1/H2)</th>
                <th style="width: 40px;">REC (H1/H2)</th>
                <th style="width: 40px;">SHOT (H1/H2)</th>
                <th style="width: 35px;">GOL</th>
                <th style="width: 35px;">FOUL</th>
                <th style="width: 35px;">KARTU</th>
              </tr>
            </thead>
            <tbody>
              ${players.map(p => `
                <tr>
                  <td class="highlight-cell">#${p.no}</td>
                  <td class="text-left"><strong>${p.name}</strong></td>
                  <td>${p.isGk ? 'GK' : 'FP'}</td>
                  <td>${p.loss1 || 0} / ${p.loss2 || 0}</td>
                  <td>${p.rec1 || 0} / ${p.rec2 || 0}</td>
                  <td>${p.sh1 || 0} / ${p.sh2 || 0}</td>
                  <td class="highlight-cell" style="color: #16a34a;">${(p.gl1 || 0) + (p.gl2 || 0)}</td>
                  <td>${(p.fl1 || 0) + (p.fl2 || 0)}</td>
                  <td>${(p.yellowCards || 0) > 0 ? `🟨${p.yellowCards}` : ''} ${(p.redCards || 0) > 0 ? `🟥${p.redCards}` : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- AI Tactical Summary & Actionable Recommendations (Replacing Signatures) -->
          <div class="ai-dossier-box">
            <div class="ai-dossier-header">
              <span>REKOMENDASI & INSIGHT TAKTIKAL ASISTEN AI</span>
              <span style="font-size: 8.5px; color: #166534; font-weight: 700;">AI TACTICAL DOSSIER</span>
            </div>
            <p class="ai-summary-p">${briefing.executiveSummary.replace(/\*\*/g, '')}</p>

            <div class="ai-two-col">
              <div class="ai-col-card green">
                <div class="col-card-title green">✓ KEUNGGULAN TAKTIKAL</div>
                <ul class="ai-bullet-list">
                  ${briefing.strengths.map(s => `<li>${s.replace(/\*\*/g, '')}</li>`).join('')}
                </ul>
              </div>
              <div class="ai-col-card red">
                <div class="col-card-title red">⚠ AREA EVALUASI & RISIKO</div>
                <ul class="ai-bullet-list">
                  ${briefing.vulnerabilities.map(v => `<li>${v.replace(/\*\*/g, '')}</li>`).join('')}
                </ul>
              </div>
            </div>

            ${briefing.recommendations.length > 0 ? `
              <div class="ai-rec-box">
                <div class="rec-title">💡 REKOMENDASI AKSI PELATIH</div>
                <ul class="rec-bullet-list">
                  ${briefing.recommendations.map(r => `<li>${r}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static printReport(matchData: MatchData, substitutions: SubstitutionLog[]) {
    const html = this.generatePrintableHtml(matchData, substitutions);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  }
}
