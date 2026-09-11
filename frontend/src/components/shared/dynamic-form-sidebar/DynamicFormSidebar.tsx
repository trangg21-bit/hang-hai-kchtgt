import React, { useMemo, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Tabs,
  Button,
  Spin,
} from "antd";
import type { FormInstance, Rule } from "antd/es/form";
import { AppDrawer } from "../AppDrawer";
import { OrgUnitTreeSelect } from "../../org-unit";
import { fmtInputNumber } from "../../../utils/numFmt";
import { useThemeToken } from "../../../context/ThemeTokenContext";
import {
  colors,
  actionPrimary,
  fontSizeMd,
  fontWeightBold,
  radiusPill,
  radiusMd,
  spaceFormField,
  readonlyInputStyle,
  drawerTabBarStyle,
  drawerFormScrollStyle,
  getDatePickerProps,
} from "../../../themetokenchk";
import {
  type DynamicFormSidebarProps,
  type FormFieldConfig,
  type FormSectionConfig,
  type FormTabConfig,
  type FormSidebarAction,
  FormFieldType,
} from "./dynamic-form-sidebar.model";

const sectionBoxStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "14px 18px 10px 18px",
  marginBottom: 14,
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: "1px solid #f1f5f9",
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const defaultInputStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};
const defaultSelectStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  width: "100%",
};
const defaultNumberInputStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  width: "100%",
};

function renderFormField<T extends Record<string, unknown>>(
  field: FormFieldConfig<T>,
  form: FormInstance<T>,
  formValues: T,
) {
  if (
    typeof field.hidden === "function"
      ? field.hidden(form, formValues)
      : field.hidden
  ) {
    return null;
  }

  const labelNode = (
    <span
      style={{
        color: colors.sidebarBg,
        fontWeight: fontWeightBold,
        fontSize: fontSizeMd,
      }}
    >
      {field.label}
    </span>
  );

  const rules: Rule[] =
    field.rules ||
    (field.required
      ? [{ required: true, message: `${field.label} là bắt buộc` }]
      : []);

  const labelText = typeof field.label === 'string' ? field.label : '';
  const defaultInputPlaceholder = field.placeholder ?? (labelText ? `Nhập ${labelText}` : undefined);
  const defaultSelectPlaceholder = field.placeholder ?? (labelText ? `Chọn ${labelText}` : 'Chọn...');

  let controlNode: React.ReactNode;

  switch (field.type) {
    case FormFieldType.Number: {
      controlNode = (
        <InputNumber
          min={field.min}
          max={field.max}
          formatter={field.formatter || fmtInputNumber}
          parser={field.parser}
          placeholder={field.placeholder ?? (labelText ? `Nhập ${labelText}` : '0')}
          disabled={field.disabled}
          readOnly={field.readOnly}
          style={{ ...defaultNumberInputStyle, ...field.controlStyle }}
        />
      );
      break;
    }
    case FormFieldType.Select: {
      controlNode = (
        <Select
          allowClear={field.allowClear}
          showSearch={field.showSearch ?? true}
          optionFilterProp="label"
          options={field.options}
          placeholder={defaultSelectPlaceholder}
          disabled={field.disabled}
          style={{ ...defaultSelectStyle, ...field.controlStyle }}
        />
      );
      break;
    }
    case FormFieldType.TreeSelect: {
      controlNode = (
        <OrgUnitTreeSelect
          organizations={field.organizations || []}
          variant="form"
          showPath
          disabled={field.disabled}
          placeholder={field.placeholder ?? (labelText ? `Chọn ${labelText}...` : 'Chọn đơn vị...')}
          {...field.treeSelectProps}
        />
      );
      break;
    }
    case FormFieldType.Date: {
      controlNode = (
        <DatePicker
          format={field.format || "DD/MM/YYYY"}
          placeholder={field.placeholder || "Chọn ngày"}
          disabled={field.disabled}
          {...getDatePickerProps({
            style: { ...defaultSelectStyle, ...field.controlStyle },
            ...field.datePickerProps,
          })}
        />
      );
      break;
    }
    case FormFieldType.Year: {
      controlNode = (
        <DatePicker
          picker="year"
          format={field.format || "YYYY"}
          placeholder={field.placeholder || "Chọn năm"}
          disabled={field.disabled}
          {...getDatePickerProps({
            style: { ...defaultSelectStyle, ...field.controlStyle },
            ...field.datePickerProps,
          })}
        />
      );
      break;
    }
    case FormFieldType.TextArea: {
      controlNode = (
        <Input.TextArea
          rows={field.rows || 2}
          placeholder={defaultInputPlaceholder}
          disabled={field.disabled}
          readOnly={field.readOnly}
          style={{ borderRadius: radiusMd, ...field.controlStyle }}
        />
      );
      break;
    }
    case FormFieldType.Readonly: {
      const computedVal = field.computedValue
        ? field.computedValue(form, formValues)
        : formValues[field.name];
      const displayVal = field.valueFormatter
        ? field.valueFormatter(computedVal)
        : computedVal != null
          ? String(computedVal)
          : "";
      controlNode = (
        <Input
          disabled
          value={displayVal}
          placeholder={field.placeholder}
          style={{ ...readonlyInputStyle, ...field.controlStyle }}
        />
      );
      break;
    }
    case FormFieldType.Custom: {
      controlNode = field.customRender
        ? field.customRender({ form, field, values: formValues })
        : null;
      break;
    }
    case FormFieldType.Text:
    default: {
      controlNode = (
        <Input
          placeholder={defaultInputPlaceholder}
          disabled={field.disabled}
          readOnly={field.readOnly}
          style={{ ...defaultInputStyle, ...field.controlStyle }}
        />
      );
      break;
    }
  }

  if (field.type === FormFieldType.Custom && !field.label) {
    return (
      <Col
        key={field.name}
        span={field.colSpan || 12}
        style={{ ...field.itemStyle }}
      >
        {controlNode}
      </Col>
    );
  }

  return (
    <Col key={field.name} span={field.colSpan || 12}>
      <Form.Item
        name={
          field.type === FormFieldType.Readonly && field.computedValue
            ? undefined
            : field.name
        }
        label={labelNode}
        rules={rules}
        required={field.required}
        initialValue={field.initialValue}
        dependencies={field.dependencies}
        style={{ marginBottom: spaceFormField, ...field.itemStyle }}
      >
        {controlNode}
      </Form.Item>
    </Col>
  );
}

function renderSection<T extends Record<string, unknown>>(
  section: FormSectionConfig<T>,
  form: FormInstance<T>,
  formValues: T,
) {
  if (
    typeof section.hidden === "function"
      ? section.hidden(form, formValues)
      : section.hidden
  ) {
    return null;
  }

  return (
    <div
      key={section.key || String(section.title)}
      style={{ ...sectionBoxStyle, ...section.style }}
    >
      {(section.title || section.icon || section.headerExtra) && (
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>
            {section.icon && (
              <span style={{ color: actionPrimary }}>{section.icon}</span>
            )}
            {section.title && <span>{section.title}</span>}
          </div>
          {section.headerExtra && <div>{section.headerExtra}</div>}
        </div>
      )}
      <Row gutter={[24, 0]}>
        {section.fields.map((field) =>
          renderFormField(field, form, formValues),
        )}
      </Row>
    </div>
  );
}

export function DynamicFormSidebar<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  open,
  title,
  onClose,
  form: externalForm,
  initialValues,
  width,
  size,
  tabs,
  sections,
  fields,
  footerActions,
  actions,
  footerAlign = "center",
  footer,
  onSubmit,
  onValuesChange,
  destroyOnClose = true,
  rootClassName,
  className,
  loading = false,
}: DynamicFormSidebarProps<T>) {
  const [internalForm] = Form.useForm<T>();
  const form = externalForm || internalForm;
  const formValues = (Form.useWatch([], form) as T) || ({} as T);

  const {
    drawerTitleStyle,
    borderDefault,
    primaryButtonStyle,
    outlineButtonStyle,
    statusOperational,
  } = useThemeToken();

  const handleFinish = async (values: T) => {
    if (onSubmit) {
      await onSubmit(values);
    }
  };

  const renderActionButtons = useCallback(
    (actions: FormSidebarAction[]) => {
      const justifyContent =
        footerAlign === "right"
          ? "flex-end"
          : footerAlign === "left"
            ? "flex-start"
            : "center";

      return (
        <div style={{ display: "flex", gap: 8, justifyContent, width: "100%" }}>
          {actions.map((action) => {
            if (action.hidden) return null;

            let btnStyle: React.CSSProperties = { ...action.style };
            let btnType = action.type || "default";

            if (action.variant === "primary") {
              btnType = "primary";
              btnStyle = { ...primaryButtonStyle, ...btnStyle };
            } else if (action.variant === "outline") {
              btnStyle = { ...outlineButtonStyle, ...btnStyle };
            } else if (action.variant === "success") {
              btnType = "primary";
              btnStyle = {
                ...primaryButtonStyle,
                background: statusOperational,
                borderColor: statusOperational,
                ...btnStyle,
              };
            } else if (action.variant === "danger") {
              btnType = "primary";
              btnStyle = {
                ...primaryButtonStyle,
                background: "#ef4444",
                borderColor: "#ef4444",
                ...btnStyle,
              };
            }

            return (
              <Button
                key={action.key}
                type={btnType}
                icon={action.icon}
                loading={action.loading}
                disabled={action.disabled}
                onClick={action.onClick}
                className={action.className}
                style={btnStyle}
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      );
    },
    [primaryButtonStyle, outlineButtonStyle, statusOperational, footerAlign],
  );

  const drawerFooter = useMemo(() => {
    if (footer !== undefined) return footer;
    const resolvedActions = footerActions || actions;
    if (resolvedActions && resolvedActions.length > 0) {
      return renderActionButtons(resolvedActions);
    }
    return null;
  }, [actions, footer, footerActions, renderActionButtons]);

  const effectiveTabs = useMemo<FormTabConfig<T>[] | undefined>(() => {
    if (tabs && tabs.length > 0) return tabs;
    if (sections && sections.length > 0) {
      return [
        {
          key: "general",
          label: "Thông tin chung",
          sections,
        },
      ];
    }
    if (fields && fields.length > 0) {
      return [
        {
          key: "general",
          label: "Thông tin chung",
          fields,
        },
      ];
    }
    return undefined;
  }, [tabs, sections, fields]);

  const renderBodyContent = () => {
    if (!effectiveTabs || effectiveTabs.length === 0) return null;

    return (
      <Tabs
        defaultActiveKey={effectiveTabs[0]?.key}
        tabBarStyle={drawerTabBarStyle}
        items={effectiveTabs.map((tab: FormTabConfig<T>) => ({
          key: tab.key,
          label: (
            <span>
              {tab.icon && <span style={{ marginRight: 6 }}>{tab.icon}</span>}
              {tab.label}
            </span>
          ),
          children: tab.customContent ? (
            typeof tab.customContent === "function" ? (
              tab.customContent({ form, values: formValues })
            ) : (
              tab.customContent
            )
          ) : (
            <div
              style={{
                ...drawerFormScrollStyle,
                maxHeight: "calc(100vh - 170px)",
              }}
            >
              {tab.sections &&
                tab.sections.map((section) =>
                  renderSection(section, form, formValues),
                )}
              {tab.fields && (
                <Row gutter={[24, 0]}>
                  {tab.fields.map((field) =>
                    renderFormField(field, form, formValues),
                  )}
                </Row>
              )}
            </div>
          ),
        }))}
      />
    );
  };

  return (
    <AppDrawer
      title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{title}</span>}
      open={open}
      onClose={onClose}
      width={
        width ||
        (typeof window !== "undefined"
          ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
          : 1000)
      }
      size={size}
      destroyOnHidden={destroyOnClose}
      rootClassName={rootClassName}
      className={className}
      footer={drawerFooter}
      styles={{
        header: {
          padding: "12px 24px",
          borderBottom: `1px solid ${borderDefault}`,
          flexShrink: 0,
        },
        body: {
          padding: "0 24px 12px 24px",
          overflowY: "hidden",
        },
      }}
    >
      <Spin spinning={loading}>
        <Form<T>
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleFinish}
          onValuesChange={onValuesChange}
        >
          {renderBodyContent()}
        </Form>
      </Spin>
    </AppDrawer>
  );
}

export default DynamicFormSidebar;
