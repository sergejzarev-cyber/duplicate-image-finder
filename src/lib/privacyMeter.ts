export interface MeterSnapshot {
  supported: boolean;
  started: boolean;
  count: number;
  urls: string[];
}

type Listener = () => void;

/**
 * Счётчик сетевых запросов после старта сканирования.
 * PerformanceObserver(entryType "resource"), blob:/data: игнорируются,
 * учитываются только записи, начавшиеся после вызова start().
 * Это индикатор, а не доказательство: настоящая защита —
 * Content-Security-Policy страницы и открытый код.
 */
class PrivacyMeter {
  readonly supported: boolean;
  private observer: PerformanceObserver | null = null;
  private startTime = 0;
  private urls: string[] = [];
  private startedFlag = false;
  private listeners = new Set<Listener>();
  private snap: MeterSnapshot;

  constructor() {
    let ok = false;
    try {
      const po = PerformanceObserver as unknown as {
        supportedEntryTypes?: unknown;
      };
      ok =
        typeof PerformanceObserver !== "undefined" &&
        Array.isArray(po.supportedEntryTypes) &&
        (po.supportedEntryTypes as string[]).includes("resource");
    } catch {
      ok = false;
    }
    this.supported = ok;
    this.snap = { supported: ok, started: false, count: 0, urls: [] };
  }

  /** Вызывать при старте сканирования (выбор папки / демо / повтор). */
  start(): void {
    this.urls = [];
    this.startedFlag = true;
    try {
      this.startTime = performance.now();
    } catch {
      this.startTime = 0;
    }
    this.disconnect();
    if (this.supported) {
      try {
        this.observer = new PerformanceObserver((list) => {
          let changed = false;
          for (const entry of list.getEntries()) {
            const r = entry as PerformanceResourceTiming;
            if (typeof r.startTime === "number" && r.startTime < this.startTime) continue;
            const url = r.name || "";
            if (!url || url.startsWith("blob:") || url.startsWith("data:")) continue;
            this.urls.push(url);
            changed = true;
          }
          if (changed) this.emit();
        });
        this.observer.observe({ type: "resource" });
      } catch {
        this.observer = null;
      }
    }
    this.emit();
  }

  getSnapshot = (): MeterSnapshot => this.snap;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  private emit(): void {
    this.snap = {
      supported: this.supported,
      started: this.startedFlag,
      count: this.urls.length,
      urls: [...this.urls],
    };
    for (const fn of this.listeners) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
  }

  private disconnect(): void {
    try {
      this.observer?.disconnect();
    } catch {
      /* ignore */
    }
    this.observer = null;
  }
}

export const privacyMeter = new PrivacyMeter();
