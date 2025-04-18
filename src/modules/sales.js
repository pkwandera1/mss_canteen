// src/modules/sales.js

import { getProducts, saveProducts, getSales, saveSales } from './storage.js';
import { loadStock } from './stock.js';

// Record a sale
export function recordSale() {
  const productId = document.getElementById("productDropdown").value;
  const quantity = parseInt(document.getElementById("quantity").value);

  if (!productId || isNaN(quantity) || quantity <= 0) {
    alert("Invalid quantity.");
    return;
  }

  let products = getProducts();
  let sales = getSales();

  const productIndex = products.findIndex(p => p.productId === productId);
  if (productIndex === -1) {
    alert("Product not found.");
    return;
  }

  let product = products[productIndex];

  if ((product.stock || 0) < quantity) {
    alert("Insufficient stock.");
    return;
  }

  // Update stock and mark sale
  product.stock -= quantity;
  product.hasSale = true;
  products[productIndex] = product;
  saveProducts(products);

  // Create sale record
  const timestamp = Date.now();
  const sale = {
    saleId: `S${timestamp}`,
    productId: product.productId,
    productName: product.productName,
    productCategory: product.productCategory,
    quantity,
    buyingPrice: product.buyingPrice,
    sellingPrice: product.sellingPrice,
    totalBuyingPrice: product.buyingPrice * quantity,
    totalSellingPrice: product.sellingPrice * quantity,
    profit: (product.sellingPrice - product.buyingPrice) * quantity,
    date: new Date().toISOString().split("T")[0], // ✅ consistent YYYY-MM-DD
    timestamp
  };

  sales.push(sale);
  saveSales(sales);

  alert("Sale recorded successfully.");
  loadSalesReport();
  loadStock();
}

// Load the sales report
export function loadSalesReport() {
  const tbody = document.querySelector("#salesReport tbody");
  if (!tbody) return;

  const today = new Date().toISOString().split("T")[0]; // consistent date format
  const sales = getSales().filter(s => s.date === today);

  tbody.innerHTML = "";

  let totalBuying = 0;
  let totalSelling = 0;
  let totalProfit = 0;

  sales.forEach(sale => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><input type="checkbox" class="sale-checkbox" value="${sale.saleId}" /></td>
      <td>${sale.productId}</td>
      <td>${sale.productName}</td>
      <td>${sale.productCategory}</td>
      <td>Ksh ${sale.totalBuyingPrice.toFixed(2)}</td>
      <td>Ksh ${sale.totalSellingPrice.toFixed(2)}</td>
      <td>Ksh ${sale.profit.toFixed(2)}</td>
      <td>${sale.date}</td>
    `;

    tbody.appendChild(row);

    totalBuying += sale.totalBuyingPrice;
    totalSelling += sale.totalSellingPrice;
    totalProfit += sale.profit;
  });

  // Append totals row
  const totalsRow = document.createElement("tr");
  totalsRow.innerHTML = `
    <th colspan="4">Total</th>
    <th>Ksh ${totalBuying.toFixed(2)}</th>
    <th>Ksh ${totalSelling.toFixed(2)}</th>
    <th>Ksh ${totalProfit.toFixed(2)}</th>
    <th></th>
  `;
  totalsRow.style.background = "#f0f0f0";
  tbody.appendChild(totalsRow);
}


// Delete sales if they’re under 2 minutes old
export function deleteSelectedSales() {
  let sales = getSales();
  const now = Date.now();
  const selected = document.querySelectorAll(".selectSale:checked");

  if (selected.length === 0) {
    alert("No sales selected.");
    return;
  }

  if (!confirm("Are you sure you want to delete the selected sales?")) return;

  selected.forEach(checkbox => {
    const saleId = checkbox.getAttribute("data-id");
    const index = sales.findIndex(s => s.saleId === saleId);

    if (index !== -1) {
      const sale = sales[index];
      if (now - sale.timestamp <= 120000) {
        sales.splice(index, 1);
      } else {
        alert(`Sale "${sale.productName}" is older than 2 minutes and cannot be deleted.`);
      }
    }
  });

  saveSales(sales);
  loadSalesReport();
  loadStock();
}

// Optional: auto-disable sale edits
export function disableOldSalesEdits() {
  const sales = getSales();
  const now = Date.now();

  sales.forEach(sale => {
    if (now - sale.timestamp > 120000) {
      sale.editable = false;
    }
  });

  saveSales(sales);
}
