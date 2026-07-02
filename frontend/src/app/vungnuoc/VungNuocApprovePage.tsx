import { Button, Space, Card, Modal, Input, Descriptions, Checkbox } from 'antd';
import type { VungNuoc } from './types';

export interface VungNuocApprovalModalProps {
  open: boolean;
  data: VungNuoc;
  mode: 'approve' | 'reject';
  onModeChange: (mode: 'approve' | 'reject') => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * VungNuocApprovalModal — approve/reject dialog per spec 05-approve-ui-spec.md.
 *
 * Structure:
 *   ModalHeader (title + subtitle)
 *   ApprovalSummaryCard (read-only entity info)
 *   TabSwitcher (Phê duyệt / Từ chối)
 *   ApprovalForm (reason textarea on Reject, confirm checkbox)
 *   ModalFooter (Cancel, Confirm)
 */
export default function VungNuocApprovalModal({
  open,
  data,
  mode,
  onModeChange,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}: VungNuocApprovalModalProps) {
  return (
    <Modal
      open={open}
      title="Phê duyệt Vùng nước"
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          disabled={mode === 'reject' && reason.length < 10}
          onClick={onConfirm}
        >
          Xác nhận
        </Button>,
      ]}
      centered
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Typography.Text>
          {data.maVungNuoc} — {data.tenVungNuoc}
        </Typography.Text>

        {/* ApprovalSummaryCard */}
        <Card size="small" title="Thông tin">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã">{data.maVungNuoc}</Descriptions.Item>
            <Descriptions.Item label="Tên">{data.tenVungNuoc}</Descriptions.Item>
            <Descriptions.Item label="Diện tích">{data.dienTich?.toFixed(2) || '—'} m²</Descriptions.Item>
            <Descriptions.Item label="Độ sâu tối đa">{data.doSauMax?.toFixed(2) || '—'} m</Descriptions.Item>
            <Descriptions.Item label="Độ sâu trung bình">{data.doSauTrungBinh?.toFixed(2) || '—'} m</Descriptions.Item>
            <Descriptions.Item label="Loại">{data.loaiVungNuoc || '—'}</Descriptions.Item>
            <Descriptions.Item label="Người tạo">{data.createdBy}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{new Date(data.createdAt).toLocaleString('vi-VN')}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* TabSwitcher */}
        <Space>
          <Button
            type={mode === 'approve' ? 'primary' : 'default'}
            onClick={() => onModeChange('approve')}
          >
            ✅ Phê duyệt
          </Button>
          <Button
            type={mode === 'reject' ? 'primary' : 'default'}
            onClick={() => onModeChange('reject')}
          >
            ❌ Từ chối
          </Button>
        </Space>

        {/* ApprovalForm */}
        {mode === 'approve' && (
          <Checkbox checked={true} disabled>
            Tôi xác nhận hành động này
          </Checkbox>
        )}

        {mode === 'reject' && (
          <>
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onReasonChange(e.target.value)}
            />
            <Checkbox checked={true} disabled>
              Tôi xác nhận hành động này
            </Checkbox>
          </>
        )}
      </Space>
    </Modal>
  );
}
