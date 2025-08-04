// src/modules/sales.js

import { getProducts, saveProducts, getSales, saveSales } from './storage.js';
import { loadStock } from './stock.js';
import { getCurrentDate, validateDate, showToast, showError } from './utils.js';
import { formatDateYMD } from './reportUtils.js';
import { refreshUI, refreshReports } from './ui.js';


// Main function to create sale record
export function createSaleRecord(productId, quantity, specificDate = null) {
  const products = getProducts();
  const sales = getSales();

  const product = products.find(p => p.productId === productId);
  if (!product) {
    showError("❌ Product not found");
    return null;
  }

  if (typeof product.stock !== 'number') {
    showError("❌ Product stock is not a valid number");
    return null;
  }

  if (product.stock < quantity) {
    showError(`❌ Insufficient stock. Only ${product.stock} available`);
    return null;
  }

  const saleDate = validateDate(specificDate) || getCurrentDate();
  const timestamp = new Date(saleDate).getTime();

  product.stock -= quantity;
  product.hasSale = true;
  saveProducts(products);
  refreshUI();
  

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
  const productDropdown = document.getElementById("productDropdown");
  const quantityInput = document.getElementById("quantity");

  const productId = productDropdown?.value;
  const quantity = parseInt(quantityInput?.value);

  if (!productId || isNaN(quantity)) {
    showError("❌ Please select a product and enter a valid quantity");
    return;
  }

  try {
    const sale = createSaleRecord(productId, quantity);
    if (!sale) return; // Stop if sale was not created due to error

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
    showError(`❌ ${error.message || "An unexpected error occurred"}`);
  }
}

// Load the sales report for a specific date
export function loadSalesReport(date = null) {
  const tbody = document.querySelector("#salesReport tbody");
  if (!tbody) return;

  const selectedDate = date || document.getElementById("salesDate")?.value || getCurrentDate();

  const sales = getSales().filter(s =>
    formatDateYMD(new Date(s.date)) === formatDateYMD(new Date(selectedDate))
  );

  tbody.innerHTML = "";

  let totalBuying = 0;
  let totalSelling = 0;
  let totalProfit = 0;

  if (sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">No sales recorded for ${formatDateYMD(new Date(selectedDate))}</td></tr>`;
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
      <td>${formatDateYMD(new Date(sale.date))}</td>
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
  const products = getProducts();
  const now = Date.now();
  const selected = document.querySelectorAll(".sale-checkbox:checked");

  if (selected.length === 0) {
    showError("No sales selected.");
    return;
  }

  if (!confirm("Are you sure you want to delete the selected sales?")) return;

  let deletedCount = 0;

  selected.forEach(checkbox => {
    const saleId = checkbox.getAttribute("data-id");
    const saleIndex = sales.findIndex(s => String(s.saleId) === String(saleId));

    if (saleIndex !== -1) {
      const sale = sales[saleIndex];
      const ageInHours = (now - sale.timestamp) / (1000 * 60 * 60);

      if (ageInHours <= 24) {
        // Restore product stock
        const product = products.find(p => p.productId === sale.productId);
        if (product) {
          product.stock += sale.quantity;

          // Re-check if this product has other remaining sales
          const hasOtherSales = sales.some((s, idx) =>
            idx !== saleIndex && s.productId === product.productId
          );

          product.hasSale = hasOtherSales;
        }

        // Remove the sale
        sales.splice(saleIndex, 1);
        deletedCount++;
      } else {
        showError(`Sale "${sale.productName}" is older than 24 hours and cannot be deleted.`);
      }
    }
  });

  if (deletedCount > 0) {
    saveSales(sales);
    saveProducts(products);

    const selectedDate = document.getElementById("salesDate")?.value || null;
    loadSalesReport(selectedDate);
    loadStock();
    showToast(`🗑️ ${deletedCount} sale(s) deleted and stock restored`);
    refreshUI();
    refreshReports();
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
