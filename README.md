# SMARTMART — AI-Powered Real-Time Supermarket POS & Business Intelligence Platform

SMARTMART is a production-oriented, scalable, real-time supermarket platform combining:
* **High-Speed Cashier POS**: 3-column supermarket layout, keyboard shortcuts (`F2`, `F4`, `F8`, `ESC`), multi-payment checkout, instant receipt printing, cash drawer triggering, and customer-facing dual display synchronization.
* **Automated Product Identification**: Multi-method fallback (Barcode scanner, Camera barcode/QR, internal barcode generation, PLU codes, debounced manual search, touch category buttons, and AI Camera produce recognition with confidence threshold validation).
* **Hardware Abstraction Layer**: Electronic weighing scale integration (`WeighingScaleService` with Tare, Zero, kg/g/litre/dozen units, and decimal quantities), Thermal receipt printer (`ReceiptPrinterService` with ESC/POS formatting and test print), Cash drawer (`CashDrawerService` with kick pulse trigger), and Payment Terminal (`PaymentTerminalService` supporting EMV card terminals and dynamic UPI QR).
* **Real-Time Inventory**: Atomic sales transactions with First-Expired, First-Out (FEFO) batch deduction, instant stock broadcast across all terminals via Socket.IO, and low-stock reorder alerts.
* **Customer E-Commerce Shopping**: Modern grocery app with search, faceted filters, cart, coupons, delivery/pickup checkout, order tracking, and downloadable receipts.
* **Customer Loyalty Program**: Points accumulation (1 pt / ₹100), tiers (Bronze, Silver, Gold, Platinum), and voucher redemption.
* **Enterprise Business Intelligence & AI Suite**:
  1. *Demand Forecasting*: Historical sales velocity with 7-day & 30-day projections, recommended PO quantities, and honest handling of insufficient data.
  2. *Sales Forecasting*: Actual vs predicted daily and weekly revenue.
  3. *Market Basket Analysis (MBA)*: Apriori association rules (Support, Confidence, Lift) for grocery combos (Bread + Butter, Rice + Dal).
  4. *Customer Segmentation & Churn*: RFM clustering, churn risk classification, and Customer Lifetime Value (CLV).
  5. *Anomaly & Fraud Detection*: Cashier refund outliers, excessive discount overrides, and register discrepancies.
  6. *Expiry & Wastage Prediction*: FEFO batch monitoring with shrinkage valuation.
* **Offline POS**: IndexedDB / localStorage queue for network dropouts, background synchronization with idempotency keys (`TXN-...`).
* **Hardware Diagnostics**: Real-time status, heartbeats, and test actions across all 7 peripheral devices.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router v6, Canvas Confetti.
- **Backend**: Node.js, Express.js, TypeScript, REST API, Socket.IO.
- **Database**: Dual-engine universal architecture: Production MySQL schema (`schema.sql`) with seamless zero-dependency SQLite fallback (`better-sqlite3`).
- **Caching**: Redis client with fast in-memory TTL fallback.
- **Security**: JWT tokens, bcrypt password hashing, Role-Based Access Control (RBAC), sanitized error handling, SQL injection protection, and audit logging.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# In project root
npm run install:all
```

### 2. Seed Database
```bash
# Seeds 10 supermarket departments, 45+ authentic products with barcodes/PLUs, FEFO batches, suppliers, loyalty profiles, and 65+ historical transactions
npm run seed
```

### 3. Start Development Servers
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Customer Display: `http://localhost:5173/customer-display`
- Cashier POS: `http://localhost:5173/pos`
- Admin Dashboard: `http://localhost:5173/admin/dashboard`

---

## 👥 Demo User Personas

| Role | Email | Password | Access Area |
|---|---|---|---|
| **ADMIN** | `admin@smartmart.com` | `admin123` | Full System Access, Hardware, Analytics, Audits |
| **MANAGER** | `manager@smartmart.com` | `password123` | Inventory, Purchases, Sales, Reports, Returns |
| **CASHIER** | `cashier1@smartmart.com` | `password123` | High-Speed POS, Billing, Register Shifts, Refunds |
| **INVENTORY STAFF** | `inventory@smartmart.com` | `password123` | Stock Adjustments, Batch Receiving, Expiry FEFO |
| **CUSTOMER** | `customer@gmail.com` | `password123` | Shopping, Cart, Checkout, Loyalty Dashboard |

*Note: You can instantly switch between all 5 personas at any time using the 1-click **Role Switcher** pill in the top navigation.*
