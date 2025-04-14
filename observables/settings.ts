import { TranslateMode } from '@/types/TranslateMode';
import { Observable } from 'rxjs';
import { StorageItemKey } from '@wxt-dev/storage';
import { SYNC_KEY_SETTINGS_ACTIVATION_KEY, SYNC_KEY_SETTINGS_LANGUAGE, SYNC_KEY_SETTINGS_MODE } from '@/constants/sync';

const createSettingsObservable = <T>(key: StorageItemKey, defaultValue: T): Observable<T> => {
  return new Observable<T>((subscriber) => {
    (async () => {
      const currentValue = (await storage.getItem<T>(key)) ?? defaultValue;
      subscriber.next(currentValue);
    })();
    return storage.watch<T>(key, (newValue) => {
      if (newValue) {
        subscriber.next(newValue);
      }
    });
  });
};

export const settings$ = {
  language: createSettingsObservable(SYNC_KEY_SETTINGS_LANGUAGE, 'en'),
  mode: createSettingsObservable(SYNC_KEY_SETTINGS_MODE, TranslateMode.Enabled),
  activationKey: createSettingsObservable(SYNC_KEY_SETTINGS_ACTIVATION_KEY, 't')
};
