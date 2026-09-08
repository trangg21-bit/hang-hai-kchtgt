import { forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { Form, Input, Select, Row, Col, Button, type FormInstance } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { BankOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { spatialObjectCategoryService } from '../../services/spatialObjectCategoryService';
import type { SpatialObjectCategory } from '../../services/spatialObjectCategoryService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as MapSymbolItem } from '../../services/symbolService';
import { ScreenHeader } from '../../components/list-view';
import toast from '../../components/ToastNotification';
import { colors } from '../../themetokenchk';
import {
  actionPrimary,
  fontSizeMd,
  fontWeightBold,
  radiusPill,
  spaceFormField,
  spaceMd,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
} from '../../themetokenchk';

export interface PolygonObjectFormRef {
  submit: () => void;
}

export interface PolygonObjectFormProps {
  form?: FormInstance;
  id?: string;
  initialRecord?: SpatialObjectCategory | null;
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

const STATUS_OPTIONS = [
  { value: 1, label: 'Sử dụng' },
  { value: 0, label: 'Khóa' },
];

export const PolygonObjectForm = forwardRef<PolygonObjectFormRef, PolygonObjectFormProps>(
  ({ form: externalForm, id: propId, initialRecord, onFinish, onSubmittingChange }, ref) => {
    const navigate = useNavigate();
    const routeParams = useParams<{ id: string }>();
    const effectiveId = propId || routeParams.id;
    const isStandalonePage = !externalForm;

    const [internalForm] = Form.useForm();
    const form = externalForm || internalForm;

    const [symbols, setSymbols] = useState<MapSymbolItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      symbolService.list({ pageSize: 1000 }).then((res) => {
        setSymbols(res.data || []);
      }).catch(() => {});
    }, []);

    useEffect(() => {
      if (initialRecord) {
        form.setFieldsValue({
          code: initialRecord.code,
          name: initialRecord.name,
          iconId: initialRecord.iconId,
          status: initialRecord.status ?? 1,
        });
      } else if (effectiveId) {
        spatialObjectCategoryService.getById(effectiveId).then((data) => {
          form.setFieldsValue({
            code: data.code,
            name: data.name,
            iconId: data.iconId,
            status: data.status ?? 1,
          });
        }).catch(() => {
          toast.error('Không thể tải thông tin đối tượng vùng');
        });
      } else {
        form.setFieldsValue({ status: 1 });
      }
    }, [effectiveId, initialRecord, form]);

    const handleFormSubmit = useCallback(async () => {
      try {
        const values = await form.validateFields();
        setSubmitting(true);
        onSubmittingChange?.(true);

        const payload = {
          code: values.code?.trim(),
          name: values.name?.trim(),
          geometryType: 3, // Polygon
          iconId: values.iconId,
          status: values.status ?? 1,
        };

        if (effectiveId) {
          await spatialObjectCategoryService.update(effectiveId, payload);
          toast.success('Đã cập nhật danh mục đối tượng vùng');
        } else {
          await spatialObjectCategoryService.create(payload);
          toast.success('Đã thêm mới danh mục đối tượng vùng');
        }

        if (onFinish) {
          onFinish();
        } else if (isStandalonePage) {
          navigate('/gis/polygons');
        }
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
    }, [effectiveId, form, onFinish, onSubmittingChange, isStandalonePage, navigate]);

    useImperativeHandle(ref, () => ({
      submit: handleFormSubmit,
    }));

    const formBody = (
      <>
        <style>{requiredMarkStyle}</style>
        {/* ── Section 1: Thông tin định danh ── */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <span style={sectionTitleStyle}>
              <BankOutlined style={{ color: actionPrimary }} />
              Thông tin nhận diện & phân loại
            </span>
          </div>
          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item
                name="code"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã đối tượng vùng</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mã đối tượng vùng' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: KHU_NEO_DAU"
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                  disabled={!!effectiveId}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            <Col span={24}>
              <Form.Item
                name="name"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên đối tượng vùng</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tên đối tượng vùng' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: Khu neo đậu"
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* ── Section 2: Cấu hình biểu tượng bản đồ ── */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <span style={sectionTitleStyle}>
              <EnvironmentOutlined style={{ color: actionPrimary }} />
              Cấu hình biểu tượng bản đồ
            </span>
          </div>
          <Row gutter={spaceMd}>
            <Col span={24}>
              <Form.Item
                name="iconId"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Biểu tượng liên kết</span>}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn biểu tượng thể hiện trên bản đồ"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                >
                  {symbols.map((s) => (
                    <Select.Option key={s.id} value={s.id} label={`${s.name} ${s.code}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {s.image ? (
                          <img
                            src={s.image}
                            alt={s.name}
                            style={{ width: 22, height: 22, objectFit: 'contain' }}
                          />
                        ) : (
                          <EnvironmentOutlined style={{ color: colors.textTertiary }} />
                        )}
                        <span>{s.name} ({s.code})</span>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>
      </>
    );

    if (isStandalonePage) {
      return (
        <div style={{ padding: '0 24px 24px 24px' }}>
          <ScreenHeader
            breadcrumb={[
              { label: 'Quản lý KCHT trên nền bản đồ (GIS)' },
              { label: 'Quản lý danh mục đối tượng vùng' },
              { label: effectiveId ? 'Chỉnh sửa' : 'Thêm mới' },
            ]}
          />
          <Form form={form} layout="vertical" style={{ maxWidth: 800, marginTop: 16 }}>
            {formBody}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <Button onClick={() => navigate('/gis/polygons')} style={outlineButtonStyle}>
                Hủy
              </Button>
              <Button type="primary" onClick={handleFormSubmit} loading={submitting} style={primaryButtonStyle}>
                {effectiveId ? 'Lưu thay đổi' : 'Tạo mới'}
              </Button>
            </div>
          </Form>
        </div>
      );
    }

    return formBody;
  }
);

export default PolygonObjectForm;
