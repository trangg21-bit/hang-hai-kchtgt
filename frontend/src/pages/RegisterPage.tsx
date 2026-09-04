import { useState, useEffect } from 'react';
import { Form, Input, Button, Progress, Result } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { message } from '../components/ToastNotification';
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
  radiusPill,
  radiusMd,
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
import {
  registerAccount,
  getRegistrationConfig,
  type RegisterAccountPayload,
  type PasswordPolicy,
} from '../services/registrationService';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ username: string; email: string; phone?: string } | null>(null);
  const [password, setPassword] = useState('');
  const [policy, setPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: true,
  });

  // Load registration config on mount
  useEffect(() => {
    getRegistrationConfig()
      .then((cfg) => {
        if (cfg.passwordPolicy) {
          setPolicy(cfg.passwordPolicy);
        }
      })
      .catch((err) => {
        console.warn('Could not load registration config, using defaults:', err);
      });
  }, []);

  // Password requirements calculation
  const hasMinLength = password.length >= (policy.minLength || 8);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let strengthScore = 0;
  if (password.length >= 8) strengthScore += 20;
  if (hasMinLength) strengthScore += 20;
  if (hasUpper) strengthScore += 15;
  if (hasLower) strengthScore += 15;
  if (hasDigit) strengthScore += 15;
  if (hasSpecial) strengthScore += 15;
  strengthScore = Math.min(strengthScore, 100);

  let strengthColor = statusCritical;
  let strengthLabel = 'Yếu';
  if (strengthScore >= 80) {
    strengthColor = statusOperational;
    strengthLabel = 'Mạnh';
  } else if (strengthScore >= 50) {
    strengthColor = statusAttention;
    strengthLabel = 'Trung bình';
  }

  const handleRegister = async (values: any) => {
    setSubmitting(true);
    try {
      const email = values.email.trim();
      const generatedUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      const payload: RegisterAccountPayload = {
        username: generatedUsername || email,
        password: values.password,
        email: email,
        fullName: values.fullName ? values.fullName.trim() : undefined,
        phone: values.phone ? values.phone.trim() : undefined,
      };

      await registerAccount(payload);
      message.success('Đăng ký tài khoản thành công!');
      setSuccessData({ username: payload.username, email: payload.email, phone: payload.phone });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Đăng ký tài khoản thất bại. Vui lòng kiểm tra lại thông tin.';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const labelProps = (text: string) => ({
    label: (
      <span style={{ fontSize: fontSizeLg, fontWeight: fontWeightMedium, color: textPrimary }}>
        {text}
      </span>
    ),
  });

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundImage: "url('/images/preview.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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
          maxWidth: 520,
        }}
      >
        <div
          style={{
            width: '100%',
            background: surfaceCard,
            borderRadius: radiusLg,
            boxShadow: '0 30px 70px rgba(3,10,25,0.55)',
            overflow: 'hidden',
          }}
        >
          {/* Accent top bar */}
          <div style={{ height: 3, background: actionPrimary }} />

          <div style={{ padding: '28px 28px 24px' }}>
            {successData ? (
              /* ===== Success Confirmation View ===== */
              <div style={{ textAlign: 'center' }}>
                <img
                  src="/images/Logo_Cục_Hàng_hải_Việt_Nam.jpg"
                  alt="Logo Cục Hàng hải Việt Nam"
                  style={{ display: 'block', margin: '0 auto 8px', width: 130, height: 46, objectFit: 'contain' }}
                />

                {/* Glowing Emerald Check Badge */}
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
                  Gửi yêu cầu đăng ký thành công!
                </div>
                <div style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceMd, fontFamily: fontSans }}>
                  Thông tin tài khoản của bạn đã được hệ thống ghi nhận
                </div>

                {/* Structured Info Box */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spaceSm }}>
                    <span style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>Email đăng ký:</span>
                    <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: textPrimary, fontFamily: fontSans }}>{successData.email}</span>
                  </div>
                  {successData.phone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spaceSm }}>
                      <span style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>Số điện thoại:</span>
                      <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary, fontFamily: fontSans }}>{successData.phone}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>Trạng thái:</span>
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
                      Chờ phê duyệt
                    </span>
                  </div>
                </div>

                {/* Informative Notice Banner */}
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
                    Tài khoản đang chờ Quản trị viên xem xét và phê duyệt. Sau khi được duyệt, bạn có thể đăng nhập trực tiếp vào hệ thống.
                  </span>
                </div>

                {/* Actions */}
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
                  Đăng nhập ngay
                </Button>

                <div style={{ marginTop: spaceSm }}>
                  <Button
                    type="link"
                    onClick={() => {
                      setSuccessData(null);
                      form.resetFields();
                    }}
                    style={{ color: textSecondary, fontSize: fontSizeMd, fontFamily: fontSans }}
                  >
                    Đăng ký tài khoản khác
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Header / Logo */}
                <div style={{ textAlign: 'center', marginBottom: spaceMd }}>
                  <img
                    src="/images/Logo_Cục_Hàng_hải_Việt_Nam.jpg"
                    alt="Logo Cục Hàng hải Việt Nam"
                    style={{ display: 'block', margin: '0 auto 8px', width: 130, height: 46, objectFit: 'contain' }}
                  />
                  <div
                    style={{
                      fontSize: fontSizeXl,
                      fontWeight: fontWeightBold,
                      color: sidebarBg,
                      lineHeight: 1.35,
                      marginBottom: spaceXs,
                    }}
                  >
                    Đăng ký tài khoản
                  </div>
                  <div style={{ fontSize: fontSizeMd, color: textSecondary }}>
                    Hệ thống thông tin Quản lý kết cấu hạ tầng giao thông Hàng Hải
                  </div>
                </div>

                {/* ===== Registration Form ===== */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleRegister}
                labelCol={{ style: { padding: 0, marginBottom: 4 } }}
              >
                {/* Họ và tên */}
                <Form.Item
                  name="fullName"
                  {...labelProps('Họ và tên')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: textTertiary }} />}
                    placeholder="Nhập họ và tên"
                    spellCheck={false}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>

                {/* Email */}
                <Form.Item
                  name="email"
                  {...labelProps('Email')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Địa chỉ email không đúng định dạng' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: textTertiary }} />}
                    placeholder="Nhập email"
                    autoComplete="email"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>

                {/* Số điện thoại */}
                <Form.Item
                  name="phone"
                  {...labelProps('Số điện thoại')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[
                    {
                      pattern: /^(\+84|0)[0-9]{9,10}$/,
                      message: 'Số điện thoại không hợp lệ (10-11 chữ số)',
                    },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined style={{ color: textTertiary }} />}
                    placeholder="Nhập số điện thoại"
                    autoComplete="tel"
                    spellCheck={false}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>

                {/* Mật khẩu */}
                <Form.Item
                  name="password"
                  {...labelProps('Mật khẩu')}
                  style={{ marginBottom: spaceSm }}
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    {
                      min: policy.minLength || 8,
                      message: `Mật khẩu phải có tối thiểu ${policy.minLength || 8} ký tự`,
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: textTertiary }} />}
                    placeholder="Nhập mật khẩu"
                    autoComplete="new-password"
                    spellCheck={false}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>

                {/* Password strength indicator */}
                {password && (
                  <div
                    style={{
                      background: 'rgba(11,46,79,0.03)',
                      borderRadius: radiusMd,
                      padding: `${spaceSm}px ${spaceFormField}px`,
                      marginBottom: spaceFormField,
                      border: `1px solid ${borderDefault}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: fontSizeSm,
                        marginBottom: spaceXs,
                      }}
                    >
                      <span style={{ color: textSecondary }}>Độ mạnh mật khẩu:</span>
                      <span style={{ fontWeight: fontWeightBold, color: strengthColor }}>
                        {strengthLabel}
                      </span>
                    </div>
                    <Progress
                      percent={strengthScore}
                      showInfo={false}
                      strokeColor={strengthColor}
                      size="small"
                    />

                    {/* Requirements checklist */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '2px 8px',
                        marginTop: spaceSm,
                        fontSize: fontSizeSm,
                      }}
                    >
                      <span style={{ color: hasMinLength ? statusOperational : textTertiary }}>
                        {hasMinLength ? <CheckCircleOutlined /> : <CloseCircleOutlined />}{' '}
                        Tối thiểu {policy.minLength || 8} ký tự
                      </span>
                      <span style={{ color: hasUpper ? statusOperational : textTertiary }}>
                        {hasUpper ? <CheckCircleOutlined /> : <CloseCircleOutlined />}{' '}
                        Chữ in hoa (A-Z)
                      </span>
                      <span style={{ color: hasLower ? statusOperational : textTertiary }}>
                        {hasLower ? <CheckCircleOutlined /> : <CloseCircleOutlined />}{' '}
                        Chữ in thường (a-z)
                      </span>
                      <span style={{ color: hasDigit ? statusOperational : textTertiary }}>
                        {hasDigit ? <CheckCircleOutlined /> : <CloseCircleOutlined />}{' '}
                        Chữ số (0-9)
                      </span>
                      <span style={{ color: hasSpecial ? statusOperational : textTertiary, gridColumn: 'span 2' }}>
                        {hasSpecial ? <CheckCircleOutlined /> : <CloseCircleOutlined />}{' '}
                        Ký tự đặc biệt (!@#$%^&*...)
                      </span>
                    </div>
                  </div>
                )}

                {/* Xác nhận mật khẩu */}
                <Form.Item
                  name="confirmPassword"
                  {...labelProps('Xác nhận mật khẩu')}
                  dependencies={['password']}
                  style={{ marginBottom: spaceMd }}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: textTertiary }} />}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    spellCheck={false}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>

                {/* Nút Submit */}
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
                      boxShadow: '0 4px 14px rgba(14,111,214,0.3)',
                    }}
                  >
                    Gửi yêu cầu đăng ký
                  </Button>
                </Form.Item>

                {/* Link quay lại đăng nhập */}
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: spaceSm,
                    fontSize: fontSizeMd,
                    color: textSecondary,
                  }}
                >
                  Đã có tài khoản?{' '}
                  <span
                    onClick={() => navigate('/login')}
                    style={{
                      color: actionPrimary,
                      fontWeight: fontWeightBold,
                      cursor: 'pointer',
                    }}
                  >
                    Đăng nhập
                  </span>
                </div>
              </Form>
              </>
            )}
          </div>
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
