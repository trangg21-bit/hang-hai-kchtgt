import React, { useMemo } from 'react';
import { Row, Col, Form, Input, Select, InputNumber, Tabs, DatePicker } from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { BankOutlined, SlidersOutlined } from '@ant-design/icons';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import type { Organization } from '../../services/organizationService';
import type { Berth } from '../../types/port';
import type { PortTerminalAssetPayload } from '../../services/assetmovement/types';
import { fmtInputNumber } from '../../utils/numFmt';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors, actionPrimary,
  fontSizeMd, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceFormField,
  readonlyInputStyle, drawerTabBarStyle, drawerFormScrollStyle,
  getDatePickerProps,
} from '../../themetokenchk';

export type FormValues = Omit<PortTerminalAssetPayload, 'assetType' | 'constructionYear' | 'useDate' | 'declarationDate' | 'depreciationStartDate' | 'depreciationEndDate'> & {
  constructionYear?: Dayjs;
  useDate?: Dayjs;
  declarationDate?: Dayjs;
  depreciationStartDate?: Dayjs;
  depreciationEndDate?: Dayjs;
  attachmentName?: string;
};

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

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

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];
const USAGE_STATUSES = ['Đang sử dụng', 'Chưa sử dụng', 'Tạm dừng sử dụng'];
const ASSET_GROUPS = ['Nhà, công trình xây dựng', 'Máy móc, thiết bị', 'Tài sản khác'];
const ORIGINS = ['Mua sắm', 'Đầu tư xây dựng', 'Được giao', 'Điều chuyển', 'Khác'];
const UNITS = ['Cái', 'Bộ', 'Chiếc', 'm²', 'm'];
const DISPOSAL_METHODS = ['Bán', 'Thanh lý', 'Điều chuyển', 'Tiêu hủy', 'Khác'];

interface PortTerminalAssetFormProps {
  form: FormInstance<FormValues>;
  organizations: Organization[];
  berths: Berth[];
  attachments: InfrastructureAttachmentItem[];
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function PortTerminalAssetForm({
  form,
  organizations,
  berths,
  attachments,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: PortTerminalAssetFormProps) {
  const berthOptions = useMemo(
    () => berths.map((item) => ({ value: item.id, label: `${item.berthCode} - ${item.berthName}` })),
    [berths],
  );

  const watchedOriginalValue = Form.useWatch('originalValue', form);
  const watchedAccumulatedDepreciation = Form.useWatch('accumulatedDepreciation', form);
  const watchedDepreciationMonths = Form.useWatch('depreciationMonths', form);

  // Auto calculate values
  const remainingValue = useMemo(() => {
    if (watchedOriginalValue == null) return undefined;
    return Math.max(0, watchedOriginalValue - (watchedAccumulatedDepreciation || 0));
  }, [watchedOriginalValue, watchedAccumulatedDepreciation]);

  const monthlyDepreciation = useMemo(() => {
    if (watchedOriginalValue != null && watchedDepreciationMonths && watchedDepreciationMonths > 0) {
      return Math.round((watchedOriginalValue / watchedDepreciationMonths) * 100) / 100;
    }
    return undefined;
  }, [watchedOriginalValue, watchedDepreciationMonths]);

  return (
    <Tabs
      defaultActiveKey="general"
      tabBarStyle={drawerTabBarStyle}
      items={[
        {
          key: 'general',
          label: 'Thông tin chung',
          children: (
            <div style={drawerFormScrollStyle}>
              {/* Section 1: Thông tin cơ bản & Quản lý vận hành */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <BankOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin cơ bản & Quản lý vận hành</span>
                  </div>
                </div>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="parentOrgUnitId" {...labelProps('Cơ quan quản lý cấp trên')} style={{ marginBottom: spaceFormField }}>
                      <OrgUnitTreeSelect organizations={organizations} variant="form" showPath />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                      <OrgUnitTreeSelect organizations={organizations} variant="form" showPath />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="usingOrgUnitId" {...labelProps('Đơn vị sử dụng')} required rules={[{ required: true, message: 'Đơn vị sử dụng là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                      <OrgUnitTreeSelect organizations={organizations} variant="form" showPath />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="berthId" {...labelProps('Mã bến cảng')} required rules={[{ required: true, message: 'Mã bến cảng là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                      <Select showSearch optionFilterProp="label" options={berthOptions} placeholder="Chọn bến cảng" style={selectStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="assetType" {...labelProps('Loại tài sản')} initialValue="PORT_TERMINAL" style={{ marginBottom: spaceFormField }}>
                      <Select disabled options={[{ value: 'PORT_TERMINAL', label: 'Tài sản bến cảng' }]} style={selectStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="assetCode" {...labelProps('Mã tài sản')} style={{ marginBottom: spaceFormField }}>
                      <Input disabled placeholder="Hệ thống tự sinh" style={readonlyInputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="assetName" {...labelProps('Tên tài sản')} required rules={[{ required: true, message: 'Tên tài sản là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                      <Input placeholder="Nhập tên tài sản" style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="barcode" {...labelProps('Barcode')} style={{ marginBottom: spaceFormField }}>
                      <Input placeholder="Nhập mã barcode" style={inputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="assetCondition" {...labelProps('Tình trạng tài sản')} required rules={[{ required: true, message: 'Tình trạng tài sản là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                      <Select placeholder="Chọn tình trạng" options={ASSET_CONDITIONS.map(v => ({ value: v, label: v }))} style={selectStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="usageStatus" {...labelProps('Hiện trạng sử dụng')} required rules={[{ required: true, message: 'Hiện trạng sử dụng là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                      <Select placeholder="Chọn hiện trạng" options={USAGE_STATUSES.map(v => ({ value: v, label: v }))} style={selectStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="assetGroup" {...labelProps('Nhóm tài sản')} style={{ marginBottom: spaceFormField }}>
                      <Select allowClear placeholder="Chọn nhóm tài sản" options={ASSET_GROUPS.map(v => ({ value: v, label: v }))} style={selectStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="assetSubgroup" {...labelProps('Phân nhóm tài sản')} style={{ marginBottom: spaceFormField }}>
                      <Input placeholder="Nhập phân nhóm tài sản" style={inputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="origin" {...labelProps('Nguồn gốc')} style={{ marginBottom: spaceFormField }}>
                      <Select allowClear placeholder="Chọn nguồn gốc" options={ORIGINS.map(v => ({ value: v, label: v }))} style={selectStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <div style={{ display: 'flex', gap: spaceSm }}>
                      <div style={{ flex: 1 }}>
                        <Form.Item name="quantity" {...labelProps('Số lượng')} style={{ marginBottom: spaceFormField }}>
                          <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                        </Form.Item>
                      </div>
                      <div style={{ width: 140 }}>
                        <Form.Item name="quantityUnit" {...labelProps('Đơn vị tính')} style={{ marginBottom: spaceFormField }}>
                          <Select allowClear placeholder="Đơn vị" options={UNITS.map(v => ({ value: v, label: v }))} style={selectStyle} />
                        </Form.Item>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="model" {...labelProps('Model')} style={{ marginBottom: spaceFormField }}>
                      <Input placeholder="Nhập model" style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="serialNumber" {...labelProps('Serial')} style={{ marginBottom: spaceFormField }}>
                      <Input placeholder="Nhập serial" style={inputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="countryOfOrigin" {...labelProps('Xuất xứ')} style={{ marginBottom: spaceFormField }}>
                      <Input placeholder="Nhập xuất xứ" style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="manufacturer" {...labelProps('Hãng sản xuất')} style={{ marginBottom: spaceFormField }}>
                      <Input placeholder="Nhập hãng sản xuất" style={inputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="constructionYear" {...labelProps('Năm xây dựng')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker picker="year" format="YYYY" placeholder="Chọn năm" {...getDatePickerProps({ style: { ...selectStyle, width: '100%' } })} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="useDate" {...labelProps('Ngày sử dụng tài sản')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" {...getDatePickerProps({ style: { ...selectStyle, width: '100%' } })} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="landArea" {...labelProps('Diện tích đất, sàn sử dụng (m²)')} style={{ marginBottom: spaceFormField }}>
                      <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="floorArea" {...labelProps('Diện tích sàn sử dụng (m²)')} style={{ marginBottom: spaceFormField }}>
                      <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item name="assetLocation" {...labelProps('Vị trí tài sản')} style={{ marginBottom: spaceFormField }}>
                      <Input.TextArea rows={2} placeholder="Nhập vị trí tài sản" style={{ borderRadius: radiusMd }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item name="address" {...labelProps('Địa chỉ')} style={{ marginBottom: spaceFormField }}>
                      <Input.TextArea rows={2} placeholder="Nhập địa chỉ tài sản" style={{ borderRadius: radiusMd }} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Section 2: Thông tin giá trị & Khấu hao tài sản */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin giá trị & Khấu hao tài sản</span>
                  </div>
                </div>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="declarationDate" {...labelProps('Ngày kê khai tài sản')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày kê khai" {...getDatePickerProps({ style: { ...selectStyle, width: '100%' } })} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="originalValue" {...labelProps('Nguyên giá (VNĐ)')} style={{ marginBottom: spaceFormField }}>
                      <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="depreciationRate" {...labelProps('Tỷ lệ hao mòn/Khấu hao (%)')} style={{ marginBottom: spaceFormField }}>
                      <InputNumber min={0} max={100} placeholder="0" style={numberInputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item {...labelProps('Giá trị còn lại')} style={{ marginBottom: spaceFormField }}>
                      <Input disabled value={remainingValue != null ? fmtInputNumber(remainingValue) : '—'} style={readonlyInputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item {...labelProps('Đơn vị tính giá trị')} style={{ marginBottom: spaceFormField }}>
                      <Input disabled value="VNĐ" style={readonlyInputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="assignmentDecisionNumber" {...labelProps('Số quyết định giao (bao gồm cả tăng vốn)')} style={{ marginBottom: spaceFormField }}>
                      <Input placeholder="Nhập số quyết định" style={inputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="depreciationStartDate" {...labelProps('Ngày tính khấu hao')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày tính" {...getDatePickerProps({ style: { ...selectStyle, width: '100%' } })} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="depreciationMonths" {...labelProps('Số tháng tính khấu hao')} style={{ marginBottom: spaceFormField }}>
                      <InputNumber min={0} placeholder="0" style={numberInputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="depreciationEndDate" {...labelProps('Ngày hết khấu hao')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày hết" {...getDatePickerProps({ style: { ...selectStyle, width: '100%' } })} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="accumulatedDepreciation" {...labelProps('Khấu hao lũy kế')} style={{ marginBottom: spaceFormField }}>
                      <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item {...labelProps('Khấu hao tháng')} style={{ marginBottom: spaceFormField }}>
                      <Input disabled value={monthlyDepreciation != null ? fmtInputNumber(monthlyDepreciation) : '—'} style={readonlyInputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="disposalMethod" {...labelProps('Hình thức xử lý tài sản')} style={{ marginBottom: spaceFormField }}>
                      <Select allowClear placeholder="Chọn hình thức xử lý" options={DISPOSAL_METHODS.map(v => ({ value: v, label: v }))} style={selectStyle} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </div>
          ),
        },
        {
          key: 'files',
          label: `Hồ sơ tài sản (${attachments.length})`,
          children: (
            <div style={{ paddingTop: 6 }}>
              <InfrastructureAttachmentTab
                attachments={attachments}
                readonly={false}
                onUpload={onUploadAttachment}
                onDelete={onDeleteAttachment}
                onDownload={onDownloadAttachment}
              />
            </div>
          ),
        },
      ]}
    />
  );
}
