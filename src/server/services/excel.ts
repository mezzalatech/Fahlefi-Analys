import ExcelJS from 'exceljs';
import { db } from '../../db';
import { matches, players, lineupPakets, pitchEvents, substitutions } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { existsSync } from 'fs';

export async function exportMatchToExcel(matchId: number): Promise<Buffer> {
  const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
  if (!match) {
    throw new Error('Match not found');
  }

  const matchPlayers = db.select().from(players).where(eq(players.matchId, matchId)).all();
  const matchPakets = db.select().from(lineupPakets).where(eq(lineupPakets.matchId, matchId)).all();
  const matchSubs = db.select().from(substitutions).where(eq(substitutions.matchId, matchId)).orderBy(desc(substitutions.createdAt)).all();

  const templatePath = './Template Analysis.xlsx';
  const workbook = new ExcelJS.Workbook();

  if (existsSync(templatePath)) {
    await workbook.xlsx.readFile(templatePath);
  } else {
    // Fallback create worksheet if template not found
    workbook.addWorksheet('Print File');
  }

  const ws = workbook.getWorksheet('Print File') || workbook.worksheets[0];

  // Header Match Info
  ws.getCell('D1').value = match.name;
  ws.getCell('S1').value = match.competition;
  ws.getCell('Z1').value = match.date;
  ws.getCell('AF1').value = match.time;
  ws.getCell('AL1').value = match.venue;

  // Timeouts (4 Rows: H1 Home, H1 Away, H2 Home, H2 Away)
  let timeouts: string[] = [];
  try {
    timeouts = JSON.parse(match.timeouts || '[]');
  } catch {}
  if (timeouts[0]) ws.getCell('AB4').value = timeouts[0];
  if (timeouts[1]) ws.getCell('AB5').value = timeouts[1];
  if (timeouts[2]) ws.getCell('AB6').value = timeouts[2];
  if (timeouts[3]) ws.getCell('AB7').value = timeouts[3];

  // Scores & Teams
  ws.getCell('A5').value = match.homeTeam;
  ws.getCell('D5').value = match.homeScore1st;
  ws.getCell('G5').value = match.homeScore2nd;
  ws.getCell('J5').value = match.homeScore1st + match.homeScore2nd;

  ws.getCell('A6').value = match.awayTeam;
  ws.getCell('D6').value = match.awayScore1st;
  ws.getCell('G6').value = match.awayScore2nd;
  ws.getCell('J6').value = match.awayScore1st + match.awayScore2nd;

  // Players Matrix starting row 13
  const startRow = 13;
  matchPlayers.sort((a, b) => a.no - b.no).forEach((p, idx) => {
    const r = startRow + idx;
    ws.getCell(`A${r}`).value = p.no;
    ws.getCell(`B${r}`).value = p.name;
    ws.getCell(`E${r}`).value = p.yellowCards > 0 ? p.yellowCards : null;
    ws.getCell(`F${r}`).value = p.redCards > 0 ? p.redCards : null;
    ws.getCell(`G${r}`).value = p.loss1 > 0 ? p.loss1 : null;
    ws.getCell(`I${r}`).value = p.loss2 > 0 ? p.loss2 : null;
    ws.getCell(`K${r}`).value = p.rec1 > 0 ? p.rec1 : null;
    ws.getCell(`M${r}`).value = p.rec2 > 0 ? p.rec2 : null;
    ws.getCell(`O${r}`).value = p.fl1 > 0 ? p.fl1 : null;
    ws.getCell(`Q${r}`).value = p.fl2 > 0 ? p.fl2 : null;
    ws.getCell(`S${r}`).value = p.sh1 > 0 ? p.sh1 : null;
    ws.getCell(`U${r}`).value = p.sh2 > 0 ? p.sh2 : null;
    ws.getCell(`W${r}`).value = p.gl1 > 0 ? p.gl1 : null;
    ws.getCell(`Y${r}`).value = p.gl2 > 0 ? p.gl2 : null;
  });

  // Paket in Column AE4
  if (matchPakets.length > 0) {
    const paketStr = matchPakets
      .sort((a, b) => a.paketIndex - b.paketIndex)
      .map((pkt) => `${pkt.paketIndex}. ${pkt.code}`)
      .join('\n');
    ws.getCell('AE4').value = paketStr;
  }

  // Add Log Rotasi Sheet if substitutions exist
  if (matchSubs.length > 0) {
    let subWs = workbook.getWorksheet('Log Rotasi Paket');
    if (!subWs) {
      subWs = workbook.addWorksheet('Log Rotasi Paket');
    }
    subWs.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Babak', key: 'half', width: 12 },
      { header: 'Waktu (Timer)', key: 'timeStr', width: 16 },
      { header: 'Paket / Rotasi', key: 'paket', width: 22 },
      { header: '5 Pemain di Lapangan', key: 'players', width: 30 },
      { header: 'Tipe', key: 'type', width: 18 },
      { header: 'Keterangan', key: 'note', width: 35 }
    ];

    // Style Header
    const hRow = subWs.getRow(1);
    hRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

    // Reverse to chronological order (earliest first)
    const chronological = [...matchSubs].reverse();
    chronological.forEach((sub, sIdx) => {
      let pNumsText = sub.playerNumbers;
      try {
        const nums: number[] = JSON.parse(sub.playerNumbers);
        pNumsText = nums.map(n => `#${n}`).join(', ');
      } catch {}

      subWs.addRow({
        no: sIdx + 1,
        half: `${sub.half === 1 ? '1ºH' : '2ºH'} Babak ${sub.half}`,
        timeStr: sub.timeStr || '-',
        paket: sub.paketIndex ? `Paket ${sub.paketIndex}` : 'Sub Individual',
        players: pNumsText,
        type: sub.type === 'PAKET_DEPLOY' ? 'Deploy Paket' : 'Ganti Pemain',
        note: sub.note || '-'
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
