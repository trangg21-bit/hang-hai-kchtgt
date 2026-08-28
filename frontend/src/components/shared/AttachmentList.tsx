import { useState } from 'react';
import { Upload, Table, Empty, Button, Space } from 'antd';
import { DeleteOutlined, DownloadOutlined, FileOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import { message } from '../ToastNotification';
import api from '../../services/api';
import { useThemeToken } from '../../context/ThemeTokenContext';

export interface Attachment {
  id: string;
  fileName: string;
  filePath?: string;
}

interface AttachmentListProps {
  attachments?: Attachment[];
  readonly?: boolean;
  hasUploadEndpoint?: boolean;
  onUpload?: (file: File) => Promise<void>;
  onDelete?: (attachmentId: string) => Promise<void>;
  entityId?: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default function AttachmentList({
  attachments = [],
  readonly = true,
  hasUploadEndpoint = false,
  onUpload,
  onDelete,
}: AttachmentListProps) {
  const {
    actionPrimary, textPrimary, textSecondary, textTertiary,
    spaceSm, fontSizeMd, fontWeightMedium,
  } = useThemeToken();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file: RcFile) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error('Định dạng tệp không được hỗ trợ');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      message.error('Tệp không được vượt quá 20MB');
      return false;
    }
    return true;
  };

  const handleUpload = async ({ file, onSuccess, onError }: any) => {
    if (!onUpload) return;
    setUploading(true);
    try {
      await onUpload(file as File);
      onSuccess?.({}, file);
      message.success('Tải lên tài liệu thành công');
      setFileList([]);
    } catch (error) {
      onError?.(error);
      message.error(`Lỗi tải lên: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!onDelete) return;

    setDeleting(true);
    try {
      await onDelete(attachmentId);
      message.success('Xóa tài liệu thành công');
    } catch (error) {
      message.error(`Lỗi xóa: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (record: Attachment) => {
    if (!record.filePath) {
      message.error('Không tìm thấy đường dẫn tệp');
      return;
    }
    setDownloadingId(record.id);
    try {
      const url = record.filePath.startsWith('/api')
        ? record.filePath.replace(/^\/api/, '')
        : record.filePath;

      const resp = await api.get(url, {
        responseType: 'blob',
      });
      const blob = new Blob([resp.data], {
        type: String(resp.headers['content-type'] || 'application/octet-stream'),
      });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = record.fileName || 'tai-lieu';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error('Lỗi tải tệp:', err);
      message.error('Không thể tải xuống tệp đính kèm');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!attachments || attachments.length === 0) {
    if (readonly) {
      return <Empty description="Không có dữ liệu" style={{ margin: '32px 0' }} />;
    }
  }

  const columns: any[] = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>
          {index + 1}
        </span>
      ),
    },
    {
      title: 'Tên file',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string, record: Attachment) => (
        <a
          style={{
            color: actionPrimary,
            cursor: 'pointer',
            fontSize: fontSizeMd,
            fontWeight: fontWeightMedium,
            display: 'inline-flex',
            alignItems: 'center',
            gap: spaceSm,
          }}
          onClick={(e) => {
            e.preventDefault();
            handleDownload(record);
          }}
          title="Nhấn để tải tệp xuống"
        >
          <FileOutlined style={{ color: textTertiary }} />
          <span>{text || '—'}</span>
        </a>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: readonly ? 80 : 120,
      align: 'center' as const,
      render: (_: unknown, record: Attachment) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            loading={downloadingId === record.id}
            onClick={() => handleDownload(record)}
            title="Tải xuống"
          />
          {!readonly && (
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              loading={deleting}
              title="Xóa"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {!readonly && hasUploadEndpoint && (
        <Upload.Dragger
          name="file"
          multiple={false}
          beforeUpload={handleBeforeUpload}
          customRequest={handleUpload}
          fileList={fileList}
          disabled={uploading}
          aria-label="Tải lên tài liệu đính kèm"
          style={{ marginBottom: '20px' }}
        >
          <p className="ant-upload-drag_icon">📁</p>
          <p className="ant-upload-text">Kéo tệp vào đây hoặc nhấp để chọn</p>
          <p className="ant-upload-hint">Hỗ trợ PDF, DOC, DOCX, XLS, XLSX, hình ảnh (tối đa 20MB)</p>
        </Upload.Dragger>
      )}

      {!readonly && !hasUploadEndpoint && (
        <div style={{ padding: '16px', textAlign: 'center', color: textTertiary }}>
          Chức năng tải lên chưa được kích hoạt
        </div>
      )}

      {attachments.length > 0 && (
        <Table<Attachment>
          className="list-view-table"
          columns={columns}
          dataSource={attachments.map((a) => ({ ...a, key: a.id }))}
          pagination={false}
          size="middle"
          bordered
          scroll={{ x: 400 }}
        />
      )}

      {!readonly && attachments.length === 0 && (
        <Empty description="Chưa có tài liệu đính kèm" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
}
