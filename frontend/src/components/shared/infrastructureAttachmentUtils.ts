export const formatAttachmentFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || isNaN(Number(bytes))) return '';
  const num = Number(bytes);
  if (num >= 1024 * 1024) {
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(num / 1024).toFixed(1)} KB`;
};

/**
 * Tải xuống tệp tin qua Blob URL theo chuẩn /asset/berth (PortTerminalAssetList)
 */
export function triggerBlobDownload(blobOrUrl: Blob | string, fileName: string): void {
  const isUrl = typeof blobOrUrl === 'string';
  const url = isUrl ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'tai-lieu';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      document.body.removeChild(link);
      if (!isUrl) {
        URL.revokeObjectURL(url);
      }
    } catch {
      // Link đã được dọn bởi trình duyệt hoặc luồng đóng màn hình.
    }
  }, 3000);
}

/**
 * Helper dự phòng MIME type cho các service cũ (tương thích ngược)
 */
export const resolveMimeType = (_fileName: string, fallbackType?: string): string => {
  return fallbackType || 'application/octet-stream';
};

/**
 * Bổ sung metadata /Title vào tệp PDF thông qua cơ chế Incremental Update (ISO 32000-1).
 * Cơ chế này giữ nguyên 100% nội dung gốc, chỉ thêm một object thông tin /Info mới và cập nhật xref/trailer
 * ở cuối tệp. Trình đọc PDF của trình duyệt (Chrome PDFium, Edge...) sẽ đọc /Title để hiển thị
 * tên tài liệu trên thanh công cụ và đặt tên mặc định khi người dùng tải tệp xuống (thay vì UUID).
 */
export async function withPdfTitle(pdfBlob: Blob, title: string): Promise<Blob> {
  if (!title || !title.trim()) {
    return pdfBlob;
  }

  try {
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // 1. Mã hóa tiêu đề thành chuỗi hex UTF-16BE có BOM FEFF để hỗ trợ tiếng Việt có dấu
    let hex = 'FEFF';
    for (let i = 0; i < title.length; i++) {
      const code = title.charCodeAt(i);
      hex += code.toString(16).padStart(4, '0').toUpperCase();
    }
    const titleHex = `<${hex}>`;

    // 2. Tìm vị trí startxref từ cuối tệp
    const tailSize = Math.min(uint8.length, 8192);
    let tailStr = '';
    for (let i = uint8.length - tailSize; i < uint8.length; i++) {
      tailStr += String.fromCharCode(uint8[i]);
    }

    const startXrefMatch = tailStr.match(/startxref\s+(\d+)\s+%%EOF/);
    if (!startXrefMatch) {
      return pdfBlob;
    }
    const prevStartXref = parseInt(startXrefMatch[1], 10);

    // 3. Tìm /Root và /Size từ trailer hoặc XRef stream dictionary
    let rootMatch = tailStr.match(/\/Root\s+(\d+\s+\d+\s+R)/);
    let sizeMatch = tailStr.match(/\/Size\s+(\d+)/);
    let idMatch = tailStr.match(/\/ID\s*(\[[^\]]*\])/);

    if (!rootMatch || !sizeMatch) {
      let chunkAtOffset = '';
      const maxChunk = Math.min(1024, uint8.length - prevStartXref);
      for (let i = 0; i < maxChunk; i++) {
        chunkAtOffset += String.fromCharCode(uint8[prevStartXref + i]);
      }
      if (!rootMatch) rootMatch = chunkAtOffset.match(/\/Root\s+(\d+\s+\d+\s+R)/);
      if (!sizeMatch) sizeMatch = chunkAtOffset.match(/\/Size\s+(\d+)/);
      if (!idMatch) idMatch = chunkAtOffset.match(/\/ID\s*(\[[^\]]*\])/);
    }

    if (!rootMatch || !sizeMatch) {
      return pdfBlob;
    }

    const rootRef = rootMatch[1];
    const oldSize = parseInt(sizeMatch[1], 10);
    const newObjId = oldSize;
    const newSize = oldSize + 1;

    // 4. Xây dựng nội dung Incremental Update
    const originalLength = uint8.length;
    const lastByte = uint8[originalLength - 1];
    const prefix = lastByte === 10 || lastByte === 13 ? '\n' : '\n\n';

    const objContent = `${newObjId} 0 obj\n<< /Title ${titleHex} >>\nendobj\n`;
    const objOffset = originalLength + prefix.length;

    const xrefOffset = objOffset + objContent.length;
    const offsetPadded = String(objOffset).padStart(10, '0');
    const xrefContent = `xref\n${newObjId} 1\n${offsetPadded} 00000 n \n`;

    const idStr = idMatch ? `\n   /ID ${idMatch[1]}` : '';
    const trailerContent = `trailer\n<< /Root ${rootRef}\n   /Info ${newObjId} 0 R\n   /Size ${newSize}\n   /Prev ${prevStartXref}${idStr}\n>>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    const additionStr = prefix + objContent + xrefContent + trailerContent;
    const additionBytes = new Uint8Array(additionStr.length);
    for (let i = 0; i < additionStr.length; i++) {
      additionBytes[i] = additionStr.charCodeAt(i) & 0xff;
    }

    return new Blob([uint8, additionBytes], { type: 'application/pdf' });
  } catch (err) {
    console.warn('[withPdfTitle] Không thể bổ sung tiêu đề PDF:', err);
    return pdfBlob;
  }
}

const PDF_CACHE_NAME = 'kcht-pdf-preview-cache-v1';
let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Đăng ký Service Worker phục vụ xem trước PDF với đúng tên tệp.
 */
export function registerPdfPreviewServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('caches' in window)) {
    return Promise.resolve(null);
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('/pdf-preview-sw.js')
      .then(async (reg) => {
        if (navigator.serviceWorker.controller) {
          return reg;
        }
        await navigator.serviceWorker.ready;
        return reg;
      })
      .catch((err) => {
        console.warn('[PdfPreview] Không thể đăng ký Service Worker:', err);
        return null;
      });
  }
  return swRegistrationPromise;
}

/**
 * Lưu trữ Blob PDF vào Cache API để phục vụ qua đường dẫn HTTP /kcht-pdf-preview/<id>/<fileName>.
 * Khi trình duyệt Chrome PDFium tải từ URL này, nút tải về tích hợp trên viewer (mũi tên tải xuống)
 * sẽ tự động đề xuất đúng fileName (thay vì UUID của Blob URL).
 */
export async function createNamedPdfUrl(pdfBlob: Blob, fileName: string, fileId?: string): Promise<string> {
  const reg = await registerPdfPreviewServiceWorker();
  if (reg && typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(PDF_CACHE_NAME);
      const safeFileName = encodeURIComponent(fileName || 'tai-lieu.pdf');
      const uniquePath = `/kcht-pdf-preview/${fileId || Date.now()}/${safeFileName}`;
      const response = new Response(pdfBlob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename*=UTF-8''${safeFileName}`,
        },
      });
      await cache.put(uniquePath, response);
      return `${window.location.origin}${uniquePath}`;
    } catch (err) {
      console.warn('[PdfPreview] Lỗi khi ghi Cache API, chuyển sang Blob URL:', err);
    }
  }
  // Fallback sang Blob URL nếu Service Worker/Cache API không khả dụng
  return URL.createObjectURL(pdfBlob);
}

/**
 * Dọn dẹp URL xem trước PDF (thu hồi Blob URL hoặc xóa bản ghi trong Cache API)
 */
export async function cleanupNamedPdfUrl(previewUrl?: string | null): Promise<void> {
  if (!previewUrl) return;
  if (previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
    return;
  }
  if (previewUrl.includes('/kcht-pdf-preview/') && typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(PDF_CACHE_NAME);
      const parsedUrl = new URL(previewUrl, window.location.origin);
      await cache.delete(parsedUrl.pathname);
    } catch {
      // Bỏ qua lỗi dọn dẹp cache
    }
  }
}
