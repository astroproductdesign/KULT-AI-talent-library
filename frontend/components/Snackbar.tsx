import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface SnackbarProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export const Snackbar: React.FC<SnackbarProps> = ({ message, visible, onHide }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      // Trigger enter animation on next tick
      const enterTimer = requestAnimationFrame(() => setShow(true));
      // Auto-dismiss after 3s
      const hideTimer = setTimeout(() => {
        setShow(false);
        setTimeout(onHide, 300); // wait for exit animation before clearing
      }, 3000);
      return () => {
        cancelAnimationFrame(enterTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setShow(false);
    }
  }, [visible, message]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ease-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center gap-3 bg-wf-ink text-white px-5 py-3.5 rounded-[6px] shadow-wf-3 text-sm font-medium whitespace-nowrap">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 flex-shrink-0">
          <Check size={12} strokeWidth={2.5} />
        </span>
        {message}
      </div>
    </div>
  );
};
