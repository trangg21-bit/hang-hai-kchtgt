import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface Props {
  description?: string;
  ctaText?: string;
  onCta?: () => void;
  image?: React.ReactNode;
}

export default function EmptyState({
  description = 'Chưa có dữ liệu',
  ctaText,
  onCta,
  image,
}: Props) {
  return (
    <Empty
      image={image || Empty.PRESENTED_IMAGE_SIMPLE}
      description={description}
      style={{ padding: '60px 0' }}
    >
      {ctaText && onCta && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onCta}>
          {ctaText}
        </Button>
      )}
    </Empty>
  );
}
