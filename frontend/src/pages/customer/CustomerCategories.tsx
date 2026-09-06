import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { api } from '../../api/client';
import { Category } from '../../types';

export const CustomerCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get<any>('/categories')
      .then(res => {
        if (res.success) setCategories(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">All Supermarket Departments</h1>
          <p className="text-xs text-slate-500 mt-1">Shop by category across fresh produce, grocery staples, and household goods</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.id}`}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center justify-between group"
            >
              <div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.description}</p>
                <span className="text-[11px] font-mono text-emerald-600 font-bold mt-2 block">
                  {c.product_count || 12}+ Products Available
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </CustomerLayout>
  );
};
