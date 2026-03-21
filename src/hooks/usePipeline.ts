import { useState, useCallback, useEffect, useMemo } from 'react';
import { PipelineState, AIScoreResult, DeepfakeResult, ToastMessage } from '../types';

const initialState: PipelineState = {
  stage: "idle",
  progress: 0,
  claims_total: 0,
  claims_done: 0,
  claims: [],
  deepfakes: [],
  originalText: "",
  error: undefined
};

export function usePipeline() {
  const [state, setState] = useState<PipelineState>(initialState);
  const [isRunning, setIsRunning] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    setToasts(prev => [...prev, { ...t, id: Math.random().toString(36).substr(2, 9) }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const verify = useCallback((input: string, isUrl: boolean) => {
    setEventSource(prev => {
      if (prev) prev.close();
      return null;
    });
    
    setState({ ...initialState, originalText: !isUrl ? input : "", stage: "extracting" });
    setIsRunning(true);
    
    const params = new URLSearchParams();
    if (isUrl) params.append('url', input);
    else params.append('text', input);
    
    const es = new EventSource(`/api/verify?${params.toString()}`);
    setEventSource(es);
    
    es.addEventListener('status', (e: Event) => {
      const me = e as MessageEvent;
      if (!me.data || me.data === 'undefined') return;
      try {
        const data = JSON.parse(me.data);
        setState(s => {
          const nextState = {
            ...s,
            stage: data.stage,
            progress: data.progress || s.progress,
            claims_total: data.claims_total ?? s.claims_total,
            claims_done: data.claims_done ?? s.claims_done
          };
          if (data.stage === "complete") {
            setIsRunning(false);
            es.close();
          }
          return nextState;
        });
      } catch (err) {
        console.warn('Failed to parse status SSE:', me.data);
      }
    });

    es.addEventListener('claim', (e: Event) => {
      const me = e as MessageEvent;
      if (!me.data || me.data === 'undefined') return;
      try {
        const data = JSON.parse(me.data);
        setState(s => {
          if (s.claims.some(c => c.id === data.id)) return s;
          return { ...s, claims: [...s.claims, data] };
        });
      } catch (err) {
        console.warn('Failed to parse claim SSE:', me.data);
      }
    });

    es.addEventListener('verdict', (e: Event) => {
      const me = e as MessageEvent;
      if (!me.data || me.data === 'undefined') return;
      try {
        const data = JSON.parse(me.data);
        setState(s => {
          const newClaims = s.claims.map(c => {
            if (c.id === data.claim_id) {
              const updated = {
                ...c,
                verdict: data.verdict,
                confidence: data.confidence,
                reasoning: data.reasoning,
                sources: data.sources,
                conflicting: data.conflicting,
                status: "verified" as const
              };
              addToast({ verdict: data.verdict, claimText: updated.text });
              return updated;
            }
            return c;
          });
          return { ...s, claims: newClaims };
        });
      } catch (err) {
        console.warn('Failed to parse verdict SSE:', me.data);
      }
    });

    es.addEventListener('ai_score', (e: Event) => {
      const me = e as MessageEvent;
      if (!me.data || me.data === 'undefined') return;
      try {
        const data: AIScoreResult = JSON.parse(me.data);
        setState(s => ({ ...s, aiScore: data }));
      } catch (err) {
        console.warn('Failed to parse ai_score SSE:', me.data);
      }
    });

    es.addEventListener('deepfake', (e: Event) => {
      const me = e as MessageEvent;
      if (!me.data || me.data === 'undefined') return;
      try {
        const data: DeepfakeResult = JSON.parse(me.data);
        setState(s => ({ 
          ...s, 
          deepfakes: [...s.deepfakes, data]
        }));
      } catch (err) {
        console.warn('Failed to parse deepfake SSE:', me.data);
      }
    });

    es.addEventListener('error_event', (e: Event) => {
      const me = e as MessageEvent;
      if (!me.data || me.data === 'undefined') return;
      try {
        const data = JSON.parse(me.data);
        setState(s => {
          if (data.claim_id) {
             const newClaims = s.claims.map(c => {
                if (c.id === data.claim_id) {
                   const updated = { ...c, status: "error" as const, verdict: "Unverifiable" as const, reasoning: data.message };
                   addToast({ verdict: "Unverifiable", claimText: updated.text });
                   return updated;
                }
                return c;
             });
             return { ...s, claims: newClaims };
          }
          setIsRunning(false);
          es.close();
          return { ...s, error: data.message, stage: "idle" };
        });
      } catch (err) {
        console.warn('Failed to parse error SSE:', me.data);
      }
    });
    
    es.onerror = () => {
      setIsRunning(false);
      es.close();
      setState(s => ({ ...s, error: "Connection to server lost.", stage: "idle" }));
    };
    
  }, [addToast]);

  const reset = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setIsRunning(false);
    setState(initialState);
    setToasts([]);
  }, [eventSource]);

  useEffect(() => {
    return () => {
      if (eventSource) eventSource.close();
    }
  }, [eventSource]);

  const stats = useMemo(() => {
    const total = state.claims.length;
    let trueCount = 0, falseCount = 0, partialCount = 0, conflictingCount = 0, unverifiableCount = 0;
    
    state.claims.forEach(c => {
      if (c.verdict === "True") trueCount++;
      else if (c.verdict === "False") falseCount++;
      else if (c.verdict === "Partially True") partialCount++;
      else if (c.verdict === "Conflicting") conflictingCount++;
      else if (c.verdict === "Unverifiable" || c.status === "error") unverifiableCount++;
    });

    const verifiedCount = state.claims.filter(c => !!c.verdict).length;
    const accuracyPct = verifiedCount > 0 ? Math.round((trueCount / verifiedCount) * 100) : 0;

    return { total, trueCount, falseCount, partialCount, conflictingCount, unverifiableCount, accuracyPct };
  }, [state.claims]);

  return { state, stats, isRunning, verify, reset, toasts, removeToast };
}
