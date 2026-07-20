import { useState, useCallback, useEffect } from 'react';
import { Form, Button, Space, Typography, Input, Select, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { groupService } from '../../services/groupService';
import type { CreateGroupPayload, UpdateGroupPayload } from '../../services/groupService';
import { actionPrimary, textSecondary, fontSizeMd, fontSizeLg, fontWeightBold, fontWeightMedium, radiusPill, borderDefault, spaceFormField, spaceSm, spaceLg, cardStyle } from '../../tokens';
import { colors } from '../../theme';
import toast from '../../components/ToastNotification';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
];

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

export default function GroupForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      (async () => {
        try {
          const data = await groupService.getById(id);
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

      if (isEdit && id) {
        const payload: UpdateGroupPayload = {
          name: values.name,
          description: values.description,
          status: values.status,
        };
        await groupService.update(id, payload);
        toast.success('Đã cập nhật nhóm');
      } else {
        const payload: CreateGroupPayload = {
          name: values.name,
          description: values.description,
        };
        await groupService.create(payload);
        toast.success('Đã tạo nhóm mới');
      }

      navigate('/groups');
    } catch (err: any) {
      if (err.errorFields) return;
      toast.error('Lỗi hệ thống');
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Header */}
      <div style={{ ...cardStyle, marginBottom: 4, display: 'flex', alignItems: 'center', gap: spaceSm }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/groups')}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}
        >
          Quay lại
        </Button>
        <Typography.Title level={5} style={{ margin: 0, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
          {isEdit ? 'Chỉnh sửa nhóm' : 'Thêm nhóm mới'}
        </Typography.Title>
      </div>

      {/* Form */}
      <div style={{ ...cardStyle, maxWidth: 640, margin: '0 auto' }}>
        <Spin spinning={submitting}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ status: 'active' }}
          >
            <Form.Item name="name" {...labelProps('Tên nhóm')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}>
              <Input placeholder="vd: Nhóm Quản trị viên" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>

            {isEdit && (
              <Form.Item name="status" {...labelProps('Trạng thái')} style={{ marginBottom: spaceFormField }}>
                <Select
                  options={STATUS_OPTIONS}
                  style={{ borderRadius: radiusPill, height: 40, width: '100%' }}
                />
              </Form.Item>
            )}

            <Form.Item name="description" {...labelProps('Mô tả')} style={{ marginBottom: 0 }}>
              <Input.TextArea rows={3} placeholder="Mô tả ngắn về nhóm" />
            </Form.Item>

            <Form.Item style={{ marginTop: spaceLg, marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>
                  {isEdit ? 'Cập nhật' : 'Tạo nhóm'}
                </Button>
                <Button onClick={() => navigate('/groups')} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </div>
  );
}
