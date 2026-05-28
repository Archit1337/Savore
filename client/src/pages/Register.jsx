import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, MapPin, Store, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // default
  const [address, setAddress] = useState('');
  const [validationError, setValidationError] = useState('');
  const { registerUser, error, loading } = useContext(AuthContext);
  const navigate = useNavigate();

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

  return (
    <div className="flex-center flex-1 py-[30px] px-6 relative -mt-10 md:-mt-14">
      <div className="ambient-glow top-[5%] right-[10%]" />
      <div className="ambient-glow-tertiary bottom-[5%] left-[10%]" />

      <div className="glass-panel w-full max-w-[480px] p-10 rounded-[24px] border border-[var(--border-light)] text-left">
        <h2 className="text-[28px] mb-2 tracking-[-0.02em]">
          Create your account
        </h2>
        <p className="text-text-secondary mb-8 text-[15px]">
          Sign up to experience premium culinary dining.
        </p>

        {/* Error Notification */}
        {(validationError || error) && (
          <div className="bg-[rgba(255,180,171,0.1)] border border-[var(--error,#ffb4ab)] text-[var(--error,#ffb4ab)] rounded-lg py-3 px-4 flex items-center gap-2.5 mb-6 text-sm">
            <AlertCircle size={16} />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
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
                type="password" 
                className="glass-input !pl-11" 
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Role selector buttons */}
          <div>
            <label className="block text-[13px] font-semibold text-text-secondary mb-2">
              Join Savoré As
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                className={`chip flex-1 py-3 px-4 flex gap-2 justify-center ${role === 'customer' ? 'active' : ''}`}
                onClick={() => setRole('customer')}
              >
                <User size={16} />
                Client Diner
              </button>
              <button
                type="button"
                className={`chip flex-1 py-3 px-4 flex gap-2 justify-center ${role === 'restaurant' ? 'active' : ''}`}
                onClick={() => setRole('restaurant')}
              >
                <Store size={16} />
                Restaurant Owner
              </button>
            </div>
          </div>

          {/* Default address */}
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
            className={`btn btn-primary w-full mt-3 py-3.5 px-5 rounded-[12px] ${loading ? 'btn-disabled' : ''}`}
            disabled={loading}
          >
            <UserPlus size={16} />
            {loading ? 'Registering Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-7 text-sm text-center text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold no-underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
