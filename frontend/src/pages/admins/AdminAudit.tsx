import { useState, useCallback, useEffect } from 'react';
import { Form } from 'antd';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Input,
  Row,
  Col,
  DatePicker,
  Select,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { adminService } from '../../services/adminService';
import type { AdminAuditLog } from '../../services/adminService';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

const RESULT_MAP: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  success: { color: 'green', icon: <CheckCircleOutlined />, label: 'Thành công' },
  failure: { color: 'red', icon: <CloseCircleOutlined />, label: 'Thất bại' },
};

const ACTION_MAP: Record<string, string> = {
  LOGIN: 'Đăng nhập',
  LOGIN_TOTP: 'Đăng nhập 2FA',
  CREATE_USER: 'Tạo người dùng',
  UPDATE_USER: 'Sửa người dùng',
  DELETE_USER: 'Xóa người dùng',
  LOCK_USER: 'Khóa người dùng',
  UNLOCK_USER: 'Mở khóa người dùng',
  CHANGE_USER_STATUS: 'Đổi trạng thái',
  RESET_USER_PASSWORD: 'Cấp lại mật khẩu',
  CREATE_CONNECTION: 'Tạo kết nối',
  UPDATE_CONNECTION: 'Sửa kết nối',
  DELETE_CONNECTION: 'Xóa kết nối',
  TEST_CONNECTION: 'Kiểm tra kết nối',
  RUN_HEALTH_CHECK: 'Chạy health check',
  CREATE_BACKUP: 'Tạo sao lưu',
  RESTORE_BACKUP: 'Khôi phục sao lưu',
};

export default function AdminAudit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();

  const [dataSource, setDataSource] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [filters, setFilters] = useState({
    action: '',
    result: '',
    startDate: '',
    endDate: '',
  });

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await adminService.getAuditLogs({
        page,
        pageSize,
        adminId: id,
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.result ? { result: filters.result as 'success' | 'failure' } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải nhật ký hoạt động'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, id, filters]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleFilter = useCallback((values: any) => {
    setFilters({
      action: values.action || '',
      result: values.result || '',
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : '',
      endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : '',
    });
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    form.resetFields();
    setFilters({ action: '', result: '', startDate: '', endDate: '' });
    setPage(1);
  }, [form]);

  const columns: ColumnsType<AdminAuditLog> = [
    { title: '#', width: 60, render: (_, __, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 180,
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 180,
      render: (action: string) => (
        <Tag color="blue">{ACTION_MAP[action] || action.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Mục tiêu',
      dataIndex: 'targetName',
      ellipsis: true,
      render: (_: unknown, record: AdminAuditLog) => {
        const text = record.targetName;
        return text || `${record.targetType}${record.targetId ? ` (${record.targetId})` : ''}`;
      },
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ipAddress',
      width: 140,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      width: 120,
      render: (result: string) => {
        const key = String(result || '').toLowerCase();
        const r = RESULT_MAP[key] || { color: 'default', icon: null, label: result };
        return (
          <Space>
            {r.icon}
            <Tag color={r.color}>{r.label}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Chi tiết',
      dataIndex: 'details',
      ellipsis: true,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text>,
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admins')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>Nhật ký hoạt động</Typography.Title>
        </Space>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={handleFilter}>
          <Form.Item name="action">
            <Select placeholder="Hành động" style={{ width: 200 }} allowClear options={[
              { value: 'LOGIN', label: 'Đăng nhập' },
              { value: 'LOGIN_TOTP', label: 'Đăng nhập 2FA' },
              { value: 'CREATE_USER', label: 'Tạo người dùng' },
              { value: 'UPDATE_USER', label: 'Sửa người dùng' },
              { value: 'DELETE_USER', label: 'Xóa người dùng' },
              { value: 'LOCK_USER', label: 'Khóa người dùng' },
              { value: 'UNLOCK_USER', label: 'Mở khóa người dùng' },
              { value: 'CHANGE_USER_STATUS', label: 'Đổi trạng thái' },
              { value: 'RESET_USER_PASSWORD', label: 'Cấp lại mật khẩu' },
              { value: 'CREATE_CONNECTION', label: 'Tạo kết nối' },
              { value: 'UPDATE_CONNECTION', label: 'Sửa kết nối' },
              { value: 'DELETE_CONNECTION', label: 'Xóa kết nối' },
              { value: 'TEST_CONNECTION', label: 'Kiểm tra kết nối' },
              { value: 'RUN_HEALTH_CHECK', label: 'Chạy health check' },
              { value: 'CREATE_BACKUP', label: 'Tạo sao lưu' },
              { value: 'RESTORE_BACKUP', label: 'Khôi phục sao lưu' },
            ]} />
          </Form.Item>
          <Form.Item name="result">
            <Select placeholder="Kết quả" style={{ width: 140 }} allowClear options={[
              { value: 'success', label: 'Thành công' },
              { value: 'failure', label: 'Thất bại' },
            ]} />
          </Form.Item>
          <Form.Item name="startDate">
            <DatePicker placeholder="Từ ngày" format="DD/MM/YYYY" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="endDate">
            <DatePicker placeholder="Đến ngày" format="DD/MM/YYYY" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Lọc
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={handleReset}>
              Đặt lại
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Table */}
      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải nhật ký hoạt động'}
            onRetry={fetchLogs}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState description="Chưa có nhật ký hoạt động nào" />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<AdminAuditLog>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, sz) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} nhật ký`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
