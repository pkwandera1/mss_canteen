// src/modules/products.js
import { getProducts, saveProducts } from './storage.js';
import { populateProductDropdowns, populateFilters } from './ui.js';

// Register a new product
export function registerProduct() {
  const productId = document.getElementById("productId").value.trim().toUpperCase();
  const productName = document.getElementById("productName").value.trim();
  const productCategory = document.getElementById("productCategory").value.trim();
  const buyingPrice = parseFloat(document.getElementById("buyingPrice").value);
  const sellingPrice = parseFloat(document.getElementById("sellingPrice").value);

  if (!productId || !productName || !productCategory || isNaN(buyingPrice) || isNaN(sellingPrice)) {
    alert("Please fill in all fields correctly.");
    return;
  }

  let products = getProducts();

  if (products.some(p => p.productId === productId)) {
    alert("Product ID already exists!");
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

  alert("Product registered successfully!");
  updateProductRegisterTable();
  populateProductDropdowns(products);
  populateFilters(products);
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

    // Create cell for actions
    const actionsCell = row.insertCell(5);

    // Create a button container
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    // Create buttons
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.onclick = () => editProduct(index);

    const updateBtn = document.createElement("button");
    updateBtn.textContent = "Update Price";
    updateBtn.onclick = () => updateProduct(index);

    const historyBtn = document.createElement("button");
    historyBtn.textContent = "View History";
    historyBtn.onclick = () => viewPriceHistory(index);

    // Append buttons to container
    buttonGroup.appendChild(editButton);
    buttonGroup.appendChild(updateBtn);
    buttonGroup.appendChild(historyBtn);

    // Append the button group to the cell
    actionsCell.appendChild(buttonGroup);
  });
}



// Edit a product (only if not stocked or sold)
export function editProduct(index) {
  let products = getProducts();
  let product = products[index];

  if (product.hasSale || (product.stock && product.stock > 0)) {
    alert("Editing is disabled after stocking or sales.");
    return;
  }

  const newName = prompt("New name:", product.productName);
  const newCategory = prompt("New category:", product.productCategory);
  const newBuyingPrice = parseFloat(prompt("New buying price:", product.buyingPrice));
  const newSellingPrice = parseFloat(prompt("New selling price:", product.sellingPrice));

  if (!newName || !newCategory || isNaN(newBuyingPrice) || isNaN(newSellingPrice)) {
    alert("Invalid input");
    return;
  }

  product.productName = newName;
  product.productCategory = newCategory;
  product.buyingPrice = newBuyingPrice;
  product.sellingPrice = newSellingPrice;

  products[index] = product;
  saveProducts(products);

  updateProductRegisterTable();
  populateProductDropdowns(products);
  populateFilters(products);
}

export function updateProduct(index) {
  let products = getProducts();
  let product = products[index];

  if (!product.hasSale && (!product.stock || product.stock === 0)) {
    alert("Use 'Edit' to change this product — it hasn't been sold or stocked yet.");
    return;
  }

  const newBuyingPrice = parseFloat(prompt("Update buying price:", product.buyingPrice));
  const newSellingPrice = parseFloat(prompt("Update selling price:", product.sellingPrice));

  if (isNaN(newBuyingPrice) || isNaN(newSellingPrice)) {
    alert("Invalid price input.");
    return;
  }

  // Initialize priceHistory if it doesn't exist
  if (!product.priceHistory) product.priceHistory = [];

  const now = new Date().toISOString();

  // Track buying price change
  if (newBuyingPrice !== product.buyingPrice) {
    product.priceHistory.push({
      field: "buyingPrice",
      oldValue: product.buyingPrice,
      newValue: newBuyingPrice,
      changedAt: now
    });
    product.buyingPrice = newBuyingPrice;
  }

  // Track selling price change
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

  alert("Product prices updated successfully.");
  updateProductRegisterTable();
  populateProductDropdowns(products);
  populateFilters(products);
}

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

  // Close handler
  closeBtn.onclick = () => {
    modal.classList.add("hidden");
  };

  // Close on outside click
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  };
}

