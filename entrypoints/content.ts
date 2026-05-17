import {
  SUBTITLE_TEXT_QUERY_SELECTOR,
  SUBTITLE_WRAPPER_QUERY_SELECTOR,
  TRANSLATED_SUBTITLE_TEXT_QUERY_SELECTOR,
  VIDEO_PLAYER_QUERY_SELECTOR
} from '@/constants/selectors';
import { settings$ } from '@/observables/settings';
import { settingsModalState$ } from '@/observables/settings-modal';
import { subtitles$ } from '@/observables/subtitles';
import { ExtensionMessage, ExtensionMessageAction } from '@/types/ExtensionMessage';
import { TranslateMode } from '@/types/TranslateMode';
import { settingsModal } from './inject/settings-modal/main';

export default defineContentScript({
  matches: ['*://tv.nrk.no/*', '*://clients5.google.com/*'],
  allFrames: true,
  runAt: 'document_start',
  async main() {
    const TRANSLATION_CACHE_LIMIT = 100;
    const TRANSLATION_PREFETCH_AHEAD = 3;

    let mode: TranslateMode | undefined;
    let language: string | undefined;
    let activationKey: string | undefined;
    let activationKeyPressed = false;
    let subtitleRequestId = 0;

    const translationCache = new Map<string, string>();
    const translationInFlight = new Map<string, Promise<string>>();

    function subtitleToKey(subtitle: string[]): string {
      return subtitle.join('\n');
    }

    function rememberTranslation(key: string, translation: string) {
      if (translationCache.has(key)) {
        translationCache.delete(key);
      }
      translationCache.set(key, translation);

      if (translationCache.size > TRANSLATION_CACHE_LIMIT) {
        const oldest = translationCache.keys().next().value;
        if (oldest) translationCache.delete(oldest);
      }
    }

    function shiftOriginalSubtitle() {
      const subtitleContainer = document.querySelector(SUBTITLE_WRAPPER_QUERY_SELECTOR) as HTMLDivElement;
      if (!subtitleContainer) return;
      subtitleContainer.style.width = '50%';
      subtitleContainer.style.left = '0%';
    }

    function hideOriginalSubtitle() {
      const subtitleContainer = document.querySelector(SUBTITLE_WRAPPER_QUERY_SELECTOR) as HTMLDivElement;
      if (!subtitleContainer) return;
      subtitleContainer.style.opacity = '0';
    }

    function resetOriginalSubtitle() {
      const subtitleContainer = document.querySelector(SUBTITLE_WRAPPER_QUERY_SELECTOR) as HTMLDivElement;
      if (!subtitleContainer) return;
      subtitleContainer.style.width = '100%';
      subtitleContainer.style.opacity = '1';
      subtitleContainer.style.left = 'unset';
    }

    function appendTranslatedSubtitle(content: string, width = '50%') {
      const subtitleContainer = document.querySelector(SUBTITLE_WRAPPER_QUERY_SELECTOR) as HTMLDivElement;
      const translateContainer = subtitleContainer.cloneNode(true) as HTMLDivElement;
      const translateSubtitleText = translateContainer.querySelector(SUBTITLE_TEXT_QUERY_SELECTOR) as HTMLSpanElement;
      if (!translateSubtitleText) return;
      translateSubtitleText.innerText = content;
      translateContainer.style.left = 'unset';
      translateContainer.style.right = '0%';
      translateContainer.style.width = width;
      translateContainer.style.opacity = '1';
      translateContainer.setAttribute('data-translated', 'true');
      subtitleContainer.parentElement?.appendChild(translateContainer);
    }

    function removeTranslatedSubtitle() {
      const node = document.querySelector(TRANSLATED_SUBTITLE_TEXT_QUERY_SELECTOR) as HTMLDivElement;
      if (!node) return;
      node.remove();
    }

    function hideTranslatedSubtitle() {
      const node = document.querySelector(TRANSLATED_SUBTITLE_TEXT_QUERY_SELECTOR) as HTMLDivElement;
      if (!node) return;
      node.style.opacity = '0';
      resetOriginalSubtitle();
    }

    function showTranslatedSubtitle() {
      const node = document.querySelector(TRANSLATED_SUBTITLE_TEXT_QUERY_SELECTOR) as HTMLDivElement;
      if (!node) return;
      node.style.opacity = '1';
      shiftOriginalSubtitle();
    }

    async function getBuiltinTranslatorApi(options: TranslatorOptions) {
      if (!('Translator' in self) || !self.Translator) {
        return null;
      }
      const translatorCapabilities = await self.Translator.availability(options);
      switch (translatorCapabilities) {
        case 'available':
          return await self.Translator.create(options);
        case 'downloadable':
          // Trigger model download for next time (optimistic, don't await or care about result)
          self.Translator.create(options).catch(() => {});
          return null;
        default:
          return null;
      }
    }

    async function translateSubtitleUsingBuiltinApi(subtitle: string[]): Promise<string> {
      const translatorApi = await getBuiltinTranslatorApi({
        sourceLanguage: 'no',
        targetLanguage: language || 'en'
      });
      if (translatorApi) {
        const translatedLines = await Promise.all(subtitle.map((line) => translatorApi.translate(line)));
        return translatedLines.join('\n');
      }
      throw new Error('Built-in Translator API not available');
    }

    async function translateSubtitleUsingNetwork(subtitle: string[]): Promise<string> {
      const translation = await browser.runtime.sendMessage({
        action: ExtensionMessageAction.Translate,
        payload: {
          source_lang: 'no',
          target_lang: language,
          text: subtitle.join('\n')
        }
      } as ExtensionMessage);
      if (translation.error) throw translation.error;
      return translation.response;
    }

    async function translateSubtitle(subtitle: string[]): Promise<string> {
      return await Promise.any([
        // Try both translation methods and use whichever is fastest
        // This also provides a stable fallback in case one method fails
        // (e.g. built-in API not available, network request fails, etc.)
        translateSubtitleUsingBuiltinApi(subtitle),
        translateSubtitleUsingNetwork(subtitle)
      ]);
    }

    function cueTextToSubtitle(cueText: string): string[] {
      return cueText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => !!line);
    }

    async function getOrCreateTranslation(subtitle: string[]): Promise<string> {
      const key = subtitleToKey(subtitle);
      const cached = translationCache.get(key);
      if (cached) return cached;

      const existingPromise = translationInFlight.get(key);
      if (existingPromise) return await existingPromise;

      const translationPromise = translateSubtitle(subtitle)
        .then((translation) => {
          rememberTranslation(key, translation);
          return translation;
        })
        .finally(() => {
          translationInFlight.delete(key);
        });

      translationInFlight.set(key, translationPromise);
      return await translationPromise;
    }

    function prefetchUpcomingSubtitleTranslations() {
      const video = document.querySelector(VIDEO_PLAYER_QUERY_SELECTOR) as HTMLVideoElement | null;
      if (!video) return;

      for (let trackIndex = 0; trackIndex < video.textTracks.length; trackIndex++) {
        const track = video.textTracks[trackIndex];
        const cues = track.cues;
        if (!cues?.length) continue;

        const activeCue = track.activeCues?.[0] ?? null;
        let activeIndex = -1;

        if (activeCue) {
          for (let cueIndex = 0; cueIndex < cues.length; cueIndex++) {
            if (cues[cueIndex] === activeCue) {
              activeIndex = cueIndex;
              break;
            }
          }
        }

        const startIndex = Math.max(activeIndex + 1, 0);
        const endIndex = Math.min(startIndex + TRANSLATION_PREFETCH_AHEAD, cues.length);

        for (let cueIndex = startIndex; cueIndex < endIndex; cueIndex++) {
          const cue = cues[cueIndex] as TextTrackCue;
          const cueSubtitle = cueTextToSubtitle((cue as VTTCue).text ?? '');
          if (!cueSubtitle.length) continue;
          void getOrCreateTranslation(cueSubtitle);
        }
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === activationKey) {
        e.preventDefault();
        e.stopPropagation();
        activationKeyPressed = true;
        const video = document.querySelector(VIDEO_PLAYER_QUERY_SELECTOR) as HTMLVideoElement;
        switch (mode) {
          case TranslateMode.KeyPress:
            showTranslatedSubtitle();
            video.pause();
            video.focus();
            break;
          case TranslateMode.TranslationOnly:
            hideTranslatedSubtitle();
            video.pause();
            video.focus();
            break;
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === activationKey) {
        e.preventDefault();
        e.stopPropagation();
        activationKeyPressed = false;
        const video = document.querySelector(VIDEO_PLAYER_QUERY_SELECTOR) as HTMLVideoElement;
        switch (mode) {
          case TranslateMode.KeyPress:
            hideTranslatedSubtitle();
            video.play();
            video.focus();
            break;
          case TranslateMode.TranslationOnly:
            hideOriginalSubtitle();
            showTranslatedSubtitle();
            video.play();
            video.focus();
            break;
        }
      }
    });

    // Listen for settings changes
    settings$.language.forEach((newLanguage) => {
      if (language !== newLanguage) {
        // Invalidate buffered translations so old language results never leak into new language mode.
        translationCache.clear();
        translationInFlight.clear();
        subtitleRequestId++;
        removeTranslatedSubtitle();
      }
      language = newLanguage;
    });
    settings$.mode.forEach((newMode) => (mode = newMode));
    settings$.activationKey.forEach((newActivationKey) => (activationKey = newActivationKey));

    // Listen for player settings modal open state
    settingsModalState$.forEach((isOpen) => {
      settingsModal[isOpen ? 'mount' : 'unmount']();
    });

    subtitles$.forEach(async (subtitle) => {
      const currentRequestId = ++subtitleRequestId;
      prefetchUpcomingSubtitleTranslations();

      switch (mode) {
        case TranslateMode.Enabled: {
          shiftOriginalSubtitle();
          const translation = await getOrCreateTranslation(subtitle);
          if (currentRequestId !== subtitleRequestId) return;
          removeTranslatedSubtitle();
          appendTranslatedSubtitle(translation);
          showTranslatedSubtitle();
          break;
        }
        case TranslateMode.KeyPress: {
          removeTranslatedSubtitle();
          hideTranslatedSubtitle();
          const translation = await getOrCreateTranslation(subtitle);
          if (currentRequestId !== subtitleRequestId) return;
          removeTranslatedSubtitle();
          appendTranslatedSubtitle(translation);
          if (!activationKeyPressed) hideTranslatedSubtitle();
          break;
        }
        case TranslateMode.TranslationOnly: {
          hideOriginalSubtitle();
          const translation = await getOrCreateTranslation(subtitle);
          if (currentRequestId !== subtitleRequestId) return;
          removeTranslatedSubtitle();
          appendTranslatedSubtitle(translation, '100%');
          showTranslatedSubtitle();
          if (activationKeyPressed) {
            hideTranslatedSubtitle();
            resetOriginalSubtitle();
          }
          break;
        }
        case TranslateMode.Disabled: {
          removeTranslatedSubtitle();
          resetOriginalSubtitle();
          break;
        }
      }
    });
  }
});
