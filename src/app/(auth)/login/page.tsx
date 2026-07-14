'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { MOCK_CREDENTIALS } from '@/lib/constants';
import { roleRedirects } from '@/lib/navigation';
import {
  Building2, Users, Layers, Shield, ArrowRight, Loader2,
  Eye, EyeOff, Lock, Mail, CheckCircle2, Wifi,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserRole } from '@/types/user';
import Link from 'next/link';

/* ─── Animations ─── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ─── Role config ─── */
const ROLE_META: Record<UserRole, { label: string; desc: string; icon: typeof Building2; color: string }> = {
  investor: { label: 'Investor',  desc: 'Portfolio & deals',      icon: Building2, color: '#8B7355' },
  broker:   { label: 'Broker',    desc: 'Listings & clients',     icon: Users,     color: '#8B6B47' },
  developer:{ label: 'Developer', desc: 'Projects & analytics',   icon: Layers,    color: '#8B7355' },
  admin:    { label: 'Admin',     desc: 'System control',         icon: Shield,    color: '#9F7C3F' },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (loginEmail: string, loginPassword: string, role?: string) => {
    setError('');
    setIsLoading(true);
    if (role) setLoadingRole(role);
    try {
      const loggedInUser = await login(loginEmail, loginPassword);
      const redirect = roleRedirects[loggedInUser.role] ?? '/investor';
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Access denied');
    } finally {
      setIsLoading(false);
      setLoadingRole(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-start justify-between mb-8">
        <div>
          <h2
            className="text-[26px] font-semibold text-white/95 tracking-[-0.02em] leading-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Sign in
          </h2>
          <p className="mt-1.5 text-[13px] text-white/40 leading-relaxed">
            Enter your credentials to continue
          </p>
        </div>
        <div className="it-status-badge mt-1 shrink-0">
          <span className="it-status-dot" />
          <span>Online</span>
        </div>
      </motion.div>

      {/* ── Form ── */}
      <motion.form variants={fadeUp} onSubmit={handleSubmit}>

        {/* Email */}
        <div>
          <label className="it-field-label">Email</label>
          <div className="relative it-input-wrap">
            <Mail className="it-input-icon" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="it-input"
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="it-field-label !mb-0">Password</label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium transition-colors duration-200"
              style={{ color: '#B8A99A' }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative it-input-wrap">
            <Lock className="it-input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="it-input !pr-12"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-200 cursor-pointer"
              style={{ color: '#A89C8B' }}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={`it-toggle${rememberMe ? ' active' : ''}`}
            aria-pressed={rememberMe}
          >
            <span className="it-toggle-thumb" />
          </button>
          <span className="it-toggle-label" onClick={() => setRememberMe(!rememberMe)}>
            Remember me
          </span>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg px-4 py-3 text-[12px] flex items-center gap-2"
            style={{
              border: '1px solid rgba(180, 60, 40, 0.15)',
              background: 'rgba(180, 60, 40, 0.05)',
              color: '#C24A3A',
            }}
          >
            <Shield className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* CTA */}
        <div className="mt-7">
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="it-submit-btn w-full group"
          >
            {isLoading && !loadingRole ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 it-divider" />
          <span
            className="text-[10px] uppercase tracking-[0.12em] font-medium whitespace-nowrap"
            style={{ color: '#C4B9AC' }}
          >
            or continue with
          </span>
          <div className="flex-1 it-divider" />
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button type="button" className="it-social-btn group">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </button>
          <button type="button" className="it-social-btn group">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#1D1D1F' }}>
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span>Apple</span>
          </button>
        </div>
      </motion.form>

      {/* ─── Quick Access ─── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-4 mt-8 mb-4">
          <div className="flex-1 it-divider" />
          <span
            className="text-[10px] uppercase tracking-[0.12em] font-medium whitespace-nowrap"
            style={{ color: '#C4B9AC' }}
          >
            Quick Access
          </span>
          <div className="flex-1 it-divider" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {MOCK_CREDENTIALS
            .filter((cred) => cred.role === 'investor' || cred.role === 'broker')
            .map((cred) => {
              const meta = ROLE_META[cred.role];
              const Icon = meta.icon;
              const isThisLoading = loadingRole === cred.role;
              const isPrimary = cred.role === 'investor';
              return (
                <button
                  key={cred.role}
                  onClick={() => handleLogin(cred.email, cred.password, cred.role)}
                  disabled={isLoading}
                  aria-label={`Quick sign in as ${meta.label}`}
                  className={`it-role-card it-role-card--lg group${isPrimary ? ' it-role-card--primary' : ''}`}
                  style={{ '--role-color': meta.color } as React.CSSProperties}
                >
                  {isPrimary && (
                    <span className="it-role-badge" aria-hidden>Recommended</span>
                  )}
                  <div className="it-role-icon">
                    {isThisLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: meta.color }} />
                    ) : (
                      <Icon className="h-4 w-4" style={{ color: meta.color }} strokeWidth={1.8} />
                    )}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-white/55 group-hover:text-white/85 transition-colors duration-200">
                      {meta.label}
                    </p>
                    <p className="text-[10px] text-white/25 truncate mt-0.5">{meta.desc}</p>
                  </div>
                </button>
              );
            })}
        </div>
      </motion.div>

      {/* ─── Trust Indicators ─── */}
      <motion.div variants={fadeUp} className="it-trust-strip">
        <div className="it-trust-item">
          <Shield className="h-3 w-3" />
          <span>256-bit Encryption</span>
        </div>
        <div className="it-trust-item">
          <Wifi className="h-3 w-3" />
          <span>SOC 2</span>
        </div>
        <div className="it-trust-item">
          <CheckCircle2 className="h-3 w-3" />
          <span>99.9% Uptime</span>
        </div>
      </motion.div>

      {/* ─── Sign up ─── */}
      <motion.p
        variants={fadeUp}
        className="text-center text-[11px] mt-5"
        style={{ color: '#B8A99A' }}
      >
        No account?{' '}
        <Link
          href="/register"
          className="font-medium transition-colors duration-200"
          style={{ color: '#8B7355' }}
        >
          Request access
        </Link>
      </motion.p>
    </motion.div>
  );
}
