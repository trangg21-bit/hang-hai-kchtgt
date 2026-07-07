import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { vungNuocApi } from './api';
import type { VungNuocUpdateValues } from './schema';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function VungNuocUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState<{ maVungNuoc: string } | null>(null);

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          const data = await vungNuocApi.findById(id);
          setOriginalData({ maVungNuoc: data.maVungNuoc });
          form.setFieldsValue({
            maVungNuoc: data.maVungNuoc,
            tenVungNuoc: data.tenVungNuoc,
            cangBienId: data.cangBienId,
            dienTich: data.dienTich,
            doSauMax: data.doSauMax,
            doSauTrungBinh: data.doSauTrungBinh,
            loaiVungNuoc: data.loaiVungNuoc,
            trangThaiHoatDong: data.trangThaiHoatDong,
          });
        } catch (err) {
          console.error('Failed to load VungNuoc data:', err);
          toast.error('Không thể tải thông tin vùng nước');
          navigate('/vungnuoc');
        }
      })();
    }
  }, [id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();

      setSubmitting(true);
      const payload: VungNuocUpdateValues = {
        id,
        tenVungNuoc: values.tenVungNuoc || undefined,
        cangBienId: values.cangBienId || undefined,
        dienTich: values.dienTich || null,
        doSauMax: values.doSauMax || null,
        doSauTrungBinh: values.doSauTrungBinh || null,
        loaiVungNuoc: values.loaiVungNuoc || null,
        trangThaiHoatDong: values.trangThaiHoatDong,
      };
      await vungNuocApi.update(payload);
      toast.success('Cập nhật vùng nước thành công');
      navigate(`/vungnuoc/${id}`);
    } catch (err) {
      console.error('Failed to update VungNuoc:', err);
    } finally {
      setSubmitting(false);
    }
  }, [id, form, navigate]);

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/vungnuoc/${id}`)}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Chỉnh sửa vùng nước
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Info Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin cơ bản
          </Typography.Text>

          {/* maVungNuoc — immutable */}
          <FormField
            type="text"
            name="maVungNuoc"
            label="Mã vùng nước"
            disabled
          />

          <FormField
            type="text"
            name="tenVungNuoc"
            label="Tên vùng nước"
            placeholder="VD: Vùng nước cảng Hải Phòng"
          />

          <FormField
            type="text"
            name="cangBienId"
            label="Cảng biển chủ"
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

          {/* Read-only approval status badge */}
          {originalData && (
            <Form.Item label="Trạng thái phê duyệt">
              <Typography.Text type="secondary" strong>
                (Xem tại trang chi tiết — không thể chỉnh sửa)
              </Typography.Text>
            </Form.Item>
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Cập nhật
              </Button>
              <Button onClick={() => navigate(`/vungnuoc/${id}`)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
