// src/modules/storage.js

// ========== PRODUCTS ==========
export function getProducts() {
  return JSON.parse(localStorage.getItem("products")) || [];
}

export function saveProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
}

// ========== SALES ==========
export function getSales() {
  return JSON.parse(localStorage.getItem("sales")) || [];
}

export function saveSales(sales) {
  localStorage.setItem("sales", JSON.stringify(sales));
}

// ========== EXPENSE TYPES (Repository) ==========
export function getExpenseTypes() {
  return JSON.parse(localStorage.getItem("expenseTypes")) || [];
}

export function saveExpenseTypes(types) {
  localStorage.setItem("expenseTypes", JSON.stringify(types));
}

// ========== DAILY EXPENSES ==========
export function getDailyExpenses() {
  return JSON.parse(localStorage.getItem("dailyExpenses")) || [];
}

export function saveDailyExpenses(expenses) {
  localStorage.setItem("dailyExpenses", JSON.stringify(expenses));
}

// ========== EXPORT BACKUP ==========
export function exportDataToFile() {
  const data = {
    products: getProducts(),
    sales: getSales(),
    expenseTypes: getExpenseTypes(),
    dailyExpenses: getDailyExpenses()
  };

  const filename = `canteen-backup-${new Date().toLocaleDateString('en-CA')}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

// ========== IMPORT BACKUP ==========
export function importDataFromFile(file, onSuccess = () => {}) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.products && data.sales) {
        saveProducts(data.products);
        saveSales(data.sales);

        if (data.expenseTypes) saveExpenseTypes(data.expenseTypes);
        if (data.dailyExpenses) saveDailyExpenses(data.dailyExpenses);

        alert("Data imported successfully!");
        onSuccess(); // e.g. reload tables
      } else {
        alert("Invalid file format.");
      }
    } catch (err) {
      alert("Failed to import data: " + err.message);
    }
  };

  reader.readAsText(file);
}
