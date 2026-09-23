/* eslint-disable react-refresh/only-export-components */
import { HistoryOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Input, Space } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { AppDrawer } from '../../components/shared/AppDrawer';
import toast from '../../components/ToastNotification';
import { fetchVtsAssistAssetHistory } from '../../services/vtsAssistAsset/api';
import type { VtsAssistAsset } from '../../services/vtsAssistAsset/types';
import {
  actionPrimary,
  borderDefault,
  colors,
  drawerTitleStyle,
  fontSizeLg,
  fontSizeMd,
  fontWeightBold,
  radiusPill,
  spaceMd,
  spaceSm,
  spaceXl,
  textTertiary,
} from '../../themetokenchk';
import { countStandardHistoryCards, isBlankOrDash, renderStandardHistoryCards } from '../../utils/changeHistoryRenderer';
import { formatHistoryNumber, isYearField, formatYearValue } from '../../utils/numFmt';
import {
  EXCLUDED_CHANGE_FIELDS,
  NUMERIC_HISTORY_FIELDS,
  TRANSMISSION_ASSET_FIELD_LABELS as VTS_ASSIST_ASSET_FIELD_LABELS,
  histVal,
} from '../transmissionasset/TransmissionAssetHistory';

export { VTS_ASSIST_ASSET_FIELD_LABELS };

/**
 * Số bản ghi mỗi lần tải — đồng bộ chuẩn /vts-system.
 */
export const HISTORY_PAGE_SIZE = 20;

const HISTORY_FIELD_ORDER = [
  'assetCode', 'assetName', 'orgUnitId', 'usingOrgUnitId', 'transmissionId',
  'assetType', 'assetCondition', 'usageStatus', 'assetGroup', 'assetSubgroup',
  'address', 'origin', 'quantity', 'quantityUnit', 'model', 'serialNumber',
  'manufactureYear', 'countryOfOrigin', 'manufacturer', 'technicalSpecs',
  'constructionYear', 'useDate', 'declarationDate', 'originalValue', 'remainingValue',
  'depreciationRate', 'depreciationMonths', 'accumulatedDepreciation', 'annualDepreciation',
  'depreciationStartDate', 'depreciationEndDate', 'approvalStatus', 'note', 'attachmentName',
];

// === Fetch chuẩn /vts-system =================================================
// /vts-system KHÔNG lọc ở client: mỗi lần đổi từ khóa / khoảng ngày đều gọi lại
// API với page=0 và lọc + phân trang ở SERVER, rồi nối thêm khi cuộn tới đáy.
// Bản cũ của màn này tải 1 lần rồi lọc client-side, nên giới hạn phân trang của
// backend âm thầm cắt cụt dữ liệu và các bản ghi cũ không bao giờ hiện ra.

export interface VtsAssistHistoryFilters {
  keyword: string;
  fromDate?: string;
  toDate?: string;
}

export interface UseVtsAssistHistoryOptions {
  orgName: Map<string, string>;
  transmissionMap: Map<string, { code: string; name: string }>;
}

export function useVtsAssistHistory(_options: UseVtsAssistHistoryOptions) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<VtsAssistAsset | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  // `filters` = giá trị đang gõ trên form; `applied` = giá trị đã gửi lên server.
  const [filters, setFilters] = useState<VtsAssistHistoryFilters>({ keyword: '' });
  const [applied, setApplied] = useState<VtsAssistHistoryFilters>({ keyword: '' });

  const normalizeRecords = useCallback((payload: unknown): Record<string, unknown>[] => {
    const raw = Array.isArray((payload as { changeHistory?: Record<string, unknown>[] })?.changeHistory)
      ? (payload as { changeHistory: Record<string, unknown>[] }).changeHistory
      : (Array.isArray(payload) ? (payload as Record<string, unknown>[]) : []);
    return raw.filter((x) => x.fieldName !== 'CREATE' && x.changedField !== 'CREATE');
  }, []);

  const openHistory = useCallback((r: VtsAssistAsset) => {
    setTarget(r);
    setOpen(true);
    setRecords([]);
    setPage(0);
    setHasMore(true);
    setFilters({ keyword: '' });
    setApplied({ keyword: '' });
  }, []);

  useEffect(() => {
    if (!open || !target) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadingMore(false);
      setRecords([]);
      setPage(0);
      try {
        const payload = await fetchVtsAssistAssetHistory(target.id, 0, HISTORY_PAGE_SIZE, {
          keyword: applied.keyword || undefined,
          fromDate: applied.fromDate || undefined,
          toDate: applied.toDate || undefined,
        });
        if (cancelled) return;
        const items = normalizeRecords(payload);
        setRecords(items);
        setHasMore(items.length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) toast.error('Không thể tải lịch sử thay đổi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, target, applied, normalizeRecords]);

  const loadMore = useCallback(async () => {
    if (!target || loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const payload = await fetchVtsAssistAssetHistory(target.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: applied.keyword || undefined,
        fromDate: applied.fromDate || undefined,
        toDate: applied.toDate || undefined,
      });
      const items = normalizeRecords(payload);
      if (items.length > 0) setRecords((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(items.length === HISTORY_PAGE_SIZE);
    } catch {
      toast.error('Không thể tải thêm lịch sử thay đổi');
    } finally {
      setLoadingMore(false);
    }
  }, [target, loading, loadingMore, hasMore, page, applied, normalizeRecords]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
        void loadMore();
      }
    },
    [loadMore],
  );

  /** Tìm kiếm = gửi lên server, không lọc tại chỗ. */
  const applyFilters = useCallback((next: VtsAssistHistoryFilters) => {
    setFilters(next);
    setApplied({ keyword: next.keyword.trim(), fromDate: next.fromDate, toDate: next.toDate });
  }, []);

  const submitted = Boolean((applied.keyword || '').trim() || applied.fromDate || applied.toDate);

  return {
    historyOpen: open,
    historyTarget: target,
    historyRecords: records,
    historyLoading: loading,
    historyLoadingMore: loadingMore,
    historyHasMore: hasMore,
    historyFilters: filters,
    hasActiveHistoryFilter: submitted,
    openHistory,
    setHistoryOpen: setOpen,
    setHistoryFilters: setFilters,
    applyHistoryFilters: applyFilters,
    onHistoryScroll: handleScroll,
  };
}

// === Drawer =================================================================

interface VtsAssistAssetHistoryProps {
  open: boolean;
  target: VtsAssistAsset | null;
  records: Record<string, unknown>[];
  loading: boolean;
  loadingMore: boolean;
  filters: VtsAssistHistoryFilters;
  hasActiveFilter: boolean;
  orgName: Map<string, string>;
  transmissionMap: Map<string, { code: string; name: string }>;
  onClose: () => void;
  onFiltersChange: (filters: VtsAssistHistoryFilters) => void;
  onSearch: () => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export default function VtsAssistAssetHistory({
  open, target, records, loading, loadingMore, filters, hasActiveFilter,
  orgName, transmissionMap, onClose, onFiltersChange, onSearch, onScroll,
}: VtsAssistAssetHistoryProps) {
  const renderTimeline = (data: Record<string, unknown>[]) =>
    renderStandardHistoryCards({
      records: data,
      fieldLabels: VTS_ASSIST_ASSET_FIELD_LABELS,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if (isYearField(fn)) {
          return formatYearValue(raw);
        }
        const resolved = histVal(fn, raw, orgName, transmissionMap);
        if (NUMERIC_HISTORY_FIELDS.has(fn) && raw) {
          const t = String(raw).trim();
          if (t && !Number.isNaN(Number(t))) return formatHistoryNumber(t);
        }
        return resolved;
      },
      resolveUnitName: (rec) => {
        const direct = rec.orgUnitName as string | undefined;
        if (direct?.trim()) return direct;
        const userUnitName = (rec.unitName as string) || (rec.unit as string);
        if (userUnitName?.trim()) return userUnitName;
        const userOrgId = rec.userOrgUnitId as string;
        if (userOrgId && orgName.has(userOrgId)) {
          return orgName.get(userOrgId) || '';
        }
        return '';
      },
      emptyMessage: hasActiveFilter
        ? 'Không tìm thấy kết quả phù hợp'
        : 'Chưa có thay đổi nào được ghi nhận',
    });

  const totalCards = useMemo(
    () => countStandardHistoryCards({ records }),
    [records],
  );

  return (
    <AppDrawer
      width={860}
      rootClassName="vts-assist-drawer-scope"
      className="vts-assist-drawer-scope"
      mask
      open={open}
      onClose={onClose}
      footer={null}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space size={spaceSm} style={{ alignItems: 'center' }}>
            <HistoryOutlined style={{ color: actionPrimary }} />
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              {target ? `Lịch sử thay đổi — ${target.assetName}` : 'Lịch sử thay đổi'}
            </span>
            <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
              Tổng cộng {totalCards}
            </span>
          </Space>
        </div>
      }
    >
      <div style={{ flexShrink: 0 }}>
        {!loading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input
              placeholder="Tìm kiếm nội dung thay đổi..."
              allowClear
              value={filters.keyword || ''}
              onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value })}
              onPressEnter={onSearch}
              style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
            />
            <DatePicker
              placeholder="Từ ngày"
              classNames={{ popup: { root: 'history-dt-popup' } }}
              value={filters.fromDate ? dayjs(filters.fromDate) : null}
              onChange={(d) => onFiltersChange({ ...filters, fromDate: d ? d.format('YYYY-MM-DD') : '' })}
              style={{ width: 140, borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY"
            />
            <DatePicker
              placeholder="Đến ngày"
              classNames={{ popup: { root: 'history-dt-popup' } }}
              value={filters.toDate ? dayjs(filters.toDate) : null}
              onChange={(d) => onFiltersChange({ ...filters, toDate: d ? d.format('YYYY-MM-DD') : '' })}
              style={{ width: 140, borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY"
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={onSearch}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
            >
              Tìm kiếm
            </Button>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={onScroll}>
        {loading ? (
          <LoadingSkeleton />
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
            <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
            <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
          </div>
        ) : hasActiveFilter && countStandardHistoryCards({ records }) === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
            <SearchOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
            <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Không tìm thấy kết quả phù hợp</div>
          </div>
        ) : (
          <>
            {renderTimeline(records)}
            {loadingMore && (
              <div style={{ padding: spaceMd, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>
                Đang tải thêm…
              </div>
            )}
          </>
        )}
      </div>
    </AppDrawer>
  );
}
