// src/modules/credit.js

import { getProducts, getCredits, saveCredits } from './storage.js';
import { renderCreditsTable, populateCreditDropdown } from './ui.js';

// Initialize on app load
export function initCreditModule() {
  try {
    loadCreditDropdown();
    loadCreditEvents();
    renderCreditsTable(getCredits());
    updateCreditTotals();
  } catch (error) {
    console.error("Failed to initialize credit module:", error);
    alert("Failed to initialize credit system. Please try again.");
  }
}

// Populate product dropdown for credit
function loadCreditDropdown() {
  try {
    const products = getProducts();
    if (!products || !products.length) {
      console.warn("No products found for credit dropdown");
      return;
    }
    populateCreditDropdown(products);
  } catch (error) {
    console.error("Failed to load credit dropdown:", error);
  }
}

// Set up all credit-related event listeners
function loadCreditEvents() {
  try {
    document.getElementById("creditBtn").addEventListener("click", () => {
      recordNewCredit();
      updateCreditTotals();
    });

    document.getElementById("creditSearch").addEventListener("input", debounce(filterCreditRecords, 300));
    document.getElementById("creditFromDate").addEventListener("change", filterCreditRecords);
    document.getElementById("creditToDate").addEventListener("change", filterCreditRecords);

    document.querySelector("#creditTable").addEventListener("click", (e) => {
      const id = parseInt(e.target.dataset.id);
      if (isNaN(id)) return;

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
  } catch (error) {
    console.error("Failed to load credit events:", error);
  }
}

// Record new credit
function recordNewCredit() {
  try {
    const buyerName = sanitizeInput(document.getElementById("creditCustomerName").value.trim());
    const productId = document.getElementById("creditProductDropdown").value;
    const amountInput = document.getElementById("creditQuantity").value;
    const amount = parseFloat(amountInput);

    if (!buyerName || buyerName.length > 100) {
      return alert("Please enter a valid customer name (max 100 characters).");
    }
    if (!productId) {
      return alert("Please select a product.");
    }
    if (isNaN(amount) || amount <= 0 || amount > 1000000) {
      return alert("Please enter a valid amount between 0 and 1,000,000.");
    }

    const products = getProducts();
    const product = products.find(p => p.productId === productId);
    if (!product) {
      return alert("Selected product not found. Please refresh and try again.");
    }

    const credits = getCredits();
    const newCredit = {
      id: generateCreditId(),
      buyerName,
      itemId: product.productId,
      itemName: product.productName,
      amount: parseFloat(amount.toFixed(2)),
      paidAmount: 0,
      balance: parseFloat(amount.toFixed(2)),
      status: "Unpaid",
      dateTaken: new Date().toISOString(),
      payments: []
    };

    credits.push(newCredit);
    saveCredits(credits);
    renderCreditsTable(credits);
    resetCreditForm();
    showToast("Credit recorded successfully!");
  } catch (error) {
    console.error("Failed to record credit:", error);
    alert("Failed to record credit. Please try again.");
  }
}

// Filter logic
function filterCreditRecords() {
  try {
    const search = sanitizeInput(document.getElementById("creditSearch").value.toLowerCase());
    const fromInput = document.getElementById("creditFromDate").value;
    const toInput = document.getElementById("creditToDate").value;
    
    const from = fromInput ? new Date(fromInput) : null;
    const to = toInput ? new Date(toInput) : null;
    
    if (from && isNaN(from.getTime())) {
      console.error("Invalid from date");
      return;
    }
    if (to && isNaN(to.getTime())) {
      console.error("Invalid to date");
      return;
    }

    const credits = getCredits();

    const filtered = credits.filter(c => {
      const creditDate = new Date(c.dateTaken);
      const matchesSearch = c.buyerName.toLowerCase().includes(search) || 
                          c.itemName.toLowerCase().includes(search);
      const matchesFrom = !from || creditDate >= from;
      const matchesTo = !to || creditDate <= to;

      return matchesSearch && matchesFrom && matchesTo;
    });

    renderCreditsTable(filtered);
    updateCreditTotals(filtered);
  } catch (error) {
    console.error("Failed to filter credit records:", error);
  }
}

// Add a payment
function handleAddPayment(id) {
  try {
    const credits = getCredits();
    const credit = credits.find(c => c.id === id);
    if (!credit) {
      return alert("Credit record not found.");
    }

    const input = prompt(`Enter payment amount (max ${credit.balance.toFixed(2)}):`);
    if (input === null) return; // User cancelled

    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
      return alert("Please enter a valid positive number.");
    }
    if (amount > credit.balance) {
      return alert(`Payment cannot exceed remaining balance of ${credit.balance.toFixed(2)}`);
    }

    credit.paidAmount = parseFloat((credit.paidAmount + amount).toFixed(2));
    credit.balance = parseFloat((credit.amount - credit.paidAmount).toFixed(2));
    credit.payments.push({ 
      amount: parseFloat(amount.toFixed(2)), 
      date: new Date().toISOString() 
    });

    // Update status
    if (credit.paidAmount === 0) {
      credit.status = "Unpaid";
    } else if (credit.balance === 0) {
      credit.status = "Paid";
    } else {
      credit.status = "Partially Paid";
    }

    saveCredits(credits);
    renderCreditsTable(credits);
    showToast(`Payment of ${amount.toFixed(2)} recorded successfully!`);
  } catch (error) {
    console.error("Failed to add payment:", error);
    alert("Failed to record payment. Please try again.");
  }
}

// Delete credit if within 24 hours
function handleDeleteCredit(id) {
  try {
    const credits = getCredits();
    const credit = credits.find(c => c.id === id);
    if (!credit) {
      return alert("Credit record not found.");
    }

    if (!canEditOrDelete(credit.dateTaken)) {
      return alert("Credits can only be deleted within 24 hours of creation.");
    }

    if (!confirm(`Are you sure you want to delete this credit record for ${credit.buyerName}?`)) {
      return;
    }

    const updated = credits.filter(c => c.id !== id);
    saveCredits(updated);
    renderCreditsTable(updated);
    showToast("Credit record deleted successfully!");
  } catch (error) {
    console.error("Failed to delete credit:", error);
    alert("Failed to delete credit record. Please try again.");
  }
}

// Edit credit amount (if within 24 hours)
function handleEditCredit(id) {
  try {
    const credits = getCredits();
    const credit = credits.find(c => c.id === id);
    if (!credit) {
      return alert("Credit record not found.");
    }

    if (!canEditOrDelete(credit.dateTaken)) {
      return alert("Credits can only be edited within 24 hours of creation.");
    }

    const newAmountInput = prompt(
      `Enter new total amount (current: ${credit.amount.toFixed(2)}, paid: ${credit.paidAmount.toFixed(2)}):`,
      credit.amount.toFixed(2)
    );
    if (newAmountInput === null) return; // User cancelled

    const newAmount = parseFloat(newAmountInput);
    if (isNaN(newAmount) || newAmount <= 0) {
      return alert("Please enter a valid positive number.");
    }
    if (newAmount < credit.paidAmount) {
      return alert(`New amount must be at least ${credit.paidAmount.toFixed(2)} (already paid).`);
    }

    credit.amount = parseFloat(newAmount.toFixed(2));
    credit.balance = parseFloat((newAmount - credit.paidAmount).toFixed(2));

    // Update status
    if (credit.paidAmount === 0) {
      credit.status = "Unpaid";
    } else if (credit.balance === 0) {
      credit.status = "Paid";
    } else {
      credit.status = "Partially Paid";
    }

    saveCredits(credits);
    renderCreditsTable(credits);
    showToast("Credit record updated successfully!");
  } catch (error) {
    console.error("Failed to edit credit:", error);
    alert("Failed to update credit record. Please try again.");
  }
}

// Time-based permission
function canEditOrDelete(dateTaken) {
  try {
    const now = new Date();
    const taken = new Date(dateTaken);
    const hoursDiff = (now - taken) / (1000 * 60 * 60);
    return hoursDiff < 24;
  } catch (error) {
    console.error("Error checking edit/delete permission:", error);
    return false;
  }
}

// Reset form
function resetCreditForm() {
  document.getElementById("creditCustomerName").value = "";
  document.getElementById("creditProductDropdown").value = "";
  document.getElementById("creditQuantity").value = "";
  document.getElementById("creditCustomerName").focus();
}

// Update running totals
function updateCreditTotals(filteredCredits) {
  try {
    const credits = filteredCredits || getCredits();
    const totalOwed = credits.reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = credits.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalBalance = credits.reduce((sum, c) => sum + c.balance, 0);

    const footer = document.getElementById("creditTotals");
    if (footer) {
      footer.innerHTML = `
        <td colspan="3"><strong>Totals</strong></td>
        <td><strong>${totalOwed.toFixed(2)}</strong></td>
        <td><strong>${totalPaid.toFixed(2)}</strong></td>
        <td><strong>${totalBalance.toFixed(2)}</strong></td>
        <td colspan="2"></td>
      `;
    }
  } catch (error) {
    console.error("Failed to update credit totals:", error);
  }
}

// Helper functions
function generateCreditId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function sanitizeInput(input) {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}