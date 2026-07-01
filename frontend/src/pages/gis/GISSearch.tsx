import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Table,
  Tag,
  Tooltip,
  Row,
  Col,
  List,
  Divider,
  InputNumber,
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  HistoryOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { gisSearchService } from '../../services/gisSearchService';
import type {
  GisSearchRequest,
  SearchHistoryItem,
  SearchResultItem,
} from '../../types/gisSearch';
import { SEARCH_TYPE_OPTIONS } from '../../types/gisSearch';
import toast from '../../components/ToastNotification';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import FormField from '../../components/FormField';

const { RangePicker } = DatePicker;

const QUERY_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Văn bản',
  LOCATION: 'Vị trí',
  RADIUS: 'Bán kính',
  POLYGON: 'Đa giác',
  COORDINATE: 'Tọa độ',
};

export default function GISSearch() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await gisSearchService.getHistory(20);
      setHistory(data);
    } catch {
      // silent fail
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleClearHistory = useCallback(async () => {
    try {
      await gisSearchService.clearHistory();
      setHistory([]);
      toast.success('Đã xóa lịch sử tìm kiếm');
    } catch {
      toast.error('Xóa lịch sử thất bại');
    }
  }, []);

  const handleSearch = useCallback(async () => {
    try {
      const values = await form.validateFields();

      const request: GisSearchRequest = {
        query: values.query || undefined,
        queryType: values.queryType,
        centerLon: values.centerLon,
        centerLat: values.centerLat,
        radius: values.radius,
        coordinates: values.coordinates,
        layerTypes: values.layerTypes,
        page: values.page || 0,
        size: values.size || 20,
      };

      setSearching(true);
      const response = await gisSearchService.search(request);
      setResults(response.results || []);
      setTotalResults(response.totalResults);
      setDurationMs(response.durationMs);
      void loadHistory();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Tìm kiếm thất bại');
    } finally {
      setSearching(false);
    }
  }, [form, loadHistory]);

  const handleHistoryClick = useCallback((item: SearchHistoryItem) => {
    form.setFieldsValue({
      query: item.queryText,
      queryType: item.queryType,
    });
    void handleSearch();
  }, [form, handleSearch]);

  const resultColumns: ColumnsType<SearchResultItem> = [
    {
      title: 'Đối tượng',
      dataIndex: 'name',
      ellipsis: true,
      render: (text: string, record: SearchResultItem) => (
        <Space>
          <Typography.Text strong>{text}</Typography.Text>
          <Tag color="blue">{record.objectType}</Tag>
        </Space>
      ),
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 180,
      render: (code: string) => (
        <Tooltip title={code}>
          <Tag
            color="cyan"
            style={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              verticalAlign: 'bottom',
            }}
          >
            {code}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Layer',
      dataIndex: 'layerType',
      width: 120,
      render: (text?: string) => text ? <Tag>{text}</Tag> : '—',
    },
    {
      title: 'Khoảng cách',
      dataIndex: 'distance',
      width: 120,
      render: (v?: number) => v != null ? `${v.toFixed(1)}m` : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: SearchResultItem) => {
        let path = '';
        if (record.objectType === 'POINT') path = `/gis/points/${record.objectId}`;
        else if (record.objectType === 'LINE') path = `/gis/lines/${record.objectId}`;
        else if (record.objectType === 'POLYGON') path = `/gis/polygons/${record.objectId}`;
        
        return path ? (
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(path)}
            />
          </Tooltip>
        ) : '—';
      },
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: '0 0 16px 0' }}>
          <SearchOutlined /> Tra cứu GIS
        </Typography.Title>

        <Form form={form} layout="vertical" onFinish={handleSearch} initialValues={{ queryType: 'TEXT', size: 20 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <FormField
                type="select"
                name="queryType"
                label="Loại tìm kiếm"
                required
                options={SEARCH_TYPE_OPTIONS}
              />
            </Col>
            <Col xs={24} md={18}>
              <Form.Item name="query" label="Từ khóa" rules={[{ required: true, message: 'Vui lòng nhập từ khóa' }]}>
                <Input
                  placeholder="Nhập từ khóa tìm kiếm..."
                  allowClear
                  size="large"
                  onPressEnter={handleSearch}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Optional location fields */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <FormField
                type="number"
                name="centerLat"
                label="Vĩ độ tâm (centerLat)"
                min={-90}
                max={90}
                step={0.0001}
                placeholder="20.85"
                help="Dùng cho LOCATION, RADIUS, COORDINATE"
              />
            </Col>
            <Col xs={24} md={8}>
              <FormField
                type="number"
                name="centerLon"
                label="Kinh độ tâm (centerLon)"
                min={-180}
                max={180}
                step={0.0001}
                placeholder="106.70"
                help="Dùng cho LOCATION, RADIUS, COORDINATE"
              />
            </Col>
            <Col xs={24} md={8}>
              <FormField
                type="number"
                name="radius"
                label="Bán kính (m)"
                min={50}
                max={10000}
                step={1}
                placeholder="1000"
                help="Dùng cho RADIUS, 50m ~ 10km"
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <FormField
                type="textarea"
                name="coordinates"
                label="Tọa độ / Đa giác (WKT)"
                placeholder="Dùng cho POLYGON, COORDINATE"
              />
            </Col>
            <Col xs={24} md={6}>
              <FormField
                type="text"
                name="layerTypes"
                label="Loại layer"
                placeholder="POINT,LINE"
                help="Phân cách bằng dấu phẩy"
              />
            </Col>
            <Col xs={24} md={6}>
              <Row style={{ display: 'flex', gap: 16 }}>
                <Col style={{ flex: 1 }}>
                  <FormField
                    type="number"
                    name="page"
                    label="Trang"
                    min={0}
                    step={1}
                    defaultValue={0}
                  />
                </Col>
                <Col style={{ flex: 1 }}>
                  <FormField
                    type="number"
                    name="size"
                    label="Số kết quả"
                    min={1}
                    max={100}
                    step={1}
                    defaultValue={20}
                  />
                </Col>
              </Row>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 8 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={searching} icon={<SearchOutlined />} size="large">
                Tìm kiếm
              </Button>
              <Button onClick={() => form.resetFields()} size="large">
                Đặt lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Search Results */}
      {(results.length > 0 || searching) && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]} align="middle" justify="space-between" style={{ marginBottom: 12 }}>
            <Col>
              <Typography.Text strong>Kết quả tìm kiếm</Typography.Text>
              {!searching && (
                <Typography.Text type="secondary" style={{ marginLeft: 12 }}>
                  {totalResults} kết quả • {durationMs}ms
                </Typography.Text>
              )}
            </Col>
          </Row>
          {searching ? (
            <LoadingSkeleton rows={5} type="table" />
          ) : (
            <Table<SearchResultItem>
              columns={resultColumns}
              dataSource={results}
              rowKey="objectId"
              pagination={false}
              scroll={{ y: 300 }}
            />
          )}
        </Card>
      )}

      {/* Search History */}
      <Card>
        <Row gutter={[12, 12]} align="middle" justify="space-between" style={{ marginBottom: 12 }}>
          <Col>
            <Space>
              <HistoryOutlined />
              <Typography.Text strong>Lịch sử tìm kiếm</Typography.Text>
            </Space>
          </Col>
          <Col>
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={handleClearHistory}
              disabled={history.length === 0}
            >
              Xóa lịch sử
            </Button>
          </Col>
        </Row>
        {loadingHistory ? (
          <LoadingSkeleton rows={4} />
        ) : history.length === 0 ? (
          <Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', padding: '20px 0' }}>
            Chưa có lịch sử tìm kiếm
          </Typography.Text>
        ) : (
          <List<SearchHistoryItem>
            dataSource={history}
            loading={loadingHistory}
            locale={{ emptyText: '' }}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => handleHistoryClick(item)}
              >
                <List.Item.Meta
                  avatar={<ClockCircleOutlined style={{ fontSize: 16, color: '#999', marginTop: 4 }} />}
                  title={
                    <Space>
                      <Tag>{QUERY_TYPE_LABELS[item.queryType] || item.queryType}</Tag>
                      <Typography.Text>{item.queryText}</Typography.Text>
                    </Space>
                  }
                  description={
                    <Space size="small">
                      <Typography.Text type="secondary">
                        {dayjs(item.executedAt).format('DD/MM/YYYY HH:mm')}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        • {item.resultCount} kết quả
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        • {item.durationMs}ms
                      </Typography.Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </>
  );
}
