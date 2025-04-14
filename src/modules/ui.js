// src/modules/ui.js

// Toggle visibility of app sections
export function showSection(sectionId) {
    document.querySelectorAll("section").forEach(section => {
      section.classList.add("hidden");
    });
    const target = document.getElementById(sectionId);
    if (target) target.classList.remove("hidden");
  }
  
  // Populate dropdowns with product data
  export function populateProductDropdowns(products) {
    const productDropdown = document.getElementById("productDropdown");
    const stockDropdown = document.getElementById("productStockDropdown");
  
    if (!productDropdown || !stockDropdown) return;
  
    productDropdown.innerHTML = '';
    stockDropdown.innerHTML = '';
  
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a product...";
    productDropdown.appendChild(defaultOption.cloneNode(true));
    stockDropdown.appendChild(defaultOption.cloneNode(true));
  
    products.forEach(product => {
      const option = document.createElement("option");
      option.value = product.productId;
      option.textContent = `${product.productId} - ${product.productName}`;
      productDropdown.appendChild(option.cloneNode(true));
      stockDropdown.appendChild(option.cloneNode(true));
    });
  }
  
  // Populate product/category filters
  export function populateFilters(products) {
    const productFilter = document.getElementById("filterProduct");
    const categoryFilter = document.getElementById("filterCategory");
  
    if (!productFilter || !categoryFilter) return;
  
    productFilter.innerHTML = `<option value="">All Products</option>`;
    categoryFilter.innerHTML = `<option value="">All Categories</option>`;
  
    const categories = new Set();
  
    products.forEach(product => {
      const productOption = document.createElement("option");
      productOption.value = product.productId;
      productOption.textContent = product.productName;
      productFilter.appendChild(productOption);
      categories.add(product.productCategory);
    });
  
    categories.forEach(category => {
      const categoryOption = document.createElement("option");
      categoryOption.value = category;
      categoryOption.textContent = category;
      categoryFilter.appendChild(categoryOption);
    });
  }
  
  // Render filtered sales into the filter report table
  export function updateSalesTable(filteredSales = []) {
    const salesTable = document.querySelector("#salesTable tbody");
    if (!salesTable) return;
  
    salesTable.innerHTML = "";
  
    let totalBuying = 0;
    let totalSelling = 0;
    let totalProfit = 0;
  
    filteredSales.forEach(sale => {
      totalBuying += sale.totalBuyingPrice;
      totalSelling += sale.totalSellingPrice;
      totalProfit += sale.profit;
  
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="checkbox" class="delete-sale-checkbox" value="${sale.saleId}"></td>
        <td>${sale.productId}</td>
        <td>${sale.productName}</td>
        <td>${sale.quantity}</td>
        <td>${sale.totalBuyingPrice}</td>
        <td>${sale.totalSellingPrice}</td>
        <td>${sale.profit}</td>
        <td>${sale.date}</td>
      `;
      salesTable.appendChild(row);
    });
  
    const totalRow = document.createElement("tr");
    totalRow.innerHTML = `
      <td colspan="4"><strong>Grand Totals:</strong></td>
      <td><strong>${totalBuying}</strong></td>
      <td><strong>${totalSelling}</strong></td>
      <td><strong>${totalProfit}</strong></td>
      <td></td>
    `;
    salesTable.appendChild(totalRow);
  }
  