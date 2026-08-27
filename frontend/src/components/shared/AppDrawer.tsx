import React from 'react';
import { Drawer, Button, Grid } from 'antd';
import type { DrawerProps } from 'antd';
import { useThemeToken } from '../../context/ThemeTokenContext';

const { useBreakpoint } = Grid;

export interface AppDrawerProps extends Omit<DrawerProps, 'title' | 'footer' | 'size'> {
  title: React.ReactNode;
  open: boolean;
  onClose: () => void;
  /** 
   * Kích thước hoặc Tỉ lệ % chiều rộng màn hình: 
   * - 'sm' (~40%-45%)
   * - 'md' (~55%-65% - mặc định cho form chuẩn)
   * - 'lg' (~75%-80% - cho form nhiều tab/bảng)
   * - 'xl' (~90%)
   * - 'full' (100%)
   * Hoặc truyền chuỗi/số tùy chỉnh như '50%', '65%', 960
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | string | number;
  drawerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | string | number;
  width?: string | number;
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
  drawerSize,
  size: propSize,
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
  const {
    drawerProps,
    drawerTitleStyle,
    drawerCloseBtnStyle,
    drawerFooterStyle,
    buttonRadius,
    primaryButtonStyle,
    outlineButtonStyle,
  } = useThemeToken();

  // Tính toán responsive size theo tỉ lệ % màn hình hoặc giá trị trực tiếp
  const getResponsiveSize = (): string | number => {
    const rawTarget = propSize || drawerSize || width || 'md';

    if (typeof rawTarget === 'number') {
      return rawTarget;
    }

    // Nếu truyền chuỗi số hoặc px hoặc %
    if (typeof rawTarget === 'string') {
      if (/^\d+$/.test(rawTarget)) return Number(rawTarget);
      if (rawTarget.endsWith('px')) return rawTarget;
      if (rawTarget.endsWith('%') && rawTarget !== '100%') {
        if (!screens.md) return '100%';
        if (!screens.lg) return '80%';
        return rawTarget;
      }
    }

    // Mobile / Tablet nhỏ: Full 100% hoặc 80%
    if (!screens.md) return '100%';
    if (!screens.lg) return '80%';

    // Desktop: tính theo preset tỉ lệ %
    switch (rawTarget) {
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
        // Mặc định 'md': 50% màn hình
        return screens.xl ? '50%' : '55%';
    }
  };

  const calculatedWidth = getResponsiveSize();

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
          style={{ ...outlineButtonStyle, borderRadius: buttonRadius, height: 40 }}
          onClick={onClose}
        >
          {cancelText}
        </Button>
        <Button
          type="primary"
          loading={okLoading}
          style={{ ...primaryButtonStyle, borderRadius: buttonRadius, height: 40 }}
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
