import { useState, useCallback, useEffect } from 'react';
import { Card, Typography, Row, Col, Tag, Empty, Space, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { vungNuocApi } from './api';
import type { VungNuoc, VungNuocHistoryRecord } from './types';
import {
  VUNGNUOC_HOAT_DONG_MAP,
  VUNGNUOC_PHE_DUYET_MAP,
} from './types';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';

/**
 * VungNuocHistoryPage — displays the change history timeline.
 * Route: /vungnuoc/:id/history
 */
export default function VungNuocHistoryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VungNuoc | null>(null);
  const [history, setHistory] = useState<VungNuocHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const entityData = await vungNuocApi.findById(id);
      setData(entityData);
      const historyData = await vungNuocApi.getHistory(id);
      setHistory(historyData);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải lịch sử'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  if (isLoading) return <LoadingSkeleton rows={6} type="card" />;
  if (isError || !data) {
    return (
      <ErrorState
        message={error?.message || 'Không tìm thấy vùng nước'}
        onRetry={fetchData}
        showHome
      />
    );
  }

  const hoatDongInfo = VUNGNUOC_HOAT_DONG_MAP[data.trangThaiHoatDong] || { color: 'default', label: data.trangThaiHoatDong };
  const pheDuyetInfo = VUNGNUOC_PHE_DUYET_MAP[data.trangThaiPheDuyet] || { color: 'default', label: data.trangThaiPheDuyet };

  return (
    <>
      {/* PageHeader */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/vungnuoc/${id}`)}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Lịch sử thay đổi — {data.maVungNuoc} | {data.tenVungNuoc}
          </Typography.Title>
        </Space>
      </Card>

      {/* EntitySummaryCard */}
      <Card title="Thông tin vùng nước" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Typography.Text type="secondary">Mã: </Typography.Text>
            <Typography.Text strong>{data.maVungNuoc}</Typography.Text>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Typography.Text type="secondary">Tên: </Typography.Text>
            <Typography.Text strong>{data.tenVungNuoc}</Typography.Text>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Typography.Text type="secondary">Cảng biển: </Typography.Text>
            <Typography.Text>{data.cangBienId}</Typography.Text>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Typography.Text type="secondary">Diện tích: </Typography.Text>
            <Typography.Text>{data.dienTich?.toFixed(2) || '—'} m²</Typography.Text>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Typography.Text type="secondary">Độ sâu max: </Typography.Text>
            <Typography.Text>{data.doSauMax?.toFixed(2) || '—'} m</Typography.Text>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Typography.Text type="secondary">Độ sâu TB: </Typography.Text>
            <Typography.Text>{data.doSauTrungBinh?.toFixed(2) || '—'} m</Typography.Text>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Typography.Text type="secondary">Loại: </Typography.Text>
            <Typography.Text>{data.loaiVungNuoc || '—'}</Typography.Text>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Typography.Text type="secondary">Hoạt động: </Typography.Text>
            <Tag color={hoatDongInfo.color}>{hoatDongInfo.label}</Tag>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Typography.Text type="secondary">Phê duyệt: </Typography.Text>
            <Tag color={pheDuyetInfo.color}>{pheDuyetInfo.label}</Tag>
          </Col>
        </Row>
      </Card>

      {/* HistoryTimeline */}
      <Card title="Lịch sử thay đổi">
        {history.length === 0 ? (
          <Empty description="Chưa có thay đổi nào được ghi nhận." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {history.map((record, index) => (
              <TimelineItem key={record.id} record={record} isLast={index === history.length - 1} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

/* ── TimelineItem ────────────────────────────────────────────────────── */

function TimelineItem({
  record,
  isLast,
}: {
  record: VungNuocHistoryRecord;
  isLast: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        position: 'relative',
        paddingBottom: isLast ? 0 : 24,
      }}
      role="listitem"
      aria-label={`Thay đổi lúc ${new Date(record.createdAt).toLocaleString('vi-VN')}`}
    >
      {/* Timeline line */}
      <div
        style={{
          width: 2,
          background: '#e8e8e8',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#1677ff',
            position: 'absolute',
            top: -5,
            left: -5,
          }}
        />
        {!isLast && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 5,
              width: 2,
              height: 'calc(100% + 8px)',
              background: '#e8e8e8',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <Typography.Text type="secondary">
          {new Date(record.createdAt).toLocaleString('vi-VN')}
        </Typography.Text>
        <Typography.Text strong> {record.actor}</Typography.Text>

        <div style={{ marginTop: 4 }}>
          <Tag color="blue">{record.fieldChanged}</Tag>
        </div>

        <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Typography.Text delete type="danger">
            {record.oldValue || '—'}
          </Typography.Text>
          <Typography.Text type="secondary">→</Typography.Text>
          <Typography.Text type="success" strong>
            {record.newValue || '—'}
          </Typography.Text>
        </div>

        {record.reason && (
          <div style={{ marginTop: 4 }}>
            <Tag color="orange">Lý do: {record.reason}</Tag>
          </div>
        )}
      </div>
    </div>
  );
}
