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

  // Try ISO format first
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) return date;

  // Try common alternative formats
  // Format 1: "YYYY-MM-DD"
  const isoParts = dateString.split('-');
  if (isoParts.length === 3) {
    date = new Date(
      parseInt(isoParts[0]),
      parseInt(isoParts[1]) - 1,
      parseInt(isoParts[2])
    );
    if (!isNaN(date.getTime())) return date;
  }

  // Format 2: "DD/MM/YYYY"
  const slashParts = dateString.split('/');
  if (slashParts.length === 3) {
    date = new Date(
      parseInt(slashParts[2]),
      parseInt(slashParts[1]) - 1,
      parseInt(slashParts[0])
    );
    if (!isNaN(date.getTime())) return date;
  }

  // Format 3: Timestamp (number)
  if (!isNaN(dateString)) {
    date = new Date(parseInt(dateString));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

// Main report generation function
export function loadMonthlyReport(year, month) {
  const tbody = document.querySelector("#monthlyReportTable tbody");
  if (!tbody) {
    console.error("Monthly report table body not found");
    return;
  }

  // Clear existing content
  tbody.innerHTML = "";

  // Load all data
  const sales = getSales();
  const expenses = getDailyExpenses();
  const mpesaPayments = getMpesaPayments();
  const credits = getCredits();
  const daysInMonth = getDaysInMonth(year, month);

  // Initialize totals
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

  // Process each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDate(year, month, day);
    let hasData = false;

    // Calculate daily amounts with fallbacks
    const dailyAmounts = {
      sales: 0,
      profit: 0,
      expenses: 0,
      mpesaSales: 0,
      creditIssued: 0,
      creditPayments: 0,
      mpesaCreditPayments: 0
    };

    // Helper function to filter by date
    const filterByDate = (items, dateField = 'date') => {
      return items.filter(item => {
        const d = safeDateParse(item[dateField]);
        return d ? d.toISOString().split("T")[0] === dateKey : false;
      });
    };

    // Process sales
    const daySales = filterByDate(sales);
    dailyAmounts.sales = daySales.reduce((sum, s) => sum + (s.totalSellingPrice || 0), 0);
    dailyAmounts.profit = daySales.reduce((sum, s) => sum + (s.profit || 0), 0);
    hasData = hasData || daySales.length > 0;

    // Process expenses
    const dayExpenses = filterByDate(expenses);
    dailyAmounts.expenses = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    hasData = hasData || dayExpenses.length > 0;

    // Process Mpesa payments (both sales and credit payments)
    const dayMpesa = filterByDate(mpesaPayments);
    dailyAmounts.mpesaSales = dayMpesa.reduce((sum, m) => sum + (m.amount || 0), 0);
    hasData = hasData || dayMpesa.length > 0;

    // Process credits
    const dayCredits = filterByDate(credits, 'dateTaken');
    
    // Credit issued is the amount of new credits created that day
    dailyAmounts.creditIssued = dayCredits.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    // Credit payments (all types combined)
    dayCredits.forEach(credit => {
      credit.payments.forEach(payment => {
        const paymentDate = safeDateParse(payment.date);
        if (paymentDate && paymentDate.toISOString().split("T")[0] === dateKey) {
          dailyAmounts.creditPayments += payment.amount || 0;
        }
      });
    });
    
    // Mpesa credit payments (from mpesaPayments with credit flag)
    dailyAmounts.mpesaCreditPayments = dayMpesa
      .filter(m => m.type === 'Credit Payment')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    
    hasData = hasData || dayCredits.length > 0 || dayMpesa.some(m => m.isCreditPayment);

    // Calculate net profit
    const net = dailyAmounts.profit - dailyAmounts.expenses;

    // Add row if there's data for this day
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

    // Update totals
    totals.sales += dailyAmounts.sales;
    totals.profit += dailyAmounts.profit;
    totals.expenses += dailyAmounts.expenses;
    totals.mpesaSales += dailyAmounts.mpesaSales;
    totals.creditIssued += dailyAmounts.creditIssued;
    totals.creditPayments += dailyAmounts.creditPayments;
    totals.mpesaCreditPayments += dailyAmounts.mpesaCreditPayments;
    totals.netProfit += net;
  }

  // Add summary row
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