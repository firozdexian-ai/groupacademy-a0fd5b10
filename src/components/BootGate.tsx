import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoIcon from '@/assets/logo-icon.png';

interface BootGateProps {
  children: React.ReactNode;
}

type BootPhase = 'connecting' | 'warming' | 'session' | 'ready' | 'slow' | 'error';

const PHASE_MESSAGES: Record<BootPhase, string> = {
  connecting: 'Connecting to server...',
  warming: 'Warming up...',
  session: 'Checking your session...',
  ready: 'Ready!',
  slow: 'Taking longer than usual...',
  error: 'Connection issues detected',
};

// Timing configuration
const SHOW_SLOW_MESSAGE_MS = 12_000;
const WARMUP_TIMEOUT_MS = 45_000;
const SESSION_TIMEOUT_MS = 15_000;

export function BootGate({ children }: BootGateProps) {
  const [phase, setPhase] = useState<BootPhase>('connecting');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bootStartRef = useRef<number>(Date.now());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Check if we've already booted in this session
    const hasBooted = sessionStorage.getItem('boot_complete');
    if (hasBooted === 'true') {
      console.log('[BootGate] Already booted this session, skipping');
      setIsReady(true);
      setPhase('ready');
      return;
    }

    bootStartRef.current = Date.now();
    abortControllerRef.current = new AbortController();

    const boot = async () => {
      try {
        // Phase 1: Warmup - ping the database
        setPhase('warming');
        console.log('[BootGate] Phase 1: Warming up database...');
        
        const warmupPromise = supabase
          .from('profession_categories')
          .select('id')
          .limit(1)
          .abortSignal(abortControllerRef.current!.signal);

        const warmupTimeout = new Promise<'timeout'>((resolve) => 
          setTimeout(() => resolve('timeout'), WARMUP_TIMEOUT_MS)
        );

        const warmupResult = await Promise.race([warmupPromise, warmupTimeout]);
        
        if (warmupResult === 'timeout') {
          console.warn('[BootGate] Warmup timed out, continuing anyway');
        } else {
          const elapsed = Date.now() - bootStartRef.current;
          console.log(`[BootGate] Warmup completed in ${elapsed}ms`);
        }

        // Phase 2: Check session
        setPhase('session');
        console.log('[BootGate] Phase 2: Checking session...');
        
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise<'timeout'>((resolve) => 
          setTimeout(() => resolve('timeout'), SESSION_TIMEOUT_MS)
        );

        const sessionResult = await Promise.race([sessionPromise, sessionTimeout]);
        
        if (sessionResult === 'timeout') {
          console.warn('[BootGate] Session check timed out');
        } else {
          const hasSession = !!sessionResult.data?.session;
          console.log(`[BootGate] Session check complete, authenticated: ${hasSession}`);
        }

        // Boot complete!
        setPhase('ready');
        setIsReady(true);
        sessionStorage.setItem('boot_complete', 'true');
        
        const totalTime = Date.now() - bootStartRef.current;
        console.log(`[BootGate] Boot complete in ${totalTime}ms`);
        
      } catch (err: any) {
        console.error('[BootGate] Boot error:', err);
        
        // Only show error if it's not an abort
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Failed to connect to server');
          setPhase('error');
        }
      }
    };

    // Show "slow" message after delay
    const slowTimer = setTimeout(() => {
      if (!isReady && phase !== 'error') {
        setPhase('slow');
      }
    }, SHOW_SLOW_MESSAGE_MS);

    boot();

    return () => {
      clearTimeout(slowTimer);
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleRetry = () => {
    sessionStorage.removeItem('boot_complete');
    setError(null);
    setPhase('connecting');
    setIsReady(false);
    window.location.reload();
  };

  // If ready, render children
  if (isReady) {
    return <>{children}</>;
  }

  // Show boot screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 px-4 max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src={logoIcon} 
            alt="Logo" 
            className="h-16 w-16 animate-pulse"
          />
        </div>

        {/* Status message */}
        <div className="space-y-2">
          {phase === 'error' ? (
            <>
              <WifiOff className="h-8 w-8 text-destructive mx-auto" />
              <h2 className="text-lg font-semibold text-destructive">
                Connection Issues
              </h2>
              <p className="text-muted-foreground text-sm">
                {error || 'Unable to connect to the server. Please check your internet connection.'}
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
              <p className="text-muted-foreground">
                {PHASE_MESSAGES[phase]}
              </p>
              {phase === 'slow' && (
                <p className="text-muted-foreground/70 text-sm">
                  The server is waking up. This can take up to 45 seconds on first visit.
                </p>
              )}
            </>
          )}
        </div>

        {/* Retry button - show after slow phase or on error */}
        {(phase === 'slow' || phase === 'error') && (
          <Button 
            onClick={handleRetry}
            variant={phase === 'error' ? 'default' : 'outline'}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {phase === 'error' ? 'Try Again' : 'Reload'}
          </Button>
        )}

        {/* Progress indicator */}
        {phase !== 'error' && phase !== 'ready' && (
          <div className="flex justify-center gap-1.5 pt-4">
            <div className={`h-1.5 w-8 rounded-full transition-colors ${
              phase === 'warming' || phase === 'session' || phase === 'slow' 
                ? 'bg-primary' 
                : 'bg-muted'
            }`} />
            <div className={`h-1.5 w-8 rounded-full transition-colors ${
              phase === 'session' || phase === 'slow' 
                ? 'bg-primary' 
                : 'bg-muted'
            }`} />
            <div className={`h-1.5 w-8 rounded-full transition-colors ${
              phase === 'slow' 
                ? 'bg-primary animate-pulse' 
                : 'bg-muted'
            }`} />
          </div>
        )}
      </div>
    </div>
  );
}
