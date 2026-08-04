import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Button, Tag, Modal, Input, Alert, Descriptions, Divider, DatePicker, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, HistoryOutlined, ExclamationCircleOutlined, EnvironmentOutlined, FileOutlined, ClockCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchBuoyStationList, fetchBuoyStationById, deleteBuoyStation, submitBuoyStationForApproval, approveBuoyStationL1, approveBuoyStationL2, rejectBuoyStation } from '../../services/station/beacon/api';
import type { BuoyStationResponse } from '../../services/station/beacon/types';
import { BUOY_TYPE_OPTIONS, BUOY_TYPE_MAP } from '../../types/beacon';
import api from '../../services/api';
import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import { portCRUD } from '../../services/portService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { statusOperational, statusAttention, statusCritical, statusDraft, actionPrimary, cardStyle, textPrimary, textSecondary, textTertiary, borderDefault, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold, radiusPill, spaceMd, spaceSm, spaceFormField } from '../../tokens';
import { colors } from '../../theme';

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Nháp' }, PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt' },
  APPROVED_L1: { color: statusAttention, label: 'Đã phê duyệt L1' }, PUBLISHED: { color: statusOperational, label: 'Đã công bố' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
};
const TAB_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary }, { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt', color: actionPrimary }, { key: 'APPROVED_L1', label: 'Đã phê duyệt L1', color: statusAttention },
  { key: 'PUBLISHED', label: 'Đã công bố', color: statusOperational }, { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];
const COLOR_MAP: Record<string, string> = { RED: 'Đỏ', GREEN: 'Xanh lá', BLACK_RED: 'Đen+Đỏ', BLACK_YELLOW: 'Đen+Vàng', WHITE: 'Trắng', YELLOW: 'Vàng', ORANGE: 'Cam' };
const SHAPE_MAP: Record<string, string> = { CAN: 'Hình trụ', CONE: 'Hình nón', SPAR: 'Trụ', BELL: 'Chuông', BUCKET: 'Gáo', TUBULAR: 'Ống' };
const LIGHT_MAP: Record<string, string> = { FL: 'FL-Chớp đơn', 'FL(2)': 'FL(2)-Chớp nhóm 2', 'FL(3)': 'FL(3)-Chớp nhóm 3', Iso: 'Iso-Đồng pha', Q: 'Q-Chớp nhanh', VQ: 'VQ-Chớp rất nhanh', Oc: 'Oc-Huyền phù', F: 'F-Cố định' };
const GEO_MAP: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };
const COORD_MAP: Record<string, string> = { WGS84: 'WGS-84', VN2000: 'VN-2000' };

const STATION_FIELD_MAP: Record<string, string> = {
  name: 'Tên nhà trạm', code: 'Mã nhà trạm', type: 'Loại',
  color: 'Màu sắc', shape: 'Hình dạng', lightCharacteristic: 'Đặc tính ánh sáng',
  range: 'Tầm xa', description: 'Mô tả', unitId: 'Đơn vị quản lý',
  operatingOrgId: 'ĐV khai thác', portId: 'Cảng biển', waterwayId: 'Tuyến đường thủy',
  waterwayRouteId: 'Tuyến luồng', province: 'Tỉnh/TP', address: 'Địa chỉ',
  constructionDate: 'Thời điểm XD', totalArea: 'Tổng diện tích', usableArea: 'Diện tích SD',
  staffCount: 'Nhân sự', lastMaintenanceYear: 'Năm BT gần nhất', note: 'Ghi chú',
  objectType: 'Loại đối tượng', icon: 'Biểu tượng', coordinateSystem: 'Hệ quy chiếu',
  displayFormat: 'Định dạng hiển thị', lastInspectionDate: 'KT gần nhất',
  nextInspectionDate: 'KT kế tiếp', isActive: 'Hoạt động', status: 'Trạng thái',
  approvalStatus: 'Trạng thái duyệt', rejectionReason: 'Lý do từ chối',
  approvalLevel: 'Cấp duyệt', approvedDate: 'Ngày duyệt', approvedBy: 'Người duyệt',
  spatialId: 'Vị trí GIS', provinceId: 'Tỉnh/TP',
};

function fmt(d?: string) { if (!d) return '—'; try { return dayjs(d).format('DD/MM/YYYY'); } catch { return d; } }
function fmtDt(d?: string) { if (!d) return '—'; try { return dayjs(d).format('DD/MM/YYYY HH:mm'); } catch { return d; } }

export default function BuoyStationList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const [filterName, setFilterName] = useState(''); const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(20);
  const [allData, setAllData] = useState<BuoyStationResponse[]>([]);
  const [dataSource, setDataSource] = useState<BuoyStationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false); const [isError, setIsError] = useState(false); const [error, setError] = useState<Error | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [portMap, setPortMap] = useState<Map<string, string>>(new Map());
  const orgMap = useMemo(() => { const m = new Map<string, string>(); organizations.forEach(o => m.set(o.id, o.name)); return m; }, [organizations]);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [detailOpen, setDetailOpen] = useState(false); const [detailRecord, setDetailRecord] = useState<BuoyStationResponse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false); const [deletingRecord, setDeletingRecord] = useState<BuoyStationResponse | null>(null); const [deleteText, setDeleteText] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false); const [rejectingRecord, setRejectingRecord] = useState<BuoyStationResponse | null>(null); const [rejectReason, setRejectReason] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<BuoyStationResponse | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState(''); const [historyTo, setHistoryTo] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState<Record<number,boolean>>({});
  const [historyVisible, setHistoryVisible] = useState(10);
  const historySearchRef = useRef('');

  useEffect(() => { (async () => { try { const r = await organizationService.list({ pageSize: 1000 }); setOrganizations(r.data || []); } catch { /* */ } })(); (async () => { try { const r = await userService.list({ pageSize: 1000 }); const u = r.data || (r as any).content || []; const m = new Map<string, string>(); u.forEach((x: any) => m.set(x.id, x.fullName || x.username || x.id)); setUserMap(m); } catch { /* */ } })(); (async () => { try { const r = await portCRUD.findAll({ page: 1, size: 1000 }); const m = new Map<string, string>(); const list = r.data || (r as any).content || []; list.forEach((p: any) => m.set(p.id, p.portName || p.name)); setPortMap(m); } catch { /* */ } })(); }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const res = await fetchBuoyStationList({ name: filterName || undefined, code: filterCode || undefined, type: filterType || undefined });
      const all = res.content || [];
      const counts: Record<string, number> = { all: all.length };
      TAB_LIST.slice(1).forEach(t => { counts[t.key] = all.filter(d => d.status === t.key).length; });
      setTabCounts(counts);
      const sf = activeTab !== 'all' ? activeTab : undefined;
      const filtered = sf ? all.filter(d => d.status === sf) : all;
      setAllData(filtered); setTotal(filtered.length);
      setDataSource(filtered.slice((page - 1) * pageSize, page * pageSize));
    } catch (e: unknown) { setIsError(true); setError(e instanceof Error ? e : new Error('Không thể tải danh sách')); }
    finally { setIsLoading(false); }
  }, [filterName, filterCode, filterType, activeTab, page, pageSize]);

  useEffect(() => { void fetchData(); }, [fetchData]);
  useEffect(() => { setDataSource(allData.slice((page - 1) * pageSize, page * pageSize)); }, [allData, page, pageSize]);
  useEffect(() => { setPage(1); }, [filterName, filterCode, filterType, activeTab]);

  const openDetail = useCallback(async (r: BuoyStationResponse) => { setDetailOpen(true); setDetailRecord(r); try { const f = await fetchBuoyStationById(r.id); setDetailRecord(f); } catch { /* */ } }, []);

  const openHistoryModal = useCallback(async (r: BuoyStationResponse) => {
    setHistoryModalOpen(true); setHistoryRecord(r); setHistoryLoading(true);
    setHistorySearch(''); setHistoryFrom(''); setHistoryTo('');
    setHistoryExpanded({}); setHistoryVisible(10); historySearchRef.current = '';
    try { const res = await api.get(`/v1/buoy-station/${r.id}/history`); const d = res.data?.data; setHistoryData(Array.isArray(d?.changeHistory) ? d.changeHistory : []); } catch { setHistoryData([]); }
    finally { setHistoryLoading(false); }
  }, []);

  const translateStationVal = useCallback((fn: string, val: string) => {
    if (!val || val === 'null' || val === '(null)') return '—';
    if (fn === 'isActive') return val === 'true' ? 'Có' : 'Ngừng';
    if (fn === 'type') return BUOY_TYPE_OPTIONS.find(o=>o.value===val)?.label || val;
    if (fn === 'color') return COLOR_MAP[val] || val;
    if (fn === 'shape') return SHAPE_MAP[val] || val;
    if (fn === 'lightCharacteristic') return LIGHT_MAP[val] || val;
    if (fn === 'objectType') return GEO_MAP[val] || val;
    if (fn === 'coordinateSystem') return COORD_MAP[val] || val;
    if (fn === 'unitId'||fn==='operatingOrgId'||fn==='waterwayId') return orgMap.get(val) || val.substring(0,8)+'…';
    if (fn === 'portId') return portMap.get(val) || val.substring(0,8)+'…';
    if (fn === 'approvedBy') return userMap.get(val) || val.substring(0,8)+'…';
    if (fn === 'status'||fn==='approvalStatus') {
      const m: Record<string,string> = { DRAFT:'Nháp', PENDING:'Chờ duyệt', PENDING_APPROVAL:'Chờ phê duyệt', APPROVED_L1:'Đã phê duyệt L1', PUBLISHED:'Đã công bố', REJECTED:'Từ chối' };
      return m[val] || APPROVAL_STYLE_MAP[val]?.label || val;
    }
    if (fn === 'lastInspectionDate'||fn==='nextInspectionDate'||fn==='constructionDate'||fn==='approvedDate') return fmtDt(val);
    return val;
  }, [orgMap, userMap, portMap]);
  const openDelete = useCallback((r: BuoyStationResponse) => { setDeletingRecord(r); setDeleteText(''); setDeleteOpen(true); }, []);
  const confirmDelete = useCallback(async () => { if (!deletingRecord) return; if (deleteText.trim() !== deletingRecord.name && deleteText.trim() !== 'XÓA') { toast.error('Nhập đúng tên hoặc "XÓA"'); return; } try { await deleteBuoyStation(deletingRecord.id); toast.success('Đã xóa'); setDeleteOpen(false); setDeletingRecord(null); void fetchData(); } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Xóa thất bại'); } }, [deletingRecord, deleteText, fetchData]);
  const submitApproval = useCallback(async (r: BuoyStationResponse) => { try { await submitBuoyStationForApproval(r.id); toast.success('Đã gửi phê duyệt'); void fetchData(); } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Gửi thất bại'); } }, [fetchData]);
  const approveL1 = useCallback(async (r: BuoyStationResponse) => { const aid = currentUser?.userId; if (!aid) { toast.error('Không xác định được người dùng'); return; } try { await approveBuoyStationL1(r.id, aid); toast.success('Đã phê duyệt L1'); void fetchData(); } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Thất bại'); } }, [fetchData, currentUser]);
  const approveL2 = useCallback(async (r: BuoyStationResponse) => { const aid = currentUser?.userId; if (!aid) { toast.error('Không xác định được người dùng'); return; } try { await approveBuoyStationL2(r.id, aid); toast.success('Đã phê duyệt L2 - Công bố'); void fetchData(); } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Thất bại'); } }, [fetchData, currentUser]);
  const openReject = useCallback((r: BuoyStationResponse) => { setRejectingRecord(r); setRejectReason(''); setRejectOpen(true); }, []);
  const confirmReject = useCallback(async () => { if (!rejectingRecord) return; const rr = rejectReason.trim(); if (!rr) { toast.error('Nhập lý do'); return; } if (rr.length < 10) { toast.error('Tối thiểu 10 ký tự'); return; } const aid = currentUser?.userId; if (!aid) { toast.error('Không xác định được người dùng'); return; } try { await rejectBuoyStation(rejectingRecord.id, rr, aid); toast.success('Đã từ chối'); setRejectOpen(false); setRejectingRecord(null); setRejectReason(''); setActiveTab('REJECTED'); setPage(1); void fetchData(); } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Thất bại'); } }, [rejectingRecord, rejectReason, fetchData, currentUser]);

  const filterFields = useMemo(() => [
    { key: 'managingUnitId', type: 'select' as const, label: 'Đơn vị quản lý', placeholder: 'Chọn đơn vị', width: 320, options: organizations.map(o => ({ value: o.id, label: o.name })) },
    { key: 'name', type: 'search' as const, label: 'Tên nhà trạm', placeholder: 'Tìm theo tên...', width: 280 },
    { key: 'code', type: 'search' as const, label: 'Mã nhà trạm', placeholder: 'Tìm theo mã...', width: 240 },
    { key: 'type', type: 'select' as const, label: 'Loại', placeholder: 'Chọn loại', options: BUOY_TYPE_OPTIONS },
  ], [organizations]);

  const columns = useMemo(() => [
    { key: 'seq', label: 'STT', width: 55, type: 'mono' as const, align: 'center' as const, render: (_: unknown, __: BuoyStationResponse, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + i + 1}</span> },
    { key: 'code', label: 'Mã', dataIndex: 'code' as any, width: 150, render: (v: string) => <Tag color="cyan" style={{ fontSize: fontSizeMd }}>{v}</Tag> },
    { key: 'name', label: 'Tên nhà trạm', dataIndex: 'name' as any, width: 220, ellipsis: true, render: (v: string) => <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary }}>{v}</span> },
    { key: 'type', label: 'Loại', dataIndex: 'type' as any, width: 180, render: (v: string) => { const m = BUOY_TYPE_MAP[v as keyof typeof BUOY_TYPE_MAP]; const l = BUOY_TYPE_OPTIONS.find(o => o.value === v)?.label || v; return m ? <Tag color={m.color}>{l}</Tag> : <span>{v || '—'}</span>; } },
    { key: 'latitude', label: 'Vĩ độ', dataIndex: 'latitude' as any, width: 100, align: 'right' as const, render: (v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v != null ? v.toFixed(4) : '—'}</span> },
    { key: 'longitude', label: 'Kinh độ', dataIndex: 'longitude' as any, width: 100, align: 'right' as const, render: (v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v != null ? v.toFixed(4) : '—'}</span> },
    { key: 'range', label: 'Tầm xa (HL)', dataIndex: 'range' as any, width: 100, align: 'right' as const, render: (v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v != null ? v.toFixed(1) : '—'}</span> },
    { key: 'unitId', label: 'Đơn vị quản lý', dataIndex: 'unitId' as any, width: 180, ellipsis: true, render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v ? (orgMap.get(v) || v) : '—'}</span> },
    { key: 'lastInspectionDate', label: 'KT gần nhất', dataIndex: 'lastInspectionDate' as any, width: 120, render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{fmt(v)}</span> },
    { key: 'nextInspectionDate', label: 'KT kế tiếp', dataIndex: 'nextInspectionDate' as any, width: 120, render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{fmt(v)}</span> },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status' as any, width: 160, align: 'center' as const, render: (s: string) => { if (!s) return <span style={{ color: textTertiary }}>—</span>; const m = APPROVAL_STYLE_MAP[s] || { color: 'default', label: s }; let c = textTertiary; if (m.color === statusOperational) c = statusOperational; else if (m.color === statusCritical) c = statusCritical; else if (m.color === statusAttention) c = statusAttention; else if (m.color === actionPrimary) c = actionPrimary; else if (m.color === statusDraft) c = statusDraft; return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${c}15`, color: c }}>{m.label}</span>; } },
  ], [page, pageSize, orgMap]);

  const rowActions = useCallback((r: BuoyStationResponse) => {
    const a: any[] = [];
    a.push({ key: 'view', label: 'Chi tiết', icon: <EyeOutlined />, onClick: () => openDetail(r) });
    if (hasPerm('data:read') || hasPerm('admin:manage')) a.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => navigate(`/buoy-station/${r.id}?mode=edit`) });
    if (r.latitude != null && r.longitude != null) a.push({ key: 'loc', label: 'Xem vị trí', icon: <EnvironmentOutlined />, onClick: () => window.open(`https://www.google.com/maps?q=${r.latitude},${r.longitude}`, '_blank') });
    a.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => openHistoryModal(r) });
    if ((hasPerm('data:read') || hasPerm('admin:manage')) && (r.status === 'DRAFT' || r.status === 'REJECTED')) a.push({ key: 'submit', label: 'Gửi phê duyệt', icon: <CheckCircleOutlined />, onClick: () => submitApproval(r) });
    const canApp = hasPerm('admin:manage') || hasPerm('data:read');
    if (canApp && r.status === 'PENDING_APPROVAL') { a.push({ key: 'appL1', label: 'Phê duyệt L1', icon: <CheckCircleOutlined />, onClick: () => approveL1(r) }); a.push({ key: 'rej', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => openReject(r), danger: true }); }
    if (canApp && r.status === 'APPROVED_L1') { a.push({ key: 'appL2', label: 'Phê duyệt L2', icon: <CheckCircleOutlined />, onClick: () => approveL2(r) }); a.push({ key: 'rej', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => openReject(r), danger: true }); }
    if ((hasPerm('admin:manage') || hasPerm('data:read')) && r.status === 'PUBLISHED') a.push({ key: 'del', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => openDelete(r), danger: true });
    return a;
  }, [hasPerm, navigate, openDetail, submitApproval, approveL1, approveL2, openReject, openDelete, openHistoryModal]);

  const toggleSec = (k: string) => setCollapsed(p => ({ ...p, [k]: !p[k] }));
  const renderDetail = () => {
    if (!detailRecord) return null;
    const r = detailRecord;
    return (<div>
      <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer' }} onClick={() => toggleSec('gen')}>{collapsed.gen ? '▶' : '▼'} Thông tin chung</Divider>
      {!collapsed.gen && (<Descriptions column={2} size="small" bordered labelStyle={{ width: 160 }}><Descriptions.Item label="Mã">{r.code}</Descriptions.Item><Descriptions.Item label="Tên">{r.name}</Descriptions.Item><Descriptions.Item label="Loại">{BUOY_TYPE_OPTIONS.find(o => o.value === r.type)?.label || r.type || '—'}</Descriptions.Item><Descriptions.Item label="Đơn vị QL">{r.unitId ? (orgMap.get(r.unitId) || r.unitId) : '—'}</Descriptions.Item><Descriptions.Item label="ĐV khai thác">{r.operatingOrgId ? (orgMap.get(r.operatingOrgId) || r.operatingOrgId) : '—'}</Descriptions.Item><Descriptions.Item label="Tỉnh/TP">{r.province || '—'}</Descriptions.Item><Descriptions.Item label="Địa chỉ" span={2}>{r.address || '—'}</Descriptions.Item><Descriptions.Item label="Thời điểm XD">{fmt(r.constructionDate)}</Descriptions.Item><Descriptions.Item label="Tổng DT (m²)">{r.totalArea != null ? r.totalArea : '—'}</Descriptions.Item><Descriptions.Item label="DT SD (m²)">{r.usableArea != null ? r.usableArea : '—'}</Descriptions.Item><Descriptions.Item label="Nhân sự">{r.staffCount != null ? r.staffCount : '—'}</Descriptions.Item><Descriptions.Item label="Năm BT gần nhất">{r.lastMaintenanceYear != null ? r.lastMaintenanceYear : '—'}</Descriptions.Item><Descriptions.Item label="Ghi chú" span={2}>{r.note || '—'}</Descriptions.Item><Descriptions.Item label="Mô tả" span={2}>{r.description || '—'}</Descriptions.Item></Descriptions>)}
      <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }} onClick={() => toggleSec('tech')}>{collapsed.tech ? '▶' : '▼'} Kỹ thuật & Vị trí</Divider>
      {!collapsed.tech && (<Descriptions column={2} size="small" bordered labelStyle={{ width: 160 }}><Descriptions.Item label="Kinh độ">{r.longitude != null ? r.longitude.toFixed(6) : '—'}</Descriptions.Item><Descriptions.Item label="Vĩ độ">{r.latitude != null ? r.latitude.toFixed(6) : '—'}</Descriptions.Item><Descriptions.Item label="Tầm xa">{r.range != null ? `${r.range} HL` : '—'}</Descriptions.Item><Descriptions.Item label="Màu sắc">{r.color ? (COLOR_MAP[r.color] || r.color) : '—'}</Descriptions.Item><Descriptions.Item label="Hình dạng">{r.shape ? (SHAPE_MAP[r.shape] || r.shape) : '—'}</Descriptions.Item><Descriptions.Item label="Đặc tính AS">{r.lightCharacteristic ? (LIGHT_MAP[r.lightCharacteristic] || r.lightCharacteristic) : '—'}</Descriptions.Item><Descriptions.Item label="Loại đối tượng">{GEO_MAP[r.objectType || ''] || r.objectType || '—'}</Descriptions.Item><Descriptions.Item label="Hệ quy chiếu">{COORD_MAP[r.coordinateSystem || ''] || r.coordinateSystem || '—'}</Descriptions.Item><Descriptions.Item label="Hoạt động"><Tag color={r.isActive ? 'green' : 'default'}>{r.isActive ? 'Có' : 'Ngừng'}</Tag></Descriptions.Item><Descriptions.Item label="KT gần nhất">{fmt(r.lastInspectionDate)}</Descriptions.Item><Descriptions.Item label="KT kế tiếp">{fmt(r.nextInspectionDate)}</Descriptions.Item></Descriptions>)}
      <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }} onClick={() => toggleSec('appr')}>{collapsed.appr ? '▶' : '▼'} Phê duyệt</Divider>
      {!collapsed.appr && (<Descriptions column={2} size="small" bordered labelStyle={{ width: 160 }}><Descriptions.Item label="Trạng thái"><Tag color={APPROVAL_STYLE_MAP[r.status || '']?.color || 'default'}>{APPROVAL_STYLE_MAP[r.status || '']?.label || r.status}</Tag></Descriptions.Item><Descriptions.Item label="Ngày tạo">{fmtDt(r.createdAt)}</Descriptions.Item><Descriptions.Item label="Ngày cập nhật">{fmtDt(r.updatedAt)}</Descriptions.Item></Descriptions>)}
    </div>);
  };

  return (<div style={{ minHeight: '100%', marginTop: -8 }}>
    <ScreenHeader breadcrumb={[{ label: 'Báo hiệu hàng hải' }, { label: 'Nhà trạm phao tiêu' }]} actions={[{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => navigate('/buoy-station/create') }]} />
    <FilterBar fields={filterFields} onSearch={(v: any) => { setManagingUnitId(v.managingUnitId || undefined); setFilterName(v.name || ''); setFilterCode(v.code || ''); setFilterType(v.type || undefined); setPage(1); }} onReset={() => { setManagingUnitId(undefined); setFilterName(''); setFilterCode(''); setFilterType(undefined); setActiveTab('all'); setPage(1); }} />
    <div style={{ ...cardStyle, marginBottom: 4, display: 'flex', alignItems: 'center', padding: '4px 16px' }}>
      <div style={{ flex: 1 }} />
      <StatusTabs tabs={TAB_LIST.map(t => ({ key: t.key, label: t.label, count: tabCounts[t.key] ?? 0, color: t.color, active: activeTab === t.key }))} onChange={(k: string) => { setActiveTab(k); setPage(1); }} />
      <div style={{ flex: 1 }} />
    </div>
    <div style={{ ...cardStyle, padding: '8px 16px' }}>
      {isLoading && <LoadingSkeleton rows={8} />}
      {isError && <ErrorState message={error?.message || 'Không thể tải danh sách'} onRetry={fetchData} />}
      {!isLoading && !isError && dataSource.length === 0 && <EmptyState description="Không tìm thấy nhà trạm nào" />}
      {!isLoading && !isError && dataSource.length > 0 && (<div style={{ overflowX: 'auto' }}><DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} scroll={{ x: 1800, y: 'calc(100vh - 450px)' }} /><Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} /></div>)}
    </div>
    <Modal title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Chi tiết: {detailRecord?.name}</span>} open={detailOpen} onCancel={() => { setDetailOpen(false); setDetailRecord(null); }} width={800} footer={[<Button key="close" onClick={() => { setDetailOpen(false); setDetailRecord(null); }} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Đóng</Button>, (hasPerm('data:read') || hasPerm('admin:manage')) && detailRecord ? <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => { setDetailOpen(false); navigate(`/buoy-station/${detailRecord.id}?mode=edit`); }} style={{ background: actionPrimary, borderColor: actionPrimary, borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Chỉnh sửa</Button> : null].filter(Boolean)}><div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '8px 0' }}>{renderDetail()}</div></Modal>
    <Modal title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa</span>} open={deleteOpen} onCancel={() => { setDeleteOpen(false); setDeletingRecord(null); }} width={480} footer={[<Button key="cancel" onClick={() => { setDeleteOpen(false); setDeletingRecord(null); }} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>, <Button key="del" type="primary" danger onClick={confirmDelete} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>]}>
      <div style={{ padding: '8px 0' }}><Alert message="Hành động này không thể hoàn tác" type="warning" showIcon icon={<ExclamationCircleOutlined />} style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} /><p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Nhập <strong>tên nhà trạm</strong> hoặc gõ <strong>"XÓA"</strong></p>{deletingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>Nhà trạm: <strong style={{ color: textPrimary }}>{deletingRecord.name}</strong></p>}<Input placeholder="Nhập tên hoặc XÓA" value={deleteText} onChange={e => setDeleteText(e.target.value)} onPressEnter={confirmDelete} style={{ borderRadius: radiusPill, height: 40 }} autoFocus /></div>
    </Modal>
    <Modal title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>} open={rejectOpen} onCancel={() => { setRejectOpen(false); setRejectingRecord(null); }} width={480} footer={[<Button key="cancel" onClick={() => { setRejectOpen(false); setRejectingRecord(null); }} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>, <Button key="rej" type="primary" danger onClick={confirmReject} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>]}>
      <div style={{ padding: '8px 0' }}><p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Nhập lý do từ chối:</p>{rejectingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectingRecord.name}</strong></p>}<Input.TextArea placeholder="Nhập lý do (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} maxLength={500} showCount style={{ borderRadius: 8, fontSize: fontSizeMd }} /></div>
    </Modal>

      <Modal title={<Space><HistoryOutlined style={{ color: actionPrimary, fontSize: 20 }} /><span style={{ color: actionPrimary, fontWeight: fontWeightBold, fontSize: 15 }}>{historyRecord ? `Lịch sử thay đổi — ${historyRecord.name}` : 'Lịch sử thay đổi'}</span></Space>}
        open={historyModalOpen} onCancel={() => { setHistoryModalOpen(false); setHistoryRecord(null); }}
        footer={null} width={880} styles={{ body: { padding: spaceMd, maxHeight: '68vh', overflowY: 'auto' } }}>
        {!historyLoading && (<div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}><Input.Search placeholder="Tìm kiếm..." allowClear value={historySearch} onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1 }} /><DatePicker placeholder="Từ" value={historyFrom ? dayjs(historyFrom) : null} onChange={d => setHistoryFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')} style={{ width: 170 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} /><DatePicker placeholder="Đến" value={historyTo ? dayjs(historyTo) : null} onChange={d => setHistoryTo(d ? d.format('YYYY-MM-DD HH:mm') : '')} style={{ width: 170 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} /></div>)}
        {historyLoading ? <LoadingSkeleton rows={5} /> : historyData.length === 0 ? (<div style={{ textAlign: 'center', padding: '32px 0' }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary }} /><div style={{ color: textTertiary, fontSize: 13 }}>Chưa có thay đổi nào</div></div>) : (() => {
          const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000); const sorted = [...historyData].sort((a: any, b: any) => new Date(b.changedAt||b.createdAt||0).getTime() - new Date(a.changedAt||a.createdAt||0).getTime()); const q = historySearch.toLowerCase().trim();
          const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
          for (const r of sorted) { if (q) { const fn = (r.fieldName||r.fieldChanged||'').toLowerCase(); const ov = (r.oldValue||'').toLowerCase(); const nv = (r.newValue||'').toLowerCase(); const label = (STATION_FIELD_MAP[r.fieldName||r.fieldChanged]||'').toLowerCase(); if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !label.includes(q)) continue; } if (historyFrom || historyTo) { const cd = (r.changedAt||r.createdAt||'').substring(0,16); if (historyFrom && cd < historyFrom.replace(' ','T')) continue; if (historyTo && cd > historyTo.replace(' ','T')+':59') continue; } const ts = r.changedAt||r.createdAt||''; const sec = ts ? toSec(ts) : 0; const prev = groups[groups.length-1]; if (prev && prev.tsSec===sec && prev.actor===(r.changedBy||'')) prev.items.push(r); else groups.push({ tsSec:sec, ts, actor:r.changedBy||'', items:[r] }); }
          if (groups.length===0) return <div style={{ textAlign:'center',padding:'32px 0' }}><HistoryOutlined style={{ fontSize:40,color:textTertiary,marginBottom:spaceMd }} /><div style={{ color:textTertiary,fontSize:13 }}>{q?'Không tìm thấy kết quả phù hợp':'Chưa có thay đổi nào'}</div></div>;
          const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}  ·  ${d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}`; };
          if (q.length>0 && historySearchRef.current !== q) { historySearchRef.current = q; const init: Record<number,boolean>={}; groups.forEach((_,i)=>{init[i]=true}); setTimeout(()=>setHistoryExpanded(init),0); } else if (q.length===0 && historySearchRef.current !== '') { historySearchRef.current = ''; const init: Record<number,boolean>={}; groups.forEach((_,i)=>{init[i]=false}); setTimeout(()=>setHistoryExpanded(init),0); }
          const vis = groups.slice(0, historyVisible);
          return <div style={{ maxHeight:'62vh', overflowY:'auto' }} onScroll={e=>{ const el=e.currentTarget; if(el.scrollHeight-el.scrollTop-el.clientHeight<80&&historyVisible<groups.length) setHistoryVisible(p=>Math.min(p+10,groups.length)); }}>{vis.map((g, gi) => (<div key={gi} style={{ display:'flex', gap:spaceSm, marginBottom: gi<vis.length-1?spaceSm:0 }}><div style={{ display:'flex',flexDirection:'column',alignItems:'center',width:24,flexShrink:0 }}><div style={{ width:24,height:24,borderRadius:'50%',background:'#fff',border:`1px solid ${actionPrimary}`,display:'flex',alignItems:'center',justifyContent:'center' }}><ClockCircleFilled style={{ color:actionPrimary,fontSize:14 }} /></div>{gi<groups.length-1&&<div style={{ width:1,flex:1,minHeight:24,background:borderDefault,marginTop:4 }} />}</div><div style={{ ...cardStyle, flex:1, padding:`${spaceSm}px ${spaceFormField}px`, borderRadius:12, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}><div onClick={()=>setHistoryExpanded(p=>({...p,[gi]:!p[gi]}))} style={{ display:'flex',alignItems:'center',gap:spaceSm,cursor:'pointer' }}><span style={{ fontSize:15,color:textPrimary,fontWeight:fontWeightBold }}>{g.ts?fmtTime(g.ts):'—'}</span>{g.actor&&<span style={{ fontSize:13,color:textSecondary }}>— {g.actor}</span>}<span style={{ fontSize:13,fontWeight:fontWeightBold,color:actionPrimary,background:`${actionPrimary}12`,borderRadius:radiusPill,padding:'2px 10px',marginLeft:'auto' }}>{g.items.length}</span>{historyExpanded[gi]?<span style={{ fontSize:12,color:textTertiary }}>▲</span>:<span style={{ fontSize:12,color:textTertiary }}>▼</span>}</div>{historyExpanded[gi]&&<div><Divider style={{ margin:`${spaceSm}px 0` }} /><table style={{ width:'100%' }}><tbody>{g.items.map((r: any, ri: number) => { const fn = r.fieldName||r.fieldChanged||''; const ov = r.oldValue!==undefined&&r.oldValue!=null&&r.oldValue!=='null'?String(r.oldValue):null; const nv = r.newValue!==undefined&&r.newValue!=null&&r.newValue!=='null'?String(r.newValue):null; return <tr key={r.id||ri}><td style={{ padding:'4px 8px 4px 0',fontSize:13,fontWeight:fontWeightMedium,color:textPrimary,whiteSpace:'nowrap',width:1 }}>{STATION_FIELD_MAP[fn]||fn}</td><td style={{ padding:'4px 0',fontSize:13 }}>{ov?<span style={{ textDecoration:'line-through',color:statusCritical }}>{translateStationVal(fn,ov)}</span>:<span style={{ color:textTertiary }}>—</span>}<span style={{ color:textTertiary,margin:'0 6px' }}>→</span>{nv?<span style={{ color:statusOperational,fontWeight:fontWeightMedium }}>{translateStationVal(fn,nv)}</span>:<span style={{ color:textTertiary }}>—</span>}</td></tr>; })}</tbody></table></div>}</div></div>))}</div>;
        })()}
      </Modal>
  </div>);
}
