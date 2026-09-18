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
          .ai-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 9.5px;
            margin-bottom: 12px;
          }
          .ai-box h4 {
            margin: 0 0 4px 0;
            color: #166534;
            font-size: 10px;
          }
          .signatures-grid {
            display: flex;
            justify-content: space-between;
            margin-top: 24px;
            padding-top: 10px;
          }
          .sig-box {
            width: 28%;
            text-align: center;
          }
          .sig-line {
            margin-top: 40px;
            border-top: 1px solid #94a3b8;
            padding-top: 4px;
            font-weight: 700;
            font-size: 10px;
          }
          .sig-role {
            font-size: 8.5px;
            color: #64748b;
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

          <!-- AI Tactical Summary -->
          <div class="ai-box">
            <h4>ANALISIS & REKOMENDASI TAKTIKAL ASISTEN AI</h4>
            <div>${briefing.executiveSummary.replace(/\*\*/g, '')}</div>
            <div style="margin-top: 4px; font-weight: 700;">
              Top Recommendation: ${briefing.recommendations[0] || 'Pertahankan disiplin posisi.'}
            </div>
          </div>

          <!-- Signatures -->
          <div class="signatures-grid">
            <div class="sig-box">
              <div class="sig-line">HEAD COACH</div>
              <div class="sig-role">${m.homeTeam || 'Tim Futsal'}</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">MATCH ANALYST</div>
              <div class="sig-role">Fahlefi Tactical Analytics</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">TEAM CAPTAIN</div>
              <div class="sig-role">Official Sign-off</div>
            </div>
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
