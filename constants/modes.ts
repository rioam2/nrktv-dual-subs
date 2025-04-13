import { TranslateMode } from '@/types/TranslateMode';
import { KeyReturn, SubtitlesSlash, Translate } from '@phosphor-icons/react';

export const MODES = {
  DUAL: {
    name: 'Side-by-side',
    value: TranslateMode.Enabled,
    description: 'Viser både original og oversatt tekst samtidig.',
    icon: SubtitlesSlash
  },
  KEY_PRESS: {
    name: 'Translate on keypress',
    value: TranslateMode.KeyPress,
    description: 'Oversettelse aktiveres når "T" holdes nede.',
    icon: KeyReturn
  },
  TRANSLATION_ONLY: {
    name: 'Only translation',
    value: TranslateMode.TranslationOnly,
    description: 'Viser kun oversatt tekst.',
    icon: Translate
  },
  DISABLED: {
    name: 'Disabled',
    value: TranslateMode.Disabled,
    description: 'Ingen oversettelse vises.',
    icon: SubtitlesSlash
  }
};
