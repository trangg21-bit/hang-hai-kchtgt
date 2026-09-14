import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Modal,
  Table,
  Typography,
  Empty,
  Alert,
  Tooltip,
  Space,
} from 'antd';
import { message } from '../../components/ToastNotification';
import {
  FileTextOutlined,
  FileExcelOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  EyeOutlined,
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
import { ReportColumnSelector, ReportPreviewModal, type ColumnItem } from '../../components/reports';

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

const SUMMARY_COLUMNS: ColumnItem[] = [
  { key: 'reportCode', label: 'Mã báo cáo' },
  { key: 'reportName', label: 'Tên báo cáo' },
  { key: 'orgUnitName', label: 'Đơn vị báo cáo' },
  { key: 'periodText', label: 'Năm báo cáo' },
];

export default function ReportViewer() {
  const { code } = useParams<{ code: string }>();

  const reportCode = code || '';
  const template = REPORT_TEMPLATES.find((t) => t.code === reportCode);

  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [loadingExport, setLoadingExport] = useState<'EXCEL' | 'PDF' | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Column visibility & Popup states
  const [showStt, setShowStt] = useState<boolean>(true);
  const [visibleSummaryKeys, setVisibleSummaryKeys] = useState<string[]>([
    'reportCode',
    'reportName',
    'orgUnitName',
    'periodText',
  ]);
  const [summaryColumnOrder, setSummaryColumnOrder] = useState<string[]>([
    'reportCode',
    'reportName',
    'orgUnitName',
    'periodText',
  ]);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);

  const handleResetColumns = useCallback(() => {
    setShowStt(true);
    setVisibleSummaryKeys(['reportCode', 'reportName', 'orgUnitName', 'periodText']);
    setSummaryColumnOrder(['reportCode', 'reportName', 'orgUnitName', 'periodText']);
  }, []);

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
      if (/^\d+$/.test(numStr)) {
        const num = parseInt(numStr, 10);
        if (num >= 148 && num <= 160) return true;
        if (num >= 180 && num <= 189) return true;
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

  const selectedOrgName = useMemo(() => {
    if (!draftFilters.orgUnitId) return 'Tất cả các đơn vị';
    const org = organizations.find((o) => o.id === draftFilters.orgUnitId);
    return org ? org.name : 'Cục Hàng hải và Đường thủy Việt Nam';
  }, [organizations, draftFilters.orgUnitId]);

  const reportPeriodText = useMemo(() => {
    if (isYearReport) {
      return draftFilters.reportYear ? String(draftFilters.reportYear.year()) : String(dayjs().year());
    }
    if (draftFilters.dateRange?.[0] && draftFilters.dateRange?.[1]) {
      return `${draftFilters.dateRange[0].format('DD/MM/YYYY')} - ${draftFilters.dateRange[1].format('DD/MM/YYYY')}`;
    }
    return draftFilters.reportPeriod || String(dayjs().year());
  }, [isYearReport, draftFilters.reportYear, draftFilters.dateRange, draftFilters.reportPeriod]);

  const summaryRows = useMemo(() => {
    if (!template || !reportData) return [];
    return [
      {
        key: '1',
        stt: 1,
        reportCode: template.vmdCode || template.code,
        reportName: template.name,
        orgUnitName: selectedOrgName,
        periodText: reportPeriodText,
      },
    ];
  }, [template, reportData, selectedOrgName, reportPeriodText]);

  const summaryTableColumns = useMemo(() => {
    const cols: Array<{
      title: string;
      dataIndex?: string;
      key: string;
      width?: number;
      minWidth?: number;
      align?: 'left' | 'center' | 'right';
      fixed?: 'left' | 'right';
      render?: (value: unknown, record: unknown, index: number) => React.ReactNode;
    }> = [];

    if (showStt) {
      cols.push({
        title: 'STT',
        dataIndex: 'stt',
        key: 'stt',
        width: 65,
        align: 'center',
        render: (_: unknown, __: unknown, idx: number) => idx + 1,
      });
    }

    summaryColumnOrder.forEach((colKey) => {
      if (!visibleSummaryKeys.includes(colKey)) return;
      if (colKey === 'reportCode') {
        cols.push({
          title: 'Mã báo cáo',
          dataIndex: 'reportCode',
          key: 'reportCode',
          width: 140,
          align: 'center',
          render: (val: string) => (
            <span style={{ fontWeight: 600, color: textPrimary }}>{val}</span>
          ),
        });
      } else if (colKey === 'reportName') {
        cols.push({
          title: 'Tên báo cáo',
          dataIndex: 'reportName',
          key: 'reportName',
          minWidth: 320,
          render: (val: string) => (
            <span
              style={{
                color: textPrimary,
                fontWeight: 500,
                display: 'inline-block',
                maxWidth: '100%',
              }}
              title={val}
            >
              {val}
            </span>
          ),
        });
      } else if (colKey === 'orgUnitName') {
        cols.push({
          title: 'Đơn vị báo cáo',
          dataIndex: 'orgUnitName',
          key: 'orgUnitName',
          width: 280,
          render: (val: string) => <span style={{ color: textPrimary }}>{val}</span>,
        });
      } else if (colKey === 'periodText') {
        cols.push({
          title: isYearReport ? 'Năm báo cáo' : 'Kỳ báo cáo',
          dataIndex: 'periodText',
          key: 'periodText',
          width: 130,
          align: 'center',
          render: (val: string) => <span style={{ color: textPrimary }}>{val}</span>,
        });
      }
    });

    // Thao tác column
    cols.push({
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      align: 'center',
      fixed: 'right',
      render: () => (
        <Space size={6}>
          <Tooltip title="Xem trước chi tiết báo cáo">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: '#0E6FD6', fontSize: 16 }} />}
              onClick={() => setPreviewModalOpen(true)}
            />
          </Tooltip>
          <Tooltip title="Xuất Excel">
            <Button
              type="text"
              size="small"
              icon={<FileExcelOutlined style={{ color: statusOperational, fontSize: 16 }} />}
              onClick={() => void handleExport('EXCEL')}
              loading={loadingExport === 'EXCEL'}
            />
          </Tooltip>
          <Tooltip title="Xuất PDF">
            <Button
              type="text"
              size="small"
              icon={<FileTextOutlined style={{ color: colors.error, fontSize: 16 }} />}
              onClick={() => void handleExport('PDF')}
              loading={loadingExport === 'PDF'}
            />
          </Tooltip>
        </Space>
      ),
    });

    return cols;
  }, [
    showStt,
    summaryColumnOrder,
    visibleSummaryKeys,
    isYearReport,
    loadingExport,
    handleExport,
  ]);

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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              {/* Action bar on top of table */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0 12px 0',
                }}
              >
                <ReportColumnSelector
                  columns={SUMMARY_COLUMNS}
                  visibleKeys={visibleSummaryKeys}
                  columnOrder={summaryColumnOrder}
                  showStt={showStt}
                  onShowSttChange={setShowStt}
                  onChange={(keys, order) => {
                    setVisibleSummaryKeys(keys);
                    setSummaryColumnOrder(order);
                  }}
                  onReset={handleResetColumns}
                />

                <div style={{ fontSize: 13, color: textSecondary }}>
                  {summaryRows.length > 0 ? '1-1 trong 1' : '0-0 trong 0'}
                </div>
              </div>

              {/* Master Summary Table */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <Table
                  columns={summaryTableColumns}
                  dataSource={summaryRows}
                  pagination={false}
                  bordered
                  size="middle"
                  scroll={{ x: layout.listTableMinWidth }}
                  locale={{
                    emptyText: (
                      <Empty
                        description={
                          <span style={{ color: textSecondary }}>
                            Bấm nút Tổng hợp ở thanh công cụ bên trái để kết xuất dữ liệu.
                          </span>
                        }
                      />
                    ),
                  }}
                />
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <Pagination
                  total={summaryRows.length}
                  current={currentPage}
                  pageSize={pageSize}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                />
              </div>
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

        {/* Modal Xem trước chi tiết báo cáo */}
        <ReportPreviewModal
          open={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          reportCode={template.vmdCode || template.code}
          reportName={template.name}
          orgUnitName={selectedOrgName}
          reportPeriodText={reportPeriodText}
          reportData={reportData}
          loading={loadingPreview}
          onExport={handleExport}
          loadingExport={loadingExport}
        />
      </div>
    </ThemeTokenProvider>
  );
}
