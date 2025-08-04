// mpesaPayments.js

import { getMpesaPayments, saveMpesaPayment } from './storage.js';
import { getCurrentDate, showError, showToast } from './utils.js';
import { refreshUI, refreshReports } from './ui.js';


let editingMpesaId = null;

export function handleSaveMpesaPayment() {
  const name = document.getElementById('mpesaName').value.trim();
  const amount = parseFloat(document.getElementById('mpesaAmount').value);
  const type = document.getElementById('mpesaType').value;
  const btn = document.getElementById('mpesaBtn');

  if (!name || isNaN(amount) || amount <= 0 || !type) {
    showError('Please fill all fields with valid values.');
    return;
  }

  const now = new Date();
  const payments = getMpesaPayments();

  if (editingMpesaId) {
    // Handle edit logic if needed (optional implementation)
  } else {
    const newPayment = {
      id: Date.now(),
      name,
      amount,
      type,
      date: getCurrentDate(),
      isCreditPayment: type === 'Credit Payment'
    };
    payments.push(newPayment);
    saveMpesaPayment(payments);
    loadMpesaPayments();
    clearMpesaForm(); // ✅ Clears the inputs
    showToast(`✅ Mpesa payment of KES ${amount.toFixed(2)} recorded`);
    refreshUI();
    refreshReports();
  }
}

export function loadMpesaPayments(search = '') {
  const from = document.getElementById('mpesaFromDate').value;
  const to = document.getElementById('mpesaToDate').value;
  const tbody = document.querySelector('#mpesaTable tbody');
  if (!tbody) return;

  let payments = getMpesaPayments();

  if (search) {
    payments = payments.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  if (from) {
    payments = payments.filter(p => new Date(p.date) >= new Date(from));
  }

  if (to) {
    payments = payments.filter(p => new Date(p.date) <= new Date(to));
  }

  tbody.innerHTML = '';

  let total = 0;
  payments.forEach((p, index) => {
    const tr = document.createElement('tr');
    const hours = (new Date() - new Date(p.date)) / 36e5;

    const canEdit = hours <= 24;
    const actions = canEdit
      ? `
        <button class="editMpesaBtn" data-id="${p.id}">Edit</button>
        <button class="deleteMpesaBtn" data-id="${p.id}">Delete</button>`
      : ``; // leave blank if more than 24 hours

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${p.name}</td>
      <td>${p.amount.toFixed(2)}</td>
      <td>${p.type || 'N/A'}</td>
      <td>${new Date(p.date).toLocaleDateString()}</td>
      <td>${actions}</td>`;
    tbody.appendChild(tr);
    total += p.amount;
  });

  const totalRow = document.createElement('tr');
  totalRow.innerHTML = `<td colspan="5"><strong>Total: KES ${total.toFixed(2)}</strong></td>`;
  tbody.appendChild(totalRow);

  setMpesaEventListeners();
  populateMpesaClientsDropdown();

}


function setMpesaEventListeners() {
  const payments = getMpesaPayments();

  document.querySelectorAll('.editMpesaBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const payments = getMpesaPayments();
      const payment = payments.find(p => p.id == btn.dataset.id);
      if (!payment) return;
  
      const newName = prompt("Edit Name:", payment.name);
      if (!newName) return;
  
      const newAmountStr = prompt("Edit Amount:", payment.amount);
      const newAmount = parseFloat(newAmountStr);
      if (isNaN(newAmount) || newAmount <= 0) {
        showError("Invalid amount entered.");
        return;
      }
  
      const newType = prompt("Edit Type (Sale or Credit Payment):", payment.type || "Sale");
      if (!["Sale", "Credit Payment"].includes(newType)) {
        showError("Invalid type. Use 'Sale' or 'Credit Payment'.");
        return;
      }
  
      // Update
      payment.name = newName.trim();
      payment.amount = newAmount;
      payment.type = newType;
  
      saveMpesaPayment(payments);
      loadMpesaPayments();
      showToast("✅ Mpesa payment updated.");
    });
  });
  

  document.querySelectorAll('.deleteMpesaBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const confirmDel = confirm('Are you sure you want to delete this payment?');
      if (!confirmDel) return;

      const updated = payments.filter(p => p.id != btn.dataset.id);
      saveMpesaPayment(updated);
      showToast('🗑️ Mpesa payment deleted.');
      loadMpesaPayments();
      refreshUI();
      refreshReports();
    });
  });
}

export function clearMpesaForm() {
  document.getElementById('mpesaName').value = '';
  document.getElementById('mpesaAmount').value = '';
  document.getElementById('mpesaType').value = ''; // ✅ Resets to placeholder
  document.getElementById('mpesaBtn').textContent = 'Record Mpesa';
  editingMpesaId = null;
}

export function setupMpesaFilters() {
  document.getElementById('mpesaSearch').addEventListener('input', e => {
    loadMpesaPayments(e.target.value);
  });

  document.getElementById('mpesaFromDate').addEventListener('change', () => loadMpesaPayments());
  document.getElementById('mpesaToDate').addEventListener('change', () => loadMpesaPayments());
}

// ✅ Populate Mpesa Clients Dropdown
export function populateMpesaClientsDropdown() {
  const payments = getMpesaPayments();
  const uniqueNames = [...new Set(payments.map(p => p.name.trim()).filter(Boolean))];

  // Dropdown for the name input
  const nameList = document.getElementById("mpesaNameList");
  if (nameList) {
    nameList.innerHTML = "";
    uniqueNames.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      nameList.appendChild(option);
    });
  }

  // Dropdown for the search filter input
  const filterList = document.getElementById("mpesaSearchList");
  if (filterList) {
    filterList.innerHTML = "";
    uniqueNames.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      filterList.appendChild(option);
    });
  }
}
