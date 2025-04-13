import { SUBTITLES_CONTAINER_QUERY_SELECTOR } from '@/constants/selectors';
import { Observable } from 'rxjs';

export const subtitles$ = new Observable<string[]>((subscriber) => {
  const subtitlesObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      Array.from(mutation.addedNodes ?? []).forEach((node) => {
        node instanceof HTMLElement &&
          node.getAttribute('data-translated') !== 'true' &&
          subscriber.next(
            node.innerText
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => !!line)
          );
      });
    });
  });

  const subtitleParentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const subtitlesContainer = Array.from(mutation.addedNodes ?? []).find(
        (node) => node instanceof HTMLElement && node.matches(SUBTITLES_CONTAINER_QUERY_SELECTOR)
      );
      if (subtitlesContainer) {
        subtitlesObserver.observe(subtitlesContainer, {
          childList: true,
          subtree: true,
          attributes: false,
          characterData: false
        });
        subtitleParentObserver.disconnect();
      }
    });
  });

  subtitleParentObserver.observe(document, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });

  return () => {
    subtitlesObserver.disconnect();
    subtitleParentObserver.disconnect();
  };
});
