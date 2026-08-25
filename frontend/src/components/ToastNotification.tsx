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

const lastToastMap = new Map<string, number>();

const shouldSuppress = (key: string, cooldownMs = 1500): boolean => {
  const now = Date.now();
  const lastTime = lastToastMap.get(key) || 0;
  if (now - lastTime < cooldownMs) {
    return true;
  }
  lastToastMap.set(key, now);
  if (lastToastMap.size > 50) {
    for (const [k, t] of lastToastMap.entries()) {
      if (now - t > 10000) lastToastMap.delete(k);
    }
  }
  return false;
};

/**
 * ToastNotification — wrapper xung quanh antd message,
 * chuẩn hóa success/error/info/toast feedback throughout app.
 * Tích hợp cơ chế tự động chống hiển thị trùng lặp (deduplication).
 */
export const toast = {
  success: (msg: string, duration = 3) => {
    if (!msg || shouldSuppress(`success:${msg}`)) return;
    return (activeMessage || antdMessage).success({ content: msg, duration, type: typeMap.success, key: `success:${msg}` });
  },

  error: (msg: string, duration = 5) => {
    if (!msg || shouldSuppress(`error:${msg}`)) return;
    return (activeMessage || antdMessage).error({ content: msg, duration, type: typeMap.error, key: `error:${msg}` });
  },

  info: (msg: string, duration = 3) => {
    if (!msg || shouldSuppress(`info:${msg}`)) return;
    return (activeMessage || antdMessage).info({ content: msg, duration, type: typeMap.info, key: `info:${msg}` });
  },

  warning: (msg: string, duration = 3) => {
    if (!msg || shouldSuppress(`warning:${msg}`)) return;
    return (activeMessage || antdMessage).warning({ content: msg, duration, type: typeMap.warning, key: `warning:${msg}` });
  },
};

export default toast;
