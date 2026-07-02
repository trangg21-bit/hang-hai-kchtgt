import { useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Button,
  Typography,
  Row,
  Col,
  Divider,
  Radio,
  Input,
  Checkbox,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { CangCan } from './types';
import { TRANG_THAI_HOAT_DONG_MAP, TRANG_THAI_PHE_DUYET_MAP } from './types';
import { approveCangCan, rejectCangCan } from './api';

interface CangCanApprovePageProps {
  open: boolean;
  data: CangCan | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function CangCanApprovePage({
  open,
  data,
  onClose,
  onRefresh,
}: CangCanApprovePageProps) {
  const [form] = Form.useForm();
  const [tab, setTab] = useState<'approve' | 'reject'>('approve');
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!data) return;

    const values = await form.validateFields();

    if (tab === 'approve') {
      try {
        setLoading(true);
        await approveCangCan(data.id);
        Modal.success({
          title: 'Phê duyệt thành công',
          content: `Cảng cạn "${data.maCangCan}" đã được phê duyệt.`,
          onOk: () => { onClose(); onRefresh(); },
        });
      } catch (err: unknown) {
        Modal.error({
          title: 'Phê duyệt thất bại',
          content: err instanceof Error ? err.message : 'Có lỗi xảy ra',
        });
      } finally {
        setLoading(false);
      }
    } else {
      if (!values.reason || values.reason.length < 10) {
        form.setFields([
          { name: 'reason', errors: ['Lý do từ chối tối thiểu 10 ký tự'] },
        ]);
        return;
      }
      try {
        setLoading(true);
        await rejectCangCan(data.id, values.reason);
        Modal.success({
          title: 'Từ chối thành công',
          content: `Cảng cạn "${data.maCangCan}" đã bị từ chối.`,
          onOk: () => { onClose(); onRefresh(); },
        });
      } catch (err: unknown) {
        Modal.error({
          title: 'Từ chối thất bại',
          content: err instanceof Error ? err.message : 'Có lỗi xảy ra',
        });
      } finally {
        setLoading(false);
      }
    }
  }, [data, tab, form, onClose, onRefresh]);

  const isFormValid = () => {
    if (tab === 'approve') {
      const confirmed = Form.useForm?.useWatch('confirmed');
      // We'll check via onValuesChange instead
      return !!form.getFieldValue('confirmed');
    } else {
      const reason = form.getFieldValue('reason');
      const confirmed = form.getFieldValue('confirmed');
      return (reason?.length ?? 0) >= 10 && confirmed === true;
    }
  };

  if (!data) return null;

  return (
    <Modal
      open={open}
      title={null}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      destroyOnClose
    >
      {/* Header */}
      <Typography.Title level={5} style={{ margin: '0 0 8px' }}>
        Phê duyệt Cảng cạn
      </Typography.Title>
      <Typography.Text type="secondary">
        {data.maCangCan} — {data.tenCangCan}
      </Typography.Text>

      {/* Summary Card */}
      <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, margin: '16px 0' }}>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Typography.Text type="secondary">Mã cảng cạn</Typography.Text>
            <Typography.Text strong>{data.maCangCan}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Tỉnh/thành phố</Typography.Text>
            <Typography.Text>{data.tinhThanhPho || '—'}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Vĩ độ</Typography.Text>
            <Typography.Text>{data.viDo != null ? data.viDo.toFixed(6) : '—'}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Kinh độ</Typography.Text>
            <Typography.Text>{data.kinhDo != null ? data.kinhDo.toFixed(6) : '—'}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Diện tích</Typography.Text>
            <Typography.Text>{data.dienTich?.toFixed(2) || '—'} m²</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Công suất TEU</Typography.Text>
            <Typography.Text>{data.congSuatTEU != null ? data.congSuatTEU.toFixed(2) : '—'} TEU</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Trạng thái hoạt động</Typography.Text>
            <Typography.Text>
              {TRANG_THAI_HOAT_DONG_MAP[data.trangThaiHoatDong]?.label || data.trangThaiHoatDong}
            </Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Trạng thái phê duyệt</Typography.Text>
            <Typography.Text>
              {TRANG_THAI_PHE_DUYET_MAP[data.trangThaiPheDuyet]?.label || data.trangThaiPheDuyet}
            </Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Người tạo</Typography.Text>
            <Typography.Text>{data.createdBy || '—'}</Typography.Text>
          </Col>
        </Row>
      </div>

      {/* Tab Switcher */}
      <Radio.Group
        value={tab}
        onChange={(e) => { setTab(e.target.value); form.resetFields(); }}
        optionType="button"
        buttonStyle="solid"
        style={{ marginBottom: 16 }}
      >
        <Radio.Button value="approve">
          <CheckCircleOutlined style={{ marginRight: 4 }} /> Phê duyệt
        </Radio.Button>
        <Radio.Button value="reject">
          <CloseCircleOutlined style={{ marginRight: 4 }} /> Từ chối
        </Radio.Button>
      </Radio.Group>

      {/* Form */}
      <Form form={form} layout="vertical">
        {tab === 'reject' && (
          <Form.Item
            name="reason"
            label="Lý do từ chối"
            rules={[
              { required: true, message: 'Lý do từ chối không được để trống' },
              { min: 10, message: 'Lý do từ chối tối thiểu 10 ký tự' },
              { max: 500, message: 'Lý do từ chối tối đa 500 ký tự' },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Nhập lý do từ chối..." />
          </Form.Item>
        )}

        <Form.Item
          name="confirmed"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value === true
                  ? Promise.resolve()
                  : Promise.reject(new Error('Bạn cần xác nhận hành động này')),
            },
          ]}
        >
          <Checkbox>Tôi xác nhận hành động này</Checkbox>
        </Form.Item>

        {tab === 'reject' && (
          <Alert
            message="Hành động này sẽ chuyển trạng thái phê duyệt sang 'Từ chối'"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Divider style={{ margin: '16px 0' }} />

        {/* Footer */}
        <Row justify="end" gutter={8}>
          <Col>
            <Button onClick={onClose}>Hủy</Button>
          </Col>
          <Col>
            <Button
              type="primary"
              htmlType="button"
              loading={loading}
              disabled={!isFormValid()}
              onClick={handleConfirm}
            >
              {tab === 'approve' ? 'Phê duyệt' : 'Từ chối'}
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
