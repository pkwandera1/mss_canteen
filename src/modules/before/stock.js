// src/modules/stock.js

import { getProducts, saveProducts } from './storage.js';
import { updateProductRegisterTable } from './products.js';

// Restock a product
export function restockProduct() {
  const productId = document.getElementById("productStockDropdown").value;
  const stockQuantity = parseInt(document.getElementById("stockQuantity").value);

  if (!productId || isNaN(stockQuantity) || stockQuantity <= 0) {
    alert("Invalid stock quantity.");
    return;
  }

  let products = getProducts();
  let product = products.find(p => p.productId === productId);

  if (product) {
    product.stock = (product.stock || 0) + stockQuantity;
    saveProducts(products);
    alert("Product restocked successfully.");
    loadStock();
  }
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
        alert("Editing stock is disabled for products that have already been sold.");
        return;
      }
  
      editStock(productId);
    });
  });
  
}

// Edit stock manually (if no sale exists)
export function editStock(productId) {
  let products = getProducts();
  let product = products.find(p => p.productId === productId);

  if (product.hasSale) {
    alert("Editing stock is disabled after sales begin.");
    return;
  }

  const newStock = prompt(`Enter new stock for ${product.productName}:`, product.stock || 0);

  if (newStock !== null && !isNaN(newStock) && parseInt(newStock) >= 0) {
    product.stock = parseInt(newStock);
    saveProducts(products);
    loadStock();
    updateProductRegisterTable(); // Optional sync
  } else {
    alert("Invalid stock value.");
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
