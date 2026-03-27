# Phase 1 — Foundation

## Overview
Phase 1 establishes the complete project infrastructure: Electron app scaffold, database layer, IPC communication, UI component library, authentication, setup wizard, and the dynamic business profile/module system.

---

## Step 1: Project Setup
- **electron-vite** project with TypeScript strict mode
- **Tailwind CSS** configured with BizCore design system (custom colors, fonts, spacing)
- **React 18** renderer with HashRouter, Zustand, react-hot-toast
- **Electron main process** + secure preload with `contextBridge`
- `better-sqlite3` native module compiled for Electron
- `electron-builder.yml` for Windows NSIS installer

### Key Files
- `electron.vite.config.ts` — Build configuration
- `tailwind.config.js` — Design system colors/fonts
- `package.json` — All dependencies
- `src/index.html` — Entry HTML with Google Fonts
- `src/assets/index.css` — CSS variables, scrollbar, print styles

---

## Step 2: Database Setup
- **better-sqlite3** connection with WAL mode and foreign keys
- **Migration runner** tracks executed migrations in `_migrations` table
- **25+ tables** in initial migration covering all business domains
- **Performance indexes** on key query columns
- **Seed data:** 15 units, 12 expense categories, 12 default settings

### Key Files
- `electron/database/db.ts` — Connection singleton, init, getDb()
- `electron/database/migrations/index.ts` — All SQL table definitions
- `electron/database/migrations/runner.ts` — Migration execution engine
- `electron/database/seeds/` — Units, expense categories, settings

### Database Location
- Windows: `%APPDATA%/BizCore/bizcore.db`

---

## Step 3: IPC Bridge
- Secure `preload.ts` exposing `window.api.invoke/on/off` via contextBridge
- **Repository pattern:** Clean data access layer per domain
- **IPC Handlers:** Profile, Auth (login/CRUD), Settings, Dialog (file pickers)
- All handlers return `{ success: boolean, data?, error? }`
- Password hashing with bcryptjs (cost 10)

### Key Files
- `electron/preload.ts` — Context bridge
- `electron/handlers/` — IPC handler registration
- `electron/database/repositories/` — Data access layer
- `src/env.d.ts` — TypeScript types for window.api

---

## Step 4: UI Component Library (17 Components)

### Form Controls
- `Button` — 5 variants (primary/secondary/ghost/danger/success), 3 sizes, loading state
- `Input` — Label, error, hint, left/right icons
- `Textarea` — Label, error, auto-resize
- `Select` — Options, placeholder, error, chevron icon

### Data Display
- `DataTable` — TanStack Table: sortable, paginated, searchable, empty state
- `Badge` — 5 color variants
- `StatCard` — Icon + title + value + trend indicator

### Feedback & Navigation
- `Modal` — 5 sizes, Escape to close, overlay click dismiss
- `ConfirmDialog` — Danger/warning with icon
- `LoadingSpinner` / `PageLoader`
- `EmptyState` — Icon + title + description + CTA button
- `Tabs` — With optional count badges
- `SearchBar` — Ctrl+K keyboard shortcut

### Layout
- `Sidebar` — Dynamic nav from active_modules, collapsible, user info, logout
- `Header` — Global search bar
- `MainLayout` — Sidebar + header + content area
- `PageHeader` — Title + subtitle + action buttons

### Utilities
- `cn()` — clsx + tailwind-merge
- `formatCurrency()`, `formatDate()`, `formatDateTime()`, `formatNumber()`
- `calculateLineTotal()`, `calculateProfit()`, `calculateDiscountAmount()`

---

## Step 5: Auth System
- **Login page** — Dark gradient, centered card, Zod validation, show/hide password
- **Auth Zustand store** — login, logout, setUser
- **Route guards** — `ProtectedRoute` redirects to /login
- **App initializer** — Checks setup status on startup
- **`usePermissions` hook** — RBAC (owner/manager/cashier/staff) + per-user overrides
- **`useModules` hook** — Checks if module is active

### Key Files
- `src/pages/auth/Login.tsx`
- `src/store/authStore.ts`
- `src/hooks/usePermissions.ts`
- `src/hooks/useModules.ts`

---

## Step 6: Setup Wizard
- **6-step flow:** Welcome → Business Type → Business Info → Owner Account → Modules → Done
- **7 business presets** with icons, descriptions, preset modules and custom labels
- **Form validation** with React Hook Form + Zod
- **Module toggles** pre-filled from business type
- Creates profile + owner user in DB, auto-logs in

### Key Files
- `src/pages/setup/SetupWizard.tsx`
- `src/constants/modules.ts` — All presets, module keys, labels

---

## Step 7: Business Profile & Module System
- **Profile Zustand store** — Loads on app start, caches in memory
- **Dynamic sidebar** — Only shows nav items for active modules
- **Custom labels** — `useLabel()` hook for business-type-specific terminology
- **Module guard** — `<ModuleGuard>` component blocks access to inactive modules
- **Route structure** — All module routes defined with guards
- **Dashboard** — Stats cards, quick actions (conditional on modules), recent sales + alerts

### Key Files
- `src/store/profileStore.ts`
- `src/hooks/useLabel.ts`
- `src/components/layout/ModuleGuard.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/pages/dashboard/Dashboard.tsx`
- `src/App.tsx` — Full route tree

---

## Project Structure After Phase 1

```
BizCore/
├── electron/
│   ├── index.ts                    # Main process entry
│   ├── preload.ts                  # Context bridge
│   ├── database/
│   │   ├── db.ts                   # SQLite connection
│   │   ├── migrations/
│   │   │   ├── index.ts            # Table definitions
│   │   │   └── runner.ts           # Migration engine
│   │   ├── seeds/
│   │   │   ├── index.ts
│   │   │   ├── units.ts
│   │   │   ├── expense_categories.ts
│   │   │   └── settings.ts
│   │   └── repositories/
│   │       ├── auth.repo.ts
│   │       ├── profile.repo.ts
│   │       └── settings.repo.ts
│   └── handlers/
│       ├── index.ts
│       ├── auth.handler.ts
│       ├── profile.handler.ts
│       ├── settings.handler.ts
│       └── dialog.handler.ts
├── src/
│   ├── main.tsx                    # React entry
│   ├── App.tsx                     # Router + guards
│   ├── env.d.ts                    # Window API types
│   ├── assets/index.css            # Tailwind + CSS vars
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── profileStore.ts
│   │   └── uiStore.ts
│   ├── hooks/
│   │   ├── usePermissions.ts
│   │   ├── useModules.ts
│   │   └── useLabel.ts
│   ├── components/
│   │   ├── ui/ (17 components)
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       ├── MainLayout.tsx
│   │       └── ModuleGuard.tsx
│   ├── pages/
│   │   ├── auth/Login.tsx
│   │   ├── setup/SetupWizard.tsx
│   │   └── dashboard/Dashboard.tsx
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── formatters.ts
│   │   └── calculations.ts
│   └── constants/
│       └── modules.ts
├── package.json
├── electron.vite.config.ts
├── tailwind.config.js
└── electron-builder.yml
```

---

## What's Next: Phase 2 — Core Business
1. Products & Categories (full CRUD)
2. POS screen (cart, payment, receipt)
3. Sales list & detail
4. Basic dashboard with real data
