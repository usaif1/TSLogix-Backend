const Database = require("better-sqlite3");
const path = require("path");

// 1. Construct the path to your SQLite file
const dbPath = path.join(__dirname, "mydatabase.db");

// 2. Create (or open) the database
// Pass options if you want, e.g. { verbose: console.log } for logging
const db = new Database(dbPath);

// 3. Optionally create tables if they don't exist
// Create tables with enhanced schema
db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    organization_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT,
    tax_id TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS roles (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT,  -- JSON string: {"create_order": true, "delete_user": false}
    is_default BOOLEAN DEFAULT FALSE,
    organization_id TEXT,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    last_login DATETIME,
    mfa_secret TEXT,
    password_reset_token TEXT,
    password_reset_expiry DATETIME,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'locked', 'deleted')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
  );

  CREATE TABLE IF NOT EXISTS order_types (
    order_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    schema TEXT  -- JSON string defining required fields
  );

  CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    order_type_id INTEGER NOT NULL,
    status TEXT CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'completed')),
    priority INTEGER CHECK (priority BETWEEN 1 AND 5),
    reference_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    due_date DATETIME,
    notes TEXT,
    metadata TEXT,  -- JSON string for custom fields
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
    FOREIGN KEY (order_type_id) REFERENCES order_types(order_type_id)
  );

  CREATE TABLE IF NOT EXISTS entry_orders (
    order_id TEXT PRIMARY KEY,
    origin_country TEXT NOT NULL,
    entry_port TEXT,
    customs_declaration_number TEXT,
    expected_arrival DATETIME,
    actual_arrival DATETIME,
    storage_location TEXT,
    inspection_required BOOLEAN DEFAULT FALSE,
    inspection_report_url TEXT,
    items TEXT,  -- JSON string: [{"name": "Item1", "quantity": 5}]
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS departure_orders (
    order_id TEXT PRIMARY KEY,
    destination_country TEXT NOT NULL,
    carrier_name TEXT,
    tracking_number TEXT,
    shipping_method TEXT CHECK (shipping_method IN ('air', 'sea', 'land')),
    departure_date DATETIME,
    estimated_delivery DATETIME,
    insurance_amount REAL,
    export_license_number TEXT,
    bill_of_lading_url TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_values TEXT,
    new_values TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );

  CREATE TABLE IF NOT EXISTS attachments (
    attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    description TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
  );
`);

// 4. Export the db instance
module.exports = db;
