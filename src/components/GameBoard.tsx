import { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { motion, TargetAndTransition } from 'motion/react';
import { createPortal } from 'react-dom';

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
    transition: (delay: number) => ({ delay, duration: 0.3 }),
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
      transition: (wordLength: number, tileIndex: number) => ({
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
} as const;

interface GameBoardProps {
  guesses: string[];
  currentGuess: string;
  currentRow: number;
  targetWord: string;
  onRevealComplete: () => void;
  isMobile?: boolean; // Optional prop for mobile detection
  screenWidth?: number; // Optional prop for screen width
}

export interface GameBoardRef {
  revealRow: (row: number) => void;
  shakeRow: (row: number) => void;
}

const GameBoard = forwardRef<GameBoardRef, GameBoardProps>(
  (
    { guesses, currentGuess, currentRow, targetWord, onRevealComplete, isMobile, screenWidth },
    ref
  ) => {
    const wordLength = targetWord.length;
    // Track which row is currently having its letters revealed
    const [revealingRow, setRevealingRow] = useState<number | null>(null);
    const [shakingRow, setShakingRow] = useState<number | null>(null);
    const isShakingRef = useRef<boolean>(false);
    // Store tile states (correct, present, absent) for each position
    const [tileStates, setTileStates] = useState<{ [key: string]: string }>({});
    // Track which specific tile (column) is being revealed within the revealing row
    const [revealingTile, setRevealingTile] = useState<number | null>(null);
    // Track the most recently typed letter for typing animation
    const [lastTypedIndex, setLastTypedIndex] = useState<number | null>(null);
    // Track which tiles have had their animations completed
    const [revealedTiles, setRevealedTiles] = useState<Set<string>>(new Set());
    // Add a new state to track overall game status for screen readers
    const [gameStatus, setGameStatus] = useState<string>('');
    // Reference to the game board wrapper for scrolling
    const gameBoardRef = useRef<HTMLDivElement>(null);
    // References to each row
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
    // Add state to track if there's content out of view
    const [hasMoreRight, setHasMoreRight] = useState(false);
    const [hasMoreLeft, setHasMoreLeft] = useState(false);
    // Add state to track if game board is scrollable
    const [isScrollable, setIsScrollable] = useState(false);

    // Expose the revealRow method to parent component
    useImperativeHandle(ref, () => ({
      revealRow: (row: number) => {
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
      shakeRow: (rowIndex: number) => {
        if (isShakingRef.current) return;
      
        isShakingRef.current = true;
        setShakingRow(rowIndex);
      
        setTimeout(() => {
          setShakingRow(null);
          isShakingRef.current = false;
        }, 500);
      },
    }));

    // Scroll to the current row when it changes
    useEffect(() => {
      // Small delay to ensure rendering is complete
      const scrollTimer = setTimeout(() => {
        if (rowRefs.current[currentRow]) {
          // Find the first non-space tile in the current row
          const tiles = rowRefs.current[currentRow]?.querySelectorAll('.tile');
          if (tiles) {
            // First look for a non-space tile matching the current guess length
            let activeIndex = Math.max(0, currentGuess.length - 1);
            
            // If we're at the beginning or if pointing to a space, find the first non-space tile
            if (activeIndex <= 0 || targetWord[activeIndex] === ' ') {
              for (let i = 0; i < targetWord.length; i++) {
                if (targetWord[i] !== ' ') {
                  activeIndex = i;
                  break;
                }
              }
            }
            
            const activeTile = tiles[activeIndex];
            if (activeTile && targetWord[activeIndex] !== ' ') {
              scrollTileIntoView(activeTile as HTMLElement);
            }
          }
        }
      }, 100);
      
      return () => clearTimeout(scrollTimer);
    }, [currentRow, currentGuess.length, targetWord]);

    // Function to find next non-space index
    const findNextNonSpaceIndex = (startIndex: number, direction: 'forward' | 'backward' = 'forward'): number => {
      if (direction === 'forward') {
        for (let i = startIndex; i < targetWord.length; i++) {
          if (targetWord[i] !== ' ') return i;
        }
      } else {
        for (let i = startIndex; i >= 0; i--) {
          if (targetWord[i] !== ' ') return i;
        }
      }
      return startIndex; // fallback to original if no non-space found
    };

    // Function to determine the actual active typing index (never a space)
    const getActiveTypingIndex = useCallback(() => {
      const lastIndex = currentGuess.length - 1;
      
      // If the current position is a space, look for previous non-space
      if (lastIndex >= 0 && targetWord[lastIndex] === ' ') {
        return findNextNonSpaceIndex(lastIndex, 'backward');
      }
      
      return lastIndex;
    }, [currentGuess.length, targetWord]);

    // Handle typing animation when the current guess changes
    useEffect(() => {
      // Find the last typed non-space letter to trigger its animation
      const newLastTypedIndex = getActiveTypingIndex();
      
      setLastTypedIndex(newLastTypedIndex);
      
      let scrollTimer: number | null = null;
      
      // Scroll to the active cell when typing
      if (newLastTypedIndex >= 0 && rowRefs.current[currentRow]) {
        // Small delay to ensure DOM is updated
        scrollTimer = setTimeout(() => {
          const activeTile = rowRefs.current[currentRow]?.querySelectorAll('.tile')[newLastTypedIndex];
          if (activeTile) {
            scrollTileIntoView(activeTile as HTMLElement);
          }
        }, 50);
      }
      
      // Clear the animation state after the animation completes
      const typingTimer = setTimeout(() => setLastTypedIndex(null), 250);
      
      // Clean up timer if component unmounts or guess changes again
      return () => {
        clearTimeout(typingTimer);
        if (scrollTimer) clearTimeout(scrollTimer);
      };
    }, [currentGuess, currentRow, getActiveTypingIndex]);

    // Function to check if there are tiles out of view
    const checkOverflow = useCallback(() => {
      if (!gameBoardRef.current) return;
      
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        const container = gameBoardRef.current;
        if (!container) return;
        
        // Only allow scrolling if word length is more than 6 letters
        const shouldBeScrollable = wordLength > 6;
        
        if (shouldBeScrollable) {
          // Check if the content is wider than the container
          const scrollableWidth = container.scrollWidth;
          const containerWidth = container.clientWidth;
          const currentScrollPosition = container.scrollLeft;
          
          const isOverflowing = scrollableWidth > containerWidth + 5; // Add small buffer
          
          // Update isScrollable state
          setIsScrollable(isOverflowing);
          
          // Add or remove the is-scrollable class based on overflow
          if (isOverflowing) {
            container.classList.add('is-scrollable');
            
            // Check if there's content to the right (leave a small buffer)
            const hasRight = currentScrollPosition + containerWidth < scrollableWidth - 2;
            // Check if there's content to the left (leave a small buffer)
            const hasLeft = currentScrollPosition > 2;
            
            // Only update if values have changed to avoid unnecessary renders
            if (hasMoreRight !== hasRight) {
              setHasMoreRight(hasRight);
            }
            
            if (hasMoreLeft !== hasLeft) {
              setHasMoreLeft(hasLeft);
            }
          } else {
            container.classList.remove('is-scrollable');
            
            if (hasMoreLeft || hasMoreRight) {
              setHasMoreRight(false);
              setHasMoreLeft(false);
            }
          }
        } else {
          // For words of 6 letters or less, force no scrolling
          container.classList.remove('is-scrollable');
          setIsScrollable(false);
          setHasMoreLeft(false);
          setHasMoreRight(false);
          
          // Reset scroll position to beginning
          container.scrollLeft = 0;
        }
      });
    }, [hasMoreLeft, hasMoreRight, wordLength]);

    // Monitor scroll events to update indicators
    useEffect(() => {
      if (!gameBoardRef.current) return;
      
      const container = gameBoardRef.current;
      
      // Check on mount and when dependencies change
      checkOverflow();
      
      // Add scroll event listener
      const handleScroll = () => {
        checkOverflow();
      };
      
      // Add resize event listener to check overflow on window size changes
      const handleResize = () => {
        checkOverflow();
      };
      
      container.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }, [checkOverflow, targetWord, currentRow]);

    // Function to scroll a tile into view
    const scrollTileIntoView = (tileElement: HTMLElement) => {
      if (!gameBoardRef.current || !tileElement) return;
      
      const boardRect = gameBoardRef.current.getBoundingClientRect();
      const tileRect = tileElement.getBoundingClientRect();
      
      // Check if the tile is partially or fully outside the visible area
      const isPartiallyOutsideLeft = tileRect.left < boardRect.left;
      const isPartiallyOutsideRight = tileRect.right > boardRect.right;
      
      if (isPartiallyOutsideLeft || isPartiallyOutsideRight) {
        // Calculate scroll position to center the tile
        const scrollLeft = tileElement.offsetLeft - (boardRect.width / 2) + (tileRect.width / 2);
        
        // Smooth scroll to the tile
        gameBoardRef.current.scrollTo({
          left: scrollLeft,
          behavior: isMobile ? 'auto' : 'smooth', // Use instant scrolling on mobile for better performance
        });
        
        // Update indicators after scrolling
        setTimeout(checkOverflow, 100);
      }
    };

    // Handle the sequential reveal animation for each tile in a row
    useEffect(() => {
      if (revealingRow !== null && revealingTile !== null) {
        if (revealingTile < wordLength) {
          // Create a unique key for the current tile
          const tileKey = `${revealingRow}-${revealingTile}`;
          const letter = guesses[revealingRow][revealingTile];
          
          // Find the tile element being revealed and scroll to it
          if (rowRefs.current[revealingRow]) {
            // Don't scroll to space tiles
            if (targetWord[revealingTile] !== ' ') {
              const revealingTileElement = rowRefs.current[revealingRow]?.querySelectorAll('.tile')[revealingTile];
              if (revealingTileElement) {
                scrollTileIntoView(revealingTileElement as HTMLElement);
              }
            } else {
              // If a space is being revealed, find the next non-space tile to scroll to
              const nextNonSpaceIndex = findNextNonSpaceIndex(revealingTile + 1);
              if (nextNonSpaceIndex < wordLength) {
                const nextTileElement = rowRefs.current[revealingRow]?.querySelectorAll('.tile')[nextNonSpaceIndex];
                if (nextTileElement) {
                  scrollTileIntoView(nextTileElement as HTMLElement);
                }
              }
            }
          }

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
    const getTileClass = (rowIndex: number, colIndex: number) => {
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
    const isRevealing = (rowIndex: number, colIndex: number) => {
      if (targetWord[colIndex] === ' ') return false; // Don't animate spaces
      return rowIndex === revealingRow && colIndex === revealingTile;
    };

    // Check if the target position should be a space
    const isTargetSpace = (colIndex: number) => targetWord[colIndex] === ' ';

    // Determine the appropriate background color for a tile
    const getTileBackgroundColor = (
      _rowIndex: number, // Prefix with underscore to indicate it's not used
      _colIndex: number, // Prefix with underscore to indicate it's not used
      isSpaceTile: boolean,
      tileClass: string,
      revealing: boolean
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
    const getTileStatusText = (tileClass: string): string => {
      if (tileClass === 'correct') {
        return 'Correct';
      } else if (tileClass === 'present') {
        return 'Present in word but wrong position';
      } else if (tileClass === 'absent') {
        return 'Not in the word';
      }
      return '';
    };

    // Function to handle scroll by indicator click
    const handleScrollIndicatorClick = useCallback((direction: 'left' | 'right') => {
      if (!gameBoardRef.current) return;
      
      const scrollAmount = direction === 'left' ? -150 : 150;
      gameBoardRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      // Update indicators after scrolling
      setTimeout(checkOverflow, 100);
    }, [checkOverflow]);

    // ScrollIndicators component that will be rendered in a portal
    const ScrollIndicators = ({ 
      hasMoreLeft, 
      hasMoreRight, 
      isMobile, 
      screenWidth,
      isScrollable = false
    }: { 
      hasMoreLeft: boolean; 
      hasMoreRight: boolean; 
      isMobile?: boolean;
      screenWidth?: number;
      isScrollable?: boolean;
    }) => {
      // Only check if content is scrollable, show indicators on both mobile and desktop
      if (!isScrollable) return null;
      
      return createPortal(
        <>
          {hasMoreLeft && (
            <div 
              className={`scroll-indicator left ${isMobile ? 'mobile' : 'desktop'} ${screenWidth && screenWidth < 400 ? 'prominent' : ''}`} 
              aria-hidden="true"
              onClick={() => handleScrollIndicatorClick('left')}
              role="button"
              tabIndex={0}
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              aria-label="Scroll left"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleScrollIndicatorClick('left');
                }
              }}
            >
              <span>‹</span>
            </div>
          )}
          
          {hasMoreRight && (
            <div 
              className={`scroll-indicator right ${isMobile ? 'mobile' : 'desktop'} ${screenWidth && screenWidth < 400 ? 'prominent' : ''}`} 
              aria-hidden="true"
              onClick={() => handleScrollIndicatorClick('right')}
              role="button"
              tabIndex={0}
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              aria-label="Scroll right"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleScrollIndicatorClick('right');
                }
              }}
            >
              <span>›</span>
            </div>
          )}
        </>,
        document.body
      );
    };

    // Add keyboard shortcuts for scrolling horizontally
    useEffect(() => {
      if (!isScrollable || !gameBoardRef.current) return;
      
      const handleKeyDown = (e: KeyboardEvent) => {
        // Skip if we're typing in an input
        if (e.target instanceof HTMLInputElement) return;
        
        // Check if Alt key is held to prevent conflict with normal arrow key usage
        if (e.altKey && gameBoardRef.current) {
          const scrollAmount = 100; // Amount to scroll in pixels
          
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            gameBoardRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            setTimeout(checkOverflow, 100);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            gameBoardRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setTimeout(checkOverflow, 100);
          }
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [isScrollable, checkOverflow]);

    // Initial check for overflow when component mounts or word changes
    useEffect(() => {
      // Delay slightly to ensure proper rendering before checking
      const timer = setTimeout(() => {
        checkOverflow();
      }, 100);
      
      return () => clearTimeout(timer);
    }, [targetWord, checkOverflow]);

    return (
      <>
        <ScrollIndicators 
          hasMoreLeft={hasMoreLeft}
          hasMoreRight={hasMoreRight}
          isMobile={isMobile}
          screenWidth={screenWidth}
          isScrollable={isScrollable}
        />
        
        <motion.section
          className={`game-board-wrapper ${isMobile ? 'mobile' : ''} ${screenWidth && screenWidth < 400 ? 'very-small' : ''}`}
          ref={gameBoardRef}
          style={{ WebkitOverflowScrolling: 'touch' }}
          {...ANIMATIONS.BOARD}
          aria-label="Game board"
          role="grid"
          onLoad={checkOverflow}
        >
          <div className={`game-board ${wordLength <= 6 ? 'short-word' : ''}`}>
            {/* Status announcer for screen readers */}
            <div className="sr-only" aria-live="assertive" role="status">
              {gameStatus}
            </div>

            {Array(6)
              .fill(null)
              .map((_, rowIndex) => (
                <motion.div
                  key={rowIndex}
                  className={`row ${rowIndex === shakingRow ? 'shake' : ''}`}
                  role="row"
                  ref={(el) => { rowRefs.current[rowIndex] = el; }}
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
                      const activeTypingIndex = getActiveTypingIndex();
                      const isActiveTypingTile = isCurrentRowTile && colIndex === activeTypingIndex;
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
                            isSpaceTile ? 'space-tile' : ''
                          }${isActiveTypingTile && !isSpaceTile ? ' active-tile' : ''}`}
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
                            } as TargetAndTransition
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
          </div>
        </motion.section>
        
        {/* Scroll instruction for desktop */}
        <div className="scroll-instruction">
          Use Alt + ←→ keys to scroll
        </div>
      </>
    );
  }
);

export default GameBoard;
