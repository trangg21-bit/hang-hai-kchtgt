import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Tabs,
  Space,
  Row,
  Col,
  Spin,
} from 'antd';
import {
  EnvironmentOutlined,
  PlusOutlined,
  FileTextOutlined,
  BankOutlined,
  EditOutlined,
} from '@ant-design/icons';
import toast from '../../../components/ToastNotification';
import { focusErrorTab } from '../../../utils/formValidationHelper';
import { cospasSarsatStationService } from '../../../services/cospasSarsatStationService';
import { symbolService } from '../../../services/symbolService';
import { organizationService } from '../../../services/organizationService';
import type {
  CoastalStationCospasSarsatResponse,
  CoastalStationCospasSarsatRequest,
} from '../../../services/station/types';
import { ApprovalStatus, CONDITION_STATUS_OPTIONS } from '../../../types/vtsSystem';
import {
  drawerTitleStyle, primaryButtonStyle, outlineButtonStyle,
  drawerTabBarStyle, drawerFormScrollStyle, DRAWER_TABLE_SCROLL_Y, DRAWER_WIDTH,
  requiredMarkStyle, spaceFormField, radiusPill, sidebarBg,
  fontWeightBold, fontSizeMd, fontSizeSm, fontSizeLg,
  textTertiary, borderDefault,
  statusCritical, statusOperational, actionPrimary,
  readonlyInputStyle, inputStyle, selectStyle, spaceSm,
  spaceXs,
  textAreaStyle,
} from '../../../themetokenchk';
import { VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import AppDrawer from '../../../components/shared/AppDrawer';
import { useAuthStore, type AuthState } from '../../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../../store/permissionStore';
import { FormOrgUnitTreeSelect, normalizeSearchText } from '../../../components/org-unit';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import DetailTable from '../../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../../components/shared/InfrastructureAttachmentTab';
import ServiceMultiSelect from '../../../components/shared/ServiceMultiSelect';
import GisLocationSelector from '../../../components/gis/GisLocationSelector';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import {
  validateDmsCoordinates,
  serializeCoordinatesToWkt,
  parseWktToCoordinates,
  ddToDms,
  dmsToDd,
} from '../../../utils/gisGeometry';
import CospasSarsatStationDetailContent, {
  COSPAS_SERVICE_OPTIONS,
  getOperatingOrgName,
} from './CospasSarsatStationDetailContent';

export interface CospasSarsatStationFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: CoastalStationCospasSarsatResponse | null;
  mode?: 'create' | 'edit' | 'detail';
  orgUnits?: any[];
  symbols?: any[];
  onCancel?: () => void;
  onSuccess?: () => void;
  onClose?: () => void;
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
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const redAsteriskStyle: React.CSSProperties = {
  color: statusCritical,
  marginLeft: 4,
  fontWeight: fontWeightBold,
};

export default function CospasSarsatStationForm(props: CospasSarsatStationFormProps) {
  const {
    open = false,
    editId = null,
    initialData = null,
    mode = 'create',
    orgUnits: propOrgUnits,
    symbols: propSymbols,
    onCancel,
    onSuccess,
    onClose,
  } = props;

  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordData, setRecordData] = useState<CoastalStationCospasSarsatResponse | null>(initialData);

  const [orgUnits, setOrgUnits] = useState<any[]>(propOrgUnits || []);
  const [symbols, setSymbols] = useState<any[]>(propSymbols || []);

  const [gisType, setGisType] = useState<'POINT' | 'LINESTRING' | 'POLYGON'>('POINT');
  const [gisPoints, setGisPoints] = useState<Array<{ id: string; lat: number; lng: number }>>([]);
  const [currentGisCoord, setCurrentGisCoord] = useState<{ lat: number; lng: number } | undefined>();

  // Attachments
  const [files, setFiles] = useState<any[]>([]);

  const isView = mode === 'detail';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const user = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  // Tự sinh mã đài SARSAT-{timestamp} khi tạo mới
  const generateStationCode = () => `SARSAT-${Date.now().toString().slice(-4)}`;

  // Load danh mục orgUnits & symbols nếu chưa có
  useEffect(() => {
    if (!propOrgUnits || propOrgUnits.length === 0) {
      organizationService.getAll().then((data) => {
        if (Array.isArray(data)) setOrgUnits(data);
      }).catch(() => {});
    }
    if (!propSymbols || propSymbols.length === 0) {
      symbolService.getAll().then((data) => {
        if (Array.isArray(data)) setSymbols(data);
      }).catch(() => {});
    }
  }, [propOrgUnits, propSymbols]);

  // Load record data khi mở Drawer
  useEffect(() => {
    if (!open) return;
    if (isCreate) {
      form.resetFields();
      const newCode = generateStationCode();
      form.setFieldsValue({
        stationCode: newCode,
        conditionStatus: 'OPERATIONAL',
        coordinateSystem: 'WGS84 (EPSG:4326)',
        displayRule: 'Hiển thị theo lớp Đài trạm chuyên dùng',
        geometryType: 'Điểm',
        unitId: user?.orgUnitId ? String(user.orgUnitId) : undefined,
      });
      setGisPoints([]);
      setCurrentGisCoord(undefined);
      setFiles([]);
      setRecordData(null);
      setActiveTab('info');
    } else if (editId) {
      setLoading(true);
      cospasSarsatStationService.getById(editId)
        .then((res) => {
          setRecordData(res);
          form.setFieldsValue({
            stationCode: res.stationCode || res.code,
            stationName: res.stationName || res.name,
            unitId: res.unitId || res.orgUnitId,
            operatingOrgId: res.operatingOrgId,
            provinceId: res.provinceId,
            locationAddress: res.locationAddress,
            conditionStatus: res.conditionStatus || 'OPERATIONAL',
            coverageArea: res.coverageArea,
            services: res.services,
            frequency: res.frequency,
            description: res.description || res.note,
            geometryType: res.geometryType || res.objectType || 'Điểm',
            symbolId: res.symbolId,
            coordinateSystem: res.coordinateSystem || 'WGS84 (EPSG:4326)',
            displayRule: res.displayRule || 'Hiển thị theo lớp Đài trạm chuyên dùng',
          });

          // GIS Parse
          if (res.latitude && res.longitude) {
            setCurrentGisCoord({ lat: res.latitude, lng: res.longitude });
            setGisPoints([{ id: '1', lat: res.latitude, lng: res.longitude }]);
          } else if (res.wktGeometry) {
            const parsed = parseWktToCoordinates(res.wktGeometry);
            if (parsed.length > 0) {
              const pts = parsed.map((p, i) => ({ id: String(i + 1), lat: p.latitude, lng: p.longitude }));
              setGisPoints(pts);
              setCurrentGisCoord({ lat: pts[0].lat, lng: pts[0].lng });
            }
          }
          if (Array.isArray(res.files)) {
            setFiles(res.files);
          }
        })
        .catch((err) => {
          toast.error(err.message || 'Không tải được dữ liệu đài');
        })
        .finally(() => setLoading(false));
    }
  }, [open, editId, isCreate, form, user]);

  const handleClose = () => {
    onCancel?.();
    onClose?.();
  };

  const handleSave = async (action: 'DRAFT' | 'SUBMIT' | 'APPROVE' = 'DRAFT') => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: CoastalStationCospasSarsatRequest = {
        ...values,
        stationCode: values.stationCode?.trim(),
        stationName: values.stationName?.trim(),
        locationAddress: values.locationAddress?.trim(),
        coverageArea: values.coverageArea?.trim(),
        frequency: values.frequency?.trim(),
        description: values.description?.trim(),
        latitude: currentGisCoord?.lat,
        longitude: currentGisCoord?.lng,
        wktGeometry: gisPoints.length > 0 ? serializeCoordinatesToWkt(gisPoints.map(p => ({ latitude: p.lat, longitude: p.lng })), gisType) : undefined,
      };

      if (isCreate) {
        await cospasSarsatStationService.create(payload, action);
        toast.success(
          action === 'SUBMIT'
            ? 'Tạo mới và gửi phê duyệt đài Cospas-Sarsat thành công!'
            : action === 'APPROVE'
            ? 'Tạo mới và phê duyệt đài Cospas-Sarsat thành công!'
            : 'Lưu tạm đài Cospas-Sarsat thành công!'
        );
      } else if (editId) {
        await cospasSarsatStationService.update(editId, payload, action);
        toast.success('Cập nhật đài Cospas-Sarsat thành công!');
      }

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      if (err.errorFields) {
        focusErrorTab(err.errorFields, setActiveTab);
      } else {
        toast.error(err.message || 'Lỗi khi lưu đài Cospas-Sarsat');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render Footer Buttons
  const renderFooter = () => {
    if (isView) {
      return (
        <Button style={{ ...outlineButtonStyle, borderRadius: radiusPill }} onClick={handleClose}>
          Đóng
        </Button>
      );
    }

    return (
      <>
        {isEdit && (
          <Button style={{ ...outlineButtonStyle, borderRadius: radiusPill }} onClick={handleClose}>
            Hủy
          </Button>
        )}
        <Button
          style={{ ...outlineButtonStyle, borderRadius: radiusPill, borderColor: actionPrimary, color: actionPrimary }}
          loading={submitting}
          onClick={() => handleSave('DRAFT')}
        >
          Lưu tạm
        </Button>
        <Button
          type="primary"
          style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
          loading={submitting}
          onClick={() => handleSave('SUBMIT')}
        >
          Lưu và gửi phê duyệt
        </Button>
        <Button
          style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational, borderRadius: radiusPill }}
          loading={submitting}
          onClick={() => handleSave('APPROVE')}
        >
          Lưu và phê duyệt
        </Button>
      </>
    );
  };

  return (
    <AppDrawer
      open={open}
      onClose={handleClose}
      width={DRAWER_WIDTH}
      title={
        <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
          {isView
            ? 'Chi tiết đài Cospas-Sarsat'
            : isEdit
            ? 'Chỉnh sửa đài Cospas-Sarsat'
            : 'Thêm mới đài Cospas-Sarsat'}
        </span>
      }
      extra={
        isView && recordData && (
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
              onClick={() => onEdit?.(recordData)}
            >
              Chỉnh sửa
            </Button>
          </Space>
        )
      }
      footer={renderFooter()}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '0 24px 12px 24px' },
      }}
      rootClassName="cospas-sarsat-drawer-scope"
    >
      {loading ? (
        <div style={{ padding: 32 }}>
          <LoadingSkeleton />
        </div>
      ) : isView && recordData ? (
        <CospasSarsatStationDetailContent
          id={recordData.id}
          initialData={recordData}
          orgUnits={orgUnits}
          symbols={symbols}
          onClose={handleClose}
          onEdit={onEdit}
        />
      ) : (
        <Form form={form} layout="vertical" style={drawerFormScrollStyle}>
          <style>{requiredMarkStyle}</style>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={drawerTabBarStyle}
            items={[
              {
                key: 'info',
                label: 'TAB 1: Thông tin chung',
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <div style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <BankOutlined style={{ color: actionPrimary }} />
                          <span>Thông tin đài Cospas-Sarsat</span>
                        </div>
                      </div>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="stationCode"
                            label={<span>Mã đài <span style={redAsteriskStyle}>*</span></span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input disabled style={{ ...readonlyInputStyle, height: 40, borderRadius: radiusPill }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="provinceId"
                            label={<span>Địa điểm (Tỉnh/TP) <span style={redAsteriskStyle}>*</span></span>}
                            rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành phố' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn Tỉnh/Thành phố"
                              options={VIETNAM_PROVINCE_OPTIONS}
                              showSearch
                              filterOption={(input, option) =>
                                normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                              }
                              style={{ width: '100%', height: 40, borderRadius: radiusPill }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="stationName"
                            label={<span>Tên đài <span style={redAsteriskStyle}>*</span></span>}
                            rules={[{ required: true, message: 'Vui lòng nhập tên đài Cospas-Sarsat' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              rows={2}
                              maxLength={2000}
                              showCount
                              placeholder="Nhập tên đài Cospas-Sarsat..."
                              style={textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="unitId"
                            label={<span>Đơn vị quản lý <span style={redAsteriskStyle}>*</span></span>}
                            rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <FormOrgUnitTreeSelect
                              organizations={orgUnits}
                              placeholder="Chọn đơn vị quản lý"
                              allowClear={false}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="operatingOrgId"
                            label="Đơn vị khai thác"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn đơn vị khai thác"
                              allowClear
                              showSearch
                              filterOption={(input, option) =>
                                normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                              }
                              options={DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({ value: o.id, label: o.name }))}
                              style={{ width: '100%', height: 40, borderRadius: radiusPill }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="conditionStatus"
                            label={<span>Tình trạng <span style={redAsteriskStyle}>*</span></span>}
                            rules={[{ required: true, message: 'Vui lòng chọn tình trạng hoạt động' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              options={CONDITION_STATUS_OPTIONS}
                              placeholder="Chọn tình trạng"
                              style={{ width: '100%', height: 40, borderRadius: radiusPill }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="locationAddress"
                            label={<span>Địa điểm chi tiết <span style={redAsteriskStyle}>*</span></span>}
                            rules={[{ required: true, message: 'Vui lòng nhập địa điểm chi tiết' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              rows={2}
                              maxLength={2000}
                              showCount
                              placeholder="Số nhà, đường/phố, thôn/xã/phường..."
                              style={textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="coverageArea"
                            label="Vùng phủ sóng"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              rows={2}
                              maxLength={2000}
                              showCount
                              placeholder="Mô tả phạm vi và vùng phủ sóng của đài..."
                              style={textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="services"
                            label="Dịch vụ cung cấp (multi-select)"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <ServiceMultiSelect
                              options={COSPAS_SERVICE_OPTIONS}
                              placeholder="Chọn các dịch vụ Cospas-Sarsat cung cấp..."
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="frequency"
                            label="Tần số liên lạc"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              rows={2}
                              maxLength={2000}
                              showCount
                              placeholder="Ví dụ: 406.025 MHz, 406.028 MHz, 121.5 MHz homing..."
                              style={textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="description"
                            label="Ghi chú"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              rows={2}
                              maxLength={2000}
                              showCount
                              placeholder="Ghi chú thêm về đài..."
                              style={textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },
              {
                key: 'gis',
                label: 'TAB 2: Vị trí (GIS)',
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <div style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <EnvironmentOutlined style={{ color: actionPrimary }} />
                          <span>Cấu hình vị trí không gian địa lý</span>
                        </div>
                      </div>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="geometryType" label="Loại đối tượng" style={{ marginBottom: spaceFormField }}>
                            <Select
                              options={[
                                { value: 'Điểm', label: 'Điểm (Point)' },
                                { value: 'Đường', label: 'Đường (LineString)' },
                                { value: 'Vùng', label: 'Vùng (Polygon)' },
                              ]}
                              style={{ width: '100%', height: 40, borderRadius: radiusPill }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="symbolId" label="Biểu tượng" style={{ marginBottom: spaceFormField }}>
                            <Select
                              placeholder="Chọn biểu tượng hiển thị"
                              allowClear
                              showSearch
                              filterOption={(input, option) =>
                                normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                              }
                              options={symbols.map((s) => ({ value: s.id, label: s.name || s.id }))}
                              style={{ width: '100%', height: 40, borderRadius: radiusPill }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="coordinateSystem" label="Hệ quy chiếu" style={{ marginBottom: spaceFormField }}>
                            <Input disabled style={{ ...readonlyInputStyle, height: 40, borderRadius: radiusPill }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="displayRule" label="Quy tắc hiển thị" style={{ marginBottom: spaceFormField }}>
                            <Input style={{ ...inputStyle, height: 40, borderRadius: radiusPill }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <div style={{ marginTop: 12 }}>
                        <span style={{ fontWeight: fontWeightBold, color: sidebarBg }}>16. Bảng tọa độ (LongLatTable):</span>
                        <div style={{ marginTop: 8 }}>
                          <GisLocationSelector
                            value={currentGisCoord}
                            onChange={(coord) => {
                              setCurrentGisCoord(coord);
                              if (coord) {
                                setGisPoints([{ id: '1', lat: coord.lat, lng: coord.lng }]);
                              } else {
                                setGisPoints([]);
                              }
                            }}
                            height={340}
                            popupTitle="Chọn vị trí đài Cospas-Sarsat trên bản đồ"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'files',
                label: 'TAB 3: File đính kèm',
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <div style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <FileTextOutlined style={{ color: actionPrimary }} />
                          <span>17. File đính kèm tài liệu hồ sơ đài</span>
                        </div>
                      </div>
                      <InfrastructureAttachmentTab
                        entityType="COSPAS_SARSAT_STATION"
                        entityId={editId || undefined}
                        files={files}
                        onFilesChange={setFiles}
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: 'ops',
                label: 'TAB 4: Vận hành & bảo trì',
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <div style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <span>Thông tin vận hành & bảo dưỡng (read-only)</span>
                        </div>
                      </div>
                      <p style={{ color: textTertiary }}>
                        Các thông tin kế hoạch vận hành, lịch bảo trì và sự cố được đồng bộ tự động từ phân hệ quản lý vận hành khai thác.
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'track',
                label: 'TAB 5: Xử lý & theo dõi',
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <div style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <span>Tiến trình xử lý hồ sơ phê duyệt</span>
                        </div>
                      </div>
                      <p style={{ color: textTertiary }}>
                        Lịch sử gửi duyệt, thẩm định và phê duyệt hồ sơ 2 cấp (Cảng vụ / Chi cục và Cục Hàng hải Việt Nam).
                      </p>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      )}
    </AppDrawer>
  );
}
