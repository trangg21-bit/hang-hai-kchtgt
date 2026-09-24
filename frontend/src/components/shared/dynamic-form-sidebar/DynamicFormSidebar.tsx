import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Spin,
  Tabs,
} from "antd";
import InputNumber from '../LocalizedInputNumber';
import type { FormInstance, Rule } from "antd/es/form";
import React, { useCallback, useMemo } from "react";
import { useThemeToken } from "../../../context/ThemeTokenContext";
import {
  actionPrimary,
  colors,
  DRAWER_FORM_WIDTH,
  drawerFormScrollStyle,
  drawerTabBarStyle,
  fontSizeMd,
  fontWeightBold,
  getDatePickerProps,
  radiusMd,
  radiusPill,
  readonlyInputStyle,
  spaceFormField,
} from "../../../themetokenchk";
import { formatDotNumber, parseDotNumber } from "../../../utils/numFmt";
import { resolveOrgSubtreeIds } from "../../org-unit";
import { AppDrawer } from "../AppDrawer";
import { NumberInputWithCount } from "../NumberInputWithCount";
import {
  type DynamicCascadingHelper,
  type DynamicFormSidebarProps,
  type FormFieldConfig,
  type FormSectionConfig,
  type FormSidebarAction,
  type FormTabConfig,
  FormFieldType,
} from "./dynamic-form-sidebar.model";
import { DynamicOrgUnitTreeSelect } from "./DynamicOrgUnitTreeSelect";
import {
  resolveEffectiveTabs,
  useDynamicFormOrgSync,
} from "./useDynamicFormOrgSync";

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
  fontSize: fontSizeMd,
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
  cascadingHelper?: DynamicCascadingHelper,
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
      const numberPlaceholder =
        field.placeholder ?? (labelText ? `Nhập ${labelText}` : '0');
      // Có maxLength => dùng ô số kèm hậu tố đếm chữ số; không có => giữ InputNumber mặc định.
      const resolvedFormatter = field.formatter || formatDotNumber;
      const resolvedParser = (field.parser || parseDotNumber) as (displayValue: string | undefined) => string | number;

      controlNode =
        field.maxLength != null ? (
          <NumberInputWithCount
            maxLength={field.maxLength}
            min={field.min}
            max={field.max}
            step={field.step}
            allowDecimal={field.allowDecimal}
            allowNegative={field.allowNegative}
            formatter={resolvedFormatter}
            parser={resolvedParser}
            placeholder={numberPlaceholder}
            disabled={field.disabled}
            readOnly={field.readOnly}
            style={{ ...defaultNumberInputStyle, ...field.controlStyle }}
          />
        ) : (
          <InputNumber
            min={field.min}
            max={field.max}
            step={field.step}
            formatter={resolvedFormatter}
            parser={resolvedParser}
            placeholder={numberPlaceholder}
            disabled={field.disabled}
            readOnly={field.readOnly}
            style={{ ...defaultNumberInputStyle, ...field.controlStyle }}
          />
        );
      break;
    }
    case FormFieldType.Select: {
      let selectOptions = field.options;
      // Tự động lọc thiết bị / bến cảng theo Đơn vị quản lý đã chọn nếu option có thuộc tính orgUnitId
      if (cascadingHelper?.selectedOrgUnitId && selectOptions && selectOptions.length > 0) {
        const hasOrgField = selectOptions.some((opt) => (opt as { orgUnitId?: unknown }).orgUnitId != null);
        if (hasOrgField) {
          const allowedOrgIds = resolveOrgSubtreeIds(
            cascadingHelper.allOrganizations,
            cascadingHelper.selectedOrgUnitId,
          );
          selectOptions = selectOptions.filter((opt) => {
            const itemOrg = (opt as { orgUnitId?: unknown }).orgUnitId;
            return (
              !itemOrg ||
              allowedOrgIds.has(String(itemOrg)) ||
              String(itemOrg) === String(cascadingHelper.selectedOrgUnitId)
            );
          });
        }
      }

      controlNode = (
        <Select
          allowClear={field.allowClear}
          showSearch={field.showSearch ?? true}
          optionFilterProp="label"
          options={selectOptions}
          placeholder={defaultSelectPlaceholder}
          disabled={field.disabled}
          style={{ ...defaultSelectStyle, ...field.controlStyle }}
        />
      );
      break;
    }
    case FormFieldType.TreeSelect: {
      controlNode = (
        <DynamicOrgUnitTreeSelect
          field={field}
          cascadingHelper={cascadingHelper}
          labelText={labelText}
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
          placeholder={field.placeholder || "Chọn năm"}
          disabled={field.disabled}
          {...getDatePickerProps({
            picker: "year",
            format: field.format || "YYYY",
            style: { ...defaultSelectStyle, ...field.controlStyle },
            ...field.datePickerProps,
          })}
          picker="year"
          format={field.format || "YYYY"}
        />
      );
      break;
    }
    case FormFieldType.TextArea: {
      controlNode = (
        <Input.TextArea
          rows={field.rows || 2}
          maxLength={field.maxLength}
          showCount={field.showCount ?? field.maxLength != null}
          placeholder={defaultInputPlaceholder}
          disabled={field.disabled}
          readOnly={field.readOnly}
          style={{ borderRadius: radiusMd, ...field.controlStyle }}
        />
      );
      break;
    }
    case FormFieldType.Readonly: {
      return (
        <Col key={String(field.name)} span={field.colSpan || 12}>
          <Form.Item
            noStyle={false}
            label={labelNode}
            dependencies={
              field.dependencies && field.dependencies.length > 0
                ? field.dependencies
                : undefined
            }
            shouldUpdate={
              !field.dependencies || field.dependencies.length === 0
                ? true
                : undefined
            }
            style={{ marginBottom: spaceFormField, ...field.itemStyle }}
          >
            {() => {
              const allFormVals = {
                ...form.getFieldsValue(true),
                ...formValues,
              };
              const rawVal = field.computedValue
                ? field.computedValue(form, allFormVals)
                : (allFormVals?.[field.name as keyof T] ??
                    form?.getFieldValue?.(field.name as never));
              const displayVal = field.valueFormatter
                ? field.valueFormatter(rawVal)
                : rawVal != null
                  ? String(rawVal)
                  : "";
              return (
                <Input
                  disabled
                  value={typeof displayVal === "string" || typeof displayVal === "number" ? displayVal : (displayVal ? String(displayVal) : "")}
                  placeholder={field.placeholder}
                  style={{ ...readonlyInputStyle, ...field.controlStyle }}
                />
              );
            }}
          </Form.Item>
        </Col>
      );
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
          maxLength={field.maxLength}
          showCount={field.showCount ?? field.maxLength != null}
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
        key={String(field.name)}
        span={field.colSpan || 12}
        style={{ ...field.itemStyle }}
      >
        {controlNode}
      </Col>
    );
  }

  return (
    <Col key={String(field.name)} span={field.colSpan || 12}>
      <Form.Item
        name={field.name as never}
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
  cascadingHelper?: DynamicCascadingHelper,
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
          renderFormField(field, form, formValues, cascadingHelper),
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
  destroyOnHidden = destroyOnClose,
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

  const effectiveTabs = useMemo(
    () => resolveEffectiveTabs(tabs, sections, fields),
    [tabs, sections, fields],
  );

  const { cascadingHelper, handleValuesChange } = useDynamicFormOrgSync({
    open,
    form,
    formValues,
    effectiveTabs,
    onValuesChange,
  });

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

  const renderBodyContent = () => {
    if (!effectiveTabs || effectiveTabs.length === 0) return null;

    return (
      <Tabs
        defaultActiveKey={effectiveTabs[0]?.key}
        tabBarStyle={drawerTabBarStyle}
        destroyOnHidden={false}
        items={effectiveTabs.map((tab: FormTabConfig<T>) => ({
          key: tab.key,
          forceRender: true,
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
                  renderSection(section, form, formValues, cascadingHelper),
                )}
              {tab.fields && (
                <Row gutter={[24, 0]}>
                  {tab.fields.map((field) =>
                    renderFormField(field, form, formValues, cascadingHelper),
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
      width={width || DRAWER_FORM_WIDTH}
      size={size}
      destroyOnHidden={destroyOnHidden}
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
      <style>{`
        .ant-drawer .ant-form-item-label > label,
        .ant-drawer .ant-input,
        .ant-drawer .ant-select,
        .ant-drawer .ant-select-selection-item,
        .ant-drawer .ant-select-item-option-content,
        .ant-drawer .ant-picker,
        .ant-drawer .ant-picker-input > input,
        .ant-drawer .ant-btn,
        .ant-drawer .ant-tabs-tab {
          font-size: 13.5px !important;
        }
      `}</style>
      <Spin spinning={loading}>
        <Form<T>
          form={form}
          layout="vertical"
          preserve={true}
          initialValues={initialValues}
          onFinish={handleFinish}
          onValuesChange={handleValuesChange}
        >
          {renderBodyContent()}
        </Form>
      </Spin>
    </AppDrawer>
  );
}

export default DynamicFormSidebar;
