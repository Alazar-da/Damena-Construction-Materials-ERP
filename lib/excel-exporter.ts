import type ExcelJS from 'exceljs';
import { formatEthiopicDate } from './ethiopian-calendar';
import type { ReportExportData, ReportExportType } from './report-exporter';

const HEADER_BLUE = 'FF1F4E79';
const TOTAL_BLUE = 'FFE8F0FE';
const ZEBRA_GRAY = 'FFF9FAFB';
const BORDER_LIGHT = 'FFE2E8F0';
const WHITE = 'FFFFFFFF';

const serviceNames: Record<string, string> = {
  battery_charging: 'ባትሪ ቻርጅ',
  battery_acid: 'የባትሪ አሲድ መሙላት',
  welding: 'ብየዳ',
  door_window: 'በር እና መስኮት',
};

const expenseCategoryNames: Record<string, string> = {
  production_materials: 'ለቴራሶ እና ብሎክ',
  workshop_services: 'ለአገልግሎት',
  other: 'ሌላ ወጪ',
};

function colLetter(colIndex: number): string {
  let n = colIndex;
  let letter = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function getProductName(
  products?: { name: string; unit: string } | { name: string; unit: string }[] | null
): string {
  if (!products) return 'ምርት';
  if (Array.isArray(products)) return products[0]?.name || 'ምርት';
  return products.name || 'ምርት';
}

function getDisplayName(
  profiles?: { display_name: string | null } | { display_name: string | null }[] | null
): string {
  if (!profiles) return '—';
  if (Array.isArray(profiles)) return profiles[0]?.display_name || '—';
  return profiles.display_name || '—';
}

function addSimpleHeader(
  ws: ExcelJS.Worksheet,
  title: string,
  fromEth: string,
  toEth: string,
  colCount: number
) {
  const lastCol = colLetter(Math.max(2, colCount));

  ws.getRow(1).height = 24;
  ws.mergeCells(`A1:${lastCol}1`);
  const c1 = ws.getCell('A1');
  c1.value = `ዳመና የግንባታ ቁሳቁሶች (DAMENA) — ${title}`;
  c1.font = { name: 'Calibri', size: 13, bold: true, color: { argb: HEADER_BLUE } };
  c1.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.getRow(2).height = 18;
  ws.mergeCells(`A2:${lastCol}2`);
  const c2 = ws.getCell('A2');
  c2.value = `ጊዜ፦ ከ ${fromEth} እስከ ${toEth}`;
  c2.font = { name: 'Calibri', size: 10, color: { argb: 'FF475569' } };
  c2.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.getRow(3).height = 8;

  ws.pageSetup = {
    paperSize: 9,
    orientation: colCount >= 6 ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
}

function styleHeader(row: ExcelJS.Row, colCount: number, rightCols: number[] = []) {
  row.height = 22;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BLUE } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: rightCols.includes(c) ? 'right' : 'left',
    };
  }
}

function styleRow(
  row: ExcelJS.Row,
  colCount: number,
  idx: number,
  rightCols: number[] = [],
  wrapCols: number[] = []
) {
  row.height = 20;
  const bg = idx % 2 === 1 ? ZEBRA_GRAY : WHITE;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: rightCols.includes(c) ? 'right' : 'left',
      wrapText: wrapCols.includes(c),
    };
    cell.border = {
      bottom: { style: 'thin', color: { argb: BORDER_LIGHT } },
    };
  }
}

function styleTotal(row: ExcelJS.Row, colCount: number, rightCols: number[] = []) {
  row.height = 22;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BLUE } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: rightCols.includes(c) ? 'right' : 'left',
    };
    cell.border = {
      top: { style: 'thin', color: { argb: HEADER_BLUE } },
      bottom: { style: 'medium', color: { argb: HEADER_BLUE } },
    };
  }
}

function setWidths(ws: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

export async function exportReportToExcel(type: ReportExportType, data: ReportExportData) {
  const ExcelJSModule = (await import('exceljs')).default;
  const wb = new ExcelJSModule.Workbook();
  wb.creator = 'Damena ERP';
  wb.created = new Date();

  const fromEth = formatEthiopicDate(data.from, { withYearSuffix: true });
  const toEth = formatEthiopicDate(data.to, { withYearSuffix: true });

  const includeDaily = type === 'all' || type === 'daily';
  const includeCashflow = type === 'all' || type === 'cashflow';
  const includeSales = type === 'all' || type === 'sales' || type === 'cashflow';
  const includeProduction = type === 'all' || type === 'production';
  const includePayroll = type === 'all' || type === 'payroll' || type === 'cashflow';

  // 1. ማጠቃለያ (Summary)
  if (includeCashflow) {
    const ws = wb.addWorksheet('ማጠቃለያ');
    addSimpleHeader(ws, 'የገቢ እና የወጪ ማጠቃለያ', fromEth, toEth, 3);

    const salesTotal = data.sales.reduce((s, x) => s + Number(x.paid_amount || x.total_amount), 0);
    const serviceTotal = data.services.reduce((s, x) => s + Number(x.amount), 0);
    const expenseTotal = data.expenses.reduce((s, x) => s + Number(x.amount), 0);
    const payrollTotal = data.payroll.reduce((s, x) => s + Number(x.amount), 0);

    const h = ws.getRow(4);
    h.values = ['ዝርዝር', 'ዓይነት', 'መጠን (ብር)'];
    styleHeader(h, 3, [3]);

    const rows = [
      ['የምርት ሽያጭ ገቢ', 'ገቢ', salesTotal],
      ['የአገልግሎት ገቢ', 'ገቢ', serviceTotal],
      ['የእቃዎች እና ሌሎች ወጪዎች', 'ወጪ', expenseTotal],
      ['የሰራተኞች ደመወዝ', 'ወጪ', payrollTotal],
    ];
    rows.forEach((item, idx) => {
      const r = ws.getRow(5 + idx);
      r.values = item;
      styleRow(r, 3, idx, [3]);
      r.getCell(3).numFmt = '#,##0.00';
    });

    const tIn = ws.getRow(9);
    tIn.values = ['ጠቅላላ ገቢ', '', { formula: 'SUM(C5:C6)' }];
    styleTotal(tIn, 3, [3]);
    tIn.getCell(3).numFmt = '#,##0.00';

    const tOut = ws.getRow(10);
    tOut.values = ['ጠቅላላ ወጪ', '', { formula: 'SUM(C7:C8)' }];
    styleTotal(tOut, 3, [3]);
    tOut.getCell(3).numFmt = '#,##0.00';

    const net = ws.getRow(12);
    net.values = ['የተጣራ ትርፍ (ገቢ - ወጪ)', '', { formula: 'C9-C10' }];
    styleTotal(net, 3, [3]);
    net.getCell(3).numFmt = '#,##0.00';

    setWidths(ws, [34, 14, 20]);
  }

  // 2. ዕለታዊ እንቅስቃሴ (Daily)
  if (includeDaily) {
    const ws = wb.addWorksheet('ዕለታዊ እንቅስቃሴ');
    addSimpleHeader(ws, 'ዕለታዊ እንቅስቃሴ', fromEth, toEth, 8);

    const dayMap = new Map<
      string,
      { sales: number; services: number; production: number; expenses: number; payroll: number; breakage: number }
    >();
    const touch = (d: string) => {
      if (!dayMap.has(d)) {
        dayMap.set(d, { sales: 0, services: 0, production: 0, expenses: 0, payroll: 0, breakage: 0 });
      }
      return dayMap.get(d)!;
    };

    data.sales.forEach((s) => (touch(s.sale_date).sales += Number(s.paid_amount || s.total_amount || 0)));
    data.services.forEach(
      (s) =>
        (touch(
          new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date(s.created_at))
        ).services += Number(s.amount || 0))
    );
    data.production.forEach((p) => (touch(p.production_date).production += Number(p.output_quantity || 0)));
    data.expenses.forEach((e) => (touch(e.expense_date).expenses += Number(e.amount || 0)));
    data.payroll.forEach((p) => (touch(p.period_start).payroll += Number(p.amount || 0)));
    data.breakages.forEach(
      (b) =>
        (touch(
          new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date(b.created_at))
        ).breakage += Math.abs(Number(b.quantity_delta || 0)))
    );

    const dayRows = [...dayMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));

    const h = ws.getRow(4);
    h.values = ['ቀን', 'ሽያጭ (ብር)', 'አገልግሎት (ብር)', 'ምርት (ፍሬ)', 'ወጪ (ብር)', 'ደመወዝ (ብር)', 'ስብራት (ፍሬ)', 'የተጣራ ሂሳብ (ብር)'];
    styleHeader(h, 8, [2, 3, 4, 5, 6, 7, 8]);

    let rowIdx = 5;
    if (dayRows.length === 0) {
      const r = ws.getRow(rowIdx);
      r.values = ['—', 0, 0, 0, 0, 0, 0, 0];
      styleRow(r, 8, 0, [2, 3, 4, 5, 6, 7, 8]);
      rowIdx++;
    } else {
      dayRows.forEach(([d, v], idx) => {
        const r = ws.getRow(rowIdx);
        r.values = [
          formatEthiopicDate(d),
          v.sales,
          v.services,
          v.production,
          v.expenses,
          v.payroll,
          v.breakage,
          { formula: `(B${rowIdx}+C${rowIdx})-(E${rowIdx}+F${rowIdx})` },
        ];
        styleRow(r, 8, idx, [2, 3, 4, 5, 6, 7, 8]);
        [2, 3, 5, 6, 8].forEach((c) => (r.getCell(c).numFmt = '#,##0.00'));
        [4, 7].forEach((c) => (r.getCell(c).numFmt = '#,##0'));
        rowIdx++;
      });
    }

    const last = rowIdx - 1;
    ws.autoFilter = { from: 'A4', to: `H${last}` };

    const tot = ws.getRow(rowIdx);
    tot.values = [
      'ጠቅላላ',
      { formula: `SUM(B5:B${last})` },
      { formula: `SUM(C5:C${last})` },
      { formula: `SUM(D5:D${last})` },
      { formula: `SUM(E5:E${last})` },
      { formula: `SUM(F5:F${last})` },
      { formula: `SUM(G5:G${last})` },
      { formula: `SUM(H5:H${last})` },
    ];
    styleTotal(tot, 8, [2, 3, 4, 5, 6, 7, 8]);
    [2, 3, 5, 6, 8].forEach((c) => (tot.getCell(c).numFmt = '#,##0.00'));
    [4, 7].forEach((c) => (tot.getCell(c).numFmt = '#,##0'));

    setWidths(ws, [20, 15, 15, 14, 15, 15, 13, 18]);
  }

  // 3. ሽያጭ (Sales) & አገልግሎት (Services)
  if (includeSales) {
    const ws = wb.addWorksheet('ሽያጭ');
    addSimpleHeader(ws, 'የምርት ሽያጭ ዝርዝር', fromEth, toEth, 6);

    const h = ws.getRow(4);
    h.values = ['ቀን', 'የተሸጠ እቃ', 'ብዛት', 'የአንዱ ዋጋ', 'ጠቅላላ ዋጋ (ብር)', 'ደንበኛ', 'የመዘገበው'];
    styleHeader(h, 7, [3, 4, 5]);

    const flatLines: { date: string; product: string; qty: number; unitPrice: number; customer: string; recordedBy: string }[] = [];
    for (const s of data.sales) {
      const ethDate = formatEthiopicDate(s.sale_date);
      const customer = s.customer_name || 'በቀጥታ ሽያጭ';
      const rec = getDisplayName(s.profiles);
      if (s.sale_lines && s.sale_lines.length > 0) {
        for (const l of s.sale_lines) {
          flatLines.push({
            date: ethDate,
            product: l.item_name_snapshot,
            qty: Number(l.quantity || 0),
            unitPrice: Number(l.unit_price || 0),
            customer,
            recordedBy: rec,
          });
        }
      } else {
        flatLines.push({
          date: ethDate,
          product: s.invoice_number,
          qty: 1,
          unitPrice: Number(s.paid_amount || s.total_amount || 0),
          customer,
          recordedBy: rec,
        });
      }
    }

    let rowIdx = 5;
    if (flatLines.length === 0) {
      const r = ws.getRow(rowIdx);
      r.values = ['—', 'ሽያጭ የለም', 0, 0, 0, '—', '—'];
      styleRow(r, 7, 0, [3, 4, 5]);
      rowIdx++;
    } else {
      flatLines.forEach((line, idx) => {
        const r = ws.getRow(rowIdx);
        r.values = [
          line.date,
          line.product,
          line.qty,
          line.unitPrice,
          { formula: `C${rowIdx}*D${rowIdx}` },
          line.customer,
          line.recordedBy,
        ];
        styleRow(r, 7, idx, [3, 4, 5]);
        r.getCell(3).numFmt = '#,##0';
        r.getCell(4).numFmt = '#,##0.00';
        r.getCell(5).numFmt = '#,##0.00';
        rowIdx++;
      });
    }

    const last = rowIdx - 1;
    ws.autoFilter = { from: 'A4', to: `G${last}` };

    const tot = ws.getRow(rowIdx);
    tot.values = ['ጠቅላላ', '', { formula: `SUM(C5:C${last})` }, '', { formula: `SUM(E5:E${last})` }, '', ''];
    styleTotal(tot, 7, [3, 4, 5]);
    tot.getCell(3).numFmt = '#,##0';
    tot.getCell(5).numFmt = '#,##0.00';
    setWidths(ws, [20, 24, 12, 15, 18, 22, 18]);

    // Services sheet
    const sws = wb.addWorksheet('አገልግሎት');
    addSimpleHeader(sws, 'የአገልግሎት ሽያጭ ዝርዝር', fromEth, toEth, 4);

    const sh = sws.getRow(4);
    sh.values = ['ቀን', 'የአገልግሎት ዓይነት', 'ደንበኛ', 'መጠን (ብር)'];
    styleHeader(sh, 4, [4]);

    let sRow = 5;
    if (data.services.length === 0) {
      const r = sws.getRow(sRow);
      r.values = ['—', 'አገልግሎት የለም', '—', 0];
      styleRow(r, 4, 0, [4]);
      sRow++;
    } else {
      data.services.forEach((srv, idx) => {
        const r = sws.getRow(sRow);
        r.values = [
          formatEthiopicDate(srv.created_at),
          serviceNames[srv.service_type] || srv.service_type,
          srv.customer_name || 'በቀጥታ አገልግሎት',
          Number(srv.amount || 0),
        ];
        styleRow(r, 4, idx, [4]);
        r.getCell(4).numFmt = '#,##0.00';
        sRow++;
      });
    }

    sws.autoFilter = { from: 'A4', to: `D${sRow - 1}` };
    const stot = sws.getRow(sRow);
    stot.values = ['ጠቅላላ', '', '', { formula: `SUM(D5:D${sRow - 1})` }];
    styleTotal(stot, 4, [4]);
    stot.getCell(4).numFmt = '#,##0.00';
    setWidths(sws, [20, 26, 24, 18]);
  }

  // 4. ወጪዎች (Expenses)
  if (includeCashflow) {
    const ews = wb.addWorksheet('ወጪዎች');
    addSimpleHeader(ews, 'የወጪዎች እና ግዢ ዝርዝር', fromEth, toEth, 5);

    const eh = ews.getRow(4);
    eh.values = ['ቀን', 'ምድብ', 'እቃ / ወጪ', 'መጠን (ብር)', 'ማስታወሻ', 'የመዘገበው'];
    styleHeader(eh, 6, [4]);

    let eRow = 5;
    if (data.expenses.length === 0) {
      const r = ews.getRow(eRow);
      r.values = ['—', '—', 'ወጪ የለም', 0, '—', '—'];
      styleRow(r, 6, 0, [4]);
      eRow++;
    } else {
      data.expenses.forEach((exp, idx) => {
        const r = ews.getRow(eRow);
        r.values = [
          formatEthiopicDate(exp.expense_date),
          expenseCategoryNames[exp.category] || exp.category,
          exp.item_name,
          Number(exp.amount || 0),
          exp.notes || '—',
          getDisplayName(exp.profiles),
        ];
        styleRow(r, 6, idx, [4], [5]);
        r.getCell(4).numFmt = '#,##0.00';
        eRow++;
      });
    }

    ews.autoFilter = { from: 'A4', to: `F${eRow - 1}` };
    const etot = ews.getRow(eRow);
    etot.values = ['ጠቅላላ', '', '', { formula: `SUM(D5:D${eRow - 1})` }, '', ''];
    styleTotal(etot, 6, [4]);
    etot.getCell(4).numFmt = '#,##0.00';
    setWidths(ews, [20, 22, 22, 16, 36, 18]);
  }

  // 5. ደመወዝ (Payroll)
  if (includePayroll) {
    const pws = wb.addWorksheet('ደመወዝ');
    addSimpleHeader(pws, 'የሰራተኞች ደመወዝ ክፍያ', fromEth, toEth, 4);

    const ph = pws.getRow(4);
    ph.values = ['ቀን', 'የሰራተኛ ስም', 'የክፍያ ዓይነት', 'መጠን (ብር)'];
    styleHeader(ph, 4, [4]);

    let pRow = 5;
    if (data.payroll.length === 0) {
      const r = pws.getRow(pRow);
      r.values = ['—', 'ደመወዝ የለም', '—', 0];
      styleRow(r, 4, 0, [4]);
      pRow++;
    } else {
      data.payroll.forEach((pay, idx) => {
        const r = pws.getRow(pRow);
        r.values = [
          formatEthiopicDate(pay.period_start),
          pay.worker_name || '—',
          pay.pay_type === 'daily' ? 'የቀን' : pay.pay_type === 'weekly' ? 'ሳምንታዊ' : 'ወርሃዊ',
          Number(pay.amount || 0),
        ];
        styleRow(r, 4, idx, [4]);
        r.getCell(4).numFmt = '#,##0.00';
        pRow++;
      });
    }

    pws.autoFilter = { from: 'A4', to: `D${pRow - 1}` };
    const ptot = pws.getRow(pRow);
    ptot.values = ['ጠቅላላ', '', '', { formula: `SUM(D5:D${pRow - 1})` }];
    styleTotal(ptot, 4, [4]);
    ptot.getCell(4).numFmt = '#,##0.00';
    setWidths(pws, [20, 26, 16, 18]);
  }

  // 6. ምርት (Production) & ስብራት (Breakages)
  if (includeProduction) {
    const prws = wb.addWorksheet('ምርት');
    addSimpleHeader(prws, 'የምርት ዝርዝር', fromEth, toEth, 3);

    const prh = prws.getRow(4);
    prh.values = ['ቀን', 'የምርት ዓይነት', 'የተመረተ ብዛት (ፍሬ)'];
    styleHeader(prh, 3, [3]);

    let prRow = 5;
    if (data.production.length === 0) {
      const r = prws.getRow(prRow);
      r.values = ['—', 'ምርት የለም', 0];
      styleRow(r, 3, 0, [3]);
      prRow++;
    } else {
      data.production.forEach((run, idx) => {
        const prodName =
          data.products?.find((pr) => pr.id === run.output_product_id)?.name || 'ምርት';
        const r = prws.getRow(prRow);
        r.values = [formatEthiopicDate(run.production_date), prodName, Number(run.output_quantity || 0)];
        styleRow(r, 3, idx, [3]);
        r.getCell(3).numFmt = '#,##0';
        prRow++;
      });
    }

    prws.autoFilter = { from: 'A4', to: `C${prRow - 1}` };
    const prtot = prws.getRow(prRow);
    prtot.values = ['ጠቅላላ', '', { formula: `SUM(C5:C${prRow - 1})` }];
    styleTotal(prtot, 3, [3]);
    prtot.getCell(3).numFmt = '#,##0';
    setWidths(prws, [20, 26, 20]);

    // Breakages
    const bws = wb.addWorksheet('ስብራት');
    addSimpleHeader(bws, 'የተሰበሩ እቃዎች ዝርዝር', fromEth, toEth, 4);

    const bh = bws.getRow(4);
    bh.values = ['ቀን', 'የምርት ዓይነት', 'የተሰበረ ብዛት', 'ምክንያት'];
    styleHeader(bh, 4, [3]);

    let bRow = 5;
    if (data.breakages.length === 0) {
      const r = bws.getRow(bRow);
      r.values = ['—', 'ስብራት የለም', 0, '—'];
      styleRow(r, 4, 0, [3]);
      bRow++;
    } else {
      data.breakages.forEach((brk, idx) => {
        const r = bws.getRow(bRow);
        r.values = [
          formatEthiopicDate(brk.created_at),
          getProductName(brk.products),
          Math.abs(Number(brk.quantity_delta || 0)),
          brk.reason || '—',
        ];
        styleRow(r, 4, idx, [3], [4]);
        r.getCell(3).numFmt = '#,##0';
        bRow++;
      });
    }

    bws.autoFilter = { from: 'A4', to: `D${bRow - 1}` };
    const btot = bws.getRow(bRow);
    btot.values = ['ጠቅላላ', '', { formula: `SUM(C5:C${bRow - 1})` }, ''];
    styleTotal(btot, 4, [3]);
    btot.getCell(3).numFmt = '#,##0';
    setWidths(bws, [20, 24, 16, 36]);
  }

  // Trigger download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DAMENA_Report_${type}_${data.from}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
