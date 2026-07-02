import { InputNumber, Form } from 'antd';
import type { FormItemProps } from 'antd';

interface CoordinateInputProps extends Omit<FormItemProps, 'children'> {
  label: string;
  name: string;
  type: 'longitude' | 'latitude';
  placeholder?: string;
}

export default function CoordinateInput({
  label,
  name,
  type,
  placeholder,
  ...formItemProps
}: CoordinateInputProps) {
  const isLongitude = type === 'longitude';
  const min = isLongitude ? -180 : -90;
  const max = isLongitude ? 180 : 90;
  const errorMsg = isLongitude ? 'Kinh độ phải trong khoảng -180 đến 180' : 'Vĩ độ phải trong khoảng -90 đến 90';

  const validator = (_: unknown, value: number | null | undefined) => {
    if (!value && value !== 0) return Promise.resolve();
    if (value !== null && value !== undefined && (value < min || value > max)) {
      return Promise.reject(errorMsg);
    }
    return Promise.resolve();
  };

  return (
    <Form.Item
      {...formItemProps}
      label={label}
      name={name}
      rules={[
        { validator },
      ]}
      validateTrigger="onChange"
    >
      <InputNumber
        placeholder={placeholder}
        min={min}
        max={max}
        step={0.000001}
        precision={6}
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
}
