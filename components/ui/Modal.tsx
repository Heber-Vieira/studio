import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  showCloseButton?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl'
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconBgColor = 'bg-[#FF69B4]',
  children,
  maxWidth = 'md',
  showCloseButton = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`bg-white w-full ${maxWidthClasses[maxWidth]} rounded-3xl sm:rounded-[3rem] p-5 sm:p-10 shadow-2xl space-y-5 sm:space-y-8 animate-in zoom-in duration-300 border border-white/20 relative overflow-hidden`}>
        {/* Decorative circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>

        {/* Header */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {icon && (
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBgColor} rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">{title}</h3>
              {subtitle && (
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 bg-gray-100 rounded-full hover:rotate-90 transition-transform shrink-0"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
