import { motion, AnimatePresence } from 'motion/react';

// interface ToastProps {
//   message: string;
//   isVisible: boolean;
// }

const Toast = ({ message, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="toast-container"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            opacity: { duration: 0.2 },
          }}
        >
          <motion.div
            className="toast"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <motion.span
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
