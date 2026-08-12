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
  Breadcrumb,
  Modal,
} from 'antd';
import toast from '../../components/ToastNotification';
import { radarStationCRUD, radarStationApproval } from '../../services/radarStationService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import type {
  RadarStationResponse,
  CreateRadarStationRequest,
  UpdateRadarStationRequest,
  PheDuyetRequest,
} from '../../types/radarStation';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';

const LOAI_TRAM_MAP: Record<string, string> = {
  'MAIN': 'Trạm radar chính',
  'SECONDARY': 'Trạm radar phụ',
  'ASSIST': 'Trạm radar hỗ trợ',
  'KHAC': 'Khác',
};

const TINH_TRANG_MAP: Record<string, string> = {
  'TOT': 'Hoạt động tốt',
  'KEM': 'Hoạt động kém',
  'NGUNG': 'Ngừng hoạt động',
};

export interface RadarStationFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function RadarStationForm({ open, editId, mode, onCancel, onSuccess }: RadarStationFormProps = {}) {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const watchLoaiHinhHoc = Form.useWatch('loaiHinhHoc', form) || 'POINT';

  const isIframe = window.self !== window.top;
  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeId;
  const isEditMode = isModalMode ? mode === 'edit' : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? mode === 'detail' : (!!id && !isEditMode);
  const isCreateMode = isModalMode ? mode === 'create' : !id;

  const [record, setRecord] = useState<RadarStationResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [vtsSystemList, setVtsSystemList] = useState<any[]>([]);

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
    (async () => {
      try {
        const resp = await vtsSystemCRUD.list({ pageSize: 1000 });
        setVtsSystemList(resp.items || []);
      } catch (err) {
        console.error('Failed to load VTS list', err);
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
          const data = cached || await radarStationCRUD.getById(id);
          setRecord(data);
          form.setFieldsValue({
            stationName: data.stationName,
            location: data.location,
            longitude: data.longitude,
            latitude: data.latitude,
            stationType: data.stationType,
            coverage: data.coverage,
            emissionArea: data.emissionArea,
            source: data.source,
            conditionStatus: data.conditionStatus,
            orgUnitId: data.orgUnitId,
            vtsSystemId: data.vtsSystemId,
            towerHeight: data.towerHeight,
            radarRange: data.radarRange,
            loaiHinhHoc: data.loaiHinhHoc || 'POINT',
            gisLocation: {
              loaiHinhHoc: data.loaiHinhHoc || 'POINT',
              toaDo: data.toaDo || '',
              bieuTuongId: data.bieuTuongId
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
      // Create mode - reset all form fields and record
      form.resetFields();
      setRecord(null);
      setFormError(null);
      setHasChanges(false);
    }
  }, [id, isEditMode, form]);

  // Fetch history
  useEffect(() => {
    if (id && isDetailMode) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          const hist = await radarStationApproval.getHistory(id);
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
      const payload: CreateRadarStationRequest = {
        stationName: values.stationName,
        location: values.location,
        longitude: values.longitude,
        latitude: values.latitude,
        stationType: values.stationType,
        coverage: values.coverage,
        emissionArea: values.emissionArea,
        source: values.source,
        conditionStatus: values.conditionStatus,
        orgUnitId: values.orgUnitId,
        vtsSystemId: values.vtsSystemId,
        towerHeight: values.towerHeight,
        radarRange: values.radarRange,
        bieuTuongId: values.gisLocation?.bieuTuongId || undefined,
        loaiHinhHoc: values.loaiHinhHoc,
        toaDo: values.gisLocation?.toaDo,
      };

      if (isCreateMode) {
        await radarStationCRUD.create(payload);
        toast.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/radar-station');
        }
      } else if (id && isEditMode) {
        const res = await radarStationCRUD.update(id, payload as UpdateRadarStationRequest);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/radar-station');
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
        const pheDuyetData: ApprovalRequest = {
          decision: 'APPROVED',
        };
        const res = await radarStationApproval.approveC1(id, pheDuyetData);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Phê duyệt C1 thành công');
        setRecord({ ...record, approvalStatus: 'UNDER_REVIEW' });
        setHasChanges(true);
        if (onSuccess) onSuccess();
      } else if (action === 'approveC2') {
        const pheDuyetData: ApprovalRequest = {
          decision: 'APPROVED',
        };
        const res = await radarStationApproval.approveC2(id, pheDuyetData);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Phê duyệt C2 thành công');
        setRecord({ ...record, approvalStatus: 'APPROVED' });
        setHasChanges(true);
        if (onSuccess) onSuccess();
      } else if (action === 'reject') {
        const pheDuyetData: ApprovalRequest = {
          decision: 'REJECTED',
          reason: payload?.lyDo as string,
        };

        let updatedRecord;
        if (record.approvalStatus === 'PROPOSED' || record.approvalStatus === 'REJECTED') {
          updatedRecord = await radarStationApproval.approveC1(id, pheDuyetData);
        } else if (record.approvalStatus === 'UNDER_REVIEW') {
          updatedRecord = await radarStationApproval.approveC2(id, pheDuyetData);
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
        setHasChanges(true);
      } else if (action === 'delete') {
        await radarStationCRUD.delete(id);
        toast.success('Xóa thành công');
        if (isModalMode && onSuccess) {
          onSuccess();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/radar-station');
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
    { title: 'Trạm Radar', onClick: () => navigate('/radar-station') },
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
          <Button onClick={() => navigate('/radar-station')} style={{ marginTop: '16px' }}>
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
          <h2>Chi tiết Trạm Radar</h2>
          {record && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Tên trạm">{record.stationName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{record.location}</Descriptions.Item>

              <Descriptions.Item label="Loại trạm">
                {LOAI_TRAM_MAP[record.stationType] || record.stationType || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cơ trình">{record.coverage ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Diện tích phát xạ (m²)">
                {record.emissionArea !== undefined ? record.emissionArea.toFixed(2) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Nguồn gốc">{record.source ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Tình trạng">
                {TINH_TRANG_MAP[record.conditionStatus] || record.conditionStatus || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn vị quản lý" span={2}>
                {record.orgUnitName || record.orgUnitId || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Hệ thống VTS" span={2}>
                {record.vtsSystemName || (record.vtsSystemId ? `VTS-${record.vtsSystemId}` : '—')}
              </Descriptions.Item>
              <Descriptions.Item label="Chiều cao tháp radar (m)">
                {record.towerHeight != null
                  ? `${Number(record.towerHeight).toLocaleString('vi-VN')}m`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tầm hiệu lực radar">
                {record.radarRange != null
                  ? `${Number(record.radarRange).toLocaleString('vi-VN')}Nm`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <ApprovalStatusBadge status={record.approvalStatus} />
              </Descriptions.Item>
              {record.rejectionReason && (
                <Descriptions.Item label="Lý do từ chối" span={2}>
                  {record.rejectionReason}
                </Descriptions.Item>
              )}
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
              currentStatus={record.approvalStatus as any}
              permissions={userPermissions}
              entityPermissionPrefix="radarstation"
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
                radarStationApproval
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
          title="Chi tiết Trạm Radar"
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
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isCreateMode ? 'Tạo mới Trạm Radar' : 'Chỉnh sửa Trạm Radar'}</span>}
        open={open}
        onCancel={handleCloseModal}
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
            <Form.Item label="Tên trạm" name="stationName">
              <Input placeholder="Nhập tên trạm (không bắt buộc)" />
            </Form.Item>

            <Form.Item
              name="loaiHinhHoc"
              label="Loại đối tượng"
              rules={[
                { required: true, message: "Vui lòng chọn loại đối tượng" },
              ]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="Chọn loại đối tượng"
                options={[
                  { value: "POINT", label: "Đối tượng điểm" },
                  { value: "LINE", label: "Đối tượng đường" },
                  { value: "POLYGON", label: "Đối tượng vùng" },
                ]}
              />
            </Form.Item>

            <Form.Item name="gisLocation">
              <GisLocationSelector defaultGeometryType={watchLoaiHinhHoc} />
            </Form.Item>

            <Form.Item
              label="Vị trí"
              name="location"
              rules={[{ required: true, message: "Vui lòng nhập vị trí" }]}
            >
              <Input placeholder="Nhập vị trí" />
            </Form.Item>

            <Form.Item label="Loại trạm" name="stationType">
              <Select
                placeholder="Chọn loại trạm"
                options={[
                  { label: "Trạm radar chính", value: "MAIN" },
                  { label: "Trạm radar phụ", value: "SECONDARY" },
                  { label: "Trạm radar hỗ trợ", value: "ASSIST" },
                  { label: "Khác", value: "KHAC" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Cơ trình" name="coverage">
              <Input placeholder="Nhập cơ trình" />
            </Form.Item>

            <Form.Item
              label="Diện tích phát xạ (m²)"
              name="emissionArea"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value && value !== 0) return Promise.resolve();
                    if (value <= 0)
                      return Promise.reject(new Error("Phải > 0"));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={0}
                step={1}
                placeholder="Nhập diện tích phát xạ"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item label="Nguồn gốc" name="source">
              <Input placeholder="Nhập nguồn gốc" />
            </Form.Item>

            <Form.Item label="Tình trạng" name="conditionStatus">
              <Select
                placeholder="Chọn tình trạng"
                options={[
                  { label: "Hoạt động tốt", value: "TOT" },
                  { label: "Hoạt động kém", value: "KEM" },
                  { label: "Ngừng hoạt động", value: "NGUNG" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Đơn vị quản lý" name="orgUnitId">
              <Select
                placeholder="Chọn đơn vị quản lý"
                allowClear
                options={organizations.map((org) => ({
                  value: org.id,
                  label: org.code ? `${org.code} - ${org.name}` : org.name,
                }))}
              />
            </Form.Item>

            <Form.Item label="Hệ thống VTS" name="vtsSystemId">
              <Select
                placeholder="Chọn hệ thống VTS"
                allowClear
                options={vtsSystemList.map((vts) => ({
                  value: vts.id,
                  label: vts.systemName,
                }))}
              />
            </Form.Item>

            <Form.Item label="Chiều cao tháp radar (m)" name="towerHeight">
              <InputNumber min={0} step={0.1} placeholder="Nhập chiều cao" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Tầm hiệu lực radar" name="radarRange">
              <InputNumber min={0} step={1} placeholder="Nhập tầm hiệu lực" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Space
                style={{
                  display: "flex",
                  justifyContent: "end",
                  marginTop: 16,
                }}
              >
                <Button onClick={onCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  {isCreateMode ? "Tạo mới" : "Cập nhật"}
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
        {!isIframe && <h2>{isCreateMode ? 'Tạo mới Trạm Radar' : 'Chỉnh sửa Trạm Radar'}</h2>}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
        >
          <Form.Item label="Tên trạm" name="stationName">
            <Input placeholder="Nhập tên trạm (không bắt buộc)" />
          </Form.Item>

          <Form.Item name="loaiHinhHoc" label="Loại đối tượng" rules={[{ required: true, message: 'Vui lòng chọn loại đối tượng' }]} style={{ width: '100%' }}>
            <Select placeholder="Chọn loại đối tượng" options={[
              { value: 'POINT', label: 'Đối tượng điểm' },
              { value: 'LINE', label: 'Đối tượng đường' },
              { value: 'POLYGON', label: 'Đối tượng vùng' }
            ]} />
          </Form.Item>

          <Form.Item name="gisLocation">
            <GisLocationSelector defaultGeometryType={watchLoaiHinhHoc} />
          </Form.Item>

          <Form.Item
            label="Vị trí"
            name="location"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
          >
            <Input placeholder="Nhập vị trí" />
          </Form.Item>

          <Form.Item label="Loại trạm" name="stationType">
            <Select
              placeholder="Chọn loại trạm"
              options={[
                { label: 'Trạm radar chính', value: 'MAIN' },
                { label: 'Trạm radar phụ', value: 'SECONDARY' },
                { label: 'Trạm radar hỗ trợ', value: 'ASSIST' },
                { label: 'Khác', value: 'KHAC' },
              ]}
            />
          </Form.Item>

          <Form.Item label="Cơ trình" name="coverage">
            <Input placeholder="Nhập cơ trình" />
          </Form.Item>

          <Form.Item
            label="Diện tích phát xạ (m²)"
            name="emissionArea"
            rules={[
              {
                validator: (_, value) => {
                  if (!value && value !== 0) return Promise.resolve();
                  if (value <= 0) return Promise.reject(new Error('Phải > 0'));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              step={1}
              placeholder="Nhập diện tích phát xạ"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Nguồn gốc" name="source">
            <Input placeholder="Nhập nguồn gốc" />
          </Form.Item>

          <Form.Item label="Tình trạng" name="conditionStatus">
            <Select
              placeholder="Chọn tình trạng"
              options={[
                { label: 'Hoạt động tốt', value: 'TOT' },
                { label: 'Hoạt động kém', value: 'KEM' },
                { label: 'Ngừng hoạt động', value: 'NGUNG' },
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
            label="Hệ thống VTS"
            name="vtsSystemId"
          >
            <Select
              placeholder="Chọn hệ thống VTS"
              allowClear
              options={vtsSystemList.map((vts) => ({
                value: vts.id,
                label: vts.systemName,
              }))}
            />
          </Form.Item>

          <Form.Item label="Chiều cao tháp radar (m)" name="towerHeight">
            <InputNumber min={0} step={0.1} placeholder="Nhập chiều cao" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Tầm hiệu lực radar" name="radarRange">
            <InputNumber min={0} step={1} placeholder="Nhập tầm hiệu lực" style={{ width: '100%' }} />
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
              <Button onClick={isIframe ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*') : () => navigate('/radar-station')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

