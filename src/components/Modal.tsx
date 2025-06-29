import React from 'react';
import { Icon } from './Icon';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const iconName = variant === 'danger' ? 'trash' : variant === 'warning' ? 'settings' : 'document';
  const confirmVariant = variant === 'danger' ? 'danger' : 'primary';

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className=" bg-[var(--background)] fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[var(--navy)] rounded-3xl p-6 lg:p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div className="text-center">
          {/* Icon */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
            variant === 'danger' ? 'bg-red-500/20' : 
            variant === 'warning' ? 'bg-yellow-500/20' : 
            'bg-blue-500/20'
          }`}>
            <Icon 
              name={iconName} 
              size={32} 
              color={variant === 'danger' ? '#ef4444' : variant === 'warning' ? '#eab308' : '#3b82f6'} 
            />
          </div>

          {/* Title */}
          <h2 className="text-white text-xl lg:text-2xl font-bold mb-4">
            {title}
          </h2>

          {/* Message */}
          <p className="text-white/80 text-sm lg:text-base leading-relaxed mb-8">
            {message}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="md"
              onClick={onClose}
              className="flex-1 order-2 sm:order-1"
            >
              {cancelText}
            </Button>
            
            <Button
              variant={confirmVariant}
              size="md"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 order-1 sm:order-2"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal; 