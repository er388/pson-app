import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UndoItem {
  id: string;
  label: string;
  onUndo: () => void;
}

let globalShow: ((item: UndoItem) => void) | null = null;

export function showUndo(label: string, onUndo: () => void) {
  globalShow?.({ id: crypto.randomUUID(), label, onUndo });
}

export default function UndoSnackbar() {
  const [item, setItem] = useState<UndoItem | null>(null);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const clear = useCallback(() => {
    setItem(null);
    setProgress(100);
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    globalShow = (newItem) => {
      // Cancel previous
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
      setItem(newItem);
      setProgress(100);

      const DURATION = 5000;
      const STEP = 50;
      let elapsed = 0;

      intervalRef.current = setInterval(() => {
        elapsed += STEP;
        setProgress(Math.max(0, 100 - (elapsed / DURATION) * 100));
      }, STEP);

      timerRef.current = setTimeout(() => {
        clear();
      }, DURATION);
    };
    return () => { globalShow = null; clear(); };
  }, [clear]);

  const handleUndo = () => {
    item?.onUndo();
    clear();
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-[90] max-w-lg mx-auto"
        >
          <div className="bg-foreground text-background rounded-xl px-4 py-3 shadow-xl flex items-center gap-3">
            <p className="text-sm flex-1 truncate">{item.label}</p>
            <button
              onClick={handleUndo}
              className="text-primary font-bold text-sm uppercase tracking-wider shrink-0 flex items-center gap-1 hover:opacity-80"
            >
              <Undo2 size={14} /> ΑΝΑΙΡΕΣΗ
            </button>
          </div>
          <div className="mt-0.5 rounded-b-xl overflow-hidden">
            <Progress value={progress} className="h-1 rounded-none bg-foreground/20" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
