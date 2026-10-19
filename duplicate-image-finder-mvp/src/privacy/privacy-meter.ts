/**
 * Counts network resource requests after scan start (PerformanceObserver).
 * Ignores blob: and data: URLs. Indicator only — real guarantee is CSP + open source.
 */

export type PrivacyMeterSnapshot = {
  supported: boolean;
  count: number;
  urls: string[];
};

type Listener = (snap: PrivacyMeterSnapshot) => void;

function isIgnoredUrl(url: string): boolean {
  return (
    url.startsWith('blob:') ||
    url.startsWith('data:') ||
    url.startsWith('about:') ||
    // same-document navigations / empty
    url === '' ||
    url === location.href
  );
}

export class PrivacyMeter {
  private observer: PerformanceObserver | null = null;
  private urls = new Set<string>();
  private startedAt = 0;
  private listeners = new Set<Listener>();
  private supported =
    typeof PerformanceObserver !== 'undefined' &&
    typeof PerformanceObserver.supportedEntryTypes !== 'undefined' &&
    PerformanceObserver.supportedEntryTypes.includes('resource');

  start() {
    this.urls.clear();
    this.startedAt = performance.now();
    this.stopObserver();

    if (!this.supported) {
      this.emit();
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType !== 'resource') continue;
          // only after start
          if (entry.startTime + (entry as PerformanceResourceTiming).duration < this.startedAt) {
            // still include if the request started after we started observing
          }
          if (entry.startTime < this.startedAt - 1) continue;
          const name = entry.name;
          if (isIgnoredUrl(name)) continue;
          this.urls.add(name);
        }
        this.emit();
      });
      this.observer.observe({ type: 'resource', buffered: false });
    } catch {
      this.supported = false;
    }
    this.emit();
  }

  stop() {
    this.stopObserver();
  }

  getSnapshot(): PrivacyMeterSnapshot {
    return {
      supported: this.supported,
      count: this.urls.size,
      urls: [...this.urls],
    };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.getSnapshot());
    return () => this.listeners.delete(fn);
  }

  private stopObserver() {
    try {
      this.observer?.disconnect();
    } catch {
      /* ignore */
    }
    this.observer = null;
  }

  private emit() {
    const snap = this.getSnapshot();
    for (const fn of this.listeners) fn(snap);
  }
}

export const privacyMeter = new PrivacyMeter();
