import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Button,
  Space,
  Typography,
  Input,
  Table,
  DatePicker,
  Popconfirm,
  Row,
  Col,
  Tag,
  Tooltip,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  KeyOutlined,
  UploadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { chartService } from '../../services/chartService';
import type { S63Permit } from '../../services/chartService';
import toast from '../../components/ToastNotification';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { usePermissionStore } from '../../store/permissionStore';

export default function S63PermitsPage() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [permits, setPermits] = useState<S63Permit[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchPermits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chartService.getAllPermits();
      setPermits(data);
    } catch {
      toast.error('Không thể tải danh sách giấy phép S-63');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPermits();
  }, [fetchPermits]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      const payload = {
        cellName: values.cellName,
        permitKey: values.permitKey,
        expiryDate: values.expiryDate.format('YYYY-MM-DD'),
      };

      await chartService.registerPermit(payload);
      toast.success('Đã đăng ký giấy phép S-63 thành công');
      form.resetFields();
      void fetchPermits();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setSubmitting(false);
    }
  }, [form, fetchPermits]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await chartService.deletePermit(id);
      toast.success('Đã xóa giấy phép');
      void fetchPermits();
    } catch {
      toast.error('Xóa giấy phép thất bại');
    }
  }, [fetchPermits]);

  const handlePermitTxtUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // Simple parser for PERMIT.TXT content
      // Typical line format: cellName,permitKey,expiryDate or hex keys
      const lines = text.split('\n');
      let count = 0;
      for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('#') || cleanLine.isEmpty()) continue;

        const parts = cleanLine.split(',');
        if (parts.length >= 2) {
          const cellName = parts[0].trim().toUpperCase();
          const permitKey = parts[1].trim();
          // Auto fill fields
          form.setFieldsValue({
            cellName,
            permitKey,
            expiryDate: dayjs().plusYears(1),
          });
          count++;
          break; // fill the first matching entry
        }
      }
      if (count > 0) {
        toast.success(`Đã đọc được thông tin giấy phép S-63 từ file`);
      } else {
        toast.warning('Không tìm thấy thông tin giấy phép hợp lệ trong file');
      }
    };
    reader.readAsText(file);
    return false; // prevent upload post
  };

  const columns = [
    {
      title: '#',
      width: 60,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: 'Tên Cell',
      dataIndex: 'cellName',
      width: 150,
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: 'Khóa Permit Key',
      dataIndex: 'permitKey',
      ellipsis: true,
      render: (key: string) => (
        <Tooltip title={key}>
          <code>{key}</code>
        </Tooltip>
      ),
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'expiryDate',
      width: 150,
      render: (date: string) => {
        const isExpired = dayjs(date).isBefore(dayjs());
        return (
          <Tag color={isExpired ? 'red' : 'green'}>
            <CalendarOutlined /> {dayjs(date).format('DD/MM/YYYY')}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      width: 120,
      render: (active: boolean, record: S63Permit) => {
        const isExpired = dayjs(record.expiryDate).isBefore(dayjs());
        if (isExpired) return <Tag color="red">Đã hết hạn</Tag>;
        return active ? <Tag color="success">Đang hiệu lực</Tag> : <Tag color="warning">Vô hiệu hóa</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_: any, record: S63Permit) => (
        <Space size="small">
          {hasPerm('gis.layer.delete') && (
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa giấy phép cho cell "${record.cellName}"?`}
              okText="Xóa"
              okType="danger"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record.id)}
            >
              <Tooltip title="Xóa">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0px' }}>
      <Card style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          <KeyOutlined style={{ marginRight: 8, color: '#1890ff' }} /> Quản lý giấy phép mã hóa hải đồ S-63
        </Typography.Title>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Đăng ký Permit mới" extra={
            <Upload beforeUpload={handlePermitTxtUpload} showUploadList={false}>
              <Button size="small" icon={<UploadOutlined />}>Đọc PERMIT.TXT</Button>
            </Upload>
          }>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="cellName"
                label="Tên Cell hải đồ"
                rules={[
                  { required: true, message: 'Nhập tên Cell (Ví dụ: VN412001)' },
                  { pattern: /^[a-zA-Z0-9]{8}$/, message: 'Tên Cell phải đúng 8 ký tự chữ và số' }
                ]}
              >
                <Input placeholder="Ví dụ: VN412001" style={{ textTransform: 'uppercase' }} />
              </Form.Item>

              <Form.Item
                name="permitKey"
                label="Permit Key (Blowfish key)"
                rules={[{ required: true, message: 'Nhập khóa permit key giải mã' }]}
              >
                <Input.TextArea rows={3} placeholder="Mã khóa hex giải mã hoặc token giấy phép" />
              </Form.Item>

              <Form.Item
                name="expiryDate"
                label="Ngày hết hạn"
                rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusOutlined />}
                  loading={submitting}
                  style={{ width: '100%' }}
                >
                  Đăng ký Giấy phép
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Danh sách giấy phép S-63 đã lưu">
            {loading && <LoadingSkeleton rows={6} type="table" />}
            {!loading && permits.length === 0 && (
              <EmptyState description="Chưa có giấy phép S-63 nào được đăng ký. Hãy tạo mới hoặc đọc từ file PERMIT.TXT." />
            )}
            {!loading && permits.length > 0 && (
              <Table
                dataSource={permits}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 8 }}
                size="middle"
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
