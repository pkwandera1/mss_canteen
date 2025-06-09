// src/modules/credit.js

import { getProducts, getCredits, saveCredits } from './storage.js';
import { renderCreditsTable, populateCreditDropdown } from './ui.js';

// Initialize on app load
export function initCreditModule() {
  loadCreditDropdown();
  loadCreditEvents();
  renderCreditsTable(getCredits());
  updateCreditTotals();
}

// Populate product dropdown for credit
function loadCreditDropdown() {
  const products = getProducts();
  populateCreditDropdown(products);
}

// Set up all credit-related event listeners
function loadCreditEvents() {
  document.getElementById("creditBtn").addEventListener("click", () => {
    recordNewCredit();
    updateCreditTotals();
  });

  document.getElementById("creditSearch").addEventListener("input", filterCreditRecords);
  document.getElementById("creditFromDate").addEventListener("change", filterCreditRecords);
  document.getElementById("creditToDate").addEventListener("change", filterCreditRecords);

  document.querySelector("#creditTable").addEventListener("click", (e) => {
    const id = parseInt(e.target.dataset.id);
    if (e.target.classList.contains("add-payment-btn")) {
      handleAddPayment(id);
      updateCreditTotals();
      return;
    }
    if (e.target.classList.contains("delete-credit-btn")) {
      handleDeleteCredit(id);
      updateCreditTotals();
      return;
    }
    if (e.target.classList.contains("edit-credit-btn")) {
      handleEditCredit(id);
      updateCreditTotals();
    }
  });
}

// Record new credit
function recordNewCredit() {
  const buyerName = document.getElementById("creditCustomerName").value.trim();
  const productId = document.getElementById("creditProductDropdown").value;
  const amount = parseFloat(document.getElementById("creditQuantity").value);

  if (!buyerName || !productId || isNaN(amount) || amount <= 0) {
    return alert("Please fill all fields correctly.");
  }

  const products = getProducts();
  const product = products.find(p => p.productId === productId);
  if (!product) return alert("Product not found.");

  const credits = getCredits();

  credits.push({
    id: Date.now(),
    buyerName,
    itemId: product.productId,
    itemName: product.productName,
    amount,
    paidAmount: 0,
    balance: amount,
    status: "Unpaid",
    dateTaken: new Date().toISOString(),
    payments: []
  });

  saveCredits(credits);
  renderCreditsTable(credits);
  resetCreditForm();
}

// Filter logic
function filterCreditRecords() {
  const search = document.getElementById("creditSearch").value.toLowerCase();
  const from = new Date(document.getElementById("creditFromDate").value);
  const to = new Date(document.getElementById("creditToDate").value);
  const credits = getCredits();

  const filtered = credits.filter(c => {
    const date = new Date(c.dateTaken);
    return (
      c.buyerName.toLowerCase().includes(search) &&
      (!isNaN(from) ? date >= from : true) &&
      (!isNaN(to) ? date <= to : true)
    );
  });

  renderCreditsTable(filtered);
  updateCreditTotals(filtered);
}

// Add a payment
function handleAddPayment(id) {
  const credits = getCredits();
  const credit = credits.find(c => c.id === id);
  if (!credit) return;

  const input = prompt("Enter payment amount:");
  const amount = parseFloat(input);
  if (isNaN(amount) || amount <= 0) return alert("Invalid amount.");

  credit.paidAmount += amount;
  credit.balance = credit.amount - credit.paidAmount;
  credit.payments.push({ amount, date: new Date().toISOString() });

  if (credit.paidAmount === 0) credit.status = "Unpaid";
  else if (credit.balance === 0) credit.status = "Paid";
  else credit.status = "Partially Paid";

  saveCredits(credits);
  renderCreditsTable(credits);
}

// Delete credit if within 24 hours
function handleDeleteCredit(id) {
  const credits = getCredits();
  const credit = credits.find(c => c.id === id);
  if (!credit || !canEditOrDelete(credit.dateTaken)) return alert("Delete not allowed.");

  const updated = credits.filter(c => c.id !== id);
  saveCredits(updated);
  renderCreditsTable(updated);
}

// Edit credit amount (if within 24 hours)
function handleEditCredit(id) {
  const credits = getCredits();
  const credit = credits.find(c => c.id === id);
  if (!credit || !canEditOrDelete(credit.dateTaken)) return alert("Edit not allowed.");

  const newAmount = parseFloat(prompt("Enter new total amount:", credit.amount));
  if (isNaN(newAmount) || newAmount < credit.paidAmount) {
    return alert("New amount must be >= paid amount.");
  }

  credit.amount = newAmount;
  credit.balance = newAmount - credit.paidAmount;

  if (credit.paidAmount === 0) credit.status = "Unpaid";
  else if (credit.balance === 0) credit.status = "Paid";
  else credit.status = "Partially Paid";

  saveCredits(credits);
  renderCreditsTable(credits);
}

// Time-based permission
function canEditOrDelete(dateTaken) {
  const now = new Date();
  const taken = new Date(dateTaken);
  return (now - taken) / (1000 * 60 * 60) < 24;
}

// Reset form
function resetCreditForm() {
  document.getElementById("creditCustomerName").value = "";
  document.getElementById("creditProductDropdown").value = "";
  document.getElementById("creditQuantity").value = "";
}

// Update running totals
function updateCreditTotals(filteredCredits) {
  const credits = filteredCredits || getCredits();
  const totalOwed = credits.reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = credits.reduce((sum, c) => sum + c.paidAmount, 0);
  const totalBalance = credits.reduce((sum, c) => sum + c.balance, 0);

  const footer = document.getElementById("creditTotals");
  if (footer) {
    footer.innerHTML = `
      <td colspan="3"><strong>Totals</strong></td>
      <td><strong>${totalOwed}</strong></td>
      <td><strong>${totalPaid}</strong></td>
      <td><strong>${totalBalance}</strong></td>
      <td colspan="3"></td>
    `;
  }
}
