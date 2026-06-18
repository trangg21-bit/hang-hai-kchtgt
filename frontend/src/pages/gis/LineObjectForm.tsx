import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input, InputNumber, Select, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { lineObjectService } from '../../services/lineObjectService';
import type { CreateLineObjectPayload, UpdateLineObjectPayload } from '../../types/lineObject';
import {
  LINE_OBJECT_TYPE_OPTIONS,
} from '../../types/lineObject';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

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
            categoryId: data.categoryId,
            lineSymbolId: data.lineSymbolId,
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

      // WKT validation
      if (!validateWKT(values.coordinates)) {
        message.error('Tọa độ phải ở định dạng WKT LINESTRING (VD: LINESTRING(106.7 21.0, 106.8 21.1))');
        return;
      }

      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateLineObjectPayload = {
          name: values.name,
          objectType: values.objectType,
          categoryId: values.categoryId,
          lineSymbolId: values.lineSymbolId,
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
          categoryId: values.categoryId,
          lineSymbolId: values.lineSymbolId,
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
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/gis/lines')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa đối tượng đường' : 'Thêm đối tượng đường mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <FormField
              type="text"
              name="code"
              label="Mã đối tượng"
              required
              placeholder="VD: LN-ROUTE-001"
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
            placeholder="VD: Tuyến hàng hải Hải Phòng - Quảng Ninh"
          />

          <FormField
            type="select"
            name="objectType"
            label="Loại đối tượng"
            required
            options={LINE_OBJECT_TYPE_OPTIONS}
          />

          <FormField
            type="textarea"
            name="coordinates"
            label="Tọa độ (WKT LINESTRING)"
            required
            placeholder="LINESTRING(106.7000 20.8500, 106.8000 20.9000, 107.0000 21.0000)"
            help="Định dạng WKT LINESTRING — phải bắt đầu bằng 'LINESTRING'"
          />

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về đối tượng đường..."
          />

          <Row style={{ display: 'flex', gap: 16 }}>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="length"
                label="Chiều dài (km)"
                min={0}
                step={0.01}
                placeholder="Tùy chọn"
              />
            </Col>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="yearBuilt"
                label="Năm xây dựng"
                min={1900}
                max={9999}
                placeholder="Tùy chọn"
              />
            </Col>
          </Row>

          <Row style={{ display: 'flex', gap: 16 }}>
            <Col style={{ flex: 1 }}>
              <FormField
                type="text"
                name="material"
                label="Vật liệu"
                placeholder="Tùy chọn"
              />
            </Col>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="categoryId"
                label="Danh mục ID"
                min={1}
                placeholder="Tùy chọn"
              />
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo đối tượng'}
              </Button>
              <Button onClick={() => navigate('/gis/lines')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
