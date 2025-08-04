// src/modules/expenses.js
import { getExpenseTypes, getDailyExpenses, saveDailyExpenses, getSales } from "./storage.js";
import { getCurrentDate, showError, showToast } from './utils.js';
import { createSaleRecord } from './sales.js';
import { refreshUI, refreshReports } from './ui.js';



// ✅ Helper: check if expense type is inventory-related
function isInventoryExpense(expenseTypeId) {
  const inventoryTypes = ['INVENTORY_PURCHASE', 'STOCK_REPLENISHMENT'];
  return inventoryTypes.includes(expenseTypeId);
}

// ✅ Helper: normalize date to YYYY-MM-DD (local)
function normalizeDate(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Ensure local midnight
  return d.toLocaleDateString('en-CA'); // "YYYY-MM-DD"
}

export function addExpense() {
  const typeIdInput = document.getElementById("expenseDropdown");
  const amountInput = document.getElementById("expenseAmount");
  const noteInput = document.getElementById("expenseNote");

  const typeId = typeIdInput?.value;
  const amount = parseFloat(amountInput?.value);
  const note = noteInput?.value.trim();

  if (!typeId || isNaN(amount) || amount <= 0) {
    return showError("Please select an expense type and enter a valid amount.");
  }

  try {
    const allExpenses = getDailyExpenses() || [];
    const expenseDate = getCurrentDate();

    const newExpense = {
      id: `EXP${Date.now()}`,
      date: expenseDate,
      expenseTypeId: typeId,
      amount,
      note
    };

    allExpenses.push(newExpense);
    saveDailyExpenses(allExpenses);

    // ✅ Optionally record a linked sale if inventory expense
    if (isInventoryExpense(typeId)) {
      createSaleRecord(typeId, 1, expenseDate);
    }

    showToast("✅ Expense recorded successfully.");
    refreshUI();
    refreshReports();

    // Clear form fields
    if (typeIdInput) typeIdInput.value = "";
    if (amountInput) amountInput.value = "";
    if (noteInput) noteInput.value = "";

    loadDailyExpenseReport();
  } catch (error) {
    console.error("Error recording expense:", error);
    showError(`Error: ${error.message}`);
  }
}

export function loadDailyExpenseReport() {
  const tbody = document.querySelector("#dailyExpenseTable tbody");
  const salesTotalsBox = document.getElementById("salesTotals");

  if (!tbody || !salesTotalsBox) return;

  const today = normalizeDate(getCurrentDate());

  // ✅ Fetch all data
  const allExpenses = getDailyExpenses() || [];
  const allSales = getSales() || [];

  // ✅ Filter today's expenses
  const expenses = allExpenses.filter(e => normalizeDate(e.date) === today);

  // Split expenses into categories
  const regularExpenses = expenses.filter(e => e.expenseTypeId !== 'RESTOCKING');
  const restockingExpenses = expenses.filter(e => e.expenseTypeId === 'RESTOCKING');

  const totalRegular = regularExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRestocking = restockingExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpenses = totalRegular + totalRestocking;

  // ✅ Render expense table rows
  tbody.innerHTML = "";
  const types = getExpenseTypes() || [];
  expenses.forEach(exp => {
    const type = types.find(t => t.typeId === exp.expenseTypeId);
    const label = type ? type.label : exp.expenseTypeId;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${normalizeDate(exp.date)}</td>
      <td>${exp.expenseTypeId}</td>
      <td>${label}</td>
      <td>${exp.note || "-"}</td>
      <td>Ksh ${Number(exp.amount).toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });


  // ✅ Filter today's sales
  const sales = allSales.filter(s => normalizeDate(s.date) === today);
 

  // ✅ Compute total profit
  const totalProfit = sales.reduce((sum, s) => {
    const profit = Number(s.profit) || ((Number(s.sellingPrice) - Number(s.buyingPrice)) * (s.quantity || 1));
    return sum + (profit || 0);
  }, 0);

  const netProfit = totalProfit - totalRegular;

  // ✅ Updated summary layout
  salesTotalsBox.innerHTML = `
    <p><strong>Regular expenses:</strong> Ksh ${totalRegular.toFixed(2)}</p>
    <p><strong>Restocking expenses:</strong> Ksh ${totalRestocking.toFixed(2)}</p>
    <p><strong>Total Expenses:</strong> Ksh ${totalExpenses.toFixed(2)}</p>
    <br>
    <p><strong>Gross profit:</strong> Ksh ${totalProfit.toFixed(2)}</p>
    <p><strong>Net Profit (Gross − Regular expenses):</strong> Ksh ${netProfit.toFixed(2)}</p>
  `;
}
