import { message as antdMessage, type MessageArgsProps } from 'antd';
import type { ToastType } from '../types/common';

// Map ToastType → Ant Design message type
const typeMap: Record<ToastType, NonNullable<MessageArgsProps['type']>> = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

let activeMessage = antdMessage;

export const setStaticMessage = (msgInstance: any) => {
  activeMessage = msgInstance;
};

/**
 * ToastNotification — wrapper xung quanh antd message,
 * chuẩn hóa success/error/info/toast feedback throughout app.
 */
export const toast = {
  success: (msg: string, duration = 3) =>
    activeMessage.success({ content: msg, duration, type: typeMap.success }),

  error: (msg: string, duration = 5) =>
    activeMessage.error({ content: msg, duration, type: typeMap.error }),

  info: (msg: string, duration = 3) =>
    activeMessage.info({ content: msg, duration, type: typeMap.info }),

  warning: (msg: string, duration = 3) =>
    activeMessage.warning({ content: msg, duration, type: typeMap.warning }),
};

export default toast;
