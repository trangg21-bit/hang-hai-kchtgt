import { HistoryOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Input, Space } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { AppDrawer } from '../../components/shared/AppDrawer';
import toast from '../../components/ToastNotification';
import { fetchTransmissionAssetHistory } from '../../services/transmissionAsset/api';
import type { TransmissionAsset } from '../../services/transmissionAsset/types';
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

// === Constants ================================================================

export const EXCLUDED_CHANGE_FIELDS = new Set([
  'id', 'createdAt', 'updatedAt', 'deletedAt', 'createdBy', 'updatedBy',
  'spatialId', 'rejectionReason', 'level1ApprovalContent', 'level2ApprovalContent',
  'submittedAt', 'submittedBy', 'CREATE',
]);

export const NUMERIC_HISTORY_FIELDS = new Set([
  'quantity', 'originalValue', 'remainingValue',
  'depreciationRate', 'depreciationMonths', 'accumulatedDepreciation', 'annualDepreciation',
  'constructionYear', 'manufactureYear',
]);

export const TRANSMISSION_ASSET_FIELD_LABELS: Record<string, string> = {
  assetCode: 'Mã tài sản',
  assetName: 'Tên tài sản',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  parentOrgUnitId: 'Đơn vị quản lý cấp trên',
  transmissionId: 'Hệ thống truyền dẫn',
  assetType: 'Loại tài sản',
  assetCondition: 'Tình trạng tài sản',
  usageStatus: 'Trạng thái sử dụng',
  assetGroup: 'Nhóm tài sản',
  assetSubgroup: 'Phân nhóm tài sản',
  address: 'Địa chỉ / Vị trí đặt',
  origin: 'Xuất xứ',
  quantity: 'Số lượng',
  quantityUnit: 'Đơn vị tính',
  model: 'Model / Ký hiệu',
  serialNumber: 'Số serial',
  manufactureYear: 'Năm sản xuất',
  countryOfOrigin: 'Nước sản xuất',
  manufacturer: 'Hãng sản xuất',
  technicalSpecs: 'Thông số kỹ thuật',
  constructionYear: 'Năm xây dựng',
  useDate: 'Ngày đưa vào sử dụng',
  declarationDate: 'Ngày kê khai',
  originalValue: 'Nguyên giá (VNĐ)',
  remainingValue: 'Giá trị còn lại (VNĐ)',
  depreciationRate: 'Tỷ lệ hao mòn (%/năm)',
  depreciationMonths: 'Thời gian sử dụng (tháng)',
  accumulatedDepreciation: 'Hao mòn lũy kế (VNĐ)',
  annualDepreciation: 'Giá trị hao mòn năm (VNĐ)',
  depreciationStartDate: 'Ngày bắt đầu trích khấu hao',
  depreciationEndDate: 'Ngày kết thúc trích khấu hao',
  approvalStatus: 'Trạng thái phê duyệt',
  note: 'Ghi chú',
  attachmentName: 'Tài liệu đính kèm',
  attachments: 'Tài liệu đính kèm',
};

const HISTORY_FIELD_ORDER = [
  'assetCode', 'assetName', 'orgUnitId', 'usingOrgUnitId', 'transmissionId',
  'assetType', 'assetCondition', 'usageStatus', 'assetGroup', 'assetSubgroup',
  'address', 'origin', 'quantity', 'quantityUnit', 'model', 'serialNumber',
  'manufactureYear', 'countryOfOrigin', 'manufacturer', 'technicalSpecs',
  'constructionYear', 'useDate', 'declarationDate', 'originalValue', 'remainingValue',
  'depreciationRate', 'depreciationMonths', 'accumulatedDepreciation', 'annualDepreciation',
  'depreciationStartDate', 'depreciationEndDate', 'approvalStatus', 'note', 'attachmentName',
];

// === Resolve value helper =====================================================

export function histVal(
  fn: string,
  val: unknown,
  orgMap?: Map<string, string>,
  transmissionMap?: Map<string, { code: string; name: string }>,
): string {
  if (!val || val === '(null)' || val === 'null' || val === '-' || val === '\u2014' || val === '\u2013') return '';
  const v = String(val).trim();
  if (
    (fn === 'orgUnitId' || fn === 'usingOrgUnitId' || fn === 'parentOrgUnitId') && orgMap
  ) {
    const f = orgMap.get(v);
    return f ? f.split(' - ').pop() || f : v;
  }
  if (fn === 'transmissionId' && transmissionMap) {
    const t = transmissionMap.get(v);
    return t ? (t.code ? `${t.code} - ${t.name}` : t.name) : v;
  }
  if (fn === 'approvalStatus') {
    const m: Record<string, string> = {
      DRAFT: 'Lưu tạm', PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cục', APPROVED_LEVEL2: 'Đã phê duyệt',
      APPROVED: 'Đã phê duyệt', REJECTED: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL2: 'Từ chối cấp Cục',
      ARCHIVED: 'Đã xóa', DELETED: 'Đã xóa',
    };
    return m[v.toUpperCase()] || v;
  }
  if (fn.endsWith('At') || fn.endsWith('Date')) {
    try {
      let d = dayjs(v);
      if (!d.isValid()) { d = dayjs(v.replace(/\.\d+$/, '')); }
      return d.isValid()
        ? (fn.includes('useDate') || fn.includes('declarationDate') || fn.includes('depreciationStartDate') || fn.includes('depreciationEndDate')
            ? d.format('DD/MM/YYYY')
            : d.format('DD/MM/YYYY HH:mm'))
        : v;
    } catch { return v; }
  }
  return v;
}

// === Hook ====================================================================

export interface UseTransmissionHistoryOptions {
  orgName: Map<string, string>;
  transmissionMap: Map<string, { code: string; name: string }>;
}

export function useTransmissionHistory({ orgName, transmissionMap }: UseTransmissionHistoryOptions) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<TransmissionAsset | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  const openHistory = useCallback(async (r: TransmissionAsset) => {
    setTarget(r); setOpen(true); setLoading(true); setRecords([]); setFilters({ keyword: '' });
    try {
      const d = (await fetchTransmissionAssetHistory(r.id)) as
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
        const label = TRANSMISSION_ASSET_FIELD_LABELS[fn] || fn;
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

export interface TransmissionAssetHistoryProps {
  open: boolean;
  target: TransmissionAsset | null;
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

export default function TransmissionAssetHistory({
  open, target, records, loading, filters, filteredRecords, hasActiveFilter,
  orgName, transmissionMap, onClose, onFiltersChange,
}: TransmissionAssetHistoryProps) {
  const renderTimeline = (data: Record<string, unknown>[]) =>
    renderStandardHistoryCards({
      records: data,
      fieldLabels: TRANSMISSION_ASSET_FIELD_LABELS,
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
      fieldLabels: TRANSMISSION_ASSET_FIELD_LABELS,
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
      rootClassName="transmission-asset-drawer-scope"
      className="transmission-asset-drawer-scope"
      mask
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space size={spaceSm} style={{ alignItems: 'center' }}>
            <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
            <span style={drawerTitleStyle}>
              {'Lịch sử thay đổi — '}{target?.assetName || target?.assetCode || ''}
            </span>
            <span
              style={{
                display: 'inline-flex', padding: '2px 10px', borderRadius: 999,
                fontSize: fontSizeLg - 1, fontWeight: fontWeightBold,
                background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px',
              }}
            >
              {'Tổng cộng '}{historyUpdateCount}
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
