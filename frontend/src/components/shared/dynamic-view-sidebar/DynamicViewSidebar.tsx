import React, { useState } from "react";
import { Tabs, Spin } from "antd";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { AppDrawer } from "../AppDrawer";
import { fmtNum } from "../../../utils/numFmt";
import {
  colors,
  actionPrimary,
  textTertiary,
  surfaceCard,
  fontSizeMd,
  fontWeightBold,
  statusBadgeStyle,
  borderDefault,
  drawerTitleStyle,
} from "../../../themetokenchk";
import {
  type DynamicViewSidebarProps,
  type ViewFieldConfig,
  type ViewSectionConfig,
  type ViewTabConfig,
  ViewFieldType,
} from "./dynamic-view-sidebar.model";

const sectionBoxStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "12px 18px 8px 18px",
  marginBottom: 14,
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
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

function formatFieldValue<T>(
  field: ViewFieldConfig<T>,
  record: T,
): React.ReactNode {
  let rawValue: unknown;

  if (field.value) {
    rawValue = field.value(record);
  } else if (field.name && record && typeof record === "object") {
    rawValue = (record as Record<string, unknown>)[field.name];
  }

  if (field.render) {
    return field.render(rawValue, record);
  }

  if (rawValue == null || rawValue === "") {
    return "—";
  }

  switch (field.type) {
    case ViewFieldType.Number: {
      const num = Number(rawValue);
      if (Number.isNaN(num)) return String(rawValue);
      return (
        <span>
          {field.prefix}
          {fmtNum(num)}
          {field.suffix ? ` ${field.suffix}` : ""}
        </span>
      );
    }
    case ViewFieldType.Date: {
      return (
        <span>
          {dayjs(String(rawValue)).isValid()
            ? dayjs(String(rawValue)).format("DD/MM/YYYY")
            : String(rawValue)}
        </span>
      );
    }
    case ViewFieldType.DateTime: {
      return (
        <span>
          {dayjs(String(rawValue)).isValid()
            ? dayjs(String(rawValue)).format("DD/MM/YYYY HH:mm:ss")
            : String(rawValue)}
        </span>
      );
    }
    case ViewFieldType.Badge: {
      const color =
        typeof field.badgeColor === "function"
          ? field.badgeColor(rawValue, record)
          : field.badgeColor || actionPrimary;
      return <span style={statusBadgeStyle(color)}>{String(rawValue)}</span>;
    }
    case ViewFieldType.Tag: {
      return (
        <span style={statusBadgeStyle(actionPrimary)}>{String(rawValue)}</span>
      );
    }
    case ViewFieldType.Text:
    case ViewFieldType.Custom:
    default: {
      return (
        <span>
          {field.prefix}
          {String(rawValue)}
          {field.suffix ? ` ${field.suffix}` : ""}
        </span>
      );
    }
  }
}

function ViewSectionItem<T>({
  section,
  record,
}: {
  section: ViewSectionConfig<T>;
  record: T;
}) {
  const [collapsed, setCollapsed] = useState<boolean>(
    Boolean(section.defaultCollapsed),
  );

  if (
    typeof section.hidden === "function"
      ? section.hidden(record)
      : section.hidden
  ) {
    return null;
  }

  const isCollapsible = Boolean(section.collapsible);

  return (
    <div
      key={section.key || String(section.title)}
      style={{ ...sectionBoxStyle, ...section.style }}
    >
      {(section.title ||
        section.icon ||
        section.headerExtra ||
        isCollapsible) && (
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>
            {section.icon && (
              <span style={{ color: actionPrimary }}>{section.icon}</span>
            )}
            {section.title && <span>{section.title}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {section.headerExtra && (
              <div>
                {typeof section.headerExtra === "function"
                  ? section.headerExtra(record)
                  : section.headerExtra}
              </div>
            )}
            {isCollapsible && (
              <div
                onClick={() => setCollapsed((prev) => !prev)}
                style={{
                  cursor: "pointer",
                  color: textTertiary,
                  padding: "2px 4px",
                }}
              >
                {collapsed ? <RightOutlined /> : <DownOutlined />}
              </div>
            )}
          </div>
        </div>
      )}

      {!collapsed && (
        <div className="chk-detail-grid">
          {section.fields.map((field, idx) => {
            if (
              typeof field.hidden === "function"
                ? field.hidden(record)
                : field.hidden
            ) {
              return null;
            }

            const isFullWidth = field.colSpan === 24;
            const displayValue = formatFieldValue(field, record);

            return (
              <div
                key={field.name || `field-${idx}`}
                className={`chk-detail-row ${isFullWidth ? "chk-detail-row--full" : ""} ${field.className || ""}`}
                style={field.style}
              >
                <span className="chk-detail-label">{field.label}</span>
                <span className="chk-detail-value">{displayValue}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DynamicViewSidebar<T = Record<string, unknown>>({
  open,
  title,
  record,
  onClose,
  width,
  size,
  tabs,
  sections,
  fields,
  footer = null,
  loading = false,
  rootClassName = "berth-drawer-scope",
  className = "berth-drawer-scope",
}: DynamicViewSidebarProps<T>) {
  const renderBodyContent = () => {
    if (!record) return null;

    if (tabs && tabs.length > 0) {
      return (
        <Tabs
          defaultActiveKey={tabs[0]?.key}
          tabBarStyle={{
            marginBottom: 0,
            paddingTop: 0,
            position: "sticky",
            top: 0,
            zIndex: 1,
            background: surfaceCard,
          }}
          items={tabs.map((tab: ViewTabConfig<T>) => {
            const countSuffix =
              tab.badgeCount != null ? ` (${tab.badgeCount})` : "";
            return {
              key: tab.key,
              label: (
                <span>
                  {tab.icon && (
                    <span style={{ marginRight: 6 }}>{tab.icon}</span>
                  )}
                  {tab.label}
                  {countSuffix}
                </span>
              ),
              children: tab.customContent ? (
                typeof tab.customContent === "function" ? (
                  tab.customContent(record)
                ) : (
                  tab.customContent
                )
              ) : (
                <div
                  style={{
                    paddingTop: 6,
                    paddingRight: 4,
                    overflowY: "auto",
                    overflowX: "hidden",
                    maxHeight: "calc(100vh - 190px)",
                    minHeight: 350,
                  }}
                >
                  {tab.sections &&
                    tab.sections.map((sec, idx) => (
                      <ViewSectionItem
                        key={sec.key || `sec-${idx}`}
                        section={sec}
                        record={record}
                      />
                    ))}
                  {tab.fields && (
                    <div className="chk-detail-grid">
                      {tab.fields.map((field, idx) => {
                        if (
                          typeof field.hidden === "function"
                            ? field.hidden(record)
                            : field.hidden
                        ) {
                          return null;
                        }
                        const isFullWidth = field.colSpan === 24;
                        return (
                          <div
                            key={field.name || `tab-field-${idx}`}
                            className={`chk-detail-row ${isFullWidth ? "chk-detail-row--full" : ""} ${field.className || ""}`}
                            style={field.style}
                          >
                            <span className="chk-detail-label">
                              {field.label}
                            </span>
                            <span className="chk-detail-value">
                              {formatFieldValue(field, record)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ),
            };
          })}
        />
      );
    }

    if (sections && sections.length > 0) {
      return (
        <div style={{ paddingTop: 14, paddingBottom: 14 }}>
          {sections.map((sec, idx) => (
            <ViewSectionItem
              key={sec.key || `sec-${idx}`}
              section={sec}
              record={record}
            />
          ))}
        </div>
      );
    }

    if (fields && fields.length > 0) {
      return (
        <div style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className="chk-detail-grid">
            {fields.map((field, idx) => {
              if (
                typeof field.hidden === "function"
                  ? field.hidden(record)
                  : field.hidden
              ) {
                return null;
              }
              const isFullWidth = field.colSpan === 24;
              return (
                <div
                  key={field.name || `field-${idx}`}
                  className={`chk-detail-row ${isFullWidth ? "chk-detail-row--full" : ""} ${field.className || ""}`}
                  style={field.style}
                >
                  <span className="chk-detail-label">{field.label}</span>
                  <span className="chk-detail-value">
                    {formatFieldValue(field, record)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  const hasTabs = Boolean(tabs && tabs.length > 0);

  return (
    <AppDrawer
      width={
        width ||
        (typeof window !== "undefined"
          ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
          : 1000)
      }
      size={size}
      rootClassName={rootClassName}
      className={className}
      title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{title}</span>}
      open={open}
      onClose={onClose}
      styles={{
        header: {
          padding: "12px 24px",
          borderBottom: `1px solid ${borderDefault}`,
          flexShrink: 0,
        },
        body: {
          padding: "0 24px 12px 24px",
          overflowY: hasTabs ? "hidden" : "auto",
        },
      }}
      footer={footer}
    >
      <style>{`
        .berth-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .berth-detail-content-wrapper,
        .berth-detail-content-wrapper .chk-detail-label,
        .berth-detail-content-wrapper .chk-detail-value,
        .berth-detail-content-wrapper .ant-table,
        .berth-detail-content-wrapper .ant-table-cell,
        .berth-detail-content-wrapper .ant-tabs-tab {
          font-size: 13.5px !important;
        }

        .berth-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .berth-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .berth-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        .berth-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .berth-drawer-scope .berth-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .berth-detail-content-wrapper .chk-detail-label {
          width: 220px !important;
          min-width: 220px !important;
          max-width: 220px !important;
          flex-shrink: 0 !important;
          color: ${colors.sidebarBg} !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          text-align: left !important;
          line-height: 1.5 !important;
        }

        .berth-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .berth-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .berth-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .berth-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
        }
      `}</style>

      <div className="berth-detail-content-wrapper">
        <Spin spinning={loading}>{renderBodyContent()}</Spin>
      </div>
    </AppDrawer>
  );
}

export default DynamicViewSidebar;
