import ImageWorker from "./hash.worker.ts?worker&inline";
import type { WorkerIn, WorkerOut } from "./hash.worker";

type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** сообщение без id (id присваивает пул) */
export type PoolMsg = DistOmit<WorkerIn, "id">;

interface Task {
  msg: WorkerIn;
  resolve: (m: WorkerOut) => void;
  reject: (e: unknown) => void;
  onInterim?: (m: WorkerOut) => void;
}

/**
 * Пул воркеров: по одной задаче в полёте на воркер, остальные в очереди.
 * Блобы передаются по ссылке (structured clone), содержимое не копируется.
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private freeIdx: number[] = [];
  private queue: Task[] = [];
  private inflight = new Map<number, Task>();
  private seq = 1;
  private dead = false;

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      // ?worker&inline: код воркера встроен в бандл и создаётся из Blob —
      // сборка остаётся одним самодостаточным index.html
      const w = new ImageWorker();
      const idx = i;
      w.onmessage = (ev: MessageEvent<WorkerOut>) => {
        const holder = this.inflight.get(idx);
        if (!holder) return;
        const m = ev.data;
        if (m.kind.endsWith("-progress")) {
          holder.onInterim?.(m);
          return;
        }
        this.inflight.delete(idx);
        holder.resolve(m);
        this.freeIdx.push(idx);
        this.pump();
      };
      w.onerror = (e) => {
        const holder = this.inflight.get(idx);
        this.inflight.delete(idx);
        holder?.reject(new Error(e.message || "worker error"));
        this.freeIdx.push(idx);
        this.pump();
      };
      this.workers.push(w);
      this.freeIdx.push(i);
    }
  }

  private pump() {
    while (!this.dead && this.freeIdx.length > 0 && this.queue.length > 0) {
      const idx = this.freeIdx.pop()!;
      const task = this.queue.shift()!;
      this.inflight.set(idx, task);
      this.workers[idx].postMessage(task.msg);
    }
  }

  run(msg: PoolMsg, onInterim?: (m: WorkerOut) => void): Promise<WorkerOut> {
    if (this.dead) return Promise.reject(new DOMException("Aborted", "AbortError"));
    return new Promise((resolve, reject) => {
      const full = { ...msg, id: this.seq++ } as WorkerIn;
      this.queue.push({ msg: full, resolve, reject, onInterim });
      this.pump();
    });
  }

  terminate() {
    this.dead = true;
    for (const w of this.workers) w.terminate();
    const err = new DOMException("Aborted", "AbortError");
    for (const t of this.queue.splice(0)) t.reject(err);
    for (const t of this.inflight.values()) t.reject(err);
    this.inflight.clear();
    this.queue = [];
    this.freeIdx = [];
  }
}
