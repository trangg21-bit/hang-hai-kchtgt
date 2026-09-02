import React from 'react';
import { Upload, Button } from 'antd';
import {
  InboxOutlined,
  FileOutlined,
  DownloadOutlined,
  DeleteOutlined,
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
  fileType?: string;
  uploadedByName?: string;
  uploadedBy?: string;
  uploadedDate?: string;
  createdAt?: string;
  filePath?: string;
  file?: File;
  [key: string]: any;
}

export interface InfrastructureAttachmentTabProps {
  /** Danh sách tệp đính kèm */
  attachments: InfrastructureAttachmentItem[];
  /** Chế độ xem chi tiết (chỉ đọc, ẩn khung Upload.Dragger, chỉ hiện nút Tải xuống) */
  readonly?: boolean;
  /** Callback khi người dùng chọn/kéo thả tải lên tệp mới */
  onUpload?: (file: File) => void | boolean | Promise<any>;
  /** Callback khi người dùng xóa tệp */
  onDelete?: (attachmentId: string) => void | Promise<any>;
  /** Callback khi người dùng nhấn tải xuống tệp */
  onDownload?: (attachmentId: string, fileName: string) => void | Promise<any>;
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
 * Component dùng chung cho Tab "File đính kèm" trên tất cả các Drawer Thêm mới, Sửa và Xem chi tiết
 */
export default function InfrastructureAttachmentTab({
  attachments = [],
  readonly = false,
  onUpload,
  onDelete,
  onDownload,
  isLoading = false,
  scrollY,
  multiple = true,
  maxSizeMB = 20,
  accept = DEFAULT_ACCEPT,
  emptyText,
}: InfrastructureAttachmentTabProps) {
  const handleBeforeUpload = (file: File) => {
    if (!validateAttachmentFile(file, { maxSizeMB })) {
      return false;
    }
    onUpload?.(file);
    return false;
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
        if (readonly) {
          return (
            <span
              style={{
                color: actionPrimary,
                cursor: onDownload ? 'pointer' : 'default',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onClick={() => onDownload?.(record.id, name)}
              title={name}
            >
              {name}
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
            }}
            title={name}
          >
            <FileOutlined style={{ color: actionPrimary }} />
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
      render: (v: number | undefined) => formatAttachmentFileSize(v),
    },
    {
      title: 'Người tải lên',
      dataIndex: 'uploadedByName',
      width: 180,
      render: (v: string | undefined, record: InfrastructureAttachmentItem) => {
        const raw = v || record.uploadedByName || record.uploadedBy;
        const isUuid = raw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
        const displayName = isUuid ? 'Cán bộ quản lý' : (raw || '—');
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
        const dateVal = v || record.createdAt;
        return dateVal ? dayjs(dateVal).format('DD/MM/YYYY HH:mm') : '—';
      },
    },
    {
      title: 'Thao tác',
      width: readonly ? 70 : 80,
      align: 'center' as const,
      render: (_: unknown, record: InfrastructureAttachmentItem) => {
        if (readonly) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    </div>
  );
}
