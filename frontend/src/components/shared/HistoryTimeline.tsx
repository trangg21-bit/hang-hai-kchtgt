import { Timeline, Empty, Spin, Alert, Button } from 'antd';
import dayjs from 'dayjs';

interface HistoryEntry {
  id: number;
  trangThai?: string;
  nguoiPheDuyet?: string;
  ngayPheDuyet?: string;
  lyDo?: string;
}

interface HistoryTimelineProps {
  history: HistoryEntry[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  PROPOSED: 'gray',
  UNDER_REVIEW: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

export default function HistoryTimeline({ history, loading, error, onRetry }: HistoryTimelineProps) {
  if (loading) {
    return <Spin tip="Đang tải lịch sử..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Không tải được lịch sử"
        description={error}
        showIcon
        action={
          onRetry && <Button size="small" onClick={onRetry}>
            Thử lại
          </Button>
        }
      />
    );
  }

  if (!history || history.length === 0) {
    return <Empty description="Chưa có lịch sử phê duyệt" />;
  }

  const items = history.map((entry) => {
    const statusColor = STATUS_COLOR_MAP[entry.trangThai || ''] || 'gray';
    const formattedDate = entry.ngayPheDuyet
      ? dayjs(entry.ngayPheDuyet).format('DD/MM/YYYY HH:mm')
      : 'N/A';

    return {
      dot: <div style={{ width: '12px', height: '12px', backgroundColor: statusColor, borderRadius: '50%' }} />,
      children: (
        <>
          <p style={{ marginBottom: '4px', fontWeight: 500 }}>
            {entry.trangThai} — {entry.nguoiPheDuyet} — {formattedDate}
          </p>
          {entry.lyDo && <p style={{ marginBottom: 0, color: '#666' }}>{entry.lyDo}</p>}
        </>
      ),
    };
  });

  return <Timeline items={items} />;
}
