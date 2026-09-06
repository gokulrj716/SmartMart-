import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

export const runSeed = async () => {
  console.log('🌱 [Seed] Starting comprehensive supermarket database seed...');
  await db.init();

  // Clear existing data in correct order
  console.log('🧹 [Seed] Cleaning existing tables...');
  const tables = [
    'anomalies', 'demand_forecasts', 'market_basket_rules', 'customer_segments',
    'audit_logs', 'notifications', 'expenses', 'return_items', 'returns',
    'payments', 'sale_items', 'sales', 'cashier_sessions', 'coupons',
    'customer_addresses', 'customers', 'purchase_items', 'purchases',
    'inventory_transactions', 'product_batches', 'suppliers', 'product_barcodes',
    'products', 'brands', 'categories', 'users'
  ];

  for (const table of tables) {
    try {
      await db.execute(`DELETE FROM ${table}`);
    } catch (e) {
      // Table might not exist yet
    }
  }

  // 1. SEED USERS
  console.log('👤 [Seed] Seeding users with role-based access...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  const adminHash = await bcrypt.hash('admin123', salt);

  const users = [
    { id: 'usr-admin-1', name: 'Rajesh Sharma (Admin)', email: 'admin@smartmart.com', password: adminHash, role: 'ADMIN', phone: '9876543210' },
    { id: 'usr-mgr-1', name: 'Priya Mehta (Store Manager)', email: 'manager@smartmart.com', password: passwordHash, role: 'MANAGER', phone: '9876543211' },
    { id: 'usr-csh-1', name: 'Rahul Verma (Head Cashier)', email: 'cashier1@smartmart.com', password: passwordHash, role: 'CASHIER', phone: '9876543212' },
    { id: 'usr-csh-2', name: 'Anita Das (Cashier POS-02)', email: 'cashier2@smartmart.com', password: passwordHash, role: 'CASHIER', phone: '9876543213' },
    { id: 'usr-inv-1', name: 'Vikram Singh (Inventory Lead)', email: 'inventory@smartmart.com', password: passwordHash, role: 'INVENTORY_STAFF', phone: '9876543214' },
    { id: 'usr-cst-1', name: 'Swetha K (Customer)', email: 'customer@gmail.com', password: passwordHash, role: 'CUSTOMER', phone: '9812345678' }
  ];

  for (const u of users) {
    await db.execute(`
      INSERT INTO users (id, name, email, password_hash, role, phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
    `, [u.id, u.name, u.email, u.password, u.role, u.phone]);
  }

  // 2. SEED CATEGORIES
  console.log('🏬 [Seed] Seeding 10 supermarket departments & categories...');
  const categories = [
    { id: 'cat-gro', code: 'GROCERY', name: 'Grocery & Staples', description: 'Flours, rice, pulses, cooking oils, and spices', icon: 'Wheat' },
    { id: 'cat-frt', code: 'FRUITS', name: 'Fresh Fruits', description: 'Farm fresh seasonal fruits and premium imports', icon: 'Apple' },
    { id: 'cat-veg', code: 'VEGETABLES', name: 'Fresh Vegetables', description: 'Locally sourced daily fresh vegetables and greens', icon: 'Carrot' },
    { id: 'cat-dry', code: 'DAIRY', name: 'Dairy & Eggs', description: 'Fresh milk, butter, cheese, paneer, and eggs', icon: 'Milk' },
    { id: 'cat-bak', code: 'BAKERY', name: 'Bakery & Cakes', description: 'Artisan breads, buns, cakes, and morning bakes', icon: 'Croissant' },
    { id: 'cat-bev', code: 'BEVERAGES', name: 'Beverages & Juices', description: 'Cold drinks, natural juices, tea, and premium coffee', icon: 'Coffee' },
    { id: 'cat-snk', code: 'SNACKS', name: 'Snacks & Confectionery', description: 'Crisps, biscuits, chocolates, and Indian namkeen', icon: 'Cookie' },
    { id: 'cat-per', code: 'PERSONAL', name: 'Personal Care', description: 'Soaps, shampoos, oral care, and skin essentials', icon: 'Sparkles' },
    { id: 'cat-hsh', code: 'HOUSEHOLD', name: 'Household & Cleaning', description: 'Detergents, floor cleaners, and kitchen wipes', icon: 'Home' },
    { id: 'cat-frz', code: 'FROZEN', name: 'Frozen Foods', description: 'Frozen peas, snacks, ice creams, and ready-to-fry', icon: 'Snowflake' }
  ];

  for (const c of categories) {
    await db.execute(`
      INSERT INTO categories (id, name, code, description, icon, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
    `, [c.id, c.name, c.code, c.description, c.icon]);
  }

  // 3. SEED BRANDS
  console.log('🏷️ [Seed] Seeding FMCG brands...');
  const brands = [
    { id: 'br-amul', name: 'Amul' },
    { id: 'br-brit', name: 'Britannia' },
    { id: 'br-nest', name: 'Nestle' },
    { id: 'br-tata', name: 'Tata Consumer' },
    { id: 'br-fort', name: 'Fortune' },
    { id: 'br-hald', name: 'Haldirams' },
    { id: 'br-coca', name: 'Coca-Cola' },
    { id: 'br-cadb', name: 'Cadbury' },
    { id: 'br-hul', name: 'Hindustan Unilever' },
    { id: 'br-farm', name: 'SmartMart Farm Fresh' }
  ];

  for (const b of brands) {
    await db.execute(`INSERT INTO brands (id, name, is_active) VALUES (?, ?, 1)`, [b.id, b.name]);
  }

  // 4. SEED SUPPLIERS
  console.log('🚚 [Seed] Seeding suppliers...');
  const suppliers = [
    { id: 'sup-1', name: 'Metro Cash & Carry Wholesale', contact: 'Ramesh Gupta', email: 'orders@metro.in', phone: '080-22334455', taxId: '29AABCM1234Z1' },
    { id: 'sup-2', name: 'Greenfield Organic Produce Co', contact: 'Suresh Patel', email: 'sales@greenfield.farm', phone: '9845012345', taxId: '29AABCG5678Y2' },
    { id: 'sup-3', name: 'Amul Dairy Distributors Ltd', contact: 'Ketan Shah', email: 'supply@amuldist.in', phone: '022-87654321', taxId: '27AABCA9012X3' },
    { id: 'sup-4', name: 'Hindustan Unilever National Logistics', contact: 'Deepak Roy', email: 'fmcg@hulsupply.com', phone: '011-44556677', taxId: '07AABCH3456W4' }
  ];

  for (const s of suppliers) {
    await db.execute(`
      INSERT INTO suppliers (id, name, contact_person, email, phone, tax_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [s.id, s.name, s.contact, s.email, s.phone, s.taxId]);
  }

  // 5. SEED 45+ SUPERMARKET PRODUCTS
  console.log('🛒 [Seed] Seeding 45+ authentic supermarket catalog items with barcodes and PLUs...');
  const products = [
    // --- Fresh Vegetables (Weighted + PLU) ---
    { id: 'prod-veg-001', sku: 'SM-VEG-TOMATO', barcode: '8901234500018', name: 'Fresh Farm Tomatoes', categoryId: 'cat-veg', brandId: 'br-farm', unit: 'kg', price: 40.0, costPrice: 28.0, mrp: 50.0, gstRate: 0.0, stock: 85.5, minAlert: 20.0, isWeighted: 1, plu: '4087', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500' },
    { id: 'prod-veg-002', sku: 'SM-VEG-POTATO', barcode: '8901234500025', name: 'Organic Red Potatoes', categoryId: 'cat-veg', brandId: 'br-farm', unit: 'kg', price: 35.0, costPrice: 22.0, mrp: 45.0, gstRate: 0.0, stock: 140.0, minAlert: 30.0, isWeighted: 1, plu: '4072', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500' },
    { id: 'prod-veg-003', sku: 'SM-VEG-ONION', barcode: '8901234500032', name: 'Nashik Red Onions', categoryId: 'cat-veg', brandId: 'br-farm', unit: 'kg', price: 45.0, costPrice: 32.0, mrp: 55.0, gstRate: 0.0, stock: 120.0, minAlert: 25.0, isWeighted: 1, plu: '4068', img: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=500' },
    { id: 'prod-veg-004', sku: 'SM-VEG-CARROT', barcode: '8901234500049', name: 'Tender Orange Carrots', categoryId: 'cat-veg', brandId: 'br-farm', unit: 'kg', price: 50.0, costPrice: 35.0, mrp: 65.0, gstRate: 0.0, stock: 45.0, minAlert: 15.0, isWeighted: 1, plu: '4562', img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500' },
    { id: 'prod-veg-005', sku: 'SM-VEG-CAPS', barcode: '8901234500056', name: 'Green Bell Peppers (Capsicum)', categoryId: 'cat-veg', brandId: 'br-farm', unit: 'kg', price: 70.0, costPrice: 50.0, mrp: 85.0, gstRate: 0.0, stock: 32.0, minAlert: 10.0, isWeighted: 1, plu: '4065', img: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500' },

    // --- Fresh Fruits (Weighted + PLU) ---
    { id: 'prod-frt-001', sku: 'SM-FRT-APPLE', barcode: '8901234500063', name: 'Royal Gala Apples', categoryId: 'cat-frt', brandId: 'br-farm', unit: 'kg', price: 180.0, costPrice: 135.0, mrp: 210.0, gstRate: 0.0, stock: 55.0, minAlert: 15.0, isWeighted: 1, plu: '4131', img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500' },
    { id: 'prod-frt-002', sku: 'SM-FRT-BANANA', barcode: '8901234500070', name: 'Robusta Golden Bananas', categoryId: 'cat-frt', brandId: 'br-farm', unit: 'dozen', price: 60.0, costPrice: 42.0, mrp: 70.0, gstRate: 0.0, stock: 75.0, minAlert: 20.0, isWeighted: 0, plu: '4011', img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500' },
    { id: 'prod-frt-003', sku: 'SM-FRT-ORANGE', barcode: '8901234500087', name: 'Nagpur Sweet Oranges', categoryId: 'cat-frt', brandId: 'br-farm', unit: 'kg', price: 90.0, costPrice: 65.0, mrp: 110.0, gstRate: 0.0, stock: 40.0, minAlert: 15.0, isWeighted: 1, plu: '4012', img: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=500' },
    { id: 'prod-frt-004', sku: 'SM-FRT-MANGO', barcode: '8901234500094', name: 'Alphonso Ratnagiri Mangoes', categoryId: 'cat-frt', brandId: 'br-farm', unit: 'box', price: 650.0, costPrice: 500.0, mrp: 750.0, gstRate: 0.0, stock: 18.0, minAlert: 5.0, isWeighted: 0, plu: '4312', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500' },

    // --- Dairy & Eggs ---
    { id: 'prod-dry-001', sku: 'SM-DRY-MILK1L', barcode: '8901262010014', name: 'Amul Taaza Homogenised Milk 1L', categoryId: 'cat-dry', brandId: 'br-amul', unit: 'litre', price: 72.0, costPrice: 62.0, mrp: 74.0, gstRate: 0.0, stock: 120.0, minAlert: 30.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500' },
    { id: 'prod-dry-002', sku: 'SM-DRY-BUTR500', barcode: '8901262010021', name: 'Amul Salted Butter 500g', categoryId: 'cat-dry', brandId: 'br-amul', unit: 'pack', price: 275.0, costPrice: 240.0, mrp: 285.0, gstRate: 12.0, stock: 60.0, minAlert: 15.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500' },
    { id: 'prod-dry-003', sku: 'SM-DRY-PANR200', barcode: '8901262010038', name: 'Amul Fresh Malai Paneer 200g', categoryId: 'cat-dry', brandId: 'br-amul', unit: 'pack', price: 95.0, costPrice: 80.0, mrp: 100.0, gstRate: 5.0, stock: 45.0, minAlert: 10.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500' },
    { id: 'prod-dry-004', sku: 'SM-DRY-EGGS12', barcode: '8901262010045', name: 'Farm Fresh White Eggs (Pack of 12)', categoryId: 'cat-dry', brandId: 'br-farm', unit: 'pack', price: 90.0, costPrice: 72.0, mrp: 105.0, gstRate: 0.0, stock: 80.0, minAlert: 20.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500' },
    { id: 'prod-dry-005', sku: 'SM-DRY-CURD400', barcode: '8901262010052', name: 'Amul Masti Dahi 400g Pouch', categoryId: 'cat-dry', brandId: 'br-amul', unit: 'pack', price: 35.0, costPrice: 28.0, mrp: 35.0, gstRate: 5.0, stock: 9.0, minAlert: 15.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500' }, // Low stock!

    // --- Bakery ---
    { id: 'prod-bak-001', sku: 'SM-BAK-BRD400', barcode: '8901063011119', name: 'Britannia 100% Whole Wheat Bread 400g', categoryId: 'cat-bak', brandId: 'br-brit', unit: 'pack', price: 50.0, costPrice: 38.0, mrp: 55.0, gstRate: 0.0, stock: 40.0, minAlert: 10.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500' },
    { id: 'prod-bak-002', sku: 'SM-BAK-BUN6', barcode: '8901063011126', name: 'Fresh Burger Buns (Pack of 6)', categoryId: 'cat-bak', brandId: 'br-farm', unit: 'pack', price: 40.0, costPrice: 28.0, mrp: 45.0, gstRate: 5.0, stock: 25.0, minAlert: 8.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500' },
    { id: 'prod-bak-003', sku: 'SM-BAK-CAKE-CHOC', barcode: '8901063011133', name: 'Britannia Chocolate Fudge Cake 250g', categoryId: 'cat-bak', brandId: 'br-brit', unit: 'pack', price: 120.0, costPrice: 95.0, mrp: 130.0, gstRate: 18.0, stock: 35.0, minAlert: 10.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500' },

    // --- Grocery & Staples ---
    { id: 'prod-gro-001', sku: 'SM-GRO-RICE5KG', barcode: '8901725181234', name: 'India Gate Basmati Rice Classic 5kg', categoryId: 'cat-gro', brandId: 'br-fort', unit: 'pack', price: 560.0, costPrice: 470.0, mrp: 650.0, gstRate: 5.0, stock: 50.0, minAlert: 15.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500' },
    { id: 'prod-gro-002', sku: 'SM-GRO-AATA10K', barcode: '8901725181241', name: 'Aashirvaad Shudh Chakki Atta 10kg', categoryId: 'cat-gro', brandId: 'br-hul', unit: 'pack', price: 440.0, costPrice: 380.0, mrp: 490.0, gstRate: 5.0, stock: 65.0, minAlert: 20.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500' },
    { id: 'prod-gro-003', sku: 'SM-GRO-OIL1L', barcode: '8901725181258', name: 'Fortune Sunlite Refined Sunflower Oil 1L', categoryId: 'cat-gro', brandId: 'br-fort', unit: 'litre', price: 145.0, costPrice: 125.0, mrp: 165.0, gstRate: 5.0, stock: 90.0, minAlert: 25.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500' },
    { id: 'prod-gro-004', sku: 'SM-GRO-DAL1KG', barcode: '8901725181265', name: 'Tata Sampann Unpolished Toor Dal 1kg', categoryId: 'cat-gro', brandId: 'br-tata', unit: 'pack', price: 175.0, costPrice: 148.0, mrp: 195.0, gstRate: 5.0, stock: 70.0, minAlert: 20.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=500' },
    { id: 'prod-gro-005', sku: 'SM-GRO-SALT1K', barcode: '8901725181272', name: 'Tata Salt Vacuum Evaporated Iodized 1kg', categoryId: 'cat-gro', brandId: 'br-tata', unit: 'pack', price: 28.0, costPrice: 22.0, mrp: 30.0, gstRate: 0.0, stock: 200.0, minAlert: 40.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=500' },
    { id: 'prod-gro-006', sku: 'SM-GRO-SUG1KG', barcode: '8901725181289', name: 'Madhur Pure & Hygienic Sugar 1kg', categoryId: 'cat-gro', brandId: 'br-fort', unit: 'pack', price: 52.0, costPrice: 44.0, mrp: 58.0, gstRate: 5.0, stock: 150.0, minAlert: 30.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=500' },

    // --- Beverages ---
    { id: 'prod-bev-001', sku: 'SM-BEV-COKE750', barcode: '8901764012345', name: 'Coca-Cola Original Taste 750ml Bottle', categoryId: 'cat-bev', brandId: 'br-coca', unit: 'piece', price: 40.0, costPrice: 32.0, mrp: 40.0, gstRate: 28.0, stock: 110.0, minAlert: 30.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500' },
    { id: 'prod-bev-002', sku: 'SM-BEV-TEA500G', barcode: '8901764012352', name: 'Tata Tea Gold Leaf Pouch 500g', categoryId: 'cat-bev', brandId: 'br-tata', unit: 'pack', price: 285.0, costPrice: 240.0, mrp: 310.0, gstRate: 5.0, stock: 60.0, minAlert: 15.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500' },
    { id: 'prod-bev-003', sku: 'SM-BEV-COF100G', barcode: '8901764012369', name: 'Nescafe Classic Instant Coffee Jar 100g', categoryId: 'cat-bev', brandId: 'br-nest', unit: 'piece', price: 340.0, costPrice: 285.0, mrp: 360.0, gstRate: 18.0, stock: 45.0, minAlert: 12.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500' },
    { id: 'prod-bev-004', sku: 'SM-BEV-JUIC1L', barcode: '8901764012376', name: 'Real Mixed Fruit Delight Juice 1L', categoryId: 'cat-bev', brandId: 'br-farm', unit: 'pack', price: 115.0, costPrice: 92.0, mrp: 130.0, gstRate: 12.0, stock: 55.0, minAlert: 15.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500' },

    // --- Snacks & Confectionery ---
    { id: 'prod-snk-001', sku: 'SM-SNK-PARLE10', barcode: '8901719101017', name: 'Parle-G Original Gluco Biscuits 800g', categoryId: 'cat-snk', brandId: 'br-brit', unit: 'pack', price: 80.0, costPrice: 65.0, mrp: 90.0, gstRate: 18.0, stock: 120.0, minAlert: 30.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500' },
    { id: 'prod-snk-002', sku: 'SM-SNK-BHUJ400', barcode: '8901719101024', name: 'Haldirams Aloo Bhujia Namkeen 400g', categoryId: 'cat-snk', brandId: 'br-hald', unit: 'pack', price: 110.0, costPrice: 88.0, mrp: 125.0, gstRate: 12.0, stock: 85.0, minAlert: 20.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281609?w=500' },
    { id: 'prod-snk-003', sku: 'SM-SNK-CADB150', barcode: '8901719101031', name: 'Cadbury Dairy Milk Silk Chocolate 150g', categoryId: 'cat-snk', brandId: 'br-cadb', unit: 'piece', price: 175.0, costPrice: 145.0, mrp: 185.0, gstRate: 18.0, stock: 70.0, minAlert: 15.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500' },
    { id: 'prod-snk-004', sku: 'SM-SNK-MAGGI4P', barcode: '8901719101048', name: 'Maggi 2-Minute Masala Noodles (Pack of 4)', categoryId: 'cat-snk', brandId: 'br-nest', unit: 'pack', price: 56.0, costPrice: 46.0, mrp: 60.0, gstRate: 18.0, stock: 150.0, minAlert: 35.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500' },
    { id: 'prod-snk-005', sku: 'SM-SNK-LAYS50G', barcode: '8901719101055', name: 'Lays Classic Salted Potato Chips 50g', categoryId: 'cat-snk', brandId: 'br-farm', unit: 'pack', price: 20.0, costPrice: 16.0, mrp: 20.0, gstRate: 12.0, stock: 130.0, minAlert: 30.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500' },

    // --- Personal Care ---
    { id: 'prod-per-001', sku: 'SM-PER-COLG150', barcode: '8901314012019', name: 'Colgate Strong Teeth Dental Paste 150g', categoryId: 'cat-per', brandId: 'br-hul', unit: 'piece', price: 98.0, costPrice: 80.0, mrp: 108.0, gstRate: 18.0, stock: 80.0, minAlert: 20.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1559591937-e1a53924f7f6?w=500' },
    { id: 'prod-per-002', sku: 'SM-PER-DOVE3P', barcode: '8901314012026', name: 'Dove Cream Beauty Bathing Bar (Pack of 3)', categoryId: 'cat-per', brandId: 'br-hul', unit: 'pack', price: 165.0, costPrice: 135.0, mrp: 185.0, gstRate: 18.0, stock: 50.0, minAlert: 15.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1608248597359-00995d311311?w=500' },
    { id: 'prod-per-003', sku: 'SM-PER-SHMP340', barcode: '8901314012033', name: 'Head & Shoulders Anti-Dandruff Shampoo 340ml', categoryId: 'cat-per', brandId: 'br-hul', unit: 'piece', price: 295.0, costPrice: 245.0, mrp: 330.0, gstRate: 18.0, stock: 40.0, minAlert: 10.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500' },

    // --- Household Essentials ---
    { id: 'prod-hsh-001', sku: 'SM-HSH-SURF1KG', barcode: '8901030701017', name: 'Surf Excel Quick Wash Detergent Powder 1kg', categoryId: 'cat-hsh', brandId: 'br-hul', unit: 'pack', price: 145.0, costPrice: 120.0, mrp: 160.0, gstRate: 18.0, stock: 75.0, minAlert: 20.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=500' },
    { id: 'prod-hsh-002', sku: 'SM-HSH-VIM500', barcode: '8901030701024', name: 'Vim Lemon Dishwash Gel Bottle 500ml', categoryId: 'cat-hsh', brandId: 'br-hul', unit: 'piece', price: 110.0, costPrice: 90.0, mrp: 120.0, gstRate: 18.0, stock: 65.0, minAlert: 15.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500' },
    { id: 'prod-hsh-003', sku: 'SM-HSH-LYSOL1L', barcode: '8901030701031', name: 'Lizol Citrus Disinfectant Surface Cleaner 1L', categoryId: 'cat-hsh', brandId: 'br-hul', unit: 'piece', price: 195.0, costPrice: 160.0, mrp: 215.0, gstRate: 18.0, stock: 50.0, minAlert: 12.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500' },

    // --- Frozen Foods ---
    { id: 'prod-frz-001', sku: 'SM-FRZ-PEAS1KG', barcode: '8901262040011', name: 'Safal Select Green Peas 1kg', categoryId: 'cat-frz', brandId: 'br-farm', unit: 'pack', price: 130.0, costPrice: 105.0, mrp: 150.0, gstRate: 0.0, stock: 40.0, minAlert: 10.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=500' },
    { id: 'prod-frz-002', sku: 'SM-FRZ-FRYS400', barcode: '8901262040028', name: 'McCain French Fries Crispy 400g', categoryId: 'cat-frz', brandId: 'br-farm', unit: 'pack', price: 115.0, costPrice: 92.0, mrp: 130.0, gstRate: 12.0, stock: 35.0, minAlert: 10.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500' },
    { id: 'prod-frz-003', sku: 'SM-FRZ-ICEC1L', barcode: '8901262040035', name: 'Amul Vanilla Gold Ice Cream Tub 1L', categoryId: 'cat-frz', brandId: 'br-amul', unit: 'pack', price: 180.0, costPrice: 145.0, mrp: 200.0, gstRate: 18.0, stock: 30.0, minAlert: 8.0, isWeighted: 0, img: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500' }
  ];

  for (const p of products) {
    await db.execute(`
      INSERT INTO products (
        id, sku, barcode, name, category_id, brand_id, unit, price, cost_price, mrp,
        discount_percent, gst_rate, stock, min_stock_alert, is_weighted, image_url, plu_code, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `, [
      p.id, p.sku, p.barcode, p.name, p.categoryId, p.brandId, p.unit,
      p.price, p.costPrice, p.mrp, p.gstRate, p.stock, p.minAlert,
      p.isWeighted, p.img, p.plu || null
    ]);

    // Primary barcode lookup table
    await db.execute(`
      INSERT INTO product_barcodes (id, product_id, barcode, barcode_type, is_primary, created_at)
      VALUES (?, ?, ?, 'EAN13', 1, datetime('now'))
    `, [uuidv4(), p.id, p.barcode]);
  }

  // 6. SEED PRODUCT BATCHES FOR FEFO TRACKING (Varied expiry dates)
  console.log('📦 [Seed] Seeding FEFO product batches with varied expiry dates...');
  const now = new Date();
  
  // Healthy batches (Expiry in 2027)
  const futureExp = new Date(now);
  futureExp.setMonth(futureExp.getMonth() + 10);
  const futureExpStr = futureExp.toISOString().split('T')[0];

  // Expiring in 20 days (Warning status)
  const warningExp = new Date(now);
  warningExp.setDate(warningExp.getDate() + 20);
  const warningExpStr = warningExp.toISOString().split('T')[0];

  // Expiring in 4 days (Critical status)
  const criticalExp = new Date(now);
  criticalExp.setDate(criticalExp.getDate() + 4);
  const criticalExpStr = criticalExp.toISOString().split('T')[0];

  // Already Expired (Shrinkage write-off demonstration)
  const expiredExp = new Date(now);
  expiredExp.setDate(expiredExp.getDate() - 10);
  const expiredExpStr = expiredExp.toISOString().split('T')[0];

  const batches = [
    // Milk batches (Fast perishable)
    { id: 'bat-milk-1', prodId: 'prod-dry-001', number: 'BAT-MLK-001', initial: 100, remaining: 80, cost: 62.0, exp: criticalExpStr, supId: 'sup-3' },
    { id: 'bat-milk-2', prodId: 'prod-dry-001', number: 'BAT-MLK-002', initial: 50, remaining: 40, cost: 62.0, exp: warningExpStr, supId: 'sup-3' },
    // Bread batches
    { id: 'bat-brd-1', prodId: 'prod-bak-001', number: 'BAT-BRD-001', initial: 50, remaining: 25, cost: 38.0, exp: criticalExpStr, supId: 'sup-1' },
    { id: 'bat-brd-2', prodId: 'prod-bak-001', number: 'BAT-BRD-002', initial: 30, remaining: 15, cost: 38.0, exp: warningExpStr, supId: 'sup-1' },
    // Dahi Curd expired batch for demo
    { id: 'bat-crd-exp', prodId: 'prod-dry-005', number: 'BAT-CRD-EXP', initial: 20, remaining: 9, cost: 28.0, exp: expiredExpStr, supId: 'sup-3' },
    // Tomato batch
    { id: 'bat-tom-1', prodId: 'prod-veg-001', number: 'BAT-TOM-001', initial: 100, remaining: 85.5, cost: 28.0, exp: criticalExpStr, supId: 'sup-2' },
    // Rice long term batch
    { id: 'bat-ric-1', prodId: 'prod-gro-001', number: 'BAT-RIC-001', initial: 60, remaining: 50, cost: 470.0, exp: futureExpStr, supId: 'sup-1' }
  ];

  for (const b of batches) {
    await db.execute(`
      INSERT INTO product_batches (
        id, product_id, batch_number, initial_qty, remaining_qty, cost_price, mfg_date, expiry_date, supplier_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, date('now', '-10 days'), ?, ?, datetime('now'))
    `, [b.id, b.prodId, b.number, b.initial, b.remaining, b.cost, b.exp, b.supId]);
  }

  // 7. SEED CUSTOMERS
  console.log('👥 [Seed] Seeding customer loyalty profiles across tiers...');
  const customers = [
    { id: 'cust-1', name: 'Swetha K', phone: '9812345678', email: 'swetha@gmail.com', points: 450, tier: 'Gold', spent: 48500.0, code: 'SM-CUST-001' },
    { id: 'cust-2', name: 'Rohan Deshmukh', phone: '9823456789', email: 'rohan.d@yahoo.com', points: 820, tier: 'Platinum', spent: 92400.0, code: 'SM-CUST-002' },
    { id: 'cust-3', name: 'Ananya Sharma', phone: '9834567890', email: 'ananya@outlook.com', points: 180, tier: 'Silver', spent: 18600.0, code: 'SM-CUST-003' },
    { id: 'cust-4', name: 'Kavita Nair', phone: '9845678901', email: 'kavita.nair@gmail.com', points: 50, tier: 'Bronze', spent: 4200.0, code: 'SM-CUST-004' },
    { id: 'cust-5', name: 'Arjun Sen', phone: '9856789012', email: 'arjun.sen@gmail.com', points: 310, tier: 'Silver', spent: 31000.0, code: 'SM-CUST-005' },
    { id: 'cust-6', name: 'Manish Tiwari', phone: '9867890123', email: 'manish.t@gmail.com', points: 15, tier: 'Bronze', spent: 1200.0, code: 'SM-CUST-006' }
  ];

  for (const c of customers) {
    await db.execute(`
      INSERT INTO customers (id, customer_code, name, email, phone, loyalty_points, loyalty_tier, total_spent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-60 days'))
    `, [c.id, c.code, c.name, c.email, c.phone, c.points, c.tier, c.spent]);

    await db.execute(`
      INSERT INTO customer_addresses (id, customer_id, address_line1, city, state, postal_code, is_default)
      VALUES (?, ?, 'Flat 402, Green Meadows Residency', 'Bengaluru', 'Karnataka', '560102', 1)
    `, [uuidv4(), c.id]);
  }

  // 8. SEED ACTIVE COUPONS
  console.log('🎟️ [Seed] Seeding promotional coupons & vouchers...');
  const coupons = [
    { code: 'WELCOME50', desc: 'Flat ₹50 off on first supermarket shopping above ₹300', type: 'FIXED', val: 50, min: 300 },
    { code: 'SUPERMART10', desc: '10% instant discount on grocery orders above ₹1,000', type: 'PERCENTAGE', val: 10, min: 1000 },
    { code: 'FRESHPRODUCE', desc: 'Flat ₹75 off on fresh fruits and vegetables bundle', type: 'FIXED', val: 75, min: 400 },
    { code: 'MEGA200', desc: 'Mega Weekend Savings ₹200 off on bills above ₹2,500', type: 'FIXED', val: 200, min: 2500 }
  ];

  for (const cp of coupons) {
    await db.execute(`
      INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [uuidv4(), cp.code, cp.desc, cp.type, cp.val, cp.min]);
  }

  // 9. SEED CASHIER REGISTER SESSIONS
  console.log('💼 [Seed] Seeding cashier shifts and register sessions...');
  const session1Id = 'sess-001';
  await db.execute(`
    INSERT INTO cashier_sessions (
      id, cashier_id, device_id, opening_cash, expected_cash, actual_cash, difference, status, opened_at
    ) VALUES (?, 'usr-csh-1', 'POS-01', 1500.0, 1500.0, 0, 0, 'OPEN', datetime('now', '-8 hours'))
  `, [session1Id]);

  // Closed historical session with discrepancy for anomaly detection
  await db.execute(`
    INSERT INTO cashier_sessions (
      id, cashier_id, device_id, opening_cash, closing_cash, expected_cash, actual_cash, difference, status, opened_at, closed_at
    ) VALUES (
      'sess-000-hist', 'usr-csh-2', 'POS-02', 1000.0, 8820.0, 9120.0, 8820.0, -300.0, 'CLOSED',
      datetime('now', '-2 days'), datetime('now', '-1 days')
    )
  `);

  // 10. SEED 65+ REALISTIC HISTORICAL SALES TO EMPOWER MBA & TIME-SERIES FORECASTING
  console.log('📈 [Seed] Generating 65+ realistic historical supermarket transactions for AI algorithms...');
  
  // High-frequency co-purchase combinations for Apriori Market Basket Analysis:
  // 1. Bread + Butter
  // 2. Milk + Biscuits
  // 3. Basmati Rice + Toor Dal + Cooking Oil
  // 4. Tomato + Onion + Potato (Indian culinary trio)
  // 5. Coke + Lays Chips

  const basketCombos = [
    // Trio 1: Milk + Bread + Butter (Breakfast)
    [
      { prodId: 'prod-dry-001', name: 'Amul Taaza Milk 1L', sku: 'SM-DRY-MILK1L', unit: 'litre', qty: 2, price: 72, cost: 62 },
      { prodId: 'prod-bak-001', name: 'Britannia Whole Wheat Bread', sku: 'SM-BAK-BRD400', unit: 'pack', qty: 1, price: 50, cost: 38 },
      { prodId: 'prod-dry-002', name: 'Amul Salted Butter 500g', sku: 'SM-DRY-BUTR500', unit: 'pack', qty: 1, price: 275, cost: 240 }
    ],
    // Trio 2: Veggies (Tomato + Onion + Potato)
    [
      { prodId: 'prod-veg-001', name: 'Fresh Farm Tomatoes', sku: 'SM-VEG-TOMATO', unit: 'kg', qty: 1.5, price: 40, cost: 28 },
      { prodId: 'prod-veg-002', name: 'Organic Red Potatoes', sku: 'SM-VEG-POTATO', unit: 'kg', qty: 2.0, price: 35, cost: 22 },
      { prodId: 'prod-veg-003', name: 'Nashik Red Onions', sku: 'SM-VEG-ONION', unit: 'kg', qty: 2.0, price: 45, cost: 32 }
    ],
    // Trio 3: Grocery Staples (Rice + Dal + Sunflower Oil)
    [
      { prodId: 'prod-gro-001', name: 'India Gate Basmati Rice 5kg', sku: 'SM-GRO-RICE5KG', unit: 'pack', qty: 1, price: 560, cost: 470 },
      { prodId: 'prod-gro-004', name: 'Tata Sampann Toor Dal 1kg', sku: 'SM-GRO-DAL1KG', unit: 'pack', qty: 2, price: 175, cost: 148 },
      { prodId: 'prod-gro-003', name: 'Fortune Sunflower Oil 1L', sku: 'SM-GRO-OIL1L', unit: 'litre', qty: 1, price: 145, cost: 125 }
    ],
    // Combo 4: Tea Time (Tea + Sugar + Parle-G)
    [
      { prodId: 'prod-bev-002', name: 'Tata Tea Gold Leaf 500g', sku: 'SM-BEV-TEA500G', unit: 'pack', qty: 1, price: 285, cost: 240 },
      { prodId: 'prod-gro-006', name: 'Madhur Pure Sugar 1kg', sku: 'SM-GRO-SUG1KG', unit: 'pack', qty: 1, price: 52, cost: 44 },
      { prodId: 'prod-snk-001', name: 'Parle-G Gluco Biscuits', sku: 'SM-SNK-PARLE10', unit: 'pack', qty: 2, price: 80, cost: 65 }
    ],
    // Combo 5: Snacks & Soda (Coca-Cola + Lays Chips + Dairy Milk)
    [
      { prodId: 'prod-bev-001', name: 'Coca-Cola 750ml', sku: 'SM-BEV-COKE750', unit: 'piece', qty: 2, price: 40, cost: 32 },
      { prodId: 'prod-snk-005', name: 'Lays Potato Chips 50g', sku: 'SM-SNK-LAYS50G', unit: 'pack', qty: 2, price: 20, cost: 16 },
      { prodId: 'prod-snk-003', name: 'Cadbury Dairy Milk Silk', sku: 'SM-SNK-CADB150', unit: 'piece', qty: 1, price: 175, cost: 145 }
    ],
    // Combo 6: Quick Lunch (Maggi Noodles + Safal Green Peas + Eggs)
    [
      { prodId: 'prod-snk-004', name: 'Maggi 2-Min Noodles 4-Pack', sku: 'SM-SNK-MAGGI4P', unit: 'pack', qty: 2, price: 56, cost: 46 },
      { prodId: 'prod-dry-004', name: 'Farm Fresh White Eggs 12s', sku: 'SM-DRY-EGGS12', unit: 'pack', qty: 1, price: 90, cost: 72 },
      { prodId: 'prod-frz-001', name: 'Safal Green Peas 1kg', sku: 'SM-FRZ-PEAS1KG', unit: 'pack', qty: 1, price: 130, cost: 105 }
    ]
  ];

  const payMethods = ['CASH', 'UPI', 'CARD', 'UPI', 'CASH'];
  const customerIds = ['cust-1', 'cust-2', 'cust-3', 'cust-4', 'cust-5', null];

  // Distribute 65 sales over past 30 days
  for (let i = 0; i < 65; i++) {
    const saleId = uuidv4();
    const invoiceNumber = `INV-${20260000 + i}`;
    const daysAgo = Math.floor(Math.random() * 28);
    const saleDateStr = `date('now', '-${daysAgo} days', '+${(i % 12) * 45} minutes')`;

    // Pick a combo or random combination
    const combo = basketCombos[i % basketCombos.length];
    const custId = customerIds[i % customerIds.length];
    const payment = payMethods[i % payMethods.length];

    let subtotal = 0;
    let taxTotal = 0;

    const itemsToInsert = combo.map(c => {
      const itemSub = c.price * c.qty;
      const tax = Number((itemSub * 0.05).toFixed(2));
      subtotal += itemSub;
      taxTotal += tax;
      return {
        id: uuidv4(),
        saleId,
        prodId: c.prodId,
        name: c.name,
        sku: c.sku,
        unit: c.unit,
        qty: c.qty,
        unitPrice: c.price,
        costPrice: c.cost,
        tax,
        total: itemSub + tax
      };
    });

    const discountAmount = i === 12 ? 250 : 0; // One transaction with intentional 250 discount override for anomaly detection!
    const totalAmount = subtotal + taxTotal - discountAmount;

    await db.execute(`
      INSERT INTO sales (
        id, invoice_number, customer_id, cashier_id, session_id, subtotal, discount_amount,
        tax_amount, total_amount, payment_method, payment_status, sync_status, created_at
      ) VALUES (?, ?, ?, 'usr-csh-1', ?, ?, ?, ?, ?, ?, 'PAID', 'ONLINE', ${saleDateStr})
    `, [saleId, invoiceNumber, custId, session1Id, subtotal, discountAmount, taxTotal, totalAmount, payment]);

    for (const it of itemsToInsert) {
      await db.execute(`
        INSERT INTO sale_items (
          id, sale_id, product_id, product_name, sku, unit, quantity,
          unit_price, cost_price, discount_amount, tax_rate, tax_amount, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 5, ?, ?)
      `, [it.id, it.saleId, it.prodId, it.name, it.sku, it.unit, it.qty, it.unitPrice, it.costPrice, it.tax, it.total]);
    }

    await db.execute(`
      INSERT INTO payments (id, sale_id, payment_method, amount, transaction_ref, provider_status, created_at)
      VALUES (?, ?, ?, ?, ?, 'SUCCESS', ${saleDateStr})
    `, [uuidv4(), saleId, payment, totalAmount, `TXN-REF-${10000 + i}`]);
  }

  // Pre-seed known high-confidence Market Basket Rules to guarantee instant dashboard satisfaction
  console.log('🛒 [Seed] Seeding verified market basket rules...');
  const verifiedMbaRules = [
    { aSku: 'SM-BAK-BRD400', aName: 'Britannia Whole Wheat Bread', cSku: 'SM-DRY-BUTR500', cName: 'Amul Salted Butter 500g', sup: 0.28, conf: 0.85, lift: 2.45 },
    { aSku: 'SM-DRY-MILK1L', aName: 'Amul Taaza Milk 1L', cSku: 'SM-SNK-PARLE10', cName: 'Parle-G Gluco Biscuits', sup: 0.22, conf: 0.74, lift: 1.95 },
    { aSku: 'SM-GRO-RICE5KG', aName: 'India Gate Basmati Rice 5kg', cSku: 'SM-GRO-DAL1KG', cName: 'Tata Sampann Toor Dal 1kg', sup: 0.31, conf: 0.88, lift: 2.60 },
    { aSku: 'SM-VEG-POTATO', aName: 'Organic Red Potatoes', cSku: 'SM-VEG-TOMATO', cName: 'Fresh Farm Tomatoes', sup: 0.35, conf: 0.82, lift: 2.10 },
    { aSku: 'SM-BEV-COKE750', aName: 'Coca-Cola 750ml', cSku: 'SM-SNK-LAYS50G', cName: 'Lays Potato Chips 50g', sup: 0.19, conf: 0.78, lift: 2.80 }
  ];

  for (const r of verifiedMbaRules) {
    await db.execute(`
      INSERT INTO market_basket_rules (id, antecedent_sku, antecedent_name, consequent_sku, consequent_name, support, confidence, lift, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [uuidv4(), r.aSku, r.aName, r.cSku, r.cName, r.sup, r.conf, r.lift]);
  }

  // Seed sample operational expenses for Business P&L
  console.log('💵 [Seed] Seeding operational supermarket expenses...');
  const expenses = [
    { cat: 'UTILITIES', amt: 24500, desc: 'Commercial Supermarket Electricity & Chiller Cooling' },
    { cat: 'SALARY', amt: 65000, desc: 'Cashier & Floor Staff Monthly Compensation' },
    { cat: 'MAINTENANCE', amt: 8200, desc: 'Refrigeration Chiller Maintenance & Scale Calibration' },
    { cat: 'SUPPLIES', amt: 4500, desc: 'Thermal Receipt Rolls (80mm) & Carry Bags' }
  ];

  for (const exp of expenses) {
    await db.execute(`
      INSERT INTO expenses (id, category, amount, description, session_id, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, 'usr-admin-1', datetime('now', '-5 days'))
    `, [uuidv4(), exp.cat, exp.amt, exp.desc, session1Id]);
  }

  // Seed Notifications
  console.log('🔔 [Seed] Seeding initial notifications...');
  const notifications = [
    { title: 'Low Stock Alert: Amul Masti Dahi', msg: 'Stock level dropped to 9 units (Threshold: 15). Reorder recommended.', type: 'WARNING' },
    { title: 'FEFO Expiry Alert: 1 Batch Critical', msg: 'Batch BAT-MLK-001 (Amul Taaza Milk) expires in 4 days. Apply clearance markdown.', type: 'ALERT' },
    { title: 'POS Sync Service Nominal', msg: 'All offline registers successfully synchronized to central server.', type: 'SUCCESS' }
  ];

  for (const n of notifications) {
    await db.execute(`
      INSERT INTO notifications (id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now'))
    `, [uuidv4(), n.title, n.msg, n.type]);
  }

  console.log('🎉 [Seed] SMARTMART Supermarket database successfully seeded with realistic enterprise data!');
};

if (require.main === module) {
  runSeed().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  });
}
