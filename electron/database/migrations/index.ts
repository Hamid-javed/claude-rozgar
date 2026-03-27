export interface Migration {
  name: string
  sql: string
}

export const migrations: Migration[] = [
  {
    name: '001_initial_schema',
    sql: `
      -- Business configuration (single row)
      CREATE TABLE IF NOT EXISTS business_profile (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        logo_path TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        tax_id TEXT,
        currency_symbol TEXT DEFAULT 'Rs.',
        currency_code TEXT DEFAULT 'PKR',
        active_modules TEXT NOT NULL,
        custom_labels TEXT DEFAULT '{}',
        financial_year_start TEXT DEFAULT '01-01',
        invoice_prefix TEXT DEFAULT 'INV',
        invoice_counter INTEGER DEFAULT 1,
        receipt_footer TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Users / Staff accounts
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        permissions TEXT DEFAULT '{}',
        is_active INTEGER DEFAULT 1,
        last_login TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      -- Categories
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        business_type TEXT,
        color TEXT,
        icon TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      -- Units
      CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        abbreviation TEXT NOT NULL
      );

      -- Products
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        barcode TEXT,
        category_id INTEGER REFERENCES categories(id),
        unit_id INTEGER REFERENCES units(id),
        description TEXT,
        buy_price REAL DEFAULT 0,
        sale_price REAL DEFAULT 0,
        min_sale_price REAL DEFAULT 0,
        wholesale_price REAL DEFAULT 0,
        tax_percent REAL DEFAULT 0,
        image_path TEXT,
        track_stock INTEGER DEFAULT 1,
        current_stock REAL DEFAULT 0,
        min_stock_alert REAL DEFAULT 5,
        max_stock REAL DEFAULT 0,
        expiry_date TEXT,
        batch_number TEXT,
        manufacturer TEXT,
        serial_number TEXT,
        size_variants TEXT DEFAULT '[]',
        is_active INTEGER DEFAULT 1,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      -- Stock movements
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER REFERENCES products(id),
        movement_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        quantity_before REAL,
        quantity_after REAL,
        reference_id INTEGER,
        reference_type TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Suppliers
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        phone2 TEXT,
        email TEXT,
        address TEXT,
        area TEXT,
        opening_balance REAL DEFAULT 0,
        current_balance REAL DEFAULT 0,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      -- Customers
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        area TEXT,
        route_id INTEGER,
        customer_type TEXT DEFAULT 'retail',
        opening_balance REAL DEFAULT 0,
        current_balance REAL DEFAULT 0,
        credit_limit REAL DEFAULT 0,
        loyalty_points INTEGER DEFAULT 0,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      -- Ledger
      CREATE TABLE IF NOT EXISTS ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        party_type TEXT NOT NULL,
        party_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL,
        reference_id INTEGER,
        reference_type TEXT,
        description TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Sales
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        sale_date TEXT NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        customer_name TEXT,
        sale_type TEXT DEFAULT 'retail',
        subtotal REAL NOT NULL,
        discount_type TEXT,
        discount_value REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        grand_total REAL NOT NULL,
        amount_paid REAL DEFAULT 0,
        amount_due REAL DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        payment_details TEXT DEFAULT '{}',
        status TEXT DEFAULT 'paid',
        notes TEXT,
        table_number TEXT,
        waiter_id INTEGER,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      -- Sale items
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER REFERENCES sales(id),
        product_id INTEGER REFERENCES products(id),
        product_name TEXT NOT NULL,
        product_sku TEXT,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        buy_price REAL NOT NULL,
        discount_percent REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        tax_percent REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        line_total REAL NOT NULL,
        notes TEXT
      );

      -- Sale returns
      CREATE TABLE IF NOT EXISTS sale_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_number TEXT UNIQUE NOT NULL,
        original_sale_id INTEGER REFERENCES sales(id),
        return_date TEXT NOT NULL,
        return_reason TEXT,
        total_amount REAL NOT NULL,
        refund_method TEXT,
        status TEXT DEFAULT 'completed',
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sale_return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER REFERENCES sale_returns(id),
        sale_item_id INTEGER REFERENCES sale_items(id),
        product_id INTEGER REFERENCES products(id),
        product_name TEXT,
        quantity REAL NOT NULL,
        unit_price REAL,
        line_total REAL
      );

      -- Purchases
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_number TEXT UNIQUE NOT NULL,
        purchase_date TEXT NOT NULL,
        supplier_id INTEGER REFERENCES suppliers(id),
        supplier_name TEXT,
        subtotal REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        shipping_cost REAL DEFAULT 0,
        grand_total REAL NOT NULL,
        amount_paid REAL DEFAULT 0,
        amount_due REAL DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        status TEXT DEFAULT 'received',
        invoice_ref TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER REFERENCES purchases(id),
        product_id INTEGER REFERENCES products(id),
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_cost REAL NOT NULL,
        tax_percent REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        line_total REAL NOT NULL,
        expiry_date TEXT,
        batch_number TEXT
      );

      -- Expense categories
      CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        is_daily INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      -- Expenses
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_date TEXT NOT NULL,
        category_id INTEGER REFERENCES expense_categories(id),
        category_name TEXT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        paid_to TEXT,
        reference TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      -- Staff
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        cnic TEXT,
        designation TEXT,
        department TEXT,
        salary_type TEXT DEFAULT 'monthly',
        salary_amount REAL DEFAULT 0,
        join_date TEXT,
        user_id INTEGER REFERENCES users(id),
        is_active INTEGER DEFAULT 1,
        notes TEXT,
        photo_path TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      -- Attendance
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER REFERENCES staff(id),
        attendance_date TEXT NOT NULL,
        status TEXT NOT NULL,
        check_in TEXT,
        check_out TEXT,
        overtime_hours REAL DEFAULT 0,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Payroll
      CREATE TABLE IF NOT EXISTS payroll (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER REFERENCES staff(id),
        month TEXT NOT NULL,
        base_salary REAL,
        days_present INTEGER,
        days_absent INTEGER,
        overtime_amount REAL DEFAULT 0,
        bonuses REAL DEFAULT 0,
        deductions REAL DEFAULT 0,
        advance_deduction REAL DEFAULT 0,
        net_salary REAL NOT NULL,
        payment_date TEXT,
        payment_method TEXT DEFAULT 'cash',
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Staff advances
      CREATE TABLE IF NOT EXISTS staff_advances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER REFERENCES staff(id),
        advance_date TEXT NOT NULL,
        amount REAL NOT NULL,
        reason TEXT,
        recovered_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Discounts
      CREATE TABLE IF NOT EXISTS discounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        discount_type TEXT NOT NULL,
        value REAL,
        min_purchase REAL DEFAULT 0,
        applies_to TEXT DEFAULT 'all',
        applies_ids TEXT DEFAULT '[]',
        customer_type TEXT DEFAULT 'all',
        start_date TEXT,
        end_date TEXT,
        is_active INTEGER DEFAULT 1,
        usage_count INTEGER DEFAULT 0,
        max_uses INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );

      -- Invoices
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        invoice_type TEXT NOT NULL,
        reference_id INTEGER,
        reference_type TEXT,
        party_type TEXT,
        party_id INTEGER,
        party_name TEXT,
        total_amount REAL,
        status TEXT DEFAULT 'unpaid',
        due_date TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Payments
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_date TEXT NOT NULL,
        payment_type TEXT NOT NULL,
        party_type TEXT,
        party_id INTEGER,
        party_name TEXT,
        amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        reference_number TEXT,
        bank_name TEXT,
        invoice_id INTEGER,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Restaurant tables
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number TEXT NOT NULL,
        capacity INTEGER DEFAULT 4,
        area TEXT,
        status TEXT DEFAULT 'free',
        current_order_id INTEGER,
        notes TEXT
      );

      -- Recipes
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER REFERENCES products(id),
        name TEXT NOT NULL,
        serves INTEGER DEFAULT 1,
        preparation_time INTEGER,
        instructions TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER REFERENCES recipes(id),
        ingredient_id INTEGER REFERENCES products(id),
        quantity REAL NOT NULL,
        unit_id INTEGER REFERENCES units(id),
        notes TEXT
      );

      -- Routes (supply company)
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        area TEXT,
        salesperson_id INTEGER REFERENCES staff(id),
        visit_days TEXT DEFAULT '[]',
        notes TEXT,
        is_active INTEGER DEFAULT 1
      );

      -- Settings
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Audit log
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        old_value TEXT,
        new_value TEXT,
        ip_address TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
      CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
      CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_sales_deleted ON sales(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
      CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
      CREATE INDEX IF NOT EXISTS idx_ledger_party ON ledger(party_type, party_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, attendance_date);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
    `
  }
]
