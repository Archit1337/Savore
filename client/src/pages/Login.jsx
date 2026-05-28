import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { loginUser, error, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please fill in all email and password fields.');
      return;
    }

    try {
      const user = await loginUser(email, password);
      // Route appropriately based on user role
      if (user.role === 'restaurant') {
        navigate('/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      // Handled in Context state
    }
  };

  return (
    <div className="flex-center flex-1 py-[30px] px-6 relative -mt-10 md:-mt-14">
      {/* Background ambient overlays */}
      <div className="ambient-glow top-[10%] left-[10%]" />
      <div className="ambient-glow-tertiary bottom-[10%] right-[10%]" />

      <div className="glass-panel w-full max-w-[440px] p-10 rounded-[24px] border border-[var(--border-light)] text-left">
        <h2 className="text-[28px] mb-2 tracking-[-0.02em]">
          Welcome back
        </h2>
        <p className="text-text-secondary mb-8 text-[15px]">
          Log in to savor elite food delivery & social dining reels feed.
        </p>

        {/* Error Cards */}
        {(validationError || error) && (
          <div className="bg-[rgba(255,180,171,0.1)] border border-[var(--error,#ffb4ab)] text-[var(--error,#ffb4ab)] rounded-lg py-3 px-4 flex items-center gap-2.5 mb-6 text-sm">
            <AlertCircle size={16} />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email input row */}
          <div>
            <label className="block text-[13px] font-semibold text-text-secondary mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail 
                size={18} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" 
              />
              <input 
                type="email" 
                className="glass-input !pl-11" 
                placeholder="customer@savore.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password input row */}
          <div>
            <label className="block text-[13px] font-semibold text-text-secondary mb-2">
              Password
            </label>
            <div className="relative">
              <Lock 
                size={18} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" 
              />
              <input 
                type="password" 
                className="glass-input !pl-11" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            className={`btn btn-primary w-full mt-2 py-3.5 px-5 rounded-[12px] ${loading ? 'btn-disabled' : ''}`}
            disabled={loading}
          >
            <LogIn size={16} />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-7 text-sm text-center text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold no-underline">
            Register here
          </Link>
        </p>

        {/* Demo credentials guide card */}
        <div className="mt-8 bg-[var(--surface-container)] rounded-[12px] p-4 border border-[var(--border-light)] text-[12px] leading-relaxed">
          <span className="font-bold text-primary block mb-1.5">
            🔑 Demo Testing Credentials (Password: password123)
          </span>
          <div>• Customer Account: <strong>customer@savore.com</strong></div>
          <div>• Restaurant Owner: <strong>owner@savore.com</strong></div>
          <div>• Admin Master: <strong>admin@savore.com</strong></div>
        </div>
      </div>
    </div>
  );
}
