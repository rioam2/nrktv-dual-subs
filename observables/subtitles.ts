import { SUBTITLE_WRAPPER_QUERY_SELECTOR } from '@/constants/selectors';
import { distinctUntilChanged, map, Observable } from 'rxjs';

export const subtitles$ = new Observable<string>((subscriber) => {
  const subtitlesObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // Ensure that the added node is a subtitle and has not already been translated
        const element = node instanceof HTMLElement ? node : node.parentElement?.parentElement;
        if (!element) return;
        // Check if element matches the subtitle wrapper
        if (!element.matches(SUBTITLE_WRAPPER_QUERY_SELECTOR)) return;
        if (element.matches('[data-translated]')) return;
        subscriber.next(element.innerText);
      });
    });
  });

  subtitlesObserver.observe(document, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });

  return () => subtitlesObserver.disconnect();
})
  // Don't fire duplicate subtitle events
  .pipe(distinctUntilChanged())
  // Transform the subtitle into trimmed lines
  .pipe(
    map((text) =>
      text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => !!line)
    )
  );
