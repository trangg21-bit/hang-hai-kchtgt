import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Space,
  Input,
  DatePicker,
  Tag,
  Popconfirm,
  message,
  Typography,
  Tooltip,
  Badge,
  Spin,
  Alert,
} from 'antd';
import {
  DownloadOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  CodeOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { logService, type AccessLogEntry, type BackupRecord, type SiemMetrics } from '../services/logService';
import api from '../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState('1');

  // Access Logs State
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);
  const [totalAccessLogs, setTotalAccessLogs] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(10);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchModule, setSearchModule] = useState('');
  const [searchAction, setSearchAction] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Backups State
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [backupSubmitting, setBackupSubmitting] = useState(false);
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);

  // SIEM State
  const [siemMetrics, setSiemMetrics] = useState<SiemMetrics | null>(null);
  const [siemLoading, setSiemLoading] = useState(false);
  const [exportingReport, setExportingReport] = useState<string | null>(null);

  // Global Auth download helper
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
      message.success(`Tải file ${filename} thành công`);
    } catch (error) {
      console.error(error);
      message.error('Tải file thất bại');
    }
  };

  // 1. Fetch Access Logs
  const fetchAccessLogs = async () => {
    setLogsLoading(true);
    try {
      const fromStr = dateRange?.[0] ? dateRange[0].startOf('day').toISOString() : undefined;
      const toStr = dateRange?.[1] ? dateRange[1].endOf('day').toISOString() : undefined;

      const data = await logService.listAccessLogs({
        page: logPage - 1,
        size: logPageSize,
        userId: undefined, // Filter by username string instead
        module: searchModule || undefined,
        action: searchAction || undefined,
        from: fromStr,
        to: toStr,
      });

      // Filter username client-side if query isn't fully supported
      let content = data.content;
      if (searchUsername) {
        content = content.filter((l) =>
          l.username?.toLowerCase().includes(searchUsername.toLowerCase())
        );
      }

      setAccessLogs(content);
      setTotalAccessLogs(searchUsername ? content.length : data.totalElements);
    } catch (e) {
      message.error('Không thể tải nhật ký truy cập');
    } finally {
      setLogsLoading(false);
    }
  };

  // 2. Fetch Backups
  const fetchBackups = async () => {
    setBackupsLoading(true);
    try {
      const data = await logService.listBackups();
      setBackups(data);
    } catch (e) {
      message.error('Không thể tải danh sách bản sao lưu');
    } finally {
      setBackupsLoading(false);
    }
  };

  // 3. Fetch SIEM Metrics
  const fetchSiemMetrics = async () => {
    setSiemLoading(true);
    try {
      const data = await logService.getSiemMetrics();
      setSiemMetrics(data);
    } catch (e) {
      message.error('Không thể tải chỉ số an ninh SIEM');
    } finally {
      setSiemLoading(false);
    }
  };

  // Load appropriate data on tab change
  useEffect(() => {
    if (activeTab === '1') {
      fetchAccessLogs();
    } else if (activeTab === '2') {
      fetchBackups();
    } else if (activeTab === '3') {
      fetchSiemMetrics();
    }
  }, [activeTab, logPage, logPageSize]);

  // Create Backup Action
  const handleCreateBackup = async () => {
    setBackupSubmitting(true);
    try {
      const res = await logService.createBackup();
      if (res.success) {
        message.success(res.message || 'Tạo bản sao lưu thành công');
        fetchBackups();
      } else {
        message.error(res.message || 'Tạo bản sao lưu thất bại');
      }
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Có lỗi xảy ra khi tạo sao lưu');
    } finally {
      setBackupSubmitting(false);
    }
  };

  // Restore Backup Action
  const handleRestoreBackup = async (id: string) => {
    setRestoreSubmitting(true);
    try {
      const res = await logService.restoreBackup(id);
      if (res.success) {
        message.success(res.message || 'Khôi phục dữ liệu thành công');
        // Force reload page to ensure clean context state
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        message.error(res.message || 'Khôi phục thất bại');
      }
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Có lỗi xảy ra khi khôi phục');
    } finally {
      setRestoreSubmitting(false);
    }
  };

  // Export Access Logs CSV
  const handleExportCsv = () => {
    const fromStr = dateRange?.[0] ? dateRange[0].startOf('day').toISOString() : undefined;
    const toStr = dateRange?.[1] ? dateRange[1].endOf('day').toISOString() : undefined;

    const url = logService.exportAccessLogsUrl({
      module: searchModule || undefined,
      action: searchAction || undefined,
      from: fromStr,
      to: toStr,
      page: 0,
      size: 1000,
    });
    handleDownload(url, `access_logs_${dayjs().format('YYYYMMDD')}.csv`);
  };

  // Export SIEM Report Action
  const handleExportSiem = async (format: string) => {
    setExportingReport(format);
    try {
      const url = logService.getSiemExportUrl(format);
      const extension = format === 'word' ? 'docx' : format === 'excel' ? 'xlsx' : format;
      await handleDownload(url, `siem_report.${extension}`);
    } finally {
      setExportingReport(null);
    }
  };

  // Access Logs Columns
  const logColumns: ColumnsType<AccessLogEntry> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (val) => dayjs(val).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Tài khoản',
      dataIndex: 'username',
      key: 'username',
      width: 150,
      render: (val) => <Text bold>{val}</Text>,
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 160,
      render: (val) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: 'Phân hệ',
      dataIndex: 'module',
      key: 'module',
      width: 140,
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (val) => {
        const isSuccess = val === 'SUCCESS';
        return <Tag color={isSuccess ? 'green' : 'red'}>{isSuccess ? 'Thành công' : 'Thất bại'}</Tag>;
      },
    },
    {
      title: 'Chi tiết',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
      render: (val) =>
        val ? (
          <Tooltip title={val}>
            <Text type="secondary" style={{ cursor: 'pointer' }}>
              {val}
            </Text>
          </Tooltip>
        ) : (
          '-'
        ),
    },
  ];

  // Backups Columns
  const backupColumns: ColumnsType<BackupRecord> = [
    {
      title: 'Tên file',
      dataIndex: 'filename',
      key: 'filename',
      render: (val) => (
        <Space>
          <DatabaseOutlined style={{ color: '#1677ff' }} />
          <Text bold>{val}</Text>
        </Space>
      ),
    },
    {
      title: 'Dung lượng',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 140,
      render: (val) => {
        if (!val) return '0 B';
        if (val < 1024) return `${val} B`;
        if (val < 1024 * 1024) return `${(val / 1024).toFixed(2)} KB`;
        return `${(val / (1024 * 1024)).toFixed(2)} MB`;
      },
    },
    {
      title: 'Loại sao lưu',
      dataIndex: 'backupType',
      key: 'backupType',
      width: 140,
      render: (val) => (
        <Tag color={val === 'MANUAL' ? 'cyan' : 'purple'}>
          {val === 'MANUAL' ? 'Thủ công' : 'Tự động'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (val, record) => {
        const isSuccess = val === 'SUCCESS';
        return (
          <Tooltip title={record.errorDetail}>
            <Badge
              status={isSuccess ? 'success' : 'error'}
              text={isSuccess ? 'Thành công' : 'Thất bại'}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (val) => dayjs(val).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => {
        if (record.status !== 'SUCCESS') return null;
        return (
          <Popconfirm
            title="Khôi phục CSDL"
            description={
              <div>
                Bạn có chắc chắn muốn khôi phục CSDL từ bản sao lưu này?
                <br />
                <Text type="danger" bold>
                  Cảnh báo: Toàn bộ dữ liệu hiện tại sẽ bị ghi đè!
                </Text>
              </div>
            }
            onConfirm={() => handleRestoreBackup(record.id)}
            okText="Đồng ý khôi phục"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: restoreSubmitting }}
          >
            <Button type="primary" danger size="small" icon={<HistoryOutlined />}>
              Khôi phục
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Nhật ký hệ thống & Sao lưu</Title>
        <Text type="secondary">
          Quản lý nhật ký truy cập, sao lưu cơ sở dữ liệu định kỳ, khôi phục trạng thái và giám sát an ninh hệ thống.
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        type="card"
        items={[
          {
            key: '1',
            label: (
              <span>
                <HistoryOutlined />
                Nhật ký truy cập
              </span>
            ),
            children: (
              <Card>
                <div style={{ marginBottom: '16px' }}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={8} md={4}>
                      <Input
                        placeholder="Tài khoản"
                        prefix={<SearchOutlined />}
                        value={searchUsername}
                        onChange={(e) => setSearchUsername(e.target.value)}
                      />
                    </Col>
                    <Col xs={24} sm={8} md={4}>
                      <Input
                        placeholder="Phân hệ"
                        value={searchModule}
                        onChange={(e) => setSearchModule(e.target.value)}
                      />
                    </Col>
                    <Col xs={24} sm={8} md={4}>
                      <Input
                        placeholder="Hành động"
                        value={searchAction}
                        onChange={(e) => setSearchAction(e.target.value)}
                      />
                    </Col>
                    <Col xs={24} sm={16} md={6}>
                      <RangePicker
                        style={{ width: '100%' }}
                        value={dateRange}
                        onChange={(val) => setDateRange(val as any)}
                        placeholder={['Từ ngày', 'Đến ngày']}
                      />
                    </Col>
                    <Col xs={24} sm={8} md={6}>
                      <Space>
                        <Button type="primary" onClick={fetchAccessLogs} icon={<SearchOutlined />}>
                          Tìm kiếm
                        </Button>
                        <Button
                          onClick={() => {
                            setSearchUsername('');
                            setSearchModule('');
                            setSearchAction('');
                            setDateRange(null);
                          }}
                          icon={<ReloadOutlined />}
                        >
                          Làm mới
                        </Button>
                        <Button type="dashed" onClick={handleExportCsv} icon={<DownloadOutlined />}>
                          Xuất CSV
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </div>

                <Table
                  dataSource={accessLogs}
                  columns={logColumns}
                  rowKey="id"
                  loading={logsLoading}
                  pagination={{
                    current: logPage,
                    pageSize: logPageSize,
                    total: totalAccessLogs,
                    onChange: (p, ps) => {
                      setLogPage(p);
                      setLogPageSize(ps);
                    },
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                  }}
                />
              </Card>
            ),
          },
          {
            key: '2',
            label: (
              <span>
                <DatabaseOutlined />
                Sao lưu & Phục hồi
              </span>
            ),
            children: (
              <Card
                title="Quản lý sao lưu dữ liệu (H2 / PostgreSQL)"
                extra={
                  <Button
                    type="primary"
                    icon={<DatabaseOutlined />}
                    loading={backupSubmitting}
                    onClick={handleCreateBackup}
                  >
                    Tạo bản sao lưu mới
                  </Button>
                }
              >
                <Alert
                  message="Lưu ý quan trọng về bảo mật & phục hồi"
                  description="Các bản sao lưu tự động được thực hiện vào lúc 00:00 ngày Chủ nhật hàng tuần. Khi thực hiện phục hồi (Restore), toàn bộ các phiên làm việc hiện tại sẽ bị hủy và hệ thống sẽ tự động khôi phục về trạng thái được lưu. Hãy đảm bảo không có người dùng nào đang thay đổi dữ liệu quan trọng."
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  style={{ marginBottom: '20px' }}
                />

                <Table
                  dataSource={backups}
                  columns={backupColumns}
                  rowKey="id"
                  loading={backupsLoading || restoreSubmitting}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: '3',
            label: (
              <span>
                <SafetyCertificateOutlined />
                Giám sát SIEM
              </span>
            ),
            children: (
              <Spin spinning={siemLoading}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* SIEM Metrics Cards */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false} style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' }}>
                        <Statistic
                          title="Tốc độ sự kiện (EPS)"
                          value={siemMetrics?.eventsPerSecond ?? 0}
                          precision={2}
                          valueStyle={{ color: '#0369a1', fontWeight: 'bold' }}
                          suffix="events/s"
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false} style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' }}>
                        <Statistic
                          title="Tỷ lệ truy cập lỗi"
                          value={siemMetrics?.failureRate ?? 0}
                          precision={2}
                          valueStyle={{ color: '#b91c1c', fontWeight: 'bold' }}
                          suffix="%"
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false} style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
                        <Statistic
                          title="Tài khoản đang bị khóa"
                          value={siemMetrics?.activeAlertsCount ?? 0}
                          valueStyle={{ color: '#b45309', fontWeight: 'bold' }}
                          suffix="accounts"
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                        <Statistic
                          title="Cảnh báo an ninh (24h)"
                          value={siemMetrics?.securityAlertsCount ?? 0}
                          valueStyle={{ color: '#15803d', fontWeight: 'bold' }}
                          suffix="failures"
                        />
                      </Card>
                    </Col>
                  </Row>

                  {/* Summary Card */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card title="Trạng thái phân tích SIEM" extra={<ReloadOutlined onClick={fetchSiemMetrics} style={{ cursor: 'pointer' }} />}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary">Tổng số sự kiện an ninh ghi nhận:</Text>
                            <Title level={4} style={{ marginTop: '4px', marginBottom: 0 }}>
                              {siemMetrics?.totalEventsCount?.toLocaleString() ?? 0}
                            </Title>
                          </div>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Statistic title="Nhật ký truy cập" value={siemMetrics?.accessLogsCount ?? 0} />
                            </Col>
                            <Col span={12}>
                              <Statistic title="Nhật ký đăng nhập" value={siemMetrics?.loginAttemptsCount ?? 0} />
                            </Col>
                          </Row>
                        </Space>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card title="Xuất báo cáo SIEM đa định dạng">
                        <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                          Tải báo cáo phân tích an ninh hệ thống theo các định dạng tiêu chuẩn để báo cáo cấp trên.
                        </Text>
                        <Space wrap size="middle">
                          <Button
                            type="primary"
                            icon={<FileWordOutlined />}
                            onClick={() => handleExportSiem('word')}
                            loading={exportingReport === 'word'}
                          >
                            Word (.docx)
                          </Button>
                          <Button
                            type="primary"
                            style={{ backgroundColor: '#1d6f42', borderColor: '#1d6f42' }}
                            icon={<FileExcelOutlined />}
                            onClick={() => handleExportSiem('excel')}
                            loading={exportingReport === 'excel'}
                          >
                            Excel (.xlsx)
                          </Button>
                          <Button
                            type="primary"
                            danger
                            icon={<FilePdfOutlined />}
                            onClick={() => handleExportSiem('pdf')}
                            loading={exportingReport === 'pdf'}
                          >
                            PDF
                          </Button>
                          <Button
                            icon={<FileTextOutlined />}
                            onClick={() => handleExportSiem('html')}
                            loading={exportingReport === 'html'}
                          >
                            HTML
                          </Button>
                          <Button
                            icon={<CodeOutlined />}
                            onClick={() => handleExportSiem('xml')}
                            loading={exportingReport === 'xml'}
                          >
                            XML
                          </Button>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </Spin>
            ),
          },
        ]}
      />
    </div>
  );
}
