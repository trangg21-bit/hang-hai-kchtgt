import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  Typography,
  Empty,
  Badge,
  Alert,
  Tooltip,
  message,
  Descriptions,
} from 'antd';
import {
  FileTextOutlined,
  FileExcelOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { reportService } from '../services/reportService';
import type { ReportRequest, ReportResponse } from '../types/report';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface ReportTemplate {
  code: string;
  name: string;
  description: string;
  requiresDates: boolean;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  // --- Wave 1 (existing 3) ---
  {
    code: 'F-141',
    name: 'Báo cáo tăng giảm tài sản',
    description: 'Thống kê tình hình tăng giảm các tài sản kết cấu hạ tầng hàng hải (đối tượng điểm) trong kỳ báo cáo.',
    requiresDates: true,
  },
  {
    code: 'F-180',
    name: 'Biểu tổng hợp thông tin chung',
    description: 'Tổng hợp số lượng đối tượng điểm, đối tượng đường, đối tượng vùng, lớp bản đồ và tài khoản trong hệ thống.',
    requiresDates: false,
  },
  {
    code: 'F-151',
    name: 'Biểu 03-Q/N: Thống kê luồng hàng hải',
    description: 'Thống kê danh sách các tuyến luồng hàng hải, độ dài chuỗi tọa độ (WKT) và trạng thái hoạt động.',
    requiresDates: false,
  },
  // --- Wave 1b (F-142 → F-147 + F-181) ---
  {
    code: 'F-142',
    name: 'Thông tin tài chính tài sản KCHT',
    description: 'Thống kê thông tin tài chính của các tài sản kết cấu hạ tầng giao thông đường thủy.',
    requiresDates: false,
  },
  {
    code: 'F-143',
    name: 'Báo cáo kê khai tài sản KCHT',
    description: 'Báo cáo kê khai chi tiết các tài sản kết cấu hạ tầng giao thông đường thủy.',
    requiresDates: false,
  },
  {
    code: 'F-144',
    name: 'Báo cáo tình hình quản lý tài sản KCHT',
    description: 'Báo cáo đánh giá tình hình quản lý các tài sản KCHTGT hiện có.',
    requiresDates: false,
  },
  {
    code: 'F-145',
    name: 'Báo cáo tình hình xử lý tài sản KCHT',
    description: 'Báo cáo các hoạt động xử lý tài sản KCHTGT theo các kỳ báo cáo.',
    requiresDates: false,
  },
  {
    code: 'F-146',
    name: 'Báo cáo tình hình khai thác tài sản KCHT',
    description: 'Thống kê tình hình khai thác sử dụng tài sản KCHTGT trong kỳ.',
    requiresDates: false,
  },
  {
    code: 'F-147',
    name: 'Tổng hợp danh mục TS KCHTGT đề nghị xử lý',
    description: 'Tổng hợp các tài sản KCHTGT được đề nghị xử lý theo từng giai đoạn.',
    requiresDates: false,
  },
  {
    code: 'F-181',
    name: 'Biểu tổng hợp thông tin KCHTGT hàng hải',
    description: 'Tổng hợp thông tin chung về kết cấu hạ tầng giao thông đường thủy hàng hải.',
    requiresDates: false,
  },
  // --- Wave 2 (F-148 → F-160) ---
  {
    code: 'F-148',
    name: 'Biểu 01-N: Năng lực thông qua bến cảng, cầu cảng',
    description: 'Thống kê năng lực thông qua của từng bến cảng và cầu cảng trong hệ thống hạ tầng.',
    requiresDates: false,
  },
  {
    code: 'F-149',
    name: 'Biểu 01B-N: Năng lực thông qua cảng biển',
    description: 'Thống kê năng lực thông qua tổng hợp của toàn bộ cảng biển.',
    requiresDates: false,
  },
  {
    code: 'F-150',
    name: 'Biểu 02-N: Thống kê cầu cảng',
    description: 'Thống kê chi tiết danh sách các cầu cảng theo vị trí, loại và tình trạng khai thác.',
    requiresDates: false,
  },
  {
    code: 'F-152',
    name: 'Biểu 04-6T/N: Thống kê vùng đón/trả hoa tiêu, vùng quay trở',
    description: 'Thống kê các vùng đón/trả hoa tiêu và vùng quay trở phục vụ tàu thuyền hoạt động hàng hải.',
    requiresDates: false,
  },
  {
    code: 'F-153',
    name: 'Biểu 04B-N: Thống kê khu chuyển tải, khu neo đậu',
    description: 'Thống kê các khu chuyển tải và khu neo đậu được bố trí trên luồng hàng hải.',
    requiresDates: false,
  },
  {
    code: 'F-154',
    name: 'Biểu 05-N: Thống kê bến phao, khu neo đậu',
    description: 'Thống kê danh sách các bến phao và khu neo đậu được xây dựng và đưa vào khai thác.',
    requiresDates: false,
  },
  {
    code: 'F-155',
    name: 'Biểu 06-N: Thống kê hệ thống đèn biển',
    description: 'Thống kê danh sách các đèn biển, cột đèn và thiết bị phát tín hiệu hàng hải.',
    requiresDates: false,
  },
  {
    code: 'F-156',
    name: 'Biểu 07-6T/N: Thống kê hệ thống phao tiêu',
    description: 'Thống kê các phao tiêu trên luồng hàng hải theo loại, vị trí và trạng thái hoạt động.',
    requiresDates: false,
  },
  {
    code: 'F-157',
    name: 'Biểu 07B-6T/N: Thống kê phao tiêu báo hiệu',
    description: 'Thống kê các phao tiêu dùng để báo hiệu, cảnh báo nguy hiểm trên luồng hàng hải.',
    requiresDates: false,
  },
  {
    code: 'F-158',
    name: 'Biểu 08-N: Thống kê hệ thống giám sát VTS',
    description: 'Thống kê hệ thống giám sát giao thông tàu thủy (VTS) bao gồm radar, AIS và các thiết bị liên quan.',
    requiresDates: false,
  },
  {
    code: 'F-159',
    name: 'Biểu 09-N: Hệ thống đài thông tin duyên hải',
    description: 'Thống kê danh sách các đài thông tin duyên hải phục vụ liên lạc hàng hải trên toàn vùng.',
    requiresDates: false,
  },
  {
    code: 'F-160',
    name: 'Biểu 10-N: Thống kê hệ thống đê, kè chắn sóng',
    description: 'Thống kê các công trình đê, kè chắn sóng được xây dựng để bảo vệ bờ biển và khu cảng.',
    requiresDates: false,
  },
  // --- Wave 3 (F-161 → F-173) ---
  {
    code: 'F-161',
    name: 'Biểu 11-T: Báo cáo chi tiết tàu biển ra vào cảng',
    description: 'Báo cáo chi tiết các tàu biển ra vào cảng theo kỳ báo cáo, bao gồm thông tin tàu, hàng hóa và thời gian.',
    requiresDates: false,
  },
  {
    code: 'F-162',
    name: 'Biểu 11B-T: Báo cáo chi tiết phương tiện thủy nội địa',
    description: 'Báo cáo chi tiết các phương tiện thủy nội địa hoạt động trên sông, kênh liên quan đến cảng biển.',
    requiresDates: false,
  },
  {
    code: 'F-163',
    name: 'Biểu 16-Q: Thống kê tàu biển nước ngoài đến, rời',
    description: 'Thống kê các tàu biển mang quốc tịch nước ngoài đến và rời cảng trong kỳ báo cáo.',
    requiresDates: false,
  },
  {
    code: 'F-164',
    name: 'Biểu 17-Q: Thống kê tàu biển VN vận tải quốc tế',
    description: 'Thống kê tàu biển Việt Nam tham gia vận tải quốc tế đến, rời và quá cảnh qua cảng.',
    requiresDates: false,
  },
  {
    code: 'F-167',
    name: 'Biểu 13-T: Lượt tàu thuyền vào rời cảng biển',
    description: 'Thống kê số lượt tàu thuyền ra vào cảng biển theo tháng và tổng hợp hàng năm.',
    requiresDates: false,
  },
  {
    code: 'F-171',
    name: 'Biểu 22-6T/N: Thống kê tàu biển quốc tịch VN',
    description: 'Thống kê các tàu biển mang quốc tịch Việt Nam hoạt động trong khu vực cảng biển.',
    requiresDates: false,
  },
  {
    code: 'F-172',
    name: 'Biểu 23-N: Thống kê tàu thuyền hoạt động lai dắt',
    description: 'Thống kê các tàu thuyền hoạt động lai dắt, đẩy tầu trong khu vực cảng và luồng hàng hải.',
    requiresDates: false,
  },
  {
    code: 'F-173',
    name: 'Biểu 31-N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu',
    description: 'Thống kê các cơ sở đóng mới, sửa chữa và phá dỡ tàu thuyền trên địa bàn.',
    requiresDates: false,
  },
  // --- Wave 4 (F-165 → F-178) ---
  {
    code: 'F-165',
    name: 'Biểu 12-T: Khối lượng hàng hóa, hành khách theo tháng',
    description: 'Thống kê khối lượng hàng hóa thông qua cảng và lượng hành khách theo từng tháng.',
    requiresDates: false,
  },
  {
    code: 'F-166',
    name: 'Biểu 12-N: Khối lượng hàng hóa theo năm',
    description: 'Tổng hợp khối lượng hàng hóa thông qua cảng theo năm, phân theo loại hàng hóa.',
    requiresDates: false,
  },
  {
    code: 'F-168',
    name: 'Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu',
    description: 'Báo cáo tổng hợp khối lượng hàng hóa, hành khách và lượt tàu trong một kỳ báo cáo.',
    requiresDates: false,
  },
  {
    code: 'F-169',
    name: 'Biểu 15-T: Khối lượng hàng hóa trong khu quản lý',
    description: 'Thống kê khối lượng hàng hóa lưu chuyển trong khu vực quản lý của cảng.',
    requiresDates: false,
  },
  {
    code: 'F-174',
    name: 'Biểu 45-6T/N: Báo cáo tổng hợp hàng hóa thông qua cảng',
    description: 'Báo cáo tổng hợp toàn bộ hàng hóa thông qua cảng theo từng kỳ và phân loại.',
    requiresDates: false,
  },
  {
    code: 'F-177',
    name: 'Biểu 28-T: Khối lượng hàng hóa theo tháng',
    description: 'Thống kê khối lượng hàng hóa thông qua cảng chi tiết theo từng tháng.',
    requiresDates: false,
  },
  {
    code: 'F-178',
    name: 'Biểu 29-N: Khối lượng hàng hóa theo năm',
    description: 'Tổng hợp khối lượng hàng hóa thông qua cảng theo năm, so sánh với kỳ trước.',
    requiresDates: false,
  },
  // --- Wave 5 (F-170 → F-179) ---
  {
    code: 'F-170',
    name: 'Biểu 21-6T/N: Thống kê thuyền viên, hiệu',
    description: 'Thống kê số lượng thuyền viên và các hiệu lệnh liên quan đến hoạt động hàng hải.',
    requiresDates: false,
  },
  {
    code: 'F-175',
    name: 'Biểu số 06-N: Năng lực thông qua bến cảng (Thông tư 48)',
    description: 'Báo cáo năng lực thông qua bến cảng theo quy định tại Thông tư 48/2024/TT-BGTVT.',
    requiresDates: false,
  },
  {
    code: 'F-176',
    name: 'Biểu 07-N: Năng lực thông qua cảng biển, thủy nội địa',
    description: 'Thống kê năng lực thông qua của cảng biển và hệ thống thủy nội địa.',
    requiresDates: false,
  },
  {
    code: 'F-179',
    name: 'Biểu 33-N: Sản lượng dịch vụ vận tải, doanh nghiệp',
    description: 'Thống kê sản lượng dịch vụ vận tải và hoạt động của các doanh nghiệp trong ngành.',
    requiresDates: false,
  },
  // --- Wave 6 (F-182 → F-189) ---
  {
    code: 'F-182',
    name: 'Biểu tổng hợp thông tin bảo trì KCHTGT',
    description: 'Tổng hợp thông tin bảo trì, sửa chữa các công trình kết cấu hạ tầng giao thông đường thủy.',
    requiresDates: false,
  },
  {
    code: 'F-183',
    name: 'Biểu tổng hợp bảo trì KCHTGT - Cầu cảng',
    description: 'Báo cáo công tác bảo trì, sửa chữa các cầu cảng thuộc hệ thống hạ tầng.',
    requiresDates: false,
  },
  {
    code: 'F-184',
    name: 'Biểu tổng hợp bảo trì KCHTGT - Luồng hàng hải',
    description: 'Báo cáo công tác bảo trì luồng hàng hải, nạo vét và duy trì chiều sâu luồng.',
    requiresDates: false,
  },
  {
    code: 'F-185',
    name: 'Biểu tổng hợp bảo trì KCHTGT - Phao tiêu',
    description: 'Báo cáo công tác bảo trì, thay mới các phao tiêu trên luồng hàng hải.',
    requiresDates: false,
  },
  {
    code: 'F-186',
    name: 'Biểu tổng hợp bảo trì KCHTGT - Đèn biển',
    description: 'Báo cáo công tác bảo trì hệ thống đèn biển, cột đèn và thiết bị phát tín hiệu.',
    requiresDates: false,
  },
  {
    code: 'F-187',
    name: 'Biểu tổng hợp bảo trì KCHTGT - Đê, kè',
    description: 'Báo cáo công tác bảo trì đê, kè chắn sóng và các công trình bảo vệ bờ biển.',
    requiresDates: false,
  },
  {
    code: 'F-188',
    name: 'Báo cáo kê khai, tình hình quản lý TS KCHTGT hàng hải',
    description: 'Báo cáo kê khai và đánh giá tình hình quản lý tài sản kết cấu hạ tầng giao thông đường thủy hàng hải.',
    requiresDates: false,
  },
  {
    code: 'F-189',
    name: 'Báo cáo tình hình hoạt động báo hiệu hàng hải và đê, kè',
    description: 'Báo cáo tổng hợp tình hình hoạt động của hệ thống báo hiệu hàng hải và công trình đê, kè.',
    requiresDates: false,
  },
];

export default function ReportsPage() {
  const [selectedReportCode, setSelectedReportCode] = useState<string>('F-141');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().subtract(1, 'month'),
    dayjs(),
  ]);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [loadingExport, setLoadingExport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);

  const activeTemplate = REPORT_TEMPLATES.find((t) => t.code === selectedReportCode);

  const fetchPreview = async (silent = false) => {
    if (!selectedReportCode) return;

    if (!silent) setLoadingPreview(true);
    try {
      const request: ReportRequest = {
        reportCode: selectedReportCode,
      };

      if (activeTemplate?.requiresDates) {
        if (dateRange[0]) request.startDate = dateRange[0].format('YYYY-MM-DD');
        if (dateRange[1]) request.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const data = await reportService.getPreview(request);
      setReportData(data);
      if (!silent) {
        message.success('Tải dữ liệu xem trước thành công');
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || 'Không thể tải dữ liệu xem trước');
    } finally {
      if (!silent) setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview(true);
  }, [selectedReportCode]);

  const handleExport = async (format: 'EXCEL' | 'PDF') => {
    setLoadingExport(format);
    try {
      const request: ReportRequest = {
        reportCode: selectedReportCode,
        format,
      };

      if (activeTemplate?.requiresDates) {
        if (dateRange[0]) request.startDate = dateRange[0].format('YYYY-MM-DD');
        if (dateRange[1]) request.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      await reportService.exportReport(request);
      message.success(`Xuất báo cáo dạng ${format === 'EXCEL' ? 'CSV (Excel)' : 'TEXT (PDF)'} thành công`);
    } catch (err: any) {
      console.error(err);
      message.error('Không thể xuất báo cáo');
    } finally {
      setLoadingExport(null);
    }
  };

  // Build columns dynamically based on report headers
  const getColumns = () => {
    if (!reportData || !reportData.headers) return [];

    return reportData.headers.map((header) => ({
      title: header,
      dataIndex: header,
      key: header,
      render: (value: any) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') {
          return value ? <Badge status="success" text="Đúng" /> : <Badge status="error" text="Sai" />;
        }
        return value.toString();
      },
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title block with custom styling */}
      <Card
        styles={{
          body: {
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            borderRadius: 6,
            padding: '20px 24px',
          },
        }}
        bordered={false}
      >
        <div style={{ color: '#fff' }}>
          <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 600 }}>
            Báo cáo & Thống kê số liệu
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', margin: '8px 0 0 0' }}>
            Kết xuất dữ liệu hạ tầng, tổng hợp tài sản và thống kê tuyến luồng hàng hải theo các biểu mẫu chuẩn nghiệp vụ.
          </Paragraph>
        </div>
      </Card>

      {/* Filter Card */}
      <Card title={<Space><CalendarOutlined /><span>Cấu hình bộ lọc báo cáo</span></Space>}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <div style={{ marginBottom: 6 }}><Text strong>Mẫu báo cáo / thống kê</Text></div>
            <Select
              style={{ width: '100%' }}
              value={selectedReportCode}
              onChange={(value) => setSelectedReportCode(value)}
              options={REPORT_TEMPLATES.map((t) => ({
                value: t.code,
                label: `[${t.code}] ${t.name}`,
              }))}
            />
          </Col>

          <Col xs={24} md={8}>
            <div style={{ marginBottom: 6 }}>
              <Text strong style={{ color: activeTemplate?.requiresDates ? 'inherit' : '#bfbfbf' }}>
                Thời gian báo cáo
              </Text>
            </div>
            <RangePicker
              style={{ width: '100%' }}
              disabled={!activeTemplate?.requiresDates}
              value={activeTemplate?.requiresDates ? dateRange : null}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0], dates[1]]);
                } else {
                  setDateRange([null, null]);
                }
              }}
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Col>

          <Col xs={24} md={6} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: '100%', paddingTop: 26 }}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={loadingPreview}
              onClick={() => fetchPreview()}
              style={{ flex: 1 }}
            >
              Xem trước
            </Button>
            <Tooltip title="Tải lại">
              <Button icon={<ReloadOutlined />} onClick={() => fetchPreview(false)} />
            </Tooltip>
          </Col>
        </Row>

        {activeTemplate && (
          <Alert
            style={{ marginTop: 16 }}
            message={<Text strong>{activeTemplate.name}</Text>}
            description={activeTemplate.description}
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        )}
      </Card>

      {/* Preview Card */}
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
              Xuất file Text
            </Button>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              disabled={!reportData || reportData.rows.length === 0}
              loading={loadingExport === 'EXCEL'}
              onClick={() => handleExport('EXCEL')}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Xuất file Excel
            </Button>
          </Space>
        }
      >
        {loadingPreview ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <ReloadOutlined spin style={{ fontSize: 24, color: '#1890ff', marginBottom: 16 }} />
            <div>Đang tải dữ liệu báo cáo...</div>
          </div>
        ) : reportData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Title level={4} style={{ textAlign: 'center', margin: '8px 0' }}>
              {reportData.reportName.toUpperCase()}
            </Title>
            <div style={{ textAlign: 'center', color: '#8c8c8c', marginBottom: 16 }}>
              Mã số: {reportData.reportCode}
            </div>

            <Table
              columns={getColumns()}
              dataSource={reportData.rows.map((row, idx) => ({ ...row, key: row.key || idx }))}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              bordered
              scroll={{ x: 'max-content' }}
            />

            {reportData.summary && Object.keys(reportData.summary).length > 0 && (
              <Card type="inner" title="Thông tin tổng hợp" style={{ marginTop: 8 }}>
                <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
                  {Object.entries(reportData.summary).map(([key, val]) => (
                    <Descriptions.Item key={key} label={key}>
                      <Text strong>{val.toString()}</Text>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}
          </div>
        ) : (
          <Empty description="Chọn cấu hình báo cáo và bấm nút Xem trước để kết xuất dữ liệu." />
        )}
      </Card>
    </div>
  );
}
