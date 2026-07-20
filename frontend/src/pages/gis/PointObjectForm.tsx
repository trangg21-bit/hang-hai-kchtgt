import { useState, useCallback, useEffect } from 'react';
import { Form, Button, Space, Input, InputNumber, Select, Row, Col, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { pointObjectService } from '../../services/pointObjectService';
import type { CreatePointObjectPayload, UpdatePointObjectPayload } from '../../types/pointObject';
import {
  POINT_OBJECT_TYPE_OPTIONS,
} from '../../types/pointObject';
import toast from '../../components/ToastNotification';
import { ScreenHeader } from '../../components/list-view';
import {
  spaceMd, spaceLg, spaceFormField,
  radiusPill, fontSizeMd, fontWeightMedium,
  textSecondary,
} from '../../tokens';

const INPUT_STYLE: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

const SELECT_STYLE: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  width: '100%',
};

const BTN_STYLE: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  fontWeight: fontWeightMedium,
  fontSize: fontSizeMd,
};

export default function PointObjectForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await pointObjectService.getById(id!);
          form.setFieldsValue({
            name: data.name,
            code: data.code,
            objectType: data.objectType,
            categoryId: data.categoryId,
            iconId: data.iconId,
            longitude: data.longitude,
            latitude: data.latitude,
            description: data.description,
            status: data.status,
          });
        } catch {
          toast.error('Không thể tải thông tin đối tượng điểm');
          navigate('/gis/points');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (values.latitude < -90 || values.latitude > 90) {
        message.error('Vĩ độ phải từ -90 đến 90');
        return;
      }
      if (values.longitude < -180 || values.longitude > 180) {
        message.error('Kinh độ phải từ -180 đến 180');
        return;
      }

      setSubmitting(true);

      if (isEdit) {
        const payload: UpdatePointObjectPayload = {
          name: values.name,
          objectType: values.objectType,
          categoryId: values.categoryId,
          iconId: values.iconId,
          longitude: values.longitude,
          latitude: values.latitude,
          description: values.description,
        };
        await pointObjectService.update(id!, payload);
        toast.success('Đã cập nhật đối tượng điểm');
      } else {
        const payload: CreatePointObjectPayload = {
          name: values.name,
          code: values.code,
          objectType: values.objectType,
          categoryId: values.categoryId,
          iconId: values.iconId,
          longitude: values.longitude,
          latitude: values.latitude,
          description: values.description,
        };
        await pointObjectService.create(payload);
        toast.success('Đã tạo đối tượng điểm');
      }

      navigate('/gis/points');
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  return (
    <>
      <ScreenHeader
        breadcrumb={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Quản lý KCHT trên nền bản đồ (GIS)' },
          { label: 'Quản lý danh mục đối tượng điểm', path: '/gis/points' },
          { label: isEdit ? 'Chỉnh sửa đối tượng điểm' : 'Thêm đối tượng điểm mới' },
        ]}
      />

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'DRAFT' }}>
          {!isEdit && (
            <Form.Item name="code" label="Mã đối tượng"
              rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
              style={{ marginBottom: spaceFormField }}>
              <Input placeholder="VD: PT-PORT-001" style={INPUT_STYLE} />
            </Form.Item>
          )}

          {isEdit && (
            <Form.Item name="code" label="Mã đối tượng"
              style={{ marginBottom: spaceFormField }}>
              <Input disabled style={INPUT_STYLE} />
            </Form.Item>
          )}

          <Form.Item name="name" label="Tên đối tượng"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="VD: Cảng Hải Phòng" style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="objectType" label="Loại đối tượng"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
            style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn loại đối tượng" options={POINT_OBJECT_TYPE_OPTIONS} style={SELECT_STYLE} />
          </Form.Item>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="longitude" label="Kinh độ (Longitude)"
                rules={[{ required: true, message: 'Nhập kinh độ' }]}
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="-106.7" min={-180} max={180} step={0.0001}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="latitude" label="Vĩ độ (Latitude)"
                rules={[{ required: true, message: 'Nhập vĩ độ' }]}
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="20.9" min={-90} max={90} step={0.0001}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="categoryId" label="Danh mục"
                style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Tùy chọn danh mục" style={SELECT_STYLE}
                  options={[
                    { label: 'Cảng biển', value: 1 },
                    { label: 'Đèn biển', value: 2 },
                    { label: 'Phao tiêu', value: 3 },
                    { label: 'Đèn hiệu', value: 4 },
                    { label: 'Khác', value: 5 },
                  ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="iconId" label="Biểu tượng bản đồ"
                style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Tùy chọn biểu tượng" style={SELECT_STYLE}
                  options={[
                    { label: 'Icon Cảng biển', value: 1 },
                    { label: 'Icon Đèn biển', value: 2 },
                    { label: 'Icon Phao tiêu', value: 3 },
                    { label: 'Icon Đèn hiệu', value: 4 },
                    { label: 'Icon Khác (Default)', value: 5 },
                  ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả"
            style={{ marginBottom: spaceFormField }}>
            <Input.TextArea placeholder="Mô tả về đối tượng điểm..." rows={3}
              style={{ borderRadius: radiusPill }} />
          </Form.Item>

          <Form.Item style={{ marginTop: spaceLg }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting} style={BTN_STYLE}>
                {isEdit ? 'Cập nhật' : 'Tạo đối tượng'}
              </Button>
              <Button onClick={() => navigate('/gis/points')}
                style={{ ...BTN_STYLE, borderColor: textSecondary, color: textSecondary }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
