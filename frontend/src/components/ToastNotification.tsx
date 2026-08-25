import { message as antdMessage, Modal as antdModal, type MessageArgsProps } from 'antd';
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

// Modal capture with fallback to static antd Modal
let activeModal: any = antdModal;

export const setStaticModal = (modalInstance: any) => {
  activeModal = modalInstance || antdModal;
};

// Live-forwarding proxies over the captured contextual instances.
// Every property access forwards to the CURRENT captured instance at call time,
// and returns a wrapper function so top-level destructured calls (e.g. const { confirm } = modal) work dynamically.
export const message: any = new Proxy({} as any, {
  get: (_target, prop) => {
    const instance = activeMessage || antdMessage;
    const value = Reflect.get(instance, prop);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export const modal: any = new Proxy({} as any, {
  get: (_target, prop) => {
    return (...args: any[]) => {
      const instance = activeModal || antdModal;
      if (instance && typeof instance[prop] === 'function') {
        return instance[prop](...args);
      }
      if (typeof (antdModal as any)[prop] === 'function') {
        return (antdModal as any)[prop](...args);
      }
    };
  },
});

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
