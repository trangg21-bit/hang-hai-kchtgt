import React, { useState, useMemo, useEffect } from 'react';
import { Drawer, Input, DatePicker, Button, Typography, Space, Skeleton } from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  FileOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors, getRangePickerProps } from '../../themetokenchk';
import {
  actionPrimary,
  statusOperational,
  statusAttention,
  statusCritical,
  surfacePage,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  radiusSm,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceLg,
  spaceXl,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontWeightMedium,
  fontWeightBold,
  inputStyle,
  primaryButtonStyle,
} from '../../themetokenchk';

export interface HistoryChangeItem {
  field: string;
  oldValue?: any;
  newValue?: any;
}

export interface CommonHistoryEntry {
  id?: string;
  action?: string;
  changedBy?: string;
  changedByName?: string;
  actor?: string;
  changedAt?: string;
  createdAt?: string;
  timestamp?: string;
  orgUnitName?: string;
  unitName?: string;
  note?: string;
  description?: string;
  changes?: HistoryChangeItem[];
  [key: string]: any;
}

export interface CommonHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  entityName?: string;
  records: CommonHistoryEntry[];
  loading?: boolean;
  fieldLabelMap?: Record<string, string>;
  formatValue?: (fieldName: string, value: any) => string;
  width?: string | number;
  size?: 'default' | 'large' | '50%' | string;
}

const DEFAULT_ACTION_MAP: Record<string, { label: string; color: string; bg: string }> = {
  CREATE: { label: 'Tạo mới', color: statusOperational, bg: `${statusOperational}15` },
  CREATED: { label: 'Tạo mới', color: statusOperational, bg: `${statusOperational}15` },
  ADD: { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}15` },
  INSERT: { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}15` },

  UPDATE: { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` },
  UPDATED: { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` },
  EDIT: { label: 'Chỉnh sửa', color: actionPrimary, bg: `${actionPrimary}15` },
  DRAFT_SAVED: { label: 'Lưu tạm', color: '#64748b', bg: '#64748b15' },
  STATUS_CHANGED: { label: 'Đổi trạng thái', color: '#8b5cf6', bg: '#8b5cf615' },
  EXPIRED: { label: 'Hết hiệu lực', color: '#ef4444', bg: '#ef444415' },

  DELETE: { label: 'Xóa', color: '#64748b', bg: '#64748b15' },
  DELETED: { label: 'Xóa', color: '#64748b', bg: '#64748b15' },
  SOFT_DELETE: { label: 'Xóa mềm', color: '#64748b', bg: '#64748b15' },

  ATTACH_FILE: { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c715' },
  UPLOAD_ATTACHMENT: { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c715' },
  ATTACHMENT_UPLOADED: { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c715' },
  REMOVE_FILE: { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' },
  DELETE_ATTACHMENT: { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' },
  ATTACHMENT_DELETED: { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' },

  APPROVE: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },
  APPROVED: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },
  APPROVE_L1: { label: 'Phê duyệt C1', color: statusAttention, bg: `${statusAttention}15` },
  APPROVE_L2: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },

  REJECT: { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}15` },
  REJECTED: { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}15` },

  INVALIDATE: { label: 'Vô hiệu hóa', color: '#7c3aed', bg: '#7c3aed15' },
  LOCK: { label: 'Khóa tài khoản', color: '#d97706', bg: '#d9770615' },
  UNLOCK: { label: 'Mở khóa', color: statusOperational, bg: `${statusOperational}15` },
  EXTEND: { label: 'Gia hạn', color: '#2563eb', bg: '#2563eb15' },
};

const DEFAULT_FIELD_MAP: Record<string, string> = {
  documentName: 'Tên văn bản',
  documentNumber: 'Số hiệu văn bản',
  documentType: 'Loại văn bản',
  issuingAuthority: 'Cơ quan ban hành',
  signer: 'Người ký',
  issueDate: 'Ngày ban hành',
  effectiveDate: 'Ngày có hiệu lực',
  expirationDate: 'Ngày hết hiệu lực',
  applicationArea: 'Phạm vi áp dụng',
  validityStatus: 'Trạng thái hiệu lực',
  description: 'Mô tả',
  systemName: 'Tên hệ thống',
  location: 'Vị trí',
  conditionStatus: 'Tình trạng',
  operationalStatus: 'Trạng thái hoạt động',
  approvalStatus: 'Trạng thái phê duyệt',
  orgUnitId: 'Đơn vị quản lý',
  orgUnitName: 'Tên đơn vị quản lý',
  facilityName: 'Tên cơ sở',
  stationName: 'Tên trạm',
  channelCode: 'Mã luồng',
  channelName: 'Tên luồng',
  pierName: 'Tên cầu cảng',
  berthName: 'Tên bến cảng',
  dryPortName: 'Tên cảng cạn',
  beaconName: 'Tên báo hiệu',
  beaconCode: 'Mã báo hiệu',
};

function renderCommonHistoryValueTag(field: string, val: string) {
  if (!val || val === '—') {
    return <span style={{ color: textTertiary }}>—</span>;
  }
  const normKey = field.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
  const normVal = val.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

  if (normKey.includes('trang thai') || normKey.includes('status') || normKey.includes('hieu luc') || normKey.includes('tinh trang')) {
    if (normVal.includes('da phe duyet') || normVal.includes('con hieu luc') || normVal.includes('hoat dong') || normVal.includes('active') || normVal.includes('approved') || normVal.includes('valid')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 10px', borderRadius: 999, fontSize: 13, fontWeight: 500, color: statusOperational, background: `${statusOperational}18`, border: `1px solid ${statusOperational}40` }}>
          {val}
        </span>
      );
    }
    if (normVal.includes('tu choi') || normVal.includes('het hieu luc') || normVal.includes('hong') || normVal.includes('inactive') || normVal.includes('rejected') || normVal.includes('expired')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 10px', borderRadius: 999, fontSize: 13, fontWeight: 500, color: statusCritical, background: `${statusCritical}18`, border: `1px solid ${statusCritical}40` }}>
          {val}
        </span>
      );
    }
    if (normVal.includes('dang xem xet') || normVal.includes('chua co hieu luc') || normVal.includes('review') || normVal.includes('under_review') || normVal.includes('da phe duyet cap 1') || normVal.includes('cap 1')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 10px', borderRadius: 999, fontSize: 13, fontWeight: 500, color: actionPrimary, background: `${actionPrimary}18`, border: `1px solid ${actionPrimary}40` }}>
          {val}
        </span>
      );
    }
    if (normVal.includes('cho phe duyet') || normVal.includes('can bao duong') || normVal.includes('pending') || normVal.includes('draft') || normVal.includes('warning') || normVal.includes('proposed')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 10px', borderRadius: 999, fontSize: 13, fontWeight: 500, color: statusAttention, background: `${statusAttention}18`, border: `1px solid ${statusAttention}40` }}>
          {val}
        </span>
      );
    }
  }

  return <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{val}</span>;
}

const drawerTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeLg,
};

const drawerCloseBtnStyle: React.CSSProperties = {
  fontSize: fontSizeLg,
  color: textSecondary,
  cursor: 'pointer',
  padding: '4px 8px',
};

export const CommonHistoryDrawer: React.FC<CommonHistoryDrawerProps> = ({
  open,
  onClose,
  title = 'Lịch sử thay đổi',
  entityName,
  records,
  loading = false,
  fieldLabelMap = {},
  formatValue,
  width,
  size,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setKeyword('');
      setDateFrom('');
      setDateTo('');
    }
  }, [open]);

  const combinedFieldMap = useMemo(() => ({
    ...DEFAULT_FIELD_MAP,
    ...fieldLabelMap,
  }), [fieldLabelMap]);

  const resolveAction = (act?: string) => {
    if (!act) return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` };
    const upper = act.toUpperCase();
    if (DEFAULT_ACTION_MAP[upper]) return DEFAULT_ACTION_MAP[upper];
    return { label: act, color: actionPrimary, bg: `${actionPrimary}15` };
  };

  const getRecordTimestamp = (r: CommonHistoryEntry): string => {
    return r.changedAt || r.createdAt || r.timestamp || '';
  };

  const getRecordActor = (r: CommonHistoryEntry): string => {
    return r.changedByName || r.actor || r.changedBy || '—';
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return '—';
    const d = dayjs(ts);
    if (!d.isValid()) return ts;
    return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
  };

  const resolveFieldValue = (field: string, val: any): string => {
    if (val === null || val === undefined || val === '') return '—';
    if (formatValue) {
      const custom = formatValue(field, val);
      if (custom !== undefined) return custom;
    }
    if (typeof val === 'boolean') return val ? 'Có' : 'Không';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  // Filter and group records
  const { filteredGroups, totalCount } = useMemo(() => {
    const q = keyword.toLowerCase().trim();

    const filtered = (records || []).filter((r) => {
      const ts = getRecordTimestamp(r);
      const actor = getRecordActor(r).toLowerCase();
      const note = (r.note || r.description || '').toLowerCase();
      const act = (r.action || '').toLowerCase();
      const actLabel = resolveAction(r.action).label.toLowerCase();

      // Keyword search
      if (q) {
        let match = actor.includes(q) || note.includes(q) || act.includes(q) || actLabel.includes(q);
        if (!match && r.changes && Array.isArray(r.changes)) {
          match = r.changes.some((c) => {
            const fName = (combinedFieldMap[c.field] || c.field).toLowerCase();
            const ov = String(c.oldValue || '').toLowerCase();
            const nv = String(c.newValue || '').toLowerCase();
            return fName.includes(q) || ov.includes(q) || nv.includes(q);
          });
        }
        if (!match) return false;
      }

      // Date range filter
      if (dateFrom && ts) {
        if (dayjs(ts).isBefore(dayjs(dateFrom))) return false;
      }
      if (dateTo && ts) {
        if (dayjs(ts).isAfter(dayjs(dateTo))) return false;
      }

      return true;
    });

    // Sort newest first
    const sorted = [...filtered].sort((a, b) => {
      const timeA = new Date(getRecordTimestamp(a) || 0).getTime();
      const timeB = new Date(getRecordTimestamp(b) || 0).getTime();
      return timeB - timeA;
    });

    // Group items with same second and same actor
    const groups: { tsSec: number; ts: string; actor: string; unitName: string; items: CommonHistoryEntry[] }[] = [];
    for (const r of sorted) {
      const ts = getRecordTimestamp(r);
      const tsSec = ts ? Math.floor(new Date(ts).getTime() / 1000) : 0;
      const actor = getRecordActor(r);
      const unitName = r.orgUnitName || r.unitName || '';
      const prev = groups[groups.length - 1];

      if (prev && prev.tsSec === tsSec && prev.actor === actor) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec, ts, actor, unitName, items: [r] });
      }
    }

    return { filteredGroups: groups, totalCount: filtered.length };
  }, [records, keyword, dateFrom, dateTo, combinedFieldMap]);

  return (
    <Drawer
      rootClassName="vtssystemchk-theme-scope"
      size={width ? undefined : (size || 960)}
      width={width || 960}
      placement="right"
      open={open}
      onClose={onClose}
      closable={false}
      extra={
        <Button type="text" aria-label="Đóng lịch sử thay đổi" onClick={onClose} style={drawerCloseBtnStyle}>
          ✕
        </Button>
      }
      footer={null}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space size={spaceSm} style={{ alignItems: 'center' }}>
            <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
            <span style={drawerTitleStyle}>
              {entityName ? `${title} — ${entityName}` : title}
            </span>
            <span
              style={{
                display: 'inline-flex',
                padding: '2px 10px',
                borderRadius: radiusSm,
                fontSize: fontSizeLg - 1,
                fontWeight: fontWeightBold,
                background: `${colors.sidebarBg}15`,
                color: colors.sidebarBg,
                lineHeight: '20px',
              }}
            >
              Tổng cộng {totalCount}
            </span>
          </Space>
        </div>
      }
    >
      {/* ── Search & Filter Bar ────────────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
          <Input
            placeholder="Tìm kiếm nội dung thay đổi..."
            allowClear
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value;
              setSearchInput(val);
              if (!val) setKeyword('');
            }}
            onPressEnter={() => setKeyword(searchInput.trim())}
            style={{ ...inputStyle, flex: 1 }}
          />
          <DatePicker.RangePicker
            {...getRangePickerProps({
              value: (dateFrom && dateTo)
                ? [dayjs(dateFrom), dayjs(dateTo)]
                : (dateFrom ? [dayjs(dateFrom), null] : (dateTo ? [null, dayjs(dateTo)] : null)),
              onChange: (dates: any) => {
                if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                  setDateFrom('');
                  setDateTo('');
                } else {
                  setDateFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                  setDateTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                }
              },
              style: { ...inputStyle, width: 280 },
            })}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={() => setKeyword(searchInput.trim())}
            style={primaryButtonStyle}
          >
            Tìm kiếm
          </Button>
        </div>
      </div>

      {/* ── Timeline Body ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <div style={{ padding: spaceMd }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl * 2}px 0` }}>
            <HistoryOutlined style={{ fontSize: 48, color: textTertiary, marginBottom: spaceMd }} />
            <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
              {keyword || dateFrom || dateTo
                ? 'Không tìm thấy kết quả phù hợp'
                : 'Chưa có thay đổi nào được ghi nhận'}
            </div>
          </div>
        ) : (
          <div>
            {filteredGroups.map((group, gIdx) => {
              // Extract all changes from items in the group
              const groupChanges: HistoryChangeItem[] = [];
              const groupNotes: string[] = [];
              let primaryAction = group.items[0]?.action || 'UPDATE';

              group.items.forEach((item) => {
                if (item.action) primaryAction = item.action;
                if (item.note) groupNotes.push(item.note);
                if (item.description && item.description !== item.note) groupNotes.push(item.description);
                if (item.changes && Array.isArray(item.changes)) {
                  groupChanges.push(...item.changes);
                }
              });

              const actionMeta = resolveAction(primaryAction);
              const isCreate = primaryAction.toUpperCase().includes('CREATE') || primaryAction.toUpperCase().includes('ADD');
              const infoTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
              const rawUnit = group.unitName;
              const unitName = rawUnit && rawUnit !== '—' ? rawUnit : 'Cục Hàng hải Việt Nam';

              const validChanges = groupChanges.filter((change) => {
                const ov = resolveFieldValue(change.field, change.oldValue);
                const nv = resolveFieldValue(change.field, change.newValue);
                if (ov !== '—' && nv !== '—' && String(ov).trim() === String(nv).trim()) {
                  return false;
                }
                return true;
              });

              return (
                <div
                  key={gIdx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)',
                    gap: spaceLg,
                    alignItems: 'start',
                    marginBottom: gIdx < filteredGroups.length - 1 ? spaceMd : 0,
                  }}
                >
                  {/* Left Column: Metadata */}
                  <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceXs }}>
                      <Typography.Text
                        style={{
                          display: 'block',
                          fontSize: fontSizeLg - 1,
                          color: textPrimary,
                          fontWeight: fontWeightBold,
                          lineHeight: 1.5,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {group.ts ? formatTimestamp(group.ts) : '—'}
                      </Typography.Text>
                      <span style={{ flexShrink: 0 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '2px 10px',
                            borderRadius: 999,
                            fontSize: fontSizeSm + 1,
                            fontWeight: fontWeightMedium,
                            background: actionMeta.bg,
                            color: actionMeta.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {actionMeta.label}
                        </span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: spaceXs }}>
                      <Typography.Text
                        style={{
                          display: 'block',
                          fontSize: fontSizeSm + 1,
                          color: textSecondary,
                          fontWeight: fontWeightMedium,
                          lineHeight: 1.4,
                        }}
                      >
                        Người cập nhật: <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{group.actor || '—'}</span>
                      </Typography.Text>
                      <Typography.Text
                        style={{
                          display: 'block',
                          fontSize: fontSizeSm + 1,
                          color: textSecondary,
                          fontWeight: fontWeightMedium,
                          lineHeight: 1.4,
                        }}
                      >
                        Đơn vị: <span style={{ color: textPrimary }}>{unitName}</span>
                      </Typography.Text>
                    </div>
                  </div>

                  {/* Right Card: Changes & Notes */}
                  <div
                    style={{
                      position: 'relative',
                      minWidth: 0,
                      background: surfacePage,
                      borderRadius: radiusSm,
                      padding: `${spaceMd}px ${spaceLg}px`,
                      paddingLeft: spaceLg,
                      overflow: 'hidden',
                      border: `1px solid ${borderDefault}`,
                    }}
                  >
                    {/* Left Accent Gradient Bar */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: spaceXs,
                        background: `linear-gradient(180deg, ${actionMeta.color} 0%, ${actionMeta.color}40 100%)`,
                      }}
                    />

                    <Typography.Text
                      style={{
                        display: 'block',
                        color: colors.sidebarBg,
                        fontSize: fontSizeMd,
                        fontWeight: fontWeightBold,
                        marginBottom: spaceSm,
                      }}
                    >
                      {infoTitle}
                    </Typography.Text>

                    {/* Change list */}
                    {validChanges.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                        {validChanges.map((change, cIdx) => {
                          const label = combinedFieldMap[change.field] || change.field;
                          const ov = resolveFieldValue(change.field, change.oldValue);
                          const nv = resolveFieldValue(change.field, change.newValue);

                          const renderFormattedContent = (content: string, _isOld: boolean = false) => {
                            if (!content || content === '—') return <span style={{ color: textTertiary }}>—</span>;
                            const str = String(content).trim();
                            if (str.includes(',') && str.length > 25) {
                              const items = str.split(',').map((s) => s.trim()).filter(Boolean);
                              if (items.length > 1) {
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                                    {items.map((item, idx) => (
                                      <div key={idx} style={{ color: textPrimary, fontWeight: fontWeightMedium, lineHeight: '20px', wordBreak: 'break-word' }}>
                                        {item}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            }
                            return renderCommonHistoryValueTag(label, content);
                          };

                          if (isCreate) {
                            return (
                              <div
                                key={cIdx}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '170px minmax(100px, 1fr)',
                                  alignItems: 'flex-start',
                                  gap: spaceSm,
                                  fontSize: fontSizeMd,
                                  lineHeight: 1.6,
                                  padding: '3px 0',
                                }}
                              >
                                <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>
                                  {label ? `${label}:` : '—'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary }}>
                                  {renderFormattedContent(nv, false)}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={cIdx}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)',
                                alignItems: 'flex-start',
                                gap: spaceSm,
                                fontSize: fontSizeMd,
                                lineHeight: 1.6,
                                padding: '3px 0',
                              }}
                            >
                              <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>
                                {label ? `${label}:` : '—'}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word' }}>
                                {renderFormattedContent(ov, true)}
                              </div>
                              <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>
                                →
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word' }}>
                                {renderFormattedContent(nv, false)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : groupNotes.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Typography.Text
                          style={{
                            display: 'block',
                            color: textPrimary,
                            fontSize: fontSizeMd,
                            fontWeight: fontWeightBold,
                            marginBottom: spaceXs,
                          }}
                        >
                          Chi tiết thao tác:
                        </Typography.Text>
                        {groupNotes.map((note, nIdx) => (
                          <div key={nIdx} style={{ display: 'flex', alignItems: 'center', gap: spaceSm, fontSize: fontSizeMd, color: textPrimary }}>
                            {note.includes('tệp') || note.includes('file') ? (
                              <FileOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
                            ) : null}
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd, fontStyle: 'italic' }}>
                        Không có thông tin chi tiết thay đổi
                      </Typography.Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default CommonHistoryDrawer;
