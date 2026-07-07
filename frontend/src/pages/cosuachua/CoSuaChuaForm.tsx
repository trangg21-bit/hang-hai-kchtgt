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
import { coSuaChuaCRUD, coSuaChuaApproval } from '../../services/coSuaChuaService';
import type {
  CoSuaChuaResponse,
  CreateCoSuaChuaRequest,
  UpdateCoSuaChuaRequest,
  PheDuyetRequest,
} from '../../types/coSuaChua';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

export default function CoSuaChuaForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isEditMode = searchParams.get('mode') === 'edit';
  const isDetailMode = !!id && !isEditMode;
  const isCreateMode = !id;

  const [record, setRecord] = useState<CoSuaChuaResponse | null>(null);
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
          const data = await coSuaChuaCRUD.getById(id);
          setRecord(data);
          if (!isEditMode) {
            form.setFieldsValue({
              tenCoSo: data.tenCoSo,
              diaChi: data.diaChi,
              tinhThanh: data.tinhThanh,
              soDienThoai: data.soDienThoai,
              email: data.email,
              loaiCoSo: data.loaiCoSo,
              khaNang: data.khaNang,
              chuQuan: data.chuQuan,
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
          const hist = await coSuaChuaApproval.getHistory(id);
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
        tenCoSo: values.tenCoSo,
        diaChi: values.diaChi,
        tinhThanh: values.tinhThanh,
        soDienThoai: values.soDienThoai,
        email: values.email,
        loaiCoSo: values.loaiCoSo,
        khaNang: values.khaNang,
        chuQuan: values.chuQuan,
      };

      if (isCreateMode) {
        const newRecord = await coSuaChuaCRUD.create(payload as CreateCoSuaChuaRequest);
        message.success('Tạo mới thành công');
        navigate(`/co-so-sua-chua/${newRecord.id}`);
      } else if (id && isEditMode) {
        await coSuaChuaCRUD.update(id, payload as UpdateCoSuaChuaRequest);
        message.success('Cập nhật thành công');
        navigate(`/co-so-sua-chua/${id}`);
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
          lyDo: undefined,
        };
        await coSuaChuaApproval.approveC1(id, pheDuyetData);
        message.success('Phê duyệt C1 thành công');
        setRecord({ ...record, trangThai: 'UNDER_REVIEW' });
      } else if (action === 'approveC2') {
        const pheDuyetData: PheDuyetRequest = {
          quyetDinh: 'APPROVED',
          lyDo: undefined,
        };
        await coSuaChuaApproval.approveC2(id, pheDuyetData);
        message.success('Phê duyệt C2 thành công');
        setRecord({ ...record, trangThai: 'APPROVED' });
      } else if (action === 'reject') {
        const pheDuyetData: PheDuyetRequest = {
          quyetDinh: 'REJECTED',
          lyDo: payload?.lyDo as string,
        };

        if (record.trangThai === 'PROPOSED' || record.trangThai === 'REJECTED') {
          await coSuaChuaApproval.approveC1(id, pheDuyetData);
        } else if (record.trangThai === 'UNDER_REVIEW') {
          await coSuaChuaApproval.approveC2(id, pheDuyetData);
        }

        message.success('Từ chối thành công');
        setRecord({
          ...record,
          trangThai: 'REJECTED',
          lyDoTuChoi: payload?.lyDo as string,
        });
      } else if (action === 'delete') {
        await coSuaChuaCRUD.delete(id);
        message.success('Xóa thành công');
        navigate('/co-so-sua-chua');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Cơ sở sửa chữa & đóng tàu', onClick: () => navigate('/co-so-sua-chua') },
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
          <Button onClick={() => navigate('/co-so-sua-chua')} style={{ marginTop: '16px' }}>
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
          <h2>Chi tiết Cơ sở Sửa chữa / Đóng tàu</h2>
          {record && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Tên cơ sở">{record.tenCoSo}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">{record.diaChi}</Descriptions.Item>
              <Descriptions.Item label="Tỉnh/thành">{record.tinhThanh}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {record.soDienThoai ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {record.email ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Loại cơ sở">{record.loaiCoSo}</Descriptions.Item>
              <Descriptions.Item label="Khả năng" span={2}>
                {record.khaNang ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Chủ quản">
                {record.chuQuan ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <ApprovalStatusBadge status={record.trangThai} />
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
              currentStatus={record.trangThai as any}
              permissions={userPermissions}
              entityPermissionPrefix="cosuachua"
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
                coSuaChuaApproval
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
        <h2>{isCreateMode ? 'Tạo mới Cơ sở Sửa chữa' : 'Chỉnh sửa Cơ sở Sửa chữa'}</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
        >
          <Form.Item
            label="Tên cơ sở"
            name="tenCoSo"
            rules={[{ required: true, message: 'Vui lòng nhập tên cơ sở' }]}
          >
            <Input placeholder="Nhập tên cơ sở" />
          </Form.Item>

          <Form.Item
            label="Địa chỉ"
            name="diaChi"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Form.Item
            label="Tỉnh/thành"
            name="tinhThanh"
            rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành' }]}
          >
            <Input placeholder="Nhập tỉnh/thành" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="soDienThoai"
            rules={[
              {
                pattern: /^[0-9+\-\s()]{6,15}$/,
                message: 'Số điện thoại không hợp lệ',
              },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                type: 'email',
                message: 'Email không hợp lệ',
              },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            label="Loại cơ sở"
            name="loaiCoSo"
            rules={[{ required: true, message: 'Vui lòng chọn loại cơ sở' }]}
          >
            <Select
              placeholder="Chọn loại cơ sở"
              options={[
                { label: 'Cơ sở sửa chữa', value: 'CS_SUA_CHUA' },
                { label: 'Cơ sở đóng tàu', value: 'CS_DONG_TAU' },
                { label: 'Cơ sở sửa chữa & đóng tàu', value: 'CS_SUA_CHUA_DONG_TAU' },
                { label: 'Khác', value: 'KAC' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Khả năng"
            name="khaNang"
          >
            <Input.TextArea
              placeholder="Mô tả khả năng cơ sở"
              rows={4}
            />
          </Form.Item>

          <Form.Item label="Chủ quản" name="chuQuan">
            <Input placeholder="Nhập chủ quản" />
          </Form.Item>

          <Form.Item label="Tài liệu đính kèm">
            <AttachmentList
              attachments={record?.attachments || []}
              readonly={false}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
              </Button>
              <Button onClick={() => navigate('/co-so-sua-chua')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
