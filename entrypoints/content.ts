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
    let mode: TranslateMode | undefined;
    let language: string | undefined;
    let activationKey: string | undefined;
    let activationKeyPressed = false;

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

    async function translateSubtitle(subtitle: string[]): Promise<string> {
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
    settings$.language.forEach((newLanguage) => (language = newLanguage));
    settings$.mode.forEach((newMode) => (mode = newMode));
    settings$.activationKey.forEach((newActivationKey) => (activationKey = newActivationKey));

    // Listen for player settings modal open state
    settingsModalState$.forEach((isOpen) => {
      settingsModal[isOpen ? 'mount' : 'unmount']();
    });

    subtitles$.forEach(async (subtitle) => {
      // Clean up previous subtitles
      removeTranslatedSubtitle();

      switch (mode) {
        case TranslateMode.Enabled: {
          shiftOriginalSubtitle();
          appendTranslatedSubtitle('...');
          const translation = await translateSubtitle(subtitle);
          removeTranslatedSubtitle();
          appendTranslatedSubtitle(translation);
          showTranslatedSubtitle();
          break;
        }
        case TranslateMode.KeyPress: {
          appendTranslatedSubtitle('...');
          hideTranslatedSubtitle();
          const translation = await translateSubtitle(subtitle);
          removeTranslatedSubtitle();
          appendTranslatedSubtitle(translation);
          if (!activationKeyPressed) hideTranslatedSubtitle();
          break;
        }
        case TranslateMode.TranslationOnly: {
          hideOriginalSubtitle();
          const translation = await translateSubtitle(subtitle);
          appendTranslatedSubtitle(translation, '100%');
          showTranslatedSubtitle();
          if (activationKeyPressed) {
            hideTranslatedSubtitle();
            resetOriginalSubtitle();
          }
          break;
        }
        case TranslateMode.Disabled: {
          break;
        }
      }
    });
  }
});
