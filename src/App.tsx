import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import './App.css';
import './Wordle.css';
import { getRandomWord, getWordDefinition } from './wordList';
import GameBoard, { GameBoardRef } from './components/GameBoard';
import Keyboard from './components/Keyboard';
import Title from './components/Title';
import Modal from './components/Modal';
import Toast from './components/Toast';
import Nav from './components/Nav';
import { soundManager } from './utils/sound';

function App() {
  const [targetWord, setTargetWord] = useState<string>('');
  const [wordDefinition, setWordDefinition] = useState<string>('');
  const [guesses, setGuesses] = useState<string[]>(Array(6).fill(''));
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check for saved preference first, then fall back to system preference
    const savedPreference = localStorage.getItem('darkMode');
    if (savedPreference !== null) {
      return savedPreference === 'true';
    }
    // Fall back to system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const gameBoardRef = useRef<GameBoardRef>(null);

  // Track the space positions in the target word
  const [spacePositions, setSpacePositions] = useState<number[]>([]);

  const startNewGame = useCallback(() => {
    const newWord = getRandomWord();
    setTargetWord(newWord);
    setWordDefinition(getWordDefinition(newWord) || '');
    setGuesses(Array(6).fill(''));
    setCurrentGuess('');
    setCurrentRow(0);
    setGameOver(false);
    setGameWon(false);
    setShowModal(false);

    // Reset space positions
    const newSpacePositions: number[] = [];
    for (let i = 0; i < newWord.length; i++) {
      if (newWord[i] === ' ') {
        newSpacePositions.push(i);
      }
    }
    setSpacePositions(newSpacePositions);

    // Reset the game board state by triggering a re-render
    if (gameBoardRef.current) {
      gameBoardRef.current.revealRow(-1); // Reset any ongoing animations
    }

    //console.log('New word:', newWord); // For debugging
  }, []);

  // Initialize the game with a random word
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Check if we need to insert automatic spaces based on the current guess length
  useEffect(() => {
    for (const position of spacePositions) {
      if (currentGuess.length === position) {
        // Insert automatic space
        setCurrentGuess((prev) => prev + ' ');
      }
    }
  }, [currentGuess, spacePositions]);

  // Function to get the actual guess length without automatic spaces
  const getEffectiveGuessLength = useCallback(
    (guess: string): number => {
      // Filter out spaces that match the target word's space positions
      let effectiveLength = 0;
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] !== ' ' || !spacePositions.includes(i)) {
          effectiveLength++;
        }
      }
      return effectiveLength;
    },
    [spacePositions]
  );

  // Calculate the effective target word length (excluding automatic spaces)
  const effectiveTargetLength = targetWord.length - spacePositions.length;

  // Submit the current guess
  const submitGuess = useCallback(() => {
    // Get the effective length without counting automatic spaces
    const effectiveGuessLength = getEffectiveGuessLength(currentGuess);

    if (effectiveGuessLength !== effectiveTargetLength) {
      setShowToast(true);
      // Hide toast after 2 seconds
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    // Add the guess to the list
    const newGuesses = [...guesses];
    newGuesses[currentRow] = currentGuess;
    setGuesses(newGuesses);

    // Trigger the reveal animation
    gameBoardRef.current?.revealRow(currentRow);

    // Check if the guess is correct
    if (currentGuess.toUpperCase() === targetWord.toUpperCase()) {
      setGameOver(true);
      setGameWon(true);
    } else {
      // Move to the next row
      if (currentRow < 5) {
        setCurrentRow(currentRow + 1);
        setCurrentGuess('');
      } else {
        setGameOver(true);
      }
    }
  }, [
    currentGuess,
    targetWord,
    guesses,
    currentRow,
    effectiveTargetLength,
    getEffectiveGuessLength,
  ]);

  // Get the next position to type at (skipping space positions)
  const getNextTypePosition = useCallback(
    (currentLength: number): number => {
      // If the next position is a space, skip it
      if (spacePositions.includes(currentLength)) {
        return getNextTypePosition(currentLength + 1);
      }
      return currentLength;
    },
    [spacePositions]
  );

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (gameOver) return;

      const key = event.key.toUpperCase();

      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE') {
        // If we're at a space position, delete two characters
        if (spacePositions.includes(currentGuess.length - 1)) {
          setCurrentGuess((prev) => prev.slice(0, -2));
        } else {
          setCurrentGuess((prev) => prev.slice(0, -1));
        }
      } else if (
        /^[A-Z]$/.test(key) &&
        currentGuess.length < targetWord.length
      ) {
        // Get the next position to type at (skipping spaces)
        const nextPos = getNextTypePosition(currentGuess.length);

        // If there are automatic spaces to insert first, do that
        if (nextPos > currentGuess.length) {
          let newGuess = currentGuess;
          while (newGuess.length < nextPos) {
            newGuess += ' ';
          }
          newGuess += key;
          setCurrentGuess(newGuess);
        } else {
          setCurrentGuess((prev) => prev + key);
        }
      }
    },
    [
      currentGuess,
      gameOver,
      submitGuess,
      targetWord,
      spacePositions,
      getNextTypePosition,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handle on-screen keyboard clicks
  const handleKeyClick = useCallback(
    (key: string) => {
      if (gameOver) return;

      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE') {
        // If we're at a space position, delete two characters
        if (spacePositions.includes(currentGuess.length - 1)) {
          setCurrentGuess((prev) => prev.slice(0, -2));
        } else {
          setCurrentGuess((prev) => prev.slice(0, -1));
        }
      } else if (currentGuess.length < targetWord.length) {
        // Get the next position to type at (skipping spaces)
        const nextPos = getNextTypePosition(currentGuess.length);

        // If there are automatic spaces to insert first, do that
        if (nextPos > currentGuess.length) {
          let newGuess = currentGuess;
          while (newGuess.length < nextPos) {
            newGuess += ' ';
          }
          newGuess += key;
          setCurrentGuess(newGuess);
        } else {
          setCurrentGuess((prev) => prev + key);
        }
      }
    },
    [
      currentGuess,
      gameOver,
      submitGuess,
      targetWord,
      spacePositions,
      getNextTypePosition,
    ]
  );

  // Apply dark mode class to html element and save preference
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Update sound manager when sound setting changes
  useEffect(() => {
    soundManager.setEnabled(isSoundEnabled);
  }, [isSoundEnabled]);

  // Play sound when modal shows
  useEffect(() => {
    if (showModal) {
      soundManager.play(gameWon ? 'win' : 'fail');
    }
  }, [showModal, gameWon]);

  return (
    <div className="app">
      <header>
        <Nav
          isDarkMode={isDarkMode}
          isSoundEnabled={isSoundEnabled}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
          onSoundToggle={() => setIsSoundEnabled(!isSoundEnabled)}
        />
      </header>
      <Modal
        isOpen={showModal}
        onClose={startNewGame}
        title={gameWon ? '🎉 Congratulations!' : '😔 Game Over'}
        word={targetWord}
        definition={wordDefinition}
        isWin={gameWon}
      />

      <main className="wordle-container">
        <Title />
        <Toast
          isVisible={showToast}
          message={`Word must be ${effectiveTargetLength} letters!`}
        />
        <motion.section
          className="definition"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          aria-live="polite"
          aria-atomic="true"
        >
          <p>Definition: {wordDefinition}</p>
        </motion.section>

        <GameBoard
          ref={gameBoardRef}
          guesses={guesses}
          currentGuess={currentGuess}
          currentRow={currentRow}
          targetWord={targetWord}
          onRevealComplete={() => {
            // Show modal after the reveal animation completes
            if (gameOver) {
              setShowModal(true);
            }
          }}
        />

        <Keyboard
          guesses={guesses}
          currentRow={currentRow}
          targetWord={targetWord}
          gameOver={gameOver}
          onKeyClick={handleKeyClick}
        />
      </main>
    </div>
  );
}

export default App;
