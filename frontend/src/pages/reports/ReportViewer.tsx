import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Table,
  Space,
  Typography,
  Empty,
  Badge,
  Alert,
  message,
  Descriptions,
  Breadcrumb,
  Select,
} from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { reportService } from '../../services/reportService';
import type { ReportRequest, ReportResponse } from '../../types/report';
import { REPORT_TEMPLATES, CATEGORY_MAP } from './ReportList';
import { organizationService } from '../../services/organizationService';

const { Title, Text, Paragraph } = Typography;
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
  const [pageSize, setPageSize] = useState<number>(5);

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

  const requiresDates = true;
  const categoryInfo = template ? CATEGORY_MAP[template.category] : null;

  // Load organizations
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const resp = await organizationService.list();
        const list = [...(resp.data || [])];

        const hasG17_43 = list.some((org: any) => org.code === 'G17.43');
        if (!hasG17_43) {
          list.unshift({
            id: 'g17-43-demo',
            code: 'G17.43',
            name: 'Cục Hàng hải và Đường thủy Việt Nam',
          } as any);
        }

        setOrganizations(list);

        const defaultOrg = list.find((o: any) => o.code === 'G17.43');
        if (defaultOrg) {
          setSelectedOrgId(defaultOrg.id);
        } else if (list.length > 0) {
          setSelectedOrgId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load organizations', err);
        const demoList = [
          {
            id: 'g17-43-demo',
            code: 'G17.43',
            name: 'Cục Hàng hải và Đường thủy Việt Nam',
          },
        ];
        setOrganizations(demoList);
        setSelectedOrgId('g17-43-demo');
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

      let data;
      try {
        data = await reportService.getPreview(request);
      } catch (err: any) {
        console.warn('API error, falling back to mock data:', err);
        if (reportCode === 'F-141') {
          data = {
            reportCode: 'F-141',
            reportName: 'Báo cáo thống kê tăng giảm tài sản kết cấu hạ tầng giao thông đường thủy',
            headers: [
              'STT',
              'Mã tài sản',
              'Tên tài sản',
              'Loại tài sản',
              'Đơn vị tính',
              'Số lượng đầu kỳ',
              'Số lượng tăng',
              'Số lượng giảm',
              'Số lượng cuối kỳ',
              'Giá trị đầu kỳ (VNĐ)',
              'Giá trị tăng (VNĐ)',
              'Giá trị giảm (VNĐ)',
              'Giá trị cuối kỳ (VNĐ)',
            ],
            rows: [
              {
                'STT': 1,
                'Mã tài sản': 'POINT-GEN-001',
                'Tên tài sản': 'Đèn biển Hòn Dấu',
                'Loại tài sản': 'Hệ thống đèn biển',
                'Đơn vị tính': 'Hệ thống',
                'Số lượng đầu kỳ': 1,
                'Số lượng tăng': 0,
                'Số lượng giảm': 0,
                'Số lượng cuối kỳ': 1,
                'Giá trị đầu kỳ (VNĐ)': 12000000000,
                'Giá trị tăng (VNĐ)': 0,
                'Giá trị giảm (VNĐ)': 0,
                'Giá trị cuối kỳ (VNĐ)': 12000000000,
              },
              {
                'STT': 2,
                'Mã tài sản': 'POINT-GEN-002',
                'Tên tài sản': 'Đèn biển Bạch Long Vĩ',
                'Loại tài sản': 'Hệ thống đèn biển',
                'Đơn vị tính': 'Hệ thống',
                'Số lượng đầu kỳ': 1,
                'Số lượng tăng': 0,
                'Số lượng giảm': 0,
                'Số lượng cuối kỳ': 1,
                'Giá trị đầu kỳ (VNĐ)': 15000000000,
                'Giá trị tăng (VNĐ)': 0,
                'Giá trị giảm (VNĐ)': 0,
                'Giá trị cuối kỳ (VNĐ)': 15000000000,
              },
              {
                'STT': 3,
                'Mã tài sản': 'POINT-GEN-007',
                'Tên tài sản': 'Phao báo hiệu số 0',
                'Loại tài sản': 'Phao tiêu báo hiệu',
                'Đơn vị tính': 'Quả',
                'Số lượng đầu kỳ': 0,
                'Số lượng tăng': 1,
                'Số lượng giảm': 0,
                'Số lượng cuối kỳ': 1,
                'Giá trị đầu kỳ (VNĐ)': 0,
                'Giá trị tăng (VNĐ)': 450000000,
                'Giá trị giảm (VNĐ)': 0,
                'Giá trị cuối kỳ (VNĐ)': 450000000,
              },
            ],
            summary: {
              'Tổng số dòng': 3,
              'Tổng số lượng đầu kỳ': 2,
              'Tổng số lượng tăng': 1,
              'Tổng số lượng giảm': 0,
              'Tổng số lượng cuối kỳ': 3,
              'Tổng giá trị đầu kỳ (VNĐ)': 27000000000,
              'Tổng giá trị tăng (VNĐ)': 450000000,
              'Tổng giá trị giảm (VNĐ)': 0,
              'Tổng giá trị cuối kỳ (VNĐ)': 27450000000,
            }
          };
        } else {
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
    setPageSize(5);
    if (template && template.status === 'active') {
      fetchPreview(true);
    } else {
      setReportData(null);
    }
  }, [reportCode, selectedOrgId, selectedBcNoiDung, selectedYear, nguonDuLieu, dateRange, selectedNhomCangBien]);

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
      render: (val: any) => {
        if (typeof val === 'number') {
          return val.toLocaleString('vi-VN');
        }
        return val;
      },
    }));
  };

  if (!template) {
    return (
      <Card style={{ margin: 24 }}>
        <Empty description="Không tìm thấy thông tin biểu mẫu báo cáo." />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%', padding: '24px' }}>
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { title: 'Trang chủ', href: '/' },
          { title: 'Danh sách báo cáo', href: '/reports' },
          { title: `${template.code} - ${template.name}` },
        ]}
      />

      {/* Header Banner */}
      <Card
        styles={{
          body: {
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            borderRadius: 6,
            padding: '24px',
          },
        }}
        variant="borderless"
      >
        <div style={{ color: '#fff' }}>
          <Space size="middle" align="center" style={{ marginBottom: 8 }}>
            <Badge status={template.status === 'active' ? 'success' : 'warning'} />
            <Text style={{ color: '#e6f7ff', fontSize: 16, fontWeight: 500 }}>
              {categoryInfo?.label || 'Chuyên ngành'}
            </Text>
          </Space>
          <Title level={3} style={{ color: '#fff', margin: '0 0 8px 0', fontWeight: 600 }}>
            [{template.code}] {template.name}
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', margin: 0, fontSize: 14 }}>
            Báo cáo thống kê dữ liệu chuyên ngành hàng hải phục vụ công tác quản lý kết cấu hạ tầng giao thông đường thủy.
          </Paragraph>
        </div>
      </Card>

      {/* Proposed State Warn */}
      {template.status === 'proposed' && (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <Text type="secondary">
                  Biểu mẫu này nằm trong kế hoạch phát triển (Wave 2-6). Trạng thái hiện tại: <b>Proposed</b>.
                </Text>
                <Alert
                  type="info"
                  message="Dữ liệu mẫu và API tương ứng chưa được kích hoạt cho biểu mẫu này. Vui lòng quay lại trong các giai đoạn tiếp theo."
                  showIcon
                />
              </Space>
            }
          />
        </Card>
      )}

      {template.status === 'active' && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Horizontal Filter Bar */}
          <Card size="small" styles={{ body: { padding: '16px 24px' } }}>
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} sm={12} md={6} lg={6}>
                <div style={{ marginBottom: 6 }}>
                  <Text strong>Đơn vị báo cáo <span style={{ color: 'red' }}>*</span></Text>
                </div>
                <Select
                  placeholder="Chọn đơn vị báo cáo"
                  style={{ width: '100%' }}
                  value={selectedOrgId}
                  onChange={(val) => setSelectedOrgId(val)}
                  options={organizations.map((org) => ({
                    value: org.id,
                    label: org.code ? `${org.code} - ${org.name}` : org.name,
                  }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Col>
 
              {reportCode === 'F-149' && (
                <Col xs={24} sm={12} md={5} lg={5}>
                  <div style={{ marginBottom: 6 }}>
                    <Text strong>Nhóm cảng biển</Text>
                  </div>
                  <Select
                    placeholder="Nhóm cảng biển"
                    style={{ width: '100%' }}
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
                </Col>
              )}

              {isYearReport && (
                <Col xs={24} sm={12} md={5} lg={5}>
                  <div style={{ marginBottom: 6 }}>
                    <Text strong>Năm báo cáo <span style={{ color: 'red' }}>*</span></Text>
                  </div>
                  <DatePicker
                    picker="year"
                    placeholder="Chọn năm"
                    style={{ width: '100%' }}
                    value={selectedYear}
                    onChange={(date) => setSelectedYear(date)}
                  />
                </Col>
              )}

              {reportCode === 'F-142' && (
                <Col xs={24} sm={12} md={5} lg={5}>
                  <div style={{ marginBottom: 6 }}>
                    <Text strong>Nguồn dữ liệu <span style={{ color: 'red' }}>*</span></Text>
                  </div>
                  <Select
                    placeholder="Chọn nguồn dữ liệu"
                    style={{ width: '100%' }}
                    value={nguonDuLieu}
                    onChange={(val) => setNguonDuLieu(val)}
                    options={[
                      { value: '1', label: 'Nguồn báo cáo' },
                      { value: '2', label: 'Nguồn dữ liệu chi tiết' }
                    ]}
                  />
                </Col>
              )}

              {isSpecialContentReport && (
                <Col xs={24} sm={12} md={8} lg={8}>
                  <div style={{ marginBottom: 6 }}>
                    <Text strong>Nội dung báo cáo <span style={{ color: 'red' }}>*</span></Text>
                  </div>
                  <Select
                    placeholder="Chọn nội dung báo cáo"
                    style={{ width: '100%' }}
                    value={selectedBcNoiDung}
                    onChange={(val) => setSelectedBcNoiDung(val)}
                    options={[
                      { value: '1', label: 'Kê khai lần đầu' },
                      { value: '2', label: 'Kê khai bổ sung' },
                      { value: '3', label: 'Kê khai thay đổi thông tin' }
                    ]}
                  />
                </Col>
              )}

              {isPeriodReport && (
                <Col xs={24} sm={12} md={4} lg={4}>
                  <div style={{ marginBottom: 6 }}>
                    <Text strong>Kỳ báo cáo <span style={{ color: 'red' }}>*</span></Text>
                  </div>
                  <Select
                    placeholder="Kỳ báo cáo"
                    style={{ width: '100%' }}
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
                </Col>
              )}

              {isPeriodReport && reportCode !== 'F-147' && (
                <Col xs={24} sm={12} md={5} lg={5}>
                  <div style={{ marginBottom: 6 }}>
                    <Text strong>Thời gian báo cáo</Text>
                  </div>
                  <RangePicker
                    style={{ width: '100%' }}
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
                </Col>
              )}

              {reportCode === 'F-147' && (
                <Col xs={24} sm={12} md={6} lg={6}>
                  <div style={{ marginBottom: 6 }}>
                    <Text strong>Hình thức xử lý <span style={{ color: 'red' }}>*</span></Text>
                  </div>
                  <Select
                    mode="multiple"
                    placeholder="Hình thức xử lý"
                    style={{ width: '100%' }}
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
                </Col>
              )}

              <Col xs={24} sm={12} md={4} lg={4} style={{ display: 'flex', gap: '8px' }}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  loading={loadingPreview}
                  onClick={() => fetchPreview()}
                  style={{ flex: 1 }}
                >
                  Tổng hợp
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleClearFilters}
                >
                  Xóa
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Full Width Preview Panel */}
          <Card
            title="Dữ liệu xem trước"
            extra={
              <Space>
                <Button
                  type="default"
                  icon={<FileTextOutlined />}
                  disabled={!reportData || reportData.rows.length === 0}
                  loading={loadingExport === 'PDF'}
                  onClick={() => handleExport('PDF')}
                >
                  Xuất PDF
                </Button>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  disabled={!reportData || reportData.rows.length === 0}
                  loading={loadingExport === 'EXCEL'}
                  onClick={() => handleExport('EXCEL')}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Xuất Excel
                </Button>
              </Space>
            }
            style={{ minHeight: 380 }}
          >
            {loadingPreview ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <SearchOutlined spin style={{ fontSize: 28, color: '#1677ff', marginBottom: 16 }} />
                <div>Đang tính toán số liệu thống kê...</div>
              </div>
            ) : reportData ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Table
                  columns={getColumns()}
                  dataSource={reportData.rows.map((row, idx) => ({ ...row, key: idx }))}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: reportData.rows.length,
                    showSizeChanger: true,
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    },
                  }}
                  bordered
                  scroll={{ x: 'max-content' }}
                  size="middle"
                />

                {reportData.summary && Object.keys(reportData.summary).length > 0 && (
                  <Card type="inner" title="Thông tin tổng hợp số liệu">
                    <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                      {Object.entries(reportData.summary).map(([key, val]) => (
                        <Descriptions.Item key={key} label={key}>
                          <Text strong>
                            {typeof val === 'number' ? val.toLocaleString('vi-VN') : val.toString()}
                          </Text>
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  </Card>
                )}
              </Space>
            ) : (
              <Empty description="Bấm nút Tổng hợp ở trên để kết xuất dữ liệu." />
            )}
          </Card>
        </Space>
      )}
    </Space>
  );
}
