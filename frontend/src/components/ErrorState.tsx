import { Result, Button, Space } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
}

export default function ErrorState({
  title = 'Đã xảy ra lỗi',
  message = 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
  onRetry,
  showHome = false,
}: Props) {
  const navigate = useNavigate();

  return (
    <Result
      status="error"
      title={title}
      subTitle={message}
      extra={
        <Space>
          {onRetry && (
            <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
              Thử lại
            </Button>
          )}
          {showHome && (
            <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
          )}
        </Space>
      }
    />
  );
}
