import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  Modal, Tabs, Space, Form, Button, Typography, Row, Col, InputNumber,
  Select, Input, Upload, DatePicker,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  PlusOutlined, DeleteOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { organizationService } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import type { DryPort } from '../../types/port';
import {
  actionPrimary, statusOperational, spaceFormField, radiusPill,
  surfaceCard, borderDefault, textPrimary, textSecondary, textTertiary,
  spaceMd, spaceSm, spaceXs,
  fontSans, fontWeightBold, fontWeightMedium,
  fontSizeMd, fontSizeSm,
} from '../../tokens';
import { colors } from '../../theme';

/* ───────────────────────────────────────────────
   Constant option lists
   ─────────────────────────────────────────────── */
const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

const DISPLAY_RULE_OPTIONS = [
  { value: 1, label: 'Mặc định' },
  { value: 2, label: 'Zoom ≥ 10' },
  { value: 3, label: 'Zoom ≥ 12' },
];

const PORT_STATUS_OPTIONS = [
  { value: 0, label: 'Chưa khai thác' },
  { value: 1, label: 'Vận hành' },
];

const REGION_OPTIONS = [
  { value: 'Miền Bắc', label: 'Miền Bắc' },
  { value: 'Miền Trung', label: 'Miền Trung' },
  { value: 'Miền Nam', label: 'Miền Nam' },
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILE_COUNT = 10;

/* ── Save actions ── */
type SaveAction = 'DRAFT' | 'SUBMIT' | 'SAVE_AND_APPROVE';

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */
const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

const selectStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

const numberInputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: radiusPill,
  height: 40,
};

/* ── Parse WKT coordinates from GisLocationSelector value ── */
const parseGisCoordinates = (
  gisLocation: { geometryType?: string; coordinates?: string } | undefined | null,
): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) {
      const match = wkt.match(/LINESTRING\s*\(([^)]+)\)/);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
        }).filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
      }
    }
    if (wkt.startsWith('POLYGON((')) {
      const match = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/);
      if (match) {
        const pts = match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
        }).filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
        if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude && pts[0].latitude === pts[pts.length - 1].latitude) {
          pts.pop();
        }
        return pts;
      }
    }
    const multiMatch = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)/);
    if (multiMatch) {
      return multiMatch[1]
        .split('),(')
        .map((pt) => {
          const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
          return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
        })
        .filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
    }
    const match = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/);
    if (match) {
      return [{ latitude: parseFloat(match[2]), longitude: parseFloat(match[1]) }];
    }
  } catch {
    /* invalid WKT */
  }
  return [];
};

/* ───────────────────────────────────────────────
   Component
   ─────────────────────────────────────────────── */
export default function DryPortForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const watchedGeometryType = Form.useWatch('geometryType', form);
  const [submitting, setSubmitting] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];
  const isSystemAdmin = userPermissions.includes('admin:manage');

  // ── Org unit options ──
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // ── GPS sub-table state ──
  const [coordinateList, setCoordinateList] = useState<Array<{ latitude: number | null; longitude: number | null }>>([
    { latitude: null, longitude: null },
  ]);

  // ── Symbol state ──
  const [symbols, setSymbols] = useState<Symbol[]>([]);

  // ── File upload state ──
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  // ── Edit-mode loaded data ref ──
  const editCodeRef = useRef<string | undefined>(undefined);

  // ── Load symbols ──
  useEffect(() => {
    (async () => {
      try {
        const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        setSymbols(res.data || []);
      } catch { console.error('Failed to load symbols'); }
    })();
  }, []);

  // ── Load organization units from API ──
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
      } catch {
        console.error('Failed to load organizations');
      } finally {
        setLoadingOrgs(false);
      }
    })();
  }, []);

  // ── Non-admin auto-fill orgUnit from user profile ──
  useEffect(() => {
    if (!isSystemAdmin) {
      (async () => {
        try {
          const res = await api.get('/users/me');
          const profile = res.data?.data ?? res.data;
          if (profile?.orgUnitId) {
            form.setFieldsValue({ orgUnitId: profile.orgUnitId });
          }
        } catch {
          console.error('Failed to load user profile for orgUnit auto-fill');
        }
      })();
    }
  }, [form, isSystemAdmin]);

  // ── Auto-generate dryPortCode for new record ──
  useEffect(() => {
    if (!isEdit) {
      setCodeLoading(true);
      (async () => {
        try {
          const res = await api.get('/v1/dry-ports/generate-code');
          const code: string = res.data?.data?.code ?? res.data?.data?.dryPortCode ?? '';
          if (code) form.setFieldsValue({ dryPortCode: code });
        } catch {
          console.warn('Không thể lấy mã cảng cạn từ API, backend sẽ tự sinh khi lưu');
        } finally {
          setCodeLoading(false);
        }
      })();
    }
  }, [isEdit, form]);

  // ── Edit mode: load existing dry port ──
  useEffect(() => {
    if (isEdit && id) {
      (async () => {
        try {
          const res = await api.get(`/v1/dry-ports/${id}`);
          const data: DryPort = res.data?.data ?? res.data;

          const effectiveCoords = data.coordinates
            ? parseGisCoordinates({ geometryType: 'POINT', coordinates: data.coordinates })
            : [];
          setCoordinateList(
            effectiveCoords.length > 0
              ? effectiveCoords.map((c) => ({ latitude: c.latitude, longitude: c.longitude }))
              : data.latitude != null && data.longitude != null
                ? [{ latitude: data.latitude, longitude: data.longitude }]
                : [{ latitude: null, longitude: null }]
          );

          // Load existing attachments
          try {
            const fileRes = await api.get(`/v1/documents/entity/dryport/${id}`, { params: { page: 0, size: 50 } });
            setExistingFiles(fileRes.data?.data?.content || fileRes.data?.data || []);
          } catch { setExistingFiles([]); }

          editCodeRef.current = data.dryPortCode;

          form.setFieldsValue({
            orgUnitId: data.orgUnitId,
            dryPortCode: data.dryPortCode,
            dryPortName: data.dryPortName,
            operatingUnit: data.operatingUnit,
            region: data.region,
            provinceId: data.provinceId !== undefined && data.provinceId !== null
              ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined
              : undefined,
            detailedLocation: data.detailedLocation,
            transportCorridor: data.transportCorridor,
            area: data.area,
            teuCapacity: data.teuCapacity,
            warehouseArea: data.warehouseArea,
            yardArea: data.yardArea,
            connectionMode: data.connectionMode,
            portStatus: data.portStatus !== undefined && data.portStatus !== null ? data.portStatus : 0,
            remarks: data.remarks,
            announcementTime: data.announcementTime ? dayjs(data.announcementTime) : undefined,
            announcementDecisionNumber: data.announcementDecisionNumber,
            announcementDecisionDate: data.announcementDecisionDate ? dayjs(data.announcementDecisionDate) : undefined,
            announcementOrg: data.announcementOrg,
            geometryType: 'POINT',
            mapSymbolId: data.mapSymbolId,
            spatialId: data.spatialId,
            coordinateSystem: data.coordinateSystem,
            displayRule: data.displayRule,
            gisLocation: data.coordinates ? { geometryType: 'POINT', coordinates: data.coordinates } : undefined,
          });
        } catch {
          toast.error('Không thể tải thông tin cảng cạn');
          navigate('/dry-port');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  /* ── File upload handlers ── */
  const handleBeforeUpload = (file: File): false => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" vượt quá 20MB`);
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
      uid: `-${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 9)}`,
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

  /* ── GPS handlers ── */
  const updateCoordinate = (index: number, field: 'latitude' | 'longitude', value: number | null) => {
    setCoordinateList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addCoordinate = () => {
    setCoordinateList((prev) => [...prev, { latitude: null, longitude: null }]);
  };

  const removeCoordinate = (index: number) => {
    if (coordinateList.length <= 1) return;
    setCoordinateList((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Submit handler ── */
  const handleSave = async (saveAction: SaveAction) => {
    const values = form.getFieldsValue();
    const dryPortName = String(values.dryPortName ?? '').trim();
    const orgUnitId = values.orgUnitId || undefined;
    const provinceName: string | undefined = values.provinceId;

    // ── Tên cảng cạn: luôn bắt buộc ──
    if (!dryPortName) {
      toast.error('Tên cảng cạn là bắt buộc');
      return;
    }

    // ── Lưu và phê duyệt: kiểm tra đủ 6 trường bắt buộc (BR-026-03) ──
    if (saveAction === 'SAVE_AND_APPROVE') {
      const missing: string[] = [];
      if (!orgUnitId) missing.push('Đơn vị quản lý');
      if (!provinceName) missing.push('Tỉnh/Thành phố');
      if (!values.detailedLocation?.trim()) missing.push('Địa chỉ chi tiết');
      if (values.teuCapacity == null || Number.isNaN(Number(values.teuCapacity))) missing.push('Công suất (TEU)');
      if (values.portStatus == null) missing.push('Tình trạng');
      if (missing.length > 0) {
        toast.error(`Vui lòng hoàn thiện thông tin trước khi lưu. Thiếu: ${missing.join(', ')}`);
        return;
      }
    }

    // ── Resolve coordinates ──
    const gisCoords = parseGisCoordinates(values.gisLocation);
    const manualCoords = coordinateList
      .filter(
        (c) =>
          c.latitude !== null &&
          c.longitude !== null &&
          !Number.isNaN(Number(c.latitude)) &&
          !Number.isNaN(Number(c.longitude)),
      )
      .map((c) => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) }));

    const effectiveCoords = gisCoords.length > 0 ? gisCoords : manualCoords;

    // ── Submit/Approve validation ──
    if (saveAction !== 'DRAFT' && effectiveCoords.length === 0) {
      toast.error('Vui lòng thêm ít nhất một tọa độ GPS để gửi phê duyệt');
      return;
    }

    setSubmitting(true);
    try {
      const actionMap: Record<SaveAction, string> = { DRAFT: 'draft', SAVE_AND_APPROVE: 'approve' };
      const payload: Record<string, unknown> = {
        saveAction: actionMap[saveAction],
        dryPortCode: String(values.dryPortCode || '').trim() || undefined,
        dryPortName,
        orgUnitId,
        latitude: effectiveCoords.length > 0 ? effectiveCoords[0].latitude : undefined,
        longitude: effectiveCoords.length > 0 ? effectiveCoords[0].longitude : undefined,
        operatingUnit: values.operatingUnit || undefined,
        region: values.region || undefined,
        provinceId: provinceName ? VIETNAM_PROVINCES.indexOf(provinceName) + 1 : undefined,
        detailedLocation: values.detailedLocation || undefined,
        transportCorridor: values.transportCorridor || undefined,
        area: values.area !== undefined && values.area !== null && !Number.isNaN(Number(values.area)) ? Number(values.area) : undefined,
        teuCapacity: values.teuCapacity !== undefined && values.teuCapacity !== null && !Number.isNaN(Number(values.teuCapacity)) ? Number(values.teuCapacity) : undefined,
        warehouseArea: values.warehouseArea !== undefined && values.warehouseArea !== null && !Number.isNaN(Number(values.warehouseArea)) ? Number(values.warehouseArea) : undefined,
        yardArea: values.yardArea !== undefined && values.yardArea !== null && !Number.isNaN(Number(values.yardArea)) ? Number(values.yardArea) : undefined,
        connectionMode: values.connectionMode || undefined,
        portStatus: values.portStatus !== undefined && values.portStatus !== null ? Number(values.portStatus) : undefined,
        remarks: values.remarks || undefined,
        mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem !== undefined && values.coordinateSystem !== null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule !== undefined && values.displayRule !== null ? Number(values.displayRule) : undefined,
        announcementTime: values.announcementTime
          ? (typeof values.announcementTime === 'string' ? values.announcementTime : values.announcementTime.toISOString())
          : undefined,
        announcementDecisionNumber: values.announcementDecisionNumber || undefined,
        announcementDecisionDate: values.announcementDecisionDate
          ? (typeof values.announcementDecisionDate === 'string' ? values.announcementDecisionDate : values.announcementDecisionDate.format('YYYY-MM-DD'))
          : undefined,
        announcementOrg: values.announcementOrg || undefined,
      };

      // Remove undefined fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      let createdId: string | undefined;

      if (isEdit && id) {
        await api.put('/v1/dry-ports', { ...payload, id });
        createdId = id;
      } else {
        const res = await api.post('/v1/dry-ports', payload);
        createdId = res.data?.data?.id ?? res.data?.id;
      }

      const successMsg =
        saveAction === 'DRAFT'
          ? 'Lưu tạm thành công'
          : 'Phê duyệt thành công';
      toast.success(successMsg);

      // Upload files after dry port is saved (batch upload)
      if (createdId && uploadedFiles.length > 0) {
        try {
          const formData = new FormData();
          for (const fileItem of uploadedFiles) {
            const originFile = fileItem.originFileObj as File;
            if (originFile) formData.append('files', originFile);
          }
          await api.post(`/v1/dry-ports/${createdId}/attachments`, formData, {
            headers: { 'Content-Type': undefined as any },
          });
          toast.success(`Đã tải lên ${uploadedFiles.length} tệp đính kèm`);
        } catch {
          toast.error('Tải tệp đính kèm thất bại');
        }
      }

      // After DRAFT: stay on form; after SAVE_AND_APPROVE: navigate to list
      if (saveAction !== 'DRAFT') {
        navigate('/dry-port');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── UI ── */
  return (
    <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }} title={
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
          {isEdit ? 'Chỉnh sửa Cảng cạn' : 'Tạo mới Cảng cạn'}
        </span>
      }
      open
      onCancel={() => navigate('/dry-port')}
      footer={null}
      width={900}
      forceRender
      styles={{ body: { maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          geometryType: 'POINT',
          coordinateSystem: 1,
          portStatus: 0,
        }}
        scrollToFirstError
      >
        <Tabs
          defaultActiveKey="general"
          items={[
            {
              key: 'general',
              label: 'Thông tin chung',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }}>
                        <Select placeholder="Chọn đơn vị quản lý..." loading={loadingOrgs} disabled={isEdit || !isSystemAdmin} options={orgUnitOptions} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="dryPortCode" {...labelProps('Mã cảng cạn')} required style={{ marginBottom: spaceFormField }} tooltip="Mã cảng cạn được sinh tự động, không thể chỉnh sửa">
                        <Input disabled placeholder={codeLoading ? 'Đang sinh mã...' : 'Mã tự động'} style={{ ...inputStyle, color: textTertiary, cursor: 'not-allowed' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="dryPortName" {...labelProps('Tên cảng cạn')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên cảng cạn không được để trống' }, { max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' }]}>
                        <Input placeholder="VD: Cảng cạn Tân Cảng" maxLength={255} style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="provinceId" {...labelProps('Tỉnh/Thành phố')} style={{ marginBottom: spaceFormField }}>
                        <Select showSearch placeholder="Chọn tỉnh/thành phố..." filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))} style={selectStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="detailedLocation" {...labelProps('Địa chỉ chi tiết')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Khu công nghiệp Đình Vũ, Hải Phòng" maxLength={500} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="operatingUnit" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Công ty CP Cảng cạn Tân Cảng" maxLength={255} style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="region" {...labelProps('Khu vực')} style={{ marginBottom: spaceFormField }}>
                        <Select placeholder="Chọn khu vực..." allowClear options={REGION_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="transportCorridor" {...labelProps('Hành lang vận tải')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Hành lang kinh tế Đông - Tây" maxLength={255} style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="connectionMode" {...labelProps('Kết nối giao thông')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Đường bộ + Đường sắt" maxLength={500} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="portStatus" {...labelProps('Tình trạng')} style={{ marginBottom: spaceFormField }}>
                        <Select options={PORT_STATUS_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="remarks" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="Ghi chú" maxLength={1000} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'capacity',
              label: 'Năng lực',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="teuCapacity" {...labelProps('Công suất (TEU/năm)')} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="area" {...labelProps('Tổng diện tích (m²)')} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="warehouseArea" {...labelProps('Diện tích kho (m²)')} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="yardArea" {...labelProps('Diện tích bãi (m²)')} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'announcement',
              label: 'Thông tin công bố',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="announcementTime" {...labelProps('Thời điểm công bố')} style={{ marginBottom: spaceFormField }}>
                        <DatePicker showTime placeholder="Chọn ngày giờ..." format="DD/MM/YYYY HH:mm" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="announcementDecisionNumber" {...labelProps('Số QĐ công bố')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Số 123/QĐ-BGTVT" maxLength={100} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="announcementDecisionDate" {...labelProps('Ngày ra QĐ')} style={{ marginBottom: spaceFormField }}>
                        <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="announcementOrg" {...labelProps('Đơn vị ra QĐ')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Bộ Giao thông Vận tải" maxLength={255} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'location',
              label: 'Vị trí',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                        <Select options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng bản đồ')} style={{ marginBottom: spaceFormField }}>
                        <Select placeholder="Chọn biểu tượng hiển thị" allowClear showSearch optionFilterProp="label" disabled={!watchedGeometryType} style={selectStyle}>
                          {symbols.map((sym) => (
                            <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                              <Space>
                                {sym.image && (
                                  <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                )}
                                <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                              </Space>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                        <Select options={COORD_SYS_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                        <Select options={DISPLAY_RULE_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="gisLocation" {...labelProps('Tọa độ GPS')} required style={{ marginBottom: spaceFormField }}>
                        <GisLocationSelector defaultGeometryType={watchedGeometryType || 'POINT'} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
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
                            border: `0.5px solid ${borderDefault}`,
                            borderRadius: radiusPill,
                            padding: spaceSm,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spaceSm,
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
                  <Upload beforeUpload={handleBeforeUpload} onRemove={handleRemoveFile} fileList={uploadedFiles} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif">
                    <Button icon={<UploadOutlined />}>Chọn file (≤10 files, ≤20MB)</Button>
                  </Upload>
                </>
              ),
            },
          ]}
        />

        <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/dry-port')} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
            <Button onClick={() => handleSave('DRAFT')} loading={submitting} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Lưu tạm</Button>
            {isSystemAdmin && (
              <Button type="primary" onClick={() => handleSave('SAVE_AND_APPROVE')} loading={submitting} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Lưu và phê duyệt</Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
