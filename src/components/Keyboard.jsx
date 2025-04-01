import { motion } from 'motion/react';

// interface KeyboardProps {
//   guesses: string[];
//   currentRow: number;
//   targetWord: string;
//   gameOver: boolean;
//   onKeyClick: (key: string) => void;
// }

const Keyboard = ({
  guesses,
  currentRow,
  targetWord,
  gameOver,
  onKeyClick,
}) => {
  const getLetterStatus = (letter) => {
    // Skip special keys
    if (letter === 'ENTER' || letter === 'BACKSPACE') {
      return '';
    }

    // Check all previous guesses (including current row)
    for (let row = 0; row <= currentRow; row++) {
      const guess = guesses[row];
      if (!guess) continue;

      // Check each position in the guess
      for (let i = 0; i < targetWord.length; i++) {
        if (guess[i]?.toUpperCase() === letter) {
          // If letter is in correct position
          if (letter === targetWord[i]?.toUpperCase()) {
            return 'correct';
          }
          // If letter is in word but wrong position
          if (targetWord.toUpperCase().includes(letter)) {
            return 'present';
          }
          // If letter is not in word
          return 'absent';
        }
      }
    }

    return '';
  };

  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ];

  const handleKeyClick = (key) => {
    if (!gameOver) {
      onKeyClick(key);
    }
  };

  const handleKeyDown = (
    e,
    key
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleKeyClick(key);
    }
  };

  return (
    <motion.section
      className="keyboard"
      aria-label="Virtual keyboard"
      role="group"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {rows.map((row, rowIndex) => (
        <motion.div
          key={rowIndex}
          className="keyboard-row"
          role="row"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rowIndex * 0.1, duration: 0.3 }}
        >
          {row.map((key, keyIndex) => {
            const status = getLetterStatus(key);
            const isSpecialKey = key === 'ENTER' || key === 'BACKSPACE';
            const keyLabel = key === 'BACKSPACE' ? 'Backspace' : key;
            const displayKey = key === 'BACKSPACE' ? '←' : key;

            return (
              <motion.button
                key={keyIndex}
                className={`key ${isSpecialKey ? 'wide' : ''} ${status}`}
                onClick={() => handleKeyClick(key)}
                onKeyDown={(e) => handleKeyDown(e, key)}
                disabled={gameOver}
                aria-label={keyLabel}
                aria-pressed="false"
                type="button"
                tabIndex={0}
                whileTap={{ scale: 0.9 }}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  backgroundColor:
                    status === 'correct'
                      ? 'var(--correct-color)'
                      : status === 'present'
                      ? 'var(--present-color)'
                      : status === 'absent'
                      ? 'var(--key-absent-color)'
                      : 'var(--key-bg-color)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 20,
                }}
              >
                {displayKey}
              </motion.button>
            );
          })}
        </motion.div>
      ))}
    </motion.section>
  );
};

export default Keyboard;
