import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input, Select } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { organizationService } from '../../services/organizationService';
import type { CreateOrganizationPayload, UpdateOrganizationPayload } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function UnitForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<UpdateOrganizationPayload & { parentOrgId?: string } | null>(null);
  const [orgOptions, setOrgOptions] = useState<Organization[]>([]);

  // Load org tree for parent selector
  useEffect(() => {
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        setOrgOptions(orgs);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Load existing data for edit
  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await organizationService.getById(id!);
          setInitialData({
            name: data.name,
            parentOrgId: data.parentOrgId,
            description: data.description,
            address: data.address,
            contactPerson: data.contactPerson,
            contactPhone: data.contactPhone,
            status: data.status,
          });
          form.setFieldsValue({
            name: data.name,
            parentOrgId: data.parentOrgId,
            description: data.description,
            address: data.address,
            contactPerson: data.contactPerson,
            contactPhone: data.contactPhone,
            status: data.status,
          });
        } catch {
          toast.error('Không thể tải thông tin đơn vị');
          navigate('/organizations');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const parentOptions = orgOptions
    .filter((o) => o.id !== id)
    .map((o) => ({ value: o.id, label: `${o.name} (C${o.level})` }));

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateOrganizationPayload = {
          name: values.name,
          parentOrgId: values.parentOrgId,
          description: values.description,
          address: values.address,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          status: values.status,
        };
        await organizationService.update(id!, payload);
        toast.success('Đã cập nhật đơn vị thành công');
      } else {
        const payload: CreateOrganizationPayload = {
          name: values.name,
          parentOrgId: values.parentOrgId,
          description: values.description,
          address: values.address,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
        };
        await organizationService.create(payload);
        toast.success('Đã tạo đơn vị thành công');
      }

      navigate('/organizations');
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
            {isEdit ? 'Chỉnh sửa đơn vị' : 'Thêm đơn vị mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'active', ...initialData }}>
          <FormField
            type="text"
            name="name"
            label="Tên đơn vị"
            required
            placeholder="VD: Phòng CNTT"
          />

          <FormField
            type="select"
            name="parentOrgId"
            label="Đơn vị cha"
            options={[{ value: '', label: '(Không có) — đơn vị cấp cao nhất' }, ...parentOptions]}
            help="Để trống nếu đây là đơn vị cấp cao nhất"
          />

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả ngắn về đơn vị..."
          />

          <FormField
            type="text"
            name="address"
            label="Địa chỉ"
            placeholder="Địa chỉ trụ sở..."
          />

          <Row style={{ display: 'flex', gap: 16 }}>
            <Col style={{ flex: 1 }}>
              <FormField
                type="text"
                name="contactPerson"
                label="Người liên hệ"
                placeholder="Họ và tên"
              />
            </Col>
            <Col style={{ flex: 1 }}>
              <FormField
                type="phone"
                name="contactPhone"
                label="Số điện thoại"
                placeholder="0901234567"
              />
            </Col>
          </Row>

          <FormField
            type="select"
            name="status"
            label="Trạng thái"
            required
            options={[
              { value: 'active', label: 'Hoạt động' },
              { value: 'locked', label: 'Đã khóa' },
              { value: 'inactive', label: 'Không hoạt động' },
            ]}
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo đơn vị'}
              </Button>
              <Button onClick={() => navigate(-1)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
