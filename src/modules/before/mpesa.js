// mpesaPayments.js - Refactored to use centralized storage without project context

import { getMpesaPayments, saveMpesaPayment } from './storage.js';

let editingMpesaId = null;

export function handleSaveMpesaPayment() {
  const name = document.getElementById('mpesaName').value.trim();
  const amount = parseFloat(document.getElementById('mpesaAmount').value);
  const type = document.getElementById('mpesaType').value;
  const btn = document.getElementById('mpesaBtn');

  if (!name || isNaN(amount) || !type || type === '') {
    alert('Please select a valid payment type.');
    return;
  }
  


  const now = new Date();
  const payments = getMpesaPayments();

  if (editingMpesaId) {
    const payment = payments.find(p => p.id === editingMpesaId);
    const paymentDate = new Date(payment.date);
    const diffHours = Math.abs(now - paymentDate) / 36e5;
    if (diffHours > 24) {
      alert('Editing not allowed after 24 hours.');
      return;
    }
    payment.name = name;
    payment.amount = amount;
    payment.type = type;
    alert('Mpesa payment updated.');
    editingMpesaId = null;
    btn.textContent = 'Record Mpesa';
  } else {
    const newPayment = {
      id: Date.now(),
      name,
      amount,
      type,
      date: now.toISOString()
    };
    payments.push(newPayment);
    alert('Mpesa payment recorded.');
  }

  saveMpesaPayment(payments);
  clearMpesaForm();
  loadMpesaPayments();
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
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${p.name}</td>
      <td>${p.amount.toFixed(2)}</td>
      <td>${p.type || 'N/A'}</td>
      <td>${new Date(p.date).toLocaleDateString()}</td>
      <td>
        <button class="editMpesaBtn" data-id="${p.id}" ${hours > 24 ? 'disabled' : ''}>Edit</button>
        <button class="deleteMpesaBtn" data-id="${p.id}" ${hours > 24 ? 'disabled' : ''}>Delete</button>
      </td>`;
    tbody.appendChild(tr);
    total += p.amount;
  });

  const totalRow = document.createElement('tr');
  totalRow.innerHTML = `<td colspan="5"><strong>Total: KES ${total.toFixed(2)}</strong></td>`;
  tbody.appendChild(totalRow);

  setMpesaEventListeners();
}

function setMpesaEventListeners() {
  const payments = getMpesaPayments();

  document.querySelectorAll('.editMpesaBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const payment = payments.find(p => p.id == btn.dataset.id);
      document.getElementById('mpesaName').value = payment.name;
      document.getElementById('mpesaAmount').value = payment.amount;
      document.getElementById('mpesaType').value = payment.type || 'Sale';
      editingMpesaId = payment.id;
      document.getElementById('mpesaBtn').textContent = 'Update Mpesa';
    });
  });

  document.querySelectorAll('.deleteMpesaBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const confirmDel = confirm('Are you sure you want to delete this payment?');
      if (!confirmDel) return;
      const updated = payments.filter(p => p.id != btn.dataset.id);
      saveMpesaPayment(updated);
      loadMpesaPayments();
    });
  });
}

export function clearMpesaForm() {
  document.getElementById('mpesaName').value = '';
  document.getElementById('mpesaAmount').value = '';
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
