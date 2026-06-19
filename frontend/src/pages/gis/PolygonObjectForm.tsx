import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input, InputNumber, Select, Row, Col, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { polygonObjectService } from '../../services/polygonObjectService';
import type { CreatePolygonObjectPayload, UpdatePolygonObjectPayload } from '../../types/polygonObject';
import {
  POLYGON_OBJECT_TYPE_OPTIONS,
} from '../../types/polygonObject';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

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
            categoryId: data.categoryId,
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

      // WKT validation
      if (!validateWKT(values.coordinates)) {
        message.error('Tọa độ phải ở định dạng WKT POLYGON (VD: POLYGON((106.7 20.8, 106.8 20.8, 106.8 20.9, 106.7 20.9, 106.7 20.8)))');
        return;
      }

      setSubmitting(true);

      if (isEdit) {
        const payload: UpdatePolygonObjectPayload = {
          name: values.name,
          objectType: values.objectType,
          categoryId: values.categoryId,
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
          categoryId: values.categoryId,
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
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/gis/polygons')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa đối tượng vùng' : 'Thêm đối tượng vùng mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <FormField
              type="text"
              name="code"
              label="Mã đối tượng"
              required
              placeholder="VD: PG-ANCHOR-001"
              help="Mã định danh duy nhất"
            />
          )}

          {isEdit && (
            <FormField
              type="text"
              name="code"
              label="Mã đối tượng"
              disabled
            />
          )}

          <FormField
            type="text"
            name="name"
            label="Tên đối tượng"
            required
            placeholder="VD: Vùng neo đậu Hải Phòng"
          />

          <FormField
            type="select"
            name="objectType"
            label="Loại đối tượng"
            required
            options={POLYGON_OBJECT_TYPE_OPTIONS}
          />

          <FormField
            type="textarea"
            name="coordinates"
            label="Tọa độ (WKT POLYGON)"
            required
            placeholder="POLYGON((106.7000 20.8500, 106.8000 20.8500, 106.8000 20.9000, 106.7000 20.9000, 106.7000 20.8500))"
            help="Định dạng WKT POLYGON — phải bắt đầu bằng 'POLYGON'"
          />

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về đối tượng vùng..."
          />

          <FormField
            type="textarea"
            name="purpose"
            label="Mục đích sử dụng"
            placeholder="Tùy chọn"
          />

          <Row style={{ display: 'flex', gap: 16 }}>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="area"
                label="Diện tích (km²)"
                min={0}
                step={0.01}
                placeholder="Tùy chọn"
              />
            </Col>
            <Col style={{ flex: 1 }}>
              <FormField
                type="text"
                name="restrictionLevel"
                label="Mức độ hạn chế"
                placeholder="VD: Cấm, Hạn chế"
              />
            </Col>
          </Row>

          <Row style={{ display: 'flex', gap: 16 }}>
            <Col style={{ flex: 1 }}>
              <FormField
                type="select"
                name="categoryId"
                label="Danh mục"
                placeholder="Tùy chọn danh mục"
                options={[
                  { label: 'Vùng nước', value: 1 },
                  { label: 'Vùng neo đậu', value: 2 },
                  { label: 'Nơi tránh bão', value: 3 },
                  { label: 'Khu vực cấm', value: 4 },
                  { label: 'Khu vực hạn chế', value: 5 },
                  { label: 'Khác', value: 6 },
                ]}
              />
            </Col>
            <Col style={{ flex: 1 }}>
              <FormField
                type="select"
                name="fillSymbolId"
                label="Ký hiệu vùng"
                placeholder="Tùy chọn ký hiệu"
                options={[
                  { label: 'Symbol Vùng nước', value: 1 },
                  { label: 'Symbol Vùng neo đậu', value: 2 },
                  { label: 'Symbol Nơi tránh bão', value: 3 },
                  { label: 'Symbol Khu vực cấm', value: 4 },
                  { label: 'Symbol Khu vực hạn chế', value: 5 },
                  { label: 'Symbol Khác', value: 6 },
                ]}
              />
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo đối tượng'}
              </Button>
              <Button onClick={() => navigate('/gis/polygons')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
