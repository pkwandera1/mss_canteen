if (window.location.hostname === "localhost") {
  import('./dev-loader.js');
}
import './styles/styles.css';
import _ from 'lodash';

// ===== Imports from custom modules =====
import { showSection, populateProductDropdowns, populateFilters, initHelpButton  } from './modules/ui.js';
import { registerProduct, updateProductRegisterTable, populateCategoryDropdown } from './modules/products.js';
import { restockProduct, loadStock, setupRestockShortcut } from './modules/stock.js';
import { recordSale, loadSalesReport, deleteSelectedSales } from './modules/sales.js';
import { getProducts, exportDataToFile, importDataFromFile } from './modules/storage.js';
import { filterSales, setupFilterListeners, setupPeriodChangeListener } from './modules/filters.js';
import { registerExpenseType, loadExpenseTypeRegister, populateExpenseDropdown } from './modules/expenseTypes.js';
import { addExpense, loadDailyExpenseReport } from './modules/dailyExpenses.js';
import { generateMonthlyReport, renderMonthlyReportTable } from './modules/monthlyReport.js';
import { loadExpenseHistory } from './modules/expenseHistory.js';
import { handleSaveMpesaPayment, loadMpesaPayments, setupMpesaFilters } from './modules/mpesa.js';
import { initCreditModule } from './modules/credit.js';
import { generateWeeklyReport, renderWeeklyReportTable } from './modules/weeklyReport.js';
import { initGlobalDateControl, getStartOfWeek, getCurrentDate } from './modules/utils.js';
import {
  exportReportToCSV,
  printReportTable,
  renderSummaryCards,
  summarizeReport,
  getThisYearReport,
  getThisMonthReport
} from './modules/reportUtils.js';
import { displayAppVersion } from './version.js';

// ✅ Helper function to get local date string (YYYY-MM-DD) adjusted to user's timezone
function getLocalDateString(date = new Date()) {
  date = new Date(date);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split("T")[0];
}

window.showSection = showSection;

document.addEventListener("DOMContentLoaded", () => {

  /**
   * =========================================================
   * 1️⃣ INITIALIZATION: Setup all core app data & UI
   * =========================================================
   */
  initGlobalDateControl();       // Initialize global date controls for filtering/reporting
  setupSummaryViewToggle();      // Enable switching between Today, Week, Month, Year summaries
  displayAppVersion();
  initHelpButton();

  // Load products and populate dropdowns for sales & restocking
  const products = getProducts();
  updateProductRegisterTable();
  loadStock();
  loadSalesReport();
  populateProductDropdowns(products);
  populateFilters(products);
  populateCategoryDropdown();

  // Setup event shortcuts
  setupRestockShortcut();
  setupFilterListeners();
  setupPeriodChangeListener();

  // Load expenses data
  loadExpenseTypeRegister();
  populateExpenseDropdown();
  loadDailyExpenseReport();

  /**
   * =========================================================
   * 2️⃣ DEFAULT MONTHLY REPORT
   * =========================================================
   */
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  document.getElementById("reportMonth").value = `${year}-${String(month).padStart(2, "0")}`;

  const report = generateMonthlyReport(year, month);
  renderMonthlyReportTable(report);

  /**
   * =========================================================
   * 3️⃣ EVENT LISTENERS FOR BUTTONS & ACTIONS
   * =========================================================
   */
  document.getElementById("addProductBtn")?.addEventListener("click", registerProduct);
  document.getElementById("deleteSaleButton")?.addEventListener("click", deleteSelectedSales);
  document.getElementById("recordSaleBtn")?.addEventListener("click", recordSale);
  document.getElementById("restockBtn")?.addEventListener("click", restockProduct);
  document.getElementById("addExpenseTypeBtn")?.addEventListener("click", registerExpenseType);
  document.getElementById("addExpenseBtn")?.addEventListener("click", addExpense);
  document.getElementById("reportDate").valueAsDate = new Date();
  document.getElementById("mpesaBtn")?.addEventListener("click", handleSaveMpesaPayment);

  // Backup & restore
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
        showSection("salesPage");
      });
    }
  });

  // Sidebar navigation
  document.querySelectorAll(".sidebar button").forEach(button => {
    button.addEventListener("click", () => {
      const sectionId = button.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
      if (sectionId) showSection(sectionId);
    });
  });

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

  // Sidebar auto-hide on mobile after selecting menu
  document.querySelectorAll(".sidebar button").forEach(button => {
    button.addEventListener("click", () => {
      const sectionId = button.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
      if (sectionId) showSection(sectionId);
      if (window.innerWidth <= 768) {
        document.querySelector(".sidebar")?.classList.remove("active");
        document.getElementById("sidebarOverlay")?.classList.add("hidden");
      }
    });
  });

  // Daily report viewer
  const viewReportBtn = document.getElementById("viewReportBtn");
  if (viewReportBtn) {
    viewReportBtn.addEventListener("click", () => {
      const selectedDate = document.getElementById("reportDate")?.value || null;
      loadSalesReport(selectedDate);
    });
  }

  // Monthly report buttons
  document.getElementById("loadMonthlyReportBtn")?.addEventListener("click", () => {
    const input = document.getElementById("reportMonth").value;
    if (!input) return;

    const [yearStr, monthStr] = input.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const report = generateMonthlyReport(year, month);
    renderMonthlyReportTable(report);

    renderSummaryCardsByView("month");
    renderSummaryCardsByView("week");
    renderSummaryCardsByView("today");
  });

  document.getElementById("printMonthlyReportBtn")?.addEventListener("click", () => {
    printReportTable("monthlyReportTable", "Monthly Report");
  });

  document.getElementById("exportMonthlyReportBtn")?.addEventListener("click", () => {
    const input = document.getElementById("reportMonth").value;
    const [yearStr, monthStr] = input.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const report = generateMonthlyReport(year, month);
    exportReportToCSV(report, "Monthly Report");
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

  // Mpesa payments
  setupMpesaFilters();
  loadMpesaPayments();

  // Credit module initialization
  initCreditModule();

  /**
   * =========================================================
   * 4️⃣ WEEKLY REPORT HANDLING
   * =========================================================
   */
  let weekOffset = 0;
  let currentWeeklyReport = [];

  // Update week label based on selected offset
  function updateWeekLabel(offset) {
  const today = new Date();
  const start = getStartOfWeek(today);
  start.setDate(start.getDate() - offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday

  const options = { month: 'short', day: 'numeric' };
  const label = `Week of ${start.toLocaleDateString(undefined, options)} – ${end.toLocaleDateString(undefined, options)}`;
  document.getElementById("weekRangeLabel").textContent = label;
  }


  // Load weekly report and update summary
  function loadWeeklyReport(offset = 0) {
    updateWeekLabel(offset);
    const report = generateWeeklyReport(offset);
    currentWeeklyReport = report;
    renderWeeklyReportTable(report);

    const defaultView = document.getElementById("summaryView")?.value || "week";
    renderSummaryCardsByView(defaultView);
  }

  // Render summary cards for today/week/month/year
  async function renderSummaryCardsByView(view) {
    let filteredReport = [];
    const todayStr = getLocalDateString(); // ✅ Now local date-safe

    if (view === "today") {
      filteredReport = currentWeeklyReport.filter(day => day.date === todayStr);
    } else if (view === "week") {
      filteredReport = currentWeeklyReport;
    } else if (view === "month") {
      filteredReport = getThisMonthReport();
    } else if (view === "year") {
      filteredReport = getThisYearReport();
    }

    const summary = summarizeReport(filteredReport);
    renderSummaryCards(summary);
  }

  // Allow dropdown to change summary view
  function setupSummaryViewToggle() {
    const select = document.getElementById("summaryView");
    if (!select) return;

    select.onchange = (e) => {
      renderSummaryCardsByView(e.target.value);
    };
  }

  // Weekly report buttons
  document.getElementById("loadWeeklyReportBtn")?.addEventListener("click", () => {
    weekOffset = 0;
    loadWeeklyReport(weekOffset);
  });

  document.getElementById("exportWeeklyReportBtn")?.addEventListener("click", () => {
    const report = generateWeeklyReport(weekOffset);
    exportReportToCSV(report, "Weekly Sales Report");
  });

  document.getElementById("printWeeklyReportBtn")?.addEventListener("click", () => {
    printReportTable("weeklyReportTable", "Weekly Sales Report");
  });

  document.getElementById("prevWeekBtn")?.addEventListener("click", () => {
    weekOffset++;
    loadWeeklyReport(weekOffset);
  });

  document.getElementById("nextWeekBtn")?.addEventListener("click", () => {
    if (weekOffset > 0) {
      weekOffset--;
      loadWeeklyReport(weekOffset);
    }
  });

  // Load first weekly report on startup
  loadWeeklyReport(weekOffset);
});
