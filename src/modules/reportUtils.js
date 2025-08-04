// reportUtils.js
import { generateMonthlyReport } from './monthlyReport.js';

export function formatDateYMD(date) {
  return date.toISOString().split('T')[0];
}

export function safeDateParse(dateString) {
  if (!dateString) return null;
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) return date;

  const parts = dateString.split(/[-/]/);
  if (parts.length === 3) {
    date = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

export function filterByDate(items, field, dateKey) {
  return items.filter(item => {
    const d = safeDateParse(item[field]);
    return d ? formatDateYMD(d) === dateKey : false;
  });
}

export function getThisMonthReport() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return generateMonthlyReport(year, month);
}

export function getThisYearReport() {
  const now = new Date();
  const year = now.getFullYear();
  let fullReport = [];

  for (let month = 1; month <= 12; month++) {
    const monthly = generateMonthlyReport(year, month);
    fullReport = fullReport.concat(monthly);
  }

  return fullReport;
}

// ✅ Reusable Calculations
export function calculateCashAtHand(day) {
  return (
    (day.salesTotal || 0)
    - (day.regularExpenses || 0)
    - (day.restockingExpense || 0)
    - (day.mpesaSales || 0)
    - (day.creditTotal || 0)
    + (day.creditPayments || 0)
    - (day.mpesaCreditPayments || 0)
  );
}

export function calculateNetProfit(day) {
  return (
    (day.salesTotal || 0)
    - (day.buyingPrice || 0)
    - (day.regularExpenses || 0)
  );
}

export function calculateCashSales(day) {
  return (day.salesTotal || 0) - (day.mpesaSales || 0);
}

export function calculateCashCreditPayments(day) {
  return (day.creditPayments || 0) - (day.mpesaCreditPayments || 0);
}

export function summarizeReport(report) {
  const totals = {
    salesTotal: 0,
    buyingPrice: 0,
    profit: 0,
    regularExpenses: 0,
    restockingExpense: 0,
    mpesaSales: 0,
    creditTotal: 0,
    creditPayments: 0,
    mpesaCreditPayments: 0,
    netProfit: 0,
    cashSales: 0,
    cashCreditPayments: 0,
    cashAtHand: 0
  };

  report.forEach(day => {
    const netProfit = calculateNetProfit(day);
    const cashAtHand = calculateCashAtHand(day);
    const cashSales = calculateCashSales(day);
    const cashCreditPayments = calculateCashCreditPayments(day);

    totals.salesTotal += day.salesTotal || 0;
    totals.buyingPrice += day.buyingPrice || 0;
    totals.profit += day.profit || 0;
    totals.regularExpenses += day.regularExpenses || 0;
    totals.restockingExpense += day.restockingExpense || 0;
    totals.mpesaSales += day.mpesaSales || 0;
    totals.creditTotal += day.creditTotal || 0;
    totals.creditPayments += day.creditPayments || 0;
    totals.mpesaCreditPayments += day.mpesaCreditPayments || 0;
    totals.netProfit += netProfit;
    totals.cashSales += cashSales;
    totals.cashCreditPayments += cashCreditPayments;
    totals.cashAtHand += cashAtHand;

    // Attach for reuse
    day.netProfit = netProfit;
    day.cashAtHand = cashAtHand;
  });

  return totals;
}

export function createTableRow(day) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${day.date}</td>
    <td>Ksh ${(day.salesTotal || 0).toFixed(2)}</td>
    <td>Ksh ${(day.buyingPrice || 0).toFixed(2)}</td>
    <td>Ksh ${(day.profit || 0).toFixed(2)}</td>
    <td>Ksh ${(day.restockingExpense || 0).toFixed(2)}</td>
    <td>Ksh ${(day.regularExpenses || 0).toFixed(2)}</td>
    <td>Ksh ${(day.netProfit || calculateNetProfit(day)).toFixed(2)}</td>
    <td>Ksh ${(day.mpesaSales || 0).toFixed(2)}</td>
    <td>Ksh ${(day.creditTotal || 0).toFixed(2)}</td>
    <td>Ksh ${(day.creditPayments || 0).toFixed(2)}</td>
    <td>Ksh ${(day.mpesaCreditPayments || 0).toFixed(2)}</td>
    <td>Ksh ${(day.cashAtHand || calculateCashAtHand(day)).toFixed(2)}</td>
  `;
  return row;
}

export function createSummaryRow(totals) {
  const row = document.createElement("tr");
  row.classList.add("summary-row");
  row.innerHTML = `
    <th>Total</th>
    <th>Ksh ${(totals.salesTotal || 0).toFixed(2)}</th>
    <th>Ksh ${(totals.buyingPrice || 0).toFixed(2)}</th>
    <th>Ksh ${(totals.profit || 0).toFixed(2)}</th>
    <th>Ksh ${(totals.restockingExpense || 0).toFixed(2)}</th>
    <th>Ksh ${(totals.regularExpenses || 0).toFixed(2)}</th>
    <th>Ksh ${(totals.netProfit || 0).toFixed(2)}</th>
    <th>Ksh ${(totals.mpesaSales || 0).toFixed(2)}</th>
    <th>Ksh ${(totals.creditTotal || 0).toFixed(2)}</th>
    <th>Ksh ${(totals.creditPayments || 0).toFixed(2)}</th>
    <th>Ksh ${(totals.mpesaCreditPayments || 0).toFixed(2)}</th>
    <th>Ksh ${(totals.cashAtHand || 0).toFixed(2)}</th>
  `;
  return row;
}

export function exportReportToCSV(report, type = "report") {
  const headers = [
    "Date", "Total Sales", "Buying Price", "Gross Profit", "Restocking", "Regular Expenses", "Net Profit",
    "Mpesa Sales", "Credit Issued", "Credit Payments", "Mpesa Credit Payments", "Cash at Hand"
  ];

  const csvRows = [headers];

  // ✅ Add each day's data
  report.forEach(day => {
    const netProfit = day.netProfit || calculateNetProfit(day);
    const cashAtHand = day.cashAtHand || calculateCashAtHand(day);

    csvRows.push([
      day.date,
      (day.salesTotal || 0).toFixed(2),
      (day.buyingPrice || 0).toFixed(2),
      (day.profit || 0).toFixed(2),
      (day.restockingExpense || 0).toFixed(2),
      (day.regularExpenses || 0).toFixed(2),
      netProfit.toFixed(2),
      (day.mpesaSales || 0).toFixed(2),
      (day.creditTotal || 0).toFixed(2),
      (day.creditPayments || 0).toFixed(2),
      (day.mpesaCreditPayments || 0).toFixed(2),
      cashAtHand.toFixed(2)
    ]);
  });

  // ✅ Add totals row
  if (report.length > 0) {
    const totals = summarizeReport(report);
    csvRows.push([
      "TOTAL",
      (totals.salesTotal || 0).toFixed(2),
      (totals.buyingPrice || 0).toFixed(2),
      (totals.profit || 0).toFixed(2),
      (totals.restockingExpense || 0).toFixed(2),
      (totals.regularExpenses || 0).toFixed(2),
      (totals.netProfit || 0).toFixed(2),
      (totals.mpesaSales || 0).toFixed(2),
      (totals.creditTotal || 0).toFixed(2),
      (totals.creditPayments || 0).toFixed(2),
      (totals.mpesaCreditPayments || 0).toFixed(2),
      (totals.cashAtHand || 0).toFixed(2)
    ]);
  }

  // ✅ Generate CSV file
  const csv = csvRows.map(row => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}_report_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


export function printReportTable(tableId, title) {
  const table = document.getElementById(tableId).outerHTML;
  const style = `
    <style>
      body { font-family: Arial, sans-serif; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      .summary-row { font-weight: bold; background-color: #f8f8f8; }
    </style>
  `;

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head><title>${title}</title>${style}</head>
      <body><h1>${title}</h1>${table}</body>
    </html>
  `);
  win.print();
  win.close();
}

export function renderSummaryCards(summary) {
  const container = document.getElementById("summary-cards");
  const filter = document.querySelector(".summary-filter"); // grab filter BEFORE clearing

  container.innerHTML = ""; // this clears everything including the filter

  if (filter) {
    container.appendChild(filter); // safely re-append
  }

  const cashIn = summary.salesTotal + summary.creditPayments;
  const cashOut = summary.restockingExpense + summary.regularExpenses + summary.mpesaSales + summary.creditTotal + summary.mpesaCreditPayments;
  const cashAtHand = cashIn - cashOut;

  // Section: Cash Flow Summary
  const cashFlowSection = document.createElement("div");
  cashFlowSection.classList.add("summary-section", "cash-flow-section");

  cashFlowSection.innerHTML = `
    <h3>Cash Flow Summary</h3>
    <div class="card-container">
      ${renderCard("Cash In", cashIn)}
      ${renderCard("Cash Out", cashOut)}
      ${renderCard("Cash at Hand", cashAtHand)}
    </div>
  `;

  // Section: Net Profit Summary
  const profitSection = document.createElement("div");
  profitSection.classList.add("summary-section", "net-profit-section");

  profitSection.innerHTML = `
    <h3>Net Profit Summary</h3>
    <div class="card-container">
      ${renderCard("Total Sales", summary.salesTotal)}
      ${renderCard("Buying Price", summary.buyingPrice)}
      ${renderCard("Regular Expenses", summary.regularExpenses)}
      ${renderCard("Net Profit", summary.netProfit)}
    </div>
  `;

  container.appendChild(cashFlowSection);
  container.appendChild(profitSection);
}

function renderCard(title, value) {
  return `
    <div class="summary-card">
      <h4>${title}</h4>
      <p>KES ${value.toLocaleString()}</p>
    </div>
  `;
}

export function renderReportTiles(report) {
  const container = document.getElementById("reportTilesContainer");
  if (!container) return;

  container.innerHTML = "";

  report.forEach(day => {
    const netProfit = day.netProfit || calculateNetProfit(day);
    const cashAtHand = day.cashAtHand || calculateCashAtHand(day);

    const tile = document.createElement("div");
    tile.className = "tile";

    tile.innerHTML = `
      <h3>${day.date}</h3>
      <p><strong>Total Sales:</strong> Ksh ${day.salesTotal.toFixed(2)}</p>
      <p><strong>Buying Price:</strong> Ksh ${(day.buyingPrice || 0).toFixed(2)}</p>
      <p><strong>Profit:</strong> Ksh ${day.profit.toFixed(2)}</p>
      <p><strong>Restocking:</strong> Ksh ${(day.restockingExpense || 0).toFixed(2)}</p>
      <p><strong>Regular Expenses:</strong> Ksh ${day.regularExpenses.toFixed(2)}</p>
      <p><strong>Net Profit:</strong> Ksh ${netProfit.toFixed(2)}</p>
      <p><strong>Mpesa Sales:</strong> Ksh ${day.mpesaSales.toFixed(2)}</p>
      <p><strong>Credit Issued:</strong> Ksh ${day.creditTotal.toFixed(2)}</p>
      <p><strong>Credit Payments:</strong> Ksh ${day.creditPayments.toFixed(2)}</p>
      <p><strong>Mpesa Credit Payments:</strong> Ksh ${day.mpesaCreditPayments.toFixed(2)}</p>
      <p><strong>Cash at Hand:</strong> Ksh ${cashAtHand.toFixed(2)}</p>
    `;

    container.appendChild(tile);
  });

  container.classList.remove("hidden");
} 
