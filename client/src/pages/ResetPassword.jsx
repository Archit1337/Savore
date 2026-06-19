import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, RefreshCw, KeyRound, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

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

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data && res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setValidationError(err.message || 'Verification token is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="flex-center flex-1 py-[30px] px-6 relative -mt-16 md:-mt-20">
      {/* Background ambient overlays */}
      <div className="ambient-glow top-[10%] left-[10%]" />
      <div className="ambient-glow-tertiary bottom-[10%] right-[10%]" />

      <div className="glass-panel w-full max-w-[440px] p-10 rounded-[24px] border border-[var(--border-light)] text-left">
        {success ? (
          <div className="text-center">
            <div className="w-[56px] h-[56px] rounded-full bg-[rgba(57,181,74,0.1)] border border-[var(--accent)] flex items-center justify-center mx-auto mb-6 text-[var(--accent)]">
              <CheckCircle size={28} />
            </div>
            <h2 className="text-[24px] tracking-tight mb-3 font-extrabold text-[var(--text-primary)]">
              Password Reset Successful
            </h2>
            <p className="text-text-secondary text-[14px] leading-relaxed mb-8">
              Your account password has been successfully updated. You can now securely sign in to your dashboard.
            </p>
            <Link to="/login" className="btn btn-primary w-full py-3.5 px-5 rounded-[12px] flex items-center justify-center font-bold no-underline">
              Proceed to Login
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-[28px] mb-2 tracking-[-0.02em] font-extrabold text-[var(--text-primary)]">
              Reset Password
            </h2>
            <p className="text-text-secondary mb-8 text-[14px]">
              Set your new account access credentials.
            </p>

            {validationError && (
              <div className="bg-[rgba(255,180,171,0.1)] border border-[var(--error)] text-[var(--error)] rounded-lg py-3 px-4 flex items-center gap-2.5 mb-6 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-text-secondary mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="glass-input !pl-11 !pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
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

              <div>
                <label className="block text-[13px] font-semibold text-text-secondary mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="glass-input !pl-11 !pr-10"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary bg-transparent border-none p-0 cursor-pointer flex items-center justify-center"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full mt-3 py-3.5 px-5 rounded-[12px] flex items-center justify-center gap-2 font-bold ${loading ? 'btn-disabled' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-stir" size={16} /> Saving Credentials...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
