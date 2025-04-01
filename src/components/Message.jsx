import { motion } from 'motion/react';

// interface MessageProps {
//   message: string;
//   gameWon: boolean;
// }

const Message = ({ message, gameWon }) => {
  return (
    message && (
      <motion.div
        className={`message ${gameWon ? 'success' : 'error'}`}
        initial={{ opacity: 0, y: -20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        {message}
      </motion.div>
    )
  );
};

export default Message;
