export type Lang = "ru" | "de" | "en";
export type Engine = "fs" | "fallback";
export type KeepRule = "resolution" | "oldest" | "newest" | "shortest";
export type DeleteMode = "move" | "permanent";
export type GroupKind = "exact" | "similar";
export type Phase =
  | "idle"
  | "scanning"
  | "hashing"
  | "dhashing"
  | "measuring"
  | "grouping"
  | "results"
  | "deleting"
  | "report";

export interface ImageFile {
  id: string;
  name: string;
  /** относительный путь от выбранной папки */
  path: string;
  ext: string;
  size: number;
  lastModified: number;
  /** engine "fs": хендлы для удаления/перемещения (данные не читаются при скане) */
  handle?: FileSystemFileHandle;
  parentHandle?: FileSystemDirectoryHandle;
  /** snapshot-ссылка на файл (метаданные + чтение по требованию в воркере) */
  blob: File;
  /**
   * HEIC: браузер не декодирует исходник, поэтому держим сконвертированную
   * копию (JPEG) для dHash и превью. Оригинал в blob не трогаем —
   * точный поиск (SHA-256) идёт по нему.
   */
  decodedBlob?: Blob;
  sha256?: string;
  dhashHi?: number;
  dhashLo?: number;
  width?: number;
  height?: number;
  /** повреждён/не читается как изображение — из удаления исключается */
  broken?: boolean;
}

export interface DuplicateGroup {
  id: string;
  kind: GroupKind;
  files: ImageFile[];
  /** для точных групп: размер каждого файла; для похожих: -1 */
  bytesEach: number;
  hash?: string;
  /** макс. расстояние Хэмминга внутри группы похожих */
  maxDist?: number;
  /**
   * Similar v2: дистанция Хэмминга каждого файла до эталона группы
   * (файл №0 после сортировки). Длина = files.length, rep = 0.
   * Нужно для бейджей «98%» и сортировки по схожести.
   */
  dists?: number[];
}

export interface ScanError {
  path: string;
  reason: string;
}

export interface DeleteReport {
  mode: DeleteMode;
  moved: number;
  deleted: number;
  freed: number;
  errors: ScanError[];
}

/** кандидат на удаление: файл + группа, из которой он выбран */
export interface DeletionCandidate {
  file: ImageFile;
  groupId: string;
  kind: GroupKind;
}
