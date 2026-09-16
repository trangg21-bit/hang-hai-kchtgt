import { HistoryOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Input, Space } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { AppDrawer } from '../../components/shared/AppDrawer';
import toast from '../../components/ToastNotification';
import { fetchVhfAssetHistory } from '../../services/vhfAsset/api';
import type { VhfAsset } from '../../services/vhfAsset/types';
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
import { formatHistoryNumber } from '../../utils/numFmt';
import {
    EXCLUDED_CHANGE_FIELDS,
    NUMERIC_HISTORY_FIELDS,
    TRANSMISSION_ASSET_FIELD_LABELS as VHF_ASSET_FIELD_LABELS,
    histVal,
} from '../transmissionasset/TransmissionAssetHistory';

export { VHF_ASSET_FIELD_LABELS };

const HISTORY_FIELD_ORDER = [
  'assetCode', 'assetName', 'orgUnitId', 'usingOrgUnitId', 'transmissionId',
  'assetType', 'assetCondition', 'usageStatus', 'assetGroup', 'assetSubgroup',
  'address', 'origin', 'quantity', 'quantityUnit', 'model', 'serialNumber',
  'manufactureYear', 'countryOfOrigin', 'manufacturer', 'technicalSpecs',
  'constructionYear', 'useDate', 'declarationDate', 'originalValue', 'remainingValue',
  'depreciationRate', 'depreciationMonths', 'accumulatedDepreciation', 'annualDepreciation',
  'depreciationStartDate', 'depreciationEndDate', 'approvalStatus', 'note', 'attachmentName',
];

// === Hook ====================================================================

export interface UseVhfHistoryOptions {
  orgName: Map<string, string>;
  transmissionMap: Map<string, { code: string; name: string }>;
}

export function useVhfHistory({ orgName, transmissionMap }: UseVhfHistoryOptions) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<VhfAsset | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  const openHistory = useCallback(async (r: VhfAsset) => {
    setTarget(r); setOpen(true); setLoading(true); setRecords([]); setFilters({ keyword: '' });
    try {
      const d = (await fetchVhfAssetHistory(r.id)) as
        | { changeHistory?: Record<string, unknown>[] }
        | Record<string, unknown>[]
        | undefined;
      const rawList = Array.isArray((d as { changeHistory?: Record<string, unknown>[] })?.changeHistory)
        ? (d as { changeHistory: Record<string, unknown>[] }).changeHistory
        : (Array.isArray(d) ? d : []);
      setRecords(rawList.filter((x) => x.fieldName !== 'CREATE' && x.changedField !== 'CREATE'));
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredRecords = useMemo(() => {
    const q = (filters.keyword || '').trim().toLowerCase();
    const from = filters.fromDate || '';
    const to = filters.toDate || '';
    return records.filter((r) => {
      const fn = String(r.fieldName || r.changedField || '').trim();
      if (EXCLUDED_CHANGE_FIELDS.has(fn)) return false;
      if (q) {
        const label = VHF_ASSET_FIELD_LABELS[fn] || fn;
        const rawHits = [fn, label, r.oldValue, r.newValue, r.previousValue, r.value, r.reason, r.note]
          .filter((v) => v !== null && v !== undefined)
          .map((v) => String(v).toLowerCase());
        const ro = histVal(fn, r.oldValue, orgName, transmissionMap);
        const rn = histVal(fn, r.newValue, orgName, transmissionMap);
        if (ro) rawHits.push(ro.toLowerCase());
        if (rn) rawHits.push(rn.toLowerCase());
        if (!rawHits.some((t) => t.includes(q))) return false;
      }
      if (from || to) {
        const ts = (r.changedAt || r.createdAt || r.approvedDate || '') as string;
        const day = ts ? dayjs(ts).format('YYYY-MM-DD') : '';
        if (!day) return false;
        if (from && day < from) return false;
        if (to && day > to) return false;
      }
      return true;
    });
  }, [records, filters, orgName, transmissionMap]);

  return {
    historyOpen: open,
    historyTarget: target,
    historyRecords: records,
    historyLoading: loading,
    historyFilters: filters,
    filteredHistory: filteredRecords,
    hasActiveHistoryFilter: Boolean(filters.keyword?.trim() || filters.fromDate || filters.toDate),
    openHistory,
    setHistoryOpen: setOpen,
    setHistoryFilters: setFilters,
  };
}

// === Component ===============================================================

export interface VhfAssetHistoryProps {
  open: boolean;
  target: VhfAsset | null;
  records: Record<string, unknown>[];
  loading: boolean;
  filters: { keyword: string; fromDate?: string; toDate?: string };
  filteredRecords: Record<string, unknown>[];
  hasActiveFilter: boolean;
  orgName: Map<string, string>;
  transmissionMap: Map<string, { code: string; name: string }>;
  onClose: () => void;
  onFiltersChange: (filters: { keyword: string; fromDate?: string; toDate?: string }) => void;
}

export default function VhfAssetHistory({
  open, target, records, loading, filters, filteredRecords, hasActiveFilter,
  orgName, transmissionMap, onClose, onFiltersChange,
}: VhfAssetHistoryProps) {
  const renderTimeline = (data: Record<string, unknown>[]) =>
    renderStandardHistoryCards({
      records: data,
      fieldLabels: VHF_ASSET_FIELD_LABELS,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        const resolved = histVal(fn, raw, orgName, transmissionMap);
        if (NUMERIC_HISTORY_FIELDS.has(fn) && raw) {
          const t = String(raw).trim();
          if (/^-?\d+(\.\d+)?$/.test(t)) return formatHistoryNumber(t);
        }
        return isBlankOrDash(resolved) ? '' : resolved;
      },
      resolveUnitName: (rec: Record<string, unknown>) => {
        const userUnitName = (rec.orgUnitName as string) || (rec.unitName as string);
        if (userUnitName && userUnitName.trim()) {
          return userUnitName;
        }
        const userOrgId = (rec.userOrgUnitId as string);
        if (userOrgId && orgName.has(userOrgId)) {
          return orgName.get(userOrgId) || '';
        }
        return '';
      },
      emptyMessage: hasActiveFilter
        ? 'Không tìm thấy kết quả phù hợp'
        : 'Chưa có thay đổi nào được ghi nhận',
    });

  const historyUpdateCount = useMemo(() => {
    return countStandardHistoryCards({
      records: filteredRecords,
      fieldLabels: VHF_ASSET_FIELD_LABELS,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        const resolved = histVal(fn, raw, orgName, transmissionMap);
        if (NUMERIC_HISTORY_FIELDS.has(fn) && raw) {
          const t = String(raw).trim();
          if (/^-?\d+(\.\d+)?$/.test(t)) return formatHistoryNumber(t);
        }
        return isBlankOrDash(resolved) ? '' : resolved;
      },
      resolveUnitName: (rec: Record<string, unknown>) => {
        const userUnitName = (rec.orgUnitName as string) || (rec.unitName as string);
        if (userUnitName && userUnitName.trim()) {
          return userUnitName;
        }
        const userOrgId = (rec.userOrgUnitId as string);
        if (userOrgId && orgName.has(userOrgId)) {
          return orgName.get(userOrgId) || '';
        }
        return '';
      },
    });
  }, [filteredRecords, orgName, transmissionMap]);

  return (
    <AppDrawer
      width="min(880px, 96vw)"
      rootClassName="vhf-asset-drawer-scope"
      className="vhf-asset-drawer-scope"
      mask
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space size={spaceSm} style={{ alignItems: 'center' }}>
            <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
            <span style={drawerTitleStyle}>
              Lịch sử thay đổi — {target?.assetName || target?.assetCode || ''}
            </span>
            <span style={{
              display: 'inline-flex', padding: '2px 10px', borderRadius: 999,
              fontSize: fontSizeLg - 1, fontWeight: fontWeightBold,
              background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px',
            }}>
              Tổng cộng {historyUpdateCount}
            </span>
          </Space>
        </div>
      }
      open={open}
      onClose={onClose}
      footer={null}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
      }}
    >
      <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
      <div style={{ flexShrink: 0 }}>
        {!loading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input
              placeholder="Tìm kiếm nội dung thay đổi..."
              allowClear
              value={filters.keyword || ''}
              onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value })}
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
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
              onClick={() => {}}
            >
              Tìm kiếm
            </Button>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <div style={{ padding: `${spaceMd}px 0` }}><LoadingSkeleton rows={5} /></div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
            <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
            <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
          </div>
        ) : hasActiveFilter && filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
            <SearchOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
            <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Không tìm thấy kết quả phù hợp</div>
          </div>
        ) : (
          renderTimeline(filteredRecords)
        )}
      </div>
    </AppDrawer>
  );
}
