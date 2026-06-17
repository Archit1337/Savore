import React, { createContext, useState, useContext } from 'react';
import api from '../utils/api';
import { CartContext } from './CartContext';
import { LocationContext } from './LocationContext';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { clearCart } = useContext(CartContext);
  const { activeCity } = useContext(LocationContext);
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Place a new order
  const placeOrder = async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/orders', orderData, {
        headers: {
          'x-user-region': activeCity || ''
        }
      });
      if (res.data && res.data.success) {
        const newOrder = res.data.data;
        setOrders((prev) => [newOrder, ...prev]);
        setActiveOrder(newOrder);
        
        // Clear shopping cart on successful checkout (for CARD, clear it in the payment gateway upon successful payment)
        if (orderData.paymentMethod !== 'CARD') {
          clearCart();
        }
        return newOrder;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get order details
  const getOrderDetails = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data && res.data.success) {
        const order = res.data.data;
        setActiveOrder(order);
        return order;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch client's order history
  const fetchCustomerOrders = async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/customer?page=${page}&limit=${limit}`);
      return res.data; // contains { data: [], page, totalPages }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch merchant's incoming orders
  const fetchRestaurantOrders = async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/restaurant?page=${page}&limit=${limit}`);
      return res.data; // contains { data: [], page, totalPages }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin orders
  const fetchAdminOrders = async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/admin?page=${page}&limit=${limit}`);
      return res.data; // contains { data: [], page, totalPages }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update order status (Owner / Admin)
  const updateOrderStatus = async (orderId, newStatus) => {
    setError(null);
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data && res.data.success) {
        const updatedOrder = res.data.data;
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
        if (activeOrder && activeOrder._id === orderId) {
          setActiveOrder((prev) => ({ ...prev, status: newStatus }));
        }
        return updatedOrder;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    orders,
    activeOrder,
    loading,
    error,
    placeOrder,
    getOrderDetails,
    fetchCustomerOrders,
    fetchRestaurantOrders,
    fetchAdminOrders,
    updateOrderStatus,
    setActiveOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
