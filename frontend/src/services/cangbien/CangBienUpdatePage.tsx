import { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, Row, Col, InputNumber, Select, Input, Form } from 'antd';
import toast from '../../components/ToastNotification';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCangBienById, updateCangBien } from './api';
import { TRANG_THAI_HOAT_DONG_OPTIONS } from './schema';
import type { CangBienResponse } from './types';

export default function CangBienUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<CangBienResponse | null>(null);

  const [viDo, kinhDo] = Form.useWatch(['viDo', 'kinhDo'], form);
  const gpsPairedWarning =
    ((viDo !== undefined && viDo !== null && !Number.isNaN(viDo)) !==
      (kinhDo !== undefined && kinhDo !== null && !Number.isNaN(kinhDo)));

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchCangBienById(id);
        setEntityData(data);
        form.setFieldsValue({
          id: data.id,
          maCang: data.maCang,
          tenCang: data.tenCang,
          tinhThanhPho: data.tinhThanhPho || undefined,
          viDo: data.viDo !== null ? data.viDo : undefined,
          kinhDo: data.kinhDo !== null ? data.kinhDo : undefined,
          dienTich: data.dienTich !== null ? data.dienTich : undefined,
          khaNangTiepNhan: data.khaNangTiepNhan !== null ? data.khaNangTiepNhan : undefined,
          trangThaiHoatDong: data.trangThaiHoatDong || undefined,
        });
      } catch (err) {
        console.error('Failed to fetch CangBien:', err);
        toast.error('Không thể tải thông tin cảng biển');
        navigate('/cangbien');
      }
    })();
  }, [id, navigate, form]);

  const handleFinish = async (values: Record<string, unknown>) => {
    // GPS paired check
    const vi = values.viDo as number;
    const jd = values.kinhDo as number;
    if ((vi !== undefined && vi !== null && !Number.isNaN(vi)) !==
        (jd !== undefined && jd !== null && !Number.isNaN(jd))) {
      toast.error('Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau');
      return;
    }
    // Validate ranges
    if (vi !== undefined && vi !== null && !Number.isNaN(vi) && (vi < -90 || vi > 90)) {
      toast.error('Vĩ độ phải từ -90 đến 90');
      return;
    }
    if (jd !== undefined && jd !== null && !Number.isNaN(jd) && (jd < -180 || jd > 180)) {
      toast.error('Kinh độ phải từ -180 đến 180');
      return;
    }
    const dienTich = values.dienTich as number;
    if (dienTich !== undefined && dienTich !== null && !Number.isNaN(dienTich) && dienTich <= 0) {
      toast.error('Diện tích phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: String(values.id),
        tenCang: (values.tenCang as string) || undefined,
        tinhThanhPho: (values.tinhThanhPho as string) || undefined,
        viDo: values.viDo as number | undefined,
        kinhDo: values.kinhDo as number | undefined,
        dienTich: values.dienTich as number | undefined,
        khaNangTiepNhan: values.khaNangTiepNhan as number | undefined,
        trangThaiHoatDong: (values.trangThaiHoatDong as string) || undefined,
      };
      await updateCangBien(payload);
      toast.success('Cập nhật thành công');
      navigate(`/cangbien/${String(values.id)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!entityData) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/cangbien/${id}`)}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Chỉnh sửa {entityData.maCang} — {entityData.tenCang}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          {/* Info Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Mã cảng" name="maCang">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cảng"
                name="tenCang"
                rules={[{ max: 255, message: 'Tên cảng tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item
                label="Tỉnh/thành phố"
                name="tinhThanhPho"
                rules={[{ max: 100, message: 'Tỉnh/thành phố tối đa 100 ký tự' }]}
              >
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
              <Form.Item
                label="Vĩ độ (Latitude)"
                name="viDo"
                rules={[
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || Number.isNaN(value)) return Promise.resolve();
                      if (value < -90 || value > 90) return Promise.reject('Vĩ độ phải từ -90 đến 90');
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber min={-90} max={90} step={0.000001} precision={6} placeholder="VD: 20.9" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Kinh độ (Longitude)"
                name="kinhDo"
                rules={[
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || Number.isNaN(value)) return Promise.resolve();
                      if (value < -180 || value > 180) return Promise.reject('Kinh độ phải từ -180 đến 180');
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber min={-180} max={180} step={0.000001} precision={6} placeholder="VD: -106.7" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          {gpsPairedWarning && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
              <Typography.Text type="warning">
                ⚠️ Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau.
              </Typography.Text>
            </Card>
          )}

          {/* Statistics Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thống kê
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Diện tích (m²)"
                name="dienTich"
                rules={[
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || Number.isNaN(value)) return Promise.resolve();
                      if (value <= 0) return Promise.reject('Diện tích phải lớn hơn 0');
                      return Promise.resolve();
                    },
                  },
                ]}
              >
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
              <Form.Item label="Trạng thái phê duyệt">
                <Input disabled value={entityData.trangThaiPheDuyet || '—'} aria-readonly="true" />
              </Form.Item>
            </Col>
          </Row>

          {/* Footer */}
          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Cập nhật
              </Button>
              <Button onClick={() => navigate(`/cangbien/${id}`)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
