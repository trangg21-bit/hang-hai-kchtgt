import { useEffect, useState, useCallback } from 'react';
import { Card, Button, Typography, Tag, Row, Col, Input, Modal, Spin } from 'antd';
import { borderDefault, actionPrimary, textTertiary, textPrimary, fontSizeMd, fontSizeSm, fontWeightMedium, radiusPill, cardStyle } from '../../tokens';
import { fetchCangBienList, approveCangBien, rejectCangBien } from './api';
import type { CangBienResponse } from './types';
import toast from '../../components/ToastNotification';
import { ScreenHeader } from '../../components/list-view';
import { PORT_STATUS_MAP } from '../../types/port';
import type { PortStatusValue } from '../../types/port';
import EmptyState from '../../components/EmptyState';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function renderPortStatusBadge(status: string | null | undefined): React.ReactNode {
  if (!status) return <span style={{ color: textTertiary }}>—</span>;
  const s = PORT_STATUS_MAP[status as PortStatusValue];
  if (!s) return <Tag>{status}</Tag>;
  return (
    <span style={{
      display: 'inline-flex', padding: '2px 10px', borderRadius: 999,
      fontSize: fontSizeMd, fontWeight: fontWeightMedium,
      background: `${s.color}15`, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

export default function PortApprovePage() {
  const [dataSource, setDataSource] = useState<CangBienResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // ── Load pending ports ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchCangBienList({
        page: 0,
        size: 200,
        portStatus: 'CHO_PHE_DUYET',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      setDataSource(res.content || []);
    } catch {
      toast.error('Không thể tải danh sách chờ phê duyệt');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // ── Approve handler ───────────────────────────────────────────────
  const handleApprove = useCallback(async (record: CangBienResponse) => {
    Modal.confirm({
      title: 'Xác nhận phê duyệt',
      content: `Phê duyệt cảng biển "${record.portName}" (${record.portCode})?`,
      okText: 'Phê duyệt',
      cancelText: 'Hủy',
      onOk: async () => {
        setSubmittingId(record.id);
        try {
          await approveCangBien(record.id);
          toast.success('Phê duyệt thành công');
          fetchData();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
        } finally {
          setSubmittingId(null);
        }
      },
    });
  }, [fetchData]);

  // ── Reject handler ────────────────────────────────────────────────
  const handleReject = useCallback(async (record: CangBienResponse) => {
    let reason = '';
    Modal.confirm({
      title: 'Từ chối cảng biển',
      icon: null,
      content: (
        <div style={{ marginTop: 8 }}>
          <p>Lý do từ chối cho <strong>{record.portName}</strong>:</p>
          <Input.TextArea
            rows={4}
            placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)"
            onChange={(e) => { reason = e.target.value; }}
            maxLength={500}
            showCount
          />
        </div>
      ),
      okText: 'Từ chối',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        if (!reason || reason.length < 10) {
          toast.error('Lý do từ chối tối thiểu 10 ký tự');
          return Promise.reject();
        }
        setSubmittingId(record.id);
        try {
          await rejectCangBien(record.id, reason);
          toast.success('Từ chối thành công');
          fetchData();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
        } finally {
          setSubmittingId(null);
        }
      },
    });
  }, [fetchData]);

  return (
    <>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý cảng biển' }, { label: 'Phê duyệt' }]}
        actions={[]}
      />

      <div style={{ ...cardStyle, padding: 16 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <p style={{ color: textTertiary, marginTop: 16 }}>Đang tải danh sách...</p>
          </div>
        ) : dataSource.length === 0 ? (
          <EmptyState description="Không có cảng biển nào chờ phê duyệt" />
        ) : (
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 16, color: textPrimary, fontSize: fontSizeMd }}>
              Danh sách cảng biển chờ phê duyệt ({dataSource.length})
            </Typography.Text>

            {dataSource.map((record) => (
              <Card
                key={record.id}
                size="small"
                style={{ marginBottom: 12, border: `1px solid ${borderDefault}` }}
                actions={[
                  <Button
                    key="approve"
                    type="primary"
                    size="small"
                    loading={submittingId === record.id}
                    onClick={() => handleApprove(record)}
                    style={{ borderRadius: radiusPill, height: 32, fontSize: fontSizeMd, background: actionPrimary }}
                  >
                    Phê duyệt
                  </Button>,
                  <Button
                    key="reject"
                    danger
                    size="small"
                    loading={submittingId === record.id}
                    onClick={() => handleReject(record)}
                    style={{ borderRadius: radiusPill, height: 32, fontSize: fontSizeMd }}
                  >
                    Từ chối
                  </Button>,
                ]}
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={6}>
                    <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Mã cảng</Typography.Text>
                    <br />
                    <Tag color="cyan" style={{ fontSize: fontSizeMd }}>{record.portCode}</Tag>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Tên cảng</Typography.Text>
                    <br />
                    <Typography.Text style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium }}>{record.portName}</Typography.Text>
                  </Col>
                  <Col xs={24} sm={5}>
                    <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Tỉnh/TP</Typography.Text>
                    <br />
                    <Typography.Text style={{ fontSize: fontSizeMd }}>{record.province || '—'}</Typography.Text>
                  </Col>
                  <Col xs={12} sm={3}>
                    <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Trạng thái</Typography.Text>
                    <br />
                    {renderPortStatusBadge(record.portStatus)}
                  </Col>
                  <Col xs={12} sm={2}>
                    <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Ngày tạo</Typography.Text>
                    <br />
                    <Typography.Text style={{ fontSize: fontSizeSm }}>{formatDate(record.createdAt)}</Typography.Text>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
