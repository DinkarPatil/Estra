'use client';
import { useState } from 'react';
import { ArrowRight, Loader2, CheckCircle, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setIsLoading(false);
  };

  return (
    <div>
      {!sent ? (
        <>
          <p className="text-[11px] text-white/40 tracking-[0.06em] uppercase font-medium mb-6">
            Account recovery
          </p>

          <h2
            className="text-[28px] font-bold text-white tracking-tight leading-[1.25]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Reset your password
          </h2>
          <p className="mt-2 text-[13px] text-white/50 leading-relaxed">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <div>
              <label className="block text-[11px] font-medium text-white/60 mb-2 tracking-wide uppercase">
                Email
              </label>
              <div className="relative auth-input-wrap">
                <Mail className="auth-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@glimmora.com"
                  className="auth-input"
                  required
                />
              </div>
            </div>

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
                    Send Reset Link
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center py-8">
          <CheckCircle className="h-10 w-10 text-[#8B7355] mx-auto mb-4 opacity-60" />
          <h2
            className="text-[20px] font-bold text-white/85 mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Check your email
          </h2>
          <p className="text-[13px] text-white/35">
            We sent a reset link to <span className="text-white/60">{email}</span>
          </p>
        </div>
      )}

      <p className="text-center text-[12px] text-white/35 mt-6">
        <Link
          href="/login"
          className="text-white/40 hover:text-white/60 transition-colors duration-200"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
