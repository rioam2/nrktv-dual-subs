import { LANGUAGES } from '@/constants/languages';
import { MODES } from '@/constants/modes';
import { SYNC_KEY_SETTINGS_ACTIVATION_KEY, SYNC_KEY_SETTINGS_LANGUAGE, SYNC_KEY_SETTINGS_MODE } from '@/constants/sync';
import { settings$ } from '@/observables/settings';
import { TranslateMode } from '@/types/TranslateMode';
import { Heart } from '@phosphor-icons/react';
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { Link } from './components/Link';
import { Select } from './components/Select';
import { Tab } from './components/Tab';
import { TabList } from './components/TabList';

export const Settings: React.FC = () => {
  // State variables to hold the current settings
  const [currentLanguage, setCurrentLanguage] = useState<string>();
  const [currentMode, setCurrentMode] = useState<TranslateMode>();
  const [currentActivationKey, setCurrentActivationKey] = useState<string>();

  // Bind the settings to the state
  useEffect(() => void settings$.language.forEach(setCurrentLanguage), []);
  useEffect(() => void settings$.mode.forEach(setCurrentMode), []);
  useEffect(() => void settings$.activationKey.forEach(setCurrentActivationKey), []);

  const handleLanguageChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    storage.setItem<string>(SYNC_KEY_SETTINGS_LANGUAGE, e.target.value);
  }, []);

  const handleActivationKeyChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    storage.setItem<string>(SYNC_KEY_SETTINGS_ACTIVATION_KEY, e.target.value.toLowerCase() || '');
  }, []);

  const handleModeChange = useCallback(
    (mode: TranslateMode) => () => {
      storage.setItem<string>(SYNC_KEY_SETTINGS_MODE, mode);
    },
    []
  );

  return (
    <form
      method="dialog"
      onSubmit={(e) => e.preventDefault()}
      className="display-flex position-relative flex-direction-column"
    >
      <div className="display-flex padding-x-m">
        <p style={{ marginBottom: '0.5em' }}>
          Translated subtitles by{'  '}
          <Link href="https://github.com/rioam2/nrktv-dual-subs">
            nrktv-dual-subs
            <Heart size={16} weight="light" />
          </Link>
        </p>
      </div>
      <TabList>
        {Object.values(MODES).map((mode) => (
          <Tab
            key={mode.value}
            title={mode.description}
            aria-label={mode.description}
            data-selected={mode.value === currentMode}
            aria-selected={mode.value === currentMode}
            onClick={handleModeChange(mode.value)}
          >
            <mode.icon size={24} />
            {mode.name}
          </Tab>
        ))}
      </TabList>
      {currentMode === TranslateMode.KeyPress && (
        <div className="padding-x-m">
          <Select value={currentActivationKey} onChange={handleActivationKeyChange}>
            {Array.from({ length: 26 }).map((_, idx) => {
              const charCode = 65 + idx;
              const char = String.fromCharCode(charCode).toLowerCase();
              return (
                <option key={char} value={char}>
                  {char}
                </option>
              );
            })}
          </Select>
        </div>
      )}
      {currentMode !== TranslateMode.Disabled && (
        <div className="padding-x-m">
          <Select value={currentLanguage} onChange={handleLanguageChange}>
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.name}
              </option>
            ))}
          </Select>
        </div>
      )}
    </form>
  );
};
