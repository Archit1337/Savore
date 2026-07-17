import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { LocationContext } from './LocationContext';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { activeCity } = useContext(LocationContext);
  const { user, isAuthenticated } = useContext(AuthContext) || { user: null, isAuthenticated: false };

  // Helper functions to compute storage keys based on user ID
  const getCartKey = (u) => (u && u._id ? `savore_cart_${u._id}` : 'savore_cart_guest');
  const getRestKey = (u) => (u && u._id ? `savore_cart_rest_${u._id}` : 'savore_cart_rest_guest');

  // Active user ID ref to track identity transitions
  const prevUserIdRef = useRef(user?._id);

  // Initial load helper for specified user identity
  const loadCartForUser = (targetUser) => {
    try {
      const cartKey = getCartKey(targetUser);
      const restKey = getRestKey(targetUser);

      const savedCart = localStorage.getItem(cartKey);
      const savedRest = localStorage.getItem(restKey);

      return {
        items: savedCart ? JSON.parse(savedCart) : [],
        restaurant: savedRest ? JSON.parse(savedRest) : null,
      };
    } catch (err) {
      console.error('⚠️ Failed to load cart state:', err.message);
      return { items: [], restaurant: null };
    }
  };

  const [cartItems, setCartItems] = useState(() => loadCartForUser(user).items);
  const [restaurant, setRestaurant] = useState(() => loadCartForUser(user).restaurant);

  // React to User Session Changes (Login, Logout, Account Switch)
  useEffect(() => {
    const currentUserId = user?._id;
    const prevUserId = prevUserIdRef.current;

    // Only run when identity actually changes
    if (currentUserId !== prevUserId) {
      // Case 1: Guest user logs in -> Seamlessly merge guest cart into user account
      if (!prevUserId && currentUserId) {
        try {
          const guestCartRaw = localStorage.getItem('savore_cart_guest');
          const guestRestRaw = localStorage.getItem('savore_cart_rest_guest');

          const guestItems = guestCartRaw ? JSON.parse(guestCartRaw) : [];
          const guestRest = guestRestRaw ? JSON.parse(guestRestRaw) : null;

          const userCart = loadCartForUser(user);

          if (guestItems.length > 0) {
            if (userCart.items.length === 0) {
              // User has empty cart -> absorb guest cart completely
              setCartItems(guestItems);
              setRestaurant(guestRest);
            } else if (userCart.restaurant?._id === guestRest?._id) {
              // User has existing cart from SAME restaurant -> merge items
              const mergedItems = [...userCart.items];
              guestItems.forEach((gItem) => {
                const idx = mergedItems.findIndex((uItem) => uItem.foodItem === gItem.foodItem);
                if (idx > -1) {
                  mergedItems[idx].quantity += gItem.quantity;
                } else {
                  mergedItems.push(gItem);
                }
              });
              setCartItems(mergedItems);
              setRestaurant(userCart.restaurant);
            } else {
              // User has cart from DIFFERENT restaurant -> retain user's existing cart
              setCartItems(userCart.items);
              setRestaurant(userCart.restaurant);
            }

            // Clear temporary guest cart after migration
            localStorage.removeItem('savore_cart_guest');
            localStorage.removeItem('savore_cart_rest_guest');
          } else {
            // No guest items -> load user's saved cart directly
            setCartItems(userCart.items);
            setRestaurant(userCart.restaurant);
          }
        } catch (err) {
          console.error('⚠️ Error migrating guest cart to user cart:', err.message);
          const fallback = loadCartForUser(user);
          setCartItems(fallback.items);
          setRestaurant(fallback.restaurant);
        }
      } else {
        // Case 2: Logout or Account Switch -> Load targeted user's cart directly
        const freshCart = loadCartForUser(user);
        setCartItems(freshCart.items);
        setRestaurant(freshCart.restaurant);
      }

      // Clean up any legacy global non-scoped keys if present
      localStorage.removeItem('savore_cart');
      localStorage.removeItem('savore_cart_restaurant');

      prevUserIdRef.current = currentUserId;
    }
  }, [user?._id]);

  // Persist current cartItems & restaurant state to active user's storage key
  useEffect(() => {
    try {
      const cartKey = getCartKey(user);
      const restKey = getRestKey(user);

      localStorage.setItem(cartKey, JSON.stringify(cartItems));
      if (restaurant) {
        localStorage.setItem(restKey, JSON.stringify(restaurant));
      } else {
        localStorage.removeItem(restKey);
      }
    } catch (err) {
      console.error('⚠️ Failed to persist cart state to localStorage:', err.message);
    }
  }, [cartItems, restaurant, user?._id]);

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
