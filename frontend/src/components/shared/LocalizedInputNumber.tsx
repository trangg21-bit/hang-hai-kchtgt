import { InputNumber as AntInputNumber } from 'antd';
import type { InputNumberProps } from 'antd';
import { fmtInputNumber, parseDotNumber } from '../../utils/numFmt';

/**
 * InputNumber dùng chung cho toàn bộ KCHT hàng hải.
 * Giá trị hiển thị theo vi-VN nhưng giá trị form/API vẫn giữ chuẩn số JavaScript.
 */
export default function LocalizedInputNumber(props: InputNumberProps) {
  const { formatter, parser, decimalSeparator, min, max, ...rest } = props;
  const isYearInput = Number(min) >= 1800 && Number(max) <= 2200;

  return (
    <AntInputNumber
      {...rest}
      min={min}
      max={max}
      decimalSeparator={decimalSeparator ?? ','}
      formatter={formatter ?? (isYearInput ? undefined : fmtInputNumber)}
      parser={parser ?? (isYearInput ? undefined : parseDotNumber)}
    />
  );
}

