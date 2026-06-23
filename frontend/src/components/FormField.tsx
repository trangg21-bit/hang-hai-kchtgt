import { Form, Input, Select, InputNumber, DatePicker, Switch, Tooltip } from 'antd';
import { InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { FormItemProps, SelectProps } from 'antd';
import dayjs from 'dayjs';

interface BaseFormFieldProps extends Omit<FormItemProps, 'label' | 'help' | 'hasFeedback'> {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  help?: string;
}

interface TextInputField extends BaseFormFieldProps {
  type?: 'text' | 'textarea' | 'email' | 'password' | 'phone' | 'number' | 'url';
  placeholder?: string;
  maxLength?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  showPassword?: boolean;
}

interface SelectField extends BaseFormFieldProps {
  type: 'select';
  options: SelectProps['options'];
  mode?: 'multiple' | 'tags';
  placeholder?: string;
  allowClear?: boolean;
  searchable?: boolean;
  maxCount?: number;
}

interface NumberField extends BaseFormFieldProps {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  addonAfter?: React.ReactNode;
}

interface SwitchField extends BaseFormFieldProps {
  type: 'switch';
  checkedChildren?: React.ReactNode;
  unCheckedChildren?: React.ReactNode;
}

interface DatePickerField extends BaseFormFieldProps {
  type: 'date';
  placeholder?: string;
  format?: string;
  showTime?: boolean;
}

type FormFieldProps = TextInputField | SelectField | NumberField | SwitchField | DatePickerField;

/**
 * FormField — form field component v?i:
 * - Realtime validation (d?ng các rules c?a antd Form.Item)
 * - Error display d?i?u tr?n field
 * - Disabled submit + loading state
 * - Help text v?i icon info
 */
export default function FormField(props: FormFieldProps) {
  const { name, label, required = false, disabled = false, help, ...rest } = props;
  const { type = 'text' } = props;

  const rules = rest.rules || [];

  // Auto-add required rule if marked required
  if (required && !rules.some((r) => r.required)) {
    rules.unshift({ required: true, message: `Vui lòng nhập ${label.toLowerCase()}` });
  }

  const fieldProps: Record<string, unknown> = { name, disabled, placeholder: props.placeholder };

  // Type-specific field props
  switch (type) {
    case 'text':
    case 'email':
    case 'password':
    case 'phone':
    case 'url':
      fieldProps.maxLength = props.maxLength;
      if (type === 'password' && (props as TextInputField).showPassword) {
        (fieldProps as any).type = 'password';
      }
      break;
    case 'textarea':
      (fieldProps as any).rows = 4;
      fieldProps.maxLength = props.maxLength;
      break;
    case 'number':
      fieldProps.min = (props as NumberField).min;
      fieldProps.max = (props as NumberField).max;
      fieldProps.step = (props as NumberField).step || 1;
      break;
  }

  // Render label with help tooltip
  const renderLabel = () => (
    <span>
      {label}
      {help && (
        <Tooltip title={help}>
          <InfoCircleOutlined
            style={{ marginLeft: 6, color: '#999', cursor: 'help' }}
          />
        </Tooltip>
      )}
      {required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
    </span>
  );

  // Render the input based on type
  const renderInput = () => {
    switch (type) {
      case 'select': {
        const selectProps: SelectProps = {
          ...fieldProps,
          options: (props as SelectField).options,
          mode: (props as SelectField).mode,
          allowClear: (props as SelectField).allowClear !== false,
          showSearch: (props as SelectField).searchable !== false,
          maxCount: (props as SelectField).maxCount,
        };
        return <Select {...selectProps} />;
      }
      case 'number':
        return (
          <InputNumber
            {...fieldProps}
            min={(props as NumberField).min}
            max={(props as NumberField).max}
            step={(props as NumberField).step}
            addonAfter={(props as NumberField).addonAfter}
            style={{ width: '100%' }}
          />
        );
      case 'switch':
        return (
          <Switch
            checkedChildren={(props as SwitchField).checkedChildren}
            unCheckedChildren={(props as SwitchField).unCheckedChildren}
          />
        );
      case 'date': {
        const dp = props as DatePickerField;
        return (
          <DatePicker
            placeholder={dp.placeholder}
            format={dp.format || 'DD/MM/YYYY'}
            showTime={dp.showTime}
            style={{ width: '100%' }}
          />
        );
      }
      case 'textarea':
        return <Input.TextArea {...fieldProps} />;
      case 'password':
        return <Input.Password {...fieldProps} placeholder={props.placeholder} />;
      case 'email':
        return <Input type="email" {...fieldProps} placeholder={props.placeholder} />;
      default:
        return (
          <Input
            {...fieldProps}
            prefix={(props as TextInputField).prefix}
            suffix={(props as TextInputField).suffix}
            addonBefore={(props as TextInputField).addonBefore}
            addonAfter={(props as TextInputField).addonAfter}
          />
        );
    }
  };

  return (
    <Form.Item
      name={name}
      label={renderLabel()}
      rules={[
        ...rules,
        // Validate phone if type is phone
        ...(type === 'phone'
          ? [{ pattern: /^(0\d{9,10})?$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]
          : []),
        // Validate email if type is email
        ...(type === 'email'
          ? [{ type: 'email', message: 'Email không hợp lệ' }]
          : []),
      ]}
      help={help || undefined}
      hasFeedback={type === 'phone' || type === 'email'}
      validateStatus={
        type === 'phone' || type === 'email' ? undefined : undefined
      }
    >
      {renderInput()}
    </Form.Item>
  );
}

export type {
  TextInputField,
  SelectField,
  NumberField,
  SwitchField,
  DatePickerField,
};
