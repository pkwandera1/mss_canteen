// src/modules/utils.js
import { safeDateParse, formatDateYMD } from './reportUtils.js';

let globalDate = getLocalDateYMD(new Date());
let isDateModified = false; // Track if user has changed the date

/** ✅ Get local date in YYYY-MM-DD format */
function getLocalDateYMD(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
}

export function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // Sunday = 0
  // Move backwards to Sunday start
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function initGlobalDateControl() {
  const dateControl = document.getElementById('globalDateControl');
  if (!dateControl) return; // Exit if element not found

  const dateInput = document.getElementById('globalDateInput');
  const resetBtn = document.getElementById('resetDateBtn');

  // ✅ Set initial value
  dateInput.value = globalDate;

  // ✅ Date change event
  dateInput.addEventListener('change', (e) => {
    globalDate = e.target.value;
    isDateModified = true;
    resetBtn.style.display = 'inline-block';
  });

  // ✅ Reset button event
  resetBtn.addEventListener('click', () => {
    const today = getLocalDateYMD(new Date());
    dateInput.value = today;
    globalDate = today;
    isDateModified = false;
    resetBtn.style.display = 'none';
  });
}


export function getCurrentDate() {
  // Reset to today at local midnight if not modified
  if (!isDateModified) {
    const today = getLocalDateYMD(new Date());
    if (globalDate !== today) {
      globalDate = today;
      const input = document.getElementById('globalDateInput');
      if (input) input.value = today;
    }
  }
  return globalDate;
}

export function setCurrentDate(date) {
  if (typeof date === 'string') {
    globalDate = date;
    isDateModified = date !== getLocalDateYMD(new Date());
  } else if (date instanceof Date) {
    globalDate = getLocalDateYMD(date);
    isDateModified = globalDate !== getLocalDateYMD(new Date());
  }
  const input = document.getElementById('globalDateInput');
  const resetBtn = document.getElementById('resetDateBtn');
  if (input) input.value = globalDate;
  if (resetBtn) resetBtn.style.display = isDateModified ? 'block' : 'none';
}

export function validateDate(dateStr) {
  if (!dateStr) return getCurrentDate();
  if (isNaN(new Date(dateStr).getTime())) {
    console.warn(`Invalid date: ${dateStr}. Using current date instead`);
    return getCurrentDate();
  }
  return dateStr;
}

// ✅ Success Toast
export function showToast(message, duration = 3000) {
  createToast(message, "success", duration);
}

// ✅ Error Toast
export function showError(message, duration = 4000) {
  createToast(`❌ ${message}`, "error", duration);
}

// ✅ General Toast Creator
function createToast(message, type, duration) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

export function makeElementDraggable(el, excludeChild = null) {
  let offsetX = 0, offsetY = 0, isDragging = false;

  el.addEventListener('mousedown', (e) => {
    if (excludeChild && excludeChild.contains(e.target)) return; // skip drag on input
    isDragging = true;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    el.style.zIndex = 10000;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    el.style.left = `${e.clientX - offsetX}px`;
    el.style.top = `${e.clientY - offsetY}px`;
    el.style.right = 'auto'; // Remove fixed right so dragging works
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

export function getExpenseBreakdownForDate(dateKey, allExpenses) {
  const filtered = allExpenses.filter(e => formatDateYMD(safeDateParse(e.date)) === dateKey);
  
  const restocking = filtered
    .filter(e => e.expenseTypeId === 'RESTOCKING')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const total = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
  const regular = total - restocking;

  return {
    regularExpenses: regular,
    restockingExpense: restocking,
    expensesTotal: total
  };
}
