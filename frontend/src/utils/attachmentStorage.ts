import { triggerBlobDownload } from '../components/shared/infrastructureAttachmentUtils';
import toast from '../components/ToastNotification';

const DB_NAME = 'kcht_attachment_store';
const STORE_NAME = 'files';
const DB_VERSION = 3;

const memoryStore = new Map<string, File | Blob>();

function openDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveAttachmentFile(key: string, file: File | Blob): Promise<void> {
  if (!key || !file) return;
  const cleanKey = key.trim().toLowerCase();
  memoryStore.set(cleanKey, file);
  memoryStore.set(key.trim(), file);

  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(file, cleanKey);
    store.put(file, key.trim());
  } catch {
    // Ignore IndexedDB write errors
  }
}

async function fetchPublicAttachment(fileName: string): Promise<Blob | null> {
  if (typeof window === 'undefined') return null;
  const rawName = fileName.trim();
  const candidateUrls = [
    `/attachments/${encodeURIComponent(rawName)}`,
    `/attachments/${rawName}`,
    `/attachments/${encodeURIComponent(rawName.toLowerCase())}`,
    `/attachments/${rawName.toLowerCase()}`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok && res.status === 200) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          // Ignore Vite SPA fallback
          continue;
        }
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          return blob;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export async function getAttachmentFile(key: string): Promise<Blob | File | null> {
  if (!key) return null;
  const cleanKey = key.trim().toLowerCase();

  // 1. Try memory store
  if (memoryStore.has(cleanKey)) {
    return memoryStore.get(cleanKey) || null;
  }
  if (memoryStore.has(key.trim())) {
    return memoryStore.get(key.trim()) || null;
  }

  // 2. Try fetching authentic static file from public attachments folder
  const publicBlob = await fetchPublicAttachment(key.trim());
  if (publicBlob) {
    memoryStore.set(cleanKey, publicBlob);
    memoryStore.set(key.trim(), publicBlob);
    void saveAttachmentFile(key.trim(), publicBlob);
    return publicBlob;
  }

  // 3. Try IndexedDB
  const db = await openDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(cleanKey);
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          memoryStore.set(cleanKey, req.result);
          resolve(req.result);
        } else {
          const reqExact = store.get(key.trim());
          reqExact.onsuccess = () => {
            if (reqExact.result instanceof Blob) {
              memoryStore.set(key.trim(), reqExact.result);
              resolve(reqExact.result);
            } else {
              resolve(null);
            }
          };
          reqExact.onerror = () => resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function isImageFileName(fileName?: string): boolean {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'tif', 'tiff'].includes(ext);
}

export function isPdfFileName(fileName?: string): boolean {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ext === 'pdf';
}

export async function getOrGenerateAttachmentBlob(
  fileName: string,
  _metadata?: { assetCode?: string; assetName?: string }
): Promise<Blob> {
  const existing = await getAttachmentFile(fileName);
  if (existing) {
    return existing;
  }

  // If file is not yet cached, attempt direct public fetch
  const publicBlob = await fetchPublicAttachment(fileName);
  if (publicBlob) {
    return publicBlob;
  }

  // Fallback minimal blank blob
  if (isImageFileName(fileName)) {
    const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const binary = atob(base64Png);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: 'image/png' });
  }

  return new Blob(['Tệp tin đính kèm chưa có sẵn trên hệ thống.'], { type: 'text/plain;charset=utf-8' });
}

export async function getAttachmentPreviewUrl(
  fileName: string,
  _metadata?: { assetCode?: string; assetName?: string }
): Promise<string> {
  const blob = await getAttachmentFile(fileName);
  if (blob) {
    return URL.createObjectURL(blob);
  }
  return `/attachments/${encodeURIComponent(fileName)}`;
}

export async function downloadAttachmentFile(
  fileName: string,
  _metadata?: { assetCode?: string; assetName?: string }
): Promise<void> {
  const safeName = (fileName || 'tai-lieu').trim();
  try {
    // 1. Kiểm tra tệp tĩnh công khai trước (trực tiếp qua đường dẫn /attachments/)
    const publicUrl = `/attachments/${encodeURIComponent(safeName)}`;
    try {
      const headRes = await fetch(publicUrl, { method: 'HEAD' });
      if (headRes.ok && headRes.status === 200 && !headRes.headers.get('content-type')?.includes('text/html')) {
        await triggerBlobDownload(publicUrl, safeName);
        toast.success(`Đã tải xuống tệp: ${safeName}`);
        return;
      }
    } catch {
      // fallback
    }

    // 2. Tìm trong bộ nhớ cache hoặc IndexedDB
    const blob = await getAttachmentFile(safeName);
    if (blob) {
      await triggerBlobDownload(blob, safeName);
      toast.success(`Đã tải xuống tệp: ${safeName}`);
      return;
    }

    // 3. Tải nội dung tệp tĩnh dưới dạng blob
    const publicBlob = await fetchPublicAttachment(safeName);
    if (publicBlob) {
      await triggerBlobDownload(publicBlob, safeName);
      toast.success(`Đã tải xuống tệp: ${safeName}`);
      return;
    }

    // 4. Fallback trực tiếp bằng đường dẫn tĩnh
    await triggerBlobDownload(publicUrl, safeName);
    toast.success(`Đã tải xuống tệp: ${safeName}`);
  } catch (err) {
    console.error('Lỗi khi tải xuống tệp:', err);
    toast.error(`Không thể tải xuống tệp ${fileName}`);
  }
}
