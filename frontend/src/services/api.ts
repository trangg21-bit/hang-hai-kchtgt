import axios from 'axios';
import type { AxiosResponseHeaders, RawAxiosResponseHeaders, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { toast } from '../components/ToastNotification';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token & integration token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.set('X-Integration-Token', import.meta.env.VITE_INTEGRATION_TOKEN || 'integration-secret-token-2026');
    return config;
  },
  (error) => Promise.reject(error),
);

const showUniqueError = (msg: string) => {
  toast.error(msg);
};

const syncNewToken = (
  headers?: AxiosResponseHeaders | RawAxiosResponseHeaders | Record<string, unknown>,
  config?: InternalAxiosRequestConfig | AxiosRequestConfig | { headers?: Record<string, unknown> },
) => {
  if (!headers) return;
  const headerRecord = headers as Record<string, unknown>;
  const newToken = (headerRecord['x-new-token'] || headerRecord['X-New-Token']) as string | undefined;
  if (newToken && typeof newToken === 'string') {
    const authHeader = config?.headers
      ? (config.headers as Record<string, unknown>)['Authorization'] || (config.headers as Record<string, unknown>)['authorization']
      : undefined;
    const reqToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;
    useAuthStore.getState().replaceAccessToken(newToken, reqToken);
  }
};

// Response interceptor — global error handling & token auto-sync
api.interceptors.response.use(
  (response) => {
    syncNewToken(response.headers, response.config);
    return response;
  },
  (error) => {
    syncNewToken(error.response?.headers, error.config);
    console.error('[api] Error:', error.response?.status, error.config?.url, error.response?.data || error.message);
    const status = error.response?.status;
    let friendlyMsg = 'Có lỗi xảy ra, vui lòng thử lại.';

    if (error.message === 'Network Error') {
      friendlyMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
    } else if (status === 400) {
      const serverMsg = error.response?.data?.message;
      const validationData = error.response?.data?.data;
      if (serverMsg === 'Validation failed' && validationData && typeof validationData === 'object') {
        friendlyMsg = Object.values(validationData).join(', ');
      } else if (serverMsg === 'Account is locked') {
        friendlyMsg = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
      } else if (serverMsg?.startsWith('Account is locked until')) {
        friendlyMsg = 'Tài khoản của bạn đang tạm thời bị khóa. Vui lòng thử lại sau.';
      } else if (serverMsg === 'Invalid username or password') {
        friendlyMsg = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
      } else if (serverMsg === 'Invalid TOTP code' || serverMsg === 'Mã TOTP không đúng hoặc hết hạn') {
        friendlyMsg = 'Mã xác thực TOTP không chính xác hoặc đã hết hạn.';
      } else {
        friendlyMsg = serverMsg || 'Yêu cầu không hợp lệ (400).';
      }
    } else if (status === 401) {
      friendlyMsg = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
    } else if (status === 403) {
      const isAuthPath =
        error.config?.url?.includes('/auth/') ||
        error.config?.url?.includes('/register') ||
        error.config?.url?.includes('/forgot-password') ||
        error.config?.url?.includes('/reset-password');
      if (isAuthPath && error.response?.data?.message) {
        friendlyMsg = error.response.data.message;
      } else {
        const token = localStorage.getItem('auth_token');
        friendlyMsg = token
          ? 'Bạn không có quyền thực hiện hành động này.'
          : 'Vui lòng đăng nhập để tiếp tục.';
      }
    } else if (status === 404) {
      friendlyMsg = error.response?.data?.message || 'Không tìm thấy tài nguyên yêu cầu (404).';
    } else if (status === 409) {
      friendlyMsg = error.response?.data?.message || 'Dữ liệu đã tồn tại trong hệ thống (409).';
    } else if (status === 502) {
      friendlyMsg = 'Cổng kết nối bị lỗi hoặc máy chủ đang khởi động lại (502).';
    } else if (status === 503) {
      friendlyMsg = 'Dịch vụ tạm thời không khả dụng (503).';
    } else if (status === 504) {
      friendlyMsg = 'Hết thời gian phản hồi từ máy chủ (504).';
    } else if (status >= 500) {
      friendlyMsg = 'Lỗi hệ thống phía máy chủ. Vui lòng thử lại sau.';
    } else {
      friendlyMsg = error.response?.data?.message || error.message || friendlyMsg;
    }

    // Override the error message property so catch blocks receive the friendly Vietnamese message
    error.message = friendlyMsg;

    const isAuthRequest =
      error.config?.url?.includes('/auth/') ||
      error.config?.url?.includes('/register') ||
      error.config?.url?.includes('/verify') ||
      error.config?.url?.includes('/forgot-password') ||
      error.config?.url?.includes('/reset-password');

    const isPublicAuthPage =
      typeof window !== 'undefined' &&
      (window.location.pathname === '/login' ||
        window.location.pathname === '/register' ||
        window.location.pathname.startsWith('/forgot-password') ||
        window.location.pathname.startsWith('/reset-password'));

    const isDocumentEntityRequest = error.config?.url?.includes('/v1/documents/entity/');
    const isHistoryRequest = error.config?.url?.includes('/history');

    // API danh mục nền (dropdown form): 403 do thiếu quyền module nền là trạng thái chấp nhận được
    // (dropdown rỗng) — không spam toast lỗi mỗi lần mở màn cho user chỉ có quyền module KCHT.
    const isSilentForbiddenPath =
      error.config?.url?.includes('/org-units/') ||
      error.config?.url?.includes('/api/symbols') ||
      error.config?.url?.includes('/vts-operation-center/options') ||
      error.config?.url?.includes('/radar-station');

    // Endpoint /buoy-station/{id}/buoys chưa được backend triển khai — 404 là trạng thái chấp nhận
    // được (tab hiện 'Chưa có dữ liệu'), không spam toast đỏ mỗi lần mở Chi tiết nhà trạm.
    const isStationBuoysRequest =
      error.config?.url?.includes('/buoy-station/') && error.config?.url?.endsWith('/buoys');

    if (status === 401) {
      const isIntegrationRequest = error.config?.url?.includes('/v1/integration/share');
      if (!isIntegrationRequest && !isPublicAuthPage && !isAuthRequest) {
        showUniqueError(friendlyMsg);
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      const serverMsg = error.response?.data?.message;
      if (serverMsg === 'Tai khoan da bi khoa' || serverMsg === 'Tai khoan da bi khoa hoac bi xoa') {
        friendlyMsg = 'Tài khoản của bạn đã bị khóa hoặc đã bị xóa. Vui lòng liên hệ quản trị viên.';
        localStorage.removeItem('auth_token');
        window.location.href = '/login?error=locked';
        error.message = friendlyMsg;
        return Promise.reject(error);
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        if (!isAuthRequest && !isPublicAuthPage) {
          showUniqueError(friendlyMsg);
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      } else {
        if (!isAuthRequest && !isDocumentEntityRequest && !isHistoryRequest && !isSilentForbiddenPath) {
          showUniqueError(friendlyMsg);
        }
      }
    } else {
      if (!isAuthRequest && !isStationBuoysRequest) {
        showUniqueError(friendlyMsg);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
