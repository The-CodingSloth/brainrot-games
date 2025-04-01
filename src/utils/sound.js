class SoundManager {

  constructor() {
    // Pre-load sounds
    // Fix paths for production build - use relative import syntax that Vite can process
    this.sounds = {
      win: new Audio(new URL('../assets/sounds/win.mp3', import.meta.url).href),
      fail: new Audio(
        new URL('../assets/sounds/fail.mp3', import.meta.url).href
      ),
    };
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  play(soundName) {
    if (!this.enabled) return;

    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0; // Reset to start
      sound.play().catch((err) => console.log('Error playing sound:', err));
    }
  }
}

export const soundManager = new SoundManager();
