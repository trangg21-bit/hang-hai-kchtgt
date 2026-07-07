import { useEffect, useState, useCallback } from 'react';
import { Card, Button, Typography, Space, Tag } from 'antd';
import toast from '../../components/ToastNotification';
import { ArrowLeftOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCangBienById, fetchCangBienHistory } from './api';
import type { CangBienResponse, ChangeHistory } from './types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return dateStr; }
}

export default function CangBienHistoryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<CangBienResponse | null>(null);
  const [records, setRecords] = useState<ChangeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [isError, setIsError] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const [entityRes, historyRes] = await Promise.all([
        fetchCangBienById(id),
        fetchCangBienHistory(id, { page: page - 1, size: pageSize }),
      ]);
      setEntity(entityRes);
      setRecords(historyRes.content || []);
      setTotal(historyRes.totalElements ?? 0);
    } catch (err: unknown) {
      setIsError(true);
      const msg = err instanceof Error ? err.message : 'Không thể tải lịch sử';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id, page, pageSize]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (isError || !entity) {
    return (
      <Card>
        <p>Không tìm thấy cảng biển với ID {id}.</p>
        <Button onClick={() => navigate('/cangbien')}>Quay lại danh sách</Button>
      </Card>
    );
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/cangbien/${id}`)}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Lịch sử thay đổi — {entity.maCang} — {entity.tenCang}
          </Typography.Title>
        </Space>
      </Card>

      {/* Entity Summary */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Space>
          <Typography.Text strong>Mã cảng:</Typography.Text>
          <Tag color="cyan">{entity.maCang}</Tag>
          <Typography.Text strong>Tên cảng:</Typography.Text>
          <Typography.Text>{entity.tenCang}</Typography.Text>
          <Typography.Text strong>Tỉnh/thành phố:</Typography.Text>
          <Typography.Text>{entity.tinhThanhPho || '—'}</Typography.Text>
        </Space>
      </Card>

      {/* History Timeline */}
      <Card title="Danh sách thay đổi" style={{ maxWidth: 800, margin: '0 auto' }}>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <HistoryOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <br />
            <Typography.Text type="secondary">Chưa có thay đổi nào được ghi nhận.</Typography.Text>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {records.map((rec, idx) => (
              <li
                key={rec.id}
                style={{
                  position: 'relative',
                  paddingLeft: 24,
                  paddingBottom: idx < records.length - 1 ? 24 : 0,
                  borderBottom: idx < records.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                {/* Timeline dot */}
                <span
                  style={{
                    position: 'absolute',
                    left: 4,
                    top: 4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#1677ff',
                  }}
                />
                <Typography.Text strong style={{ fontSize: 14 }}>
                  {formatDate(rec.changedAt)}
                </Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Người thay đổi: {rec.changedBy || '—'}
                </Typography.Text>
                <br />
                <Typography.Text strong style={{ color: '#fa8c16' }}>
                  Trường: {rec.fieldName}
                </Typography.Text>
                <br />
                <Typography.Text type="secondary" delete style={{ display: 'inline-block', marginRight: 12 }}>
                  Cũ: {rec.oldValue || '—'}
                </Typography.Text>
                <Typography.Text type="success" style={{ display: 'inline-block' }}>
                  Mới: {rec.newValue || '—'}
                </Typography.Text>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Space>
              <Button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <Typography.Text>Trang {page} / {Math.ceil(total / pageSize)}</Typography.Text>
              <Button
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage((p) => p + 1)}
              >
                Tiếp
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </>
  );
}
