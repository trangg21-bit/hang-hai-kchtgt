import { useState, useCallback } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { LoginRequest } from '../types/auth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (values: LoginRequest) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', values);
      const data = res.data.data;
      const token = data.token;
      localStorage.setItem('auth_token', token);
      login(data.username, '', token);
      navigate('/users');
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('401')) {
        message.error('Tên đăng nhập hoặc mật khẩu không đúng');
      } else {
        message.error('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [login, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <LoginOutlined style={{ fontSize: 28, color: 'white' }} />
          </div>
          <Title level={3} style={{ margin: 0 }}>
            Hàng Hải KCHTGT
          </Title>
          <Text type="secondary">Hệ thống quản lý kinh tế - kỹ thuật vùng bờ</Text>
        </div>

        <Divider style={{ margin: '0 0 24px' }} />

        <Form
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          initialValues={{ username: 'admin', password: 'Admin@123' }}
        >
          <Form.Item
            label="Tài khoản"
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              icon={<LoginOutlined />}
              style={{ height: 44, fontSize: 16 }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
