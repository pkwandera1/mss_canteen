// weeklyReport.js

import {
  getSales,
  getDailyExpenses,
  getMpesaPayments,
  getCredits
} from './storage.js';

function getStartOfWeek(date) {
  const day = date.getDay();
  const diff = date.getDate() - day; // Sunday = 0
  return new Date(date.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Robust date parser that handles multiple formats
function safeDateParse(dateString) {
  if (!dateString) return null;
  
  // Try ISO format first
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) return date;

  // Try common alternative formats
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

export function generateWeeklyReport(offset = 0) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = getStartOfWeek(new Date(today));
  start.setDate(start.getDate() - offset * 7);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return formatDate(d);
  });

  const sales = getSales();
  const expenses = getDailyExpenses();
  const mpesaPayments = getMpesaPayments();
  const credits = getCredits();

  const report = dates.map(date => {
    // Helper function to filter by date
    const filterByDate = (items, dateField = 'date') => {
      return items.filter(item => {
        const d = safeDateParse(item[dateField]);
        return d ? d.toISOString().split("T")[0] === date : false;
      });
    };
    
    // Process sales
    const daySales = filterByDate(sales);
    const salesTotal = daySales.reduce((sum, s) => sum + (s.totalSellingPrice || 0), 0);
    const profit = daySales.reduce((sum, s) => sum + (s.profit || 0), 0);

    // Process expenses
    const dayExpenses = filterByDate(expenses);
    const expensesTotal = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Process Mpesa payments
    const dayMpesa = filterByDate(mpesaPayments);
    const mpesaSales = dayMpesa
      .filter(m => !m.isCreditPayment)
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    // Process credits
    const dayCredits = filterByDate(credits, 'dateTaken');
    const creditTotal = dayCredits.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    // Credit payments (all types)
    let creditPayments = 0;
    dayCredits.forEach(credit => {
      credit.payments.forEach(payment => {
        const paymentDate = safeDateParse(payment.date);
        if (paymentDate && paymentDate.toISOString().split("T")[0] === date) {
          creditPayments += payment.amount || 0;
        }
      });
    });
    
    // Mpesa credit payments
    const mpesaCreditPayments = dayMpesa
      .filter(m => m.isCreditPayment)
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    // Net profit
    const netProfit = profit - expensesTotal;

    return {
      date,
      salesTotal,
      profit,
      expensesTotal,
      mpesaSales,
      creditTotal,
      creditPayments,
      mpesaCreditPayments,
      netProfit,
      hasData: salesTotal > 0 || expensesTotal > 0 || mpesaSales > 0 || 
               creditTotal > 0 || creditPayments > 0 || mpesaCreditPayments > 0
    };
  });

  return report.filter(day => day.hasData);
}

export function renderWeeklyReportTable(report) {
  const tbody = document.querySelector("#weeklyReportTable tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  let totals = {
    salesTotal: 0,
    profit: 0,
    expensesTotal: 0,
    mpesaSales: 0,
    creditTotal: 0,
    creditPayments: 0,
    mpesaCreditPayments: 0,
    netProfit: 0
  };

  report.forEach(day => {
    totals.salesTotal += day.salesTotal || 0;
    totals.profit += day.profit || 0;
    totals.expensesTotal += day.expensesTotal || 0;
    totals.mpesaSales += day.mpesaSales || 0;
    totals.creditTotal += day.creditTotal || 0;
    totals.creditPayments += day.creditPayments || 0;
    totals.mpesaCreditPayments += day.mpesaCreditPayments || 0;
    totals.netProfit += day.netProfit || 0;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${day.date}</td>
      <td>Ksh ${day.salesTotal.toFixed(2)}</td>
      <td>Ksh ${day.profit.toFixed(2)}</td>
      <td>Ksh ${day.expensesTotal.toFixed(2)}</td>
      <td>Ksh ${day.mpesaSales.toFixed(2)}</td>
      <td>Ksh ${day.creditTotal.toFixed(2)}</td>
      <td>Ksh ${day.creditPayments.toFixed(2)}</td>
      <td>Ksh ${day.mpesaCreditPayments.toFixed(2)}</td>
      <td>Ksh ${day.netProfit.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });

  if (report.length > 0) {
    const totalRow = document.createElement("tr");
    totalRow.classList.add("summary-row");
    totalRow.innerHTML = `
      <td>Total</td>
      <td>Ksh ${totals.salesTotal.toFixed(2)}</td>
      <td>Ksh ${totals.profit.toFixed(2)}</td>
      <td>Ksh ${totals.expensesTotal.toFixed(2)}</td>
      <td>Ksh ${totals.mpesaSales.toFixed(2)}</td>
      <td>Ksh ${totals.creditTotal.toFixed(2)}</td>
      <td>Ksh ${totals.creditPayments.toFixed(2)}</td>
      <td>Ksh ${totals.mpesaCreditPayments.toFixed(2)}</td>
      <td>Ksh ${totals.netProfit.toFixed(2)}</td>
    `;
    tbody.appendChild(totalRow);
  } else {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="9" style="text-align: center;">No data available for this week</td>`;
    tbody.appendChild(emptyRow);
  }
}

// Update exportWeeklyReportToCSV and printWeeklyReportTable to match the new columns
export function exportWeeklyReportToCSV(report) {
  const headers = [
    "Date", "Total Sales", "Profit", "Expenses", "Mpesa Sales", 
    "Credit Issued", "Credit Payments", "Mpesa Credit Payments", "Net Profit"
  ];

  const totals = {
    salesTotal: 0,
    profit: 0,
    expensesTotal: 0,
    mpesaSales: 0,
    creditTotal: 0,
    creditPayments: 0,
    mpesaCreditPayments: 0,
    netProfit: 0
  };

  const rows = report.map(day => {
    totals.salesTotal += day.salesTotal || 0;
    totals.profit += day.profit || 0;
    totals.expensesTotal += day.expensesTotal || 0;
    totals.mpesaSales += day.mpesaSales || 0;
    totals.creditTotal += day.creditTotal || 0;
    totals.creditPayments += day.creditPayments || 0;
    totals.mpesaCreditPayments += day.mpesaCreditPayments || 0;
    totals.netProfit += day.netProfit || 0;

    return [
      day.date,
      day.salesTotal.toFixed(2),
      day.profit.toFixed(2),
      day.expensesTotal.toFixed(2),
      day.mpesaSales.toFixed(2),
      day.creditTotal.toFixed(2),
      day.creditPayments.toFixed(2),
      day.mpesaCreditPayments.toFixed(2),
      day.netProfit.toFixed(2)
    ];
  });

  // Add totals row
  const totalsRow = [
    "Total",
    totals.salesTotal.toFixed(2),
    totals.profit.toFixed(2),
    totals.expensesTotal.toFixed(2),
    totals.mpesaSales.toFixed(2),
    totals.creditTotal.toFixed(2),
    totals.creditPayments.toFixed(2),
    totals.mpesaCreditPayments.toFixed(2),
    totals.netProfit.toFixed(2)
  ];

  const csv = [headers, ...rows, totalsRow].map(row => row.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `weekly_report_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printWeeklyReportTable() {
  const table = document.getElementById("weeklyReportTable").outerHTML;
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
      <head>
        <title>Weekly Report</title>
        ${style}
      </head>
      <body>
        <h1>Weekly Sales Report</h1>
        ${table}
      </body>
    </html>
  `);
  win.print();
  win.close();
}