import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  message: string;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="toast-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="toast"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            initial={{ y: -20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.9 }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 25,
              opacity: { duration: 0.2 }
            }}
          >
            <motion.span
              className="toast-icon"
              aria-hidden="true"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              ⚠️
            </motion.span>
            <span className="toast-message">{message}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
