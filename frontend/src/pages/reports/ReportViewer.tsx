import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Modal,
  DatePicker,
  Button,
  Table,
  Typography,
  Empty,
  Badge,
  Alert,
  Select,
  TreeSelect,
  Tooltip,
} from 'antd';
import { message } from '../../components/ToastNotification';
import {
  FileTextOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { isAxiosError } from 'axios';
import Bcc157Form from './Bcc157Form';
import { bcc157Service, type Bcc157History } from '../../services/bcc157Service';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { reportService } from '../../services/reportService';
import type { ReportRequest, ReportResponse } from '../../types/report';
import { REPORT_TEMPLATES } from './ReportList';
import { organizationService, type Organization } from '../../services/organizationService';
import {
  actionPrimary,
  statusOperational,
  cardStyle,
  borderDefault,
  textSecondary, textPrimary,
  spaceSm, spaceMd, spaceLg, spaceXxl,
  fontSizeMd, fontSizeLg, fontSizeDisplay,
  radiusPill,
  fontWeightBold,
} from '../../tokens';
import { colors } from '../../theme';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';

const {
  Text
} = Typography;
const { RangePicker } = DatePicker;
export default function ReportViewer() {
  const { code } = useParams<{ code: string }>();

  const reportCode = code || '';
  const template = REPORT_TEMPLATES.find((t) => t.code === reportCode);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().subtract(1, 'month'),
    dayjs(),
  ]);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [, setLoadingExport] = useState<'EXCEL' | 'PDF' | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Filter states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>('MONTHLY');
  const [selectedHtxl, setSelectedHtxl] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<dayjs.Dayjs | null>(dayjs());
  const [nguonDuLieu, setNguonDuLieu] = useState<string>('1');
  const [selectedBcNoiDung, setSelectedBcNoiDung] = useState<string | undefined>('1');
  const [selectedPortGroup, setSelectedPortGroup] = useState<number | undefined>(undefined);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewSequence = useRef(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const hasPermission = usePermissionStore((state: PermissionState) => state.hasPermission);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState<Bcc157History[]>([]);
  const editReport = async (action: 'edit' | 'delete' | 'history' = 'edit') => {
    if (!selectedOrgId || !selectedYear) { message.error('Chọn đơn vị và năm báo cáo cần sửa'); return; }
    try {
      const reports = await bcc157Service.search({ orgUnitId: selectedOrgId,
        reportYear: selectedYear.year(), nguonDuLieu: '1' });
      const report = reports.find(item => item.orgUnitId === selectedOrgId);
      if (!report) { message.error('Đơn vị chưa nhập báo cáo cho năm đã chọn'); return; }
      if (action === 'history') {
        setHistoryRows(await bcc157Service.history(report.id)); setHistoryOpen(true);
      } else if (action === 'delete') {
        Modal.confirm({ title: 'Xóa báo cáo BCC157 đã nhập?',
          content: `Báo cáo năm ${report.reportYear} của ${report.orgUnitName ?? 'đơn vị đã chọn'} sẽ bị xóa.`,
          okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true },
          onOk: async () => {
            try { await bcc157Service.delete(report.id); message.success('Xóa báo cáo thành công'); void fetchPreview(); }
            catch { message.error('Không thể xóa báo cáo'); throw new Error('Không thể xóa báo cáo'); }
          },
        });
      } else { setEditingId(report.id); setFormOpen(true); }
    } catch { message.error('Không thể tải báo cáo để sửa'); }
  };

  const organizationTree = useMemo(() => {
    type Node = { value: string; title: string; children: Node[] };
    const nodes = new Map<string, Node>();
    organizations.forEach(org => nodes.set(org.id, { value: org.id,
      title: org.code ? `${org.code} - ${org.name}` : org.name, children: [] }));
    const roots: Node[] = [];
    organizations.forEach(org => {
      const node = nodes.get(org.id)!;
      const parent = org.parentId ? nodes.get(org.parentId) : undefined;
      if (parent && parent !== node) parent.children.push(node); else roots.push(node);
    });
    return roots;
  }, [organizations]);

  const isYearReport = useMemo(() => {
    if (reportCode === 'F-142' || reportCode === 'F-166') return true;
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

        // [COMMENTED] Hardcoded G17.43 demo injection — use real DB data instead
        // const hasG17_43 = list.some((org: any) => org.code === 'G17.43');
        // if (!hasG17_43) {
        //   list.unshift({
        //     id: 'g17-43-demo',
        //     code: 'G17.43',
        //     name: 'Cục Hàng hải và Đường thủy Việt Nam',
        //   } as any);
        // }

        setOrganizations(list);

        const defaultOrg = list.find((o: Organization) => o.code === 'G17.43');
        if (defaultOrg) {
          setSelectedOrgId(defaultOrg.id);
        } else if (list.length > 0) {
          setSelectedOrgId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load organizations', err);
        // [COMMENTED] Hardcoded G17.43 fallback — use real DB data instead
        // const demoList = [
        //   {
        //     id: 'g17-43-demo',
        //     code: 'G17.43',
        //     name: 'Cục Hàng hải và Đường thủy Việt Nam',
        //   },
        // ];
        // setOrganizations(demoList);
        // setSelectedOrgId('g17-43-demo');
      }
    };

    loadOrgs();
  }, [reportCode]);

  const fetchPreview = useCallback(async () => {
    if (!reportCode) return;

    setCurrentPage(1);
    const sequence = ++previewSequence.current;
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const request: ReportRequest = {
        reportCode,
        orgUnitId: selectedOrgId,
        portGroup: selectedPortGroup,
        dataSource: reportCode === 'F-142' ? nguonDuLieu : undefined,
        processingMethods: reportCode === 'F-147' ? selectedHtxl : undefined,
      };

      if (isYearReport) {
        if (selectedYear) {
          request.startDate = selectedYear.startOf('year').format('YYYY-MM-DD');
          request.endDate = selectedYear.endOf('year').format('YYYY-MM-DD');
        }
      } else if (isSpecialContentReport) {
        request.bcNoiDung = selectedBcNoiDung;
        request.startDate = dayjs().startOf('year').format('YYYY-MM-DD');
        request.endDate = dayjs().endOf('year').format('YYYY-MM-DD');
      } else if (reportCode === 'F-147') {
        request.bcNoiDung = selectedHtxl && selectedHtxl.length > 0 ? selectedHtxl.join(',') : undefined;
        if (dateRange[0]) request.startDate = dateRange[0].format('YYYY-MM-DD');
        if (dateRange[1]) request.endDate = dateRange[1].format('YYYY-MM-DD');
      } else if (isPeriodReport) {
        if (dateRange[0]) request.startDate = dateRange[0].format('YYYY-MM-DD');
        if (dateRange[1]) request.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const data = await reportService.getPreview(request);
      if (sequence !== previewSequence.current) return;
      setReportData(data);
    } catch (err: unknown) {
      if (sequence !== previewSequence.current) return;
      setReportData(null);
      setPreviewError((isAxiosError<{ message?: string }>(err) && err.response?.data?.message) || 'Không thể tải dữ liệu xem trước');
    } finally {
      if (sequence === previewSequence.current) setLoadingPreview(false);
    }
  }, [reportCode, selectedOrgId, selectedPortGroup, nguonDuLieu, selectedHtxl,
    isYearReport, selectedYear, isSpecialContentReport, selectedBcNoiDung, isPeriodReport, dateRange]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPage(1);
      setPageSize(20);
      if (template?.status === 'active') void fetchPreview();
      else setReportData(null);
    }, 0);
    return () => { window.clearTimeout(timer); previewSequence.current += 1; };
  }, [fetchPreview, template]);

  const handleExport = async (format: 'EXCEL' | 'PDF') => {
    setLoadingExport(format);
    try {
      const request: ReportRequest = {
        reportCode,
        format,
        orgUnitId: selectedOrgId,
        portGroup: selectedPortGroup,
        dataSource: reportCode === 'F-142' ? nguonDuLieu : undefined,
        processingMethods: reportCode === 'F-147' ? selectedHtxl : undefined,
      };

      if (isYearReport) {
        if (selectedYear) {
          request.startDate = selectedYear.startOf('year').format('YYYY-MM-DD');
          request.endDate = selectedYear.endOf('year').format('YYYY-MM-DD');
        }
      } else if (isSpecialContentReport) {
        request.bcNoiDung = selectedBcNoiDung;
        request.startDate = dayjs().startOf('year').format('YYYY-MM-DD');
        request.endDate = dayjs().endOf('year').format('YYYY-MM-DD');
      } else if (reportCode === 'F-147') {
        request.bcNoiDung = selectedHtxl && selectedHtxl.length > 0 ? selectedHtxl.join(',') : undefined;
        if (dateRange[0]) request.startDate = dateRange[0].format('YYYY-MM-DD');
        if (dateRange[1]) request.endDate = dateRange[1].format('YYYY-MM-DD');
      } else if (isPeriodReport) {
        if (dateRange[0]) request.startDate = dateRange[0].format('YYYY-MM-DD');
        if (dateRange[1]) request.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      await reportService.exportReport(request);
      message.success(`Xuất ${format === 'EXCEL' ? 'Excel' : 'PDF'} thành công!`);
    } catch (err: unknown) {
      console.error(err);
      message.error('Không thể xuất báo cáo');
    } finally {
      setLoadingExport(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedOrgId(organizations[0]?.id);
    setSelectedPeriod('MONTHLY');
    setSelectedHtxl([]);
    setDateRange([dayjs().subtract(1, 'month'), dayjs()]);
    setSelectedYear(dayjs());
    setNguonDuLieu('1');
    setSelectedPortGroup(undefined);
    setReportData(null);
  };

  const getColumns = () => {
    if (!reportData || reportData.headers.length === 0) return [];
    return reportData.headers.map((h) => ({
      title: h,
      dataIndex: h,
      key: h,
      onHeaderCell: () => ({
        style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, whiteSpace: 'nowrap', textTransform: 'uppercase' as const, padding: '16px 16px' },
      }),
      onCell: () => ({
        style: { fontSize: fontSizeMd, color: textPrimary },
      }),
      render: (value: unknown) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') return value.toLocaleString('vi-VN');
        if (typeof value === 'boolean') return value ? <Badge status="success" text="Đúng" /> : <Badge status="error" text="Sai" />;
        return String(value);
      },
    }));
  };

  // Inject CSS for bold section/port rows (className approach avoids onRow style issues)
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .report-section-row td { background-color: ${colors.bodyBg} !important; font-weight: ${fontWeightBold} !important; }
      .report-port-row td { font-weight: ${fontWeightBold} !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  if (!template) {
    return (
      <Card style={{ margin: spaceLg }}>
        <Empty description="Không tìm thấy thông tin biểu mẫu báo cáo." />
      </Card>
    );
  }

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>


      <ScreenHeader
        breadcrumb={[
          { label: 'Danh sách báo cáo' },
          { label: `${template.code} - ${template.name}` },
        ]}
        actions={[
          ...(reportCode === 'F-142' && hasPermission('report:create')
            ? [{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => { setEditingId(undefined); setFormOpen(true); } }]
            : []),
          ...(reportCode === 'F-142' && nguonDuLieu === '1' && hasPermission('report:update')
            ? [{ key: 'edit', label: 'Chỉnh sửa', variant: 'subtle' as const, onClick: () => void editReport() }] : []),
          ...(reportCode === 'F-142' && nguonDuLieu === '1'
            ? [{ key: 'history', label: 'Lịch sử', variant: 'subtle' as const, onClick: () => void editReport('history') }] : []),
          ...(reportCode === 'F-142' && nguonDuLieu === '1' && hasPermission('report:delete')
            ? [{ key: 'delete', label: 'Xóa', variant: 'subtle' as const, onClick: () => void editReport('delete') }] : []),
          { key: 'export-pdf', label: '', variant: 'subtle' as const, icon: <Tooltip title="Xuất PDF" placement="bottom"><FileTextOutlined style={{ color: colors.error, fontSize: fontSizeLg }} /></Tooltip>, borderColor: `${colors.error}80`, color: colors.error, onClick: () => handleExport('PDF') },
          { key: 'export-excel', label: '', variant: 'subtle' as const, icon: <Tooltip title="Xuất Excel" placement="bottom"><FileExcelOutlined style={{ color: statusOperational, fontSize: fontSizeLg }} /></Tooltip>, borderColor: `${statusOperational}80`, color: statusOperational, onClick: () => handleExport('EXCEL') },
        ]}
      />

      <Modal open={formOpen} width="90%" footer={null} destroyOnHidden
        onCancel={() => setFormOpen(false)} title={editingId ? 'Chỉnh sửa BCC157' : 'Thêm mới BCC157'}>
        {formOpen && <Bcc157Form key={editingId ?? 'create'} reportId={editingId}
          onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); void fetchPreview(); }} />}
      </Modal>
      <Modal open={historyOpen} title="Lịch sử báo cáo BCC157" footer={null}
        onCancel={() => setHistoryOpen(false)} width={720}>
        <DataTable dataSource={historyRows} rowKey="id" fill={false} scroll={{ y: 320 }} columns={[
          { key: 'approvedDate', label: 'Thời gian', width: 240,
            render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm:ss') },
          { key: 'status', label: 'Thao tác', width: 240,
            render: (value: string) => ({ CREATED: 'Tạo báo cáo', UPDATED: 'Cập nhật báo cáo', DELETED: 'Xóa báo cáo' }[value] ?? value) },
        ]} />
      </Modal>
      {/* Proposed State Warn */}
      {template.status === 'proposed' && (
        <Card style={{ ...cardStyle }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                <Text type="secondary">
                  Biểu mẫu này nằm trong kế hoạch phát triển (Wave 2-6). Trạng thái hiện tại: <b>Proposed</b>.
                </Text>
                <Alert
                  type="info"
                  message="Dữ liệu mẫu và API tương ứng chưa được kích hoạt cho biểu mẫu này. Vui lòng quay lại trong các giai đoạn tiếp theo."
                  showIcon
                />
              </div>
            }
          />
        </Card>
      )}

      {template.status === 'active' && (
        <>
          {previewError && <Alert type="error" showIcon message={previewError} style={{ marginBottom: spaceSm }} />}
          {/* Horizontal Filter Bar */}
          <Card
            style={{ ...cardStyle, marginBottom: 4 }}
            styles={{ body: { padding: '8px 16px' } }}
          >
            <div style={{ display: 'flex', gap: spaceSm, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Đơn vị báo cáo <span style={{ color: 'red' }}>*</span></div>
                <TreeSelect
                  placeholder="Chọn đơn vị báo cáo"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  value={selectedOrgId}
                  onChange={setSelectedOrgId}
                  treeData={organizationTree}
                  showSearch
                  treeNodeFilterProp="title"
                />
              </div>

              {reportCode === 'F-149' && (
                <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                  <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Nhóm cảng biển</div>
                  <Select
                    placeholder="Nhóm cảng biển"
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    value={selectedPortGroup}
                    onChange={(val) => setSelectedPortGroup(val)}
                    options={[
                      { value: '1', label: 'Nhóm 1' },
                      { value: '2', label: 'Nhóm 2' },
                      { value: '3', label: 'Nhóm 3' },
                      { value: '4', label: 'Nhóm 4' },
                      { value: '5', label: 'Nhóm 5' },
                    ]}
                    allowClear
                  />
                </div>
              )}

              {isYearReport && (
                <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                  <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Năm báo cáo <span style={{ color: 'red' }}>*</span></div>
                  <DatePicker
                    picker="year"
                    placeholder="Chọn năm"
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    value={selectedYear}
                    onChange={(date) => setSelectedYear(date)}
                  />
                </div>
              )}

              {reportCode === 'F-142' && (
                <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                  <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Nguồn dữ liệu <span style={{ color: 'red' }}>*</span></div>
                  <Select
                    placeholder="Chọn nguồn dữ liệu"
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    value={nguonDuLieu}
                    onChange={(val) => setNguonDuLieu(val)}
                    options={[
                      { value: '1', label: 'Báo cáo đã nhập' },
                      { value: '2', label: 'Tổng hợp từ tài sản' }
                    ]}
                  />
                </div>
              )}

              {isSpecialContentReport && (
                <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                  <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Nội dung báo cáo <span style={{ color: 'red' }}>*</span></div>
                  <Select
                    placeholder="Chọn nội dung báo cáo"
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    value={selectedBcNoiDung}
                    onChange={(val) => setSelectedBcNoiDung(val)}
                    options={[
                      { value: '1', label: 'Kê khai lần đầu' },
                      { value: '2', label: 'Kê khai bổ sung' },
                      { value: '3', label: 'Kê khai thay đổi thông tin' }
                    ]}
                  />
                </div>
              )}

              {isPeriodReport && (
                <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                  <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Kỳ báo cáo <span style={{ color: 'red' }}>*</span></div>
                  <Select
                    placeholder="Kỳ báo cáo"
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    value={selectedPeriod}
                    onChange={(val) => setSelectedPeriod(val)}
                    options={[
                      { value: 'MONTHLY', label: 'Tháng' },
                      { value: 'QUARTERLY', label: 'Quý' },
                      { value: 'ANNUAL', label: 'Năm' },
                      { value: 'PERIODIC', label: 'Định kỳ' }
                    ]}
                    allowClear
                  />
                </div>
              )}

              {isPeriodReport && reportCode !== 'F-147' && (
                <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                  <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Thời gian báo cáo</div>
                  <RangePicker
                    style={{ width: '100%', borderRadius: radiusPill }}
                    value={dateRange}
                    onChange={(dates) => {
                      if (dates) {
                        setDateRange([dates[0], dates[1]]);
                      } else {
                        setDateRange([null, null]);
                      }
                    }}
                    placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                  />
                </div>
              )}

              {reportCode === 'F-147' && (
                <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                  <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Hình thức xử lý <span style={{ color: 'red' }}>*</span></div>
                  <Select
                    mode="multiple"
                    placeholder="Hình thức xử lý"
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    value={selectedHtxl}
                    onChange={(val) => setSelectedHtxl(val)}
                    options={[
                      { value: '1', label: 'Bàn giao' },
                      { value: '3', label: 'Phá dỡ' },
                      { value: '2', label: 'Thanh lý' },
                      { value: '0', label: 'Điều chuyển' }
                    ]}
                    allowClear
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: spaceSm, flexShrink: 0 }}>
                <Button icon={<ReloadOutlined />} onClick={handleClearFilters} style={{ color: textSecondary, borderColor: borderDefault, borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} />
                <Button type="primary" icon={<SearchOutlined />} loading={loadingPreview} onClick={() => fetchPreview()} style={{ background: actionPrimary, borderColor: actionPrimary, borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Tổng hợp</Button>
              </div>
            </div>
          </Card>

          {/* Full Width Preview Panel */}
          <div style={{ ...cardStyle, padding: '8px 16px' }}>
            {loadingPreview ? (
              <div style={{ padding: `${spaceXxl}px 0`, textAlign: 'center' }}>
                <SearchOutlined spin style={{ fontSize: fontSizeDisplay, color: actionPrimary, marginBottom: spaceMd }} />
                <div style={{ color: textSecondary, fontSize: fontSizeMd }}>Đang tính toán số liệu thống kê...</div>
              </div>
            ) : reportData ? (
              <>
                <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                  <Table
                    columns={getColumns()}
                    dataSource={reportData.rows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((row, idx) => ({ ...row, key: (currentPage - 1) * pageSize + idx }))}
                    pagination={false}
                    className="list-view-table"
                    scroll={{ x: 'max-content' }}
                    onRow={(record: Record<string, string | number | boolean | null>) => {
                      const sequenceNo = record['STT'];
                      if (record._rowType === 'section' || sequenceNo === 'I' || sequenceNo === 'II') return { className: 'report-section-row' };
                      if (sequenceNo && sequenceNo !== '' && !isNaN(Number(sequenceNo))) return { className: 'report-port-row' };
                      return {};
                    }}
                  />
                </div>

                <Pagination
                  total={reportData.summary?.total ?? reportData.rows.length}
                  current={currentPage}
                  pageSize={pageSize}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                />

              </>
            ) : (
              <Empty description={<span style={{ color: textSecondary }}>Bấm nút Tổng hợp ở trên để kết xuất dữ liệu.</span>} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
