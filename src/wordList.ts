import wordsData from './words.json';

// Convert words from JSON to a usable format
interface WordEntry {
  word: string;
  definition: string;
  length: number;
}

//For testing
/*const WORDS = [
  {
    word: 'sloth bytes',
    definition: "Oh you don't know what a sloth byte is?",
    length: 11,
  },
];
*/

// Type assertion to tell TypeScript this is an array of WordEntry
export const WORDS = wordsData as WordEntry[];

// Check if all words are only alphabet characters and spaces
const filter_words = WORDS.filter((entry) => entry.word.match(/^[a-zA-Z\s]+$/));

// Function to get a random word from the list
export const getRandomWord = (): string => {
  return filter_words[
    Math.floor(Math.random() * filter_words.length)
  ].word.toUpperCase();
};

// Function to get a word's definition
export const getWordDefinition = (word: string): string | undefined => {
  const entry = filter_words.find(
    (entry) => entry.word.toUpperCase() === word.toUpperCase()
  );
  return entry?.definition;
};

// Function to get words by length
export const getWordsByLength = (length: number): string[] => {
  return filter_words
    .filter((entry) => entry.length === length)
    .map((entry) => entry.word.toUpperCase());
};
