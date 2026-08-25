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
  Breadcrumb,
  Modal,
} from 'antd';
import toast from '../../components/ToastNotification';
import { shipRepairFacilityCRUD, shipRepairFacilityApproval } from '../../services/shipRepairFacilityService';
import { organizationService } from '../../services/organizationService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type {
  ShipRepairFacilityResponse,
  CreateShipRepairFacilityRequest,
  UpdateShipRepairFacilityRequest,
  PheDuyetRequest,
} from '../../types/shipRepairFacility';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

const LOAI_CO_SO_MAP: Record<string, string> = {
  'CS_SUA_CHUA': 'Cơ sở sửa chữa',
  'CS_DONG_TAU': 'Cơ sở đóng tàu',
  'CS_SUA_CHUA_DONG_TAU': 'Cơ sở sửa chữa & đóng tàu',
  'KHAC': 'Khác',
};

export interface ShipRepairFacilityFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function ShipRepairFacilityForm({ open, editId, mode, onCancel, onSuccess }: ShipRepairFacilityFormProps = {}) {
  const navigate = useNavigate();
  const routeParams = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isIframe = window.self !== window.top;
  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeParams.id;
  const isEditMode = isModalMode ? (mode === 'edit') : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? (mode === 'detail') : (!!id && !isEditMode);
  const isCreateMode = isModalMode ? (mode === 'create') : !id;

  const [record, setRecord] = useState<ShipRepairFacilityResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
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

  // Fetch detail data
  useEffect(() => {
    if (id) {
      const loadData = async () => {
        setIsLoading(true);
        setFormError(null);
        try {
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await shipRepairFacilityCRUD.getById(id);
          setRecord(data);
          form.setFieldsValue({
            facilityName: data.facilityName,
            address: data.address,
            province: data.province,
            phone: data.phone,
            email: data.email,
            facilityType: data.facilityType,
            capacity: data.capacity,
            authority: data.authority,
            orgUnitId: data.orgUnitId,
            spatialData: {
              loaiHinhHoc: data.loaiHinhHoc,
              toaDo: data.toaDo,
            }
          });
        } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      form.resetFields();
      setRecord(null);
    }
  }, [id, isEditMode, form, open]);

  // Fetch history
  useEffect(() => {
    if (id && isDetailMode) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          const hist = await shipRepairFacilityApproval.getHistory(id);
          setHistory(hist);
        } catch (err) {
          setHistoryError(err instanceof Error ? err.message : 'Không tải được lịch sử');
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [id, isDetailMode, open]);

  const handleSubmitForm = async (values: any) => {
    setIsSubmitting(true);
    try {
      const spatialData = values.spatialData;
      const payload = {
        facilityName: values.facilityName,
        address: values.address,
        province: values.province,
        phone: values.phone,
        email: values.email,
        facilityType: values.facilityType,
        capacity: values.capacity,
        authority: values.authority,
        orgUnitId: values.orgUnitId,
        loaiHinhHoc: spatialData?.loaiHinhHoc,
        toaDo: spatialData?.toaDo,
      };

      if (isCreateMode) {
        await shipRepairFacilityCRUD.create(payload as CreateShipRepairFacilityRequest);
        toast.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/ship-repair-facility');
        }
      } else if (id && isEditMode) {
        const res = await shipRepairFacilityCRUD.update(id, payload as UpdateShipRepairFacilityRequest);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/ship-repair-facility');
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
          decision: 'APPROVED',
          reason: undefined,
        };
        const res = await shipRepairFacilityApproval.approveC1(id, pheDuyetData);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Phê duyệt cấp Cảng vụ thành công');
        setRecord({ ...record, approvalStatus: 'PENDING_APPROVAL' });
        if (onSuccess) onSuccess();
      } else if (action === 'approveC2') {
        const pheDuyetData: ApprovalRequest = {
          decision: 'APPROVED',
          reason: undefined,
        };
        const res = await shipRepairFacilityApproval.approveC2(id, pheDuyetData);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Phê duyệt cấp Cục thành công');
        setRecord({ ...record, approvalStatus: 'APPROVED' });
        if (onSuccess) onSuccess();
      } else if (action === 'reject') {
        const pheDuyetData: ApprovalRequest = {
          decision: 'REJECTED',
          reason: payload?.lyDo as string,
        };

        let updatedRecord;
        if (record.approvalStatus === 'PROPOSED' || record.approvalStatus === 'REJECTED') {
          updatedRecord = await shipRepairFacilityApproval.approveC1(id, pheDuyetData);
        } else if (record.approvalStatus === 'PENDING_APPROVAL') {
          updatedRecord = await shipRepairFacilityApproval.approveC2(id, pheDuyetData);
        }
        if (updatedRecord && window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updatedRecord;
        }

        toast.success('Từ chối thành công');
        setRecord({
          ...record,
          approvalStatus: 'REJECTED',
          rejectionReason: payload?.lyDo as string,
        });
      } else if (action === 'delete') {
        await shipRepairFacilityCRUD.delete(id);
        toast.success('Xóa thành công');
        if (isModalMode && onSuccess) {
          onSuccess();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/ship-repair-facility');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Cơ sở sửa chữa & đóng tàu', onClick: () => navigate('/ship-repair-facility') },
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
          <Button onClick={() => navigate('/ship-repair-facility')} style={{ marginTop: '16px' }}>
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  // Detail/Read-only view
  if (isDetailMode) {
    const detailContent = (
      <Spin spinning={isLoading}>
        <Card style={{ marginBottom: '24px' }} bordered={!isModalMode}>
          {!isModalMode && <h2>Chi tiết Cơ sở Sửa chữa / Đóng tàu</h2>}
          {record && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Tên cơ sở">{record.facilityName}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">{record.address}</Descriptions.Item>
              <Descriptions.Item label="Tỉnh/thành">{record.province}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {record.phone ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {record.email ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Loại cơ sở">{LOAI_CO_SO_MAP[record.facilityType] || record.facilityType}</Descriptions.Item>
              <Descriptions.Item label="Khả năng" span={2}>
                {record.capacity ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Chủ quản">
                {record.authority ?? '—'}
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
          <Card style={{ marginBottom: '24px' }} bordered={!isModalMode}>
            <h3>Tài liệu đính kèm</h3>
            <AttachmentList attachments={record.attachments} readonly={true} />
          </Card>
        )}

        {/* Approval Action Bar */}
        {record && (
          <Card style={{ marginBottom: '24px' }} bordered={!isModalMode}>
            <ApprovalActionBar
              currentStatus={record.approvalStatus as any}
              permissions={userPermissions}
              entityPermissionPrefix="shiprepair"
              currentUserId={currentUser?.username}
              nguoiPheDuyetC1={record.approverLevel1}
              onAction={handleApprovalAction}
              loading={isSubmitting}
            />
          </Card>
        )}

        {/* History Timeline */}
        {record && (
          <Card bordered={!isModalMode}>
            <h3>Lịch sử phê duyệt</h3>
            <HistoryTimeline
              history={history}
              loading={isLoadingHistory}
              error={historyError || undefined}
              onRetry={() => {
                setIsLoadingHistory(true);
                shipRepairFacilityApproval
                  .getHistory(id)
                  .then(setHistory)
                  .catch((err) => setHistoryError(err instanceof Error ? err.message : 'Lỗi'))
                  .finally(() => setIsLoadingHistory(false));
              }}
            />
          </Card>
        )}
      </Spin>
    );

    if (isModalMode) {
      return (
        <Modal
          title="Chi tiết Cơ sở Sửa chữa / Đóng tàu"
          open={open}
          onCancel={onCancel}
          footer={null}
          width={900}
          destroyOnHidden
          mask={{ closable: false }}
        >
          {detailContent}
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

  if (isModalMode) {
    return (
      <Modal
        title={isCreateMode ? 'Tạo mới Cơ sở Sửa chữa' : 'Chỉnh sửa Cơ sở Sửa chữa'}
        open={open}
        onCancel={onCancel}
        footer={null}
        destroyOnHidden
        mask={{ closable: false }}
      >
        <Spin spinning={isLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitForm}
            autoComplete="off"
          >
            <Form.Item
              label="Tên cơ sở"
              name="facilityName"
              rules={[{ required: true, message: 'Vui lòng nhập tên cơ sở' }]}
            >
              <Input placeholder="Nhập tên cơ sở" />
            </Form.Item>

            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
            >
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>

            <Form.Item
              label="Tỉnh/thành"
              name="province"
              rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành' }]}
            >
              <Input placeholder="Nhập tỉnh/thành" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
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
              name="facilityType"
              rules={[{ required: true, message: 'Vui lòng chọn loại cơ sở' }]}
            >
              <Select
                placeholder="Chọn loại cơ sở"
                options={[
                  { label: 'Cơ sở sửa chữa', value: 'CS_SUA_CHUA' },
                  { label: 'Cơ sở đóng tàu', value: 'CS_DONG_TAU' },
                  { label: 'Cơ sở sửa chữa & đóng tàu', value: 'CS_SUA_CHUA_DONG_TAU' },
                  { label: 'Khác', value: 'KHAC' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Khả năng"
              name="capacity"
            >
              <Input.TextArea
                placeholder="Mô tả khả năng cơ sở"
                rows={4}
              />
            </Form.Item>

            <Form.Item label="Chủ quản" name="authority">
              <Input placeholder="Nhập chủ quản" />
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

            <Form.Item>
              <Space style={{ display: 'flex', justifyContent: 'end', marginTop: 16 }}>
                <Button onClick={onCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
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
        {!isIframe && <h2>{isCreateMode ? 'Tạo mới Cơ sở Sửa chữa' : 'Chỉnh sửa Cơ sở Sửa chữa'}</h2>}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
        >
          <Form.Item
            label="Tên cơ sở"
            name="facilityName"
            rules={[{ required: true, message: 'Vui lòng nhập tên cơ sở' }]}
          >
            <Input placeholder="Nhập tên cơ sở" />
          </Form.Item>

          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Form.Item
            label="Tỉnh/thành"
            name="province"
            rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành' }]}
          >
            <Input placeholder="Nhập tỉnh/thành" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
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
            name="facilityType"
            rules={[{ required: true, message: 'Vui lòng chọn loại cơ sở' }]}
          >
            <Select
              placeholder="Chọn loại cơ sở"
              options={[
                { label: 'Cơ sở sửa chữa', value: 'CS_SUA_CHUA' },
                { label: 'Cơ sở đóng tàu', value: 'CS_DONG_TAU' },
                { label: 'Cơ sở sửa chữa & đóng tàu', value: 'CS_SUA_CHUA_DONG_TAU' },
                { label: 'Khác', value: 'KHAC' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Khả năng"
            name="capacity"
          >
            <Input.TextArea
              placeholder="Mô tả khả năng cơ sở"
              rows={4}
            />
          </Form.Item>

          <Form.Item label="Chủ quản" name="authority">
            <Input placeholder="Nhập chủ quản" />
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

          <Form.Item label="Tài liệu đính kèm">
            <AttachmentList
              attachments={record?.attachments || []}
              readonly={false}
            />
          </Form.Item>

          <Form.Item label="Vị trí/Hình vẽ bản đồ" name="spatialData">
            <GisLocationSelector defaultGeometryType="POINT" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
              </Button>
              <Button onClick={isIframe ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*') : () => navigate('/ship-repair-facility')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

