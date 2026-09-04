import { useState, useEffect } from 'react';
import { Form, Input, Button, Progress, Result } from 'antd';
import { message } from '../components/ToastNotification';
import {
  MailOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import * as themeTokenChk from '../themetokenchk';
import {
  actionPrimary,
  surfaceCard,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  statusOperational,
  statusCritical,
  statusAttention,
  radiusLg,
  radiusMd,
  radiusPill,
  spaceXs,
  spaceSm,
  spaceFormField,
  spaceMd,
  spaceLg,
  spaceXl,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontSizeXl,
  fontWeightBold,
  fontWeightMedium,
  fontSans,
  sidebarBg,
} from '../themetokenchk';
import { ThemeTokenProvider } from '../context/ThemeTokenContext';

interface PasswordResetPageProps {
  mode: 'forgot' | 'reset';
}

export default function PasswordResetPage({ mode }: PasswordResetPageProps) {
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();
  const [forgotForm] = Form.useForm();
  const [resetForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
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
    const email = values.email.trim();
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmittedEmail(email);
      setSuccess(true);
      message.success('Yêu cầu đặt lại mật khẩu đã được ghi nhận. Vui lòng kiểm tra email của bạn.');
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
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
      message.error(err.response?.data?.message || err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url(/images/preview.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflowX: 'hidden',
        fontFamily: fontSans,
        padding: `${spaceLg}px ${spaceMd}px`,
      }}
    >
      {/* ===== Decorative background layers ===== */}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;}
        .tint{ position:absolute; inset:0; z-index:1;
          background:linear-gradient(180deg, rgba(6,16,36,0.6) 0%, rgba(6,16,36,0.3) 35%, rgba(6,16,36,0.6) 100%);
        }
        .focus-veil{
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:750px; height:750px; border-radius:50%; z-index:1;
          background:radial-gradient(circle, rgba(4,10,24,0.6) 0%, rgba(4,10,24,0) 70%);
        }
        .grid{ position:absolute; inset:0; z-index:1; opacity:.14;
          background-image:linear-gradient(rgba(95,212,232,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(95,212,232,0.5) 1px, transparent 1px);
          background-size:56px 56px;
        }
      `}</style>

      <div className="tint" />
      <div className="grid" />
      <div className="focus-veil" />

      {/* ===== Form Card Container ===== */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 480,
        }}
      >
        <div
          style={{
            width: '100%',
            background: surfaceCard,
            borderRadius: radiusLg,
            boxShadow: '0 30px 70px rgba(3,10,25,0.55)',
            overflow: 'hidden',
            padding: '28px',
          }}
        >
          <div style={{ height: 3, background: actionPrimary, position: 'absolute', top: 0, left: 0, right: 0 }} />

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <img
                src="/images/Logo_Cục_Hàng_hải_Việt_Nam.jpg"
                alt="Logo Cục Hàng hải Việt Nam"
                style={{ display: 'block', margin: '0 auto 8px', width: 130, height: 46, objectFit: 'contain' }}
              />

              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: 'rgba(27, 175, 122, 0.12)',
                  border: '2px solid rgba(27, 175, 122, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: `${spaceMd}px auto ${spaceSm}px`,
                }}
              >
                <CheckCircleFilled style={{ fontSize: 38, color: statusOperational }} />
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: fontWeightBold,
                  color: sidebarBg,
                  lineHeight: 1.35,
                  marginBottom: spaceXs,
                  fontFamily: fontSans,
                }}
              >
                {mode === 'forgot' ? 'Đã gửi yêu cầu thành công!' : 'Đặt lại mật khẩu thành công!'}
              </div>
              <div style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceMd, fontFamily: fontSans }}>
                {mode === 'forgot'
                  ? 'Vui lòng kiểm tra hộp thư email để nhận liên kết xác thực'
                  : 'Mật khẩu của bạn đã được cập nhật thành công'}
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: `1px solid ${borderDefault}`,
                  borderRadius: radiusMd,
                  padding: '14px 18px',
                  marginBottom: spaceMd,
                  textAlign: 'left',
                  fontFamily: fontSans,
                }}
              >
                {mode === 'forgot' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spaceSm }}>
                      <span style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>Email nhận liên kết:</span>
                      <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: textPrimary, fontFamily: fontSans }}>{submittedEmail}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>Thời hạn hiệu lực:</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '2px 10px',
                          borderRadius: radiusPill,
                          background: 'rgba(237, 161, 0, 0.12)',
                          color: '#b45309',
                          border: '1px solid rgba(237, 161, 0, 0.40)',
                          fontSize: fontSizeSm,
                          fontWeight: fontWeightMedium,
                          fontFamily: fontSans,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusAttention }} />
                        60 phút
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: fontSizeMd, color: textPrimary, textAlign: 'center', padding: `${spaceXs}px 0`, fontFamily: fontSans }}>
                    Tài khoản đã sẵn sàng để đăng nhập với mật khẩu mới.
                  </div>
                )}
              </div>

              {mode === 'forgot' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: spaceSm,
                    background: 'rgba(39, 62, 124, 0.04)',
                    border: '1px solid rgba(39, 62, 124, 0.15)',
                    borderRadius: radiusMd,
                    padding: '12px 16px',
                    marginBottom: spaceLg,
                    textAlign: 'left',
                  }}
                >
                  <InfoCircleOutlined style={{ color: actionPrimary, fontSize: 16, marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: fontSizeSm, color: textSecondary, lineHeight: 1.5, fontFamily: fontSans }}>
                    Nếu không thấy thư trong hộp thư đến, vui lòng kiểm tra thêm mục <strong>Thư rác (Spam)</strong> hoặc Quảng cáo.
                  </span>
                </div>
              )}

              <Button
                type="primary"
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  borderRadius: radiusPill,
                  height: 42,
                  fontSize: fontSizeLg,
                  fontWeight: fontWeightBold,
                  background: actionPrimary,
                  borderColor: actionPrimary,
                  boxShadow: '0 4px 14px rgba(39, 62, 124, 0.25)',
                  fontFamily: fontSans,
                }}
              >
                Quay lại Đăng nhập
              </Button>

              {mode === 'forgot' && (
                <div style={{ marginTop: spaceSm }}>
                  <Button
                    type="link"
                    onClick={() => {
                      setSuccess(false);
                      setSubmittedEmail('');
                    }}
                    style={{ color: textSecondary, fontSize: fontSizeMd, fontFamily: fontSans }}
                  >
                    Gửi lại yêu cầu khác
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: spaceMd }}>
                <img
                  src="/images/Logo_Cục_Hàng_hải_Việt_Nam.jpg"
                  alt="Logo Cục Hàng hải Việt Nam"
                  style={{ display: 'block', margin: '0 auto 8px', width: 130, height: 46, objectFit: 'contain' }}
                />
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: fontWeightBold,
                    color: sidebarBg,
                    lineHeight: 1.35,
                    marginBottom: spaceXs,
                    fontFamily: fontSans,
                  }}
                >
                  {mode === 'forgot' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
                </div>
                <div style={{ fontSize: fontSizeMd, color: textSecondary, fontFamily: fontSans }}>
                  Hệ thống thông tin Quản lý kết cấu hạ tầng giao thông Hàng Hải
                </div>
              </div>

              <div>
                <p style={{ textAlign: 'center', fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceMd, fontFamily: fontSans }}>
                  {mode === 'forgot'
                    ? 'Nhập địa chỉ email đã đăng ký để nhận liên kết đặt lại mật khẩu'
                    : 'Vui lòng nhập mật khẩu mới cho tài khoản của bạn'}
                </p>

                {mode === 'forgot' ? (
                  <Form
                    form={forgotForm}
                    layout="vertical"
                    onFinish={handleForgotPasswordSubmit}
                    labelCol={{ style: { padding: 0, marginBottom: 4 } }}
                  >
                    <Form.Item
                      name="email"
                      label={<span style={{ fontWeight: fontWeightMedium, fontSize: fontSizeMd, color: textPrimary, fontFamily: fontSans }}>Email đăng ký</span>}
                      rules={[
                        { required: true, message: 'Vui lòng nhập email' },
                        { type: 'email', message: 'Địa chỉ email không đúng định dạng' },
                      ]}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <Input
                        prefix={<MailOutlined style={{ color: textTertiary }} />}
                        placeholder="Nhập email"
                        style={{ borderRadius: radiusPill, height: 40, fontFamily: fontSans, fontSize: fontSizeMd }}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginTop: spaceLg, marginBottom: spaceSm }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        block
                        style={{
                          borderRadius: radiusPill,
                          height: 42,
                          fontSize: fontSizeLg,
                          fontWeight: fontWeightBold,
                          background: actionPrimary,
                          borderColor: actionPrimary,
                          boxShadow: '0 4px 14px rgba(39, 62, 124, 0.25)',
                          fontFamily: fontSans,
                        }}
                      >
                        Gửi yêu cầu
                      </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', marginTop: spaceSm }}>
                      <Button
                        type="link"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/login')}
                        style={{ color: actionPrimary, fontSize: fontSizeMd, fontFamily: fontSans }}
                      >
                        Quay lại Đăng nhập
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <Form
                    form={resetForm}
                    layout="vertical"
                    onFinish={handleResetPasswordSubmit}
                    labelCol={{ style: { padding: 0, marginBottom: 4 } }}
                  >
                    <Form.Item
                      name="newPassword"
                      label={<span style={{ fontWeight: fontWeightMedium, fontSize: fontSizeMd, color: textPrimary, fontFamily: fontSans }}>Mật khẩu mới</span>}
                      rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: textTertiary }} />}
                        placeholder="Nhập mật khẩu mới"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ borderRadius: radiusPill, height: 40, fontFamily: fontSans, fontSize: fontSizeMd }}
                      />
                    </Form.Item>

                    {password && (
                      <div style={{ marginBottom: spaceFormField, fontFamily: fontSans }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>Độ mạnh:</span>
                          <span
                            style={{
                              fontSize: fontSizeSm,
                              fontWeight: fontWeightBold,
                              fontFamily: fontSans,
                              color:
                                strengthStatus === 'success'
                                  ? statusOperational
                                  : strengthStatus === 'active'
                                  ? statusAttention
                                  : statusCritical,
                            }}
                          >
                            {strengthText}
                          </span>
                        </div>
                        <Progress
                          percent={strength}
                          status={strengthStatus}
                          showInfo={false}
                          strokeColor={
                            strengthStatus === 'success'
                              ? statusOperational
                              : strengthStatus === 'active'
                              ? statusAttention
                              : statusCritical
                          }
                        />
                      </div>
                    )}

                    <div
                      style={{
                        background: '#f8fafc',
                        padding: `${spaceSm}px ${spaceMd}px`,
                        borderRadius: radiusMd,
                        marginBottom: spaceFormField,
                        fontSize: fontSizeSm,
                        color: textSecondary,
                        fontFamily: fontSans,
                      }}
                    >
                      <div style={{ fontWeight: fontWeightBold, marginBottom: 4, fontFamily: fontSans }}>Yêu cầu mật khẩu:</div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontFamily: fontSans }}>
                        <li>Tối thiểu {policy.minLength} ký tự</li>
                        {policy.requireUppercase && <li>Có ít nhất một chữ hoa (A-Z)</li>}
                        {policy.requireLowercase && <li>Có ít nhất một chữ thường (a-z)</li>}
                        {policy.requireDigit && <li>Có ít nhất một chữ số (0-9)</li>}
                        {policy.requireSpecialChar && <li>Có ít nhất một ký tự đặc biệt</li>}
                      </ul>
                    </div>

                    <Form.Item
                      name="confirmPassword"
                      label={<span style={{ fontWeight: fontWeightMedium, fontSize: fontSizeMd, color: textPrimary, fontFamily: fontSans }}>Xác nhận mật khẩu mới</span>}
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                          },
                        }),
                      ]}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: textTertiary }} />}
                        placeholder="Nhập lại mật khẩu mới"
                        style={{ borderRadius: radiusPill, height: 40, fontFamily: fontSans, fontSize: fontSizeMd }}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginTop: spaceLg, marginBottom: spaceSm }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        block
                        style={{
                          borderRadius: radiusPill,
                          height: 42,
                          fontSize: fontSizeLg,
                          fontWeight: fontWeightBold,
                          background: actionPrimary,
                          borderColor: actionPrimary,
                          boxShadow: '0 4px 14px rgba(39, 62, 124, 0.25)',
                          fontFamily: fontSans,
                        }}
                      >
                        Lưu mật khẩu mới
                      </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', marginTop: spaceSm }}>
                      <Button
                        type="link"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/login')}
                        style={{ color: actionPrimary, fontSize: fontSizeMd, fontFamily: fontSans }}
                      >
                        Quay lại Đăng nhập
                      </Button>
                    </div>
                  </Form>
                )}
              </div>
            </>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              marginTop: 14,
              fontSize: fontSizeSm,
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            © 2026 Cục Hàng hải Việt Nam
          </div>
        </div>
      </div>
    </ThemeTokenProvider>
  );
}
