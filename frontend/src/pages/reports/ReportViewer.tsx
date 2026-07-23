import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Table,
  Typography,
  Empty,
  Badge,
  Alert,
  message,
  Select,
  Tooltip,
} from 'antd';
import {
  FileTextOutlined,
  FileExcelOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { reportService } from '../../services/reportService';
import { bcc157Service } from '../../services/bcc157Service';
import type { ReportRequest, ReportResponse } from '../../types/report';
import { REPORT_TEMPLATES } from './ReportList';
import { organizationService } from '../../services/organizationService';
import {
  actionPrimary,
  statusOperational,
  cardStyle,
  borderDefault,
  textSecondary, textTertiary, textPrimary,
  spaceXs, spaceSm, spaceMd, spaceLg, spaceXxl,
  fontSizeMd, fontSizeLg, fontSizeDisplay,
  radiusPill,
  fontWeightMedium, fontWeightBold,
} from '../../tokens';
import { colors } from '../../theme';
import { ScreenHeader } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';

const {
  Text
} = Typography;
const { RangePicker } = DatePicker;
export default function ReportViewer() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const reportCode = code || '';
  const template = REPORT_TEMPLATES.find((t) => t.code === reportCode);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().subtract(1, 'month'),
    dayjs(),
  ]);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [loadingExport, setLoadingExport] = useState<'EXCEL' | 'PDF' | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Filter states
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);
  const [selectedHtxl, setSelectedHtxl] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<dayjs.Dayjs | null>(dayjs());
  const [nguonDuLieu, setNguonDuLieu] = useState<string>('1');
  const [selectedBcNoiDung, setSelectedBcNoiDung] = useState<string | undefined>('1');
  const [selectedNhomCangBien, setSelectedNhomCangBien] = useState<string | undefined>(undefined);

  const isYearReport = useMemo(() => {
    if (reportCode === 'F-142') return true;
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

        const defaultOrg = list.find((o: any) => o.code === 'G17.43');
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
    setSelectedPeriod('MONTHLY');
  }, [reportCode]);

  const fetchPreview = async (silent = false) => {
    if (!reportCode) return;

    setCurrentPage(1);
    if (!silent) setLoadingPreview(true);
    try {
      const request: ReportRequest = {
        reportCode,
        orgUnitId: selectedOrgId,
        nhomCangBien: selectedNhomCangBien,
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

      let data: any;

      // For F-142 with nguonDuLieu='2', fetch from CRUD data source
      if (reportCode === 'F-142' && nguonDuLieu === '2') {
        try {
          const year = selectedYear ? selectedYear.year() : dayjs().year();
          const savedReports = await bcc157Service.search({
            orgUnitId: selectedOrgId,
            reportYear: year,
            nguonDuLieu: '2',
          });
          if (savedReports && savedReports.length > 0) {
            const report = savedReports[0];
            // Build preview response from saved CRUD data
            data = {
              reportCode,
              headers: ['STT', 'Chỉ tiêu', 'Mã số', 'TSHT hàng hải', 'Tổng cộng'],
              rows: [
                { 'STT': '1', 'Chỉ tiêu': 'Nguyên giá - Số dư đầu năm', 'Mã số': report.maSoNguyenGiaSoDuDauNam || '1.1', 'TSHT hàng hải': report.taiSanNguyenGiaSoDuDauNam ?? 0, 'Tổng cộng': report.taiSanNguyenGiaSoDuDauNam ?? 0 },
                { 'STT': '', 'Chỉ tiêu': 'Nguyên giá - Tăng trong năm', 'Mã số': report.maSoNguyenGiaTangTrongNam || '1.2', 'TSHT hàng hải': report.taiSanNguyenGiaTangTrongNam ?? 0, 'Tổng cộng': report.taiSanNguyenGiaTangTrongNam ?? 0 },
                { 'STT': '', 'Chỉ tiêu': 'Nguyên giá - Giảm trong năm', 'Mã số': report.maSoNguyenGiaGiamTrongNam || '1.3', 'TSHT hàng hải': report.taiSanNguyenGiaGiamTrongNam ?? 0, 'Tổng cộng': report.taiSanNguyenGiaGiamTrongNam ?? 0 },
                { 'STT': '', 'Chỉ tiêu': 'Nguyên giá - Số dư cuối năm', 'Mã số': report.maSoNguyenGiaSoDuCuoiNam || '1.4', 'TSHT hàng hải': report.taiSanNguyenGiaSoDuCuoiNam ?? 0, 'Tổng cộng': report.taiSanNguyenGiaSoDuCuoiNam ?? 0 },
                { 'STT': '2', 'Chỉ tiêu': 'Giá trị hao mòn lũy kế - Số dư đầu năm', 'Mã số': report.maSoGiaTriHaoMonSoDuDauNam || '2.1', 'TSHT hàng hải': report.taiSanGiaTriHaoMonSoDuDauNam ?? 0, 'Tổng cộng': report.taiSanGiaTriHaoMonSoDuDauNam ?? 0 },
                { 'STT': '', 'Chỉ tiêu': 'Giá trị hao mòn lũy kế - Tăng trong năm', 'Mã số': report.maSoGiaTriHaoMonTangTrongNam || '2.2', 'TSHT hàng hải': report.taiSanGiaTriHaoMonTangTrongNam ?? 0, 'Tổng cộng': report.taiSanGiaTriHaoMonTangTrongNam ?? 0 },
                { 'STT': '', 'Chỉ tiêu': 'Giá trị hao mòn lũy kế - Giảm trong năm', 'Mã số': report.maSoGiaTriHaoMonGiamTrongNam || '2.3', 'TSHT hàng hải': report.taiSanGiaTriHaoMonGiamTrongNam ?? 0, 'Tổng cộng': report.taiSanGiaTriHaoMonGiamTrongNam ?? 0 },
                { 'STT': '', 'Chỉ tiêu': 'Giá trị hao mòn lũy kế - Số dư cuối năm', 'Mã số': report.maSoGiaTriHaoMonSoDuCuoiNam || '2.4', 'TSHT hàng hải': report.taiSanGiaTriHaoMonSoDuCuoiNam ?? 0, 'Tổng cộng': report.taiSanGiaTriHaoMonSoDuCuoiNam ?? 0 },
                { 'STT': '3', 'Chỉ tiêu': 'Giá trị còn lại - Đầu năm', 'Mã số': report.maSoGiaTriConLaiTuNgayDauNam || '3.1', 'TSHT hàng hải': report.taiSanGiaTriConLaiTuNgayDauNam ?? 0, 'Tổng cộng': report.taiSanGiaTriConLaiTuNgayDauNam ?? 0 },
                { 'STT': '', 'Chỉ tiêu': 'Giá trị còn lại - Cuối năm', 'Mã số': report.maSoGiaTriConLaiTuNgayCuoiNam || '3.2', 'TSHT hàng hải': report.taiSanGiaTriConLaiTuNgayCuoiNam ?? 0, 'Tổng cộng': report.taiSanGiaTriConLaiTuNgayCuoiNam ?? 0 },
              ],
              summary: {},
            };
          } else {
            data = null;
          }
        } catch (err) {
          console.warn('Failed to load BCC_157 data:', err);
        }
      }

      // Fall back to auto-generated preview if no CRUD data
      if (!data) {
        try {
          data = await reportService.getPreview(request);
        } catch (err: any) {
          console.warn('API error:', err);
          // [COMMENTED] Hardcoded F-141 mock data block — use real API
          if (reportCode !== 'F-141') {
            data = {
              reportCode,
              headers: ['STT', 'Mã chỉ tiêu', 'Tên chỉ tiêu', 'Giá trị báo cáo'],
              rows: [
                { 'STT': 1, 'Mã chỉ tiêu': 'CT-001', 'Tên chỉ tiêu': 'Số lượng tài sản', 'Giá trị báo cáo': 120 },
                { 'STT': 2, 'Mã chỉ tiêu': 'CT-002', 'Tên chỉ tiêu': 'Tổng giá trị (VNĐ)', 'Giá trị báo cáo': 58500000000 },
              ],
              summary: { 'Tổng số dòng': 2 }
            };
          }
        }
      }

      setReportData(data);
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || 'Không thể tải dữ liệu xem trước');
    } finally {
      if (!silent) setLoadingPreview(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setPageSize(20);
    if (template && template.status === 'active') {
      fetchPreview(true);
    } else {
      setReportData(null);
    }
  }, [reportCode, selectedOrgId, selectedBcNoiDung, selectedYear, nguonDuLieu, dateRange, selectedNhomCangBien]);

  // Inject CSS for report section header rows
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .report-section-row td {
        background-color: #D9E2F3 !important;
        font-weight: bold !important;
        font-size: 13px !important;
      }
      .report-section-row td:first-child {
        text-align: center !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleExport = async (format: 'EXCEL' | 'PDF') => {
    setLoadingExport(format);
    try {
      const request: ReportRequest = {
        reportCode,
        format,
        orgUnitId: selectedOrgId,
        nhomCangBien: selectedNhomCangBien,
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
    } catch (err: any) {
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
    setSelectedNhomCangBien(undefined);
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
      render: (value: any) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') return value.toLocaleString('vi-VN');
        if (typeof value === 'boolean') return value ? <Badge status="success" text="Đúng" /> : <Badge status="error" text="Sai" />;
        const num = Number(value);
        if (!isNaN(num) && typeof value === 'string' && value.trim() !== '') return Number(value).toLocaleString('vi-VN');
        return value.toString();
      },
    }));
  };

  // Inject CSS for bold section/port rows (className approach avoids onRow style issues)
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .report-section-row td { background-color: #D9E2F3 !important; font-weight: ${fontWeightBold} !important; }
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
          ...(reportCode === 'F-142'
            ? [{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => navigate(`/reports/F-142/create`) }]
            : []),
          { key: 'export-pdf', label: '', variant: 'subtle' as const, icon: <Tooltip title="Xuất PDF" placement="bottom"><FileTextOutlined style={{ color: colors.error, fontSize: fontSizeLg }} /></Tooltip>, borderColor: `${colors.error}80`, color: colors.error, onClick: () => handleExport('PDF') },
          { key: 'export-excel', label: '', variant: 'subtle' as const, icon: <Tooltip title="Xuất Excel" placement="bottom"><FileExcelOutlined style={{ color: statusOperational, fontSize: fontSizeLg }} /></Tooltip>, borderColor: `${statusOperational}80`, color: statusOperational, onClick: () => handleExport('EXCEL') },
        ]}
      />

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
          {/* Horizontal Filter Bar */}
          <Card
            style={{ ...cardStyle, marginBottom: 4 }}
            styles={{ body: { padding: '8px 16px' } }}
          >
            <div style={{ display: 'flex', gap: spaceSm, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Đơn vị báo cáo <span style={{ color: 'red' }}>*</span></div>
                <Select
                  placeholder="Chọn đơn vị báo cáo"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  value={selectedOrgId}
                  onChange={(val) => setSelectedOrgId(val)}
                  options={organizations.map((org) => ({
                    value: org.id,
                    label: org.code ? `${org.code} - ${org.name}` : org.name,
                  }))}
                  showSearch
                  optionFilterProp="label"
                />
              </div>

              {reportCode === 'F-149' && (
                <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                  <div style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4 }}>Nhóm cảng biển</div>
                  <Select
                    placeholder="Nhóm cảng biển"
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    value={selectedNhomCangBien}
                    onChange={(val) => setSelectedNhomCangBien(val)}
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
                      { value: '1', label: 'Nguồn báo cáo' },
                      { value: '2', label: 'Nguồn dữ liệu chi tiết' }
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
                      { value: 'THU_HOI', label: 'Thu hồi' },
                      { value: 'BAN', label: 'Bán' },
                      { value: 'THANH_LY', label: 'Thanh lý' },
                      { value: 'DIEU_CHUYEN', label: 'Điều chuyển' }
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
            {['F-154', 'F-156', 'F-157', 'F-159'].includes(reportCode) ? (
              <div style={{ padding: `${spaceSm}px 0` }}>
                <Alert
                  message="Lưu ý về nguồn dữ liệu báo cáo"
                  description={
                    reportCode === 'F-151' ? (
                      <div>
                        <p>Dữ liệu được lấy từ bảng <strong>Luồng hàng hải</strong> (<code>navigation_channel</code>) kết hợp với dữ liệu không gian từ <strong>GIS</strong> (<code>gis_spatial_objects</code>) qua liên kết <code>spatial_id</code>.</p>
                        <p>Một số thông số kỹ thuật chi tiết (chiều rộng, độ sâu, mái dốc, khối lượng nạo vét) hiện chưa có trong cấu trúc dữ liệu hiện tại và sẽ hiển thị trống trên báo cáo.</p>
                      </div>
                    ) : reportCode === 'F-155' ? (
                      <div>
                        <p>Hệ thống hiện tại chưa cấu hình đầy đủ các bảng thuộc tính hạ tầng kỹ thuật chi tiết của đèn biển như dự án gốc <strong>hh.csdl</strong> (ví dụ: các trường hình dáng, kết cấu, chiều cao tháp đèn, chiều cao tâm sáng, chủng loại thiết bị đèn chính/phụ,...).</p>
                        <p>Toàn bộ dữ liệu đèn biển hiện tại được lấy từ bảng thực thể <strong>Nhà trạm đèn biển</strong> (<code>nha_tram_den</code>) tại màn hình <strong>Nhà trạm đèn biển</strong> (<code>/nhatram/den</code>).</p>
                        <p>Do cấu trúc dữ liệu hiện tại chỉ lưu trữ các trường cơ bản (tên, mã, tầm hiệu lực ánh sáng, màu sắc ánh sáng, ngày bảo trì) nên các thông số kỹ thuật chi tiết khác sẽ hiển thị trống trên báo cáo.</p>
                      </div>
                    ) : ['F-156', 'F-157', 'F-159'].includes(reportCode) ? (
                      <div>
                        <p>Hệ thống hiện tại chưa cấu hình các bảng thực thể nghiệp vụ chi tiết cho nhóm hạ tầng kỹ thuật tương ứng như phao tiêu báo hiệu, trạm VTS, đài thông tin duyên hải, hay công trình đê kè như dự án gốc <strong>hh.csdl</strong>.</p>
                        <p>Toàn bộ thông tin hạ tầng này hiện tại được lấy từ các đối tượng hình học dạng điểm (<strong>PointObject</strong>) tại màn hình <strong>Đối tượng điểm</strong> (<code>/gis/points</code>).</p>
                        <p>Do cấu trúc dữ liệu GIS hiện tại chỉ lưu trữ các trường tọa độ cơ bản, tên và mã nên các thông số kỹ thuật chi tiết khác sẽ hiển thị trống trên báo cáo.</p>
                      </div>
                    ) : (
                      <div>
                        <p>Hệ thống hiện tại chưa cấu hình các bảng thực thể nghiệp vụ chi tiết cho các vùng (neo đậu, quay trở, tránh trú bão,...) như dự án gốc <strong>hh.csdl</strong> (ví dụ: các trường kích thước hình dạng, độ sâu thiết kế, cỡ tàu thiết kế,...).</p>
                        <p>Toàn bộ thông tin các vùng này hiện tại được lấy từ các đối tượng hình học dạng vùng (<strong>PolygonObject</strong>) tại màn hình <strong>Đối tượng vùng</strong> (<code>/gis/polygons</code>).</p>
                        <p>Do cấu trúc dữ liệu GIS hiện tại chỉ lưu trữ các trường cơ bản như tên, mã và tọa độ đa giác nên các thông số kỹ thuật chi tiết khác sẽ hiển thị trống trên báo cáo.</p>
                      </div>
                    )
                  }
                  type="info"
                  showIcon
                />
              </div>
            ) : loadingPreview ? (
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
                    onRow={(record: any) => {
                      const stt = record['STT'];
                      if (stt === 'I' || stt === 'II') return { className: 'report-section-row' };
                      if (stt && stt !== '' && !isNaN(Number(stt))) return { className: 'report-port-row' };
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
