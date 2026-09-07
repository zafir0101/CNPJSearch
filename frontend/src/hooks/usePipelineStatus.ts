import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { PipelineStatus } from '../types';

const POLL_INTERVAL_MS = 1200;

/**
 * Faz polling de GET /api/v1/status até a base de dados estar pronta
 * (status "pronto") ou falhar (status "erro"). Enquanto isso, o app
 * mostra a tela de abastecimento em vez da interface de busca.
 */
export function usePipelineStatus() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await api.getStatus();
        if (cancelled) return;
        setConnectionError(false);
        if (data) setStatus(data);

        if (data && (data.status === 'pronto' || data.status === 'erro')) {
          return; // para o polling
        }
        timerRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        setConnectionError(true);
        timerRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { status, connectionError };
}
