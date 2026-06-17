import { message, type MessageArgsProps } from 'antd';
import type { ToastType } from '../types/common';

// Map ToastType → Ant Design message type
const typeMap: Record<ToastType, NonNullable<MessageArgsProps['type']>> = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

/**
 * ToastNotification — wrapper xung quanh antd message,
 * chuẩn hóa success/error/info/toast feedback throughout app.
 */
export const toast = {
  success: (msg: string, duration = 3) =>
    message.success({ content: msg, duration, type: typeMap.success }),

  error: (msg: string, duration = 5) =>
    message.error({ content: msg, duration, type: typeMap.error }),

  info: (msg: string, duration = 3) =>
    message.info({ content: msg, duration, type: typeMap.info }),

  warning: (msg: string, duration = 3) =>
    message.warning({ content: msg, duration, type: typeMap.warning }),
};

export default toast;
