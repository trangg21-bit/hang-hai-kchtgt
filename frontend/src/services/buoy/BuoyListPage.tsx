// ── BuoyListPage — list screen + all Drawers/Modals (T6, design §4.2) ─
// Port-shaped orchestrator: fetch + filters + tabs + client-side pagination (D-3)
// + 4 Drawers (create/edit/detail/history) + reject/delete/approve Modals
// + DocumentUploadModal. Handlers moved from the old routed BuoyList screen.

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Modal, Input, Alert, Space, Tag, Drawer, Form, DatePicker, TreeSelect, Select, Typography,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, HistoryOutlined, ExclamationCircleOutlined, EnvironmentOutlined, UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as GisSymbol } from '../../services/symbolService';
import { userService } from '../../services/userService';
import {
  fetchBuoyById, searchBuoys, createBuoy, updateBuoy, deleteBuoy,
  submitBuoyForApproval, approveBuoyL1, approveBuoyL2, rejectBuoy, fetchBuoyHistory,
  generateBuoyCode,
} from './api';
import { fetchBuoyStationList } from '../station/api';
import type { BuoyStationResponse } from '../station/types';
import {
  buoyStatusBadge, TAB_STATUS_LIST, BUOY_STATUS_OPTIONS, BUOY_TYPE_OPTIONS, BUOY_TYPE_MAP,
  COLOR_LABEL_MAP, SHAPE_LABEL_MAP, LIGHT_CHAR_LABEL_MAP, BUOY_FIELD_MAP,
} from './schema';
import type { Buoy, ChangeHistory } from './types';
import { documentApi } from '../../app/document/api';
import DocumentUploadModal from '../../app/document/DocumentUploadModal';
import BuoyFormContent from './BuoyFormContent';
import BuoyDetailContent from './BuoyDetailContent';
import { ScreenHeader, DataTable } from '../../components/list-view';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import api from '../../services/api';
import {
  statusOperational, actionPrimary,
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceMd, spaceSm, spaceXs, spaceXl, spaceFormField, radiusPill,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  historyBadgeStyle, historyGroupGridStyle, historyTimeStyle, historyMetaRowStyle,
  historyInfoCardStyle, historyAccentBarStyle, historyInfoTitleStyle,
  historyChangeRowStyle, historyCreateRowStyle, historyFieldLabelStyle,
  historyOldValueStyle, historyNewValueStyle, historyArrowStyle,
} from '../../tokens';
import { colors } from '../../theme';

// ── Helpers (moved verbatim from BuoyList.tsx / BuoyForm.tsx) ────────

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY');
  } catch {
    return dateStr;
  }
}

function parseGisCoordinateList(gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length-1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.+-]+)\s+([\d.+-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* invalid */ }
  return [];
}

// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

function ddToDms(dd: number): { d: number; m: number; s: number } {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
  return { d, m, s };
}

// ── Component ────────────────────────────────────────────────────────

export default function BuoyListPage() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s: any) => s.user);

  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // ── Pagination (client-side, D-3) ────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [allData, setAllData] = useState<Buoy[]>([]);
  const [dataSource, setDataSource] = useState<Buoy[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // ── Organizations + Users for lookup ────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => { map.set(o.id, o.name); });
    return map;
  }, [organizations]);

  // Cây đơn vị cho TreeSelect filter (dựng từ id/name/code/parentId)
  const orgTree = useMemo(() => {
    const nodeMap = new Map<string, any>();
    organizations.forEach((o) => {
      nodeMap.set(o.id, { value: o.id, title: o.name, children: [] as any[] });
    });
    const roots: any[] = [];
    organizations.forEach((o) => {
      const node = nodeMap.get(o.id);
      if (o.parentId && nodeMap.has(o.parentId)) nodeMap.get(o.parentId).children.push(node);
      else roots.push(node);
    });
    return roots;
  }, [organizations]);

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Create/Edit Drawers ─────────────────────────────────────────
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Buoy | null>(null);
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [createTabKey, setCreateTabKey] = useState('general');
  const [editTabKey, setEditTabKey] = useState('general');
  const [codeLoading, setCodeLoading] = useState(false);
  const [buoyStations, setBuoyStations] = useState<BuoyStationResponse[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const actionTypeRef = useRef<'draft' | 'submit'>('submit');

  // ── Danh sách nhà trạm QLVH phao tiêu (SelectKcht — nguồn sinh mã {mã nhà trạm}-PT-{seq}) ──
  useEffect(() => {
    let cancelled = false;
    setLoadingStations(true);
    fetchBuoyStationList({})
      .then((res) => { if (!cancelled) setBuoyStations(res.content || []); })
      .catch(() => { if (!cancelled) toast.error('Không thể tải danh sách nhà trạm QLVH'); })
      .finally(() => { if (!cancelled) setLoadingStations(false); });
    return () => { cancelled = true; };
  }, []);

  // Chọn nhà trạm → sinh mã tự động {mã nhà trạm}-PT-{seq} (chỉ chế độ thêm mới)
  const handleStationChange = useCallback((stationId: string | undefined) => {
    setCodeLoading(true);
    generateBuoyCode(stationId)
      .then((code) => { createForm.setFieldsValue({ code }); })
      .catch(() => { toast.error('Không thể sinh mã tự động, vui lòng thử lại'); })
      .finally(() => { setCodeLoading(false); });
  }, [createForm]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const [createCoords, setCreateCoords] = useState<Array<{ lat: number | null; lng: number | null }>>([]);
  const [editCoords, setEditCoords] = useState<Array<{ lat: number | null; lng: number | null }>>([]);
  const createGeomType = Form.useWatch('geometryType', createForm);
  const editGeomType = Form.useWatch('geometryType', updateForm);

  // ── GIS: symbols + coordinate list (giống BerthForm tab Thông tin vị trí) ──
  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' })
      .then((r) => setSymbols(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!createGeomType) return;
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    setCreateCoords(Array.from({ length: GEOMETRY_POINT_COUNT[createGeomType] ?? 1 }, () => ({ lat: null, lng: null })));
  }, [createGeomType, createForm]);

  useEffect(() => {
    if (!editGeomType) return;
    updateForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    // Đồng bộ với chế độ thêm mới: thiếu bản ghi GPS thì tự thêm bản ghi trống cho đủ số lượng theo loại đối tượng
    const required = GEOMETRY_POINT_COUNT[editGeomType] ?? 1;
    setEditCoords((prev) => {
      if (prev.length >= required) return prev;
      const added = Array.from({ length: required - prev.length }, () => ({ lat: null, lng: null }));
      return [...prev, ...added];
    });
  }, [editGeomType, updateForm]);

  const updateCreateGps = useCallback((i: number, field: 'lat' | 'lng', d: number, m: number, s: number) => {
    // Chặn giá trị vượt ngưỡng khi gõ: độ ≤ 90/180, phút ≤ 59, giây ≤ 59.99 (tránh hiển thị mấy trăm)
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, d));
    const mClamped = Math.min(59, Math.max(0, m));
    const sClamped = Math.min(59.99, Math.max(0, s));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setCreateCoords((p) => { const n = [...p]; n[i] = { ...n[i], [field]: decimal }; return n; });
  }, []);
  const addCreateGps = useCallback(() => setCreateCoords((p) => [...p, { lat: null, lng: null }]), []);
  const removeCreateGps = useCallback((i: number) => setCreateCoords((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))), []);
  const updateEditGps = useCallback((i: number, field: 'lat' | 'lng', d: number, m: number, s: number) => {
    // Chặn giá trị vượt ngưỡng khi gõ: độ ≤ 90/180, phút ≤ 59, giây ≤ 59.99 (tránh hiển thị mấy trăm)
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, d));
    const mClamped = Math.min(59, Math.max(0, m));
    const sClamped = Math.min(59.99, Math.max(0, s));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setEditCoords((p) => { const n = [...p]; n[i] = { ...n[i], [field]: decimal }; return n; });
  }, []);
  const addEditGps = useCallback(() => setEditCoords((p) => [...p, { lat: null, lng: null }]), []);
  const removeEditGps = useCallback((i: number) => setEditCoords((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))), []);

  // ── Detail Drawer ───────────────────────────────────────────────
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Buoy | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Buoy | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── History Drawer ──────────────────────────────────────────────
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<Buoy | null>(null);
  const [historyData, setHistoryData] = useState<ChangeHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<Buoy | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Approve modal ───────────────────────────────────────────────
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<Buoy | null>(null);
  const [approvingLevel, setApprovingLevel] = useState<'L1' | 'L2'>('L1');

  // ── Load organizations + users ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        setOrganizations(resp.data || []);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    })();
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => { map.set(u.id, u.fullName || u.username || u.id); });
        setUserMap(map);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    })();
  }, []);

  // ── Fetch main data (client-side filter + paginate, D-3) ────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const all = await searchBuoys({
        name: filterName || undefined,
        code: filterCode || undefined,
        type: filterType,
      });
      const unitFiltered = managingUnitId ? all.filter((d) => d.unitId === managingUnitId) : all;

      // Tab counts from FULL dataset
      const counts: Record<string, number> = { all: unitFiltered.length };
      TAB_STATUS_LIST.slice(1).forEach((tab) => {
        counts[tab.key] = unitFiltered.filter((d) => d.status === tab.key).length;
      });
      setTabCounts(counts);

      // Status filter for display
      const statusFilter = filterStatus || (activeTab !== 'all' ? activeTab : undefined);
      const filtered = statusFilter ? unitFiltered.filter((d) => d.status === statusFilter) : unitFiltered;

      setAllData(filtered);
      setTotal(filtered.length);

      const start = (page - 1) * pageSize;
      setDataSource(filtered.slice(start, start + pageSize));
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filterName, filterCode, filterType, filterStatus, managingUnitId, activeTab, page, pageSize]);

  // Repaginate when allData or page/pageSize changes
  useEffect(() => {
    const start = (page - 1) * pageSize;
    setDataSource(allData.slice(start, start + pageSize));
  }, [allData, page, pageSize]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // ── Filter handlers ─────────────────────────────────────────────

  const handleFilterApply = useCallback(() => {
    setManagingUnitId(filterValues.managingUnitId || undefined);
    setFilterName(String(filterValues.name || '').trim());
    setFilterCode(String(filterValues.code || '').trim());
    setFilterType(filterValues.type || undefined);
    if (filterValues.status) {
      setFilterStatus(filterValues.status);
      setActiveTab('');
    } else {
      setFilterStatus(undefined);
      setActiveTab('all');
    }
    setPage(1);
  }, [filterValues]);

  const handleFilterReset = useCallback(() => {
    setFilterValues({});
    setManagingUnitId(undefined);
    setFilterName('');
    setFilterCode('');
    setFilterType(undefined);
    setFilterStatus(undefined);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  // ── Detail Drawer ───────────────────────────────────────────────

  const openDetailDrawer = useCallback(async (record: Buoy) => {
    setDetailDrawerOpen(true);
    setDetailRecord(record);
    setDetailLoading(true);
    setDetailFiles([]);
    try {
      const fresh = await fetchBuoyById(record.id);
      setDetailRecord(fresh);
      try {
        const fileRes = await documentApi.listByEntity('buoy', record.id, { page: 1, size: 20 });
        setDetailFiles(fileRes.data || []);
      } catch { setDetailFiles([]); }
    } catch {
      // keep initial data
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerOpen(false);
    setDetailRecord(null);
    setDetailFiles([]);
  }, []);

  // ── Create/Edit Drawers ─────────────────────────────────────────

  const openCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(true);
    setCreateTabKey('general');
    setUploadFileList([]);
  }, []);

  const closeCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
    createForm.resetFields();
    setUploadFileList([]);
    setCreateCoords([]);
  }, [createForm]);

  const openEditDrawer = useCallback(async (record: Buoy) => {
    setEditDrawerOpen(true);
    setEditingRecord(record);
    setUploadFileList([]);
    updateForm.resetFields();
    try {
      const data = await fetchBuoyById(record.id);
      setEditingRecord(data);
      // Load existing attachments
      try {
        const fileRes = await documentApi.listByEntity('buoy', data.id, { page: 1, size: 50 });
        setUploadFileList((fileRes.data || []).map((a: any) => ({
          uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const,
        })));
      } catch { setUploadFileList([]); }
      const loadedCoords = parseGisCoordinateList({ geometryType: data.geometryType, coordinates: data.coordinates });
      setEditCoords(loadedCoords.length > 0 ? loadedCoords.map((c) => ({ lat: c.latitude, lng: c.longitude })) : []);
      updateForm.setFieldsValue({
        code: data.code,
        name: data.name,
        unitId: data.unitId,
        description: data.description || undefined,
        isActive: data.isActive,
        color: data.color || undefined,
        shape: data.shape || undefined,
        lightCharacteristic: data.lightCharacteristic || undefined,
        range: data.range,
        buoyStationId: data.buoyStationId || undefined,
        classification: data.classification || undefined,
        classificationBuoy: data.classificationBuoy || undefined,
        classificationMark: data.classificationMark || undefined,
        provinceId: data.provinceId != null ? String(data.provinceId) : undefined,
        locationDetail: data.locationDetail || undefined,
        condition: data.condition || undefined,
        structure: data.structure || undefined,
        area: data.area,
        bodyHeight: data.bodyHeight,
        diameter: data.diameter,
        beaconLight: data.beaconLight || undefined,
        towerHeight: data.towerHeight,
        lightHeight: data.lightHeight,
        lightModel: data.lightModel || undefined,
        towerColor: data.towerColor || undefined,
        powerSupply: data.powerSupply || undefined,
        commissionedDate: data.commissionedDate ? dayjs(data.commissionedDate) : undefined,
        lastRepairDate: data.lastRepairDate ? dayjs(data.lastRepairDate) : undefined,
        lightColor: data.lightColor || undefined,
        flashType: data.flashType || undefined,
        period: data.period || undefined,
        geometryType: data.geometryType || undefined,
        mapSymbolId: data.mapSymbolId || undefined,
        coordinateSystem: data.coordinateSystem != null ? data.coordinateSystem : undefined,
        displayRule: data.displayRule || undefined,
      });
    } catch {
      toast.error('Không thể tải thông tin phao tiêu');
      setEditDrawerOpen(false);
      setEditingRecord(null);
    }
  }, [updateForm]);

  const closeEditDrawer = useCallback(() => {
    setEditDrawerOpen(false);
    setEditingRecord(null);
    updateForm.resetFields();
    setUploadFileList([]);
    setEditCoords([]);
  }, [updateForm]);

  // ── Upload helper (after save) ──────────────────────────────────

  const uploadFilesAfterSave = useCallback(async (savedId: string, files: any[]) => {
    let uploaded = 0;
    for (const fileItem of files) {
      const originFile = fileItem.originFileObj as File | undefined;
      if (!originFile) continue; // existing attachment (no originFileObj) — skip
      try {
        const formData = new FormData();
        formData.append('file', originFile);
        await api.post(`/v1/documents/upload/buoy/${savedId}`, formData, {
          headers: { 'Content-Type': undefined as any },
        });
        uploaded++;
      } catch { toast.error(`Tải lên tệp "${fileItem.name}" thất bại`); }
    }
    if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
  }, []);

  // ── Create save (design §4.3 — action draft/submit) ─────────────

  const handleCreateFinish = useCallback(async (values: Record<string, any>) => {
    const action = actionTypeRef.current;
    const code = String(values.code ?? '').trim();
    const name = String(values.name ?? '').trim();

    if (!code) { toast.error('Mã phao tiêu là bắt buộc'); return; }
    if (!name) { toast.error('Tên phao tiêu là bắt buộc'); return; }
    if (values.range == null || Number(values.range) <= 0 || Number(values.range) > 20) {
      toast.error('Phạm vi chiếu sáng phải trong khoảng (0, 20] hải lý'); return;
    }

    const manualCoords = createCoords
      .filter((c) => c.lat != null && c.lng != null && !Number.isNaN(Number(c.lat)) && !Number.isNaN(Number(c.lng)))
      .map((c) => ({ latitude: Number(c.lat), longitude: Number(c.lng) }));
    if (values.geometryType) {
      const requiredCoords = GEOMETRY_POINT_COUNT[values.geometryType as string] ?? 1;
      if (createCoords.length === 0 || manualCoords.length < requiredCoords) {
        toast.error(`Loại đối tượng đã chọn yêu cầu ít nhất ${requiredCoords} tọa độ GPS.`); return;
      }
    }
    if (manualCoords.length > 0) {
      if (manualCoords[0].latitude < -90 || manualCoords[0].latitude > 90) {
        toast.error('Vĩ độ phải từ -90° đến 90° (WGS84)'); return;
      }
      if (manualCoords[0].longitude < -180 || manualCoords[0].longitude > 180) {
        toast.error('Kinh độ phải từ -180° đến 180° (WGS84)'); return;
      }
    }
    if (action === 'submit' && manualCoords.length === 0) {
      toast.error('Vui lòng thêm ít nhất một tọa độ GPS để gửi phê duyệt'); return;
    }

    // Kiểm tra trùng tên/mã phao tiêu (chặn lưu — không cho thêm mới trùng)
    try {
      const dupByName = await searchBuoys({ name });
      if (Array.isArray(dupByName) && dupByName.length > 0) {
        toast.error('Tên phao tiêu đã tồn tại. Không thể thêm mới phao tiêu trùng tên.');
        return;
      }
      const dupByCode = await searchBuoys({ code });
      if (Array.isArray(dupByCode) && dupByCode.length > 0) {
        toast.error('Mã phao tiêu đã tồn tại. Không thể thêm mới phao tiêu trùng mã.');
        return;
      }
    } catch {
      // non-blocking
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        action,
        name,
        range: values.range,
        color: values.color || undefined,
        shape: values.shape || undefined,
        lightCharacteristic: values.lightCharacteristic || undefined,
        description: values.description || undefined,
        unitId: values.unitId || undefined,
        buoyStationId: values.buoyStationId,
        classification: values.classification,
        classificationBuoy: values.classificationBuoy || undefined,
        classificationMark: values.classificationMark || undefined,
        provinceId: values.provinceId ? Number(values.provinceId) : undefined,
        locationDetail: values.locationDetail || undefined,
        condition: values.condition,
        structure: values.structure || undefined,
        area: values.area,
        bodyHeight: values.bodyHeight,
        diameter: values.diameter,
        beaconLight: values.beaconLight || undefined,
        towerHeight: values.towerHeight,
        lightHeight: values.lightHeight,
        lightModel: values.lightModel || undefined,
        towerColor: values.towerColor || undefined,
        powerSupply: values.powerSupply || undefined,
        commissionedDate: values.commissionedDate
          ? (typeof values.commissionedDate === 'string' ? values.commissionedDate : values.commissionedDate.format('YYYY-MM-DD'))
          : undefined,
        lastRepairDate: values.lastRepairDate
          ? (typeof values.lastRepairDate === 'string' ? values.lastRepairDate : values.lastRepairDate.format('YYYY-MM-DD'))
          : undefined,
        lightColor: values.lightColor || undefined,
        flashType: values.flashType || undefined,
        period: values.period || undefined,
        isActive: values.isActive !== undefined ? values.isActive : undefined,
      };
      if (manualCoords.length > 0) {
        payload.latitude = manualCoords[0].latitude;
        payload.longitude = manualCoords[0].longitude;
        payload.coordinates = manualCoords.length > 1
          ? `MULTIPOINT(${manualCoords.map((c) => `(${c.longitude} ${c.latitude})`).join(',')})`
          : `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})`;
      }
      payload.geometryType = values.geometryType || undefined;
      payload.mapSymbolId = values.mapSymbolId || undefined;
      payload.coordinateSystem = values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined;
      payload.displayRule = values.displayRule || undefined;
      Object.keys(payload).forEach((key) => { if (payload[key] === undefined) delete payload[key]; });
      payload.code = code;

      const res = await createBuoy(payload as any);
      const savedId = (res as any)?.id;
      toast.success(action === 'draft' ? 'Lưu nháp thành công' : 'Gửi phê duyệt thành công');

      if (savedId && uploadFileList.length > 0) {
        await uploadFilesAfterSave(savedId, uploadFileList);
      }

      closeCreateDrawer();
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  }, [createCoords, uploadFileList, uploadFilesAfterSave, closeCreateDrawer, fetchData]);

  // ── Edit save (design §4.3 — no action, no code) ────────────────

  const handleEditFinish = useCallback(async (values: Record<string, any>) => {
    if (!editingRecord) return;
    const name = String(values.name ?? '').trim();

    if (!name) { toast.error('Tên phao tiêu là bắt buộc'); return; }
    if (values.range == null || Number(values.range) <= 0 || Number(values.range) > 20) {
      toast.error('Phạm vi chiếu sáng phải trong khoảng (0, 20] hải lý'); return;
    }

    const manualCoords = editCoords
      .filter((c) => c.lat != null && c.lng != null && !Number.isNaN(Number(c.lat)) && !Number.isNaN(Number(c.lng)))
      .map((c) => ({ latitude: Number(c.lat), longitude: Number(c.lng) }));
    if (values.geometryType) {
      const requiredCoords = GEOMETRY_POINT_COUNT[values.geometryType as string] ?? 1;
      if (editCoords.length === 0 || manualCoords.length < requiredCoords) {
        toast.error(`Loại đối tượng đã chọn yêu cầu ít nhất ${requiredCoords} tọa độ GPS.`); return;
      }
    }
    if (manualCoords.length > 0) {
      if (manualCoords[0].latitude < -90 || manualCoords[0].latitude > 90) {
        toast.error('Vĩ độ phải từ -90° đến 90° (WGS84)'); return;
      }
      if (manualCoords[0].longitude < -180 || manualCoords[0].longitude > 180) {
        toast.error('Kinh độ phải từ -180° đến 180° (WGS84)'); return;
      }
    }

    // Kiểm tra trùng tên phao tiêu khi chỉnh sửa (chặn lưu — trừ chính bản ghi đang sửa)
    try {
      const dupByName = await searchBuoys({ name });
      const realDup = Array.isArray(dupByName) && dupByName.some((b: any) => b.id !== editingRecord.id);
      if (realDup) {
        toast.error('Tên phao tiêu đã tồn tại. Không thể cập nhật phao tiêu trùng tên.');
        return;
      }
    } catch {
      // non-blocking
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        range: values.range,
        color: values.color || undefined,
        shape: values.shape || undefined,
        lightCharacteristic: values.lightCharacteristic || undefined,
        description: values.description || undefined,
        unitId: values.unitId || undefined,
        buoyStationId: values.buoyStationId,
        classification: values.classification,
        classificationBuoy: values.classificationBuoy || undefined,
        classificationMark: values.classificationMark || undefined,
        provinceId: values.provinceId ? Number(values.provinceId) : undefined,
        locationDetail: values.locationDetail || undefined,
        condition: values.condition,
        structure: values.structure || undefined,
        area: values.area,
        bodyHeight: values.bodyHeight,
        diameter: values.diameter,
        beaconLight: values.beaconLight || undefined,
        towerHeight: values.towerHeight,
        lightHeight: values.lightHeight,
        lightModel: values.lightModel || undefined,
        towerColor: values.towerColor || undefined,
        powerSupply: values.powerSupply || undefined,
        commissionedDate: values.commissionedDate
          ? (typeof values.commissionedDate === 'string' ? values.commissionedDate : values.commissionedDate.format('YYYY-MM-DD'))
          : undefined,
        lastRepairDate: values.lastRepairDate
          ? (typeof values.lastRepairDate === 'string' ? values.lastRepairDate : values.lastRepairDate.format('YYYY-MM-DD'))
          : undefined,
        lightColor: values.lightColor || undefined,
        flashType: values.flashType || undefined,
        period: values.period || undefined,
        isActive: values.isActive !== undefined ? values.isActive : undefined,
      };
      if (manualCoords.length > 0) {
        payload.latitude = manualCoords[0].latitude;
        payload.longitude = manualCoords[0].longitude;
        payload.coordinates = manualCoords.length > 1
          ? `MULTIPOINT(${manualCoords.map((c) => `(${c.longitude} ${c.latitude})`).join(',')})`
          : `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})`;
      }
      payload.geometryType = values.geometryType || undefined;
      payload.mapSymbolId = values.mapSymbolId || undefined;
      payload.coordinateSystem = values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined;
      payload.displayRule = values.displayRule || undefined;
      Object.keys(payload).forEach((key) => { if (payload[key] === undefined) delete payload[key]; });

      await updateBuoy(editingRecord.id, payload as any);
      toast.success('Lưu nháp thành công');

      if (uploadFileList.length > 0) {
        await uploadFilesAfterSave(editingRecord.id, uploadFileList);
      }

      closeEditDrawer();
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, editCoords, uploadFileList, uploadFilesAfterSave, closeEditDrawer, fetchData]);

  // ── History Drawer ──────────────────────────────────────────────

  const openHistoryDrawer = useCallback(async (record: Buoy) => {
    setHistoryDrawerOpen(true);
    setHistoryRecord(record);
    setHistoryLoading(true);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    try {
      const payload = await fetchBuoyHistory(record.id);
      setHistoryData(Array.isArray(payload?.changeHistory) ? payload.changeHistory : []);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const translateBuoyVal = useCallback((fn: string, val: string) => {
    if (!val || val === 'null' || val === '(null)') return '—';
    if (fn === 'isActive') return val === 'true' ? 'Có' : 'Ngừng';
    if (fn === 'type') return BUOY_TYPE_OPTIONS.find((o) => o.value === val)?.label || val;
    if (fn === 'color') return COLOR_LABEL_MAP[val] || val;
    if (fn === 'shape') return SHAPE_LABEL_MAP[val] || val;
    if (fn === 'lightCharacteristic') return LIGHT_CHAR_LABEL_MAP[val] || val;
    if (fn === 'unitId') return orgMap.get(val) || val;
    if (fn === 'status') return buoyStatusBadge(val).label;
    if (fn === 'lastInspectionDate' || fn === 'nextInspectionDate') return formatDateOnly(val);
    return val;
  }, [orgMap]);

  const actorName = useCallback((actor: string | undefined) => {
    if (!actor) return '—';
    return userMap.get(String(actor)) || actor;
  }, [userMap]);

  // ── Timeline (design §5.3 — history*Style tokens, BuoyList grouping) ─

  const renderBuoyHistoryTimeline = (records: ChangeHistory[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) =>
      new Date(b.changedAt || b.createdAt || 0).getTime() - new Date(a.changedAt || a.createdAt || 0).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: ChangeHistory[] }[] = [];
    for (const r of sorted) {
      if (q) {
        const fn = (r.fieldName || '').toLowerCase();
        const ov = (r.oldValue || '').toLowerCase();
        const nv = (r.newValue || '').toLowerCase();
        const label = (BUOY_FIELD_MAP[r.fieldName || ''] || '').toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !label.includes(q)) continue;
      }
      if (historyFrom || historyTo) {
        const cd = (r.changedAt || r.createdAt || '').substring(0, 16);
        if (historyFrom && cd < historyFrom.replace(' ', 'T')) continue;
        if (historyTo && cd > historyTo.replace(' ', 'T') + ':59') continue;
      }
      const ts = r.changedAt || r.createdAt || '';
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor: r.changedBy || '', items: [r] });
    }
    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
          {q || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào'}
        </div>
      </div>
    );
    const fmt = (ts: string) => {
      const d = new Date(ts);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };
    return (
      <div>
        {groups.map((g, gi) => {
          const isCreate = g.items.every((i) => i.oldValue == null || i.oldValue === '(null)' || i.oldValue === '');
          const barColor = actionPrimary;
          return (
            <div key={`${g.tsSec}-${g.actor}`} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                  <Typography.Text style={historyTimeStyle}>{g.ts ? fmt(g.ts) : '—'}</Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    {isCreate
                      ? <span style={historyBadgeStyle(statusOperational)}>Thêm mới</span>
                      : <span style={historyBadgeStyle(actionPrimary)}>Chỉnh sửa</span>}
                  </span>
                </div>
                <Typography.Text style={historyMetaRowStyle}>
                  Người cập nhật: {actorName(g.actor)}
                </Typography.Text>
              </div>
              <div style={historyInfoCardStyle}>
                <div style={historyAccentBarStyle(barColor)} />
                <Typography.Text style={historyInfoTitleStyle}>
                  {isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:'}
                </Typography.Text>
                {g.items.map((change, ri) => {
                  const fn = change.fieldName || '';
                  const ov = change.oldValue != null && change.oldValue !== 'null'
                    ? String(change.oldValue) : null;
                  const nv = change.newValue != null && change.newValue !== 'null'
                    ? String(change.newValue) : null;
                  const key = change.id || `${fn}-${ri}`;
                  return isCreate ? (
                    <div key={key} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                      <div style={historyFieldLabelStyle}>{fn ? `${BUOY_FIELD_MAP[fn] || fn}:` : '—'}</div>
                      <span title={nv ?? '—'} style={historyNewValueStyle}>{nv ? translateBuoyVal(fn, nv) : '—'}</span>
                    </div>
                  ) : (
                    <div key={key} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                      <div style={historyFieldLabelStyle}>{fn ? `${BUOY_FIELD_MAP[fn] || fn}:` : '—'}</div>
                      <span title={ov ?? '—'} style={historyOldValueStyle}>{ov ? translateBuoyVal(fn, ov) : '—'}</span>
                      <span style={historyArrowStyle}>→</span>
                      <span title={nv ?? '—'} style={historyNewValueStyle}>{nv ? translateBuoyVal(fn, nv) : '—'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Delete confirmation ─────────────────────────────────────────

  const openDeleteModal = useCallback((record: Buoy) => {
    setDeletingRecord(record);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = deletingRecord.name || 'XÓA';
    if (deleteConfirmText.trim() !== expectedText && deleteConfirmText.trim() !== 'XÓA') {
      toast.error('Vui lòng nhập đúng tên phao tiêu hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await deleteBuoy(deletingRecord.id);
      toast.success('Đã xóa phao tiêu');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setDeleteConfirmText('');
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [deletingRecord, deleteConfirmText, fetchData]);

  // ── Approval handlers ───────────────────────────────────────────

  const handleSubmitApproval = useCallback(
    async (record: Buoy) => {
      try {
        await submitBuoyForApproval(record.id);
        toast.success('Đã gửi phê duyệt phao tiêu');
        void fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const openApproveModal = useCallback((record: Buoy, level: 'L1' | 'L2') => {
    setApprovingRecord(record);
    setApprovingLevel(level);
    setApproveModalOpen(true);
  }, []);

  const handleConfirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    const approverId = currentUser?.userId;
    if (!approverId) { toast.error('Không xác định được người dùng'); return; }
    try {
      if (approvingLevel === 'L1') {
        await approveBuoyL1(approvingRecord.id, approverId);
        toast.success('Đã phê duyệt cấp 1');
      } else {
        await approveBuoyL2(approvingRecord.id, approverId);
        toast.success('Đã phê duyệt cấp 2 - Phao tiêu được công bố');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [approvingRecord, approvingLevel, currentUser, fetchData]);

  const openRejectModal = useCallback((record: Buoy) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { toast.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (reason.length > 500) { toast.error('Lý do từ chối tối đa 500 ký tự'); return; }
    const approverId = currentUser?.userId;
    if (!approverId) { toast.error('Không xác định được người dùng'); return; }
    try {
      await rejectBuoy(rejectingRecord.id, reason, approverId);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setActiveTab('REJECTED');
      setPage(1);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, currentUser, fetchData]);

  // ── Header actions ──────────────────────────────────────────────

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('buoy:create') || hasPerm('buoy:manage') || hasPerm('data:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: () => openCreateDrawer(),
      });
    }
    return actions;
  }, [hasPerm, openCreateDrawer]);

  // ── Table columns (moved from BuoyList.tsx) ─────────────────────

  const columns = useMemo<DataTableColumn[]>(() => [
    {
      key: 'sequenceNo',
      label: 'STT',
      width: 55,
      type: 'mono' as const,
      align: 'center' as const,
      render: (_: unknown, __: Buoy, idx?: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {(page - 1) * pageSize + (idx ?? 0) + 1}
        </span>
      ),
    },
    {
      key: 'code',
      label: 'Mã phao tiêu',
      dataIndex: 'code',
      width: 150,
      render: (code: string) => (
        <Tag color="cyan" style={{ fontSize: fontSizeMd }}>{code}</Tag>
      ),
    },
    {
      key: 'name',
      label: 'Tên phao tiêu',
      dataIndex: 'name',
      width: 200,
      render: (name: string) => (
        <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary }}>{name}</span>
      ),
    },
    {
      key: 'type',
      label: 'Loại phao',
      dataIndex: 'type',
      width: 200,
      render: (type: string) => {
        const m = BUOY_TYPE_MAP[type as keyof typeof BUOY_TYPE_MAP];
        const label = BUOY_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
        return m ? <Tag color={m.color}>{label}</Tag> : <span>{type || '—'}</span>;
      },
    },
    {
      key: 'latitude',
      label: 'Vĩ độ',
      dataIndex: 'latitude',
      width: 100,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v != null ? v.toFixed(4) : '—'}</span>
      ),
    },
    {
      key: 'longitude',
      label: 'Kinh độ',
      dataIndex: 'longitude',
      width: 100,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v != null ? v.toFixed(4) : '—'}</span>
      ),
    },
    {
      key: 'color',
      label: 'Màu sắc',
      dataIndex: 'color',
      width: 100,
      render: (v: string) => {
        if (!v) return <span style={{ color: textTertiary }}>—</span>;
        return (
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
            {COLOR_LABEL_MAP[v] || v}
          </span>
        );
      },
    },
    {
      key: 'shape',
      label: 'Hình dạng',
      dataIndex: 'shape',
      width: 110,
      render: (v: string) => {
        if (!v) return <span style={{ color: textTertiary }}>—</span>;
        return (
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
            {SHAPE_LABEL_MAP[v] || v}
          </span>
        );
      },
    },
    {
      key: 'lightCharacteristic',
      label: 'Đặc tính ánh sáng',
      dataIndex: 'lightCharacteristic',
      width: 180,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {v ? (LIGHT_CHAR_LABEL_MAP[v] || v) : '—'}
        </span>
      ),
    },
    {
      key: 'range',
      label: 'Phạm vi (HL)',
      dataIndex: 'range',
      width: 120,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v != null ? v.toFixed(1) : '—'}</span>
      ),
    },
    {
      key: 'description',
      label: 'Mô tả',
      dataIndex: 'description',
      width: 200,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{v || '—'}</span>
      ),
    },
    {
      key: 'unitId',
      label: 'Đơn vị quản lý',
      dataIndex: 'unitId',
      width: 180,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {v ? (orgMap.get(v) || v) : '—'}
        </span>
      ),
    },
    {
      key: 'lastInspectionDate',
      label: 'KT gần nhất',
      dataIndex: 'lastInspectionDate',
      width: 120,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{formatDateOnly(v)}</span>
      ),
    },
    {
      key: 'nextInspectionDate',
      label: 'KT kế tiếp',
      dataIndex: 'nextInspectionDate',
      width: 120,
      render: (v: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{formatDateOnly(v)}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Hoạt động',
      dataIndex: 'isActive',
      width: 100,
      align: 'center' as const,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? 'Có' : 'Ngừng'}</Tag>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
      align: 'center' as const,
      render: (status: string | null | undefined) => {
        const b = buoyStatusBadge(status);
        return (
          <span style={{
            display: 'inline-flex',
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: fontSizeMd,
            fontWeight: fontWeightMedium,
            background: `${b.color}15`,
            color: b.color,
          }}>
            {b.label}
          </span>
        );
      },
    },
  ], [page, pageSize, orgMap]);

  // ── Row actions with RBAC (moved from BuoyList.tsx) ─────────────

  const rowActions = useCallback((record: Buoy) => {
    const actions: {
      key: string;
      label: string;
      icon?: React.ReactNode;
      onClick: () => void;
      danger?: boolean;
    }[] = [];

    actions.push({
      key: 'view',
      label: 'Chi tiết',
      icon: <EyeOutlined />,
      onClick: () => openDetailDrawer(record),
    });

    if (hasPerm('buoy:update') || hasPerm('buoy:manage') || hasPerm('data:update')) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <EditOutlined />,
        onClick: () => openEditDrawer(record),
      });
    }

    if (record.latitude != null && record.longitude != null) {
      actions.push({
        key: 'location',
        label: 'Xem vị trí',
        icon: <EnvironmentOutlined />,
        onClick: () => {
          window.open(`https://www.google.com/maps?q=${record.latitude},${record.longitude}`, '_blank');
        },
      });
    }

    if ((hasPerm('buoy:update') || hasPerm('buoy:manage') || hasPerm('data:update')) && (record.status === 'DRAFT' || record.status === 'REJECTED')) {
      actions.push({
        key: 'submit',
        label: 'Gửi phê duyệt',
        icon: <CheckCircleOutlined />,
        onClick: () => handleSubmitApproval(record),
      });
    }

    const canApprove = hasPerm('buoy:approve') || hasPerm('buoy:approvec1') || hasPerm('buoy:approvec2') || hasPerm('data:approve');
    if (canApprove && record.status === 'PENDING_APPROVAL') {
      actions.push({
        key: 'approveL1',
        label: 'Phê duyệt L1',
        icon: <CheckCircleOutlined />,
        onClick: () => openApproveModal(record, 'L1'),
      });
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: <CloseCircleOutlined />,
        onClick: () => openRejectModal(record),
        danger: true,
      });
    }

    if (canApprove && record.status === 'APPROVED_L1') {
      actions.push({
        key: 'approveL2',
        label: 'Phê duyệt L2',
        icon: <CheckCircleOutlined />,
        onClick: () => openApproveModal(record, 'L2'),
      });
      actions.push({
        key: 'reject',
        label: 'Từ chối',
        icon: <CloseCircleOutlined />,
        onClick: () => openRejectModal(record),
        danger: true,
      });
    }

    const deletableStatuses = ['DRAFT', 'REJECTED'];
    if ((hasPerm('buoy:delete') || hasPerm('buoy:manage') || hasPerm('data:delete')) && deletableStatuses.includes(record.status || '')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        onClick: () => openDeleteModal(record),
        danger: true,
      });
    }

    actions.push({
      key: 'history',
      label: 'Lịch sử',
      icon: <HistoryOutlined />,
      onClick: () => openHistoryDrawer(record),
    });

    return actions;
  }, [
    hasPerm, openDetailDrawer, openEditDrawer, handleSubmitApproval,
    openApproveModal, openRejectModal, openDeleteModal, openHistoryDrawer,
  ]);

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Báo hiệu hàng hải' }, { label: 'Phao tiêu' }]}
        actions={headerActions}
      />

      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={isError}
        onRetry={fetchData}
        filterContent={<>
          <div style={{ marginBottom: 12, marginTop: spaceMd }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Đơn vị quản lý
            </div>
            <TreeSelect
              placeholder="Chọn đơn vị"
              allowClear
              showSearch
              treeNodeFilterProp="title"
              treeDefaultExpandAll={false}
              value={filterValues.managingUnitId || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, managingUnitId: val }))}
              treeData={orgTree}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên phao tiêu</div>
            <Input placeholder="Tìm theo tên phao..." allowClear
              value={filterValues.name || ''}
              onChange={(e) => setFilterValues((prev) => ({ ...prev, name: e.target.value }))}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã phao tiêu</div>
            <Input placeholder="Tìm theo mã phao..." allowClear
              value={filterValues.code || ''}
              onChange={(e) => setFilterValues((prev) => ({ ...prev, code: e.target.value }))}
              onPressEnter={handleFilterApply}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Loại phao tiêu</div>
            <Select placeholder="Chọn loại phao" allowClear
              value={filterValues.type || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, type: val }))}
              options={BUOY_TYPE_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Trạng thái</div>
            <Select placeholder="Chọn trạng thái" allowClear
              value={filterValues.status || undefined}
              onChange={(val) => setFilterValues((prev) => ({ ...prev, status: val }))}
              options={BUOY_STATUS_OPTIONS}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </div>
        </>}
        statusTabs={TAB_STATUS_LIST.map((tab) => ({
          key: tab.key,
          label: tab.label,
          count: tabCounts[tab.key] ?? 0,
          color: tab.color,
          active: activeTab === tab.key,
        }))}
        onStatusTabChange={handleTabChange}
      >
        {isError ? null : !isLoading && dataSource.length === 0 ? (
          <DataTable dataSource={[]} rowKey="id"
            emptyState={
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>Không tìm thấy phao tiêu nào phù hợp</div>
              </div>
            }
          />
        ) : !isLoading && !isError && dataSource.length > 0 ? (
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            loading={false}
            scroll={{ x: 2200, y: 'calc(100vh - 450px)' }}
          />
        ) : null}
        <Pagination
          total={total}
          current={page}
          pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </FilterTableLayout>

      {/* ── Create Drawer ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới phao tiêu</span>}
        open={createDrawerOpen}
        onClose={closeCreateDrawer}
        extra={<Button type="text" onClick={closeCreateDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => { actionTypeRef.current = 'draft'; createForm.submit(); }} disabled={submitting} style={outlineButtonStyle}>Lưu tạm</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'submit'; createForm.submit(); }} loading={submitting} disabled={submitting} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        afterOpenChange={(open) => {
          if (open) {
            createForm.resetFields();
            setUploadFileList([]);
            setCreateTabKey('general');
            setCreateCoords([]);
            setCodeLoading(true);
            generateBuoyCode()
              .then((code) => { createForm.setFieldsValue({ code }); })
              .catch(() => { toast.error('Không thể sinh mã tự động, vui lòng thử lại'); })
              .finally(() => { setCodeLoading(false); });
          }
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateFinish}
          onFinishFailed={(e: any) => {
            const firstErr = e?.errorFields?.[0]?.name?.[0];
            if (['mapSymbolId', 'coordinateSystem', 'displayRule', 'geometryType'].includes(firstErr)) {
              setCreateTabKey('gis');
            } else if (['lightColor', 'flashType', 'period'].includes(firstErr)) {
              setCreateTabKey('light');
            } else {
              setCreateTabKey('general');
            }
          }}
        >
          <BuoyFormContent
            isEdit={false}
            codeLoading={codeLoading}
            activeTabKey={createTabKey}
            onTabChange={setCreateTabKey}
            orgUnits={organizations.map((o) => ({ id: o.id, name: o.name }))}
            buoyStations={buoyStations.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
            loadingStations={loadingStations}
            onStationChange={handleStationChange}
            uploadFileList={uploadFileList}
            setUploadFileList={setUploadFileList}
            symbols={symbols}
            geometryType={createGeomType}
            gpsCoordList={createCoords}
            addGpsPoint={addCreateGps}
            removeGpsPoint={removeCreateGps}
            updateGpsPoint={updateCreateGps}
            ddToDms={ddToDms}
          />
        </Form>
      </Drawer>

      {/* ── Edit Drawer ────────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chỉnh sửa thông tin — {editingRecord ? editingRecord.name : 'Phao tiêu'}</span>}
        open={editDrawerOpen}
        onClose={closeEditDrawer}
        extra={<Button type="text" onClick={closeEditDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button type="primary" onClick={() => updateForm.submit()} loading={submitting} disabled={submitting} style={primaryButtonStyle}>Cập nhật</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form
          form={updateForm}
          layout="vertical"
          onFinish={handleEditFinish}
          onFinishFailed={(e: any) => {
            if (e?.errorFields?.some((f: any) => ['mapSymbolId', 'coordinateSystem', 'displayRule', 'geometryType'].includes(f.name[0]))) {
              setEditTabKey('gis');
            }
          }}
        >
          <BuoyFormContent
            isEdit
            activeTabKey={editTabKey}
            onTabChange={setEditTabKey}
            buoyStations={buoyStations.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
            loadingStations={loadingStations}
            orgUnits={organizations.map((o) => ({ id: o.id, name: o.name }))}
            uploadFileList={uploadFileList}
            setUploadFileList={setUploadFileList}
            symbols={symbols}
            geometryType={editGeomType}
            gpsCoordList={editCoords}
            addGpsPoint={addEditGps}
            removeGpsPoint={removeEditGps}
            updateGpsPoint={updateEditGps}
            ddToDms={ddToDms}
          />
        </Form>
      </Drawer>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        size={800 as any}
        title={<span style={drawerTitleStyle}>
          {detailRecord ? `Xem chi tiết phao tiêu - ${detailRecord.name}` : 'Xem chi tiết phao tiêu'}
        </span>}
        open={detailDrawerOpen}
        onClose={closeDetailDrawer}
        extra={
          <Space size={spaceSm}>
            <Button icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)} style={outlineButtonStyle}>Tải file</Button>
            <Button type="text" onClick={closeDetailDrawer} style={drawerCloseBtnStyle}>✕</Button>
          </Space>
        }
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {detailLoading ? <LoadingSkeleton rows={6} /> : detailRecord ? (
          <BuoyDetailContent
            selectedRecord={detailRecord}
            orgUnits={organizations.map((o) => ({ id: o.id, name: o.name }))}
            userMap={userMap}
            detailFiles={detailFiles}
            buoyStatusBadge={buoyStatusBadge}
          />
        ) : null}
      </Drawer>

      {/* ── History Drawer ─────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        size={880 as any}
        title={
          <Space size={spaceSm} style={{ alignItems: 'center' }}>
            <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
            <span style={drawerTitleStyle}>
              {historyRecord ? `Lịch sử thay đổi — ${historyRecord.name}` : 'Lịch sử thay đổi'}
            </span>
          </Space>
        }
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        extra={<Button type="text" onClick={() => setHistoryDrawerOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}
      >
        {!historyLoading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input.Search placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
            <DatePicker placeholder="Từ ngày" value={historyFrom ? dayjs(historyFrom) : null}
              onChange={(d) => setHistoryFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <DatePicker placeholder="Đến ngày" value={historyTo ? dayjs(historyTo) : null}
              onChange={(d) => setHistoryTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {historyLoading ? <LoadingSkeleton rows={5} /> : historyData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào</div>
            </div>
          ) : renderBuoyHistoryTimeline(historyData)}
        </div>
      </Drawer>

      {/* ── DocumentUploadModal (detail drawer) ────────────────────── */}
      {detailRecord && (
        <DocumentUploadModal
          entityType="buoy"
          entityId={detailRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}

      {/* ── Approve Modal ──────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận phê duyệt</span>}
        open={approveModalOpen}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={handleConfirmApprove}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: statusOperational, borderColor: statusOperational }}>Xác nhận</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Phê duyệt <strong>{approvingRecord?.name}</strong>?
          </p>
        </div>
      </Modal>

      {/* ── Reject Modal ───────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối cho phao tiêu:
          </p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.name}</strong>
            </p>
          )}
          <Input.TextArea
            placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            maxLength={500}
            showCount
            style={{ borderRadius: 8, fontSize: fontSizeMd }}
          />
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa phao tiêu</span>}
        open={deleteModalOpen}
        onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <Alert message="Hành động này không thể hoàn tác" type="warning" showIcon icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} />
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên phao tiêu</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Phao tiêu: <strong style={{ color: textPrimary }}>{deletingRecord.name}</strong>
            </p>
          )}
          <Input
            placeholder="Nhập tên phao tiêu hoặc XÓA"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            onPressEnter={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40 }}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
