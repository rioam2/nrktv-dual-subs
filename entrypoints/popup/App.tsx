import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { LANGUAGES } from './languages';
import { TranslateMode } from '@/types/TranslateMode';
import { settings$ } from '@/observables/settings';

function App() {
  const [language, setLanguage] = useState<string>();
  const [mode, setMode] = useState<TranslateMode>();

  useEffect(() => {
    settings$.language.forEach(setLanguage);
  }, [setLanguage]);

  useEffect(() => {
    settings$.mode.forEach(setMode);
  }, [setMode]);

  const handleLanguageChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    storage.setItem<string>('sync:settings-language', e.target.value);
  }, []);

  const handleModeChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    storage.setItem<string>('sync:settings-mode', e.target.value);
  }, []);

  return (
    <>
      <div>
        <label htmlFor="settings-tl">Translated language</label>
        <select id="settings-tl" onChange={handleLanguageChange}>
          {LANGUAGES.map((lang) => (
            <option value={lang.value} selected={lang.value === language}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="settings-mode">Translated language</label>
        <select id="settings-mode" onChange={handleModeChange}>
          <option selected={mode === TranslateMode.Enabled} value={TranslateMode.Enabled}>
            Always Show
          </option>
          <option selected={mode === TranslateMode.KeyPress} value={TranslateMode.KeyPress}>
            When holding "T"
          </option>
          <option selected={mode === TranslateMode.Disabled} value={TranslateMode.Disabled}>
            Hidden
          </option>
        </select>
      </div>
    </>
  );
}

export default App;
