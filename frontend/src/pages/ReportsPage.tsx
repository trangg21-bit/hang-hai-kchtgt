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
