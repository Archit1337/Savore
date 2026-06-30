import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="shrink-0 text-black dark:text-white">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.51-.64.73-1.2 1.87-1.05 2.98 1.11.09 2.24-.59 2.98-1.43z" />
  </svg>
);

export default function Login() {
  const [activeTab, setActiveTab] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP Flow States
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const [validationError, setValidationError] = useState('');
  const { loginUser, loginWithOTP, error, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Forgot Password States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (res.data && res.data.success) {
        setForgotSuccess(true);
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Failed to dispatch recovery email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex-center flex-1 py-[30px] px-6 relative -mt-16 md:-mt-20">
      {/* Background ambient overlays */}
      <div className="ambient-glow top-[10%] left-[10%]" />
      <div className="ambient-glow-tertiary bottom-[10%] right-[10%]" />

      <div className="glass-panel w-full max-w-[440px] p-10 rounded-[24px] border border-[var(--border-light)] text-left relative z-10">
        <h2 className="text-[28px] mb-2 tracking-[-0.02em] font-extrabold text-[var(--text-primary)]">
          Welcome back
        </h2>
        <p className="text-text-secondary mb-6 text-[15px]">
          Log in to savor food delivery & social dining reels feed.
        </p>

        {/* Double-Tab Glassmorphic Mode Switcher */}
        <div className="flex bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-1.5 mb-7 relative select-none">
          {/* Sliding active background indicator */}
          {activeTab === 'password' ? (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute top-1.5 bottom-1.5 left-1.5 rounded-lg bg-primary z-0 shadow-lg shadow-primary/20"
              style={{ width: 'calc(50% - 6px)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            />
          ) : (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute top-1.5 bottom-1.5 right-1.5 rounded-lg bg-primary z-0 shadow-lg shadow-primary/20"
              style={{ width: 'calc(50% - 6px)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            />
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2.5 px-3 rounded-lg text-[13px] font-bold tracking-wide flex items-center justify-center gap-1.5 z-10 cursor-pointer relative bg-transparent border-none outline-none"
            onClick={() => {
              setActiveTab('password');
              setValidationError('');
            }}
          >
            <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-300 ${
              activeTab === 'password' ? 'text-white' : 'text-text-secondary hover:text-text-primary'
            }`}>
              <Lock size={13} />
              Password
            </span>
          </motion.button>
          
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2.5 px-3 rounded-lg text-[13px] font-bold tracking-wide flex items-center justify-center gap-1.5 z-10 cursor-pointer relative bg-transparent border-none outline-none"
            onClick={() => {
              setActiveTab('otp');
              setValidationError('');
            }}
          >
            <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-300 ${
              activeTab === 'otp' ? 'text-white' : 'text-text-secondary hover:text-text-primary'
            }`}>
              <ShieldCheck size={14} />
              Secure OTP
            </span>
          </motion.button>
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[13px] font-semibold text-text-secondary">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[12px] font-bold text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock 
                  size={18} 
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" 
                />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="glass-input !pl-11 !pr-10" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary bg-transparent border-none p-0 cursor-pointer flex items-center justify-center"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button 
              type="submit" 
              className={`btn btn-primary w-full mt-2 py-3.5 px-5 rounded-[12px] relative overflow-hidden group select-none cursor-pointer border border-transparent text-white bg-primary ${loading ? 'btn-disabled' : ''}`}
              disabled={loading}
            >
              <span className="absolute inset-0 w-full h-full bg-[var(--text-primary)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
              <span className="relative z-10 group-hover:text-background-primary transition-colors duration-300 flex items-center justify-center gap-2">
                <LogIn size={16} />
                {loading ? 'Authenticating...' : 'Sign In'}
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2 select-none">
              <div className="h-[1px] flex-1 bg-black/5 dark:bg-white/10" />
              <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase">Or continue with</span>
              <div className="h-[1px] flex-1 bg-black/5 dark:bg-white/10" />
            </div>

            {/* Social Logins */}
            <div className="flex gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => alert('Social authentication handler simulation (Google)')}
                className="flex-1 py-2.5 px-4 rounded-[12px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-[12.5px] font-bold transition-all flex items-center justify-center cursor-pointer gap-2"
              >
                <GoogleIcon />
                Google
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => alert('Social authentication handler simulation (Apple)')}
                className="flex-1 py-2.5 px-4 rounded-[12px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-[12.5px] font-bold transition-all flex items-center justify-center cursor-pointer gap-2"
              >
                <AppleIcon />
                Apple
              </motion.button>
            </div>
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

        <p className="mt-7 text-sm text-center text-text-secondary select-none">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold no-underline">
            Register here
          </Link>
        </p>
      </div>

      {/* Forgot Password Backdrop Modal Overlay */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                if (!forgotLoading) {
                  setIsForgotModalOpen(false);
                  setForgotSuccess(false);
                  setForgotEmail('');
                  setForgotError('');
                }
              }}
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="glass-panel w-full max-w-[400px] p-8 rounded-[24px] border border-[var(--border-light)] relative z-10 text-left"
            >
              {forgotSuccess ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-[rgba(57,181,74,0.1)] border border-[var(--accent)] flex items-center justify-center mx-auto mb-5 text-[var(--accent)]">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-[20px] font-bold text-text-primary mb-2">
                    Check your inbox
                  </h3>
                  <p className="text-text-secondary text-[13.5px] leading-relaxed mb-6">
                    We've dispatched recovery credentials to <span className="text-text-primary font-semibold">{forgotEmail}</span> if a matching account exists.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotSuccess(false);
                      setForgotEmail('');
                    }}
                    className="btn btn-primary w-full py-3.5 rounded-[12px] font-bold"
                  >
                    Got it, thanks!
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-[20px] font-bold text-text-primary mb-1.5">
                      Recover Password
                    </h3>
                    <p className="text-text-secondary text-[13.5px]">
                      Enter your account email to dispatch secure reset instructions.
                    </p>
                  </div>
                  
                  {forgotError && (
                    <div className="bg-[rgba(255,180,171,0.1)] border border-[var(--error,#ffb4ab)] text-[var(--error,#ffb4ab)] rounded-lg py-2.5 px-3.5 flex items-center gap-2 text-[13px]">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-[12.5px] font-semibold text-text-secondary mb-2">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="email"
                        required
                        className="glass-input !pl-11"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={forgotLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(false);
                        setForgotError('');
                        setForgotEmail('');
                      }}
                      className="flex-1 py-3 px-4 rounded-[12px] bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/20 dark:hover:bg-white/10 text-text-primary text-[13.5px] font-bold transition-all cursor-pointer"
                      disabled={forgotLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`flex-2 btn btn-primary py-3 px-4 rounded-[12px] text-[13.5px] font-bold cursor-pointer ${forgotLoading ? 'btn-disabled' : ''}`}
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? 'Sending...' : 'Send Link'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
