import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export interface QueryResult {
  rows: any[];
  affectedRows?: number;
  insertId?: any;
}

export interface TransactionClient {
  query: (sql: string, params?: any[]) => Promise<any[]>;
  execute: (sql: string, params?: any[]) => Promise<{ affectedRows: number; insertId?: any }>;
}

class UniversalDatabase {
  private mysqlPool: mysql.Pool | null = null;
  private sqliteDb: Database.Database | null = null;
  private isMysqlActive = false;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'smartmart_db';

    try {
      console.log(`[Database] Attempting connection to MySQL at ${host}:${port}/${database}...`);
      const testPool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 2000
      });

      // Test connection
      await testPool.query('SELECT 1');
      this.mysqlPool = testPool;
      this.isMysqlActive = true;
      console.log('✅ [Database] Successfully connected to production MySQL database.');
    } catch (err: any) {
      console.warn(`⚠️ [Database] MySQL not available (${err.message}). Activating high-performance local SQLite engine fallback.`);
      this.initSqlite();
    }

    this.initialized = true;
  }

  private initSqlite(): void {
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'smartmart.sqlite');
    this.sqliteDb = new Database(dbPath);
    this.sqliteDb.pragma('journal_mode = WAL');
    this.sqliteDb.pragma('foreign_keys = ON');
    this.isMysqlActive = false;

    // Apply SQLite schema
    this.initSqliteSchema();
    console.log(`✅ [Database] SQLite local database initialized at: ${dbPath}`);
  }

  private initSqliteSchema(): void {
    if (!this.sqliteDb) return;

    const sqliteDDL = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'CUSTOMER',
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT DEFAULT 'ShoppingBag',
        image_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT UNIQUE NOT NULL,
        barcode TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category_id TEXT NOT NULL,
        brand_id TEXT,
        unit TEXT NOT NULL DEFAULT 'piece',
        price REAL NOT NULL DEFAULT 0.0,
        cost_price REAL NOT NULL DEFAULT 0.0,
        mrp REAL NOT NULL DEFAULT 0.0,
        discount_percent REAL DEFAULT 0.0,
        gst_rate REAL NOT NULL DEFAULT 5.0,
        stock REAL NOT NULL DEFAULT 0.0,
        min_stock_alert REAL NOT NULL DEFAULT 10.0,
        is_weighted INTEGER DEFAULT 0,
        image_url TEXT,
        plu_code TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (brand_id) REFERENCES brands(id)
      );

      CREATE TABLE IF NOT EXISTS product_barcodes (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        barcode TEXT UNIQUE NOT NULL,
        barcode_type TEXT NOT NULL DEFAULT 'EAN13',
        is_primary INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        tax_id TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_batches (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        batch_number TEXT NOT NULL,
        initial_qty REAL NOT NULL,
        remaining_qty REAL NOT NULL,
        cost_price REAL NOT NULL,
        mfg_date TEXT,
        expiry_date TEXT NOT NULL,
        supplier_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      );

      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        batch_id TEXT,
        type TEXT NOT NULL,
        quantity REAL NOT NULL,
        reason TEXT,
        reference_id TEXT,
        user_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (batch_id) REFERENCES product_batches(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        purchase_number TEXT UNIQUE NOT NULL,
        supplier_id TEXT NOT NULL,
        invoice_number TEXT,
        total_amount REAL NOT NULL DEFAULT 0.0,
        status TEXT DEFAULT 'RECEIVED',
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS purchase_items (
        id TEXT PRIMARY KEY,
        purchase_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        batch_number TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_cost REAL NOT NULL,
        mfg_date TEXT,
        expiry_date TEXT NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        customer_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT UNIQUE NOT NULL,
        loyalty_points INTEGER NOT NULL DEFAULT 0,
        loyalty_tier TEXT DEFAULT 'Bronze',
        total_spent REAL DEFAULT 0.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS customer_addresses (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        min_order_amount REAL DEFAULT 0.0,
        max_discount_amount REAL,
        start_date TEXT DEFAULT CURRENT_TIMESTAMP,
        end_date TEXT,
        usage_limit INTEGER DEFAULT 1000,
        usage_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS cashier_sessions (
        id TEXT PRIMARY KEY,
        cashier_id TEXT NOT NULL,
        device_id TEXT DEFAULT 'POS-01',
        opening_cash REAL NOT NULL DEFAULT 0.0,
        closing_cash REAL DEFAULT 0.0,
        expected_cash REAL DEFAULT 0.0,
        actual_cash REAL DEFAULT 0.0,
        difference REAL DEFAULT 0.0,
        status TEXT DEFAULT 'OPEN',
        notes TEXT,
        opened_at TEXT DEFAULT CURRENT_TIMESTAMP,
        closed_at TEXT,
        FOREIGN KEY (cashier_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        cashier_id TEXT,
        session_id TEXT,
        subtotal REAL NOT NULL DEFAULT 0.0,
        discount_amount REAL NOT NULL DEFAULT 0.0,
        tax_amount REAL NOT NULL DEFAULT 0.0,
        total_amount REAL NOT NULL DEFAULT 0.0,
        payment_method TEXT NOT NULL DEFAULT 'CASH',
        payment_status TEXT NOT NULL DEFAULT 'PAID',
        sync_status TEXT DEFAULT 'ONLINE',
        idempotency_key TEXT UNIQUE,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (cashier_id) REFERENCES users(id),
        FOREIGN KEY (session_id) REFERENCES cashier_sessions(id)
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        batch_id TEXT,
        product_name TEXT NOT NULL,
        sku TEXT NOT NULL,
        unit TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        cost_price REAL NOT NULL,
        discount_amount REAL DEFAULT 0.0,
        tax_rate REAL NOT NULL DEFAULT 5.0,
        tax_amount REAL NOT NULL DEFAULT 0.0,
        total_amount REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (batch_id) REFERENCES product_batches(id)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        amount REAL NOT NULL,
        transaction_ref TEXT,
        provider_status TEXT DEFAULT 'SUCCESS',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS returns (
        id TEXT PRIMARY KEY,
        return_number TEXT UNIQUE NOT NULL,
        original_sale_id TEXT NOT NULL,
        customer_id TEXT,
        cashier_id TEXT NOT NULL,
        total_refund_amount REAL NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'APPROVED',
        approved_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (original_sale_id) REFERENCES sales(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (cashier_id) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS return_items (
        id TEXT PRIMARY KEY,
        return_id TEXT NOT NULL,
        sale_item_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        refund_amount REAL NOT NULL,
        condition_status TEXT DEFAULT 'RESELLABLE',
        restock_action TEXT DEFAULT 'RESTOCKED',
        FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_item_id) REFERENCES sale_items(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        session_id TEXT,
        user_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES cashier_sessions(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        device_info TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'INFO',
        is_read INTEGER DEFAULT 0,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS market_basket_rules (
        id TEXT PRIMARY KEY,
        antecedent_sku TEXT NOT NULL,
        antecedent_name TEXT NOT NULL,
        consequent_sku TEXT NOT NULL,
        consequent_name TEXT NOT NULL,
        support REAL NOT NULL,
        confidence REAL NOT NULL,
        lift REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS demand_forecasts (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        forecast_date TEXT NOT NULL,
        predicted_demand REAL NOT NULL,
        lower_bound REAL,
        upper_bound REAL,
        recommended_order REAL DEFAULT 0,
        confidence_score REAL DEFAULT 90.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS customer_segments (
        id TEXT PRIMARY KEY,
        customer_id TEXT UNIQUE NOT NULL,
        recency_days INTEGER NOT NULL,
        frequency_count INTEGER NOT NULL,
        monetary_total REAL NOT NULL,
        rfm_score TEXT NOT NULL,
        segment_name TEXT NOT NULL,
        churn_risk_score REAL NOT NULL,
        churn_risk_level TEXT NOT NULL,
        clv_estimate REAL NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS anomalies (
        id TEXT PRIMARY KEY,
        anomaly_type TEXT NOT NULL,
        severity TEXT DEFAULT 'MEDIUM',
        description TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        cashier_id TEXT,
        metadata TEXT,
        is_resolved INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cashier_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

    this.sqliteDb.exec(sqliteDDL);
  }

  isMySQL(): boolean {
    return this.isMysqlActive;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.initialized) await this.init();

    if (this.isMysqlActive && this.mysqlPool) {
      const [rows] = await this.mysqlPool.query(sql, params);
      return rows as T[];
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(sql);
      return stmt.all(...params) as T[];
    }
    throw new Error('No database driver connected.');
  }

  async execute(sql: string, params: any[] = []): Promise<{ affectedRows: number; insertId?: any }> {
    if (!this.initialized) await this.init();

    if (this.isMysqlActive && this.mysqlPool) {
      const [result]: any = await this.mysqlPool.execute(sql, params);
      return { affectedRows: result.affectedRows, insertId: result.insertId };
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(sql);
      const info = stmt.run(...params);
      return { affectedRows: info.changes, insertId: info.lastInsertRowid };
    }
    throw new Error('No database driver connected.');
  }

  async transaction<T>(callback: (trx: TransactionClient) => Promise<T>): Promise<T> {
    if (!this.initialized) await this.init();

    if (this.isMysqlActive && this.mysqlPool) {
      const connection = await this.mysqlPool.getConnection();
      await connection.beginTransaction();
      try {
        const trxClient: TransactionClient = {
          query: async (sql: string, params: any[] = []) => {
            const [rows] = await connection.query(sql, params);
            return rows as any[];
          },
          execute: async (sql: string, params: any[] = []) => {
            const [result]: any = await connection.execute(sql, params);
            return { affectedRows: result.affectedRows, insertId: result.insertId };
          }
        };
        const res = await callback(trxClient);
        await connection.commit();
        return res;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else if (this.sqliteDb) {
      const runTransaction = this.sqliteDb.transaction(() => {
        // SQLite sync wrapper
      });
      // For async callback in SQLite
      this.sqliteDb.exec('BEGIN TRANSACTION');
      try {
        const trxClient: TransactionClient = {
          query: async (sql: string, params: any[] = []) => {
            const stmt = this.sqliteDb!.prepare(sql);
            return stmt.all(...params);
          },
          execute: async (sql: string, params: any[] = []) => {
            const stmt = this.sqliteDb!.prepare(sql);
            const info = stmt.run(...params);
            return { affectedRows: info.changes, insertId: info.lastInsertRowid };
          }
        };
        const res = await callback(trxClient);
        this.sqliteDb.exec('COMMIT');
        return res;
      } catch (error) {
        this.sqliteDb.exec('ROLLBACK');
        throw error;
      }
    }
    throw new Error('No database driver connected.');
  }
}

export const db = new UniversalDatabase();
