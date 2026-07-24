import { useState, useCallback, useEffect } from 'react';
import { Form, Button, Space, Input, InputNumber, Select, Row, Col, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { polygonObjectService } from '../../services/polygonObjectService';
import type { CreatePolygonObjectPayload, UpdatePolygonObjectPayload } from '../../types/polygonObject';
import {
  POLYGON_OBJECT_TYPE_OPTIONS,
} from '../../types/polygonObject';
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

export default function PolygonObjectForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await polygonObjectService.getById(id!);
          form.setFieldsValue({
            name: data.name,
            code: data.code,
            objectType: data.objectType,
            fillSymbolId: data.fillSymbolId,
            coordinates: data.coordinates,
            description: data.description,
            area: data.area,
            purpose: data.purpose,
            restrictionLevel: data.restrictionLevel,
          });
        } catch {
          toast.error('Không thể tải thông tin đối tượng vùng');
          navigate('/gis/polygons');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const validateWKT = (value: string): boolean => {
    if (!value) return false;
    return value.trim().startsWith('POLYGON');
  };

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (!validateWKT(values.coordinates)) {
        message.error('Tọa độ phải ở định dạng WKT POLYGON (VD: POLYGON((106.7 20.8, 106.8 20.8, 106.8 20.9, 106.7 20.9, 106.7 20.8)))');
        return;
      }

      setSubmitting(true);

      if (isEdit) {
        const payload: UpdatePolygonObjectPayload = {
          name: values.name,
          objectType: values.objectType,
          fillSymbolId: values.fillSymbolId,
          coordinates: values.coordinates,
          description: values.description,
          area: values.area,
          purpose: values.purpose,
          restrictionLevel: values.restrictionLevel,
        };
        await polygonObjectService.update(id!, payload);
        toast.success('Đã cập nhật đối tượng vùng');
      } else {
        const payload: CreatePolygonObjectPayload = {
          name: values.name,
          code: values.code,
          objectType: values.objectType,
          fillSymbolId: values.fillSymbolId,
          coordinates: values.coordinates,
          description: values.description,
          area: values.area,
          purpose: values.purpose,
          restrictionLevel: values.restrictionLevel,
        };
        await polygonObjectService.create(payload);
        toast.success('Đã tạo đối tượng vùng');
      }

      navigate('/gis/polygons');
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
          { label: 'Quản lý danh mục đối tượng vùng', path: '/gis/polygons' },
          { label: isEdit ? 'Chỉnh sửa đối tượng vùng' : 'Thêm đối tượng vùng mới' },
        ]}
      />

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <Form.Item name="code" label="Mã đối tượng"
              rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
              style={{ marginBottom: spaceFormField }}>
              <Input placeholder="VD: PG-ANCHOR-001" style={INPUT_STYLE} />
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
            <Input placeholder="VD: Vùng neo đậu Hải Phòng" style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="objectType" label="Loại đối tượng"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
            style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn loại đối tượng" options={POLYGON_OBJECT_TYPE_OPTIONS} style={SELECT_STYLE} />
          </Form.Item>

          <Form.Item name="coordinates" label="Tọa độ (WKT POLYGON)"
            rules={[{ required: true, message: 'Vui lòng nhập tọa độ WKT' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="POLYGON((106.7000 20.8500, 106.8000 20.8500, 106.8000 20.9000, 106.7000 20.9000, 106.7000 20.8500))" style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="purpose" label="Mục đích sử dụng"
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Tùy chọn" style={INPUT_STYLE} />
          </Form.Item>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="area" label="Diện tích (km²)"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="Tùy chọn" min={0} step={0.01}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="restrictionLevel" label="Mức độ hạn chế"
                style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: Cấm, Hạn chế" style={INPUT_STYLE} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={spaceMd}>
            
            <Col span={12}>
              <Form.Item name="fillSymbolId" label="Ký hiệu vùng"
                style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Tùy chọn ký hiệu" style={SELECT_STYLE}
                  options={[
                    { label: 'Symbol Vùng nước', value: 1 },
                    { label: 'Symbol Vùng neo đậu', value: 2 },
                    { label: 'Symbol Nơi tránh bão', value: 3 },
                    { label: 'Symbol Khu vực cấm', value: 4 },
                    { label: 'Symbol Khu vực hạn chế', value: 5 },
                    { label: 'Symbol Khác', value: 6 },
                  ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả"
            style={{ marginBottom: 0 }}>
            <Input.TextArea placeholder="Mô tả về đối tượng vùng..." rows={3}
              style={{ borderRadius: radiusPill }} />
          </Form.Item>

          <Form.Item style={{ marginTop: spaceLg }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting} style={BTN_STYLE}>
                {isEdit ? 'Cập nhật' : 'Tạo đối tượng'}
              </Button>
              <Button onClick={() => navigate('/gis/polygons')}
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
