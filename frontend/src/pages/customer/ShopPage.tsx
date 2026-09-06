import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, Scale, Sparkles } from 'lucide-react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { ProductCard } from '../../components/ui/ProductCard';
import { WeighingScaleWidget } from '../../components/hardware/WeighingScaleWidget';
import { api } from '../../api/client';
import { Product, Category } from '../../types';

export const ShopPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [weightedOnly, setWeightedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Scale Modal
  const [scaleProduct, setScaleProduct] = useState<Product | null>(null);
  const [isScaleOpen, setIsScaleOpen] = useState(false);

  useEffect(() => {
    api.get<any>('/categories')
      .then(res => {
        if (res.success) setCategories(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, inStockOnly, weightedOnly, sortBy, sortOrder]);

  const fetchProducts = async (term = search) => {
    setIsLoading(true);
    try {
      let query = `/products?limit=50&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (selectedCategory) query += `&category=${selectedCategory}`;
      if (term) query += `&search=${encodeURIComponent(term)}`;
      if (inStockOnly) query += `&inStock=true`;
      if (weightedOnly) query += `&isWeighted=true`;

      const res = await api.get<any>(query);
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const handleOpenScale = (p: Product) => {
    setScaleProduct(p);
    setIsScaleOpen(true);
  };

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title & Search Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Supermarket Product Catalog
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Showing {products.length} fresh products and grocery staples
            </p>
          </div>

          {/* Quick Search Form */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Layout with Filters on Left, Products on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar Filters */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" /> Filter Catalog
                </h3>
                {(selectedCategory || inStockOnly || weightedOnly) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setInStockOnly(false);
                      setWeightedOnly(false);
                    }}
                    className="text-[11px] text-emerald-600 hover:underline font-semibold"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                  Departments
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between ${
                      !selectedCategory ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Departments</span>
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === c.id ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.product_count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock and Weighted Toggles */}
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium">In Stock Items Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weightedOnly}
                    onChange={(e) => setWeightedOnly(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-amber-500" /> Weighing-Scale Produce
                  </span>
                </label>
              </div>

              {/* Sorting */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Sort Order
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [col, ord] = e.target.value.split('-');
                    setSortBy(col);
                    setSortOrder(ord);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 font-medium"
                >
                  <option value="name-asc">Alphabetical (A to Z)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock-desc">Stock Availability</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Product Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="bg-white rounded-2xl h-64 animate-pulse border border-slate-200 p-4" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Search className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-base">No Products Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search keywords or clearing active filters to browse our full grocery catalog.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                    setInStockOnly(false);
                    setWeightedOnly(false);
                    fetchProducts('');
                  }}
                  className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} onOpenScaleModal={handleOpenScale} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <WeighingScaleWidget
        isOpen={isScaleOpen}
        onClose={() => setIsScaleOpen(false)}
        product={scaleProduct}
      />
    </CustomerLayout>
  );
};
