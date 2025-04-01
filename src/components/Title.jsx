import { motion } from 'motion/react';

const Title = () => {
  return (
    <header className="game-header">
      <motion.h1
        className="title"
        aria-label="Word Tuah - Word Guessing Game"
        animate={{
          opacity: 1,
          y: 0,
          scale: [0, 2, 1],
          rotate: 360,
          color: [
            'var(--text-color)',
            'var(--correct-color)',
            'var(--present-color)',
            'var(--absent-color)',
            'var(--text-color)',
          ],
        }}
        transition={{
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        <motion.span
          initial={{ display: 'inline-block' }}
          animate={{ rotate: [0, -10, 0, 10, 0] }}
          transition={{
            duration: 1.5,
            ease: 'easeInOut',
            times: [0, 0.2, 0.5, 0.8, 1],
            repeat: Infinity,
            repeatDelay: 5,
          }}
          aria-hidden="true"
        >
          Word
        </motion.span>{' '}
        Tuah
      </motion.h1>
    </header>
  );
};

export default Title;
