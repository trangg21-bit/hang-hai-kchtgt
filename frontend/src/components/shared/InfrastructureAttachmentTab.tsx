import React, { useState } from 'react';
import { Upload, Button, Modal } from 'antd';
import {
  InboxOutlined,
  FileOutlined,
  FileImageOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../ToastNotification';
import DetailTable from './DetailTable';
import {
  actionPrimary,
  textPrimary,
  textTertiary,
  borderDefault,
  radiusMd,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';

export interface InfrastructureAttachmentItem {
  id: string;
  fileName: string;
  fileSize?: number;
  size?: number;
  fileType?: string;
  uploadedByName?: string;
  uploadedBy?: string;
  uploadedDate?: string;
  uploadedAt?: string;
  createdAt?: string;
  filePath?: string;
  file?: File;
  originFileObj?: File;
  url?: string;
  [key: string]: any;
}

export interface InfrastructureAttachmentTabProps {
  /** Danh sách tệp đính kèm */
  attachments: InfrastructureAttachmentItem[];
  /** Chế độ xem chi tiết (chỉ đọc, ẩn khung Upload.Dragger, chỉ hiện nút Tải xuống / Xem chi tiết) */
  readonly?: boolean;
  /** Bảng tra cứu tên người dùng theo UUID */
  userMap?: Map<string, string>;
  /** Callback khi người dùng chọn/kéo thả tải lên tệp mới */
  onUpload?: (file: File) => void | boolean | Promise<any>;
  /** Callback khi người dùng xóa tệp */
  onDelete?: (attachmentId: string) => void | Promise<any>;
  /** Callback khi người dùng nhấn tải xuống tệp */
  onDownload?: (attachmentId: string, fileName: string) => void | Promise<any>;
  /** Callback xem trước tùy biến */
  onPreview?: (attachment: InfrastructureAttachmentItem) => void;
  /** Trạng thái đang tải danh sách tệp (lazy load) */
  isLoading?: boolean;
  /** Tùy chọn chiều cao cuộn bảng scrollY (mặc định tự động theo readonly) */
  scrollY?: string | number;
  /** Cho phép tải nhiều tệp cùng lúc (mặc định: true) */
  multiple?: boolean;
  /** Dung lượng tối đa mỗi file tính theo MB (mặc định: 20) */
  maxSizeMB?: number;
  /** Các định dạng chấp nhận (mặc định: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif') */
  accept?: string;
  /** Nội dung thông báo khi bảng rỗng */
  emptyText?: string;
}

const DEFAULT_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif';
const DEFAULT_ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];

/**
 * Kiểm tra xem tệp có phải là định dạng hình ảnh hay không
 */
export const isImageFile = (fileName?: string, fileType?: string): boolean => {
  if (fileType?.startsWith('image/')) return true;
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff'].includes(ext || '');
};

/**
 * Hàm kiểm tra định dạng và dung lượng tệp đính kèm theo chuẩn hệ thống KCHTGT
 */
export const validateAttachmentFile = (
  file: File,
  options?: { maxSizeMB?: number; acceptExtensions?: string[] }
): boolean => {
  const maxBytes = (options?.maxSizeMB || 20) * 1024 * 1024;
  if (file.size > maxBytes) {
    toast.error(`File vượt quá ${options?.maxSizeMB || 20}MB`);
    return false;
  }
  const allowed = options?.acceptExtensions || DEFAULT_ALLOWED_EXTS;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !allowed.includes(ext)) {
    toast.error(`Định dạng không hỗ trợ (chỉ chấp nhận ${allowed.map((e) => e.toUpperCase()).join(', ')})`);
    return false;
  }
  return true;
};

/**
 * Định dạng dung lượng tệp chuẩn (KB / MB)
 */
export const formatAttachmentFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || isNaN(Number(bytes))) return '—';
  const num = Number(bytes);
  if (num >= 1024 * 1024) {
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(num / 1024).toFixed(1)} KB`;
};

/**
 * Component dùng chung cho Tab "File đính kèm" trên tất cả các Drawer Thêm mới, Sửa và Xem chi tiết.
 * Quy chuẩn:
 * - Ảnh (.png, .jpg, .jpeg, .webp, ...): Được xem chi tiết (EyeOutlined mở modal) + Tải xuống.
 * - File khác (.pdf, .doc, .xls, ...): Chỉ tải xuống (DownloadOutlined).
 */
export default function InfrastructureAttachmentTab({
  attachments = [],
  readonly = false,
  userMap,
  onUpload,
  onDelete,
  onDownload,
  onPreview,
  isLoading = false,
  scrollY,
  multiple = true,
  maxSizeMB = 20,
  accept = DEFAULT_ACCEPT,
  emptyText,
}: InfrastructureAttachmentTabProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<InfrastructureAttachmentItem | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  const handleBeforeUpload = (file: File) => {
    if (!validateAttachmentFile(file, { maxSizeMB })) {
      return false;
    }
    onUpload?.(file);
    return false;
  };

  const handlePreview = (record: InfrastructureAttachmentItem) => {
    if (onPreview) {
      onPreview(record);
      return;
    }
    const rawFile = record.originFileObj || record.file;
    if (rawFile) {
      const blobUrl = URL.createObjectURL(rawFile);
      setPreviewImageUrl(blobUrl);
    } else if (record.url) {
      setPreviewImageUrl(record.url);
    } else if (record.filePath) {
      setPreviewImageUrl(record.filePath);
    } else {
      setPreviewImageUrl('');
    }
    setPreviewRecord(record);
    setPreviewVisible(true);
  };

  const effectiveScrollY = scrollY || (readonly ? DRAWER_TABLE_SCROLL_Y.detailView : DRAWER_TABLE_SCROLL_Y.withDragger);

  const columns = [
    {
      title: 'STT',
      width: 60,
      align: 'center' as const,
    },
    {
      title: 'Tên tài liệu',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (name: string, record: InfrastructureAttachmentItem) => {
        const isImg = isImageFile(name, record.fileType);

        if (readonly) {
          return (
            <span
              style={{
                color: actionPrimary,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
              onClick={() => {
                if (isImg) {
                  handlePreview(record);
                } else {
                  onDownload?.(record.id, name);
                }
              }}
              title={isImg ? `${name} (Nhấp để xem chi tiết ảnh)` : `${name} (Nhấp để tải xuống)`}
            >
              {isImg ? (
                <FileImageOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
              ) : (
                <FileOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </span>
            </span>
          );
        }

        return (
          <div
            style={{
              fontSize: fontSizeMd,
              color: textPrimary,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: fontWeightMedium,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: isImg ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (isImg) handlePreview(record);
            }}
            title={isImg ? `${name} (Nhấp để xem chi tiết ảnh)` : name}
          >
            {isImg ? (
              <FileImageOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
            ) : (
              <FileOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Dung lượng',
      dataIndex: 'fileSize',
      width: 120,
      align: 'right' as const,
      render: (v: number | undefined, record: InfrastructureAttachmentItem) => {
        const size = v ?? record.fileSize ?? record.size ?? record.originFileObj?.size ?? record.file?.size;
        return formatAttachmentFileSize(size);
      },
    },
    {
      title: 'Người tải lên',
      dataIndex: 'uploadedByName',
      width: 180,
      render: (v: string | undefined, record: InfrastructureAttachmentItem) => {
        const raw = v || record.uploadedByName || record.uploadedBy || record.uploaderName || record.createdByName || record.createdBy;
        const resolved = (raw && userMap?.get(raw)) ? userMap.get(raw) : raw;
        const isUuid = resolved && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolved);
        const displayName = isUuid ? 'Cán bộ quản lý' : (resolved || '—');
        return (
          <span
            style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={displayName}
          >
            {displayName}
          </span>
        );
      },
    },
    {
      title: 'Ngày tải lên',
      dataIndex: 'uploadedDate',
      width: 160,
      align: 'center' as const,
      render: (v: string | undefined, record: InfrastructureAttachmentItem) => {
        const dateVal = v || record.uploadedDate || record.uploadedAt || record.createdAt || record.createdDate;
        return dateVal ? dayjs(dateVal).format('DD/MM/YYYY HH:mm') : '—';
      },
    },
    {
      title: 'Thao tác',
      width: readonly ? 90 : 120,
      align: 'center' as const,
      render: (_: unknown, record: InfrastructureAttachmentItem) => {
        const isImg = isImageFile(record.fileName, record.fileType);

        if (readonly) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {isImg ? (
                <Button
                  type="text"
                  icon={<EyeOutlined style={{ fontSize: 16, color: actionPrimary }} />}
                  style={{
                    width: 32,
                    height: 32,
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => handlePreview(record)}
                  title="Xem chi tiết ảnh"
                />
              ) : (
                <span style={{ width: 32, height: 32, display: 'inline-block' }} />
              )}
              <Button
                type="text"
                icon={<DownloadOutlined style={{ fontSize: 16, color: actionPrimary }} />}
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => onDownload?.(record.id, record.fileName)}
                title="Tải xuống tệp đính kèm"
              />
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {isImg ? (
              <Button
                type="text"
                icon={<EyeOutlined style={{ fontSize: 16, color: actionPrimary }} />}
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => handlePreview(record)}
                title="Xem chi tiết ảnh"
              />
            ) : (
              <span style={{ width: 32, height: 32, display: 'inline-block' }} />
            )}
            <Button
              type="text"
              icon={<DownloadOutlined style={{ fontSize: 16, color: actionPrimary }} />}
              style={{
                width: 32,
                height: 32,
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => onDownload?.(record.id, record.fileName)}
              title="Tải xuống tệp đính kèm"
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined style={{ fontSize: 16 }} />}
              style={{
                width: 32,
                height: 32,
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => onDelete?.(record.id)}
              title="Xóa tệp đính kèm"
            />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {!readonly && (
        <div style={{ marginBottom: 10, height: 104, boxSizing: 'border-box' }}>
          <Upload.Dragger
            beforeUpload={handleBeforeUpload}
            showUploadList={false}
            accept={accept}
            multiple={multiple}
            style={{
              background: '#fafbfc',
              border: `1px dashed ${borderDefault}`,
              borderRadius: radiusMd,
              padding: '12px 16px',
              height: 104,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <p style={{ marginBottom: 2 }}>
              <InboxOutlined style={{ fontSize: 28, color: actionPrimary }} />
            </p>
            <p
              style={{
                fontSize: fontSizeMd,
                fontWeight: fontWeightBold,
                color: textPrimary,
                marginBottom: 2,
              }}
            >
              Kéo thả tệp vào đây hoặc nhấp để chọn tệp tải lên
            </p>
            <p style={{ fontSize: fontSizeSm, color: textTertiary, margin: 0 }}>
              Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤ {maxSizeMB}MB.
            </p>
          </Upload.Dragger>
        </div>
      )}

      <DetailTable
        scrollY={effectiveScrollY}
        dataSource={attachments}
        emptyText={isLoading ? 'Đang tải tài liệu đính kèm...' : (emptyText || 'Chưa có tài liệu đính kèm')}
        rowKey={(r: any) => r.id || r.fileName}
        columns={columns}
      />

      {/* Modal xem chi tiết ảnh */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileImageOutlined style={{ color: actionPrimary, fontSize: 18 }} />
            <span style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd + 1 }}>
              {previewRecord?.fileName || 'Xem chi tiết hình ảnh'}
            </span>
            {previewRecord?.fileSize ? (
              <span style={{ fontSize: fontSizeSm, color: textTertiary, fontWeight: 'normal' }}>
                ({formatAttachmentFileSize(previewRecord.fileSize)})
              </span>
            ) : null}
          </div>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          ...(onDownload && previewRecord ? [
            <Button
              key="download"
              icon={<DownloadOutlined />}
              onClick={() => onDownload(previewRecord.id, previewRecord.fileName)}
              style={{ borderRadius: 999 }}
            >
              Tải xuống
            </Button>,
          ] : []),
          <Button key="close" type="primary" onClick={() => setPreviewVisible(false)} style={{ borderRadius: 999, background: actionPrimary, borderColor: actionPrimary }}>
            Đóng
          </Button>,
        ]}
        width="min(800px, 90vw)"
        centered
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '16px 0', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: radiusMd }}>
          {previewImageUrl ? (
            <img
              src={previewImageUrl}
              alt={previewRecord?.fileName || 'Ảnh đính kèm'}
              style={{
                maxWidth: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
          ) : (
            <div style={{ color: textTertiary }}>Đang tải hình ảnh hoặc không có sẵn bản xem trước</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
