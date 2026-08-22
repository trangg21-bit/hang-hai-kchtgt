// ── BuoyFormContent — presentational Drawer form body (T4, design §2.5) ─
// No fetch, no routing. 3 Tabs: Thông tin chung / Thông tin vị trí / File đính kèm.

import React from 'react';
import {
  Row, Col, Form, Input, InputNumber, Select, DatePicker, Upload, Button, Tabs,
  Table, message, Space,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { UploadOutlined, DeleteOutlined, FileOutlined, PlusOutlined } from '@ant-design/icons';
import { colors } from '../../theme';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import {
  textTertiary, textPrimary, textSecondary,
  fontSizeMd, fontSizeSm, fontWeightBold, fontWeightMedium,
  radiusPill, radiusMd, spaceSm, spaceFormField, surfaceCard, borderDefault, uploadHintStyle,
} from '../../tokens';
import {
  CLASSIFICATION_OPTIONS,
  CLASSIFICATION_BUOY_OPTIONS,
  CLASSIFICATION_MARK_OPTIONS,
  CONDITION_OPTIONS,
  BEACON_LIGHT_OPTIONS,
} from './schema';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import PagedTable from '../../components/list-view/PagedTable';
import { fmtInputNumber } from '../../utils/numFmt';

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];
const COORD_SYS_OPTIONS = [{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }];

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const datePickerStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };
const parseInteger = (v: string | undefined): number => {
  const intPart = (v ?? '').replace(/,/g, '').split('.')[0];
  return intPart === '' ? 0 : Number(intPart);
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
  geometryType?: string;
  gpsCoordList: Array<{ lat: number | null; lng: number | null }>;
  gpsError?: string | null;
  addGpsPoint: () => void;
  removeGpsPoint: (i: number) => void;
  updateGpsPoint: (i: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => void;
  ddToDms: (dd: number | null | undefined) => { d: number | null; m: number | null; s: number | null };
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
}: BuoyFormContentProps) {
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
    const uploadFile: UploadFile = {
      uid: `-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'done',
      originFileObj: file,
    };
    setUploadFileList([...uploadFileList, uploadFile]);
    return false;
  };

  const handleRemoveFile = (file: UploadFile) => {
    setUploadFileList(uploadFileList.filter((f) => f.uid !== file.uid));
  };

  const tabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Row gutter={16}>
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
                tooltip={isEdit && !!currentStationId ? 'Phao tiêu đã thuộc nhà trạm này — không thể đổi nhà trạm quản lý vận hành' : undefined}
                rules={!isEdit ? [{ required: true, message: 'Thuộc nhà trạm quản lý vận hành phao, tiêu là bắt buộc' }] : []}
              >
                <Select
                  placeholder="Chọn Thuộc nhà trạm quản lý vận hành phao, tiêu"
                  loading={loadingStations}
                  disabled={isEdit && !!currentStationId}
                  options={buoyStations.map((s) => ({ value: s.id, label: s.name }))}
                  showSearch
                  filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                  onChange={onStationChange}
                  style={selectStyle}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
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
          <Row gutter={16}>
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
                  style={{ ...inputStyle, color: textTertiary, cursor: 'not-allowed' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                {...labelProps('Tên phao, tiêu')}
                required
                style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Tên phao tiêu không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
              >
                <Input placeholder="Nhập Tên phao, tiêu" maxLength={255} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn Địa điểm (Tỉnh/Thành phố)" options={VIETNAM_PROVINCE_OPTIONS} showSearch allowClear style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="locationDetail" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Địa điểm chi tiết" maxLength={500} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shape" {...labelProps('Hình dáng')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Hình dáng" maxLength={500} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="structure" {...labelProps('Kết cấu')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Kết cấu" maxLength={2000} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="area" {...labelProps('Diện tích (m2)')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} placeholder="Nhập Diện tích (m2)" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bodyHeight" {...labelProps('Chiều cao thân phao (m)')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} placeholder="Nhập Chiều cao thân phao (m)" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="diameter" {...labelProps('Đường kính phao (m)')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} placeholder="Nhập Đường kính phao (m)" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="beaconLight" {...labelProps('Đèn biển')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn Đèn biển" options={BEACON_LIGHT_OPTIONS} allowClear style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="towerHeight" {...labelProps('Chiều cao tháp đèn')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={1} precision={0} placeholder="Nhập Chiều cao tháp đèn" parser={parseInteger} style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="lightHeight"
                {...labelProps('Chiều cao tâm sáng (hải đồ)')}
                required
                style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Chiều cao tâm sáng là bắt buộc' }]}
              >
                <InputNumber min={0.01} step={1} precision={0} placeholder="Nhập Chiều cao tâm sáng (hải đồ)" parser={parseInteger} style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lightModel" {...labelProps('Chủng loại đèn (Thiết bị báo hiệu)')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Chủng loại đèn (Thiết bị báo hiệu)" maxLength={100} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="towerColor" {...labelProps('Màu sắc bên ngoài của tháp đèn')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Màu sắc bên ngoài của tháp đèn" maxLength={500} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="powerSupply" {...labelProps('Nguồn cung cấp năng lượng cho đèn')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Nguồn cung cấp năng lượng cho đèn" maxLength={500} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="range"
                {...labelProps('Phạm vi chiếu sáng')}
                required
                style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Phạm vi chiếu sáng là bắt buộc' }]}
                tooltip="Phạm vi chiếu sáng (hải lý)"
              >
                <InputNumber min={0.01} step={1} precision={0} placeholder="Nhập Phạm vi chiếu sáng" parser={parseInteger} style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="commissionedDate" {...labelProps('Thời điểm đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}>
                <DatePicker placeholder="Chọn Thời điểm đưa vào sử dụng" format="DD/MM/YYYY" popupClassName="buoy-date-picker" style={datePickerStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="lastRepairDate" {...labelProps('Thời điểm sửa chữa gần nhất')} style={{ marginBottom: spaceFormField }}>
                <DatePicker placeholder="Chọn Thời điểm sửa chữa gần nhất" format="DD/MM/YYYY" popupClassName="buoy-date-picker" style={datePickerStyle} />
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
      ),
    },
    {
      key: 'light',
      label: 'Đặc tính ánh sáng',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="lightColor" {...labelProps('Màu sắc')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Màu sắc" maxLength={50} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="flashType" {...labelProps('Kiểu chớp')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Kiểu chớp" maxLength={50} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="period" {...labelProps('Chu kỳ')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Chu kỳ" maxLength={50} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'gis',
      label: 'Thông tin vị trí',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn Loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}
                rules={geometryType ? [{ required: true, message: 'Hệ quy chiếu là bắt buộc khi chọn loại đối tượng' }] : []}>
                <Select placeholder="Chọn Hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}
                rules={geometryType ? [{ required: true, message: 'Quy tắc hiển thị là bắt buộc khi chọn loại đối tượng' }] : []}>
                <Input placeholder="Nhập Quy tắc hiển thị" maxLength={255} disabled style={{ ...inputStyle, color: textTertiary, cursor: 'not-allowed' }} />
              </Form.Item>
            </Col>
          </Row>
          {/* GPS Coordinates (DMS) */}
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
              {geometryType && <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>*</span>}
            </span>
            {gpsCoordList.length > 0 && (
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!geometryType} style={{ borderRadius: radiusPill }}>
                Thêm tọa độ
              </Button>
            )}
          </div>
          {gpsCoordList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!geometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
            </div>
          ) : (
            <PagedTable dataSource={gpsCoordList.map((c, i) => ({ ...c, _idx: i }))} tableProps={{ scroll: { x: 820 } }}>
              <Table.Column title="Vĩ độ (N)" key="lat"
                render={(_: any, record: any) => {
                  const dms = ddToDms(record.lat);
                  return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                    <InputNumber value={dms.d} min={0} max={90} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', v ?? 0, dms.m, dms.s)} style={{ flex: 1 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
                    <InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, v ?? 0, dms.s)} style={{ flex: 1 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
                    <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, dms.m, v ?? 0)} style={{ flex: 1.2 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
                  </Space.Compact>;
                }}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Kinh độ (E)" key="lng"
                render={(_: any, record: any) => {
                  const dms = ddToDms(record.lng);
                  return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                    <InputNumber value={dms.d} min={0} max={180} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', v ?? 0, dms.m, dms.s)} style={{ flex: 1 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
                    <InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, v ?? 0, dms.s)} style={{ flex: 1 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
                    <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, dms.m, v ?? 0)} style={{ flex: 1.2 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
                  </Space.Compact>;
                }}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Thao tác" key="actions" width={80} align="center"
                render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeGpsPoint(record._idx)} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
            </PagedTable>
          )}
          {gpsError && <div style={{ color: colors.error, fontSize: fontSizeMd, marginTop: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}><span>⚠</span><span>{gpsError}</span></div>}
        </div>
      ),
    },
    {
      key: 'files',
      label: 'File đính kèm',
      children: (
        <div style={{ paddingTop: 16 }}>
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
            {uploadFileList.length > 0 && (
              <Upload
                beforeUpload={handleBeforeUpload}
                showUploadList={false}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                multiple
              >
                <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
              </Upload>
            )}
          </div>
          {uploadFileList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
              <Upload
                beforeUpload={handleBeforeUpload}
                showUploadList={false}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                multiple
              >
                <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
              </Upload>
            </div>
          ) : (
            <PagedTable
              dataSource={uploadFileList.map((f, i) => ({ ...f, _idx: i, name: f.name }))}
              tableProps={{ scroll: { x: 400 } }}>
              <Table.Column title="Tên file" key="name" dataIndex="name"
                render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Thao tác" key="actions" width={80} align="center"
                render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveFile(record)} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
            </PagedTable>
          )}
          <div style={{ marginTop: spaceSm }}>
            <span style={uploadHintStyle}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.</span>
          </div>
        </div>
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
        tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
        items={tabItems}
      />
    </>
  );
}
