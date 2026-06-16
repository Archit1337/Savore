import React, { createContext, useState, useEffect, useContext } from 'react';
import { LocationContext } from './LocationContext';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { activeCity } = useContext(LocationContext);
  const { user, isAuthenticated } = useContext(AuthContext) || { user: null, isAuthenticated: false };
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('savore_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (err) {
      console.error('⚠️ Failed to parse saved cart state, resetting to empty list:', err.message);
      return [];
    }
  });

  const [restaurant, setRestaurant] = useState(() => {
    try {
      const savedRest = localStorage.getItem('savore_cart_restaurant');
      return savedRest ? JSON.parse(savedRest) : null;
    } catch (err) {
      console.error('⚠️ Failed to parse saved cart restaurant state, resetting to null:', err.message);
      return null;
    }
  });

  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('savore_cart', JSON.stringify(cartItems));
    if (restaurant) {
      localStorage.setItem('savore_cart_restaurant', JSON.stringify(restaurant));
    } else {
      localStorage.removeItem('savore_cart_restaurant');
    }
  }, [cartItems, restaurant]);

  // Add Item to Cart
  const addToCart = (foodItem, targetRestaurant, quantity = 1) => {
    // Check if this is the user's own restaurant (merchant simulation mode)
    const isOwnRestaurant = isAuthenticated && user && targetRestaurant && 
      (targetRestaurant.owner === user._id || targetRestaurant.owner?._id === user._id);

    // If target restaurant is outside user selected active city region, block checkout
    // EXCEPT if it is the owner's own restaurant (simulation mode)
    if (!isOwnRestaurant && activeCity && targetRestaurant.city && targetRestaurant.city.toLowerCase().trim() !== activeCity.toLowerCase().trim()) {
      throw new Error(
        `Region Lock Restriction: "${targetRestaurant.name}" is outside your active delivery region (${activeCity}).`
      );
    }

    // If the cart contains items from a different restaurant, throw an error
    if (restaurant && restaurant._id !== targetRestaurant._id) {
      throw new Error(
        `Cross-Restaurant Checkout Denied: Your cart already contains items from "${restaurant.name}". Please clear your cart first.`
      );
    }

    // Set active restaurant if not set
    if (!restaurant) {
      setRestaurant(targetRestaurant);
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.foodItem === foodItem._id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.foodItem === foodItem._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prevItems,
        {
          foodItem: foodItem._id,
          name: foodItem.name,
          price: foodItem.price,
          image: foodItem.image,
          quantity: quantity,
        },
      ];
    });
  };

  // Remove / Decrement Item
  const removeFromCart = (foodItemId) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.foodItem === foodItemId);
      if (!existingItem) return prevItems;

      if (existingItem.quantity <= 1) {
        const remaining = prevItems.filter((item) => item.foodItem !== foodItemId);
        if (remaining.length === 0) {
          setRestaurant(null);
        }
        return remaining;
      }

      return prevItems.map((item) =>
        item.foodItem === foodItemId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  // Completely delete a single food item row
  const deleteItemRow = (foodItemId) => {
    setCartItems((prevItems) => {
      const remaining = prevItems.filter((item) => item.foodItem !== foodItemId);
      if (remaining.length === 0) {
        setRestaurant(null);
      }
      return remaining;
    });
  };

  // Clear Cart
  const clearCart = () => {
    setCartItems([]);
    setRestaurant(null);
  };

  // Clear and Add to Cart
  const clearAndAddToCart = (foodItem, targetRestaurant, quantity = 1) => {
    setCartItems([
      {
        foodItem: foodItem._id,
        name: foodItem.name,
        price: foodItem.price,
        image: foodItem.image,
        quantity: quantity,
      }
    ]);
    setRestaurant(targetRestaurant);
  };

  // Totals calculations
  const itemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = parseFloat(cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2));
  const deliveryFee = restaurant ? restaurant.deliveryFee || 0 : 0;
  const tax = parseFloat((subtotal * 0.1).toFixed(2)); // 10% tax
  const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

  const value = {
    cartItems,
    restaurant,
    itemsCount,
    subtotal,
    deliveryFee,
    tax,
    total,
    addToCart,
    removeFromCart,
    deleteItemRow,
    clearCart,
    clearAndAddToCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
