import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Modal,
} from 'antd';
import type { FormInstance, UploadFile } from 'antd';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import {
  PlusOutlined, DeleteOutlined, EnvironmentOutlined,
  BankOutlined, SlidersOutlined, FileTextOutlined,
} from '@ant-design/icons';
import {
  colors, DRAWER_TABLE_SCROLL_Y,
  statusCritical,
  fontSizeSm, fontSizeMd,
  radiusPill, radiusMd, spaceSm, spaceMd,
  surfaceCard, readonlyInputStyle,
  primaryButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
} from '../../themetokenchk';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../operatingOrganizationsData';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService } from '../organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { symbolService } from '../symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { Symbol as MapSymbol } from '../symbolService';
import {
  GEOMETRY_POINT_COUNT, parseWktToCoordinates, validateDmsCoordinates, serializeCoordinatesToWkt,
  type DmsCoordinateItem,
} from '../../utils/gisGeometry';
import {
  fetchVhfById, createVhf, updateVhf, generateVhfCode, submitVhf,
  fetchVhfAttachments, uploadVhfAttachment, deleteVhfAttachment, downloadVhfAttachment,
} from './api';
import type { CreateVhfRequest, UpdateVhfRequest } from './types';

// Clone từ services/cctv/CctvForm.tsx — Quản lý hệ thống thông tin liên lạc VHF

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: 600, fontSize: fontSizeMd }}>{text}</span>,
});

// ── Đơn vị đo (unit of measure) ─────────────────────────────────────
const UNIT_OF_MEASURE_OPTIONS = [
  { label: 'Bộ', value: 1 },
  { label: 'Bến', value: 2 },
  { label: 'Bản quyền', value: 3 },
  { label: 'Chiếc', value: 4 },
  { label: 'Cổng', value: 5 },
  { label: 'Cái', value: 6 },
  { label: 'Cột', value: 7 },
  { label: 'Cầu', value: 8 },
  { label: 'Đường truyền', value: 9 },
  { label: 'Héc-ta', value: 10 },
  { label: 'Hạng mục', value: 11 },
  { label: 'Hệ thống', value: 12 },
  { label: 'Kho', value: 13 },
  { label: 'Khu', value: 14 },
  { label: 'Ki-lô-mét', value: 15 },
  { label: 'Mét', value: 16 },
  { label: 'Mét vuông', value: 17 },
  { label: 'Nhà', value: 18 },
  { label: 'Phòng', value: 19 },
  { label: 'Phân hệ', value: 20 },
  { label: 'Quả', value: 21 },
  { label: 'Tuyến', value: 22 },
  { label: 'Tấn', value: 23 },
  { label: 'Trạm', value: 24 },
  { label: 'Tháp', value: 25 },
  { label: 'Trụ', value: 26 },
  { label: 'VNĐ', value: 27 },
];

const OPERATIONAL_STATUS_OPTIONS = [
  { label: 'Chưa khai thác/vận hành', value: 0 },
  { label: 'Đang khai thác/vận hành', value: 1 },
  { label: 'Dừng khai thác/vận hành', value: 2 },
];

const ATTACHED_INFRA_TYPE_OPTIONS = [
  { label: 'Cảng biển', value: 1 },
  { label: 'Bến cảng', value: 2 },
  { label: 'Cầu cảng', value: 3 },
  { label: 'Khu neo đậu', value: 4 },
  { label: 'Khu chuyển tải', value: 5 },
  { label: 'Khu tránh, trú bão', value: 6 },
  { label: 'Luồng hàng hải', value: 7 },
  { label: 'Đèn biển', value: 8 },
  { label: 'Phao, tiêu', value: 9 },
  { label: 'Đê, kè', value: 10 },
  { label: 'Trạm radar', value: 11 },
  { label: 'Trạm bờ AIS', value: 12 },
  { label: 'Hệ thống CCTV', value: 13 },
  { label: 'Hệ thống SCADA', value: 14 },
  { label: 'Hệ thống truyền dẫn', value: 15 },
];

function ddToDms(dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } {
  if (dd == null || Number.isNaN(dd)) return { d: null, m: null, s: null };
  const abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = Math.round((mFloat - m) * 60 * 100) / 100;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; }
  return { d, m, s: sFloat };
}

export type VhfSaveAction = 'DRAFT' | 'SUBMIT' | 'APPROVED' | 'UPDATE';

export interface VhfFormRef {
  submit: (action: VhfSaveAction) => void;
}

interface VhfFormProps {
  form: FormInstance;
  id?: string;
  onFinish?: () => void;
  onSubmittingChange?: (v: boolean) => void;
}

const VhfForm = forwardRef<VhfFormRef, VhfFormProps>(({ form, id, onFinish, onSubmittingChange }, ref) => {
  const isEdit = Boolean(id);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingOperatingOrgs, setLoadingOperatingOrgs] = useState(false);
  const [orgUnits, setOrgUnits] = useState<Array<{ id: string; name: string; code?: string; parentId?: string }>>([]);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [seaportOptions, setSeaportOptions] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [, setSymbols] = useState<MapSymbol[]>([]);
  const [saving, setSaving] = useState(false);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<DmsCoordinateItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);

  // Load danh mục
  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then((r) => {
      setSymbols(r.data || []);
    }).catch(() => { /* giữ rỗng */ });
  }, []);

  useEffect(() => {
    setLoadingOrgs(true);
    organizationService.list({ pageSize: 1000 })
      .then((r) => setOrgUnits((r.data || []) as Array<{ id: string; name: string; code?: string; parentId?: string }>))
      .catch(() => { /* giữ rỗng */ })
      .finally(() => setLoadingOrgs(false));
  }, []);

  useEffect(() => {
    setLoadingOperatingOrgs(true);
    import('../api').then(({ default: api }) =>
      api.get('/common/options/operating-organizations').then((res) => {
        const items = res.data?.data;
        if (Array.isArray(items) && items.length > 0) setOperatingOrgs(items);
        else setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS as Array<{ id: string; name: string; code: string }>);
      }).catch(() => setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS as Array<{ id: string; name: string; code: string }>))
    ).finally(() => setLoadingOperatingOrgs(false));
  }, []);

  useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get('/v1/ports/options').then((res) => {
        const data = res.data?.data;
        if (Array.isArray(data)) {
          setSeaportOptions(data.map((p: any) => ({ id: p.id, name: p.portName || p.name, code: p.portCode || p.code })));
        }
      }).catch(() => {
        api.get('/v1/ports?size=1000').then((res) => {
          const list = res.data?.data?.content || res.data?.data || [];
          if (Array.isArray(list)) {
            setSeaportOptions(list.map((p: any) => ({ id: p.id, name: p.portName || p.name, code: p.portCode || p.code })));
          }
        }).catch(() => {});
      });
    });
  }, []);

  // Load bản ghi khi sửa
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchVhfById(id);
        if (cancelled) return;
        form.setFieldsValue({
          ...data,
          operationalStatus: data.operationalStatus != null ? Number(data.operationalStatus) : undefined,
          yearOfUse: data.yearOfUse ?? undefined,
        });
        const coords = parseWktToCoordinates(data.coordinates || '');
        setGpsCoords(coords.map((c) => {
          const latDms = ddToDms(c.latitude);
          const lngDms = ddToDms(c.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        }));
        const atts = await fetchVhfAttachments(id);
        if (cancelled) return;
        setUploadedFiles(
          (atts || []).map((a) => ({
            uid: a.id,
            name: a.fileName,
            status: 'done' as const,
            size: a.fileSize,
          })),
        );
      } catch {
        if (!cancelled) setGpsError('Không thể tải dữ liệu');
      }
    })();
    return () => { cancelled = true; };
  }, [id, form]);

  const generateCode = useCallback(async () => {
    try {
      const code = await generateVhfCode();
      form.setFieldValue('deviceCode', code);
    } catch { /* mã sẽ để trống nếu lỗi */ }
  }, [form]);

  useEffect(() => {
    if (!isEdit) generateCode();
  }, [isEdit, generateCode]);

  const handleSave = useCallback(async (saveAction: VhfSaveAction) => {
    let values: Record<string, unknown>;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (gpsCoords.length > 0) {
      const coords = gpsCoords.map((c) => ({
        latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
        longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
      }));
      const err = validateDmsCoordinates(gpsCoords);
      if (err) { setGpsError(err); return; }
      values.coordinates = serializeCoordinatesToWkt(coords);
    }

    setSaving(true);
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...values,
        operationalStatus: values.operationalStatus != null ? String(values.operationalStatus) : null,
        approvalStatus:
          saveAction === 'SUBMIT'
            ? 'PENDING_APPROVAL'
            : saveAction === 'APPROVED'
            ? 'APPROVED'
            : saveAction === 'DRAFT'
            ? 'DRAFT'
            : undefined,
      } as unknown as CreateVhfRequest;

      let targetId = id;
      if (isEdit && id) {
        const res = await updateVhf({ ...(payload as unknown as UpdateVhfRequest), id });
        targetId = res.id;
      } else {
        const res = await createVhf(payload);
        targetId = res.id;
      }

      // Gửi phê duyệt ngay sau khi lưu (nếu hành động là SUBMIT)
      if (targetId && saveAction === 'SUBMIT') {
        await submitVhf(targetId).catch(() => { /* để pipeline duyệt xử lý */ });
      }

      // Upload file đính kèm mới nếu có
      if (targetId && uploadedFiles.length > 0) {
        for (const fi of uploadedFiles) {
          const of = fi.originFileObj as File;
          if (!of) continue;
          await uploadVhfAttachment(targetId, of).catch(() => { /* bỏ qua lỗi lẻ */ });
        }
      }

      onFinish?.();
    } finally {
      setSaving(false);
      onSubmittingChange?.(false);
    }
  }, [form, gpsCoords, id, isEdit, onFinish, onSubmittingChange, uploadedFiles]);

  useImperativeHandle(ref, () => ({
    submit: (saveAction: VhfSaveAction) => { void handleSave(saveAction); },
  }), [handleSave]);

  const tabItems = [
    {
      key: 'general',
      label: (
        <span>
          <FileTextOutlined /> Thông tin chung
        </span>
      ),
      children: (
        <div style={drawerFormScrollStyle}>
          <div style={{ background: surfaceCard }}>
            <Row gutter={[spaceMd, 0]}>
              <Col span={12}>
                <Form.Item name="deviceCode" {...labelProps('Mã thiết bị')}>
                  <Input placeholder="Mã tự động" readOnly style={readonlyInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="deviceName"
                  {...labelProps('Tên thiết bị')}
                  rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }]}
                >
                  <Input placeholder="Nhập tên thiết bị..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="manufacturer" {...labelProps('Hãng sản xuất')}>
                  <Input placeholder="Nhập hãng sản xuất..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="model" {...labelProps('Model')}>
                  <Input placeholder="Nhập model..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  {...labelProps('Số lượng')}
                  rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                >
                  <InputNumber min={0} formatter={fmtInputNumber} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="unitOfMeasure" {...labelProps('Đơn vị đo')}>
                  <Select
                    placeholder="Chọn đơn vị đo"
                    allowClear
                    options={UNIT_OF_MEASURE_OPTIONS}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="yearOfUse" {...labelProps('Năm đưa vào sử dụng')}>
                  <InputNumber
                    min={1900}
                    max={new Date().getFullYear()}
                    placeholder="Nhập năm..."
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operationalStatus" {...labelProps('Tình trạng')}>
                  <Select
                    placeholder="Chọn tình trạng"
                    allowClear
                    options={OPERATIONAL_STATUS_OPTIONS}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="orgUnitId"
                  {...labelProps('Đơn vị quản lý')}
                  rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                >
                  <OrgUnitTreeSelect
                    organizations={orgUnits}
                    placeholder="Chọn đơn vị"
                    allowClear
                    showPath
                    treeDefaultExpandAll={false}
                    loading={loadingOrgs}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="seaportId" {...labelProps('Thuộc cảng biển')}>
                  <Select
                    placeholder="Chọn cảng biển"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={seaportOptions.map((p) => ({
                      label: p.code ? `${p.code} - ${p.name}` : p.name,
                      value: p.id,
                    }))}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operatingUnitId" {...labelProps('Đơn vị khai thác')}>
                  <Select
                    placeholder="Chọn đơn vị khai thác"
                    allowClear
                    loading={loadingOperatingOrgs}
                    options={(operatingOrgs.length > 0
                      ? operatingOrgs
                      : (DEFAULT_OPERATING_ORGANIZATIONS as Array<{ id: string; name: string; code: string }>)
                    ).map((o) => ({ label: o.name, value: o.id }))}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')}>
                  <Input placeholder="Nhập địa điểm chi tiết..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="note" {...labelProps('Ghi chú')}>
                  <Input.TextArea rows={3} placeholder="Nhập ghi chú..." style={{ borderRadius: radiusMd }} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      ),
    },
    {
      key: 'specs',
      label: (
        <span>
          <SlidersOutlined /> Thông số kỹ thuật
        </span>
      ),
      children: (
        <div style={drawerFormScrollStyle}>
          <div style={{ background: surfaceCard }}>
            <Form.Item name="specifications" {...labelProps('Thông số kỹ thuật')}>
              <Input.TextArea rows={6} placeholder="Nhập thông số kỹ thuật..." style={{ borderRadius: radiusMd }} />
            </Form.Item>
            <Form.Item name="maintenanceInformation" {...labelProps('Thông tin bảo trì')}>
              <Input.TextArea rows={6} placeholder="Nhập thông tin bảo trì..." style={{ borderRadius: radiusMd }} />
            </Form.Item>
          </div>
        </div>
      ),
    },
    {
      key: 'attached',
      label: (
        <span>
          <BankOutlined /> Hạ tầng gắn kèm
        </span>
      ),
      children: (
        <div style={drawerFormScrollStyle}>
          <div style={{ background: surfaceCard }}>
            <Row gutter={[spaceMd, 0]}>
              <Col span={12}>
                <Form.Item name="attachedInfrastructureType" {...labelProps('Loại hạ tầng gắn kèm')}>
                  <Select
                    placeholder="Chọn loại hạ tầng"
                    allowClear
                    options={ATTACHED_INFRA_TYPE_OPTIONS}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="attachedInfrastructureId" {...labelProps('Đối tượng hạ tầng gắn kèm')}>
                  <Input placeholder="Chọn đối tượng hạ tầng..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      ),
    },
    {
      key: 'gis',
      label: (
        <span>
          <EnvironmentOutlined /> Tọa độ GIS
        </span>
      ),
      children: (
        <div style={drawerFormScrollStyle}>
          <div style={{ background: surfaceCard }}>
            {gpsError && (
              <div style={{ color: statusCritical, fontSize: fontSizeSm, marginBottom: spaceSm }}>{gpsError}</div>
            )}
            <Button
              icon={<PlusOutlined />}
              onClick={() => setGisModalOpen(true)}
              style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40, marginBottom: spaceSm }}
            >
              Chọn vị trí trên bản đồ
            </Button>
            <DetailTable
              columns={[
                {
                  key: 'idx',
                  label: 'STT',
                  width: 60,
                  align: 'center' as const,
                  render: (_: unknown, __: unknown, i: number) => i + 1,
                },
                {
                  key: 'latDms',
                  label: 'Kinh độ DMS',
                  width: 240,
                  render: (_: unknown, r: DmsCoordinateItem) =>
                    [r.lngD, r.lngM, r.lngS].every((v) => v == null) ? '—' : `${r.lngD ?? 0}° ${r.lngM ?? 0}' ${r.lngS ?? 0}"`,
                },
                {
                  key: 'lngDms',
                  label: 'Vĩ độ DMS',
                  width: 240,
                  render: (_: unknown, r: DmsCoordinateItem) =>
                    [r.latD, r.latM, r.latS].every((v) => v == null) ? '—' : `${r.latD ?? 0}° ${r.latM ?? 0}' ${r.latS ?? 0}"`,
                },
                {
                  key: 'action',
                  label: 'Thao tác',
                  width: 60,
                  align: 'center' as const,
                  render: (_: unknown, __: unknown, i: number) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setGpsCoords((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  ),
                },
              ]}
              dataSource={gpsCoords}
              rowKey={(_, i) => String(i)}
              scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'attachments',
      label: (
        <span>
          <FileTextOutlined /> Tệp đính kèm
        </span>
      ),
      children: (
        <div style={drawerFormScrollStyle}>
          <InfrastructureAttachmentTab
            files={uploadedFiles}
            onChange={(files) => setUploadedFiles(files)}
            onRemove={async (uid) => {
              if (isEdit && id) {
                await deleteVhfAttachment(id, uid).catch(() => { /* bỏ qua */ });
              }
              setUploadedFiles((prev) => prev.filter((x) => x.uid !== uid));
            }}
            onDownload={async (uid, name) => {
              if (isEdit && id) {
                await downloadVhfAttachment(id, uid, name);
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Tabs
        items={tabItems}
        style={drawerTabBarStyle}
        tabBarStyle={{ marginBottom: spaceSm }}
      />

      <Modal
        title="Chọn vị trí trên bản đồ"
        open={gisModalOpen}
        onCancel={() => setGisModalOpen(false)}
        footer={null}
        width="90vw"
        style={{ top: 20, maxWidth: 1400 }}
        destroyOnHidden
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline
            height={560}
            disabled={false}
            defaultGeometryType="POINT"
            value={{
              geometryType: 'POINT',
              coordinates: gpsCoords.length > 0
                ? serializeCoordinatesToWkt(gpsCoords.map((c) => ({
                    latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
                    longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
                  })))
                : '',
              symbolId: form.getFieldValue('mapSymbolId') || undefined,
            }}
            onChange={(payload: { coordinates?: string; symbolId?: string }) => {
              if (payload?.symbolId) form.setFieldValue('mapSymbolId', payload.symbolId);
              const wkt = payload?.coordinates || '';
              if (!wkt) return;
              const points = parseWktToCoordinates(wkt).slice(0, GEOMETRY_POINT_COUNT.POINT);
              setGpsCoords((existing) => {
                const key = (p: { latitude: number; longitude: number }) =>
                  `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`;
                const existingKeys = new Set(
                  existing
                    .filter((c) => c.latD != null && c.lngD != null)
                    .map((c) =>
                      key({
                        latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
                        longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
                      }),
                    ),
                );
                const toAdd = points
                  .filter((p) => !existingKeys.has(key(p)))
                  .map((p) => {
                    const latDms = ddToDms(p.latitude);
                    const lngDms = ddToDms(p.longitude);
                    return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                  });
                if (toAdd.length === 0) return existing;
                return [...existing, ...toAdd];
              });
              setGpsError(null);
            }}
          />
        </div>
      </Modal>

      {/* Nút lưu ẩn — Drawer cha gọi qua ref.submit() */}
      <Button
        style={{ display: 'none' }}
        loading={saving}
        onClick={() => { void handleSave('DRAFT'); }}
        tabIndex={-1}
      >
        Lưu
      </Button>
    </>
  );
});

VhfForm.displayName = 'VhfForm';

export default VhfForm;
