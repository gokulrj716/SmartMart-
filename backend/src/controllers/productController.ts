import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { cacheService } from '../services/cache/cacheService';
import { logAuditEvent } from '../middleware/auditLogger';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      isWeighted,
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClauses: string[] = ['p.is_active = 1'];
    const params: any[] = [];

    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.plu_code LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (category) {
      whereClauses.push('(c.id = ? OR c.code = ?)');
      params.push(category, category);
    }

    if (brand) {
      whereClauses.push('p.brand_id = ?');
      params.push(brand);
    }

    if (minPrice) {
      whereClauses.push('p.price >= ?');
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      whereClauses.push('p.price <= ?');
      params.push(Number(maxPrice));
    }

    if (inStock === 'true') {
      whereClauses.push('p.stock > 0');
    }

    if (isWeighted === 'true') {
      whereClauses.push('p.is_weighted = 1');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRows = await db.query<any>(`
      SELECT COUNT(*) as total 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSql}
    `, params);

    const total = countRows[0]?.total || 0;

    const validSortCols: Record<string, string> = {
      name: 'p.name',
      price: 'p.price',
      stock: 'p.stock',
      created_at: 'p.created_at'
    };
    const sortCol = validSortCols[String(sortBy)] || 'p.name';
    const order = String(sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.code as category_code,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereSql}
      ORDER BY ${sortCol} ${order}
      LIMIT ? OFFSET ?
    `;

    const products = await db.query<any>(sql, [...params, Number(limit), offset]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch products: ' + err.message });
  }
};

export const getProductByBarcode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    if (!code) {
      res.status(400).json({ success: false, message: 'Barcode or code required' });
      return;
    }

    // Check cache first for lightning fast barcode scans
    const cacheKey = `barcode:${code}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_barcodes pb ON p.id = pb.product_id
      WHERE (p.barcode = ? OR p.sku = ? OR p.plu_code = ? OR pb.barcode = ?) AND p.is_active = 1
      LIMIT 1
    `;

    const rows = await db.query<any>(sql, [code, code, code, code]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: `No product found matching code '${code}'` });
      return;
    }

    const product = rows[0];
    await cacheService.set(cacheKey, product, 300); // 5 min cache

    res.json({ success: true, data: product });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Barcode scan lookup failed' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?
    `;
    const rows = await db.query<any>(sql, [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch product details' });
  }
};

export const generateInternalBarcode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, sku } = req.body;
    // Generate unique EAN/UPC style internal barcode starting with 200 (supermarket internal prefix)
    const timestampDigits = Date.now().toString().slice(-8);
    const internalBarcode = `200${timestampDigits}`;

    if (productId) {
      await db.execute(`
        INSERT INTO product_barcodes (id, product_id, barcode, barcode_type, is_primary, created_at)
        VALUES (?, ?, ?, 'INTERNAL', 0, datetime('now'))
      `, [uuidv4(), productId, internalBarcode]);
    }

    res.json({
      success: true,
      barcode: internalBarcode,
      format: 'CODE128 / EAN13',
      message: 'Internal printable barcode generated successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to generate internal barcode' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      sku,
      barcode,
      category_id,
      brand_id,
      unit = 'piece',
      price,
      cost_price,
      mrp,
      discount_percent = 0,
      gst_rate = 5,
      stock = 0,
      min_stock_alert = 10,
      is_weighted = false,
      image_url,
      plu_code,
      description
    } = req.body;

    if (!name || !sku || !category_id || price === undefined) {
      res.status(400).json({ success: false, message: 'Missing required product fields (name, sku, category, price)' });
      return;
    }

    const id = uuidv4();
    await db.execute(`
      INSERT INTO products (
        id, sku, barcode, name, description, category_id, brand_id, unit, price, cost_price, mrp,
        discount_percent, gst_rate, stock, min_stock_alert, is_weighted, image_url, plu_code, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `, [
      id, sku, barcode || null, name, description || null, category_id, brand_id || null, unit,
      Number(price), Number(cost_price || price * 0.8), Number(mrp || price * 1.1),
      Number(discount_percent), Number(gst_rate), Number(stock), Number(min_stock_alert),
      is_weighted ? 1 : 0, image_url || null, plu_code || null
    ]);

    await cacheService.delByPrefix('barcode:');

    await logAuditEvent({
      userId: req.user?.id,
      action: 'PRODUCT_CREATE',
      entity: 'products',
      entityId: id,
      newValues: { name, sku, price, stock }
    });

    res.status(201).json({ success: true, message: 'Product created successfully', id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create product: ' + err.message });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      name,
      barcode,
      price,
      cost_price,
      mrp,
      discount_percent,
      gst_rate,
      stock,
      min_stock_alert,
      is_weighted,
      image_url,
      plu_code,
      description
    } = req.body;

    const existing = await db.query<any>(`SELECT * FROM products WHERE id = ?`, [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    await db.execute(`
      UPDATE products SET
        name = COALESCE(?, name),
        barcode = COALESCE(?, barcode),
        price = COALESCE(?, price),
        cost_price = COALESCE(?, cost_price),
        mrp = COALESCE(?, mrp),
        discount_percent = COALESCE(?, discount_percent),
        gst_rate = COALESCE(?, gst_rate),
        stock = COALESCE(?, stock),
        min_stock_alert = COALESCE(?, min_stock_alert),
        is_weighted = COALESCE(?, is_weighted),
        image_url = COALESCE(?, image_url),
        plu_code = COALESCE(?, plu_code),
        description = COALESCE(?, description),
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      name, barcode, price !== undefined ? Number(price) : null,
      cost_price !== undefined ? Number(cost_price) : null,
      mrp !== undefined ? Number(mrp) : null,
      discount_percent !== undefined ? Number(discount_percent) : null,
      gst_rate !== undefined ? Number(gst_rate) : null,
      stock !== undefined ? Number(stock) : null,
      min_stock_alert !== undefined ? Number(min_stock_alert) : null,
      is_weighted !== undefined ? (is_weighted ? 1 : 0) : null,
      image_url, plu_code, description, id
    ]);

    await cacheService.delByPrefix('barcode:');

    await logAuditEvent({
      userId: req.user?.id,
      action: 'PRODUCT_UPDATE',
      entity: 'products',
      entityId: id,
      oldValues: existing[0],
      newValues: req.body
    });

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};
