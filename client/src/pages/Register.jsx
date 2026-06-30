import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, MapPin, Store, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

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

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const role = 'customer'; // Default role is strictly Diner Customer
  const [address, setAddress] = useState('');
  const [validationError, setValidationError] = useState('');
  const { registerUser, error, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    if (score === 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
    if (score === 4) return { score: 4, label: 'Strong', color: 'bg-green-500' };
    return { score: 0, label: '', color: '' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!username || !email || !password) {
      setValidationError('Username, email, and password fields are mandatory.');
      return;
    }

    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    try {
      const user = await registerUser({ username, email, password, role, address });
      if (user.role === 'restaurant') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      // Handled in Context
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="flex-center flex-1 py-[30px] px-6 relative -mt-16 md:-mt-20">
      <div className="ambient-glow top-[5%] right-[10%]" />
      <div className="ambient-glow-tertiary bottom-[5%] left-[10%]" />

      <div className="glass-panel w-full max-w-[480px] p-10 rounded-[24px] border border-[var(--border-light)] text-left relative z-10">
        <h2 className="text-[28px] mb-2 tracking-[-0.02em] font-extrabold text-[var(--text-primary)]">
          Create your account
        </h2>
        <p className="text-text-secondary mb-8 text-[15px]">
          Where food discovery meets cinematic storytelling. Sign up to begin.
        </p>

        {/* Error Notification */}
        {(validationError || error) && (
          <div className="bg-[rgba(255,180,171,0.1)] border border-[var(--error,#ffb4ab)] text-[var(--error,#ffb4ab)] rounded-lg py-3 px-4 flex items-center gap-2.5 mb-6 text-sm">
            <AlertCircle size={16} />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Username */}
          <div>
            <label className="block text-[13px] font-semibold text-text-secondary mb-2">
              Username
            </label>
            <div className="relative">
              <User 
                size={18} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" 
              />
              <input 
                type="text" 
                className="glass-input !pl-11" 
                placeholder="savore_lover"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
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
                type={showPassword ? 'text' : 'password'} 
                className="glass-input !pl-11 !pr-10" 
                placeholder="Min. 6 characters"
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
            
            {/* Password Strength Meter */}
            {password && (
              <div className="mt-2.5 transition-all duration-300 animate-slide-down select-none">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-text-secondary">Password Strength:</span>
                  <span className={`font-bold ${
                    strength.score === 1 ? 'text-red-500' :
                    strength.score === 2 ? 'text-orange-500' :
                    strength.score === 3 ? 'text-yellow-500' : 'text-green-500'
                  }`}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                  <div className={`h-full flex-1 transition-all duration-500 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-all duration-500 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-all duration-500 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-all duration-500 ${strength.score >= 4 ? strength.color : 'bg-transparent'}`} />
                </div>
              </div>
            )}
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-[13px] font-semibold text-text-secondary mb-2">
              Delivery Address (Optional)
            </label>
            <div className="relative">
              <MapPin 
                size={18} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" 
              />
              <input 
                type="text" 
                className="glass-input !pl-11" 
                placeholder="e.g. 12 Rue de L'Ambroisie, Paris"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            className={`btn btn-primary w-full mt-3 py-3.5 px-5 rounded-[12px] relative overflow-hidden group select-none cursor-pointer border border-transparent text-white bg-primary ${loading ? 'btn-disabled' : ''}`}
            disabled={loading}
          >
            <span className="absolute inset-0 w-full h-full bg-[var(--text-primary)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
            <span className="relative z-10 group-hover:text-background-primary transition-colors duration-300 flex items-center justify-center gap-2">
              <UserPlus size={16} />
              {loading ? 'Registering Account...' : 'Create Account'}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2 select-none">
            <div className="h-[1px] flex-1 bg-black/5 dark:bg-white/10" />
            <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase">Or continue with</span>
            <div className="h-[1px] flex-1 bg-black/5 dark:bg-white/10" />
          </div>

          {/* Social Signups */}
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

        <p className="mt-7 text-sm text-center text-text-secondary select-none">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold no-underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
