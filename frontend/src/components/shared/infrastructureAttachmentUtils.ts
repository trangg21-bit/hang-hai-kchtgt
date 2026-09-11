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
