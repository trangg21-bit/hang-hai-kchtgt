import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Modal, Tabs, Space, Form, Button, Row, Col, InputNumber,
  Select, Input, Upload, DatePicker, Switch,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { organizationService } from '../../services/organizationService';
import { buoyCRUD } from '../../services/beaconService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { useAuthStore } from '../../store/authStore';
import {
  BUOY_TYPE_OPTIONS,
} from '../../types/beacon';
import type { Buoy } from '../../types/beacon';
import {
  actionPrimary, statusOperational, spaceFormField, radiusPill,
  surfaceCard, borderDefault, textPrimary, textSecondary, textTertiary,
  spaceMd, spaceSm,
  fontWeightBold, fontWeightMedium,
  fontSizeMd, fontSizeSm,
} from '../../tokens';
import { colors } from '../../theme';

/* ─── Constants ─── */

const COLOR_OPTIONS = [
  { value: 'RED', label: 'Đỏ' },
  { value: 'GREEN', label: 'Xanh lá' },
  { value: 'BLACK_RED', label: 'Đen + Đỏ' },
  { value: 'BLACK_YELLOW', label: 'Đen + Vàng' },
  { value: 'WHITE', label: 'Trắng' },
  { value: 'YELLOW', label: 'Vàng' },
  { value: 'ORANGE', label: 'Cam' },
];

const SHAPE_OPTIONS = [
  { value: 'CAN', label: 'Hình trụ (CAN)' },
  { value: 'CONE', label: 'Hình nón (CONE)' },
  { value: 'SPAR', label: 'Trụ (SPAR)' },
  { value: 'BELL', label: 'Chuông (BELL)' },
  { value: 'BUCKET', label: 'Gáo (BUCKET)' },
  { value: 'TUBULAR', label: 'Ống (TUBULAR)' },
];

const LIGHT_CHAR_OPTIONS = [
  { value: 'FL', label: 'FL - Chớp đơn' },
  { value: 'FL(2)', label: 'FL(2) - Chớp nhóm 2' },
  { value: 'FL(3)', label: 'FL(3) - Chớp nhóm 3' },
  { value: 'Iso', label: 'Iso - Đồng pha' },
  { value: 'Q', label: 'Q - Chớp nhanh' },
  { value: 'VQ', label: 'VQ - Chớp rất nhanh' },
  { value: 'Oc', label: 'Oc - Huyền phù' },
  { value: 'F', label: 'F - Cố định' },
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

/* ─── Helpers ─── */

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const numberInputStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };

type SaveAction = 'DRAFT' | 'SUBMIT';

/* ─── Component ─── */

export default function BuoyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const modeFromQuery = searchParams.get('mode'); // 'edit' when coming from list row action
  const isEdit = !!id || modeFromQuery === 'edit';
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];
  const isSystemAdmin = userPermissions.includes('admin:manage');

  // ── Org unit options ──
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // ── Entity data for edit mode ──
  const [entityData, setEntityData] = useState<Buoy | null>(null);

  // ── File upload state ──
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  // ── Load organization units ──
  useEffect(() => {
    (async () => {
      setLoadingOrgs(true);
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        const orgs = (resp.data || []).map((org: any) => ({
          value: org.id,
          label: org.name,
        }));
        setOrgUnitOptions(orgs);
      } catch { console.error('Failed to load organizations'); }
      finally { setLoadingOrgs(false); }
    })();
  }, []);

  // ── Non-admin auto-fill orgUnit from user profile ──
  useEffect(() => {
    if (!isSystemAdmin && !isEdit) {
      (async () => {
        try {
          const res = await api.get('/users/me');
          const profile = res.data?.data ?? res.data;
          if (profile?.orgUnitId) {
            form.setFieldsValue({ unitId: profile.orgUnitId });
          }
        } catch { /* ignore */ }
      })();
    }
  }, [form, isSystemAdmin, isEdit]);

  // ── Edit mode: load existing buoy ──
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: Buoy = await buoyCRUD.findById(id);
        setEntityData(data);

        // Load existing attachments
        try {
          const fileRes = await api.get(`/v1/documents/entity/buoy/${id}`, { params: { page: 0, size: 50 } });
          setExistingFiles(fileRes.data?.data?.content || fileRes.data?.data || []);
        } catch { setExistingFiles([]); }

        form.setFieldsValue({
          code: data.code,
          name: data.name,
          type: data.type,
          unitId: data.unitId,
          description: data.description || undefined,
          isActive: data.isActive,
          color: data.color || undefined,
          shape: data.shape || undefined,
          lightCharacteristic: data.lightCharacteristic || undefined,
          range: data.range,
          lastInspectionDate: data.lastInspectionDate ? dayjs(data.lastInspectionDate) : undefined,
          nextInspectionDate: data.nextInspectionDate ? dayjs(data.nextInspectionDate) : undefined,
          gisLocation: data.longitude != null && data.latitude != null
            ? { geometryType: 'POINT', coordinates: `POINT(${data.longitude} ${data.latitude})` }
            : undefined,
        });
      } catch {
        toast.error('Không thể tải thông tin phao tiêu');
        navigate('/buoys');
      }
    })();
  }, [isEdit, id, form, navigate]);

  /* ─── File upload ─── */

  const handleBeforeUpload = (file: File): false => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" vượt quá 10MB`);
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Định dạng .${ext} không được hỗ trợ`);
      return false;
    }
    if (uploadedFiles.length >= MAX_FILE_COUNT) {
      toast.error('Chỉ được upload tối đa 10 file');
      return false;
    }
    const uploadFile: UploadFile = {
      uid: `-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'done',
      originFileObj: file,
    };
    setUploadedFiles((prev) => [...prev, uploadFile]);
    return false;
  };

  const handleRemoveFile = (file: UploadFile) => {
    setUploadedFiles((prev) => prev.filter((f) => f.uid !== file.uid));
  };

  /* ─── Parse WKT from GisLocationSelector ─── */

  const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined) => {
    const wkt = gisLocation?.coordinates;
    if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return null;
    try {
      const match = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/);
      if (match) {
        return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
      }
    } catch { /* invalid */ }
    return null;
  };

  /* ─── Submit ─── */

  const handleSave = async (saveAction: SaveAction) => {
    const values = form.getFieldsValue();
    const code = String(values.code ?? '').trim();
    const name = String(values.name ?? '').trim();

    // ── Basic validation ──
    if (!isEdit && !code) { toast.error('Mã phao tiêu là bắt buộc'); return; }
    if (!name) { toast.error('Tên phao tiêu là bắt buộc'); return; }
    if (!values.type) { toast.error('Loại phao tiêu là bắt buộc'); return; }
    if (values.range == null || Number(values.range) <= 0 || Number(values.range) > 100) {
      toast.error('Phạm vi quan sát phải trong khoảng (0, 100] hải lý'); return;
    }

    // ── Coordinate validation (WGS84) ──
    const gisCoords = parseGisCoordinates(values.gisLocation);
    if (saveAction === 'SUBMIT' && !gisCoords) {
      toast.error('Vui lòng chọn vị trí trên bản đồ để gửi phê duyệt'); return;
    }
    if (gisCoords) {
      if (gisCoords.latitude < -90 || gisCoords.latitude > 90) {
        toast.error('Vĩ độ phải từ -90° đến 90° (WGS84)'); return;
      }
      if (gisCoords.longitude < -180 || gisCoords.longitude > 180) {
        toast.error('Kinh độ phải từ -180° đến 180° (WGS84)'); return;
      }
    }

    // ── Inspection date validation ──
    if (values.lastInspectionDate && values.nextInspectionDate) {
      if (dayjs(values.nextInspectionDate).isBefore(dayjs(values.lastInspectionDate))) {
        toast.error('Ngày kiểm tra kế tiếp không được nhỏ hơn ngày kiểm tra gần nhất'); return;
      }
    }
    if (values.lastInspectionDate && dayjs(values.lastInspectionDate).isAfter(dayjs(), 'day')) {
      toast.error('Ngày kiểm tra gần nhất không được lớn hơn ngày hiện tại'); return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        action: saveAction.toLowerCase(),
        name,
        type: values.type,
        range: values.range,
        color: values.color || undefined,
        shape: values.shape || undefined,
        lightCharacteristic: values.lightCharacteristic || undefined,
        description: values.description || undefined,
        unitId: values.unitId || undefined,
        isActive: values.isActive !== undefined ? values.isActive : true,
        lastInspectionDate: values.lastInspectionDate
          ? (typeof values.lastInspectionDate === 'string' ? values.lastInspectionDate : values.lastInspectionDate.format('YYYY-MM-DD'))
          : undefined,
        nextInspectionDate: values.nextInspectionDate
          ? (typeof values.nextInspectionDate === 'string' ? values.nextInspectionDate : values.nextInspectionDate.format('YYYY-MM-DD'))
          : undefined,
      };

      if (gisCoords) {
        payload.latitude = gisCoords.latitude;
        payload.longitude = gisCoords.longitude;
      }

      // Remove undefined fields
      Object.keys(payload).forEach((key) => { if (payload[key] === undefined) delete payload[key]; });

      let savedId: string | undefined;

      if (isEdit && id) {
        // For update, action field is not needed
        delete payload.action;
        delete payload.code;
        await buoyCRUD.update(id, payload as any);
        savedId = id;
      } else {
        payload.code = code;
        const res = await buoyCRUD.create(payload as any);
        savedId = (res as any)?.id;
      }

      const successMsg = saveAction === 'DRAFT' ? 'Lưu nháp thành công' : 'Gửi phê duyệt thành công';
      toast.success(successMsg);

      // Upload files
      if (savedId && uploadedFiles.length > 0) {
        let uploaded = 0;
        for (const fileItem of uploadedFiles) {
          const originFile = fileItem.originFileObj as File;
          if (!originFile) continue;
          try {
            const formData = new FormData();
            formData.append('file', originFile);
            await api.post(`/v1/documents/upload/buoy/${savedId}`, formData, {
              headers: { 'Content-Type': undefined as any },
            });
            uploaded++;
          } catch { toast.error(`Tải lên tệp "${fileItem.name}" thất bại`); }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
      }

      navigate('/buoys');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Type lock for edit mode (BR-075-02) ──
  const typeLocked = isEdit && entityData
    && (entityData.status === 'APPROVED_L2' || entityData.status === 'PUBLISHED');

  /* ─── JSX ─── */

  return (
    <Modal
      title={
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
          {isEdit ? 'Chỉnh sửa Phao tiêu' : 'Tạo mới Phao tiêu'}
        </span>
      }
      open
      onCancel={() => navigate('/buoys')}
      footer={null}
      width={900}
      forceRender
      styles={{ body: { maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 } }}
    >
      <Form form={form} layout="vertical" scrollToFirstError>
        <Tabs
          defaultActiveKey="general"
          items={[
            /* ── Tab 1: Thông tin chung ── */
            {
              key: 'general',
              label: 'Thông tin chung',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="code"
                        {...labelProps('Mã phao tiêu')}
                        required={!isEdit}
                        style={{ marginBottom: spaceFormField }}
                        rules={!isEdit ? [{ required: true, message: 'Mã phao tiêu không được để trống' }, { max: 50, message: 'Tối đa 50 ký tự' }] : []}
                      >
                        <Input
                          disabled={isEdit}
                          placeholder={isEdit ? undefined : 'VD: PT-HAIPHONG-001'}
                          maxLength={50}
                          style={{ ...inputStyle, ...(isEdit ? { color: textTertiary, cursor: 'not-allowed' } : {}) }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="name"
                        {...labelProps('Tên phao tiêu')}
                        required
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ required: true, message: 'Tên phao tiêu không được để trống' }, { max: 200, message: 'Tối đa 200 ký tự' }]}
                      >
                        <Input placeholder="VD: Phao tiêu số 0 - Hải Phòng" maxLength={200} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="type"
                        {...labelProps('Loại phao tiêu')}
                        required
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ required: true, message: 'Vui lòng chọn loại phao tiêu' }]}
                        tooltip={typeLocked ? 'Loại phao tiêu không thể thay đổi khi đã được phê duyệt' : undefined}
                      >
                        <Select
                          placeholder="Chọn loại phao..."
                          options={BUOY_TYPE_OPTIONS}
                          disabled={typeLocked}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="unitId"
                        {...labelProps('Đơn vị quản lý')}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn đơn vị quản lý (không bắt buộc)..."
                          loading={loadingOrgs}
                          options={orgUnitOptions}
                          showSearch
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                          allowClear
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="isActive" {...labelProps('Trạng thái hoạt động')} style={{ marginBottom: spaceFormField }} valuePropName="checked">
                        <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Ngừng hoạt động" defaultChecked />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        name="description"
                        {...labelProps('Mô tả')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ max: 1000, message: 'Tối đa 1000 ký tự' }]}
                      >
                        <Input.TextArea placeholder="Mô tả về phao tiêu..." maxLength={1000} rows={3} style={{ borderRadius: 8, fontSize: fontSizeMd }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            /* ── Tab 2: Thông tin kỹ thuật ── */
            {
              key: 'technical',
              label: 'Thông tin kỹ thuật',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="color" {...labelProps('Màu sắc')} style={{ marginBottom: spaceFormField }}>
                        <Select placeholder="Chọn màu sắc..." options={COLOR_OPTIONS} allowClear style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="shape" {...labelProps('Hình dạng')} style={{ marginBottom: spaceFormField }}>
                        <Select placeholder="Chọn hình dạng..." options={SHAPE_OPTIONS} allowClear style={selectStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="lightCharacteristic" {...labelProps('Đặc tính ánh sáng')} style={{ marginBottom: spaceFormField }}>
                        <Select placeholder="Chọn đặc tính..." options={LIGHT_CHAR_OPTIONS} allowClear style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="range"
                        {...labelProps('Phạm vi quan sát (hải lý)')}
                        required
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ required: true, message: 'Phạm vi quan sát là bắt buộc' }]}
                        tooltip="Từ 0.01 đến 100 hải lý"
                      >
                        <InputNumber min={0.01} max={100} step={0.01} precision={2} placeholder="VD: 5.0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="lastInspectionDate" {...labelProps('Ngày kiểm tra gần nhất')} style={{ marginBottom: spaceFormField }}>
                        <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="nextInspectionDate" {...labelProps('Ngày kiểm tra kế tiếp')} style={{ marginBottom: spaceFormField }}>
                        <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            /* ── Tab 3: Vị trí ── */
            {
              key: 'location',
              label: 'Vị trí',
              children: (
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="gisLocation" {...labelProps('Tọa độ GPS')} style={{ marginBottom: spaceFormField }}>
                      <GisLocationSelector defaultGeometryType="POINT" />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
            /* ── Tab 4: File đính kèm ── */
            {
              key: 'files',
              label: 'File đính kèm',
              children: (
                <>
                  {existingFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceSm }}>
                      {existingFiles.map((f: any) => {
                        const isImage = (f.mimeType || f.contentType || '').startsWith('image/');
                        return (
                          <div key={f.id} style={{
                            border: `0.5px solid ${borderDefault}`, borderRadius: radiusPill,
                            padding: spaceSm, display: 'flex', alignItems: 'center', gap: spaceSm,
                          }}>
                            {isImage ? (
                              <img src={`/api/v1/documents/${f.id}/file`} alt={f.fileName || f.name}
                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                                onClick={() => window.open(`/api/v1/documents/${f.id}/file`, '_blank')} />
                            ) : (
                              <UploadOutlined style={{ fontSize: 24, color: actionPrimary }} />
                            )}
                            <div>
                              <div style={{ fontSize: fontSizeMd, color: textPrimary }}>{f.fileName || f.name}</div>
                              <div style={{ fontSize: fontSizeSm, color: textTertiary }}>{(f.fileSize / 1024).toFixed(1)} KB</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Upload beforeUpload={handleBeforeUpload} onRemove={handleRemoveFile} fileList={uploadedFiles}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png">
                    <Button icon={<UploadOutlined />}>Chọn file (≤10 files, ≤10MB)</Button>
                  </Upload>
                </>
              ),
            },
          ]}
        />

        {/* ── Footer actions ── */}
        <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/buoys')} disabled={submitting}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>
              Hủy
            </Button>
            <Button onClick={() => handleSave('DRAFT')} loading={submitting} disabled={submitting}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>
              Lưu tạm
            </Button>
            <Button type="primary" onClick={() => handleSave('SUBMIT')} loading={submitting} disabled={submitting}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>
              Lưu và phê duyệt
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
