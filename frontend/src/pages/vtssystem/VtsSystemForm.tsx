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
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import { organizationService } from '../../services/organizationService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type {
  VtsSystemResponse,
  CreateVtsSystemRequest,
  UpdateVtsSystemRequest,
  ApprovalRequest,
  HistoryEntry,
} from '../../types/vtsSystem';
import { CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';

type ApprovalStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

export interface VtsSystemFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function VtsSystemForm({ open, editId, mode, onCancel, onSuccess }: VtsSystemFormProps = {}) {
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

  const [record, setRecord] = useState<VtsSystemResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
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
          const data = cached || await vtsSystemCRUD.getById(id);
          setRecord(data);
          form.setFieldsValue({
            systemName: data.systemName,
            location: data.location,
            conditionStatus: data.conditionStatus,
            responsibilityLevel: data.responsibilityLevel,
            source: data.source,
            partner: data.partner,
            scope: data.scope,
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
      setFormError(null);
    }
  }, [id, isEditMode, form]);

  // Fetch history
  useEffect(() => {
    if (id && isDetailMode) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          const hist = await vtsSystemApproval.getHistory(id);
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
      const payload: CreateVtsSystemRequest | UpdateVtsSystemRequest = {
        systemName: values.systemName,
        location: values.location,
        conditionStatus: values.conditionStatus,
        responsibilityLevel: values.responsibilityLevel,
        source: values.source,
        partner: values.partner,
        scope: values.scope,
        orgUnitId: values.orgUnitId,
        loaiHinhHoc: spatialData?.loaiHinhHoc,
        toaDo: spatialData?.toaDo,
      };

      if (isCreateMode) {
        await vtsSystemCRUD.create(payload as CreateVtsSystemRequest);
        toast.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/vts-system');
        }
      } else if (id && isEditMode) {
        const res = await vtsSystemCRUD.update(id, payload as UpdateVtsSystemRequest);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/vts-system');
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
          quyetDinh: 'APPROVED',
        };
        const updated = await vtsSystemApproval.approveC1(id, pheDuyetData);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updated;
        }
        toast.success('Phê duyệt C1 thành công');
        setRecord(updated);
        setHasChanges(true);
      } else if (action === 'approveC2') {
        const pheDuyetData: ApprovalRequest = {
          quyetDinh: 'APPROVED',
        };
        const updated = await vtsSystemApproval.approveC2(id, pheDuyetData);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updated;
        }
        toast.success('Phê duyệt C2 thành công');
        setRecord(updated);
        setHasChanges(true);
      } else if (action === 'reject') {
        const pheDuyetData: ApprovalRequest = {
          quyetDinh: 'REJECTED',
          reason: payload?.lyDo as string,
        };

        let updatedRecord;
        if (record.approvalStatus === 'PROPOSED' || record.approvalStatus === 'REJECTED') {
          updatedRecord = await vtsSystemApproval.approveC1(id, pheDuyetData);
        } else if (record.approvalStatus === 'UNDER_REVIEW') {
          updatedRecord = await vtsSystemApproval.approveC2(id, pheDuyetData);
        }
        if (updatedRecord && window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updatedRecord;
        }

        toast.success('Từ chối thành công');
        const updated = { ...record, rejectionReason: payload?.lyDo as string };
        setRecord(updated);
        setHasChanges(true);
      } else if (action === 'delete') {
        await vtsSystemCRUD.delete(id);
        toast.success('Xóa thành công');
        if (isModalMode && onSuccess) {
          onSuccess();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/vts-system');
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
    { title: 'Hệ thống VTS', onClick: () => navigate('/vts-system') },
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
          <Button onClick={() => navigate('/vts-system')} style={{ marginTop: '16px' }}>
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
          <h2>Chi tiết Hệ thống VTS</h2>
          {record && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Tên hệ thống">{record.systemName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{record.location}</Descriptions.Item>
              <Descriptions.Item label="Tình trạng">
                {record.conditionStatus ? (CONDITION_STATUS_MAP[record.conditionStatus] || record.conditionStatus) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Mức độ phủ trách">{record.responsibilityLevel ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Nguồn gốc">{record.source ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Đối tác">{record.partner ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Phạm vi áp dụng" span={2}>{record.scope ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Đơn vị quản lý" span={2}>
                {record.orgUnitId ? organizations.find(o => o.id === record.orgUnitId)?.name || record.orgUnitId : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <ApprovalStatusBadge status={record.approvalStatus} />
              </Descriptions.Item>
              {record.rejectionReason && (
                <Descriptions.Item label="Lý do từ chối" span={2}>
                  {record.rejectionReason}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Người tạo">{record.createdBy ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {record.createdDate ? dayjs(record.createdDate).format('DD/MM/YYYY') : '—'}
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
              entityPermissionPrefix="vts"
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
                setHistoryError(null);
                vtsSystemApproval
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
          title="Chi tiết Hệ thống VTS"
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

  if (isModalMode) {
    return (
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isCreateMode ? 'Tạo mới Hệ thống VTS' : 'Chỉnh sửa Hệ thống VTS'}</span>}
        open={open}
        onCancel={handleCloseModal}
        footer={null}
        width={900}
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
              label="Tên hệ thống"
              name="systemName"
            >
              <Input placeholder="Nhập tên hệ thống" />
            </Form.Item>

            <Form.Item
              label="Vị trí"
              name="location"
              rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
            >
              <Input placeholder="Nhập vị trí" />
            </Form.Item>

            <Form.Item
              label="Tình trạng"
              name="conditionStatus"
            >
              <Select
                placeholder="Chọn tình trạng"
                options={CONDITION_STATUS_OPTIONS}
              />
            </Form.Item>

            <Form.Item
              label="Mức độ phủ trách"
              name="responsibilityLevel"
            >
              <Input placeholder="Nhập mức độ phủ trách" />
            </Form.Item>

            <Form.Item
              label="Nguồn gốc"
              name="source"
            >
              <Input placeholder="Nhập nguồn gốc" />
            </Form.Item>

            <Form.Item
              label="Đối tác"
              name="partner"
            >
              <Input placeholder="Nhập đối tác" />
            </Form.Item>

            <Form.Item label="Phạm vi áp dụng" name="scope">
              <Input.TextArea rows={3} placeholder="Nhập phạm vi áp dụng" />
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
        {!isIframe && <h2>{isCreateMode ? 'Tạo mới Hệ thống VTS' : 'Chỉnh sửa Hệ thống VTS'}</h2>}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
        >
          <Form.Item
            label="Tên hệ thống"
            name="systemName"
          >
            <Input placeholder="Nhập tên hệ thống" />
          </Form.Item>

          <Form.Item
            label="Vị trí"
            name="location"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
          >
            <Input placeholder="Nhập vị trí" />
          </Form.Item>

          <Form.Item
            label="Tình trạng"
            name="conditionStatus"
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
            name="responsibilityLevel"
          >
            <Input placeholder="Nhập mức độ phủ trách" />
          </Form.Item>

          <Form.Item
            label="Nguồn gốc"
            name="source"
          >
            <Input placeholder="Nhập nguồn gốc" />
          </Form.Item>

          <Form.Item
            label="Đối tác"
            name="partner"
          >
            <Input placeholder="Nhập đối tác" />
          </Form.Item>

          <Form.Item label="Phạm vi áp dụng" name="scope">
            <Input.TextArea rows={3} placeholder="Nhập phạm vi áp dụng" />
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
            label="Tài liệu đính kèm"
            name="attachments"
          >
            <AttachmentList readonly={isDetailMode} />
          </Form.Item>

          <Form.Item label="Vị trí/Hình vẽ bản đồ" name="spatialData">
            <GisLocationSelector defaultGeometryType="POINT" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
              </Button>
              <Button onClick={isIframe ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*') : () => navigate('/vts-system')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

