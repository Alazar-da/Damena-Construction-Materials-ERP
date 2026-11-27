import { formatEthiopicDate, formatEthiopicDateTime } from './ethiopian-calendar';

export type ReportExportType = 'all' | 'daily' | 'cashflow' | 'sales' | 'production' | 'payroll';

export interface ReportExportData {
  from: string;
  to: string;
  sales: {
    id: string;
    invoice_number: string;
    sale_date: string;
    customer_name: string | null;
    total_amount: number;
    paid_amount: number;
    status: string;
    profiles?: { display_name: string | null } | { display_name: string | null }[] | null;
    sale_lines?: {
      item_name_snapshot: string;
      quantity: number;
      unit_snapshot: string;
      unit_price: number;
    }[];
  }[];
  services: {
    id: string;
    service_type: string;
    customer_name: string | null;
    amount: number;
    created_at: string;
  }[];
  expenses: {
    id: string;
    expense_date: string;
    category: string;
    item_name: string;
    amount: number;
    notes: string | null;
    profiles?: { display_name: string | null } | { display_name: string | null }[] | null;
  }[];
  payroll: {
    id: string;
    worker_name: string | null;
    pay_type: string;
    period_start: string;
    amount: number;
    status: string;
  }[];
  production: {
    id: string;
    production_date: string;
    output_quantity: number;
    output_product_id: string;
  }[];
  products?: { id: string; name: string }[];
  breakages: {
    id: string;
    quantity_delta: number;
    reason: string;
    created_at: string;
    products?: {
      name: string;
      unit: string;
    } | {
      name: string;
      unit: string;
    }[] | null;
  }[];
  cementYieldChecks?: {
    date: string;
    productName: string;
    cement: number;
    blocks: number;
    minimum: number;
    maximum: number;
    flagged: boolean;
    explanation: string;
  }[];
}

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

const formatMoney = (n: number) =>
  `${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ብር`;

const escapeCsv = (val: unknown) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Downloads a clean CSV report with UTF-8 BOM encoding so Excel renders Amharic correctly.
 */
export function exportReportToCsv(type: ReportExportType, data: ReportExportData) {
  const fromEth = formatEthiopicDate(data.from, { withYearSuffix: true });
  const toEth = formatEthiopicDate(data.to, { withYearSuffix: true });
  const generatedEth = formatEthiopicDateTime(new Date(), { withYearSuffix: true });

  const lines: string[] = [];

  // Helper to push section header
  const addTitle = (title: string) => {
    lines.push(`"ዳመና የኮንስትራክሽን ዕቃዎች ማምረቻ - DAMENA ERP"`);
    lines.push(`"${title}"`);
    lines.push(`"የሪፖርት ጊዜ:","ከ ${fromEth} እስከ ${toEth}"`);
    lines.push(`"የተዘጋጀበት ቀን:","${generatedEth}"`);
    lines.push('');
  };

  // 1. CASHFLOW / GEBI ENA WECHI
  if (type === 'all' || type === 'cashflow') {
    addTitle(type === 'all' ? 'ጠቅላላ የፋይናንስ እና የስራ ሪፖርት' : 'የገቢ እና የወጪ (ካሽፍሎው) ሪፖርት');

    const totalSales = data.sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const paidSales = data.sales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
    const totalServices = data.services.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const totalRevenue = totalSales + totalServices;

    const totalExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalPayroll = data.payroll.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalCost = totalExpenses + totalPayroll;
    const netProfit = totalRevenue - totalCost;

    lines.push('"=== 1. የገንዘብ ማጠቃለያ (FINANCIAL SUMMARY) ==="');
    lines.push(`"የእቃ ሽያጭ ጠቅላላ",${escapeCsv(formatMoney(totalSales))}`);
    lines.push(`"የተሰበሰበ ሽያጭ ገቢ",${escapeCsv(formatMoney(paidSales))}`);
    lines.push(`"የአገልግሎት ገቢ (ባትሪ/ብየዳ/በርና መስኮት)",${escapeCsv(formatMoney(totalServices))}`);
    lines.push(`"ጠቅላላ የተገኘ ገቢ (Total Revenue)",${escapeCsv(formatMoney(totalRevenue))}`);
    lines.push('');
    lines.push(`"የተገዙ እቃዎች ወጪ (ሲሚንቶ/አሸዋ/ኮሚቼ/ብረት/ሌላ)",${escapeCsv(formatMoney(totalExpenses))}`);
    lines.push(`"የሰራተኛ ደመወዝ ክፍያ (Payroll)",${escapeCsv(formatMoney(totalPayroll))}`);
    lines.push(`"ጠቅላላ የወጣ ወጪ (Total Expenses)",${escapeCsv(formatMoney(totalCost))}`);
    lines.push('');
    lines.push(`"የተጣራ ቀሪ / ትርፍ (Net Profit)",${escapeCsv(formatMoney(netProfit))}`);
    lines.push('');

    // Detailed Expenses Table
    lines.push('"=== የወጪዎች ዝርዝር (EXPENSES LIST) ==="');
    lines.push('"ቀን (ዓ.ም)","የወጪው/የእቃው ስም","ምድብ","መጠን (ብር)","ማስታወሻ"');
    data.expenses.forEach((e) => {
      lines.push(
        [
          escapeCsv(formatEthiopicDate(e.expense_date, { withYearSuffix: true })),
          escapeCsv(e.item_name),
          escapeCsv(expenseCategoryNames[e.category] || e.category),
          escapeCsv(Number(e.amount).toFixed(2)),
          escapeCsv(e.notes || '—'),
        ].join(',')
      );
    });
    lines.push(`"ጠቅላላ የወጪ ድምር","","","${totalExpenses.toFixed(2)}",""`);
    lines.push('');
  }

  // 2. SALES SECTION
  if (type === 'all' || type === 'sales') {
    if (type === 'sales') addTitle('የሽያጭ እና የአገልግሎቶች ሪፖርት');
    lines.push('"=== 2. የዕቃዎች ሽያጭ ዝርዝር (PRODUCT SALES) ==="');
    lines.push('"ቀን (ዓ.ም)","ኢንቮይስ ቁጥር","የተሸጠ እቃ","ብዛት","ደንበኛ","ጠቅላላ ዋጋ (ብር)","የተከፈለ (ብር)","ሁኔታ"');

    let totalSold = 0;
    let totalPaid = 0;
    data.sales.forEach((s) => {
      const line = s.sale_lines?.[0];
      const itemName = line?.item_name_snapshot || 'ሽያጭ';
      const qty = line ? `${line.quantity} ${line.unit_snapshot || 'ፍሬ'}` : '—';
      const statusStr = 'ተከፍሏል';
      totalSold += Number(s.total_amount);
      totalPaid += Number(s.paid_amount);

      lines.push(
        [
          escapeCsv(formatEthiopicDate(s.sale_date, { withYearSuffix: true })),
          escapeCsv(s.invoice_number),
          escapeCsv(itemName),
          escapeCsv(qty),
          escapeCsv(s.customer_name || 'በቀጥታ ሽያጭ'),
          escapeCsv(Number(s.total_amount).toFixed(2)),
          escapeCsv(Number(s.paid_amount).toFixed(2)),
          escapeCsv(statusStr),
        ].join(',')
      );
    });
    lines.push(`"ጠቅላላ የሽያጭ ድምር","","","","","${totalSold.toFixed(2)}","${totalPaid.toFixed(2)}",""`);
    lines.push('');

    // Service Sales
    lines.push('"=== የአገልግሎት ክፍያዎች ዝርዝር (SERVICES) ==="');
    lines.push('"ቀን (ዓ.ም)","የአገልግሎት ዓይነት","ደንበኛ","መጠን (ብር)"');
    let serviceSum = 0;
    data.services.forEach((sv) => {
      serviceSum += Number(sv.amount);
      lines.push(
        [
          escapeCsv(formatEthiopicDateTime(sv.created_at, { withYearSuffix: true })),
          escapeCsv(serviceNames[sv.service_type] || sv.service_type),
          escapeCsv(sv.customer_name || 'Walk-in'),
          escapeCsv(Number(sv.amount).toFixed(2)),
        ].join(',')
      );
    });
    lines.push(`"ጠቅላላ የአገልግሎት ድምር","","","${serviceSum.toFixed(2)}"`);
    lines.push('');
  }

  // 3. PRODUCTION & BREAKAGE
  if (type === 'all' || type === 'production') {
    if (type === 'production') addTitle('የምርት እና የስብርባሪ ሪፖርት');
    lines.push('"=== 3. የምርት ዝርዝር (PRODUCTION OUTPUT) ==="');
    lines.push('"ቀን (ዓ.ም)","የተመረተ ብዛት (ፍሬ)"');
    let prodTotal = 0;
    data.production.forEach((p) => {
      prodTotal += Number(p.output_quantity);
      lines.push(
        [
          escapeCsv(formatEthiopicDate(p.production_date, { withYearSuffix: true })),
          escapeCsv(Number(p.output_quantity)),
        ].join(',')
      );
    });
    lines.push(`"ጠቅላላ የተመረተ","${prodTotal}"`);
    lines.push('');

    // Breakage
    lines.push('"=== የተሰበረ እቃ ዝርዝር (BREAKAGE) ==="');
    lines.push('"ቀን (ዓ.ም)","የምርት ዓይነት","የተሰበረው ብዛት","ምክንያት"');
    let breakTotal = 0;
    data.breakages.forEach((b) => {
      const prod = Array.isArray(b.products) ? b.products[0] : b.products;
      const count = Math.abs(Number(b.quantity_delta));
      breakTotal += count;
      lines.push(
        [
          escapeCsv(formatEthiopicDateTime(b.created_at, { withYearSuffix: true })),
          escapeCsv(prod?.name || 'ምርት'),
          escapeCsv(count),
          escapeCsv(b.reason || '—'),
        ].join(',')
      );
    });
    lines.push(`"ጠቅላላ የተሰበረ ድምር","","${breakTotal}",""`);
    lines.push('');
  }

  // 4. PAYROLL SECTION
  if (type === 'all' || type === 'payroll') {
    if (type === 'payroll') addTitle('የሰራተኛ ደመወዝ ክፍያ ሪፖርት');
    lines.push('"=== 4. የሰራተኛ ደመወዝ ክፍያዎች (PAYROLL) ==="');
    lines.push('"ቀን (ዓ.ም)","የሰራተኛ ስም","የክፍያ ዓይነት","የተከፈለ መጠን (ብር)","ሁኔታ"');
    let paySum = 0;
    data.payroll.forEach((pr) => {
      paySum += Number(pr.amount);
      const payType = pr.pay_type === 'daily' ? 'ዕለታዊ' : pr.pay_type === 'weekly' ? 'ሳምንታዊ' : 'ወርሃዊ';
      lines.push(
        [
          escapeCsv(formatEthiopicDate(pr.period_start, { withYearSuffix: true })),
          escapeCsv(pr.worker_name || 'ሰራተኛ'),
          escapeCsv(payType),
          escapeCsv(Number(pr.amount).toFixed(2)),
          escapeCsv(pr.status === 'paid' ? 'ተከፍሏል' : pr.status),
        ].join(',')
      );
    });
    lines.push(`"ጠቅላላ የደመወዝ ድምር","","","${paySum.toFixed(2)}",""`);
    lines.push('');
  }

  const csvContent = lines.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `Damena_Report_${type}_${fromEth.replace(/\s+/g, '_')}_to_${toEth.replace(/\s+/g, '_')}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an official, beautifully styled print/PDF document and triggers window.print().
 */
export function exportReportToPrint(type: ReportExportType, data: ReportExportData) {
  const fromEth = formatEthiopicDate(data.from, { withYearSuffix: true });
  const toEth = formatEthiopicDate(data.to, { withYearSuffix: true });
  const generatedEth = formatEthiopicDateTime(new Date(), { withYearSuffix: true });

  const totalSales = data.sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const paidSales = data.sales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
  const totalServices = data.services.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalRevenue = totalSales + totalServices;

  const totalExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalPayroll = data.payroll.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalCost = totalExpenses + totalPayroll;
  const netProfit = totalRevenue - totalCost;

  const titleMap: Record<ReportExportType, string> = {
    all: 'ጠቅላላ የፋይናንስ እና የስራ ሪፖርት',
    daily: 'ዕለታዊ እንቅስቃሴ ሪፖርት (Daily Activity)',
    cashflow: 'የገቢ እና የወጪ (ካሽፍሎው) ሪፖርት',
    sales: 'የዕቃዎች ሽያጭ እና የአገልግሎት ሪፖርት',
    production: 'የምርት እና የስብርባሪ ሪፖርት',
    payroll: 'የሰራተኛ ደመወዝ ክፍያ ሪፖርት',
  };

  const reportTitle = titleMap[type];

  const dailyMap = new Map<string, { sales: number; services: number; production: number; expenses: number; payroll: number; breakage: number }>();
  const touchDay = (d: string) => {
    if (!dailyMap.has(d)) dailyMap.set(d, { sales: 0, services: 0, production: 0, expenses: 0, payroll: 0, breakage: 0 });
    return dailyMap.get(d)!;
  };
  data.sales.forEach((s) => (touchDay(s.sale_date).sales += Number(s.paid_amount || s.total_amount || 0)));
  data.services.forEach((s) => (touchDay(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date(s.created_at))).services += Number(s.amount || 0)));
  data.production.forEach((p) => (touchDay(p.production_date).production += Number(p.output_quantity || 0)));
  data.expenses.forEach((e) => (touchDay(e.expense_date).expenses += Number(e.amount || 0)));
  data.payroll.forEach((p) => (touchDay(p.period_start).payroll += Number(p.amount || 0)));
  data.breakages.forEach((b) => (touchDay(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date(b.created_at))).breakage += Math.abs(Number(b.quantity_delta || 0))));
  const dailyEntries = [...dailyMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const html = `<!DOCTYPE html>
<html lang="am" dir="ltr">
<head>
  <meta charset="utf-8">
  <title>${reportTitle} - ዳመና ERP</title>
  <style>
    @page { size: A4; margin: 15mm 12mm 15mm 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #fff;
      margin: 0;
      padding: 20px;
      font-size: 11pt;
      line-height: 1.4;
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .company-title {
      font-size: 18pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .company-sub {
      font-size: 10pt;
      color: #475569;
      font-weight: 600;
      margin-top: 2px;
    }
    .report-meta {
      text-align: right;
      font-size: 9.5pt;
      color: #475569;
    }
    .report-title-badge {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 14px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .card-label {
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .card-val {
      font-size: 13pt;
      font-weight: 900;
      font-family: monospace;
    }
    .text-emerald { color: #047857; }
    .text-rose { color: #be123c; }
    .text-blue { color: #1d4ed8; }

    .section-title {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 20px;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 9pt;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 7px 8px;
      border: 1px solid #cbd5e1;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
    }
    tr:nth-child(even) { background: #fafafa; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }

    .signatures {
      margin-top: 35px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      border-top: 1px dashed #cbd5e1;
      padding-top: 20px;
    }
    .sig-col {
      width: 30%;
      font-size: 9.5pt;
      color: #334155;
    }
    .sig-line {
      margin-top: 30px;
      border-bottom: 1px solid #64748b;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <div class="company-title">ዳመና የኮንስትራክሽን ዕቃዎች ማምረቻ</div>
      <div class="company-sub">Damena Construction Materials Enterprise · ERP Financial & Operations System</div>
    </div>
    <div class="report-meta">
      <div><strong>የሪፖርት ጊዜ፦</strong> ከ ${fromEth} እስከ ${toEth}</div>
      <div><strong>የተዘጋጀበት ቀን፦</strong> ${generatedEth}</div>
    </div>
  </div>

  <div class="report-title-badge">${reportTitle}</div>

  ${
    type === 'all' || type === 'cashflow'
      ? `
    <div class="summary-grid">
      <div class="card">
        <div class="card-label">ጠቅላላ ገቢ (Total Revenue)</div>
        <div class="card-val text-emerald">${formatMoney(totalRevenue)}</div>
      </div>
      <div class="card">
        <div class="card-label">የተሰበሰበ ሽያጭ ገቢ</div>
        <div class="card-val text-blue">${formatMoney(paidSales)}</div>
      </div>
      <div class="card">
        <div class="card-label">ጠቅላላ ወጪ (Total Expenses)</div>
        <div class="card-val text-rose">${formatMoney(totalCost)}</div>
      </div>
      <div class="card">
        <div class="card-label">የተጣራ ትርፍ / ቀሪ (Net Profit)</div>
        <div class="card-val ${netProfit >= 0 ? 'text-emerald' : 'text-rose'}">${formatMoney(netProfit)}</div>
      </div>
    </div>
  `
      : ''
  }

  ${
    type === 'all' || type === 'daily'
      ? `
    <div class="section">
      <div class="section-title">
        <span>ዕለታዊ እንቅስቃሴ (Daily Activity Summary)</span>
        <span>${dailyEntries.length} ቀናት</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>ቀን (ዓ.ም)</th>
            <th class="text-right">ሽያጭ</th>
            <th class="text-right">አገልግሎት</th>
            <th class="text-right">ምርት</th>
            <th class="text-right">ወጪ</th>
            <th class="text-right">ደመወዝ</th>
            <th class="text-right">ስብራት</th>
            <th class="text-right">የተጣራ ሂሳብ</th>
          </tr>
        </thead>
        <tbody>
          ${
            dailyEntries.length > 0
              ? dailyEntries
                  .map(([d, v]) => {
                    const net = v.sales + v.services - (v.expenses + v.payroll);
                    return `
            <tr>
              <td class="font-mono">${formatEthiopicDate(d, { withYearSuffix: true })}</td>
              <td class="text-right font-mono">${formatMoney(v.sales)}</td>
              <td class="text-right font-mono">${formatMoney(v.services)}</td>
              <td class="text-right font-mono">+${v.production.toLocaleString()}</td>
              <td class="text-right font-mono">${formatMoney(v.expenses)}</td>
              <td class="text-right font-mono">${formatMoney(v.payroll)}</td>
              <td class="text-right font-mono">-${v.breakage.toLocaleString()}</td>
              <td class="text-right font-mono font-bold">${formatMoney(net)}</td>
            </tr>
          `;
                  })
                  .join('')
              : '<tr><td colspan="8" class="text-center">ምንም ዕለታዊ እንቅስቃሴ የለም</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `
      : ''
  }

  ${
    type === 'all' || type === 'cashflow'
      ? `
    <div class="section-title">
      <span>የወጪዎችና የግዢዎች ዝርዝር (Expenses)</span>
      <span class="font-mono font-bold">${formatMoney(totalExpenses)}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>ቀን (ዓ.ም)</th>
          <th>የእቃው / የወጪው ስም</th>
          <th>ምድብ</th>
          <th class="text-right">መጠን (ብር)</th>
          <th>ማስታወሻ</th>
          <th>የመዘገበው</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.expenses.length > 0
            ? data.expenses
                .map(
                  (e) => {
                    const rec = Array.isArray(e.profiles) ? e.profiles[0]?.display_name : e.profiles?.display_name;
                    return `
          <tr>
            <td class="font-mono">${formatEthiopicDate(e.expense_date, { withYearSuffix: true })}</td>
            <td class="font-bold">${e.item_name}</td>
            <td>${expenseCategoryNames[e.category] || e.category}</td>
            <td class="text-right font-mono font-bold">${Number(e.amount).toFixed(2)}</td>
            <td>${e.notes || '—'}</td>
            <td>${rec || '—'}</td>
          </tr>
        `;
                  }
                )
                .join('')
            : '<tr><td colspan="6" class="text-center">በዚህ ክፍለ-ጊዜ የተመዘገበ ወጪ የለም</td></tr>'
        }
        <tr style="background:#f1f5f9;font-weight:bold;">
          <td colspan="3">ጠቅላላ የወጪ ድምር</td>
          <td class="text-right font-mono">${formatMoney(totalExpenses)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>
  `
      : ''
  }

  ${
    type === 'all' || type === 'sales'
      ? `
    <div class="section-title">
      <span>የዕቃዎች ሽያጭ ዝርዝር (Product Sales)</span>
      <span class="font-mono font-bold">${formatMoney(totalSales)}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>ቀን (ዓ.ም)</th>
          <th>ኢንቮይስ</th>
          <th>የተሸጠ እቃ</th>
          <th>ብዛት</th>
          <th>ደንበኛ</th>
          <th class="text-right">ጠቅላላ ዋጋ</th>
          <th class="text-right">የተከፈለ</th>
          <th>የመዘገበው</th>
          <th class="text-center">ሁኔታ</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.sales.length > 0
            ? data.sales
                .map((s) => {
                  const line = s.sale_lines?.[0];
                  const itemName = line?.item_name_snapshot || 'Product Sale';
                  const qty = line ? `${line.quantity} ${line.unit_snapshot || 'pcs'}` : '—';
                  const rec = Array.isArray(s.profiles) ? s.profiles[0]?.display_name : s.profiles?.display_name;
                  return `
            <tr>
              <td class="font-mono">${formatEthiopicDate(s.sale_date, { withYearSuffix: true })}</td>
              <td class="font-mono">${s.invoice_number}</td>
              <td class="font-bold">${itemName}</td>
              <td class="font-mono">${qty}</td>
              <td>${s.customer_name || 'በቀጥታ ሽያጭ'}</td>
              <td class="text-right font-mono font-bold">${Number(s.total_amount).toFixed(2)}</td>
              <td class="text-right font-mono">${Number(s.paid_amount).toFixed(2)}</td>
              <td>${rec || '—'}</td>
              <td class="text-center">ተከፍሏል</td>
            </tr>
          `;
                })
                .join('')
            : '<tr><td colspan="9" class="text-center">በዚህ ክፍለ-ጊዜ የተመዘገበ ሽያጭ የለም</td></tr>'
        }
        <tr style="background:#f1f5f9;font-weight:bold;">
          <td colspan="5">ጠቅላላ የሽያጭ ድምር</td>
          <td class="text-right font-mono">${formatMoney(totalSales)}</td>
          <td class="text-right font-mono">${formatMoney(paidSales)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">
      <span>የአገልግሎት ክፍያዎች ዝርዝር (Services: ባትሪ/ብየዳ/በርና መስኮት)</span>
      <span class="font-mono font-bold">${formatMoney(totalServices)}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>ቀን (ዓ.ም)</th>
          <th>የአገልግሎት ዓይነት</th>
          <th>ደንበኛ</th>
          <th class="text-right">መጠን (ብር)</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.services.length > 0
            ? data.services
                .map(
                  (sv) => `
          <tr>
            <td class="font-mono">${formatEthiopicDateTime(sv.created_at, { withYearSuffix: true })}</td>
            <td class="font-bold">${serviceNames[sv.service_type] || sv.service_type}</td>
            <td>${sv.customer_name || 'Walk-in'}</td>
            <td class="text-right font-mono font-bold">${Number(sv.amount).toFixed(2)}</td>
          </tr>
        `
                )
                .join('')
            : '<tr><td colspan="4" class="text-center">የተመዘገበ የአገልግሎት ክፍያ የለም</td></tr>'
        }
        <tr style="background:#f1f5f9;font-weight:bold;">
          <td colspan="3">ጠቅላላ የአገልግሎት ድምር</td>
          <td class="text-right font-mono">${formatMoney(totalServices)}</td>
        </tr>
      </tbody>
    </table>
  `
      : ''
  }

  ${
    type === 'all' || type === 'production'
      ? `
    <div class="section-title">
      <span>የምርት እና የስብርባሪ ዝርዝር (Production & Breakage)</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <strong>የተመረተ ምርት (Production Output)</strong>
        <table>
          <thead>
            <tr>
              <th>ቀን (ዓ.ም)</th>
              <th>የምርት ዓይነት</th>
              <th class="text-right">የተመረተ ብዛት (ፍሬ)</th>
            </tr>
          </thead>
          <tbody>
            ${
              data.production.length > 0
                ? data.production
                    .map(
                      (p) => `
              <tr>
                <td class="font-mono">${formatEthiopicDate(p.production_date, { withYearSuffix: true })}</td>
                <td>${data.products?.find((pr) => pr.id === p.output_product_id)?.name || 'ምርት'}</td>
                <td class="text-right font-mono font-bold">+${Number(p.output_quantity).toLocaleString()}</td>
              </tr>
            `
                    )
                    .join('')
                : '<tr><td colspan="3" class="text-center">ምንም የተመረተ የለም</td></tr>'
            }
          </tbody>
        </table>
      </div>

      <div>
        <strong>የተሰበረ እቃ ዝርዝር (Breakage)</strong>
        <table>
          <thead>
            <tr>
              <th>ቀን (ዓ.ም)</th>
              <th>ምርት</th>
              <th class="text-right">የተሰበረ</th>
              <th>ምክንያት</th>
            </tr>
          </thead>
          <tbody>
            ${
              data.breakages.length > 0
                ? data.breakages
                    .map((b) => {
                      const prod = Array.isArray(b.products) ? b.products[0] : b.products;
                      return `
              <tr>
                <td class="font-mono">${formatEthiopicDate(b.created_at, { withYearSuffix: true })}</td>
                <td>${prod?.name || 'ምርት'}</td>
                <td class="text-right font-mono text-rose font-bold">-${Math.abs(Number(b.quantity_delta))}</td>
                <td>${b.reason || '—'}</td>
              </tr>
            `;
                    })
                    .join('')
                : '<tr><td colspan="4" class="text-center">የተሰበረ እቃ የለም</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>
  `
      : ''
  }

  ${
    type === 'all' || type === 'payroll'
      ? `
    <div class="section-title">
      <span>የሰራተኛ ደመወዝ ክፍያዎች (Payroll)</span>
      <span class="font-mono font-bold">${formatMoney(totalPayroll)}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>ቀን (ዓ.ም)</th>
          <th>የሰራተኛ ስም</th>
          <th>የክፍያ ዓይነት</th>
          <th class="text-right">የተከፈለ መጠን (ብር)</th>
          <th class="text-center">ሁኔታ</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.payroll.length > 0
            ? data.payroll
                .map((pr) => {
                  const payType = pr.pay_type === 'daily' ? 'ዕለታዊ' : pr.pay_type === 'weekly' ? 'ሳምንታዊ' : 'ወርሃዊ';
                  return `
            <tr>
              <td class="font-mono">${formatEthiopicDate(pr.period_start, { withYearSuffix: true })}</td>
              <td class="font-bold">${pr.worker_name || 'ሰራተኛ'}</td>
              <td>${payType}</td>
              <td class="text-right font-mono font-bold">${Number(pr.amount).toFixed(2)}</td>
              <td class="text-center">${pr.status === 'paid' ? 'ተከፍሏል' : pr.status}</td>
            </tr>
          `;
                })
                .join('')
            : '<tr><td colspan="5" class="text-center">የተከፈለ ደመወዝ የለም</td></tr>'
        }
        <tr style="background:#f1f5f9;font-weight:bold;">
          <td colspan="3">ጠቅላላ የደመወዝ ድምር</td>
          <td class="text-right font-mono">${formatMoney(totalPayroll)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  `
      : ''
  }

  <div class="signatures">
    <div class="sig-col">
      <div>ያዘጋጀው (Prepared by):</div>
      <div class="sig-line"></div>
      <div style="margin-top:4px;font-size:8.5pt;color:#64748b;">ፊርማ እና ቀን</div>
    </div>
    <div class="sig-col">
      <div>ያረጋገጠው (Audited by):</div>
      <div class="sig-line"></div>
      <div style="margin-top:4px;font-size:8.5pt;color:#64748b;">ፊርማ እና ቀን</div>
    </div>
    <div class="sig-col">
      <div>የፈቀደው / ስራ አስኪያጅ (Approved by):</div>
      <div class="sig-line"></div>
      <div style="margin-top:4px;font-size:8.5pt;color:#64748b;">ፊርማ እና ቀን</div>
    </div>
  </div>

</body>
</html>`;

  // Print using a hidden iframe so it works in Electron desktop app & browsers without about:blank popups
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeWin = iframe.contentWindow;
  const doc = iframeWin?.document;
  if (doc && iframeWin) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframeWin.focus();
      iframeWin.print();
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1500);
    }, 300);
  }
}
