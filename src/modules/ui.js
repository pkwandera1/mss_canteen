// src/modules/ui.js

import { getProducts, getSales, getCredits } from './storage.js';
import { getThisMonthReport, summarizeReport, renderReportTiles, renderSummaryCards } from './reportUtils.js';
import { generateWeeklyReport, renderWeeklyReportTable } from './weeklyReport.js';
import { generateMonthlyReport, renderMonthlyReportTable } from './monthlyReport.js';
import { loadDailyExpenseReport } from './dailyExpenses.js';

// Toggle visibility of app sections
export function showSection(sectionId) {
    document.querySelectorAll("section").forEach(section => {
      section.classList.add("hidden");
    });
    const target = document.getElementById(sectionId);
    if (target) target.classList.remove("hidden");
  }
  
  // Populate dropdowns with product data
export function populateProductDropdowns(products) {
    const productDropdown = document.getElementById("productDropdown");
    const stockDropdown = document.getElementById("productStockDropdown");
  
    if (!productDropdown || !stockDropdown) return;
  
    productDropdown.innerHTML = '';
    stockDropdown.innerHTML = '';
  
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a product...";
    productDropdown.appendChild(defaultOption.cloneNode(true));
    stockDropdown.appendChild(defaultOption.cloneNode(true));
    

    products.forEach(product => {
      const option = document.createElement("option");
      option.value = product.productId;
      option.textContent = `${product.productId} - ${product.productName} (${product.stock ?? 0})`;
      productDropdown.appendChild(option.cloneNode(true));
      stockDropdown.appendChild(option.cloneNode(true));
    });
  }
  
  // Populate product/category filters
export function populateFilters(products) {
    const productFilter = document.getElementById("filterProduct");
    const categoryFilter = document.getElementById("filterCategory");
  
    if (!productFilter || !categoryFilter) return;
  
    productFilter.innerHTML = `<option value="">All Products</option>`;
    categoryFilter.innerHTML = `<option value="">All Categories</option>`;
  
    const categories = new Set();
  
    products.forEach(product => {
      const productOption = document.createElement("option");
      productOption.value = product.productId;
      productOption.textContent = product.productName;
      productFilter.appendChild(productOption);
      categories.add(product.productCategory);
    });
  
    categories.forEach(category => {
      const categoryOption = document.createElement("option");
      categoryOption.value = category;
      categoryOption.textContent = category;
      categoryFilter.appendChild(categoryOption);
    });
  }
  
  // Render filtered sales into the filter report table
export function updateSalesTable(filteredSales = []) {
    const salesTable = document.querySelector("#salesTable tbody");
    if (!salesTable) return;
  
    salesTable.innerHTML = "";
  
    let totalBuying = 0;
    let totalSelling = 0;
    let totalProfit = 0;
  
    filteredSales.forEach(sale => {
      totalBuying += sale.totalBuyingPrice;
      totalSelling += sale.totalSellingPrice;
      totalProfit += sale.profit;
  
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="checkbox" class="delete-sale-checkbox" value="${sale.saleId}"></td>
        <td>${sale.productId}</td>
        <td>${sale.productName}</td>
        <td>${sale.quantity}</td>
        <td>${sale.totalBuyingPrice}</td>
        <td>${sale.totalSellingPrice}</td>
        <td>${sale.profit}</td>
        <td>${sale.date}</td>
      `;
      salesTable.appendChild(row);
    });
  
const totalRow = document.createElement("tr");
    totalRow.innerHTML = `
      <td colspan="4"><strong>Grand Totals:</strong></td>
      <td><strong>${totalBuying}</strong></td>
      <td><strong>${totalSelling}</strong></td>
      <td><strong>${totalProfit}</strong></td>
      <td></td>
    `;
    salesTable.appendChild(totalRow);
  }

export function populateCreditDropdown(products) {
    const creditDropdown = document.getElementById("creditProductDropdown");
    if (!creditDropdown) return;
  
    creditDropdown.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a product";
    creditDropdown.appendChild(defaultOption);
  
    products.forEach(product => {
      const option = document.createElement("option");
      option.value = product.productId;
      option.textContent = `${product.productId} - ${product.productName}`;
      creditDropdown.appendChild(option);
    });
  }

export function renderCreditsTable(credits) {
    const tbody = document.querySelector("#creditTable tbody");
    tbody.innerHTML = "";

    credits.forEach((credit, index) => {
      const canEdit = canEditOrDelete(credit.dateTaken);

      // Payment button (only if balance > 0)
      let paymentBtn = "";
      if (credit.balance > 0) {
        paymentBtn = `<button data-id="${credit.id}" class="add-payment-btn">Add Payment</button>`;
      }

      // Edit/Delete buttons (only within 24 hours)
      const editBtn = canEdit ? `<button data-id="${credit.id}" class="edit-credit-btn">Edit</button>` : "";
      const deleteBtn = canEdit ? `<button data-id="${credit.id}" class="delete-credit-btn">Delete</button>` : "";

      // Render payment history
      let paymentHistory = "";
      if (credit.payments && credit.payments.length > 0) {
        if (credit.status === "Paid") {
          const lastPaymentDate = credit.payments[credit.payments.length - 1].date;
          paymentHistory = `<div>Cleared on ${lastPaymentDate.split("T")[0]}</div>`;
        } else {
          paymentHistory = credit.payments
            .map(p => `<div>Part payment of KES ${p.amount.toFixed(2)} paid on ${p.date.split("T")[0]}</div>`)
            .join("");
        }
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${credit.buyerName}</td>
        <td>${credit.itemName}</td>
        <td>${credit.amount.toFixed(2)}</td>
        <td>${credit.paidAmount.toFixed(2)}</td>
        <td>${credit.balance.toFixed(2)}</td>
        <td>${credit.dateTaken.split("T")[0]}</td>
        <td>
          ${paymentBtn}
          ${paymentHistory}
          ${editBtn}
          ${deleteBtn}
        </td>
      `;

      tbody.appendChild(row);
    });
  }

function canEditOrDelete(dateTaken) {
    const now = new Date();
    const taken = new Date(dateTaken);
    return (now - taken) / (1000 * 60 * 60) < 24;
  }




export function refreshUI() {
  const products = getProducts();
  const sales = getSales();
  const credits = getCredits();

  // Refresh dropdowns
  populateProductDropdowns(products);
  populateCreditDropdown(products);

  // Refresh sales and credits table
  updateSalesTable(sales);
  renderCreditsTable(credits);

  // ✅ Refresh reports
  const monthlyReport = getThisMonthReport();
  renderReportTiles(monthlyReport);

  const summary = summarizeReport(monthlyReport);
  renderSummaryCards(summary);
}

// Call this whenever new data is added
export function refreshReports() {
  try {
    // ✅ Weekly Report
    const weeklyData = generateWeeklyReport();
    renderWeeklyReportTable(weeklyData);
  } catch (error) {
    console.warn("⚠️ Weekly report refresh skipped:", error);
  }

  try {
    // ✅ Monthly Report
    const today = new Date();
    const monthlyData = generateMonthlyReport(today.getFullYear(), today.getMonth() + 1);
    renderMonthlyReportTable(monthlyData);
  } catch (error) {
    console.warn("⚠️ Monthly report refresh skipped:", error);
  }

  try {
    // ✅ Daily Expenses Table
    loadDailyExpenseReport();
  } catch (error) {
    console.warn("⚠️ Daily expense report refresh skipped:", error);
  }
}



export function initHelpButton() {
    const helpIcon = document.getElementById("help-icon");
    if (helpIcon) {
        helpIcon.addEventListener("click", () => {
            window.open("help.html", "HelpWindow", "width=600,height=400,scrollbars=yes,resizable=yes");
        });
    }
}


  