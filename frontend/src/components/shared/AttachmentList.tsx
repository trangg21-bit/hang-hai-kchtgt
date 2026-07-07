import { Upload, Table, Empty, Button, Space, message } from 'antd';
import { DeleteOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile, UploadChangeParam } from 'antd/es/upload/interface';
import { useState } from 'react';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

interface AttachmentListProps {
  attachments?: Attachment[];
  readonly?: boolean;
  hasUploadEndpoint?: boolean;
  onUpload?: (file: File) => Promise<void>;
  onDelete?: (attachmentId: string) => Promise<void>;
  entityId?: string;
}

const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function AttachmentList({
  attachments = [],
  readonly = true,
  hasUploadEndpoint = false,
  onUpload,
  onDelete,
}: AttachmentListProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file: RcFile) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error('Định dạng tệp không được hỗ trợ');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      message.error('Tệp không được vượt quá 10MB');
      return false;
    }
    return true;
  };

  const handleUpload = async (info: UploadChangeParam<UploadFile<unknown>>) => {
    const file = info.file as RcFile;
    if (!file || !onUpload) return;
    if (info.file.status !== 'done') return;

    setUploading(true);
    try {
      await onUpload(file);
      message.success('Tải lên tài liệu thành công');
      setFileList([]);
    } catch (error) {
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

  if (!attachments || attachments.length === 0) {
    if (readonly) {
      return <Empty description="Chưa có tài liệu đính kèm" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }
  }

  const columns: any[] = [
    {
      title: 'Tên tệp',
      dataIndex: 'fileName',
      key: 'fileName',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Attachment) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = record.fileUrl;
              link.download = record.fileName;
              link.click();
            }}
          >
            Tải xuống
          </Button>
          <Button type="link" size="small" icon={<EyeOutlined />}>
            Xem
          </Button>
          {!readonly && (
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              loading={deleting}
            >
              Xóa
            </Button>
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
          onChange={handleUpload}
          fileList={fileList}
          disabled={uploading}
          aria-label="Tải lên tài liệu đính kèm"
          style={{ marginBottom: '20px' }}
        >
          <p className="ant-upload-drag_icon">📁</p>
          <p className="ant-upload-text">Kéo tệp vào đây hoặc nhấp để chọn</p>
          <p className="ant-upload-hint">Hỗ trợ PDF, DOC, DOCX, XLS, XLSX, hình ảnh (tối đa 10MB)</p>
        </Upload.Dragger>
      )}

      {!readonly && !hasUploadEndpoint && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
          Chức năng tải lên chưa được kích hoạt
        </div>
      )}

      {attachments.length > 0 && (
        <Table<Attachment>
          columns={columns}
          dataSource={attachments.map((a) => ({ ...a, key: a.id }))}
          pagination={false}
          size="small"
        />
      )}

      {!readonly && attachments.length === 0 && (
        <Empty description="Chưa có tài liệu đính kèm" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
}
