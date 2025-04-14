import { TranslateMode } from '@/types/TranslateMode';
import { KeyReturn, SquareSplitHorizontal, SubtitlesSlash, Translate } from '@phosphor-icons/react';

export const MODES = {
  DUAL: {
    name: 'Side-by-side',
    value: TranslateMode.Enabled,
    description: 'Show both the original and translated subtitles next to each other.',
    icon: SquareSplitHorizontal
  },
  KEY_PRESS: {
    name: 'Translate on keypress',
    value: TranslateMode.KeyPress,
    description: 'Translate subtitles when the specified key is pressed.',
    icon: KeyReturn
  },
  TRANSLATION_ONLY: {
    name: 'Only translation',
    value: TranslateMode.TranslationOnly,
    description: 'Show only the translated subtitles.',
    icon: Translate
  },
  DISABLED: {
    name: 'Disabled',
    value: TranslateMode.Disabled,
    description: 'Translated subtitles are not shown.',
    icon: SubtitlesSlash
  }
};
