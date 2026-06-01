import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

export default function Login() {
  const [activeTab, setActiveTab] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP Flow States
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const [validationError, setValidationError] = useState('');
  const { loginUser, loginWithOTP, error, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Clean up timer interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown handler
  const startCountdown = () => {
    setTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setValidationError('Please provide your registered email address first.');
      return;
    }

    setValidationError('');
    setOtpLoading(true);

    try {
      const res = await api.post('/auth/otp/generate', { email });
      if (res.data && res.data.success) {
        setOtpSent(true);
        startCountdown();
        // Clear any previous errors
        setValidationError('');
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || err.message || 'Failed to send verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
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

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !otp) {
      setValidationError('Please fill in both email and verification code.');
      return;
    }

    if (otp.length !== 6 || isNaN(otp)) {
      setValidationError('Please enter a valid 6-digit numeric verification code.');
      return;
    }

    try {
      const user = await loginWithOTP(email, otp);
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
        <h2 className="text-[28px] mb-2 tracking-[-0.02em] font-extrabold text-[var(--text-primary)]">
          Welcome back
        </h2>
        <p className="text-text-secondary mb-6 text-[15px]">
          Log in to savor elite food delivery & social dining reels feed.
        </p>

        {/* Double-Tab Glassmorphic Mode Switcher */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1.5 mb-7 relative select-none">
          <button
            type="button"
            className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 z-10 ${
              activeTab === 'password'
                ? 'bg-white/10 text-white shadow-md backdrop-blur-md border border-white/10'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => {
              setActiveTab('password');
              setValidationError('');
            }}
          >
            <Lock size={13} />
            Password
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 z-10 ${
              activeTab === 'otp'
                ? 'bg-white/10 text-white shadow-md backdrop-blur-md border border-white/10'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => {
              setActiveTab('otp');
              setValidationError('');
            }}
          >
            <ShieldCheck size={14} />
            Secure OTP
          </button>
        </div>

        {/* Error Cards */}
        {(validationError || error) && (
          <div className="bg-[rgba(255,180,171,0.1)] border border-[var(--error,#ffb4ab)] text-[var(--error,#ffb4ab)] rounded-lg py-3 px-4 flex items-center gap-2.5 mb-6 text-sm">
            <AlertCircle size={16} />
            <span>{validationError || error}</span>
          </div>
        )}

        {/* STANDARD PASSWORD LOGIN FORM */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
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
        )}

        {/* SECURE EMAIL OTP LOGIN FORM */}
        {activeTab === 'otp' && (
          <form onSubmit={handleOTPSubmit} className="flex flex-col gap-5">
            {/* Email Input Row */}
            <div>
              <label className="block text-[13px] font-semibold text-text-secondary mb-2">
                Registered Email Address
              </label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Mail 
                    size={18} 
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" 
                  />
                  <input 
                    type="email" 
                    className="glass-input !pl-11" 
                    placeholder="customer@savore.com"
                    value={email}
                    disabled={otpSent || otpLoading}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className={`btn btn-primary !h-[44px] !px-4 text-[12px] rounded-[12px] font-bold ${
                      otpLoading ? 'btn-disabled' : ''
                    }`}
                    disabled={otpLoading}
                  >
                    {otpLoading ? 'Sending...' : 'Send Code'}
                  </button>
                )}
              </div>
            </div>

            {/* OTP Passcode Row */}
            {otpSent && (
              <div className="transition-all duration-300 animate-slide-down">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[13px] font-semibold text-text-secondary">
                    Verification Passcode
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className={`text-[12px] font-bold text-primary hover:underline bg-transparent border-none p-0 cursor-pointer ${
                      timer > 0 || otpLoading ? 'opacity-50 pointer-events-none' : ''
                    }`}
                    disabled={timer > 0 || otpLoading}
                  >
                    {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound 
                    size={18} 
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" 
                  />
                  <input 
                    type="text" 
                    maxLength={6}
                    className="glass-input !pl-11 font-mono tracking-[0.2em] text-[16px]" 
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
            )}

            {/* Submit Action (Only visible after OTP is sent) */}
            {otpSent && (
              <button 
                type="submit" 
                className={`btn btn-primary w-full mt-2 py-3.5 px-5 rounded-[12px] ${loading ? 'btn-disabled' : ''}`}
                disabled={loading}
              >
                <LogIn size={16} />
                {loading ? 'Logging in...' : 'Verify & Secure Login'}
              </button>
            )}
          </form>
        )}

        <p className="mt-7 text-sm text-center text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold no-underline">
            Register here
          </Link>
        </p>

        {/* Demo credentials guide card */}
        <div className="mt-8 bg-[var(--surface-container)] rounded-[12px] p-4 border border-[var(--border-light)] text-[12px] leading-relaxed select-none">
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
