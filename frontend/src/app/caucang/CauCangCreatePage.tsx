import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';
import { createCauCang, fetchBenCangOptions } from './api';


const TRANG_THAI_HOAT_DONG_OPTIONS = [
  { label: 'Hiện hành', value: 'HIEN_HANH' },
  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
];

export default function CauCangCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [benCangOptions, setBenCangOptions] = useState<{ value: string; label: string }[]>([]);

  // Load BenCang options on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchBenCangOptions();
        setBenCangOptions(res.content.map((o: { id: string; tenBen: string }) => ({ value: o.id, label: o.tenBen })));
      } catch (err) {
        console.error('Failed to load BenCang options:', err);
      }
    })();
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: Parameters<typeof createCauCang>[0] = {
        maCau: values.maCau,
        tenCau: values.tenCau,
        benCangId: values.benCangId,
        ...(values.chieuDai !== undefined && values.chieuDai !== '' && { chieuDai: values.chieuDai as number }),
        ...(values.taiTrong !== undefined && values.taiTrong !== '' && { taiTrong: values.taiTrong as number }),
        ...(values.loaiCau && { loaiCau: values.loaiCau }),
        trangThaiHoatDong: values.trangThaiHoatDong,
      };

      await createCauCang(payload);
      toast.success('Tạo mới cầu cảng thành công');
      navigate('/caucang');
    } catch (err: unknown) {
      // Validation errors are handled by antd Form
    } finally {
      setSubmitting(false);
    }
  }, [form, navigate]);

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/caucang')}>Quay lại</Button>
          <Typography.Title level={5} style={{ margin: 0 }}>Tạo mới cầu cảng</Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 800, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ trangThaiHoatDong: 'HIEN_HANH' }}>
          {/* Info Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin chung</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <FormField
                type="text"
                name="maCau"
                label="Mã cầu"
                required
                placeholder="VD: CC-HAIPHONG-001"
                help="Mã định danh duy nhất cho cầu cảng"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="tenCau"
                label="Tên cầu cảng"
                required
                placeholder="VD: Cầu cảng số 1"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="select"
                name="benCangId"
                label="Bến cảng chủ"
                required
                options={benCangOptions}
                placeholder="Chọn bến cảng chứa"
                help="ID của bến cảng chứa cầu này"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="loaiCau"
                label="Loại cầu"
                placeholder="VD: STRAIGHT"
                help="Văn bản tự do, không có enum cố định"
              />
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          {/* Statistics Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông số kỹ thuật</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <FormField
                type="number"
                name="chieuDai"
                label="Chiều dài (m)"
                min={0}
                step={0.01}
                placeholder="VD: 100.0"
                help="Chiều dài cầu cảng tính bằng mét"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="number"
                name="taiTrong"
                label="Tải trọng (tấn)"
                min={0}
                step={0.01}
                placeholder="VD: 500.0"
                help="Tải trọng tối đa tính bằng tấn"
              />
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          {/* Status Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Trạng thái</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <FormField
                type="select"
                name="trangThaiHoatDong"
                label="Trạng thái hoạt động"
                options={TRANG_THAI_HOAT_DONG_OPTIONS}
              />
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo cầu cảng
              </Button>
              <Button onClick={() => navigate('/caucang')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
