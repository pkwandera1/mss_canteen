// src/modules/credit.js
import { getProducts, getCredits, saveCredits } from './storage.js';
import { renderCreditsTable, populateCreditDropdown, refreshUI, refreshReports } from './ui.js';
import { getCurrentDate, showToast, showError } from './utils.js';



// ========== Initialize Credit Module ==========
export function initCreditModule() {
  try {
    loadCreditDropdown();
    setupCreditEventListeners();
    renderCreditsTable(getCredits());
    updateCreditTotals();
    populateClientDropdown("clientList");       // For entering new credit
    populateClientDropdown("filterClientList"); // For search filter

  } catch (error) {
    console.error("Failed to initialize credit module:", error);
    showError("Failed to initialize credit system. Please try again.");
  }
}

// ========== Dropdown Loading ==========
function loadCreditDropdown() {
  try {
    const products = getProducts();
    if (!products?.length) {
      console.warn("No products found for credit dropdown");
      return;
    }
    populateCreditDropdown(products);
  } catch (error) {
    console.error("Failed to load credit dropdown:", error);
  }
}

// ========== Filter Records ==========
function filterCreditRecords() {
  try {
    const searchInput = document.getElementById("creditSearch")?.value || "";
    const search = searchInput.toLowerCase().trim();

    const from = document.getElementById("creditFromDate")?.value || null;
    const to = document.getElementById("creditToDate")?.value || null;

    // ✅ FIX: Get credits dynamically instead of using undefined allCredits
    const allCredits = getCredits();

    const filtered = allCredits.filter(credit => {
      const name = (credit.buyerName || "").toLowerCase().trim();
      const item = (credit.itemName || "").toLowerCase().trim();

      const matchesText = !search || name.includes(search) || item.includes(search);

      const creditDate = new Date(credit.dateTaken);
      const matchesFrom = !from || creditDate >= new Date(from);
      const matchesTo = !to || creditDate <= new Date(to);

      return matchesText && matchesFrom && matchesTo;
    });

    renderCreditsTable(filtered);
    updateCreditTotals(filtered);
  } catch (error) {
    console.error("❌ Filtering failed:", error);
  }
}

// ========== Setup UI Event Listeners ==========
function setupCreditEventListeners() {
  try {
    document.getElementById("creditBtn")?.addEventListener("click", recordNewCredit);
    document.getElementById("creditSearch")?.addEventListener("input", debounce(filterCreditRecords, 300));
    document.getElementById("creditFromDate")?.addEventListener("change", filterCreditRecords);
    document.getElementById("creditToDate")?.addEventListener("change", filterCreditRecords);
    document.getElementById("creditTable")?.addEventListener("click", handleCreditTableClick);
  } catch (error) {
    console.error("Failed to set up credit events:", error);
  }
}

// ========== Handle Table Button Clicks ==========
function handleCreditTableClick(e) {
  const rawId = e.target.dataset.id;
  if (!rawId) return;

  const id = isNaN(rawId) ? rawId : parseInt(rawId);

  if (e.target.classList.contains("add-payment-btn")) {
    handleAddPayment(id);
  } else if (e.target.classList.contains("delete-credit-btn")) {
    handleDeleteCredit(id);
  } else if (e.target.classList.contains("edit-credit-btn")) {
    handleEditCredit(id);
  }

  updateCreditTotals();
}

// ========== Record New Credit ==========
function recordNewCredit() {
  try {
    const buyerName = sanitizeInput(document.getElementById("creditCustomerName")?.value.trim());
    const productId = document.getElementById("creditProductDropdown")?.value;
    const amount = parseFloat(document.getElementById("creditQuantity")?.value);
    const product = getProducts().find(p => p.productId === productId);

    if (!buyerName || buyerName.length > 100) throw new Error("Invalid customer name (max 100 chars)");
    if (!product) throw new Error("Selected product not found");
    if (isNaN(amount) || amount <= 0 || amount > 1000000) throw new Error("Invalid amount (0-1,000,000)");

    const credit = {
      id: generateCreditId(),
      buyerName,
      itemId: product.productId,
      itemName: product.productName,
      amount: parseFloat(amount.toFixed(2)),
      paidAmount: 0,
      balance: amount,
      status: "Unpaid",
      dateTaken: getCurrentDate(),
      payments: []
    };

    const credits = getCredits();
    credits.push(credit);
    saveCredits(credits);

    populateClientDropdown("clientList");
    populateClientDropdown("filterClientList");
    renderCreditsTable(credits);
    resetCreditForm();

    showToast(`✅ Credit of KES ${amount.toFixed(2)} recorded for ${buyerName}`);
    refreshUI();
    refreshReports();
  } catch (error) {
    console.error("Credit recording failed:", error);
    showError(error.message);
  }
}

// ========== Payment to Credit ==========
function handleAddPayment(id) {
  try {
    const credits = getCredits();
    const credit = credits.find(c => c.id === id);
    if (!credit) throw new Error("Credit record not found");

    const input = prompt(`Enter payment amount (max ${credit.balance.toFixed(2)}):`);
    const paymentAmount = parseFloat(input);
    if (isNaN(paymentAmount)) return;

    if (paymentAmount <= 0) throw new Error("Amount must be positive");
    if (paymentAmount > credit.balance) throw new Error(`Cannot exceed ${credit.balance.toFixed(2)}`);

    credit.paidAmount += paymentAmount;
    credit.balance = credit.amount - credit.paidAmount;
    credit.payments.push({ amount: paymentAmount, date: getCurrentDate() });
    credit.status = credit.balance === 0 ? "Paid" : "Partially Paid";

    saveCredits(credits);
    renderCreditsTable(credits);
    showToast(`Payment of ${paymentAmount.toFixed(2)} recorded`);
    refreshUI();
    refreshReports();
  } catch (error) {
    console.error("Payment failed:", error);
    showError(error.message);
  }
}

// ========== Delete Credit ==========
function handleDeleteCredit(id) {
  try {
    if (!confirm("Are you sure you want to delete this credit record?")) return;

    const credits = getCredits();
    const credit = credits.find(c => c.id === id);
    if (!credit) throw new Error("Credit record not found");
    if (!canEditOrDelete(credit.dateTaken)) throw new Error("Credits can only be deleted within 24 hours");

    const updated = credits.filter(c => c.id !== id);
    saveCredits(updated);
    renderCreditsTable(updated);
    showToast("Credit record deleted");
    refreshUI();
    refreshReports();
  } catch (error) {
    console.error("Deletion failed:", error);
    showError(error.message);
  }
}

// ========== Edit Credit ==========
function handleEditCredit(id) {
  try {
    const credits = getCredits();
    const credit = credits.find(c => c.id === id);
    if (!credit) throw new Error("Credit record not found");
    if (!canEditOrDelete(credit.dateTaken)) throw new Error("Credits can only be edited within 24 hours");

    const input = prompt(
      `New amount (current: ${credit.amount.toFixed(2)}, paid: ${credit.paidAmount.toFixed(2)}):`,
      credit.amount.toFixed(2)
    );
    const newAmount = parseFloat(input);
    if (isNaN(newAmount)) return;

    if (newAmount <= 0) throw new Error("Amount must be positive");
    if (newAmount < credit.paidAmount) throw new Error(`Must be ≥ ${credit.paidAmount.toFixed(2)}`);

    credit.amount = newAmount;
    credit.balance = newAmount - credit.paidAmount;
    credit.status = credit.balance === 0 ? "Paid" : credit.paidAmount > 0 ? "Partially Paid" : "Unpaid";

    saveCredits(credits);
    renderCreditsTable(credits);
    showToast("Credit updated successfully");
    refreshUI();
    refreshReports();
  } catch (error) {
    console.error("Edit failed:", error);
    showError(error.message);
  }
}

// ========== Helpers ==========
function resetCreditForm() {
  document.getElementById("creditCustomerName").value = "";
  document.getElementById("creditProductDropdown").value = "";
  document.getElementById("creditQuantity").value = "";
  document.getElementById("creditCustomerName").focus();
}

function updateCreditTotals(credits = getCredits()) {
  const totals = credits.reduce((acc, c) => ({
    owed: acc.owed + c.amount,
    paid: acc.paid + c.paidAmount,
    balance: acc.balance + c.balance
  }), { owed: 0, paid: 0, balance: 0 });

  const footer = document.getElementById("creditTotals");
  if (footer) {
    footer.innerHTML = `
      <td colspan="3"><strong>Totals</strong></td>
      <td><strong>${totals.owed.toFixed(2)}</strong></td>
      <td><strong>${totals.paid.toFixed(2)}</strong></td>
      <td><strong>${totals.balance.toFixed(2)}</strong></td>
      <td colspan="2"></td>
    `;
  }
}

function generateCreditId() {
  return `CREDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function sanitizeInput(input) {
  return input?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || "";
}

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function canEditOrDelete(dateTaken) {
  const diffHrs = (Date.now() - new Date(dateTaken).getTime()) / (1000 * 60 * 60);
  return diffHrs < 24;
}

function populateClientDropdown(targetId = "clientList") {
  try {
    const credits = getCredits();
    const dataList = document.getElementById(targetId);
    if (!dataList) return;

    const uniqueClients = [...new Set(
      credits.map(c => c.buyerName?.trim()).filter(Boolean)
    )];

    dataList.innerHTML = "";

    uniqueClients.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      dataList.appendChild(option);
    });
    
  } catch (error) {
    console.error("Failed to populate client dropdown:", error);
  }
}

document.getElementById("printFilteredCreditsBtn")?.addEventListener("click", printFilteredCredits);


function printFilteredCredits() {
  try {
    const credits = getCredits();
    const searchInput = document.getElementById("creditSearch")?.value.trim();
    const isSingleClient = searchInput && searchInput.length > 0;

    let filteredCredits = credits;

    // ✅ Filter by client if name is entered
    if (isSingleClient) {
      filteredCredits = credits.filter(c => c.buyerName.toLowerCase().includes(searchInput.toLowerCase()));
    }

    // ✅ Group by client
    const grouped = filteredCredits.reduce((acc, credit) => {
      if (!acc[credit.buyerName]) acc[credit.buyerName] = [];
      acc[credit.buyerName].push(credit);
      return acc;
    }, {});

    const sortedClients = Object.keys(grouped).sort();

    // ✅ Calculate overall totals
    const grandOwed = filteredCredits.reduce((sum, c) => sum + c.amount, 0);
    const grandPaid = filteredCredits.reduce((sum, c) => sum + c.paidAmount, 0);
    const grandBalance = filteredCredits.reduce((sum, c) => sum + c.balance, 0);

    // ✅ Build styled content
    let content = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; width: 95%; color: #333;">
        <h1 style="text-align: center; margin-bottom: 5px;">Debt Statement Report</h1>
        <p style="text-align: center; font-size: 14px; margin-top: 0;">Generated on ${getCurrentDate()}</p>
        <hr style="margin: 10px 0 20px 0;">
    `;

    sortedClients.forEach(client => {
      const clientDebts = grouped[client];
      const totalOwed = clientDebts.reduce((sum, c) => sum + c.amount, 0);
      const totalPaid = clientDebts.reduce((sum, c) => sum + c.paidAmount, 0);
      const totalBalance = clientDebts.reduce((sum, c) => sum + c.balance, 0);

      let rows = "";
      clientDebts.forEach(c => {
        rows += `
          <tr>
            <td>${c.itemName}</td>
            <td>KES ${c.amount.toFixed(2)}</td>
            <td>KES ${c.paidAmount.toFixed(2)}</td>
            <td style="color: ${c.balance > 0 ? 'red' : 'green'};">KES ${c.balance.toFixed(2)}</td>
          </tr>`;
      });

      content += `
        <div style="border: 1px solid #ccc; border-radius: 6px; padding: 15px; margin-bottom: 20px; background: #fdfdfd; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h3 style="margin-top: 0; color: #444;">Client: ${client}</h3>
          <table width="100%" style="border-collapse: collapse; margin-top: 5px; font-size: 14px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ccc; padding: 6px; text-align: left;">Item</th>
                <th style="border: 1px solid #ccc; padding: 6px; text-align: left;">Total</th>
                <th style="border: 1px solid #ccc; padding: 6px; text-align: left;">Paid</th>
                <th style="border: 1px solid #ccc; padding: 6px; text-align: left;">Balance</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin: 10px 0 0 0; font-weight: bold;">
            Totals: Owed: KES ${totalOwed.toFixed(2)} | Paid: KES ${totalPaid.toFixed(2)} | 
            Balance: <span style="color:red;">KES ${totalBalance.toFixed(2)}</span>
          </p>
        </div>
      `;
    });

    // ✅ Grand Total Summary
    content += `
      <div style="margin-top: 20px; padding: 15px; border: 2px solid #000; border-radius: 6px; background: #f7f7f7;">
        <h2 style="margin: 0 0 5px 0;">Overall Business Debt Summary</h2>
        <p style="margin: 3px 0;"><strong>Total Owed:</strong> KES ${grandOwed.toFixed(2)}</p>
        <p style="margin: 3px 0;"><strong>Total Paid:</strong> KES ${grandPaid.toFixed(2)}</p>
        <p style="margin: 3px 0;"><strong>Outstanding Balance:</strong> <span style="color:red; font-weight:bold;">KES ${grandBalance.toFixed(2)}</span></p>
      </div>
      <p style="font-size: 12px; text-align: center; margin-top:15px; color:#777;">
        Thank you for your business. Kindly settle outstanding balances promptly.
      </p>
      </div>
    `;

    // ✅ Document title
    const docTitle = isSingleClient
      ? `${searchInput} Debt Statement`
      : `All Clients Debt Statement`;

    // ✅ Open print window
    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>${docTitle}</title>
          <style>
            table { width:100%; border-collapse:collapse; }
            th, td { border:1px solid #ccc; padding:5px; }
          </style>
        </head>
        <body onload="document.title='${docTitle}'; window.print(); window.close();">
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();

  } catch (error) {
    console.error("Print filtered credits failed:", error);
    showError("Could not print client debts.");
  }
}



