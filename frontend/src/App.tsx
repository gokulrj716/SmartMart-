import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SocketProvider } from './contexts/SocketContext';
import { OfflineProvider } from './contexts/OfflineContext';

// Customer Pages
import { CustomerHome } from './pages/customer/CustomerHome';
import { ShopPage } from './pages/customer/ShopPage';
import { CustomerCategories } from './pages/customer/CustomerCategories';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { CustomerCart } from './pages/customer/CustomerCart';
import { CustomerCheckout } from './pages/customer/CustomerCheckout';
import { CustomerOrders } from './pages/customer/CustomerOrders';
import { CustomerLoyalty } from './pages/customer/CustomerLoyalty';
import { CustomerProfile } from './pages/customer/CustomerProfile';

// Cashier POS Pages
import { CashierPOS } from './pages/cashier/CashierPOS';
import { CustomerDisplay } from './pages/cashier/CustomerDisplay';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ProductsPage } from './pages/admin/ProductsPage';
import { InventoryPage } from './pages/admin/InventoryPage';
import { PurchasesPage } from './pages/admin/PurchasesPage';
import { SuppliersPage } from './pages/admin/SuppliersPage';
import { CustomersPage } from './pages/admin/CustomersPage';
import { SalesPage } from './pages/admin/SalesPage';
import { ReturnsPage } from './pages/admin/ReturnsPage';
import { SessionsPage } from './pages/admin/SessionsPage';
import { ProductAnalyticsPage } from './pages/admin/ProductAnalyticsPage';
import { BusinessAnalyticsPage } from './pages/admin/BusinessAnalyticsPage';
import { CustomerAnalyticsPage } from './pages/admin/CustomerAnalyticsPage';
import { InventoryAnalyticsPage } from './pages/admin/InventoryAnalyticsPage';
import { AiInsightsPage } from './pages/admin/AiInsightsPage';
import { HardwareStatusPage } from './pages/admin/HardwareStatusPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { UsersPage } from './pages/admin/UsersPage';

// Auth Pages & Guards
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <OfflineProvider>
            <CartProvider>
              <Routes>
                {/* Public Customer Application Routes */}
                <Route path="/" element={<CustomerHome />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/categories" element={<CustomerCategories />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CustomerCart />} />

                {/* Customer Authenticated Routes */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CustomerCheckout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CustomerOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/loyalty"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CustomerLoyalty />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <CustomerProfile />
                    </ProtectedRoute>
                  }
                />

                {/* Cashier POS Routes (Cashier, Store Manager, Admin) */}
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute allowedRoles={['CASHIER', 'MANAGER', 'ADMIN']}>
                      <CashierPOS />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer-display"
                  element={
                    <ProtectedRoute allowedRoles={['CASHIER', 'MANAGER', 'ADMIN']}>
                      <CustomerDisplay />
                    </ProtectedRoute>
                  }
                />

                {/* Staff Inventory Routes (Inventory Staff, Manager, Admin) */}
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute allowedRoles={['INVENTORY_STAFF', 'MANAGER', 'ADMIN']}>
                      <ProductsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/inventory"
                  element={
                    <ProtectedRoute allowedRoles={['INVENTORY_STAFF', 'MANAGER', 'ADMIN']}>
                      <InventoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/purchases"
                  element={
                    <ProtectedRoute allowedRoles={['INVENTORY_STAFF', 'MANAGER', 'ADMIN']}>
                      <PurchasesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/suppliers"
                  element={
                    <ProtectedRoute allowedRoles={['INVENTORY_STAFF', 'MANAGER', 'ADMIN']}>
                      <SuppliersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics/inventory"
                  element={
                    <ProtectedRoute allowedRoles={['INVENTORY_STAFF', 'MANAGER', 'ADMIN']}>
                      <InventoryAnalyticsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Store Operations & Analytics Routes (Manager & Admin) */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'INVENTORY_STAFF']}>
                      <Navigate to="/admin/dashboard" replace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/customers"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                      <CustomersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/sales"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                      <SalesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/returns"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                      <ReturnsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/sessions"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                      <SessionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics/products"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                      <ProductAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics/business"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                      <BusinessAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics/customers"
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                      <CustomerAnalyticsPage />
                    </ProtectedRoute>
                  }
                />

                {/* High-Privilege Administration Only (Admin) */}
                <Route
                  path="/admin/ai"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AiInsightsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/hardware"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <HardwareStatusPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AuditLogsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Auth */}
                <Route path="/login" element={<LoginPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </OfflineProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
