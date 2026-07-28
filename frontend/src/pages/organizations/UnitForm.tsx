import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input, Select, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { organizationService } from '../../services/organizationService';
import type { CreateOrganizationPayload, UpdateOrganizationPayload } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';
import { spaceMd, spaceLg, radiusPill, fontSizeMd, fontWeightBold, borderDefault, textSecondary } from '../../tokens';
import { colors } from '../../theme';

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

      const targetParentId = (values.type && values.type !== 'DEPARTMENT') ? values.parentId : undefined;

      if (isEdit) {
        const payload: UpdateOrganizationPayload = {
          name: values.name,
          parentId: targetParentId,
          type: values.type,
          description: values.description,
          address: values.address,
          detailAddress: values.detailAddress,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
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
          detailAddress: values.detailAddress,
          phone: values.phone,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
        };
        await organizationService.create(payload);
        toast.success('Đã tạo đơn vị thành công');
      }

      navigate('/organizations');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  return (
    <>
      <Card style={{ marginBottom: spaceMd }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0, color: colors.sidebarBg, fontWeight: fontWeightBold }}>
            {isEdit ? 'Chỉnh sửa đơn vị' : 'Thêm mới đơn vị'}
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

          {selectedType !== 'GENERAL_DEPARTMENT' && (
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
              { value: 'GENERAL_DEPARTMENT', label: 'Tổng cục' },
              { value: 'DEPARTMENT', label: 'Cục' },
              { value: 'SUB_DEPARTMENT', label: 'Chi cục' },
              { value: 'PORT_AUTHORITY', label: 'Cảng vụ' },
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

          

          <Row style={{ display: 'flex', gap: spaceMd }}>
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

          <Form.Item style={{ marginTop: spaceLg }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>
                Lưu
              </Button>
              <Button onClick={() => navigate(-1)} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
