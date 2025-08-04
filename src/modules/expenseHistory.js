import { getDailyExpenses, getExpenseTypes } from "./storage.js";

export function loadExpenseHistory(year, month) {
  const tbody = document.querySelector("#expenseHistoryTable tbody");
  const totalDisplay = document.getElementById("expenseHistoryTotal");

  if (!tbody || !totalDisplay) {
    console.warn("Missing expense history table or total span.");
    return;
  }

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const allExpenses = getDailyExpenses();
  const expenseTypes = getExpenseTypes();

  const monthlyExpenses = allExpenses.filter(exp => exp.date?.startsWith(monthKey));

  tbody.innerHTML = "";
  let total = 0;

  if (monthlyExpenses.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="5" style="text-align:center;"><em>No expenses recorded for ${monthKey}.</em></td>`;
    tbody.appendChild(emptyRow);
    totalDisplay.textContent = "Ksh 0.00";
    return;
  }

  monthlyExpenses.forEach(exp => {
    const type = expenseTypes.find(t => t.typeId === exp.expenseTypeId);
    const label = type ? type.label : "-";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.expenseTypeId}</td>
      <td>${label}</td>
      <td>${exp.note || "-"}</td>
      <td>Ksh ${Number(exp.amount).toFixed(2)}</td>
    `;
    tbody.appendChild(row);

    total += Number(exp.amount);
  });

  totalDisplay.textContent = `Ksh ${total.toFixed(2)}`;
}
