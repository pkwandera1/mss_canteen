// src/modules/stock.js

import { getProducts, saveProducts, getDailyExpenses, saveDailyExpenses } from './storage.js';
import { updateProductRegisterTable } from './products.js';
import { getCurrentDate, showError, showToast } from './utils.js';
import { refreshUI } from './ui.js';


// Restock a product
export function restockProduct() {
  const productIdInput = document.getElementById("productStockDropdown");
  const stockQuantityInput = document.getElementById("stockQuantity");

  const productId = productIdInput?.value;
  const stockQuantity = parseInt(stockQuantityInput?.value);

  if (!productId || isNaN(stockQuantity) || stockQuantity <= 0) {
    showError("Please select a valid product and enter a valid stock quantity.");
    return;
  }

  const products = getProducts();
  const product = products.find(p => p.productId === productId);

  if (!product) {
    showError("Product not found.");
    return;
  }

  product.stock = (product.stock || 0) + stockQuantity;
  saveProducts(products);
  recordRestockingExpense(product, stockQuantity);

  showToast("Product restocked successfully.");
  refreshUI();
  stockQuantityInput.value = ""; // Clear input
  loadStock();
}

// Load stock table
export function loadStock() {
  const tableBody = document.querySelector("#productStockTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  const products = getProducts();

  products.forEach(product => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${product.productId}</td>
      <td>${product.productName}</td>
      <td>${product.productCategory}</td>
      <td>${product.stock || 0}</td>
      <td><button class="edit-stock-btn" data-id="${product.productId}">Edit</button></td>
    `;

    tableBody.appendChild(row);
  });

  document.querySelectorAll(".edit-stock-btn").forEach(button => {
    const productId = button.getAttribute("data-id");

    button.addEventListener("click", () => {
      const products = getProducts();
      const product = products.find(p => p.productId === productId);

      if (product?.hasSale) {
        showError("Editing stock is disabled for products that have already been sold.");
        return;
      }

      editStock(productId);
    });
  });
}

// Edit stock manually (if no sale exists)
export function editStock(productId) {
  const products = getProducts();
  const product = products.find(p => p.productId === productId);

  if (!product) {
    showError("Product not found.");
    return;
  }

  if (product.hasSale) {
    showError("Editing stock is disabled after sales begin.");
    return;
  }

  const newStock = prompt(`Enter new stock for ${product.productName}:`, product.stock || 0);

  if (newStock !== null && !isNaN(newStock) && parseInt(newStock) >= 0) {
    product.stock = parseInt(newStock);
    saveProducts(products);
    loadStock();
    updateProductRegisterTable(); // Optional sync
    showToast("Stock updated successfully.");
  } else {
    showError("Invalid stock value.");
  }
}

// Attach Enter key shortcut for restocking
export function setupRestockShortcut() {
  const stockInput = document.getElementById("stockQuantity");
  if (!stockInput) return;
  stockInput.addEventListener("keypress", event => {
    if (event.key === "Enter") restockProduct();
  });
}

// Record restocking as an expense
function recordRestockingExpense(product, quantity) {
  const allExpenses = getDailyExpenses();
  const expense = {
    id: `EXP${Date.now()}`,
    date: getCurrentDate(),
    expenseTypeId: 'RESTOCKING',
    amount: product.buyingPrice * quantity,
    note: `Restocked ${quantity} of ${product.productName}`
  };

  allExpenses.push(expense);
  saveDailyExpenses(allExpenses);
}
