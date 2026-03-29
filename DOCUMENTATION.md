# BizCore — Technical Documentation

> Comprehensive, offline-first desktop business management system built with Electron + React + SQLite

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [Database Schema](#4-database-schema)
5. [IPC API Reference](#5-ipc-api-reference)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Module System](#7-module-system)
8. [State Management](#8-state-management)
9. [Frontend Routing](#9-frontend-routing)
10. [Key Features & Workflows](#10-key-features--workflows)
11. [Build & Packaging](#11-build--packaging)
12. [Environment & Configuration](#12-environment--configuration)
13. [Security](#13-security)
14. [Performance Optimizations](#14-performance-optimizations)
15. [Data Flow](#15-data-flow)

---

## 1. Project Overview

**BizCore** is a unified desktop platform for managing multiple business verticals — retail POS, pharmacy, restaurant, and supply chain — all running locally with an embedded SQLite database. No cloud dependency, no subscriptions. Data stays on the machine.

| Field | Value |
|-------|-------|
| Package Name | `bizcore` |
| Version | `1.0.0` |
| App ID | `com.bizcore.app` |
| Type | Electron Desktop Application |
| Platforms | Windows (NSIS), macOS (DMG) |
| License | Private |

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Electron | 33.2.1 |
| Frontend | React | 18.3.1 |
| Language | TypeScript | 5.7.2 |
| Build Tool | electron-vite + Vite 5 | 2.3.0 |
| Database | better-sqlite3 (embedded SQLite) | 11.7.0 |
| Styling | Tailwind CSS | 3.4.16 |
| State Management | Zustand | 5.0.2 |
| Forms | React Hook Form + Zod | 7.54.0 |
| Data Tables | TanStack React Table | 8.20.6 |
| Charts | Recharts | 2.14.1 |
| PDF Generation | jsPDF + jspdf-autotable | 4.2.1 |
| Barcode/QR | JsBarcode + html5-qrcode | 3.12.3 / 2.3.8 |
| Excel Export | SheetJS (xlsx) | 0.18.5 |
| Icons | Lucide React | 0.468.0 |
| Notifications | React Hot Toast | 2.4.1 |
| Auth | bcryptjs | 2.4.3 |
| Packaging | electron-builder | 25.1.8 |

---

## 3. Directory Structure

```
clauderozgar/
├── electron/                           # MAIN PROCESS (Backend)
│   ├── index.ts                        # App entry, window creation, IPC registration
│   ├── preload.ts                      # Secure IPC bridge (contextBridge)
│   ├── database/
│   │   ├── db.ts                       # SQLite connection (WAL mode, foreign keys)
│   │   ├── migrations/
│   │   │   ├── index.ts                # Complete schema definition
│   │   │   └── runner.ts               # Migration execution
│   │   ├── repositories/               # Data access layer (18 files)
│   │   │   ├── auth.repo.ts            # User login, password hashing
│   │   │   ├── categories.repo.ts      # Product categories
│   │   │   ├── customers.repo.ts       # Customer profiles, balances
│   │   │   ├── discounts.repo.ts       # Discount rules & usage
│   │   │   ├── expenses.repo.ts        # Expense logging
│   │   │   ├── products.repo.ts        # Product CRUD, stock, variants
│   │   │   ├── profile.repo.ts         # Business profile (single row)
│   │   │   ├── purchases.repo.ts       # Purchase orders
│   │   │   ├── reports.repo.ts         # Analytics queries
│   │   │   ├── restaurant.repo.ts      # Table & recipe management
│   │   │   ├── sales.repo.ts           # Sales, returns, invoicing
│   │   │   ├── settings.repo.ts        # Key-value settings
│   │   │   ├── staff.repo.ts           # Staff, attendance, payroll
│   │   │   ├── suppliers.repo.ts       # Supplier profiles
│   │   │   └── units.repo.ts           # Measurement units
│   │   └── seeds/
│   │       ├── index.ts                # Seed runner
│   │       ├── expense_categories.ts   # Default expense categories
│   │       ├── settings.ts             # Default app settings
│   │       └── units.ts                # Default units (kg, ltr, box)
│   └── handlers/                       # IPC handlers (23 files)
│       ├── index.ts                    # registerAllHandlers()
│       ├── auth.handler.ts             # Login, logout, user management
│       ├── sales.handler.ts            # Sales CRUD, returns, dashboard
│       ├── products.handler.ts         # Product CRUD, stock, barcode
│       ├── purchases.handler.ts        # Purchase orders
│       ├── customers.handler.ts        # Customer CRUD, balance
│       ├── suppliers.handler.ts        # Supplier CRUD
│       ├── expenses.handler.ts         # Expense logging
│       ├── staff.handler.ts            # Staff, attendance, payroll
│       ├── reports.handler.ts          # Financial reports
│       ├── profile.handler.ts          # Business profile
│       ├── settings.handler.ts         # App settings
│       ├── backup.handler.ts           # Backup/restore, auto-backup
│       ├── audit.handler.ts            # Audit log queries
│       ├── dashboard.handler.ts        # Dashboard stats
│       ├── pharmacy.handler.ts         # Expiry alerts, batch tracking
│       ├── restaurant.handler.ts       # Tables & recipes
│       └── dialog.handler.ts           # Native file dialogs
│
├── src/                                # RENDERER PROCESS (Frontend)
│   ├── main.tsx                        # React entry (HashRouter, Toaster)
│   ├── App.tsx                         # Root router with protected routes
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx          # Sidebar + Header + content
│   │   │   ├── Sidebar.tsx             # Navigation with active modules
│   │   │   ├── Header.tsx              # Top nav (user, theme, logout)
│   │   │   └── ModuleGuard.tsx         # Access control per module
│   │   ├── ui/                         # Reusable components
│   │   │   ├── Button, Input, Select, Modal, Drawer
│   │   │   ├── DataTable.tsx           # TanStack table wrapper
│   │   │   ├── Card, StatCard, Badge, Tabs
│   │   │   ├── SearchBar, EmptyState, LoadingSpinner
│   │   │   ├── ExportMenu.tsx          # PDF/Excel dropdown
│   │   │   └── index.ts               # Barrel export
│   │   ├── invoice/
│   │   │   ├── InvoiceA4.tsx           # A4 invoice template
│   │   │   └── ReceiptThermal.tsx      # 80mm thermal receipt
│   │   └── scanner/
│   │       └── BarcodeScanner.tsx      # QR/barcode scanner
│   ├── pages/
│   │   ├── auth/Login.tsx
│   │   ├── dashboard/Dashboard.tsx     # Revenue chart, stats
│   │   ├── pos/                        # POS, ProductGrid, Cart, PaymentPanel
│   │   ├── inventory/                  # Products, Categories, Stock, Barcodes
│   │   ├── sales/                      # Sales history, detail, returns
│   │   ├── purchases/                  # PO list, detail, new purchase
│   │   ├── customers/                  # Customer CRUD & profile
│   │   ├── suppliers/                  # Supplier CRUD & profile
│   │   ├── expenses/                   # Expense list & form
│   │   ├── staff/                      # Staff, Attendance, Payroll
│   │   ├── discounts/                  # Discount CRUD
│   │   ├── reports/                    # 7 report pages (sales, P&L, etc.)
│   │   ├── pharmacy/ExpiryAlerts.tsx
│   │   ├── restaurant/                 # Tables, Recipes
│   │   ├── supply/RoutesPage.tsx       # Delivery routes
│   │   ├── settings/                   # Profile, Users, Audit, Backup
│   │   └── setup/SetupWizard.tsx       # First-run wizard (6 steps)
│   ├── store/                          # Zustand stores
│   │   ├── authStore.ts               # Current user & login
│   │   ├── profileStore.ts            # Business profile & modules
│   │   ├── cartStore.ts               # POS cart state
│   │   └── uiStore.ts                 # Sidebar, theme
│   ├── hooks/
│   │   ├── useTheme.ts                # Light/dark toggle
│   │   ├── useModules.ts             # Active module check
│   │   ├── usePermissions.ts         # Permission check
│   │   └── useLabel.ts               # Custom business labels
│   ├── constants/
│   │   └── modules.ts                 # Module definitions & presets
│   └── utils/
│       ├── exportPdf.ts, exportExcel.ts
│       ├── formatters.ts              # Date, currency, time
│       ├── calculations.ts            # Business math
│       ├── cn.ts                      # Tailwind class merge
│       └── printHelpers.ts
│
├── resources/                          # App icons & assets
├── electron.vite.config.ts            # Build configuration
├── electron-builder.yml               # Packaging configuration
├── tailwind.config.js                 # Tailwind customization
├── tsconfig.json                      # Root TypeScript config
├── tsconfig.node.json                 # Backend TypeScript config
└── tsconfig.web.json                  # Frontend TypeScript config
```

---

## 4. Database Schema

All tables defined in `electron/database/migrations/index.ts`. SQLite with WAL mode enabled, foreign keys enforced.

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `business_profile` | Single-row business config | name, logo, currency, active_modules (JSON), labels (JSON) |
| `users` | Staff accounts | username, password_hash, role, permissions (JSON), last_login |
| `audit_log` | Activity tracking | user_id, action, entity_type, entity_id, changes (JSON) |
| `settings` | Key-value app settings | key, value |

### Product Management

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `products` | Product catalog | sku, barcode, name, cost_price, sale_price, wholesale_price, stock_quantity, min_stock_alert, category_id, unit_id, batch_number, expiry_date |
| `categories` | Product categories | name, parent_id |
| `units` | Measurement units | name, abbreviation |
| `stock_movements` | Stock audit trail | product_id, type (in/out/adjust), quantity, reference_type, reference_id |

### Sales & Customers

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `sales` | Invoice records | invoice_number, customer_id, subtotal, discount_amount, tax_amount, total, payment_method, status |
| `sale_items` | Line items | sale_id, product_id, quantity, unit_price, discount_percent, tax_amount |
| `sale_returns` | Return transactions | sale_id, total, reason |
| `sale_return_items` | Items returned | return_id, sale_item_id, quantity |
| `customers` | Customer profiles | name, phone, email, opening_balance, current_balance, credit_limit, loyalty_points |
| `ledger` | AR/AP transactions | party_type, party_id, type (debit/credit), amount, balance |

### Purchases & Suppliers

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `purchases` | Purchase orders | po_number, supplier_id, subtotal, total, status (draft/received/partial) |
| `purchase_items` | PO line items | purchase_id, product_id, quantity, unit_cost, batch_number, expiry_date |
| `suppliers` | Supplier profiles | name, phone, email, opening_balance, current_balance |

### Operations

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `expenses` | Expense entries | category_id, amount, date, description, payment_method |
| `expense_categories` | Expense types | name, icon, color |
| `staff` | Staff profiles | name, cnic, designation, salary, salary_type, user_id |
| `attendance` | Daily records | staff_id, date, check_in, check_out, status, overtime_hours |
| `payroll` | Monthly payroll | staff_id, month, base_salary, deductions, bonuses, net_salary |
| `staff_advances` | Advance payments | staff_id, amount, date, deducted |

### Features

| Table | Purpose |
|-------|---------|
| `discounts` | Discount rules (percentage/fixed, date range, min purchase) |
| `tables` | Restaurant tables (capacity, area, status) |
| `recipes` | Recipe definitions with cost calculation |
| `recipe_ingredients` | Ingredient mapping with quantities |
| `routes` | Delivery routes with salesperson assignment |
| `invoices` | Generic invoice record |
| `payments` | Payment tracking (multi-method) |

### Database Indexes

Optimized queries on:
- `products` — category_id, barcode, sku, deleted_at
- `sales` — date, customer_id, invoice_number
- `purchases` — date, supplier_id
- `expenses` — date, category_id
- `ledger` — party_type + party_id
- `stock_movements` — product_id
- `attendance` — staff_id + date
- `audit_log` — entity_type + entity_id

---

## 5. IPC API Reference

All IPC calls use the pattern:
```typescript
window.api.invoke('channel:action', data) → { success: boolean, data?, error? }
```

### Authentication

| Channel | Description |
|---------|-------------|
| `auth:login` | Verify username/password, return user object |
| `auth:logout` | Clear session |
| `auth:change-password` | Change current user's password |
| `auth:user-exists` | Check if any user exists (for setup) |
| `users:list` | List all active users |
| `users:create` | Create user with bcrypt-hashed password |
| `users:update` | Update user (role, permissions, status) |
| `users:delete` | Soft delete user |
| `users:reset-password` | Admin password reset |

### Business Profile

| Channel | Description |
|---------|-------------|
| `profile:get` | Get business profile |
| `profile:create` | Initial setup |
| `profile:update` | Edit business info |
| `profile:exists` | Check if profile exists |

### Products & Inventory

| Channel | Description |
|---------|-------------|
| `products:list` | Paginated list with filters (search, category, low stock) |
| `products:get` | Single product by ID |
| `products:create` | Add new product |
| `products:update` | Edit product |
| `products:delete` | Soft delete product |
| `products:search-by-barcode` | Barcode lookup |
| `categories:list` | All categories |
| `categories:create/update/delete` | Category CRUD |
| `units:list` | Available measurement units |
| `stock:adjust` | Manual stock adjustment with reason |
| `stock:movements` | Stock movement history |

### Sales

| Channel | Description |
|---------|-------------|
| `sales:list` | Paginated sales with date/customer filters |
| `sales:get` | Full sale detail with items |
| `sales:create` | Record new sale (auto-calculates taxes, updates stock) |
| `sales:return` | Process return (reverses stock) |
| `sales:delete` | Void a sale |
| `dashboard:today-stats` | Today's revenue, transaction count |
| `dashboard:recent-sales` | Last N sales |
| `dashboard:revenue-chart` | Last 7 days revenue data |

### Purchases

| Channel | Description |
|---------|-------------|
| `purchases:list` | PO list with status |
| `purchases:get` | PO detail with items |
| `purchases:create` | New purchase order |
| `purchases:update` | Edit PO |

### Customers & Suppliers

| Channel | Description |
|---------|-------------|
| `customers:list/get/create/update/delete` | Full CRUD |
| `suppliers:list/get/create/update/delete` | Full CRUD |
| `ledger:list` | Customer/supplier transaction history |

### Reports

| Channel | Description |
|---------|-------------|
| `reports:sales` | Sales analytics by date range, product, customer |
| `reports:purchases` | Purchase analytics |
| `reports:expenses` | Expense breakdown by category |
| `reports:profit-loss` | Profit & Loss statement |
| `reports:financial-summary` | Overall financial dashboard |
| `reports:outstanding` | Receivables & payables |

### Staff & Payroll

| Channel | Description |
|---------|-------------|
| `staff:list/get/create/update/delete` | Staff CRUD |
| `attendance:list/create/update` | Attendance tracking |
| `payroll:list/calculate/save` | Payroll management |

### Expenses & Discounts

| Channel | Description |
|---------|-------------|
| `expenses:list/get/create/update/delete` | Expense CRUD |
| `discounts:list/get/create/update/delete` | Discount CRUD |

### Pharmacy & Restaurant

| Channel | Description |
|---------|-------------|
| `pharmacy:expiry-alerts` | Products expiring soon |
| `restaurant:tables:list/update` | Table status management |
| `restaurant:recipes:list/get/create/update/delete` | Recipe CRUD |

### System

| Channel | Description |
|---------|-------------|
| `backup:create` | Export database file |
| `backup:restore` | Import database from backup |
| `backup:auto` | Auto-backup to configured path |
| `backup:list` | List available backups |
| `settings:get-all/get/update` | App settings |
| `audit:list` | Activity log with filters |
| `dialog:open-file` | Native file open dialog |
| `dialog:save-file` | Native file save dialog |

---

## 6. Authentication & Authorization

### Password Handling

- Passwords hashed with **bcryptjs** (10 salt rounds)
- Stored in `users.password_hash`
- Comparison via `bcrypt.compare()` on login

### Login Flow

```
Frontend (Login.tsx)
  → authStore.login(username, password)
    → window.api.invoke('auth:login', { username, password })
      → authRepo.login(): bcrypt.compare()
        → Success: returns { id, name, username, role, permissions }
        → Failure: returns { success: false, error }
  → authStore.setUser(user)
  → Navigate to /dashboard
```

### User Roles

| Role | Access Level |
|------|-------------|
| `owner` | Full access, setup wizard, user management |
| `manager` | Most features except user management |
| `cashier` | POS, sales, limited reporting |
| `staff` | Basic operations only |

### Permissions

Stored as JSON per user:
```json
{ "view_reports": true, "edit_prices": false, "manage_staff": true }
```

Checked via `usePermissions()` hook in frontend components.

### Session

- **In-memory only** — no persistent tokens or cookies
- Stored in Zustand `authStore.user`
- Logout clears state → redirects to `/login`
- `last_login` timestamp updated on each login

---

## 7. Module System

Defined in `src/constants/modules.ts`. Business profile stores active modules as a JSON array.

### Available Modules (20)

```
dashboard, pos, sales, purchases, inventory, expenses, staff, invoices,
reports, customers, suppliers, recipes, prescriptions, routes, tables,
discounts, loyalty, barcode_scanner, settings, backup
```

### Business Presets

| Preset | Key Modules |
|--------|------------|
| Restaurant/Cafe | POS, tables, recipes, staff |
| General Store/Grocery | Barcode, inventory, credit tracking |
| Medical/Pharmacy | Expiry tracking, batch, prescriptions |
| Supply/Distribution | Routes, bulk sales |
| Clothing/Retail | Size variants, loyalty points, returns |
| Electronics | Serial tracking, warranty |
| Custom | User selects modules manually |

### Implementation

- Stored in `business_profile.active_modules` (JSON array)
- Frontend checks via `useModules()` hook
- `<ModuleGuard moduleKey="...">` wrapper blocks disabled modules
- Sidebar renders only enabled module links
- Setup wizard allows preset or custom selection

---

## 8. State Management

Four Zustand stores manage client-side state.

### authStore

```typescript
{
  user: User | null,
  isLoading: boolean,
  login(username, password): Promise<boolean>,
  logout(): void,
  setUser(user): void
}
```

### profileStore

```typescript
{
  profile: BusinessProfile | null,
  isLoaded: boolean,
  loadProfile(): Promise<void>,
  setProfile(profile): void,
  getLabel(key: string): string     // Custom business labels
}
```

### cartStore (POS)

```typescript
{
  items: CartItem[],
  customer_id: number | null,
  sale_type: 'retail' | 'wholesale',
  discount_type: 'percent' | 'amount' | null,

  addItem(product): void,
  removeItem(productId): void,
  updateQuantity(productId, qty): void,
  updateItemDiscount(productId, percent): void,
  setCustomer(id, name): void,
  setSaleType(type): void,
  setDiscount(type, value): void,
  clearCart(): void,

  // Computed
  getSubtotal(): number,
  getDiscountAmount(): number,
  getTaxTotal(): number,
  getGrandTotal(): number
}
```

### uiStore

```typescript
{
  sidebarExpanded: boolean,
  theme: 'light' | 'dark',
  toggleSidebar(): void,
  setTheme(theme): void
}
```

---

## 9. Frontend Routing

### Route Map

| Path | Page | Module Guard |
|------|------|-------------|
| `/setup` | SetupWizard | None (public) |
| `/login` | Login | None (public) |
| `/dashboard` | Dashboard | `dashboard` |
| `/pos` | POS | `pos` |
| `/sales` | SalesList | `sales` |
| `/purchases` | PurchasesList | `purchases` |
| `/inventory` | ProductList | `inventory` |
| `/customers` | CustomerList | `customers` |
| `/suppliers` | SupplierList | `suppliers` |
| `/expenses` | ExpenseList | `expenses` |
| `/staff` | StaffList | `staff` |
| `/discounts` | Discounts | `discounts` |
| `/reports` | ReportsHub | `reports` |
| `/settings` | Settings | `settings` |
| `/settings/users` | UserManagement | `settings` |
| `/settings/audit` | AuditLog | `settings` |
| `/settings/backup` | BackupRestore | `backup` |

### Route Protection

1. `ProtectedRoute` checks `authStore.user` — redirects to `/login` if null
2. `AppInitializer` checks if profile/user exists — redirects to `/setup` if not
3. `ModuleGuard` checks `profile.active_modules` — blocks if module disabled

---

## 10. Key Features & Workflows

### Point of Sale (POS)

- **Keyboard shortcuts:** F2 = search, F10 = payment, barcode wedge detection
- **Pricing:** Retail/wholesale, per-item discounts, global discounts
- **Payment methods:** Cash, check, card, credit
- **Receipt:** Thermal 80mm PDF or A4 invoice

### Inventory Management

- Real-time stock tracking with audit trail
- Low stock alerts (configurable `min_stock_alert` per product)
- Barcode label printing (JsBarcode)
- Batch number and expiry date tracking

### Sales & Invoicing

- Auto-incremented invoice numbers
- Percentage or fixed discounts (line item + global)
- Tax calculation per product and per sale
- Returns linked to original sale with stock reversal
- PDF export (A4 + thermal receipt)

### Customer Management

- Opening balance + credits/payments via ledger
- Credit limit enforcement at POS
- Loyalty points accumulation
- Delivery route assignment

### Reporting

- Sales Report — filters by date, customer, product, with charts
- P&L Statement — Revenue - COGS - Expenses
- Financial Summary — key metrics dashboard
- Outstanding Report — receivables & payables aging
- All reports exportable to PDF and Excel

### Staff & Payroll

- Daily attendance (check-in/check-out with overtime)
- Monthly payroll with deductions, bonuses, advances
- Support for monthly and daily salary types

### Backup & Restore

- Manual backup — exports SQLite file to user-selected location
- Restore from backup with safety copy of current DB
- Optional auto-backup to network/external drive

---

## 11. Build & Packaging

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Electron + Vite dev server with HMR |
| `npm run build` | Compile TypeScript, bundle with Vite |
| `npm run package` | Auto-detect OS, build installer |
| `npm run package:win` | NSIS Windows installer (.exe) |
| `npm run package:mac` | DMG macOS installer |

### Build Pipeline

```
electron-vite build
├── Main process:   electron/index.ts     → out/main/index.js
├── Preload script: electron/preload.ts   → out/preload/preload.js
└── Renderer:       src/index.html        → out/renderer/ (React bundle)

electron-builder
├── Windows: NSIS installer → dist-installer/*.exe
└── macOS:   DMG installer  → dist-installer/*.dmg
```

### Configuration Files

| File | Purpose |
|------|---------|
| `electron.vite.config.ts` | Vite + Electron build config |
| `electron-builder.yml` | Packaging (NSIS/DMG) |
| `tailwind.config.js` | Custom colors, fonts, animations |
| `tsconfig.json` | Root TypeScript config |
| `tsconfig.node.json` | Backend (Node) TS config |
| `tsconfig.web.json` | Frontend (browser) TS config |
| `postcss.config.js` | PostCSS for Tailwind |

---

## 12. Environment & Configuration

### Database Location

| OS | Path |
|----|------|
| Windows | `%APPDATA%/BizCore/bizcore.db` |
| macOS | `~/Library/Application Support/BizCore/bizcore.db` |

Resolved via `electron.app.getPath('userData')`.

### No Environment Variables Required

All configuration is stored in the database (`settings` table, `business_profile` table). No `.env` files needed for operation.

### Default Seeds

On first run, the database is seeded with:
- Default measurement units (kg, liter, piece, box, etc.)
- Default expense categories (Rent, Utilities, Salary, etc.)
- Default app settings (currency, language, etc.)

---

## 13. Security

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcryptjs with 10 salt rounds |
| IPC isolation | `contextBridge` in preload — no direct Node.js access from renderer |
| SQL injection prevention | Parameterized queries via better-sqlite3 prepared statements |
| Soft deletes | All deletes set `deleted_at` timestamp |
| Audit logging | Tracks user, action, entity, changes |
| Role-based access | Permission JSON per user, checked on frontend |
| Foreign keys | Enforced at database level |

---

## 14. Performance Optimizations

| Optimization | Details |
|-------------|---------|
| WAL mode | Write-Ahead Logging for concurrent read/write |
| Database indexes | On all frequently queried columns |
| Pagination | Product/sales lists default 50 per page |
| Lazy loading | Categories and products loaded on demand |
| Debounced search | 300ms debounce on product search input |
| Zustand selectors | Minimal re-renders via selective subscriptions |
| Vite code splitting | Automatic route-based splitting |
| Tailwind PurgeCSS | Unused CSS removed in production |

---

## 15. Data Flow

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Renderer Process (React)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Zustand   │  │  Pages   │  │    UI    │          │
│  │ Stores    │←→│ (Views)  │←→│Components│          │
│  └──────────┘  └────┬─────┘  └──────────┘          │
│                     │ window.api.invoke()            │
├─────────────────────┼───────────────────────────────┤
│  Preload (contextBridge)                            │
├─────────────────────┼───────────────────────────────┤
│  Main Process       │                               │
│  ┌──────────────────▼──────────────────┐            │
│  │         IPC Handlers                │            │
│  │  (auth, sales, products, ...)       │            │
│  └──────────────────┬──────────────────┘            │
│  ┌──────────────────▼──────────────────┐            │
│  │         Repositories                │            │
│  │  (SQL queries, business logic)      │            │
│  └──────────────────┬──────────────────┘            │
│  ┌──────────────────▼──────────────────┐            │
│  │     SQLite (better-sqlite3)         │            │
│  │        bizcore.db                   │            │
│  └─────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

### Example: Creating a Sale

```
1. User clicks "Complete Sale" in POS
2. cartStore calculates subtotal, discounts, taxes
3. PaymentPanel prepares sale payload
4. → window.api.invoke('sales:create', { items, customer_id, payment_method, ... })
5. → sales.handler.ts calls salesRepo.create(data)
6. → salesRepo (transaction):
   ├── Generate invoice number
   ├── INSERT into sales
   ├── INSERT into sale_items (per line item)
   ├── UPDATE products.stock_quantity
   ├── INSERT into stock_movements
   └── INSERT into ledger (if credit sale)
7. ← Returns { success: true, invoiceId, invoiceNumber }
8. Frontend: toast notification → clear cart → print receipt
```

### Example: Setup Flow

```
1. App launches → detects no profile/user → redirects to /setup
2. SetupWizard (6 steps):
   ├── Step 1: Select business type (preset or custom)
   ├── Step 2: Configure modules
   ├── Step 3: Enter business info (name, currency, etc.)
   ├── Step 4: Set custom labels (optional)
   ├── Step 5: Create owner account (username/password)
   └── Step 6: Confirmation
3. → profile:create + users:create
4. → profileStore.loadProfile()
5. → Navigate to /dashboard
```

---

## Summary

**BizCore** is a production-ready, offline-first desktop business management application featuring:

- **20 configurable modules** across 6 business presets
- **~100 IPC endpoints** across 23 handlers
- **18 repository files** implementing the data access layer
- **30+ database tables** with full indexing and foreign key constraints
- **Complete CRUD** for all business entities
- **Advanced features:** POS with barcode scanning, PDF invoicing, staff payroll, financial reporting, multi-business-type support
- **Security:** bcrypt auth, role-based access, audit logging, parameterized queries
- **Zero cloud dependency:** embedded SQLite, local backup/restore
