import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  word: string;
  definition: string;
  isWin: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  word,
  definition,
  isWin,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (isOpen && modalContentRef.current) {
      // Focus the content instead of the backdrop to prevent focus-related borders
      modalContentRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Don't auto-restart when pressing Escape
      e.preventDefault();
      // We'll keep the modal open, so do nothing
    }
  };

  // Prevent focus outline visually while keeping it accessible
  const removeOutlines = {
    outline: 'none',
    border: 'none',
    boxShadow: 'none',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            ref={modalRef}
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Remove onClick handler to prevent auto-restart when clicking outside
            onClick={(e) => e.stopPropagation()}
            style={removeOutlines}
          >
            {/* Modal Content */}
            <motion.div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              ref={modalContentRef}
              tabIndex={0}
              style={removeOutlines}
            >
              <motion.header
                className={`modal-header ${isWin ? 'win' : 'lose'}`}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 id="modal-title">{title}</h2>
              </motion.header>

              <motion.div
                className="modal-body"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="modal-word">
                  The word is <strong>{word}</strong>
                </p>
                <p className="modal-definition">Definition: {definition}</p>
              </motion.div>

              <motion.button
                className="modal-button"
                onClick={onClose}
                aria-label="Play Again"
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Play Again
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
