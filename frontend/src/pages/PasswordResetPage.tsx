import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, message, Progress, Divider } from 'antd';
import { MailOutlined, LockOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;

interface PasswordResetPageProps {
  mode: 'forgot' | 'reset';
}

export default function PasswordResetPage({ mode }: PasswordResetPageProps) {
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [strengthStatus, setStrengthStatus] = useState<'exception' | 'active' | 'success' | 'normal'>('normal');
  const [strengthText, setStrengthText] = useState('');

  // Password policy from API (with fallback defaults)
  const [policy, setPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: false,
  });

  useEffect(() => {
    // Load password policy from public endpoint
    api.get('/auth/password-policy')
      .then((res) => {
        if (res.data?.data) {
          setPolicy(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load password policy, using defaults:', err);
      });
  }, []);

  // Update password strength indicator based on values
  useEffect(() => {
    if (!password) {
      setStrength(0);
      setStrengthText('');
      return;
    }

    let score = 0;
    const meetsLength = password.length >= policy.minLength;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (password.length >= policy.minLength) score += 20;
    if (password.length >= 12) score += 10;
    if (hasUpper) score += 20;
    if (hasLower) score += 20;
    if (hasDigit) score += 20;
    if (hasSpecial) score += 10;

    score = Math.min(score, 100);
    setStrength(score);

    if (score < 40) {
      setStrengthStatus('exception');
      setStrengthText('Yếu');
    } else if (score < 80) {
      setStrengthStatus('active');
      setStrengthText('Trung bình');
    } else {
      setStrengthStatus('success');
      setStrengthText('Mạnh');
    }
  }, [password, policy]);

  const handleForgotPasswordSubmit = async (values: { email: string }) => {
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: values.email });
      setSuccess(true);
      message.success('Yêu cầu đặt lại mật khẩu đã được ghi nhận. Vui lòng kiểm tra email của bạn.');
    } catch (err: any) {
      message.error(err.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (values: { newPassword: string }) => {
    if (!token) {
      message.error('Token đặt lại mật khẩu không hợp lệ.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { newPassword: values.newPassword });
      setSuccess(true);
      message.success('Mật khẩu của bạn đã được đặt lại thành công.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      message.error(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

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
        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 56, color: '#52c41a', marginBottom: 24 }} />
            <Title level={3} style={{ marginBottom: 16 }}>
              {mode === 'forgot' ? 'Đã gửi Email' : 'Thành công'}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 15 }}>
              {mode === 'forgot'
                ? 'Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến hòm thư của bạn. Vui lòng kiểm tra email (bao gồm cả thư mục Spam).'
                : 'Mật khẩu của bạn đã được cập nhật. Hệ thống sẽ tự động đưa bạn về trang đăng nhập sau vài giây.'}
            </Text>
            <Button type="primary" size="large" onClick={() => navigate('/login')} block>
              Quay lại Đăng nhập
            </Button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ margin: '0 0 8px 0' }}>
                {mode === 'forgot' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
              </Title>
              <Text type="secondary">
                {mode === 'forgot'
                  ? 'Nhập email của bạn để nhận liên kết đặt lại mật khẩu'
                  : 'Vui lòng nhập mật khẩu mới cho tài khoản của bạn'}
              </Text>
            </div>

            <Divider style={{ margin: '0 0 24px 0' }} />

            {mode === 'forgot' ? (
              <Form layout="vertical" onFinish={handleForgotPasswordSubmit} size="large">
                <Form.Item
                  label="Email đăng ký"
                  name="email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Định dạng email không hợp lệ' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="example@domain.com" />
                </Form.Item>

                <Form.Item style={{ marginTop: 32, marginBottom: 12 }}>
                  <Button type="primary" htmlType="submit" loading={submitting} block>
                    Gửi yêu cầu
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')}>
                    Quay lại Đăng nhập
                  </Button>
                </div>
              </Form>
            ) : (
              <Form layout="vertical" onFinish={handleResetPasswordSubmit} size="large">
                <Form.Item
                  label="Mật khẩu mới"
                  name="newPassword"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                    { min: policy.minLength, message: `Mật khẩu phải có ít nhất ${policy.minLength} ký tự` },
                    {
                      validator: (_, val) => {
                        if (!val) return Promise.resolve();
                        if (policy.requireUppercase && !/[A-Z]/.test(val)) {
                          return Promise.reject(new Error('Mật khẩu phải chứa ít nhất 1 chữ hoa'));
                        }
                        if (policy.requireLowercase && !/[a-z]/.test(val)) {
                          return Promise.reject(new Error('Mật khẩu phải chứa ít nhất 1 chữ thường'));
                        }
                        if (policy.requireDigit && !/[0-9]/.test(val)) {
                          return Promise.reject(new Error('Mật khẩu phải chứa ít nhất 1 chữ số'));
                        }
                        if (policy.requireSpecialChar && !/[^A-Za-z0-9]/.test(val)) {
                          return Promise.reject(new Error('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Mật khẩu mới"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Item>

                {password && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12 }} type="secondary">Mức độ bảo mật:</Text>
                      <Text style={{ fontSize: 12 }} strong>
                        {strengthText}
                      </Text>
                    </div>
                    <Progress
                      percent={strength}
                      status={strengthStatus}
                      showInfo={false}
                      strokeWidth={6}
                      style={{ margin: 0 }}
                    />
                  </div>
                )}

                <Form.Item
                  label="Xác nhận mật khẩu mới"
                  name="confirmPassword"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" />
                </Form.Item>

                <Form.Item style={{ marginTop: 32, marginBottom: 12 }}>
                  <Button type="primary" htmlType="submit" loading={submitting} block>
                    Lưu mật khẩu mới
                  </Button>
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
