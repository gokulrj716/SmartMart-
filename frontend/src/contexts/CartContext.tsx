import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, customUnitPrice?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  couponCode: string;
  applyCoupon: (code: string, discountAmount: number) => void;
  removeCoupon: () => void;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  couponDiscount: number;
  grandTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('smartmart_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('smartmart_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1, customUnitPrice?: number) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(i => i.product.id === product.id);
      const unitPrice = customUnitPrice !== undefined ? customUnitPrice : Number(product.price);
      const gstRate = Number(product.gst_rate || 5);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const current = updated[existingIndex];
        const newQty = product.is_weighted ? quantity : current.quantity + quantity;
        const itemSub = newQty * unitPrice;
        const taxAmount = Number(((itemSub * gstRate) / 100).toFixed(2));
        const total = Number((itemSub + taxAmount).toFixed(2));

        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          unitPrice,
          taxAmount,
          total
        };
        return updated;
      } else {
        const itemSub = quantity * unitPrice;
        const taxAmount = Number(((itemSub * gstRate) / 100).toFixed(2));
        const total = Number((itemSub + taxAmount).toFixed(2));

        return [
          ...prevItems,
          {
            product,
            quantity,
            unitPrice,
            discountAmount: 0,
            taxAmount,
            total,
            isWeighted: !!product.is_weighted
          }
        ];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.product.id === productId) {
          const itemSub = quantity * item.unitPrice;
          const taxRate = Number(item.product.gst_rate || 5);
          const taxAmount = Number(((itemSub * taxRate) / 100).toFixed(2));
          const total = Number((itemSub + taxAmount - item.discountAmount).toFixed(2));
          return {
            ...item,
            quantity,
            taxAmount,
            total
          };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(i => i.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    setCouponDiscount(0);
    localStorage.removeItem('smartmart_cart');
  };

  const applyCoupon = (code: string, discountAmount: number) => {
    setCouponCode(code);
    setCouponDiscount(discountAmount);
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const discountTotal = items.reduce((sum, item) => sum + item.discountAmount, 0) + couponDiscount;
  const grandTotal = Math.max(0, Number((subtotal + taxTotal - discountTotal).toFixed(2)));
  const itemCount = items.reduce((sum, item) => sum + (item.isWeighted ? 1 : item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        couponCode,
        applyCoupon,
        removeCoupon,
        subtotal: Number(subtotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
        discountTotal: Number(discountTotal.toFixed(2)),
        couponDiscount,
        grandTotal,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
