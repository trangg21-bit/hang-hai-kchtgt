import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { createCctv, updateCctv, fetchCctvById } from '../api';
import { CctvResponse } from '../types';
import { OPERATIONAL_STATUS_OPTIONS } from './schema';
import toast from '../../components/ToastNotification';
import {
  colors,
  actionPrimary,
  borderDefault,
  radiusPill,
  spaceMd,
} from '../../themetokenchk';

interface CctvFormProps {
  initialData?: CctvResponse;
  onSuccess?: () => void;
}

const CctvFormContent = ({ initialData, onSuccess }: CctvFormProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isEdit, setIsEdit] = useState(!!initialData);
  const [submitting, setSubmitting] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [orgUnits, setOrgUnits] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (initialData) {
        try {
          const data = await fetchCctvById(initialData.id);
          form.setFieldsValue(data);
          setIsEdit(true);
        } catch (error) {
          toast.error('Không thể tải dữ liệu');
          navigate(-1);
        }
      }
    };
    loadData();
    loadOrgUnits();
  }, [initialData]);

  const loadOrgUnits = async () => {
    setLoadingOrgs(true);
    try {
      const res = await api.get('/common/options/org-units');
      const items = res.data?.data;
      const data = (Array.isArray(items) ? items : []).map((o: { id?: string; name?: string; code?: string; parentId?: string | null }) => ({
        id: String(o.id),
        name: o.name || 'Đơn vị',
        code: o.code || undefined,
        parentId: o.parentId ? String(o.parentId) : undefined,
      }));
      setOrgUnits(data);
    } catch (error) {
      console.error('Lỗi tải danh sách đơn vị:', error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit && initialData) {
        const payload = {
          id: initialData.id,
          ...values,
          orgUnitId: values.orgUnitId || null,
        };
        await updateCctv(payload);
        toast.success('Cập nhật hệ thống CCTV thành công');
      } else {
        const payload = {
          ...values,
          orgUnitId: values.orgUnitId || null,
        };
        await createCctv(payload);
        toast.success('Tạo mới hệ thống CCTV thành công');
      }
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/cctv');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        operationalStatus: 1,
        ...initialData,
      }}
    >
      <Form.Item
        name="deviceCode"
        label="Mã thiết bị"
        rules={[{ required: true, message: 'Vui lòng nhập mã thiết bị' }]}
      >
        <Input placeholder="Mã tự động" disabled={isEdit} style={{ borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item
        name="deviceName"
        label="Tên thiết bị"
        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }]}
      >
        <Input placeholder="Nhập tên thiết bị..." style={{ borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item name="model" label="Model">
        <Input placeholder="Nhập model..." style={{ borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item name="manufacturer" label="Hãng sản xuất" rules={[{ max: 50, message: 'Tối đa 50 ký tự' }]}>
        <Input placeholder="Nhập hãng..." style={{ borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item
        name="quantity"
        label="Số lượng"
        rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
      >
        <InputNumber min={1} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item name="yearOfUse" label="Năm đưa vào sử dụng">
        <InputNumber min={1900} max={2100} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item
        name="orgUnitId"
        label="Đơn vị quản lý"
        rules={[{ required: !isEdit, message: 'Vui lòng chọn đơn vị quản lý' }]}
      >
        <OrgUnitTreeSelect
          organizations={orgUnits}
          placeholder="Chọn đơn vị..."
          loading={loadingOrgs}
          showPath
          treeDefaultExpandAll={false}
          style={{ borderRadius: radiusPill, height: 40 }}
        />
      </Form.Item>

      <Form.Item name="operationalStatus" label="Tình trạng">
        <Select
          options={OPERATIONAL_STATUS_OPTIONS}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </Form.Item>

      <Form.Item name="detailedLocation" label="Địa điểm chi tiết" rules={[{ max: 500 }]}>
        <Input placeholder="Nhập địa điểm..." style={{ borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item name="specifications" label="Thông số kỹ thuật" rules={[{ max: 2000 }]}>
        <Input.TextArea rows={3} placeholder="Nhập thông số kỹ thuật..." style={{ borderRadius: radiusPill }} />
      </Form.Item>

      <Form.Item name="maintenanceInformation" label="Thông tin bảo trì" rules={[{ max: 2000 }]}>
        <Input.TextArea rows={3} placeholder="Nhập thông tin bảo trì..." style={{ borderRadius: radiusPill }} />
      </Form.Item>

      <Form.Item name="note" label="Ghi chú" rules={[{ max: 2000 }]}>
        <Input.TextArea rows={2} placeholder="Nhập ghi chú..." style={{ borderRadius: radiusPill }} />
      </Form.Item>

      <div style={{ textAlign: 'right', marginTop: spaceMd }}>
        <Form.Item>
          <button
            type="button"
            onClick={() => navigate('/cctv')}
            style={{
              borderRadius: radiusPill,
              height: 40,
              marginRight: spaceMd,
              padding: '0 24px',
              border: `1px solid ${borderDefault}`,
              background: 'transparent',
              color: colors.textSecondary,
            }}
          >
            Hủy
          </button>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => (
              <button
                type="submit"
                disabled={submitting}
                style={{
                  borderRadius: radiusPill,
                  height: 40,
                  padding: '0 24px',
                  background: actionPrimary,
                  border: `1px solid ${actionPrimary}`,
                  color: 'white',
                }}
              >
                {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
              </button>
            )}
          </Form.Item>
        </Form.Item>
      </div>
    </Form>
  );
};

export default CctvFormContent;
