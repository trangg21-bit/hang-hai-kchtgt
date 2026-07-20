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
  InputNumber,
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
import { ScreenHeader } from '../../components/list-view';
import {
  spaceMd, spaceFormField, spaceSm, spaceXs,
  radiusPill, fontSizeMd, fontWeightMedium, fontSizeLg,
  textTertiary, textSecondary, textPrimary,
} from '../../tokens';

const QUERY_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Văn bản',
  LOCATION: 'Vị trí',
  RADIUS: 'Bán kính',
  POLYGON: 'Đa giác',
  COORDINATE: 'Tọa độ',
};

const INPUT_STYLE: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

const SELECT_STYLE: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  width: '100%',
};

const BTN_STYLE: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  fontWeight: fontWeightMedium,
  fontSize: fontSizeMd,
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
      <ScreenHeader
        breadcrumb={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Quản lý KCHT trên nền bản đồ (GIS)' },
          { label: 'Tra cứu thông tin KCHT hàng hải trên bản đồ' },
        ]}
      />

      <Card style={{ marginBottom: spaceMd }}>
        <Typography.Title level={5} style={{ margin: '0 0 16px 0' }}>
          <SearchOutlined /> Tra cứu GIS
        </Typography.Title>

        <Form form={form} layout="vertical" onFinish={handleSearch} initialValues={{ queryType: 'TEXT', size: 20 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Form.Item name="queryType" label="Loại tìm kiếm"
                rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
                style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn loại" options={SEARCH_TYPE_OPTIONS} style={SELECT_STYLE} />
              </Form.Item>
            </Col>
            <Col xs={24} md={18}>
              <Form.Item name="query" label="Từ khóa"
                rules={[{ required: true, message: 'Vui lòng nhập từ khóa' }]}
                style={{ marginBottom: spaceFormField }}>
                <Input
                  placeholder="Nhập từ khóa tìm kiếm..."
                  allowClear
                  onPressEnter={handleSearch}
                  style={INPUT_STYLE}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item name="centerLat" label="Vĩ độ tâm (centerLat)"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="20.85" min={-90} max={90} step={0.0001}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="centerLon" label="Kinh độ tâm (centerLon)"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="106.70" min={-180} max={180} step={0.0001}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="radius" label="Bán kính (m)"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="1000" min={50} max={10000} step={1}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="coordinates" label="Tọa độ / Đa giác (WKT)"
                style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Dùng cho POLYGON, COORDINATE" style={INPUT_STYLE} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="layerTypes" label="Loại layer"
                style={{ marginBottom: spaceFormField }}>
                <Input placeholder="POINT,LINE" style={INPUT_STYLE} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Row gutter={spaceMd}>
                <Col span={12}>
                  <Form.Item name="page" label="Trang"
                    style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={0} step={1} placeholder="0"
                      style={{ ...INPUT_STYLE, width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="size" label="Số kết quả"
                    style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={1} max={100} step={1} placeholder="20"
                      style={{ ...INPUT_STYLE, width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: spaceSm }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={searching} icon={<SearchOutlined />}
                style={BTN_STYLE}>
                Tìm kiếm
              </Button>
              <Button onClick={() => form.resetFields()}
                style={{ ...BTN_STYLE, borderColor: textSecondary, color: textSecondary }}>
                Đặt lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Search Results */}
      {(results.length > 0 || searching) && (
        <Card style={{ marginBottom: spaceMd }}>
          <Row gutter={[spaceFormField, spaceFormField]} align="middle" justify="space-between" style={{ marginBottom: spaceFormField }}>
            <Col>
              <Typography.Text strong>Kết quả tìm kiếm</Typography.Text>
              {!searching && (
                <Typography.Text type="secondary" style={{ marginLeft: spaceFormField }}>
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
        <Row gutter={[spaceFormField, spaceFormField]} align="middle" justify="space-between" style={{ marginBottom: spaceFormField }}>
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
              style={{ borderRadius: radiusPill }}
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
                  avatar={<ClockCircleOutlined style={{ fontSize: fontSizeLg, color: textTertiary, marginTop: spaceXs }} />}
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
