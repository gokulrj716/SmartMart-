// Customer RFM Analytics, Lifetime Value (CLV), and Churn Prediction Service

import { db } from '../../database/db';

export interface CustomerSegmentProfile {
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  recencyDays: number;
  frequency: number;
  totalSpent: number;
  avgOrderValue: number;
  rfmScore: string;
  segment: 'Champions' | 'Loyal Customers' | 'Potential Loyalists' | 'New Customers' | 'At Risk' | 'Lost Customers';
  churnRiskScore: number; // 0 - 100
  churnRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  clvEstimate: number; // in INR
}

export interface SegmentSummary {
  segment: string;
  count: number;
  totalRevenue: number;
  avgCLV: number;
  description: string;
}

export class CustomerAnalyticsService {
  async getCustomerProfiles(): Promise<{ profiles: CustomerSegmentProfile[]; summary: SegmentSummary[] }> {
    const rawCustomers = await db.query<any>(`
      SELECT 
        c.id, c.name, c.phone, c.email, c.loyalty_tier, c.loyalty_points,
        COALESCE(COUNT(s.id), 0) as frequency,
        COALESCE(SUM(s.total_amount), 0) as total_spent,
        COALESCE(MAX(s.created_at), c.created_at) as last_purchase_date
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      GROUP BY c.id
      ORDER BY total_spent DESC
    `);

    const now = Date.now();
    const profiles: CustomerSegmentProfile[] = rawCustomers.map(c => {
      const lastDate = new Date(c.last_purchase_date).getTime();
      const recencyDays = Math.max(1, Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)));
      const frequency = Math.max(1, Number(c.frequency || 0));
      const totalSpent = Number(c.total_spent || 0);
      const avgOrderValue = Math.round(totalSpent / frequency);

      // RFM scoring (1 to 5 scale)
      const rScore = recencyDays <= 7 ? 5 : (recencyDays <= 15 ? 4 : (recencyDays <= 30 ? 3 : (recencyDays <= 60 ? 2 : 1)));
      const fScore = frequency >= 10 ? 5 : (frequency >= 6 ? 4 : (frequency >= 3 ? 3 : (frequency >= 2 ? 2 : 1)));
      const mScore = totalSpent >= 20000 ? 5 : (totalSpent >= 10000 ? 4 : (totalSpent >= 5000 ? 3 : (totalSpent >= 2000 ? 2 : 1)));
      const rfmScore = `${rScore}${fScore}${mScore}`;

      // Segment Classification
      let segment: CustomerSegmentProfile['segment'] = 'Potential Loyalists';
      let churnRiskScore = 20;
      let churnRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

      if (rScore >= 4 && fScore >= 4 && mScore >= 4) {
        segment = 'Champions';
        churnRiskScore = 10;
        churnRiskLevel = 'LOW';
      } else if (fScore >= 3 && mScore >= 3 && rScore >= 3) {
        segment = 'Loyal Customers';
        churnRiskScore = 25;
        churnRiskLevel = 'LOW';
      } else if (rScore >= 4 && fScore <= 2) {
        segment = 'New Customers';
        churnRiskScore = 35;
        churnRiskLevel = 'MEDIUM';
      } else if (rScore <= 2 && fScore >= 3) {
        segment = 'At Risk';
        churnRiskScore = 75;
        churnRiskLevel = 'HIGH';
      } else if (rScore === 1 && fScore <= 2) {
        segment = 'Lost Customers';
        churnRiskScore = 92;
        churnRiskLevel = 'HIGH';
      } else {
        segment = 'Potential Loyalists';
        churnRiskScore = 40;
        churnRiskLevel = 'MEDIUM';
      }

      // CLV Calculation: Expected annual spend based on frequency and AOV with 18% grocery margin
      const estimatedAnnualPurchases = (frequency / Math.max(1, recencyDays)) * 365;
      const clvEstimate = Math.round(Math.min(250000, Math.max(totalSpent, avgOrderValue * Math.min(24, estimatedAnnualPurchases) * 0.18)));

      return {
        customerId: c.id,
        customerName: c.name,
        phone: c.phone,
        email: c.email,
        recencyDays,
        frequency,
        totalSpent,
        avgOrderValue,
        rfmScore,
        segment,
        churnRiskScore,
        churnRiskLevel,
        clvEstimate
      };
    });

    // Compute segment summaries
    const segmentMap = new Map<string, { count: number; totalRevenue: number; totalCLV: number }>();
    profiles.forEach(p => {
      const existing = segmentMap.get(p.segment) || { count: 0, totalRevenue: 0, totalCLV: 0 };
      existing.count += 1;
      existing.totalRevenue += p.totalSpent;
      existing.totalCLV += p.clvEstimate;
      segmentMap.set(p.segment, existing);
    });

    const segmentDescriptions: Record<string, string> = {
      'Champions': 'Highest value buyers with frequent visits and recent transactions. Reward with VIP perks.',
      'Loyal Customers': 'Consistent supermarket shoppers who respond well to brand promotions and weekly deals.',
      'Potential Loyalists': 'Recent buyers with good basket sizes. Target with loyalty bonus points.',
      'New Customers': 'First-time or recent trial shoppers. Send welcome coupons to drive second purchase.',
      'At Risk': 'Valuable historical customers who have not visited in 30+ days. Send reactivation discounts.',
      'Lost Customers': 'Inactive for long periods. Low engagement. Use automated win-back campaigns.'
    };

    const summary: SegmentSummary[] = Array.from(segmentMap.entries()).map(([segment, data]) => ({
      segment,
      count: data.count,
      totalRevenue: data.totalRevenue,
      avgCLV: Math.round(data.totalCLV / Math.max(1, data.count)),
      description: segmentDescriptions[segment] || ''
    }));

    return { profiles, summary };
  }
}

export const customerAnalyticsService = new CustomerAnalyticsService();
