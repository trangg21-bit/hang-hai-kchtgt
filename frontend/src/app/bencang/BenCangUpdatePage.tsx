import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, Divider, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { benCangCRUD } from '../../services/cangbenService';
import type { UpdateBenCangRequest, BenCang } from '../../types/cangben';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';
import { z } from 'zod';
import { updateSchema } from './schema';

const { Title } = Typography;
import LoadingSkeleton from '../../components/LoadingSkeleton';

export default function BenCangUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<{ maBen: string; trangThaiPheDuyet: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await benCangCRUD.findById(id);
        setEntityData({ maBen: data.maBen, trangThaiPheDuyet: data.trangThaiPheDuyet });
        form.setFieldsValue({
          maBen: data.maBen,
          tenBen: data.tenBen,
          cangBienId: data.cangBienId,
          tuyenDuongThuy: data.tuyenDuongThuy,
          viDo: data.viDo,
          kinhDo: data.kinhDo,
          chieuDai: data.chieuDai,
          chieuRong: data.chieuRong,
          loaiBen: data.loaiBen,
          doSauLuong: data.doSauLuong,
          trangThaiHoatDong: data.trangThaiHoatDong,
        });
      } catch {
        toast.error('Không thể tải thông tin bến cảng');
        navigate('/bencang');
      }
    })();
  }, [id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();

      // Zod validation
      const parsed = updateSchema.parse({
        id,
        tenBen: values.tenBen || undefined,
        cangBienId: values.cangBienId || undefined,
        tuyenDuongThuy: values.tuyenDuongThuy || undefined,
        viDo: values.viDo,
        kinhDo: values.kinhDo,
        chieuDai: values.chieuDai,
        chieuRong: values.chieuRong,
        loaiBen: values.loaiBen || undefined,
        doSauLuong: values.doSauLuong,
        trangThaiHoatDong: values.trangThaiHoatDong,
      });

      const payload: UpdateBenCangRequest = {
        id,
        tenBen: parsed.tenBen,
        cangBienId: parsed.cangBienId,
        tuyenDuongThuy: parsed.tuyenDuongThuy,
        viDo: parsed.viDo,
        kinhDo: parsed.kinhDo,
        chieuDai: parsed.chieuDai,
        chieuRong: parsed.chieuRong,
        loaiBen: parsed.loaiBen,
        doSauLuong: parsed.doSauLuong,
        trangThaiHoatDong: parsed.trangThaiHoatDong,
      };

      setSubmitting(true);
      await benCangCRUD.update(payload);
      toast.success('Cập nhật bến cảng thành công');
      navigate(`/bencang/${id}`);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      }
      // Other errors (422) handled globally by Axios interceptor
    } finally {
      setSubmitting(false);
    }
  }, [id, form, navigate]);

  if (!entityData) return <LoadingSkeleton rows={4} />;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/bencang/${id}`)}>Quay lại</Button>
          <Title level={5} style={{ margin: 0 }}>Chỉnh sửa bến cảng</Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 800, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Info Section */}
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin chung</Typography.Text>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="text"
                name="maBen"
                label="Mã bến"
                disabled
                help="Không thể thay đổi mã bến sau khi tạo"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="tenBen"
                label="Tên bến"
                placeholder="VD: Bến cảng Hải Phòng"
                help="Tên đầy đủ của bến cảng (tối đa 255 ký tự)"
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="text"
                name="cangBienId"
                label="Cảng biển chủ"
                placeholder="Nhập ID cảng biển cha"
                help="ID của cảng biển chứa bến này"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="tuyenDuongThuy"
                label="Tuyến đường thủy"
                placeholder="VD: Tuyến sông Bạch Đằng"
                help="Tuyến đường thủy gần bến (tối đa 255 ký tự)"
              />
            </Col>
          </Row>

          {/* Geography Section */}
          <Divider />
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin địa lý</Typography.Text>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="number"
                name="viDo"
                label="Vĩ độ"
                min={-90}
                max={90}
                step={0.000001}
                placeholder="VD: 20.988"
                help="WGS84: -90 ~ 90 (không bắt buộc)"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="number"
                name="kinhDo"
                label="Kinh độ"
                min={-180}
                max={180}
                step={0.000001}
                placeholder="VD: -106.688"
                help="WGS84: -180 ~ 180 (không bắt buộc)"
              />
            </Col>
          </Row>

          {/* Statistics Section */}
          <Divider />
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông số kỹ thuật</Typography.Text>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="number"
                name="chieuDai"
                label="Chiều dài (m)"
                min={0}
                step={0.01}
                placeholder="VD: 200.0"
                help="Chiều dài bến tính bằng mét"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="number"
                name="chieuRong"
                label="Chiều rộng (m)"
                min={0}
                step={0.01}
                placeholder="VD: 30.0"
                help="Chiều rộng bến tính bằng mét"
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="text"
                name="loaiBen"
                label="Loại bến"
                placeholder="VD: Bến nước, Bến bờ..."
                help="Loại bến (không có enum cố định, nhập tự do, tối đa 100 ký tự)"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="number"
                name="doSauLuong"
                label="Độ sâu luồng (m)"
                min={0}
                step={0.01}
                placeholder="VD: 12.5"
                help="Độ sâu luồng tính bằng mét"
              />
            </Col>
          </Row>

          {/* Status Section */}
          <Divider />
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Trạng thái</Typography.Text>
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="select"
                name="trangThaiHoatDong"
                label="Trạng thái hoạt động"
                options={[
                  { label: 'Hiện hành', value: 'HIỆN_HÀNH' },
                  { label: 'Tạm ngừng', value: 'TẠM_NGƯNG' },
                ]}
              />
            </Col>
            <Col span={12}>
              <div>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>
                  Trạng thái phê duyệt
                </Typography.Text>
                <Tag color={entityData.trangThaiPheDuyet === 'CHO_PHE_DUYET' ? 'orange' : entityData.trangThaiPheDuyet === 'DUOC_PHE_DUYET' ? 'green' : 'red'}>
                  {entityData.trangThaiPheDuyet === 'CHO_PHE_DUYET' ? 'Chờ phê duyệt' : entityData.trangThaiPheDuyet === 'DUOC_PHE_DUYET' ? 'Được phê duyệt' : 'Từ chối'}
                </Tag>
                <Typography.Text type="secondary" style={{ marginLeft: 8 }}>(không thể thay đổi)</Typography.Text>
              </div>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Cập nhật
              </Button>
              <Button onClick={() => navigate(`/bencang/${id}`)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
