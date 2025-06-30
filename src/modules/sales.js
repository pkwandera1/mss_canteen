// src/modules/sales.js

import { getProducts, saveProducts, getSales, saveSales } from './storage.js';
import { loadStock } from './stock.js';
import { getCurrentDate, validateDate, showToast } from './utils.js';

// Main function to create sale record
export function createSaleRecord(productId, quantity, specificDate = null) {
  const products = getProducts();
  const sales = getSales();

  const product = products.find(p => p.productId === productId);
  if (!product) throw new Error("Product not found");

  if (typeof product.stock !== 'number') {
    throw new Error("Product stock is not a valid number");
  }

  if (product.stock < quantity) {
    throw new Error(`Insufficient stock. Only ${product.stock} available`);
  }

  const saleDate = validateDate(specificDate) || getCurrentDate();
  const timestamp = new Date(saleDate).getTime();

  product.stock -= quantity;
  product.hasSale = true;
  saveProducts(products);

  const sale = {
    saleId: `S${timestamp}-${Math.floor(Math.random() * 1000)}`,
    productId: product.productId,
    productName: product.productName,
    productCategory: product.productCategory,
    quantity,
    buyingPrice: product.buyingPrice,
    sellingPrice: product.sellingPrice,
    totalBuyingPrice: product.buyingPrice * quantity,
    totalSellingPrice: product.sellingPrice * quantity,
    profit: (product.sellingPrice - product.buyingPrice) * quantity,
    date: saleDate,
    timestamp
  };

  sales.push(sale);
  saveSales(sales);

  return sale;
}

// UI handler for recording sales
export function recordSale() {
  try {
    const productDropdown = document.getElementById("productDropdown");
    const quantityInput = document.getElementById("quantity");

    const productId = productDropdown?.value;
    const quantity = parseInt(quantityInput?.value);

    if (!productId || isNaN(quantity)) {
      throw new Error("Please select a product and enter valid quantity");
    }

    const sale = createSaleRecord(productId, quantity);

    // Clear form inputs
    productDropdown.value = "";
    quantityInput.value = "";
    productDropdown.focus();

    // Refresh views
    const selectedDate = document.getElementById("salesDate")?.value || null;
    loadSalesReport(selectedDate);
    loadStock();

    showToast(`✅ Sale recorded for ${sale.productName} (${quantity} unit${quantity > 1 ? 's' : ''})`);
  } catch (error) {
    console.error("Sale recording error:", error);
    alert(`❌ ${error.message}`);
  }
}

// Load the sales report for a specific date
export function loadSalesReport(date = null) {
  const tbody = document.querySelector("#salesReport tbody");
  if (!tbody) return;

  const selectedDate = date || document.getElementById("salesDate")?.value || getCurrentDate();
  const formatDate = (dateStr) => dateStr.split("T")[0];

  const sales = getSales().filter(s => formatDate(s.date) === formatDate(selectedDate));

  tbody.innerHTML = "";

  let totalBuying = 0;
  let totalSelling = 0;
  let totalProfit = 0;

  if (sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">No sales recorded for ${formatDate(selectedDate)}</td></tr>`;
    return;
  }

  sales.forEach(sale => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="checkbox" class="sale-checkbox" value="${sale.saleId}" data-id="${sale.saleId}" /></td>
      <td>${sale.productId}</td>
      <td>${sale.productName}</td>
      <td>${sale.productCategory}</td>
      <td>Ksh ${sale.totalBuyingPrice.toFixed(2)}</td>
      <td>Ksh ${sale.totalSellingPrice.toFixed(2)}</td>
      <td>Ksh ${sale.profit.toFixed(2)}</td>
      <td>${formatDate(sale.date)}</td>
    `;
    tbody.appendChild(row);

    totalBuying += sale.totalBuyingPrice;
    totalSelling += sale.totalSellingPrice;
    totalProfit += sale.profit;
  });

  const totalsRow = document.createElement("tr");
  totalsRow.style.background = "#f0f0f0";
  totalsRow.innerHTML = `
    <th colspan="4">Total</th>
    <th>Ksh ${totalBuying.toFixed(2)}</th>
    <th>Ksh ${totalSelling.toFixed(2)}</th>
    <th>Ksh ${totalProfit.toFixed(2)}</th>
    <th></th>
  `;
  tbody.appendChild(totalsRow);
}

// Delete selected sales (if less than 24 hrs old)
export function deleteSelectedSales() {
  let sales = getSales();
  const now = Date.now();
  const selected = document.querySelectorAll(".sale-checkbox:checked");

  if (selected.length === 0) {
    alert("No sales selected.");
    return;
  }

  if (!confirm("Are you sure you want to delete the selected sales?")) return;

  let deletedCount = 0;
  selected.forEach(checkbox => {
    const saleId = checkbox.getAttribute("data-id");
    const index = sales.findIndex(s => String(s.saleId) === String(saleId));

    if (index !== -1) {
      const sale = sales[index];
      const ageInHours = (now - sale.timestamp) / (1000 * 60 * 60);

      if (ageInHours <= 24) {
        sales.splice(index, 1);
        deletedCount++;
      } else {
        alert(`Sale "${sale.productName}" is older than 24 hours and cannot be deleted.`);
      }
    }
  });

  if (deletedCount > 0) {
    saveSales(sales);
    const selectedDate = document.getElementById("salesDate")?.value || null;
    loadSalesReport(selectedDate);
    loadStock();
    showToast(`🗑️ ${deletedCount} sale(s) deleted`);
  }
}

// Optional: Mark sales as editable if within 24 hrs
export function disableOldSalesEdits() {
  const sales = getSales();
  const now = Date.now();

  sales.forEach(sale => {
    sale.editable = (now - sale.timestamp) <= 24 * 60 * 60 * 1000;
  });

  saveSales(sales);
}
