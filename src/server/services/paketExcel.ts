import ExcelJS from 'exceljs';
import { db } from '../../db';
import { lineupPakets, players, matches } from '../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generates official styled Excel Template for 5-Man Rotation Packages (Lineups)
 */
export async function generatePaketImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FAHLEFI Futsal Analytics Pro';
  workbook.lastModifiedBy = 'FAHLEFI Futsal Analytics Pro';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Template Paket 5-Man', {
    properties: { tabColor: { argb: 'FF059669' } },
    views: [{ showGridLines: true }]
  });

  // Title Banner
  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'FAHLEFI FUTSAL TACTICAL - TEMPLATE PAKET ROTASI 5 PEMAIN (LINEUPS)';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 36;

  // Subtitle Instructions
  ws.mergeCells('A2:H2');
  const subCell = ws.getCell('A2');
  subCell.value = 'Panduan: Isi No Paket (1-9), Kode/Nama Paket, dan No Punggung 5 Pemain (P1 - P5). File ini dapat diimpor langsung ke sistem.';
  subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF38BDF8' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 22;

  // Header Columns
  const headers = [
    { header: 'NO PAKET', key: 'paketIndex', width: 14 },
    { header: 'KODE / NAMA PAKET', key: 'code', width: 28 },
    { header: 'PEMAIN 1 (GK/P1)', key: 'p1', width: 18 },
    { header: 'PEMAIN 2 (P2)', key: 'p2', width: 16 },
    { header: 'PEMAIN 3 (P3)', key: 'p3', width: 16 },
    { header: 'PEMAIN 4 (P4)', key: 'p4', width: 16 },
    { header: 'PEMAIN 5 (P5)', key: 'p5', width: 16 },
    { header: 'CATATAN / STRATEGI TAKTIK', key: 'notes', width: 34 }
  ];

  const headerRow = ws.getRow(4);
  headerRow.height = 28;

  headers.forEach((h, i) => {
    const colNumber = i + 1;
    ws.getColumn(colNumber).width = h.width;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } }; // Emerald green theme
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  });

  // Example Preset Sample Data (9 Paket Rotasi Futsal)
  const sampleData = [
    { index: 1, name: 'Paket 1 - Starter Utama', p1: 1, p2: 4, p3: 7, p4: 8, p5: 10, notes: 'Lineup Utama (1-2-1 Diamond Pressing)' },
    { index: 2, name: 'Paket 2 - Rotasi Second Unit', p1: 1, p2: 3, p3: 6, p4: 9, p5: 11, notes: 'Rotasi Babak 1 (Fast Counter Attack)' },
    { index: 3, name: 'Paket 3 - High Pressing Squad', p1: 1, p2: 5, p3: 6, p4: 7, p5: 8, notes: 'Full Court Man-to-Man High Press' },
    { index: 4, name: 'Paket 4 - Powerplay Attacking', p1: 10, p2: 4, p3: 7, p4: 8, p5: 9, notes: 'Powerplay 5v4 (Fly GK #10)' },
    { index: 5, name: 'Paket 5 - Defensive Solid Block', p1: 1, p2: 3, p3: 4, p4: 5, p5: 8, notes: 'Low Block & Zona Pertahanan Rapat' },
    { index: 6, name: 'Paket 6 - Corner & Set-Piece', p1: 1, p2: 4, p3: 8, p4: 9, p5: 10, notes: 'Skema Bola Mati / Corner Target' },
    { index: 7, name: 'Paket 7 - Rotasi Flank Kilat', p1: 1, p2: 4, p3: 6, p4: 11, p5: 10, notes: 'Kecepatan Sayap Kiri & Kanan' },
    { index: 8, name: 'Paket 8 - Dual Pivot Attacking', p1: 1, p2: 3, p3: 7, p4: 8, p5: 9, notes: 'Formasi 2-2 Dual Pivot Offense' },
    { index: 9, name: 'Paket 9 - Closing Match Control', p1: 1, p2: 3, p3: 4, p4: 5, p5: 10, notes: 'Ball Possession / Menjaga Keunggulan' }
  ];

  sampleData.forEach((d, idx) => {
    const row = ws.addRow([d.index, d.name, d.p1, d.p2, d.p3, d.p4, d.p5, d.notes]);
    row.height = 22;
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' }; // Name left aligned
    row.getCell(8).alignment = { vertical: 'middle', horizontal: 'left' }; // Notes left aligned

    // Alternating zebra row background
    if (idx % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }; // Light emerald
      });
    }

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      cell.font = { name: 'Arial', size: 9 };
    });

    // Make Player numbers bold emerald
    for (let c = 3; c <= 7; c++) {
      row.getCell(c).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF065F46' } };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generates Excel export of current match's 5-Man lineups
 */
export async function exportMatchPaketsToExcel(matchId: number): Promise<Buffer> {
  const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
  const paketsList = db.select().from(lineupPakets).where(eq(lineupPakets.matchId, matchId)).orderBy(lineupPakets.paketIndex).all();
  const matchPlayers = db.select().from(players).where(eq(players.matchId, matchId)).all();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FAHLEFI Futsal Analytics Pro';
  const ws = workbook.addWorksheet('Paket 5-Man Rotasi', {
    properties: { tabColor: { argb: 'FF059669' } },
    views: [{ showGridLines: true }]
  });

  // Title Banner
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `PAKET ROTASI 5-MAN - ${match?.homeTeam || 'Home'} vs ${match?.awayTeam || 'Away'}`;
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 34;

  const headers = [
    { header: 'NO PAKET', width: 14 },
    { header: 'KODE / NAMA PAKET', width: 26 },
    { header: 'PEMAIN 1', width: 22 },
    { header: 'PEMAIN 2', width: 22 },
    { header: 'PEMAIN 3', width: 22 },
    { header: 'PEMAIN 4', width: 22 },
    { header: 'PEMAIN 5', width: 22 }
  ];

  const headerRow = ws.getRow(3);
  headerRow.height = 26;
  headers.forEach((h, i) => {
    ws.getColumn(i + 1).width = h.width;
    const cell = headerRow.getCell(i + 1);
    cell.value = h.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const getPlayerLabel = (num: number) => {
    const pl = matchPlayers.find(p => p.no === num);
    return pl && pl.name ? `#${num} ${pl.name}` : `#${num}`;
  };

  paketsList.forEach((pkt) => {
    let pNums: number[] = [];
    try {
      pNums = JSON.parse(pkt.playerNumbers || '[]');
    } catch {
      pNums = pkt.code.split('-').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    }

    const row = ws.addRow([
      `Paket #${pkt.paketIndex}`,
      pkt.code || `Paket ${pkt.paketIndex}`,
      getPlayerLabel(pNums[0] || 0),
      getPlayerLabel(pNums[1] || 0),
      getPlayerLabel(pNums[2] || 0),
      getPlayerLabel(pNums[3] || 0),
      getPlayerLabel(pNums[4] || 0)
    ]);
    row.height = 20;
    row.alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Parses uploaded Excel file for 5-Man rotation lineup sets
 */
export async function parsePaketExcel(buffer: Buffer): Promise<Array<{ paketIndex: number; code: string; playerNumbers: string }>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const ws = workbook.worksheets[0];

  const parsedPakets: Array<{ paketIndex: number; code: string; playerNumbers: string }> = [];

  // Find header row
  let headerRowIndex = 4;
  for (let r = 1; r <= 10; r++) {
    const row = ws.getRow(r);
    const text1 = (row.getCell(1).text || '').toUpperCase();
    const text2 = (row.getCell(2).text || '').toUpperCase();
    if (text1.includes('PAKET') || text2.includes('KODE') || text2.includes('NAMA') || text1.includes('NO')) {
      headerRowIndex = r;
      break;
    }
  }

  const startRow = headerRowIndex + 1;
  const rowCount = ws.rowCount;

  for (let r = startRow; r <= rowCount; r++) {
    const row = ws.getRow(r);
    const col1 = row.getCell(1).value;
    const col2 = row.getCell(2).text;

    if (!col1 && !col2) continue;

    const paketIndex = parseInt(String(col1 || '').replace(/\D/g, ''), 10) || (parsedPakets.length + 1);
    let codeName = String(col2 || '').trim();

    // Extract player numbers from columns 3 to 7 (P1..P5)
    let pNums: number[] = [];
    for (let c = 3; c <= 7; c++) {
      const cellVal = row.getCell(c).value;
      const cellText = row.getCell(c).text;
      const numMatch = String(cellVal ?? cellText ?? '').match(/\d+/);
      if (numMatch) {
        const n = parseInt(numMatch[0], 10);
        if (n > 0 && n <= 99) {
          pNums.push(n);
        }
      }
    }

    // If columns 3-7 are empty, try parsing codeName if written like "1-4-5-8-10" or "1 4 5 8 10"
    if (pNums.length === 0 && codeName) {
      const parts = codeName.split(/[-,\s/]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= 99);
      if (parts.length >= 3) {
        pNums = parts.slice(0, 5);
      }
    }

    if (!codeName) {
      codeName = pNums.length > 0 ? pNums.join('-') : `Paket #${paketIndex}`;
    }

    if (pNums.length > 0 || codeName) {
      parsedPakets.push({
        paketIndex,
        code: codeName,
        playerNumbers: JSON.stringify(pNums)
      });
    }
  }

  return parsedPakets;
}
