import { useState, useCallback } from 'react';
import { Table, Upload, Button, Space, Typography, Popconfirm } from 'antd';
import type { ColumnsType, UploadFile, UploadChangeParam } from 'antd/es/upload/interface';
import { PlusOutlined, DeleteOutlined, FileImageOutlined, FilePdfOutlined, FileOutlined } from '@ant-design/icons';
import {
  fontSizeMd,
  fontWeightBold,
  colors,
  spaceMd,
  spaceFormField,
  spaceSm,
  radiusPill,
  actionPrimary,
  borderDefault,
} from '../tokens';
import toast from '../components/ToastNotification';
import api from '../services/api';

const { Text } = Typography;
const { Dragger } = Upload;

export interface AttachmentFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  url?: string;
}

export interface UploadFileTableProps {
  refId?: string;
  refType?: string;
  disabled?: boolean;
  maxFiles?: number;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const DEFAULT_MAX_FILES = 10;

export const UploadFileTable = ({
  refId,
  refType = 'CCTV',
  disabled = false,
  maxFiles = DEFAULT_MAX_FILES,
}: UploadFileTableProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<AttachmentFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Load existing attachments
  useState(() => {
    if (refId) {
      loadExisting();
    }
  });

  const loadExisting = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/cctv/${refId}/attachments`);
      const data = res.data.data || [];
      const mapped = Array.isArray(data)
        ? data.map((item: AttachmentFile) => ({
            ...item,
            uid: item.id,
            status: 'done' as const,
          }))
        : [];
      setExistingFiles(mapped);
    } catch {
      // Ignore errors loading existing attachments
    }
  }, [refId]);

  const getIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <FilePdfOutlined />;
    if (fileType?.includes('image')) return <FileImageOutlined />;
    return <FileOutlined />;
  };

  const handleBeforeUpload = useCallback((file: RcFile): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Định dạng "${ext}" không được hỗ trợ. Chấp nhận: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Tệp "${file.name}" vượt quá 20MB`);
      return false;
    }
    if (fileList.length + existingFiles.length >= maxFiles) {
      toast.error(`Tối đa ${maxFiles} tệp đính kèm`);
      return false;
    }
    return true;
  }, [fileList.length, existingFiles.length, maxFiles]);

  const handleFileChange = useCallback(
    (info: UploadChangeParam<UploadFile>) => {
      setFileList(info.fileList);
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    if (!refId || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of fileList) {
        if (file.status !== 'done' && file.originFileObj) {
          const formData = new FormData();
          formData.append('file', file.originFileObj);
          await api.post(`/api/v1/cctv/${refId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }
      setFileList([]);
      await loadExisting();
      toast.success('Tải lên tệp thành công');
    } catch {
      toast.error('Tải lên tệp thất bại');
    } finally {
      setUploading(false);
    }
  }, [refId, fileList, loadExisting]);

  const handleRemove = useCallback(
    async (attachment: AttachmentFile) => {
      if (!refId || !attachment.id) return;
      try {
        await api.delete(`/api/v1/cctv/${refId}/attachments/${attachment.id}`);
        setExistingFiles((prev) => prev.filter((a) => a.id !== attachment.id));
        toast.success('Đã xóa tệp đính kèm');
      } catch {
        toast.error('Xóa tệp thất bại');
      }
    },
    [refId],
  );

  const columns: ColumnsType<AttachmentFile> = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      render: (_, __, idx) => (
        <Text style={{ fontWeight: fontWeightBold }}>{idx + 1}</Text>
      ),
    },
    {
      title: 'Tên tệp',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (val: string, record: AttachmentFile) => (
        <Space>
          {getIcon(record.fileType)}
          <Text>{val}</Text>
        </Space>
      ),
    },
    {
      title: 'Kích thước',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 120,
      render: (val: number) => (
        <Text style={{ color: colors.textSecondary }}>
          {(val / 1024 / 1024).toFixed(2)} MB
        </Text>
      ),
    },
    {
      title: 'Ngày tải lên',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 180,
      render: (val: string) => (
        <Text style={{ color: colors.textSecondary }}>
          {val ? new Date(val).toLocaleDateString('vi-VN') : '—'}
        </Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_, record: AttachmentFile) => (
        <Popconfirm
          title="Xóa"
          description="Bạn có chắc muốn xóa tệp này?"
          onConfirm={() => handleRemove(record)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          disabled={disabled}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={disabled}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ marginTop: spaceMd }}>
      <div style={{ marginBottom: spaceMd }}>
        <Text style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
          File đính kèm
        </Text>
      </div>

      {/* Existing files table */}
      <Table
        columns={columns}
        dataSource={existingFiles}
        pagination={false}
        size="small"
        rowKey="id"
        style={{ borderRadius: radiusPill }}
        locale={{ emptyText: 'Chưa có tệp đính kèm' }}
      />

      {/* Upload area */}
      {!disabled && (
        <div style={{ marginTop: spaceMd }}>
          <Dragger
            accept={ALLOWED_EXTENSIONS.join(',')}
            fileList={fileList}
            beforeUpload={handleBeforeUpload}
            onChange={handleFileChange}
            multiple
            disabled={uploading}
            showUploadList={{
              showRemoveIcon: !uploading,
              removeIcon: <DeleteOutlined />,
            }}
          >
            <p className="ant-upload-drag-icon">
              <PlusOutlined />
            </p>
            <p className="ant-upload-text">Nhấn hoặc kéo tệp vào đây để tải lên</p>
            <p className="ant-upload-hint">
              Chấp nhận: {ALLOWED_EXTENSIONS.join(', ')} | Tối đa 20MB/tệp | Tối đa {maxFiles} tệp
            </p>
          </Dragger>
          {fileList.length > 0 && (
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              style={{ marginTop: spaceMd, borderRadius: radiusPill }}
            >
              Tải lên ({fileList.length} tệp)
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadFileTable;
