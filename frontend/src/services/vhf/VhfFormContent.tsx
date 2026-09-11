import { useState, useEffect, useCallback } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { createVhf, updateVhf, fetchVhfById } from '../api';
import { VhfResponse } from '../types';
import toast from '../../components/ToastNotification';
import {
  colors,
  actionPrimary,
  borderDefault,
  radiusPill,
  spaceMd,
} from '../../themetokenchk';
import NumberInputWithCount from '../../components/shared/NumberInputWithCount';
import { parseNumber5, getValueFromEvent5, integer5Rule } from '../../utils/numberRuleHelper';

// Clone từ services/cctv/CctvFormContent.tsx — Quản lý hệ thống thông tin liên lạc VHF

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 0, label: 'Chưa khai thác/vận hành' },
  { value: 1, label: 'Đang khai thác/vận hành' },
  { value: 2, label: 'Dừng khai thác/vận hành' },
];

interface VhfFormProps {
  initialData?: VhfResponse;
  onSuccess?: () => void;
}

const VhfFormContent = ({ initialData, onSuccess }: VhfFormProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isEdit] = useState(!!initialData);
  const [submitting, setSubmitting] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [orgUnits, setOrgUnits] = useState<Array<{ id: string; name: string; code?: string; parentId?: string }>>([]);

  const loadOrgUnits = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (initialData) {
        try {
          const data = await fetchVhfById(initialData.id);
          form.setFieldsValue(data);
        } catch {
          toast.error('Không thể tải dữ liệu');
          navigate(-1);
        }
      }
    };
    loadData();
    loadOrgUnits();
  }, [initialData, form, navigate, loadOrgUnits]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      if (isEdit && initialData) {
        const payload = {
          id: initialData.id,
          ...values,
          orgUnitId: values.orgUnitId || null,
        };
        await updateVhf(payload as never);
        toast.success('Cập nhật hệ thống thông tin liên lạc VHF thành công');
      } else {
        const payload = {
          ...values,
          orgUnitId: values.orgUnitId || null,
        };
        await createVhf(payload as never);
        toast.success('Tạo mới hệ thống thông tin liên lạc VHF thành công');
      }
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/vhf');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi lưu');
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
        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
      >
        <Input placeholder="Nhập tên thiết bị..." maxLength={255} showCount style={{ borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item name="model" label="Model" rules={[{ max: 255, message: 'Tối đa 255 ký tự' }]}>
        <Input placeholder="Nhập model..." maxLength={255} showCount style={{ borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item name="manufacturer" label="Hãng sản xuất" rules={[{ max: 50, message: 'Tối đa 50 ký tự' }]}>
        <Input placeholder="Nhập hãng..." maxLength={50} showCount style={{ borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item
        name="quantity"
        label="Số lượng"
        getValueFromEvent={getValueFromEvent5}
        rules={[
          { required: true, message: 'Vui lòng nhập số lượng' },
          integer5Rule,
        ]}
      >
        <NumberInputWithCount
          min={1}
          step={1}
          precision={0}
          placeholder="0"
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
          maxLength={5}
          parser={parseNumber5}
        />
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

      <Form.Item name="detailedLocation" label="Địa điểm chi tiết" rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}>
        <Input placeholder="Nhập địa điểm..." maxLength={500} showCount style={{ borderRadius: radiusPill, height: 40 }} />
      </Form.Item>

      <Form.Item name="specifications" label="Thông số kỹ thuật" rules={[{ max: 2000, message: 'Tối đa 2000 ký tự' }]}>
        <Input.TextArea rows={3} placeholder="Nhập thông số kỹ thuật..." maxLength={2000} showCount style={{ borderRadius: radiusPill }} />
      </Form.Item>

      <Form.Item name="maintenanceInformation" label="Thông tin bảo trì" rules={[{ max: 2000, message: 'Tối đa 2000 ký tự' }]}>
        <Input.TextArea rows={3} placeholder="Nhập thông tin bảo trì..." maxLength={2000} showCount style={{ borderRadius: radiusPill }} />
      </Form.Item>

      <Form.Item name="note" label="Ghi chú" rules={[{ max: 2000, message: 'Tối đa 2000 ký tự' }]}>
        <Input.TextArea rows={2} placeholder="Nhập ghi chú..." maxLength={2000} showCount style={{ borderRadius: radiusPill }} />
      </Form.Item>

      <div style={{ textAlign: 'right', marginTop: spaceMd }}>
        <Form.Item>
          <button
            type="button"
            onClick={() => navigate('/vhf')}
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
        </Form.Item>
      </div>
    </Form>
  );
};

export default VhfFormContent;
