import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Form,
  Button,
  Input,
  InputNumber,
  DatePicker,
  Card,
  Spin,
  Empty,
  Descriptions,
  Space,
  message,
  Breadcrumb,
} from 'antd';
import dayjs from 'dayjs';
import { luongHangHaiCRUD, luongHangHaiApproval } from '../../services/luongHangHaiService';
import type {
  LuongHangHaiResponse,
  CreateLuongHangHaiRequest,
  UpdateLuongHangHaiRequest,
  PheDuyetRequest,
  ApprovalStatus,
} from '../../types/luongHangHai';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

export default function LuongHangHaiForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isEditMode = searchParams.get('mode') === 'edit';
  const isDetailMode = !!id && !isEditMode;
  const isCreateMode = !id;

  const [record, setRecord] = useState<LuongHangHaiResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
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
          const data = await luongHangHaiCRUD.getById(id);
          setRecord(data);
          if (!isEditMode) {
            form.setFieldsValue({
              loaiTau: data.loaiTau,
              soLuong: data.soLuong,
              ngayGhiNhan: data.ngayGhiNhan ? dayjs(data.ngayGhiNhan) : null,
              gioDien: data.gioDien,
              taiTrong: data.taiTrong,
              dienTichDangBo: data.dienTichDangBo,
              ghiChu: data.ghiChu,
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
          const hist = await luongHangHaiApproval.getHistory(id);
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
      const payload = {
        loaiTau: values.loaiTau,
        soLuong: values.soLuong,
        ngayGhiNhan: values.ngayGhiNhan ? values.ngayGhiNhan.format('YYYY-MM-DD') : undefined,
        gioDien: values.gioDien,
        taiTrong: values.taiTrong,
        dienTichDangBo: values.dienTichDangBo,
        ghiChu: values.ghiChu,
      };

      if (isCreateMode) {
        const newRecord = await luongHangHaiCRUD.create(payload as CreateLuongHangHaiRequest);
        message.success('Tạo mới thành công');
        navigate(`/luong-hang-hai/${newRecord.id}`);
      } else if (id && isEditMode) {
        await luongHangHaiCRUD.update(id, payload as UpdateLuongHangHaiRequest);
        message.success('Cập nhật thành công');
        navigate(`/luong-hang-hai/${id}`);
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
        // C1 approval: PROPOSED/REJECTED → UNDER_REVIEW
        // Backend: if trangThai=="APPROVED" → UNDER_REVIEW, else → REJECTED
        const pheDuyetData: PheDuyetRequest = {
          nguoiPheDuyet: currentUser?.username || 'unknown',
          trangThai: 'APPROVED',
        };
        await luongHangHaiApproval.approveC1(id, pheDuyetData);
        message.success('Phê duyệt C1 thành công');
        setRecord({ ...record, approvalStatus: 'UNDER_REVIEW' });
      } else if (action === 'approveC2') {
        // C2 approval: UNDER_REVIEW → APPROVED
        // Backend: if trangThai=="APPROVED" → APPROVED, else → REJECTED
        const pheDuyetData: PheDuyetRequest = {
          nguoiPheDuyet: currentUser?.username || 'unknown',
          trangThai: 'APPROVED',
        };
        await luongHangHaiApproval.approveC2(id, pheDuyetData);
        message.success('Phê duyệt C2 thành công');
        setRecord({ ...record, approvalStatus: 'APPROVED' });
      } else if (action === 'reject') {
        // Reject: route to approveC1 or approveC2 based on current status
        // PROPOSED/REJECTED → use approveC1 with trangThai="REJECTED"
        // UNDER_REVIEW → use approveC2 with trangThai="REJECTED"
        const pheDuyetData: PheDuyetRequest = {
          nguoiPheDuyet: currentUser?.username || 'unknown',
          trangThai: 'REJECTED',
          lyDo: payload?.lyDo as string,
        };

        if (record.approvalStatus === 'PROPOSED' || record.approvalStatus === 'REJECTED') {
          await luongHangHaiApproval.approveC1(id, pheDuyetData);
        } else if (record.approvalStatus === 'UNDER_REVIEW') {
          await luongHangHaiApproval.approveC2(id, pheDuyetData);
        }

        message.success('Từ chối thành công');
        setRecord({ ...record, approvalStatus: 'REJECTED', lyDoTuChoi: payload?.lyDo as string });
      } else if (action === 'delete') {
        await luongHangHaiCRUD.delete(id);
        message.success('Xóa thành công');
        navigate('/luong-hang-hai');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Luồng hàng hải', onClick: () => navigate('/luong-hang-hai') },
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
          <Button onClick={() => navigate('/luong-hang-hai')} style={{ marginTop: '16px' }}>
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
          <h2>Chi tiết Luồng Hàng Hải</h2>
          {record && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Loại tàu">{record.loaiTau}</Descriptions.Item>
              <Descriptions.Item label="Số lượng">{record.soLuong ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày ghi nhận">
                {record.ngayGhiNhan ? dayjs(record.ngayGhiNhan).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Giờ điện">{record.gioDien ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Tải trọng (DWT)">{record.taiTrong ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Diện tích đăng bộ">{record.dienTichDangBo ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {record.ghiChu ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <ApprovalStatusBadge status={record.approvalStatus} />
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
              currentStatus={record.approvalStatus as ApprovalStatus}
              permissions={userPermissions}
              entityPermissionPrefix="luonghanghai"
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
                luongHangHaiApproval
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
        <h2>{isCreateMode ? 'Tạo mới Luồng Hàng Hải' : 'Chỉnh sửa Luồng Hàng Hải'}</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
        >
          <Form.Item
            label="Loại tàu"
            name="loaiTau"
            rules={[{ required: true, message: 'Vui lòng nhập loại tàu' }]}
          >
            <Input placeholder="Nhập loại tàu" />
          </Form.Item>

          <Form.Item
            label="Số lượng"
            name="soLuong"
            rules={[
              { pattern: /^\d+$/, message: 'Phải là số nguyên' },
            ]}
          >
            <InputNumber min={0} placeholder="Nhập số lượng" />
          </Form.Item>

          <Form.Item
            label="Ngày ghi nhận"
            name="ngayGhiNhan"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (dayjs(value).isAfter(dayjs())) {
                    return Promise.reject(new Error('Ngày ghi nhận không được là ngày tương lai'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker placeholder="Chọn ngày ghi nhận" />
          </Form.Item>

          <Form.Item label="Giờ điện" name="gioDien">
            <Input placeholder="Nhập giờ điện" />
          </Form.Item>

          <Form.Item
            label="Tải trọng (DWT)"
            name="taiTrong"
            rules={[{ pattern: /^\d+(\.\d+)?$/, message: 'Phải là số' }]}
          >
            <InputNumber min={0} placeholder="Nhập tải trọng" />
          </Form.Item>

          <Form.Item
            label="Diện tích đăng bộ"
            name="dienTichDangBo"
            rules={[{ pattern: /^\d+(\.\d+)?$/, message: 'Phải là số' }]}
          >
            <InputNumber min={0} placeholder="Nhập diện tích đăng bộ" />
          </Form.Item>

          <Form.Item label="Ghi chú" name="ghiChu">
            <Input.TextArea
              placeholder="Nhập ghi chú"
              maxLength={500}
              showCount
              rows={4}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
              </Button>
              <Button onClick={() => navigate('/luong-hang-hai')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
