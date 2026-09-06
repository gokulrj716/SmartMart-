// Market Basket Analysis (MBA) Engine
// Computes Support, Confidence, and Lift for co-purchased supermarket items

import { db } from '../../database/db';

export interface AssociationRule {
  antecedentSku: string;
  antecedentName: string;
  consequentSku: string;
  consequentName: string;
  support: number;    // % of total transactions containing both
  confidence: number; // probability of buying consequent given antecedent
  lift: number;       // strength of rule (> 1 implies positive association)
  recommendationType: 'COMBO_DEAL' | 'SHELF_ADJACENCY' | 'UPSELL';
}

export class MarketBasketService {
  async getAssociationRules(): Promise<AssociationRule[]> {
    // Check if we already have precomputed rules in the database
    const savedRules = await db.query<any>(`
      SELECT antecedent_sku, antecedent_name, consequent_sku, consequent_name, support, confidence, lift
      FROM market_basket_rules
      ORDER BY lift DESC
      LIMIT 25
    `);

    if (savedRules.length > 0) {
      return savedRules.map(r => ({
        antecedentSku: r.antecedent_sku,
        antecedentName: r.antecedent_name,
        consequentSku: r.consequent_sku,
        consequentName: r.consequent_name,
        support: Number(r.support),
        confidence: Number(r.confidence),
        lift: Number(r.lift),
        recommendationType: r.lift >= 2.0 ? 'COMBO_DEAL' : (r.lift >= 1.5 ? 'SHELF_ADJACENCY' : 'UPSELL')
      }));
    }

    // Dynamic mining from sale_items
    const salesWithMultipleItems = await db.query<any>(`
      SELECT sale_id, product_id, product_name, sku 
      FROM sale_items 
      ORDER BY sale_id
    `);

    const totalSalesRow = await db.query<any>(`SELECT COUNT(*) as count FROM sales`);
    const totalTransactions = Math.max(1, Number(totalSalesRow[0]?.count || 1));

    // Group items by sale_id
    const baskets: { [saleId: string]: { sku: string; name: string }[] } = {};
    const itemCounts: { [sku: string]: { count: number; name: string } } = {};

    salesWithMultipleItems.forEach(item => {
      if (!baskets[item.sale_id]) baskets[item.sale_id] = [];
      baskets[item.sale_id].push({ sku: item.sku, name: item.product_name });

      if (!itemCounts[item.sku]) {
        itemCounts[item.sku] = { count: 0, name: item.product_name };
      }
      itemCounts[item.sku].count++;
    });

    const pairCounts: { [key: string]: { count: number; aSku: string; aName: string; bSku: string; bName: string } } = {};

    Object.values(baskets).forEach(items => {
      // Find all pairs in basket
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          if (a.sku === b.sku) continue;

          const key = a.sku < b.sku ? `${a.sku}|${b.sku}` : `${b.sku}|${a.sku}`;
          if (!pairCounts[key]) {
            pairCounts[key] = {
              count: 0,
              aSku: a.sku < b.sku ? a.sku : b.sku,
              aName: a.sku < b.sku ? a.name : b.name,
              bSku: a.sku < b.sku ? b.sku : a.sku,
              bName: a.sku < b.sku ? b.name : a.name
            };
          }
          pairCounts[key].count++;
        }
      }
    });

    const minedRules: AssociationRule[] = [];

    Object.values(pairCounts).forEach(pair => {
      const support = pair.count / totalTransactions;
      if (support < 0.01) return; // Min support 1%

      const aCount = itemCounts[pair.aSku]?.count || 1;
      const bCount = itemCounts[pair.bSku]?.count || 1;

      // Rule A -> B
      const confidenceAtoB = pair.count / aCount;
      const supportB = bCount / totalTransactions;
      const liftAtoB = supportB > 0 ? (confidenceAtoB / supportB) : 1;

      minedRules.push({
        antecedentSku: pair.aSku,
        antecedentName: pair.aName,
        consequentSku: pair.bSku,
        consequentName: pair.bName,
        support: Number(support.toFixed(4)),
        confidence: Number(confidenceAtoB.toFixed(4)),
        lift: Number(liftAtoB.toFixed(2)),
        recommendationType: liftAtoB >= 2.0 ? 'COMBO_DEAL' : (liftAtoB >= 1.5 ? 'SHELF_ADJACENCY' : 'UPSELL')
      });
    });

    return minedRules.sort((a, b) => b.lift - a.lift);
  }

  async getFrequentlyBoughtTogether(sku: string): Promise<AssociationRule[]> {
    const rules = await this.getAssociationRules();
    return rules.filter(r => r.antecedentSku === sku || r.consequentSku === sku);
  }
}

export const marketBasketService = new MarketBasketService();
