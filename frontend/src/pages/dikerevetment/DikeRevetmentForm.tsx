import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  TreeSelect,
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
import { portCRUD } from '../../services/portService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type {
  DikeRevetmentResponse,
  CreateDikeRevetmentRequest,
  UpdateDikeRevetmentRequest,
} from '../../types/dikeRevetment';
import { useAuthStore } from '../../store/authStore';
import { hasPermissionFromList } from '../../store/permissionStore';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeMd, fontSizeLg, spaceMd, spaceLg, spaceXxl, inputStyle, selectStyle, formFieldStyle, primaryButtonStyle, outlineButtonStyle, dangerButtonStyle, statusOperational, radiusPill } from '../../tokens';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import RejectionModal from '../../components/shared/RejectionModal';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

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

const buildOrgTree = (nodes: any[]): any[] => {
  const map = new Map<string, any>();
  const roots: any[] = [];
  nodes.forEach((org) => {
    map.set(org.id, {
      title: org.code ? `${org.code} - ${org.name}` : org.name,
      value: org.id,
      parentId: org.parentId,
      children: [],
    });
  });
  nodes.forEach((org) => {
    const node = map.get(org.id);
    if (org.parentId && map.has(org.parentId)) {
      map.get(org.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
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
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [seaports, setSeaports] = useState<{ id: string; portName?: string; portCode?: string }[]>([]);

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
    if (isDetailMode) return;
    (async () => {
      const list = await portCRUD.getOptions();
      setSeaports(list || []);
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
            locationDetail: data.locationDetail,
            dikeRevetmentName: data.dikeRevetmentName,
            seaportId: data.seaportId,
            donViVanHanhName: data.donViVanHanhName || data.donViVanHanhId || '',
            constructionDate: data.constructionDate ? dayjs(data.constructionDate) : null,
            lastMaintenanceYear: data.lastMaintenanceYear ? dayjs(data.lastMaintenanceYear) : null,
            length: data.length,
            crestElevation: data.crestElevation,
            commissioningDate: data.commissioningDate ? dayjs(data.commissioningDate) : null,
            height: data.height,
            status: data.status,
            note: data.note,
            orgUnitId: data.orgUnitId,
            spatialData: {
              geometryType: data.geometryType,
              coordinates: data.coordinates,
              symbolId: data.symbolId,
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
  }, [id, form]);

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
        locationDetail: values.locationDetail,
        dikeRevetmentName: values.dikeRevetmentName,
        seaportId: values.seaportId,
        donViVanHanhName: values.donViVanHanhName,
        constructionDate: values.constructionDate ? values.constructionDate.format('YYYY-MM-DD') : undefined,
        lastMaintenanceYear: values.lastMaintenanceYear ? values.lastMaintenanceYear.format('YYYY') : undefined,
        length: values.length,
        crestElevation: values.crestElevation,
        commissioningDate: values.commissioningDate || undefined,
        height: values.height,
        status: values.status,
        orgUnitId: values.orgUnitId,
        geometryType: spatialData?.geometryType,
        coordinates: spatialData?.coordinates,
        symbolId: spatialData?.symbolId,
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
    action: 'submit' | 'approve' | 'reject' | 'delete',
    payload?: Record<string, unknown>
  ) => {
    if (!id || !record) return;

    setIsSubmitting(true);
    try {
      if (action === 'submit') {
        await dikeRevetmentApproval.submitForApproval(id);
        toast.success('Đã gửi phê duyệt');
        setRecord({ ...record, approvalStatus: 'PENDING_APPROVAL' });
        setHasChanges(true);
      } else if (action === 'approve') {
        // Luồng phê duyệt 1 cấp — PENDING_APPROVAL → APPROVED
        await dikeRevetmentApproval.approveL1(id);
        toast.success('Phê duyệt thành công');
        setRecord({ ...record, approvalStatus: 'APPROVED' });
        setHasChanges(true);
      } else if (action === 'reject') {
        await dikeRevetmentApproval.reject(id, payload?.reason as string);
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
    { title: 'Quản lý đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ', onClick: () => navigate('/dike-revetment') },
    { title: isCreateMode ? 'Tạo mới' : isEditMode ? 'Chỉnh sửa' : 'Chi tiết' },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: spaceLg }}>
        <Spin fullscreen description="Đang tải..." />
      </div>
    );
  }

  if (formError) {
    return (
      <div style={{ padding: spaceLg }}>
        <Card>
          <Empty description={formError} style={{ marginTop: spaceXxl }} />
          <Button onClick={() => navigate('/dike-revetment')} style={{ marginTop: spaceMd }}>
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
        <Card style={{ marginBottom: spaceLg }}>
          <h2>Chi tiết đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ</h2>
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
              <Descriptions.Item label="Tình trạng">
                {STATUS_MAP[record.status ?? ''] || record.status || '—'}
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
          <Card style={{ marginBottom: spaceLg }}>
            <h3>Tài liệu đính kèm</h3>
            <AttachmentList
              attachments={record.attachments.map((a) => ({ id: a.id, fileName: a.fileName, filePath: a.fileUrl }))}
              readonly={true}
            />
          </Card>
        )}

        {/* Approval Action Bar — luồng phê duyệt 1 cấp */}
        {record && (
          <Card style={{ marginBottom: spaceLg }}>
            {record.approvalStatus === 'PROPOSED' || record.approvalStatus === 'REJECTED' ? (
              <Button type="primary" onClick={() => handleApprovalAction('submit')} loading={isSubmitting} style={primaryButtonStyle}>
                Gửi phê duyệt
              </Button>
            ) : record.approvalStatus === 'PENDING_APPROVAL' ? (
              <Space wrap>
                <Button type="primary" onClick={() => handleApprovalAction('approve')} loading={isSubmitting}
                  style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                  Phê duyệt
                </Button>
                <Button danger onClick={() => setRejectModalVisible(true)} loading={isSubmitting} style={dangerButtonStyle}>
                  Từ chối
                </Button>
              </Space>
            ) : null}
            {hasPermissionFromList(userPermissions, 'dikerevetment:delete') && record.approvalStatus === 'APPROVED' && (
              <Button danger style={{ ...dangerButtonStyle, marginLeft: spaceMd }} onClick={() => handleApprovalAction('delete')}>
                Xóa
              </Button>
            )}
            <RejectionModal
              visible={rejectModalVisible}
              loading={isSubmitting}
              onConfirm={(reason) => { setRejectModalVisible(false); handleApprovalAction('reject', { reason }); }}
              onCancel={() => setRejectModalVisible(false)}
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
                  .getHistory(id!)
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
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Chi tiết đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ</span>}
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
      <div style={{ padding: spaceLg }}>
        <Breadcrumb items={breadcrumbs} style={{ marginBottom: spaceMd }} />
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
        {...labelProps('Loại đê')}
        name="dikeRevetmentType"
        style={formFieldStyle}
        rules={[{ required: true, message: 'Vui lòng nhập loại đê' }]}
      >
        <Select
          placeholder="Chọn loại đê"
          style={selectStyle}
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
        {...labelProps('Vị trí')}
        name="location"
        style={formFieldStyle}
        rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
      >
        <Input placeholder="Nhập vị trí" style={inputStyle} />
      </Form.Item>

      <Form.Item {...labelProps('Địa điểm chi tiết')} name="locationDetail" style={formFieldStyle}>
        <Input placeholder="Nhập địa điểm chi tiết..." style={inputStyle} />
      </Form.Item>

      <Form.Item
        {...labelProps('Tên đê kè')}
        name="dikeRevetmentName"
        style={formFieldStyle}
        rules={[{ required: true, message: 'Vui lòng nhập tên đê kè' }]}
      >
        <Input placeholder="Nhập Tên đê kè..." style={inputStyle} />
      </Form.Item>

      <Form.Item
        {...labelProps('Chiều dài (m)')}
        name="length"
        style={formFieldStyle}
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
          style={{ width: '100%', ...inputStyle }}
          precision={2}
        />
      </Form.Item>

      <Form.Item
        {...labelProps('Cao trình đỉnh (m)')}
        name="crestElevation"
        style={formFieldStyle}
      >
        <InputNumber
          placeholder="Nhập cao trình đỉnh"
          style={{ width: '100%', ...inputStyle }}
          precision={2}
        />
      </Form.Item>

      <Form.Item
        {...labelProps('Thời điểm đưa vào khai thác')}
        name="commissioningDate"
        style={formFieldStyle}
        getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
        normalize={(value) => value ? value.format('YYYY-MM-DD') : null}
      >
        <DatePicker
          placeholder="Chọn ngày"
          style={{ width: '100%', ...selectStyle }}
          format="DD/MM/YYYY"
        />
      </Form.Item>

      <Form.Item
        {...labelProps('Thời điểm xây dựng')}
        name="constructionDate"
        style={formFieldStyle}
        getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
        normalize={(value) => value ? value.format('YYYY-MM-DD') : null}
      >
        <DatePicker
          placeholder="Chọn ngày xây dựng"
          style={{ width: '100%', ...selectStyle }}
          format="DD/MM/YYYY"
        />
      </Form.Item>

      <Form.Item
        {...labelProps('Năm bảo trì gần nhất')}
        name="lastMaintenanceYear"
        style={formFieldStyle}
        getValueProps={(value) => ({ value: value ? dayjs(String(value)) : null })}
        normalize={(value) => value ? value.format('YYYY') : null}
      >
        <DatePicker
          picker="year"
          placeholder="Chọn năm"
          style={{ width: '100%', ...selectStyle }}
        />
      </Form.Item>

      <Form.Item
        {...labelProps('Chiều cao (m)')}
        name="height"
        style={formFieldStyle}
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
          style={{ width: '100%', ...inputStyle }}
          precision={2}
        />
      </Form.Item>

      <Form.Item {...labelProps('Tình trạng')} name="status" style={formFieldStyle}>
        <Select
          placeholder="Chọn tình trạng"
          style={selectStyle}
          options={[
            { label: 'Chưa khai thác/vận hành', value: '1' },
            { label: 'Đang khai thác/vận hành', value: '2' },
            { label: 'Dừng khai thác/vận hành', value: '3' },
          ]}
        />
      </Form.Item>

      <Form.Item
        {...labelProps('Đơn vị quản lý')}
        name="orgUnitId"
        style={formFieldStyle}
      >
        <TreeSelect
          placeholder="Chọn đơn vị quản lý"
          allowClear
          showSearch
          treeNodeFilterProp="title"
          treeDefaultExpandAll
          treeData={buildOrgTree(organizations)}
          style={selectStyle}
        />
      </Form.Item>

      <Form.Item {...labelProps('Thuộc cảng biển')} name="seaportId" style={formFieldStyle}>
        <Select
          placeholder="Chọn cảng biển..."
          allowClear
          showSearch
          optionFilterProp="label"
          options={seaports.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }))}
          style={selectStyle}
        />
      </Form.Item>

      <Form.Item {...labelProps('Đơn vị vận hành')} name="donViVanHanhName" style={formFieldStyle}>
        <Input placeholder="VD: Công ty Hoa tiêu Hàng hải" style={inputStyle} />
      </Form.Item>

      <Form.Item
        {...labelProps('Ghi chú')}
        name="note"
        style={formFieldStyle}
      >
        <Input.TextArea
          placeholder="Nhập ghi chú"
          maxLength={500}
          rows={4}
          styles={{ textarea: { borderRadius: radiusPill, minHeight: 40 } }}
        />
      </Form.Item>

      <Form.Item {...labelProps('Vị trí/Hình vẽ bản đồ')} name="spatialData" style={formFieldStyle}>
        <GisLocationSelector defaultGeometryType="LINE" />
      </Form.Item>

      <Form.Item {...labelProps('Tài liệu đính kèm')} style={formFieldStyle}>
        <AttachmentList
          attachments={(record?.attachments || []).map((a) => ({ id: a.id, fileName: a.fileName, filePath: a.fileUrl }))}
          readonly={false}
        />
      </Form.Item>

      <Form.Item style={formFieldStyle}>
        <Space>
          <Button type="primary" htmlType="submit" loading={isSubmitting} style={primaryButtonStyle}>
            {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
          </Button>
          <Button onClick={isModalMode ? onCancel : (isIframe ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*') : () => navigate('/dike-revetment'))} style={outlineButtonStyle}>
            Hủy
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  if (isModalMode) {
    return (
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isCreateMode ? 'Tạo mới đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ' : 'Chỉnh sửa đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ'}</span>}
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
    <div style={isIframe ? { padding: `${spaceMd}px ${spaceLg}px`, background: colors.bodyBg, minHeight: '100vh' } : { padding: spaceLg }}>
      {!isIframe && <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />}
      <Card
        style={isIframe ? { border: 'none', boxShadow: 'none', padding: 0 } : { maxWidth: '800px' }}
        styles={isIframe ? { body: { padding: 0 } } : undefined}
      >
        {!isIframe && <h2>{isCreateMode ? 'Tạo mới đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ' : 'Chỉnh sửa đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ'}</h2>}
        {formContent}
      </Card>
    </div>
  );
}

