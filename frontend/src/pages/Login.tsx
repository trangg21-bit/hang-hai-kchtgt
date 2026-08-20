import { useState, useCallback, useEffect, useRef } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { message } from '../components/ToastNotification';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { LoginRequest } from '../types/auth';
import {
  radiusPill,
  radiusLg,
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
  actionPrimary,
  textPrimary,
  textSecondary,
  surfaceCard,
  borderDefault,
} from '../tokens';
import { colors, fontFamily } from '../theme';

interface MfaChallengeData {
  requiresMfa: boolean;
  userId: string;
  challengeId?: string;
  skipTotp: boolean;
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

/** Consistent label style — same pattern as UsersPage.tsx */
const labelProps = (text: string) => ({
  label: (
    <span style={{ color: textPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeLg }}>
      {text}
    </span>
  ),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const bgRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [userId, setUserId] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // ---- Parallax ----
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMouse({
      x: (e.clientX / window.innerWidth - 0.5) * 6,
      y: (e.clientY / window.innerHeight - 0.5) * 6,
    });
  }, []);

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

      // Save last successfully used username for browser auto-fill mapping
      localStorage.setItem('last_username', values.identifier);

      const mfaData = data as MfaChallengeData;
      if (mfaData.requiresMfa && !mfaData.skipTotp) {
        setUserId(mfaData.userId || '');
        setShowTotp(true);
        message.info('Vui lòng nhập mã TOTP');
        setSubmitting(false);
        return;
      }

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
      ref={bgRef}
      onMouseMove={handleMouseMove}
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
        fontFamily,
      }}
    >
      {/* ===== Decorative CSS — background effects only ===== */}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;}

        .tint{ position:absolute; inset:0; z-index:1;
          background:linear-gradient(180deg, rgba(6,16,36,0.55) 0%, rgba(6,16,36,0.25) 35%, rgba(6,16,36,0.55) 100%);
        }
        .focus-veil{
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:680px; height:680px; border-radius:50%; z-index:1;
          background:radial-gradient(circle, rgba(4,10,24,0.55) 0%, rgba(4,10,24,0) 66%);
        }
        .grid{ position:absolute; inset:0; z-index:1; opacity:.14;
          background-image:linear-gradient(rgba(95,212,232,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(95,212,232,0.5) 1px, transparent 1px);
          background-size:56px 56px;
          mask-image:linear-gradient(180deg, black, transparent 70%);
          -webkit-mask-image:linear-gradient(180deg, black, transparent 70%);
        }
        .radar{ position:absolute; z-index:2; top:8%; right:11%; width:160px; height:160px; opacity:.6; }
        .radar circle{ fill:none; stroke:#5FD4E8; }
        .radar .sweep{ transform-origin:80px 80px; animation:spin 4.5s linear infinite; }
        @keyframes spin{ to{ transform:rotate(360deg); } }
        @media (prefers-reduced-motion:reduce){ .radar .sweep{ animation:none; } }
        @media (max-width:760px){ .radar{ display:none; } }

        .track{ position:absolute; z-index:2; opacity:.5; }
        .track path{ fill:none; stroke:#5FD4E8; stroke-width:1; stroke-dasharray:3 5; }
        @media (max-width:760px){ .track{ display:none; } }

        .pulse{ position:absolute; width:6px; height:6px; border-radius:50%; background:#5FD4E8; z-index:2; }
        .pulse::after{ content:""; position:absolute; inset:-6px; border-radius:50%; border:1px solid #5FD4E8;
          animation:ping 2.4s ease-out infinite; }
        @keyframes ping{ 0%{ transform:scale(.4); opacity:.8;} 100%{ transform:scale(2.6); opacity:0;} }
        @media (prefers-reduced-motion:reduce){ .pulse::after{ animation:none; } }
      `}</style>

      {/* ===== Background Layers ===== */}
      <div className="tint" />
      <div className="grid" />
      <div className="focus-veil" />

      {/* ===== Radar SVG ===== */}
      <svg className="radar" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="80" r="66" strokeWidth="1" opacity=".5" />
        <circle cx="80" cy="80" r="44" strokeWidth="1" opacity=".4" />
        <circle cx="80" cy="80" r="22" strokeWidth="1" opacity=".3" />
        <g className="sweep">
          <path d="M80,80 L80,14 A66,66 0 0,1 129,52 Z" fill="#5FD4E8" opacity=".16" />
        </g>
      </svg>

      {/* ===== Track SVG ===== */}
      <svg className="track" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <path d="M120,90 C260,60 340,110 430,150" />
        <path d="M1400,140 C1300,180 1260,220 1180,240" />
      </svg>

      {/* ===== Pulse Dots ===== */}
      <div className="pulse" style={{ top: '12%', left: '22%' }} />
      <div className="pulse" style={{ top: '16%', right: '19%' }} />
      <div className="pulse" style={{ bottom: '26%', left: '9%' }} />

      {/* ===== Login Card ===== */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: `${spaceLg}px ${spaceMd}px`,
        }}
      >
        {/* Card container */}
        <div
          style={{
            width: 410,
            maxWidth: '92vw',
            background: surfaceCard,
            borderRadius: radiusLg,
            boxShadow: '0 30px 70px rgba(3,10,25,0.55)',
            overflow: 'hidden',
          }}
        >
          {/* Accent top bar */}
          <div style={{ height: 3, background: actionPrimary }} />

          {/* Card body */}
          <div style={{ padding: '32px 30px 26px', textAlign: 'center' }}>
            {/* Logo */}
            <img
              src="/images/Logo_Cục_Hàng_hải_Việt_Nam.jpg"
              alt="Logo Cục Hàng hải Việt Nam"
              style={{ display: 'block', margin: '0 auto 12px', width: 140, height: 50, objectFit: 'contain' }}
            />

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: spaceXl }}>
              <div
                style={{
                  fontSize: fontSizeXl,
                  fontWeight: fontWeightBold,
                  color: colors.sidebarBg,
                  lineHeight: 1.35,
                }}
              >
                Hệ thống thông tin
                <br />
                Quản lý kết cấu hạ tầng giao thông Hàng Hải
              </div>
            </div>

            {/* ===== Form ===== */}
            {showTotp ? (
              /* ---- TOTP ---- */
              <div style={{ textAlign: 'left' }}>
                <Alert
                  message="Xác thực 2 bước"
                  description="Vui lòng nhập mã TOTP từ ứng dụng xác thực của bạn"
                  type="info"
                  icon={<SafetyOutlined />}
                  style={{ marginBottom: spaceFormField }}
                />
                <Form.Item
                  {...labelProps('Mã TOTP')}
                  required
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input
                    placeholder="Nhập mã 6 chữ số"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button
                    onClick={handleBackToLogin}
                    style={{
                      borderRadius: radiusPill,
                      height: 40,
                      flex: 1,
                      borderColor: borderDefault,
                      color: textSecondary,
                      fontSize: fontSizeLg,
                    }}
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleTotpVerify}
                    loading={submitting}
                    style={{
                      borderRadius: radiusPill,
                      height: 40,
                      flex: 1,
                      fontSize: fontSizeLg,
                      fontWeight: fontWeightBold,
                      background: actionPrimary,
                      borderColor: actionPrimary,
                    }}
                  >
                    Xác thực
                  </Button>
                </div>
              </div>
            ) : (
              /* ---- Login Form ---- */
              <Form
                layout="vertical"
                onFinish={handleLogin}
                initialValues={{ identifier: localStorage.getItem('last_username') || '' }}
                labelCol={{ style: { padding: 0, marginBottom: 4 } }}
              >
                <Form.Item
                  name="identifier"
                  {...labelProps('Tài khoản')}
                  style={{ marginBottom: spaceFormField, textAlign: 'left' }}
                  rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Nhập email hoặc tên đăng nhập"
                    autoComplete="username"
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  {...labelProps('Mật khẩu')}
                  style={{ marginBottom: spaceFormField, textAlign: 'left' }}
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Mật khẩu"
                    autoComplete="current-password"
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>

                <div
                  onClick={() => navigate('/forgot-password')}
                  style={{
                    textAlign: 'right',
                    fontSize: fontSizeLg,
                    color: actionPrimary,
                    marginBottom: spaceFormField,
                    cursor: 'pointer',
                    fontWeight: fontWeightMedium,
                  }}
                >
                  Quên mật khẩu?
                </div>

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
                  }}
                >
                  Đăng nhập
                </Button>
              </Form>
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
  );
}
