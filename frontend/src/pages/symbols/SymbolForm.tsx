import { forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { Form, Input, Select, Upload, Button, Row, Col, Alert, type FormInstance } from 'antd';
import { PictureOutlined, BankOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import toast from '../../components/ToastNotification';
import { colors } from '../../themetokenchk';
import {
  actionPrimary,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  radiusPill,
  radiusMd,
  spaceFormField,
  spaceMd,
  spaceSm,
  spaceXs,
  borderDefault,
  surfacePage,
  textTertiary,
  outlineButtonStyle,
  requiredMarkStyle,
} from '../../themetokenchk';

export interface SymbolFormRef {
  submit: () => void;
}

export interface SymbolFormProps {
  form?: FormInstance;
  id?: string;
  initialRecord?: Symbol | null;
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
  { value: 'active', label: 'Sử dụng' },
  { value: 'inactive', label: 'Không sử dụng' },
];

export const SymbolForm = forwardRef<SymbolFormRef, SymbolFormProps>(
  ({ form: externalForm, id: propId, initialRecord, onFinish, onSubmittingChange }, ref) => {
    const [internalForm] = Form.useForm();
    const form = externalForm || internalForm;

    const [, setSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [imageError, setImageError] = useState<string | null>(null);

    useEffect(() => {
      if (initialRecord) {
        form.setFieldsValue({
          code: initialRecord.code,
          name: initialRecord.name,
          description: initialRecord.description,
          status: initialRecord.status || 'active',
          image: initialRecord.image,
        });
        setImagePreview(initialRecord.image || '');
      } else if (propId) {
        symbolService.getById(propId).then((data) => {
          form.setFieldsValue({
            code: data.code,
            name: data.name,
            description: data.description,
            status: data.status || 'active',
            image: data.image,
          });
          setImagePreview(data.image || '');
        }).catch(() => {
          toast.error('Không thể tải thông tin biểu tượng');
        });
      } else {
        form.setFieldsValue({
          status: 'active',
        });
        setImagePreview('');
      }
      setImageError(null);
    }, [propId, initialRecord, form]);

    const validateImageFile = (file: File): Promise<string | null> => {
      return new Promise((resolve) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
          resolve('Ảnh biểu tượng phải có định dạng PNG, JPG hoặc SVG');
          return;
        }
        if (file.size > 500 * 1024) {
          resolve('Ảnh biểu tượng không được vượt quá 500KB');
          return;
        }
        if (file.type === 'image/svg+xml') {
          resolve(null);
          return;
        }
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          if (img.naturalWidth > 128 || img.naturalHeight > 128) {
            resolve('Ảnh biểu tượng không được vượt quá 128×128 pixels');
            return;
          }
          if (Math.abs(img.naturalWidth - img.naturalHeight) > 2) {
            resolve('Ảnh biểu tượng phải có tỉ lệ gần 1:1 (hình vuông)');
            return;
          }
          resolve(null);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve('Không thể đọc dữ liệu file ảnh');
        };
        img.src = url;
      });
    };

    const handleImageUpload = async (file: File) => {
      setImageError(null);
      const valErr = await validateImageFile(file);
      if (valErr) {
        setImageError(valErr);
        return false;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImagePreview(base64);
        form.setFieldsValue({ image: base64 });
      };
      reader.readAsDataURL(file);
      return false;
    };

    const handleRemoveImage = () => {
      setImagePreview('');
      form.setFieldsValue({ image: '' });
      setImageError(null);
    };

    const handleFormSubmit = useCallback(async () => {
      try {
        const values = await form.validateFields();
        if (!imagePreview && !values.image) {
          setImageError('Vui lòng tải lên ảnh biểu tượng');
          return;
        }

        setSubmitting(true);
        onSubmittingChange?.(true);

        const payload = {
          code: values.code?.trim(),
          name: values.name?.trim(),
          description: values.description?.trim() || undefined,
          status: values.status,
          image: imagePreview || values.image,
        };

        if (propId) {
          await symbolService.update(propId, payload);
          toast.success('Đã cập nhật biểu tượng bản đồ');
        } else {
          await symbolService.create(payload);
          toast.success('Đã tạo mới biểu tượng bản đồ');
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
    }, [propId, form, imagePreview, onFinish, onSubmittingChange]);

    useImperativeHandle(ref, () => ({
      submit: handleFormSubmit,
    }));

    return (
      <>
        <style>{requiredMarkStyle}</style>

        {/* ── Section 1: Tải lên hình ảnh biểu tượng ── */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <span style={sectionTitleStyle}>
              <PictureOutlined style={{ color: actionPrimary }} />
              Hình ảnh biểu tượng (PNG / JPG / SVG)
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: surfacePage,
                  border: `1px dashed ${borderDefault}`,
                  borderRadius: radiusMd,
                  padding: spaceXs,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <PictureOutlined style={{ fontSize: 32, color: textTertiary }} />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Upload
                    accept="image/png,image/jpeg,image/svg+xml"
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} style={outlineButtonStyle}>
                      {imagePreview ? 'Thay đổi ảnh' : 'Tải lên hình ảnh'}
                    </Button>
                  </Upload>
                  {imagePreview && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveImage}
                      style={{ borderRadius: radiusPill, height: 40 }}
                    >
                      Xóa ảnh
                    </Button>
                  )}
                </div>
                <div style={{ fontSize: fontSizeSm, color: textTertiary }}>
                  Yêu cầu: Tỉ lệ 1:1, tối đa 128×128 px, dung lượng &lt; 500KB.
                </div>
              </div>
            </div>

            {imageError && (
              <Alert
                type="error"
                showIcon
                message={imageError}
                style={{ marginTop: 8, borderRadius: 6 }}
              />
            )}
          </div>
          <Form.Item name="image" hidden>
            <Input />
          </Form.Item>
        </div>

        {/* ── Section 2: Thông tin định danh ── */}
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
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã biểu tượng</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mã biểu tượng' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: SYM_BUOY_01"
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                  disabled={!!propId}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Trạng thái sử dụng</span>}
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
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên biểu tượng</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tên biểu tượng' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: Biểu tượng Phao báo hiệu số 1"
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="description"
                label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mô tả công năng / Ghi chú</span>}
                style={{ marginBottom: spaceFormField }}
              >
                <Input.TextArea
                  placeholder="Nhập thông tin mô tả chi tiết cho biểu tượng..."
                  rows={3}
                  style={{ borderRadius: 8, fontSize: fontSizeMd }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </>
    );
  }
);

export default SymbolForm;
