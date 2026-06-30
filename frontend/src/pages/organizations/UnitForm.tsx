import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input, Select, Row, Col, InputNumber } from 'antd';
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
  const selectedType = Form.useWatch('type', form);
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
            code: data.code || 'ORG_' + id,
            parentId: data.parentId,
            type: data.type,
            description: data.description,
            address: data.address,
            contactPerson: data.contactPerson,
            contactPhone: data.contactPhone,
            coefficient: data.coefficient,
            status: data.status,
          });
          form.setFieldsValue({
            name: data.name,
            code: data.code || 'ORG_' + id,
            parentId: data.parentId,
            type: data.type,
            description: data.description,
            address: data.address,
            contactPerson: data.contactPerson,
            contactPhone: data.contactPhone,
            coefficient: data.coefficient,
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

      const targetParentId = values.type === 'TCT' ? undefined : values.parentId;

      if (isEdit) {
        const payload: UpdateOrganizationPayload = {
          name: values.name,
          parentId: targetParentId,
          type: values.type,
          description: values.description,
          address: values.address,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          coefficient: values.coefficient,
          status: values.status,
        };
        await organizationService.update(id!, payload);
        toast.success('Đã cập nhật đơn vị thành công');
      } else {
        const payload: CreateOrganizationPayload = {
          name: values.name,
          parentId: targetParentId,
          type: values.type,
          description: values.description,
          address: values.address,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          coefficient: values.coefficient,
        };
        await organizationService.create(payload);
        toast.success('Đã tạo đơn vị thành công');
      }

      navigate('/organizations');
    } catch (err) {
      console.error("Submit error:", err);
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

      <Card style={{ maxWidth: 700, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} onFinishFailed={(info) => console.error("Form validation failed:", info)} initialValues={{ status: 'draft', ...initialData }}>
          <FormField
            type="text"
            name="name"
            label="Tên đơn vị"
            required
            placeholder="VD: Phòng CNTT"
          />

          <FormField
            type="text"
            name="code"
            label="Mã đơn vị"
            required
            placeholder="VD: PHONG_CNTT"
          />

          {selectedType !== 'TCT' && (
            <FormField
              type="select"
              name="parentId"
              label="Đơn vị cha"
              options={[{ value: '', label: '(Không có) — đơn vị cấp cao nhất' }, ...parentOptions]}
              help="Để trống nếu đây là đơn vị cấp cao nhất"
            />
          )}

          <FormField
            type="select"
            name="type"
            label="Loại đơn vị"
            required
            options={[
              { value: 'TCT', label: 'Tổng cục' },
              { value: 'CUC', label: 'Cục' },
              { value: 'CHI_CUC', label: 'Chi cục' },
              { value: 'CANG_VU', label: 'Cảng vụ' },
            ]}
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

          <Form.Item
            name="coefficient"
            label="Hệ số"
            required
            rules={[
              { required: true, message: 'Vui lòng nhập hệ số' },
              {
                validator: (_, value) => {
                  if (value === undefined || value === null) return Promise.resolve();
                  if (value <= 0) {
                    return Promise.reject(new Error('Hệ số phải lớn hơn 0'));
                  }
                  const parts = String(value).split('.');
                  if (parts[1] && parts[1].length > 2) {
                    return Promise.reject(new Error('Hệ số tối đa 2 chữ số thập phân'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0.01} step={0.1} placeholder="VD: 1.00" />
          </Form.Item>

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
              { value: 'draft', label: 'Bản nháp' },
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'approved', label: 'Đã phê duyệt' },
              { value: 'rejected', label: 'Bị từ chối' },
            ]}
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Lưu
              </Button>
              <Button onClick={() => navigate(-1)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
