'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceError {
  code: string;
  message: string;
  hint?: string;
}

interface UseVoiceSearchReturn {
  state: VoiceState;
  transcript: string;
  interimText: string;
  error: VoiceError | null;
  startListening: () => void;
  stopListening: () => void;
  clearError: () => void;
  isSupported: boolean;
}

function getErrorInfo(errorCode: string): { message: string; hint?: string } {
  switch (errorCode) {
    case 'not-allowed':
      return {
        message: 'Microphone access denied',
        hint: 'Allow microphone access in your browser settings and try again.',
      };
    case 'no-speech':
      return {
        message: "Didn't catch that",
        hint: 'Try speaking clearly or move closer to your microphone.',
      };
    case 'audio-capture':
      return {
        message: 'No microphone found',
        hint: 'Connect a microphone and try again.',
      };
    case 'network':
      return {
        message: 'Voice service unavailable',
        hint: typeof window !== 'undefined' && window.location.protocol !== 'https:'
          ? 'Voice search requires HTTPS. Try running your dev server with --experimental-https.'
          : 'Check your internet connection and try again.',
      };
    case 'service-not-allowed':
      return {
        message: 'Voice service blocked',
        hint: 'Speech recognition requires a secure (HTTPS) connection.',
      };
    case 'start-failed':
      return {
        message: 'Could not start voice search',
        hint: 'Please try again.',
      };
    default:
      return { message: `Voice error: ${errorCode}` };
  }
}

export function useVoiceSearch(
  onResult?: (text: string) => void,
): UseVoiceSearchReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<VoiceError | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stateRef = useRef<VoiceState>('idle');
  const onResultRef = useRef(onResult);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Detect support on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setIsSupported(supported);

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (stateRef.current === 'error') setState('idle');
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    // Clear any previous error
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    setError(null);
    setTranscript('');
    setInterimText('');

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Always show interim text for live feedback
      setInterimText(interimTranscript);

      if (finalTranscript) {
        setTranscript(finalTranscript.trim());
        setInterimText('');
        setState('processing');
        setTimeout(() => {
          onResultRef.current?.(finalTranscript.trim());
          setState('idle');
        }, 500);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorCode = event.error;
      if (errorCode === 'aborted') return;

      const info = getErrorInfo(errorCode);
      setError({ code: errorCode, message: info.message, hint: info.hint });
      setState('error');

      // Auto-dismiss errors after 5s (longer so user can read the hint)
      errorTimeoutRef.current = setTimeout(() => {
        setState('idle');
        setError(null);
        errorTimeoutRef.current = null;
      }, 5000);
    };

    recognition.onend = () => {
      if (stateRef.current === 'listening') {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      const info = getErrorInfo('start-failed');
      setError({ code: 'start-failed', message: info.message, hint: info.hint });
      setState('error');
      errorTimeoutRef.current = setTimeout(() => {
        setState('idle');
        setError(null);
        errorTimeoutRef.current = null;
      }, 5000);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    state,
    transcript,
    interimText,
    error,
    startListening,
    stopListening,
    clearError,
    isSupported,
  };
}
