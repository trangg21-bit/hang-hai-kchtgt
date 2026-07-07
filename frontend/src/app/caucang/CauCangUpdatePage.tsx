import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, Divider, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/FormField';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { fetchCauCangById, updateCauCang, fetchBenCangOptions } from './api';

const TRANG_THAI_HOAT_DONG_OPTIONS = [
  { label: 'Hiện hành', value: 'HIEN_HANH' },
  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
];

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  'CHO_PHE_DUYET': { color: 'gold', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: 'green', label: 'Được phê duyệt' },
  'TU_CHOI': { color: 'red', label: 'Từ chối' },
};

export default function CauCangUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [entityData, setEntityData] = useState<null | { trangThaiPheDuyet: string; benCangId: string }>(null);
  const [benCangOptions, setBenCangOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    (async () => {
      try {
        const data = await fetchCauCangById(id);
        setEntityData({ trangThaiPheDuyet: data.trangThaiPheDuyet, benCangId: data.benCangId });
        form.setFieldsValue({
          id: data.id,
          tenCau: data.tenCau,
          benCangId: data.benCangId,
          chieuDai: data.chieuDai,
          taiTrong: data.taiTrong,
          loaiCau: data.loaiCau,
          trangThaiHoatDong: data.trangThaiHoatDong,
        });
      } catch (err) {
        console.error('Failed to fetch CauCang:', err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, form]);

  // Load BenCang options
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchBenCangOptions();
        setBenCangOptions(res.content.map((o: { id: string; tenBen: string }) => ({ value: o.id, label: o.tenBen })));
      } catch (err) {
        console.error('Failed to load BenCang options:', err);
      }
    })();
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // Preventive: check if no changes
      const current = form.getFieldsValue();
      if (current.tenCau === entityData && current.benCangId === entityData) {
        toast.info('Không có thay đổi nào được thực hiện.');
        setSubmitting(false);
        navigate('/caucang');
        return;
      }

      const payload = {
        id: values.id,
        tenCau: values.tenCau,
        benCangId: values.benCangId,
        chieuDai: values.chieuDai,
        taiTrong: values.taiTrong,
        loaiCau: values.loaiCau || undefined,
        trangThaiHoatDong: values.trangThaiHoatDong,
      };

      await updateCauCang(payload);
      toast.success('Cập nhật cầu cảng thành công');
      navigate(`/caucang/${id}`);
    } catch (err) {
      console.error('Failed to update CauCang:', err);
      // validation errors handled by Form
    } finally {
      setSubmitting(false);
    }
  }, [form, navigate, id, entityData]);

  if (isLoading) return <LoadingSkeleton rows={10} />;
  if (isError) return <ErrorState message="Không tìm thấy cầu cảng để cập nhật" onRetry={() => navigate('/caucang')} />;
  if (!entityData) return null;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/caucang/${id}`)}>Quay lại</Button>
          <Typography.Title level={5} style={{ margin: 0 }}>Cập nhật cầu cảng</Typography.Title>
          <Tag color={APPROVAL_MAP[entityData.trangThaiPheDuyet]?.color}>
            {APPROVAL_MAP[entityData.trangThaiPheDuyet]?.label}
          </Tag>
        </Space>
      </Card>

      <Card style={{ maxWidth: 800, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Info Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin chung</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <FormField
                type="text"
                name="maCau"
                label="Mã cầu"
                disabled
                help="Không thể thay đổi sau khi tạo"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="tenCau"
                label="Tên cầu cảng"
                placeholder="VD: Cầu cảng số 1"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="select"
                name="benCangId"
                label="Bến cảng chủ"
                options={benCangOptions}
                placeholder="Chọn bến cảng chứa"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="loaiCau"
                label="Loại cầu"
                placeholder="VD: STRAIGHT"
                help="Văn bản tự do, không có enum cố định"
              />
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          {/* Statistics Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông số kỹ thuật</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <FormField
                type="number"
                name="chieuDai"
                label="Chiều dài (m)"
                min={0}
                step={0.01}
                placeholder="VD: 100.0"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="number"
                name="taiTrong"
                label="Tải trọng (tấn)"
                min={0}
                step={0.01}
                placeholder="VD: 500.0"
              />
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          {/* Status Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Trạng thái</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <FormField
                type="select"
                name="trangThaiHoatDong"
                label="Trạng thái hoạt động"
                options={TRANG_THAI_HOAT_DONG_OPTIONS}
              />
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Cập nhật
              </Button>
              <Button onClick={() => navigate(`/caucang/${id}`)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
