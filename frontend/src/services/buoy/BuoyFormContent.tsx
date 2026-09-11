// ── BuoyFormContent — presentational Drawer form body (T4, design §2.5) ─
// No fetch, no routing. 3 Tabs: Thông tin chung / Thông tin vị trí / File đính kèm.

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/authStore';
import {
  Row, Col, Form, Input, InputNumber, Select, DatePicker, Button, Tabs,
  message, Space, Modal,
} from 'antd';
import type { UploadFile, UploadProps, InputNumberProps } from 'antd';
import { DeleteOutlined, PlusOutlined, EnvironmentOutlined, BankOutlined, SlidersOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { colors } from '../../themetokenchk';
import {
  textSecondary, textTertiary, sidebarBg, statusCritical, actionPrimary,
  fontSizeMd, fontSizeSm, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceXs, spaceFormField, surfaceCard, borderDefault,
  readonlyInputStyle, drawerTabBarStyle, drawerFormScrollStyle, textAreaStyle,
  primaryButtonStyle, outlineButtonStyle,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import {
  CLASSIFICATION_OPTIONS,
  CLASSIFICATION_BUOY_OPTIONS,
  CLASSIFICATION_MARK_OPTIONS,
  CONDITION_OPTIONS,
  BEACON_LIGHT_OPTIONS,
} from './schema';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { fmtInputNumber } from '../../utils/numFmt';
import toast from '../../components/ToastNotification';
import GisLocationSelector from '../../components/gis/GisLocationSelector';

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];
const COORD_SYS_OPTIONS = [{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }];

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
type NumberInputWithCountProps = InputNumberProps<any> & { maxLength: number };

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
const datePickerStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };

const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: `1px solid ${borderDefault}`,
  borderRadius: 8,
  padding: '16px 20px',
  marginBottom: 16,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
  paddingBottom: 8,
  borderBottom: `1px solid ${borderDefault}`,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  fontWeight: fontWeightBold,
  color: colors.sidebarBg,
};

const parseInteger = (v: string | undefined): number => {
  const intPart = (v ?? '').replace(/,/g, '').split('.')[0];
  return intPart === '' ? 0 : Number(intPart);
};

const labelProps = (text: string) => ({
  label: <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px). */
/**
 * Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px).
 * Giống chuẩn PortForm — mỗi ô (Độ/Phút/Giây) là một cột flex riêng (Độ=1 · Phút=1 · Giây=1.2,
 * cùng template cột Vĩ độ) để message "… bắt buộc" nằm NGAY DƯỚI đúng ô còn thiếu và 2 cột
 * (Vĩ độ/Kinh độ) trong bảng luôn thẳng hàng dọc dù chỉ 1 bên có lỗi.
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

  // Hàng message LUÔN có mặt với chiều cao cố định (height 14px) → khi cột Vĩ độ hiện lỗi
  // còn cột Kinh độ không (hoặc ngược lại), tổng chiều cao 2 ô của nhóm vẫn bằng nhau và 2
  // input thẳng hàng.
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

const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length-1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.+-]+)\s+([\d.+-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* ignore */ }
  return [];
};

export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_FILE_COUNT = 10;

export interface BuoyFormContentProps {
  /** Optional — the page owns the Form instance via <Form form={...}> wrapper. */
  form?: any;
  isEdit?: boolean;
  /** For create mode: active tab key */
  activeTabKey?: string;
  /** For create mode: tab change handler */
  onTabChange?: (key: string) => void;
  orgUnits: OrgUnitTreeOption[];
  loadingOrgs?: boolean;
  buoyStations: Array<{ id: string; name: string; code: string }>;
  loadingStations?: boolean;
  /** Đơn vị quản lý đang chọn trong form — chưa chọn thì field nhà trạm bị disable (pattern BerthForm load Cảng biển). */
  selectedUnitId?: string | null;
  /**
   * Nhà trạm QLVH hiện tại của phao tiêu (chế độ chỉnh sửa).
   * Chỉ cho phép đổi khi phao tiêu CHƯA có nhà trạm (currentStationId rỗng);
   * phao đã thuộc nhà trạm thì khóa không cho đổi.
   */
  currentStationId?: string | null;
  /** Sinh mã tự động {mã nhà trạm}-PT-{seq} khi chọn nhà trạm (chỉ chế độ thêm mới). */
  onStationChange?: (stationId: string | undefined) => void;
  /** For create mode: code auto-generation in-flight (mã sinh tự động). */
  codeLoading?: boolean;
  uploadFileList: any[];
  setUploadFileList: (files: any[]) => void;
  symbols: Array<{ id: string; name: string; code?: string; image?: string }>;
  /** Map id người dùng → tên hiển thị (cột Người tải lên trong bảng file đính kèm). */
  userMap?: Map<string, string>;
  geometryType?: string;
  gpsCoordList: Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>;
  gpsError?: string | null;
  addGpsPoint: () => void;
  removeGpsPoint: (i: number) => void;
  updateGpsPoint: (i: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => void;
  ddToDms: (dd: number | null | undefined) => { d: number | null; m: number | null; s: number | null };
  onDeleteAttachment?: (uid: string) => void;
}

export default function BuoyFormContent({
  isEdit,
  activeTabKey,
  onTabChange,
  orgUnits,
  loadingOrgs,
  codeLoading,
  uploadFileList,
  setUploadFileList,
  symbols,
  userMap,
  geometryType,
  gpsCoordList,
  gpsError,
  addGpsPoint,
  removeGpsPoint,
  updateGpsPoint,
  ddToDms,
  buoyStations,
  loadingStations,
  onStationChange,
  currentStationId,
  selectedUnitId,
  onDeleteAttachment,
}: BuoyFormContentProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsPage, setGpsPage] = useState(1);
  const hasCoordinates = (gpsCoordList || []).some((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null));
  const hasLocation = Boolean(geometryType || hasCoordinates);

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      message.error(`File "${file.name}" vượt quá 20MB`);
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      message.error(`Định dạng .${ext} không được hỗ trợ`);
      return false;
    }
    if (uploadFileList.length >= MAX_FILE_COUNT) {
      message.error('Chỉ được upload tối đa 10 file');
      return false;
    }
    const nowIso = dayjs().toISOString();
    const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
    const uploadFile: any = {
      uid: `-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      fileName: file.name,
      size: file.size,
      fileSize: file.size,
      type: file.type,
      fileType: file.type,
      uploadedByName: uploaderName,
      uploadedBy: currentUser?.userId || currentUser?.id || uploaderName,
      uploadedDate: nowIso,
      uploadedAt: nowIso,
      createdAt: nowIso,
      status: 'done',
      originFileObj: file,
    };
    setUploadFileList([...uploadFileList, uploadFile]);
    return false;
  };

  const tabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
          {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <BankOutlined style={{ color: actionPrimary }} />
                <span style={{ marginLeft: 8 }}>Thông tin cơ bản & Quản lý vận hành</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="unitId"
                  {...labelProps('Đơn vị quản lý')}
                  required={!isEdit}
                  style={{ marginBottom: spaceFormField }}
                  rules={!isEdit ? [{ required: true, message: 'Đơn vị quản lý là bắt buộc khi thêm mới' }] : []}
                >
                  <OrgUnitTreeSelect
                    organizations={orgUnits}
                    placeholder="Chọn Đơn vị quản lý"
                    loading={loadingOrgs}
                    disabled={isEdit}
                    showPath
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="buoyStationId"
                  {...labelProps('Thuộc nhà trạm quản lý vận hành phao, tiêu')}
                  required={!isEdit}
                  style={{ marginBottom: spaceFormField }}
                  tooltip={!selectedUnitId ? 'Vui lòng chọn Đơn vị quản lý trước' : (isEdit && !!currentStationId ? 'Phao tiêu đã thuộc nhà trạm này — không thể đổi nhà trạm quản lý vận hành' : undefined)}
                  rules={!isEdit ? [{ required: true, message: 'Thuộc nhà trạm quản lý vận hành phao, tiêu là bắt buộc' }] : []}
                >
                  <Select
                    placeholder={!selectedUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : (buoyStations.length === 0 && !loadingStations ? 'Không có nhà trạm đã phê duyệt thuộc đơn vị quản lý' : 'Chọn Thuộc nhà trạm quản lý vận hành phao, tiêu')}
                    loading={loadingStations}
                    disabled={isEdit || !selectedUnitId || (buoyStations.length === 0 && !loadingStations)}
                    options={buoyStations.map((s) => ({ value: s.id, label: s.name }))}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                    notFoundContent="Không có nhà trạm đã phê duyệt thuộc đơn vị quản lý"
                    onChange={onStationChange}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="classification"
                  {...labelProps('Phân loại')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Vui lòng chọn phân loại' }]}
                >
                  <Select placeholder="Chọn Phân loại" options={CLASSIFICATION_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="classificationBuoy" {...labelProps('Phân loại phao')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn Phân loại phao" options={CLASSIFICATION_BUOY_OPTIONS} allowClear style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="classificationMark" {...labelProps('Phân loại tiêu')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn Phân loại tiêu" options={CLASSIFICATION_MARK_OPTIONS} allowClear style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  {...labelProps('Mã phao, tiêu')}
                  style={{ marginBottom: spaceFormField }}
                  tooltip={!isEdit ? 'Mã tự sinh theo {mã nhà trạm}-PT-{seq}, không thể chỉnh sửa' : undefined}
                  rules={!isEdit ? [{ max: 50, message: 'Tối đa 50 ký tự' }] : []}
                >
                  <Input
                    disabled
                    placeholder={isEdit ? undefined : (codeLoading ? 'Đang sinh mã...' : 'Mã tự động')}
                    maxLength={50}
                    style={readonlyInputStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  {...labelProps('Tên phao, tiêu')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Tên phao tiêu không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
                >
                  <Input placeholder="Nhập Tên phao, tiêu" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn Địa điểm (Tỉnh/Thành Phố)" options={VIETNAM_PROVINCE_OPTIONS} showSearch allowClear style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="locationDetail" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="condition"
                  {...labelProps('Tình trạng')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  initialValue="Chưa khai thác/vận hành"
                  rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                >
                  <Select placeholder="Chọn Tình trạng" options={CONDITION_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 2: Thông số kỹ thuật & Quy mô thân phao / tháp đèn ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <SlidersOutlined style={{ color: actionPrimary }} />
                <span style={{ marginLeft: 8 }}>Thông số kỹ thuật & Quy mô thân phao / tháp đèn</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="shape" {...labelProps('Hình dạng')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Hình dạng" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="area" {...labelProps('Diện tích (m2)')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="bodyHeight" {...labelProps('Chiều cao thân phao (m)')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="diameter" {...labelProps('Đường kính phao (m)')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="beaconLight" {...labelProps('Đèn biển')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn Đèn biển" options={BEACON_LIGHT_OPTIONS} allowClear style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="towerHeight" {...labelProps('Chiều cao tháp đèn')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="lightHeight"
                  {...labelProps('Chiều cao tâm sáng (hải đồ)')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Chiều cao tâm sáng là bắt buộc' }]}
                >
                  <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lightModel" {...labelProps('Chủng loại đèn (Thiết bị báo hiệu)')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Chủng loại đèn (Thiết bị báo hiệu)" maxLength={100} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="towerColor" {...labelProps('Màu sắc bên ngoài của tháp đèn')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Màu sắc bên ngoài của tháp đèn" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="powerSupply" {...labelProps('Nguồn cung cấp năng lượng cho đèn')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Nguồn cung cấp năng lượng cho đèn" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="range"
                  {...labelProps('Phạm vi chiếu sáng')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Phạm vi chiếu sáng là bắt buộc' }]}
                  tooltip="Phạm vi chiếu sáng (hải lý)"
                >
                  <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="structure" {...labelProps('Kết cấu')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={3} placeholder="Nhập kết cấu" maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 3: Đặc tính ánh sáng & Thời gian vận hành ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <ThunderboltOutlined style={{ color: actionPrimary }} />
                <span style={{ marginLeft: 8 }}>Đặc tính ánh sáng & Thời gian vận hành</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="lightColor" {...labelProps('Màu sắc')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Màu sắc" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="flashType" {...labelProps('Kiểu chớp')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Kiểu chớp" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="period" {...labelProps('Chu kỳ')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Chu kỳ" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="commissionedDate" {...labelProps('Thời điểm đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker placeholder="Chọn Thời điểm đưa vào sử dụng" format="DD/MM/YYYY" popupClassName="buoy-date-picker" style={datePickerStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      ),
    },
    {
      key: 'gis',
      label: `Thông tin vị trí (${gpsCoordList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item
                name="geometryType"
                {...labelProps('Loại đối tượng')}
                required={hasCoordinates}
                rules={hasCoordinates ? [{ required: true, message: 'Loại đối tượng là bắt buộc khi có tọa độ' }] : []}
                style={{ marginBottom: spaceFormField }}
              >
                <Select placeholder="Chọn Loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mapSymbolId"
                {...labelProps('Biểu tượng')}
                required={hasLocation}
                rules={hasLocation ? [{ required: true, message: 'Vui lòng chọn biểu tượng bản đồ' }] : []}
                style={{ marginBottom: spaceFormField }}
              >
                <Select placeholder="Chọn Biểu tượng" allowClear showSearch optionFilterProp="label"
                  disabled={!geometryType} style={selectStyle}>
                  {symbols.map((sym) => (
                    <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                      <Space>
                        {sym.image && <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                        <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn Hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          {/* ── Tọa độ GPS: 6 trường DMS riêng (latD/latM/latS/lngD/lngM/lngS), mỗi ô ghi trực tiếp (chuẩn VTS CHK) ── */}
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
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block' }}>Chưa có tọa độ nào.</span>
            </div>
          ) : (
            <>
            {gpsError && (
              <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
              </div>
            )}
            <DetailTable
              size="small"
              scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
              pagination={gpsCoordList.length > 10 ? {
                current: gpsPage,
                pageSize: 10,
                total: gpsCoordList.length,
                onChange: (p: number) => setGpsPage(p),
                showSizeChanger: false,
                size: 'small',
              } : false}
              dataSource={gpsCoordList.map((c, i) => ({ ...c, _idx: i }))}
              rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
              emptyText="Chưa có tọa độ GPS nào"
              columns={[
                {
                  title: 'STT',
                  width: 60,
                  align: 'center' as const,
                  render: (_v: any, _r: any, idx: number) => (gpsPage - 1) * 10 + idx + 1,
                },
                {
                  title: 'Vĩ độ (Latitude - N)',
                  key: 'lat',
                  render: (_v: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                },
                {
                  title: 'Kinh độ (Longitude - E)',
                  key: 'lng',
                  render: (_v: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
                },
                {
                  title: '',
                  width: 50,
                  align: 'center' as const,
                  render: (_v: any, record: any) => (
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeGpsPoint(record._idx)} />
                  ),
                },
              ]}
            />
            </>
          )}
        </div>
      ),
    },
    {
      key: 'files',
      label: `File đính kèm (${uploadFileList.length})`,
      children: (
        <InfrastructureAttachmentTab
          attachments={uploadFileList.map((f: any) => ({
            ...f,
            id: f.uid || f.id,
            fileName: f.name || f.fileName,
            fileSize: f.fileSize ?? f.size ?? f.originFileObj?.size,
            uploadedByName: f.uploadedByName || (f.uploadedBy ? (userMap?.get(f.uploadedBy) || f.uploadedBy) : '') || currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
            uploadedDate: f.uploadedDate || f.uploadedAt || f.createdAt || dayjs().toISOString(),
          }))}
          readonly={false}
          userMap={userMap}
          onUpload={(file) => { handleBeforeUpload(file); return false; }}
          onDelete={(uid) => {
            onDeleteAttachment?.(uid);
            setUploadFileList((prev) => prev.filter((x) => (x.uid || (x as any).id) !== uid));
          }}
          onDownload={(_uid, name) => { toast.info(`Đang tải xuống tệp: ${name}`); }}
        />
      ),
    },
  ];

  return (
    <>
      {/* Nút "Hôm nay" trong popup DatePicker tô màu tím (colors.info) thay vì màu colorLink mặc định */}
      <style>{`.buoy-date-picker .ant-picker-today-btn{color:${colors.info}!important}`}</style>
      <Tabs
        activeKey={activeTabKey}
        onChange={onTabChange}
        tabBarStyle={drawerTabBarStyle}
        items={tabItems}
      />

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
              if (val?.coordinates) {
                const points = parseGisCoordinates({ geometryType: val.geometryType, coordinates: val.coordinates });
                if (points.length > 0) {
                  const toDmsRow = (p: { latitude: number; longitude: number }) => {
                    const latDms = ddToDms(p.latitude);
                    const lngDms = ddToDms(p.longitude);
                    return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                  };
                  const rowKey = (row: any) => `${Math.round(((row.latD ?? 0) + (row.latM ?? 0) / 60 + (row.latS ?? 0) / 3600) * 1e5)}_${Math.round(((row.lngD ?? 0) + (row.lngM ?? 0) / 60 + (row.lngS ?? 0) / 3600) * 1e5)}`;
                  const existingKeys = new Set(gpsCoordList.map(rowKey));
                  const toAdd = points.map(toDmsRow).filter((r) => !existingKeys.has(rowKey(r)));
                  if (toAdd.length > 0) {
                    const baseIdx = gpsCoordList.length;
                    toAdd.forEach(() => { addGpsPoint(); });
                    toAdd.forEach((row, k) => {
                      updateGpsPoint(baseIdx + k, 'lat', row.latD, row.latM, row.latS);
                      updateGpsPoint(baseIdx + k, 'lng', row.lngD, row.lngM, row.lngS);
                    });
                  }
                }
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
}
