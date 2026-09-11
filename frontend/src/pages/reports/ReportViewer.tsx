import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Modal,
  Table,
  Typography,
  Empty,
  Badge,
  Alert,
} from 'antd';
import { message } from '../../components/ToastNotification';
import {
  FileTextOutlined,
  FileExcelOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { isAxiosError } from 'axios';
import Bcc157Form from './Bcc157Form';
import CommonReportFormDrawer from './CommonReportFormDrawer';
import { bcc157Service, type Bcc157History } from '../../services/bcc157Service';
import { reportRecordService } from '../../services/reportRecordService';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { reportService } from '../../services/reportService';
import type { ReportRequest, ReportResponse } from '../../types/report';
import { REPORT_TEMPLATES } from './ReportList';
import { organizationService, type Organization } from '../../services/organizationService';
import {
  statusOperational,
  textSecondary, textPrimary,
  spaceSm, spaceLg,
  fontSizeLg,
  fontWeightBold,
} from '../../tokens';
import { colors, layout } from '../../theme';
import {
  ScreenHeader,
  DataTable,
  FilterTableLayout,
  TableFilter,
  type FilterOption,
  type ScreenHeaderAction,
} from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import * as themeTokenChk from '../../themetokenchk';

const { Text } = Typography;

const RECORD_REPORT_CODES = [
  'F-170', 'F-171', 'F-172', 'F-173', 'F-174',
  'F-175', 'F-176', 'F-177', 'F-178', 'F-179',
];

interface ReportViewerFilters {
  orgUnitId?: string;
  portGroup?: number;
  reportYear?: Dayjs | null;
  dataSource?: string;
  bcNoiDung?: string;
  reportPeriod?: string;
  dateRange?: [Dayjs | null, Dayjs | null];
  processingMethods?: string[];
  [key: string]: unknown;
}

interface ReportColumnConfig {
  width: number;
  align: 'left' | 'center' | 'right';
}

function getReportColumnConfig(header: string): ReportColumnConfig {
  const h = header.toLowerCase().trim();
  // Safe min width based on header text length (uppercase bold font 13.5px ~ 9.5px per char + 32px padding)
  const headerMinWidth = Math.ceil(header.length * 9.5) + 32;

  let baseWidth = 160;
  let align: 'left' | 'center' | 'right' = 'left';

  if (h === 'stt') {
    return { width: 70, align: 'center' };
  }
  if (h.includes('đơn vị tính') || h === 'đvt') {
    baseWidth = 120;
    align = 'center';
  } else if (h.includes('mã')) {
    baseWidth = 140;
    align = 'center';
  } else if (h.includes('thời điểm') || h.includes('ngày') || h.includes('năm')) {
    baseWidth = 160;
    align = 'center';
  } else if (
    h.includes('năng lực') ||
    h.includes('chiều dài') ||
    h.includes('tàu') ||
    h.includes('dwt') ||
    h.includes('gt') ||
    h.includes('công suất') ||
    h.includes('diện tích') ||
    h.includes('chi phí') ||
    h.includes('số lượng') ||
    h.includes('khối lượng') ||
    h.includes('tổng số') ||
    h.includes('sức chở') ||
    h.includes('mớn nước') ||
    h.includes('độ sâu') ||
    h.includes('dung tích') ||
    h.includes('trọng tải') ||
    h.includes('sản lượng')
  ) {
    baseWidth = 180;
    align = 'right';
  } else if (h.includes('danh mục') || h.includes('tên')) {
    baseWidth = 340;
    align = 'left';
  } else if (h.includes('đơn vị') || h.includes('khai thác') || h.includes('quản lý')) {
    baseWidth = 280;
    align = 'left';
  } else if (h.includes('địa điểm') || h.includes('vị trí') || h.includes('phạm vi')) {
    baseWidth = 240;
    align = 'left';
  } else if (h.includes('công năng') || h.includes('chức năng') || h.includes('loại')) {
    baseWidth = 240;
    align = 'left';
  } else if (h.includes('ghi chú')) {
    baseWidth = 180;
    align = 'left';
  }

  return {
    width: Math.max(baseWidth, headerMinWidth),
    align,
  };
}

export default function ReportViewer() {
  const { code } = useParams<{ code: string }>();

  const reportCode = code || '';
  const template = REPORT_TEMPLATES.find((t) => t.code === reportCode);

  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [, setLoadingExport] = useState<'EXCEL' | 'PDF' | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Filter states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [draftFilters, setDraftFilters] = useState<ReportViewerFilters>({
    orgUnitId: undefined,
    reportYear: dayjs(),
    dataSource: '1',
    reportPeriod: 'MONTHLY',
    dateRange: [dayjs().subtract(1, 'month'), dayjs()],
    bcNoiDung: '1',
    processingMethods: [],
  });

  const [previewError, setPreviewError] = useState<string | null>(null);

  // Form Drawer states
  const [bccFormOpen, setBccFormOpen] = useState(false);
  const [bccEditingId, setBccEditingId] = useState<string>();

  const [commonFormOpen, setCommonFormOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string>();

  const hasPermission = usePermissionStore((state: PermissionState) => state.hasPermission);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState<Bcc157History[]>([]);

  const isRecordReport = RECORD_REPORT_CODES.includes(reportCode);

  const isYearReport = useMemo(() => {
    if (['F-142', 'F-166', 'F-172', 'F-173', 'F-175', 'F-176', 'F-178', 'F-179'].includes(reportCode)) return true;
    if (reportCode.startsWith('F-')) {
      const numStr = reportCode.substring(2);
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num >= 148 && num <= 160) {
        return true;
      }
    }
    return false;
  }, [reportCode]);

  const isSpecialContentReport = reportCode === 'F-143';
  const isPeriodReport = !isYearReport && !isSpecialContentReport;

  // Load organizations
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const resp = await organizationService.list();
        const list = [...(resp.data || [])];
        setOrganizations(list);

        const defaultOrg = list.find((o: Organization) => o.code === 'G17.43') || list[0];
        if (defaultOrg) {
          setDraftFilters((prev) => ({
            ...prev,
            orgUnitId: prev.orgUnitId || defaultOrg.id,
          }));
        }
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    };

    void loadOrgs();
  }, [reportCode]);

  const fetchPreview = useCallback(async () => {
    if (!reportCode) return;

    setCurrentPage(1);
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const request: ReportRequest = {
        reportCode,
        orgUnitId: draftFilters.orgUnitId,
        portGroup: draftFilters.portGroup,
        reportPeriod: draftFilters.reportPeriod,
        dataSource: reportCode === 'F-142' ? draftFilters.dataSource : undefined,
        processingMethods: reportCode === 'F-147' ? draftFilters.processingMethods : undefined,
      };

      if (isYearReport) {
        if (draftFilters.reportYear) {
          request.startDate = draftFilters.reportYear.startOf('year').format('YYYY-MM-DD');
          request.endDate = draftFilters.reportYear.endOf('year').format('YYYY-MM-DD');
        }
      } else if (isSpecialContentReport) {
        request.bcNoiDung = draftFilters.bcNoiDung;
        request.startDate = dayjs().startOf('year').format('YYYY-MM-DD');
        request.endDate = dayjs().endOf('year').format('YYYY-MM-DD');
      } else if (reportCode === 'F-147') {
        request.bcNoiDung = draftFilters.processingMethods && draftFilters.processingMethods.length > 0
          ? draftFilters.processingMethods.join(',')
          : undefined;
        if (draftFilters.dateRange?.[0]) request.startDate = draftFilters.dateRange[0].format('YYYY-MM-DD');
        if (draftFilters.dateRange?.[1]) request.endDate = draftFilters.dateRange[1].format('YYYY-MM-DD');
      } else if (isPeriodReport) {
        if (draftFilters.dateRange?.[0]) request.startDate = draftFilters.dateRange[0].format('YYYY-MM-DD');
        if (draftFilters.dateRange?.[1]) request.endDate = draftFilters.dateRange[1].format('YYYY-MM-DD');
      }

      const data = await reportService.getPreview(request);
      setReportData(data);
    } catch (err: unknown) {
      setReportData(null);
      setPreviewError((isAxiosError<{ message?: string }>(err) && err.response?.data?.message) || 'Không thể tải dữ liệu xem trước');
    } finally {
      setLoadingPreview(false);
    }
  }, [reportCode, draftFilters, isYearReport, isSpecialContentReport, isPeriodReport]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang hoặc reloadKey thay đổi
    setCurrentPage(1);
    setPageSize(20);
    if (template?.status === 'active') {
      void fetchPreview();
    } else {
      setReportData(null);
    }
  }, [fetchPreview, template, reloadKey]);

  const handleExport = useCallback(async (format: 'EXCEL' | 'PDF') => {
    setLoadingExport(format);
    try {
      const request: ReportRequest = {
        reportCode,
        format,
        orgUnitId: draftFilters.orgUnitId,
        portGroup: draftFilters.portGroup,
        reportPeriod: draftFilters.reportPeriod,
        dataSource: reportCode === 'F-142' ? draftFilters.dataSource : undefined,
        processingMethods: reportCode === 'F-147' ? draftFilters.processingMethods : undefined,
      };

      if (isYearReport) {
        if (draftFilters.reportYear) {
          request.startDate = draftFilters.reportYear.startOf('year').format('YYYY-MM-DD');
          request.endDate = draftFilters.reportYear.endOf('year').format('YYYY-MM-DD');
        }
      } else if (isSpecialContentReport) {
        request.bcNoiDung = draftFilters.bcNoiDung;
        request.startDate = dayjs().startOf('year').format('YYYY-MM-DD');
        request.endDate = dayjs().endOf('year').format('YYYY-MM-DD');
      } else if (reportCode === 'F-147') {
        request.bcNoiDung = draftFilters.processingMethods && draftFilters.processingMethods.length > 0
          ? draftFilters.processingMethods.join(',')
          : undefined;
        if (draftFilters.dateRange?.[0]) request.startDate = draftFilters.dateRange[0].format('YYYY-MM-DD');
        if (draftFilters.dateRange?.[1]) request.endDate = draftFilters.dateRange[1].format('YYYY-MM-DD');
      } else if (isPeriodReport) {
        if (draftFilters.dateRange?.[0]) request.startDate = draftFilters.dateRange[0].format('YYYY-MM-DD');
        if (draftFilters.dateRange?.[1]) request.endDate = draftFilters.dateRange[1].format('YYYY-MM-DD');
      }

      await reportService.exportReport(request);
      message.success(`Xuất ${format === 'EXCEL' ? 'Excel' : 'PDF'} thành công!`);
    } catch (err: unknown) {
      console.error(err);
      message.error('Không thể xuất báo cáo');
    } finally {
      setLoadingExport(null);
    }
  }, [reportCode, draftFilters, isYearReport, isSpecialContentReport, isPeriodReport]);

  const handleClearFilters = useCallback(() => {
    const defaultOrg = organizations.find((o: Organization) => o.code === 'G17.43') || organizations[0];
    setDraftFilters({
      orgUnitId: defaultOrg?.id,
      reportYear: dayjs(),
      dataSource: '1',
      reportPeriod: 'MONTHLY',
      dateRange: [dayjs().subtract(1, 'month'), dayjs()],
      bcNoiDung: '1',
      processingMethods: [],
    });
    setReportData(null);
  }, [organizations]);

  const editBccReport = useCallback(async (action: 'edit' | 'delete' | 'history' = 'edit') => {
    if (!draftFilters.orgUnitId || !draftFilters.reportYear) {
      message.error('Chọn đơn vị và năm báo cáo cần sửa');
      return;
    }
    try {
      const reports = await bcc157Service.search({
        orgUnitId: draftFilters.orgUnitId,
        reportYear: draftFilters.reportYear.year(),
        nguonDuLieu: '1',
      });
      const report = reports.find((item) => item.orgUnitId === draftFilters.orgUnitId);
      if (!report) {
        message.error('Đơn vị chưa nhập báo cáo cho năm đã chọn');
        return;
      }
      if (action === 'history') {
        setHistoryRows(await bcc157Service.history(report.id));
        setHistoryOpen(true);
      } else if (action === 'delete') {
        Modal.confirm({
          title: 'Xóa báo cáo BCC157 đã nhập?',
          content: `Báo cáo năm ${report.reportYear} của ${report.orgUnitName ?? 'đơn vị đã chọn'} sẽ bị xóa.`,
          okText: 'Xóa',
          cancelText: 'Hủy',
          okButtonProps: { danger: true },
          onOk: async () => {
            try {
              await bcc157Service.delete(report.id);
              message.success('Xóa báo cáo thành công');
              setReloadKey((k) => k + 1);
            } catch {
              message.error('Không thể xóa báo cáo');
              throw new Error('Không thể xóa báo cáo');
            }
          },
        });
      } else {
        setBccEditingId(report.id);
        setBccFormOpen(true);
      }
    } catch {
      message.error('Không thể tải báo cáo để sửa');
    }
  }, [draftFilters.orgUnitId, draftFilters.reportYear]);

  const handleRecordAction = useCallback(async (action: 'create' | 'edit' | 'delete' | 'history') => {
    if (action === 'create') {
      setEditingRecordId(undefined);
      setCommonFormOpen(true);
      return;
    }
    if (!draftFilters.orgUnitId) {
      message.error('Vui lòng chọn đơn vị báo cáo');
      return;
    }
    try {
      const records = await reportRecordService.search({
        reportCode,
        orgUnitId: draftFilters.orgUnitId,
        reportYear: draftFilters.reportYear ? draftFilters.reportYear.year() : dayjs().year(),
        reportPeriod: draftFilters.reportPeriod,
      });
      const record = records[0];
      if (!record) {
        message.warning('Chưa có số liệu báo cáo đã lưu cho đơn vị và thời gian đã chọn. Bấm Thêm mới để nhập liệu.');
        return;
      }
      if (action === 'edit') {
        setEditingRecordId(record.id);
        setCommonFormOpen(true);
      } else if (action === 'delete') {
        Modal.confirm({
          title: `Xóa số liệu báo cáo ${reportCode}?`,
          content: `Số liệu năm ${record.reportYear} của đơn vị sẽ bị xóa.`,
          okText: 'Xóa',
          cancelText: 'Hủy',
          okButtonProps: { danger: true },
          onOk: async () => {
            try {
              await reportRecordService.delete(record.id);
              message.success('Xóa số liệu báo cáo thành công');
              setReloadKey((k) => k + 1);
            } catch {
              message.error('Không thể xóa số liệu báo cáo');
              throw new Error('Không thể xóa số liệu báo cáo');
            }
          },
        });
      } else if (action === 'history') {
        setHistoryRows([
          {
            id: record.id,
            orgUnitId: record.orgUnitId,
            reportYear: record.reportYear,
            approvedDate: record.updatedAt || record.createdAt || new Date().toISOString(),
            status: record.status || 'SAVED',
          },
        ]);
        setHistoryOpen(true);
      }
    } catch {
      message.error('Không thể thao tác với số liệu báo cáo');
    }
  }, [reportCode, draftFilters.orgUnitId, draftFilters.reportYear, draftFilters.reportPeriod]);

  const filterConfigs = useMemo<FilterOption<ReportViewerFilters>[]>(() => {
    const configs: FilterOption<ReportViewerFilters>[] = [
      {
        key: 'orgUnitId',
        label: 'Đơn vị báo cáo',
        type: 'treeSelect',
        required: true,
        placeholder: 'Chọn đơn vị báo cáo',
        organizations,
      },
    ];

    if (reportCode === 'F-149') {
      configs.push({
        key: 'portGroup',
        label: 'Nhóm cảng biển',
        type: 'select',
        placeholder: 'Chọn nhóm cảng biển',
        options: [
          { value: 1, label: 'Nhóm 1' },
          { value: 2, label: 'Nhóm 2' },
          { value: 3, label: 'Nhóm 3' },
          { value: 4, label: 'Nhóm 4' },
          { value: 5, label: 'Nhóm 5' },
        ],
        allowClear: true,
      });
    }

    if (isYearReport) {
      configs.push({
        key: 'reportYear',
        label: 'Năm báo cáo',
        type: 'date',
        required: true,
        placeholder: 'Chọn năm',
        dateProps: { picker: 'year' },
      });
    }

    if (reportCode === 'F-142') {
      configs.push({
        key: 'dataSource',
        label: 'Nguồn dữ liệu',
        type: 'select',
        required: true,
        placeholder: 'Chọn nguồn dữ liệu',
        options: [
          { value: '1', label: 'Báo cáo đã nhập' },
          { value: '2', label: 'Tổng hợp từ tài sản' },
        ],
      });
    }

    if (isSpecialContentReport) {
      configs.push({
        key: 'bcNoiDung',
        label: 'Nội dung báo cáo',
        type: 'select',
        required: true,
        placeholder: 'Chọn nội dung báo cáo',
        options: [
          { value: '1', label: 'Kê khai lần đầu' },
          { value: '2', label: 'Kê khai bổ sung' },
          { value: '3', label: 'Kê khai thay đổi thông tin' },
        ],
      });
    }

    if (isPeriodReport) {
      configs.push({
        key: 'reportPeriod',
        label: 'Kỳ báo cáo',
        type: 'select',
        required: true,
        placeholder: 'Chọn kỳ báo cáo',
        options: [
          { value: 'MONTHLY', label: 'Tháng' },
          { value: 'QUARTERLY', label: 'Quý' },
          { value: 'ANNUAL', label: 'Năm' },
          { value: 'PERIODIC', label: 'Định kỳ' },
        ],
        allowClear: true,
      });

      if (reportCode !== 'F-147') {
        configs.push({
          key: 'dateRange',
          label: 'Thời gian báo cáo',
          type: 'dateRange',
          placeholder: ['Từ ngày', 'Đến ngày'],
        });
      }
    }

    if (reportCode === 'F-147') {
      configs.push({
        key: 'processingMethods',
        label: 'Hình thức xử lý',
        type: 'select',
        required: true,
        placeholder: 'Chọn hình thức xử lý',
        selectProps: { mode: 'multiple' },
        options: [
          { value: '1', label: 'Bàn giao' },
          { value: '3', label: 'Phá dỡ' },
          { value: '2', label: 'Thanh lý' },
          { value: '0', label: 'Điều chuyển' },
        ],
        allowClear: true,
      });
    }

    return configs;
  }, [reportCode, isYearReport, isSpecialContentReport, isPeriodReport, organizations]);

  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];

    // F-142 actions
    if (reportCode === 'F-142') {
      if (hasPermission('report:create')) {
        actions.push({
          key: 'create',
          label: 'Thêm mới',
          variant: 'primary',
          icon: <PlusOutlined />,
          onClick: () => { setBccEditingId(undefined); setBccFormOpen(true); },
        });
      }
      if (draftFilters.dataSource === '1') {
        if (hasPermission('report:update')) {
          actions.push({
            key: 'edit',
            label: 'Chỉnh sửa',
            variant: 'subtle',
            icon: <EditOutlined />,
            onClick: () => void editBccReport(),
          });
        }
        actions.push({
          key: 'history',
          label: 'Lịch sử',
          variant: 'subtle',
          icon: <HistoryOutlined />,
          onClick: () => void editBccReport('history'),
        });
        if (hasPermission('report:delete')) {
          actions.push({
            key: 'delete',
            label: 'Xóa',
            variant: 'subtle',
            icon: <DeleteOutlined />,
            onClick: () => void editBccReport('delete'),
          });
        }
      }
    }

    // F-170 .. F-179 actions
    if (isRecordReport) {
      if (hasPermission('report:create')) {
        actions.push({
          key: 'create-record',
          label: 'Thêm mới',
          variant: 'primary',
          icon: <PlusOutlined />,
          onClick: () => void handleRecordAction('create'),
        });
      }
      if (hasPermission('report:update')) {
        actions.push({
          key: 'edit-record',
          label: 'Chỉnh sửa',
          variant: 'subtle',
          icon: <EditOutlined />,
          onClick: () => void handleRecordAction('edit'),
        });
      }
      actions.push({
        key: 'history-record',
        label: 'Lịch sử',
        variant: 'subtle',
        icon: <HistoryOutlined />,
        onClick: () => void handleRecordAction('history'),
      });
      if (hasPermission('report:delete')) {
        actions.push({
          key: 'delete-record',
          label: 'Xóa',
          variant: 'subtle',
          icon: <DeleteOutlined />,
          onClick: () => void handleRecordAction('delete'),
        });
      }
    }

    // Common export actions
    actions.push({
      key: 'export-excel',
      label: 'Xuất Excel',
      variant: 'subtle',
      icon: <FileExcelOutlined style={{ color: statusOperational, fontSize: fontSizeLg }} />,
      borderColor: `${statusOperational}80`,
      color: statusOperational,
      onClick: () => void handleExport('EXCEL'),
    });
    actions.push({
      key: 'export-pdf',
      label: 'Xuất PDF',
      variant: 'subtle',
      icon: <FileTextOutlined style={{ color: colors.error, fontSize: fontSizeLg }} />,
      borderColor: `${colors.error}80`,
      color: colors.error,
      onClick: () => void handleExport('PDF'),
    });

    return actions;
  }, [
    reportCode,
    isRecordReport,
    hasPermission,
    draftFilters.dataSource,
    editBccReport,
    handleRecordAction,
    handleExport,
  ]);

  const columns = useMemo(() => {
    if (!reportData || reportData.headers.length === 0) return [];
    return reportData.headers.map((h) => {
      const colConfig = getReportColumnConfig(h);
      return {
        title: h,
        dataIndex: h,
        key: h,
        width: colConfig.width,
        align: colConfig.align,
        onHeaderCell: () => ({
          style: {
            background: colors.bodyBg,
            color: colors.sidebarBg,
            fontWeight: fontWeightBold,
            fontSize: 13.5,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase' as const,
            padding: '12px 14px',
            textAlign: colConfig.align,
          },
        }),
        onCell: () => ({
          style: {
            fontSize: 13.5,
            color: textPrimary,
            textAlign: colConfig.align,
            padding: '10px 14px',
          },
        }),
        render: (value: unknown) => {
          if (value === null || value === undefined) return '-';
          if (typeof value === 'number') return value.toLocaleString('vi-VN');
          if (typeof value === 'boolean') return value ? <Badge status="success" text="Đúng" /> : <Badge status="error" text="Sai" />;
          const strVal = String(value);
          if (strVal === '') return '';
          return (
            <span
              title={strVal.trim()}
              style={{
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                verticalAlign: 'middle',
              }}
            >
              {strVal}
            </span>
          );
        },
      };
    });
  }, [reportData]);

  const totalColumnsWidth = useMemo(() => {
    return columns.reduce((acc, col) => acc + (col.width || 150), 0);
  }, [columns]);

  const customTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  if (!template) {
    return (
      <Card style={{ margin: spaceLg }}>
        <Empty description="Không tìm thấy thông tin biểu mẫu báo cáo." />
      </Card>
    );
  }

  return (
    <ThemeTokenProvider tokens={customTokens}>
      <div className="report-viewer-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .report-viewer-wrapper,
          .report-viewer-wrapper .ant-table,
          .report-viewer-wrapper .ant-table-cell,
          .report-viewer-wrapper .ant-table-thead > tr > th,
          .report-viewer-wrapper .ant-table-tbody > tr > td,
          .report-viewer-wrapper .ant-input,
          .report-viewer-wrapper .ant-select,
          .report-viewer-wrapper .ant-select-selection-item,
          .report-viewer-wrapper .ant-select-item-option-content,
          .report-viewer-wrapper .ant-picker,
          .report-viewer-wrapper .ant-picker-input > input,
          .report-viewer-wrapper .ant-btn,
          .report-viewer-wrapper .ant-pagination,
          .report-viewer-wrapper .ant-pagination-item,
          .report-viewer-wrapper .ant-pagination-total-text,
          .report-viewer-wrapper .ant-breadcrumb {
            font-size: 13.5px !important;
          }

          .report-section-row td { background-color: ${colors.bodyBg} !important; font-weight: 700 !important; }
          .report-port-row td { font-weight: 700 !important; }
        `}</style>

        <ScreenHeader
          breadcrumb={[
            { label: 'Báo cáo thống kê' },
            { label: `${template.code} - ${template.name}` },
          ]}
          actions={headerActions}
        />

        <FilterTableLayout
          filterContent={
            <TableFilter
              mode="fieldsOnly"
              filters={filterConfigs}
              values={draftFilters}
              onChange={(v) => setDraftFilters(v as ReportViewerFilters)}
            />
          }
          hideStatusTabs={true}
          hideFilterToggle={true}
          applyLabel="Tổng hợp"
          onFilterApply={() => void fetchPreview()}
          onFilterReset={handleClearFilters}
          loading={loadingPreview}
          error={!!previewError}
          errorMessage={previewError ?? undefined}
          onRetry={() => void fetchPreview()}
        >
          {template.status === 'proposed' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 280 }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                    <Text type="secondary">
                      Biểu mẫu này nằm trong kế hoạch phát triển. Trạng thái hiện tại: <b>Proposed</b>.
                    </Text>
                    <Alert
                      type="info"
                      message="Dữ liệu mẫu và API tương ứng chưa được kích hoạt cho biểu mẫu này. Vui lòng quay lại trong các giai đoạn tiếp theo."
                      showIcon
                    />
                  </div>
                }
              />
            </div>
          ) : reportData && reportData.rows.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <Table
                  columns={columns}
                  dataSource={reportData.rows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((row, idx) => ({ ...row, key: (currentPage - 1) * pageSize + idx }))}
                  pagination={false}
                  className="list-view-table"
                  tableLayout="fixed"
                  scroll={{
                    x: Math.max(totalColumnsWidth, layout.listTableMinWidth),
                    y: 'calc(100vh - 280px)',
                  }}
                  onRow={(record: Record<string, string | number | boolean | null>) => {
                    const sequenceNo = record['STT'];
                    if (record._rowType === 'section' || sequenceNo === 'I' || sequenceNo === 'II') return { className: 'report-section-row' };
                    if (sequenceNo && sequenceNo !== '' && !isNaN(Number(sequenceNo))) return { className: 'report-port-row' };
                    return {};
                  }}
                />
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <Pagination
                  total={reportData.summary?.total ?? reportData.rows.length}
                  current={currentPage}
                  pageSize={pageSize}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 280 }}>
              <Empty description={<span style={{ color: textSecondary }}>Bấm nút Tổng hợp ở thanh công cụ bên trái để kết xuất dữ liệu.</span>} />
            </div>
          )}
        </FilterTableLayout>

        {/* Form Drawer cho BCC157 (F-142) */}
        <Bcc157Form
          open={bccFormOpen}
          reportId={bccEditingId}
          onClose={() => setBccFormOpen(false)}
          onSaved={() => {
            setBccFormOpen(false);
            setReloadKey((k) => k + 1);
          }}
        />

        {/* Form Drawer cho các biểu mẫu nhập/lưu F-170 .. F-179 */}
        <CommonReportFormDrawer
          open={commonFormOpen}
          reportCode={reportCode}
          reportName={template.name}
          initialRecordId={editingRecordId}
          initialOrgUnitId={draftFilters.orgUnitId}
          initialYear={draftFilters.reportYear ? draftFilters.reportYear.year() : dayjs().year()}
          initialPeriod={draftFilters.reportPeriod}
          onClose={() => setCommonFormOpen(false)}
          onSaved={() => {
            setCommonFormOpen(false);
            setReloadKey((k) => k + 1);
          }}
        />

        {/* Modal Lịch sử */}
        <Modal
          open={historyOpen}
          title={`Lịch sử báo cáo ${reportCode}`}
          footer={null}
          onCancel={() => setHistoryOpen(false)}
          width={720}
        >
          <DataTable
            dataSource={historyRows}
            rowKey="id"
            fill={false}
            scroll={{ y: 320 }}
            columns={[
              {
                key: 'approvedDate',
                label: 'Thời gian',
                width: 240,
                render: (value: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm:ss') : '-'),
              },
              {
                key: 'status',
                label: 'Thao tác / Trạng thái',
                width: 240,
                render: (value: string) =>
                  ({
                    CREATED: 'Tạo báo cáo',
                    UPDATED: 'Cập nhật báo cáo',
                    DELETED: 'Xóa báo cáo',
                    DRAFT: 'Lưu tạm',
                    APPROVED: 'Đã phê duyệt',
                    SAVED: 'Đã lưu',
                  }[value] ?? value),
              },
            ]}
          />
        </Modal>
      </div>
    </ThemeTokenProvider>
  );
}
