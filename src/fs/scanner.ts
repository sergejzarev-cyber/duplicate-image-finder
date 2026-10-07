import type { ImageFile } from '../types';

export const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.avif',
]);

export function isImageFile(name: string): boolean {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return false;
  return IMAGE_EXTENSIONS.has(name.slice(dot).toLowerCase());
}

function makeId(relativePath: string, size: number, lastModified: number): string {
  return `${relativePath}::${size}::${lastModified}`;
}

export async function collectFiles(
  dirHandle: FileSystemDirectoryHandle,
  includeSubfolders: boolean,
  signal?: AbortSignal
): Promise<ImageFile[]> {
  const files: ImageFile[] = [];

  async function traverse(handle: FileSystemDirectoryHandle, relativePath: string) {
    if (signal?.aborted) return;

    // File System Access API async iterator
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iter = (handle as any).values?.() as AsyncIterable<FileSystemHandle> | undefined;
    if (!iter) return;

    for await (const entry of iter) {
      if (signal?.aborted) return;

      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        try {
          const file = await fileHandle.getFile();
          if (!isImageFile(file.name)) continue;
          const rel = relativePath ? `${relativePath}/${file.name}` : file.name;
          files.push({
            id: makeId(rel, file.size, file.lastModified),
            handle: fileHandle,
            file,
            path: file.name,
            name: file.name,
            relativePath: rel,
            size: file.size,
            lastModified: file.lastModified,
          });
        } catch {
          // inaccessible file — skip
        }
      } else if (entry.kind === 'directory' && includeSubfolders) {
        const name = entry.name;
        // skip our own trash folder
        if (name === '_duplicates') continue;
        await traverse(
          entry as FileSystemDirectoryHandle,
          relativePath ? `${relativePath}/${name}` : name
        );
      }
    }
  }

  await traverse(dirHandle, '');
  return files;
}

export function filesFromFileList(list: File[]): ImageFile[] {
  return list.filter((f) => isImageFile(f.name)).map((f) => {
    const rel = ((f as unknown as { webkitRelativePath?: string }).webkitRelativePath) || f.name;
    return {
      id: makeId(rel, f.size, f.lastModified),
      handle: null,
      file: f,
      path: f.name,
      name: f.name,
      relativePath: rel,
      size: f.size,
      lastModified: f.lastModified,
    };
  });
}
