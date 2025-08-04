import { getProducts, saveProducts } from './storage.js';
import { populateProductDropdowns, populateFilters } from './ui.js';
import { showToast, showError } from './utils.js';

// Input sanitizer
function sanitizeInput(input) {
  return input?.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() || "";
}

// Register a new product
export function registerProduct() {
  const productId = sanitizeInput(document.getElementById("productId").value.toUpperCase());
  const productName = sanitizeInput(document.getElementById("productName").value);
  const productCategory = sanitizeInput(document.getElementById("productCategory").value);
  const buyingPrice = parseFloat(document.getElementById("buyingPrice").value);
  const sellingPrice = parseFloat(document.getElementById("sellingPrice").value);

  if (!productId || !productName || !productCategory || isNaN(buyingPrice) || isNaN(sellingPrice)) {
    showError("Please fill in all fields correctly.");
    return;
  }

  let products = getProducts();

  if (products.some(p => p.productId === productId)) {
    showError("Product ID already exists!");
    return;
  }

  const newProduct = {
    productId,
    productName,
    productCategory,
    buyingPrice,
    sellingPrice,
    hasSale: false,
    stock: 0
  };

  products.push(newProduct);
  saveProducts(products);

  showToast("✅ Product registered successfully!");
  updateProductRegisterTable();
  populateProductDropdowns(products);
  populateFilters(products);
  populateCategoryDropdown(); 

  // Optionally clear inputs
  document.getElementById("productId").value = "";
  document.getElementById("productName").value = "";
  document.getElementById("productCategory").value = "";
  document.getElementById("buyingPrice").value = "";
  document.getElementById("sellingPrice").value = "";
  document.getElementById("productId").focus();
}

// Render product register table
export function updateProductRegisterTable() {
  const tableBody = document.querySelector("#productRegister tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  const products = getProducts();

  products.forEach((product, index) => {
    const row = tableBody.insertRow();

    row.insertCell(0).textContent = product.productId;
    row.insertCell(1).textContent = product.productName;
    row.insertCell(2).textContent = product.productCategory;
    row.insertCell(3).textContent = product.buyingPrice;
    row.insertCell(4).textContent = product.sellingPrice;

    const actionsCell = row.insertCell(5);
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.onclick = () => editProduct(index);

    const updateBtn = document.createElement("button");
    updateBtn.textContent = "Update Price";
    updateBtn.onclick = () => updateProduct(index);

    const historyBtn = document.createElement("button");
    historyBtn.textContent = "View History";
    historyBtn.onclick = () => viewPriceHistory(index);

    buttonGroup.appendChild(editButton);
    buttonGroup.appendChild(updateBtn);
    buttonGroup.appendChild(historyBtn);
    actionsCell.appendChild(buttonGroup);
  });
}

// Edit a product (only if not stocked or sold)
export function editProduct(index) {
  let products = getProducts();
  let product = products[index];

  if (product.hasSale || (product.stock && product.stock > 0)) {
    showError("Editing is disabled after stocking or sales.");
    return;
  }

  const newName = prompt("New name:", product.productName);
  const newCategory = prompt("New category:", product.productCategory);
  const newBuyingPrice = parseFloat(prompt("New buying price:", product.buyingPrice));
  const newSellingPrice = parseFloat(prompt("New selling price:", product.sellingPrice));

  if (!newName || !newCategory || isNaN(newBuyingPrice) || isNaN(newSellingPrice)) {
    showError("Invalid input.");
    return;
  }

  product.productName = sanitizeInput(newName);
  product.productCategory = sanitizeInput(newCategory);
  product.buyingPrice = newBuyingPrice;
  product.sellingPrice = newSellingPrice;

  products[index] = product;
  saveProducts(products);

  showToast("✅ Product updated.");
  updateProductRegisterTable();
  populateProductDropdowns(products);
  populateFilters(products);
  populateCategoryDropdown(); 
}

// Update prices if product is in use
export function updateProduct(index) {
  let products = getProducts();
  let product = products[index];

  if (!product.hasSale && (!product.stock || product.stock === 0)) {
    showError("Use 'Edit' to change this product — it hasn't been sold or stocked yet.");
    return;
  }

  const newBuyingPrice = parseFloat(prompt("Update buying price:", product.buyingPrice));
  const newSellingPrice = parseFloat(prompt("Update selling price:", product.sellingPrice));

  if (isNaN(newBuyingPrice) || isNaN(newSellingPrice)) {
    showError("Invalid price input.");
    return;
  }

  if (!product.priceHistory) product.priceHistory = [];
  const now = new Date().toISOString();

  if (newBuyingPrice !== product.buyingPrice) {
    product.priceHistory.push({
      field: "buyingPrice",
      oldValue: product.buyingPrice,
      newValue: newBuyingPrice,
      changedAt: now
    });
    product.buyingPrice = newBuyingPrice;
  }

  if (newSellingPrice !== product.sellingPrice) {
    product.priceHistory.push({
      field: "sellingPrice",
      oldValue: product.sellingPrice,
      newValue: newSellingPrice,
      changedAt: now
    });
    product.sellingPrice = newSellingPrice;
  }

  products[index] = product;
  saveProducts(products);

  showToast("✅ Product prices updated.");
  updateProductRegisterTable();
  populateProductDropdowns(products);
  populateFilters(products);
  populateCategoryDropdown(); 
}

// View price history in modal
export function viewPriceHistory(index) {
  const products = getProducts();
  const product = products[index];

  const modal = document.getElementById("priceHistoryModal");
  const list = document.getElementById("priceHistoryList");
  const closeBtn = document.getElementById("closePriceHistoryModal");

  if (!product.priceHistory || product.priceHistory.length === 0) {
    list.innerHTML = `<li><em>No price changes recorded for this product.</em></li>`;
  } else {
    list.innerHTML = product.priceHistory.map(change => {
      return `<li>
        <strong>${change.field}</strong> changed from 
        <strong>Ksh ${change.oldValue}</strong> to 
        <strong>Ksh ${change.newValue}</strong><br />
        on <em>${new Date(change.changedAt).toLocaleString()}</em>
      </li>`;
    }).join("");
  }

  modal.classList.remove("hidden");

  closeBtn.onclick = () => modal.classList.add("hidden");

  window.onclick = event => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  };
}

// ✅ Populate product category dropdown dynamically
export function populateCategoryDropdown() {
  const products = getProducts();
  const uniqueCategories = [...new Set(products.map(p => p.productCategory.trim()).filter(Boolean))];

  const dropdown = document.getElementById("productCategoryList");
  if (!dropdown) return;

  dropdown.innerHTML = "";
  uniqueCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    dropdown.appendChild(option);
  });
}
