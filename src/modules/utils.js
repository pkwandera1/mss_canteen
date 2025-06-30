// src/modules/utils.js

let globalDate = new Date().toISOString().split('T')[0];
let isDateModified = false; // Track if user has changed the date

export function initGlobalDateControl() {
  const dateControl = document.createElement('div');
  dateControl.id = 'globalDateControl';
  dateControl.style.position = 'fixed';
  dateControl.style.top = '10px';
  dateControl.style.right = '10px';
  dateControl.style.zIndex = '1000';
  dateControl.style.background = 'white';
  dateControl.style.padding = '5px';
  dateControl.style.borderRadius = '4px';
  dateControl.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  dateControl.style.cursor = 'move'; // Show move cursor

  const label = document.createElement('label');
  label.htmlFor = 'globalDateInput';
  label.textContent = 'Working Date:';
  label.style.display = 'block';
  label.style.marginBottom = '5px';
  label.style.fontSize = '0.8em';
  dateControl.appendChild(label);

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.id = 'globalDateInput';
  dateInput.value = globalDate;
  dateInput.style.padding = '5px';
  dateInput.style.borderRadius = '4px';
  dateInput.style.border = '1px solid #ccc';
  dateControl.appendChild(dateInput);

  const resetBtn = document.createElement('button');
  resetBtn.id = 'resetDateBtn';
  resetBtn.textContent = 'Reset to Today';
  resetBtn.style.marginTop = '5px';
  resetBtn.style.padding = '3px 8px';
  resetBtn.style.fontSize = '0.8em';
  resetBtn.style.display = 'none';
  dateControl.appendChild(resetBtn);

  dateInput.addEventListener('change', (e) => {
    globalDate = e.target.value;
    isDateModified = true;
    resetBtn.style.display = 'block';
  });

  resetBtn.addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    globalDate = today;
    isDateModified = false;
    resetBtn.style.display = 'none';
  });

  document.body.appendChild(dateControl);

  // 👇 Make it draggable
  makeElementDraggable(dateControl, dateInput);
}


export function getCurrentDate() {
  // Reset to today at midnight if not modified
  if (!isDateModified) {
    const today = new Date().toISOString().split('T')[0];
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
    isDateModified = date !== new Date().toISOString().split('T')[0];
  } else if (date instanceof Date) {
    globalDate = date.toISOString().split('T')[0];
    isDateModified = date.toISOString().split('T')[0] !== new Date().toISOString().split('T')[0];
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

export function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.textContent = message;

  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #4caf50;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    z-index: 9999;
    font-size: 16px;
    text-align: center;
    opacity: 0;
    animation: fadeInOut 3s forwards;
  `;

  // Add fade-in and fade-out keyframe animation
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translate(-50%, -60%); }
      10% { opacity: 1; transform: translate(-50%, -50%); }
      90% { opacity: 1; transform: translate(-50%, -50%); }
      100% { opacity: 0; transform: translate(-50%, -40%); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
    style.remove(); // Clean up animation style
  }, 6000);
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
