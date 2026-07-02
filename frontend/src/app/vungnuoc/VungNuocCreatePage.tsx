import { useState, useCallback } from 'react';
import { Card, Form, Button, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { vungNuocApi } from './api';
import type { VungNuocCreateValues } from './schema';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function VungNuocCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      setSubmitting(true);
      const payload: VungNuocCreateValues = {
        maVungNuoc: values.maVungNuoc,
        tenVungNuoc: values.tenVungNuoc,
        cangBienId: values.cangBienId,
        dienTich: values.dienTich || null,
        doSauMax: values.doSauMax || null,
        doSauTrungBinh: values.doSauTrungBinh || null,
        loaiVungNuoc: values.loaiVungNuoc || null,
        trangThaiHoatDong: values.trangThaiHoatDong,
      };
      await vungNuocApi.create(payload);
      toast.success('Tạo mới vùng nước thành công');
      navigate('/vungnuoc');
    } catch (err) {
      console.error('Failed to create VungNuoc:', err);
    } finally {
      setSubmitting(false);
    }
  }, [form, navigate]);

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/vungnuoc')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Thêm vùng nước mới
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Info Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin cơ bản
          </Typography.Text>

          <FormField
            type="text"
            name="maVungNuoc"
            label="Mã vùng nước"
            required
            placeholder="VD: VN-HAIPHONG-001"
            help="Mã định danh duy nhất cho vùng nước"
          />

          <FormField
            type="text"
            name="tenVungNuoc"
            label="Tên vùng nước"
            required
            placeholder="VD: Vùng nước cảng Hải Phòng"
          />

          <FormField
            type="text"
            name="cangBienId"
            label="Cảng biển chủ"
            required
            placeholder="Nhập UUID cảng biển"
            help="ID của cảng biển chứa vùng nước này"
          />

          <FormField
            type="text"
            name="loaiVungNuoc"
            label="Loại vùng nước"
            placeholder="Nhập loại vùng nước"
          />

          {/* Statistics Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông tin kỹ thuật
          </Typography.Text>

          <FormField
            type="number"
            name="dienTich"
            label="Diện tích (m²)"
            min={0}
            step={0.01}
            placeholder="VD: 100000.00"
            addonAfter="m²"
          />

          <FormField
            type="number"
            name="doSauMax"
            label="Độ sâu tối đa (m)"
            min={0}
            step={0.01}
            placeholder="VD: 15.00"
            addonAfter="m"
          />

          <FormField
            type="number"
            name="doSauTrungBinh"
            label="Độ sâu trung bình (m)"
            min={0}
            step={0.01}
            placeholder="VD: 10.00"
            addonAfter="m"
          />

          {/* Status Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>

          <FormField
            type="select"
            name="trangThaiHoatDong"
            label="Trạng thái hoạt động"
            options={[
              { label: 'Hiện hành', value: 'HIEN_HANH' },
              { label: 'Tạm ngưng', value: 'TAM_NGUNG' },
            ]}
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo vùng nước
              </Button>
              <Button onClick={() => navigate('/vungnuoc')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
