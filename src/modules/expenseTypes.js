import { getExpenseTypes, saveExpenseTypes, getDailyExpenses } from "./storage.js";
import { showToast, showError } from "./utils.js";
import { refreshUI } from "./ui.js";


// ========== Sanitize Input ==========
function sanitizeInput(input) {
  return input?.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() || "";
}

// ========== Register a New Expense Type ==========
export function registerExpenseType() {
  try {
    const typeId = sanitizeInput(document.getElementById("expenseTypeId")?.value);
    const label = sanitizeInput(document.getElementById("expenseLabel")?.value);

    if (!typeId || typeId.length > 30) throw new Error("Please enter a valid ID (max 30 chars).");
    if (!label || label.length > 100) throw new Error("Please enter a valid label (max 100 chars).");

    const types = getExpenseTypes();
    const exists = types.some(t => t.typeId === typeId);
    if (exists) {
      showError("Expense Type ID already exists.");
      return;
    }

    const newType = { typeId, label };
    types.push(newType);
    saveExpenseTypes(types);

    showToast(`✅ Expense Type "${label}" added successfully.`);
    loadExpenseTypeRegister();
    populateExpenseDropdown();
    refreshUI();

    // Reset form
    document.getElementById("expenseTypeId").value = "";
    document.getElementById("expenseLabel").value = "";
    document.getElementById("expenseTypeId").focus();

  } catch (error) {
    console.error("Expense Type registration failed:", error);
    alert(error.message);
  }
}

// ========== Load Expense Type Register Table ==========
export function loadExpenseTypeRegister() {
  const tableBody = document.querySelector("#expenseTypeRegister tbody");
  if (!tableBody) return;

  const types = getExpenseTypes();
  tableBody.innerHTML = "";

  types.forEach(type => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${type.typeId}</td>
      <td>${type.label}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ========== Populate Dropdown with Expense Types ==========
export function populateExpenseDropdown() {
  const dropdown = document.getElementById("expenseDropdown");
  if (!dropdown) return;

  const types = getExpenseTypes();
  dropdown.innerHTML = '<option value="">Select Expense Type...</option>';

  types.forEach(type => {
    const option = document.createElement("option");
    option.value = type.typeId;
    option.textContent = `${type.typeId} - ${type.label}`;
    dropdown.appendChild(option);
  });
}

// ========== Load Detailed Daily Expense Table ==========
export function loadDailyExpenseTable(date) {
  const tbody = document.querySelector("#dailyExpenseTable tbody");
  if (!tbody) return;

  const allExpenses = getDailyExpenses();
  const types = getExpenseTypes();
  const filtered = allExpenses.filter(e => e.date === date);

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("tr");
    empty.innerHTML = `<td colspan="5" style="text-align:center;"><em>No expenses recorded for ${date}.</em></td>`;
    tbody.appendChild(empty);
    return;
  }

  filtered.forEach(e => {
    const type = types.find(t => t.typeId === e.expenseTypeId);
    const label = type ? type.label : "-";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${e.date}</td>
      <td>${e.expenseTypeId}</td>
      <td>${label}</td>
      <td>${sanitizeInput(e.note) || "-"}</td>
      <td>Ksh ${Number(e.amount).toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });
}
