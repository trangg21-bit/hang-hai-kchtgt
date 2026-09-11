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


