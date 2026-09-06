export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'INVENTORY_STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status?: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  image_url?: string;
  product_count?: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  category_id: string;
  category_name?: string;
  category_code?: string;
  brand_id?: string;
  brand_name?: string;
  unit: string;
  price: number;
  cost_price: number;
  mrp: number;
  discount_percent: number;
  gst_rate: number;
  stock: number;
  min_stock_alert: number;
  is_weighted: boolean | number;
  image_url?: string;
  plu_code?: string;
  is_active: boolean | number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  isWeighted?: boolean;
}

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email?: string;
  phone: string;
  loyalty_points: number;
  loyalty_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  total_spent: number;
  order_count?: number;
}

export interface HardwareDevice {
  id?: string;
  name: string;
  type: 'BARCODE_SCANNER' | 'CAMERA' | 'SCALE' | 'PRINTER' | 'CASH_DRAWER' | 'PAYMENT_TERMINAL' | 'CUSTOMER_DISPLAY';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  port?: string;
  lastHeartbeat: string;
  details?: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  cashier_id?: string;
  cashier_name?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: 'CASH' | 'UPI' | 'CARD' | 'DIGITAL';
  payment_status: string;
  sync_status: string;
  created_at: string;
  items?: Array<{
    id: string;
    product_name: string;
    sku: string;
    unit: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
}

export interface DemandForecast {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  historicalDailyAvg: number;
  predictedDemandNext7Days: number;
  predictedDemandNext30Days: number;
  recommendedPurchaseQty: number;
  confidenceScore: number;
  status: 'SUFFICIENT_DATA' | 'INSUFFICIENT_DATA';
  message?: string;
}

export interface MarketBasketRule {
  antecedentSku: string;
  antecedentName: string;
  consequentSku: string;
  consequentName: string;
  support: number;
  confidence: number;
  lift: number;
  recommendationType: 'COMBO_DEAL' | 'SHELF_ADJACENCY' | 'UPSELL';
}

export interface AnomalyReport {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  cashierName?: string;
  detectedAt: string;
  metadata?: any;
}
