declare module '*.json' {
  interface WordEntry {
    word: string;
    definition: string;
    length: number;
  }
  const value: WordEntry[];
  export default value;
}
