import ExcelJS from 'exceljs';
import { db } from '../../db';
import { masterPlayers } from '../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generates official styled Excel Template for importing squad players
 */
export async function generatePlayerImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FAHLEFI Futsal Analytics Pro';
  workbook.lastModifiedBy = 'FAHLEFI Futsal Analytics Pro';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Data Pemain', {
    properties: { tabColor: { argb: 'FF1E3A8A' } },
    views: [{ showGridLines: true }]
  });

  // Title Banner
  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'FAHLEFI FUTSAL TACTICAL - TEMPLATE IMPORT DATA SKUAD PEMAIN';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 35;

  // Subtitle Instructions
  ws.mergeCells('A2:H2');
  const subCell = ws.getCell('A2');
  subCell.value = 'Panduan Posisi: GK | ANCHOR | FLANK_LEFT | FLANK_RIGHT | PIVOT | PLAYER. Kaki: KANAN | KIRI | KEDUA. Status: ACTIVE | INJURED | SUSPENDED';
  subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF38BDF8' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 22;

  // Header Columns
  const headers = [
    { header: 'NO PUNGGUNG', key: 'noPunggung', width: 16 },
    { header: 'NAMA LENGKAP', key: 'name', width: 28 },
    { header: 'PANGGILAN', key: 'nickname', width: 18 },
    { header: 'POSISI', key: 'position', width: 18 },
    { header: 'KAKI DOMINAN', key: 'dominantFoot', width: 16 },
    { header: 'TINGGI (CM)', key: 'height', width: 14 },
    { header: 'BERAT (KG)', key: 'weight', width: 14 },
    { header: 'STATUS', key: 'status', width: 16 }
  ];

  const headerRow = ws.getRow(4);
  headerRow.height = 26;

  headers.forEach((h, i) => {
    const colNumber = i + 1;
    ws.getColumn(colNumber).width = h.width;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  });

  // Example Sample Data Rows (17 Squad Members)
  const sampleData = [
    { no: 1, name: 'M. Rizky Pratama', nickname: 'Rizky', pos: 'GK', foot: 'KANAN', h: 182, w: 74, status: 'ACTIVE' },
    { no: 2, name: 'Dimas Aldi Setiawan', nickname: 'Dimas', pos: 'GK', foot: 'KANAN', h: 180, w: 72, status: 'ACTIVE' },
    { no: 3, name: 'Aldo Bagus Prasetyo', nickname: 'Aldo', pos: 'ANCHOR', foot: 'KANAN', h: 176, w: 69, status: 'ACTIVE' },
    { no: 4, name: 'Galang Tri Wicaksono', nickname: 'Galang', pos: 'ANCHOR', foot: 'KIRI', h: 178, w: 70, status: 'ACTIVE' },
    { no: 5, name: 'Rian Syahputra', nickname: 'Rian', pos: 'ANCHOR', foot: 'KANAN', h: 175, w: 68, status: 'ACTIVE' },
    { no: 6, name: 'Ibnu Hibban', nickname: 'Ibnu', pos: 'FLANK_LEFT', foot: 'KIRI', h: 172, w: 65, status: 'ACTIVE' },
    { no: 7, name: 'Ryan Maulana', nickname: 'Ryan', pos: 'FLANK_RIGHT', foot: 'KANAN', h: 174, w: 66, status: 'ACTIVE' },
    { no: 8, name: 'M. Zikri Ramadhan', nickname: 'Zikri', pos: 'PIVOT', foot: 'KANAN', h: 179, w: 75, status: 'ACTIVE' },
    { no: 9, name: 'Fikri Haikal', nickname: 'Fikri', pos: 'PIVOT', foot: 'KIRI', h: 181, w: 76, status: 'ACTIVE' },
    { no: 10, name: 'Reza Fahlefi', nickname: 'Reza', pos: 'FLANK_LEFT', foot: 'KIRI', h: 173, w: 67, status: 'ACTIVE' },
    { no: 11, name: 'Bagas Aditya', nickname: 'Bagas', pos: 'FLANK_RIGHT', foot: 'KANAN', h: 170, w: 64, status: 'ACTIVE' },
    { no: 12, name: 'Fajar Nugraha', nickname: 'Fajar', pos: 'PLAYER', foot: 'KANAN', h: 175, w: 68, status: 'ACTIVE' },
    { no: 13, name: 'Rangga Saputra', nickname: 'Rangga', pos: 'PLAYER', foot: 'KANAN', h: 177, w: 70, status: 'ACTIVE' },
    { no: 14, name: 'Dedi Kurniawan', nickname: 'Dedi', pos: 'PLAYER', foot: 'KIRI', h: 174, w: 68, status: 'ACTIVE' },
    { no: 15, name: 'Ilham Ramadhan', nickname: 'Ilham', pos: 'PLAYER', foot: 'KANAN', h: 176, w: 69, status: 'ACTIVE' },
    { no: 16, name: 'Wahyu Hidayat', nickname: 'Wahyu', pos: 'PLAYER', foot: 'KANAN', h: 173, w: 66, status: 'ACTIVE' },
    { no: 17, name: 'Agus Triono', nickname: 'Agus', pos: 'PLAYER', foot: 'KANAN', h: 175, w: 67, status: 'ACTIVE' },
    { no: 18, name: 'Hendra Wijaya', nickname: 'Hendra', pos: 'PIVOT', foot: 'KANAN', h: 180, w: 75, status: 'ACTIVE' },
    { no: 19, name: 'Rizky Fauzi', nickname: 'Fauzi', pos: 'FLANK_RIGHT', foot: 'KANAN', h: 171, w: 65, status: 'ACTIVE' },
    { no: 20, name: 'Bayu Pratama', nickname: 'Bayu', pos: 'ANCHOR', foot: 'KIRI', h: 177, w: 71, status: 'ACTIVE' },
    { no: 21, name: 'Tegar Prasetyo', nickname: 'Tegar', pos: 'PLAYER', foot: 'KANAN', h: 174, w: 68, status: 'ACTIVE' },
    { no: 22, name: 'Eko Prasetya', nickname: 'Eko', pos: 'GK', foot: 'KANAN', h: 183, w: 77, status: 'ACTIVE' },
    { no: 23, name: 'Satria Ramadhan', nickname: 'Satria', pos: 'PLAYER', foot: 'KANAN', h: 176, w: 69, status: 'ACTIVE' },
    { no: 24, name: 'Faisal Akbar', nickname: 'Faisal', pos: 'FLANK_LEFT', foot: 'KIRI', h: 172, w: 64, status: 'ACTIVE' },
    { no: 25, name: 'Dani Setiawan', nickname: 'Dani', pos: 'PLAYER', foot: 'KANAN', h: 175, w: 68, status: 'ACTIVE' }
  ];

  sampleData.forEach((d, idx) => {
    const row = ws.addRow([d.no, d.name, d.nickname, d.pos, d.foot, d.h, d.w, d.status]);
    row.height = 20;
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' }; // Name left aligned
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' }; // Nickname left aligned

    // Alternating zebra row background
    if (idx % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
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
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Parses uploaded Excel Buffer and returns structured player rows
 */
export async function parsePlayerExcel(buffer: Buffer): Promise<Array<any>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const ws = workbook.worksheets[0];

  const parsedPlayers: Array<any> = [];

  // Data starts at row 5 (row 1: title, row 2: subtitle, row 3: blank, row 4: header)
  // We scan from row 2 upwards in case user uploaded without custom title
  let headerRowIndex = 4;
  for (let r = 1; r <= 10; r++) {
    const row = ws.getRow(r);
    const text1 = (row.getCell(1).text || '').toUpperCase();
    const text2 = (row.getCell(2).text || '').toUpperCase();
    if (text1.includes('NO') || text2.includes('NAMA') || text1.includes('JERSEY')) {
      headerRowIndex = r;
      break;
    }
  }

  const startRow = headerRowIndex + 1;
  const rowCount = ws.rowCount;

  for (let r = startRow; r <= rowCount; r++) {
    const row = ws.getRow(r);
    const noRaw = row.getCell(1).value;
    const nameRaw = row.getCell(2).text;

    if (!noRaw && !nameRaw) continue;

    const noPunggung = parseInt(String(noRaw || '0'), 10);
    const name = String(nameRaw || '').trim();
    if (!name && isNaN(noPunggung)) continue;

    const nickname = (row.getCell(3).text || '').trim();
    let position = (row.getCell(4).text || 'PLAYER').trim().toUpperCase().replace(/\s+/g, '_');
    if (!['GK', 'ANCHOR', 'FLANK_LEFT', 'FLANK_RIGHT', 'PIVOT', 'PLAYER'].includes(position)) {
      if (position.includes('GK') || position.includes('KIPER')) position = 'GK';
      else if (position.includes('ANCHOR')) position = 'ANCHOR';
      else if (position.includes('FLANK') && position.includes('KIRI')) position = 'FLANK_LEFT';
      else if (position.includes('FLANK')) position = 'FLANK_RIGHT';
      else if (position.includes('PIVOT')) position = 'PIVOT';
      else position = 'PLAYER';
    }

    let dominantFoot = (row.getCell(5).text || 'KANAN').trim().toUpperCase();
    if (!['KANAN', 'KIRI', 'KEDUA'].includes(dominantFoot)) {
      if (dominantFoot.includes('KIRI')) dominantFoot = 'KIRI';
      else if (dominantFoot.includes('KEDUA') || dominantFoot.includes('BOTH')) dominantFoot = 'KEDUA';
      else dominantFoot = 'KANAN';
    }

    const height = parseInt(String(row.getCell(6).value || '175'), 10) || 175;
    const weight = parseInt(String(row.getCell(7).value || '68'), 10) || 68;
    
    let status = (row.getCell(8).text || 'ACTIVE').trim().toUpperCase();
    if (!['ACTIVE', 'INJURED', 'SUSPENDED'].includes(status)) {
      status = 'ACTIVE';
    }

    parsedPlayers.push({
      noPunggung: isNaN(noPunggung) ? parsedPlayers.length + 1 : noPunggung,
      name: name || `Pemain #${noPunggung}`,
      nickname,
      position,
      dominantFoot,
      height,
      weight,
      status
    });
  }

  return parsedPlayers;
}
