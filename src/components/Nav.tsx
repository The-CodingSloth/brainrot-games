import React from 'react';
import { motion } from 'motion/react';

interface NavProps {
  isDarkMode: boolean;
  isSoundEnabled: boolean;
  onThemeToggle: () => void;
  onSoundToggle: () => void;
}

const Nav: React.FC<NavProps> = ({
  isDarkMode,
  isSoundEnabled,
  onThemeToggle,
  onSoundToggle,
}) => {
  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      <div className="nav-left">
        <h1 className="nav-title">Word Tuah</h1>
      </div>
      <div className="nav-right">
        <motion.button
          className="nav-button"
          onClick={onSoundToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isSoundEnabled ? 'Disable sound' : 'Enable sound'}
          aria-pressed={isSoundEnabled}
          type="button"
        >
          {isSoundEnabled ? '🔊' : '🔇'}
        </motion.button>
        <motion.button
          className="nav-button"
          onClick={onThemeToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={
            isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
          }
          aria-pressed={isDarkMode}
          type="button"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </motion.button>
      </div>
    </nav>
  );
};

export default Nav;
