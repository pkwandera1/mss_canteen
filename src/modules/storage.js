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

// ========== MPESA PAYMENTS ==========
const MPESA_KEY = 'mpesaPayments';

export function getMpesaPayments() {
  return JSON.parse(localStorage.getItem(MPESA_KEY)) || [];
}

export function saveMpesaPayments(data) {
  localStorage.setItem(MPESA_KEY, JSON.stringify(data));
}

export function saveMpesaPayment(paymentsArray) {
  localStorage.setItem(MPESA_KEY, JSON.stringify(paymentsArray));
}

// ========== CREDITS ==========
export function getCredits() {
  const data = localStorage.getItem('credits');
  return data ? JSON.parse(data) : [];
}

export function saveCredits(credits) {
  localStorage.setItem('credits', JSON.stringify(credits));
}

// ========== EXPENSE TYPES ==========
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
    credits: getCredits(),
    mpesaPayments: getMpesaPayments(),
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

        if (data.credits) saveCredits(data.credits);
        if (data.mpesaPayments) saveMpesaPayments(data.mpesaPayments);
        if (data.expenseTypes) saveExpenseTypes(data.expenseTypes);
        if (data.dailyExpenses) saveDailyExpenses(data.dailyExpenses);

        alert("Data imported successfully!");
        onSuccess();
      } else {
        alert("Invalid file format.");
      }
    } catch (err) {
      alert("Failed to import data: " + err.message);
    }
  };

  reader.readAsText(file);
}
