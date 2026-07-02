import { useState, useCallback, useEffect } from 'react';
import {
  Button, Space, Typography, Card, Table, Upload,
  Progress, Tag, Descriptions, Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  InboxOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { giayToApi } from './api';
import type { GiayTo, GiayToEntityType } from './types';
import { GIAYTO_ENTITY_TYPES } from './types';
import { MAX_FILE_SIZE } from './schema';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

const { Dragger } = Upload;

/**
 * GiayToUploadPage — upload & manage file attachments for an entity.
 * Route: /giayto/upload/:entityType/:entityId
 */
export default function GiayToUploadPage() {
  const navigate = useNavigate();
  const { entityType, entityId } = useParams<{ entityType: string; entityId: string }>();

  const [files, setFiles] = useState<GiayTo[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const entityLabel = (() => {
    const found = GIAYTO_ENTITY_TYPES.find((t) => t.value === entityType);
    return found ? found.label : 'Unknown';
  })();

  const fetchFiles = useCallback(async () => {
    if (!entityType || !entityId) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await giayToApi.listByEntity(
        entityType as GiayToEntityType,
        entityId,
        { page, size: 20 },
      );
      setFiles(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách tài liệu'));
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, page]);

  useEffect(() => { void fetchFiles(); }, [fetchFiles]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !entityType || !entityId) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const userId = localStorage.getItem('user_id') || '1';
      await giayToApi.upload(
        entityType as GiayToEntityType,
        entityId,
        selectedFile,
        userId,
      );
      toast.success('Đính kèm file thành công');
      setSelectedFile(null);
      setUploadProgress(100);
      setTimeout(() => { setUploadProgress(0); fetchFiles(); }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải lên file thất bại';
      toast.error(msg);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }, [selectedFile, entityType, entityId, fetchFiles]);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirmId) return;
    try {
      await giayToApi.delete(deleteConfirmId);
      toast.success('Xóa tài liệu đính kèm thành công');
      setDeleteConfirmId(null);
      fetchFiles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [deleteConfirmId, fetchFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} bytes`;
  };

  return (
    <>
      {/* PageHeader */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Đính kèm tài liệu — {entityLabel}
          </Typography.Title>
          <Typography.Text type="secondary">
            Entity ID: {entityId}
          </Typography.Text>
        </Space>
      </Card>

      {/* UploadArea */}
      <Card style={{ marginBottom: 16 }} title="Tải file lên">
        <Dragger
          accept="*/*"
          multiple={false}
          showUploadList={false}
          beforeUpload={(file: File) => {
            if (file.size > MAX_FILE_SIZE) {
              toast.error('Kích thước file vượt quá 10MB');
              return Upload.LIST_IGNORE;
            }
            setSelectedFile(file);
            return false;
          }}
          onDrop={() => {}}
          style={{
            border: '2px dashed #d9d9d9',
            borderRadius: 8,
            padding: '32px 0',
            textAlign: 'center',
            background: '#fafafa',
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          </p>
          <Typography.Text>Kéo thả file vào đây hoặc nhấn để chọn file</Typography.Text>
          <Typography.Text type="secondary">
            {' '}
            Mọi định dạng file được chấp nhận — không có giới hạn MIME type.
          </Typography.Text>
        </Dragger>

        {/* FilePreviewCard */}
        {selectedFile && (
          <Card
            size="small"
            title="Thông tin file đã chọn"
            style={{ marginTop: 16 }}
            extra={
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setSelectedFile(null)}
              />
            }
          >
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Tên file">
                <Typography.Text strong>{selectedFile.name}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Kích thước">
                {formatFileSize(selectedFile.size)}
              </Descriptions.Item>
              <Descriptions.Item label="MIME type">
                <Tag>{selectedFile.type || 'unknown'}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* UploadProgress */}
        {uploading && (
          <Card size="small" style={{ marginTop: 16 }}>
            <Progress percent={uploadProgress} status={uploadProgress === 100 ? 'success' : 'active'} />
            <Typography.Text type="secondary">
              {uploadProgress === 100 ? 'Đã tải lên thành công' : 'Đang tải lên...'}
            </Typography.Text>
          </Card>
        )}

        {/* ModalFooter */}
        <Space style={{ marginTop: 16 }}>
          <Button onClick={() => setSelectedFile(null)}>Hủy</Button>
          <Button
            type="primary"
            icon={<FileOutlined />}
            loading={uploading}
            disabled={!selectedFile || uploading}
            onClick={handleUpload}
          >
            Tải lên
          </Button>
        </Space>
      </Card>

      {/* UploadedFilesList */}
      <Card title="Danh sách tài liệu đã đính kèm">
        {isLoading && <LoadingSkeleton rows={6} type="table" />}
        {isError && (
          <ErrorState message={error?.message || 'Không thể tải danh sách'} onRetry={fetchFiles} />
        )}
        {!isLoading && !isError && files.length === 0 && (
          <EmptyState description="Chưa có tài liệu đính kèm" />
        )}
        {!isLoading && !isError && files.length > 0 && (
          <>
            <Table<GiayTo>
              dataSource={files}
              rowKey="id"
              size="small"
              pagination={{
                current: page,
                pageSize: 20,
                total,
                onChange: (p) => setPage(p),
                showSizeChanger: false,
                showTotal: (t) => `Tổng ${t} tài liệu`,
              }}
              columns={[
                {
                  title: 'Tài liệu',
                  dataIndex: 'fileName',
                  ellipsis: true,
                  render: (v: string) => (
                    <a
                      href={giayToApi.downloadUrl(v.split('/').pop() || '')}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileOutlined /> {v}
                    </a>
                  ),
                },
                {
                  title: 'Kích thước',
                  dataIndex: 'fileSize',
                  width: 120,
                  render: (v: number) => formatFileSize(v),
                },
                {
                  title: 'Loại',
                  dataIndex: 'mimeType',
                  width: 140,
                  render: (v: string) => <Tag>{v}</Tag>,
                },
                {
                  title: 'Người upload',
                  dataIndex: 'uploadedBy',
                  width: 140,
                },
                {
                  title: 'Ngày upload',
                  dataIndex: 'createdAt',
                  width: 160,
                  render: (v: string) => new Date(v).toLocaleString('vi-VN'),
                },
                {
                  title: 'Hành động',
                  key: 'actions',
                  width: 120,
                  render: (_: unknown, record: GiayTo) => (
                    <Space size="small">
                      <Button
                        type="text"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => window.open(giayToApi.downloadUrl(record.minioKey), '_blank')}
                      />
                      <Popconfirm
                        title="Xác nhận xóa"
                        description="Bạn có chắc muốn xóa tài liệu này?"
                        okText="Xóa"
                        okType="danger"
                        cancelText="Hủy"
                        onConfirm={() => setDeleteConfirmId(record.id)}
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </>
        )}
      </Card>
    </>
  );
}
