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
  const mpesa = getMpesaPayments();
  const credits = getCredits();

  const report = dates.map(date => {
    const daySales = sales.filter(s => s.date === date);
    const salesTotal = daySales.reduce((sum, s) => sum + s.totalSellingPrice, 0);
    const profit = daySales.reduce((sum, s) => sum + s.profit, 0);

    const dayExpenses = expenses.filter(e => e.date === date);
    const expensesTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

    const dayMpesa = mpesa.filter(m => m.date === date);
    const mpesaSales = dayMpesa.filter(m => m.reason === 'sale').reduce((sum, m) => sum + m.amount, 0);
    const creditPaymentsMpesa = dayMpesa.filter(m => m.reason === 'credit-payment').reduce((sum, m) => sum + m.amount, 0);

    const dayCredits = credits.filter(c => c.dateTaken === date);
    const creditTotal = dayCredits.reduce((sum, c) => sum + c.amount, 0);

    let creditPaymentsCash = 0;
    credits.forEach(c => {
      c.payments.forEach(p => {
        if (p.date === date) {
          const isMpesa = dayMpesa.some(m => m.amount === p.amount && m.date === p.date && m.name === c.buyerName && m.reason === 'credit-payment');
          if (!isMpesa) {
            creditPaymentsCash += p.amount;
          }
        }
      });
    });

    const netProfit = profit - expensesTotal;
    const cashAtHand = netProfit - mpesaSales - creditTotal + creditPaymentsCash;

    return {
      date,
      salesTotal,
      profit,
      expensesTotal,
      netProfit,
      mpesaSales,
      creditTotal,
      creditPaymentsCash,
      creditPaymentsMpesa,
      cashAtHand
    };
  });

  return report;
}

export function renderWeeklyReportTable(report) {
  const tbody = document.querySelector("#weeklyReportTable tbody");
  tbody.innerHTML = "";

  let totals = {
    salesTotal: 0,
    profit: 0,
    expensesTotal: 0,
    netProfit: 0,
    mpesaSales: 0,
    creditTotal: 0,
    creditPaymentsCash: 0,
    creditPaymentsMpesa: 0,
    cashAtHand: 0
  };

  report.forEach(day => {
    totals.salesTotal += day.salesTotal;
    totals.profit += day.profit;
    totals.expensesTotal += day.expensesTotal;
    totals.netProfit += day.netProfit;
    totals.mpesaSales += day.mpesaSales;
    totals.creditTotal += day.creditTotal;
    totals.creditPaymentsCash += day.creditPaymentsCash;
    totals.creditPaymentsMpesa += day.creditPaymentsMpesa;
    totals.cashAtHand += day.cashAtHand;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${day.date}</td>
      <td>${day.salesTotal}</td>
      <td>${day.profit}</td>
      <td>${day.expensesTotal}</td>
      <td>${day.netProfit}</td>
      <td>${day.mpesaSales}</td>
      <td>${day.creditTotal}</td>
      <td>${day.creditPaymentsCash}</td>
      <td>${day.creditPaymentsMpesa}</td>
      <td>${day.cashAtHand}</td>
    `;
    tbody.appendChild(row);
  });

  const totalRow = document.createElement("tr");
  totalRow.style.fontWeight = "bold";
  totalRow.innerHTML = `
    <td>Total</td>
    <td>${totals.salesTotal}</td>
    <td>${totals.profit}</td>
    <td>${totals.expensesTotal}</td>
    <td>${totals.netProfit}</td>
    <td>${totals.mpesaSales}</td>
    <td>${totals.creditTotal}</td>
    <td>${totals.creditPaymentsCash}</td>
    <td>${totals.creditPaymentsMpesa}</td>
    <td>${totals.cashAtHand}</td>
  `;
  tbody.appendChild(totalRow);
}

export function exportWeeklyReportToCSV(report) {
  const headers = [
    "Date", "Sales", "Profit", "Expenses", "Net Profit", "Mpesa Sales", "Credit Issued", "Credit Paid (Cash)", "Credit Paid (Mpesa)", "Cash at Hand"
  ];

  const rows = report.map(day => [
    day.date,
    day.salesTotal,
    day.profit,
    day.expensesTotal,
    day.netProfit,
    day.mpesaSales,
    day.creditTotal,
    day.creditPaymentsCash,
    day.creditPaymentsMpesa,
    day.cashAtHand
  ]);

  const totals = headers.map((header, i) => i === 0 ? "Total" : rows.reduce((sum, row) => sum + (parseFloat(row[i]) || 0), 0));
  const csv = [headers, ...rows, totals].map(row => row.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "weekly_report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function printWeeklyReportTable() {
  const table = document.getElementById("weeklyReportTable").outerHTML;
  const win = window.open("", "_blank");
  win.document.write("<html><head><title>Weekly Report</title></head><body>");
  win.document.write(table);
  win.document.write("</body></html>");
  win.print();
  win.close();
}
