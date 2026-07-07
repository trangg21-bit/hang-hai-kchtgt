import { useState, useEffect } from 'react';
import { Card, Typography, Divider, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { benCangCRUD, benCangHistory } from '../../services/cangbenService';
import type { BenCang } from '../../types/cangben';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { APPROVAL_STATUS_MAP } from '../../types/cangben';

const { Title, Text } = Typography;

export default function BenCangHistoryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<BenCang | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    (async () => {
      try {
        // Fetch entity info
        const data = await benCangCRUD.findById(id);
        setEntity(data);

        // Fetch history records
        const histRes = await benCangHistory.getHistory(id);
        setHistoryRecords(histRes.data || []);
      } catch (err: unknown) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Không thể tải lịch sử'));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState message={error?.message || 'Không thể tải lịch sử'} onRetry={() => navigate(-1)} />;
  if (!entity) return <ErrorState message="Không tìm thấy bến cảng" onRetry={() => navigate(-1)} />;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/bencang/${id}`)}>Quay lại</Button>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              Lịch sử thay đổi — {entity.maBen} | {entity.tenBen}
            </Title>
          </div>
        </div>
      </Card>

      {/* Entity Summary Card */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Thông tin bến cảng</Title>
        <Divider />
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <Text type="secondary">Mã bến:</Text><br />
            <Text strong>{entity.maBen}</Text>
          </div>
          <div>
            <Text type="secondary">Tên bến:</Text><br />
            <Text strong>{entity.tenBen}</Text>
          </div>
          <div>
            <Text type="secondary">Cảng biển chủ:</Text><br />
            <Text>{entity.cangBienId}</Text>
          </div>
          <div>
            <Text type="secondary">Tuyến đường thủy:</Text><br />
            <Text>{entity.tuyenDuongThuy || '—'}</Text>
          </div>
          <div>
            <Text type="secondary">Phê duyệt:</Text><br />
            <Tag color={APPROVAL_STATUS_MAP[entity.trangThaiPheDuyet as keyof typeof APPROVAL_STATUS_MAP]?.color || 'default'}>
              {APPROVAL_STATUS_MAP[entity.trangThaiPheDuyet as keyof typeof APPROVAL_STATUS_MAP]?.label || entity.trangThaiPheDuyet}
            </Tag>
          </div>
        </div>
      </Card>

      {/* History Timeline */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Lịch sử thay đổi</Title>
        <Divider />

        {historyRecords.length === 0 ? (
          <EmptyState description="Chưa có thay đổi nào được ghi nhận." />
        ) : (
          <div
            style={{
              borderLeft: '2px solid #f0f0f0',
              paddingLeft: 24,
              marginLeft: 8,
            }}
          >
            {historyRecords.map((record: any, idx: number) => (
              <div
                key={record.id || idx}
                style={{
                  position: 'relative',
                  marginBottom: 24,
                  paddingBottom: 24,
                  borderBottom: idx < historyRecords.length - 1 ? '1px solid #f5f5f5' : 'none',
                }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: -29,
                    top: 4,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#1890ff',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 2px #1890ff',
                  }}
                />

                {/* Timestamp */}
                <div style={{ marginBottom: 4 }}>
                  <Text strong>
                    {record.changedAt || record.createdAt
                      ? new Date(record.changedAt || record.createdAt).toLocaleString('vi-VN')
                      : '—'}
                  </Text>
                </div>

                {/* Actor */}
                {record.changedBy && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">Người thực hiện:</Text>{' '}
                    <Text strong>{record.changedBy}</Text>
                  </div>
                )}

                {/* Field change */}
                {record.fieldName && (
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">Trường:</Text>{' '}
                    <Text strong>{record.fieldName}</Text>
                  </div>
                )}

                {/* Old/New value */}
                {record.oldValue !== undefined && record.oldValue !== null && (
                  <div style={{ marginBottom: 2 }}>
                    <Text type="secondary" style={{ textDecoration: 'line-through', color: '#ff4d4f' }}>
                      cũ: {record.oldValue}
                    </Text>
                  </div>
                )}
                {record.newValue !== undefined && record.newValue !== null && (
                  <div>
                    <Text type="secondary">mới:</Text>{' '}
                    <Text style={{ color: '#52c41a', fontWeight: 500 }}>{record.newValue}</Text>
                  </div>
                )}

                {/* Reason (from approval history) */}
                {record.reason && (
                  <div style={{ marginTop: 8, padding: 8, background: '#fff2f0', borderRadius: 4 }}>
                    <Text type="secondary">Lý do:</Text>{' '}
                    <Text>{record.reason}</Text>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
