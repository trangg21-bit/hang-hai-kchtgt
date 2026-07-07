import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { benCangCRUD } from '../../services/cangbenService';
import type { CreateBenCangRequest } from '../../types/cangben';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';
import { z } from 'zod';
import { createSchema } from './schema';

const { Title } = Typography;

export default function BenCangCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      // Zod validation (matches BE validation)
      const parsed = createSchema.parse({
        maBen: values.maBen,
        tenBen: values.tenBen,
        cangBienId: values.cangBienId,
        tuyenDuongThuy: values.tuyenDuongThuy || undefined,
        viDo: values.viDo || undefined,
        kinhDo: values.kinhDo || undefined,
        chieuDai: values.chieuDai || undefined,
        chieuRong: values.chieuRong || undefined,
        loaiBen: values.loaiBen || undefined,
        doSauLuong: values.doSauLuong || undefined,
        trangThaiHoatDong: values.trangThaiHoatDong || 'HIỆN_HÀNH',
      });

      setSubmitting(true);

      const payload: CreateBenCangRequest = {
        maBen: parsed.maBen,
        tenBen: parsed.tenBen,
        cangBienId: parsed.cangBienId,
        tuyenDuongThuy: parsed.tuyenDuongThuy,
        viDo: parsed.viDo,
        kinhDo: parsed.kinhDo,
        chieuDai: parsed.chieuDai,
        chieuRong: parsed.chieuRong,
        loaiBen: parsed.loaiBen,
        doSauLuong: parsed.doSauLuong,
        trangThaiHoatDong: parsed.trangThaiHoatDong,
      };

      await benCangCRUD.create(payload);
      toast.success('Tạo mới bến cảng thành công');
      navigate('/bencang');
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      } else if ((err as any).status === 409) {
        form.setFields([{ name: 'maBen', errors: ['Mã bến đã tồn tại.'] }]);
        toast.error('Mã bến đã tồn tại');
      }
      // Other errors (422) handled globally by Axios interceptor
    } finally {
      setSubmitting(false);
    }
  }, [form, navigate]);

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bencang')}>Quay lại</Button>
          <Title level={5} style={{ margin: 0 }}>Tạo mới bến cảng</Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 800, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Info Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin chung</Typography.Text>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="text"
                name="maBen"
                label="Mã bến"
                required
                placeholder="VD: BC-HAIPHONG-001"
                help="Mã định danh duy nhất cho bến cảng (tối đa 50 ký tự)"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="tenBen"
                label="Tên bến"
                required
                placeholder="VD: Bến cảng Hải Phòng"
                help="Tên đầy đủ của bến cảng (tối đa 255 ký tự)"
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="text"
                name="cangBienId"
                label="Cảng biển chủ"
                required
                placeholder="Nhập ID cảng biển cha"
                help="ID của cảng biển chứa bến này"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="tuyenDuongThuy"
                label="Tuyến đường thủy"
                placeholder="VD: Tuyến sông Bạch Đằng"
                help="Tuyến đường thủy gần bến (tối đa 255 ký tự)"
              />
            </Col>
          </Row>

          {/* Geography Section */}
          <Divider />
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin địa lý</Typography.Text>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="number"
                name="viDo"
                label="Vĩ độ"
                min={-90}
                max={90}
                step={0.000001}
                placeholder="VD: 20.988"
                help="WGS84: -90 ~ 90 (không bắt buộc)"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="number"
                name="kinhDo"
                label="Kinh độ"
                min={-180}
                max={180}
                step={0.000001}
                placeholder="VD: -106.688"
                help="WGS84: -180 ~ 180 (không bắt buộc)"
              />
            </Col>
          </Row>

          {/* Statistics Section */}
          <Divider />
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông số kỹ thuật</Typography.Text>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="number"
                name="chieuDai"
                label="Chiều dài (m)"
                min={0}
                step={0.01}
                placeholder="VD: 200.0"
                help="Chiều dài bến tính bằng mét"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="number"
                name="chieuRong"
                label="Chiều rộng (m)"
                min={0}
                step={0.01}
                placeholder="VD: 30.0"
                help="Chiều rộng bến tính bằng mét"
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="text"
                name="loaiBen"
                label="Loại bến"
                placeholder="VD: Bến nước, Bến bờ..."
                help="Loại bến (không có enum cố định, nhập tự do, tối đa 100 ký tự)"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="number"
                name="doSauLuong"
                label="Độ sâu luồng (m)"
                min={0}
                step={0.01}
                placeholder="VD: 12.5"
                help="Độ sâu luồng tính bằng mét"
              />
            </Col>
          </Row>

          {/* Status Section */}
          <Divider />
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Trạng thái</Typography.Text>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="select"
                name="trangThaiHoatDong"
                label="Trạng thái hoạt động"
                options={[
                  { label: 'Hiện hành', value: 'HIỆN_HÀNH' },
                  { label: 'Tạm ngừng', value: 'TẠM_NGƯNG' },
                ]}
              />
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo bến cảng
              </Button>
              <Button onClick={() => navigate('/bencang')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
