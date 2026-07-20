import { useState, useCallback, useEffect } from 'react';
import { Form, Button, Space, Input, InputNumber, Select, Row, Col, Switch, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { mapLayerService } from '../../services/mapLayerService';
import type { CreateMapLayerPayload, UpdateMapLayerPayload } from '../../types/mapLayer';
import { MAP_LAYER_TYPE_OPTIONS } from '../../types/mapLayer';
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
      <ScreenHeader
        breadcrumb={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Quản lý KCHT trên nền bản đồ (GIS)' },
          { label: 'Quản lý lớp bản đồ', path: '/gis/layers' },
          { label: isEdit ? 'Chỉnh sửa lớp bản đồ' : 'Thêm lớp bản đồ mới' },
        ]}
      />

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ visible: true, opacity: 1, order: 0 }}>
          {!isEdit && (
            <Form.Item name="code" label="Mã lớp"
              rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
              style={{ marginBottom: spaceFormField }}>
              <Input placeholder="VD: LAY-PT-001" style={INPUT_STYLE} />
            </Form.Item>
          )}

          {isEdit && (
            <Form.Item name="code" label="Mã lớp"
              style={{ marginBottom: spaceFormField }}>
              <Input disabled style={INPUT_STYLE} />
            </Form.Item>
          )}

          <Form.Item name="name" label="Tên lớp"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="VD: Đối tượng điểm cảng biển" style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="layerType" label="Loại lớp"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
            style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn loại lớp" options={MAP_LAYER_TYPE_OPTIONS} style={SELECT_STYLE} />
          </Form.Item>

          <Form.Item name="source" label="Nguồn dữ liệu"
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="VD: WMS, GeoJSON, file shape..." style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="styleConfig" label="Cấu hình style (JSON)"
            style={{ marginBottom: spaceFormField }}>
            <Input.TextArea placeholder='{"color": "#ff0000", "width": 2}'
              rows={3} style={{ borderRadius: radiusPill }} />
          </Form.Item>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="opacity" label="Độ mờ (0-1)"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="1" min={0} max={1} step={0.1}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="order" label="Thứ tự hiển thị"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="0" min={0} step={1}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="visible" label="Hiển thị" valuePropName="checked"
            style={{ marginBottom: spaceFormField }}>
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item style={{ marginTop: spaceLg }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting} style={BTN_STYLE}>
                {isEdit ? 'Cập nhật' : 'Tạo lớp'}
              </Button>
              <Button onClick={() => navigate('/gis/layers')}
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
