import React, { useState, useEffect } from 'react';
import { Award, Gift, Sparkles, Check, Tag, ShieldCheck } from 'lucide-react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';

export const CustomerLoyalty: React.FC = () => {
  const [loyaltyData, setLoyaltyData] = useState<any | null>(null);
  const [redeemedCoupon, setRedeemedCoupon] = useState<string | null>(null);

  useEffect(() => {
    // Fetch loyalty for demo customer cust-1
    api.get<any>('/customers/cust-1/loyalty')
      .then(res => {
        if (res.success && res.data) {
          setLoyaltyData(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const points = loyaltyData?.pointsBalance || 450;
  const tier = loyaltyData?.tier || 'Gold';

  const handleRedeem = (reward: any) => {
    setRedeemedCoupon(`VOUCHER-${Date.now().toString().slice(-6)}`);
  };

  return (
    <CustomerLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Loyalty Rewards & Club Perks</h1>
          <p className="text-xs text-slate-500 mt-1">Earn points on every purchase and redeem for instant savings</p>
        </div>

        {/* Tier Card & Balance */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white p-8 rounded-3xl border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 inline-block">
              {tier.toUpperCase()} TIER VIP MEMBER
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black font-mono tracking-tight text-white">{points}</span>
              <span className="text-xs font-bold text-emerald-400 uppercase">Available Points</span>
            </div>
            <p className="text-xs text-slate-400">
              1 Point = ₹1.00 Cashback • 50 points away from Platinum VIP Tier
            </p>
          </div>

          {/* Tier Progress */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-300">Tier Status</span>
              <span className="text-amber-400 font-bold">{tier} (450/500 Pts)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full w-[90%]" />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Bronze</span>
              <span>Silver</span>
              <span className="text-amber-400 font-bold">Gold</span>
              <span>Platinum</span>
            </div>
          </div>
        </div>

        {/* Redeemable Rewards Catalog */}
        <div className="space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Gift className="w-4 h-4 text-emerald-600" /> Available Rewards to Redeem
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(loyaltyData?.redeemableRewards || [
              { id: '1', title: '₹100 Off Supermarket Grocery Voucher', pointsRequired: 200 },
              { id: '2', title: '₹250 Off Fresh Produce Basket', pointsRequired: 450 },
              { id: '3', title: '₹500 Mega Supermarket Savings Voucher', pointsRequired: 800 }
            ]).map((r: any) => (
              <div
                key={r.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{r.title}</h4>
                  <span className="text-xs font-mono font-bold text-emerald-600 mt-1 block">
                    {r.pointsRequired} Points Required
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={points < r.pointsRequired}
                  onClick={() => handleRedeem(r)}
                >
                  Redeem
                </Button>
              </div>
            ))}
          </div>

          {redeemedCoupon && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Voucher generated: <strong className="font-mono font-bold text-emerald-950">{redeemedCoupon}</strong></span>
              </div>
              <span className="text-[11px] text-emerald-700">Ready to use at checkout</span>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};
