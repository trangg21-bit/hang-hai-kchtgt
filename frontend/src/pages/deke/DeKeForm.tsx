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
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

const LOAI_DE_MAP: Record<string, string> = {
  'DE_CHAN_SONG': 'Đê chắn sóng',
  'DE_CHAN_CAT': 'Đê chắn cát',
  'KE_HUONG_DONG': 'Kè hướng dòng',
  'KE_BAO_VE_BO': 'Kè bảo vệ bờ',
  'GIAO_THONG': 'Giao thông',
  'KE_CHAN_SONG': 'Kè chắn sóng',
  'KE_CHAN_CAT': 'Kè chắn cát',
};

const TINH_TRANG_MAP: Record<string, string> = {
  '1': 'Chưa khai thác/vận hành',
  '2': 'Đang khai thác/vận hành',
  '3': 'Dừng khai thác/vận hành',
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

  const isIframe = window.self !== window.top;
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
          const data = await dekeCRUD.getById(id);
          setRecord(data);
          form.setFieldsValue({
            loaiDe: data.loaiDe,
            viTri: data.viTri,
            tenDeKe: data.tenDeKe,
            chieuDai: data.chieuDai,
            caoTrinhDinh: data.caoTrinhDinh,
            thoiDiemDuaVaoKhaiThac: data.thoiDiemDuaVaoKhaiThac ? dayjs(data.thoiDiemDuaVaoKhaiThac) : null,
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
        tenDeKe: values.tenDeKe,
        chieuDai: values.chieuDai,
        caoTrinhDinh: values.caoTrinhDinh,
        thoiDiemDuaVaoKhaiThac: values.thoiDiemDuaVaoKhaiThac || undefined,
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
        toast.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/de-ke');
        }
      } else if (id && isEditMode) {
        await dekeCRUD.update(id, payload as UpdateDeKeRequest);
        toast.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/de-ke');
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
        const pheDuyetData: PheDuyetRequest = {
          nguoiPheDuyet: currentUser?.username || 'unknown',
          quyetDinh: 'APPROVED',
        };
        await deKeApproval.approveC1(id, pheDuyetData);
        toast.success('Phê duyệt C1 thành công');
        setRecord({ ...record, trangThaiPheDuyet: 'UNDER_REVIEW' });
        setHasChanges(true);
      } else if (action === 'approveC2') {
        const pheDuyetData: PheDuyetRequest = {
          nguoiPheDuyet: currentUser?.username || 'unknown',
          quyetDinh: 'APPROVED',
        };
        await deKeApproval.approveC2(id, pheDuyetData);
        toast.success('Phê duyệt C2 thành công');
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

        toast.success('Từ chối thành công');
        setRecord({
          ...record,
          trangThaiPheDuyet: 'REJECTED',
          lyDoTuChoi: payload?.lyDo as string,
        });
        setHasChanges(true);
      } else if (action === 'delete') {
        await dekeCRUD.delete(id);
        toast.success('Xóa thành công');
        if (isModalMode && onSuccess) {
          onSuccess();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/de-ke');
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
              <Descriptions.Item label="Tên đê kè">{record.tenDeKe || '—'}</Descriptions.Item>
              <Descriptions.Item label="Chiều dài (m)">
                {record.chieuDai !== undefined ? record.chieuDai.toFixed(2) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cao trình đỉnh (m)">
                {record.caoTrinhDinh !== undefined ? record.caoTrinhDinh.toFixed(2) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời điểm đưa vào khai thác">
                {record.thoiDiemDuaVaoKhaiThac ? dayjs(record.thoiDiemDuaVaoKhaiThac).format('DD/MM/YYYY') : '—'}
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
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Chi tiết Đê/Kè</span>}
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
            { label: 'Đê chắn sóng', value: 'DE_CHAN_SONG' },
            { label: 'Đê chắn cát', value: 'DE_CHAN_CAT' },
            { label: 'Kè hướng dòng', value: 'KE_HUONG_DONG' },
            { label: 'Kè bảo vệ bờ', value: 'KE_BAO_VE_BO' },
            { label: 'Giao thông', value: 'GIAO_THONG' },
            { label: 'Kè chắn sóng', value: 'KE_CHAN_SONG' },
            { label: 'Kè chắn cát', value: 'KE_CHAN_CAT' },
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
        label="Tên đê kè"
        name="tenDeKe"
        rules={[{ required: true, message: 'Vui lòng nhập tên đê kè' }]}
      >
        <Input placeholder="Nhập tên đê kè" />
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
        label="Cao trình đỉnh (m)"
        name="caoTrinhDinh"
      >
        <InputNumber
          placeholder="Nhập cao trình đỉnh"
          style={{ width: '100%' }}
          precision={2}
        />
      </Form.Item>

      <Form.Item
        label="Thời điểm đưa vào khai thác"
        name="thoiDiemDuaVaoKhaiThac"
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
            { label: 'Chưa khai thác/vận hành', value: '1' },
            { label: 'Đang khai thác/vận hành', value: '2' },
            { label: 'Dừng khai thác/vận hành', value: '3' },
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
          <Button onClick={isModalMode ? onCancel : (isIframe ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*') : () => navigate('/de-ke'))}>
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
