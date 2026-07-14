'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Mail, Lock, User, Phone, Globe, Shield } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Frontend dropdown values → backend `role` field. Backend self-register only
// accepts 'user' | 'broker' (see backend/app/features/auth/service.py).
// 'investor' is the UI label for the 'user' backend role; 'developer' is not
// available for self-signup.
const ROLE_MAP: Record<string, 'user' | 'broker'> = {
  investor: 'user',
  broker: 'broker',
};

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('India');
  const [role, setRole] = useState<'investor' | 'broker' | 'developer'>('investor');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!name) return setError('Please enter your name');
    if (!email.trim()) return setError('Please enter your email');
    if (password.length < 8) return setError('Password must be at least 8 characters');

    const backendRole = ROLE_MAP[role];
    if (!backendRole) {
      return setError('Developer signup is not yet open. Please choose Investor or Broker.');
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          country: country.trim() || 'India',
          password,
          role: backendRole,
        }),
      });

      if (!res.ok) {
        let detail = `Registration failed (${res.status})`;
        try {
          const body = await res.json();
          if (typeof body?.detail === 'string') {
            detail = body.detail;
          } else if (Array.isArray(body?.detail) && body.detail[0]?.msg) {
            // Pydantic validation error shape
            detail = body.detail[0].msg;
          }
        } catch {}
        throw new Error(detail);
      }

      // Success — redirect to login with the email pre-fillable hint
      router.push(`/login?registered=1&email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] text-white/40 tracking-[0.06em] uppercase font-medium mb-6">
        Join the intelligence network
      </p>

      <h2
        className="text-[28px] font-bold text-white tracking-tight leading-[1.25]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Create your account
      </h2>
      <p className="mt-2 text-[13px] text-white/50 leading-relaxed">
        Start your intelligent investment journey
      </p>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-white/60 mb-2 tracking-wide uppercase">First Name</label>
            <div className="relative auth-input-wrap">
              <User className="auth-input-icon" />
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Sarah"
                className="auth-input"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/60 mb-2 tracking-wide uppercase">Last Name</label>
            <div className="relative auth-input-wrap">
              <User className="auth-input-icon" />
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Chen"
                className="auth-input"
                required
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-medium text-white/60 mb-2 tracking-wide uppercase">Email</label>
          <div className="relative auth-input-wrap">
            <Mail className="auth-input-icon" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-medium text-white/60 mb-2 tracking-wide uppercase">Phone</label>
          <div className="relative auth-input-wrap">
            <Phone className="auth-input-icon" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="auth-input"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-medium text-white/60 mb-2 tracking-wide uppercase">Country</label>
          <div className="relative auth-input-wrap">
            <Globe className="auth-input-icon" />
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="India"
              className="auth-input"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-medium text-white/60 mb-2 tracking-wide uppercase">Password</label>
          <div className="relative auth-input-wrap">
            <Lock className="auth-input-icon" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="auth-input"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-medium text-white/60 mb-2 tracking-wide uppercase">I am a</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as 'investor' | 'broker' | 'developer')}
            className="auth-input !pl-4 text-white/70"
          >
            <option value="investor">Property Investor</option>
            <option value="broker">Real Estate Broker</option>
            <option value="developer" disabled>Property Developer (coming soon)</option>
          </select>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-[12px] text-red-400/80 flex items-center gap-2"
          >
            <Shield className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <div className="mt-7">
          <button
            type="submit"
            disabled={isLoading}
            className="auth-submit-btn w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <p className="text-center text-[12px] text-white/35 mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-[#8B7355]/70 hover:text-[#8B7355] transition-colors duration-200 font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
