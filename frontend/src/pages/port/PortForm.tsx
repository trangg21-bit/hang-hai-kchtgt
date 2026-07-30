// ──────────────────────────────────────────────────────────────────
// PortForm.tsx — Tạo mới / Cập nhật Cảng biển
// ───
// Tuân thủ F-008 feature-brief:
//   - Draft/Submit flow (Lưu tạm / Gửi phê duyệt)
//   - 8 section form
//   - Tự sinh mã cảng (GET /api/v1/ports/generate-code)
//   - GPS sub-table (coordinateList[])
//   - Infrastructure sub-table (infrastructureList[])
//   - File upload (≤10 files, ≤20MB)
//   - Token compliance — KHÔNG hardcode hex
// ──────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react';
import {
  Card, Form, Button, Space, Typography, Row, Col,
  Input, InputNumber, Select, Upload, Table, Divider, message,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined,
  SaveOutlined, SendOutlined, UploadOutlined, InboxOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import api from '../../services/api';
import { portCRUD } from '../../services/portService';
import type { UpdateCangBienRequest } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
import {
  actionPrimary, actionHover, actionStyle,
  radiusPill, radiusMd, fontSizeMd, fontSizeLg, fontSizeSm,
  borderDefault, textSecondary, textTertiary, statusDraft,
  surfaceCard, surfacePage,
  cardStyle, spaceFormField, spaceMd, spaceLg, spaceXl, spaceSm, spaceXs,
  fontWeightMedium, fontWeightBold, metaStyle, dividerStyle,
} from '../../tokens';
import toast from '../../components/ToastNotification';

const { Text, Title } = Typography;
const { TextArea } = Input;

// ── Constants ─────────────────────────────────────────────────────

/** Select options for port class */
const PORT_CLASS_OPTIONS = [
  { label: 'Cảng biển loại I', value: 1 },
  { label: 'Cảng biển loại II', value: 2 },
  { label: 'Cảng biển loại III', value: 3 },
];

/** Select options for managing unit */
const MANAGING_UNIT_OPTIONS = [
  { label: 'Cục Hàng hải Việt Nam', value: 'VINAMARINE' },
  { label: 'Cảng vụ Hàng hải Hải Phòng', value: 'HAIPHONG' },
  { label: 'Cảng vụ Hàng hải Đà Nẵng', value: 'DANANG' },
  { label: 'Cảng vụ Hàng hải TP. Hồ Chí Minh', value: 'HCMC' },
  { label: 'Cảng vụ Hàng hải Quảng Ninh', value: 'QUANGNINH' },
  { label: 'Cảng vụ Hàng hải Nghệ Tĩnh', value: 'NGHETINH' },
  { label: 'Cảng vụ Hàng hải Khánh Hòa', value: 'KHANHHOA' },
  { label: 'Cảng vụ Hàng hải Đồng Nai', value: 'DONGNAI' },
  { label: 'Cảng vụ Hàng hải Cần Thơ', value: 'CANTHO' },
];

/** Select options for port group */
const PORT_GROUP_OPTIONS = [
  { label: 'Nhóm 1 - Bắc Bộ', value: 1 },
  { label: 'Nhóm 2 - Bắc Trung Bộ', value: 2 },
  { label: 'Nhóm 3 - Trung Bộ', value: 3 },
  { label: 'Nhóm 4 - Đông Nam Bộ', value: 4 },
  { label: 'Nhóm 5 - Đồng bằng sông Cửu Long', value: 5 },
];

/** Select options for GIS object type */
const GIS_OBJECT_TYPE_OPTIONS = [
  { label: 'Điểm (Point)', value: 'POINT' },
  { label: 'Đường (Line)', value: 'LINE' },
  { label: 'Vùng (Polygon)', value: 'POLYGON' },
];

/** Select options for coordinate system */
const COORDINATE_SYSTEM_OPTIONS = [
  { label: 'WGS-84 (VN-2000)', value: 1 },
  { label: 'VN-2000 (3 độ múi)', value: 2 },
];

/** Select options for display rule */
const DISPLAY_RULE_OPTIONS = [
  { label: 'Hiển thị mặc định', value: 1 },
  { label: 'Chỉ hiển thị khi zoom ≥ 10', value: 2 },
  { label: 'Chỉ hiển thị khi zoom ≥ 12', value: 3 },
];

/** Allowed MIME types for file upload */
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/tiff',
];

const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILES = 10;

/** Composite-index field definitions (14 fields, default 0) */
const COMPOSITE_INDEX_FIELDS: Array<{ name: string; label: string }> = [
  { name: 'tongSoBenCang', label: 'Tổng số bến cảng' },
  { name: 'tongSoKhuNeoDauChuyenTai', label: 'Tổng số khu neo đậu chuyển tải' },
  { name: 'tongSoTuyenLuongCongCong', label: 'Tổng số tuyến luồng công cộng' },
  { name: 'tongSoTuyenLuongChuyenDung', label: 'Tổng số tuyến luồng chuyên dùng' },
  { name: 'tongChieuDaiLuongCongCong', label: 'Tổng chiều dài luồng công cộng (m)' },
  { name: 'tongChieuDaiLuongChuyenDung', label: 'Tổng chiều dài luồng chuyên dùng (m)' },
  { name: 'tongSoPhaoTieuBaoHieu', label: 'Tổng số phao tiêu báo hiệu' },
  { name: 'tongSoDeKe', label: 'Tổng số đê kè' },
  { name: 'tongChieuDaiDeKe', label: 'Tổng chiều dài đê kè (m)' },
  { name: 'tongSoDenBienDangTieu', label: 'Tổng số đèn biển/dăng tiêu' },
  { name: 'quantityBenPhao', label: 'Số lượng bến phao' },
  { name: 'quantityKhuNeoDau', label: 'Số lượng khu neo đậu' },
  { name: 'quantityKhuChuyenTai', label: 'Số lượng khu chuyển tải' },
  { name: 'cacKhuNuocKhac', label: 'Các khu nước khác (mô tả)' },
];

/** Label style helper (matches UsersPage pattern) */
const labelStyle = (text: string) => ({
  label: (
    <span style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
      {text}
    </span>
  ),
});

// ── Interfaces for sub-table items ────────────────────────────────

interface CoordinateRow {
  key: string;
  latitude: number | null;
  longitude: number | null;
}

interface InfrastructureRow {
  key: string;
  stt: number;
  infraName: string;
  quantity: number | null;
}

interface AttachmentFile {
  uid: string;
  name: string;
  size: number;
  status?: 'done' | 'uploading' | 'error' | 'removed';
  url?: string;
  id?: string; // server-side id, set after upload
}

// ── Component ─────────────────────────────────────────────────────

export default function PortForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();

  // ── state ──
  const [submitting, setSubmitting] = useState(false);
  const [portCode, setPortCode] = useState<string>('');
  const [portCodeLoading, setPortCodeLoading] = useState(false);

  // GPS sub-table
  const [coordinates, setCoordinates] = useState<CoordinateRow[]>([]);

  // Infrastructure sub-table
  const [infrastructures, setInfrastructures] = useState<InfrastructureRow[]>([]);

  // File attachments
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<AttachmentFile[]>([]);

  // ── Auto-generate port code on mount (create mode) ──
  useEffect(() => {
    if (!isEdit) {
      (async () => {
        setPortCodeLoading(true);
        try {
          const res = await api.get('/v1/ports/generate-code');
          const code = res.data?.data || res.data?.portCode || '';
          setPortCode(code);
          form.setFieldValue('portCode', code);
        } catch {
          // silent — user can still type manually if API unavailable
        } finally {
          setPortCodeLoading(false);
        }
      })();
    }
  }, [isEdit, form]);

  // ── Load data in edit mode ──
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const data = await portCRUD.findById(id!);
        form.setFieldsValue({
          portCode: data.portCode,
          portName: data.portName,
          province: data.province,
          detailed_location: data.diaDiemChiTiet,
          portClass: data.phanCap,
          water_area_scope: data.phamViVungNuoc,
          managing_unit: data.orgUnitId,
          portGroup: data.portGroup,
          objectType: (data as any).loaiHinhHoc,
          symbolId: data.bieuTuongId,
          coordinateSystem: data.heQuyChieu,
          displayRule: data.quyTacHienThi,
          remarks: data.remarks,
          // Composite index fields
          tongSoBenCang: data.tongSoBenCang,
          tongSoKhuNeoDauChuyenTai: data.tongSoKhuNeoDauChuyenTai,
          tongSoTuyenLuongCongCong: data.tongSoTuyenLuongCongCong,
          tongSoTuyenLuongChuyenDung: data.tongSoTuyenLuongChuyenDung,
          tongChieuDaiLuongCongCong: data.tongChieuDaiLuongCongCong,
          tongChieuDaiLuongChuyenDung: data.tongChieuDaiLuongChuyenDung,
          tongSoPhaoTieuBaoHieu: data.tongSoPhaoTieuBaoHieu,
          tongSoDeKe: data.tongSoDeKe,
          tongChieuDaiDeKe: data.tongChieuDaiDeKe,
          tongSoDenBienDangTieu: data.tongSoDenBienDangTieu,
          quantityBenPhao: data.quantityBenPhao,
          quantityKhuNeoDau: data.quantityKhuNeoDau,
          quantityKhuChuyenTai: data.quantityKhuChuyenTai,
          cacKhuNuocKhac: data.cacKhuNuocKhac,
        });
        setPortCode(data.portCode);

        // Load existing coordinates
        const lat = data.latitude;
        const lng = data.longitude;
        const coords: CoordinateRow[] = [];
        if (lat != null && lng != null) {
          coords.push({ key: crypto.randomUUID(), latitude: lat, longitude: lng });
        }
        // If there's a coordinateList from the API, load it
        if ((data as any).coordinateList && Array.isArray((data as any).coordinateList)) {
          setCoordinates(
            (data as any).coordinateList.map((c: any, idx: number) => ({
              key: crypto.randomUUID(),
              latitude: c.latitude,
              longitude: c.longitude,
            }))
          );
        } else if (coords.length > 0) {
          setCoordinates(coords);
        }

        // Load existing attachments if any
        if ((data as any).attachments && Array.isArray((data as any).attachments)) {
          setExistingAttachments(
            (data as any).attachments.map((a: any) => ({
              uid: a.id,
              name: a.fileName,
              size: a.fileSize || 0,
              status: 'done' as const,
              url: a.filePath,
              id: a.id,
            }))
          );
        }
      } catch {
        toast.error('Không thể tải thông tin cảng biển');
        navigate('/Port');
      }
    })();
  }, [isEdit, id, form, navigate]);

  // ── GPS sub-table handlers ──
  const addCoordinate = useCallback(() => {
    setCoordinates((prev) => [
      ...prev,
      { key: crypto.randomUUID(), latitude: null, longitude: null },
    ]);
  }, []);

  const removeCoordinate = useCallback((key: string) => {
    setCoordinates((prev) => prev.filter((c) => c.key !== key));
  }, []);

  const updateCoordinate = useCallback(
    (key: string, field: 'latitude' | 'longitude', value: number | null) => {
      setCoordinates((prev) =>
        prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)),
      );
    },
    [],
  );

  // ── Infrastructure sub-table handlers ──
  const addInfrastructure = useCallback(() => {
    setInfrastructures((prev) => [
      ...prev,
      { key: crypto.randomUUID(), stt: prev.length + 1, infraName: '', quantity: null },
    ]);
  }, []);

  const removeInfrastructure = useCallback((key: string) => {
    setInfrastructures((prev) =>
      prev
        .filter((inf) => inf.key !== key)
        .map((inf, idx) => ({ ...inf, stt: idx + 1 })),
    );
  }, []);

  const updateInfrastructure = useCallback(
    (key: string, field: 'infraName' | 'quantity', value: string | number | null) => {
      setInfrastructures((prev) =>
        prev.map((inf) => (inf.key === key ? { ...inf, [field]: value } : inf)),
      );
    },
    [],
  );

  // ── Draft vs Submit validation ──
  const validateForm = useCallback(
    (action: 'draft' | 'submit'): boolean => {
      // Draft: only port_name is required
      const portName = form.getFieldValue('portName');
      if (!portName || String(portName).trim() === '') {
        message.error('Vui lòng nhập tên cảng biển');
        return false;
      }

      if (action === 'submit') {
        const province = form.getFieldValue('province');
        const portClass = form.getFieldValue('portClass');

        if (!province) {
          message.error('Vui lòng chọn tỉnh/thành phố');
          return false;
        }
        if (portClass == null || portClass === '' || portClass === undefined) {
          message.error('Vui lòng chọn phân cấp cảng');
          return false;
        }

        // Require at least 1 GPS coordinate with valid values
        if (coordinates.length === 0) {
          message.error('Vui lòng thêm ít nhất 1 tọa độ GPS');
          return false;
        }
        for (const coord of coordinates) {
          if (
            coord.latitude == null ||
            coord.longitude == null ||
            String(coord.latitude).trim() === '' ||
            String(coord.longitude).trim() === ''
          ) {
            message.error('Vui lòng nhập đầy đủ vĩ độ và kinh độ cho tọa độ GPS');
            return false;
          }
          const lat = Number(coord.latitude);
          const lng = Number(coord.longitude);
          if (Number.isNaN(lat) || lat < -90 || lat > 90) {
            message.error('Vĩ độ phải từ -90 đến 90');
            return false;
          }
          if (Number.isNaN(lng) || lng < -180 || lng > 180) {
            message.error('Kinh độ phải từ -180 đến 180');
            return false;
          }
        }
      }

      return true;
    },
    [form, coordinates],
  );

  // ── Build payload ──
  const buildPayload = useCallback(
    (action: 'draft' | 'submit') => {
      const values = form.getFieldsValue();
      const payload: Record<string, unknown> = {
        action,
        portCode: portCode || values.portCode,
        portName: String(values.portName || '').trim(),
        province: values.province || null,
        diaDiemChiTiet: values.detailed_location || null,
        phanCap: values.portClass != null ? Number(values.portClass) : null,
        phamViVungNuoc: values.water_area_scope || null,
        orgUnitId: values.managing_unit || null,
        portGroup: values.portGroup != null ? Number(values.portGroup) : null,
        loaiHinhHoc: values.objectType || null,
        bieuTuongId: values.symbolId || null,
        heQuyChieu: values.coordinateSystem != null ? Number(values.coordinateSystem) : null,
        quyTacHienThi: values.displayRule != null ? Number(values.displayRule) : null,
        remarks: values.remarks || null,
        // Composite index — default 0 for number fields, null for text
        tongSoBenCang: values.tongSoBenCang ?? 0,
        tongSoKhuNeoDauChuyenTai: values.tongSoKhuNeoDauChuyenTai ?? 0,
        tongSoTuyenLuongCongCong: values.tongSoTuyenLuongCongCong ?? 0,
        tongSoTuyenLuongChuyenDung: values.tongSoTuyenLuongChuyenDung ?? 0,
        tongChieuDaiLuongCongCong: values.tongChieuDaiLuongCongCong ?? 0,
        tongChieuDaiLuongChuyenDung: values.tongChieuDaiLuongChuyenDung ?? 0,
        tongSoPhaoTieuBaoHieu: values.tongSoPhaoTieuBaoHieu ?? 0,
        tongSoDeKe: values.tongSoDeKe ?? 0,
        tongChieuDaiDeKe: values.tongChieuDaiDeKe ?? 0,
        tongSoDenBienDangTieu: values.tongSoDenBienDangTieu ?? 0,
        quantityBenPhao: values.quantityBenPhao ?? 0,
        quantityKhuNeoDau: values.quantityKhuNeoDau ?? 0,
        quantityKhuChuyenTai: values.quantityKhuChuyenTai ?? 0,
        cacKhuNuocKhac: values.cacKhuNuocKhac || null,
        // GPS coordinates
        coordinateList: coordinates
          .filter((c) => c.latitude != null && c.longitude != null)
          .map((c) => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) })),
        // Infrastructure list
        infrastructureList: infrastructures
          .filter((inf) => inf.infraName && String(inf.infraName).trim() !== '')
          .map((inf) => ({
            stt: inf.stt,
            infraName: String(inf.infraName).trim(),
            quantity: inf.quantity ?? 0,
          })),
      };

      // Status mapping
      // Draft → status=0 | Submit → status=1
      payload.approvalStatus = action === 'draft' ? 0 : 1;

      return payload;
    },
    [form, portCode, coordinates, infrastructures],
  );

  // ── Handle form submission (draft or submit) ──
  const handleSave = useCallback(
    async (action: 'draft' | 'submit') => {
      if (!validateForm(action)) return;
      setSubmitting(true);
      try {
        const payload = buildPayload(action);

        let savedId = id;

        if (isEdit && id) {
          // PUT for update
          const updatePayload: UpdateCangBienRequest & Record<string, unknown> = {
            id,
            ...payload,
          };
          await portCRUD.update(updatePayload as any);
          toast.success(
            action === 'draft'
              ? 'Đã lưu tạm thông tin cảng biển'
              : 'Đã gửi phê duyệt cảng biển',
          );
        } else {
          // POST for create
          const result = await portCRUD.create(payload as any);
          savedId = result?.id || result?.data?.id;
          toast.success(
            action === 'draft'
              ? 'Đã lưu tạm thông tin cảng biển'
              : 'Đã gửi phê duyệt cảng biển',
          );
        }

        // Upload files after save (if we have files and savedId)
        if (savedId && fileList.length > 0) {
          const uploadedIds: string[] = [];
          for (const file of fileList) {
            if (file.originFileObj) {
              try {
                const formData = new FormData();
                formData.append('file', file.originFileObj as RcFile);
                await api.post(`/v1/ports/${savedId}/attachments`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                uploadedIds.push(file.uid);
              } catch {
                toast.error(`Tải lên tệp "${file.name}" thất bại`);
              }
            }
          }
          if (uploadedIds.length > 0) {
            toast.success(`Đã tải lên ${uploadedIds.length} tệp đính kèm`);
          }
        }

        navigate('/Port');
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Lỗi khi lưu thông tin cảng biển';
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [isEdit, id, form, validateForm, buildPayload, fileList, navigate],
  );

  // ── File upload validation ──
  const handleBeforeUpload = useCallback((file: RcFile): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      message.error(
        `Định dạng "${ext}" không được hỗ trợ. Chấp nhận: ${ALLOWED_EXTENSIONS}`,
      );
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      message.error(`Tệp "${file.name}" vượt quá 20MB`);
      return false;
    }
    if (fileList.length >= MAX_FILES + existingAttachments.length) {
      message.error(`Tối đa ${MAX_FILES} tệp đính kèm`);
      return false;
    }
    return false; // prevent auto-upload — we handle manually
  }, [fileList.length, existingAttachments.length]);

  const handleFileChange = useCallback(
    (info: { fileList: UploadFile[] }) => {
      setFileList(info.fileList);
    },
    [],
  );

  const handleRemoveFile = useCallback((file: UploadFile) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
  }, []);

  const handleRemoveExistingAttachment = useCallback(
    async (attachment: AttachmentFile) => {
      if (!id || !attachment.id) return;
      try {
        await api.delete(`/v1/ports/${id}/attachments/${attachment.id}`);
        setExistingAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
        toast.success('Đã xóa tệp đính kèm');
      } catch {
        toast.error('Xóa tệp thất bại');
      }
    },
    [id],
  );

  // ── GPS columns ──
  const gpsColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      render: (_: unknown, __: unknown, idx: number) => (
        <Text style={{ color: textSecondary }}>{idx + 1}</Text>
      ),
    },
    {
      title: 'Vĩ độ (Latitude)',
      key: 'latitude',
      width: 200,
      render: (_: unknown, record: CoordinateRow) => (
        <InputNumber
          style={{ width: '100%', borderRadius: radiusMd }}
          value={record.latitude}
          onChange={(val) => updateCoordinate(record.key, 'latitude', val ?? null)}
          min={-90}
          max={90}
          step={0.000001}
          placeholder="VD: 20.860000"
        />
      ),
    },
    {
      title: 'Kinh độ (Longitude)',
      key: 'longitude',
      width: 200,
      render: (_: unknown, record: CoordinateRow) => (
        <InputNumber
          style={{ width: '100%', borderRadius: radiusMd }}
          value={record.longitude}
          onChange={(val) => updateCoordinate(record.key, 'longitude', val ?? null)}
          min={-180}
          max={180}
          step={0.000001}
          placeholder="VD: 106.680000"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: unknown, record: CoordinateRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeCoordinate(record.key)}
        />
      ),
    },
  ];

  // ── Infrastructure columns ──
  const infraColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      render: (_: unknown, record: InfrastructureRow) => (
        <Text style={{ color: textSecondary }}>{record.stt}</Text>
      ),
    },
    {
      title: 'Tên công trình *',
      key: 'infraName',
      width: 300,
      render: (_: unknown, record: InfrastructureRow) => (
        <Input
          style={{ borderRadius: radiusMd }}
          value={record.infraName}
          onChange={(e) => updateInfrastructure(record.key, 'infraName', e.target.value)}
          placeholder="Nhập tên công trình"
        />
      ),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 150,
      render: (_: unknown, record: InfrastructureRow) => (
        <InputNumber
          style={{ width: '100%', borderRadius: radiusMd }}
          value={record.quantity}
          onChange={(val) => updateInfrastructure(record.key, 'quantity', val ?? null)}
          min={1}
          step={1}
          placeholder="> 0"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: unknown, record: InfrastructureRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeInfrastructure(record.key)}
        />
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────

  const sectionStyle = {
    marginBottom: spaceMd,
    borderRadius: radiusMd,
    border: `0.5px solid ${borderDefault}`,
  };

  const sectionTitleStyle = {
    fontSize: fontSizeLg,
    fontWeight: fontWeightBold,
    marginBottom: spaceMd,
    color: textSecondary,
  };

  return (
    <div style={{ background: surfacePage, minHeight: '100%' }}>
      {/* Header */}
      <Card style={{ marginBottom: spaceMd, ...sectionStyle }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/Port')}
            style={{ borderRadius: radiusPill, height: 40 }}
          >
            Quay lại
          </Button>
          <Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa cảng biển' : 'Thêm cảng biển mới'}
          </Title>
        </Space>
      </Card>

      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 960, margin: '0 auto' }}
        scrollToFirstError
      >
        {/* ═══ Section 1: Thông tin chung ═══ */}
        <Card title={<span style={sectionTitleStyle}>1. Thông tin chung</span>} style={sectionStyle}>
          <Row gutter={[spaceMd, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="portCode"
                {...labelStyle('Mã cảng')}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  value={portCode}
                  readOnly
                  disabled
                  placeholder={portCodeLoading ? 'Đang sinh mã...' : 'Mã cảng tự động'}
                  style={{ borderRadius: radiusMd, height: 40, color: textTertiary }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="managing_unit"
                {...labelStyle('Đơn vị quản lý')}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn đơn vị quản lý"
                  allowClear
                  showSearch
                  options={MANAGING_UNIT_OPTIONS}
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[spaceMd, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="portGroup"
                {...labelStyle('Nhóm cảng')}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn nhóm cảng"
                  allowClear
                  options={PORT_GROUP_OPTIONS}
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="portName"
                {...labelStyle('Tên cảng biển *')}
                style={{ marginBottom: spaceFormField }}
                rules={[
                  { required: true, message: 'Vui lòng nhập tên cảng biển' },
                  { max: 255, message: 'Tối đa 255 ký tự' },
                ]}
              >
                <Input
                  placeholder="VD: Cảng biển Hải Phòng"
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[spaceMd, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="province"
                {...labelStyle('Tỉnh/thành phố')}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn tỉnh/thành phố"
                  allowClear
                  showSearch
                  options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="portClass"
                {...labelStyle('Phân cấp cảng')}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn phân cấp cảng"
                  allowClear
                  options={PORT_CLASS_OPTIONS}
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[spaceMd, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="detailed_location"
                {...labelStyle('Địa điểm chi tiết')}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: Khu bến cảng Lạch Huyện"
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="water_area_scope"
                {...labelStyle('Phạm vi vùng nước')}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="Mô tả phạm vi vùng nước"
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ═══ Section 2: Chỉ số tổng hợp ═══ */}
        <Card title={<span style={sectionTitleStyle}>2. Chỉ số tổng hợp</span>} style={sectionStyle}>
          <Row gutter={[spaceMd, spaceFormField]}>
            {COMPOSITE_INDEX_FIELDS.map((field) => (
              <Col xs={24} sm={12} md={8} key={field.name}>
                {field.name === 'cacKhuNuocKhac' ? (
                  <Form.Item
                    name={field.name}
                    {...labelStyle(field.label)}
                    style={{ marginBottom: spaceFormField }}
                  >
                    <Input
                      placeholder="Nhập mô tả"
                      style={{ borderRadius: radiusMd, height: 40 }}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name={field.name}
                    {...labelStyle(field.label)}
                    style={{ marginBottom: spaceFormField }}
                    initialValue={0}
                  >
                    <InputNumber
                      style={{ width: '100%', borderRadius: radiusMd }}
                      min={0}
                      placeholder="0"
                    />
                  </Form.Item>
                )}
              </Col>
            ))}
          </Row>
        </Card>

        {/* ═══ Section 3: GIS ═══ */}
        <Card title={<span style={sectionTitleStyle}>3. GIS</span>} style={sectionStyle}>
          <Row gutter={[spaceMd, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="objectType"
                {...labelStyle('Loại đối tượng')}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn loại đối tượng GIS"
                  allowClear
                  options={GIS_OBJECT_TYPE_OPTIONS}
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="symbolId"
                {...labelStyle('Mã ký hiệu (Symbol ID)')}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: port_symbol_01"
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[spaceMd, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="coordinateSystem"
                {...labelStyle('Hệ quy chiếu')}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn hệ quy chiếu"
                  allowClear
                  options={COORDINATE_SYSTEM_OPTIONS}
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="displayRule"
                {...labelStyle('Quy tắc hiển thị')}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn quy tắc hiển thị"
                  allowClear
                  options={DISPLAY_RULE_OPTIONS}
                  style={{ borderRadius: radiusMd, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ═══ Section 4: Tọa độ GPS ═══ */}
        <Card title={<span style={sectionTitleStyle}>4. Tọa độ GPS</span>} style={sectionStyle}>
          <Text
            style={{
              ...metaStyle,
              display: 'block',
              marginBottom: spaceSm,
            }}
          >
            Thêm ít nhất 1 tọa độ GPS (WGS-84) — bắt buộc khi Gửi phê duyệt
          </Text>
          <Table
            columns={gpsColumns}
            dataSource={coordinates}
            rowKey="key"
            pagination={false}
            size="small"
            locale={{ emptyText: 'Chưa có tọa độ GPS. Nhấn "Thêm tọa độ" để bắt đầu.' }}
            style={{ marginBottom: spaceSm }}
          />
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addCoordinate}
            style={{ borderRadius: radiusMd, height: 40 }}
          >
            Thêm tọa độ
          </Button>
        </Card>

        {/* ═══ Section 5: Công trình KCHT ═══ */}
        <Card title={<span style={sectionTitleStyle}>5. Công trình KCHT</span>} style={sectionStyle}>
          <Text
            style={{
              ...metaStyle,
              display: 'block',
              marginBottom: spaceSm,
            }}
          >
            Danh sách các công trình kết cấu hạ tầng hàng hải trực thuộc
          </Text>
          <Table
            columns={infraColumns}
            dataSource={infrastructures}
            rowKey="key"
            pagination={false}
            size="small"
            locale={{ emptyText: 'Chưa có công trình KCHT. Nhấn "Thêm công trình" để bắt đầu.' }}
            style={{ marginBottom: spaceSm }}
          />
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addInfrastructure}
            style={{ borderRadius: radiusMd, height: 40 }}
          >
            Thêm công trình
          </Button>
        </Card>

        {/* ═══ Section 6: File đính kèm ═══ */}
        <Card title={<span style={sectionTitleStyle}>6. File đính kèm</span>} style={sectionStyle}>
          <Text
            style={{
              ...metaStyle,
              display: 'block',
              marginBottom: spaceSm,
            }}
          >
            Tối đa {MAX_FILES} tệp, mỗi tệp ≤ 20MB. Định dạng: PDF, DOC, DOCX, XLS, XLSX,
            JPG, PNG, TIFF.
          </Text>

          {/* Existing attachments (edit mode) */}
          {existingAttachments.length > 0 && (
            <div style={{ marginBottom: spaceMd }}>
              <Text strong style={{ fontSize: fontSizeMd, display: 'block', marginBottom: spaceXs }}>
                Tệp đã tải lên
              </Text>
              {existingAttachments.map((att) => (
                <Space
                  key={att.uid}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: `${spaceXs}px ${spaceSm}px`,
                    marginBottom: spaceXs,
                    background: surfaceCard,
                    borderRadius: radiusMd,
                    border: `0.5px solid ${borderDefault}`,
                  }}
                >
                  <Space>
                    <Text style={{ fontSize: fontSizeMd }}>{att.name}</Text>
                    <Text style={{ ...metaStyle }}>
                      ({(att.size / 1024 / 1024).toFixed(1)} MB)
                    </Text>
                  </Space>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveExistingAttachment(att)}
                  >
                    Xóa
                  </Button>
                </Space>
              ))}
            </div>
          )}

          {/* Upload new files */}
          <Upload.Dragger
            multiple
            fileList={fileList}
            beforeUpload={handleBeforeUpload}
            onChange={handleFileChange}
            onRemove={handleRemoveFile}
            accept={ALLOWED_EXTENSIONS}
            showUploadList={true}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kéo tệp vào đây hoặc nhấp để chọn</p>
            <p className="ant-upload-hint">
              Hỗ trợ PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF (tối đa 20MB)
            </p>
          </Upload.Dragger>
        </Card>

        {/* ═══ Section 7: Ghi chú ═══ */}
        <Card title={<span style={sectionTitleStyle}>7. Ghi chú</span>} style={sectionStyle}>
          <Form.Item
            name="remarks"
            style={{ marginBottom: 0 }}
          >
            <TextArea
              rows={4}
              placeholder="Nhập ghi chú (nếu có)"
              maxLength={2000}
              showCount
              style={{ borderRadius: radiusMd, resize: 'vertical' }}
            />
          </Form.Item>
        </Card>

        {/* ═══ Section 8: Hành động ═══ */}
        <Divider style={dividerStyle} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spaceMd,
            padding: `${spaceMd}px 0 ${spaceXl}px`,
          }}
        >
          <Button
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={() => handleSave('draft')}
            style={{
              borderRadius: radiusPill,
              height: 44,
              minWidth: 160,
              fontSize: fontSizeMd,
              fontWeight: fontWeightMedium,
              borderColor: borderDefault,
              color: textSecondary,
            }}
          >
            Lưu tạm
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={submitting}
            onClick={() => handleSave('submit')}
            style={{
              borderRadius: radiusPill,
              height: 44,
              minWidth: 160,
              fontSize: fontSizeMd,
              fontWeight: fontWeightMedium,
              background: actionPrimary,
              borderColor: actionPrimary,
            }}
          >
            Gửi phê duyệt
          </Button>
          <Button
            onClick={() => navigate('/Port')}
            style={{
              borderRadius: radiusPill,
              height: 44,
              minWidth: 120,
              fontSize: fontSizeMd,
              borderColor: borderDefault,
              color: textSecondary,
            }}
          >
            Hủy
          </Button>
        </div>
      </Form>
    </div>
  );
}
