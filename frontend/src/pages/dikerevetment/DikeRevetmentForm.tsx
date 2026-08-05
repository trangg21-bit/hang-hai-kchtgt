import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  Card,
  Spin,
  Empty,
  Descriptions,
  Space,
  Breadcrumb,
  Modal,
  DatePicker,
} from 'antd';
import toast from '../../components/ToastNotification';
import { dikeRevetmentCRUD, dikeRevetmentApproval } from '../../services/dikeRevetmentService';
import { organizationService } from '../../services/organizationService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type {
  DikeRevetmentResponse,
  CreateDikeRevetmentRequest,
  UpdateDikeRevetmentRequest,
  ApprovalRequest,
  ApprovalStatus,
} from '../../types/dikeRevetment';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

const DIKE_REVETMENT_TYPE_MAP: Record<string, string> = {
  'RIVER_DIKE': 'Đê chắn sóng',
  'SAND_DIKE': 'Đê chắn cát',
  'FLOW_GUIDE_REVETMENT': 'Kè hướng dòng',
  'BANK_PROTECTION_REVETMENT': 'Kè bảo vệ bờ',
  'TRAFFIC': 'Giao thông',
  'WAVE_BREAK_REVETMENT': 'Kè chắn sóng',
  'SAND_BREAK_REVETMENT': 'Kè chắn cát',
};

const STATUS_MAP: Record<string, string> = {
  '1': 'Chưa khai thác/vận hành',
  '2': 'Đang khai thác/vận hành',
  '3': 'Dừng khai thác/vận hành',
};

export interface DikeRevetmentFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function DikeRevetmentForm({ open, editId, mode, onCancel, onSuccess }: DikeRevetmentFormProps = {}) {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isIframe = window.self !== window.top;
  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeId;
  const isEditMode = isModalMode ? mode === 'edit' : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? mode === 'detail' : (!!id && !isEditMode);
  const isCreateMode = isModalMode ? mode === 'create' : !id;

  const [record, setRecord] = useState<DikeRevetmentResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    if (isDetailMode) return;
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        setOrganizations(resp.data || []);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    })();
  }, [isDetailMode]);

  useEffect(() => {
    if (open) {
      setHasChanges(false);
    }
  }, [open]);

  // Fetch detail data
  useEffect(() => {
    if (id) {
      const loadData = async () => {
        setIsLoading(true);
        setFormError(null);
        try {
          const data = await dikeRevetmentCRUD.getById(id);
          setRecord(data);
          form.setFieldsValue({
            dikeRevetmentType: data.dikeRevetmentType,
            location: data.location,
            dikeRevetmentName: data.dikeRevetmentName,
            length: data.length,
            crestElevation: data.crestElevation,
            commissioningDate: data.commissioningDate ? dayjs(data.commissioningDate) : null,
            height: data.height,
            surfaceMaterial: data.surfaceMaterial,
            status: data.status,
            note: data.note,
            orgUnitId: data.orgUnitId,
            spatialData: {
              loaiHinhHoc: data.loaiHinhHoc,
              toaDo: data.toaDo,
              bieuTuongId: data.bieuTuongId,
            }
          });
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
          const hist = await dikeRevetmentApproval.getHistory(id);
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
      const spatialData = values.spatialData;
      const payload: CreateDikeRevetmentRequest = {
        dikeRevetmentType: values.dikeRevetmentType,
        location: values.location,
        dikeRevetmentName: values.dikeRevetmentName,
        length: values.length,
        crestElevation: values.crestElevation,
        commissioningDate: values.commissioningDate || undefined,
        height: values.height,
        surfaceMaterial: values.surfaceMaterial,
        status: values.status,
        orgUnitId: values.orgUnitId,
        loaiHinhHoc: spatialData?.loaiHinhHoc,
        toaDo: spatialData?.toaDo,
        bieuTuongId: spatialData?.bieuTuongId,
      };
      if (values.note !== undefined) {
        (payload as any).note = values.note;
      }

      if (isCreateMode) {
        await dikeRevetmentCRUD.create(payload);
        toast.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/dike-revetment');
        }
      } else if (id && isEditMode) {
        await dikeRevetmentCRUD.update(id, payload as UpdateDikeRevetmentRequest);
        toast.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/dike-revetment');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
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
        const pheDuyetData: ApprovalRequest = {
          approver: currentUser?.username || 'unknown',
          decision: 'APPROVED',
        };
        await dikeRevetmentApproval.approveC1(id, pheDuyetData);
        toast.success('Phê duyệt C1 thành công');
        setRecord({ ...record, approvalStatus: 'UNDER_REVIEW' });
        setHasChanges(true);
      } else if (action === 'approveC2') {
        const pheDuyetData: ApprovalRequest = {
          approver: currentUser?.username || 'unknown',
          decision: 'APPROVED',
        };
        await dikeRevetmentApproval.approveC2(id, pheDuyetData);
        toast.success('Phê duyệt C2 thành công');
        setRecord({ ...record, approvalStatus: 'APPROVED' });
        setHasChanges(true);
      } else if (action === 'reject') {
        const pheDuyetData: ApprovalRequest = {
          approver: currentUser?.username || 'unknown',
          decision: 'REJECTED',
          reason: payload?.reason as string,
        };

        if (record.approvalStatus === 'PROPOSED' || record.approvalStatus === 'REJECTED') {
          await dikeRevetmentApproval.approveC1(id, pheDuyetData);
        } else if (record.approvalStatus === 'UNDER_REVIEW') {
          await dikeRevetmentApproval.approveC2(id, pheDuyetData);
        }

        toast.success('Từ chối thành công');
        setRecord({
          ...record,
          approvalStatus: 'REJECTED',
          rejectionReason: payload?.reason as string,
        });
        setHasChanges(true);
      } else if (action === 'delete') {
        await dikeRevetmentCRUD.delete(id);
        toast.success('Xóa thành công');
        if (isModalMode && onSuccess) {
          onSuccess();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/dike-revetment');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (hasChanges && onSuccess) {
      onSuccess();
    } else if (onCancel) {
      onCancel();
    }
  };

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Đê/Kè', onClick: () => navigate('/dike-revetment') },
    { title: isCreateMode ? 'Tạo mới' : isEditMode ? 'Chỉnh sửa' : 'Chi tiết' },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Spin fullscreen description="Đang tải..." />
      </div>
    );
  }

  if (formError) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Empty description={formError} style={{ marginTop: '50px' }} />
          <Button onClick={() => navigate('/dike-revetment')} style={{ marginTop: '16px' }}>
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  // Detail/Read-only view
  if (isDetailMode) {
    const detailContent = (
      <>
        <Card style={{ marginBottom: '24px' }}>
          <h2>Chi tiết Đê/Kè</h2>
          {record && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Loại đê">{DIKE_REVETMENT_TYPE_MAP[record.dikeRevetmentType] || record.dikeRevetmentType}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{record.location}</Descriptions.Item>
              <Descriptions.Item label="Tên đê kè">{record.dikeRevetmentName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Chiều dài (m)">
                {record.length !== undefined ? record.length.toFixed(2) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cao trình đỉnh (m)">
                {record.crestElevation !== undefined ? record.crestElevation.toFixed(2) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời điểm đưa vào khai thác">
                {record.commissioningDate ? dayjs(record.commissioningDate).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Chiều cao (m)">
                {record.height !== undefined ? record.height.toFixed(2) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Mặt vật liệu">
                {record.surfaceMaterial ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tình trạng">
                {STATUS_MAP[record.status] || record.status || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {record.note ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn vị quản lý" span={2}>
                {record.orgUnitName || record.orgUnitId || '—'}
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
              entityPermissionPrefix="dikerevetment"
              currentUserId={currentUser?.username}
              nguoiPheDuyetC1={record.approverLevel1}
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
                dikeRevetmentApproval
                  .getHistory(id)
                  .then(setHistory)
                  .catch((err) => setHistoryError(err instanceof Error ? err.message : 'Lỗi'))
                  .finally(() => setIsLoadingHistory(false));
              }}
            />
          </Card>
        )}
      </>
    );

    if (isModalMode) {
      return (
        <Modal
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Chi tiết Đê/Kè</span>}
          open={open}
          onCancel={handleCloseModal}
          footer={null}
          width={900}
          destroyOnClose
          mask={{ closable: false }}
        >
          <Spin spinning={isLoading}>
            {detailContent}
          </Spin>
        </Modal>
      );
    }

    return (
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />
        {detailContent}
      </div>
    );
  }

  const formContent = (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmitForm}
      autoComplete="off"
    >
      <Form.Item
        label="Loại đê"
        name="dikeRevetmentType"
        rules={[{ required: true, message: 'Vui lòng nhập loại đê' }]}
      >
        <Select
          placeholder="Chọn loại đê"
          options={[
            { label: 'Đê chắn sóng', value: 'RIVER_DIKE' },
            { label: 'Đê chắn cát', value: 'SAND_DIKE' },
            { label: 'Kè hướng dòng', value: 'FLOW_GUIDE_REVETMENT' },
            { label: 'Kè bảo vệ bờ', value: 'BANK_PROTECTION_REVETMENT' },
            { label: 'Giao thông', value: 'TRAFFIC' },
            { label: 'Kè chắn sóng', value: 'WAVE_BREAK_REVETMENT' },
            { label: 'Kè chắn cát', value: 'SAND_BREAK_REVETMENT' },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Vị trí"
        name="location"
        rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
      >
        <Input placeholder="Nhập vị trí" />
      </Form.Item>

      <Form.Item
        label="Tên đê kè"
        name="dikeRevetmentName"
        rules={[{ required: true, message: 'Vui lòng nhập tên đê kè' }]}
      >
        <Input placeholder="Nhập tên đê kè" />
      </Form.Item>

      <Form.Item
        label="Chiều dài (m)"
        name="length"
        rules={[
          {
            validator: (_, value) => {
              if (!value && value !== 0) return Promise.resolve();
              if (value < 0) return Promise.reject(new Error('Phải >= 0'));
              return Promise.resolve();
            },
          },
        ]}
      >
        <InputNumber
          min={0}
          placeholder="Nhập chiều dài"
          style={{ width: '100%' }}
          precision={2}
        />
      </Form.Item>

      <Form.Item
        label="Cao trình đỉnh (m)"
        name="crestElevation"
      >
        <InputNumber
          placeholder="Nhập cao trình đỉnh"
          style={{ width: '100%' }}
          precision={2}
        />
      </Form.Item>

      <Form.Item
        label="Thời điểm đưa vào khai thác"
        name="commissioningDate"
        getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
        normalize={(value) => value ? value.format('YYYY-MM-DD') : null}
      >
        <DatePicker
          placeholder="Chọn ngày"
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
        />
      </Form.Item>

      <Form.Item
        label="Chiều cao (m)"
        name="height"
        rules={[
          {
            validator: (_, value) => {
              if (!value && value !== 0) return Promise.resolve();
              if (value < 0) return Promise.reject(new Error('Phải >= 0'));
              return Promise.resolve();
            },
          },
        ]}
      >
        <InputNumber
          min={0}
          placeholder="Nhập chiều cao"
          style={{ width: '100%' }}
          precision={2}
        />
      </Form.Item>

      <Form.Item label="Mặt vật liệu" name="surfaceMaterial">
        <Input placeholder="Nhập mặt vật liệu" />
      </Form.Item>

      <Form.Item label="Tình trạng" name="status">
        <Select
          placeholder="Chọn tình trạng"
          options={[
            { label: 'Chưa khai thác/vận hành', value: '1' },
            { label: 'Đang khai thác/vận hành', value: '2' },
            { label: 'Dừng khai thác/vận hành', value: '3' },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Đơn vị quản lý"
        name="orgUnitId"
      >
        <Select
          placeholder="Chọn đơn vị quản lý"
          allowClear
          options={organizations.map((org) => ({
            value: org.id,
            label: org.code ? `${org.code} - ${org.name}` : org.name,
          }))}
        />
      </Form.Item>

      <Form.Item
        label="Ghi chú"
        name="note"
      >
        <Input.TextArea
          placeholder="Nhập ghi chú"
          maxLength={500}
          showCount
          rows={4}
        />
      </Form.Item>

      <Form.Item label="Vị trí/Hình vẽ bản đồ" name="spatialData">
        <GisLocationSelector defaultGeometryType="LINE" />
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
          <Button onClick={isModalMode ? onCancel : (isIframe ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*') : () => navigate('/dike-revetment'))}>
            Hủy
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  if (isModalMode) {
    return (
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isCreateMode ? 'Tạo mới Đê/Kè' : 'Chỉnh sửa Đê/Kè'}</span>}
        open={open}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
        mask={{ closable: false }}
      >
        <Spin spinning={isLoading}>
          {formContent}
        </Spin>
      </Modal>
    );
  }

  // Create/Edit form view
  return (
    <div style={isIframe ? { padding: '16px 24px', background: '#fff', minHeight: '100vh' } : { padding: '24px' }}>
      {!isIframe && <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />}
      <Card
        style={isIframe ? { border: 'none', boxShadow: 'none', padding: 0 } : { maxWidth: '800px' }}
        styles={isIframe ? { body: { padding: 0 } } : undefined}
      >
        {!isIframe && <h2>{isCreateMode ? 'Tạo mới Đê/Kè' : 'Chỉnh sửa Đê/Kè'}</h2>}
        {formContent}
      </Card>
    </div>
  );
}

