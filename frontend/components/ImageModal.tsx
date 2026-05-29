import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  altText?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, altText }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
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

      {/* Image Container */}
      <div 
        className="relative z-[105] max-w-full max-h-full flex items-center justify-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt={altText || 'Enlarged view'} 
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/5"
        />
        
        {altText && (
          <div className="absolute -bottom-10 left-0 right-0 text-center">
            <span className="text-zinc-400 text-sm font-medium uppercase tracking-widest">{altText}</span>
          </div>
        )}
      </div>
    </div>
  );
};
