import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  InputNumber,
  Input,
  Switch,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Descriptions,
  Popconfirm,
  message,
  Spin,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  FieldTimeOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import {
  logService,
  type BackupRecord,
  type LogRetentionPolicy,
  type PasswordPolicy,
} from '../services/logService';

const { Title, Text } = Typography;

const formatBytes = (bytes: number): string => {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

function RetentionTab() {
  const [form] = Form.useForm<LogRetentionPolicy>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const policy = await logService.getRetentionPolicy();
      form.setFieldsValue(policy);
    } catch {
      // The interceptor already surfaced the reason.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const saved = await logService.updateRetentionPolicy(values);
      form.setFieldsValue(saved);
      message.success('Đã lưu cấu hình lưu trữ nhật ký');
    } catch {
      // Interceptor shows the message.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Card
        title="Chính sách lưu trữ nhật ký"
        extra={
          <Button icon={<ReloadOutlined />} onClick={load} disabled={loading || saving}>
            Tải lại
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Nhật ký truy cập cũ hơn số ngày cấu hình sẽ bị dọn tự động theo lịch bên dưới."
        />
        <Form form={form} layout="vertical" style={{ maxWidth: 520 }}>
          <Form.Item
            name="retentionDays"
            label="Số ngày lưu nhật ký"
            rules={[{ required: true, message: 'Nhập số ngày lưu' }]}
          >
            <InputNumber min={1} max={3650} style={{ width: '100%' }} addonAfter="ngày" />
          </Form.Item>
          <Form.Item
            name="maxExportRows"
            label="Số dòng tối đa mỗi lần xuất"
            rules={[{ required: true, message: 'Nhập số dòng tối đa' }]}
          >
            <InputNumber min={1} max={1_000_000} style={{ width: '100%' }} addonAfter="dòng" />
          </Form.Item>
          <Form.Item
            name="cleanupSchedule"
            label="Lịch dọn dẹp (cron)"
            tooltip="Định dạng cron 6 trường của Spring, ví dụ 0 0 2 * * ? — 2 giờ sáng mỗi ngày"
            rules={[{ required: true, message: 'Nhập biểu thức cron' }]}
          >
            <Input placeholder="0 0 2 * * ?" />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt dọn dẹp tự động" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
            Lưu thay đổi
          </Button>
        </Form>
      </Card>
    </Spin>
  );
}

function PasswordPolicyTab() {
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setPolicy(await logService.getPasswordPolicy());
    } catch {
      // Interceptor shows the message.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const yesNo = (value?: boolean) =>
    value ? <Tag color="green">Bắt buộc</Tag> : <Tag>Không bắt buộc</Tag>;

  return (
    <Spin spinning={loading}>
      <Card
        title="Chính sách mật khẩu"
        extra={
          <Button icon={<ReloadOutlined />} onClick={load} disabled={loading}>
            Tải lại
          </Button>
        }
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Chỉ xem"
          description="Backend hiện chỉ cung cấp GET /api/auth/password-policy. Muốn sửa trực tiếp tại đây thì cần bổ sung endpoint cập nhật ở phía server."
        />
        {policy && (
          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="middle">
            <Descriptions.Item label="Độ dài tối thiểu">{policy.minLength} ký tự</Descriptions.Item>
            <Descriptions.Item label="Chữ hoa">{yesNo(policy.requireUppercase)}</Descriptions.Item>
            <Descriptions.Item label="Chữ thường">{yesNo(policy.requireLowercase)}</Descriptions.Item>
            <Descriptions.Item label="Chữ số">{yesNo(policy.requireDigit)}</Descriptions.Item>
            <Descriptions.Item label="Ký tự đặc biệt">
              {yesNo(policy.requireSpecialChar)}
            </Descriptions.Item>
            <Descriptions.Item label="Bộ ký tự đặc biệt">
              <Text code>{policy.specialCharSet || '—'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Hạn dùng mật khẩu">
              {policy.maxAgeDays > 0 ? `${policy.maxAgeDays} ngày` : 'Không giới hạn'}
            </Descriptions.Item>
            <Descriptions.Item label="Số mật khẩu cũ ghi nhớ">{policy.historyDepth}</Descriptions.Item>
            <Descriptions.Item label="Cấm chứa tên đăng nhập" span={2}>
              {yesNo(policy.blockUsernameInPassword)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </Spin>
  );
}

function BackupTab() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setBackups(await logService.listBackups());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    setCreating(true);
    try {
      await logService.createBackup();
      message.success('Đã tạo bản sao lưu');
      await load();
    } catch {
      // Interceptor shows the message.
    } finally {
      setCreating(false);
    }
  };

  const onRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await logService.restoreBackup(id);
      message.success('Phục hồi thành công. Vui lòng tải lại trang.');
      await load();
    } catch {
      // Interceptor shows the message.
    } finally {
      setRestoringId(null);
    }
  };

  const columns: ColumnsType<BackupRecord> = [
    { title: 'Tên tệp', dataIndex: 'filename', key: 'filename', ellipsis: true },
    {
      title: 'Kích thước',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 120,
      render: (v: number) => formatBytes(v),
    },
    {
      title: 'Loại',
      dataIndex: 'backupType',
      key: 'backupType',
      width: 120,
      render: (v: string) => <Tag>{v === 'MANUAL' ? 'Thủ công' : 'Tự động'}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: string, row) =>
        v === 'SUCCESS' ? (
          <Tag color="green">Thành công</Tag>
        ) : (
          <Tag color="red" title={row.errorDetail}>
            Thất bại
          </Tag>
        ),
    },
    {
      title: 'Thời điểm',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      render: (_, row) => (
        <Popconfirm
          title="Phục hồi dữ liệu?"
          description="Toàn bộ dữ liệu hiện tại sẽ bị ghi đè bằng bản sao lưu này."
          okText="Phục hồi"
          cancelText="Huỷ"
          okButtonProps={{ danger: true }}
          onConfirm={() => onRestore(row.id)}
          disabled={row.status !== 'SUCCESS'}
        >
          <Button
            size="small"
            danger
            disabled={row.status !== 'SUCCESS'}
            loading={restoringId === row.id}
          >
            Phục hồi
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title="Sao lưu & phục hồi dữ liệu"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} disabled={loading}>
            Tải lại
          </Button>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            loading={creating}
            onClick={onCreate}
          >
            Sao lưu ngay
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={backups}
        size="middle"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 10, showSizeChanger: false }}
      />
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>
        <DatabaseOutlined /> Cấu hình hệ thống
      </Title>
      <Tabs
        defaultActiveKey="retention"
        items={[
          {
            key: 'retention',
            label: (
              <span>
                <FieldTimeOutlined /> Lưu trữ nhật ký
              </span>
            ),
            children: <RetentionTab />,
          },
          {
            key: 'password',
            label: (
              <span>
                <SafetyCertificateOutlined /> Chính sách mật khẩu
              </span>
            ),
            children: <PasswordPolicyTab />,
          },
          {
            key: 'backup',
            label: (
              <span>
                <DatabaseOutlined /> Sao lưu & phục hồi
              </span>
            ),
            children: <BackupTab />,
          },
        ]}
      />
    </div>
  );
}
