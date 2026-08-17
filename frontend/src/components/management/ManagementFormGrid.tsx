import type { ReactNode } from 'react';
import { Col, Row } from 'antd';
import type { ColProps } from 'antd';
import { spaceMd } from '../../tokens';

export interface ManagementFormGridProps {
  children: ReactNode;
}

/** Lưới form chuẩn: hai cột trên desktop, tự xếp một cột trên màn hình hẹp. */
export function ManagementFormGrid({ children }: ManagementFormGridProps) {
  return <Row gutter={spaceMd}>{children}</Row>;
}

export interface ManagementFormFieldProps extends Pick<ColProps, 'span'> {
  children: ReactNode;
}

export function ManagementFormField({ children, span = 12 }: ManagementFormFieldProps) {
  return <Col xs={24} md={span}>{children}</Col>;
}
