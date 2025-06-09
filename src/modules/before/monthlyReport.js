import { getSales, getDailyExpenses } from "./storage.js";

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function loadMonthlyReport(year, month) {
  const tbody = document.querySelector("#monthlyReportTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const sales = getSales();
  const expenses = getDailyExpenses();
  const daysInMonth = getDaysInMonth(year, month);

  let totalSales = 0;
  let totalProfit = 0;
  let totalExpenses = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDate(year, month, day);

    const daySales = sales.filter(s => {
      const d = new Date(s.date);
      return d.toISOString().split("T")[0] === dateKey;
    });

    const dayExpenses = expenses.filter(e => e.date === dateKey);

    const dailySales = daySales.reduce((sum, s) => sum + s.totalSellingPrice, 0);
    const dailyProfit = daySales.reduce((sum, s) => sum + s.profit, 0);
    const dailyExpense = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const net = dailyProfit - dailyExpense;

    // ✅ Only include rows with data
    if (daySales.length > 0 || dayExpenses.length > 0) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${dateKey}</td>
        <td>Ksh ${dailySales.toFixed(2)}</td>
        <td>Ksh ${dailyProfit.toFixed(2)}</td>
        <td>Ksh ${dailyExpense.toFixed(2)}</td>
        <td>Ksh ${net.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    }

    // Accumulate totals for visible days
    totalSales += dailySales;
    totalProfit += dailyProfit;
    totalExpenses += dailyExpense;
  }

  // Summary row
  const summaryRow = document.createElement("tr");
  summaryRow.innerHTML = `
    <th>Total</th>
    <th>Ksh ${totalSales.toFixed(2)}</th>
    <th>Ksh ${totalProfit.toFixed(2)}</th>
    <th>Ksh ${totalExpenses.toFixed(2)}</th>
    <th>Ksh ${(totalProfit - totalExpenses).toFixed(2)}</th>
  `;
  summaryRow.style.background = "#f0f0f0";
  tbody.appendChild(summaryRow);
}
