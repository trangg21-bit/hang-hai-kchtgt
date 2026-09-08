import { forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { Form, Input, Select, InputNumber, Switch, Row, Col, type FormInstance } from 'antd';
import { GlobalOutlined, EyeOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import { mapLayerService } from '../../services/mapLayerService';
import type { MapLayer } from '../../types/mapLayer';
import { MapLayer as MapLayerEnum } from '../../types/mapLayer';
import toast from '../../components/ToastNotification';
import { colors } from '../../themetokenchk';
import {
  actionPrimary,
  fontSizeMd,
  fontWeightBold,
  radiusPill,
  spaceFormField,
  spaceMd,
  requiredMarkStyle,
} from '../../themetokenchk';

export interface MapLayerFormRef {
  submit: () => void;
}

export interface MapLayerFormProps {
  form?: FormInstance;
  id?: string;
  initialRecord?: MapLayer | null;
  onFinish?: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const LAYER_TYPE_OPTIONS = [
  { value: MapLayerEnum.LayerType.POINT, label: 'Đối tượng điểm' },
  { value: MapLayerEnum.LayerType.LINE, label: 'Đối tượng đường' },
  { value: MapLayerEnum.LayerType.POLYGON, label: 'Đối tượng vùng' },
  { value: MapLayerEnum.LayerType.BASEMAP, label: 'Bản đồ nền' },
  { value: MapLayerEnum.LayerType.OVERLAY, label: 'Lớp phủ' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
];

export const MapLayerForm = forwardRef<MapLayerFormRef, MapLayerFormProps>(
  ({ form: externalForm, id: propId, initialRecord, onFinish, onSubmittingChange }, ref) => {
    const [internalForm] = Form.useForm();
    const form = externalForm || internalForm;

    const [, setSubmitting] = useState(false);

    useEffect(() => {
      if (initialRecord) {
        const opVal = typeof initialRecord.opacity === 'number'
          ? initialRecord.opacity <= 1
            ? Math.round(initialRecord.opacity * 100)
            : initialRecord.opacity
          : 100;

        form.setFieldsValue({
          code: initialRecord.code,
          name: initialRecord.name,
          layerType: initialRecord.layerType,
          source: initialRecord.source,
          visible: initialRecord.visible ?? true,
          opacity: opVal,
          order: initialRecord.order ?? 1,
          styleConfig: initialRecord.styleConfig,
          status: initialRecord.status || 'ACTIVE',
        });
      } else if (propId) {
        mapLayerService.getById(propId).then((data) => {
          const opVal = typeof data.opacity === 'number'
            ? data.opacity <= 1
              ? Math.round(data.opacity * 100)
              : data.opacity
            : 100;
          form.setFieldsValue({
            code: data.code,
            name: data.name,
            layerType: data.layerType,
            source: data.source,
            visible: data.visible ?? true,
            opacity: opVal,
            order: data.order ?? 1,
            styleConfig: data.styleConfig,
            status: data.status || 'ACTIVE',
          });
        }).catch(() => {
          toast.error('Không thể tải thông tin lớp bản đồ');
        });
      } else {
        form.setFieldsValue({
          layerType: MapLayerEnum.LayerType.POINT,
          visible: true,
          opacity: 100,
          order: 1,
          status: 'ACTIVE',
        });
      }
    }, [propId, initialRecord, form]);

    const handleFormSubmit = useCallback(async () => {
      try {
        const values = await form.validateFields();
        setSubmitting(true);
        onSubmittingChange?.(true);

        const opDecimal = (values.opacity ?? 100) / 100;

        const payload = {
          code: values.code?.trim(),
          name: values.name?.trim(),
          layerType: values.layerType,
          source: values.source?.trim() || undefined,
          visible: values.visible ?? true,
          opacity: opDecimal,
          order: values.order ?? 1,
          styleConfig: values.styleConfig?.trim() || undefined,
          status: values.status,
        };

        if (propId) {
          await mapLayerService.update(propId, payload);
          toast.success('Đã cập nhật lớp bản đồ');
        } else {
          await mapLayerService.create(payload);
          toast.success('Đã tạo lớp bản đồ mới');
        }

        onFinish?.();
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'errorFields' in err) {
          // validation error
        } else {
          toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
        }
      } finally {
        setSubmitting(false);
        onSubmittingChange?.(false);
      }
    }, [propId, form, onFinish, onSubmittingChange]);

    useImperativeHandle(ref, () => ({
      submit: handleFormSubmit,
    }));

    return (
      <>
        <style>{requiredMarkStyle}</style>

        {/* ── Section 1: Thông tin lớp bản đồ ── */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <span style={sectionTitleStyle}>
              <GlobalOutlined style={{ color: actionPrimary }} />
              Thông tin nhận diện lớp bản đồ
            </span>
          </div>
          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item
                name="code"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã lớp bản đồ</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mã lớp bản đồ' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: LAYER_PORT"
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                  disabled={!!propId}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="layerType"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Loại lớp bản đồ</span>}
                rules={[{ required: true, message: 'Vui lòng chọn loại lớp' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                  options={LAYER_TYPE_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item
                name="name"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên lớp bản đồ</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tên lớp bản đồ' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: Lớp bản đồ Cảng biển"
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="status"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Trạng thái</span>}
                rules={[{ required: true }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                  options={STATUS_OPTIONS}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* ── Section 2: Cấu hình hiển thị GIS ── */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <span style={sectionTitleStyle}>
              <EyeOutlined style={{ color: actionPrimary }} />
              Cấu hình hiển thị GIS
            </span>
          </div>
          <Row gutter={spaceMd}>
            <Col span={8}>
              <Form.Item
                name="opacity"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Độ trong suốt (%)</span>}
                rules={[{ required: true, message: 'Nhập độ trong suốt (0-100)' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                  formatter={(val) => `${val}%`}
                  parser={(val) => Number((val ?? '').replace('%', ''))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="order"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thứ tự hiển thị</span>}
                rules={[{ required: true }]}
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  max={999}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="visible"
                valuePropName="checked"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Bật hiển thị mặc định</span>}
                style={{ marginBottom: spaceFormField }}
              >
                <Switch
                  checkedChildren="Bật"
                  unCheckedChildren="Tắt"
                  style={{ marginTop: 6 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* ── Section 3: Nguồn dữ liệu & Dịch vụ ── */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <span style={sectionTitleStyle}>
              <DeploymentUnitOutlined style={{ color: actionPrimary }} />
              Nguồn dữ liệu & Cấu hình dịch vụ
            </span>
          </div>
          <Row gutter={spaceMd}>
            <Col span={24}>
              <Form.Item
                name="source"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>URL nguồn dữ liệu / Dịch vụ WMS, WFS, GeoJSON</span>}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: https://server.geoserver.vn/geoserver/wms hoặc /api/v1/gis/features"
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="styleConfig"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Cấu hình kiểu dáng JSON (Style Config)</span>}
                style={{ marginBottom: spaceFormField }}
              >
                <Input.TextArea
                  placeholder='VD: { "color": "#0284C7", "weight": 2, "fillOpacity": 0.3 }'
                  rows={3}
                  style={{ borderRadius: 8, fontSize: fontSizeMd, fontFamily: 'monospace' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </>
    );
  }
);

export default MapLayerForm;
