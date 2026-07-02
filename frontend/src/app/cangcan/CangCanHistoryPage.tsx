import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Typography,
  Tag,
  Timeline,
  Empty,
  Alert,
  Button,
  Space,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { CangCan } from './types';
import type { CangCanHistoryRecord } from './api';
import {
  TRANG_THAI_HOAT_DONG_MAP,
  TRANG_THAI_PHE_DUYET_MAP,
} from './types';
import toast from '../../components/ToastNotification';
import { fetchCangCanById, fetchCangCanHistory } from './api';

export default function CangCanHistoryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<CangCan | null>(null);
  const [history, setHistory] = useState<CangCanHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const [entityData, historyData] = await Promise.all([
        fetchCangCanById(id),
        fetchCangCanHistory(id),
      ]);
      setEntity(entityData);
      // History is sorted newest first
      setHistory(historyData.sort((a, b) =>
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
      ));
    } catch (err: unknown) {
      setIsError(true);
      toast.error(err instanceof Error ? err.message : 'Không thể tải lịch sử');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      maCangCan: 'Mã cảng cạn',
      tenCangCan: 'Tên cảng cạn',
      tinhThanhPho: 'Tỉnh/thành phố',
      viDo: 'Vĩ độ',
      kinhDo: 'Kinh độ',
      dienTich: 'Diện tích',
      congSuatTEU: 'Công suất TEU',
      trangThaiHoatDong: 'Trạng thái hoạt động',
      trangThaiPheDuyet: 'Trạng thái phê duyệt',
      createdBy: 'Người tạo',
      updatedBy: 'Người cập nhật',
      createdAt: 'Ngày tạo',
      updatedAt: 'Ngày cập nhật',
      orgUnitId: 'Đơn vị',
    };
    return labels[field] || field;
  };

  const getActionIcon = (field: string, record: CangCanHistoryRecord) => {
    if (field === 'trangThaiPheDuyet') {
      if (record.newValue === 'ĐƯỢC_PHE_DUYỆT') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      if (record.newValue === 'TỪ_CHỐI') return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    return <EditOutlined style={{ color: '#1677ff' }} />;
  };

  if (isLoading) {
    return <Typography.Text>Đang tải lịch sử...</Typography.Text>;
  }

  if (isError || !entity) {
    return (
      <Card>
        <Typography.Text>Không tìm thấy cảng cạn.</Typography.Text>
        <Button type="link" onClick={() => navigate('/cangcan')}>Quay lại danh sách</Button>
      </Card>
    );
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/cangcan/${id}`)}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Lịch sử thay đổi — {entity.maCangCan}
          </Typography.Title>
        </Space>
      </Card>

      {/* Entity Summary */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Typography.Text type="secondary">Mã cảng cạn</Typography.Text>
            <Typography.Text strong>{entity.maCangCan}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Tên cảng cạn</Typography.Text>
            <Typography.Text>{entity.tenCangCan}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Tỉnh/thành phố</Typography.Text>
            <Typography.Text>{entity.tinhThanhPho || '—'}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Trạng thái hoạt động</Typography.Text>
            <Tag color={TRANG_THAI_HOAT_DONG_MAP[entity.trangThaiHoatDong]?.color}>
              {TRANG_THAI_HOAT_DONG_MAP[entity.trangThaiHoatDong]?.label || entity.trangThaiHoatDong}
            </Tag>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Trạng thái phê duyệt</Typography.Text>
            <Tag color={TRANG_THAI_PHE_DUYET_MAP[entity.trangThaiPheDuyet]?.color}>
              {TRANG_THAI_PHE_DUYET_MAP[entity.trangThaiPheDuyet]?.label || entity.trangThaiPheDuyet}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* History Timeline */}
      <Card title="Lịch sử thay đổi" size="small">
        {history.length === 0 ? (
          <Empty
            description="Chưa có thay đổi nào được ghi nhận."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Timeline
            items={history.map((record) => ({
              key: record.id,
              color: record.newValue === 'TỪ_CHỐI' ? 'red' : record.newValue === 'ĐƯỢC_PHE_DUYỆT' ? 'green' : 'blue',
              dot: getActionIcon(record.fieldChanged, record),
              children: (
                <div>
                  <div style={{ marginBottom: 4 }}>
                    <Typography.Text strong>{record.changedBy}</Typography.Text>
                    <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                      {new Date(record.changedAt).toLocaleString('vi-VN')}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                      — đã thay đổi: {getFieldLabel(record.fieldChanged)}
                    </Typography.Text>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <Typography.Text type="secondary">
                        <span style={{ textDecoration: 'line-through', color: '#ff4d4f' }}>
                          {record.oldValue ?? '—'}
                        </span>
                      </Typography.Text>
                    </div>
                    <Typography.Text type="secondary">→</Typography.Text>
                    <div>
                      <Typography.Text strong style={{ color: '#52c41a' }}>
                        {record.newValue ?? '—'}
                      </Typography.Text>
                    </div>
                  </div>
                  {record.reason && (
                    <Alert
                      message={`Lý do: ${record.reason}`}
                      type="info"
                      showIcon
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </>
  );
}
