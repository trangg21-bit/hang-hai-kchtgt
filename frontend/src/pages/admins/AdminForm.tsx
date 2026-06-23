import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { CreateAdminPayload, UpdateAdminPayload } from '../../services/adminService';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function AdminForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Load existing data for edit
  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await adminService.getById(id!);
          form.setFieldsValue({
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            roleId: data.roleId,
            status: data.status,
          });
        } catch {
          toast.error('Không thể tải thông tin admin');
          navigate('/admins');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateAdminPayload = {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          roleId: values.roleId,
          status: values.status,
        };
        await adminService.update(id!, payload);
        toast.success('Đã cập nhật admin thành công');
      } else {
        const payload: CreateAdminPayload = {
          username: values.username,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          roleId: values.roleId,
        };
        await adminService.create(payload);
        toast.success('Đã tạo admin thành công');
      }

      navigate('/admins');
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
            {isEdit ? 'Chỉnh sửa quản trị viên' : 'Thêm quản trị viên mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ ...isEdit ? { status: 'active' } : {} }}>
          {!isEdit && (
            <FormField
              type="text"
              name="username"
              label="Tên đăng nhập"
              required
              placeholder="VD: sysadmin1"
            />
          )}

          <FormField
            type="text"
            name="fullName"
            label="Họ và tên"
            required
            placeholder="Nguyễn Văn A"
          />

          {!isEdit && (
            <FormField
              type="password"
              name="password"
              label="Mật khẩu"
              required
              showPassword
              placeholder="Ít nhất 6 ký tự"
              help="Phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
            />
          )}

          <FormField
            type="email"
            name="email"
            label="Email"
            required
            placeholder="email@hh.gov.vn"
          />

          <FormField
            type="phone"
            name="phone"
            label="Số điện thoại"
            placeholder="0901234567"
          />

          {!isEdit && (
            <FormField
              type="select"
              name="roleId"
              label="Vai trò"
              required
              options={[
                { value: 'role-001', label: 'Super Admin' },
                { value: 'role-002', label: 'System Admin' },
                { value: 'role-003', label: 'Quản lý' },
              ]}
            />
          )}

          {isEdit && (
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
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo admin'}
              </Button>
              <Button onClick={() => navigate(-1)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
