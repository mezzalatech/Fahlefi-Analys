import type { MatchData, GkStat, GkConcededGoal } from '../api';
import { 
  GK_AREA_CONCEDED_IMAGE_DATA_URI, 
  GK_CONCEDED_IMAGE_DATA_URI 
} from '../assets/gkDiagramAssets';

export class GkPdfReportGenerator {
  static generatePrintableHtml(
    matchData: MatchData,
    gkStat: GkStat,
    teamLogoUrl?: string
  ): string {
    const m = matchData.match;
    const gkName = gkStat.playerName || 'M. NAZIL';
    const oppName = m.awayTeam || 'OPPONENT';
    const compName = m.competition || 'PRO FUTSAL LEAGUE';
    const logo = teamLogoUrl || '/icon.png';

    // Parse conceded goals
    let concededList: GkConcededGoal[] = [];
    try {
      concededList = typeof gkStat.concededGoals === 'string' 
        ? JSON.parse(gkStat.concededGoals || '[]') 
        : (Array.isArray(gkStat.concededGoals) ? gkStat.concededGoals : []);
    } catch {
      concededList = [];
    }

    // Direct Integration with Match Pitch Events
    const evts = matchData?.events || [];
    const oppShots = evts.filter((e: any) => {
      if (e.type !== 'shot') return false;
      if (e.team === 'away' || e.isOpponent) return true;
      return false;
    });

    const oppGoals = oppShots.filter((e: any) => e.outcome === 'goal');
    const match = matchData?.match;
    const matchOppScore1st = match?.awayScore1st || 0;
    const matchOppScore2nd = match?.awayScore2nd || 0;

    const manualConcededH1 = concededList.filter(c => c.half === 1).length;
    const manualConcededH2 = concededList.filter(c => c.half === 2).length;
    const pitchGoalH1 = oppGoals.filter((e: any) => e.half === 1).length;
    const pitchGoalH2 = oppGoals.filter((e: any) => e.half === 2).length;

    const concededH1 = Math.max(manualConcededH1, pitchGoalH1, matchOppScore1st);
    const concededH2 = Math.max(manualConcededH2, pitchGoalH2, matchOppScore2nd);

    let minutesStr = concededList.map(c => `${c.minute}'`).join(', ');
    if (!minutesStr && oppGoals.length > 0) {
      minutesStr = oppGoals.map((og: any) => og.timeStr ? `${og.timeStr}' (B${og.half})` : `B${og.half}`).join(', ');
    }
    if (!minutesStr && (concededH1 + concededH2 > 0)) {
      minutesStr = `B1: ${concededH1}, B2: ${concededH2}`;
    }
    if (!minutesStr) minutesStr = '-';

    let notesStr = concededList.map(c => c.note ? `${c.note}` : '').filter(Boolean).join('; ');
    if (!notesStr && oppGoals.length > 0) {
      notesStr = oppGoals.map((og: any) => og.note || 'Goal dari lapangan taktik').join('; ');
    }
    if (!notesStr && (concededH1 + concededH2 > 0)) {
      notesStr = 'Skor pertandingan resmi';
    }
    if (!notesStr) notesStr = '-';

    const concededItemsHtml = concededList.length > 0 
      ? concededList.map((c, i) => `<div style="margin-bottom: 2px;">Gol ${i + 1} (${c.note || 'lower shooting'} - Menit ${c.minute || '-'})</div>`).join('')
      : ((concededH1 + concededH2 > 0) ? `<div>${concededH1 + concededH2} Gol Kebobolan (Terintegrasi Skor Pertandingan)</div>` : '<div>Clean Sheet (0 Kebobolan)</div>');
    const hasPitchShots = oppShots.length > 0;
    const oppShotsOn1 = hasPitchShots 
      ? oppShots.filter((e: any) => (e.outcome === 'goal' || e.outcome === 'saved' || e.outcome === 'on_target' || e.outcome === 'ontarget') && e.half === 1).length
      : (gkStat.oppShotsOn1 || 0);
    const oppShotsOff1 = hasPitchShots
      ? oppShots.filter((e: any) => (e.outcome === 'off_target' || e.outcome === 'blocked' || e.outcome === 'wide' || e.outcome === 'post' || e.outcome === 'out' || e.outcome === 'rejected') && e.half === 1).length
      : (gkStat.oppShotsOff1 || 0);
    const oppShotsOn2 = hasPitchShots
      ? oppShots.filter((e: any) => (e.outcome === 'goal' || e.outcome === 'saved' || e.outcome === 'on_target' || e.outcome === 'ontarget') && e.half === 2).length
      : (gkStat.oppShotsOn2 || 0);
    const oppShotsOff2 = hasPitchShots
      ? oppShots.filter((e: any) => (e.outcome === 'off_target' || e.outcome === 'blocked' || e.outcome === 'wide' || e.outcome === 'post' || e.outcome === 'out' || e.outcome === 'rejected') && e.half === 2).length
      : (gkStat.oppShotsOff2 || 0);

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>GK Statistic Report - ${gkName} vs ${oppName}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Arial', sans-serif;
            color: #000000;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
          .page-container {
            width: 100%;
            height: 185mm;
            max-height: 185mm;
            min-height: 185mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            padding: 8px 12px;
            background: #ffffff;
            position: relative;
            overflow: hidden;
          }
          .page-container:last-child {
            page-break-after: auto;
          }

          /* HEADER */
          .gk-report-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
            gap: 12px;
          }
          .header-left-badges {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: nowrap;
          }
          .pill-badge-green {
            background-color: #22c55e !important;
            color: #000000 !important;
            font-weight: 800;
            font-size: 15px;
            padding: 4px 14px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .vs-text {
            font-size: 15px;
            font-weight: 800;
            color: #000000;
          }
          .pill-badge-category {
            background-color: #ffffff !important;
            color: #475569 !important;
            border: 2px solid #64748b;
            font-weight: 800;
            font-size: 14px;
            padding: 3px 12px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .pill-badge-blue {
            background-color: #0284c7 !important;
            color: #ffffff !important;
            font-weight: 800;
            font-size: 14px;
            padding: 4px 14px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
          }
          .header-logo-container {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            max-height: 40px;
          }
          .header-logo-img {
            max-height: 38px;
            max-width: 70px;
            width: auto;
            height: auto;
            object-fit: contain;
          }

          /* TABLES */
          .table-block {
            margin-bottom: 12px;
            width: 100%;
          }
          .gk-table {
            width: 100%;
            border-collapse: collapse;
            text-align: center;
          }
          .gk-table th, .gk-table td {
            border: 1.5px solid #000000;
            padding: 6px 4px;
          }
          .th-silver {
            background-color: #b0b0b0 !important;
            color: #000000;
            font-weight: 800;
            font-size: 12px;
          }
          .th-silver-sub {
            background-color: #c8c8c8 !important;
            color: #000000;
            font-weight: 700;
            font-size: 11px;
          }
          .gk-action-label {
            background-color: #ffffff;
            font-style: italic;
            font-weight: 800;
            font-size: 13px;
            text-align: center;
            width: 25%;
          }
          .row-metric-title {
            font-weight: 900;
            font-size: 13px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            background-color: #ffffff;
          }
          .cell-val {
            font-size: 14px;
            font-weight: 800;
            color: #000000;
          }
          .check-icon {
            color: #16a34a;
            font-weight: bold;
            font-size: 15px;
          }
          .cross-icon {
            color: #dc2626;
            font-weight: bold;
            font-size: 15px;
          }

          /* PAGE 3 VISUAL GRID */
          .page3-grid {
            display: grid;
            grid-template-columns: 1fr 1.25fr 0.95fr;
            gap: 16px;
            width: 100%;
            align-items: start;
          }

          /* Diagram containers */
          .diagram-box {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .diagram-image-pitch {
            max-height: 250px;
            width: auto;
            max-width: 100%;
            object-fit: contain;
            border: 1.5px solid #000000;
            border-radius: 4px;
            margin-top: 8px;
            margin-bottom: 6px;
            background: #ffffff;
          }
          .diagram-image-goal {
            max-height: 250px;
            width: auto;
            max-width: 100%;
            object-fit: contain;
            border: 1.5px solid #000000;
            border-radius: 4px;
            margin-top: 8px;
            margin-bottom: 6px;
            background: #ffffff;
          }
          .conceded-notes-list {
            font-size: 11px;
            font-weight: 700;
            margin-top: 4px;
            width: 100%;
          }

          /* Coaching Blue Card */
          .coaching-card-blue {
            background-color: #0284c7 !important;
            color: #ffffff !important;
            border-radius: 4px;
            padding: 12px 14px;
            height: 310px;
            max-height: 310px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-sizing: border-box;
            overflow: hidden;
          }
          .coaching-match-time {
            font-size: 14px;
            font-weight: 800;
            border-bottom: 1.5px solid rgba(255,255,255,0.5);
            padding-bottom: 6px;
          }
          .coaching-note-title {
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.5px;
          }
          .coaching-points {
            font-size: 11px;
            line-height: 1.45;
            font-weight: 600;
          }
          .coaching-point-item {
            margin-bottom: 6px;
          }
          .coaching-point-item strong {
            font-size: 11.5px;
            font-weight: 800;
          }
        </style>
      </head>
      <body>

        <!-- ========================================== -->
        <!-- PAGE 1: GK DEFENCE REPORT                   -->
        <!-- ========================================== -->
        <div class="page-container">
          <div class="gk-report-header">
            <div class="header-left-badges">
              <span class="pill-badge-green">${gkName}</span>
              <span class="vs-text">VS</span>
              <span class="pill-badge-green">${oppName}</span>
              <span class="pill-badge-category">DEFENCE</span>
              <span class="pill-badge-green">${compName}</span>
            </div>
            <div class="header-logo-container">
              <img src="${logo}" alt="Logo" class="header-logo-img" />
            </div>
          </div>

          <!-- Table 1: OPPONENT SHOOTING -->
          <div class="table-block">
            <table class="gk-table">
              <thead>
                <tr>
                  <th rowspan="2" class="gk-action-label">GK Actions</th>
                  <th colspan="2" class="th-silver">FIRST ROUND</th>
                  <th colspan="2" class="th-silver">SECOND ROUND</th>
                </tr>
                <tr>
                  <th class="th-silver-sub">ON TARGET</th>
                  <th class="th-silver-sub">OFF TARGET</th>
                  <th class="th-silver-sub">ON TARGET</th>
                  <th class="th-silver-sub">OFF TARGET</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-metric-title">OPPONENT SHOOTING</td>
                  <td class="cell-val">${oppShotsOn1}</td>
                  <td class="cell-val">${oppShotsOff1}</td>
                  <td class="cell-val">${oppShotsOn2}</td>
                  <td class="cell-val">${oppShotsOff2}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table 2: SAVES -->
          <div class="table-block">
            <table class="gk-table">
              <thead>
                <tr>
                  <th rowspan="2" class="gk-action-label">GK Actions</th>
                  <th colspan="5" class="th-silver">MATCH</th>
                </tr>
                <tr>
                  <th class="th-silver-sub">CATCH</th>
                  <th class="th-silver-sub">BLOCK</th>
                  <th class="th-silver-sub">CROSS</th>
                  <th class="th-silver-sub">SPLIT</th>
                  <th class="th-silver-sub">DIVE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-metric-title">SAVES</td>
                  <td class="cell-val">${gkStat.saveCatch || 0}</td>
                  <td class="cell-val">${gkStat.saveBlock || 0}</td>
                  <td class="cell-val">${gkStat.saveCross || 0}</td>
                  <td class="cell-val">${gkStat.saveSplit || 0}</td>
                  <td class="cell-val">${gkStat.saveDive || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table 3: COVERING -->
          <div class="table-block">
            <table class="gk-table">
              <thead>
                <tr>
                  <th rowspan="2" class="gk-action-label">GK Actions</th>
                  <th colspan="4" class="th-silver">MATCH</th>
                </tr>
                <tr>
                  <th class="th-silver-sub">ZONA 1</th>
                  <th class="th-silver-sub">ZONA 2</th>
                  <th class="th-silver-sub">ZONA 3</th>
                  <th class="th-silver-sub">ZONA 4</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-metric-title">COVERING</td>
                  <td class="cell-val">${gkStat.coveringZ1 || 0}</td>
                  <td class="cell-val">${gkStat.coveringZ2 || 0}</td>
                  <td class="cell-val">${gkStat.coveringZ3 || 0}</td>
                  <td class="cell-val">${gkStat.coveringZ4 || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table 4: CONCEDED GOAL -->
          <div class="table-block">
            <table class="gk-table">
              <thead>
                <tr>
                  <th rowspan="2" class="gk-action-label">GK Actions</th>
                  <th colspan="4" class="th-silver">MATCH</th>
                </tr>
                <tr>
                  <th class="th-silver-sub">FIRST ROUND</th>
                  <th class="th-silver-sub">SECOND ROUND</th>
                  <th class="th-silver-sub">MINUTES</th>
                  <th class="th-silver-sub">NOTES</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-metric-title">CONCEDED GOAL</td>
                  <td class="cell-val">${concededH1}</td>
                  <td class="cell-val">${concededH2}</td>
                  <td class="cell-val">${minutesStr}</td>
                  <td class="cell-val" style="font-size:11px; max-width:260px;">${notesStr}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- PAGE 2: GK ATTACK REPORT                    -->
        <!-- ========================================== -->
        <div class="page-container">
          <div class="gk-report-header">
            <div class="header-left-badges">
              <span class="pill-badge-green">${gkName}</span>
              <span class="vs-text">VS</span>
              <span class="pill-badge-green">${oppName}</span>
              <span class="pill-badge-category">ATTACK</span>
              <span class="pill-badge-green">${compName}</span>
            </div>
            <div class="header-logo-container">
              <img src="${logo}" alt="Logo" class="header-logo-img" />
            </div>
          </div>

          <!-- Table 1: DISTRIBUTION -->
          <div class="table-block">
            <table class="gk-table">
              <thead>
                <tr>
                  <th rowspan="3" class="gk-action-label">GK Actions</th>
                  <th colspan="6" class="th-silver">HAND</th>
                  <th colspan="6" class="th-silver">FEET</th>
                </tr>
                <tr>
                  <th colspan="2" class="th-silver-sub">SHORT</th>
                  <th colspan="2" class="th-silver-sub">MIDDLE</th>
                  <th colspan="2" class="th-silver-sub">LONG</th>
                  <th colspan="2" class="th-silver-sub">SHORT</th>
                  <th colspan="2" class="th-silver-sub">MIDDLE</th>
                  <th colspan="2" class="th-silver-sub">LONG</th>
                </tr>
                <tr>
                  <th class="th-silver-sub"><span class="check-icon">✅</span></th>
                  <th class="th-silver-sub"><span class="cross-icon">❎</span></th>
                  <th class="th-silver-sub"><span class="check-icon">✅</span></th>
                  <th class="th-silver-sub"><span class="cross-icon">❎</span></th>
                  <th class="th-silver-sub"><span class="check-icon">✅</span></th>
                  <th class="th-silver-sub"><span class="cross-icon">❎</span></th>
                  <th class="th-silver-sub"><span class="check-icon">✅</span></th>
                  <th class="th-silver-sub"><span class="cross-icon">❎</span></th>
                  <th class="th-silver-sub"><span class="check-icon">✅</span></th>
                  <th class="th-silver-sub"><span class="cross-icon">❎</span></th>
                  <th class="th-silver-sub"><span class="check-icon">✅</span></th>
                  <th class="th-silver-sub"><span class="cross-icon">❎</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-metric-title">DISTRIBUTION</td>
                  <td class="cell-val">${gkStat.handShortSuccess || 0}</td>
                  <td class="cell-val">${gkStat.handShortFail || 0}</td>
                  <td class="cell-val">${gkStat.handMidSuccess || 0}</td>
                  <td class="cell-val">${gkStat.handMidFail || 0}</td>
                  <td class="cell-val">${gkStat.handLongSuccess || 0}</td>
                  <td class="cell-val">${gkStat.handLongFail || 0}</td>
                  <td class="cell-val">${gkStat.feetShortSuccess || 0}</td>
                  <td class="cell-val">${gkStat.feetShortFail || 0}</td>
                  <td class="cell-val">${gkStat.feetMidSuccess || 0}</td>
                  <td class="cell-val">${gkStat.feetMidFail || 0}</td>
                  <td class="cell-val">${gkStat.feetLongSuccess || 0}</td>
                  <td class="cell-val">${gkStat.feetLongFail || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table 2: SHOOTING -->
          <div class="table-block">
            <table class="gk-table">
              <thead>
                <tr>
                  <th rowspan="2" class="gk-action-label">GK Actions</th>
                  <th colspan="3" class="th-silver">MATCH</th>
                </tr>
                <tr>
                  <th class="th-silver-sub">OPEN PLAY</th>
                  <th class="th-silver-sub">DROP KICK</th>
                  <th class="th-silver-sub">SET PLAY</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-metric-title">SHOOTING</td>
                  <td class="cell-val">${gkStat.shootingOpenPlay || 0}</td>
                  <td class="cell-val">${gkStat.shootingDropKick || 0}</td>
                  <td class="cell-val">${gkStat.shootingSetPlay || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table 3: ASSIST -->
          <div class="table-block">
            <table class="gk-table">
              <thead>
                <tr>
                  <th rowspan="2" class="gk-action-label">GK Actions</th>
                  <th colspan="2" class="th-silver">MATCH</th>
                </tr>
                <tr>
                  <th class="th-silver-sub">THROWING</th>
                  <th class="th-silver-sub">PASSING</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-metric-title">ASISST</td>
                  <td class="cell-val">${gkStat.assistThrowing || 0}</td>
                  <td class="cell-val">${gkStat.assistPassing || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- PAGE 3: CONCEDED AREA & POSITION EVALUATION -->
        <!-- ========================================== -->
        <div class="page-container">
          <div class="gk-report-header">
            <div class="header-left-badges">
              <span class="pill-badge-green">${gkName}</span>
              <span class="vs-text">VS</span>
              <span class="pill-badge-green">${oppName}</span>
              <span class="pill-badge-green">${compName}</span>
            </div>
            <div class="header-logo-container">
              <img src="${logo}" alt="Logo" class="header-logo-img" />
            </div>
          </div>

          <div class="page3-grid">
            <!-- 1. Conceded Area (Pitch Diagram) -->
            <div class="diagram-box">
              <span class="pill-badge-blue">Conceded area</span>
              <img 
                src="${GK_AREA_CONCEDED_IMAGE_DATA_URI}" 
                alt="Conceded Area Diagram" 
                class="diagram-image-pitch" 
              />
              <div class="conceded-notes-list">
                <div style="font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">CONCEDED :</div>
                ${concededItemsHtml}
                <div style="margin-top: 4px; font-style: italic; font-size: 10px; color: #475569;">Note : LAST SHOOTER TO GOAL</div>
              </div>
            </div>

            <!-- 2. Conceded Position (Goal Frame Diagram) -->
            <div class="diagram-box">
              <span class="pill-badge-blue">Conceded position</span>
              <img 
                src="${GK_CONCEDED_IMAGE_DATA_URI}" 
                alt="Conceded Position Diagram" 
                class="diagram-image-goal" 
              />
              <div style="margin-top: 6px; font-style: italic; font-size: 10.5px; font-weight: 700; text-align: center; color: #1e293b;">
                Note : LAST POSITION BALL AT SCORING
              </div>
            </div>

            <!-- 3. Coaching Notes Blue Card -->
            <div class="coaching-card-blue">
              <div class="coaching-match-time">
                ${gkStat.minutesPlayed || '40 minutes full match'}
              </div>
              <div class="coaching-note-title">NOTE :</div>
              <div class="coaching-points">
                <div class="coaching-point-item">
                  <strong>1. SHOOTING ANTICIPATION</strong><br/>
                  <span>${gkStat.anticipationNotes || 'Antisipasi pergerakan tembakan lawan.'}</span>
                </div>
                <div class="coaching-point-item">
                  <strong>2. REBOUND</strong><br/>
                  <span>${gkStat.reboundNotes || 'Penguasaan bola kedua / second ball.'}</span>
                </div>
                <div class="coaching-point-item">
                  <strong>3. COVERING SECOND POST</strong><br/>
                  <span>${gkStat.secondPostNotes || 'Penjagaan tiang kedua dan komunikasi lini pertahanan.'}</span>
                </div>
                ${gkStat.generalNotes ? `
                  <div class="coaching-point-item" style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 4px; margin-top: 4px;">
                    <strong>KESIMPULAN:</strong><br/>
                    <span>${gkStat.generalNotes}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

      </body>
      </html>
    `;
  }

  static printReport(matchData: MatchData, gkStat: GkStat, teamLogoUrl?: string): void {
    const htmlContent = this.generatePrintableHtml(matchData, gkStat, teamLogoUrl);
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      alert('Popup terblokir! Izinkan popup pada browser untuk mencetak dokumen GK.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    };
  }
}
