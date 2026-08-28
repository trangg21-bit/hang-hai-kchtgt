import { useState } from 'react';
import { Row, Col, Form, Input, Select, InputNumber, Tabs, Button, Upload, Space, Table } from 'antd';
import { PlusOutlined, DeleteOutlined, FileOutlined, InboxOutlined } from '@ant-design/icons';
import { message } from '../../components/ToastNotification';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { VIETNAM_PROVINCES } from '../../types/common';
import {
  colors, textPrimary, textTertiary, borderDefault, statusCritical,
  fontSizeSm, fontSizeMd, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceMd, spaceFormField, surfaceCard,
  readonlyInputStyle, actionPrimary, sidebarBg,
  drawerTabBarStyle, drawerTabContentStyle,
} from '../../themetokenchk';
import { fmtInputNumber } from '../../utils/numFmt';
import PagedTable from '../../components/list-view/PagedTable';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';

// ── Styles ──────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };
const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px). */
const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  return (
    <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
      <InputNumber value={dVal} min={0} max={maxDeg} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(v ?? null, mVal ?? null, sVal ?? null)} style={{ flex: 1, minWidth: 0, borderRadius: '999px 0 0 999px', height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>°</span>
      <InputNumber value={mVal} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal ?? null, v ?? null, sVal ?? null)} style={{ flex: 1, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>'</span>
      <InputNumber value={sVal} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal ?? null, mVal ?? null, v ?? null)} style={{ flex: 1.2, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitEndStyle}>"</span>
    </Space.Compact>
  );
};

// ── Types ───────────────────────────────────────────────────────────
export interface GpsCoordPoint {
  latD: number | null;
  latM: number | null;
  latS: number | null;
  lngD: number | null;
  lngM: number | null;
  lngS: number | null;
}

export interface PortFormProps {
  form: any;
  mode: 'create' | 'update';
  geometryType: string | undefined;
  atMax: Record<string, boolean>;
  activeTabKey?: string;
  onTabChange?: (key: string) => void;
  portCodeLoading?: boolean;
  orgUnits: any[];
  symbols: any[];
  gpsCoordList: GpsCoordPoint[];
  gpsError: string | null;
  gpsPage: number;
  onGpsPageChange: (page: number) => void;
  addGpsPoint: () => void;
  removeGpsPoint: (index: number) => void;
  updateGpsPoint: (index: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => void;
  /** Giữ prop để tương thích PortListPage (input Công trình KCHT đã chuyển sang tab chi tiết, không còn ở form) */
  infraList?: Array<{ stt: number; infraName: string; quantity: number | null }>;
  addInfra?: () => void;
  removeInfra?: (index: number) => void;
  updateInfraName?: (index: number, value: string) => void;
  updateInfraQty?: (index: number, value: number | null) => void;
  uploadFileList: any[];
  setUploadFileList: (files: any[]) => void;
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
  uploadFileList,
  setUploadFileList,
  onFinish,
  onFinishFailed,
}: PortFormProps) {
  const isCreate = mode === 'create';
  // Toggle cụm "Chỉ số tổng hợp" trong tab Thông tin chung (mặc định MỞ)
  const [indexOpen, setIndexOpen] = useState(true);

  const tabItems = [
    // ── Tab 1: Thông tin chung ──
    {
      key: 'general', label: 'Thông tin chung',
      children: (<div style={drawerTabContentStyle}>
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
              <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} showCount style={inputStyle} />
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
              <Select placeholder="Chọn nhóm cảng" allowClear style={selectStyle}
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
              <Select placeholder="Chọn phân cấp" allowClear style={selectStyle}
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
                placeholder="Chọn đơn vị quản lý..."
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
                placeholder="Chọn tỉnh/thành phố..."
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
          <Col span={12}>
            <Form.Item
              name="detailedLocation"
              {...labelProps('Địa điểm chi tiết')}
              style={{ marginBottom: spaceFormField }}
              validateStatus={atMax.detailedLocation ? 'error' : undefined} help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}
            >
              <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} showCount style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="waterAreaScope"
              {...labelProps('Phạm vi vùng nước cảng biển')}
              style={{ marginBottom: spaceFormField }}
              validateStatus={atMax.waterAreaScope ? 'error' : undefined} help={atMax.waterAreaScope ? 'Đã đạt tối đa 2000 ký tự' : undefined}
            >
              <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} showCount
                styles={{ textarea: { borderRadius: radiusPill, resize: 'none', padding: '12px 16px' } }}
              />
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
                <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalAnchoragesTransshipment"
                {...labelProps('Tổng số khu neo đậu, khu chuyển tải')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalAnchoragesTransshipment ? 'error' : undefined} help={atMax.totalAnchoragesTransshipment ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
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
                <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalDedicatedChannels"
                {...labelProps('Tổng số tuyến luồng hàng hải chuyên dùng')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalDedicatedChannels ? 'error' : undefined} help={atMax.totalDedicatedChannels ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
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
                <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalDedicatedChannelLength"
                {...labelProps('Tổng chiều dài luồng hàng hải chuyên dùng (km)')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalDedicatedChannelLength ? 'error' : undefined} help={atMax.totalDedicatedChannelLength ? 'Đã đạt tối đa 20 ký tự' : undefined}
              >
                <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
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
                <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalDikes"
                {...labelProps('Tổng số đê, kè')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalDikes ? 'error' : undefined} help={atMax.totalDikes ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
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
                <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalLighthouses"
                {...labelProps('Tổng số đèn biển, đăng, tiêu độc lập')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.totalLighthouses ? 'error' : undefined} help={atMax.totalLighthouses ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
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
                <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="anchorageCount"
                {...labelProps('Số lượng khu neo đậu')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.anchorageCount ? 'error' : undefined} help={atMax.anchorageCount ? 'Đã đạt tối đa 5 ký tự' : undefined}
              >
                <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
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
                <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="otherWaterAreas"
                {...labelProps('Các khu nước, vùng nước khác')}
                style={{ marginBottom: spaceFormField }}
                validateStatus={atMax.otherWaterAreas ? 'error' : undefined} help={atMax.otherWaterAreas ? 'Đã đạt tối đa 2000 ký tự' : undefined}
              >
                <Input placeholder="Mô tả" maxLength={2000} showCount style={inputStyle} />
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
                <Input.TextArea rows={3} placeholder="Ghi chú" maxLength={2000} showCount
                  styles={{ textarea: { borderRadius: radiusPill, resize: 'none', padding: '12px 16px' } }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>)}
      </div>),
    },
    // ── Tab 2: Thông tin vị trí ──
    {
      key: 'gis', label: `Thông tin vị trí (${gpsCoordList.length})`,
      children: (<div style={drawerTabContentStyle}>
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
        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS{geometryType && <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>*</span>}</span>
          </span>
          {gpsCoordList.length > 0 && (
            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!geometryType} style={{ borderRadius: radiusPill }}>
              Thêm tọa độ
            </Button>
          )}
        </div>
        {gpsCoordList.length === 0 ? (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            border: `1px dashed ${borderDefault}`,
            borderRadius: radiusMd,
            background: surfaceCard,
          }}>
            <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
              Chưa có tọa độ nào.
            </span>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!geometryType} style={{ borderRadius: radiusPill }}>
              Thêm tọa độ
            </Button>
          </div>
        ) : (
          <>
          {gpsError && (
            <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
            </div>
          )}
          <Table
            size="small"
            tableLayout="fixed"
            pagination={gpsCoordList.length > 10 ? {
              current: gpsPage,
              pageSize: 10,
              total: gpsCoordList.length,
              onChange: (p) => onGpsPageChange(p),
              showSizeChanger: false,
              size: 'small',
            } : false}
            dataSource={gpsCoordList.map((c, i) => ({ ...c, _idx: i }))}
            rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
            locale={{ emptyText: 'Chưa có tọa độ GPS nào' }}
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
      </div>),
    },
    // ── Tab 3: File đính kèm ──
    {
      key: 'files', label: `File đính kèm (${uploadFileList.length})`,
      children: (<div style={drawerTabContentStyle}>
        <div style={{ marginBottom: spaceMd }}>
          <Upload.Dragger
            beforeUpload={(file) => {
              if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
              const ext = file.name.split('.').pop()?.toLowerCase();
              if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
              if (uploadFileList.length >= 10) { message.error('Tối đa 10 file'); return false; }
              setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
              return false;
            }}
            showUploadList={false}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
            multiple
            style={{ background: '#fafbfc', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, padding: '24px 16px' }}
          >
            <p style={{ marginBottom: 8 }}>
              <InboxOutlined style={{ fontSize: 44, color: actionPrimary }} />
            </p>
            <p style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: textPrimary, marginBottom: 4 }}>
              Kéo thả tệp vào đây hoặc nhấp để chọn tệp tải lên
            </p>
            <p style={{ fontSize: fontSizeSm, color: textTertiary, margin: 0 }}>
              Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Mỗi file ≤ 20MB.
            </p>
          </Upload.Dragger>
        </div>
        {uploadFileList.length > 0 && (
          <>
            <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
              <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                Danh sách tệp đính kèm ({uploadFileList.length})
              </span>
            </div>
            <PagedTable
              dataSource={uploadFileList.map((f, i) => ({ ...f, _idx: i }))}
              tableProps={{ scroll: { x: 400 } }}
            >
              <Table.Column
                title="Tên file"
                key="name"
                dataIndex="name"
                render={(name: string) => (
                  <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
                    <FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />
                    {name}
                  </span>
                )}
                onHeaderCell={() => ({
                  style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                })}
              />
              <Table.Column
                title=""
                key="actions"
                width={44}
                align="center"
                render={(_: any, record: any) => (
                  <Button type="link" danger size="small" icon={<DeleteOutlined />}
                    onClick={() => setUploadFileList(uploadFileList.filter(x => x.uid !== record.uid))} />
                )}
                onHeaderCell={() => ({
                  style: { background: colors.bodyBg, padding: '12px 6px' },
                })}
              />
            </PagedTable>
          </>
        )}
      </div>),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      initialValues={isCreate ? { approvalStatus: 'APPROVED' } : undefined}
    >
      <Tabs
        {...(isCreate ? { activeKey: activeTabKey, onChange: onTabChange } : { defaultActiveKey: 'general' })}
        tabBarStyle={drawerTabBarStyle}
        items={tabItems}
      />
    </Form>
  );
}
