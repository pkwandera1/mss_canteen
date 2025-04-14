// src/modules/filters.js

import { getSales, getProducts } from './storage.js';
import { updateSalesTable } from './ui.js';

// Filter sales based on selected criteria
export function filterSales() {
  const sales = getSales();
  const products = getProducts();

  if (!sales || sales.length === 0) return;

  const period = document.getElementById("filterPeriod").value;
  const productFilter = document.getElementById("filterProduct").value;
  const categoryFilter = document.getElementById("filterCategory").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  let filtered = [...sales];
  const today = new Date().toISOString().split("T")[0];


  // Start of week/month calculations
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Date filtering
  filtered = filtered.filter(sale => {
    const saleDate = new Date(sale.date);
    switch (period) {
      case "today":
        return sale.date === today;
      case "thisWeek":
        return saleDate >= startOfWeek;
      case "thisMonth":
        return saleDate >= startOfMonth;
      case "custom":
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
      default:
        return true;
    }
  });

  // Product filter
  if (productFilter) {
    filtered = filtered.filter(sale => sale.productId === productFilter);
  }

  // Category filter
  if (categoryFilter) {
    filtered = filtered.filter(sale => sale.productCategory === categoryFilter);
  }

  updateSalesTable(filtered);
}

// Enable/disable custom date inputs
export function setupPeriodChangeListener() {
  const filterPeriod = document.getElementById("filterPeriod");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");

  filterPeriod.addEventListener("change", () => {
    const isCustom = filterPeriod.value === "custom";
    startDate.disabled = !isCustom;
    endDate.disabled = !isCustom;
    filterSales();
  });
}

// Hook filter dropdowns and inputs
export function setupFilterListeners() {
  document.getElementById("filterProduct").addEventListener("change", filterSales);
  document.getElementById("filterCategory").addEventListener("change", filterSales);
  document.getElementById("startDate").addEventListener("change", filterSales);
  document.getElementById("endDate").addEventListener("change", filterSales);
}
