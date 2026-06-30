import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { LoginRequest } from '../types/auth';

const { Title, Text } = Typography;

interface MfaChallengeData {
  requiresMfa: boolean;
  userId: string;
  challengeId?: string;
  totpRequired: boolean;
}

interface LoginData {
  token: string;
  username: string;
  fullName: string;
  role: string;
  status: string;
}

interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message: string;
}

const getFriendlyAuthError = (err: unknown, defaultMsg: string): string => {
  const axiosErr = err as AxiosErrorResponse;
  const rawMsg = axiosErr.response?.data?.message || axiosErr.message;
  
  if (!rawMsg) return defaultMsg;
  
  if (rawMsg === 'Account is locked') {
    return 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
  }
  if (rawMsg.startsWith('Account is locked until')) {
    return 'Tài khoản của bạn đang tạm thời bị khóa. Vui lòng thử lại sau.';
  }
  if (rawMsg === 'Invalid username or password') {
    return 'Tên đăng nhập hoặc mật khẩu không chính xác.';
  }
  if (rawMsg === 'Invalid TOTP code' || rawMsg === 'Mã TOTP không đúng hoặc hết hạn') {
    return 'Mã xác thực TOTP không chính xác hoặc đã hết hạn.';
  }
  
  return rawMsg;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [userId, setUserId] = useState('');
  const [totpCode, setTotpCode] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('error') === 'locked') {
      message.error('Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ quản trị viên.');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogin = useCallback(async (values: LoginRequest) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', values);
      const { success, data, message: msg } = res.data;

      if (!success) {
        message.error(msg || 'Đăng nhập thất bại');
        setSubmitting(false);
        return;
      }

      // Check if TOTP is required
      const mfaData = data as MfaChallengeData;
      if (mfaData.requiresMfa || mfaData.totpRequired) {
        setUserId(mfaData.userId || '');
        setShowTotp(true);
        message.info('Vui lòng nhập mã TOTP');
        setSubmitting(false);
        return;
      }

      // No TOTP - direct login
      const loginData = data as LoginData;
      if (loginData.token) {
        login(loginData.username, '', loginData.token);
        message.success('Đăng nhập thành công');
        navigate('/');
      } else {
        message.error('Không nhận được token');
      }
    } catch (err: unknown) {
      const msg = getFriendlyAuthError(err, 'Đăng nhập thất bại. Vui lòng thử lại.');
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [login, navigate]);

  const handleTotpVerify = useCallback(async () => {
    if (!totpCode.trim()) {
      message.warning('Vui lòng nhập mã TOTP');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login/totp', { userId, totpCode: totpCode.trim() });
      const { success, data, message: msg } = res.data;

      if (!success) {
        message.error(msg || 'Mã TOTP không đúng');
        setSubmitting(false);
        return;
      }

      // 2FA success - extract access token
      const totpData = data as { accessToken: string; user: { fullName: string; username?: string } };
      if (totpData.accessToken) {
        login(totpData.user?.username || '', '', totpData.accessToken);
        message.success('Đăng nhập thành công');
        navigate('/');
      } else {
        message.error('Không nhận được token');
      }
    } catch (err: unknown) {
      const msg = getFriendlyAuthError(err, 'Xác thực TOTP thất bại. Vui lòng thử lại.');
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [totpCode, userId, login, navigate]);

  const handleBackToLogin = useCallback(() => {
    setShowTotp(false);
    setTotpCode('');
  }, []);

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



        {showTotp ? (
          <div>
            <Alert
              message="Xác thực 2 bước"
              description="Vui lòng nhập mã TOTP từ ứng dụng xác thực của bạn"
              type="info"
              icon={<SafetyOutlined />}
              style={{ marginBottom: 24 }}
            />
            <Form layout="vertical" onFinish={handleTotpVerify} size="large">
              <Form.Item
                label="Mã TOTP"
                rules={[{ required: true, message: 'Vui lòng nhập mã TOTP' }]}
              >
                <Input
                  prefix={<LockOutlined />}
                  placeholder="Nhập mã 6 chữ số"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button
                  type="default"
                  onClick={handleBackToLogin}
                  block
                  style={{ height: 44, fontSize: 16 }}
                >
                  Quay lại
                </Button>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  block
                  icon={<SafetyOutlined />}
                  style={{ height: 44, fontSize: 16 }}
                >
                  Xác thực
                </Button>
              </Form.Item>
            </Form>
          </div>
        ) : (
          <Form
            layout="vertical"
            onFinish={handleLogin}
            size="large"
            initialValues={{ username: 'admin', password: 'admin123' }}
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
              style={{ marginBottom: 8 }}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
              <Button type="link" onClick={() => navigate('/forgot-password')} style={{ padding: 0, height: 'auto' }}>
                Quên mật khẩu?
              </Button>
            </div>

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
        )}
      </Card>
    </div>
  );
}
