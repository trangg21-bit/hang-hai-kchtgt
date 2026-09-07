/**
 * InputDecimal — ô nhập số thập phân (chỉ tiêu sản lượng) theo UI convention:
 * InputNumber AntD, border radiusPill, height 40, min 0, precision 2 (hoặc 0 khi integer).
 * EN component name / VI không cần nhãn — nhãn do Form.Item cung cấp.
 */
import React from 'react';
import { InputNumber } from 'antd';
import type { InputNumberProps } from 'antd';
import { radiusPill, inputStyle } from '../themetokenchk';

export interface InputDecimalProps extends Omit<InputNumberProps, 'onChange'> {
  /** Số nguyên (passenger_trips) — precision 0; mặc định thập phân precision 2. */
  integer?: boolean;
  /** Trả về number ổn định: null → 0; âm → 0 (giá trị bắt buộc ≥ 0). */
  onChange?: (value: number | null) => void;
}

/** Chuẩn hóa đầu vào: cấm NULL (mặc định 0) và cấm giá trị âm. */
const normalize = (value: number | string | null | undefined, integer: boolean): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) return null;
  return num < 0 ? 0 : integer ? Math.trunc(num) : num;
};

const InputDecimal: React.FC<InputDecimalProps> = ({ integer = false, onChange, style, ...rest }) => (
  <InputNumber
    {...rest}
    min={0}
    precision={integer ? 0 : 2}
    step={integer ? 1 : 0.01}
    controls={false}
    style={{ ...inputStyle, width: '100%', height: 40, borderRadius: radiusPill, ...style }}
    onChange={(value) => onChange?.(normalize(value, integer))}
  />
);

export default InputDecimal;
