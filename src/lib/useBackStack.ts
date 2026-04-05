import { useEffect, useRef } from 'react';
import { backStack } from './backStack';

export function useBackStack(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const handler = () => closeRef.current();
    backStack.push(handler);
    return () => { backStack.pop(); };
  }, [open]);
}