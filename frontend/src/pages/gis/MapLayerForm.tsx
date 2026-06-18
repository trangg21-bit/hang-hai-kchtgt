import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input, InputNumber, Select, Switch, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { mapLayerService } from '../../services/mapLayerService';
import type { CreateMapLayerPayload, UpdateMapLayerPayload } from '../../types/mapLayer';
import { MAP_LAYER_TYPE_OPTIONS } from '../../types/mapLayer';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function MapLayerForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await mapLayerService.getById(id!);
          form.setFieldsValue({
            name: data.name,
            code: data.code,
            layerType: data.layerType,
            source: data.source,
            visible: data.visible,
            opacity: data.opacity,
            order: data.order,
            styleConfig: data.styleConfig,
          });
        } catch {
          toast.error('Không thể tải thông tin lớp bản đồ');
          navigate('/gis/layers');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateMapLayerPayload = {
          name: values.name,
          layerType: values.layerType,
          source: values.source,
          visible: values.visible,
          opacity: values.opacity,
          order: values.order,
          styleConfig: values.styleConfig,
        };
        await mapLayerService.update(id!, payload);
        toast.success('Đã cập nhật lớp bản đồ');
      } else {
        const payload: CreateMapLayerPayload = {
          name: values.name,
          code: values.code,
          layerType: values.layerType,
          source: values.source,
          visible: values.visible,
          opacity: values.opacity,
          order: values.order,
          styleConfig: values.styleConfig,
        };
        await mapLayerService.create(payload);
        toast.success('Đã tạo lớp bản đồ');
      }

      navigate('/gis/layers');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/gis/layers')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa lớp bản đồ' : 'Thêm lớp bản đồ mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ visible: true, opacity: 1, order: 0 }}>
          {!isEdit && (
            <FormField
              type="text"
              name="code"
              label="Mã lớp"
              required
              placeholder="VD: LAY-PT-001"
              help="Mã định danh duy nhất"
            />
          )}

          {isEdit && (
            <FormField
              type="text"
              name="code"
              label="Mã lớp"
              disabled
            />
          )}

          <FormField
            type="text"
            name="name"
            label="Tên lớp"
            required
            placeholder="VD: Đối tượng điểm cảng biển"
          />

          <FormField
            type="select"
            name="layerType"
            label="Loại lớp"
            required
            options={MAP_LAYER_TYPE_OPTIONS}
          />

          <FormField
            type="text"
            name="source"
            label="Nguồn dữ liệu"
            placeholder="VD: WMS, GeoJSON, file shape..."
          />

          <FormField
            type="textarea"
            name="styleConfig"
            label="Cấu hình style (JSON)"
            placeholder='{"color": "#ff0000", "width": 2}'
            help="Cấu hình hiển thị dạng JSON"
          />

          <Row style={{ display: 'flex', gap: 16 }}>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="opacity"
                label="Độ mờ (0-1)"
                min={0}
                max={1}
                step={0.1}
              />
            </Col>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="order"
                label="Thứ tự hiển thị"
                min={0}
                step={1}
              />
            </Col>
          </Row>

          <Form.Item
            name="visible"
            label="Hiển thị"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo lớp'}
              </Button>
              <Button onClick={() => navigate('/gis/layers')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
