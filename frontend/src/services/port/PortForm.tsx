import { useState, useMemo } from 'react';
import { Row, Col, Form, Input, Select, InputNumber, Tabs, Button, Space, Modal, type FormInstance, type InputNumberProps } from 'antd';
import { PlusOutlined, DeleteOutlined, EnvironmentOutlined, BankOutlined, SlidersOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import toast from '../../components/ToastNotification';
import api from '../../services/api';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import { VIETNAM_PROVINCES } from '../../types/common';
import {
  colors, textSecondary, textTertiary, borderDefault, statusCritical,
  fontSizeSm, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField, surfaceCard,
  readonlyInputStyle, actionPrimary, sidebarBg, textAreaStyle,
  drawerTabBarStyle, drawerFormScrollStyle,
  outlineButtonStyle, primaryButtonStyle,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import { fmtInputNumber } from '../../utils/numFmt';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import DetailTable from '../../components/shared/DetailTable';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/authStore';

// ── Styles ──────────────────────────────────────────────────────────
// Đồng bộ cỡ chữ 13.5px cho form Cảng biển (giống chuẩn VTS CHK/cols dùng ở Bến cảng).
// Không lấy fontSizeMd mặc định (=13) từ themetokenchk để mọi tựa đề/span trong tab hiển thị 13.5.
const fontSizeMd = 13.5;
// Style cho thẻ phân nhóm (Section Card) đồng bộ với màn Xem chi tiết & màn Bến cảng
const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };
const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeMd, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeMd, color: textTertiary };
type NumberInputWithCountProps = InputNumberProps<any> & { maxLength: number };

/** Hiển thị số ký tự đã nhập để giới hạn 5/20 chữ số của các chỉ số tổng hợp dễ nhận biết. */
function NumberInputWithCount({ maxLength, value, ...inputProps }: NumberInputWithCountProps) {
  const count = String(value ?? '').length;

  return (
    <InputNumber
      stringMode
      {...inputProps}
      value={value}
      maxLength={maxLength}
      suffix={<span style={{ color: textSecondary, fontSize: fontSizeMd }}>{count}/{maxLength}</span>}
    />
  );
}

/**
 * Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px).
 *
 * Mỗi ô (Độ/Phút/Giây) là một cột flex riêng (Độ=1 · Phút=1 · Giây=1.2 — cùng template như cột
 * Vĩ độ để message dưới Vĩ độ và Kinh độ thẳng hàng dọc). Message "X bắt buộc" hiển thị thành
 * từng dòng riêng NGAY DƯỚI chính ô nhập còn thiếu, chỉ sau khi người dùng đã nhập giá trị đầu
 * tiên của nhóm đó (dòng để trống hoàn toàn không hiện gì → không làm nhiễu lúc vừa mở form).
 */
const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  // Chỉ "bắt buộc" khi người dùng đã bắt đầu nhập (ít nhất 1 trong 3 ô có giá trị) —
  // hiện NGAY lúc gõ, không cần bấm Lưu/Lưu & duyệt (chuẩn Bến cảng BerthForm).
  const started = dVal != null || mVal != null || sVal != null;

  // 3 cột Độ·Phút·Giây — một nguồn sự thật duy nhất dùng chung cho CẢ hàng input lẫn hàng
  // message bên dưới (cùng flex basis 1 / 1 / 1.2 và cùng width) để text lỗi nằm đúng dưới ô
  // của nó và 2 cột (Vĩ độ, Kinh độ) trong bảng luôn thẳng hàng.
  const inputs = [
    {
      key: 'd', base: 'Độ', value: dVal, max: maxDeg,
      radius: '999px 0 0 999px', unit: '°', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1, formatter: undefined as ((value: any) => string) | undefined,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm', base: 'Phút', value: mVal, max: 59,
      radius: '0', unit: '\'', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1, formatter: undefined as ((value: any) => string) | undefined,
      msg: started && mVal == null ? 'Phút bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, v, sVal ?? null),
    },
    {
      key: 's', base: 'Giây', value: sVal, max: 59.99,
      radius: '0', unit: '"', unitStyle: dmsUnitEndStyle, basis: '1.2 0 130px', width: 130,
      step: 0.01, formatter: fmtInputNumber as ((value: any) => string) | undefined,
      msg: started && sVal == null ? 'Giây bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, mVal ?? null, v),
    },
  ];

  const inputRow = (
    <div style={{ display: 'inline-flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', maxWidth: '100%', minWidth: 0 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ display: 'flex', flex: inp.basis, minWidth: 0, width: inp.width }}>
          <InputNumber
            value={inp.value}
            min={0}
            max={inp.max}
            step={inp.step}
            placeholder={inp.base}
            formatter={inp.formatter}
            status={inp.msg ? 'error' : undefined}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(raw) => inp.onEdit(raw == null ? null : Number(raw))}
            style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32, fontSize: fontSizeMd }}
            controls={false}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  // Hàng message LUÔN có mặt với chiều cao cố định (height 14px) dù có lỗi hay không:
  // dòng tọa độ tự cao sẵn đủ chỗ (DetailTable cho ô GPS height auto) → khi message
  // "Độ/Phút/Giây bắt buộc" xuất hiện hay biến mất, chiều cao nhóm KHÔNG đổi và ô input
  // đứng yên, không bị đẩy lên trên; chỉ chèn text lỗi vào đúng ô thiếu khi cần.
  const messageRow = (
    <div aria-live="polite" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', width: 'fit-content', maxWidth: '100%', minWidth: 0, marginTop: spaceXs, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minWidth: 0,
      }}
    >
      {inputRow}
      {messageRow}
    </div>
  );
};

/** Parse tọa độ từ WKT (POINT/MULTIPOINT/LINESTRING/POLYGON) — dùng chung cho GisLocationSelector. */
const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.-]+)\s+([\d.-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* ignore */ }
  return [];
};

function ddToDms(dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
  const abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d: d === 0 ? null : d, m: m === 0 ? null : m, s: s === 0 ? null : s };
}

// ── Types ───────────────────────────────────────────────────────────
export interface GpsCoordPoint {
  latD: number | null;
  latM: number | null;
  latS: number | null;
  lngD: number | null;
  lngM: number | null;
  lngS: number | null;
}

interface MapSymbol {
  id: string;
  name: string;
  code?: string;
  image?: string;
}

interface PortInfrastructureEntry {
  stt: number;
  infraName: string;
  quantity: number | null;
}

/** Kiểu upload nội bộ (trạng thái file trong Upload.Dragger) — không kế thừa InfrastructureAttachmentItem
 *  vì file mới thêm chỉ có { uid, name, size, status, originFileObj }, chưa có id/fileName.
 *  Chỉ chuyển sang InfrastructureAttachmentItem tại mappedAttachments (spread trước, override sau). */
interface PortUploadFile {
  id?: string;
  uid: string;
  /** Tên gốc file (mappedAttachments → fileName). */
  name: string;
  fileName?: string;
  size?: number;
  fileSize?: number;
  type?: string;
  fileType?: string;
  status?: string;
  originFileObj?: File;
  uploadedByName?: string;
  uploadedBy?: string;
  uploadedDate?: string;
  uploadedAt?: string;
  createdAt?: string;
}

type IndexedGpsCoordPoint = GpsCoordPoint & { _idx: number };
type IndexedPortInfrastructureEntry = PortInfrastructureEntry & { _idx: number };

export interface PortFormProps {
  form: FormInstance;
  mode: 'create' | 'update';
  geometryType: string | undefined;
  atMax: Record<string, boolean>;
  activeTabKey?: string;
  onTabChange?: (key: string) => void;
  portCodeLoading?: boolean;
  orgUnits: OrgUnitTreeOption[];
  symbols: MapSymbol[];
  gpsCoordList: GpsCoordPoint[];
  gpsError: string | null;
  gpsPage: number;
  onGpsPageChange: (page: number) => void;
  addGpsPoint: () => void;
  removeGpsPoint: (index: number) => void;
  updateGpsPoint: (index: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => void;
  /** Đổ tọa độ chọn trên bản đồ (GisLocationSelector) vào gpsCoordList */
  setGpsCoordList?: (list: GpsCoordPoint[]) => void;
  /** Danh sách công trình KCHT trực thuộc (tab 4) */
  infraList: PortInfrastructureEntry[];
  addInfra: () => void;
  removeInfra: (index: number) => void;
  updateInfraName: (index: number, value: string) => void;
  updateInfraQty: (index: number, value: number | null) => void;
  /** id cảng biển đang sửa (update) — dùng cho tải file đính kèm thật về máy (chuẩn Bến cảng). */
  recordId?: string;
  /** bản đồ id người dùng → tên (resovle uploadedByName giống BerthForm). */
  userMap?: Map<string, string>;
  uploadFileList: PortUploadFile[];
  setUploadFileList: React.Dispatch<React.SetStateAction<any[]>> | ((files: any) => void);
  onDeleteAttachment?: (attId: string) => void;
  onFinish: (values: Record<string, unknown>) => void;
  onFinishFailed: () => void;
}

// ── Component: form thêm mới / chỉnh sửa cảng biển (chuẩn VTS CHK, 3 tab như bến phao) ──
export default function PortForm({
  form,
  mode,
  geometryType,
  atMax,
  activeTabKey,
  onTabChange,
  portCodeLoading,
  orgUnits,
  symbols,
  gpsCoordList,
  gpsError,
  gpsPage,
  onGpsPageChange,
  addGpsPoint,
  removeGpsPoint,
  updateGpsPoint,
  setGpsCoordList,
  infraList,
  addInfra,
  removeInfra,
  updateInfraName,
  updateInfraQty,
  uploadFileList,
  setUploadFileList,
  onDeleteAttachment,
  recordId,
  userMap,
  onFinish,
  onFinishFailed,
}: PortFormProps) {
  // Cán bộ đang thao tác — để tệp vừa tải lên (Lúc Thêm mới/Sửa) hiển thị Người tải lên + Ngày tải lên như Bến cảng.
  const currentUser = useAuthStore((s) => s.user);
  const isCreate = mode === 'create';
  // Theo dõi trực tiếp ô "Loại đối tượng" của form này (chuẩn Bến cảng BerthForm.tsx:222) —
  // nút Tọa độ GPS & ô Biểu tượng disable khi chưa chọn loại đối tượng.
  const watchedGeometryType = Form.useWatch('geometryType', form);
  const effectiveGeometryType = watchedGeometryType || geometryType;
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [indicatorOpen, setIndicatorOpen] = useState(true); // Toggle 'Chỉ số tổng hợp' (mặc định MỞ)
  void onGpsPageChange;

  // Transform uploadFileList từ kiểu upload nội bộ { uid, name, size, status, originFileObj }
  // sang InfrastructureAttachmentItem ({ id, fileName, ... }) cho InfrastructureAttachmentTab.
  // Spread `...f` TRƯỚC rồi override id/fileName/fileSize theo `f` — tránh cảnh báo ghi đè.
  const mappedAttachments = useMemo<InfrastructureAttachmentItem[]>(() =>
    uploadFileList.map((f) => {
      // Resolution tên cán bộ upload từ userMap — chuẩn BerthForm khi bản ghi có uploadedBy.
      const resolvedName =
        (f as any).uploadedByName ||
        ((f as any).uploadedBy && userMap?.get((f as any).uploadedBy)) ||
        (f as any).uploadedBy ||
        currentUser?.fullName ||
        currentUser?.username ||
        'Cán bộ quản lý';
      return {
        ...f,
        id: f.uid || (f as any).id,
        fileName: f.fileName || f.name,
        fileSize: f.fileSize ?? f.size ?? f.originFileObj?.size,
        file: f.originFileObj,
        originFileObj: f.originFileObj,
        uploadedByName: resolvedName,
        uploadedDate: (f as any).uploadedDate || (f as any).uploadedAt || (f as any).createdAt || dayjs().toISOString(),
      };
    }),
    [uploadFileList, userMap, currentUser],
  );

  // Tải file đính kèm về máy: nếu là file vừa chọn khi Thêm mới/Sửa (chưa ghi lên server)
  // thì xuống thẳng blob cục bộ từ originFileObj; file đã lưu (có recordId) thì tải từ backend.
  const triggerBlobDownload = (data: BlobPart | undefined, downloadName: string) => {
    if (!data) return false;
    const url = window.URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName || 'attachment';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return true;
  };

  const handleDownloadAttachment = (uid: string, name?: string) => {
    const fresh = uploadFileList.find((x) => x.uid === uid || x.id === uid);
    const localFile: File | undefined = fresh?.originFileObj;
    if (localFile) { triggerBlobDownload(localFile, name || localFile.name); return; }
    if (!recordId) { toast.info(`Đang tải xuống tệp: ${name}`); return; }
    api.get(`/v1/ports/${recordId}/attachments/${uid}/download`, { responseType: 'blob' })
      .then((res) => { if (!triggerBlobDownload(res.data, name || 'attachment')) toast.error('Không thể tải xuống tệp đính kèm'); })
      .catch(() => toast.error('Không thể tải xuống tệp đính kèm'));
  };

  const tabItems = [
    // ── Tab 1: Thông tin chung ──
    {
      key: 'general', label: 'Thông tin chung',
      children: (<div style={drawerFormScrollStyle}>
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}><BankOutlined style={{ color: actionPrimary }} /><span>Thông tin cơ bản & Quản lý vận hành</span></div>
          </div>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item
              name="orgUnitId"
              {...labelProps('Đơn vị quản lý')}
              required
              rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}
              style={{ marginBottom: spaceFormField }}
            >
              <OrgUnitTreeSelect
                organizations={orgUnits}
                placeholder="Chọn đơn vị quản lý"
                allowClear
                showPath
                treeDefaultExpandAll={false}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="portGroup"
              {...labelProps('Nhóm cảng biển')}
              style={{ marginBottom: spaceFormField }}
            >
              <Select placeholder="Chọn nhóm cảng biển" allowClear style={selectStyle}
                options={[
                  { value: 1, label: 'Nhóm 1' },
                  { value: 2, label: 'Nhóm 2' },
                  { value: 3, label: 'Nhóm 3' },
                  { value: 4, label: 'Nhóm 4' },
                  { value: 5, label: 'Nhóm 5' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item
              name="portCode"
              {...labelProps('Mã cảng biển')}
              style={{ marginBottom: spaceFormField }}
              tooltip="Mã cảng được sinh tự động, không thể chỉnh sửa"
            >
              <Input
                disabled
                placeholder={isCreate && portCodeLoading ? 'Đang sinh mã...' : 'Mã tự động'}
                maxLength={50}
                style={readonlyInputStyle}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="portName"
              {...labelProps('Tên cảng biển')}
              style={{ marginBottom: spaceFormField }}
              rules={[
                { required: true, message: 'Tên cảng không được để trống' },
                { max: 255, message: 'Tên cảng tối đa 255 ký tự' },
              ]}
            >
              <Input placeholder="Nhập tên cảng biển" maxLength={255} showCount style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item
              name="portClass"
              {...labelProps('Phân cấp cảng biển')}
              required
              rules={[{ required: true, message: 'Phân cấp cảng biển là bắt buộc' }]}
              style={{ marginBottom: spaceFormField }}
            >
              <Select placeholder="Chọn phân cấp cảng biển" allowClear style={selectStyle}
                options={[
                  { value: 5, label: 'Cấp đặc biệt' },
                  { value: 1, label: 'Cấp 1' },
                  { value: 2, label: 'Cấp 2' },
                  { value: 3, label: 'Cấp 3' },
                  { value: 4, label: 'Cấp 4' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="province"
              {...labelProps('Địa điểm (Tỉnh/Thành phố)')}
              required
              rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]}
              style={{ marginBottom: spaceFormField }}
            >
              <Select
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                style={selectStyle}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Form.Item
              name="detailedLocation"
              {...labelProps('Địa điểm chi tiết')}
              style={{ marginBottom: spaceFormField }}
            >
              <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Form.Item
              name="waterAreaScope"
              {...labelProps('Phạm vi vùng nước cảng biển')}
              style={{ marginBottom: spaceFormField }}
            >
              <Input.TextArea rows={3} placeholder="Nhập phạm vi vùng nước" maxLength={2000} showCount style={textAreaStyle} />
            </Form.Item>
          </Col>
        </Row>
        </div>

        <div style={sectionBoxStyle}>
          <div onClick={() => setIndicatorOpen(!indicatorOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: indicatorOpen ? 10 : 0, paddingBottom: indicatorOpen ? 8 : 0, borderBottom: indicatorOpen ? '1px solid #f1f5f9' : 'none' }}>
            <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Chỉ số tổng hợp</span></div>
            <span style={{ color: actionPrimary, fontSize: 12 }}>
              {indicatorOpen ? <DownOutlined /> : <RightOutlined />}
            </span>
          </div>
        {indicatorOpen && (
          <div>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item
                name="totalBerths"
                {...labelProps('Tổng số bến cảng')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalAnchoragesTransshipment"
                {...labelProps('Tổng số khu neo đậu, khu chuyển tải')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item
                name="totalPublicChannels"
                {...labelProps('Tổng số tuyến luồng hàng hải công cộng')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalDedicatedChannels"
                {...labelProps('Tổng số tuyến luồng hàng hải chuyên dùng')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item
                name="totalPublicChannelLength"
                {...labelProps('Tổng chiều dài luồng hàng hải công cộng (km)')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalDedicatedChannelLength"
                {...labelProps('Tổng chiều dài luồng hàng hải chuyên dùng (km)')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item
                name="totalBuoysBeacons"
                {...labelProps('Tổng số phao tiêu, báo hiệu hàng hải trên luồng')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalDikes"
                {...labelProps('Tổng số đê, kè')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item
                name="totalDikeLength"
                {...labelProps('Tổng chiều dài hệ thống đê, kè (km)')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalLighthouses"
                {...labelProps('Tổng số đèn biển, đăng, tiêu độc lập')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item
                name="buoyBerthCount"
                {...labelProps('Số lượng bến phao')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="anchorageCount"
                {...labelProps('Số lượng khu neo đậu')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item
                name="transshipmentCount"
                {...labelProps('Số lượng khu chuyển tải')}
                style={{ marginBottom: spaceFormField }}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="otherWaterAreas"
                {...labelProps('Các khu nước, vùng nước khác')}
                style={{ marginBottom: spaceFormField }}
              >
                <Input.TextArea rows={3} placeholder="Mô tả" maxLength={2000} showCount style={textAreaStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={24}>
              <Form.Item
                name="remarks"
                {...labelProps('Ghi chú')}
                style={{ marginBottom: spaceFormField }}
              >
                <Input.TextArea rows={3} placeholder="Ghi chú" maxLength={2000} showCount style={textAreaStyle} />
              </Form.Item>
            </Col>
          </Row>
        </div>
        )}
        </div>
      </div>),
    },
    // ── Tab 2: Thông tin vị trí ──
    {
      key: 'gis', label: `Thông tin vị trí (${gpsCoordList.length})`,
      children: (<div style={drawerFormScrollStyle}>
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}><EnvironmentOutlined style={{ color: actionPrimary }} /><span>Thông số đối tượng bản đồ</span></div>
          </div>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item
              name="geometryType"
              {...labelProps('Loại đối tượng')}
              style={{ marginBottom: spaceFormField }}
            >
              <Select
                placeholder="Chọn loại đối tượng"
                allowClear
                options={[
                  { value: 'POINT', label: 'Đối tượng điểm' },
                  { value: 'LINE', label: 'Đối tượng đường' },
                  { value: 'POLYGON', label: 'Đối tượng vùng' },
                ]}
                style={selectStyle}
                onChange={(val) => {
                  if (!val) {
                    form.setFieldsValue({
                      mapSymbolId: undefined,
                      coordinateSystem: undefined,
                      displayRule: undefined,
                    });
                    form.setFields([{ name: 'mapSymbolId', errors: [] }]);
                    if (setGpsCoordList) {
                      setGpsCoordList([]);
                    }
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="mapSymbolId"
              {...labelProps('Biểu tượng')}
              required={!!effectiveGeometryType}
              rules={
                effectiveGeometryType
                  ? [{ required: true, message: 'Biểu tượng là bắt buộc khi đã chọn loại đối tượng' }]
                  : []
              }
              style={{ marginBottom: spaceFormField }}
            >
              <Select
                placeholder="Chọn biểu tượng bản đồ"
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={!effectiveGeometryType}
                style={selectStyle}
              >
                {symbols.map((sym) => (
                  <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                    <Space>
                      {sym.image && (
                        <img
                          src={
                            sym.image.startsWith('data:')
                              ? sym.image
                              : `data:image/png;base64,${sym.image}`
                          }
                          alt={sym.name}
                          style={{ width: 20, height: 20, objectFit: 'contain' }}
                        />
                      )}
                      <span>
                        {sym.code ? `${sym.name} (${sym.code})` : sym.name}
                      </span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item
              name="coordinateSystem"
              {...labelProps('Hệ quy chiếu')}
              style={{ marginBottom: spaceFormField }}
            >
              <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle}
                options={[
                  { value: 1, label: 'WGS-84' },
                  { value: 2, label: 'VN-2000' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="displayRule"
              {...labelProps('Quy tắc hiển thị')}
              style={{ marginBottom: spaceFormField }}
            >
              <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} />
            </Form.Item>
          </Col>
        </Row>
        </div>
        <div style={sectionBoxStyle}>
        {/* GPS Coordinates (DMS) */}
        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
          <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
            Tọa độ GPS ({gpsCoordList.length})
          </span>
          <Space size={8}>
            <Button
              icon={<EnvironmentOutlined style={{ color: !effectiveGeometryType ? undefined : actionPrimary }} />}
              onClick={() => setGisModalOpen(true)}
              disabled={!effectiveGeometryType}
              style={!effectiveGeometryType ? {
                height: 32,
                fontSize: fontSizeMd,
                padding: '0 14px',
                borderRadius: radiusPill,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                opacity: 0.6,
                cursor: 'not-allowed',
              } : {
                ...outlineButtonStyle,
                height: 32,
                fontSize: fontSizeMd,
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Chọn tọa độ trên bản đồ
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addGpsPoint}
              disabled={!effectiveGeometryType || (effectiveGeometryType === 'POINT' && gpsCoordList.length >= 1)}
              style={!effectiveGeometryType || (effectiveGeometryType === 'POINT' && gpsCoordList.length >= 1) ? {
                height: 32,
                fontSize: fontSizeMd,
                padding: '0 14px',
                borderRadius: radiusPill,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#f5f5f5',
                borderColor: '#d9d9d9',
                color: 'rgba(0, 0, 0, 0.25)',
                cursor: 'not-allowed',
              } : {
                ...primaryButtonStyle,
                height: 32,
                fontSize: fontSizeMd,
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={effectiveGeometryType === 'POINT' && gpsCoordList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined}
            >
              Thêm tọa độ
            </Button>
          </Space>
        </div>
        {gpsCoordList.length === 0 ? (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            border: `1px dashed ${borderDefault}`,
            borderRadius: radiusMd,
            background: surfaceCard,
          }}>
            <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block' }}>
              Chưa có tọa độ nào.
            </span>
          </div>
        ) : (
          <>
          {gpsError && (
            <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
            </div>
          )}
          <DetailTable<IndexedGpsCoordPoint>
            size="small"
            scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
            dataSource={gpsCoordList.map((c, i) => ({ ...c, _idx: i }))}
            rowKey={(record, index) => String(record._idx ?? index)}
            emptyText="Chưa có tọa độ GPS nào"
            columns={[
              {
                title: 'STT',
                width: 60,
                align: 'center' as const,
                render: (_value, _record, index) => (gpsPage - 1) * 10 + index + 1,
              },
              {
                title: <span>Vĩ độ (Latitude - N) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>,
                key: 'lat',
                  render: (_value, record) => renderDmsGroup(
                  record.latD,
                  record.latM,
                  record.latS,
                  90,
                  (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s),
                ),
              },
              {
                title: <span>Kinh độ (Longitude - E) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>,
                key: 'lng',
                  render: (_value, record) => renderDmsGroup(
                  record.lngD,
                  record.lngM,
                  record.lngS,
                  180,
                  (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s),
                ),
              },
              {
                title: '',
                width: 50,
                align: 'center' as const,
                // Căn top với hàng ô Độ/Phút/Giây, loại bỏ hàng message dự phòng bên dưới (chuẩn Bến cảng BerthForm).
                onCell: () => ({ style: { verticalAlign: 'top' } }),
                render: (_value, record) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                    onClick={() => removeGpsPoint(record._idx)}
                    style={{
                      width: 32,
                      height: 32,
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Xóa tọa độ"
                  />
                ),
              },
            ]}
          />
          </>
        )}
        </div>
      </div>),
    },
    // ── Tab 3: File đính kèm ──
    {
      key: 'files', label: `File đính kèm (${uploadFileList.length})`,
      children: (
        <InfrastructureAttachmentTab
          attachments={mappedAttachments}
          readonly={false}
          userMap={userMap}
          onUpload={(file) => {
            // Logic tab "File đính kèm" chuẩn Cầu cảng (PierForm.tsx handleBeforeUpload) / Bến cảng (BerthForm.tsx) —
            // giới hạn 10 file, 20MB/file và chỉ chấp nhận các định dạng văn bản/hình ảnh.
            const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];
            const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
            if (!ALLOWED_EXTS.includes(ext)) {
              toast.error('Định dạng không hỗ trợ (chỉ chấp nhận PDF, DOC/DOCX, XLS/XLSX, JPG, PNG, TIFF)');
              return false;
            }
            if (file.size > 20 * 1024 * 1024) {
              toast.error('File vượt quá 20MB');
              return false;
            }
            const nowIso = dayjs().toISOString();
            const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
            const newUid = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            setUploadFileList((prev: any[]) => {
              const currentList = Array.isArray(prev) ? prev : [];
              return [
                ...currentList,
                {
                  uid: newUid,
                  id: newUid,
                  name: file.name,
                  fileName: file.name,
                  size: file.size,
                  fileSize: file.size,
                  type: file.type,
                  fileType: file.type,
                  status: 'done',
                  originFileObj: file,
                  uploadedByName: uploaderName,
                  uploadedBy: currentUser?.userId || currentUser?.id || uploaderName,
                  uploadedDate: nowIso,
                  uploadedAt: nowIso,
                  createdAt: nowIso,
                },
              ];
            });
            return false;
          }}
          onDelete={(uid) => {
            const fileToDelete = uploadFileList.find((x) => x.uid === uid || (x as any).id === uid);
            if (fileToDelete && !fileToDelete.originFileObj) {
              const attId = (fileToDelete as any).id || fileToDelete.uid;
              if (attId) onDeleteAttachment?.(attId);
            }
            setUploadFileList((prev: any[]) =>
              (Array.isArray(prev) ? prev : []).filter((x) => x.uid !== uid && (x as any).id !== uid)
            );
          }}
          onDownload={(uid, name) => {
            handleDownloadAttachment(uid, name);
          }}
        />
      ),
    },
    // ── Tab 4: Công trình KCHT trực thuộc ──
    {
      key: 'infra', label: `Công trình KCHT trực thuộc (${infraList.length})`,
      children: (<div style={drawerFormScrollStyle}>
        <div style={sectionBoxStyle}>
        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
          <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
            Công trình KCHT trực thuộc
          </span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addInfra}
            style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeMd, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Thêm công trình
          </Button>
        </div>
        {infraList.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
            <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block' }}>Chưa có công trình nào.</span>
          </div>
        ) : (
          <DetailTable<IndexedPortInfrastructureEntry>
            size="small"
            scrollY={DRAWER_TABLE_SCROLL_Y.withDragger}
            dataSource={infraList.map((inf, i) => ({ ...inf, _idx: i }))}
            rowKey={(record) => String(record._idx)}
            emptyText="Chưa có công trình nào"
            columns={[
              {
                title: 'STT',
                width: 60,
                align: 'center' as const,
                render: (_value, _record, index) => index + 1,
              },
              {
                title: 'Tên',
                key: 'name',
                render: (_value, record) => (
                  <Input
                    value={record.infraName}
                    onChange={(e) => updateInfraName(record._idx, e.target.value)}
                    placeholder="Nhập tên công trình"
                    maxLength={500}
                    showCount
                    style={{ borderRadius: radiusPill, height: 40, fontSize: 13.5 }}
                  />
                ),
              },
              {
                title: 'Số lượng',
                key: 'quantity',
                width: 120,
                align: 'center' as const,
                render: (_value, record) => (
                  <NumberInputWithCount
                    value={record.quantity}
                    maxLength={5}
                    onChange={(v) => updateInfraQty(record._idx, v)}
                    min={0}
                    max={5}
                    step={1}
                    precision={0}
                    placeholder="0"
                    style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: 13.5 }}
                  />
                ),
              },
              {
                title: '',
                key: 'actions',
                width: 50,
                align: 'center' as const,
                render: (_value, record) => (
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeInfra(record._idx)} />
                ),
              },
            ]}
          />
        )}
        </div>
      </div>),
    },
  ];

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        initialValues={isCreate ? { approvalStatus: 'APPROVED' } : undefined}
      >
        <Tabs
          activeKey={activeTabKey}
          onChange={onTabChange}
          tabBarStyle={drawerTabBarStyle}
          items={tabItems}
        />
      </Form>

      {/* GIS Location Selector Modal — chọn tọa độ trên bản đồ chuyên dụng (chuẩn VTS CHK) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: sidebarBg, fontSize: fontSizeLg }}>
              Chọn vị trí & tọa độ trên bản đồ chuyên dụng
            </span>
          </div>
        }
        open={gisModalOpen}
        onCancel={() => setGisModalOpen(false)}
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="cancel" onClick={() => setGisModalOpen(false)} style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}>
            Hủy
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => setGisModalOpen(false)}
            style={{ ...primaryButtonStyle, height: 36 }}
          >
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType={(effectiveGeometryType as any) || 'POINT'}
            height={520}
            onChange={(val) => {
              if (val?.coordinates && setGpsCoordList) {
                // Nhận mọi dạng WKT (POINT/MULTIPOINT/LINESTRING/POLYGON) — chọn NHIỀU tọa độ trên bản đồ
                const points = parseGisCoordinates({ geometryType: val.geometryType, coordinates: val.coordinates });
                if (points.length > 0) {
                  const current = Array.isArray(gpsCoordList) ? (gpsCoordList as Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>) : [];
                  const isFilled = (c: { latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }) =>
                    c.latD != null || c.latM != null || c.latS != null || c.lngD != null || c.lngM != null || c.lngS != null;
                  const key = (p: { latitude: number; longitude: number }) => `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                  const existingKeys = new Set(current
                    .filter(isFilled)
                    .map(c => key({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 })));
                  const fresh = points.filter(p => !existingKeys.has(key(p)));
                  const toDmsRows = (ps: Array<{ latitude: number; longitude: number }>) => ps.map(p => {
                    const latDms = ddToDms(p.latitude);
                    const lngDms = ddToDms(p.longitude);
                    return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                  });
                  // 1) Điền điểm vào các hàng còn TRỐNG ở đầu/cuối (giữ nguyên vị trí), số điểm thừa mới thêm xuống dưới.
                  let fi = 0;
                  const merged = current.map((row) => {
                    if (isFilled(row)) return row;
                    if (fi >= fresh.length) return row;
                    const p = fresh[fi];
                    fi += 1;
                    const rows = toDmsRows([p]);
                    return rows[0];
                  });
                  merged.push(...toDmsRows(fresh.slice(fi)));
                  setGpsCoordList(merged);
                }
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
}
