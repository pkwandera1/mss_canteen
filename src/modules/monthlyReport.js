import { getSales, getDailyExpenses, getMpesaPayments, getCredits } from "./storage.js";

// Utility function to format dates consistently
function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Get number of days in a month
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// Robust date parser that handles multiple formats and invalid dates
function safeDateParse(dateString) {
  if (!dateString) return null;

  let date = new Date(dateString);
  if (!isNaN(date.getTime())) return date;

  const isoParts = dateString.split('-');
  if (isoParts.length === 3) {
    date = new Date(
      parseInt(isoParts[0]),
      parseInt(isoParts[1]) - 1,
      parseInt(isoParts[2])
    );
    if (!isNaN(date.getTime())) return date;
  }

  const slashParts = dateString.split('/');
  if (slashParts.length === 3) {
    date = new Date(
      parseInt(slashParts[2]),
      parseInt(slashParts[1]) - 1,
      parseInt(slashParts[0])
    );
    if (!isNaN(date.getTime())) return date;
  }

  if (!isNaN(dateString)) {
    date = new Date(parseInt(dateString));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

export function loadMonthlyReport(year, month) {
  const tbody = document.querySelector("#monthlyReportTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const sales = getSales();
  const expenses = getDailyExpenses();
  const mpesaPayments = getMpesaPayments();
  const credits = getCredits();
  const daysInMonth = getDaysInMonth(year, month);

  let totals = {
    sales: 0,
    profit: 0,
    expenses: 0,
    mpesaSales: 0,
    creditIssued: 0,
    creditPayments: 0,
    mpesaCreditPayments: 0,
    netProfit: 0
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDate(year, month, day);
    let hasData = false;

    const dailyAmounts = {
      sales: 0,
      profit: 0,
      expenses: 0,
      mpesaSales: 0,
      creditIssued: 0,
      creditPayments: 0,
      mpesaCreditPayments: 0
    };

    const filterByDate = (items, dateField = 'date') => {
      return items.filter(item => {
        const d = safeDateParse(item[dateField]);
        return d ? d.toISOString().split("T")[0] === dateKey : false;
      });
    };

    const daySales = filterByDate(sales);
    dailyAmounts.sales = daySales.reduce((sum, s) => sum + (s.totalSellingPrice || 0), 0);
    dailyAmounts.profit = daySales.reduce((sum, s) => sum + (s.profit || 0), 0);
    hasData = hasData || daySales.length > 0;

    const dayExpenses = filterByDate(expenses);
    dailyAmounts.expenses = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    hasData = hasData || dayExpenses.length > 0;

    const dayMpesa = filterByDate(mpesaPayments);
    dailyAmounts.mpesaSales = dayMpesa.reduce((sum, m) => sum + (m.amount || 0), 0);
    hasData = hasData || dayMpesa.length > 0;

    const dayCreditsIssued = filterByDate(credits, 'dateTaken');
    dailyAmounts.creditIssued = dayCreditsIssued.reduce((sum, c) => sum + (c.amount || 0), 0);

    credits.forEach(credit => {
      credit.payments.forEach(payment => {
        const paymentDate = safeDateParse(payment.date);
        if (paymentDate && paymentDate.toISOString().split("T")[0] === dateKey) {
          dailyAmounts.creditPayments += payment.amount || 0;
        }
      });
    });

    dailyAmounts.mpesaCreditPayments = dayMpesa
      .filter(m => m.type === 'Credit Payment')
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    hasData = hasData || dailyAmounts.creditIssued > 0 || dailyAmounts.creditPayments > 0;

    const net = dailyAmounts.profit - dailyAmounts.expenses;

    if (hasData) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${dateKey}</td>
        <td>Ksh ${dailyAmounts.sales.toFixed(2)}</td>
        <td>Ksh ${dailyAmounts.profit.toFixed(2)}</td>
        <td>Ksh ${dailyAmounts.expenses.toFixed(2)}</td>
        <td>Ksh ${dailyAmounts.mpesaSales.toFixed(2)}</td>
        <td>Ksh ${dailyAmounts.creditIssued.toFixed(2)}</td>
        <td>Ksh ${dailyAmounts.creditPayments.toFixed(2)}</td>
        <td>Ksh ${dailyAmounts.mpesaCreditPayments.toFixed(2)}</td>
        <td>Ksh ${net.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    }

    totals.sales += dailyAmounts.sales;
    totals.profit += dailyAmounts.profit;
    totals.expenses += dailyAmounts.expenses;
    totals.mpesaSales += dailyAmounts.mpesaSales;
    totals.creditIssued += dailyAmounts.creditIssued;
    totals.creditPayments += dailyAmounts.creditPayments;
    totals.mpesaCreditPayments += dailyAmounts.mpesaCreditPayments;
    totals.netProfit += net;
  }

  const summaryRow = document.createElement("tr");
  summaryRow.innerHTML = `
    <th>Total</th>
    <th>Ksh ${totals.sales.toFixed(2)}</th>
    <th>Ksh ${totals.profit.toFixed(2)}</th>
    <th>Ksh ${totals.expenses.toFixed(2)}</th>
    <th>Ksh ${totals.mpesaSales.toFixed(2)}</th>
    <th>Ksh ${totals.creditIssued.toFixed(2)}</th>
    <th>Ksh ${totals.creditPayments.toFixed(2)}</th>
    <th>Ksh ${totals.mpesaCreditPayments.toFixed(2)}</th>
    <th>Ksh ${totals.netProfit.toFixed(2)}</th>
  `;
  summaryRow.classList.add("summary-row");
  tbody.appendChild(summaryRow);
}

export function exportMonthlyReportToCSV(month, year) {
  const reportRows = Array.from(document.querySelectorAll("#monthlyReportTable tbody tr"));
  const csv = [
    ["Date", "Total Sales", "Profit", "Expenses", "Mpesa Sales", "Credit Issued", "Credit Payments", "Mpesa Credit Payments", "Net Profit"]
  ];

  reportRows.forEach(row => {
    const cols = Array.from(row.querySelectorAll("td, th"));
    csv.push(cols.map(cell => cell.innerText.replace("Ksh ", "")));
  });

  const blob = new Blob([csv.map(r => r.join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `monthly_report_${year}_${String(month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printMonthlyReportTable() {
  const table = document.getElementById("monthlyReportTable").outerHTML;
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
        <title>Monthly Report</title>
        ${style}
      </head>
      <body>
        <h1>Monthly Sales Report</h1>
        ${table}
      </body>
    </html>
  `);
  win.print();
  win.close();
}
