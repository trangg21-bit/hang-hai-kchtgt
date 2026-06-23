import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  Tag,
  Collapse,
  ColorPicker,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Hoạt động' },
  inactive: { color: 'default', label: 'Không hoạt động' },
  deprecated: { color: 'red', label: 'Ngừng sử dụng' },
};

export default function SymbolPreview() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [symbol, setSymbol] = useState<Symbol | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const data = await symbolService.getById(id);
        setSymbol(data);
      } catch (err: unknown) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Không thể tải thông tin biểu tượng'));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) return <LoadingSkeleton rows={12} type="form" />;
  if (isError) return <ErrorState message={error?.message} onRetry={() => navigate('/symbols')} />;
  if (!symbol) return <EmptyState description="Biểu tượng không tồn tại" />;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/symbols')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>Xem trước biểu tượng</Typography.Title>
        </Space>
      </Card>

      {/* Preview Card */}
      <Card style={{ textAlign: 'center', marginBottom: 16, maxWidth: 500, marginInline: 'auto' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{symbol.name}</Typography.Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Tag color="cyan" style={{ fontSize: 18, padding: '4px 16px' }}>{symbol.code}</Tag>
          {symbol.value && <Tag style={{ fontSize: 18, padding: '4px 16px' }}>{symbol.value}</Tag>}
          {symbol.color && (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: symbol.color,
                margin: '16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 20,
              }}
            >
              {symbol.value || symbol.code}
            </div>
          )}
        </Space>
      </Card>

      {/* Details */}
      <Card style={{ maxWidth: 700, marginInline: 'auto' }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Mã ký hiệu">{symbol.code}</Descriptions.Item>
          <Descriptions.Item label="Giá trị">{symbol.value || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tên">{symbol.name}</Descriptions.Item>
          <Descriptions.Item label="Danh mục">
            <Tag>{symbol.category}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Màu sắc" span={2}>
            <Space>
              {symbol.color && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: symbol.color,
                    border: '1px solid #d9d9d9',
                  }}
                />
              )}
              <Typography.Text>{symbol.color || '—'}</Typography.Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={2}>
            {(() => {
              const s = STATUS_MAP[symbol.status] || { color: 'default', label: symbol.status };
              return <Tag color={s.color}>{s.label}</Tag>;
            })()}
          </Descriptions.Item>
          {symbol.description && (
            <Descriptions.Item label="Mô tả" span={2}>{symbol.description}</Descriptions.Item>
          )}
          {symbol.icon && (
            <Descriptions.Item label="Icon" span={2}>{symbol.icon}</Descriptions.Item>
          )}
          <Descriptions.Item label="Tạo bởi">{symbol.createdBy}</Descriptions.Item>
          <Descriptions.Item label="Tạo lúc">{dayjs(symbol.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="Cập nhật lúc">{dayjs(symbol.updatedAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 16, maxWidth: 700, marginInline: 'auto' }}>
        <Button type="primary" onClick={() => navigate('/symbols')}>
          Quay lại danh sách
        </Button>
      </Card>
    </>
  );
}
