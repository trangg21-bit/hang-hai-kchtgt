import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Space, Button, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { fetchCauCangById, fetchCauCangHistory } from './api';
import type { CauCang, CauCangHistoryRecord } from './types';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  'HIEN_HANH': { color: 'green', label: 'Hiện hành' },
  'TAM_NGUNG': { color: 'gold', label: 'Tạm ngừng' },
};

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  'CHO_PHE_DUYET': { color: 'gold', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: 'green', label: 'Được phê duyệt' },
  'TU_CHOI': { color: 'red', label: 'Từ chối' },
};

const ACTION_TYPE_MAP: Record<string, { color: string; label: string; icon: string }> = {
  CREATE: { color: 'blue', label: 'Tạo mới', icon: '➕' },
  UPDATE: { color: 'green', label: 'Cập nhật', icon: '✏️' },
  APPROVE: { color: 'cyan', label: 'Phê duyệt', icon: '✅' },
  REJECT: { color: 'red', label: 'Từ chối', icon: '❌' },
  DELETE: { color: 'orange', label: 'Xóa', icon: '🗑️' },
  RESTORE: { color: 'purple', label: 'Khôi phục', icon: '↩️' },
};

export default function CauCangHistoryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<CauCang | null>(null);
  const [history, setHistory] = useState<CauCangHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    (async () => {
      try {
        const [entityData, historyData] = await Promise.all([
          fetchCauCangById(id),
          fetchCauCangHistory(id),
        ]);
        setEntity(entityData);
        setHistory(historyData);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) return <LoadingSkeleton rows={10} />;
  if (isError) return <ErrorState message="Không thể tải lịch sử" onRetry={() => navigate('/caucang')} />;
  if (!entity) return null;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/caucang/${id}`)}>Quay lại</Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Lịch sử thay đổi — {entity.maCau} — {entity.tenCau}
          </Typography.Title>
        </Space>
      </Card>

      {/* Entity Summary */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col span={6}>
            <Typography.Text type="secondary">Mã cầu:</Typography.Text>
            <br />
            <Typography.Text strong>{entity.maCau}</Typography.Text>
          </Col>
          <Col span={6}>
            <Typography.Text type="secondary">Tên cầu:</Typography.Text>
            <br />
            <Typography.Text>{entity.tenCau}</Typography.Text>
          </Col>
          <Col span={6}>
            <Typography.Text type="secondary">Bến cảng chủ:</Typography.Text>
            <br />
            <Typography.Text>{entity.benCangId}</Typography.Text>
          </Col>
          <Col span={6}>
            <Typography.Text type="secondary">Loại cầu:</Typography.Text>
            <br />
            <Typography.Text>{entity.loaiCau || '—'}</Typography.Text>
          </Col>
          <Col span={6}>
            <Typography.Text type="secondary">Chiều dài:</Typography.Text>
            <br />
            <Typography.Text>{entity.chieuDai !== null ? `${entity.chieuDai.toFixed(2)} m` : '—'}</Typography.Text>
          </Col>
          <Col span={6}>
            <Typography.Text type="secondary">Tải trọng:</Typography.Text>
            <br />
            <Typography.Text>{entity.taiTrong !== null ? `${entity.taiTrong.toFixed(2)} tấn` : '—'}</Typography.Text>
          </Col>
          <Col span={6}>
            <Typography.Text type="secondary">Trạng thái HĐ:</Typography.Text>
            <br />
            <Tag color={STATUS_MAP[entity.trangThaiHoatDong]?.color}>
              {STATUS_MAP[entity.trangThaiHoatDong]?.label}
            </Tag>
          </Col>
          <Col span={6}>
            <Typography.Text type="secondary">Phê duyệt:</Typography.Text>
            <br />
            <Tag color={APPROVAL_MAP[entity.trangThaiPheDuyet]?.color}>
              {APPROVAL_MAP[entity.trangThaiPheDuyet]?.label}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* History Timeline */}
      {history.length === 0 ? (
        <EmptyState description="Chưa có thay đổi nào được ghi nhận." />
      ) : (
        <div
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 16,
            background: '#fafafa',
          }}
          role="list"
          aria-label="Lịch sử thay đổi"
        >
          {history
            .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
            .map((record, index) => {
              const actionInfo = ACTION_TYPE_MAP[record.actionType] || { color: 'default', label: record.actionType, icon: '' };
              return (
                <div
                  key={record.id}
                  role="listitem"
                  aria-time={record.changedAt}
                  style={{
                    position: 'relative',
                    paddingLeft: 32,
                    paddingBottom: 24,
                    borderBottom: index < history.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 8,
                      top: 4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: `var(--ant-${actionInfo.color}-5)`,
                      border: '2px solid var(--ant-${actionInfo.color}-6)',
                    }}
                  />

                  {/* Timestamp + Actor */}
                  <Typography.Text strong style={{ fontSize: 14 }}>
                    {new Date(record.changedAt).toLocaleString('vi-VN')}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ marginLeft: 12 }}>
                    bởi {record.changedBy}
                  </Typography.Text>

                  {/* Action badge */}
                  <Tag color={actionInfo.color} style={{ marginLeft: 12 }}>
                    {actionInfo.icon} {actionInfo.label}
                  </Tag>

                  {/* Field changes */}
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    <Typography.Text type="secondary">
                      {record.fieldChanged}:
                    </Typography.Text>
                    {record.oldValue !== record.newValue ? (
                      <span>
                        <span style={{ textDecoration: 'line-through', color: '#ff4d4f', marginRight: 8 }}>
                          {record.oldValue || '—'}
                        </span>
                        <span style={{ color: '#52c41a' }}>{record.newValue}</span>
                      </span>
                    ) : (
                      <span>{record.newValue || '—'}</span>
                    )}
                  </div>

                  {/* Reason (if reject) */}
                  {record.reason && record.actionType === 'REJECT' && (
                    <div
                      style={{
                        marginTop: 8,
                        background: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: 4,
                        padding: '8px 12px',
                        fontSize: 13,
                      }}
                    >
                      <Typography.Text type="secondary">Lý do:</Typography.Text>
                      <Typography.Text style={{ marginLeft: 8 }}>{record.reason}</Typography.Text>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </>
  );
}
