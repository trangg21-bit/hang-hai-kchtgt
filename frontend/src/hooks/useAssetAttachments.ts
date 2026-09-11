/**
 * useAssetAttachments
 * ---------------------
 * Custom hook dùng chung cho tất cả màn hình xem chi tiết tài sản KCHT.
 * Thay thế đoạn code ~120 dòng được copy-paste vào từng *DetailContent.tsx.
 *
 * Cách dùng:
 *   const { activeAttachments, handleDownloadDetail } = useAssetAttachments({
 *     record: r,
 *     fetchAttachments: fetchTransmissionAssetAttachments,
 *     downloadAttachment: downloadTransmissionAssetAttachment,
 *     attachmentUrlPrefix: '/v1/asset/transmission-assets',
 *     propAttachments,
 *     onDownloadAttachment,
 *     fallbackLabel: 'hệ thống truyền dẫn',
 *   });
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { triggerBlobDownload, resolveMimeType, type InfrastructureAttachmentItem } from '../components/shared/InfrastructureAttachmentTab';
import api from '../services/api';
import toast from '../components/ToastNotification';

/** Subset của một record tài sản mà hook cần */
export interface AssetAttachmentRecord {
  id: string;
  attachmentName?: string | null;
  updatedByName?: string | null;
  submittedByName?: string | null;
  updatedAt?: string | null;
}

/** Kết quả trả về từ các hàm fetchAttachments */
export interface RawAttachment {
  id: string;
  fileName: string;
  fileSize?: number;
  contentType?: string;
  uploadedByName?: string;
  uploadedAt?: string;
}

export interface UseAssetAttachmentsOptions {
  /** Record tài sản đang xem chi tiết */
  record: AssetAttachmentRecord | undefined | null;
  /** Hàm gọi API lấy danh sách file đính kèm từ server */
  fetchAttachments: (assetId: string) => Promise<RawAttachment[]>;
  /** Hàm gọi API tải file về (blob download) từ server */
  downloadAttachment: (assetId: string, attId: string, fileName: string) => Promise<void>;
  /**
   * Prefix URL để tạo filePath, ví dụ: '/v1/asset/transmission-assets'.
   * filePath sẽ là: `${attachmentUrlPrefix}/${assetId}/attachments/${attId}/download`
   */
  attachmentUrlPrefix: string;
  /** Attachments được truyền từ parent (ưu tiên hơn server) */
  propAttachments?: InfrastructureAttachmentItem[];
  /** Handler download từ parent (ưu tiên cao nhất) */
  onDownloadAttachment?: (id: string, fileName: string) => void | Promise<void>;
  /** Nhãn hiển thị trong fallback text khi không tải được, ví dụ: 'hệ thống truyền dẫn' */
  fallbackLabel?: string;
}

export interface UseAssetAttachmentsResult {
  /** Danh sách cuối cùng để truyền vào <InfrastructureAttachmentTab attachments={...} /> */
  activeAttachments: InfrastructureAttachmentItem[];
  /** Handler truyền vào <InfrastructureAttachmentTab onDownload={...} /> */
  handleDownloadDetail: (id: string, fileName: string) => Promise<void>;
}

export function useAssetAttachments({
  record,
  fetchAttachments,
  downloadAttachment,
  attachmentUrlPrefix,
  propAttachments,
  onDownloadAttachment,
  fallbackLabel = 'tài sản',
}: UseAssetAttachmentsOptions): UseAssetAttachmentsResult {
  const [serverAttachments, setServerAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  useEffect(() => {
    if (!record?.id) {
      setServerAttachments([]);
      return;
    }

    let isMounted = true;

    const fallbackFromName = (): InfrastructureAttachmentItem[] => {
      if (!record.attachmentName) return [];
      return record.attachmentName.split(',').map((name, i) => ({
        id: `detail-att-${i}`,
        fileName: name.trim(),
        fileSize: 1024 * 1024,
        uploadedByName: record.updatedByName || record.submittedByName || 'Cán bộ quản lý',
        uploadedDate: record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString(),
      }));
    };

    fetchAttachments(record.id)
      .then((realAtts) => {
        if (!isMounted) return;
        if (realAtts && realAtts.length > 0) {
          setServerAttachments(
            realAtts.map((att) => ({
              id: att.id,
              fileName: att.fileName,
              fileSize: att.fileSize,
              fileType: att.contentType,
              uploadedByName:
                att.uploadedByName ||
                record.updatedByName ||
                record.submittedByName ||
                'Cán bộ quản lý',
              uploadedDate:
                att.uploadedAt ||
                (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
              filePath: `${attachmentUrlPrefix}/${record.id}/attachments/${att.id}/download`,
            }))
          );
        } else {
          setServerAttachments(fallbackFromName());
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setServerAttachments(fallbackFromName());
      });

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    record?.id,
    record?.attachmentName,
    record?.updatedAt,
    record?.updatedByName,
    record?.submittedByName,
    attachmentUrlPrefix,
  ]);

  const activeAttachments = useMemo<InfrastructureAttachmentItem[]>(() => {
    if (propAttachments && propAttachments.length > 0) return propAttachments;
    return serverAttachments;
  }, [propAttachments, serverAttachments]);

  const handleDownloadDetail = useCallback(
    async (id: string, fileName: string) => {
      // 1. Parent override
      if (onDownloadAttachment) {
        try {
          await onDownloadAttachment(id, fileName);
          return;
        } catch (err) {
          console.error('[useAssetAttachments] onDownloadAttachment error:', err);
        }
      }

      const att = activeAttachments.find((a) => a.id === id);

      // 2. Local File object (mới upload, chưa lưu server)
      if (att?.originFileObj) {
        triggerBlobDownload(att.originFileObj, fileName || att.originFileObj.name);
        toast.success(`Đã tải xuống tệp: ${fileName}`);
        return;
      }

      // 3. Blob/Data URL
      if (att?.url && (att.url.startsWith('blob:') || att.url.startsWith('data:'))) {
        triggerBlobDownload(att.url, fileName || 'tai-lieu');
        toast.success(`Đã tải xuống tệp: ${fileName}`);
        return;
      }

      // 4. Server attachment id (UUID dạng xxx-yyy-zzz nhưng không phải detail-att-*)
      if (record?.id && id && id.includes('-') && !id.startsWith('detail-att')) {
        try {
          await downloadAttachment(record.id, id, fileName);
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.error('[useAssetAttachments] server download error:', err);
        }
      }

      // 5. filePath (proxy qua api axios để đính kèm JWT header)
      if (att?.filePath) {
        try {
          let cleanPath = att.filePath;
          if (cleanPath.startsWith('/api/')) {
            cleanPath = cleanPath.replace(/^\/api/, '');
          } else if (!cleanPath.startsWith('/')) {
            cleanPath = `/${cleanPath}`;
          }
          const res = await api.get(cleanPath, { responseType: 'blob' });
          const serverContentType =
            res.headers && res.headers['content-type']
              ? String(res.headers['content-type'])
              : '';
          const contentType = resolveMimeType(fileName, serverContentType);
          const blob = new Blob([res.data], { type: contentType });
          triggerBlobDownload(blob, fileName || 'tai-lieu');
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.error('[useAssetAttachments] filePath download error:', err);
          toast.error(`Không thể tải xuống tệp "${fileName}".`);
          return;
        }
      }

      // 6. Fallback — tạo dummy file (giữ nguyên extension của file gốc, không bao giờ ép đuôi .txt)
      const fallbackContentType = resolveMimeType(fileName, 'text/plain;charset=utf-8');
      const fallbackBlob = new Blob(
        [
          `Tài liệu đính kèm ${fallbackLabel}: ${fileName}\nThời gian: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`,
        ],
        { type: fallbackContentType }
      );
      triggerBlobDownload(fallbackBlob, fileName);
      toast.success(`Đã tải xuống tệp: ${fileName}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onDownloadAttachment, activeAttachments, record?.id, downloadAttachment, fallbackLabel]
  );

  return { activeAttachments, handleDownloadDetail };
}
