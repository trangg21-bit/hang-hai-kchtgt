import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let lastErrorMsg = '';
let lastErrorTime = 0;

const showUniqueError = (msg: string) => {
  const now = Date.now();
  if (msg === lastErrorMsg && now - lastErrorTime < 1000) {
    return;
  }
  lastErrorMsg = msg;
  lastErrorTime = now;
  message.error(msg);
};

// Response interceptor — global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    let friendlyMsg = 'Có lỗi xảy ra, vui lòng thử lại.';

    if (error.message === 'Network Error') {
      friendlyMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
    } else if (status === 400) {
      const serverMsg = error.response?.data?.message;
      if (serverMsg === 'Account is locked') {
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
      const token = localStorage.getItem('auth_token');
      friendlyMsg = token 
        ? 'Bạn không có quyền thực hiện hành động này.' 
        : 'Vui lòng đăng nhập để tiếp tục.';
    } else if (status === 404) {
      friendlyMsg = error.response?.data?.message || 'Không tìm thấy tài nguyên yêu cầu (404).';
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

    const isAuthRequest = error.config?.url?.includes('/auth/login');

    if (status === 401) {
      if (!isAuthRequest) {
        showUniqueError(friendlyMsg);
      }
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
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
        if (!isAuthRequest) {
          showUniqueError(friendlyMsg);
        }
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      } else {
        if (!isAuthRequest) {
          showUniqueError(friendlyMsg);
        }
      }
    } else {
      if (!isAuthRequest) {
        showUniqueError(friendlyMsg);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
