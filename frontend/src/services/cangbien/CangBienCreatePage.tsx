import { useState } from 'react';
import { Card, Button, Space, Typography, Row, Col, InputNumber, Select, Input, Form } from 'antd';
import toast from '../../components/ToastNotification';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createCangBien } from './api';
import { TRANG_THAI_HOAT_DONG_OPTIONS } from './schema';
import type { CreateCangBienRequest } from './types';

export default function CangBienCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [viDo, kinhDo] = Form.useWatch(['viDo', 'kinhDo'], form);
  const gpsPairedWarning =
    ((viDo !== undefined && viDo !== null && !Number.isNaN(viDo)) !==
      (kinhDo !== undefined && kinhDo !== null && !Number.isNaN(kinhDo)));

  const handleFinish = async (values: Record<string, unknown>) => {
    // Manual field validation
    const maCang = String(values.maCang).trim();
    const tenCang = String(values.tenCang).trim();
    if (!maCang) { toast.error('Mã cảng không được để trống'); return; }
    if (maCang.length > 50) { toast.error('Mã cảng tối đa 50 ký tự'); return; }
    if (!tenCang) { toast.error('Tên cảng không được để trống'); return; }
    if (tenCang.length > 255) { toast.error('Tên cảng tối đa 255 ký tự'); return; }
    const vi = values.viDo as number;
    const jd = values.kinhDo as number;
    const viPresent = vi !== undefined && vi !== null && !Number.isNaN(vi);
    const jdPresent = jd !== undefined && jd !== null && !Number.isNaN(jd);
    if (viPresent !== jdPresent) {
      toast.error('Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau');
      return;
    }
    if (viPresent && vi < -90) { toast.error('Vĩ độ phải từ -90 đến 90'); return; }
    if (viPresent && vi > 90) { toast.error('Vĩ độ phải từ -90 đến 90'); return; }
    if (jdPresent && jd < -180) { toast.error('Kinh độ phải từ -180 đến 180'); return; }
    if (jdPresent && jd > 180) { toast.error('Kinh độ phải từ -180 đến 180'); return; }
    const dienTich = values.dienTich as number;
    if (dienTich === undefined || dienTich === null || dienTich <= 0) {
      toast.error('Diện tích phải lớn hơn 0'); return;
    }

    setSubmitting(true);
    try {
      const payload: CreateCangBienRequest = {
        maCang,
        tenCang,
        tinhThanhPho: (values.tinhThanhPho as string) || undefined,
        viDo: viPresent ? vi : undefined,
        kinhDo: jdPresent ? jd : undefined,
        dienTich,
        khaNangTiepNhan: values.khaNangTiepNhan as number | undefined,
        trangThaiHoatDong: (values.trangThaiHoatDong as string) || undefined,
        trangThaiPheDuyet: (values.trangThaiPheDuyet as string) || 'CHỜ_PHE_DUYỆT',
      };
      await createCangBien(payload);
      toast.success('Tạo mới thành công — chờ phê duyệt');
      navigate('/cangbien');
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('mã cảng') || msg.includes('Ma cang') || msg.includes('Duplicate')) {
          toast.error('Mã cảng đã tồn tại. Vui lòng nhập mã khác.');
        } else {
          toast.error(msg);
        }
      } else {
        toast.error('Có lỗi xảy ra khi tạo mới');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cangbien')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>Tạo mới Cảng biển</Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ trangThaiPheDuyet: 'CHỜ_PHE_DUYỆT' }}>
          {/* Info Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Mã cảng *"
                name="maCang"
                rules={[{ required: true, message: 'Mã cảng không được để trống' }, { max: 50, message: 'Mã cảng tối đa 50 ký tự' }]}
              >
                <Input placeholder="VD: CB-HAIPHONG-001" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cảng *"
                name="tenCang"
                rules={[{ required: true, message: 'Tên cảng không được để trống' }, { max: 255, message: 'Tên cảng tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item label="Tỉnh/thành phố" name="tinhThanhPho" rules={[{ max: 100, message: 'Tỉnh/thành phố tối đa 100 ký tự' }]}>
                <Input placeholder="VD: Hải Phòng" maxLength={100} />
              </Form.Item>
            </Col>
          </Row>

          {/* Geography Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông tin địa lý
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Vĩ độ (Latitude)" name="viDo" rules={[{ validator: (_, v) => { if (v === undefined || v === null || Number.isNaN(v)) return Promise.resolve(); if (v < -90 || v > 90) return Promise.reject('Vĩ độ phải từ -90 đến 90'); return Promise.resolve(); } }]}>
                <InputNumber min={-90} max={90} step={0.000001} precision={6} placeholder="VD: 20.9" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kinh độ (Longitude)" name="kinhDo" rules={[{ validator: (_, v) => { if (v === undefined || v === null || Number.isNaN(v)) return Promise.resolve(); if (v < -180 || v > 180) return Promise.reject('Kinh độ phải từ -180 đến 180'); return Promise.resolve(); } }]}>
                <InputNumber min={-180} max={180} step={0.000001} precision={6} placeholder="VD: -106.7" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          {gpsPairedWarning && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
              <Typography.Text type="warning">⚠️ Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau.</Typography.Text>
            </Card>
          )}

          {/* Statistics Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thống kê
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Diện tích (m²) *" name="dienTich" rules={[{ required: true, message: 'Diện tích phải lớn hơn 0' }, { validator: (_, v) => { if (v === undefined || v === null || Number.isNaN(v)) return Promise.reject('Diện tích phải lớn hơn 0'); if (v <= 0) return Promise.reject('Diện tích phải lớn hơn 0'); return Promise.resolve(); } }]}>
                <InputNumber min={0.01} step={0.01} precision={2} placeholder="VD: 100.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Khả năng tiếp nhận" name="khaNangTiepNhan">
                <InputNumber step={0.01} precision={2} placeholder="VD: 500000" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {/* Status Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={TRANG_THAI_HOAT_DONG_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt" name="trangThaiPheDuyet" rules={[{ required: true, message: 'Vui lòng chọn trạng thái phê duyệt' }]}>
                <Select options={[{ label: 'Chờ phê duyệt', value: 'CHỜ_PHE_DUYỆT' }, { label: 'Được phê duyệt', value: 'ĐƯỢC_PHE_DUYỆT' }, { label: 'Từ chối', value: 'TỪ_CHỐI' }]} />
              </Form.Item>
            </Col>
          </Row>

          {/* Footer */}
          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>Tạo cảng biển</Button>
              <Button onClick={() => navigate('/cangbien')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
