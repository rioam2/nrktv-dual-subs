import { ExtensionMessage, ExtensionMessageAction } from '@/types/ExtensionMessage';

export default defineBackground(() => {
  // Helper function to retrieve a translation from Google Translate API
  async function getTranslation(text: string, source_lang: string, target_lang: string): Promise<string> {
    // Build translation query
    const baseURL = `https://clients5.google.com/translate_a/t`;
    let reqURL = baseURL;
    reqURL += `?client=dict-chrome-ex`;
    reqURL += `&q=${encodeURI(text)}`;
    reqURL += `&sl=${source_lang}&tl=${target_lang}&ie=UTF8&oe=UTF8`;

    const response = await fetch(reqURL, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error('Request failed');
    const res = await response.json();

    if (res.sentences && Array.isArray(res.sentences)) {
      // Undocumented API response schema until March 2021
      return res.sentences.map((sentence: { trans: string[] }) => sentence.trans).join('');
    } else if (Array.isArray(res)) {
      // Undocumented API response schema as of March 2021+
      return res.flat(1e9)[0];
    }

    throw new Error('Unknown response format');
  }

  browser.runtime.onMessage.addListener(async (message: ExtensionMessage, sender, sendResponse) => {
    switch (message.action) {
      case ExtensionMessageAction.Translate:
        try {
          const { text, source_lang, target_lang } = message.payload;
          const translation = await getTranslation(text, source_lang, target_lang);
          return {
            error: null,
            response: translation
          };
        } catch (e) {
          return {
            error: e,
            response: null
          };
        }
    }
  });
});
