import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import psonIcon from '@/assets/pson-icon.png';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[300] bg-background flex flex-col items-center justify-center"
        >
          <motion.img
            src={psonIcon}
            alt="Pson.io"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-24 h-24 rounded-2xl mb-4 shadow-lg"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-xl font-bold text-foreground"
          >
            Pson.io
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
