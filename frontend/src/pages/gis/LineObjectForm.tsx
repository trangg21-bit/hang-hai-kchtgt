import { useState, useCallback, useEffect } from 'react';
import { Form, Button, Space, Input, InputNumber, Select, Row, Col } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { lineObjectService } from '../../services/lineObjectService';
import type { CreateLineObjectPayload, UpdateLineObjectPayload } from '../../types/lineObject';
import {
  LINE_OBJECT_TYPE_OPTIONS,
} from '../../types/lineObject';
import toast, { message } from '../../components/ToastNotification';
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

export default function LineObjectForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await lineObjectService.getById(id!);
          form.setFieldsValue({
            name: data.name,
            code: data.code,
            objectType: data.objectType,
            coordinates: data.coordinates,
            description: data.description,
            length: data.length,
            material: data.material,
            yearBuilt: data.yearBuilt,
          });
        } catch {
          toast.error('Không thể tải thông tin đối tượng đường');
          navigate('/gis/lines');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const validateWKT = (value: string): boolean => {
    if (!value) return false;
    return value.trim().startsWith('LINESTRING');
  };

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (!validateWKT(values.coordinates)) {
        message.error('Tọa độ phải ở định dạng WKT LINESTRING (VD: LINESTRING(106.7 21.0, 106.8 21.1))');
        return;
      }

      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateLineObjectPayload = {
          name: values.name,
          objectType: values.objectType,
          coordinates: values.coordinates,
          description: values.description,
          length: values.length,
          material: values.material,
          yearBuilt: values.yearBuilt,
        };
        await lineObjectService.update(id!, payload);
        toast.success('Đã cập nhật đối tượng đường');
      } else {
        const payload: CreateLineObjectPayload = {
          name: values.name,
          code: values.code,
          objectType: values.objectType,
          coordinates: values.coordinates,
          description: values.description,
          length: values.length,
          material: values.material,
          yearBuilt: values.yearBuilt,
        };
        await lineObjectService.create(payload);
        toast.success('Đã tạo đối tượng đường');
      }

      navigate('/gis/lines');
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
          { label: 'Quản lý danh mục đối tượng đường', path: '/gis/lines' },
          { label: isEdit ? 'Chỉnh sửa đối tượng đường' : 'Thêm đối tượng đường mới' },
        ]}
      />

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <Form.Item name="code" label="Mã đối tượng"
              rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
              style={{ marginBottom: spaceFormField }}>
              <Input placeholder="VD: LN-ROUTE-001" style={INPUT_STYLE} />
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
            <Input placeholder="VD: Tuyến hàng hải Hải Phòng - Quảng Ninh" style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="objectType" label="Loại đối tượng"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
            style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn loại đối tượng" options={LINE_OBJECT_TYPE_OPTIONS} style={SELECT_STYLE} />
          </Form.Item>

          <Form.Item name="coordinates" label="Tọa độ (WKT LINESTRING)"
            rules={[{ required: true, message: 'Vui lòng nhập tọa độ WKT' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="LINESTRING(106.7000 20.8500, 106.8000 20.9000, 107.0000 21.0000)" style={INPUT_STYLE} />
          </Form.Item>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="length" label="Chiều dài (km)"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="Tùy chọn" min={0} step={0.01}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="yearBuilt" label="Năm xây dựng"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="Tùy chọn" min={1900} max={9999}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="material" label="Vật liệu"
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Tùy chọn" style={INPUT_STYLE} />
          </Form.Item>

          <Row gutter={spaceMd}>
          </Row>

          <Form.Item name="description" label="Mô tả"
            style={{ marginBottom: 0 }}>
            <Input.TextArea placeholder="Mô tả về đối tượng đường..." rows={3}
              style={{ borderRadius: radiusPill }} />
          </Form.Item>

          <Form.Item style={{ marginTop: spaceLg }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting} style={BTN_STYLE}>
                {isEdit ? 'Cập nhật' : 'Tạo đối tượng'}
              </Button>
              <Button onClick={() => navigate('/gis/lines')}
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
