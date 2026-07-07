import { useState, useCallback } from 'react';
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
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { CreateCangCanPayload } from './types';
import {
  TRANG_THAI_HOAT_DONG_OPTIONS,
  TRANG_THAI_PHE_DUYET_OPTIONS,
} from './types';
import toast from '../../components/ToastNotification';
import { createCangCan } from './api';

export default function CangCanCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: CreateCangCanPayload = {
        maCangCan: values.maCangCan,
        tenCangCan: values.tenCangCan,
        tinhThanhPho: values.tinhThanhPho || undefined,
        viDo: values.viDo,
        kinhDo: values.kinhDo,
        dienTich: values.dienTich,
        congSuatTEU: values.congSuatTEU,
        trangThaiHoatDong: values.trangThaiHoatDong,
        trangThaiPheDuyet: values.trangThaiPheDuyet,
      };

      await createCangCan(payload);
      toast.success('Tạo mới cảng cạn thành công');
      navigate('/cangcan');
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Check for 409 conflict (duplicate maCangCan)
        const v = form.getFieldsValue();
        if ((err as any).response?.status === 409) {
          form.setFields([
            { name: 'maCangCan', errors: [`Mã cảng cạn '${v?.maCangCan}' đã tồn tại`] },
          ]);
          toast.error(`Mã cảng cạn '${v?.maCangCan}' đã tồn tại`);
        } else {
          toast.error(err.message);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, navigate]);

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cangcan')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Tạo mới cảng cạn
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            trangThaiHoatDong: 'HIỆN_HÀNH',
            trangThaiPheDuyet: 'CHỜ_PHE_DUYỆT',
          }}
        >
          {/* Info Section */}
          <Typography.Text strong>Thông tin chung</Typography.Text>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="maCangCan"
                label="Mã cảng cạn"
                rules={[
                  { required: true, message: 'Mã cảng cạn không được để trống' },
                  { max: 50, message: 'Mã cảng cạn tối đa 50 ký tự' },
                ]}
                help="Mã định danh duy nhất cho cảng cạn"
              >
                <Input placeholder="VD: CC-HAIPHONG-001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="tenCangCan"
                label="Tên cảng cạn"
                rules={[
                  { required: true, message: 'Tên cảng cạn không được để trống' },
                  { max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' },
                ]}
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
                  { required: true, message: 'Diện tích phải lớn hơn 0' },
                  {
                    type: 'number',
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
                <Select
                  options={TRANG_THAI_PHE_DUYET_OPTIONS}
                  placeholder="Chọn trạng thái phê duyệt"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo cảng cạn
              </Button>
              <Button onClick={() => navigate('/cangcan')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
