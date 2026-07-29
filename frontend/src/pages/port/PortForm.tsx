import { useState, useCallback, useEffect } from 'react';
import { Modal, Form, Button, Space, Tag, Typography, Row, Col, Input, InputNumber, Select } from 'antd';
import { portCRUD } from '../../services/portService';
import type { Port } from '../../types/port';
import toast from '../../components/ToastNotification';
import {
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  spaceFormField,
  radiusPill,
  borderDefault,
} from '../../tokens';
import { VIETNAM_PROVINCES } from '../../types/common';

interface PortFormModalProps {
  open: boolean;
  record?: Port | null;
  onClose: () => void;
  onSuccess: () => void;
}

const labelProps = (text: string) => ({
  label: <span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const numberInputStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };

export default function PortFormModal({ open, record, onClose, onSuccess }: PortFormModalProps) {
  const isEdit = !!record;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [coords, setCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [infras, setInfras] = useState<Array<{ sequenceNumber: number; infrastructureName: string; quantity: number }>>([]);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    if (!open) return;
    if (isEdit && record) {
      form.setFieldsValue({
        portName: record.portName,
        province: record.province || undefined,
        area: record.area ?? undefined,
        orgUnitId: record.orgUnitId || undefined,
        managingUnitId: record.managingUnitId || undefined,
        portGroup: record.portGroup ?? undefined,
        detailedLocation: record.detailedLocation || record.diaDiemChiTiet || undefined,
        portClass: record.portClass ?? record.phanCap ?? undefined,
        waterAreaScope: record.waterAreaScope || record.phamViVungNuoc || undefined,
        totalBerth: record.totalBerth ?? record.tongSoBenCang ?? undefined,
        totalAnchorageTransshipment: record.totalAnchorageTransshipment ?? record.tongSoKhuNeoDauChuyenTai ?? undefined,
        totalPublicChannel: record.totalPublicChannel ?? record.tongSoTuyenLuongCongCong ?? undefined,
        totalDedicatedChannel: record.totalDedicatedChannel ?? record.tongSoTuyenLuongChuyenDung ?? undefined,
        totalPublicChannelLength: record.totalPublicChannelLength ?? record.tongChieuDaiLuongCongCong ?? undefined,
        totalDedicatedChannelLength: record.totalDedicatedChannelLength ?? record.tongChieuDaiLuongChuyenDung ?? undefined,
        totalBeaconMarker: record.totalBeaconMarker ?? record.tongSoPhaoTieuBaoHieu ?? undefined,
        totalDikeRevetment: record.totalDikeRevetment ?? record.tongSoDeKe ?? undefined,
        totalDikeRevetmentLength: record.totalDikeRevetmentLength ?? record.tongChieuDaiDeKe ?? undefined,
        totalLighthouseBeacon: record.totalLighthouseBeacon ?? record.tongSoDenBienDangTieu ?? undefined,
        buoyBerthCount: record.buoyBerthCount ?? record.quantityBenPhao ?? undefined,
        anchorageCount: record.anchorageCount ?? record.quantityKhuNeoDau ?? undefined,
        transshipmentCount: record.transshipmentCount ?? record.quantityKhuChuyenTai ?? undefined,
        otherWaterAreas: record.otherWaterAreas || record.cacKhuNuocKhac || undefined,
        remarks: record.remarks || undefined,
        notes: record.notes || undefined,
        portCode: record.portCode,
      });
      setCoords(record.portCoordinates?.map(c => ({ latitude: c.latitude, longitude: c.longitude })) || []);
      setInfras(record.portInfrastructures?.map(c => ({
        sequenceNumber: c.sequenceNumber, infrastructureName: c.infrastructureName, quantity: c.quantity,
      })) || []);
    } else {
      form.resetFields();
      setCoords([]);
      setInfras([]);
      // Auto-generate port code for create mode
      setGeneratedCode('');
      portCRUD.generateCode().then((code: string) => {
        setGeneratedCode(code);
      }).catch(() => {
        // silent — user can type manually
      });
    }
  }, [open, isEdit, record, form]);

  const handleSubmit = useCallback(async (actionType: 'draft' | 'submit') => {
    try {
      const values = await form.validateFields();
      for (const c of coords) {
        if (c.latitude < -90 || c.latitude > 90) { toast.error('Vĩ độ phải từ -90 đến 90'); return; }
        if (c.longitude < -180 || c.longitude > 180) { toast.error('Kinh độ phải từ -180 đến 180'); return; }
      }
      setSubmitting(true);
      const buildPayload = () => ({
        portName: values.portName,
        province: values.province || undefined,
        area: values.area ?? 0,
        action: actionType,
        orgUnitId: values.orgUnitId || undefined,
        managingUnitId: values.managingUnitId || undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        detailedLocation: values.detailedLocation || undefined,
        portClass: values.portClass != null ? Number(values.portClass) : undefined,
        waterAreaScope: values.waterAreaScope || undefined,
        totalBerth: values.totalBerth != null ? Number(values.totalBerth) : null,
        totalAnchorageTransshipment: values.totalAnchorageTransshipment != null ? Number(values.totalAnchorageTransshipment) : null,
        totalPublicChannel: values.totalPublicChannel != null ? Number(values.totalPublicChannel) : null,
        totalDedicatedChannel: values.totalDedicatedChannel != null ? Number(values.totalDedicatedChannel) : null,
        totalPublicChannelLength: values.totalPublicChannelLength != null ? Number(values.totalPublicChannelLength) : null,
        totalDedicatedChannelLength: values.totalDedicatedChannelLength != null ? Number(values.totalDedicatedChannelLength) : null,
        totalBeaconMarker: values.totalBeaconMarker != null ? Number(values.totalBeaconMarker) : null,
        totalDikeRevetment: values.totalDikeRevetment != null ? Number(values.totalDikeRevetment) : null,
        totalDikeRevetmentLength: values.totalDikeRevetmentLength != null ? Number(values.totalDikeRevetmentLength) : null,
        totalLighthouseBeacon: values.totalLighthouseBeacon != null ? Number(values.totalLighthouseBeacon) : null,
        buoyBerthCount: values.buoyBerthCount != null ? Number(values.buoyBerthCount) : null,
        anchorageCount: values.anchorageCount != null ? Number(values.anchorageCount) : null,
        transshipmentCount: values.transshipmentCount != null ? Number(values.transshipmentCount) : null,
        otherWaterAreas: values.otherWaterAreas || undefined,
        remarks: values.remarks || undefined,
        notes: values.notes || undefined,
        portCoordinates: coords.map((c, idx) => ({ ...c, sortOrder: idx + 1 })),
        portInfrastructures: infras.map((c, idx) => ({ ...c, sequenceNumber: idx + 1 })),
      });
      if (isEdit && record) {
        await portCRUD.update({ id: record.id, ...buildPayload() } as any);
        toast.success('Cập nhật cảng biển thành công');
      } else {
        await portCRUD.create(buildPayload() as any);
        toast.success('Tạo cảng biển thành công');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        // validation error
      } else {
        toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, isEdit, record, coords, infras, onSuccess, onClose]);

  return (
    <Modal
      title={isEdit && record ? `Chỉnh sửa: ${record.portCode} — ${record.portName}` : 'Tạo mới Cảng biển'}
      open={open} onCancel={onClose} footer={null} width={900} forceRender
    >
      <Form form={form} layout="vertical">
        <Typography.Text strong style={{ display: 'block', marginBottom: 8, color: textPrimary }}>1. Thông tin chung</Typography.Text>
        {!isEdit && generatedCode && (
          <div style={{ marginBottom: spaceFormField, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã cảng:</span>
            <Tag color="cyan" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold }}>{generatedCode}</Tag>
          </div>
        )}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="managingUnitId" {...labelProps('Đơn vị quản lý')} style={{ marginBottom: spaceFormField }}>
              <Select placeholder="Chọn đơn vị quản lý" allowClear style={selectStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="portGroup" {...labelProps('Nhóm cảng biển')} style={{ marginBottom: spaceFormField }}>
              <Select placeholder="Chọn nhóm" allowClear
                options={[{ label: 'Nhóm 1', value: 1 }, { label: 'Nhóm 2', value: 2 }, { label: 'Nhóm 3', value: 3 }]}
                style={selectStyle} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="portName" {...labelProps('Tên cảng *')} style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Tên cảng không được để trống' }, { max: 255 }]}>
              <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="province" {...labelProps('Tỉnh/TP')} style={{ marginBottom: spaceFormField }}>
              <Select showSearch placeholder="Chọn tỉnh/thành phố..."
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
              <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="portClass" {...labelProps('Phân cấp')} style={{ marginBottom: spaceFormField }}>
              <Select placeholder="Chọn phân cấp" allowClear
                options={[{ label: 'Loại I', value: 1 }, { label: 'Loại II', value: 2 }, { label: 'Loại III', value: 3 }]}
                style={selectStyle} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="waterAreaScope" {...labelProps('Phạm vi vùng nước')} style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={2} placeholder="Mô tả phạm vi vùng nước" maxLength={2000} style={{ borderRadius: radiusPill }} />
            </Form.Item>
          </Col>
        </Row>

        <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>2. Chỉ số tổng hợp</Typography.Text>
        <Row gutter={16}>
          <Col span={6}><Form.Item name="totalBerth" {...labelProps('Tổng số bến')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="totalAnchorageTransshipment" {...labelProps('Khu neo đậu/chuyển tải')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="totalPublicChannel" {...labelProps('Luồng công cộng')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="totalDedicatedChannel" {...labelProps('Luồng chuyên dùng')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}><Form.Item name="totalPublicChannelLength" {...labelProps('Dài luồng CC (m)')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="totalDedicatedChannelLength" {...labelProps('Dài luồng CD (m)')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="totalBeaconMarker" {...labelProps('Phao tiêu/báo hiệu')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="totalDikeRevetment" {...labelProps('Đê/kè')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}><Form.Item name="totalDikeRevetmentLength" {...labelProps('Dài đê/kè (m)')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="totalLighthouseBeacon" {...labelProps('Đèn biển/đăng/tiêu')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="buoyBerthCount" {...labelProps('Bến phao')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="anchorageCount" {...labelProps('Khu neo đậu')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}><Form.Item name="transshipmentCount" {...labelProps('Khu chuyển tải')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="otherWaterAreas" {...labelProps('Khu nước khác')} style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Mô tả" maxLength={2000} style={inputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="area" {...labelProps('Diện tích')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={6}><Form.Item name="maxVesselCapacity" {...labelProps('Sức chứa (DWT)')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
        </Row>

        <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>3. Thông tin GIS</Typography.Text>
        <Row gutter={16}>
          <Col span={8}><Form.Item name="loaiHinhHoc" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn loại" allowClear
              options={[{ value: 'POINT', label: 'Điểm' }, { value: 'LINE', label: 'Đường' }, { value: 'POLYGON', label: 'Vùng' }]}
              style={selectStyle} /></Form.Item></Col>
          <Col span={8}><Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="4326" style={numberInputStyle} /></Form.Item></Col>
          <Col span={8}><Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
        </Row>

        <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>4. Tọa độ GPS</Typography.Text>
        <div style={{ marginBottom: spaceFormField }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: textTertiary, fontSize: fontSizeSm }}>{coords.length === 0 ? 'Chưa có tọa độ' : `${coords.length} tọa độ`}</span>
            <Button size="small" onClick={() => setCoords([...coords, { latitude: 0, longitude: 0 }])}
              style={{ borderRadius: radiusPill, height: 32, fontSize: fontSizeSm }}>+ Thêm</Button>
          </div>
          {coords.map((c, idx) => (
            <Row key={idx} gutter={8} style={{ marginBottom: 4 }} align="middle">
              <Col flex="20px"><span style={{ color: textTertiary, fontSize: fontSizeSm }}>{idx + 1}.</span></Col>
              <Col flex="1 1 200px">
                <InputNumber value={c.latitude} onChange={(val) => {
                  const n = [...coords]; n[idx] = { ...n[idx], latitude: val ?? 0 }; setCoords(n);
                }} placeholder="Vĩ độ (-90~90)" min={-90} max={90} step={0.000001} style={numberInputStyle} size="small" />
              </Col>
              <Col flex="1 1 200px">
                <InputNumber value={c.longitude} onChange={(val) => {
                  const n = [...coords]; n[idx] = { ...n[idx], longitude: val ?? 0 }; setCoords(n);
                }} placeholder="Kinh độ (-180~180)" min={-180} max={180} step={0.000001} style={numberInputStyle} size="small" />
              </Col>
              <Col flex="60px">
                <Button danger size="small" onClick={() => setCoords(coords.filter((_, i) => i !== idx))}
                  style={{ borderRadius: radiusPill, height: 32, fontSize: fontSizeSm }}>Xóa</Button>
              </Col>
            </Row>
          ))}
        </div>

        <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>5. Công trình KCHT</Typography.Text>
        <div style={{ marginBottom: spaceFormField }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: textTertiary, fontSize: fontSizeSm }}>{infras.length === 0 ? 'Chưa có công trình' : `${infras.length} công trình`}</span>
            <Button size="small" onClick={() => setInfras([...infras, { sequenceNumber: infras.length + 1, infrastructureName: '', quantity: 1 }])}
              style={{ borderRadius: radiusPill, height: 32, fontSize: fontSizeSm }}>+ Thêm</Button>
          </div>
          {infras.map((inf, idx) => (
            <Row key={idx} gutter={8} style={{ marginBottom: 4 }} align="middle">
              <Col flex="20px"><span style={{ color: textTertiary, fontSize: fontSizeSm }}>{idx + 1}.</span></Col>
              <Col flex="1 1 250px">
                <Input value={inf.infrastructureName} onChange={(e) => {
                  const n = [...infras]; n[idx] = { ...n[idx], infrastructureName: e.target.value }; setInfras(n);
                }} placeholder="Tên công trình" style={inputStyle} size="small" />
              </Col>
              <Col flex="0 0 120px">
                <InputNumber value={inf.quantity} onChange={(val) => {
                  const n = [...infras]; n[idx] = { ...n[idx], quantity: val ?? 1 }; setInfras(n);
                }} placeholder="SL" min={1} style={numberInputStyle} size="small" />
              </Col>
              <Col flex="60px">
                <Button danger size="small" onClick={() => setInfras(infras.filter((_, i) => i !== idx))}
                  style={{ borderRadius: radiusPill, height: 32, fontSize: fontSizeSm }}>Xóa</Button>
              </Col>
            </Row>
          ))}
        </div>

        <Typography.Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16, color: textPrimary }}>6. Ghi chú</Typography.Text>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="notes" style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={2} placeholder="Ghi chú" maxLength={2000} style={{ borderRadius: radiusPill }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="remarks" style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={2} placeholder="Nhận xét / đánh giá" maxLength={2000} style={{ borderRadius: radiusPill }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
            {!isEdit && (
              <Button htmlType="button" onClick={() => handleSubmit('draft')}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>
                Lưu tạm
              </Button>
            )}
            <Button type="primary" htmlType="button" loading={submitting} onClick={() => handleSubmit(isEdit ? 'submit' : 'submit')}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>
              {isEdit ? 'Cập nhật' : 'Gửi phê duyệt'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
