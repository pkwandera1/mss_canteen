import './styles/styles.css';
import _ from 'lodash';

// Modules
import { showSection, populateProductDropdowns, populateFilters } from './modules/ui.js';
import { registerProduct, updateProductRegisterTable } from './modules/products.js';
import { restockProduct, loadStock, setupRestockShortcut } from './modules/stock.js';
import { recordSale, loadSalesReport, deleteSelectedSales } from './modules/sales.js';
import { getProducts, exportDataToFile, importDataFromFile } from './modules/storage.js';
import { filterSales, setupFilterListeners, setupPeriodChangeListener } from './modules/filters.js';
import { registerExpenseType, loadExpenseTypeRegister, populateExpenseDropdown } from './modules/expenseTypes.js';
import { addExpense, loadDailyExpenseReport } from './modules/dailyExpenses.js';
import { loadMonthlyReport } from './modules/monthlyReport.js';
import { loadExpenseHistory } from './modules/expenseHistory.js';


window.showSection = showSection;


document.addEventListener("DOMContentLoaded", () => {
  // === Initialize Data ===
  const products = getProducts();
  updateProductRegisterTable();
  loadStock();
  loadSalesReport();
  populateProductDropdowns(products);
  populateFilters(products);
  setupRestockShortcut();
  setupFilterListeners();
  setupPeriodChangeListener();

  // === Load Expense Register and Daily Expense UI ===
  loadExpenseTypeRegister();
  populateExpenseDropdown();
  loadDailyExpenseReport();

  // === Load Monthly Report (default to current month) ===
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  document.getElementById("reportMonth").value = `${year}-${String(month).padStart(2, "0")}`;
  loadMonthlyReport(year, month);

  // === Button Actions ===
  document.getElementById("addProductBtn")?.addEventListener("click", registerProduct);
  document.getElementById("deleteSaleButton")?.addEventListener("click", deleteSelectedSales);
  document.getElementById("recordSaleBtn")?.addEventListener("click", recordSale);
  document.getElementById("restockBtn")?.addEventListener("click", restockProduct);
  document.getElementById("addExpenseTypeBtn")?.addEventListener("click", registerExpenseType);
  document.getElementById("addExpenseBtn")?.addEventListener("click", addExpense);
  document.getElementById("saleDate").valueAsDate = new Date();
  document.getElementById("reportDate").valueAsDate = new Date();


  // === Backup / Restore ===
  document.getElementById("backupBtn")?.addEventListener("click", exportDataToFile);
  document.getElementById("restoreFileInput")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      importDataFromFile(file, () => {
        updateProductRegisterTable();
        loadStock();
        loadSalesReport();
        populateProductDropdowns(getProducts());
        populateFilters(getProducts());
        loadDailyExpenseReport();
        loadExpenseTypeRegister();
        // 👉 Navigate to Sales page after successful import
        showSection("salesPage");
      });
    }
  });

  // === Navigation Buttons ===
  document.querySelectorAll(".sidebar button").forEach(button => {
    button.addEventListener("click", () => {
      const sectionId = button.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
      if (sectionId) showSection(sectionId);
    });
  });

  // === Responsive Sidebar Toggle ===
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("hidden");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.add("hidden");
    });
  }

  document.querySelectorAll(".sidebar button").forEach(button => {
    button.addEventListener("click", () => {
      const sectionId = button.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
      if (sectionId) showSection(sectionId);
  
      // 👇 Close sidebar on small screens
      if (window.innerWidth <= 768) {
        document.querySelector(".sidebar")?.classList.remove("active");
        document.getElementById("sidebarOverlay")?.classList.add("hidden");
      }
    });
  });
  
  const viewReportBtn = document.getElementById("viewReportBtn");
  if (viewReportBtn) {
    viewReportBtn.addEventListener("click", () => {
      loadSalesReport();
    });
  }

  // === Monthly Report Events ===
  document.getElementById("loadMonthlyReportBtn")?.addEventListener("click", () => {
    const input = document.getElementById("reportMonth").value;
    if (!input) return;
    const [yearStr, monthStr] = input.split("-");
    loadMonthlyReport(parseInt(yearStr), parseInt(monthStr));
  });

  document.getElementById("printMonthlyReportBtn")?.addEventListener("click", () => {
    const reportTable = document.getElementById("monthlyReportTable").outerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Monthly Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #2c3e50; color: white; }
          </style>
        </head>
        <body>
          <h2>Monthly Report</h2>
          ${reportTable}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  });

  document.getElementById("exportMonthlyReportBtn")?.addEventListener("click", () => {
    const rows = [["Date", "Sales", "Profit", "Expenses", "Net Profit"]];
    const tbody = document.querySelectorAll("#monthlyReportTable tbody tr");

    tbody.forEach(row => {
      const cols = Array.from(row.querySelectorAll("td,th")).map(td => td.textContent.trim());
      rows.push(cols);
    });

    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-report-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById("loadExpenseHistoryBtn")?.addEventListener("click", () => {
    const input = document.getElementById("expenseHistoryMonth").value;
    if (!input) {
      alert("Please select a month.");
      return;
    }
  
    const [yearStr, monthStr] = input.split("-");
    loadExpenseHistory(parseInt(yearStr), parseInt(monthStr));
  });  
  
});


