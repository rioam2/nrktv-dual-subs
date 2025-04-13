import { SETTINGS_MODAL_QUERY_SELECTOR } from '@/constants/selectors';
import { distinctUntilChanged, Observable } from 'rxjs';

export const settingsModalState$ = new Observable<boolean>((subscriber) => {
  const observer = new MutationObserver(() => {
    const modal = document.querySelector(SETTINGS_MODAL_QUERY_SELECTOR);
    const isVisible = !!modal;
    subscriber.next(isVisible);
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });

  return () => observer.disconnect();
}).pipe(distinctUntilChanged());
