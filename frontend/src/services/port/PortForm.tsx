import { useState, useMemo } from 'react';
import { Row, Col, Form, Input, Select, InputNumber, Tabs, Button, Space, Modal, type FormInstance, type InputNumberProps } from 'antd';
import { PlusOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import toast from '../../components/ToastNotification';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import { VIETNAM_PROVINCES } from '../../types/common';
import {
  colors, textSecondary, textTertiary, borderDefault, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
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

// ── Styles ──────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };
const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };
type NumberInputWithCountProps = InputNumberProps<number> & { maxLength: number };

/** Hiển thị số ký tự đã nhập để giới hạn 5/20 chữ số của các chỉ số tổng hợp dễ nhận biết. */
function NumberInputWithCount({ maxLength, value, ...inputProps }: NumberInputWithCountProps) {
  const count = String(value ?? '').length;

  return (
    <InputNumber
      {...inputProps}
      value={value}
      maxLength={maxLength}
      suffix={<span aria-label={`${count} trên ${maxLength} ký tự`} style={{ color: textSecondary, fontSize: fontSizeMd }}>{count}/{maxLength}</span>}
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
  // Chỉ "bắt buộc" khi người dùng đã bắt đầu nhập (ít nhất 1 trong 3 ô có giá trị).
  const started = dVal != null || mVal != null || sVal != null;

  // 3 cột Độ·Phút·Giây — một nguồn sự thật duy nhất dùng chung cho CẢ hàng input lẫn hàng
  // message bên dưới (cùng flex basis 1 / 1 / 1.2 và cùng width) để text lỗi nằm đúng dưới ô
  // của nó và 2 cột (Vĩ độ, Kinh độ) trong bảng luôn thẳng hàng.
  const inputs = [
    {
      key: 'd', base: 'Độ', value: dVal, max: maxDeg,
      radius: '999px 0 0 999px', unit: '°', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm', base: 'Phút', value: mVal, max: 59,
      radius: '0', unit: '\'', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1,
      msg: started && mVal == null ? 'Phút bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, v, sVal ?? null),
    },
    {
      key: 's', base: 'Giây', value: sVal, max: 59.99,
      radius: '0', unit: '"', unitStyle: dmsUnitEndStyle, basis: '1.2 0 130px', width: 130,
      step: 0.01, formatter: fmtInputNumber,
      msg: started && sVal == null ? 'Giây bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, mVal ?? null, v),
    },
  ] as const;

  const inputRow = (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
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
            style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32 }}
            controls={false}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  // Hàng message LUÔN có mặt với chiều cao cố định (height 14px) → khi cột Vĩ độ hiện message
  // còn cột Kinh độ không (hoặc ngược lại), tổng chiều cao 2 ô của nhóm vẫn bằng nhau và 2
  // input thẳng hàng; chỉ chèn text "X bắt buộc" khi cần.
  const messageRow = (
    <div aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', width: '100%', minWidth: 0, marginTop: spaceXs, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
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
  uid: string;
  /** Tên gốc file (mappedAttachments → fileName). */
  name: string;
  size?: number;
  status?: string;
  originFileObj?: File;
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
  uploadFileList: PortUploadFile[];
  setUploadFileList: (files: PortUploadFile[]) => void;
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
  onFinish,
  onFinishFailed,
}: PortFormProps) {
  const isCreate = mode === 'create';
  // Toggle cụm "Chỉ số tổng hợp" trong tab Thông tin chung (mặc định MỞ)
  const [indexOpen, setIndexOpen] = useState(true);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  void onGpsPageChange;

  // Transform uploadFileList từ kiểu upload nội bộ { uid, name, size, status, originFileObj }
  // sang InfrastructureAttachmentItem ({ id, fileName, ... }) cho InfrastructureAttachmentTab.
  // Spread `...f` TRƯỚC rồi override id/fileName/fileSize theo `f` — tránh cảnh báo ghi đè.
  const mappedAttachments = useMemo<InfrastructureAttachmentItem[]>(() =>
    uploadFileList.map((f) => ({
      ...f,
      id: f.uid,
      fileName: f.name,
      fileSize: f.size,
      file: f.originFileObj,
    })),
    [uploadFileList],
  );

  const tabItems = [
    // ── Tab 1: Thông tin chung ──
    {
      key: 'general', label: 'Thông tin chung',
      children: (<div style={drawerFormScrollStyle}>
        <Row gutter={16}>
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
              validateStatus={atMax.portName ? 'error' : undefined} help={atMax.portName ? 'Đã đạt tối đa 255 ký tự' : undefined}
            >
              <Input placeholder="Nhập tên cảng biển" maxLength={255} showCount style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
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
        </Row>
        <Row gutter={16}>
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
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="detailedLocation"
              {...labelProps('Địa điểm chi tiết')}
              style={{ marginBottom: spaceFormField }}
              validateStatus={atMax.detailedLocation ? 'error' : undefined} help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}
            >
              <Input.TextArea rows={3} placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={textAreaStyle} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="waterAreaScope"
              {...labelProps('Phạm vi vùng nước cảng biển')}
              style={{ marginBottom: spaceFormField }}
              validateStatus={atMax.waterAreaScope ? 'error' : undefined} help={atMax.waterAreaScope ? 'Đã đạt tối đa 2000 ký tự' : undefined}
            >
              <Input.TextArea rows={3} placeholder="Nhập phạm vi vùng nước" maxLength={2000} showCount style={textAreaStyle} />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Toggle: Chỉ số tổng hợp (gom trong tab Thông tin chung) ── */}
        <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, marginBottom: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setIndexOpen(!indexOpen)}>
          <span style={{ color: indexOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{indexOpen ? '▼' : '▶'} Chỉ số tổng hợp</span>
        </button>
        {indexOpen && (<div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalBerths"
                {...labelProps('Tổng số bến cảng')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalBerths ? 'error' : undefined} help={atMax.totalBerths ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalAnchoragesTransshipment"
                {...labelProps('Tổng số khu neo đậu, khu chuyển tải')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalAnchoragesTransshipment ? 'error' : undefined} help={atMax.totalAnchoragesTransshipment ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalPublicChannels"
                {...labelProps('Tổng số tuyến luồng hàng hải công cộng')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalPublicChannels ? 'error' : undefined} help={atMax.totalPublicChannels ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalDedicatedChannels"
                {...labelProps('Tổng số tuyến luồng hàng hải chuyên dùng')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalDedicatedChannels ? 'error' : undefined} help={atMax.totalDedicatedChannels ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalPublicChannelLength"
                {...labelProps('Tổng chiều dài luồng hàng hải công cộng (km)')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalPublicChannelLength ? 'error' : undefined} help={atMax.totalPublicChannelLength ? 'Đã đạt tối đa 20 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalDedicatedChannelLength"
                {...labelProps('Tổng chiều dài luồng hàng hải chuyên dùng (km)')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalDedicatedChannelLength ? 'error' : undefined} help={atMax.totalDedicatedChannelLength ? 'Đã đạt tối đa 20 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalBuoysBeacons"
                {...labelProps('Tổng số phao tiêu, báo hiệu hàng hải trên luồng')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalBuoysBeacons ? 'error' : undefined} help={atMax.totalBuoysBeacons ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalDikes"
                {...labelProps('Tổng số đê, kè')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalDikes ? 'error' : undefined} help={atMax.totalDikes ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalDikeLength"
                {...labelProps('Tổng chiều dài hệ thống đê, kè (km)')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalDikeLength ? 'error' : undefined} help={atMax.totalDikeLength ? 'Đã đạt tối đa 20 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalLighthouses"
                {...labelProps('Tổng số đèn biển, đăng, tiêu độc lập')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalLighthouses ? 'error' : undefined} help={atMax.totalLighthouses ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="buoyBerthCount"
                {...labelProps('Số lượng bến phao')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.buoyBerthCount ? 'error' : undefined} help={atMax.buoyBerthCount ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="anchorageCount"
                {...labelProps('Số lượng khu neo đậu')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.anchorageCount ? 'error' : undefined} help={atMax.anchorageCount ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="transshipmentCount"
                {...labelProps('Số lượng khu chuyển tải')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.transshipmentCount ? 'error' : undefined} help={atMax.transshipmentCount ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="otherWaterAreas"
                {...labelProps('Các khu nước, vùng nước khác')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.otherWaterAreas ? 'error' : undefined} help={atMax.otherWaterAreas ? 'Đã đạt tối đa 2000 ký tự' : undefined}
              >
                <Input.TextArea rows={3} placeholder="Mô tả" maxLength={2000} showCount style={textAreaStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="remarks"
                {...labelProps('Ghi chú')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.remarks ? 'error' : undefined} help={atMax.remarks ? 'Đã đạt tối đa 2000 ký tự' : undefined}
              >
                <Input.TextArea rows={3} placeholder="Ghi chú" maxLength={2000} showCount style={textAreaStyle} />
              </Form.Item>
            </Col>
          </Row>
        </div>)}
      </div>),
    },
    // ── Tab 2: Thông tin vị trí ──
    {
      key: 'gis', label: `Thông tin vị trí (${gpsCoordList.length})`,
      children: (<div style={drawerFormScrollStyle}>
        <Row gutter={16}>
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
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="mapSymbolId"
              {...labelProps('Biểu tượng')}
              style={{ marginBottom: spaceFormField }}
            >
              <Select
                placeholder="Chọn biểu tượng bản đồ"
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={!geometryType}
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
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="coordinateSystem"
              {...labelProps('Hệ quy chiếu')}
              style={{ marginBottom: spaceFormField }}
              rules={geometryType ? [{ required: true, message: 'Hệ quy chiếu là bắt buộc khi chọn loại đối tượng' }] : []}
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
              rules={geometryType ? [{ required: true, message: 'Quy tắc hiển thị là bắt buộc khi chọn loại đối tượng' }] : []}
            >
              <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} />
            </Form.Item>
          </Col>
        </Row>
        {/* GPS Coordinates (DMS) */}
        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
          <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
            Tọa độ GPS ({gpsCoordList.length})
          </span>
          <Space size={8}>
            <Button
              icon={<EnvironmentOutlined style={{ color: !geometryType ? undefined : actionPrimary }} />}
              onClick={() => setGisModalOpen(true)}
              disabled={!geometryType}
              style={!geometryType ? {
                height: 32,
                fontSize: fontSizeSm,
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
                fontSize: fontSizeSm,
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
              disabled={!geometryType || (geometryType === 'POINT' && gpsCoordList.length >= 1)}
              style={!geometryType || (geometryType === 'POINT' && gpsCoordList.length >= 1) ? {
                height: 32,
                fontSize: fontSizeSm,
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
                fontSize: fontSizeSm,
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={geometryType === 'POINT' && gpsCoordList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined}
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
                title: <span>Vĩ độ (Latitude - N){geometryType && <span aria-hidden="true" style={{ color: statusCritical, marginLeft: spaceXs }}>*</span>}</span>,
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
                title: <span>Kinh độ (Longitude - E){geometryType && <span aria-hidden="true" style={{ color: statusCritical, marginLeft: spaceXs }}>*</span>}</span>,
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
                render: (_value, record) => (
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeGpsPoint(record._idx)} />
                ),
              },
            ]}
          />
          </>
        )}
      </div>),
    },
    // ── Tab 3: File đính kèm ──
    {
      key: 'files', label: `File đính kèm (${uploadFileList.length})`,
      children: (
        <InfrastructureAttachmentTab
          attachments={mappedAttachments}
          readonly={false}
          onUpload={(file) => {
            setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, size: file.size, status: 'done', originFileObj: file }]);
            return false;
          }}
          onDelete={(uid) => {
            setUploadFileList(uploadFileList.filter((x) => x.uid !== uid));
          }}
          onDownload={(uid, name) => {
            toast.info(`Đang tải xuống tệp: ${name}`);
          }}
        />
      ),
    },
    // ── Tab 4: Công trình KCHT trực thuộc ──
    {
      key: 'infra', label: 'Công trình KCHT trực thuộc',
      children: (<div style={drawerFormScrollStyle}>
        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
          <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
            Công trình KCHT trực thuộc
          </span>
          {infraList.length === 0 ? null : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addInfra}
              style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Thêm công trình
            </Button>
          )}
        </div>
        {infraList.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
            <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có công trình nào.</span>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>Thêm công trình</Button>
          </div>
        ) : (
          <DetailTable<IndexedPortInfrastructureEntry>
            size="small"
            scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
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
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                ),
              },
              {
                title: 'Số lượng',
                key: 'quantity',
                width: 120,
                align: 'center' as const,
                render: (_value, record) => (
                  <InputNumber
                    value={record.quantity}
                    onChange={(v) => updateInfraQty(record._idx, v)}
                    placeholder="1-5"
                    min={0}
                    max={5}
                    style={{ width: '100%', borderRadius: radiusPill }}
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
            defaultGeometryType="POINT"
            height={520}
            onChange={(val) => {
              if (val?.coordinates && setGpsCoordList) {
                // Nhận mọi dạng WKT (POINT/MULTIPOINT/LINESTRING/POLYGON) — chọn NHIỀU tọa độ trên bản đồ
                const points = parseGisCoordinates({ geometryType: val.geometryType, coordinates: val.coordinates });
                if (points.length > 0) {
                  const existing = gpsCoordList || [];
                  const key = (p: { latitude: number; longitude: number }) => `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                  const existingKeys = new Set(existing
                    .filter(c => c.latD != null && c.lngD != null)
                    .map(c => key({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 })));
                  const toAdd = points.filter(p => !existingKeys.has(key(p))).map(p => {
                    const latDms = ddToDms(p.latitude);
                    const lngDms = ddToDms(p.longitude);
                    return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                  });
                  if (toAdd.length > 0) setGpsCoordList([...existing, ...toAdd]);
                }
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
}
