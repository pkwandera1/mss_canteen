import {
    getExpenseTypes,
    getDailyExpenses,
    saveDailyExpenses,
    getSales
  } from "./storage.js";
  
  // Helper: get today's date as YYYY-MM-DD
  function getTodayKey() {
    return new Date().toISOString().split("T")[0];
  }
  
  // Add daily expense
  export function addExpense() {
    const typeId = document.getElementById("expenseDropdown")?.value;
    const amount = parseFloat(document.getElementById("expenseAmount")?.value);
    const note = document.getElementById("expenseNote")?.value.trim();
  
    if (!typeId || isNaN(amount) || amount <= 0) {
      alert("Please select an expense type and enter a valid amount.");
      return;
    }
  
    const allExpenses = getDailyExpenses();
    const newExpense = {
      id: `EXP${Date.now()}`,
      date: getTodayKey(),
      expenseTypeId: typeId,
      amount,
      note
    };
  
    allExpenses.push(newExpense);
    saveDailyExpenses(allExpenses);
  
    alert("Expense recorded.");
    loadDailyExpenseReport();
  }
  
  // Load today's expenses
  
  export function loadDailyExpenseReport() {
    const tbody = document.querySelector("#dailyExpenseTable tbody");
    const totalExpensesSpan = document.getElementById("totalExpenses");
    const netProfitSpan = document.getElementById("netProfit");
  
    const salesTotalsBox = document.getElementById("salesTotals");
    if (!tbody || !totalExpensesSpan || !netProfitSpan || !salesTotalsBox) return;
  
    const today = getTodayKey();
    const expenses = getDailyExpenses().filter(e => e.date === today);
  
    tbody.innerHTML = "";
    let totalExpenses = 0;
  
    expenses.forEach(exp => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${exp.expenseTypeId}</td>
        <td>Ksh ${exp.amount.toFixed(2)}</td>
        <td>${exp.note || "-"}</td>
      `;
      tbody.appendChild(row);
      totalExpenses += exp.amount;
    });
  
    totalExpensesSpan.textContent = `Ksh ${totalExpenses.toFixed(2)}`;
  
    // Load today's sales
    const sales = getSales().filter(sale => sale.date === today);
    const totalBuying = sales.reduce((sum, s) => sum + s.totalBuyingPrice, 0);
    const totalSelling = sales.reduce((sum, s) => sum + s.totalSellingPrice, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
    const netProfit = totalProfit - totalExpenses;
  
    // Update net profit display
    netProfitSpan.textContent = `Ksh ${netProfit.toFixed(2)}`;
  
    // Display detailed sales totals
    salesTotalsBox.innerHTML = `
      <p><strong>Sales Buying Total:</strong> Ksh ${totalBuying.toFixed(2)}</p>
      <p><strong>Sales Selling Total:</strong> Ksh ${totalSelling.toFixed(2)}</p>
      <p><strong>Sales Profit:</strong> Ksh ${totalProfit.toFixed(2)}</p>
    `;
  }
  
  