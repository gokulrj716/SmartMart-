import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  Award,
  Zap,
  CheckCircle2,
  Apple,
  Carrot,
  Milk,
  Wheat,
  Coffee,
  Cookie
} from 'lucide-react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { ProductCard } from '../../components/ui/ProductCard';
import { WeighingScaleWidget } from '../../components/hardware/WeighingScaleWidget';
import { api } from '../../api/client';
import { Product } from '../../types';

export const CustomerHome: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [freshProducts, setFreshProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [scaleProduct, setScaleProduct] = useState<Product | null>(null);
  const [isScaleOpen, setIsScaleOpen] = useState(false);

  useEffect(() => {
    // Fetch categories
    api.get<any>('/categories')
      .then(res => {
        if (res.success) setCategories(res.data);
      })
      .catch(() => {});

    // Fetch fresh produce (weighted)
    api.get<any>('/products?isWeighted=true&limit=6')
      .then(res => {
        if (res.success) setFreshProducts(res.data);
      })
      .catch(() => {});

    // Fetch popular / deals
    api.get<any>('/products?limit=8')
      .then(res => {
        if (res.success) setDeals(res.data);
      })
      .catch(() => {});

    // Fetch AI recommendations
    api.get<any>('/ai/recommendations')
      .then(res => {
        if (res.success && res.data) setRecommended(res.data);
      })
      .catch(() => {});
  }, []);

  const handleOpenScaleModal = (product: Product) => {
    setScaleProduct(product);
    setIsScaleOpen(true);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Apple': return <Apple className="w-5 h-5 text-rose-500" />;
      case 'Carrot': return <Carrot className="w-5 h-5 text-amber-500" />;
      case 'Milk': return <Milk className="w-5 h-5 text-sky-500" />;
      case 'Wheat': return <Wheat className="w-5 h-5 text-yellow-600" />;
      case 'Coffee': return <Coffee className="w-5 h-5 text-amber-800" />;
      default: return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-12">
        {/* Modern Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Smart Supermarket • Automated Real-Time Inventory</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                Everything you need, <br />
                <span className="text-emerald-400">all in one place.</span>
              </h1>

              <p className="text-emerald-100 text-base max-w-xl leading-relaxed">
                Experience the next generation of supermarket shopping. Farm-fresh organic produce, authentic daily staples, smart digital weighing scales, and instant express billing.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/shop"
                  className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-sm"
                >
                  <span>Start Shopping</span>
                  <ArrowRight className="w-4 h-4 text-emerald-700" />
                </Link>
                <Link
                  to="/loyalty"
                  className="bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-2xl border border-emerald-600/60 backdrop-blur-md transition-all text-sm flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Join Loyalty Rewards</span>
                </Link>
              </div>

              {/* Value Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-emerald-800/80 text-xs">
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Farm Fresh Daily</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Accurate Electronic Weighing</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Zero Contactless Wait</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> Today's Flash Deal
                  </span>
                  <span className="text-[11px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                    25% OFF
                  </span>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600"
                  alt="Royal Gala Apples"
                  className="w-full h-48 object-cover rounded-2xl shadow-md"
                />
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h4 className="font-bold text-base">Royal Gala Apples</h4>
                    <p className="text-xs text-emerald-200">Farm Fresh • 1 kg</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-emerald-300">₹180.00</span>
                    <span className="text-xs text-slate-300 line-through block">₹210.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Browse Departments</h2>
              <p className="text-xs text-slate-500">Explore fresh groceries and household essentials</p>
            </div>
            <Link to="/categories" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.slice(0, 10).map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.id}`}
                className="group bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center mb-2.5 transition-colors">
                  {getCategoryIcon(cat.icon)}
                </div>
                <h4 className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {cat.name}
                </h4>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {cat.product_count || 12}+ Items
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Fresh Farm Produce (Weighted items with Scale integration) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">Farm Fresh Daily Produce</h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Harvested Today
                </span>
              </div>
              <p className="text-xs text-slate-500">Choose custom quantities weighed on electronic scales</p>
            </div>
            <Link to="/shop?category=cat-veg" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Explore Farm Fresh <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {freshProducts.map((p) => (
              <ProductCard key={p.id} product={p} onOpenScaleModal={handleOpenScaleModal} />
            ))}
          </div>
        </section>

        {/* AI Recommendations Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 p-6 sm:p-8 rounded-3xl border border-emerald-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recommended for You</h3>
                  <p className="text-xs text-slate-500">Personalized based on popular supermarket baskets</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommended.slice(0, 6).map((p) => (
                <ProductCard key={p.id} product={p} onOpenScaleModal={handleOpenScaleModal} />
              ))}
            </div>
          </div>
        </section>

        {/* Best Sellers & Daily Essentials */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Best Sellers & Grocery Essentials</h2>
              <p className="text-xs text-slate-500">Most loved household products</p>
            </div>
            <Link to="/shop" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Shop All Products <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {deals.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} onOpenScaleModal={handleOpenScaleModal} />
            ))}
          </div>
        </section>

        {/* Loyalty Reward Teaser Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="space-y-2 z-10">
              <span className="text-xs font-bold font-mono uppercase tracking-widest text-amber-400">
                SMARTMART REWARDS PROGRAM
              </span>
              <h3 className="text-2xl font-black">Earn Points on Every Purchase</h3>
              <p className="text-xs text-slate-300 max-w-lg">
                Earn 1 Loyalty Point for every ₹100 spent. Redeem points for instant cashback coupons, free delivery, and exclusive supermarket discounts.
              </p>
            </div>
            <Link
              to="/loyalty"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-2xl shadow-lg transition-all text-sm shrink-0 z-10"
            >
              Explore My Loyalty Perks
            </Link>
          </div>
        </section>
      </div>

      {/* Scale Modal for Produce */}
      <WeighingScaleWidget
        isOpen={isScaleOpen}
        onClose={() => setIsScaleOpen(false)}
        product={scaleProduct}
      />
    </CustomerLayout>
  );
};
