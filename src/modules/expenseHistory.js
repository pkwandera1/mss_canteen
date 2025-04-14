import { getDailyExpenses, getExpenseTypes } from "./storage.js";

export function loadExpenseHistory(year, month) {
  const tbody = document.querySelector("#expenseHistoryTable tbody");
  const totalDisplay = document.getElementById("expenseHistoryTotal");

  if (!tbody || !totalDisplay) {
    console.warn("Missing expense history table or total span.");
    return;
  }

  // Format month (YYYY-MM)
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  // Get data
  const allExpenses = getDailyExpenses();
  const expenseTypes = getExpenseTypes();

  // Filter by selected month
  const monthlyExpenses = allExpenses.filter(exp => exp.date?.startsWith(monthKey));

  // Reset table
  tbody.innerHTML = "";
  let total = 0;

  // Handle empty state
  if (monthlyExpenses.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="4" style="text-align:center;"><em>No expenses recorded for ${monthKey}.</em></td>`;
    tbody.appendChild(emptyRow);
    totalDisplay.textContent = "Ksh 0.00";
    return;
  }

  // Render rows
  monthlyExpenses.forEach(exp => {
    const type = expenseTypes.find(t => t.typeId === exp.expenseTypeId);
    const label = type ? type.label : exp.expenseTypeId;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${label}</td>
      <td>Ksh ${Number(exp.amount).toFixed(2)}</td>
      <td>${exp.note || "-"}</td>
    `;
    tbody.appendChild(row);

    total += Number(exp.amount);
  });

  totalDisplay.textContent = `Ksh ${total.toFixed(2)}`;
}
