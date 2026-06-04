import React, { useEffect, useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  altText?: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.25;

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, altText }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const clamp = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, parseFloat(s.toFixed(2))));

  const zoomIn  = () => setScale(s => clamp(s + ZOOM_STEP));
  const zoomOut = () => setScale(s => clamp(s - ZOOM_STEP));
  const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  // Keyboard shortcuts + scroll lock
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')            onClose();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-')                  zoomOut();
      if (e.key === '0')                  resetZoom();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Reset position when scale returns to 1
  useEffect(() => {
    if (scale === 1) setPosition({ x: 0, y: 0 });
  }, [scale]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setScale(s => clamp(s + delta));
  };

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: position.x, py: position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    setPosition({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };

  const stopDrag = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all border border-white/10 hover:rotate-90"
      >
        <X size={24} />
      </button>

      {/* Zoom Controls */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-white/10 rounded-full px-3 py-2"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
          className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
          title="Zoom out (−)"
        >
          <ZoomOut size={18} />
        </button>

        <button
          onClick={resetZoom}
          className="text-xs font-mono text-zinc-300 hover:text-white w-12 text-center transition-colors"
          title="Click to reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
          className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
          title="Zoom in (+)"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Image Container */}
      <div
        className="relative z-[105] w-full h-full flex items-center justify-center overflow-hidden"
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        style={{ cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
      >
        <img
          src={imageUrl}
          alt={altText || 'Enlarged view'}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease',
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain',
          }}
          className="rounded-lg shadow-2xl border border-white/5 select-none"
        />

        {altText && scale === 1 && (
          <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none">
            <span className="text-zinc-400 text-sm font-medium uppercase tracking-widest">{altText}</span>
          </div>
        )}
      </div>
    </div>
  );
};
