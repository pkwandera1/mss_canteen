// src/modules/expenses.js
import { getExpenseTypes, getDailyExpenses, saveDailyExpenses, getSales } from "./storage.js";
import { getCurrentDate } from './utils.js';
import { createSaleRecord } from './sales.js';

// Helper function to check if expense affects inventory
function isInventoryExpense(expenseTypeId) {
  const inventoryTypes = ['INVENTORY_PURCHASE', 'STOCK_REPLENISHMENT'];
  return inventoryTypes.includes(expenseTypeId);
}

export function addExpense() {
  const typeId = document.getElementById("expenseDropdown")?.value;
  const amount = parseFloat(document.getElementById("expenseAmount")?.value);
  const note = document.getElementById("expenseNote")?.value.trim();

  if (!typeId || isNaN(amount) || amount <= 0) {
    alert("Please select an expense type and enter a valid amount.");
    return;
  }

  try {
    // Record the basic expense
    const allExpenses = getDailyExpenses();
    const newExpense = {
      id: `EXP${Date.now()}`,
      date: getCurrentDate(),
      expenseTypeId: typeId,
      amount,
      note
    };

    allExpenses.push(newExpense);
    saveDailyExpenses(allExpenses);

    // If this is an inventory-related expense, also record a sale
    if (isInventoryExpense(typeId)) {
      createSaleRecord(
        typeId, // Using typeId as productId for inventory expenses
        1, // Default quantity for expense items
        getCurrentDate() // Use global date
      );
    }

    alert("Expense recorded successfully.");
    loadDailyExpenseReport();
  } catch (error) {
    console.error("Error recording expense:", error);
    alert(`Error: ${error.message}`);
  }
}

export function loadDailyExpenseReport() {
  const tbody = document.querySelector("#dailyExpenseTable tbody");
  const totalExpensesSpan = document.getElementById("totalExpenses");
  const netProfitSpan = document.getElementById("netProfit");
  const salesTotalsBox = document.getElementById("salesTotals");

  if (!tbody || !totalExpensesSpan || !netProfitSpan || !salesTotalsBox) return;

  const today = getCurrentDate();
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

  // Calculate net profit including sales
  const sales = getSales().filter(s => s.date === today);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const netProfit = totalProfit - totalExpenses;

  netProfitSpan.textContent = `Ksh ${netProfit.toFixed(2)}`;

  // Display sales totals
  salesTotalsBox.innerHTML = `
    <p><strong>Total Sales Profit:</strong> Ksh ${totalProfit.toFixed(2)}</p>
    <p><strong>Total Expenses:</strong> Ksh ${totalExpenses.toFixed(2)}</p>
    <p><strong>Net Profit:</strong> Ksh ${netProfit.toFixed(2)}</p>
  `;
}