import { TranslateMode } from '@/types/TranslateMode';
import { Observable } from 'rxjs';
import { StorageItemKey } from 'wxt/storage';

const createSettingsObservable = <T extends unknown>(key: StorageItemKey, defaultValue: T): Observable<T> => {
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
  language: createSettingsObservable('sync:settings-language', 'en'),
  mode: createSettingsObservable('sync:settings-mode', TranslateMode.Enabled)
};
