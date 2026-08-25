import React from 'react';
import { Drawer, Button, Grid } from 'antd';
import type { DrawerProps } from 'antd';
import {
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  radiusPill,
  primaryButtonStyle,
  outlineButtonStyle,
} from '../../tokens';

const { useBreakpoint } = Grid;

export interface AppDrawerProps extends Omit<DrawerProps, 'title' | 'footer'> {
  title: React.ReactNode;
  open: boolean;
  onClose: () => void;
  /** 
   * Tỉ lệ % chiều rộng màn hình: 
   * - 'sm' (~40%-45%)
   * - 'md' (~55%-65% - mặc định cho form chuẩn)
   * - 'lg' (~75%-80% - cho form nhiều tab/bảng)
   * - 'xl' (~90%)
   * - 'full' (100%)
   * Hoặc truyền chuỗi % tùy chỉnh như '65%'
   */
  drawerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | string;
  /** Custom footer node, hoặc false/null để ẩn */
  footer?: React.ReactNode;
  /** Quick action callback: khi truyền onOk sẽ tự sinh bộ nút [Hủy] + [Lưu/Tạo mới] chuẩn */
  onOk?: () => void;
  okText?: string;
  okLoading?: boolean;
  cancelText?: string;
}

/**
 * AppDrawer — Component Drawer dùng chung chuẩn toàn hệ thống.
 * Tự động tính toán tỉ lệ % màn hình (responsive) theo độ phân giải thiết bị:
 * - Mobile (< 768px): 100%
 * - Tablet / Màn hình nhỏ (< 1200px): 80% - 85%
 * - Laptop / Màn hình chuẩn (1200px - 1600px): 58% - 65%
 * - Màn hình lớn (>= 1600px): 50% - 55%
 */
export const AppDrawer: React.FC<AppDrawerProps> = ({
  title,
  open,
  onClose,
  drawerSize = 'md',
  width,
  footer,
  onOk,
  okText = 'Lưu thông tin',
  okLoading = false,
  cancelText = 'Hủy',
  children,
  extra,
  ...rest
}) => {
  const screens = useBreakpoint();

  // Tính toán responsive width theo tỉ lệ % màn hình
  const getResponsiveWidth = (): string | number => {
    // Nếu truyền prop width trực tiếp thì ưu tiên
    if (width) return width;

    // Mobile / Tablet nhỏ: Full 100% hoặc 80%
    if (!screens.md) return '100%';
    if (!screens.lg) return '80%';

    // Desktop: tính theo preset tỉ lệ %
    switch (drawerSize) {
      case 'sm':
        return screens.xxl ? '30%' : screens.xl ? '35%' : '40%';
      case 'lg':
        return screens.xxl ? '60%' : screens.xl ? '65%' : '70%';
      case 'xl':
        return '85%';
      case 'full':
        return '100%';
      case 'md':
      default:
        if (typeof drawerSize === 'string' && drawerSize.endsWith('%')) {
          return drawerSize;
        }
        // Mặc định 'md': 50% màn hình
        return screens.xl ? '50%' : '55%';
    }
  };

  const calculatedWidth = getResponsiveWidth();

  const headerExtra = extra ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {extra}
      <Button type="text" onClick={onClose} style={drawerCloseBtnStyle}>
        ✕
      </Button>
    </div>
  ) : (
    <Button type="text" onClick={onClose} style={drawerCloseBtnStyle}>
      ✕
    </Button>
  );

  let renderedFooter: React.ReactNode = null;
  if (footer !== undefined) {
    renderedFooter = footer ? <div style={drawerFooterStyle}>{footer}</div> : null;
  } else if (onOk) {
    renderedFooter = (
      <div style={drawerFooterStyle}>
        <Button
          style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
          onClick={onClose}
        >
          {cancelText}
        </Button>
        <Button
          type="primary"
          loading={okLoading}
          style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
          onClick={onOk}
        >
          {okText}
        </Button>
      </div>
    );
  }

  return (
    <Drawer
      {...drawerProps}
      size={calculatedWidth}
      destroyOnHidden
      open={open}
      onClose={onClose}
      title={typeof title === 'string' ? <span style={drawerTitleStyle}>{title}</span> : title}
      extra={headerExtra}
      footer={renderedFooter}
      {...rest}
    >
      {children}
    </Drawer>
  );
};

export default AppDrawer;
