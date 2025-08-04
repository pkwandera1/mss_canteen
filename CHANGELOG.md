# 📌 Changelog

All notable changes to this project will be documented in this file.

---
## v1.4.0 – [Upcoming Release]
### 🚀 New Features
- Added **printable reminder debt slips**, both for individual debtors and for all debtors combined.
- Created **summary cards** on the weekly report page, including:
  - Cash flow summary
  - Net profit summary
- Added a **comprehensive user guide**, accessible via the help icon.

### 🎨 UI Improvements
- Improved overall user interface for better button presentation.
- Updated date handling to match the **local time zone**.

### 📊 Reporting & Expenses Enhancements
- Stock module updated to capture **stocking expenses** to better track cash at hand.
- Restocking expenses are now included in the **daily expense table**.
- **Expense summary** presentation improved for clarity.
- **Weekly and Monthly reports** updated to correctly compute:
  - **Net profit**
  - **Cash-at-hand** calculations with all relevant factors.

---
## **v1.3.1 – Credit Stock Fix**

* Fixed bug where recording credit sales didn’t subtract stock correctly.

---

## **v1.3.0 – Global Date Control**

* Implemented **global date control**.
* Improved error/success message reporting.
* Reset input fields for all modules.
* Fixed import/export for Mpesa and Credit in Local Storage.

---

## **v1.2.0 – Credit & Mpesa Module**

* Introduced **Credit Sales** feature.
* Introduced **Mpesa Payments** tracking module.

---

## **v1.1.0 – Backdated Sales**

* Added date picker to allow recording past sales.

---

## **v1.0.3 – Deployment Adjustments**

* Modified `package.json` for smoother GitHub Pages handling.
* Prepared public folder for deployment.

---

## **v1.0.2 – Daily Expenses Button**

* Added missing **Daily Expenses** button.

---

## **v1.0.1 – Sidebar Improvements**

* Improved menu sidebar:

  * Regrouped items logically.
  * Sidebar auto-closes on small screens after selection.
* Updated import function to navigate to home page on success.

---

## **v1.0.0 – Foundation Build**

* Initial project setup (Webpack configuration, `package.json`, public folder, GitHub Pages deployment).
* Added page loader in HTML.
* Created README and restructured project to work without `webpack-html` plugin.
