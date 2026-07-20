import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Table,
  Button,
  Card,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  fetchInmarsatList,
  createInmarsat,
  updateInmarsat,
  deleteInmarsat,
} from '../../services/station/api';
import type { CoastalStationInmarsatResponse, CoastalStationInmarsatRequest } from '../../services/station/types';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';

export default function SpecialStationList() {
  const [dataSource, setDataSource] = useState<CoastalStationInmarsatResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CoastalStationInmarsatResponse | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [form] = Form.useForm();
  
  const [searchParams] = useSearchParams();
  const isIframeModal = (window.self !== window.top) && searchParams.has('action');

  const action = searchParams.get('action');
  const id = searchParams.get('id');

  useEffect(() => {
    if (id && (action === 'detail' || action === 'edit')) {
      (async () => {
        try {
          setLoading(true);
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await api.get(`/v1/stations/inmarsat/${id}`).then(r => r.data);
          setIsReadOnly(action === 'detail');
          
          const formatted = {
            ...data,
            deviceCode: data.deviceCode || data.code,
            stationName: data.stationName || data.name,
          };
          
          handleOpenModal(formatted);
        } catch (err: any) {
          message.error(err.message || 'Lỗi khi tải thông tin chi tiết đài vệ tinh');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [action, id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInmarsatList({
        page: page - 1,
        size: pageSize,
        keyword: searchText ? searchText.trim() : undefined,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách đài vệ tinh Inmarsat');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText]);

  useEffect(() => {
    if (isIframeModal) return;
    loadData();
  }, [loadData, isIframeModal]);

  const handleOpenModal = (record?: CoastalStationInmarsatResponse) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        deviceCode: record.deviceCode,
        stationName: record.stationName,
        latitude: record.latitude,
        longitude: record.longitude,
        modemType: record.modemType,
        frequency: record.frequency,
        coverageZone: record.coverageZone,
        sarCode: record.sarCode,
        locationAddress: record.locationAddress,
        contactPerson: record.contactPerson,
        contactPhone: record.contactPhone,
      });
    } else {
      setEditingItem(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: CoastalStationInmarsatRequest = {
        status: editingItem?.status || 'ACTIVE',
        ...values,
      };

      if (editingItem) {
        const res = await updateInmarsat(editingItem.id, payload);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[editingItem.id] = res;
        }
        message.success('Cập nhật đài Inmarsat thành công!');
      } else {
        await createInmarsat(payload);
        message.success('Tạo mới đài Inmarsat thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu thông tin đài vệ tinh');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInmarsat(id);
      message.success('Xóa đài vệ tinh thành công!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa đài');
    }
  };

  const columns = [
    {
      title: 'Mã thiết bị',
      dataIndex: 'deviceCode',
      key: 'deviceCode',
    },
    {
      title: 'Tên đài Inmarsat',
      dataIndex: 'stationName',
      key: 'stationName',
    },
    {
      title: 'Vĩ độ',
      dataIndex: 'latitude',
      key: 'latitude',
    },
    {
      title: 'Kinh độ',
      dataIndex: 'longitude',
      key: 'longitude',
    },
    {
      title: 'Loại Modem',
      dataIndex: 'modemType',
      key: 'modemType',
    },
    {
      title: 'Tần số',
      dataIndex: 'frequency',
      key: 'frequency',
    },
    {
      title: 'Vùng phủ sóng',
      dataIndex: 'coverageZone',
      key: 'coverageZone',
    },
    {
      title: 'Mã nhận dạng SAR',
      dataIndex: 'sarCode',
      key: 'sarCode',
    },
    {
      title: 'Địa chỉ lắp đặt',
      dataIndex: 'locationAddress',
      key: 'locationAddress',
    },
    {
      title: 'Người phụ trách',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'success' : 'warning'}>
          {status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: CoastalStationInmarsatResponse) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa đài Inmarsat này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản lý trạm thông tin vệ tinh Inmarsat"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Thêm đài Inmarsat
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm kiếm theo mã đài, tên đài..."
          allowClear
          onSearch={(value) => {
            setSearchText(value);
            setPage(1);
          }}
          style={{ width: 300 }}
        />
      </div>

      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
          },
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
        }}
      />

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isReadOnly ? 'Chi tiết đài vệ tinh' : (editingItem ? 'Chỉnh sửa đài vệ tinh' : 'Thêm mới đài vệ tinh Inmarsat')}</span>}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        footer={isReadOnly ? [
          <Button key="close" type="primary" onClick={handleCancel}>Đóng</Button>
        ] : undefined}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} disabled={isReadOnly}>
          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="deviceCode"
              label="Mã thiết bị"
              rules={[{ required: true, message: 'Vui lòng nhập mã thiết bị' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="Ví dụ: IM-HAIPHONG-01" />
            </Form.Item>

            <Form.Item
              name="stationName"
              label="Tên đài Inmarsat"
              rules={[{ required: true, message: 'Vui lòng nhập tên đài' }]}
              style={{ width: 300 }}
            >
              <Input placeholder="Nhập tên đài vệ tinh..." />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="latitude"
              label="Vĩ độ (Lat)"
              rules={[{ required: true, message: 'Vui lòng nhập vĩ độ' }]}
              style={{ width: 300 }}
            >
              <InputNumber
                min={-90}
                max={90}
                precision={6}
                style={{ width: '100%' }}
                placeholder="Ví dụ: 20.8415"
              />
            </Form.Item>

            <Form.Item
              name="longitude"
              label="Kinh độ (Long)"
              rules={[{ required: true, message: 'Vui lòng nhập kinh độ' }]}
              style={{ width: 300 }}
            >
              <InputNumber
                min={-180}
                max={180}
                precision={6}
                style={{ width: '100%' }}
                placeholder="Ví dụ: 106.6912"
              />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="modemType"
              label="Loại Modem Inmarsat"
              style={{ width: 300 }}
            >
              <Input placeholder="Ví dụ: Inmarsat-C, FleetBroadband..." />
            </Form.Item>

            <Form.Item
              name="frequency"
              label="Tần số liên lạc"
              style={{ width: 300 }}
            >
              <Input placeholder="Ví dụ: 1.6 GHz, 1.5 GHz..." />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="coverageZone"
              label="Vùng phủ sóng"
              style={{ width: 300 }}
            >
              <Input placeholder="Ví dụ: AOR-E, IOR, POR..." />
            </Form.Item>

            <Form.Item
              name="sarCode"
              label="Mã nhận dạng cứu nạn (SAR Code)"
              style={{ width: 300 }}
            >
              <Input placeholder="Ví dụ: 445701110..." />
            </Form.Item>
          </Space>

          <Form.Item name="locationAddress" label="Địa chỉ lắp đặt đài">
            <Input placeholder="Nhập địa chỉ vị trí đài..." />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item name="contactPerson" label="Người phụ trách trạm" style={{ width: 300 }}>
              <Input placeholder="Nhập họ tên..." />
            </Form.Item>

            <Form.Item name="contactPhone" label="Số điện thoại liên hệ" style={{ width: 300 }}>
              <Input placeholder="Nhập số điện thoại..." />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
