import { useState, useCallback, useEffect, useMemo } from 'react';
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
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<UpdateOrganizationPayload & { parentOrgId?: string } | null>(null);
  const [orgOptions, setOrgOptions] = useState<Organization[]>([]);

  // Load org tree for parent selector
  useEffect(() => {
    (async () => {
      try {
        const orgs = await organizationService.getTree({ allowMockFallback: false });
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
            description: data.description,
            address: data.address,
            contactPerson: data.contactPerson,
            contactPhone: data.contactPhone,
            status: data.status,
            operationalStatus: data.operationalStatus,
          });
          form.setFieldsValue({
            name: data.name,
            code: data.code || 'ORG_' + id,
            parentId: data.parentId,
            description: data.description,
            address: data.address,
            contactPerson: data.contactPerson,
            contactPhone: data.contactPhone,
            status: data.status,
            operationalStatus: data.operationalStatus,
          });
        } catch {
          toast.error('Không thể tải thông tin đơn vị');
          navigate('/organizations');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const parentOptions = useMemo(() => {
    const currentOrg = orgOptions.find((org) => org.id === id);
    const parentLevel = currentOrg?.level && currentOrg.level > 1 ? currentOrg.level - 1 : undefined;
    const isDescendant = (candidateId: string) => {
      if (!id) return false;
      let current = orgOptions.find((org) => org.id === candidateId);
      const visited = new Set<string>();
      while (current?.parentId && !visited.has(current.parentId)) {
        if (current.parentId === id) return true;
        visited.add(current.parentId);
        current = orgOptions.find((org) => org.id === current?.parentId);
      }
      return false;
    };

    return orgOptions
      .filter((org) => org.id !== id && !isDescendant(org.id))
      .filter((org) => org.operationalStatus !== 'inactive')
      .filter((org) => parentLevel === undefined ? (org.level ?? 0) < 3 : org.level === parentLevel)
      .map((org) => ({ value: org.id, label: `${org.name}${org.level ? ` (Cấp ${org.level})` : ''}` }));
  }, [id, orgOptions]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const targetParentId = values.parentId || undefined;

      if (isEdit) {
        const payload: UpdateOrganizationPayload = {
          name: values.name,
          parentId: targetParentId,
          description: values.description,
          address: values.address,
          detailAddress: values.detailAddress,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          operationalStatus: values.operationalStatus,
        };
        await organizationService.update(id!, payload);
        toast.success('Đã cập nhật đơn vị thành công');
      } else {
        const payload: CreateOrganizationPayload = {
          name: values.name,
          parentId: targetParentId,
          description: values.description,
          address: values.address,
          detailAddress: values.detailAddress,
          phone: values.phone,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          operationalStatus: values.operationalStatus,
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
        <Form form={form} layout="vertical" onFinish={handleSubmit} onFinishFailed={(info) => console.error("Form validation failed:", info)} initialValues={{ operationalStatus: 'active', ...initialData }}>
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

          <FormField
            type="select"
            name="parentId"
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
            name="operationalStatus"
            label="Trạng thái"
            required
            options={[
              { value: 'active', label: 'Sử dụng' },
              { value: 'inactive', label: 'Không sử dụng' },
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
