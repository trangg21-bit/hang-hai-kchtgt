import React from 'react';
import { Button, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useThemeToken } from '../../context/ThemeTokenContext';
import StatusTabs, { type StatusTab } from './StatusTabs';
export type { StatusTab };

export interface FilterTableLayoutProps {
  /** Filter fields rendered in the sidebar */
  filterContent: React.ReactNode;
  /** Status tabs config */
  statusTabs?: StatusTab[];
  /** Called when a status tab is clicked */
  onStatusTabChange?: (key: string) => void;
  /** Called when Tìm kiếm button is clicked */
  onFilterApply: () => void;
  /** Called when Reload button is clicked */
  onFilterReset: () => void;
  /** Whether advanced filters are expanded */
  filterCollapsed?: boolean;
  /** Toggle advanced filter visibility */
  onToggleCollapse?: () => void;
  /** Hide the filter-toggle button in the sidebar footer */
  hideFilterToggle?: boolean;
  /** Đẩy vùng field filter xuống thêm (px) để input đầu (vd 'Tên kết nối') thẳng hàng cạnh trên DataTable */
  filterTopOffset?: number;
  /** Hide the StatusTabs row above the table */
  hideStatusTabs?: boolean;
  /** Whether table is loading */
  loading?: boolean;
  /** Error state */
  error?: boolean;
  /** Nguyên nhân lỗi cụ thể; bỏ trống thì hiện thông báo chung */
  errorMessage?: string;
  /** Called when retry button clicked */
  onRetry?: () => void;
  /** Table content or any children to render in the main area */
  children: React.ReactNode;
}

/**
 * Shared layout for list pages: filter sidebar (left) + status tabs + data table (right).
 * The outer page wrapper should provide a flex column container with constrained height.
 */
export default function FilterTableLayout({
  filterContent,
  statusTabs = [],
  onStatusTabChange = () => {},
  onFilterApply,
  onFilterReset,
  filterCollapsed = false,
  onToggleCollapse = () => {},
  hideFilterToggle = false,
  filterTopOffset = 0,
  hideStatusTabs = false,
  loading,
  error,
  errorMessage,
  onRetry,
  children,
}: FilterTableLayoutProps) {
  const { cardStyle, borderDefault, textSecondary, actionPrimary, buttonRadius, fontSizeMd, statusTabsPadding } = useThemeToken();
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'stretch', flex: 1, minHeight: 0 }}>
      {/* ── Left: Vertical Filter Panel ── */}
      <div
        style={{
          ...cardStyle,
          width: 280,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Scrollable filter fields */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '12px 16px', paddingTop: filterTopOffset ? 12 + filterTopOffset : undefined }}>
          {filterContent}
        </div>

        {/* Action Buttons — fixed bottom */}
        <div style={{ borderTop: `1px solid ${borderDefault}`, padding: '12px 16px', display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={onFilterReset}
            shape="circle"
            style={{ color: textSecondary, borderColor: borderDefault, width: 38, height: 38, fontSize: fontSizeMd, flexShrink: 0 }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={onFilterApply}
            style={{ background: actionPrimary, borderColor: actionPrimary, borderRadius: buttonRadius, height: 40, fontSize: fontSizeMd, padding: '0 14px' }}
          >
            Tìm kiếm
          </Button>
          {!hideFilterToggle && (
            <Button
              icon={<FilterOutlined />}
              onClick={onToggleCollapse}
              shape="circle"
              title={filterCollapsed ? 'Thu gọn bộ lọc nâng cao' : 'Mở rộng bộ lọc nâng cao'}
              style={{
                color: filterCollapsed ? actionPrimary : textSecondary,
                borderColor: filterCollapsed ? actionPrimary : borderDefault,
                width: 38,
                height: 38,
                fontSize: fontSizeMd,
                flexShrink: 0,
              }}
            />
          )}
        </div>
      </div>

      {/* ── Right: Main Content ── */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* StatusTabs */}
        {!hideStatusTabs && (
          <div style={{ ...cardStyle, marginBottom: 5, padding: statusTabsPadding, flexShrink: 0 }}>
            <StatusTabs tabs={statusTabs} onChange={onStatusTabChange} />
          </div>
        )}

        {/* DataTable card */}
        <div style={{ ...cardStyle, padding: 10, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <Spin spinning={loading ?? false} classNames={{ root: 'filter-table-spin' }} style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
            {error ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p>{errorMessage || 'Đã xảy ra lỗi khi tải danh sách.'}</p>
                {onRetry && <Button onClick={onRetry}>Thử lại</Button>}
              </div>
            ) : (
              <div className="filter-table-content" style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {children}
              </div>
            )}
          </Spin>
        </div>
      </div>

      <style>
        {`
          .filter-table-spin { height: 100%; display: flex; flex-direction: column; flex: 1; min-height: 0; }
          .filter-table-spin .ant-spin-nested-loading { height: 100%; display: flex; flex-direction: column; flex: 1; min-height: 0; }
          .filter-table-spin .ant-spin-container { height: 100%; display: flex; flex-direction: column; flex: 1; min-height: 0; }
          .filter-table-content { height: 100%; display: flex; flex-direction: column; flex: 1; min-height: 0; }
        `}
      </style>
    </div>
  );
}
