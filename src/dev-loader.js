async function loadDevBackup() {
  if (window.location.hostname === "localhost") {
    try {
      const response = await fetch('./dev-backup.json'); // File stored in /public
      const backupData = await response.json();

      // Store products
      if (backupData.products) {
        localStorage.setItem('products', JSON.stringify(backupData.products));
      }

      // Store expenses
      if (backupData.expenses) {
        localStorage.setItem('expenses', JSON.stringify(backupData.expenses));
      }

      // Store mpesa
      if (backupData.mpesa) {
        localStorage.setItem('mpesa', JSON.stringify(backupData.mpesa));
      }

      console.log("✅ Dev backup imported automatically.");
    } catch (error) {
      console.warn("⚠️ No backup file found or failed to load.", error);
    }
  }
}

loadDevBackup();
