import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  actionPrimary,
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
  radiusPill,
  textSecondary,
} from '../../../tokens';
import {
  STANDARD_APPROVAL_TABS,
  type CommonStatusTabItem,
  type CommonStatusTabsProps,
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Cuộn ngang bằng con lăn chuột mượt mà nếu tràn màn hình nhỏ
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

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

    // Tính toán số lượng theo 8 tab chuẩn (chuẩn Khu neo đậu)
    const draftCount = (computedCounts.DRAFT || 0) + (computedCounts.NHAP || 0);
    const pendingApprovalCount =
      (computedCounts.PENDING_APPROVAL || 0) +
      (computedCounts.CHO_PHE_DUYET || 0) +
      (computedCounts.CHO_DUYET_CAP_1 || 0) +
      (computedCounts.PENDING_LEVEL1 || 0);
    const approvedLevel1Count =
      (computedCounts.APPROVED_LEVEL1 || 0) +
      (computedCounts.CHO_DUYET_CAP_2 || 0) +
      (computedCounts.PENDING_LEVEL2 || 0);
    const approvedCount =
      (computedCounts.APPROVED || 0) + (computedCounts.DA_PHE_DUYET || 0) + (computedCounts.DA_DUYET || 0);
    const rejectedLevel1Count =
      (computedCounts.REJECTED_LEVEL1 || 0) + (computedCounts.TU_CHOI_CAP_1 || 0);
    const rejectedLevel2Count =
      (computedCounts.REJECTED_LEVEL2 || 0) + (computedCounts.TU_CHOI_CAP_2 || 0);
    const rejectedGenericCount =
      (computedCounts.REJECTED || 0) + (computedCounts.TU_CHOI || 0);
    const archivedCount =
      (computedCounts.ARCHIVED || 0) +
      (computedCounts.DA_XOA || 0) +
      (computedCounts.DELETED || 0) +
      (computedCounts.archived || 0) +
      (computedCounts.deleted || 0);

    const finalRejectedL1 = rejectedLevel1Count + (rejectedLevel2Count === 0 ? rejectedGenericCount : 0);
    const finalRejectedL2 = rejectedLevel2Count;

    // Bắt buộc theo chuẩn Khu neo đậu: Tất cả = tổng các tab con (Lưu tạm + Chờ Cảng vụ + Chờ Cục + Đã phê duyệt + Từ chối C1 + Từ chối C2 + Đã xóa)
    // Tất cả = Lưu tạm + Chờ Cảng vụ + Chờ Cục + Đã duyệt + Từ chối + Đã xóa
    const sumChildCounts =
      draftCount +
      pendingApprovalCount +
      approvedLevel1Count +
      approvedCount +
      finalRejectedL1 +
      finalRejectedL2 +
      archivedCount;
    const allCount =
      sumChildCounts > 0 ? sumChildCounts : (computedCounts.all || 0);

    const countMap: Record<string, number> = {
      all: allCount,
      DRAFT: draftCount,
      PENDING_APPROVAL: pendingApprovalCount,
      APPROVED_LEVEL1: approvedLevel1Count,
      APPROVED: approvedCount,
      REJECTED_LEVEL1: finalRejectedL1,
      REJECTED_LEVEL2: finalRejectedL2,
      ARCHIVED: archivedCount,
    };

    return STANDARD_APPROVAL_TABS.map((tab) => {
      const currentCount = countMap[tab.key] ?? countMap[tab.queryStatus || ''] ?? 0;
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
    <>
      <style>{`
        .chk-common-status-tabs-container {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          justify-content: safe center !important;
          align-items: center !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 2px 8px 4px 8px !important;
          gap: clamp(6px, 1vw, 14px) !important;
          width: 100% !important;
        }
        .chk-common-status-tabs-container::-webkit-scrollbar {
          height: 4px !important;
          display: block !important;
        }
        .chk-common-status-tabs-container::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 999px !important;
        }
        .chk-common-status-tabs-container::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 999px !important;
        }
        .chk-common-status-tabs-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        .chk-common-status-tabs-container > button {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          cursor: pointer !important;
          padding: 4px 2px !important;
          border: none !important;
          background: none !important;
          outline: none !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className={`chk-common-status-tabs-container ${className || ''}`}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'hidden',
          justifyContent: 'safe center',
          alignItems: 'center',
          gap: 'clamp(6px, 1vw, 14px)',
          width: '100%',
          padding: '2px 8px 4px 8px',
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
                gap: 6,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px 2px',
                fontSize: fontSizeMd,
                fontWeight: isActive ? fontWeightBold : fontWeightMedium,
                color: isActive ? actionPrimary : textSecondary,
                borderBottom: isActive ? `2px solid ${actionPrimary}` : '2px solid transparent',
                transition: 'color 0.2s, border-color 0.2s',
                outline: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 18,
                  height: 18,
                  padding: '0 6px',
                  borderRadius: radiusPill,
                  fontSize: 12,
                  fontWeight: isActive ? fontWeightBold : fontWeightMedium,
                  background: `${tabColor}15`,
                  color: tabColor,
                  lineHeight: '18px',
                }}
              >
                {tab.count ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default CommonStatusTabs;
