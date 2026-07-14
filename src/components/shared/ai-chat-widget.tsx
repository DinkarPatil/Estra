'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Minimize2, Mic,
} from 'lucide-react';

/* ─── Glimmora AI mascot — rounded robot head with antenna spark, eyes,
   smile and a tiny three-bar skyline. Stands in for the generic message-
   bubble FAB icon so the floating advisor reads as "Glimmora AI". ─── */
function GlimmoraAIAvatar({
  size = 18,
  className = '',
  stroke = 1.6,
}: { size?: number; className?: string; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2v2" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      <circle cx="12" cy="1.6" r="1.1" fill="currentColor" />
      <rect x="4" y="5" width="16" height="10.5" rx="3.4" stroke="currentColor" strokeWidth={stroke} />
      <circle cx="9" cy="10.2" r="1.15" fill="currentColor" />
      <circle cx="15" cy="10.2" r="1.15" fill="currentColor" />
      <path d="M10 13.2c0.55 0.42 1.25 0.6 2 0.6s1.45-0.18 2-0.6" stroke="currentColor" strokeWidth={stroke * 0.85} strokeLinecap="round" />
      <rect x="7.4" y="17.6" width="2.3" height="3.4" rx="0.4" fill="currentColor" opacity="0.78" />
      <rect x="10.85" y="16" width="2.3" height="5" rx="0.4" fill="currentColor" />
      <rect x="14.3" y="17.6" width="2.3" height="3.4" rx="0.4" fill="currentColor" opacity="0.78" />
    </svg>
  );
}

/* ─── Types ─── */

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'Best deals today',
  'My portfolio risk',
  'Market outlook',
  'Compare top 3',
];

const AI_RESPONSES: Record<string, string> = {
  'best deals today': 'Based on your preferences, I found 3 strong deals:\n\n1. **Dubai Marina Apartment** — AI Score 94, 7.8% yield\n2. **Palm Jumeirah Villa** — AI Score 89, undervalued by 8%\n3. **Lisbon Expo Flat** — AI Score 85, 5.9% yield with Golden Visa\n\nWant me to run a detailed comparison?',
  'my portfolio risk': 'Your portfolio risk assessment:\n\n• **Overall Risk Score:** 75/100 (Moderate)\n• **Concentration Risk:** High — 78% in residential\n• **Market Exposure:** 4 markets (recommended: 6+)\n• **Liquidity Score:** Good — 82/100\n\n⚠️ Consider diversifying into commercial to reduce concentration risk.',
  'market outlook': 'Global Real Estate Outlook (Q2 2026):\n\n📈 **Hot Markets:** Dubai (+14.2%), Mumbai (+18.7%), Lisbon (+12.4%)\n📊 **Stable:** Singapore (+8.3%), Tokyo (+6.8%)\n📉 **Cooling:** London (+3.1%), under pressure from rate hikes\n\nAI recommends increasing exposure to Dubai & Lisbon.',
  'compare top 3': 'Here\'s a quick comparison of your top-scored properties:\n\n| Property | AI Score | Yield | Growth |\n|----------|----------|-------|--------|\n| Marina Bay | 94 | 7.8% | 14.2% |\n| Palm Jumeirah | 89 | 6.2% | 11.5% |\n| Lisbon Expo | 85 | 5.9% | 12.4% |\n\n**Winner:** Marina Bay Penthouse — best overall risk-adjusted return.',
};

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'ai',
    text: 'Hello! I\'m your AI Investment Assistant. I can help you analyze deals, check portfolio risk, explore markets, and answer any real estate investment questions. What would you like to know?',
    timestamp: new Date(),
  },
];

function matchResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  // Generic response
  return `Great question! Based on my analysis of your portfolio and current market conditions, here are my thoughts:\n\n• Your portfolio shows strong diversification across ${Math.floor(Math.random() * 3) + 3} markets\n• Current AI-recommended allocation suggests increasing yield-focused assets\n• Risk-adjusted returns are trending positively\n\nWould you like me to dive deeper into any specific area?`;
}

/* ─── Component ─── */

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Voice input (Web Speech API, client-side only) ──
     Hold the pre-listen value in a ref so each onresult tick rebuilds the
     input from a stable base instead of accumulating across interim
     results. voiceError surfaces silent failures (permission denied,
     non-secure context) that previously left the user clicking nothing. */
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const voiceBaseRef = useRef<string>('');
  const voiceErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashVoiceError = useCallback((msg: string) => {
    setVoiceError(msg);
    if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current);
    voiceErrorTimerRef.current = setTimeout(() => setVoiceError(null), 3200);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SR) {
      setVoiceSupported(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new (SR as new () => unknown)();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-IN';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const base = voiceBaseRef.current;
      const sep = base && !base.endsWith(' ') ? ' ' : '';
      setInput((base + sep + transcript).trimStart());
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      const code = e?.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        flashVoiceError('Mic permission denied — allow access in your browser');
      } else if (code === 'no-speech') {
        flashVoiceError("Didn't catch that — try speaking again");
      } else if (code === 'audio-capture') {
        flashVoiceError('No microphone detected');
      } else if (code === 'network') {
        flashVoiceError('Network issue with speech service');
      } else if (code) {
        flashVoiceError(`Mic error: ${code}`);
      }
      setIsListening(false);
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch { /* noop */ }
    };
  }, [flashVoiceError]);

  const toggleVoiceInput = useCallback(() => {
    // Chrome/Edge require a secure context (HTTPS or localhost). Surface
    // this up-front rather than letting rec.start() throw cryptically.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      flashVoiceError('Voice input needs HTTPS or localhost');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = recognitionRef.current;
    if (!rec) {
      flashVoiceError('Voice input not supported in this browser');
      return;
    }
    if (isListening) {
      try { rec.stop(); } catch { /* noop */ }
      setIsListening(false);
      return;
    }
    voiceBaseRef.current = input;
    try {
      rec.start();
      setIsListening(true);
      setVoiceError(null);
    } catch (err) {
      // InvalidStateError if already started, NotAllowedError if blocked.
      const name = (err as { name?: string })?.name;
      if (name === 'NotAllowedError') flashVoiceError('Mic permission denied — allow access in your browser');
      else if (name === 'InvalidStateError') {
        // already running — try recovering by stopping then re-starting
        try { rec.stop(); } catch { /* noop */ }
      } else flashVoiceError('Could not start mic. Try again.');
      setIsListening(false);
    }
  }, [isListening, input, flashVoiceError]);

  /* ── Rotating placeholder hints ── */
  const placeholderHints = useMemo(
    () => [
      'Ask anything about investments…',
      'Which deal has the best ROI?',
      'How risky is my portfolio?',
      'Compare my top picks…',
    ],
    [],
  );
  const [hintIdx, setHintIdx] = useState(0);
  useEffect(() => {
    if (input.trim() || !isOpen) return;
    const t = setInterval(() => setHintIdx((i) => (i + 1) % placeholderHints.length), 2600);
    return () => clearInterval(t);
  }, [input, isOpen, placeholderHints.length]);

  // Listen for external open events
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handler);
    return () => window.removeEventListener('open-ai-chat', handler);
  }, []);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: matchResponse(text),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ y: -2, scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open Glimmora AI Assistant"
            className="chat-fab"
          >
            {/* Calm layered effects: soft beat-glow + two staggered
                circular pulses. The mascot sits centered, lit by the
                petal-champagne accent so it reads clearly. */}
            <span aria-hidden className="chat-fab-beat" />
            <span aria-hidden className="chat-fab-pulse" />
            <span aria-hidden className="chat-fab-pulse chat-fab-pulse-2" />
            <GlimmoraAIAvatar size={26} className="relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="chat-window"
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-avatar chat-header-avatar-live">
                <GlimmoraAIAvatar size={22} className="relative z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--fg)] truncate">Glimmora AI</p>
                <div className="flex items-center gap-1.5">
                  <div className="chat-status-dot" />
                  <span className="text-[10px] text-[var(--fg-muted)]">
                    {isListening ? 'Listening…' : isTyping ? 'Typing…' : 'Online'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Minimize advisor"
                title="Minimize"
                className="p-1.5 rounded-lg hover:bg-[rgba(139,115,85,0.08)] text-[var(--fg-muted)] transition-colors cursor-pointer"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className={`chat-msg ${msg.role === 'ai' ? 'chat-msg-ai' : 'chat-msg-user'}`}
                  >
                    {msg.role === 'ai' && (
                      <Sparkles className="h-3 w-3 text-[#8B7355] mb-1" />
                    )}
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="chat-msg chat-msg-ai"
                  >
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                          className="w-1.5 h-1.5 rounded-full bg-[#8B7355]"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 2 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button key={prompt} onClick={() => sendMessage(prompt)} className="chat-quick-chip">
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Voice error toast — auto-dismisses after ~3s. */}
            <AnimatePresence>
              {voiceError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.22 }}
                  role="status"
                  className="chat-voice-toast"
                >
                  {voiceError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="chat-input-area">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholderHints[hintIdx]}
                aria-label="Ask Glimmora AI"
                className="chat-input"
              />
              {/* Voice input — Web Speech API. Petal-gold pulse rings + glow
                  signal the "listening" state. Surfaces failures via an
                  inline toast so permission denials aren't silent. */}
              <motion.button
                type="button"
                onClick={toggleVoiceInput}
                disabled={!voiceSupported}
                whileHover={voiceSupported ? { scale: 1.08, y: -1 } : undefined}
                whileTap={voiceSupported ? { scale: 0.92 } : undefined}
                animate={{ scale: isListening ? 1.08 : 1 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                aria-label={
                  !voiceSupported
                    ? 'Voice input not supported in this browser'
                    : isListening
                      ? 'Stop voice input'
                      : 'Start voice input'
                }
                aria-pressed={isListening}
                title={
                  !voiceSupported
                    ? 'Voice input not supported in this browser'
                    : isListening
                      ? 'Listening — tap to stop'
                      : 'Voice input'
                }
                className={`chat-mic ${isListening ? 'chat-mic-active' : ''}`}
              >
                {isListening && (
                  <>
                    <motion.span
                      aria-hidden
                      className="chat-mic-ring"
                      animate={{ scale: [1, 1.9], opacity: [0.65, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.span
                      aria-hidden
                      className="chat-mic-ring"
                      animate={{ scale: [1, 1.9], opacity: [0.65, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.45 }}
                    />
                    {/* Live waveform bars while listening. */}
                    <span aria-hidden className="chat-mic-bars">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.span
                          key={i}
                          animate={{ scaleY: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.85, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      ))}
                    </span>
                  </>
                )}
                <Mic className="h-4 w-4 relative z-10" strokeWidth={2.2} />
              </motion.button>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                aria-label="Send"
                className="chat-send disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
