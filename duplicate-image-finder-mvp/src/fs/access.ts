import type { ImageFile } from '../types';

export interface FileAccessState {
  dirHandle?: FileSystemDirectoryHandle;
  files: ImageFile[];
  mode: 'fs' | 'fallback';
  includeSubfolders?: boolean;
}

export function checkFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && !!(window as any).showDirectoryPicker;
}

export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext === true;
}

export async function openDirectoryPicker(
  includeSubfolders: boolean
): Promise<{ dirHandle?: FileSystemDirectoryHandle; files: ImageFile[]; mode: 'fs' | 'fallback'; includeSubfolders?: boolean; error?: string }> {
  if (!isSecureContext()) {
    return { files: [], mode: 'fallback', includeSubfolders, error: 'insecure-context' };
  }
  if (checkFileSystemAccess()) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });
      return { dirHandle, files: [], mode: 'fs' } as any;
    } catch (e: any) {
      const msg = String(e?.message ?? String(e));
      // Cross-origin subframe restriction
      if (msg.includes('Cross origin') || msg.includes('sub frame')) {
        return { files: [], mode: 'fallback', includeSubfolders, error: 'cross-origin-iframe' };
      }
      if (e?.name === 'AbortError') {
        return { files: [], mode: 'fs', includeSubfolders } as any;
      }
      return { files: [], mode: 'fallback', includeSubfolders, error: msg };
    }
  }
  return { files: [], mode: 'fallback', includeSubfolders, error: 'unsupported' };
}
