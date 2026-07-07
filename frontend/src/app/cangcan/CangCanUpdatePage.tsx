import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  InputNumber,
  Input,
  Alert,
  Tag,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { CangCan, UpdateCangCanPayload } from './types';
import {
  TRANG_THAI_HOAT_DONG_OPTIONS,
  TRANG_THAI_PHE_DUYET_MAP,
} from './types';
import toast from '../../components/ToastNotification';
import { fetchCangCanById, updateCangCan } from './api';

export default function CangCanUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<CangCan | null>(null);
  const [originalData, setOriginalData] = useState<CangCan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    (async () => {
      try {
        const data = await fetchCangCanById(id);
        setEntityData(data);
        setOriginalData(data);
        form.setFieldsValue({
          maCangCan: data.maCangCan,
          tenCangCan: data.tenCangCan,
          tinhThanhPho: data.tinhThanhPho,
          viDo: data.viDo,
          kinhDo: data.kinhDo,
          dienTich: data.dienTich,
          congSuatTEU: data.congSuatTEU,
          trangThaiHoatDong: data.trangThaiHoatDong,
        });
      } catch {
        toast.error('Không thể tải thông tin cảng cạn');
        navigate('/cangcan');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    if (!id || !originalData) return;

    // Check if anything changed
    const values = form.getFieldsValue();
    const isSame =
      values.tenCangCan === originalData.tenCangCan &&
      values.tinhThanhPho === originalData.tinhThanhPho &&
      values.viDo === originalData.viDo &&
      values.kinhDo === originalData.kinhDo &&
      values.dienTich === originalData.dienTich &&
      values.congSuatTEU === originalData.congSuatTEU &&
      values.trangThaiHoatDong === originalData.trangThaiHoatDong;

    if (isSame) {
      toast.warning('Không có thay đổi nào được thực hiện.');
      return;
    }

    try {
      await form.validateFields();
      setSubmitting(true);

      const payload: UpdateCangCanPayload = {
        id,
        tenCangCan: values.tenCangCan,
        tinhThanhPho: values.tinhThanhPho || undefined,
        viDo: values.viDo,
        kinhDo: values.kinhDo,
        dienTich: values.dienTich,
        congSuatTEU: values.congSuatTEU,
        trangThaiHoatDong: values.trangThaiHoatDong,
      };

      await updateCangCan(payload);
      toast.success('Cập nhật cảng cạn thành công');
      navigate(`/cangcan/${id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if ((err as any).response?.status === 409) {
          toast.error(`Mã cảng cạn '${values?.maCangCan}' đã tồn tại`);
        } else {
          toast.error(err.message);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [id, originalData, form, navigate]);

  if (isLoading) {
    return <Typography.Text>Đang tải...</Typography.Text>;
  }

  if (isError || !entityData) {
    return (
      <Card>
        <Typography.Text>Không tìm thấy cảng cạn để cập nhật.</Typography.Text>
        <Button type="link" onClick={() => navigate('/cangcan')}>Quay lại danh sách</Button>
      </Card>
    );
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/cangcan/${id}`)}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Cập nhật cảng cạn
          </Typography.Title>
          <Tag color={TRANG_THAI_PHE_DUYET_MAP[entityData.trangThaiPheDuyet]?.color}>
            {TRANG_THAI_PHE_DUYET_MAP[entityData.trangThaiPheDuyet]?.label || entityData.trangThaiPheDuyet}
          </Tag>
        </Space>
      </Card>

      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Info Section */}
          <Typography.Text strong>Thông tin chung</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="maCangCan"
                label="Mã cảng cạn"
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="tenCangCan"
                label="Tên cảng cạn"
                rules={[{ max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng cạn Nội Bài" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="tinhThanhPho"
                label="Tỉnh/thành phố"
                rules={[{ max: 100, message: 'Tỉnh/thành phố tối đa 100 ký tự' }]}
              >
                <Input placeholder="VD: Hải Phòng" />
              </Form.Item>
            </Col>
          </Row>

          {/* Geography Section */}
          <Typography.Text strong>Thông tin địa lý</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="viDo"
                label="Vĩ độ (Latitude)"
                rules={[
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null) {
                        return Promise.resolve();
                      }
                      if (value < -90 || value > 90) {
                        return Promise.reject(new Error('Vĩ độ phải từ -90 đến 90'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                help="WGS84: -90 ~ 90"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 20.8449"
                  min={-90}
                  max={90}
                  step={0.000001}
                  precision={6}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="kinhDo"
                label="Kinh độ (Longitude)"
                rules={[
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null) {
                        return Promise.resolve();
                      }
                      if (value < -180 || value > 180) {
                        return Promise.reject(new Error('Kinh độ phải từ -180 đến 180'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                help="WGS84: -180 ~ 180"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 106.6348"
                  min={-180}
                  max={180}
                  step={0.000001}
                  precision={6}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* GPS pair constraint warning */}
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.viDo !== curr.viDo || prev.kinhDo !== curr.kinhDo}>
            {() => {
              const viDo = form.getFieldValue('viDo');
              const kinhDo = form.getFieldValue('kinhDo');
              const onlyOne = (viDo != null && kinhDo == null) || (viDo == null && kinhDo != null);
              if (onlyOne) {
                return (
                  <Alert
                    message="Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau"
                    type="warning"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                );
              }
              return null;
            }}
          </Form.Item>

          {/* Statistics Section */}
          <Typography.Text strong>Thống kê</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="dienTich"
                label="Diện tích (m²)"
                rules={[
                  {
                    type: 'number',
                    valueAsNumber: true,
                    min: 0.000001,
                    message: 'Diện tích phải lớn hơn 0',
                  },
                ]}
                help="Diện tích cảng cạn tính bằng mét vuông"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 50000.00"
                  min={0.000001}
                  step={0.01}
                  precision={2}
                  addonAfter="m²"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="congSuatTEU"
                label="Công suất (TEU)"
                help="Công suất xử lý container tính bằng TEU"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 100000"
                  min={0}
                  step={1}
                  precision={2}
                  addonAfter="TEU"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Status Section */}
          <Typography.Text strong>Trạng thái</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="trangThaiHoatDong"
                label="Trạng thái hoạt động"
              >
                <Select
                  options={TRANG_THAI_HOAT_DONG_OPTIONS}
                  placeholder="Chọn trạng thái hoạt động"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="trangThaiPheDuyet"
                label="Trạng thái phê duyệt"
              >
                <Input value={TRANG_THAI_PHE_DUYET_MAP[entityData.trangThaiPheDuyet]?.label || entityData.trangThaiPheDuyet} disabled />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Cập nhật
              </Button>
              <Button onClick={() => navigate(`/cangcan/${id}`)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
