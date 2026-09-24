import { useState, useEffect } from 'react';
import { Form, Input, Button, Progress, Row, Col } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  ApartmentOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { message } from '../components/ToastNotification';
import * as themeTokenChk from '../themetokenchk';
import {
  actionPrimary,
  actionHover,
  surfaceCard,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  statusOperational,
  statusCritical,
  statusAttention,
  radiusXl,
  radiusPill,
  radiusMd,
  spaceSm,
  spaceMd,
  spaceFormField,
  fontSizeSm,
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
  fontSans,
  colors,
} from '../themetokenchk';
import { ThemeTokenProvider } from '../context/ThemeTokenContext';
import { OrgUnitTreeSelect } from '../components/org-unit';
import type { OrgUnitTreeOption } from '../components/org-unit/orgUnitHelpers';
import {
  registerAccount,
  getRegistrationConfig,
  getRegistrationOrgUnits,
  type RegisterAccountPayload,
  type PasswordPolicy,
} from '../services/registrationService';

/** Đồng bộ tiền tố icon chuẩn màn đăng nhập */
const inputPrefixStyle: React.CSSProperties = {
  color: textTertiary,
  marginRight: 6,
  fontSize: 15,
  flexShrink: 0,
};

/** Đồng bộ style ô nhập liệu chuẩn màn đăng nhập */
const inputPillStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  paddingLeft: 14,
  paddingRight: 14,
  fontSize: fontSizeMd,
  fontFamily: fontSans,
};

/** Đồng bộ label style chuẩn màn đăng nhập (13px, fontSans, medium) */
const labelProps = (text: string) => ({
  label: (
    <span
      style={{
        color: textPrimary,
        fontWeight: fontWeightMedium,
        fontSize: fontSizeMd,
        fontFamily: fontSans,
      }}
    >
      {text}
    </span>
  ),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    username: string;
    email: string;
    phone?: string;
    orgUnitName?: string;
    department?: string;
    position?: string;
  } | null>(null);
  const [password, setPassword] = useState('');
  const [orgUnits, setOrgUnits] = useState<OrgUnitTreeOption[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [policy, setPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: true,
  });

  // Load registration config and org units on mount
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

    setLoadingOrgs(true);
    getRegistrationOrgUnits()
      .then((units) => {
        setOrgUnits(units);
      })
      .catch((err) => {
        console.warn('Could not load registration org units:', err);
      })
      .finally(() => {
        setLoadingOrgs(false);
      });
  }, []);

  // Password requirements calculation
  const minLen = policy.minLength || 8;
  const hasMinLength = password.length >= minLen;
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
        orgUnitId: values.orgUnitId,
        department: values.department ? values.department.trim() : undefined,
        position: values.position ? values.position.trim() : undefined,
      };

      const res = await registerAccount(payload);
      message.success('Đăng ký tài khoản thành công!');
      const selectedOrg = orgUnits.find((o) => o.id === values.orgUnitId);
      setSuccessData({
        username: payload.username,
        email: payload.email,
        phone: payload.phone,
        orgUnitName: res.orgUnitName || selectedOrg?.name,
        department: payload.department,
        position: payload.position,
      });
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

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: "url('/images/preview.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: fontSans,
          padding: '16px 20px',
        }}
      >
        {/* ===== Decorative background layers ===== */}
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; font-family: ${fontSans}; }

          .tint {
            position: absolute; inset: 0; z-index: 1;
            background: linear-gradient(180deg, rgba(6,16,36,0.60) 0%, rgba(6,16,36,0.30) 35%, rgba(6,16,36,0.60) 100%);
          }
          .focus-veil {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
            width: 750px; height: 750px; border-radius: 50%; z-index: 1;
            background: radial-gradient(circle, rgba(4,10,24,0.55) 0%, rgba(4,10,24,0) 66%);
          }
          .grid {
            position: absolute; inset: 0; z-index: 1; opacity: .14;
            background-image: linear-gradient(rgba(95,212,232,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(95,212,232,0.5) 1px, transparent 1px);
            background-size: 56px 56px;
            mask-image: linear-gradient(180deg, black, transparent 70%);
            -webkit-mask-image: linear-gradient(180deg, black, transparent 70%);
          }

          /* CHK Theme Input & Autofill Styling đồng bộ màn đăng nhập */
          .chk-register-card .ant-input-affix-wrapper {
            border-color: ${borderDefault} !important;
            border-radius: ${radiusPill}px !important;
            height: 40px !important;
            padding-left: 14px !important;
            padding-right: 14px !important;
            font-family: ${fontSans} !important;
            transition: all 0.2s ease !important;
          }
          .chk-register-card .ant-input-affix-wrapper:hover {
            border-color: ${actionHover} !important;
          }
          .chk-register-card .ant-input-affix-wrapper:focus,
          .chk-register-card .ant-input-affix-wrapper-focused {
            border-color: ${actionPrimary} !important;
            box-shadow: 0 0 0 2px rgba(39, 62, 124, 0.15) !important;
          }
          .chk-register-card .ant-input-prefix {
            margin-inline-end: 6px !important;
          }
          .chk-register-card .ant-input {
            font-family: ${fontSans} !important;
            font-size: ${fontSizeMd}px !important;
            color: ${textPrimary} !important;
          }
          .chk-register-card .ant-input::placeholder {
            color: ${textTertiary} !important;
            font-family: ${fontSans} !important;
          }
          .chk-register-card .ant-select-selector {
            border-radius: 999px !important;
            padding-left: 14px !important;
            padding-right: 14px !important;
            height: 40px !important;
            display: flex !important;
            align-items: center !important;
            font-family: ${fontSans} !important;
            font-size: ${fontSizeMd}px !important;
          }
          .chk-register-card .ant-select-selection-search {
            inset-inline-start: 14px !important;
          }
          .chk-register-card .ant-select-selection-item,
          .chk-register-card .ant-select-selection-placeholder {
            padding-left: 0 !important;
            font-family: ${fontSans} !important;
            font-size: ${fontSizeMd}px !important;
          }
          .chk-register-card input:-webkit-autofill,
          .chk-register-card input:-webkit-autofill:hover,
          .chk-register-card input:-webkit-autofill:focus,
          .chk-register-card input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
            -webkit-text-fill-color: ${textPrimary} !important;
            box-shadow: 0 0 0 1000px #ffffff inset !important;
            caret-color: ${textPrimary} !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `}</style>

        <div className="tint" />
        <div className="grid" />
        <div className="focus-veil" />

        {/* ===== Form Card Container (Thu hẹp gọn gàng maxWidth: 680px) ===== */}
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 680,
          }}
        >
          {/* Card container — đồng bộ bo góc & đổ bóng màn đăng nhập */}
          <div
            className="chk-register-card"
            style={{
              width: '100%',
              background: surfaceCard,
              borderRadius: radiusXl,
              boxShadow: '0 16px 48px rgba(27, 62, 124, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(228, 228, 228, 0.8)',
              overflow: 'hidden',
            }}
          >
            {/* Accent top bar — gradient đồng bộ chuẩn màn đăng nhập */}
            <div
              style={{
                height: 3,
                background: `linear-gradient(90deg, ${colors.sidebarBg} 0%, ${actionPrimary} 50%, #63abfd 100%)`,
              }}
            />

            <div style={{ padding: '32px 36px 28px' }}>
              {successData ? (
                /* ===== Success Confirmation View ===== */
                <div style={{ textAlign: 'center' }}>
                  <img
                    src="/images/Logo_Cục_Hàng_hải_Việt_Nam.jpg"
                    alt="Logo Cục Hàng hải Việt Nam"
                    style={{ display: 'block', margin: '0 auto 10px', width: 140, height: 48, objectFit: 'contain' }}
                  />

                  {/* Glowing Emerald Check Badge */}
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(27, 175, 122, 0.12)',
                      border: '2px solid rgba(27, 175, 122, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: `${spaceSm}px auto 8px`,
                    }}
                  >
                    <CheckCircleFilled style={{ fontSize: 32, color: statusOperational }} />
                  </div>

                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: fontWeightBold,
                      color: colors.sidebarBg,
                      lineHeight: 1.45,
                      marginBottom: 2,
                      fontFamily: fontSans,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Gửi yêu cầu đăng ký thành công!
                  </div>
                  <div style={{ fontSize: fontSizeSm, color: textSecondary, marginBottom: spaceMd, fontFamily: fontSans }}>
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
                    <Row gutter={[20, 8]}>
                      <Col span={12}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>Email:</span>
                          <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: textPrimary, fontFamily: fontSans }}>{successData.email}</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>Số điện thoại:</span>
                          <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary, fontFamily: fontSans }}>{successData.phone || '—'}</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>Đơn vị:</span>
                          <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary, fontFamily: fontSans, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={successData.orgUnitName}>{successData.orgUnitName || '—'}</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>Phòng ban / Chức vụ:</span>
                          <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary, fontFamily: fontSans }}>{[successData.department, successData.position].filter(Boolean).join(' - ') || '—'}</span>
                        </div>
                      </Col>
                      <Col span={24}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: `1px dashed ${borderDefault}` }}>
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
                      </Col>
                    </Row>
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
                      padding: '10px 14px',
                      marginBottom: spaceMd,
                      textAlign: 'left',
                    }}
                  >
                    <InfoCircleOutlined style={{ color: actionPrimary, fontSize: 16, marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: fontSizeSm, color: textSecondary, lineHeight: 1.45, fontFamily: fontSans }}>
                      Tài khoản đang chờ Quản trị viên xem xét và phê duyệt. Sau khi được duyệt, bạn có thể đăng nhập trực tiếp vào hệ thống.
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ textAlign: 'center' }}>
                    <Button
                      type="primary"
                      onClick={() => navigate('/login')}
                      style={{
                        width: '100%',
                        maxWidth: 280,
                        borderRadius: radiusPill,
                        height: 42,
                        fontSize: fontSizeMd,
                        fontWeight: fontWeightBold,
                        fontFamily: fontSans,
                        background: actionPrimary,
                        borderColor: actionPrimary,
                        boxShadow: '0 2px 8px rgba(39, 62, 124, 0.28)',
                      }}
                    >
                      Đăng nhập ngay
                    </Button>
                  </div>

                  <div style={{ marginTop: spaceSm }}>
                    <Button
                      type="link"
                      onClick={() => {
                        setSuccessData(null);
                        form.resetFields();
                        setPassword('');
                      }}
                      style={{ color: textSecondary, fontSize: fontSizeSm, fontFamily: fontSans }}
                    >
                      Đăng ký tài khoản khác
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header / Logo — chuẩn màn đăng nhập */}
                  <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <img
                      src="/images/Logo_Cục_Hàng_hải_Việt_Nam.jpg"
                      alt="Logo Cục Hàng hải Việt Nam"
                      style={{ display: 'block', margin: '0 auto 12px', width: 140, height: 48, objectFit: 'contain' }}
                    />
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: fontWeightBold,
                        color: colors.sidebarBg,
                        lineHeight: 1.45,
                        fontFamily: fontSans,
                        letterSpacing: '-0.01em',
                        marginBottom: 6,
                      }}
                    >
                      Đăng ký tài khoản
                    </div>
                    <div style={{ fontSize: fontSizeSm, color: textSecondary, fontFamily: fontSans }}>
                      Hệ thống thông tin Quản lý kết cấu hạ tầng giao thông Hàng Hải
                    </div>
                  </div>

                  {/* ===== Registration Form (2 cột đối xứng, khoảng cách chuẩn mực) ===== */}
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleRegister}
                    labelCol={{ style: { padding: 0, marginBottom: 4 } }}
                  >
                    <Row gutter={[20, 0]}>
                      {/* Họ và tên */}
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="fullName"
                          {...labelProps('Họ và tên')}
                          style={{ marginBottom: spaceFormField, textAlign: 'left' }}
                          rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                        >
                          <Input
                            prefix={<UserOutlined style={inputPrefixStyle} />}
                            placeholder="Nhập họ và tên"
                            spellCheck={false}
                            style={inputPillStyle}
                          />
                        </Form.Item>
                      </Col>

                      {/* Số điện thoại */}
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="phone"
                          {...labelProps('Số điện thoại')}
                          style={{ marginBottom: spaceFormField, textAlign: 'left' }}
                          rules={[
                            {
                              pattern: /^(\+84|0)[0-9]{9,10}$/,
                              message: 'Số điện thoại không hợp lệ (10-11 chữ số)',
                            },
                          ]}
                        >
                          <Input
                            prefix={<PhoneOutlined style={inputPrefixStyle} />}
                            placeholder="Nhập số điện thoại"
                            autoComplete="tel"
                            spellCheck={false}
                            style={inputPillStyle}
                          />
                        </Form.Item>
                      </Col>

                      {/* Email */}
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="email"
                          {...labelProps('Email')}
                          style={{ marginBottom: spaceFormField, textAlign: 'left' }}
                          rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Địa chỉ email không đúng định dạng' },
                          ]}
                        >
                          <Input
                            prefix={<MailOutlined style={inputPrefixStyle} />}
                            placeholder="Nhập email"
                            autoComplete="email"
                            spellCheck={false}
                            autoCorrect="off"
                            autoCapitalize="off"
                            style={inputPillStyle}
                          />
                        </Form.Item>
                      </Col>

                      {/* Đơn vị */}
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="orgUnitId"
                          {...labelProps('Đơn vị')}
                          style={{ marginBottom: spaceFormField, textAlign: 'left' }}
                          rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
                        >
                          <OrgUnitTreeSelect
                            organizations={orgUnits}
                            variant="form"
                            placeholder="Chọn đơn vị"
                            allowClear
                            loading={loadingOrgs}
                            style={{ borderRadius: radiusPill, height: 40 }}
                          />
                        </Form.Item>
                      </Col>

                      {/* Phòng ban */}
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="department"
                          {...labelProps('Phòng ban')}
                          style={{ marginBottom: spaceFormField, textAlign: 'left' }}
                          rules={[{ max: 100, message: 'Phòng ban tối đa 100 ký tự' }]}
                        >
                          <Input
                            prefix={<ApartmentOutlined style={inputPrefixStyle} />}
                            placeholder="Nhập phòng ban"
                            maxLength={100}
                            spellCheck={false}
                            style={inputPillStyle}
                          />
                        </Form.Item>
                      </Col>

                      {/* Chức vụ */}
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="position"
                          {...labelProps('Chức vụ')}
                          style={{ marginBottom: spaceFormField, textAlign: 'left' }}
                          rules={[{ max: 100, message: 'Chức vụ tối đa 100 ký tự' }]}
                        >
                          <Input
                            prefix={<IdcardOutlined style={inputPrefixStyle} />}
                            placeholder="Nhập chức vụ"
                            maxLength={100}
                            spellCheck={false}
                            style={inputPillStyle}
                          />
                        </Form.Item>
                      </Col>

                      {/* Mật khẩu */}
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="password"
                          {...labelProps('Mật khẩu')}
                          style={{ marginBottom: password ? 8 : spaceFormField, textAlign: 'left' }}
                          rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu' },
                            {
                              min: minLen,
                              message: `Mật khẩu phải có tối thiểu ${minLen} ký tự`,
                            },
                          ]}
                        >
                          <Input.Password
                            prefix={<LockOutlined style={inputPrefixStyle} />}
                            placeholder="Nhập mật khẩu"
                            autoComplete="new-password"
                            spellCheck={false}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputPillStyle}
                          />
                        </Form.Item>
                      </Col>

                      {/* Xác nhận mật khẩu */}
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="confirmPassword"
                          {...labelProps('Xác nhận mật khẩu')}
                          dependencies={['password']}
                          style={{ marginBottom: password ? 8 : spaceFormField, textAlign: 'left' }}
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
                            prefix={<LockOutlined style={inputPrefixStyle} />}
                            placeholder="Nhập lại mật khẩu"
                            autoComplete="new-password"
                            spellCheck={false}
                            style={inputPillStyle}
                          />
                        </Form.Item>
                      </Col>

                      {/* Password strength indicator (sleek inline indicator) */}
                      {password && (
                        <Col span={24}>
                          <div
                            style={{
                              background: 'rgba(11,46,79,0.03)',
                              borderRadius: radiusMd,
                              padding: '10px 16px',
                              marginBottom: 10,
                              border: `1px solid ${borderDefault}`,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: fontSizeSm,
                                marginBottom: 4,
                              }}
                            >
                              <span style={{ color: textSecondary, fontSize: fontSizeSm, fontFamily: fontSans }}>
                                Độ mạnh mật khẩu: <strong style={{ color: strengthColor }}>{strengthLabel}</strong>
                              </span>
                              <div style={{ width: 140 }}>
                                <Progress
                                  percent={strengthScore}
                                  showInfo={false}
                                  strokeColor={strengthColor}
                                  size="small"
                                  style={{ margin: 0 }}
                                />
                              </div>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '2px 10px',
                                fontSize: 11,
                                fontFamily: fontSans,
                              }}
                            >
                              <span style={{ color: hasMinLength ? statusOperational : textTertiary }}>
                                {hasMinLength ? <CheckCircleOutlined /> : <CloseCircleOutlined />} ≥ {minLen} ký tự
                              </span>
                              <span style={{ color: hasUpper ? statusOperational : textTertiary }}>
                                {hasUpper ? <CheckCircleOutlined /> : <CloseCircleOutlined />} Chữ hoa (A-Z)
                              </span>
                              <span style={{ color: hasLower ? statusOperational : textTertiary }}>
                                {hasLower ? <CheckCircleOutlined /> : <CloseCircleOutlined />} Chữ thường (a-z)
                              </span>
                              <span style={{ color: hasDigit ? statusOperational : textTertiary }}>
                                {hasDigit ? <CheckCircleOutlined /> : <CloseCircleOutlined />} Chữ số (0-9)
                              </span>
                              <span style={{ color: hasSpecial ? statusOperational : textTertiary }}>
                                {hasSpecial ? <CheckCircleOutlined /> : <CloseCircleOutlined />} Ký tự đặc biệt (!@#$%...)
                              </span>
                            </div>
                          </div>
                        </Col>
                      )}

                      {/* Submit button & Back to Login */}
                      <Col span={24}>
                        <Form.Item style={{ marginTop: 8, marginBottom: 4 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            block
                            style={{
                              borderRadius: radiusPill,
                              height: 44,
                              fontSize: fontSizeMd,
                              fontWeight: fontWeightBold,
                              fontFamily: fontSans,
                              background: actionPrimary,
                              borderColor: actionPrimary,
                              boxShadow: '0 2px 8px rgba(39, 62, 124, 0.28)',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!submitting) {
                                e.currentTarget.style.background = actionHover;
                                e.currentTarget.style.borderColor = actionHover;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!submitting) {
                                e.currentTarget.style.background = actionPrimary;
                                e.currentTarget.style.borderColor = actionPrimary;
                              }
                            }}
                          >
                            Gửi yêu cầu đăng ký
                          </Button>
                        </Form.Item>
                        <div
                          style={{
                            textAlign: 'center',
                            marginTop: 12,
                            fontSize: fontSizeMd,
                            fontFamily: fontSans,
                            color: textSecondary,
                          }}
                        >
                          Đã có tài khoản?{' '}
                          <span
                            onClick={() => navigate('/login')}
                            style={{
                              color: actionPrimary,
                              fontWeight: fontWeightBold,
                              fontFamily: fontSans,
                              cursor: 'pointer',
                              transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = actionHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = actionPrimary)}
                          >
                            Đăng nhập
                          </span>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </>
              )}
            </div>
          </div>

          {/* Footer — đồng bộ chuẩn màn đăng nhập */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              marginTop: 14,
              fontSize: fontSizeSm,
              fontFamily: fontSans,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.02em',
            }}
          >
            © 2026 Cục Hàng hải Việt Nam
          </div>
        </div>
      </div>
    </ThemeTokenProvider>
  );
}
