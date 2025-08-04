// weeklyReport.js

// =========================
// ✅ Imports
// =========================
import {
  getSales,
  getDailyExpenses,
  getMpesaPayments,
  getCredits
} from './storage.js';

import {
  formatDateYMD,
  safeDateParse,
  filterByDate,
  summarizeReport,
  createTableRow,
  createSummaryRow,
  exportReportToCSV,
  printReportTable,
  renderReportTiles
} from './reportUtils.js';

import { getStartOfWeek, getExpenseBreakdownForDate } from './utils.js';

// =========================
// ✅ Generate Weekly Report
// =========================
export function generateWeeklyReport(offset = 0) {
  // 1️⃣ Get today's date and normalize to midday to avoid UTC rollover issues
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // 2️⃣ Compute week start (Sunday) and shift by offset
  const start = getStartOfWeek(today);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - offset * 7);

  // 3️⃣ Build an array of dates Sunday → Saturday (force midday for all)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getTime());
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    return formatDateYMD(d);
  });

  // 4️⃣ Load stored data
  const sales = getSales();
  const expenses = getDailyExpenses();
  const mpesaPayments = getMpesaPayments();
  const credits = getCredits();

  // 5️⃣ Build report day by day
  const report = dates.map(date => {
    const daySales = filterByDate(sales, 'date', date);
    const salesTotal = daySales.reduce((sum, s) => sum + (s.totalSellingPrice || 0), 0);
    const buyingPrice = daySales.reduce((sum, s) => sum + (s.totalBuyingPrice || 0), 0);
    const profit = daySales.reduce((sum, s) => sum + (s.profit || 0), 0);

    const { regularExpenses, restockingExpense, expensesTotal } = getExpenseBreakdownForDate(date, expenses);

    const dayMpesa = filterByDate(mpesaPayments, 'date', date);
    const mpesaSales = dayMpesa
      .filter(m => !m.isCreditPayment)
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    const creditIssuedToday = filterByDate(credits, 'dateTaken', date);
    const creditTotal = creditIssuedToday.reduce((sum, c) => sum + (c.amount || 0), 0);

    let creditPayments = 0;
    credits.forEach(credit => {
      credit.payments.forEach(payment => {
        const paymentDate = safeDateParse(payment.date);
        if (paymentDate && formatDateYMD(paymentDate) === date) {
          creditPayments += payment.amount || 0;
        }
      });
    });

    const mpesaCreditPayments = dayMpesa
      .filter(m => m.isCreditPayment)
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    const netProfit = profit - (expensesTotal - restockingExpense);

    return {
      date,
      salesTotal,
      buyingPrice,
      profit,
      restockingExpense,
      regularExpenses,
      mpesaSales,
      creditTotal,
      creditPayments,
      mpesaCreditPayments,
      netProfit,
      hasData:
        salesTotal ||
        expensesTotal ||
        mpesaSales ||
        creditTotal ||
        creditPayments ||
        mpesaCreditPayments
    };
  });

  return report.filter(day => day.hasData);
}

// =========================
// ✅ Render Weekly Table
// =========================
export function renderWeeklyReportTable(report) {
  const tbody = document.querySelector("#weeklyReportTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const totals = summarizeReport(report);

  report.forEach(day => tbody.appendChild(createTableRow(day)));

  if (report.length > 0) {
    tbody.appendChild(createSummaryRow(totals));
  } else {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="12" style="text-align: center;">No data available for this week</td>`;
    tbody.appendChild(emptyRow);
  }

  renderReportTiles(report);
}

// =========================
// ✅ Export & Print
// =========================
export function exportWeeklyReportToCSV(report) {
  exportReportToCSV(report, "weekly");
}

export function printWeeklyReportTable() {
  printReportTable("weeklyReportTable", "Weekly Report");
}
