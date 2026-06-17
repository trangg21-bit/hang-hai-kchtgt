import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input, InputNumber, Select, Switch } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { groupService } from '../../services/groupService';
import type { CreateGroupPayload, UpdateGroupPayload } from '../../services/groupService';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

const CATEGORIES = [
  { value: 'navigation', label: 'Điều hướng' },
  { value: 'road', label: 'Đường' },
  { value: 'position', label: 'Vị trí' },
  { value: 'division', label: 'Phân chia' },
  { value: 'building', label: 'Công trình' },
  { value: 'transport', label: 'Giao thông' },
  { value: 'location', label: 'Địa điểm' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
];

export default function GroupForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<UpdateGroupPayload | null>(null);

  // Load existing data for edit
  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await groupService.getById(id!);
          setInitialData({
            name: data.name,
            description: data.description,
            status: data.status,
          });
          form.setFieldsValue({
            name: data.name,
            description: data.description,
            status: data.status,
          });
        } catch {
          toast.error('Không thể tải thông tin nhóm');
          navigate('/groups');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateGroupPayload = {
          name: values.name,
          description: values.description,
          status: values.status,
        };
        await groupService.update(id!, payload);
        toast.success('Đã cập nhật nhóm thành công');
      } else {
        const payload: CreateGroupPayload = {
          name: values.name,
          description: values.description,
        };
        await groupService.create(payload);
        toast.success('Đã tạo nhóm thành công');
      }

      navigate('/groups');
    } catch {
      // validation error — antd shows errors inline
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  return (
    <>
      {/* Breadcrumb / Back */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa nhóm' : 'Thêm nhóm mới'}
          </Typography.Title>
        </Space>
      </Card>

      {/* Form */}
      <Card style={{ maxWidth: 700 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'active',
            ...initialData,
          }}
        >
          <FormField
            type="text"
            name="name"
            label="Tên nhóm"
            required
            placeholder="VD: Nhóm Quản trị viên"
          />

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả ngắn về nhóm..."
            help="Miêu tả mục đích sử dụng của nhóm"
          />

          <FormField
            type="select"
            name="status"
            label="Trạng thái"
            required
            options={STATUS_OPTIONS}
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo nhóm'}
              </Button>
              <Button onClick={() => navigate(-1)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
