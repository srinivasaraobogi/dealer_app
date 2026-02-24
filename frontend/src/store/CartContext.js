import React, { createContext, useContext, useState, useCallback } from 'react';
import { cartAPI } from '../services/api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await cartAPI.get();
      setCart(res.data.data.cart);
      setPricing(res.data.data.pricing);
    } catch (error) {
      console.error('Fetch cart error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (productId, quantity) => {
    const res = await cartAPI.add({ productId, quantity });
    await fetchCart();
    return res.data;
  };

  const updateQuantity = async (productId, quantity) => {
    const res = await cartAPI.update(productId, quantity);
    setCart(res.data.data.cart);
    setPricing(res.data.data.pricing);
    return res.data;
  };

  const removeFromCart = async (productId) => {
    await cartAPI.remove(productId);
    await fetchCart();
  };

  const clearCart = async () => {
    await cartAPI.clear();
    await fetchCart();
  };

  const updateAddress = async (addressData) => {
    const res = await cartAPI.updateAddress(addressData);
    if (cart) {
      setCart(prev => ({ ...prev, deliveryAddress: res.data.data.deliveryAddress }));
    }
    setPricing(res.data.data.pricing);
    return res.data;
  };

  const itemCount = cart?.items?.length || 0;
  const cartContainsProduct = (productId) =>
    cart?.items?.some(item => item.productId === productId || item.productId?._id === productId) || false;

  return (
    <CartContext.Provider value={{
      cart,
      pricing,
      loading,
      itemCount,
      fetchCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      updateAddress,
      cartContainsProduct,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
