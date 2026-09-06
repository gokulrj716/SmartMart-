import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight,
  Truck,
  RotateCcw
} from 'lucide-react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { WeighingScaleWidget } from '../../components/hardware/WeighingScaleWidget';
import { useCart } from '../../contexts/CartContext';
import { api } from '../../api/client';
import { Product } from '../../types';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [frequentlyBought, setFrequentlyBought] = useState<Product[]>([]);
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.get<any>(`/products/${id}`)
      .then(res => {
        if (res.success && res.data) {
          setProduct(res.data);
          // Fetch frequently bought together based on SKU
          api.get<any>(`/ai/recommendations?sku=${res.data.sku}`)
            .then(recRes => {
              if (recRes.success && recRes.data) {
                setFrequentlyBought(recRes.data);
              }
            })
            .catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading || !product) {
    return (
      <CustomerLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-500 font-medium">Loading product details...</p>
        </div>
      </CustomerLayout>
    );
  }

  const discountAmount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const handleAddToCart = () => {
    if (product.is_weighted) {
      setIsScaleOpen(true);
    } else {
      addItem(product, quantity);
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Main Product Presentation */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Image Canvas */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-6">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'}
              alt={product.name}
              className="w-full h-full object-cover object-center rounded-xl"
            />
            {discountAmount > 0 && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-sm">
                {discountAmount}% OFF
              </span>
            )}
            {product.is_weighted ? (
              <span className="absolute top-4 right-4 bg-amber-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" /> WEIGHTED PRODUCE
              </span>
            ) : null}
          </div>

          {/* Details & Controls */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {product.category_name || 'Grocery'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {product.name}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Brand: <strong className="text-slate-800">{product.brand_name || 'SmartMart'}</strong> • SKU: {product.sku}
              </p>
            </div>

            {/* Price section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                ₹{product.price.toFixed(2)}
              </span>
              {product.mrp > product.price && (
                <span className="text-base text-slate-400 line-through">
                  ₹{product.mrp.toFixed(2)}
                </span>
              )}
              <span className="text-xs text-slate-500">
                / {product.unit} (Incl. {product.gst_rate}% GST)
              </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description || 'Premium quality supermarket selection sourced from verified suppliers and inspected under strict cold-chain standards.'}
            </p>

            {/* Stock status */}
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="font-semibold text-slate-700">
                {product.stock > 0 ? `Available in stock: ${product.stock} ${product.unit}` : 'Temporarily Out of Stock'}
              </span>
            </div>

            {/* Quantity Selector & Action */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              {!product.is_weighted && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Select Quantity:</span>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center hover:bg-slate-100 text-slate-700 shadow-2xs"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-slate-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center hover:bg-slate-100 text-slate-700 shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{product.is_weighted ? 'Weigh on Scale & Add' : 'Add to Shopping Cart'}</span>
                </button>
              </div>
            </div>

            {/* Assurance Badges */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Express Express Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>7-Day Return Guarantee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Basket: Frequently Bought Together Combo */}
        {frequentlyBought.length > 0 && (
          <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Frequently Bought Together</h3>
                <p className="text-xs text-slate-400">Common customer pairing discovered by Market Basket AI</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {frequentlyBought.map(p => (
                <div key={p.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-slate-100 line-clamp-1">{p.name}</h5>
                    <p className="font-mono text-xs text-emerald-400 mt-1">₹{p.price.toFixed(2)} / {p.unit}</p>
                  </div>
                  <button
                    onClick={() => addItem(p, 1)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <WeighingScaleWidget
        isOpen={isScaleOpen}
        onClose={() => setIsScaleOpen(false)}
        product={product}
      />
    </CustomerLayout>
  );
};
