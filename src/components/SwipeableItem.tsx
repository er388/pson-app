import { useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { Trash2, CheckCircle2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftColor?: string;
  rightColor?: string;
}

export default function SwipeableItem({
  children, onSwipeLeft, onSwipeRight,
  leftIcon, rightIcon,
  leftColor = 'bg-destructive/80',
  rightColor = 'bg-primary/80',
}: Props) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const THRESHOLD = 60;

  const bind = useDrag(
    ({ movement: [mx], down, velocity: [vx] }) => {
      if (down) {
        setSwiping(true);
        setOffsetX(Math.max(-120, Math.min(80, mx)));
      } else {
        setSwiping(false);
        setOffsetX(0);
        if (Math.abs(mx) > THRESHOLD || vx > 0.5) {
          if (mx < 0) onSwipeLeft();
          else onSwipeRight();
        }
      }
    },
    { axis: 'x', filterTaps: true, pointer: { touch: true } }
  );

  return (
    <div className="relative overflow-hidden rounded-xl" data-swipe-horizontal>
      <div className={`absolute inset-y-0 right-0 w-20 flex items-center justify-center rounded-r-xl ${leftColor} transition-opacity ${offsetX < -20 ? 'opacity-100' : 'opacity-0'}`}>
        {leftIcon ?? <Trash2 size={18} className="text-white" />}
      </div>
      <div className={`absolute inset-y-0 left-0 w-20 flex items-center justify-center rounded-l-xl ${rightColor} transition-opacity ${offsetX > 20 ? 'opacity-100' : 'opacity-0'}`}>
        {rightIcon ?? <CheckCircle2 size={18} className="text-white" />}
      </div>
      <div
        {...bind()}
        style={{ transform: `translateX(${offsetX}px)`, transition: swiping ? 'none' : 'transform 0.25s ease' }}
        className="touch-pan-y"
      >
        {children}
      </div>
    </div>
  );
}