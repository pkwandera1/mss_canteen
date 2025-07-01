// src/modules/credit.js
import { getProducts, getCredits, saveCredits } from './storage.js';
import { renderCreditsTable, populateCreditDropdown } from './ui.js';
import { createSaleRecord } from './sales.js';
import { getCurrentDate, validateDate, showToast } from './utils.js';

// ========== Initialize Credit Module ==========
export function initCreditModule() {
  try {
    loadCreditDropdown();
    setupCreditEventListeners();
    renderCreditsTable(getCredits());
    updateCreditTotals();
  } catch (error) {
    console.error("Failed to initialize credit module:", error);
    alert("Failed to initialize credit system. Please try again.");
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
    const search = sanitizeInput(document.getElementById("creditSearch")?.value.toLowerCase());
    const fromDate = validateDate(document.getElementById("creditFromDate")?.value);
    const toDate = validateDate(document.getElementById("creditToDate")?.value);

    const filtered = getCredits().filter(credit => {
      const creditDate = new Date(credit.dateTaken);
      return (
        (credit.buyerName.toLowerCase().includes(search) ||
         credit.itemName.toLowerCase().includes(search)) &&
        (!fromDate || creditDate >= new Date(fromDate)) &&
        (!toDate || creditDate <= new Date(toDate))
      );
    });

    renderCreditsTable(filtered);
    updateCreditTotals(filtered);
  } catch (error) {
    console.error("Filtering failed:", error);
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

    //createSaleRecord(product.productId, 1, credit.dateTaken);

    const credits = getCredits();
    credits.push(credit);
    saveCredits(credits);

    renderCreditsTable(credits);
    resetCreditForm();

    showToast(`✅ Credit of KES ${amount.toFixed(2)} recorded for ${buyerName}`);
  } catch (error) {
    console.error("Credit recording failed:", error);
    alert(error.message);
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
  } catch (error) {
    console.error("Payment failed:", error);
    alert(error.message);
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
  } catch (error) {
    console.error("Deletion failed:", error);
    alert(error.message);
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
  } catch (error) {
    console.error("Edit failed:", error);
    alert(error.message);
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

