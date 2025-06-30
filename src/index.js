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
import {handleSaveMpesaPayment, loadMpesaPayments, setupMpesaFilters } from './modules/mpesa.js';
import { initCreditModule,} from './modules/credit.js';
import {generateWeeklyReport, renderWeeklyReportTable, exportWeeklyReportToCSV, printWeeklyReportTable} from './modules/weeklyReport.js';
import { initGlobalDateControl, getCurrentDate } from './modules/utils.js';

window.showSection = showSection;

document.addEventListener("DOMContentLoaded", () => {
  //=== Global Date COntrol ====
    initGlobalDateControl();

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
  document.getElementById("reportDate").valueAsDate = new Date();
  document.getElementById('mpesaBtn').addEventListener('click', handleSaveMpesaPayment);

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
  // === View Sales Report ===
  const viewReportBtn = document.getElementById("viewReportBtn");
if (viewReportBtn) {
  viewReportBtn.addEventListener("click", () => {
    const selectedDate = document.getElementById("reportDate")?.value || null;
    loadSalesReport(selectedDate);
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
  const rows = [["Date", "Sales", "Profit", "Expenses", "Mpesa Sales", "Credit Issued", "Credit Paid (Cash)", "Credit Paid (Mpesa)", "Net Profit"]];
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
  // === Mpesa === 
    // Set up filters
    setupMpesaFilters();
    // Load existing Mpesa payments
    loadMpesaPayments();

  // === Credit Sales ===
  initCreditModule();

  // === Weekly Reports ===
  let weekOffset = 0;

  function updateWeekLabel(offset) {
  const today = new Date();
  const current = new Date(today.setDate(today.getDate() - today.getDay()));
  current.setDate(current.getDate() - offset * 7);
  const start = new Date(current);
  const end = new Date(current);
  end.setDate(start.getDate() + 6);

  const options = { month: 'short', day: 'numeric' };
  const label = `Week of ${start.toLocaleDateString(undefined, options)} – ${end.toLocaleDateString(undefined, options)}`;
  document.getElementById("weekRangeLabel").textContent = label;
  }

  function loadWeeklyReport(offset = 0) {
  updateWeekLabel(offset);
  const report = generateWeeklyReport(offset);
  renderWeeklyReportTable(report);
  } 

  // Hook up Weekly Report buttons

  document.getElementById("loadWeeklyReportBtn").addEventListener("click", () => {
    weekOffset = 0;
    loadWeeklyReport(weekOffset);
  });

  document.getElementById("exportWeeklyReportBtn").addEventListener("click", () => {
    const report = generateWeeklyReport(weekOffset);
    exportWeeklyReportToCSV(report);
  });

  document.getElementById("printWeeklyReportBtn").addEventListener("click", () => {
    printWeeklyReportTable();
  });

  document.getElementById("prevWeekBtn").addEventListener("click", () => {
    weekOffset++;
    loadWeeklyReport(weekOffset);
  });

  document.getElementById("nextWeekBtn").addEventListener("click", () => {
    if (weekOffset > 0) {
      weekOffset--;
      loadWeeklyReport(weekOffset);
    }
  });
});



