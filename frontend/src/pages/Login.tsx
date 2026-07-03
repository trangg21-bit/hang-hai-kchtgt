import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, Form, Input, Button, Typography, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { LoginRequest } from '../types/auth';

const { Title, Text } = Typography;

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
      className="page"
      onMouseMove={handleMouseMove}
    >
      {/* ===== CSS Variables + Animations + Decorative Layers ===== */}
      <style>{`
        :root{
          --brand-blue:#386CF9;
          --brand-blue-dark:#2E5CE0;
          --ink:#1F2A44;
          --cyan:#5FD4E8;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;font-family:-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;}

        /* ===== Page ===== */
        .page{
          position:relative; min-height:100vh;
          display:flex; align-items:center; justify-content:center;
          overflow:hidden;
          background-image:url('/images/preview.webp');
          background-size:cover;
          background-position:center;
        }

        /* lớp phủ tối tổng thể */
        .tint{ position:absolute; inset:0; z-index:1;
          background:linear-gradient(180deg, rgba(6,16,36,0.55) 0%, rgba(6,16,36,0.25) 35%, rgba(6,16,36,0.55) 100%);
        }

        /* vùng tối thêm ngay sau card để chữ luôn rõ */
        .focus-veil{
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:680px; height:680px; border-radius:50%; z-index:1;
          background:radial-gradient(circle, rgba(4,10,24,0.55) 0%, rgba(4,10,24,0) 66%);
        }

        /* grid công nghệ */
        .grid{ position:absolute; inset:0; z-index:1; opacity:.14;
          background-image:linear-gradient(rgba(95,212,232,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(95,212,232,0.5) 1px, transparent 1px);
          background-size:56px 56px;
          mask-image:linear-gradient(180deg, black, transparent 70%);
          -webkit-mask-image:linear-gradient(180deg, black, transparent 70%);
        }

        /* radar */
        .radar{ position:absolute; z-index:2; top:8%; right:11%; width:160px; height:160px; opacity:.6; }
        .radar circle{ fill:none; stroke:var(--cyan); }
        .radar .sweep{ transform-origin:80px 80px; animation:spin 4.5s linear infinite; }
        @keyframes spin{ to{ transform:rotate(360deg); } }
        @media (prefers-reduced-motion:reduce){ .radar .sweep{ animation:none; } }
        @media (max-width:760px){ .radar{ display:none; } }

        /* track */
        .track{ position:absolute; z-index:2; opacity:.5; }
        .track path{ fill:none; stroke:var(--cyan); stroke-width:1; stroke-dasharray:3 5; }
        @media (max-width:760px){ .track{ display:none; } }

        /* pulse dots */
        .pulse{ position:absolute; width:6px; height:6px; border-radius:50%; background:var(--cyan); z-index:2; }
        .pulse::after{ content:""; position:absolute; inset:-6px; border-radius:50%; border:1px solid var(--cyan);
          animation:ping 2.4s ease-out infinite; }
        @keyframes ping{ 0%{ transform:scale(.4); opacity:.8;} 100%{ transform:scale(2.6); opacity:0;} }
        @media (prefers-reduced-motion:reduce){ .pulse::after{ animation:none; } }

        /* ===== Card (từ mẫu) ===== */
        .card{
          position:relative; z-index:3;
          width:410px; max-width:92vw;
          background:rgba(255,255,255,0.97);
          border-radius:16px;
          box-shadow:0 30px 70px rgba(3,10,25,0.55);
          overflow:hidden;
        }
        .card-top{ height:3px; background:var(--brand-blue); }
        .card-body{ padding:32px 30px 26px; text-align:center; }

        /* Logo */
        .logo{
          width:64px; height:48px; margin:0 auto 12px; display:flex; align-items:center; justify-content:center;
          border-radius:0; background:transparent;
        }
        .logo img{ width:64px; height:48px; object-fit:contain; display:block; }
        .logo .logo-fallback{ line-height:1.2; text-align:center; }

        h1{ font-size:19px; font-weight:700; color:var(--ink); }
        .sub{ font-size:12px; color:#8a8f98; margin-top:4px; }
        hr{ border:none; border-top:1px solid #eee; margin:18px 0; }

        /* Field wrapper — antd Form.Item + label + input */
        .field{ text-align:left; margin-bottom:14px; }
        .field label{ font-size:12.5px; color:#333; display:block; margin-bottom:6px; }
        .field label .req{ color:#e5484d; }

        /* Forgot */
        .forgot{ text-align:right; font-size:12.5px; color:var(--brand-blue); margin-bottom:14px; cursor:pointer; user-select:none; }
        .forgot:hover{ text-decoration:underline; }

        /* Button (sample style) */
        .btn{
          width:100%; height:42px; border:none; border-radius:8px;
          color:#fff; font-size:14.5px; font-weight:600;
          background:var(--brand-blue); cursor:pointer;
        }
        .btn:hover{ background:var(--brand-blue-dark); }
        .btn-secondary{
          height:42px; border:1px solid #dcdfe6; border-radius:8px;
          background:#fff; color:#333; font-size:14px; cursor:pointer;
        }
        .btn-secondary:hover{ border-color:var(--brand-blue); color:var(--brand-blue); }

        /* Footer */
        .footer{
          position:relative; z-index:3; margin-top:14px;
          font-size:11.5px; color:rgba(255,255,255,0.75);
        }
        .wrap-col{ display:flex; flex-direction:column; align-items:center; padding:24px 16px; }

        /* ===== Antd Overrides (để khớp mẫu) ===== */
        .login-form .ant-form-vertical .ant-form-item-label{ padding:0; }
        .login-form .ant-form-vertical .ant-form-item-label > label{
          font-size:12.5px; color:#333; font-weight:400;
        }
        .login-form .ant-form-vertical .ant-form-item-label > label .req{ color:#e5484d; }
        .login-form .ant-input{
          height:40px; border:1px solid #dcdfe6; border-radius:8px;
          padding:0 12px; font-size:14px; color:#333;
        }
        .login-form .ant-input:focus,
        .login-form .ant-input-focused{
          border-color:var(--brand-blue); box-shadow:0 0 0 3px rgba(56,108,249,0.12);
        }
        .login-form .ant-input-password .ant-input{ height:40px; }
        .login-form .ant-btn-primary{
          height:42px; font-size:14.5px; font-weight:600; border:none;
          background:var(--brand-blue); border-radius:8px;
        }
        .login-form .ant-btn-primary:hover{ background:var(--brand-blue-dark); }
        .login-form .ant-btn-link{
          color:var(--brand-blue); font-size:12.5px; height:auto; padding:0; line-height:1;
        }
        .login-form .ant-alert{ margin-bottom:14px; }
        .login-form .ant-divider{ margin:18px 0; }

        /* Card từ antd — override để khớp mẫu */
        .login-card{
          width:410px !important;
          background:transparent !important;
          border:none !important;
          box-shadow:none !important;
        }
        .login-card > .ant-card-body{
          padding:0 !important;
        }
        .login-card .ant-card-head{ display:none !important; }

        @media (max-width:480px){
          .card{ width:100%; }
          .card-body{ padding:26px 22px 22px; }
          h1{ font-size:17px; }
        }
      `}</style>

      {/* ===== 1. Background Layers (từ mẫu) ===== */}
      <div className="tint" />
      <div className="grid" />
      <div className="focus-veil" />

      {/* ===== 2. Radar SVG ===== */}
      <svg className="radar" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="80" r="66" strokeWidth="1" opacity=".5" />
        <circle cx="80" cy="80" r="44" strokeWidth="1" opacity=".4" />
        <circle cx="80" cy="80" r="22" strokeWidth="1" opacity=".3" />
        <g className="sweep">
          <path d="M80,80 L80,14 A66,66 0 0,1 129,52 Z" fill="var(--cyan)" opacity=".16" />
        </g>
      </svg>

      {/* ===== 3. Track SVG ===== */}
      <svg className="track" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <path d="M120,90 C260,60 340,110 430,150" />
        <path d="M1400,140 C1300,180 1260,220 1180,240" />
      </svg>

      {/* ===== 4. Pulse Dots ===== */}
      <div className="pulse" style={{ top: '12%', left: '22%' }} />
      <div className="pulse" style={{ top: '16%', right: '19%' }} />
      <div className="pulse" style={{ bottom: '26%', left: '9%' }} />

      {/* ===== 5. Card + Form (giữ nguyên logic antd) ===== */}
      <div className="wrap-col">
        <Card className="login-card">
          <div className="card">
            <div className="card-top" />
            <div className="card-body">

              {/* Logo */}
              <div className="logo" style={{ width: 64, height: 48, borderRadius: 0, background: 'transparent', margin: '0 auto 12px' }}>
                <img
                  src="/images/logo-hai.png"
                  alt="Cục Hàng hải Việt Nam"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).parentElement;
                    if (fallback && !fallback.querySelector('.logo-fallback')) {
                      const span = document.createElement('span');
                      span.className = 'logo-fallback';
                      span.style.cssText = 'font-size:10px;font-weight:600;color:var(--brand-blue);line-height:1.2;text-align:center;';
                      span.textContent = 'LOGO\nTHẬT';
                      fallback.appendChild(span);
                    }
                  }}
                />
              </div>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '19px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35 }}>
                  Hệ thống thông tin
                  <br />
                  Quản lý kết cấu hạ tầng giao thông Hàng Hải
                </div>
              </div>
              <hr />

              {/* ---- Form ---- */}
              {showTotp ? (
                /* ===== TOTP ===== */
                <div className="login-form">
                  <Alert
                    message="Xác thực 2 bước"
                    description="Vui lòng nhập mã TOTP từ ứng dụng xác thực của bạn"
                    type="info"
                    icon={<SafetyOutlined />}
                  />
                  <div className="field">
                    <label>
                      <span className="req">*</span> Mã TOTP
                    </label>
                    <Input
                      placeholder="Nhập mã 6 chữ số"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Button className="btn-secondary" onClick={handleBackToLogin}>
                      Quay lại
                    </Button>
                    <Button
                      type="primary"
                      className="btn"
                      onClick={handleTotpVerify}
                      loading={submitting}
                    >
                      Xác thực
                    </Button>
                  </div>
                </div>
              ) : (
                /* ===== Login Form ===== */
                <Form
                  layout="vertical"
                  onFinish={handleLogin}
                  className="login-form"
                  initialValues={{ identifier: 'admin', password: 'admin123' }}
                >
                  <Form.Item
                    name="identifier"
                    label="Email"
                    rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Nhập email, số điện thoại hoặc tên đăng nhập" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                  </Form.Item>

                  <div className="forgot" onClick={() => navigate('/forgot-password')}>
                    Quên mật khẩu?
                  </div>

                  <button type="submit" className="btn" disabled={submitting}>
                    Đăng nhập
                  </button>
                </Form>
              )}

            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="footer">© 2026 Cục Hàng hải Việt Nam</div>
      </div>
    </div>
  );
}
