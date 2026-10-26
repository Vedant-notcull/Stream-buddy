import React, { useState } from 'react';
import { User, UserRole } from '../types/index.ts';
import { X, LogIn, UserPlus, Shield, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, balance: number) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState<string>('sam@sb.com');
  const [loginPassword, setLoginPassword] = useState<string>('demo123');
  const [login2faCode, setLogin2faCode] = useState<string>('');
  const [requires2fa, setRequires2fa] = useState<boolean>(false);

  // Signup form
  const [signupUsername, setSignupUsername] = useState<string>('');
  const [signupDisplayName, setSignupDisplayName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupRole, setSignupRole] = useState<UserRole>('fan');
  const [signup2fa, setSignup2fa] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          code2fa: login2faCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.requires2fa) {
        setRequires2fa(true);
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.user, data.balance);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupUsername,
          displayName: signupDisplayName,
          email: signupEmail,
          password: signupPassword,
          role: signupRole,
          twoFactor: signup2fa,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      onLoginSuccess(data.user, data.balance);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemoLogin = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('demo123');
    setRequires2fa(false);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-modal relative">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="sb-coin w-6 h-6 text-xs">🪙</div>
            <h2 className="text-base font-bold text-[var(--text-main)]">Account Access</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] my-4">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-[var(--bg-card)] text-[var(--accent-violet)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'signup'
                ? 'bg-[var(--bg-card)] text-[var(--accent-violet)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            New Account (+100 Bonus)
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-[var(--color-error)] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            {/* Quick Demo Credentials Fill Chips */}
            <div>
              <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">
                Quick Demo Accounts (1-Click Fill)
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => quickDemoLogin('sam@sb.com')}
                  className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] hover:border-[var(--accent-violet)] text-[11px] font-bold text-[var(--text-main)] text-center"
                >
                  Fan Sam
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('nova@sb.com')}
                  className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] hover:border-[var(--accent-violet)] text-[11px] font-bold text-[var(--text-main)] text-center"
                >
                  Creator Nova
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('admin@sb.com');
                    setLoginPassword('admin123');
                    setRequires2fa(false);
                  }}
                  className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] hover:border-[var(--accent-violet)] text-[11px] font-bold text-[var(--text-main)] text-center"
                >
                  Admin
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-[var(--text-main)] block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-main)] block mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
              />
            </div>

            {requires2fa && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-1.5 animate-modal">
                <label className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Two-Factor Authentication Code</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code (e.g. 123456)"
                  value={login2faCode}
                  onChange={(e) => setLogin2faCode(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-center tracking-widest text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
            </button>
          </form>
        )}

        {/* Signup Form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-[var(--text-main)] block mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="player1"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="font-semibold text-[var(--text-main)] block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={signupDisplayName}
                  onChange={(e) => setSignupDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[var(--text-main)] block mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="alex@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)]"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-main)] block mb-1">Password</label>
              <input
                type="password"
                required
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)]"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-main)] block mb-1">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignupRole('fan')}
                  className={`py-2 px-3 rounded-xl border font-bold text-center ${
                    signupRole === 'fan'
                      ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)] text-[var(--accent-violet)]'
                      : 'border-[var(--border-color)] text-[var(--text-muted)]'
                  }`}
                >
                  Fan (Supporter)
                </button>
                <button
                  type="button"
                  onClick={() => setSignupRole('creator')}
                  className={`py-2 px-3 rounded-xl border font-bold text-center ${
                    signupRole === 'creator'
                      ? 'border-[var(--accent-violet)] bg-[var(--accent-tint)] text-[var(--accent-violet)]'
                      : 'border-[var(--border-color)] text-[var(--text-muted)]'
                  }`}
                >
                  Creator (Streamer)
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={signup2fa}
                onChange={(e) => setSignup2fa(e.target.checked)}
                className="rounded border-[var(--border-color)] text-[var(--accent-violet)]"
              />
              <span className="text-[11px] text-[var(--text-muted)]">Enable optional Two-Factor Authentication</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-violet)] text-white font-bold hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'Creating Account...' : 'Create Account (+100 Coins)'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
