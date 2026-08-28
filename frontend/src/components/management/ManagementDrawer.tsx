import type { ReactNode } from 'react';
import { Button, Drawer } from 'antd';
import type { DrawerProps } from 'antd';
import { useThemeToken } from '../../context/ThemeTokenContext';

export interface ManagementDrawerProps extends Omit<DrawerProps, 'title' | 'open' | 'onClose' | 'footer'> {
  title: ReactNode;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}

/** Drawer chuẩn cho các màn CRUD quản trị: header, nút đóng, body scroll và footer cố định. */
export default function ManagementDrawer({
  title,
  open,
  onClose,
  children,
  footer,
  closeLabel = 'Đóng',
  styles,
  ...props
}: ManagementDrawerProps) {
  const {
    borderDefault,
    controlHeight,
    drawerCloseBtnStyle,
    drawerFooterStyle,
    drawerProps,
    drawerTitleStyle,
    spaceMd,
    spaceLg,
  } = useThemeToken();
  return (
    <Drawer
      {...drawerProps}
      {...props}
      title={<span style={drawerTitleStyle}>{title}</span>}
      open={open}
      onClose={onClose}
      extra={
        <Button type="text" aria-label={closeLabel} onClick={onClose} style={drawerCloseBtnStyle}>
          ✕
        </Button>
      }
      styles={{
        ...drawerProps.styles,
        ...styles,
        header: { ...drawerProps.styles.header, ...styles?.header },
        body: { ...drawerProps.styles.body, overflowY: 'auto', ...styles?.body },
        ...(footer ? {
          footer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spaceLg,
            minHeight: controlHeight + spaceMd * 2,
            padding: `${spaceMd}px ${spaceLg}px`,
            borderTop: `1px solid ${borderDefault}`,
            flexShrink: 0,
            ...styles?.footer,
          },
        } : {}),
      }}
      footer={footer ? <div style={drawerFooterStyle}>{footer}</div> : undefined}
    >
      {children}
    </Drawer>
  );
}
