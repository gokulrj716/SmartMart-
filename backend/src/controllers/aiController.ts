import { Request, Response } from 'express';
import { demandForecastingService } from '../services/ai/DemandForecastingService';
import { marketBasketService } from '../services/ai/MarketBasketService';
import { customerAnalyticsService } from '../services/ai/CustomerAnalyticsService';
import { anomalyDetectionService } from '../services/ai/AnomalyDetectionService';
import { expiryWastageService } from '../services/ai/ExpiryWastageService';
import { db } from '../database/db';

export const getDemandForecast = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.query;
    const forecast = await demandForecastingService.getProductDemandForecast(productId as string);
    res.json({ success: true, data: forecast });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Demand forecasting failed: ' + err.message });
  }
};

export const getSalesForecast = async (req: Request, res: Response): Promise<void> => {
  try {
    const forecast = await demandForecastingService.getSalesForecast();
    res.json({ success: true, data: forecast });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Sales forecasting failed: ' + err.message });
  }
};

export const getMarketBasketAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = await marketBasketService.getAssociationRules();
    res.json({ success: true, data: rules });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Market basket analysis failed: ' + err.message });
  }
};

export const getCustomerSegments = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await customerAnalyticsService.getCustomerProfiles();
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Customer segmentation failed: ' + err.message });
  }
};

export const getAnomalies = async (req: Request, res: Response): Promise<void> => {
  try {
    const anomalies = await anomalyDetectionService.detectAnomalies();
    res.json({ success: true, data: anomalies });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Anomaly detection failed: ' + err.message });
  }
};

export const getExpiryWastage = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await expiryWastageService.getExpiryReport();
    res.json({ success: true, ...report });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Expiry wastage tracking failed: ' + err.message });
  }
};

export const getPersonalizedRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, sku } = req.query;

    // If sku is provided, get frequently bought together
    if (sku) {
      const mbaRules = await marketBasketService.getFrequentlyBoughtTogether(sku as string);
      if (mbaRules.length > 0) {
        const consequentSkus = mbaRules.map(r => r.consequentSku === sku ? r.antecedentSku : r.consequentSku);
        const placeholders = consequentSkus.map(() => '?').join(',');
        const recommendedProducts = await db.query<any>(`
          SELECT p.*, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.sku IN (${placeholders}) AND p.is_active = 1
          LIMIT 4
        `, consequentSkus);

        if (recommendedProducts.length > 0) {
          res.json({ success: true, type: 'FREQUENTLY_BOUGHT_TOGETHER', data: recommendedProducts });
          return;
        }
      }
    }

    // Default: Top popular & high-rated supermarket products
    const popular = await db.query<any>(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.stock DESC
      LIMIT 6
    `);

    res.json({ success: true, type: 'POPULAR_RECOMMENDATIONS', data: popular });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
  }
};
