import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'motion/react';

// Animation configurations for different elements and states
const ANIMATIONS = {
  // Initial fade-in animation for the entire game board
  BOARD: {
    initial: { opacity: 0 }, // Start invisible
    animate: { opacity: 1 }, // Fade in to fully visible
    transition: { duration: 0.5 },
  },
  // Row entrance animations that stagger each row's appearance
  ROW: {
    initial: { opacity: 0, y: -10 }, // Start invisible and slightly above position
    animate: { opacity: 1, y: 0 }, // Fade in and move to correct position
    transition: (delay) => ({ delay, duration: 0.3 }),
  },
  // Different animation states for individual tiles
  TILE: {
    // Animation when user types a new letter
    TYPING: {
      scale: [1, 3, 1], // Pop effect: normal → 3x size → normal
      transition: { duration: 0.2, ease: 'easeOut' },
    },
    // Animation when revealing correctness of a letter
    REVEALING: {
      scale: [1, 0.8, 5, 1], // Dramatic pop: normal → shrink → expand → normal
      rotateX: [0, 10, -10, 0], // Shake effect
      opacity: [1, 0.5, 1], // Subtle fade in/out
      transition: (wordLength, tileIndex) => ({
        scale: {
          duration: Math.max(
            0.08,
            0.25 - (wordLength - 5) * 0.01 - tileIndex * 0.02
          ),
          ease: 'easeInOut',
        },
        opacity: {
          duration: Math.max(
            0.08,
            0.25 - (wordLength - 5) * 0.01 - tileIndex * 0.02
          ),
          ease: 'easeInOut',
        },
        backgroundColor: {
          duration: Math.max(
            0.05,
            0.12 - (wordLength - 5) * 0.005 - tileIndex * 0.01
          ),
        },
        color: {
          duration: Math.max(
            0.05,
            0.12 - (wordLength - 5) * 0.005 - tileIndex * 0.01
          ),
        },
      }),
    },
    // Default state for idle tiles
    DEFAULT: {
      scale: 1, // Normal size
      transition: {
        duration: 0.1, // Quick transitions
        type: 'spring', // Springy physics-based animation
        stiffness: 500, // Spring is fairly stiff
        damping: 30, // Moderate dampening (less bouncy)
      },
    },
  },
};

const GameBoard = forwardRef(
  (
    { guesses, currentGuess, currentRow, targetWord, onRevealComplete },
    ref
  ) => {
    const wordLength = targetWord.length;
    // Track which row is currently having its letters revealed
    const [revealingRow, setRevealingRow] = useState(null);
    // Store tile states (correct, present, absent) for each position
    const [tileStates, setTileStates] = useState({});
    // Track which specific tile (column) is being revealed within the revealing row
    const [revealingTile, setRevealingTile] = useState(null);
    // Track the most recently typed letter for typing animation
    const [lastTypedIndex, setLastTypedIndex] = useState(null);
    // Track which tiles have had their animations completed
    const [revealedTiles, setRevealedTiles] = useState(new Set());
    // Add a new state to track overall game status for screen readers
    const [gameStatus, setGameStatus] = useState('');

    // Expose the revealRow method to parent component
    useImperativeHandle(ref, () => ({
      revealRow: (row) => {
        // If row is -1, reset all states
        if (row === -1) {
          setRevealingRow(null);
          setRevealingTile(null);
          // Reset tile states and ensure no tiles are marked as spaces
          setTileStates({});
          setRevealedTiles(new Set());
          setLastTypedIndex(null);
          return;
        }

        // Reset revealed tiles when starting a new row reveal
        setRevealedTiles(new Set());
        // Set which row we're revealing
        setRevealingRow(row);
        // Start with the first tile (column 0)
        setRevealingTile(0);
      },
    }));

    // Handle typing animation when the current guess changes
    useEffect(() => {
      // Set the last typed letter to trigger its animation
      setLastTypedIndex(currentGuess.length - 1);
      // Clear the animation state after the animation completes
      const typingTimer = setTimeout(() => setLastTypedIndex(null), 250);
      // Clean up timer if component unmounts or guess changes again
      return () => clearTimeout(typingTimer);
    }, [currentGuess]);

    // Handle the sequential reveal animation for each tile in a row
    useEffect(() => {
      if (revealingRow !== null && revealingTile !== null) {
        if (revealingTile < wordLength) {
          // Create a unique key for the current tile
          const tileKey = `${revealingRow}-${revealingTile}`;
          const letter = guesses[revealingRow][revealingTile];

          // Only mark as space if the target word has a space in this position
          if (targetWord[revealingTile] === ' ') {
            setTileStates((prev) => ({
              ...prev,
              [tileKey]: 'space',
            }));
            setRevealedTiles((prev) => {
              const newSet = new Set(prev);
              newSet.add(tileKey);
              return newSet;
            });
            setRevealingTile((prevTile) =>
              prevTile !== null ? prevTile + 1 : null
            );
            return;
          }

          // For non-space characters, continue with normal animation
          const newState =
            letter === targetWord[revealingTile]
              ? 'correct'
              : targetWord.includes(letter)
              ? 'present'
              : 'absent';

          setTileStates((prev) => ({
            ...prev,
            [tileKey]: newState,
          }));

          // After animation completes, mark this tile as revealed
          // This triggers the color to show in the UI
          const baseDelay = Math.max(80, 200 - (wordLength - 5) * 10);
          const progressiveDelay = baseDelay - revealingTile * 15;
          const dynamicDelay = Math.max(40, progressiveDelay);
          const addToRevealedTimer = setTimeout(() => {
            setRevealedTiles((prev) => {
              const newSet = new Set(prev);
              newSet.add(tileKey);
              return newSet;
            });

            // Move to the next tile only after the reveal is complete
            setRevealingTile((prevTile) =>
              prevTile !== null ? prevTile + 1 : null
            );
          }, dynamicDelay);

          // Clean up timers if component unmounts or dependencies change
          return () => {
            clearTimeout(addToRevealedTimer);
          };
        } else {
          // All tiles in the row have been revealed
          // Wait for final animation to complete before notifying parent
          const finalBaseDelay = Math.max(80, 200 - (wordLength - 5) * 10);
          const finalProgressiveDelay = finalBaseDelay - wordLength * 15;
          const finalDelay = Math.max(40, finalProgressiveDelay);
          setTimeout(() => {
            setRevealingRow(null);
            setRevealingTile(null);
            onRevealComplete();
          }, finalDelay);
        }
      }
    }, [
      revealingRow,
      revealingTile,
      guesses,
      targetWord,
      wordLength,
      onRevealComplete,
    ]);

    // Update the game status for screen readers when revealing is complete
    useEffect(() => {
      if (revealingRow === null && revealingTile === null) {
        if (gameStatus !== '') {
          setTimeout(() => setGameStatus(''), 1000); // Clear after being announced
        }
      }
    }, [revealingRow, revealingTile, gameStatus]);

    // Determine the visual state class for each tile
    const getTileClass = (rowIndex, colIndex) => {
      const tileKey = `${rowIndex}-${colIndex}`;

      // Return color state for tiles that have completed their reveal animation
      if (tileStates[tileKey] && revealedTiles.has(tileKey)) {
        return tileStates[tileKey];
      }

      // Handle previously completed rows (not the currently revealing row)
      if (rowIndex < currentRow && rowIndex !== revealingRow) {
        const letter = guesses[rowIndex][colIndex];
        // Check if this position should be a space in the target word
        if (targetWord[colIndex] === ' ') return 'space';
        if (letter === targetWord[colIndex]) return 'correct';
        if (targetWord.includes(letter)) return 'present';
        return 'absent';
      }

      // Default to empty string for tiles not yet evaluated
      return '';
    };

    // Check if a specific tile is currently being revealed
    const isRevealing = (rowIndex, colIndex) => {
      if (targetWord[colIndex] === ' ') return false; // Don't animate spaces
      return rowIndex === revealingRow && colIndex === revealingTile;
    };

    // Check if the target position should be a space
    const isTargetSpace = (colIndex) => targetWord[colIndex] === ' ';

    // Determine the appropriate background color for a tile
    const getTileBackgroundColor = (
      _rowIndex, // Prefix with underscore to indicate it's not used
      _colIndex, // Prefix with underscore to indicate it's not used
      isSpaceTile,
      tileClass,
      revealing
    ) => {
      // For space tiles, return a specific color that matches the background
      if (isSpaceTile) return 'var(--background-color)';

      // During reveal animation, start with default color
      if (revealing) return 'var(--tile-bg)';

      // Apply the appropriate color based on the tile's state
      switch (tileClass) {
        case 'correct':
          return 'var(--correct-color)';
        case 'present':
          return 'var(--present-color)';
        case 'absent':
          return 'var(--absent-color)';
        default:
          return 'var(--tile-bg)';
      }
    };

    // Update the method for determining tile status
    const getTileStatusText = (tileClass) => {
      if (tileClass === 'correct') {
        return 'Correct';
      } else if (tileClass === 'present') {
        return 'Present in word but wrong position';
      } else if (tileClass === 'absent') {
        return 'Not in the word';
      }
      return '';
    };

    return (
      <motion.section
        className="game-board"
        {...ANIMATIONS.BOARD}
        aria-label="Game board"
        role="grid"
      >
        {/* Status announcer for screen readers */}
        <div className="sr-only" aria-live="assertive" role="status">
          {gameStatus}
        </div>

        {Array(6)
          .fill(null)
          .map((_, rowIndex) => (
            <motion.div
              key={rowIndex}
              className="row"
              role="row"
              aria-rowindex={rowIndex + 1}
              {...ANIMATIONS.ROW}
              transition={ANIMATIONS.ROW.transition(rowIndex * 0.05)}
            >
              {Array(wordLength)
                .fill(null)
                .map((_, colIndex) => {
                  // Determine various states and properties for this tile
                  const isCurrentRowTile = rowIndex === currentRow;
                  const isTypedLetter = colIndex < currentGuess.length;
                  const isLastTyped =
                    isCurrentRowTile && colIndex === lastTypedIndex;
                  const tileClass = getTileClass(rowIndex, colIndex);
                  const letter =
                    isCurrentRowTile && isTypedLetter
                      ? currentGuess[colIndex]
                      : guesses[rowIndex]?.[colIndex] || '';
                  const revealing = isRevealing(rowIndex, colIndex);
                  const isSpaceTile = isTargetSpace(colIndex);

                  // Select the appropriate animation based on the tile's state
                  let tileAnimation;
                  if (isLastTyped) {
                    // Animation for newly typed letter
                    tileAnimation = ANIMATIONS.TILE.TYPING;
                  } else if (revealing && !isSpaceTile) {
                    // Animation for tile being revealed (flipping)
                    tileAnimation = {
                      ...ANIMATIONS.TILE.REVEALING,
                      transition: ANIMATIONS.TILE.REVEALING.transition(
                        wordLength,
                        colIndex
                      ),
                    };
                  } else {
                    // Default animation (static)
                    tileAnimation = ANIMATIONS.TILE.DEFAULT;
                  }

                  // Get the final background color
                  const bgColor = getTileBackgroundColor(
                    rowIndex,
                    colIndex,
                    isSpaceTile,
                    tileClass,
                    revealing
                  );

                  // Get status text for screen readers
                  const statusText = getTileStatusText(tileClass);

                  return (
                    <motion.div
                      key={colIndex}
                      className={`tile ${tileClass} ${
                        targetWord[colIndex] === ' ' ? 'space-tile' : ''
                      }`}
                      role="gridcell"
                      aria-colindex={colIndex + 1}
                      aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}${
                        letter ? `: Letter ${letter}` : ''
                      }${statusText ? `, ${statusText}` : ''}`}
                      aria-live={isCurrentRowTile ? 'polite' : 'off'}
                      layout
                      animate={
                        {
                          // Apply animation properties based on tile state
                          ...tileAnimation,
                          // For revealing tiles: animate directly to result color
                          backgroundColor: revealing
                            ? bgColor // Just use the final color immediately
                            : bgColor,
                          // Don't set border inline, let CSS classes handle it
                        }
                      }
                    >
                      {targetWord[colIndex] !== ' ' && (
                        <motion.span
                          // Keep letter at normal scale
                          animate={{
                            scale: 1,
                          }}
                        >
                          {letter}
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}
            </motion.div>
          ))}
      </motion.section>
    );
  }
);

export default GameBoard;
