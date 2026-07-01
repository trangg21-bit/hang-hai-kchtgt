import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Select,
  Input,
  DatePicker,
  Button,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { beaconHistory } from '../../services/beaconService';
import type {
  BeaconType,
  BeaconHistoryActionType,
  BeaconHistoryResponse,
} from '../../types/beacon';
import {
  BEACON_HISTORY_ACTION_MAP,
  type BeaconHistoryFilters,
} from '../../types/beacon';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

const FIELD_TRANSLATIONS: Record<string, string> = {
  name: 'Tên',
  code: 'Mã',
  type: 'Loại báo hiệu',
  longitude: 'Kinh độ',
  latitude: 'Vĩ độ',
  lightRange: 'Bán kính chiếu sáng',
  lightColor: 'Màu ánh sáng',
  lightCharacteristic: 'Đặc tính ánh sáng',
  range: 'Bán kính hoạt động',
  description: 'Mô tả',
  isActive: 'Trạng thái hoạt động',
  status: 'Trạng thái duyệt',
  lastMaintenanceDate: 'Ngày bảo trì gần nhất',
  nextMaintenanceDate: 'Ngày bảo trì kế tiếp',
  lastInspectionDate: 'Ngày kiểm tra gần nhất',
  nextInspectionDate: 'Ngày kiểm tra kế tiếp',
  color: 'Màu sắc',
  shape: 'Hình dạng',
};

const VALUE_TRANSLATIONS: Record<string, string> = {
  // BeaconLightType
  LIGHTHOUSE: 'Hải đăng',
  BEACON_LIGHT: 'Đèn biển',
  BEACON_MARK: 'Tiêu dẫn đường',

  // BuoyType
  CARDINAL: 'Phao giới hạn hai bên',
  SECTOR: 'Phao phân luồng',
  SPECIAL: 'Phao chuyên dùng',
  SAFE_WATER: 'Phao vùng nước an toàn',
  ISOLATED_DANGER: 'Phao chướng ngại vật cô lập',

  // BeaconStatus
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt L1',
  APPROVED_L1: 'Chờ duyệt L2',
  APPROVED_L2: 'Đã duyệt L2',
  PUBLISHED: 'Đã công bố',
  REJECTED: 'Từ chối',
  DELETED: 'Đã xóa',
};

const BEACON_TYPE_OPTIONS: { value: BeaconType; label: string }[] = [
  { value: 'BEACON_LIGHT', label: 'Đèn biển' },
  { value: 'BUOY', label: 'Phao tiêu' },
];

const ACTION_TYPE_OPTIONS: { value: BeaconHistoryActionType; label: string }[] = [
  { value: 'CREATE', label: 'Tạo mới' },
  { value: 'UPDATE', label: 'Cập nhật' },
  { value: 'APPROVE_L1', label: 'Phê duyệt L1' },
  { value: 'APPROVE_L2', label: 'Phê duyệt L2' },
  { value: 'REJECT', label: 'Từ chối' },
  { value: 'SOFT_DELETE', label: 'Xóa mềm' },
];

export default function BeaconHistoryList() {
  const [searchParams] = useSearchParams();
  const paramEntityId = searchParams.get('entityId') || '';
  const paramType = searchParams.get('type') as BeaconType || 'BEACON_LIGHT';

  const [beaconType, setBeaconType] = useState<BeaconType>(paramType);
  const [entityId, setEntityId] = useState(paramEntityId);
  const [entityCode, setEntityCode] = useState('');
  const [actionType, setActionType] = useState<BeaconHistoryActionType | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [fromStr, setFromStr] = useState('');
  const [toStr, setToStr] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<BeaconHistoryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const params: BeaconHistoryFilters = {
        type: beaconType,
        entityId: entityId.trim() || undefined,
        entityCode: entityCode.trim() || undefined,
        actionType,
        from: fromStr || undefined,
        to: toStr || undefined,
        page,
        size: pageSize,
      };
      const res = await beaconHistory.getHistory(params);
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải lịch sử'));
    } finally {
      setIsLoading(false);
    }
  }, [beaconType, entityId, entityCode, actionType, fromStr, toStr, page, pageSize]);

  const handleSearch = useCallback(() => {
    setPage(1);
    fetchData();
  }, [fetchData]);

  const handleDateChange = useCallback((dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      setFromStr(dates[0].toISOString());
      setToStr(dates[1].add(1, 'day').toISOString()); // include end of day
    } else {
      setFromStr('');
      setToStr('');
    }
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [beaconType, actionType]);

  // Automatically fetch data on mount or when page/params change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderValue = (val?: string, record?: BeaconHistoryResponse) => {
    if (!val) return '—';
    if (!val.trim().startsWith('{') || !val.trim().endsWith('}')) {
      return VALUE_TRANSLATIONS[val] || val;
    }
    try {
      const obj = JSON.parse(val);
      if (record?.changedField) {
        const fields = record.changedField.split(',').map(f => f.trim());
        const list = fields.map(f => {
          const itemVal = obj[f];
          if (itemVal === undefined || itemVal === null) return null;
          let displayVal = itemVal;
          if (typeof itemVal === 'boolean') {
            displayVal = itemVal ? 'Hoạt động' : 'Ngừng hoạt động';
          } else if (typeof itemVal === 'string' && VALUE_TRANSLATIONS[itemVal]) {
            displayVal = VALUE_TRANSLATIONS[itemVal];
          }
          const keyLabel = FIELD_TRANSLATIONS[f] || f;
          return `${keyLabel}: ${displayVal}`;
        }).filter(Boolean);

        if (list.length > 0) {
          return list.join('; ');
        }
      }
      const name = obj.name || '';
      const code = obj.code || '';
      return name ? `${name} (${code})` : val;
    } catch {
      return val;
    }
  };

  const columns = [
    { title: '#', width: 60, render: (_: unknown, __: BeaconHistoryResponse, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Loại',
      dataIndex: 'beaconType',
      width: 140,
      render: (type: BeaconType) => {
        const label = BEACON_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
        return <Tag color="blue">{label}</Tag>;
      },
    },
    {
      title: 'Hành động',
      dataIndex: 'actionType',
      width: 140,
      render: (action: BeaconHistoryActionType) => {
        const m = BEACON_HISTORY_ACTION_MAP[action];
        return m ? <Tag color={m.color}>{m.label}</Tag> : <Tag>{action}</Tag>;
      },
    },
    {
      title: 'Trường thay đổi',
      dataIndex: 'changedField',
      width: 160,
      render: (field?: string) => {
        if (!field) return '—';
        return field.split(',').map(f => FIELD_TRANSLATIONS[f.trim()] || f.trim()).join(', ');
      },
    },
    {
      title: 'Giá trị cũ',
      dataIndex: 'previousValue',
      ellipsis: true,
      render: (val: string | undefined, record: BeaconHistoryResponse) => renderValue(val, record),
    },
    {
      title: 'Giá trị mới',
      dataIndex: 'newValue',
      ellipsis: true,
      render: (val: string | undefined, record: BeaconHistoryResponse) => renderValue(val, record),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'changedByName',
      width: 200,
      render: (name?: string, record?: BeaconHistoryResponse) => name || (record?.changedBy ? `#${record.changedBy}` : '—'),
    },
    {
      title: 'Thời gian',
      dataIndex: 'changedAt',
      width: 180,
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm:ss') : '—',
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Space wrap>
              <Select
                placeholder="Loại báo hiệu"
                style={{ width: 180 }}
                value={beaconType}
                onChange={(val) => setBeaconType(val)}
                options={BEACON_TYPE_OPTIONS}
              />
              <Input
                placeholder="Lọc theo mã đối tượng"
                allowClear
                style={{ width: 200 }}
                value={entityCode}
                onChange={(e) => setEntityCode(e.target.value)}
              />
              <DatePicker.RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                style={{ width: 260 }}
                value={dateRange}
                onChange={handleDateChange}
              />
              <Select
                placeholder="Loại hành động"
                allowClear
                style={{ width: 180 }}
                value={actionType}
                onChange={(val) => setActionType(val)}
                options={ACTION_TYPE_OPTIONS}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Tra cứu
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Tooltip title="Tải lại">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleSearch}
              />
            </Tooltip>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải lịch sử thay đổi'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description="Không tìm thấy lịch sử thay đổi"
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<BeaconHistoryResponse>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p: number, sz?: number) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t: number) => `Tổng ${t} bản ghi lịch sử`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
