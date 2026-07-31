// ── BerthForm Modal Component ──────────────────────────────────────────
// Modal-based Create/Edit form for Berth (Bến cảng).

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Modal, Form, Input, InputNumber, Select, DatePicker, Card, Row, Col, Button, Space,
} from 'antd';
import { berthCRUD, portCRUD } from '../../services/portService';
import { organizationService } from '../../services/organizationService';
import toast from '../../components/ToastNotification';
import {
  spaceFormField, spaceMd, spaceLg,
  radiusPill, textSecondary, borderDefault,
} from '../../tokens';
import dayjs from 'dayjs';

const LOAI_BEN_OPTIONS = [
  { label: 'Bến Container', value: 'BEN_CONTAINER' },
  { label: 'Bến tổng hợp', value: 'BEN_TONG_HOP' },
  { label: 'Bến chuyên dụng', value: 'BEN_CHUYEN_DUNG' },
  { label: 'Bến hành khách', value: 'BEN_HANH_KHACH' },
  { label: 'Bến phao', value: 'BEN_PHAO' },
  { label: 'Bến thủy nội địa', value: 'BEN_THUY_NOI_DIA' },
];

export interface BerthFormModalProps {
  open: boolean;
  record?: { id: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BerthFormModal({ open, record, onClose, onSuccess }: BerthFormModalProps) {
  const isEdit = !!record?.id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const actionRef = useRef<'draft' | 'submit'>('draft');
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [orgUnits, setOrgUnits] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [portRes, orgResp] = await Promise.all([
          portCRUD.search({ page: 1, pageSize: 1000 }),
          organizationService.list(),
        ]);
        setPortOptions((portRes.data || []).map((p: any) => ({ value: p.id, label: p.portName || '' })));
        setOrgUnits(orgResp.data || []);
      } catch { /* ignore */ }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();

    if (isEdit && record?.id) {
      (async () => {
        try {
          const data = await berthCRUD.findById(record.id);
          form.setFieldsValue({
            berthCode: data.berthCode,
            berthName: data.berthName,
            portId: data.portId,
            waterway: data.waterway || data.tuyenDuongThuy,
            length: data.length,
            width: data.width,
            berthType: data.berthType,
            channelDepth: data.channelDepth || data.doSauLuong,
            latitude: data.latitude,
            longitude: data.longitude,
            orgUnitId: data.orgUnitId,
            operator: data.operator || data.donViKhaiThac,
            location: data.location,
            detailedLocation: data.detailedLocation || data.diaDiemChiTiet,
            totalArea: data.totalArea || data.tongDienTich,
            designThroughput: data.designThroughput || data.nangLucThongQuaThietKe,
            currentThroughput: data.currentThroughput || data.nangLucThongQuaHienTrang,
            maxVesselSize: data.maxVesselSize || data.coTauTiepNhanLonNhat,
            plannedThroughput: data.plannedThroughput || data.quyHoachNangLucThongQua,
            latestCargoVolume: data.latestCargoVolume || data.sanLuongHangHoaNamGanNhat,
            openingAnnouncementDate: data.openingAnnouncementDate
              ? dayjs(data.openingAnnouncementDate)
              : data.thoiDiemCongBoMo
                ? dayjs(data.thoiDiemCongBoMo)
                : undefined,
            openingDecision: data.openingDecision || data.quyetDinhCongBo,
            investmentAgreement: data.investmentAgreement || data.vanBanThoaThuanDauTu,
            structureType: data.structureType,
          });
        } catch {
          toast.error('Không thể tải thông tin bến cảng');
        }
      })();
    } else {
      (async () => {
        try {
          const code = await berthCRUD.generateCode();
          form.setFieldsValue({ berthCode: code });
        } catch { /* user can type manually */ }
      })();
    }
  }, [open, isEdit, record, form]);

  const handleFinish = useCallback(async (values: any) => {
    setSubmitting(true);
    try {
      const payload: Record<string, any> = isEdit
        ? {
            id: record!.id,
            berthName: values.berthName || undefined,
            portId: values.portId || undefined,
            waterway: values.waterway || undefined,
            length: values.length ?? undefined,
            width: values.width ?? undefined,
            berthType: values.berthType || undefined,
            channelDepth: values.channelDepth ?? undefined,
            latitude: values.latitude ?? undefined,
            longitude: values.longitude ?? undefined,
            orgUnitId: values.orgUnitId || undefined,
            operator: values.operator || undefined,
            location: values.location || undefined,
            detailedLocation: values.detailedLocation || undefined,
            totalArea: values.totalArea ?? undefined,
            designThroughput: values.designThroughput ?? undefined,
            currentThroughput: values.currentThroughput ?? undefined,
            maxVesselSize: values.maxVesselSize ?? undefined,
            plannedThroughput: values.plannedThroughput ?? undefined,
            latestCargoVolume: values.latestCargoVolume ?? undefined,
            openingAnnouncementDate: values.openingAnnouncementDate
              ? dayjs(values.openingAnnouncementDate).toISOString()
              : undefined,
            openingDecision: values.openingDecision || undefined,
            investmentAgreement: values.investmentAgreement || undefined,
            structureType: values.structureType ?? undefined,
          }
        : {
            action: actionRef.current,
            berthCode: values.berthCode,
            berthName: values.berthName,
            portId: values.portId,
            waterway: values.waterway || undefined,
            length: values.length ?? undefined,
            width: values.width ?? undefined,
            berthType: values.berthType || undefined,
            channelDepth: values.channelDepth ?? undefined,
            latitude: values.latitude ?? undefined,
            longitude: values.longitude ?? undefined,
            orgUnitId: values.orgUnitId || undefined,
            operator: values.operator || undefined,
            location: values.location || undefined,
            detailedLocation: values.detailedLocation || undefined,
            totalArea: values.totalArea ?? undefined,
            designThroughput: values.designThroughput ?? undefined,
            currentThroughput: values.currentThroughput ?? undefined,
            maxVesselSize: values.maxVesselSize ?? undefined,
            plannedThroughput: values.plannedThroughput ?? undefined,
            latestCargoVolume: values.latestCargoVolume ?? undefined,
            openingAnnouncementDate: values.openingAnnouncementDate
              ? dayjs(values.openingAnnouncementDate).toISOString()
              : undefined,
            openingDecision: values.openingDecision || undefined,
            investmentAgreement: values.investmentAgreement || undefined,
            structureType: values.structureType ?? undefined,
          };

      if (isEdit) {
        await berthCRUD.update(payload as any);
        toast.success('Cập nhật bến cảng thành công');
      } else {
        await berthCRUD.create(payload as any);
        toast.success('Tạo mới bến cảng thành công');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, record, onSuccess, onClose]);

  return (
    <Modal
      title={isEdit ? 'Chỉnh sửa bến cảng' : 'Tạo mới bến cảng'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 8 }}>
        {/* 1. Thông tin chung */}
        <Card title="1. Thông tin chung" size="small" style={{ marginBottom: spaceMd }}>
          <Row gutter={spaceLg}>
            <Col span={12}>
              <Form.Item label="Mã bến" name="berthCode" style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Mã bến không được để trống' }]}>
                <Input disabled={isEdit} placeholder="Tự động sinh" style={{ borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tên bến" name="berthName" style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Tên bến không được để trống' }]}>
                <Input placeholder="VD: Bến cảng Hải Phòng" style={{ borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={spaceLg}>
            <Col span={12}>
              <Form.Item label="Cảng mẹ" name="portId" style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Vui lòng chọn cảng mẹ' }]}>
                <Select showSearch placeholder="Chọn cảng biển chủ" options={portOptions}
                  style={{ borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tuyến đường thủy" name="waterway" style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: Tuyến sông Bạch Đằng" style={{ borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={spaceLg}>
            <Col span={12}>
              <Form.Item label="Loại bến" name="berthType" style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn loại bến" options={LOAI_BEN_OPTIONS}
                  style={{ borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Loại kết cấu" name="structureType" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={1} precision={0} placeholder="VD: 1"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 2. Kỹ thuật */}
        <Card title="2. Kỹ thuật" size="small" style={{ marginBottom: spaceMd }}>
          <Row gutter={spaceLg}>
            <Col span={8}>
              <Form.Item label="Chiều dài (m)" name="length" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 200"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Chiều rộng (m)" name="width" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 30"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Độ sâu luồng (m)" name="channelDepth" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 12.5"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 3. Tọa độ */}
        <Card title="3. Tọa độ" size="small" style={{ marginBottom: spaceMd }}>
          <Row gutter={spaceLg}>
            <Col span={12}>
              <Form.Item label="Vĩ độ" name="latitude" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={-90} max={90} step={0.000001} placeholder="VD: 20.866070"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kinh độ" name="longitude" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={-180} max={180} step={0.000001} placeholder="VD: 106.688810"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 4. Đơn vị khai thác */}
        <Card title="4. Đơn vị khai thác" size="small" style={{ marginBottom: spaceMd }}>
          <Row gutter={spaceLg}>
            <Col span={12}>
              <Form.Item label="Đơn vị khai thác" name="operator" style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: Công ty CP Cảng Hải Phòng"
                  style={{ borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Đơn vị quản lý" name="orgUnitId" style={{ marginBottom: spaceFormField }}>
                <Select allowClear showSearch placeholder="Chọn đơn vị quản lý"
                  optionFilterProp="label"
                  options={orgUnits.map(o => ({ label: o.name, value: o.id }))}
                  style={{ borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 5. Năng lực */}
        <Card title="5. Năng lực" size="small" style={{ marginBottom: spaceMd }}>
          <Row gutter={spaceLg}>
            <Col span={8}>
              <Form.Item label="Tổng diện tích (ha)" name="totalArea" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={0.0001} precision={4}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="NL thông qua (TK)" name="designThroughput" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={0.0001} precision={4}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="NL thông qua (HT)" name="currentThroughput" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={0.0001} precision={4}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={spaceLg}>
            <Col span={8}>
              <Form.Item label="Cỡ tàu lớn nhất (DWT)" name="maxVesselSize" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={0.0001} precision={4}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Quy hoạch NL" name="plannedThroughput" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={0.0001} precision={4}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="SL hàng hóa (gần nhất)" name="latestCargoVolume" style={{ marginBottom: spaceFormField }}>
                <InputNumber min={0} step={0.0001} precision={4}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 6. Công bố mở */}
        <Card title="6. Công bố mở" size="small" style={{ marginBottom: spaceMd }}>
          <Row gutter={spaceLg}>
            <Col span={12}>
              <Form.Item label="Ngày công bố" name="openingAnnouncementDate" style={{ marginBottom: spaceFormField }}>
                <DatePicker showTime style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Quyết định công bố" name="openingDecision" style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: 1234/QĐ-BGTVT" style={{ borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={spaceLg}>
            <Col span={24}>
              <Form.Item label="Văn bản thỏa thuận đầu tư" name="investmentAgreement" style={{ marginBottom: spaceFormField }}>
                <Input.TextArea rows={3} maxLength={2000} placeholder="VD: Thỏa thuận đầu tư số..."
                  style={{ borderRadius: 4 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Form.Item style={{ marginTop: spaceLg, marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose} style={{ borderRadius: radiusPill, height: 40 }}>Hủy</Button>
            {!isEdit && (
              <Button
                onClick={() => { actionRef.current = 'draft'; form.submit(); }}
                loading={submitting}
                style={{ borderRadius: radiusPill, height: 40, borderColor: borderDefault, color: textSecondary }}
              >
                Lưu tạm
              </Button>
            )}
            {!isEdit && (
              <Button
                type="primary"
                onClick={() => { actionRef.current = 'submit'; form.submit(); }}
                loading={submitting}
                style={{ borderRadius: radiusPill, height: 40 }}
              >
                Gửi phê duyệt
              </Button>
            )}
            {isEdit && (
              <Button type="primary" htmlType="submit" loading={submitting}
                style={{ borderRadius: radiusPill, height: 40 }}>
                Cập nhật
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
