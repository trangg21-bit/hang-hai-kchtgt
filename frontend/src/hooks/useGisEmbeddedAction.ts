import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export type GisEmbeddedAction = 'detail' | 'edit';

export function useGisEmbeddedAction() {
  const [searchParams] = useSearchParams();
  const rawAction = searchParams.get('action');
  const recordId = searchParams.get('id');
  const action: GisEmbeddedAction | null = rawAction === 'detail' || rawAction === 'edit'
    ? rawAction
    : null;
  const isEmbeddedAction = window.self !== window.top
    && searchParams.get('embed') === 'gis-action'
    && action !== null
    && Boolean(recordId);

  const closeEmbeddedAction = useCallback(() => {
    if (isEmbeddedAction) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, [isEmbeddedAction]);

  return {
    action,
    recordId,
    isEmbeddedAction,
    closeEmbeddedAction,
  };
}
