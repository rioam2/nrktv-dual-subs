import { settings$ } from '@/observables/settings';
import { subtitles$ } from '@/observables/subtitles';
import { ExtensionMessage, ExtensionMessageAction, ExtensionReply } from '@/types/ExtensionMessage';
import { TranslateMode } from '@/types/TranslateMode';

const ACTIVATION_KEY = 't';

export default defineContentScript({
  matches: ['*://tv.nrk.no/*', '*://clients5.google.com/*'],
  allFrames: true,
  runAt: 'document_start',
  async main() {
    let mode: TranslateMode | undefined;
    let language: string | undefined;
    let activationKeyPressed = false;

    function shiftOriginalSubtitle() {
      const subtitleContainer = document.querySelector('tv-player-subtitles div') as HTMLDivElement;
      subtitleContainer.style.width = '50%';
      subtitleContainer.style.left = '0%';
    }

    function hideOriginalSubtitle() {
      const subtitleContainer = document.querySelector('tv-player-subtitles div') as HTMLDivElement;
      subtitleContainer.style.opacity = '0';
    }

    function resetOriginalSubtitle() {
      const subtitleContainer = document.querySelector('tv-player-subtitles div') as HTMLDivElement;
      subtitleContainer.style.width = '100%';
      subtitleContainer.style.opacity = '1';
      subtitleContainer.style.left = 'unset';
    }

    function appendTranslatedSubtitle(content: string, width = '50%') {
      const subtitleContainer = document.querySelector('tv-player-subtitles div') as HTMLDivElement;
      const translateContainer = subtitleContainer.cloneNode(true) as HTMLDivElement;
      const translateSubtitleText = translateContainer.querySelector('.tv-player-subtitle-text') as HTMLSpanElement;
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
      const node = document.querySelector('*[data-translated="true"]') as HTMLDivElement;
      node.remove();
    }

    function hideTranslatedSubtitle() {
      const node = document.querySelector('*[data-translated="true"]') as HTMLDivElement;
      node.style.opacity = '0';
      resetOriginalSubtitle();
    }

    function showTranslatedSubtitle() {
      const node = document.querySelector('*[data-translated="true"]') as HTMLDivElement;
      node.style.opacity = '1';
      shiftOriginalSubtitle();
    }

    async function translateSubtitle(subtitle: string[]): Promise<string> {
      const translation = (await browser.runtime.sendMessage({
        action: ExtensionMessageAction.Translate,
        payload: {
          source_lang: 'no',
          target_lang: language,
          text: subtitle.join('\n')
        }
      } as ExtensionMessage)) as ExtensionReply<ExtensionMessageAction.Translate>;
      if (translation.error) throw translation.error;
      return translation.response;
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === ACTIVATION_KEY) {
        activationKeyPressed = true;
        const video = document.querySelector('tv-player video') as HTMLVideoElement;
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
      if (e.key === ACTIVATION_KEY) {
        activationKeyPressed = false;
        const video = document.querySelector('tv-player video') as HTMLVideoElement;
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

    settings$.language.forEach((newLanguage) => (language = newLanguage));
    settings$.mode.forEach((newMode) => (mode = newMode));
    subtitles$.forEach(async (subtitle) => {
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
