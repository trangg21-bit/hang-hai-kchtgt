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
import { tramRadarCRUD, tramRadarApproval } from '../../services/tramRadarService';
import { organizationService } from '../../services/organizationService';
import { heThongVTSCRUD } from '../../services/heThongVtsService';
import type {
  TramRadarResponse,
  CreateTramRadarRequest,
  UpdateTramRadarRequest,
  PheDuyetRequest,
} from '../../types/tramRadar';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import GisLocationSelector from '../../components/gis/GisLocationSelector';

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

export interface TramRadarFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function TramRadarForm({ open, editId, mode, onCancel, onSuccess }: TramRadarFormProps = {}) {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const watchLoaiHinhHoc = Form.useWatch('loaiHinhHoc', form) || 'POINT';

  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeId;
  const isEditMode = isModalMode ? mode === 'edit' : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? mode === 'detail' : (!!id && !isEditMode);
  const isCreateMode = isModalMode ? mode === 'create' : !id;

  const [record, setRecord] = useState<TramRadarResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [heThongVtsList, setHeThongVtsList] = useState<any[]>([]);

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
    (async () => {
      try {
        const resp = await heThongVTSCRUD.list({ pageSize: 1000 });
        setHeThongVtsList(resp.items || []);
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
          const data = await tramRadarCRUD.getById(id);
          setRecord(data);
          form.setFieldsValue({
            tenTram: data.tenTram,
            viTri: data.viTri,
            kinhDo: data.kinhDo,
            viDo: data.viDo,
            loaiTram: data.loaiTram,
            coTrinh: data.coTrinh,
            dienTichPhaXa: data.dienTichPhaXa,
            nguonGoc: data.nguonGoc,
            tinhTrang: data.tinhTrang,
            orgUnitId: data.orgUnitId,
            heThongVtsId: data.heThongVtsId,
            chieuCaoThapRadar: data.chieuCaoThapRadar,
            tamHieuLucRadar: data.tamHieuLucRadar,
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
          const hist = await tramRadarApproval.getHistory(id);
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
      const payload: CreateTramRadarRequest = {
        tenTram: values.tenTram,
        viTri: values.viTri,
        kinhDo: values.kinhDo,
        viDo: values.viDo,
        loaiTram: values.loaiTram,
        coTrinh: values.coTrinh,
        dienTichPhaXa: values.dienTichPhaXa,
        nguonGoc: values.nguonGoc,
        tinhTrang: values.tinhTrang,
        orgUnitId: values.orgUnitId,
        heThongVtsId: values.heThongVtsId,
        chieuCaoThapRadar: values.chieuCaoThapRadar,
        tamHieuLucRadar: values.tamHieuLucRadar,
        bieuTuongId: values.gisLocation?.bieuTuongId || undefined,
        loaiHinhHoc: values.loaiHinhHoc,
        toaDo: values.gisLocation?.toaDo,
      };

      if (isCreateMode) {
        await tramRadarCRUD.create(payload);
        message.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else {
          navigate('/tram-radar');
        }
      } else if (id && isEditMode) {
        await tramRadarCRUD.update(id, payload as UpdateTramRadarRequest);
        message.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else {
          navigate('/tram-radar');
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
          quyetDinh: 'APPROVED',
        };
        await tramRadarApproval.approveC1(id, pheDuyetData);
        message.success('Phê duyệt C1 thành công');
        setRecord({ ...record, trangThai: 'UNDER_REVIEW' });
        setHasChanges(true);
      } else if (action === 'approveC2') {
        const pheDuyetData: PheDuyetRequest = {
          quyetDinh: 'APPROVED',
        };
        await tramRadarApproval.approveC2(id, pheDuyetData);
        message.success('Phê duyệt C2 thành công');
        setRecord({ ...record, trangThai: 'APPROVED' });
        setHasChanges(true);
      } else if (action === 'reject') {
        const pheDuyetData: PheDuyetRequest = {
          quyetDinh: 'REJECTED',
          lyDo: payload?.lyDo as string,
        };

        if (record.trangThai === 'PROPOSED' || record.trangThai === 'REJECTED') {
          await tramRadarApproval.approveC1(id, pheDuyetData);
        } else if (record.trangThai === 'UNDER_REVIEW') {
          await tramRadarApproval.approveC2(id, pheDuyetData);
        }

        message.success('Từ chối thành công');
        setRecord({
          ...record,
          trangThai: 'REJECTED',
          lyDoTuChoi: payload?.lyDo as string,
        });
        setHasChanges(true);
      } else if (action === 'delete') {
        await tramRadarCRUD.delete(id);
        message.success('Xóa thành công');
        if (isModalMode && onSuccess) {
          onSuccess();
        } else {
          navigate('/tram-radar');
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
    { title: 'Trạm Radar', onClick: () => navigate('/tram-radar') },
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
          <Button onClick={() => navigate('/tram-radar')} style={{ marginTop: '16px' }}>
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
              <Descriptions.Item label="Tên trạm">{record.tenTram ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{record.viTri}</Descriptions.Item>
              <Descriptions.Item label="Kinh độ">
                {record.kinhDo !== undefined ? record.kinhDo.toFixed(6) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Vĩ độ">
                {record.viDo !== undefined ? record.viDo.toFixed(6) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Loại trạm">
                {LOAI_TRAM_MAP[record.loaiTram] || record.loaiTram || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cơ trình">{record.coTrinh ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Diện tích phát xạ (m²)">
                {record.dienTichPhaXa !== undefined ? record.dienTichPhaXa.toFixed(2) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Nguồn gốc">{record.nguonGoc ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Tình trạng">
                {TINH_TRANG_MAP[record.tinhTrang] || record.tinhTrang || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn vị quản lý" span={2}>
                {record.orgUnitId ? organizations.find(o => o.id === record.orgUnitId)?.name || record.orgUnitId : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Hệ thống VTS" span={2}>
                {record.tenHeThongVts || (record.heThongVtsId ? `VTS-${record.heThongVtsId}` : '—')}
              </Descriptions.Item>
              <Descriptions.Item label="Chiều cao tháp radar (m)">
                {record.chieuCaoThapRadar != null
                  ? `${Number(record.chieuCaoThapRadar).toLocaleString('vi-VN')}m`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tầm hiệu lực radar">
                {record.tamHieuLucRadar != null
                  ? `${Number(record.tamHieuLucRadar).toLocaleString('vi-VN')}Nm`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <ApprovalStatusBadge status={record.trangThaiPheDuyet} />
              </Descriptions.Item>
              {record.lyDoTuChoi && (
                <Descriptions.Item label="Lý do từ chối" span={2}>
                  {record.lyDoTuChoi}
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
              currentStatus={record.trangThai as any}
              permissions={userPermissions}
              entityPermissionPrefix="tramradar"
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
                tramRadarApproval
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

  if (isModalMode) {
    return (
      <Modal
        title={isCreateMode ? "Tạo mới Trạm Radar" : "Chỉnh sửa Trạm Radar"}
        open={open}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        <Spin spinning={isLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitForm}
            autoComplete="off"
          >
            <Form.Item label="Tên trạm" name="tenTram">
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
              name="viTri"
              rules={[{ required: true, message: "Vui lòng nhập vị trí" }]}
            >
              <Input placeholder="Nhập vị trí" />
            </Form.Item>

            <Form.Item
              label="Kinh độ"
              name="kinhDo"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value && value !== 0) return Promise.resolve();
                    if (value < -180 || value > 180) {
                      return Promise.reject(
                        new Error("Kinh độ phải trong khoảng -180 đến 180")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              validateTrigger="onChange"
            >
              <InputNumber
                min={-180}
                max={180}
                step={0.000001}
                precision={6}
                placeholder="Nhập kinh độ (WGS84)"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              label="Vĩ độ"
              name="viDo"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value && value !== 0) return Promise.resolve();
                    if (value < -90 || value > 90) {
                      return Promise.reject(
                        new Error("Vĩ độ phải trong khoảng -90 đến 90")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              validateTrigger="onChange"
            >
              <InputNumber
                min={-90}
                max={90}
                step={0.000001}
                precision={6}
                placeholder="Nhập vĩ độ (WGS84)"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item label="Loại trạm" name="loaiTram">
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

            <Form.Item label="Cơ trình" name="coTrinh">
              <Input placeholder="Nhập cơ trình" />
            </Form.Item>

            <Form.Item
              label="Diện tích phát xạ (m²)"
              name="dienTichPhaXa"
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

            <Form.Item label="Nguồn gốc" name="nguonGoc">
              <Input placeholder="Nhập nguồn gốc" />
            </Form.Item>

            <Form.Item label="Tình trạng" name="tinhTrang">
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

            <Form.Item label="Hệ thống VTS" name="heThongVtsId">
              <Select
                placeholder="Chọn hệ thống VTS"
                allowClear
                options={heThongVtsList.map((vts) => ({
                  value: vts.id,
                  label: vts.tenHeThong,
                }))}
              />
            </Form.Item>

            <Form.Item label="Chiều cao tháp radar (m)" name="chieuCaoThapRadar">
              <InputNumber min={0} step={0.1} placeholder="Nhập chiều cao" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Tầm hiệu lực radar" name="tamHieuLucRadar">
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
    <div style={{ padding: '24px' }}>
      <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />
      <Card style={{ maxWidth: '800px' }}>
        <h2>{isCreateMode ? 'Tạo mới Trạm Radar' : 'Chỉnh sửa Trạm Radar'}</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
        >
          <Form.Item label="Tên trạm" name="tenTram">
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
            name="viTri"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
          >
            <Input placeholder="Nhập vị trí" />
          </Form.Item>

          <Form.Item
            label="Kinh độ"
            name="kinhDo"
            rules={[
              {
                validator: (_, value) => {
                  if (!value && value !== 0) return Promise.resolve();
                  if (value < -180 || value > 180) {
                    return Promise.reject(new Error('Kinh độ phải trong khoảng -180 đến 180'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            validateTrigger="onChange"
          >
            <InputNumber
              min={-180}
              max={180}
              step={0.000001}
              precision={6}
              placeholder="Nhập kinh độ (WGS84)"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Vĩ độ"
            name="viDo"
            rules={[
              {
                validator: (_, value) => {
                  if (!value && value !== 0) return Promise.resolve();
                  if (value < -90 || value > 90) {
                    return Promise.reject(new Error('Vĩ độ phải trong khoảng -90 đến 90'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            validateTrigger="onChange"
          >
            <InputNumber
              min={-90}
              max={90}
              step={0.000001}
              precision={6}
              placeholder="Nhập vĩ độ (WGS84)"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Loại trạm" name="loaiTram">
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

          <Form.Item label="Cơ trình" name="coTrinh">
            <Input placeholder="Nhập cơ trình" />
          </Form.Item>

          <Form.Item
            label="Diện tích phát xạ (m²)"
            name="dienTichPhaXa"
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

          <Form.Item label="Nguồn gốc" name="nguonGoc">
            <Input placeholder="Nhập nguồn gốc" />
          </Form.Item>

          <Form.Item label="Tình trạng" name="tinhTrang">
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
            name="heThongVtsId"
          >
            <Select
              placeholder="Chọn hệ thống VTS"
              allowClear
              options={heThongVtsList.map((vts) => ({
                value: vts.id,
                label: vts.tenHeThong,
              }))}
            />
          </Form.Item>

          <Form.Item label="Chiều cao tháp radar (m)" name="chieuCaoThapRadar">
            <InputNumber min={0} step={0.1} placeholder="Nhập chiều cao" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Tầm hiệu lực radar" name="tamHieuLucRadar">
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
              <Button onClick={() => navigate('/tram-radar')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
