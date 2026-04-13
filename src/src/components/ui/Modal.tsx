/**
 * Modal.tsx — Animated Modal Dialog
 *
 * Behaviour:
 *  - Closes on Escape key press
 *  - Closes when backdrop (outside the modal) is clicked
 *  - Prevents body scroll while open
 *  - Spring animation: scales + fades in from slightly below
 *
 * Props:
 *  isOpen: controls visibility via AnimatePresence
 *  onClose: called on Escape, backdrop click, or X button
 *  title: displayed in the modal header
 *  maxWidth: 'sm' | 'md' | 'lg' | 'xl' (default 'md')
 *  children: modal body content
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from 'lucide-react';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md'
}: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };
  return (
    <AnimatePresence>
      {isOpen &&
      <>
          <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          className="fixed inset-0 z-50 bg-brand-dark/80 backdrop-blur-sm"
          onClick={onClose} />
        
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
            className={`w-full ${maxWidthClasses[maxWidth]} glass-panel rounded-xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]`}
            onClick={(e) => e.stopPropagation()}>
            
              <div className="flex items-center justify-between p-5 border-b border-brand-border">
                <h2 className="text-lg font-semibold text-brand-text">
                  {title}
                </h2>
                <button
                onClick={onClose}
                className="p-1 rounded-md text-brand-muted hover:text-brand-text hover:bg-brand-surface transition-colors">
                
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </>
      }
    </AnimatePresence>);

}