import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Table,
  Button,
  Card,
  Typography,
  message,
} from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ScreenHeader } from '../../components/list-view';
import { organizationService } from '../../services/organizationService';
import { bcc157Service } from '../../services/bcc157Service';
import {
  actionPrimary,
  spaceSm,
  spaceMd,
  spaceFormField,
  spaceXl,
  radiusPill,
  cardStyle,
  borderDefault,
  textSecondary,
  textPrimary,
  textTertiary,
  surfacePage,
  fontWeightBold,
  fontWeightMedium,
  fontSizeMd,
  fontSizeLg,
} from '../../tokens';
import { colors } from '../../theme';

const { Text } = Typography;

/**
 * Field name constants matching the backend Bcc157CreateRequest field names.
 */
const F = {
  maSoNguyenGiaSoDuDauNam: 'maSoNguyenGiaSoDuDauNam',
  taiSanNguyenGiaSoDuDauNam: 'taiSanNguyenGiaSoDuDauNam',
  maSoNguyenGiaTangTrongNam: 'maSoNguyenGiaTangTrongNam',
  taiSanNguyenGiaTangTrongNam: 'taiSanNguyenGiaTangTrongNam',
  maSoNguyenGiaGiamTrongNam: 'maSoNguyenGiaGiamTrongNam',
  taiSanNguyenGiaGiamTrongNam: 'taiSanNguyenGiaGiamTrongNam',
  maSoNguyenGiaSoDuCuoiNam: 'maSoNguyenGiaSoDuCuoiNam',
  taiSanNguyenGiaSoDuCuoiNam: 'taiSanNguyenGiaSoDuCuoiNam',

  maSoGiaTriHaoMonSoDuDauNam: 'maSoGiaTriHaoMonSoDuDauNam',
  taiSanGiaTriHaoMonSoDuDauNam: 'taiSanGiaTriHaoMonSoDuDauNam',
  maSoGiaTriHaoMonTangTrongNam: 'maSoGiaTriHaoMonTangTrongNam',
  taiSanGiaTriHaoMonTangTrongNam: 'taiSanGiaTriHaoMonTangTrongNam',
  maSoGiaTriHaoMonGiamTrongNam: 'maSoGiaTriHaoMonGiamTrongNam',
  taiSanGiaTriHaoMonGiamTrongNam: 'taiSanGiaTriHaoMonGiamTrongNam',
  maSoGiaTriHaoMonSoDuCuoiNam: 'maSoGiaTriHaoMonSoDuCuoiNam',
  taiSanGiaTriHaoMonSoDuCuoiNam: 'taiSanGiaTriHaoMonSoDuCuoiNam',

  maSoGiaTriConLaiTuNgayDauNam: 'maSoGiaTriConLaiTuNgayDauNam',
  taiSanGiaTriConLaiTuNgayDauNam: 'taiSanGiaTriConLaiTuNgayDauNam',
  maSoGiaTriConLaiTuNgayCuoiNam: 'maSoGiaTriConLaiTuNgayCuoiNam',
  taiSanGiaTriConLaiTuNgayCuoiNam: 'taiSanGiaTriConLaiTuNgayCuoiNam',
};

interface TableRow {
  key: string;
  stt: string;
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
  { key: 'ng1', stt: '1', chiTieu: 'Nguyên giá', isBold: true, isSectionHeader: true, isCalcField: false, isReadOnly: true },
  { key: 'ng2', stt: '', chiTieu: 'Số dư đầu năm', maSoField: F.maSoNguyenGiaSoDuDauNam, taiSanField: F.taiSanNguyenGiaSoDuDauNam, tongCongField: F.taiSanNguyenGiaSoDuDauNam, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'ng3', stt: '', chiTieu: 'Tăng trong năm', maSoField: F.maSoNguyenGiaTangTrongNam, taiSanField: F.taiSanNguyenGiaTangTrongNam, tongCongField: F.taiSanNguyenGiaTangTrongNam, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'ng4', stt: '', chiTieu: 'Giảm trong năm', maSoField: F.maSoNguyenGiaGiamTrongNam, taiSanField: F.taiSanNguyenGiaGiamTrongNam, tongCongField: F.taiSanNguyenGiaGiamTrongNam, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'ng5', stt: '', chiTieu: 'Số dư cuối năm', maSoField: F.maSoNguyenGiaSoDuCuoiNam, taiSanField: F.taiSanNguyenGiaSoDuCuoiNam, tongCongField: F.taiSanNguyenGiaSoDuCuoiNam, isBold: false, isSectionHeader: false, isCalcField: true, isReadOnly: true },

  // Section 2: Giá trị hao mòn lũy kế
  { key: 'hm1', stt: '2', chiTieu: 'Giá trị hao mòn lũy kế', isBold: true, isSectionHeader: true, isCalcField: false, isReadOnly: true },
  { key: 'hm2', stt: '', chiTieu: 'Số dư đầu năm', maSoField: F.maSoGiaTriHaoMonSoDuDauNam, taiSanField: F.taiSanGiaTriHaoMonSoDuDauNam, tongCongField: F.taiSanGiaTriHaoMonSoDuDauNam, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'hm3', stt: '', chiTieu: 'Tăng trong năm', maSoField: F.maSoGiaTriHaoMonTangTrongNam, taiSanField: F.taiSanGiaTriHaoMonTangTrongNam, tongCongField: F.taiSanGiaTriHaoMonTangTrongNam, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'hm4', stt: '', chiTieu: 'Giảm trong năm', maSoField: F.maSoGiaTriHaoMonGiamTrongNam, taiSanField: F.taiSanGiaTriHaoMonGiamTrongNam, tongCongField: F.taiSanGiaTriHaoMonGiamTrongNam, isBold: false, isSectionHeader: false, isCalcField: false, isReadOnly: false },
  { key: 'hm5', stt: '', chiTieu: 'Số dư cuối năm', maSoField: F.maSoGiaTriHaoMonSoDuCuoiNam, taiSanField: F.taiSanGiaTriHaoMonSoDuCuoiNam, tongCongField: F.taiSanGiaTriHaoMonSoDuCuoiNam, isBold: false, isSectionHeader: false, isCalcField: true, isReadOnly: true },

  // Section 3: Giá trị còn lại
  { key: 'cl1', stt: '3', chiTieu: 'Giá trị còn lại', isBold: true, isSectionHeader: true, isCalcField: false, isReadOnly: true },
  { key: 'cl2', stt: '', chiTieu: 'Tại ngày đầu năm', maSoField: F.maSoGiaTriConLaiTuNgayDauNam, taiSanField: F.taiSanGiaTriConLaiTuNgayDauNam, tongCongField: F.taiSanGiaTriConLaiTuNgayDauNam, isBold: false, isSectionHeader: false, isCalcField: true, isReadOnly: true },
  { key: 'cl3', stt: '', chiTieu: 'Tại ngày cuối năm', maSoField: F.maSoGiaTriConLaiTuNgayCuoiNam, taiSanField: F.taiSanGiaTriConLaiTuNgayCuoiNam, tongCongField: F.taiSanGiaTriConLaiTuNgayCuoiNam, isBold: false, isSectionHeader: false, isCalcField: true, isReadOnly: true },
];

export default function Bcc157Form() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Load organizations
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const resp = await organizationService.list();
        const list = [...(resp.data || [])];
        setOrganizations(list);
        const defaultOrg = list.find((o: any) => o.code === 'G17.43');
        if (defaultOrg) {
          form.setFieldValue('orgUnitId', defaultOrg.id);
        } else if (list.length > 0) {
          form.setFieldValue('orgUnitId', list[0].id);
        }
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    };
    loadOrgs();
  }, [form]);

  /**
   * Auto-calculate fields matching V1 logic:
   * - Số dư cuối năm Nguyên giá = Đầu năm + Tăng - Giảm
   * - Số dư cuối năm Hao mòn = Đầu năm + Tăng - Giảm
   * - Giá trị còn lại Đầu năm = Nguyên giá ĐN - Hao mòn ĐN
   * - Giá trị còn lại Cuối năm = Nguyên giá CN - Hao mòn CN
   */
  const autoCalculate = useCallback(() => {
    const values = form.getFieldsValue();

    const toNum = (val: any): number => {
      if (val === undefined || val === null || val === '') return 0;
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    // Read input values
    const ngDauNam = toNum(values[F.taiSanNguyenGiaSoDuDauNam]);
    const ngTang = toNum(values[F.taiSanNguyenGiaTangTrongNam]);
    const ngGiam = toNum(values[F.taiSanNguyenGiaGiamTrongNam]);

    const hmDauNam = toNum(values[F.taiSanGiaTriHaoMonSoDuDauNam]);
    const hmTang = toNum(values[F.taiSanGiaTriHaoMonTangTrongNam]);
    const hmGiam = toNum(values[F.taiSanGiaTriHaoMonGiamTrongNam]);

    // Calculate
    const ngCuoiNam = ngDauNam + ngTang - ngGiam;
    const hmCuoiNam = hmDauNam + hmTang - hmGiam;
    const clDauNam = ngDauNam - hmDauNam;
    const clCuoiNam = ngCuoiNam - hmCuoiNam;

    // Set calculated values
    form.setFieldsValue({
      [F.taiSanNguyenGiaSoDuCuoiNam]: ngCuoiNam,
      [F.taiSanGiaTriHaoMonSoDuCuoiNam]: hmCuoiNam,
      [F.taiSanGiaTriConLaiTuNgayDauNam]: clDauNam,
      [F.taiSanGiaTriConLaiTuNgayCuoiNam]: clCuoiNam,
    });
  }, [form]);

  const handleFieldChange = useCallback(() => {
    autoCalculate();
  }, [autoCalculate]);

  const handleSave = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      const values = form.getFieldsValue();
      const reportYear = values.reportYear ? dayjs(values.reportYear).year() : dayjs().year();

      const payload: any = {
        orgUnitId: values.orgUnitId,
        reportYear,
        nguonDuLieu: values.nguonDuLieu || '1',
      };

      // Map all field values
      const fieldKeys = Object.values(F);
      for (const key of fieldKeys) {
        const val = values[key];
        if (val !== undefined && val !== null && val !== '') {
          payload[key] = val;
        }
      }

      await bcc157Service.create(payload);
      message.success('Thêm mới báo cáo thành công!');
      navigate('/reports/F-142');
    } catch (err: any) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (err.message) {
        message.error(err.message);
      }
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/reports/F-142');
  };

  const columns = [
    {
      title: 'STT',
      dataIndex: 'stt',
      key: 'stt',
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
      width: 300,
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
      width: 120,
      align: 'center' as const,
      render: (_: any, record: TableRow) => {
        if (record.isSectionHeader) return null;
        if (!record.maSoField) return null;
        return (
          <Form.Item
            name={record.maSoField}
            style={{ margin: 0 }}
          >
            <Input
              maxLength={20}
              style={{
                borderRadius: radiusPill,
                height: 36,
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
      width: 200,
      align: 'right' as const,
      render: (_: any, record: TableRow) => {
        if (record.isSectionHeader) return null;
        if (!record.taiSanField) return null;
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
                height: 36,
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
      width: 200,
      align: 'right' as const,
      render: (_: any, record: TableRow) => {
        if (record.isSectionHeader) return null;
        if (!record.tongCongField) return null;
        return (
          <Form.Item
            name={record.tongCongField}
            style={{ margin: 0 }}
          >
            <InputNumber
              style={{
                width: '100%',
                borderRadius: radiusPill,
                height: 36,
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
  ];

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[
          { label: 'Danh sách báo cáo', path: '/reports' },
          { label: 'F-142 - Mẫu B04a/BCTC' },
          { label: 'Thêm mới' },
        ]}
        actions={[
          {
            key: 'save',
            label: 'Lưu',
            variant: 'primary',
            icon: <SaveOutlined />,
            onClick: handleSave,
          },
          {
            key: 'cancel',
            label: 'Hủy',
            variant: 'subtle',
            icon: <CloseOutlined />,
            onClick: handleCancel,
          },
        ]}
      />

      <Card style={{ ...cardStyle }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            reportYear: dayjs(),
            nguonDuLieu: '1',
          }}
        >
          <div style={{ display: 'flex', gap: spaceMd, flexWrap: 'wrap', marginBottom: spaceMd }}>
            <div style={{ flex: '1 1 280px', minWidth: 200 }}>
              <Form.Item
                label={<span style={{ fontWeight: fontWeightMedium }}>Đơn vị báo cáo <span style={{ color: colors.error }}>*</span></span>}
                name="orgUnitId"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị báo cáo' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn đơn vị báo cáo"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  options={organizations.map((org) => ({
                    value: org.id,
                    label: org.code ? `${org.code} - ${org.name}` : org.name,
                  }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </div>

            <div style={{ flex: '1 1 160px', minWidth: 140 }}>
              <Form.Item
                label={<span style={{ fontWeight: fontWeightMedium }}>Năm báo cáo <span style={{ color: colors.error }}>*</span></span>}
                name="reportYear"
                rules={[{ required: true, message: 'Vui lòng chọn năm báo cáo' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <DatePicker
                  picker="year"
                  placeholder="Chọn năm"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            </div>

            <div style={{ flex: '1 1 200px', minWidth: 140 }}>
              <Form.Item
                label={<span style={{ fontWeight: fontWeightMedium }}>Nguồn dữ liệu <span style={{ color: colors.error }}>*</span></span>}
                name="nguonDuLieu"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  options={[
                    { value: '1', label: 'Nguồn báo cáo' },
                    { value: '2', label: 'Nguồn dữ liệu chi tiết' },
                  ]}
                />
              </Form.Item>
            </div>
          </div>

          <div style={{ fontSize: fontSizeLg, fontWeight: fontWeightBold, color: textPrimary, marginBottom: spaceMd }}>
            Chi tiết số liệu tài sản kết cấu hạ tầng đơn vị được giao quản lý nhưng không trực tiếp khai thác, sử dụng
          </div>

          <Table
            bordered
            columns={columns}
            dataSource={TABLE_ROWS}
            pagination={false}
            rowKey="key"
            style={{ border: `1px solid ${borderDefault}`, borderRadius: 8 }}
          />
        </Form>
      </Card>
    </div>
  );
}
