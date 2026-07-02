import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Form,
  Button,
  Input,
  Select,
  Card,
  Spin,
  Empty,
  Descriptions,
  Space,
  message,
  Breadcrumb,
} from 'antd';
import dayjs from 'dayjs';
import { heThongVTSCRUD, heThongVTSApproval } from '../../services/heThongVtsService';
import type {
  HeThongVTSResponse,
  CreateHeThongVTSRequest,
  UpdateHeThongVTSRequest,
  PheDuyetRequest,
  HistoryEntry,
} from '../../types/heThongVts';

type ApprovalStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

export default function HeThongVTSForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isEditMode = searchParams.get('mode') === 'edit';
  const isDetailMode = !!id && !isEditMode;
  const isCreateMode = !id;

  const [record, setRecord] = useState<HeThongVTSResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch detail data
  useEffect(() => {
    if (id) {
      const loadData = async () => {
        setIsLoading(true);
        setFormError(null);
        try {
          const data = await heThongVTSCRUD.getById(id);
          setRecord(data);
          if (!isEditMode) {
            form.setFieldsValue({
              tenHeThong: data.tenHeThong,
              viTri: data.viTri,
              tinhTrang: data.tinhTrang,
              mucDoPhuTrach: data.mucDoPhuTrach,
              nguonGoc: data.nguonGoc,
              doiTac: data.doiTac,
            });
          }
        } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [id, isEditMode, form]);

  // Fetch history
  useEffect(() => {
    if (id && isDetailMode) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          const hist = await heThongVTSApproval.getHistory(id);
          setHistory(hist);
        } catch (err) {
          setHistoryError(err instanceof Error ? err.message : 'Không tải được lịch sử');
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [id, isDetailMode]);

  const handleSubmitForm = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload: CreateHeThongVTSRequest | UpdateHeThongVTSRequest = {
        tenHeThong: values.tenHeThong,
        viTri: values.viTri,
        tinhTrang: values.tinhTrang,
        mucDoPhuTrach: values.mucDoPhuTrach,
        nguonGoc: values.nguonGoc,
        doiTac: values.doiTac,
      };

      if (isCreateMode) {
        const newRecord = await heThongVTSCRUD.create(payload as CreateHeThongVTSRequest);
        message.success('Tạo mới thành công');
        navigate(`/he-thong-vts/${newRecord.id}`);
      } else if (id && isEditMode) {
        await heThongVTSCRUD.update(id, payload as UpdateHeThongVTSRequest);
        message.success('Cập nhật thành công');
        navigate(`/he-thong-vts/${id}`);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalAction = async (
    action: 'approveC1' | 'approveC2' | 'reject' | 'delete',
    payload?: Record<string, unknown>
  ) => {
    if (!id || !record) return;

    setIsSubmitting(true);
    try {
      if (action === 'approveC1') {
        const pheDuyetData: PheDuyetRequest = {
          quyetDinh: 'APPROVED',
        };
        const updated = await heThongVTSApproval.approveC1(id, pheDuyetData);
        message.success('Phê duyệt C1 thành công');
        setRecord(updated);
      } else if (action === 'approveC2') {
        const pheDuyetData: PheDuyetRequest = {
          quyetDinh: 'APPROVED',
        };
        const updated = await heThongVTSApproval.approveC2(id, pheDuyetData);
        message.success('Phê duyệt C2 thành công');
        setRecord(updated);
      } else if (action === 'reject') {
        const pheDuyetData: PheDuyetRequest = {
          quyetDinh: 'REJECTED',
          lyDo: payload?.lyDo as string,
        };

        if (record.trangThai === 'PROPOSED' || record.trangThai === 'REJECTED') {
          await heThongVTSApproval.approveC1(id, pheDuyetData);
        } else if (record.trangThai === 'UNDER_REVIEW') {
          await heThongVTSApproval.approveC2(id, pheDuyetData);
        }

        message.success('Từ chối thành công');
        const updated = { ...record, lyDoTuChoi: payload?.lyDo as string };
        setRecord(updated);
      } else if (action === 'delete') {
        await heThongVTSCRUD.delete(id);
        message.success('Xóa thành công');
        navigate('/he-thong-vts');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Hệ thống VTS', onClick: () => navigate('/he-thong-vts') },
    { title: isCreateMode ? 'Tạo mới' : isEditMode ? 'Chỉnh sửa' : 'Chi tiết' },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Spin fullscreen tip="Đang tải..." />
      </div>
    );
  }

  if (formError) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Empty description={formError} style={{ marginTop: '50px' }} />
          <Button onClick={() => navigate('/he-thong-vts')} style={{ marginTop: '16px' }}>
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  // Detail/Read-only view
  if (isDetailMode) {
    return (
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />
        <Card style={{ marginBottom: '24px' }}>
          <h2>Chi tiết Hệ thống VTS</h2>
          {record && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Tên hệ thống">{record.tenHeThong ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{record.viTri}</Descriptions.Item>
              <Descriptions.Item label="Tình trạng">{record.tinhTrang ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Mức độ phủ trách">{record.mucDoPhuTrach ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Nguồn gốc">{record.nguonGoc ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Đối tác">{record.doiTac ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <ApprovalStatusBadge status={record.trangThai} />
              </Descriptions.Item>
              {record.lyDoTuChoi && (
                <Descriptions.Item label="Lý do từ chối" span={2}>
                  {record.lyDoTuChoi}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Người tạo">{record.nguoiTao ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {record.ngayTao ? dayjs(record.ngayTao).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>

        {/* Tài liệu đính kèm */}
        {record?.attachments && record.attachments.length > 0 && (
          <Card style={{ marginBottom: '24px' }}>
            <h3>Tài liệu đính kèm</h3>
            <AttachmentList attachments={record.attachments} readonly={true} />
          </Card>
        )}

        {/* Approval Action Bar */}
        {record && (
          <Card style={{ marginBottom: '24px' }}>
            <ApprovalActionBar
              currentStatus={record.trangThai as ApprovalStatus}
              permissions={userPermissions}
              entityPermissionPrefix="vts"
              currentUserId={currentUser?.username}
              nguoiPheDuyetC1={record.nguoiPheDuyetC1}
              onAction={handleApprovalAction}
              loading={isSubmitting}
            />
          </Card>
        )}

        {/* History Timeline */}
        {record && (
          <Card>
            <h3>Lịch sử phê duyệt</h3>
            <HistoryTimeline
              history={history}
              loading={isLoadingHistory}
              error={historyError || undefined}
              onRetry={() => {
                setIsLoadingHistory(true);
                setHistoryError(null);
                heThongVTSApproval
                  .getHistory(id)
                  .then(setHistory)
                  .catch((err) => setHistoryError(err instanceof Error ? err.message : 'Lỗi'))
                  .finally(() => setIsLoadingHistory(false));
              }}
            />
          </Card>
        )}
      </div>
    );
  }

  // Create/Edit form view
  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />
      <Card style={{ maxWidth: '800px' }}>
        <h2>{isCreateMode ? 'Tạo mới Hệ thống VTS' : 'Chỉnh sửa Hệ thống VTS'}</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
        >
          <Form.Item
            label="Tên hệ thống"
            name="tenHeThong"
          >
            <Input placeholder="Nhập tên hệ thống" />
          </Form.Item>

          <Form.Item
            label="Vị trí"
            name="viTri"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
          >
            <Input placeholder="Nhập vị trí" />
          </Form.Item>

          <Form.Item
            label="Tình trạng"
            name="tinhTrang"
          >
            <Select
              placeholder="Chọn tình trạng"
              options={[
                { label: 'Tốt', value: 'Tốt' },
                { label: 'Xuống cấp', value: 'Xuống cấp' },
                { label: 'Hư hỏng', value: 'Hư hỏng' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Mức độ phủ trách"
            name="mucDoPhuTrach"
          >
            <Input placeholder="Nhập mức độ phủ trách" />
          </Form.Item>

          <Form.Item
            label="Nguồn gốc"
            name="nguonGoc"
          >
            <Input placeholder="Nhập nguồn gốc" />
          </Form.Item>

          <Form.Item
            label="Đối tác"
            name="doiTac"
          >
            <Input placeholder="Nhập đối tác" />
          </Form.Item>

          <Form.Item
            label="Tài liệu đính kèm"
            name="attachments"
          >
            <AttachmentList readonly={isDetailMode} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
              </Button>
              <Button onClick={() => navigate('/he-thong-vts')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
