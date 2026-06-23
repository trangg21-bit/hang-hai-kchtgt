import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input, Select } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { connectionService } from '../../services/connectionService';
import type { CreateConnectionPayload, UpdateConnectionPayload } from '../../services/connectionService';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

const TYPE_OPTIONS = [
  { value: 'rest', label: 'REST API' },
  { value: 'soap', label: 'SOAP API' },
  { value: 'grpc', label: 'gRPC' },
  { value: 'file', label: 'FTP/SFTP' },
  { value: 'mq', label: 'Message Queue' },
];

export default function ConnectionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<UpdateConnectionPayload & { type?: string } | null>(null);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await connectionService.getById(id!);
          setInitialData({
            name: data.name,
            url: data.url,
            type: data.type,
            description: data.description,
          });
          form.setFieldsValue({
            name: data.name,
            type: data.type,
            url: data.url,
            description: data.description,
          });
        } catch {
          toast.error('Không thể tải thông tin kết nối');
          navigate('/connections');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateConnectionPayload = {
          name: values.name,
          url: values.url,
          description: values.description,
        };
        await connectionService.update(id!, payload);
        toast.success('Đã cập nhật kết nối');
      } else {
        const payload: CreateConnectionPayload = {
          name: values.name,
          type: values.type,
          url: values.url,
          description: values.description,
          config: {},
        };
        await connectionService.create(payload);
        toast.success('Đã tạo kết nối');
      }

      navigate('/connections');
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa kết nối' : 'Thêm kết nối mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={initialData}>
          <FormField
            type="text"
            name="name"
            label="Tên kết nối"
            required
            placeholder="VD: API Dữ liệu Hàng hải"
          />

          <FormField
            type="select"
            name="type"
            label="Loại kết nối"
            required
            options={TYPE_OPTIONS}
          />

          <FormField
            type="url"
            name="url"
            label="URL"
            required
            placeholder="https://api.example.com/v1"
            help="Địa chỉ endpoint của dịch vụ"
          />

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về kết nối này..."
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo kết nối'}
              </Button>
              <Button onClick={() => navigate(-1)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
