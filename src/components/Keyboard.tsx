import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface KeyboardProps {
  guesses: string[];
  currentRow: number;
  targetWord: string;
  gameOver: boolean;
  onKeyClick: (key: string) => void;
}

const Keyboard: React.FC<KeyboardProps> = ({
  guesses,
  currentRow,
  targetWord,
  gameOver,
  onKeyClick,
}) => {
  const [rgbMode, setRgbMode] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);

  const getBrainrotColor = (seed: number) => {
   // Neon color generator
  const channels = [
    Math.floor(Math.abs(Math.sin(seed) * 200) + 55), // Red
    Math.floor(Math.abs(Math.cos(seed * 0.7) * 200) + 55), // Green
    Math.floor(Math.abs(Math.sin(seed * 1.3) * 200) + 55)  // Blue
  ];
  
  // Force at least one channel to be maxed out for vibrancy
  const maxChannel = Math.floor(Math.random() * 3);
  channels[maxChannel] = 255;
  
  // Occasionally make two channels maxed out
  if (Math.random() > 0.7) {
    channels[(maxChannel + 1) % 3] = 255;
  }
  
  return `rgb(${channels.join(',')})`;
  };

  useEffect(() => {
    if (!rgbMode) return;
    
    const interval = setInterval(() => {
      setPulsePhase(prev => (prev + 0.2) % 100);
      
      // Randomly shake the whole keyboard sometimes
      if (Math.random() > 0.7) {
        document.querySelector('.keyboard')?.classList.add('earthquake');
        setTimeout(() => {
          document.querySelector('.keyboard')?.classList.remove('earthquake');
        }, 300);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [rgbMode]);


  const getLetterStatus = (letter: string): string => {
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

  const handleKeyClick = (key: string) => {
    if (!gameOver) {
      onKeyClick(key);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    key: string
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleKeyClick(key);
    }
  };

  return (
    <div className='keyboard-container'>
     <motion.button
        className="rgb-toggle"
        onClick={() => setRgbMode(!rgbMode)}
        whileTap={{ scale: 0.95 }}
        animate={{
          background: rgbMode 
          ? `linear-gradient(90deg, 
          ${getBrainrotColor(pulsePhase)}, 
          ${getBrainrotColor(pulsePhase + 10)},
          ${getBrainrotColor(pulsePhase + 20)})`
       : 'var(--key-bg-color)',
        }}
      >
        {rgbMode ? '🌀 Brainrot Mode ON' : '✨ Activate Brainrot'}
      </motion.button>
      
    <motion.section
       className={`keyboard ${rgbMode ? 'brainrot-active' : ''}`}
      aria-label="Virtual keyboard"
      role="group"
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        background: rgbMode 
        ? `radial-gradient(circle, 
           ${getBrainrotColor(pulsePhase + 30)}20, 
           transparent 70%)`
        : 'transparent'
      }}
      transition={{ duration: 0.5 }}
    >
      {rows.map((row, rowIndex) => (
        <motion.div
          key={rowIndex}
          className="keyboard-row"
          role="row"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: rgbMode ? Math.sin(pulsePhase + rowIndex) * 3 : 0 }}
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
                whileHover={{
                  scale: rgbMode ? 1.2 : 1.05,
                  rotate: rgbMode ? Math.random() * 10 - 5 : 0
                }}
                whileTap={{ scale: 0.9 }}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  backgroundColor: rgbMode
                      ? getBrainrotColor(pulsePhase + key.charCodeAt(0) + keyIndex)
                      : status === 'correct'
                        ? 'var(--correct-color)'
                        : status === 'present'
                          ? 'var(--present-color)'
                          : status === 'absent'
                            ? 'var(--key-absent-color)'
                            : 'var(--key-bg-color)',
                    scale: rgbMode ? [1, 1.05, 1] : 1,
                    boxShadow: rgbMode
                    ? `0 0 10px ${getBrainrotColor(pulsePhase + keyIndex)}`
                    : 'none',
                      rotate: rgbMode ? Math.sin(pulsePhase + keyIndex) * 5 : 0
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 20,
                  backgroundColor: { duration: rgbMode ? 0.5 : 0.2 },
                  scale: { duration: 0.3 },
                  rotate: { type: 'spring', damping: 10 }
                }}
              >
                {displayKey}
              </motion.button>
            );
          })}
        </motion.div>
      ))}
    </motion.section>
    </div>
  );
};

export default Keyboard;
