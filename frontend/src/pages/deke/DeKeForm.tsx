import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  message,
  Breadcrumb,
  Modal,
} from 'antd';
import { dekeCRUD, deKeApproval } from '../../services/deKeService';
import { organizationService } from '../../services/organizationService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type {
  DeKeResponse,
  CreateDeKeRequest,
  UpdateDeKeRequest,
  PheDuyetRequest,
  ApprovalStatus,
  LoaiDe,
} from '../../types/deKe';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

const LOAI_DE_MAP: Record<string, string> = {
  'DE_DAT': 'Đê đất',
  'DE_BETONG': 'Đê bê tông',
  'KE_DA': 'Kè đá',
  'KE_BETONG': 'Kè bê tông',
  'KHAC': 'Khác',
};

const TINH_TRANG_MAP: Record<string, string> = {
  'TOT': 'Tốt',
  'XUONG_CAP': 'Xuống cấp',
  'HU_HOng': 'Hư hỏng',
  'HU_HOING': 'Hư hỏng',
  'HU_HONG': 'Hư hỏng',
};

export interface DeKeFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function DeKeForm({ open, editId, mode, onCancel, onSuccess }: DeKeFormProps = {}) {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeId;
  const isEditMode = isModalMode ? mode === 'edit' : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? mode === 'detail' : (!!id && !isEditMode);
  const isCreateMode = isModalMode ? mode === 'create' : !id;

  const [record, setRecord] = useState<DeKeResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        setOrganizations(resp.data || []);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    })();
  }, []);

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
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await dekeCRUD.getById(id);
          setRecord(data);
          form.setFieldsValue({
            loaiDe: data.loaiDe,
            viTri: data.viTri,
            chieuDai: data.chieuDai,
            chieuRong: data.chieuRong,
            chieuCao: data.chieuCao,
            matVatLieu: data.matVatLieu,
            tinhTrang: data.tinhTrang,
            ghiChu: data.ghiChu,
            donViId: data.donViId,
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
          const hist = await deKeApproval.getHistory(id);
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
      const payload: CreateDeKeRequest = {
        loaiDe: values.loaiDe,
        viTri: values.viTri,
        chieuDai: values.chieuDai,
        chieuRong: values.chieuRong,
        chieuCao: values.chieuCao,
        matVatLieu: values.matVatLieu,
        tinhTrang: values.tinhTrang,
        donViId: values.donViId,
        loaiHinhHoc: spatialData?.loaiHinhHoc,
        toaDo: spatialData?.toaDo,
        bieuTuongId: spatialData?.bieuTuongId,
      };
      if (values.ghiChu !== undefined) {
        (payload as any).ghiChu = values.ghiChu;
      }

      if (isCreateMode) {
        await dekeCRUD.create(payload);
        message.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else {
          navigate('/de-ke');
        }
      } else if (id && isEditMode) {
        await dekeCRUD.update(id, payload as UpdateDeKeRequest);
        message.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else {
          navigate('/de-ke');
        }
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
          nguoiPheDuyet: currentUser?.username || 'unknown',
          quyetDinh: 'APPROVED',
        };
        await deKeApproval.approveC1(id, pheDuyetData);
        message.success('Phê duyệt C1 thành công');
        setRecord({ ...record, trangThaiPheDuyet: 'UNDER_REVIEW' });
        setHasChanges(true);
      } else if (action === 'approveC2') {
        const pheDuyetData: PheDuyetRequest = {
          nguoiPheDuyet: currentUser?.username || 'unknown',
          quyetDinh: 'APPROVED',
        };
        await deKeApproval.approveC2(id, pheDuyetData);
        message.success('Phê duyệt C2 thành công');
        setRecord({ ...record, trangThaiPheDuyet: 'APPROVED' });
        setHasChanges(true);
      } else if (action === 'reject') {
        const pheDuyetData: PheDuyetRequest = {
          nguoiPheDuyet: currentUser?.username || 'unknown',
          quyetDinh: 'REJECTED',
          lyDo: payload?.lyDo as string,
        };

        if (record.trangThaiPheDuyet === 'PROPOSED' || record.trangThaiPheDuyet === 'REJECTED') {
          await deKeApproval.approveC1(id, pheDuyetData);
        } else if (record.trangThaiPheDuyet === 'UNDER_REVIEW') {
          await deKeApproval.approveC2(id, pheDuyetData);
        }

        message.success('Từ chối thành công');
        setRecord({
          ...record,
          trangThaiPheDuyet: 'REJECTED',
          lyDoTuChoi: payload?.lyDo as string,
        });
        setHasChanges(true);
      } else if (action === 'delete') {
        await dekeCRUD.delete(id);
        message.success('Xóa thành công');
        if (isModalMode && onSuccess) {
          onSuccess();
        } else {
          navigate('/de-ke');
        }
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
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
    { title: 'Đê/Kè', onClick: () => navigate('/de-ke') },
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
          <Button onClick={() => navigate('/de-ke')} style={{ marginTop: '16px' }}>
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
              <Descriptions.Item label="Loại đê">{LOAI_DE_MAP[record.loaiDe] || record.loaiDe}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{record.viTri}</Descriptions.Item>
              <Descriptions.Item label="Chiều dài (m)">
                {record.chieuDai !== undefined ? record.chieuDai.toFixed(2) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Chiều rộng (m)">
                {record.chieuRong !== undefined ? record.chieuRong.toFixed(2) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Chiều cao (m)">
                {record.chieuCao !== undefined ? record.chieuCao.toFixed(2) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Mặt vật liệu">
                {record.matVatLieu ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tình trạng">
                {TINH_TRANG_MAP[record.tinhTrang] || record.tinhTrang || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {(record as any).ghiChu ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn vị quản lý" span={2}>
                {record.donViId ? organizations.find(o => o.id === record.donViId)?.name || record.donViId : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <ApprovalStatusBadge status={record.trangThaiPheDuyet} />
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
              currentStatus={record.trangThaiPheDuyet as ApprovalStatus}
              permissions={userPermissions}
              entityPermissionPrefix="deke"
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
                deKeApproval
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
          title="Chi tiết Đê/Kè"
          open={open}
          onCancel={handleCloseModal}
          footer={null}
          width={900}
          destroyOnClose
          maskClosable={false}
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
        name="loaiDe"
        rules={[{ required: true, message: 'Vui lòng nhập loại đê' }]}
      >
        <Select
          placeholder="Chọn loại đê"
          options={[
            { label: 'Đê đất', value: 'DE_DAT' },
            { label: 'Đê bê tông', value: 'DE_BETONG' },
            { label: 'Kè đá', value: 'KE_DA' },
            { label: 'Kè bê tông', value: 'KE_BETONG' },
            { label: 'Khác', value: 'KHAC' },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Vị trí"
        name="viTri"
        rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
      >
        <Input placeholder="Nhập vị trí" />
      </Form.Item>

      <Form.Item
        label="Chiều dài (m)"
        name="chieuDai"
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
        label="Chiều rộng (m)"
        name="chieuRong"
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
          placeholder="Nhập chiều rộng"
          style={{ width: '100%' }}
          precision={2}
        />
      </Form.Item>

      <Form.Item
        label="Chiều cao (m)"
        name="chieuCao"
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

      <Form.Item label="Mặt vật liệu" name="matVatLieu">
        <Input placeholder="Nhập mặt vật liệu" />
      </Form.Item>

      <Form.Item label="Tình trạng" name="tinhTrang">
        <Select
          placeholder="Chọn tình trạng"
          options={[
            { label: 'Tốt', value: 'TOT' },
            { label: 'Xuống cấp', value: 'XUONG_CAP' },
            { label: 'Hư hỏng', value: 'HU_HOng' },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Đơn vị quản lý"
        name="donViId"
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
        name="ghiChu"
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
          <Button onClick={isModalMode ? onCancel : () => navigate('/de-ke')}>
            Hủy
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  if (isModalMode) {
    return (
      <Modal
        title={isCreateMode ? 'Tạo mới Đê/Kè' : 'Chỉnh sửa Đê/Kè'}
        open={open}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        <Spin spinning={isLoading}>
          {formContent}
        </Spin>
      </Modal>
    );
  }

  // Create/Edit form view
  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />
      <Card style={{ maxWidth: '800px' }}>
        <h2>{isCreateMode ? 'Tạo mới Đê/Kè' : 'Chỉnh sửa Đê/Kè'}</h2>
        {formContent}
      </Card>
    </div>
  );
}
