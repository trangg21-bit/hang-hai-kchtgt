import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Input, InputNumber, Select, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { pointObjectService } from '../../services/pointObjectService';
import type { CreatePointObjectPayload, UpdatePointObjectPayload } from '../../types/pointObject';
import {
  POINT_OBJECT_TYPE_OPTIONS,
} from '../../types/pointObject';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

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

      // WGS84 validation
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
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/gis/points')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa đối tượng điểm' : 'Thêm đối tượng điểm mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'DRAFT' }}>
          {!isEdit && (
            <FormField
              type="text"
              name="code"
              label="Mã đối tượng"
              required
              placeholder="VD: PT-PORT-001"
              help="Mã định danh duy nhất cho đối tượng điểm"
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
            placeholder="VD: Cảng Hải Phòng"
          />

          <FormField
            type="select"
            name="objectType"
            label="Loại đối tượng"
            required
            options={POINT_OBJECT_TYPE_OPTIONS}
          />

          <Row style={{ display: 'flex', gap: 16 }}>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="longitude"
                label="Kinh độ (Longitude)"
                required
                min={-180}
                max={180}
                step={0.0001}
                placeholder="-106.7"
                help="WGS84: -180 ~ 180"
              />
            </Col>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="latitude"
                label="Vĩ độ (Latitude)"
                required
                min={-90}
                max={90}
                step={0.0001}
                placeholder="20.9"
                help="WGS84: -90 ~ 90"
              />
            </Col>
          </Row>

          <Row style={{ display: 'flex', gap: 16 }}>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="categoryId"
                label="Danh mục ID"
                min={1}
                placeholder="Tùy chọn"
              />
            </Col>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="iconId"
                label="Icon ID"
                min={1}
                placeholder="Tùy chọn"
              />
            </Col>
          </Row>

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về đối tượng điểm..."
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo đối tượng'}
              </Button>
              <Button onClick={() => navigate('/gis/points')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
