import { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal, Input, Select, DatePicker } from 'antd';
import { inmarsatStationService } from '../../../services/inmarsatStationService';
import { organizationService } from '../../../services/organizationService';

import type { CoastalStationInmarsatResponse } from '../../../services/station/types';
import { ConditionStatus, CONDITION_STATUS_MAP, CONDITION_STATUS_OPTIONS, ApprovalStatus } from '../../../types/vtsSystem';
import { useAuthStore } from '../../../store/authStore';
import { usePermissionStore } from '../../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../../components/list-view';
import FilterTableLayout from '../../../components/list-view/FilterTableLayout';
import Pagination from '../../../components/list-view/Pagination';
import InmarsatStationForm, { getOperatingOrgName } from './InmarsatStationForm';
import ApprovalModal from '../../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import toast from '../../../components/ToastNotification';
import {
  actionPrimary, textSecondary,
  fontWeightBold, fontWeightMedium, fontSizeMd, fontSizeLg,
  radiusPill, spaceMd, sidebarBg,
  statusOperational, statusCritical, statusAttention, statusDraft,
  selectStyle,
  statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  inputStyle,
  getRangePickerProps,
  getConditionStatusColor,
  getConditionStatusLabel,
} from '../../../themetokenchk';
import * as themeTokenChk from '../../../themetokenchk';
import { ThemeTokenProvider } from '../../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../../components/org-unit';
import SidebarFilterField from '../../../components/list-view/SidebarFilterField';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../../utils/approvalEditPolicy';
import { CommonHistoryDrawer, type CommonHistoryEntry, type HistoryChangeItem } from '../../../components/shared/CommonHistoryDrawer';
import LoadingSkeleton from '../../../components/LoadingSkeleton';

const INMARSAT_FIELD_MAP: Record<string, string> = {
  code: 'Mã đài',
  deviceCode: 'Mã đài',
  name: 'Tên đài',
  stationName: 'Tên đài',
  'Tên đài': 'Tên đài',
  orgUnitId: 'Đơn vị quản lý',
  orgUnitName: 'Đơn vị quản lý',
  'Đơn vị quản lý': 'Đơn vị quản lý',
  operatingOrgId: 'Đơn vị khai thác',
  operatingOrgName: 'Đơn vị khai thác',
  'Đơn vị khai thác': 'Đơn vị khai thác',
  provinceId: 'Địa điểm (Tỉnh/TP)',
  'Địa điểm (Tỉnh/TP)': 'Địa điểm (Tỉnh/TP)',
  locationDetail: 'Địa điểm chi tiết',
  locationAddress: 'Địa điểm chi tiết',
  'Địa điểm chi tiết': 'Địa điểm chi tiết',
  conditionStatus: 'Tình trạng',
  'Tình trạng': 'Tình trạng',
  coverageZone: 'Vùng phủ sóng',
  'Vùng phủ sóng': 'Vùng phủ sóng',
  coverageArea: 'Khu vực phủ sóng',
  'Khu vực phủ sóng': 'Khu vực phủ sóng',
  services: 'Dịch vụ cung cấp',
  'Dịch vụ cung cấp': 'Dịch vụ cung cấp',
  frequency: 'Tần số',
  'Tần số': 'Tần số',
  notes: 'Ghi chú',
  note: 'Ghi chú',
  description: 'Ghi chú',
  'Ghi chú': 'Ghi chú',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',
  'Tọa độ GPS': 'Tọa độ GPS',
  symbol: 'Biểu tượng',
  'Biểu tượng': 'Biểu tượng',
  geometryType: 'Loại đối tượng',
  objectType: 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  coordinateSystem: 'Hệ quy chiếu',
  'Hệ quy chiếu': 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  'Quy tắc hiển thị': 'Quy tắc hiển thị',
  approvalStatus: 'Trạng thái phê duyệt',
  approvalLevel: 'Cấp phê duyệt',
};

const formatHistoryValue = (field: string, val: any): string => {
  if (val === null || val === undefined || val === '') return '—';
  if (field === 'provinceId' || field === 'Địa điểm (Tỉnh/TP)') {
    return getProvinceNameById(val) || String(val);
  }
  if (field === 'conditionStatus' || field === 'Tình trạng') {
    return getConditionStatusLabel(val);
  }
  return String(val);
};

/** Số bản ghi nhật ký mỗi lần cuộn tải thêm trong drawer lịch sử. */
const HISTORY_PAGE_SIZE = 20;

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  NOT_OPERATIONAL: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

export const InmarsatStationList = () => {
  const [data, setData] = useState<CoastalStationInmarsatResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [filterCollapsed, setFilterCollapsed] = useState<boolean>(false);

  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  // Tên đài (bộ lọc thường) và Mã đài (bộ lọc nâng cao) là hai điều kiện riêng,
  // không dùng chung ô "từ khóa" tìm nhiều cột như trước.
  const [filterName, setFilterName] = useState<string>('');
  const [filterCode, setFilterCode] = useState<string>('');

  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>();
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>();
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Sắp xếp chạy ở server để áp dụng cho toàn bộ kết quả; nếu để antd tự sắp thì
  // chỉ các dòng của trang hiện tại được sắp, gây hiểu nhầm là đã sắp cả danh sách.
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Reference data
  const [orgUnits, setOrgUnits] = useState<any[]>([]);

  // Drawer / Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [selectedRecord, setSelectedRecord] = useState<CoastalStationInmarsatResponse | null>(null);

  // Approval modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c2');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [targetRecord, setTargetRecord] = useState<CoastalStationInmarsatResponse | null>(null);

  // History modal
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState<CommonHistoryEntry[]>([]);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  // Số trang nhật ký đã tải. Không suy ra từ độ dài mảng vì backend có thể trả ít
  // hơn pageSize khi lọc, làm lệch số trang → sót/lặp bản ghi.
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate: string; toDate: string }>(
    { keyword: '', fromDate: '', toDate: '' },
  );

  // Permissions & user
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  const userOrgId = user?.orgUnitId ? String(user.orgUnitId) : undefined;
  const userUnitType = user?.unitType || '';

  const canCreate = hasPermission('coastalstationinmarsat:create') || hasPermission('specialstation:create') || hasPermission('data:create') || hasPermission('admin:all');
  const isCucLevel = !userUnitType || userUnitType === 'CHUYEN_VIEN_CUC' || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CUC' || userUnitType === 'CUC_HANG_HAI' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isCangVuLevel = userUnitType === 'CVHH' || userUnitType === 'CANG_VU';
  const canApproveL1 = (hasPermission('coastalstationinmarsat:approvec1') || hasPermission('coastalstationinmarsat:approve') || hasPermission('specialstation:approve') || hasPermission('admin:all')) && (isCangVuLevel || !isCucLevel);
  const canApproveL2 = (hasPermission('coastalstationinmarsat:approvec2') || hasPermission('coastalstationinmarsat:approve') || hasPermission('specialstation:approvec2') || hasPermission('specialstation:approve') || hasPermission('admin:all')) && isCucLevel;

  // Load organizations
  useEffect(() => {
    organizationService.getAll()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        setOrgUnits(list);
      })
      .catch(() => setOrgUnits([]));
  }, []);

  // Filter org units based on data scope
  const filteredOrgUnits = useMemo(() => {
    if (!userOrgId || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CHUYEN_VIEN_CUC') {
      return orgUnits;
    }
    const allowed = new Set(resolveOrgSubtreeIds(orgUnits, userOrgId));
    return orgUnits.filter((u) => allowed.has(String(u.id)));
  }, [orgUnits, userOrgId, userUnitType]);

  // Fetch list
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const approvalStatusParam = (activeTab === 'ALL' || activeTab === 'all') ? undefined : activeTab;

      const res = await inmarsatStationService.search({
        name: filterName?.trim() || undefined,
        code: filterCode?.trim() || undefined,
        orgUnitId: filterOrgUnitId,
        provinceId: filterProvinceId,
        conditionStatus: filterConditionStatus,
        approvalStatus: approvalStatusParam,
        // Backend nhận LocalDateTime và BỎ QUA offset, nên `toISOString()` (giờ UTC)
        // làm cửa sổ lọc lệch đúng bằng chênh lệch múi giờ (VN: -7h): hồ sơ cập nhật
        // sau 17h bị đẩy nhầm sang ngày hôm sau. Gửi thẳng giờ địa phương.
        updatedFrom: filterDateRange?.[0] ? filterDateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined,
        updatedTo: filterDateRange?.[1] ? filterDateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined,
        page,
        size: pageSize,
        sort: sortField ? `${sortField},${sortDirection}` : undefined,
      });

      setData(res.items);
      setTotal(res.total);
      setStatusCounts(res.statusCounts || {});
    } catch {
      setData([]);
      setTotal(0);
      toast.error('Không thể tải danh sách Đài vệ tinh Inmarsat');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterName, filterCode, filterOrgUnitId, filterProvinceId, filterConditionStatus, filterDateRange, page, pageSize, sortField, sortDirection]);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(order);
    setPage(1);
  }, []);

  const sortOrderFor = (key: string): 'ascend' | 'descend' | null =>
    (sortField === key ? (sortDirection === 'asc' ? 'ascend' : 'descend') : null);

  // Bộ so sánh trung tính: thứ tự do server quyết định, hàm này chỉ để antd hiện
  // biểu tượng sắp xếp mà không tự sắp lại các dòng của trang hiện tại.
  const serverSideSorter = () => 0;

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle open modals
  const handleOpenCreate = () => {
    setSelectedRecord(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleOpenEdit = (rec: CoastalStationInmarsatResponse) => {
    setSelectedRecord(rec);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleOpenDetail = (rec: CoastalStationInmarsatResponse) => {
    setSelectedRecord(rec);
    setFormMode('detail');
    setFormOpen(true);
  };

  const handleDelete = (rec: CoastalStationInmarsatResponse) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa Đài Inmarsat "${rec.name || rec.code}" không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, style: { borderRadius: radiusPill, height: 36 } },
      cancelButtonProps: { style: { borderRadius: radiusPill, height: 36 } },
      onOk: async () => {
        try {
          await inmarsatStationService.delete(rec.id);
          toast.success('Xóa đài Inmarsat thành công');
          fetchData();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Không thể xóa đài Inmarsat');
        }
      },
    });
  };

  const handleSubmit = async (rec: CoastalStationInmarsatResponse) => {
    try {
      await inmarsatStationService.submit(rec.id);
      toast.success('Gửi phê duyệt thành công');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi gửi phê duyệt');
    }
  };

  const handleOpenApprove = (rec: CoastalStationInmarsatResponse, level: 'c1' | 'c2') => {
    setTargetRecord(rec);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!targetRecord) return;
    try {
      setApprovalLoading(true);
      if (approveLevel === 'c2') {
        await inmarsatStationService.approveL2(targetRecord.id);
      } else {
        await inmarsatStationService.approveL1(targetRecord.id);
      }
      toast.success('Phê duyệt thành công');
      setApproveModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Phê duyệt thất bại');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleOpenReject = (rec: CoastalStationInmarsatResponse) => {
    setTargetRecord(rec);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!targetRecord) return;
    // approval-2-level-spec §3.4 (quy tắc 5): tối thiểu 10 ký tự — backend cũng
    // chặn đúng ngưỡng này, kiểm tra tại chỗ để người dùng không phải chờ lỗi server.
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      setApprovalLoading(true);
      await inmarsatStationService.reject(targetRecord.id, rejectReason.trim());
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Từ chối thất bại');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleOpenHistory = (rec: CoastalStationInmarsatResponse) => {
    setSelectedRecord(rec);
    setHistoryTargetId(rec.id);
    setHistoryDrawerOpen(true);
    setHistoryList([]);
    setHistoryLoading(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistoryPage(0);
    setHistoryFilters({ keyword: '', fromDate: '', toDate: '' });
  };

  // Backend đã loại các dòng của quy trình phê duyệt và lọc theo từ khóa/ngày, ở
  // đây chỉ ánh xạ sang cấu trúc mà drawer dùng chung mong đợi.
  const mapHistoryEntries = useCallback((logs: any[]): CommonHistoryEntry[] => {
      return (logs || []).map((h: any) => {
        let changes: HistoryChangeItem[] = [];
        if (h.changes && Array.isArray(h.changes)) {
          changes = h.changes;
        } else if (h.previousValue || h.newValue || h.changedField) {
          changes = [{
            field: h.changedField || 'Thông tin',
            oldValue: h.previousValue != null && h.previousValue !== '' ? String(h.previousValue) : '—',
            newValue: h.newValue != null && h.newValue !== '' ? String(h.newValue) : '—',
          }];
        }

        return {
          id: h.id,
          action: h.actionType || h.action || 'UPDATE',
          changedBy: h.changedByName || h.changedBy || 'Hệ thống',
          changedByName: h.changedByName || h.changedBy || 'Hệ thống',
          changedAt: h.changedAt || h.createdAt || h.timestamp,
          description: h.description || h.reason || h.note,
          changes,
        };
      });
  }, []);

  // Nạp lại trang đầu mỗi khi mở drawer hoặc đổi điều kiện lọc.
  useEffect(() => {
    if (!historyDrawerOpen || !historyTargetId) return;
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryList([]);
      setHistoryPage(0);
      try {
        const logs = await inmarsatStationService.getHistory(historyTargetId, 0, HISTORY_PAGE_SIZE, {
          keyword: historyFilters.keyword || undefined,
          fromDate: historyFilters.fromDate || undefined,
          toDate: historyFilters.toDate || undefined,
        });
        if (cancelled) return;
        setHistoryList(mapHistoryEntries(logs));
        setHasMoreHistory((logs || []).length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) {
          setHistoryList([]);
          toast.error('Không thể tải lịch sử thay đổi');
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [historyDrawerOpen, historyTargetId, historyFilters, mapHistoryEntries]);

  const loadMoreHistory = useCallback(async () => {
    if (!historyTargetId || historyLoading || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const logs = await inmarsatStationService.getHistory(historyTargetId, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historyFilters.keyword || undefined,
        fromDate: historyFilters.fromDate || undefined,
        toDate: historyFilters.toDate || undefined,
      });
      if (logs && logs.length > 0) {
        setHistoryList((prev) => [...prev, ...mapHistoryEntries(logs)]);
      }
      setHistoryPage(nextPage);
      setHasMoreHistory((logs || []).length === HISTORY_PAGE_SIZE);
    } catch { /* giữ nguyên phần đã tải, người dùng cuộn lại sẽ thử tiếp */ }
    finally { setLoadingMoreHistory(false); }
  }, [historyTargetId, historyLoading, loadingMoreHistory, hasMoreHistory, historyPage, historyFilters, mapHistoryEntries]);

  // Backend trả về số đếm theo ĐÚNG mã đang lưu trong CSDL, gồm cả mã cũ
  // (PROPOSED, APPROVED_LEVEL2, REJECTED). Phải CỘNG các mã cùng nghĩa chứ không
  // dùng `??`: `??` chỉ lấy khóa đầu tiên khác null nên khi cả hai mã cùng có dữ
  // liệu thì tab đếm thiếu. Riêng "Từ chối" trước đây chỉ đọc mã cũ `REJECTED`
  // trong khi luồng từ chối luôn ghi REJECTED_LEVEL1/LEVEL2, nên tab luôn bằng 0.
  const countDraft = Number(statusCounts['DRAFT'] || statusCounts['draft'] || 0);
  const countPendingApproval = Number(statusCounts['PENDING_APPROVAL'] || 0) + Number(statusCounts['PROPOSED'] || 0) + Number(statusCounts['pending'] || 0);
  const countApprovedLevel1 = Number(statusCounts['APPROVED_LEVEL1'] || statusCounts['approved_level1'] || 0);
  const countApproved = Number(statusCounts['APPROVED'] || statusCounts['APPROVED_LEVEL2'] || statusCounts['approved'] || 0);
  const countRejectedLevel1 = Number(statusCounts['REJECTED_LEVEL1'] || statusCounts['REJECTED'] || 0);
  const countRejectedLevel2 = Number(statusCounts['REJECTED_LEVEL2'] || 0);
  const countAll = countDraft + countPendingApproval + countApprovedLevel1 + countApproved + countRejectedLevel1 + countRejectedLevel2;

  const statusTabs = [
    { key: 'ALL', label: 'Tất cả', count: countAll || total, color: actionPrimary, active: activeTab === 'ALL' || activeTab === 'all' },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: countDraft, color: statusDraft, active: activeTab === ApprovalStatus.DRAFT },
    { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', count: countPendingApproval, color: statusAttention, active: activeTab === ApprovalStatus.PENDING_APPROVAL },
    { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ phê duyệt cấp Cục', count: countApprovedLevel1, color: '#0284C7', active: activeTab === ApprovalStatus.APPROVED_LEVEL1 },
    { key: ApprovalStatus.APPROVED, label: 'Đã phê duyệt', count: countApproved, color: statusOperational, active: activeTab === ApprovalStatus.APPROVED },
    { key: ApprovalStatus.REJECTED_LEVEL1, label: 'Từ chối cấp Cảng vụ/Chi cục', count: countRejectedLevel1, color: statusCritical, active: activeTab === ApprovalStatus.REJECTED_LEVEL1 },
    { key: ApprovalStatus.REJECTED_LEVEL2, label: 'Từ chối cấp Cục', count: countRejectedLevel2, color: statusCritical, active: activeTab === ApprovalStatus.REJECTED_LEVEL2 },
  ];

  // Table columns definition
  const columns = [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>
          {(page - 1) * pageSize + index + 1}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Tên / Mã đài',
      dataIndex: 'name',
      width: 300,
      fixed: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
      render: (_: any, record: CoastalStationInmarsatResponse) => (
        <div
          style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          onClick={() => handleOpenDetail(record)}
        >
          <div style={cellTitleStyle} title={record.name || ''}>{record.name || '—'}</div>
          <div style={cellSubtitleStyle} title={record.code || ''}>{record.code || '—'}</div>
        </div>
      ),
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 240,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('orgUnitName'),
      render: (val: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
          {val || '—'}
        </div>
      ),
    },
    {
      key: 'operatingOrgName',
      label: 'Đơn vị khai thác',
      dataIndex: 'operatingOrgName',
      width: 180,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('operatingOrgName'),
      render: (val: string, record: CoastalStationInmarsatResponse) => {
        const name = getOperatingOrgName(record.operatingOrgId, val);
        return (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>
            {name}
          </div>
        );
      },
    },
    {
      key: 'provinceId',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 160,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('provinceId'),
      render: (pId: number) => {
        const pName = getProvinceNameById(pId);
        return (
          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pName}>
            {pName || '—'}
          </span>
        );
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('conditionStatus'),
      render: (st: string) => {
        const label = getConditionStatusLabel(st);
        const color = getConditionStatusColor(st);
        return (
          <span style={statusBadgeStyle(color)}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 280,
      align: 'left' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvalStatus'),
      render: (st: string) => <ApprovalStatusBadge status={st} />,
    },
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 220,
      sorter: (a: any, b: any) => (a.updatedAt ? new Date(a.updatedAt).getTime() : 0) - (b.updatedAt ? new Date(b.updatedAt).getTime() : 0),
      render: (val: string, record: CoastalStationInmarsatResponse) => {
        const isUuid = (v?: string | null) => !!v && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(v);
        const raw = val || (record as any).createdByName;
        const name = isUuid(raw) ? '—' : (raw || '—');
        const date = record.updatedAt || record.createdAt;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              title={name}
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'submittedByName',
      label: 'Cán bộ gửi phê duyệt',
      dataIndex: 'submittedByName',
      width: 220,
      sorter: (a: any, b: any) => (a.submittedDate || a.submittedAt ? new Date(a.submittedDate || a.submittedAt).getTime() : 0) - (b.submittedDate || b.submittedAt ? new Date(b.submittedDate || b.submittedAt).getTime() : 0),
      render: (val: string, record: CoastalStationInmarsatResponse) => {
        const raw = val || record.submittedBy;
        const isUuid = !!raw && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(raw);
        const name = isUuid ? null : raw;
        const date = record.submittedDate || record.submittedAt;
        if (!name && !date) return <span style={{ color: textSecondary }}>—</span>;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              title={name || '—'}
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name || '—'}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'approverNameLevel1',
      label: 'Phê duyệt cấp Cảng vụ/Chi cục',
      dataIndex: 'approverNameLevel1',
      width: 240,
      sorter: (a: any, b: any) => (a.approvedDateLevel1 ? new Date(a.approvedDateLevel1).getTime() : 0) - (b.approvedDateLevel1 ? new Date(b.approvedDateLevel1).getTime() : 0),
      render: (val: string, record: CoastalStationInmarsatResponse) => {
        const raw = val || record.approverLevel1Name || record.approverLevel1;
        const isUuid = !!raw && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(raw);
        const name = isUuid ? null : raw;
        const date = record.approvedDateLevel1;
        if (!name && !date) return <span style={{ color: textSecondary }}>—</span>;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              title={name || '—'}
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name || '—'}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'approverNameLevel2',
      label: 'Phê duyệt cấp Cục',
      dataIndex: 'approverNameLevel2',
      width: 220,
      sorter: (a: any, b: any) => (a.approvedDateLevel2 ? new Date(a.approvedDateLevel2).getTime() : 0) - (b.approvedDateLevel2 ? new Date(b.approvedDateLevel2).getTime() : 0),
      render: (val: string, record: CoastalStationInmarsatResponse) => {
        const raw = val || record.approverLevel2Name || record.approverLevel2;
        const isUuid = !!raw && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(raw);
        const name = isUuid ? null : raw;
        const date = record.approvedDateLevel2;
        if (!name && !date) return <span style={{ color: textSecondary }}>—</span>;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              title={name || '—'}
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name || '—'}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },

  ];

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        {/* Header */}
        <ScreenHeader
          breadcrumb={[
            { label: 'Tài sản KCHTGT' },
            { label: 'Đài vệ tinh Inmarsat' },
          ]}
          actions={
            canCreate
              ? [{
                key: 'create',
                label: 'Thêm mới',
                variant: 'primary' as const,
                icon: icons.create,
                onClick: handleOpenCreate,
              }]
              : []
          }
        />

        {/* Main List Layout */}
        <FilterTableLayout
          statusTabs={statusTabs}
          onStatusTabChange={(k) => { setActiveTab(k); setPage(1); }}
          onFilterReset={() => {
            setFilterOrgUnitId(undefined);
            setFilterName('');
            setFilterCode('');
            setFilterProvinceId(undefined);
            setFilterConditionStatus(undefined);
            setFilterDateRange(null);
            setActiveTab('all');
            setPage(1);
          }}
          onFilterApply={() => { setPage(1); fetchData(); }}
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
          loading={loading}
          filterContent={
            <>
              <SidebarFilterField label="Đơn vị quản lý" style={{ marginTop: spaceMd }}>
                <OrgUnitTreeSelect
                  organizations={filteredOrgUnits}
                  placeholder="Tất cả"
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  value={filterOrgUnitId}
                  onChange={(val) => {
                    setFilterOrgUnitId(val);
                  }}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tên đài">
                <Input
                  placeholder="Nhập tên đài"
                  allowClear
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  onPressEnter={() => { setPage(1); fetchData(); }}
                  prefix={icons.search}
                  style={inputStyle}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tình trạng">
                <Select
                  placeholder="Tất cả tình trạng"
                  allowClear
                  value={filterConditionStatus}
                  onChange={(val) => setFilterConditionStatus(val)}
                  options={CONDITION_STATUS_OPTIONS}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              {/* ── BỘ LỌC NÂNG CAO ── */}
              {filterCollapsed && (
                <>
                  <SidebarFilterField label="Mã đài">
                    <Input
                      placeholder="Nhập mã đài"
                      allowClear
                      value={filterCode}
                      onChange={(e) => setFilterCode(e.target.value)}
                      onPressEnter={() => { setPage(1); fetchData(); }}
                      prefix={icons.search}
                      style={inputStyle}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Ngày cập nhật">
                    <DatePicker.RangePicker
                      {...getRangePickerProps({
                        value: filterDateRange,
                        onChange: (dates: any) => { setFilterDateRange(dates); setPage(1); },
                      })}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Địa điểm (Tỉnh/Thành phố)">
                    <Select
                      placeholder="Tất cả tỉnh thành"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                      }
                      value={filterProvinceId}
                      onChange={(val) => setFilterProvinceId(val)}
                      options={VIETNAM_PROVINCE_OPTIONS}
                      style={{ ...selectStyle, width: '100%' }}
                    />
                  </SidebarFilterField>
                </>
              )}
            </>
          }
        >
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <DataTable
                dataSource={data}
                columns={columns}
                rowKey="id"
                onSort={handleSort}
                scroll={{ x: 'max-content' }}
                emptyText="Không có dữ liệu Đài Inmarsat"
                rowActions={(rec) => {
                  const currentUserId = user?.userId || user?.id;
                  const isCreator = Boolean(currentUserId && rec.createdBy === currentUserId);
                  const isApproverL1 = Boolean(currentUserId && rec.approverLevel1 === currentUserId);

                  const isPendingL1 = rec.approvalStatus === 'PROPOSED' || rec.approvalStatus === 'PENDING' || rec.approvalStatus === 'PENDING_APPROVAL';
                  const isPendingL2 = rec.approvalStatus === 'APPROVED_LEVEL1';
                  const isDraftOrRejected = rec.approvalStatus === 'DRAFT' || rec.approvalStatus === 'REJECTED' || rec.approvalStatus === 'REJECTED_LEVEL1' || rec.approvalStatus === 'REJECTED_LEVEL2';

                  const canEditThis = canEditApprovalRecord(rec.approvalStatus, {
                    hasPerm: hasPermission,
                    resource: 'coastalstationinmarsat',
                    extraUpdatePerms: ['specialstation:update', 'data:update', 'admin:all'],
                    extraApprovePerms: ['specialstation:approvec2', 'specialstation:approve', 'admin:all'],
                  });

                  const canDeleteThis = canDeleteApprovalRecord(rec.approvalStatus, {
                    hasPerm: hasPermission,
                    resource: 'coastalstationinmarsat',
                    extraDeletePerms: ['specialstation:delete', 'data:delete', 'admin:all'],
                  });

                  const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];

                  // 1. Xem chi tiết (chuẩn VTS)
                  actions.push({
                    key: 'view',
                    label: 'Xem chi tiết',
                    icon: icons.view,
                    onClick: () => handleOpenDetail(rec),
                  });

                  // 2. Chỉnh sửa (đứng thứ 2, ngay sau Xem chi tiết — chuẩn VTS)
                  if (canEditThis) {
                    actions.push({
                      key: 'edit',
                      label: 'Chỉnh sửa',
                      icon: icons.edit,
                      onClick: () => handleOpenEdit(rec),
                    });
                  }

                  // 3. Lịch sử (đứng thứ 3, ngay sau Chỉnh sửa — chuẩn VTS)
                  actions.push({
                    key: 'history',
                    label: 'Lịch sử',
                    icon: icons.history,
                    onClick: () => handleOpenHistory(rec),
                  });

                  // 4. Gửi phê duyệt (chuẩn VTS)
                  if (isDraftOrRejected && canCreate) {
                    actions.push({
                      key: 'submit',
                      label: 'Gửi phê duyệt',
                      icon: icons.submit,
                      onClick: () => handleSubmit(rec),
                    });
                  }

                  // 5 & 6. Phê duyệt & Từ chối cấp Cảng vụ/Chi cục (kèm chống tự duyệt — chuẩn VTS)
                  if (isPendingL1 && canApproveL1 && !isCreator) {
                    actions.push({
                      key: 'approveL1',
                      label: 'Phê duyệt cấp Cảng vụ/Chi cục',
                      icon: icons.approve,
                      onClick: () => handleOpenApprove(rec, 'c1'),
                    });
                    actions.push({
                      key: 'rejectL1',
                      label: 'Từ chối cấp Cảng vụ/Chi cục',
                      icon: icons.reject,
                      danger: true,
                      onClick: () => handleOpenReject(rec),
                    });
                  }

                  // 7 & 8. Phê duyệt & Từ chối cấp Cục (kèm chống tự duyệt — chuẩn VTS)
                  if (isPendingL2 && canApproveL2 && !isApproverL1) {
                    actions.push({
                      key: 'approveL2',
                      label: 'Phê duyệt cấp Cục',
                      icon: icons.approve,
                      onClick: () => handleOpenApprove(rec, 'c2'),
                    });
                    actions.push({
                      key: 'rejectL2',
                      label: 'Từ chối cấp Cục',
                      icon: icons.reject,
                      danger: true,
                      onClick: () => handleOpenReject(rec),
                    });
                  }

                  // 9. Xóa (chuẩn VTS: label 'Xóa', danger: true)
                  if (canDeleteThis) {
                    actions.push({
                      key: 'delete',
                      label: 'Xóa',
                      icon: icons.delete,
                      danger: true,
                      onClick: () => handleDelete(rec),
                    });
                  }

                  return actions;
                }}
              />
              <Pagination
                total={total}
                current={page}
                pageSize={pageSize}
                pageSizeOptions={[20, 50, 100]}
                onChange={(p, sz) => { setPage(p); setPageSize(sz); }}
              />
            </>
          )}
        </FilterTableLayout>

        {/* Unified Drawer Form */}
        {formOpen && (
          <InmarsatStationForm
            open={formOpen}
            mode={formMode}
            editId={selectedRecord?.id}
            initialData={selectedRecord}
            orgUnits={orgUnits}
            onClose={() => setFormOpen(false)}
            onSuccess={() => { setFormOpen(false); fetchData(); }}
          />
        )}

        {/* Approval Modal */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approveLevel}
          loading={approvalLoading}
          onConfirm={handleConfirmApprove}
          onCancel={() => setApproveModalOpen(false)}
        />

        {/* Reject Modal */}
        <Modal
          title={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
          open={rejectModalOpen}
          onCancel={() => setRejectModalOpen(false)}
          onOk={handleConfirmReject}
          okText="Xác nhận từ chối"
          cancelText="Hủy"
          okButtonProps={{ danger: true, style: { borderRadius: radiusPill, height: 38 }, loading: approvalLoading }}
          cancelButtonProps={{ style: { borderRadius: radiusPill, height: 38 } }}
          width={520}
        >
          <div style={{ padding: '12px 0' }}>
            <div style={{ marginBottom: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textSecondary }}>
              Lý do từ chối <span style={{ color: statusCritical }}>*</span>
            </div>
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do từ chối"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </div>
        </Modal>

        {/* History Drawer */}
        <CommonHistoryDrawer
          open={historyDrawerOpen}
          onClose={() => setHistoryDrawerOpen(false)}
          entityName={selectedRecord?.name || selectedRecord?.code}
          records={historyList}
          loading={historyLoading}
          fieldLabelMap={INMARSAT_FIELD_MAP}
          formatValue={formatHistoryValue}
          serverFiltered
          onFilterChange={setHistoryFilters}
          onLoadMore={loadMoreHistory}
          loadingMore={loadingMoreHistory}
        />
      </div>
    </ThemeTokenProvider>
  );
};

export default InmarsatStationList;
