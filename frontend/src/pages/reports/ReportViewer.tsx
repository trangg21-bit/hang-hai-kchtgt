import { useState, useEffect } from 'react';
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
  Tooltip,
  message,
  Descriptions,
  Breadcrumb,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { reportService } from '../../services/reportService';
import type { ReportRequest, ReportResponse } from '../../types/report';
import { REPORT_TEMPLATES, CATEGORY_MAP } from './ReportList';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

// Define which reports use date filters based on backend implementation
const REPORTS_WITH_DATES = ['F-141', 'F-142', 'F-143', 'F-145', 'F-146', 'F-147'];

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

  const requiresDates = REPORTS_WITH_DATES.includes(reportCode);
  const categoryInfo = template ? CATEGORY_MAP[template.category] : null;

  const fetchPreview = async (silent = false) => {
    if (!reportCode) return;

    if (!silent) setLoadingPreview(true);
    try {
      const request: ReportRequest = {
        reportCode,
      };

      if (requiresDates) {
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
    if (template && template.status === 'active') {
      fetchPreview(true);
    } else {
      setReportData(null);
    }
  }, [reportCode]);

  const handleExport = async (format: 'EXCEL' | 'PDF') => {
    setLoadingExport(format);
    try {
      const request: ReportRequest = {
        reportCode,
        format,
      };

      if (requiresDates) {
        if (dateRange[0]) request.startDate = dateRange[0].format('YYYY-MM-DD');
        if (dateRange[1]) request.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      await reportService.exportReport(request);
      message.success(`Xuất báo cáo dạng ${format === 'EXCEL' ? 'Excel' : 'Text'} thành công`);
    } catch (err: any) {
      console.error(err);
      message.error('Không thể xuất báo cáo');
    } finally {
      setLoadingExport(null);
    }
  };

  if (!template) {
    return (
      <Card style={{ margin: '24px auto', maxWidth: 600, textAlign: 'center' }}>
        <Empty description="Biểu mẫu báo cáo không tồn tại trong hệ thống." />
        <Button type="primary" onClick={() => navigate('/reports')} style={{ marginTop: 16 }}>
          Quay lại danh sách
        </Button>
      </Card>
    );
  }

  // Dynamic columns mapping
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
        if (typeof value === 'number') {
          // Format numeric values beautifully for currency/counts
          if (header.includes('(VNĐ)')) {
            return value.toLocaleString('vi-VN');
          }
          return value.toLocaleString('vi-VN');
        }
        return value.toString();
      },
    }));
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Breadcrumb and Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate('/reports')}>Báo cáo & Thống kê</a> },
            { title: template.code },
          ]}
        />
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reports')}>
          Quay lại danh sách
        </Button>
      </div>

      {/* Header Info */}
      <Card
        styles={{
          body: {
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            borderRadius: 6,
            padding: '24px',
          },
        }}
        bordered={false}
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
        <Row gutter={[16, 16]}>
          {/* Controls Panel */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <CalendarOutlined style={{ color: '#1677ff' }} />
                  <span>Cấu hình bộ lọc</span>
                </Space>
              }
              style={{ height: '100%' }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong type={requiresDates ? 'danger' : 'secondary'}>
                      Thời gian báo cáo {requiresDates && '*'}
                    </Text>
                  </div>
                  <RangePicker
                    style={{ width: '100%' }}
                    disabled={!requiresDates}
                    value={requiresDates ? dateRange : null}
                    onChange={(dates) => {
                      if (dates) {
                        setDateRange([dates[0], dates[1]]);
                      } else {
                        setDateRange([null, null]);
                      }
                    }}
                    placeholder={['Từ ngày', 'Đến ngày']}
                  />
                  {!requiresDates && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                      Biểu mẫu tổng hợp số liệu hiện tại, không yêu cầu lọc thời gian.
                    </Text>
                  )}
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    loading={loadingPreview}
                    onClick={() => fetchPreview()}
                    style={{ width: '100%' }}
                    size="large"
                  >
                    Xem dữ liệu trước
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => fetchPreview(false)}
                    style={{ width: '100%' }}
                  >
                    Tải lại dữ liệu
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>

          {/* Preview Panel */}
          <Col xs={24} lg={16}>
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
                    Xuất Excel
                  </Button>
                </Space>
              }
              style={{ minHeight: 380 }}
            >
              {loadingPreview ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <ReloadOutlined spin style={{ fontSize: 28, color: '#1677ff', marginBottom: 16 }} />
                  <div>Đang tính toán số liệu thống kê...</div>
                </div>
              ) : reportData ? (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Table
                    columns={getColumns()}
                    dataSource={reportData.rows.map((row, idx) => ({ ...row, key: idx }))}
                    pagination={{ pageSize: 5, showSizeChanger: true }}
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
                <Empty description="Bấm nút Xem dữ liệu trước ở cột cấu hình để kết xuất dữ liệu." />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </Space>
  );
}
