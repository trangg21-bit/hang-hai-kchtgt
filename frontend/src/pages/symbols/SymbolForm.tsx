import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input, Select } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { symbolService } from '../../services/symbolService';
import type { CreateSymbolPayload, UpdateSymbolPayload } from '../../services/symbolService';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

const CATEGORY_OPTIONS = [
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
  { value: 'deprecated', label: 'Ngừng sử dụng' },
];

const COLORS = [
  { value: '#1677ff', label: 'Xanh dương' },
  { value: '#52c41a', label: 'Xanh lá' },
  { value: '#faad14', label: 'Vàng' },
  { value: '#f5222d', label: 'Đỏ' },
  { value: '#722ed1', label: 'Tím' },
  { value: '#13c2c2', label: 'Cyan' },
  { value: '#eb2f96', label: 'Hồng' },
  { value: '#fa8c16', label: 'Cam' },
];

export default function SymbolForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<UpdateSymbolPayload | null>(null);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await symbolService.getById(id!);
          setInitialData({
            name: data.name,
            description: data.description,
            category: data.category,
            icon: data.icon,
            color: data.color,
            value: data.value,
            status: data.status,
          });
          form.setFieldsValue({
            name: data.name,
            code: data.code,
            description: data.description,
            category: data.category,
            icon: data.icon,
            color: data.color,
            value: data.value,
            status: data.status,
          });
        } catch {
          toast.error('Không thể tải thông tin biểu tượng');
          navigate('/symbols');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateSymbolPayload = {
          name: values.name,
          description: values.description,
          category: values.category,
          icon: values.icon,
          color: values.color,
          value: values.value,
          status: values.status,
        };
        await symbolService.update(id!, payload);
        toast.success('Đã cập nhật biểu tượng');
      } else {
        const payload: CreateSymbolPayload = {
          code: values.code,
          name: values.name,
          description: values.description,
          category: values.category,
          icon: values.icon,
          color: values.color,
          value: values.value,
        };
        await symbolService.create(payload);
        toast.success('Đã tạo biểu tượng');
      }

      navigate('/symbols');
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
            {isEdit ? 'Chỉnh sửa biểu tượng' : 'Thêm biểu tượng mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'active', ...initialData }}>
          {!isEdit && (
            <FormField
              type="text"
              name="code"
              label="Mã ký hiệu"
              required
              placeholder="VD: SYM-HD"
              help="Mã định danh duy nhất cho biểu tượng"
            />
          )}

          {isEdit && (
            <FormField
              type="text"
              name="code"
              label="Mã ký hiệu"
              disabled
            />
          )}

          <FormField
            type="text"
            name="name"
            label="Tên biểu tượng"
            required
            placeholder="VD: Hướng đi"
          />

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về biểu tượng..."
          />

          <FormField
            type="select"
            name="category"
            label="Danh mục"
            required
            options={CATEGORY_OPTIONS}
          />

          <Row style={{ display: 'flex', gap: 16 }}>
            <Col style={{ flex: 1 }}>
              <FormField
                type="text"
                name="icon"
                label="Icon (tên)"
                placeholder="VD: ArrowRightOutlined"
              />
            </Col>
            <Col style={{ flex: 1 }}>
              <FormField
                type="select"
                name="color"
                label="Màu sắc"
                options={COLORS}
              />
            </Col>
          </Row>

          <FormField
            type="text"
            name="value"
            label="Giá trị"
            placeholder="Giá trị hiển thị (VD: HD)"
            help="Giá trị ngắn gọn dùng để hiển thị"
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
                {isEdit ? 'Cập nhật' : 'Tạo biểu tượng'}
              </Button>
              <Button onClick={() => navigate(-1)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
