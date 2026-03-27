<p align="center">
  <h1 align="center">🏪 BizCore</h1>
  <p align="center">
    <strong>All-in-One Local Business Management System</strong>
  </p>
  <p align="center">
    A powerful, offline-first desktop application for managing retail, pharmacy, restaurant, and supply chain operations — all from a single unified platform.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/SQLite-embedded-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/License-Private-red?style=flat-square" alt="License" />
  </p>
</p>

---

## 📖 About

**BizCore** is a cross-platform desktop business management application built with **Electron** and **React**. It provides a unified platform for managing multiple business verticals — retail POS, pharmacy, restaurant, and supply chain — all running **locally** with an embedded **SQLite** database for lightning-fast, offline-first performance.

No cloud dependency. No subscriptions. Your data stays on your machine.

---

## ✨ Features

| Module | Highlights |
|--------|-----------|
| **Point of Sale (POS)** | Product grid, cart management, payment panel, barcode scanning |
| **Inventory** | Product CRUD, category management, stock adjustments, stock movements, low stock alerts, barcode label printing |
| **Pharmacy** | Expiry date tracking & alerts |
| **Restaurant** | Table management, recipe management |
| **Supply Chain** | Route management, supplier tracking |
| **Purchases** | Purchase orders, purchase detail view, supplier integration |
| **Sales** | Sales history, sale detail view, sale returns |
| **Customers** | Customer profiles, outstanding balance tracking |
| **Suppliers** | Supplier profiles, purchase history |
| **Staff** | Staff management, attendance tracking, payroll |
| **Expenses** | Expense logging with category-based tracking |
| **Discounts** | Flexible discount creation and management |
| **Reports** | Sales, purchase, expense, inventory, profit/loss, financial summary, outstanding balances |
| **Settings** | Business profile, user management, audit logs, backup & restore |
| **Invoicing** | A4 invoice & thermal receipt generation (PDF) |
| **Export** | Excel (`.xlsx`) and PDF export across all modules |
| **Theme** | Dark / Light mode support |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop Runtime** | [Electron 33](https://www.electronjs.org/) |
| **Frontend** | [React 18](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Database** | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (embedded SQLite) |
| **Build Tool** | [electron-vite](https://electron-vite.org/) + [Vite 5](https://vitejs.dev/) |
| **Packaging** | [electron-builder](https://www.electron.build/) (NSIS for Windows, DMG for macOS) |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Data Tables** | [TanStack React Table](https://tanstack.com/table) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **PDF Generation** | [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) |
| **Barcode / QR** | [JsBarcode](https://github.com/lindell/JsBarcode) + [html5-qrcode](https://github.com/mebjas/html5-qrcode) |
| **Excel Export** | [SheetJS (xlsx)](https://sheetjs.com/) |
| **Notifications** | [React Hot Toast](https://react-hot-toast.com/) |
| **Routing** | [React Router v6](https://reactrouter.com/) |
| **Auth** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (local password hashing) |

---

## 📁 Project Structure

```
bizcore/
├── electron/                        # ⚡ Electron Main Process (Backend)
│   ├── index.ts                     #    App entry point & window creation
│   ├── preload.ts                   #    Preload script (IPC bridge)
│   ├── database/
│   │   ├── db.ts                    #    SQLite database connection
│   │   ├── migrations/
│   │   │   ├── index.ts             #    Migration definitions
│   │   │   └── runner.ts            #    Migration runner
│   │   ├── repositories/
│   │   │   ├── auth.repo.ts         #    Authentication queries
│   │   │   ├── categories.repo.ts   #    Category CRUD
│   │   │   ├── customers.repo.ts    #    Customer CRUD
│   │   │   ├── discounts.repo.ts    #    Discount CRUD
│   │   │   ├── expenses.repo.ts     #    Expense CRUD
│   │   │   ├── products.repo.ts     #    Product CRUD
│   │   │   ├── profile.repo.ts      #    Business profile
│   │   │   ├── purchases.repo.ts    #    Purchase CRUD
│   │   │   ├── reports.repo.ts      #    Report queries
│   │   │   ├── restaurant.repo.ts   #    Restaurant data
│   │   │   ├── sales.repo.ts        #    Sales CRUD
│   │   │   ├── settings.repo.ts     #    App settings
│   │   │   ├── staff.repo.ts        #    Staff management
│   │   │   ├── suppliers.repo.ts    #    Supplier CRUD
│   │   │   └── units.repo.ts        #    Unit definitions
│   │   └── seeds/
│   │       ├── index.ts             #    Seed runner
│   │       ├── expense_categories.ts#    Default expense categories
│   │       ├── settings.ts          #    Default settings
│   │       └── units.ts             #    Default units
│   └── handlers/
│       ├── index.ts                 #    Handler registry (IPC routing)
│       ├── audit.handler.ts         #    Audit log endpoints
│       ├── auth.handler.ts          #    Login / session
│       ├── backup.handler.ts        #    Backup & restore
│       ├── customers.handler.ts     #    Customer endpoints
│       ├── dashboard.handler.ts     #    Dashboard stats
│       ├── dialog.handler.ts        #    Native file dialogs
│       ├── discounts.handler.ts     #    Discount endpoints
│       ├── expenses.handler.ts      #    Expense endpoints
│       ├── pharmacy.handler.ts      #    Pharmacy endpoints
│       ├── products.handler.ts      #    Product endpoints
│       ├── profile.handler.ts       #    Profile endpoints
│       ├── purchases.handler.ts     #    Purchase endpoints
│       ├── reports.handler.ts       #    Report endpoints
│       ├── restaurant.handler.ts    #    Restaurant endpoints
│       ├── routes.handler.ts        #    Supply route endpoints
│       ├── sales.handler.ts         #    Sales endpoints
│       ├── settings.handler.ts      #    Settings endpoints
│       ├── staff.handler.ts         #    Staff endpoints
│       └── suppliers.handler.ts     #    Supplier endpoints
│
├── src/                             # 🎨 React Renderer Process (Frontend)
│   ├── App.tsx                      #    Root app component & router
│   ├── main.tsx                     #    React entry point
│   ├── index.html                   #    HTML template
│   ├── env.d.ts                     #    Environment type declarations
│   ├── assets/
│   │   └── index.css                #    Global styles & Tailwind imports
│   ├── components/
│   │   ├── invoice/
│   │   │   ├── InvoiceA4.tsx        #    A4 invoice template
│   │   │   └── ReceiptThermal.tsx   #    Thermal receipt template
│   │   ├── layout/
│   │   │   ├── Header.tsx           #    Top navigation bar
│   │   │   ├── MainLayout.tsx       #    Page layout wrapper
│   │   │   ├── ModuleGuard.tsx      #    Module access control
│   │   │   └── Sidebar.tsx          #    Sidebar navigation
│   │   ├── scanner/
│   │   │   └── BarcodeScanner.tsx   #    QR / barcode scanner
│   │   └── ui/
│   │       ├── index.ts             #    UI barrel export
│   │       ├── Badge.tsx            #    Status badges
│   │       ├── Button.tsx           #    Button component
│   │       ├── Card.tsx             #    Card container
│   │       ├── ConfirmDialog.tsx    #    Confirmation modal
│   │       ├── DataTable.tsx        #    Reusable data table
│   │       ├── Drawer.tsx           #    Slide-in drawer
│   │       ├── EmptyState.tsx       #    Empty state placeholder
│   │       ├── ExportMenu.tsx       #    Export dropdown (PDF/Excel)
│   │       ├── Input.tsx            #    Text input
│   │       ├── LoadingSpinner.tsx   #    Loading indicator
│   │       ├── Modal.tsx            #    Modal dialog
│   │       ├── PageHeader.tsx       #    Page title & actions
│   │       ├── SearchBar.tsx        #    Search input
│   │       ├── Select.tsx           #    Select dropdown
│   │       ├── StatCard.tsx         #    Dashboard stat card
│   │       ├── Tabs.tsx             #    Tab navigation
│   │       └── Textarea.tsx         #    Textarea input
│   ├── constants/
│   │   └── modules.ts              #    Module definitions
│   ├── hooks/
│   │   ├── useLabel.ts             #    Label formatting hook
│   │   ├── useModules.ts           #    Module access hook
│   │   ├── usePermissions.ts       #    Permission check hook
│   │   └── useTheme.ts             #    Theme toggle hook
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.tsx            #    Login screen
│   │   ├── customers/
│   │   │   ├── CustomerForm.tsx     #    Add/edit customer
│   │   │   ├── CustomerList.tsx     #    Customer listing
│   │   │   └── CustomerProfile.tsx  #    Customer detail view
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx        #    Main dashboard
│   │   ├── discounts/
│   │   │   ├── DiscountForm.tsx     #    Add/edit discount
│   │   │   └── Discounts.tsx        #    Discount listing
│   │   ├── expenses/
│   │   │   ├── ExpenseForm.tsx      #    Add/edit expense
│   │   │   └── ExpenseList.tsx      #    Expense listing
│   │   ├── inventory/
│   │   │   ├── BarcodeLabels.tsx    #    Barcode label printing
│   │   │   ├── CategoryManager.tsx  #    Category CRUD
│   │   │   ├── LowStockReport.tsx   #    Low stock alerts
│   │   │   ├── ProductForm.tsx      #    Add/edit product
│   │   │   ├── ProductList.tsx      #    Product listing
│   │   │   ├── StockAdjustment.tsx  #    Manual stock adjustment
│   │   │   └── StockMovements.tsx   #    Stock movement history
│   │   ├── pharmacy/
│   │   │   └── ExpiryAlerts.tsx     #    Expiry date alerts
│   │   ├── pos/
│   │   │   ├── POS.tsx              #    POS main screen
│   │   │   ├── Cart.tsx             #    Shopping cart
│   │   │   ├── PaymentPanel.tsx     #    Payment processing
│   │   │   └── ProductGrid.tsx      #    Product selection grid
│   │   ├── purchases/
│   │   │   ├── NewPurchase.tsx       #    Create purchase order
│   │   │   ├── PurchaseDetail.tsx    #    Purchase detail view
│   │   │   └── PurchasesList.tsx     #    Purchase listing
│   │   ├── reports/
│   │   │   ├── ReportsHub.tsx       #    Reports landing page
│   │   │   ├── SalesReport.tsx      #    Sales analytics
│   │   │   ├── PurchaseReport.tsx   #    Purchase analytics
│   │   │   ├── ExpenseReport.tsx    #    Expense analytics
│   │   │   ├── InventoryReport.tsx  #    Inventory analytics
│   │   │   ├── ProfitLoss.tsx       #    P&L statement
│   │   │   ├── FinancialSummary.tsx #    Financial overview
│   │   │   └── OutstandingReport.tsx#    Outstanding balances
│   │   ├── restaurant/
│   │   │   ├── Recipes.tsx          #    Recipe management
│   │   │   └── TableManagement.tsx  #    Table layout & status
│   │   ├── sales/
│   │   │   ├── SalesList.tsx        #    Sales history
│   │   │   ├── SaleDetail.tsx       #    Sale detail view
│   │   │   └── SaleReturn.tsx       #    Process returns
│   │   ├── settings/
│   │   │   ├── Settings.tsx         #    General settings
│   │   │   ├── UserManagement.tsx   #    User CRUD
│   │   │   ├── AuditLog.tsx         #    Activity audit log
│   │   │   └── BackupRestore.tsx    #    Database backup/restore
│   │   ├── setup/
│   │   │   └── SetupWizard.tsx      #    First-run setup
│   │   ├── staff/
│   │   │   ├── StaffList.tsx        #    Staff listing
│   │   │   ├── StaffForm.tsx        #    Add/edit staff
│   │   │   ├── Attendance.tsx       #    Attendance tracking
│   │   │   └── Payroll.tsx          #    Payroll management
│   │   ├── suppliers/
│   │   │   ├── SupplierList.tsx     #    Supplier listing
│   │   │   ├── SupplierForm.tsx     #    Add/edit supplier
│   │   │   └── SupplierProfile.tsx  #    Supplier detail view
│   │   └── supply/
│   │       └── RoutesPage.tsx       #    Delivery routes
│   ├── store/
│   │   ├── authStore.ts             #    Auth state (Zustand)
│   │   ├── cartStore.ts             #    POS cart state (Zustand)
│   │   ├── profileStore.ts          #    Business profile state
│   │   └── uiStore.ts              #    UI state (sidebar, theme)
│   └── utils/
│       ├── calculations.ts          #    Business math helpers
│       ├── cn.ts                    #    Tailwind class merge utility
│       ├── exportExcel.ts           #    Excel export helper
│       ├── exportPdf.ts             #    PDF export helper
│       ├── formatters.ts            #    Date/currency formatters
│       └── printHelpers.ts          #    Print utility functions
│
├── resources/                       # 📦 App icons & static assets
├── docs/                            # 📄 Documentation
├── electron.vite.config.ts          # ⚙️  Vite config for Electron
├── electron-builder.yml             # ⚙️  Electron Builder packaging config
├── tailwind.config.js               # ⚙️  Tailwind CSS config
├── postcss.config.js                # ⚙️  PostCSS config
├── tsconfig.json                    # ⚙️  Root TypeScript config
├── tsconfig.web.json                # ⚙️  Frontend TS config
├── tsconfig.node.json               # ⚙️  Backend TS config
└── package.json                     # ⚙️  Dependencies & scripts
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Electron Main Process              │
│                                                     │
│  ┌─────────────┐   ┌────────────────────────────┐   │
│  │  SQLite DB   │◄──│  Repositories (data layer) │   │
│  │ (better-     │   └────────────┬───────────────┘   │
│  │  sqlite3)    │                │                    │
│  └─────────────┘   ┌────────────▼───────────────┐   │
│                    │  Handlers (IPC endpoints)    │   │
│                    └────────────┬───────────────┘   │
│                                 │                    │
├─────────────────────────────────┼────────────────────┤
│            Preload Script (IPC Bridge)               │
├─────────────────────────────────┼────────────────────┤
│                                 │                    │
│                   Electron Renderer Process           │
│                                 │                    │
│  ┌──────────────────────────────▼─────────────────┐  │
│  │              React Application                  │  │
│  │                                                 │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │  Pages   │  │  Store   │  │  Components  │   │  │
│  │  │ (views)  │  │ (Zustand)│  │  (reusable)  │   │  │
│  │  └─────────┘  └──────────┘  └──────────────┘   │  │
│  │                                                 │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │  Hooks   │  │  Utils   │  │  Constants   │   │  │
│  │  └─────────┘  └──────────┘  └──────────────┘   │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/bizcore.git
cd bizcore

# 2. Install dependencies
npm install
```

### Development

```bash
# Start the app in development mode (hot-reload enabled)
npm run dev
```

This launches both the Electron main process and the React dev server with hot module replacement.

### Building

```bash
# Build the app (compiles TypeScript & bundles assets)
npm run build

# Preview the built app
npm run preview
```

### Packaging for Distribution

```bash
# Auto-detect platform
npm run package

# Windows only (creates .exe installer via NSIS)
npm run package:win

# macOS only (creates .dmg)
npm run package:mac
```

The installer output will be in the `dist-installer/` directory.

---

## 📂 Key Concepts

### IPC Communication
The app uses Electron's IPC (Inter-Process Communication) to bridge the frontend and backend. The **preload script** exposes safe API methods, **handlers** process requests in the main process, and **repositories** execute SQL queries against the SQLite database.

### Offline-First
All data is stored locally in an embedded SQLite database. No internet connection is required to run the application. Backup and restore functionality is built-in.

### Module System
BizCore supports multiple business modules (POS, Pharmacy, Restaurant, Supply Chain) that can be enabled/disabled through settings. The `ModuleGuard` component controls access based on active modules.

### Database Migrations & Seeds
The database schema is managed through a migration system (`electron/database/migrations/`). Default data (units, expense categories, settings) is populated via seed files (`electron/database/seeds/`).

---

## 📜 Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run package` | Build + package installer (auto-detect OS) |
| `npm run package:win` | Build + package Windows `.exe` installer |
| `npm run package:mac` | Build + package macOS `.dmg` |
| `npm run postinstall` | Install native Electron dependencies |

---

<p align="center">
  Built with ❤️ using Electron + React + SQLite
</p>
