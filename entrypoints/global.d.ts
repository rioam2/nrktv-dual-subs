declare global {
  interface TranslatorOptions {
    sourceLanguage: string;
    targetLanguage: string;
  }
  type TranslatorAvailability = 'available' | 'downloadable' | 'unknown';
  interface Window {
    Translator?: {
      availability(options: TranslatorOptions): Promise<TranslatorAvailability>;
      create(options: TranslatorOptions): Promise<{ translate: (text: string) => Promise<string> }>;
    };
  }
}

export default {};
