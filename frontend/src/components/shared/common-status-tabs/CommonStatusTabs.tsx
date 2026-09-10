import React, { useMemo, useCallback } from 'react';
import {
  actionPrimary,
  textSecondary,
  fontWeightBold,
  fontWeightMedium,
  spaceLg,
  fontSizeMd,
  radiusPill,
} from '../../../tokens';
import {
  STANDARD_APPROVAL_TABS,
  type CommonStatusTabsProps,
  type CommonStatusTabItem,
} from './status-tabs.model';

/**
 * Component hiển thị thanh tab trạng thái phê duyệt dùng chung cho toàn hệ thống Hàng hải KCHTGT.
 * Tự động tính toán số lượng bản ghi động, đồng bộ màu sắc semantic và hỗ trợ chuyển tab.
 */
export const CommonStatusTabs: React.FC<CommonStatusTabsProps> = ({
  activeKey = 'all',
  onChange,
  counts,
  dataSource,
  statusField = 'approvalStatus',
  customTabs,
  hideZeroCount = false,
  className,
  style,
}) => {
  // Tự động đếm số lượng từ dataSource nếu không truyền counts
  const computedCounts = useMemo(() => {
    if (counts) return counts;
    if (!dataSource || !Array.isArray(dataSource)) return {};

    const res: Record<string, number> = {};
    for (const item of dataSource) {
      const statusVal = item[statusField];
      if (typeof statusVal === 'string' && statusVal.trim() !== '') {
        res[statusVal] = (res[statusVal] || 0) + 1;
      }
    }
    return res;
  }, [counts, dataSource, statusField]);

  // Danh sách tabs được tính toán với số lượng chính xác
  const tabsList = useMemo<CommonStatusTabItem[]>(() => {
    // Nếu có customTabs thì dùng trực tiếp
    if (customTabs && customTabs.length > 0) {
      return customTabs.map((tab) => ({
        ...tab,
        count: tab.count !== undefined ? tab.count : (computedCounts[tab.key] || 0),
        active: tab.active !== undefined ? tab.active : tab.key === activeKey,
      }));
    }

    // Tính toán số lượng theo 6 tab chuẩn
    const draftCount = (computedCounts.DRAFT || 0) + (computedCounts.NHAP || 0);
    const pendingApprovalCount =
      (computedCounts.PENDING_APPROVAL || 0) +
      (computedCounts.CHO_DUYET_CAP_1 || 0) +
      (computedCounts.PENDING_LEVEL1 || 0);
    const approvedLevel1Count =
      (computedCounts.APPROVED_LEVEL1 || 0) +
      (computedCounts.CHO_DUYET_CAP_2 || 0) +
      (computedCounts.PENDING_LEVEL2 || 0);
    const approvedCount =
      (computedCounts.APPROVED || 0) + (computedCounts.DA_DUYET || 0);
    const rejectedCount =
      (computedCounts.REJECTED_LEVEL1 || 0) +
      (computedCounts.REJECTED_LEVEL2 || 0) +
      (computedCounts.REJECTED || 0) +
      (computedCounts.TU_CHOI || 0);

    // Bắt buộc: Tất cả = Lưu tạm + Chờ Cảng vụ + Chờ Cục + Đã duyệt + Từ chối
    const sumChildCounts =
      draftCount +
      pendingApprovalCount +
      approvedLevel1Count +
      approvedCount +
      rejectedCount;
    const allCount =
      sumChildCounts > 0 ? sumChildCounts : (computedCounts.all || 0);

    const countMap: Record<string, number> = {
      all: allCount,
      DRAFT: draftCount,
      PENDING_APPROVAL: pendingApprovalCount,
      APPROVED_LEVEL1: approvedLevel1Count,
      APPROVED: approvedCount,
      REJECTED_LEVEL1: rejectedCount,
    };

    return STANDARD_APPROVAL_TABS.map((tab) => {
      const currentCount = countMap[tab.key] || 0;
      return {
        ...tab,
        count: currentCount,
        active: tab.key === activeKey,
      };
    });
  }, [activeKey, computedCounts, customTabs]);

  // Lọc tab nếu cấu hình hideZeroCount
  const visibleTabs = useMemo(() => {
    if (!hideZeroCount) return tabsList;
    return tabsList.filter((t) => t.key === 'all' || (t.count !== undefined && t.count > 0));
  }, [hideZeroCount, tabsList]);

  // Xử lý click chuyển tab
  const handleTabClick = useCallback(
    (tab: CommonStatusTabItem) => {
      onChange?.(tab.key, tab.queryStatus);
    },
    [onChange]
  );

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: spaceLg,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {visibleTabs.map((tab) => {
        const isActive = tab.active ?? false;
        const tabColor = tab.color;

        return (
          <button
            key={tab.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleTabClick(tab)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '6px 4px',
              fontSize: fontSizeMd,
              fontWeight: isActive ? fontWeightBold : fontWeightMedium,
              color: isActive ? actionPrimary : textSecondary,
              borderBottom: isActive ? `2px solid ${actionPrimary}` : '2px solid transparent',
              transition: 'color 0.2s, border-color 0.2s',
              outline: 'none',
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 20,
                height: 20,
                padding: '0 8px',
                borderRadius: radiusPill,
                fontSize: fontSizeMd,
                fontWeight: isActive ? fontWeightBold : fontWeightMedium,
                background: `${tabColor}15`,
                color: tabColor,
                lineHeight: 1,
              }}
            >
              {tab.count ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CommonStatusTabs;
