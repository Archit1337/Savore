import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { ReelsProvider } from './context/ReelsContext';
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <OrderProvider>
                <ReelsProvider>
                  <App />
                </ReelsProvider>
              </OrderProvider>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
