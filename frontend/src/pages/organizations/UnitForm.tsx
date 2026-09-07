import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, Form, Button, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { organizationService, RANK_OPTIONS } from '../../services/organizationService';
import type { CreateOrganizationPayload, UpdateOrganizationPayload, CandidateParent } from '../../services/organizationService';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';
import { spaceMd, spaceLg, radiusPill, fontSizeMd, fontWeightBold, borderDefault, textSecondary } from '../../tokens';
import { colors } from '../../theme';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';

export default function UnitForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<UpdateOrganizationPayload & { parentOrgId?: string } | null>(null);
  const [candidateParents, setCandidateParents] = useState<CandidateParent[]>([]);

  // Load eligible candidate parents from backend
  useEffect(() => {
    let active = true;
    organizationService.getCandidateParents(id)
      .then((candidates) => {
        if (active) setCandidateParents(candidates);
      })
      .catch(() => {
        if (active) setCandidateParents([]);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Load existing data for edit
  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await organizationService.getById(id!);
          setInitialData({
            name: data.name,
            parentId: data.parentId,
            description: data.description,
            provinceId: data.provinceId,
            detailAddress: data.detailAddress,
            phone: data.phone,
            operationalStatus: data.operationalStatus,
            rank: data.rank,
          });
          form.setFieldsValue({
            name: data.name,
            parentId: data.parentId,
            description: data.description,
            provinceId: data.provinceId != null ? String(data.provinceId) : undefined,
            detailAddress: data.detailAddress,
            phone: data.phone,
            operationalStatus: data.operationalStatus,
            rank: data.rank,
          });
        } catch {
          toast.error('Không thể tải thông tin đơn vị');
          navigate('/organizations');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const parentOptions = useMemo(() => {
    return candidateParents
      .filter((cand) => !cand.disabled || cand.currentParent)
      .map((cand) => ({
        value: cand.id,
        label: cand.currentParent ? `${cand.name} (Hiện tại)` : cand.name,
        disabled: cand.disabled,
      }));
  }, [candidateParents]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const targetParentId = values.parentId ? values.parentId : (isEdit && initialData?.parentId ? '00000000-0000-0000-0000-000000000000' : undefined);

      if (isEdit) {
        const payload: UpdateOrganizationPayload = {
          name: values.name,
          parentId: targetParentId,
          description: values.description,
          provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
          detailAddress: values.detailAddress,
          phone: values.phone,
          operationalStatus: values.operationalStatus,
          rank: values.rank,
        };
        await organizationService.update(id!, payload);
        toast.success('Đã cập nhật đơn vị thành công');
      } else {
        const payload: CreateOrganizationPayload = {
          name: values.name,
          parentId: targetParentId,
          description: values.description,
          provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
          detailAddress: values.detailAddress,
          phone: values.phone,
          operationalStatus: values.operationalStatus,
          rank: values.rank,
        };
        await organizationService.create(payload);
        toast.success('Đã tạo đơn vị thành công');
      }

      navigate('/organizations');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  return (
    <>
      <Card style={{ marginBottom: spaceMd }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0, color: colors.sidebarBg, fontWeight: fontWeightBold }}>
            {isEdit ? 'Chỉnh sửa đơn vị' : 'Thêm mới đơn vị'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} onFinishFailed={(info) => console.error("Form validation failed:", info)} initialValues={{ operationalStatus: 'active', ...initialData }}>
          <FormField
            type="text"
            name="name"
            label="Tên đơn vị"
            required
            placeholder="VD: Phòng CNTT"
          />

          <FormField
            type="select"
            name="parentId"
            label="Đơn vị cha"
            options={[{ value: '', label: '(Không có) — đơn vị cấp cao nhất' }, ...parentOptions]}
            help="Để trống nếu đây là đơn vị cấp cao nhất"
          />

          <FormField
            type="select"
            name="rank"
            label="Cấp đơn vị"
            required
            options={RANK_OPTIONS}
          />

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả ngắn về đơn vị..."
          />

          <FormField
            type="select"
            name="provinceId"
            label="Địa điểm (Tỉnh/Thành phố)"
            required
            options={VIETNAM_PROVINCE_OPTIONS}
          />

          <FormField
            type="text"
            name="detailAddress"
            label="Địa điểm chi tiết"
            placeholder="Số nhà, đường, phường/xã..."
          />

          <FormField
            type="phone"
            name="phone"
            label="Số điện thoại"
            placeholder="0901234567"
          />

          <FormField
            type="select"
            name="operationalStatus"
            label="Trạng thái"
            required
            options={[
              { value: 'active', label: 'Sử dụng' },
              { value: 'inactive', label: 'Không sử dụng' },
            ]}
          />

          <Form.Item style={{ marginTop: spaceLg }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>
                Lưu
              </Button>
              <Button onClick={() => navigate(-1)} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
