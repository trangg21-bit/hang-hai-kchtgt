import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Table,
} from 'antd';
import { BankOutlined, AppstoreOutlined } from '@ant-design/icons';
import { message } from '../../components/ToastNotification';
import dayjs from 'dayjs';
import { isAxiosError } from 'axios';
import { organizationService, type Organization } from '../../services/organizationService';
import { bcc157Service, type Bcc157CreateRequest } from '../../services/bcc157Service';
import {
  radiusPill,
  radiusMd,
  borderDefault,
  surfacePage,
  fontWeightBold,
  fontWeightMedium,
} from '../../tokens';
import { colors } from '../../theme';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';

/**
 * Field name constants matching the backend Bcc157CreateRequest field names.
 */
const F = {
  openingOriginalCostCode: 'openingOriginalCostCode',
  assetOpeningOriginalCost: 'assetOpeningOriginalCost',
  originalCostIncreaseCode: 'originalCostIncreaseCode',
  assetOriginalCostIncrease: 'assetOriginalCostIncrease',
  originalCostDecreaseCode: 'originalCostDecreaseCode',
  assetOriginalCostDecrease: 'assetOriginalCostDecrease',
  closingOriginalCostCode: 'closingOriginalCostCode',
  assetClosingOriginalCost: 'assetClosingOriginalCost',

  openingAccumulatedDepreciationCode: 'openingAccumulatedDepreciationCode',
  assetOpeningAccumulatedDepreciation: 'assetOpeningAccumulatedDepreciation',
  depreciationIncreaseCode: 'depreciationIncreaseCode',
  assetDepreciationIncrease: 'assetDepreciationIncrease',
  depreciationDecreaseCode: 'depreciationDecreaseCode',
  assetDepreciationDecrease: 'assetDepreciationDecrease',
  closingDepreciationCode: 'closingDepreciationCode',
  assetClosingDepreciation: 'assetClosingDepreciation',

  openingResidualValueCode: 'openingResidualValueCode',
  assetOpeningResidualValue: 'assetOpeningResidualValue',
  closingResidualValueCode: 'closingResidualValueCode',
  assetClosingResidualValue: 'assetClosingResidualValue',
};

interface TableRow {
  key: string;
  sequenceNo: string;
  chiTieu: string;
  maSoField?: string;
  taiSanField?: string;
  tongCongField?: string;
  isBold: boolean;
  isSectionHeader: boolean;
  isCalcField: boolean;
  isReadOnly: boolean;
}

const TABLE_ROWS: TableRow[] = [
  // Section 1: Nguyên giá
  { key: 'ng1', sequenceNo: '1', chiTieu: 'Nguyên giá', isBold: true, isSectionHeader: true, isCalcField: false, isReadOnly: true },
  { key: 'ng2', sequenceNo: '', chiTieu: 'Số dư đầu năm', maSoField: F.openingOriginalCostCode, taiSanField: F.assetOpeningOriginalCost, tongCongField: F.assetOpeningOriginalCost, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'ng3', sequenceNo: '', chiTieu: 'Tăng trong năm', maSoField: F.originalCostIncreaseCode, taiSanField: F.assetOriginalCostIncrease, tongCongField: F.assetOriginalCostIncrease, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'ng4', sequenceNo: '', chiTieu: 'Giảm trong năm', maSoField: F.originalCostDecreaseCode, taiSanField: F.assetOriginalCostDecrease, tongCongField: F.assetOriginalCostDecrease, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'ng5', sequenceNo: '', chiTieu: 'Số dư cuối năm', maSoField: F.closingOriginalCostCode, taiSanField: F.assetClosingOriginalCost, tongCongField: F.assetClosingOriginalCost, isBold: false, isSectionHeader: false, isCalcField: true, isReadOnly: true },

  // Section 2: Giá trị hao mòn lũy kế
  { key: 'hm1', sequenceNo: '2', chiTieu: 'Giá trị hao mòn lũy kế', isBold: true, isSectionHeader: true, isCalcField: false, isReadOnly: true },
  { key: 'hm2', sequenceNo: '', chiTieu: 'Số dư đầu năm', maSoField: F.openingAccumulatedDepreciationCode, taiSanField: F.assetOpeningAccumulatedDepreciation, tongCongField: F.assetOpeningAccumulatedDepreciation, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'hm3', sequenceNo: '', chiTieu: 'Tăng trong năm', maSoField: F.depreciationIncreaseCode, taiSanField: F.assetDepreciationIncrease, tongCongField: F.assetDepreciationIncrease, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'hm4', sequenceNo: '', chiTieu: 'Giảm trong năm', maSoField: F.depreciationDecreaseCode, taiSanField: F.assetDepreciationDecrease, tongCongField: F.assetDepreciationDecrease, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'hm5', sequenceNo: '', chiTieu: 'Số dư cuối năm', maSoField: F.closingDepreciationCode, taiSanField: F.assetClosingDepreciation, tongCongField: F.assetClosingDepreciation, isBold: false, isSectionHeader: false, isCalcField: true, isReadOnly: true },

  // Section 3: Giá trị còn lại
  { key: 'cl1', sequenceNo: '3', chiTieu: 'Giá trị còn lại', isBold: true, isSectionHeader: true, isCalcField: false, isReadOnly: true },
  { key: 'cl2', sequenceNo: '', chiTieu: 'Tại ngày đầu năm', maSoField: F.openingResidualValueCode, taiSanField: F.assetOpeningResidualValue, tongCongField: F.assetOpeningResidualValue, isBold: false, isSectionHeader: false, isCalcField: true, isReadOnly: true },
  { key: 'cl3', sequenceNo: '', chiTieu: 'Tại ngày cuối năm', maSoField: F.closingResidualValueCode, taiSanField: F.assetClosingResidualValue, tongCongField: F.assetClosingResidualValue, isBold: false, isSectionHeader: false, isCalcField: true, isReadOnly: true },
];

export interface Bcc157FormProps {
  open: boolean;
  reportId?: string;
  onClose?: () => void;
  onSaved?: () => void;
}

export default function Bcc157Form({ open, reportId, onClose, onSaved }: Bcc157FormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState('DRAFT');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [version, setVersion] = useState<number>();

  useEffect(() => {
    if (!open) return;
    if (!reportId) {
      form.resetFields();
      form.setFieldsValue({
        reportYear: dayjs(),
        nguonDuLieu: '1',
      });
      return;
    }
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi reportId thay đổi
    setLoading(true);
    void bcc157Service.getById(reportId).then((report) => {
      if (!active) return;
      form.setFieldsValue({ ...report, reportYear: dayjs().year(report.reportYear) });
      setVersion(report.version);
    }).catch(() => {
      message.error('Không thể tải báo cáo để sửa');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [open, reportId, form]);

  // Load organizations
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const resp = await organizationService.list();
        const list = [...(resp.data || [])];
        setOrganizations(list);
        const defaultOrg = list.find((o: Organization) => o.code === 'G17.43');
        if (!reportId && defaultOrg) {
          form.setFieldValue('orgUnitId', defaultOrg.id);
        } else if (!reportId && list.length > 0) {
          form.setFieldValue('orgUnitId', list[0].id);
        }
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    };
    if (open) {
      void loadOrgs();
    }
  }, [open, form, reportId]);

  /**
   * Auto-calculate fields matching V1 logic:
   * - Số dư cuối năm Nguyên giá = Đầu năm + Tăng - Giảm
   * - Số dư cuối năm Hao mòn = Đầu năm + Tăng - Giảm
   * - Giá trị còn lại Đầu năm = Nguyên giá ĐN - Hao mòn ĐN
   * - Giá trị còn lại Cuối năm = Nguyên giá CN - Hao mòn CN
   */
  const autoCalculate = useCallback(() => {
    const values = form.getFieldsValue();

    const toNum = (val: unknown): number => {
      if (val === undefined || val === null || val === '') return 0;
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    // Read input values
    const ngDauNam = toNum(values[F.assetOpeningOriginalCost]);
    const ngTang = toNum(values[F.assetOriginalCostIncrease]);
    const ngGiam = toNum(values[F.assetOriginalCostDecrease]);

    const hmDauNam = toNum(values[F.assetOpeningAccumulatedDepreciation]);
    const hmTang = toNum(values[F.assetDepreciationIncrease]);
    const hmGiam = toNum(values[F.assetDepreciationDecrease]);

    // Calculate
    const ngCuoiNam = ngDauNam + ngTang - ngGiam;
    const hmCuoiNam = hmDauNam + hmTang - hmGiam;
    const clDauNam = ngDauNam - hmDauNam;
    const clCuoiNam = ngCuoiNam - hmCuoiNam;

    // Set calculated values
    form.setFieldsValue({
      [F.assetClosingOriginalCost]: ngCuoiNam,
      [F.assetClosingDepreciation]: hmCuoiNam,
      [F.assetOpeningResidualValue]: clDauNam,
      [F.assetClosingResidualValue]: clCuoiNam,
    });
  }, [form]);

  const handleFieldChange = useCallback(() => {
    autoCalculate();
  }, [autoCalculate]);

  const handleSave = useCallback(async (targetAction: string) => {
    if (reportId && version === undefined) {
      message.error('Chưa tải được báo cáo để sửa');
      return;
    }
    try {
      await form.validateFields();
      setSaving(true);
      setSaveAction(targetAction);

      const values = form.getFieldsValue();
      const reportYear = values.reportYear ? dayjs(values.reportYear).year() : dayjs().year();

      const payload: Bcc157CreateRequest & Record<string, unknown> = {
        version,
        orgUnitId: values.orgUnitId,
        reportYear,
        nguonDuLieu: values.nguonDuLieu || '1',
      };

      // Map all field values
      const computed = new Set([
        F.assetClosingOriginalCost,
        F.assetClosingDepreciation,
        F.assetOpeningResidualValue,
        F.assetClosingResidualValue,
      ]);
      const fieldKeys = Object.values(F).filter((key) => !computed.has(key));
      for (const key of fieldKeys) {
        const val = values[key];
        if (val !== undefined && val !== null && val !== '') {
          payload[key] = typeof val === 'string' ? val.trim() : val;
        }
      }

      if (reportId) {
        await bcc157Service.update(reportId, payload);
      } else {
        await bcc157Service.create(payload);
      }
      message.success(
        targetAction === 'APPROVED'
          ? 'Đã lưu và phê duyệt báo cáo thành công!'
          : 'Đã lưu tạm báo cáo thành công!'
      );
      if (onSaved) onSaved();
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err) && err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (err instanceof Error) {
        message.error(err.message);
      }
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }, [reportId, version, form, onSaved]);

  const columns = useMemo(() => [
    {
      title: 'STT',
      dataIndex: 'sequenceNo',
      key: 'sequenceNo',
      width: 60,
      align: 'center' as const,
      onCell: (record: TableRow) => ({
        style: {
          fontWeight: record.isBold ? fontWeightBold : fontWeightMedium,
          background: record.isSectionHeader ? surfacePage : undefined,
        },
      }),
    },
    {
      title: 'Chỉ tiêu',
      dataIndex: 'chiTieu',
      key: 'chiTieu',
      width: 320,
      onCell: (record: TableRow) => ({
        style: {
          fontWeight: record.isBold ? fontWeightBold : fontWeightMedium,
          background: record.isSectionHeader ? surfacePage : undefined,
        },
      }),
    },
    {
      title: 'Mã số',
      dataIndex: 'maSoField',
      key: 'maSo',
      width: 130,
      align: 'center' as const,
      render: (_: unknown, record: TableRow) => {
        if (record.isSectionHeader || !record.maSoField) return null;
        return (
          <Form.Item name={record.maSoField} style={{ margin: 0 }}>
            <Input
              maxLength={20}
              style={{
                borderRadius: radiusPill,
                height: 40,
                textAlign: 'center',
              }}
              disabled={record.isCalcField}
              onChange={handleFieldChange}
              placeholder="Mã số"
            />
          </Form.Item>
        );
      },
    },
    {
      title: <>TSHT hàng hải <span style={{ color: colors.error }}>*</span></>,
      dataIndex: 'taiSanField',
      key: 'taiSan',
      width: 220,
      align: 'right' as const,
      render: (_: unknown, record: TableRow) => {
        if (record.isSectionHeader || !record.taiSanField) return null;
        return (
          <Form.Item
            name={record.taiSanField}
            style={{ margin: 0 }}
            rules={record.isCalcField ? [] : [
              {
                type: 'number',
                min: 0,
                message: 'Giá trị phải >= 0',
              },
            ]}
          >
            <InputNumber
              style={{
                width: '100%',
                borderRadius: radiusPill,
                height: 40,
              }}
              disabled={record.isCalcField || record.isReadOnly}
              onChange={handleFieldChange}
              formatter={(value) => {
                if (value === undefined || value === null) return '';
                return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }}
              parser={(value) => {
                if (!value) return 0;
                return Number(value.replace(/,/g, ''));
              }}
              placeholder="0"
              stringMode={false}
            />
          </Form.Item>
        );
      },
    },
    {
      title: 'Tổng cộng',
      dataIndex: 'tongCongField',
      key: 'tongCong',
      width: 220,
      align: 'right' as const,
      render: (_: unknown, record: TableRow) => {
        if (record.isSectionHeader || !record.tongCongField) return null;
        return (
          <Form.Item name={record.tongCongField} style={{ margin: 0 }}>
            <InputNumber
              style={{
                width: '100%',
                borderRadius: radiusPill,
                height: 40,
              }}
              disabled={true}
              formatter={(value) => {
                if (value === undefined || value === null) return '';
                return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }}
              parser={(value) => {
                if (!value) return 0;
                return Number(value.replace(/,/g, ''));
              }}
              placeholder="0"
              stringMode={false}
            />
          </Form.Item>
        );
      },
    },
  ], [handleFieldChange]);

  const formTabs = useMemo<FormTabConfig[]>(() => {
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'report_info',
            title: 'Thông tin báo cáo',
            icon: <BankOutlined />,
            fields: [
              {
                name: 'orgUnitId',
                label: 'Đơn vị báo cáo',
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                disabled: Boolean(reportId),
                rules: [{ required: true, message: 'Đơn vị báo cáo là bắt buộc' }],
              },
              {
                name: 'reportYear',
                label: 'Năm báo cáo',
                type: FormFieldType.Year,
                required: true,
                disabled: Boolean(reportId),
                rules: [{ required: true, message: 'Năm báo cáo là bắt buộc' }],
              },
              {
                name: 'nguonDuLieu',
                label: 'Nguồn dữ liệu',
                type: FormFieldType.Select,
                disabled: Boolean(reportId),
                options: [
                  { value: '1', label: 'Báo cáo đã nhập' },
                  ...(reportId ? [{ value: '2', label: 'Dữ liệu nhập cũ (nguồn 2)' }] : []),
                ],
              },
            ],
          },
          {
            key: 'financial_data',
            title: 'Chi tiết số liệu tài sản KCHT (đơn vị: tỷ đồng)',
            icon: <AppstoreOutlined />,
            fields: [
              {
                name: 'tableGrid',
                label: '',
                type: FormFieldType.Custom,
                colSpan: 24,
                customRender: () => (
                  <Table
                    bordered
                    columns={columns}
                    dataSource={TABLE_ROWS}
                    pagination={false}
                    rowKey="key"
                    style={{ border: `1px solid ${borderDefault}`, borderRadius: radiusMd }}
                  />
                ),
              },
            ],
          },
        ],
      },
    ];
  }, [organizations, reportId, columns]);

  const footerActions = useMemo<FormSidebarAction[]>(() => [
    {
      key: 'cancel',
      label: 'Hủy',
      variant: 'subtle',
      onClick: () => {
        if (onClose) onClose();
      },
    },
    {
      key: 'draft',
      label: 'Lưu tạm',
      variant: 'outline',
      loading: saving && saveAction === 'DRAFT',
      onClick: () => void handleSave('DRAFT'),
    },
    {
      key: 'approve',
      label: 'Lưu và phê duyệt',
      variant: 'success',
      loading: saving && saveAction === 'APPROVED',
      onClick: () => void handleSave('APPROVED'),
    },
  ], [saving, saveAction, onClose, handleSave]);

  const title = reportId
    ? 'Chỉnh sửa báo cáo BCC157 (Mẫu B04a/BCTC)'
    : 'Thêm mới báo cáo BCC157 (Mẫu B04a/BCTC)';

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      loading={loading}
      onClose={() => {
        if (onClose) onClose();
      }}
      form={form}
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
      width={
        typeof window !== 'undefined'
          ? Math.min(1150, Math.floor(window.innerWidth * 0.95))
          : 1150
      }
    />
  );
}
