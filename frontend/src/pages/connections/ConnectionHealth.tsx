import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  Tag,
  Table,
  Progress,
  Timeline,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { connectionService } from '../../services/connectionService';
import type { ConnectionHealth } from '../../services/connectionService';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import toast from '../../components/ToastNotification';

const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  healthy: { color: 'green', label: 'Khỏe mạnh', icon: <CheckCircleOutlined /> },
  degraded: { color: 'orange', label: 'Suy giảm', icon: <WarningOutlined /> },
  down: { color: 'red', label: 'Ngừng hoạt động', icon: <CloseCircleOutlined /> },
  unknown: { color: 'default', label: 'Chưa rõ', icon: <ThunderboltOutlined /> },
};

export default function ConnectionHealth() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [health, setHealth] = useState<ConnectionHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadHealth = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await connectionService.getHealth(id!);
      setHealth(data);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải thông tin sức khỏe'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadHealth(); }, [loadHealth]);

  const handleTest = useCallback(async () => {
    try {
      toast.info('Đang kiểm tra kết nối...');
      const res = await connectionService.testConnection(id!);
      if (res.success) {
        toast.success(`Kết nối thành công — ${res.responseTime}ms`);
      } else {
        toast.error(`Kết nối thất bại — ${res.message}`);
      }
      loadHealth();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Kiểm tra thất bại');
    }
  }, [id, loadHealth]);

  if (isLoading) return <LoadingSkeleton rows={12} type="card" />;
  if (isError) return <ErrorState message={error?.message} onRetry={loadHealth} />;
  if (!health) return <EmptyState description="Không thể tải thông tin" />;

  const statusInfo = STATUS_MAP[health.status] || STATUS_MAP.unknown;

  const uptimeColumns: ColumnsType<{ timestamp: string; uptime: number }> = [
    { title: 'Ngày', dataIndex: 'timestamp', render: (v) => dayjs(v).format('DD/MM/YYYY') },
    { title: 'Uptime', dataIndex: 'uptime', render: (v) => `${v.toFixed(1)}%` },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/connections')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Sức khỏe kết nối: {health.name}
          </Typography.Title>
        </Space>
      </Card>

      {/* Status Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">Trạng thái</Typography.Text>
            <Space style={{ marginTop: 8 }}>
              {statusInfo.icon}
              <Tag color={statusInfo.color} style={{ fontSize: 16 }}>{statusInfo.label}</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">Uptime</Typography.Text>
            <Progress percent={Math.round(health.uptime)} size="large" status={health.uptime > 95 ? 'normal' : 'exception'} style={{ marginTop: 8 }} />
            <Typography.Text type="secondary">{health.uptime.toFixed(1)}%</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">Thời gian phản hồi</Typography.Text>
            <Typography.Title level={4} style={{ margin: '8px 0 0' }}>{health.responseTime}ms</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">Khả dụng</Typography.Text>
            <Typography.Title level={4} style={{ margin: '8px 0 0', color: health.isReachable ? '#52c41a' : '#ff4d4f' }}>
              {health.isReachable ? 'Có' : 'Không'}
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      {/* Details */}
      <Card title="Chi tiết" style={{ marginTop: 16 }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="ID kết nối">{health.connectionId}</Descriptions.Item>
          <Descriptions.Item label="Tên">{health.name}</Descriptions.Item>
          <Descriptions.Item label="Kiểm tra cuối">{dayjs(health.lastCheckedAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
          <Descriptions.Item label="Thời gian phản hồi">{health.responseTime}ms</Descriptions.Item>
          <Descriptions.Item label="Khả dụng">{health.isReachable ? 'Có' : 'Không'}</Descriptions.Item>
          {health.certificateExpiry && (
            <Descriptions.Item label="Chứng chỉ hết hạn">{dayjs(health.certificateExpiry).format('DD/MM/YYYY')}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Uptime History */}
      <Card title="Lịch sử uptime" style={{ marginTop: 16 }}>
        <Table
          columns={uptimeColumns}
          dataSource={health.uptimeHistory}
          pagination={false}
          size="small"
          rowKey="timestamp"
        />
      </Card>

      {/* Error Log */}
      {health.errorLog.length > 0 && (
        <Card title="Lỗi gần đây" style={{ marginTop: 16 }}>
          <Timeline
            items={health.errorLog.map((e) => ({
              color: 'red',
              children: (
                <>
                  <Typography.Text type="secondary">{dayjs(e.timestamp).format('DD/MM/YYYY HH:mm:ss')}</Typography.Text>
                  <br />
                  {e.message}
                </>
              ),
            }))}
          />
        </Card>
      )}

      {/* Actions */}
      <Card style={{ marginTop: 16 }}>
        <Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleTest}>
            Kiểm tra lại
          </Button>
          <Button onClick={loadHealth}>Tải lại thông tin</Button>
          <Button onClick={() => navigate('/connections')}>Quay lại danh sách</Button>
        </Space>
      </Card>
    </>
  );
}
