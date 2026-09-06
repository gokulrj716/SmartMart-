import React from 'react';
import { ShoppingCart, Plus, Minus, Scale, Check } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { Badge } from './Badge';

export interface ProductCardProps {
  product: Product;
  onOpenScaleModal?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenScaleModal }) => {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find(i => i.product.id === product.id);

  const discountAmount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.min_stock_alert;

  const handleAdd = () => {
    if (product.is_weighted && onOpenScaleModal) {
      onOpenScaleModal(product);
    } else {
      addItem(product, 1);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-200 flex flex-col justify-between">
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {discountAmount > 0 && (
          <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            {discountAmount}% OFF
          </span>
        )}
        {product.is_weighted ? (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Scale className="w-3 h-3" /> WEIGHTED
          </span>
        ) : null}
      </div>

      {/* Product Image */}
      <div className="relative aspect-square w-full mb-3 overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">{product.brand_name || 'SmartMart'}</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">{product.unit}</span>
          </div>
          <h4 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h4>
        </div>

        {/* Stock status indicator */}
        <div className="mb-3">
          {isLowStock ? (
            <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
              Only {product.stock} {product.unit} left!
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> In Stock ({product.stock} {product.unit})
            </span>
          )}
        </div>

        {/* Pricing and Add to Cart */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900">₹{product.price.toFixed(2)}</span>
              {product.mrp > product.price && (
                <span className="text-xs text-slate-400 line-through">₹{product.mrp.toFixed(2)}</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">Incl. {product.gst_rate}% GST</span>
          </div>

          <div>
            {cartItem && !product.is_weighted ? (
              <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-xl p-0.5">
                <button
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center text-emerald-700 hover:bg-emerald-200/60 rounded-lg transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-bold text-sm text-emerald-900">{cartItem.quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-emerald-700 hover:bg-emerald-200/60 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/20"
              >
                {product.is_weighted ? <Scale className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                <span>{product.is_weighted ? 'Weigh & Add' : 'Add'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
