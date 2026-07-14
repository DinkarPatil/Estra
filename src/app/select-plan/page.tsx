'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2, ArrowRight, Lock, Sparkles, FastForward } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/auth-context';
import { billingApi } from '@/lib/api';
import { PLANS, type PlanId, type Plan } from '@/lib/plans';
import { roleRedirects } from '@/lib/navigation';
import {
  openRazorpayCheckout,
  createOrder,
  type RazorpaySuccessResponse,
} from '@/lib/payment/razorpay';
import { setPlanCookie, setSkipPlan } from '@/lib/payment/plan-storage';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: 'blur(3px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export default function SelectPlanPage() {
  const router = useRouter();
  const { user, plan: existingPlan, isLoading, logout, refreshPlan } = useAuth();
  const [processing, setProcessing] = useState<PlanId | null>(null);
  const [skipping, setSkipping] = useState(false);

  const handleSkip = () => {
    if (!user || processing || skipping) return;
    setSkipping(true);
    setSkipPlan('pro');
    setPlanCookie('pro');
    toast.success('Pro plan activated (demo skip)');
    refreshPlan().finally(() => {
      router.replace(roleRedirects[user.role] ?? '/investor');
    });
  };

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (existingPlan) {
      router.replace(roleRedirects[user.role] ?? '/investor');
    }
  }, [isLoading, user, existingPlan, router]);

  const handleSelect = async (plan: Plan) => {
    if (!user || processing) return;
    setProcessing(plan.id);

    let order;
    try {
      order = await createOrder(plan.id);
    } catch (err) {
      setProcessing(null);
      toast.error('Could not start payment', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      return;
    }

    openRazorpayCheckout({
      plan,
      order,
      user: { name: user.name, email: user.email },
      onSuccess: async (resp: RazorpaySuccessResponse) => {
        try {
          await billingApi.verifyPayment({
            plan_id: plan.id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_signature: resp.razorpay_signature,
            amount_paise: order.amount,
          });
        } catch (err) {
          setProcessing(null);
          const message =
            err instanceof Error
              ? err.message
              : 'The signature did not match or the server rejected it.';
          toast.error('Payment verification failed', { description: message });
          return;
        }
        await refreshPlan();
        toast.success(`${plan.name} plan activated`, {
          description: `Payment ${resp.razorpay_payment_id} verified.`,
        });
        setProcessing(null);
        router.replace(roleRedirects[user.role] ?? '/investor');
      },
      onDismiss: () => {
        setProcessing(null);
      },
      onError: (err) => {
        setProcessing(null);
        const message =
          err instanceof Error
            ? err.message
            : 'Payment failed. Please try again.';
        toast.error('Payment could not be completed', { description: message });
      },
    });
  };

  if (isLoading || !user) {
    return (
      <div className="it-page">
        <div className="it-grain" />
        <div className="it-stage">
          <Loader2 className="h-5 w-5 animate-spin text-[#C6A86B]/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="it-page">
      <div className="it-grain" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-[2] mx-auto w-full max-w-6xl px-6 py-16 sm:py-20"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C6A86B]/15 bg-[#C6A86B]/[0.03] px-3 py-1">
            <Sparkles className="h-3 w-3 text-[#C6A86B]/60" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#C6A86B]/60">
              Step 2 of 2 — Activate Access
            </span>
          </div>
          <h1
            className="mt-5 text-[28px] sm:text-[34px] font-medium text-white/90 tracking-[-0.01em]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Choose Your <span className="it-headline-gold">Intelligence Tier</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[13px] text-white/35 leading-relaxed">
            Welcome, {user.name}. Select a plan to unlock the platform.
            All plans are billed in INR.
          </p>
        </motion.div>

        {/* Plan cards */}
        <motion.div
          variants={fadeUp}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {PLANS.map((plan) => {
            const isProcessing = processing === plan.id;
            const isDisabled = processing !== null && !isProcessing;
            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className={`relative flex flex-col rounded-2xl border p-7 backdrop-blur-md ${
                  plan.highlight
                    ? 'border-[#C6A86B]/30 bg-gradient-to-b from-[#C6A86B]/[0.06] to-[#0A0F1C]/60 shadow-[0_20px_60px_rgba(198,168,107,0.06)]'
                    : 'border-white/[0.06] bg-[#0A0F1C]/60'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-[#C6A86B]/30 bg-[#0A0F1C] px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-[#C6A86B]/80">
                    Most popular
                  </span>
                )}

                <div>
                  <h2
                    className="text-[20px] font-medium text-white/90"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {plan.name}
                  </h2>
                  <p className="mt-1 text-[12px] text-white/35">{plan.tagline}</p>
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-[32px] font-medium text-white/90 tracking-tight">
                    ₹{plan.price}
                  </span>
                  <span className="text-[11px] text-white/30">one-time</span>
                </div>

                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-[12.5px] text-white/55"
                    >
                      <Check className="mt-[2px] h-3.5 w-3.5 shrink-0 text-[#C6A86B]/65" strokeWidth={2.4} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSelect(plan)}
                  disabled={isDisabled || isProcessing}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[12px] font-medium tracking-wider transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                    plan.highlight
                      ? 'border-[#C6A86B]/40 bg-[#C6A86B]/15 text-[#C6A86B] hover:bg-[#C6A86B]/22'
                      : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-[#C6A86B]/25 hover:text-[#C6A86B]/90'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Opening checkout…</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{plan.price} · {plan.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={fadeUp}
          className="mt-12 flex flex-col items-center gap-3 text-[11px] text-white/30"
        >
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3" />
            <span>Secured by Razorpay · 256-bit TLS · UPI · Cards · Netbanking</span>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipping || processing !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-[#C6A86B]/25 bg-[#C6A86B]/[0.05] px-4 py-2 text-[11px] font-medium tracking-wider text-[#C6A86B]/80 hover:bg-[#C6A86B]/10 hover:text-[#C6A86B] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {skipping ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Activating Pro…</span>
              </>
            ) : (
              <>
                <FastForward className="h-3.5 w-3.5" />
                <span>Skip payment · Activate Pro (Demo)</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-white/25 hover:text-[#C6A86B]/55 transition-colors duration-200"
          >
            Sign out
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
