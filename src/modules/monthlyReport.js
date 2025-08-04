// monthlyReport.js (Updated to Match Weekly Summary Cards Logic)

import {
  getSales,
  getDailyExpenses,
  getMpesaPayments,
  getCredits
} from "./storage.js";

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
} from "./reportUtils.js";

import { getExpenseBreakdownForDate } from "./utils.js";

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getMonthDates(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  return Array.from({ length: daysInMonth }, (_, i) =>
    `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
  );
}

export function generateMonthlyReport(year, month) {
  const sales = getSales();
  const expenses = getDailyExpenses();
  const mpesaPayments = getMpesaPayments();
  const credits = getCredits();

  const dates = getMonthDates(year, month);

  const report = dates.map(date => {
    const daySales = filterByDate(sales, 'date', date);
    const salesTotal = daySales.reduce((sum, s) => sum + (s.totalSellingPrice || 0), 0);
    const buyingPrice = daySales.reduce((sum, s) => sum + (s.totalBuyingPrice || 0), 0);
    const profit = daySales.reduce((sum, s) => sum + (s.profit || 0), 0);

    const { regularExpenses, restockingExpense, expensesTotal } = getExpenseBreakdownForDate(date, expenses);

    const dayMpesa = filterByDate(mpesaPayments, 'date', date);
    const mpesaSales = dayMpesa.filter(m => !m.isCreditPayment).reduce((sum, m) => sum + (m.amount || 0), 0);

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

    const netProfit = profit - regularExpenses; // exclude restocking from profit calc

    return {
      date,
      salesTotal,
      buyingPrice,
      profit,
      regularExpenses,
      restockingExpense,
      mpesaSales,
      creditTotal,
      creditPayments,
      mpesaCreditPayments,
      netProfit,
      hasData: salesTotal || regularExpenses || restockingExpense || mpesaSales || creditTotal || creditPayments || mpesaCreditPayments
    };
  });

  return report.filter(day => day.hasData);
}

export function renderMonthlyReportTable(report) {
  const tbody = document.querySelector("#monthlyReportTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const totals = summarizeReport(report);

  report.forEach(day => {
    const row = createTableRow(day);
    tbody.appendChild(row);
  });

  if (report.length > 0) {
    tbody.appendChild(createSummaryRow(totals));
  } else {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="12" style="text-align: center;">No data available for this month</td>`;
    tbody.appendChild(emptyRow);
  }

  renderReportTiles(report); // ✅ renders summary cards (Cash at Hand, Net Profit, Cumulative)
}

export function exportMonthlyReportToCSV(report, year, month) {
  const filename = `monthly_report_${year}_${String(month).padStart(2, "0")}.csv`;
  exportReportToCSV(report, filename);
}

export function printMonthlyReportTable() {
  printReportTable("monthlyReportTable", "Monthly Sales Report");
}

// 👉 NEW: Get Cumulative Monthly Report for Current Month
export function getThisMonthReport() {
  const today = new Date();
  return generateMonthlyReport(today.getFullYear(), today.getMonth() + 1);
}

// 👉 NEW: Get Cumulative Report for This Year (Jan to Current Month)
export function getThisYearReport() {
  const sales = getSales();
  const expenses = getDailyExpenses();
  const mpesaPayments = getMpesaPayments();
  const credits = getCredits();

  const start = new Date(new Date().getFullYear(), 0, 1);
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const dates = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(formatDateYMD(current));
    current.setDate(current.getDate() + 1);
  }

  const report = dates.map(date => {
    const daySales = filterByDate(sales, 'date', date);
    const salesTotal = daySales.reduce((sum, s) => sum + (s.totalSellingPrice || 0), 0);
    const buyingPrice = daySales.reduce((sum, s) => sum + (s.totalBuyingPrice || 0), 0);
    const profit = daySales.reduce((sum, s) => sum + (s.profit || 0), 0);

    const { regularExpenses, restockingExpense } = getExpenseBreakdownForDate(date, expenses);

    const dayMpesa = filterByDate(mpesaPayments, 'date', date);
    const mpesaSales = dayMpesa.filter(m => !m.isCreditPayment).reduce((sum, m) => sum + (m.amount || 0), 0);

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

    const netProfit = profit - regularExpenses;

    return {
      date,
      salesTotal,
      buyingPrice,
      profit,
      regularExpenses,
      restockingExpense,
      mpesaSales,
      creditTotal,
      creditPayments,
      mpesaCreditPayments,
      netProfit,
      hasData: salesTotal || regularExpenses || restockingExpense || mpesaSales || creditTotal || creditPayments || mpesaCreditPayments
    };
  });

  return report.filter(day => day.hasData);
}
