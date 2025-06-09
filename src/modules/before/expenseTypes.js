import { getExpenseTypes, saveExpenseTypes } from "./storage.js";

export function registerExpenseType() {
  const typeId = document.getElementById("expenseTypeId").value.trim();
  const label = document.getElementById("expenseLabel").value.trim();

  if (!typeId || !label) {
    alert("Please enter both an ID and label for the expense type.");
    return;
  }

  let types = getExpenseTypes();
  const exists = types.some(t => t.typeId === typeId);
  if (exists) {
    alert("Expense Type ID already exists.");
    return;
  }

  const newType = {
    typeId,
    label
  };

  types.push(newType);
  saveExpenseTypes(types);
  alert("Expense Type added successfully.");
  loadExpenseTypeRegister();
  populateExpenseDropdown();
}

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
