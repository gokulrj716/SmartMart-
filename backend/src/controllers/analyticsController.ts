import { Request, Response } from 'express';
import { db } from '../database/db';

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeframe = '30d' } = req.query;

    // Today's metrics
    const todaySales = await db.query<any>(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as today_revenue,
        COUNT(id) as today_orders,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM sales
      WHERE DATE(created_at) = DATE('now')
    `);

    // Products sold today
    const todayProducts = await db.query<any>(`
      SELECT COALESCE(SUM(quantity), 0) as units_sold
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) = DATE('now')
    `);

    // Total gross profit & overall revenue
    const profitRow = await db.query<any>(`
      SELECT 
        COALESCE(SUM(si.total_amount), 0) as total_rev,
        COALESCE(SUM(si.cost_price * si.quantity), 0) as total_cost
      FROM sale_items si
    `);
    const totalRev = Number(profitRow[0]?.total_rev || 0);
    const totalCost = Number(profitRow[0]?.total_cost || 0);
    const grossProfit = totalRev - totalCost;

    // Inventory valuation and low stock count
    const invRow = await db.query<any>(`
      SELECT 
        SUM(stock * cost_price) as inventory_value,
        SUM(CASE WHEN stock <= min_stock_alert THEN 1 ELSE 0 END) as low_stock_count
      FROM products
      WHERE is_active = 1
    `);

    // Active customer count
    const custRow = await db.query<any>(`SELECT COUNT(id) as active_customers FROM customers`);

    // Revenue and Profit Trend (Past 14 Days)
    const revenueTrend = await db.query<any>(`
      SELECT 
        DATE(s.created_at) as date,
        SUM(s.total_amount) as revenue,
        COUNT(s.id) as orders,
        SUM(si.cost_price * si.quantity) as total_cost
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      GROUP BY DATE(s.created_at)
      ORDER BY date ASC
      LIMIT 14
    `);

    const formattedTrend = revenueTrend.map(t => ({
      date: t.date,
      revenue: Math.round(Number(t.revenue || 0)),
      profit: Math.round(Number(t.revenue || 0) - Number(t.total_cost || 0)),
      orders: Number(t.orders || 0)
    }));

    // Category Revenue Breakdown
    const categoryRevenue = await db.query<any>(`
      SELECT 
        c.name as category,
        SUM(si.total_amount) as revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY revenue DESC
      LIMIT 8
    `);

    // Payment Method Breakdown
    const paymentMethods = await db.query<any>(`
      SELECT 
        payment_method as method,
        COUNT(id) as count,
        SUM(total_amount) as total
      FROM sales
      GROUP BY payment_method
    `);

    // Top 5 Products by Revenue
    const topProducts = await db.query<any>(`
      SELECT 
        si.product_name as name,
        si.sku,
        SUM(si.quantity) as units_sold,
        SUM(si.total_amount) as revenue
      FROM sale_items si
      GROUP BY si.product_id
      ORDER BY revenue DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      kpis: {
        todayRevenue: Math.round(Number(todaySales[0]?.today_revenue || 0)),
        todayOrders: Number(todaySales[0]?.today_orders || 0),
        productsSoldToday: Math.round(Number(todayProducts[0]?.units_sold || 0)),
        grossProfit: Math.round(grossProfit),
        avgOrderValue: Math.round(Number(todaySales[0]?.avg_order_value || 0)),
        activeCustomers: Number(custRow[0]?.active_customers || 0),
        inventoryValue: Math.round(Number(invRow[0]?.inventory_value || 0)),
        lowStockCount: Number(invRow[0]?.low_stock_count || 0)
      },
      charts: {
        revenueTrend: formattedTrend,
        categoryRevenue: categoryRevenue.map(c => ({ category: c.category, revenue: Math.round(Number(c.revenue)) })),
        paymentMethods: paymentMethods.map(p => ({ method: p.method, count: Number(p.count), total: Math.round(Number(p.total)) })),
        topProducts: topProducts.map(t => ({ name: t.name, sku: t.sku, unitsSold: Number(t.units_sold), revenue: Math.round(Number(t.revenue)) }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary: ' + err.message });
  }
};

export const getProductAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await db.query<any>(`
      SELECT 
        p.id, p.name, p.sku, p.unit, p.price, p.cost_price, p.stock,
        c.name as category_name,
        COALESCE(SUM(si.quantity), 0) as units_sold,
        COALESCE(SUM(si.total_amount), 0) as total_revenue,
        COALESCE(SUM((si.unit_price - si.cost_price) * si.quantity), 0) as total_profit
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sale_items si ON p.id = si.product_id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY total_revenue DESC
    `);

    const enriched = products.map(p => {
      const revenue = Number(p.total_revenue || 0);
      const profit = Number(p.total_profit || 0);
      const margin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0;
      const units = Number(p.units_sold || 0);

      let velocityType = 'MODERATE';
      if (units >= 25) velocityType = 'BEST_SELLER';
      else if (units <= 2 && Number(p.stock) > 20) velocityType = 'SLOW_MOVING';
      else if (units === 0 && Number(p.stock) > 0) velocityType = 'DEAD_STOCK';

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category_name,
        unit: p.unit,
        price: Number(p.price),
        costPrice: Number(p.cost_price),
        stock: Number(p.stock),
        unitsSold: units,
        revenue: Math.round(revenue),
        profit: Math.round(profit),
        marginPercent: margin,
        velocityType,
        stockTurnoverRatio: Number((units / Math.max(1, Number(p.stock))).toFixed(2))
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch product analytics' });
  }
};

export const getBusinessAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const revenueRow = await db.query<any>(`SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM sales`);
    const cogsRow = await db.query<any>(`SELECT COALESCE(SUM(cost_price * quantity), 0) as cogs FROM sale_items`);
    const expenses = await db.query<any>(`
      SELECT category, SUM(amount) as total_amount
      FROM expenses
      GROUP BY category
    `);

    const totalRevenue = Number(revenueRow[0]?.total_revenue || 0);
    const cogs = Number(cogsRow[0]?.cogs || 0);
    const grossProfit = totalRevenue - cogs;
    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      financials: {
        totalRevenue: Math.round(totalRevenue),
        costOfGoodsSold: Math.round(cogs),
        grossProfit: Math.round(grossProfit),
        grossMargin: totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0,
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        profitMargin,
        expenseBreakdown: expenses.map(e => ({ category: e.category, amount: Math.round(Number(e.total_amount)) }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch business analytics' });
  }
};
