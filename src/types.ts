export interface ImageFile {
  id: string;
  handle: FileSystemFileHandle | null;
  file: File | null;
  path: string;
  name: string;
  relativePath: string;
  size: number;
  lastModified: number;
  width?: number;
  height?: number;
  sha256?: string;
  dhash?: string;
  broken?: boolean;
  error?: string;
}

export interface DuplicateGroup {
  id: string;
  type: 'exact' | 'similar';
  hash: string;
  files: ImageFile[];
  recommendation?: ImageFile;
  maxDistance?: number;
}

export type SelectionRule = 'largest-resolution' | 'oldest' | 'newest' | 'shortest-name';
export type DeletionMode = 'delete' | 'move-to-subfolder';

export interface ScanProgress {
  phase: 'collect' | 'hash' | 'phash' | 'done';
  processed: number;
  total: number;
  currentFile?: string;
  message?: string;
}

export interface RemoveReport {
  removedCount: number;
  freedBytes: number;
  errors: string[];
  removedFiles: string[];
}

export interface ScanDiagnostics {
  totalFiles: number;
  sizeCollisionGroups: number;
  filesHashed: number;
  exactGroups: number;
  similarGroups: number;
  uniqueSizes: number;
}
