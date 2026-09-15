import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Modal,
  Typography,
  Empty,
  Alert,
  Spin,
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
  textPrimary,
  spaceSm, spaceLg,
} from '../../tokens';
import { colors } from '../../theme';
import {
  ScreenHeader,
  DataTable,
  FilterTableLayout,
  TableFilter,
  type FilterOption,
  type ScreenHeaderAction,
} from '../../components/list-view';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import * as themeTokenChk from '../../themetokenchk';
import { CommonTable, TableColumnType } from '../../components/shared/common-table';
import { reportPdfPreviewService } from '../../services/reportPdfPreviewService';

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

  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>();
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [pdfPreviewError, setPdfPreviewError] = useState<string>();
  const pdfPreviewRequestRef = useRef<AbortController | undefined>(undefined);

  // Filter states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [draftFilters, setDraftFilters] = useState<ReportViewerFilters>({
    orgUnitId: undefined,
    reportYear: dayjs(),
    dataSource: '1',
    reportPeriod: 'MONTHLY',
    dateRange: [dayjs().subtract(1, 'month'), dayjs()],
    bcNoiDung: '1',
    processingMethods: reportCode === 'F-147' ? ['1', '3', '2', '0'] : [],
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
  }, []);

  const fetchPreview = useCallback(async () => {
    if (!reportCode) return;

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

  /* eslint-disable react-hooks/set-state-in-effect -- tải dữ liệu khi trang hoặc reloadKey thay đổi */
  useEffect(() => {
    void reloadKey;
    if (template?.status === 'active') {
      void fetchPreview();
    } else {
      setReportData(null);
    }
  }, [fetchPreview, template, reloadKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const buildExportRequest = useCallback((format: 'EXCEL' | 'PDF'): ReportRequest => {
    const request: ReportRequest = {
      reportCode,
      format,
      orgUnitId: draftFilters.orgUnitId,
      portGroup: draftFilters.portGroup,
      reportPeriod: draftFilters.reportPeriod,
      dataSource: reportCode === 'F-142' ? draftFilters.dataSource : undefined,
      processingMethods: reportCode === 'F-147' ? draftFilters.processingMethods : undefined,
    };

    if (isYearReport && draftFilters.reportYear) {
      request.startDate = draftFilters.reportYear.startOf('year').format('YYYY-MM-DD');
      request.endDate = draftFilters.reportYear.endOf('year').format('YYYY-MM-DD');
    } else if (isSpecialContentReport) {
      request.bcNoiDung = draftFilters.bcNoiDung;
      request.startDate = dayjs().startOf('year').format('YYYY-MM-DD');
      request.endDate = dayjs().endOf('year').format('YYYY-MM-DD');
    } else if (reportCode === 'F-147') {
      request.bcNoiDung = draftFilters.processingMethods?.length
        ? draftFilters.processingMethods.join(',')
        : undefined;
      if (draftFilters.dateRange?.[0]) request.startDate = draftFilters.dateRange[0].format('YYYY-MM-DD');
      if (draftFilters.dateRange?.[1]) request.endDate = draftFilters.dateRange[1].format('YYYY-MM-DD');
    } else if (isPeriodReport) {
      if (draftFilters.dateRange?.[0]) request.startDate = draftFilters.dateRange[0].format('YYYY-MM-DD');
      if (draftFilters.dateRange?.[1]) request.endDate = draftFilters.dateRange[1].format('YYYY-MM-DD');
    }

    return request;
  }, [reportCode, draftFilters, isYearReport, isSpecialContentReport, isPeriodReport]);

  const handleExport = useCallback(async (format: 'EXCEL' | 'PDF') => {
    setLoadingExport(format);
    try {
      await reportService.exportReport(buildExportRequest(format));
      message.success(`Xuất ${format === 'EXCEL' ? 'Excel' : 'PDF'} thành công!`);
    } catch (err: unknown) {
      console.error(err);
      message.error('Không thể xuất báo cáo');
    } finally {
      setLoadingExport(null);
    }
  }, [buildExportRequest]);

  const handlePreviewPdf = useCallback(async () => {
    pdfPreviewRequestRef.current?.abort();
    const controller = new AbortController();
    pdfPreviewRequestRef.current = controller;
    setPdfPreviewOpen(true);
    setPdfPreviewLoading(true);
    setPdfPreviewError(undefined);
    setPdfPreviewUrl(undefined);
    try {
      const blob = await reportPdfPreviewService.getPdfBlob(
        buildExportRequest('PDF'),
        controller.signal,
      );
      if (controller.signal.aborted) return;
      const objectUrl = window.URL.createObjectURL(blob);
      if (controller.signal.aborted) {
        window.URL.revokeObjectURL(objectUrl);
        return;
      }
      setPdfPreviewUrl(objectUrl);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      console.error(err);
      setPdfPreviewError('Không thể tải bản xem trước PDF');
    } finally {
      if (pdfPreviewRequestRef.current === controller) {
        pdfPreviewRequestRef.current = undefined;
        setPdfPreviewLoading(false);
      }
    }
  }, [buildExportRequest]);

  useEffect(() => () => pdfPreviewRequestRef.current?.abort(), []);

  useEffect(() => () => {
    if (pdfPreviewUrl) window.URL.revokeObjectURL(pdfPreviewUrl);
  }, [pdfPreviewUrl]);

  const handleClearFilters = useCallback(() => {
    const defaultOrg = organizations.find((o: Organization) => o.code === 'G17.43') || organizations[0];
    setDraftFilters({
      orgUnitId: defaultOrg?.id,
      reportYear: dayjs(),
      dataSource: '1',
      reportPeriod: 'MONTHLY',
      dateRange: [dayjs().subtract(1, 'month'), dayjs()],
      bcNoiDung: '1',
      processingMethods: reportCode === 'F-147' ? ['1', '3', '2', '0'] : [],
    });
    setReportData(null);
    setCurrentPage(1);
    setPageSize(20);
  }, [organizations, reportCode]);

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
        defaultValue: ['1', '3', '2', '0'],
        required: true,
        placeholder: 'Chọn hình thức xử lý',
        selectProps: {
          mode: 'multiple',
          showSearch: true,
          filterOption: (input: string, option?: { label?: React.ReactNode }) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
        },
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

    return actions;
  }, [
    reportCode,
    isRecordReport,
    hasPermission,
    draftFilters.dataSource,
    editBccReport,
    handleRecordAction,
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
      type: typeof TableColumnType.Template;
      render?: (value: unknown, record: unknown, index: number) => React.ReactNode;
    }> = [
      {
        type: TableColumnType.Template,
        title: 'Mã báo cáo',
        dataIndex: 'reportCode',
        key: 'reportCode',
        width: 140,
        align: 'center',
        render: (val: string) => (
          <span style={{ fontWeight: 600, color: textPrimary }}>{val}</span>
        ),
      },
      {
        type: TableColumnType.Template,
        title: 'Tên báo cáo',
        dataIndex: 'reportName',
        key: 'reportName',
        width: 500,
        minWidth: 420,
        render: (val: string) => (
          <span
            style={{
              color: textPrimary,
              fontWeight: 500,
              display: 'inline-block',
              maxWidth: '100%',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
            title={val}
          >
            {val}
          </span>
        ),
      },
      {
        type: TableColumnType.Template,
        title: 'Đơn vị báo cáo',
        dataIndex: 'orgUnitName',
        key: 'orgUnitName',
        width: 360,
        minWidth: 320,
        render: (val: string) => (
          <span
            style={{
              color: textPrimary,
              display: 'inline-block',
              maxWidth: '100%',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
            title={val}
          >
            {val}
          </span>
        ),
      },
      {
        type: TableColumnType.Template,
        title: isYearReport ? 'Năm báo cáo' : 'Kỳ báo cáo',
        dataIndex: 'periodText',
        key: 'periodText',
        width: 130,
        align: 'center',
        render: (val: string) => <span style={{ color: textPrimary }}>{val}</span>,
      },
    ];

    return cols;
  }, [isYearReport]);

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
            <CommonTable
              options={{
                mainColumns: summaryTableColumns,
                hideSttColumn: false,
                actions: [
                  {
                    key: 'preview-pdf',
                    label: 'Xem trước PDF',
                    icon: <EyeOutlined />,
                    onClick: () => void handlePreviewPdf(),
                  },
                  {
                    key: 'export-excel',
                    label: 'Xuất Excel',
                    icon: <FileExcelOutlined />,
                    onClick: () => void handleExport('EXCEL'),
                  },
                  {
                    key: 'export-pdf',
                    label: 'Xuất PDF',
                    icon: <FileTextOutlined />,
                    onClick: () => void handleExport('PDF'),
                  },
                ],
                enablePaging: true,
                bordered: true,
              }}
              dataSource={summaryRows}
              total={summaryRows.length}
              page={currentPage}
              pageSize={pageSize}
              onPageChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              loading={loadingPreview}
              emptyState={(
                <Empty description="Bấm nút Tổng hợp ở thanh công cụ bên trái để kết xuất dữ liệu." />
              )}
            />
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

        <Modal
          open={pdfPreviewOpen}
          title={`Xem trước PDF: ${template.name}`}
          footer={null}
          width="90vw"
          centered
          destroyOnHidden
          onCancel={() => {
            pdfPreviewRequestRef.current?.abort();
            setPdfPreviewOpen(false);
            setPdfPreviewLoading(false);
            setPdfPreviewUrl(undefined);
            setPdfPreviewError(undefined);
          }}
        >
          <div style={{ height: 'calc(100vh - 180px)', minHeight: 480 }}>
            {pdfPreviewLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Spin tip="Đang tạo bản xem trước PDF..." />
              </div>
            ) : pdfPreviewError ? (
              <Alert type="error" showIcon message={pdfPreviewError} />
            ) : pdfPreviewUrl ? (
              <iframe
                src={`${pdfPreviewUrl}#zoom=page-width&view=FitH`}
                title={`Bản xem trước PDF ${template.name}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : null}
          </div>
        </Modal>
      </div>
    </ThemeTokenProvider>
  );
}
