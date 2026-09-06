import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as authCtrl from '../controllers/authController';
import * as productCtrl from '../controllers/productController';
import * as categoryCtrl from '../controllers/categoryController';
import * as posCtrl from '../controllers/posController';
import * as inventoryCtrl from '../controllers/inventoryController';
import * as customerCtrl from '../controllers/customerController';
import * as salesCtrl from '../controllers/salesController';
import * as returnsCtrl from '../controllers/returnsController';
import * as sessionCtrl from '../controllers/sessionController';
import * as supplierCtrl from '../controllers/supplierController';
import * as analyticsCtrl from '../controllers/analyticsController';
import * as aiCtrl from '../controllers/aiController';
import * as hardwareCtrl from '../controllers/hardwareController';
import * as auditCtrl from '../controllers/auditLogController';
import * as userCtrl from '../controllers/userController';
import * as settingsCtrl from '../controllers/settingsController';

const router = Router();

// --- AUTH & ROLES ---
router.post('/auth/login', authCtrl.login);
router.post('/auth/register', authCtrl.register);
router.get('/auth/profile', authenticate, authCtrl.getProfile);
router.post('/auth/demo-switch-role', authCtrl.demoSwitchRole);

// --- PRODUCTS & CATEGORIES ---
router.get('/products', productCtrl.getProducts);
router.get('/products/barcode/:code', productCtrl.getProductByBarcode);
router.get('/products/:id', productCtrl.getProductById);
router.post('/products', authenticate, requireRole('ADMIN', 'MANAGER', 'INVENTORY_STAFF'), productCtrl.createProduct);
router.put('/products/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'INVENTORY_STAFF'), productCtrl.updateProduct);
router.post('/products/generate-barcode', authenticate, requireRole('ADMIN', 'MANAGER', 'INVENTORY_STAFF'), productCtrl.generateInternalBarcode);

router.get('/categories', categoryCtrl.getCategories);

// --- POS & BILLING ---
router.post('/pos/checkout', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), posCtrl.processSale);
router.post('/pos/sync', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), posCtrl.syncOfflineSales);

// --- INVENTORY ---
router.get('/inventory', authenticate, requireRole('ADMIN', 'MANAGER', 'INVENTORY_STAFF'), inventoryCtrl.getInventory);
router.post('/inventory/adjust', authenticate, requireRole('ADMIN', 'MANAGER', 'INVENTORY_STAFF'), inventoryCtrl.adjustStock);

// --- CUSTOMERS & LOYALTY ---
router.get('/customers', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), customerCtrl.getCustomers);
router.get('/customers/phone/:phone', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), customerCtrl.getCustomerByPhone);
router.post('/customers', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), customerCtrl.createCustomer);
router.get('/customers/:id/loyalty', customerCtrl.getCustomerLoyalty);

// --- SALES & ORDERS ---
router.get('/sales', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), salesCtrl.getSales);
router.get('/sales/:id', authenticate, salesCtrl.getSaleById);

// --- RETURNS ---
router.get('/returns', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), returnsCtrl.getReturns);
router.post('/returns', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), returnsCtrl.processReturn);

// --- CASHIER SESSIONS ---
router.get('/sessions/current', authenticate, sessionCtrl.getCurrentSession);
router.post('/sessions/open', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), sessionCtrl.openSession);
router.post('/sessions/close', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), sessionCtrl.closeSession);

// --- SUPPLIERS & PURCHASES ---
router.get('/suppliers', authenticate, requireRole('ADMIN', 'MANAGER', 'INVENTORY_STAFF'), supplierCtrl.getSuppliers);
router.post('/suppliers', authenticate, requireRole('ADMIN', 'MANAGER', 'INVENTORY_STAFF'), supplierCtrl.createSupplier);
router.get('/purchases', authenticate, requireRole('ADMIN', 'MANAGER', 'INVENTORY_STAFF'), supplierCtrl.getPurchases);
router.post('/purchases/receive', authenticate, requireRole('ADMIN', 'MANAGER', 'INVENTORY_STAFF'), supplierCtrl.receivePurchaseOrder);

// --- ANALYTICS SUITE ---
router.get('/analytics/dashboard', authenticate, requireRole('ADMIN', 'MANAGER'), analyticsCtrl.getDashboardSummary);
router.get('/analytics/products', authenticate, requireRole('ADMIN', 'MANAGER'), analyticsCtrl.getProductAnalytics);
router.get('/analytics/business', authenticate, requireRole('ADMIN', 'MANAGER'), analyticsCtrl.getBusinessAnalytics);

// --- AI / ML ENGINE ---
router.get('/ai/demand-forecast', authenticate, requireRole('ADMIN', 'MANAGER'), aiCtrl.getDemandForecast);
router.get('/ai/sales-forecast', authenticate, requireRole('ADMIN', 'MANAGER'), aiCtrl.getSalesForecast);
router.get('/ai/market-basket', authenticate, requireRole('ADMIN', 'MANAGER'), aiCtrl.getMarketBasketAnalysis);
router.get('/ai/customer-segments', authenticate, requireRole('ADMIN', 'MANAGER'), aiCtrl.getCustomerSegments);
router.get('/ai/anomalies', authenticate, requireRole('ADMIN', 'MANAGER'), aiCtrl.getAnomalies);
router.get('/ai/expiry-wastage', authenticate, requireRole('ADMIN', 'MANAGER'), aiCtrl.getExpiryWastage);
router.get('/ai/recommendations', aiCtrl.getPersonalizedRecommendations);

// --- HARDWARE DIAGNOSTICS & CONTROLS ---
router.get('/hardware/status', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), hardwareCtrl.getAllHardwareStatus);
router.get('/hardware/scale/reading', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), hardwareCtrl.getScaleReading);
router.post('/hardware/scale/mock-weight', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), hardwareCtrl.setScaleMockWeight);
router.post('/hardware/scale/tare', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), hardwareCtrl.tareScale);
router.post('/hardware/scale/zero', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), hardwareCtrl.zeroScale);
router.post('/hardware/printer/test', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), hardwareCtrl.testReceiptPrinter);
router.post('/hardware/drawer/kick', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), hardwareCtrl.triggerCashDrawer);
router.post('/hardware/camera/identify', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), hardwareCtrl.triggerCameraAiDetection);
router.post('/hardware/camera/threshold', authenticate, requireRole('ADMIN'), hardwareCtrl.setAiThreshold);

// --- USER & ROLE ALLOCATION MANAGEMENT ---
router.get('/users', authenticate, requireRole('ADMIN'), userCtrl.getUsers);
router.post('/users', authenticate, requireRole('ADMIN'), userCtrl.createUser);
router.put('/users/:id', authenticate, requireRole('ADMIN'), userCtrl.updateUser);
router.put('/users/:id/password', authenticate, requireRole('ADMIN'), userCtrl.resetPassword);
router.delete('/users/:id', authenticate, requireRole('ADMIN'), userCtrl.deleteUser);

// --- STORE SETTINGS & PAYMENT QR ---
router.get('/settings/payment-qr', settingsCtrl.getPaymentQrSettings);
router.post('/settings/payment-qr', authenticate, requireRole('ADMIN'), settingsCtrl.savePaymentQrSettings);

export default router;
