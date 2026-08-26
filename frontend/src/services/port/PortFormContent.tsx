import React from 'react';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs, Button, Table, Upload, Space, Tag,
} from 'antd';
import { message } from '../../components/ToastNotification';
import { PlusOutlined, DeleteOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons';
import {
  colors,
} from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeSm, fontSizeMd, fontWeightMedium, fontWeightBold,
  radiusMd, radiusPill, spaceXs, spaceSm, spaceFormField, spaceMd, spaceLg,
  surfaceCard, surfacePage, uploadHintStyle,
} from '../../tokens';
import PagedTable from '../../components/list-view/PagedTable';
import { normalizeSearchText } from '../../components/org-unit';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

export interface PortFormContentProps {
  form: any;
  isEdit?: boolean;
  /** For create mode: active tab key */
  activeTabKey?: string;
  /** For create mode: tab change handler */
  onTabChange?: (key: string) => void;
  // Data dependencies
  orgUnits: Array<{ id: string; name: string }>;
  symbols: Array<{ id: string; name: string; code?: string; image?: string }>;
  provinces: string[];
  portCodeLoading?: boolean;
  canSubmitForApproval?: boolean;
  // GPS state
  gpsCoordList: Array<{ lat: number; lng: number }>;
  addGpsPoint: () => void;
  removeGpsPoint: (i: number) => void;
  updateGpsPoint: (i: number, field: 'lat' | 'lng', d: number, m: number, s: number) => void;
  ddToDms: (dd: number) => { d: number | null; m: number | null; s: number | null };
  // Infra state
  infraList: Array<{ stt: number; infraName: string; quantity: number | null }>;
  addInfra: () => void;
  removeInfra: (i: number) => void;
  updateInfraName: (i: number, val: string) => void;
  updateInfraQty: (i: number, val: number | null) => void;
  // File state
  uploadFileList: any[];
  setUploadFileList: (files: any[]) => void;
  // Geometry type (from form watch)
  geometryType?: string;
}

export default function PortFormContent({
  form,
  isEdit,
  activeTabKey,
  onTabChange,
  orgUnits,
  symbols,
  provinces,
  portCodeLoading,
  gpsCoordList,
  addGpsPoint,
  removeGpsPoint,
  updateGpsPoint,
  ddToDms,
  infraList,
  addInfra,
  removeInfra,
  updateInfraName,
  updateInfraQty,
  uploadFileList,
  setUploadFileList,
  geometryType,
}: PortFormContentProps) {

  const tabItems = [
    {
      key: 'general', label: 'Thông tin chung',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn đơn vị quản lý" allowClear showSearch optionFilterProp="label"
                  options={orgUnits.map((o) => ({ label: o.name, value: o.id }))} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="portGroup" {...labelProps('Nhóm cảng biển')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn nhóm cảng" allowClear style={selectStyle}
                  options={[
                    { value: 1, label: 'Nhóm 1' }, { value: 2, label: 'Nhóm 2' }, { value: 3, label: 'Nhóm 3' },
                    { value: 4, label: 'Nhóm 4' }, { value: 5, label: 'Nhóm 5' },
                  ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="portCode" {...labelProps('Mã cảng biển')} style={{ marginBottom: spaceFormField }}
                tooltip="Mã cảng được sinh tự động, không thể chỉnh sửa">
                <Input disabled placeholder={portCodeLoading ? 'Đang sinh mã...' : 'Mã tự động'} maxLength={50}
                  style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="portName" {...labelProps('Tên cảng biển')} style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Tên cảng không được để trống' }, { max: 255, message: 'Tên cảng tối đa 255 ký tự' }]}>
                <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="province" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} required style={{ marginBottom: spaceFormField }}>
                <Select showSearch placeholder="Chọn tỉnh/thành phố..."
                  filterOption={(input: string, option: any) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                  options={provinces.map((p: string) => ({ value: p, label: p }))} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="portClass" {...labelProps('Phân cấp cảng biển')} required style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn phân cấp" allowClear style={selectStyle}
                  options={[
                    { value: 5, label: 'Cấp đặc biệt' }, { value: 1, label: 'Cấp 1' }, { value: 2, label: 'Cấp 2' },
                    { value: 3, label: 'Cấp 3' }, { value: 4, label: 'Cấp 4' },
                  ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="waterAreaScope" {...labelProps('Phạm vi vùng nước cảng biển')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalBerths" {...labelProps('Tổng số bến cảng')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={5} step={1} precision={0} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalAnchoragesTransshipment" {...labelProps('Tổng số khu neo đậu, khu chuyển tải')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={5} step={1} precision={0} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalPublicChannels" {...labelProps('Tổng số tuyến luồng hàng hải công cộng')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={5} step={1} precision={0} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalDedicatedChannels" {...labelProps('Tổng số tuyến luồng hàng hải chuyên dùng')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={5} step={1} precision={0} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalPublicChannelLength" {...labelProps('Tổng chiều dài luồng hàng hải công cộng (km)')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={20} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalDedicatedChannelLength" {...labelProps('Tổng chiều dài luồng hàng hải chuyên dùng (km)')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={20} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalBuoysBeacons" {...labelProps('Tổng số phao tiêu, báo hiệu hàng hải trên luồng')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={5} step={1} precision={0} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalDikes" {...labelProps('Tổng số đê, kè')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={5} step={1} precision={0} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalDikeLength" {...labelProps('Tổng chiều dài hệ thống đê, kè (km)')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={20} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalLighthouses" {...labelProps('Tổng số đèn biển, đăng, tiêu độc lập')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={5} step={1} precision={0} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="buoyBerthCount" {...labelProps('Số lượng bến phao')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={5} step={1} precision={0} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="anchorageCount" {...labelProps('Số lượng khu neo đậu')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={5} step={1} precision={0} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="transshipmentCount" {...labelProps('Số lượng khu chuyển tải')} style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} max={5} step={1} precision={0} placeholder="0" style={numberInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="otherWaterAreas" {...labelProps('Các khu nước, vùng nước khác')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Mô tả" maxLength={2000} style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="remarks" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                <Input.TextArea rows={3} placeholder="Ghi chú" maxLength={2000}
                  styles={{ textarea: { borderRadius: radiusPill, overflow: 'hidden', padding: '4px 12px', resize: 'none' } }} />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'gis', label: 'Thông tin vị trí',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn loại đối tượng"
                  options={[
                    { value: 'POINT', label: 'Đối tượng điểm' },
                    { value: 'LINE', label: 'Đối tượng đường' },
                    { value: 'POLYGON', label: 'Đối tượng vùng' },
                  ]} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng bản đồ')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn biểu tượng hiển thị" allowClear showSearch optionFilterProp="label"
                  style={selectStyle}>
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
              <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle}
                  options={[{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: Hiển thị mặc định" maxLength={255} disabled style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
              </Form.Item>
            </Col>
          </Row>
          {/* GPS Coordinates (DMS) */}
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
            </span>
            {gpsCoordList.length > 0 && (
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} style={{ borderRadius: radiusPill }}>
                Thêm tọa độ
              </Button>
            )}
          </div>
          {gpsCoordList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
            </div>
          ) : (
            <PagedTable dataSource={gpsCoordList.map((c, i) => ({ ...c, _idx: i }))}
              tableProps={{ scroll: { x: 820 } }}>
              <Table.Column title="Vĩ độ (N)" key="lat"
                render={(_: any, record: any) => {
                  const dms = ddToDms(record.lat);
                  return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                    <InputNumber value={dms.d} min={0} max={90} placeholder="Độ" onChange={(v) => updateGpsPoint(record._idx, 'lat', v ?? 0, dms.m, dms.s)} style={{ flex: 1 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
                    <InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, v ?? 0, dms.s)} style={{ flex: 1 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
                    <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, dms.m, v ?? 0)} style={{ flex: 1.2 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
                  </Space.Compact>;
                }}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Kinh độ (E)" key="lng"
                render={(_: any, record: any) => {
                  const dms = ddToDms(record.lng);
                  return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                    <InputNumber value={dms.d} min={0} max={180} placeholder="Độ" onChange={(v) => updateGpsPoint(record._idx, 'lng', v ?? 0, dms.m, dms.s)} style={{ flex: 1 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
                    <InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, v ?? 0, dms.s)} style={{ flex: 1 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
                    <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, dms.m, v ?? 0)} style={{ flex: 1.2 }} controls={false} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
                  </Space.Compact>;
                }}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="" key="actions" width={44} align="center"
                render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeGpsPoint(record._idx)} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
            </PagedTable>
          )}
        </div>
      ),
    },
    {
      key: 'infra', label: 'Công trình KCHT',
      children: (
        <div style={{ paddingTop: 16 }}>
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Công trình KCHT</span>
            {infraList.length > 0 && (
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>Thêm công trình</Button>
            )}
          </div>
          {infraList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có công trình nào.</span>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>Thêm công trình</Button>
            </div>
          ) : (
            <PagedTable dataSource={infraList.map((inf, i) => ({ ...inf, _idx: i }))}
              tableProps={{ scroll: { x: 600 } }}>
              <Table.Column title="Tên Công Trình" key="name"
                render={(_: any, record: any) => <Input value={record.infraName} onChange={(e) => updateInfraName(record._idx, e.target.value)} placeholder="Tên công trình" maxLength={500} showCount style={{ borderRadius: radiusPill, height: 40 }} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Số Lượng" key="quantity" width={120} align="center"
                render={(_: any, record: any) => <InputNumber value={record.quantity} onChange={(v) => updateInfraQty(record._idx, v)} placeholder="1-5" min={0} max={5} style={{ width: '100%', borderRadius: radiusPill }} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="" key="actions" width={44} align="center"
                render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeInfra(record._idx)} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
            </PagedTable>
          )}
        </div>
      ),
    },
    {
      key: 'files', label: 'File đính kèm',
      children: (
        <div style={{ paddingTop: 16 }}>
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
            {uploadFileList.length > 0 && (
              <Upload beforeUpload={(file) => {
                if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                if (uploadFileList.length >= 10) { message.error('Tối đa 10 file'); return false; }
                setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                return false;
              }} showUploadList={false} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
                <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button>
              </Upload>
            )}
          </div>
          {uploadFileList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
              <Upload beforeUpload={(file) => {
                if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                return false;
              }} showUploadList={false} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
                <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
              </Upload>
            </div>
          ) : (
            <PagedTable dataSource={uploadFileList.map((f, i) => ({ ...f, _idx: i }))}
              tableProps={{ scroll: { x: 400 } }}>
              <Table.Column title="Tên file" key="name" dataIndex="name"
                render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="" key="actions" width={44} align="center"
                render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => setUploadFileList(uploadFileList.filter(x => x.uid !== record.uid))} />}
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
    <Tabs
      {...(isEdit ? { defaultActiveKey: 'general' } : { activeKey: activeTabKey, onChange: onTabChange })}
      tabBarStyle={{ marginBottom: 0, paddingTop: 0 }}
      items={tabItems}
    />
  );
}
