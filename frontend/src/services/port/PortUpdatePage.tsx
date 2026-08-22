import { useEffect, useState, useCallback } from 'react';
import {
  Card, Button, Space, Typography, Row, Col, InputNumber, Select, Input, Form,
  Upload, Table, Divider,
} from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import toast from '../../components/ToastNotification';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, InboxOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCangBienById, updateCangBien } from './api';
import { TRANG_THAI_HOAT_DONG_OPTIONS } from './schema';
import type { CangBienResponse } from './types';
import { VIETNAM_PROVINCES } from '../../types/common';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import api from '../../services/api';
import {
  actionPrimary, radiusPill, radiusMd, radiusSm,
  fontSizeMd, fontSizeLg, fontSizeSm, borderDefault,
  textSecondary, textTertiary,
  surfaceCard, spaceFormField, spaceMd, spaceLg, spaceXl, spaceSm, spaceXs,
  fontWeightMedium, fontWeightBold, metaStyle, dividerStyle,
} from '../../tokens';

const { Text, Title } = Typography;
const { TextArea } = Input;

// ── Composite-index field definitions (14 fields) ───────────────────

const COMPOSITE_INDEX_FIELDS: Array<{ name: string; label: string }> = [
  { name: 'totalBerths', label: 'Tổng số bến cảng' },
  { name: 'totalAnchoragesTransshipment', label: 'Tổng số khu neo đậu chuyển tải' },
  { name: 'totalPublicChannels', label: 'Tổng số tuyến luồng công cộng' },
  { name: 'totalDedicatedChannels', label: 'Tổng số tuyến luồng chuyên dùng' },
  { name: 'totalPublicChannelLength', label: 'Tổng chiều dài luồng công cộng (m)' },
  { name: 'totalDedicatedChannelLength', label: 'Tổng chiều dài luồng chuyên dùng (m)' },
  { name: 'totalBuoysBeacons', label: 'Tổng số phao tiêu báo hiệu' },
  { name: 'totalDikes', label: 'Tổng số đê kè' },
  { name: 'totalDikeLength', label: 'Tổng chiều dài đê kè (m)' },
  { name: 'totalLighthouses', label: 'Tổng số đèn biển/dăng tiêu' },
  { name: 'buoyBerthCount', label: 'Số lượng bến phao' },
  { name: 'anchorageCount', label: 'Số lượng khu neo đậu' },
  { name: 'transshipmentCount', label: 'Số lượng khu chuyển tải' },
  { name: 'otherWaterAreas', label: 'Các khu nước khác (mô tả)' },
];

// ── Sub-table row types ────────────────────────────────────────────

interface CoordinateRow {
  key: string;
  latitude: number | null;
  longitude: number | null;
}

interface InfrastructureRow {
  key: string;
  stt: number;
  infraName: string;
  quantity: number | null;
}

interface AttachmentFile {
  uid: string;
  name: string;
  size: number;
  status?: 'done' | 'uploading' | 'error' | 'removed';
  url?: string;
  id?: string;
}

// ── File upload constants ──────────────────────────────────────────

const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILES = 10;

// ── Component ──────────────────────────────────────────────────────

export default function PortUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<CangBienResponse | null>(null);

  const updateGeometryType = Form.useWatch('geometryType', form);

  // GPS sub-table
  const [coordinates, setCoordinates] = useState<CoordinateRow[]>([]);

  // Infrastructure sub-table
  const [infrastructures, setInfrastructures] = useState<InfrastructureRow[]>([]);

  // File attachments
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<AttachmentFile[]>([]);

  // ── Load data on mount ──────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchCangBienById(id);
        setEntityData(data);

        // Basic fields
        form.setFieldsValue({
          portCode: data.portCode,
          portName: data.portName,
          province: data.province || undefined,
          detailedLocation: data.detailedLocation || undefined,
          waterAreaScope: data.waterAreaScope || undefined,
          portClass: data.portClass != null ? data.portClass : undefined,
          area: data.area != null ? data.area : undefined,
          maxVesselCapacity: data.maxVesselCapacity != null ? data.maxVesselCapacity : undefined,
          operationalStatus: data.operationalStatus || undefined,
          geometryType: data.geometryType || undefined,
          gisLocation: {
            geometryType: data.geometryType || undefined,
            coordinates: data.coordinates || '',
            mapSymbolId: data.mapSymbolId,
          },
          // GIS metadata
          mapSymbolId: data.mapSymbolId || undefined,
          coordinateSystem: data.coordinateSystem != null ? data.coordinateSystem : undefined,
          displayRule: data.displayRule != null ? data.displayRule : undefined,
          // Composite index fields
          totalBerths: data.totalBerths != null ? data.totalBerths : undefined,
          totalAnchoragesTransshipment: data.totalAnchoragesTransshipment != null ? data.totalAnchoragesTransshipment : undefined,
          totalPublicChannels: data.totalPublicChannels != null ? data.totalPublicChannels : undefined,
          totalDedicatedChannels: data.totalDedicatedChannels != null ? data.totalDedicatedChannels : undefined,
          totalPublicChannelLength: data.totalPublicChannelLength != null ? data.totalPublicChannelLength : undefined,
          totalDedicatedChannelLength: data.totalDedicatedChannelLength != null ? data.totalDedicatedChannelLength : undefined,
          totalBuoysBeacons: data.totalBuoysBeacons != null ? data.totalBuoysBeacons : undefined,
          totalDikes: data.totalDikes != null ? data.totalDikes : undefined,
          totalDikeLength: data.totalDikeLength != null ? data.totalDikeLength : undefined,
          totalLighthouses: data.totalLighthouses != null ? data.totalLighthouses : undefined,
          buoyBerthCount: data.buoyBerthCount != null ? data.buoyBerthCount : undefined,
          anchorageCount: data.anchorageCount != null ? data.anchorageCount : undefined,
          transshipmentCount: data.transshipmentCount != null ? data.transshipmentCount : undefined,
          otherWaterAreas: data.otherWaterAreas || undefined,
          // Remarks
          remarks: data.remarks || undefined,
        });

        // Load existing GPS coordinates
        const lat = data.latitude;
        const lng = data.longitude;
        const coords: CoordinateRow[] = [];
        if (lat != null && lng != null) {
          coords.push({ key: crypto.randomUUID(), latitude: lat, longitude: lng });
        }
        // If coordinateList exists on response, use it
        if ((data as any).coordinateList && Array.isArray((data as any).coordinateList)) {
          setCoordinates(
            (data as any).coordinateList.map((c: any) => ({
              key: crypto.randomUUID(),
              latitude: c.latitude,
              longitude: c.longitude,
            })),
          );
        } else if (coords.length > 0) {
          setCoordinates(coords);
        }

        // Load existing attachments
        const atts: AttachmentFile[] = [];
        if ((data as any).attachments && Array.isArray((data as any).attachments)) {
          (data as any).attachments.forEach((a: any) => {
            atts.push({
              uid: a.id,
              name: a.fileName,
              size: a.fileSize || 0,
              status: 'done' as const,
              url: a.filePath,
              id: a.id,
            });
          });
        }
        setExistingAttachments(atts);
      } catch (err) {
        console.error('Failed to fetch Port:', err);
        toast.error('Không thể tải thông tin cảng biển');
        navigate('/port');
      }
    })();
  }, [id, navigate, form]);

  // ── GPS sub-table handlers ──────────────────────────────────────

  const addCoordinate = useCallback(() => {
    setCoordinates((prev) => [
      ...prev,
      { key: crypto.randomUUID(), latitude: null, longitude: null },
    ]);
  }, []);

  const removeCoordinate = useCallback((key: string) => {
    setCoordinates((prev) => prev.filter((c) => c.key !== key));
  }, []);

  const updateCoordinate = useCallback(
    (key: string, field: 'latitude' | 'longitude', value: number | null) => {
      setCoordinates((prev) =>
        prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)),
      );
    },
    [],
  );

  // ── Infrastructure sub-table handlers ───────────────────────────

  const addInfrastructure = useCallback(() => {
    setInfrastructures((prev) => [
      ...prev,
      { key: crypto.randomUUID(), stt: prev.length + 1, infraName: '', quantity: null },
    ]);
  }, []);

  const removeInfrastructure = useCallback((key: string) => {
    setInfrastructures((prev) =>
      prev
        .filter((inf) => inf.key !== key)
        .map((inf, idx) => ({ ...inf, stt: idx + 1 })),
    );
  }, []);

  const updateInfrastructure = useCallback(
    (key: string, field: 'infraName' | 'quantity', value: string | number | null) => {
      setInfrastructures((prev) =>
        prev.map((inf) => (inf.key === key ? { ...inf, [field]: value } : inf)),
      );
    },
    [],
  );

  // ── File upload handlers ────────────────────────────────────────

  const handleBeforeUpload = useCallback((file: RcFile): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(
        `Định dạng "${ext}" không được hỗ trợ. Chấp nhận: ${ALLOWED_EXTENSIONS}`,
      );
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Tệp "${file.name}" vượt quá 20MB`);
      return false;
    }
    if (fileList.length >= MAX_FILES) {
      toast.error(`Tối đa ${MAX_FILES} tệp đính kèm`);
      return false;
    }
    return false; // prevent auto-upload — handled manually
  }, [fileList.length]);

  const handleFileChange = useCallback(
    (info: { fileList: UploadFile[] }) => {
      setFileList(info.fileList);
    },
    [],
  );

  const handleRemoveExistingAttachment = useCallback(
    async (attachment: AttachmentFile) => {
      if (!id || !attachment.id) return;
      try {
        await api.delete(`/v1/ports/${id}/attachments/${attachment.id}`);
        setExistingAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
        toast.success('Đã xóa tệp đính kèm');
      } catch {
        toast.error('Xóa tệp thất bại');
      }
    },
    [id],
  );

  // ── GPS columns ─────────────────────────────────────────────────

  const gpsColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      render: (_: unknown, __: unknown, idx: number) => (
        <Text style={{ color: textSecondary }}>{idx + 1}</Text>
      ),
    },
    {
      title: 'Vĩ độ (Latitude)',
      key: 'latitude',
      width: 200,
      render: (_: unknown, record: CoordinateRow) => (
        <InputNumber
          style={{ width: '100%', borderRadius: radiusMd }}
          value={record.latitude}
          onChange={(val) => updateCoordinate(record.key, 'latitude', val ?? null)}
          min={-90}
          max={90}
          step={0.000001}
          placeholder="VD: 20.860000"
        />
      ),
    },
    {
      title: 'Kinh độ (Longitude)',
      key: 'longitude',
      width: 200,
      render: (_: unknown, record: CoordinateRow) => (
        <InputNumber
          style={{ width: '100%', borderRadius: radiusMd }}
          value={record.longitude}
          onChange={(val) => updateCoordinate(record.key, 'longitude', val ?? null)}
          min={-180}
          max={180}
          step={0.000001}
          placeholder="VD: 106.680000"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: unknown, record: CoordinateRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeCoordinate(record.key)}
        />
      ),
    },
  ];

  // ── Infrastructure columns ──────────────────────────────────────

  const infraColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      render: (_: unknown, record: InfrastructureRow) => (
        <Text style={{ color: textSecondary }}>{record.stt}</Text>
      ),
    },
    {
      title: 'Tên công trình *',
      key: 'infraName',
      width: 300,
      render: (_: unknown, record: InfrastructureRow) => (
        <Input
          style={{ borderRadius: radiusMd }}
          value={record.infraName}
          onChange={(e) => updateInfrastructure(record.key, 'infraName', e.target.value)}
          placeholder="Nhập tên công trình"
        />
      ),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 150,
      render: (_: unknown, record: InfrastructureRow) => (
        <InputNumber
          style={{ width: '100%', borderRadius: radiusMd }}
          value={record.quantity}
          onChange={(val) => updateInfrastructure(record.key, 'quantity', val ?? null)}
          min={1}
          step={1}
          placeholder="> 0"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: unknown, record: InfrastructureRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeInfrastructure(record.key)}
        />
      ),
    },
  ];

  // ── Handle submit ───────────────────────────────────────────────

  const handleFinish = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        id: String(id),
        portName: (values.portName as string) || undefined,
        province: (values.province as string) || undefined,
        area: values.area as number | undefined,
        maxVesselCapacity: values.maxVesselCapacity as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        mapSymbolId: (values.gisLocation as any)?.mapSymbolId || null,
        geometryType: values.geometryType as string,
        coordinates: (values.gisLocation as any)?.coordinates,
        // Extended GIS metadata
        detailedLocation: (values.detailedLocation as string) || null,
        portClass: values.portClass != null ? Number(values.portClass) : null,
        coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : null,
        displayRule: values.displayRule != null ? Number(values.displayRule) : null,
        waterAreaScope: (values.waterAreaScope as string) || null,
        // Composite index fields
        totalBerths: values.totalBerths != null && !Number.isNaN(values.totalBerths as number)
          ? Number(values.totalBerths) : null,
        totalAnchoragesTransshipment: values.totalAnchoragesTransshipment != null && !Number.isNaN(values.totalAnchoragesTransshipment as number)
          ? Number(values.totalAnchoragesTransshipment) : null,
        totalPublicChannels: values.totalPublicChannels != null && !Number.isNaN(values.totalPublicChannels as number)
          ? Number(values.totalPublicChannels) : null,
        totalDedicatedChannels: values.totalDedicatedChannels != null && !Number.isNaN(values.totalDedicatedChannels as number)
          ? Number(values.totalDedicatedChannels) : null,
        totalPublicChannelLength: values.totalPublicChannelLength != null && !Number.isNaN(values.totalPublicChannelLength as number)
          ? Number(values.totalPublicChannelLength) : null,
        totalDedicatedChannelLength: values.totalDedicatedChannelLength != null && !Number.isNaN(values.totalDedicatedChannelLength as number)
          ? Number(values.totalDedicatedChannelLength) : null,
        totalBuoysBeacons: values.totalBuoysBeacons != null && !Number.isNaN(values.totalBuoysBeacons as number)
          ? Number(values.totalBuoysBeacons) : null,
        totalDikes: values.totalDikes != null && !Number.isNaN(values.totalDikes as number)
          ? Number(values.totalDikes) : null,
        totalDikeLength: values.totalDikeLength != null && !Number.isNaN(values.totalDikeLength as number)
          ? Number(values.totalDikeLength) : null,
        totalLighthouses: values.totalLighthouses != null && !Number.isNaN(values.totalLighthouses as number)
          ? Number(values.totalLighthouses) : null,
        buoyBerthCount: values.buoyBerthCount != null && !Number.isNaN(values.buoyBerthCount as number)
          ? Number(values.buoyBerthCount) : null,
        anchorageCount: values.anchorageCount != null && !Number.isNaN(values.anchorageCount as number)
          ? Number(values.anchorageCount) : null,
        transshipmentCount: values.transshipmentCount != null && !Number.isNaN(values.transshipmentCount as number)
          ? Number(values.transshipmentCount) : null,
        otherWaterAreas: (values.otherWaterAreas as string) || null,
        // GPS coordinates
        coordinateList: coordinates
          .filter((c) => c.latitude != null && c.longitude != null)
          .map((c) => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) })),
        // Infrastructure list
        infrastructureList: infrastructures
          .filter((inf) => inf.infraName && String(inf.infraName).trim() !== '')
          .map((inf) => ({
            stt: inf.stt,
            infraName: String(inf.infraName).trim(),
            quantity: inf.quantity ?? 0,
          })),
        // Remarks
        remarks: (values.remarks as string) || null,
      };

      // Add top-level lat/lng for spatial sync
      const firstCoord = coordinates.find((c) => c.latitude != null && c.longitude != null);
      if (firstCoord) {
        payload.latitude = Number(firstCoord.latitude);
        payload.longitude = Number(firstCoord.longitude);
      }

      await updateCangBien(payload as any);

      // Upload files after successful update
      if (fileList.length > 0) {
        const uploadedIds: string[] = [];
        for (const file of fileList) {
          if (file.originFileObj) {
            try {
              const formData = new FormData();
              formData.append('files', file.originFileObj as RcFile);
              await api.post(`/v1/ports/${id}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              uploadedIds.push(file.uid);
            } catch {
              toast.error(`Tải lên tệp "${file.name}" thất bại`);
            }
          }
        }
        if (uploadedIds.length > 0) {
          toast.success(`Đã tải lên ${uploadedIds.length} tệp đính kèm`);
        }
      }

      toast.success('Cập nhật thành công — chờ phê duyệt lại');
      navigate(`/Port/${String(id)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!entityData) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  }

  // ── Section style ───────────────────────────────────────────────

  const sectionStyle: React.CSSProperties = {
    marginBottom: spaceMd,
    borderRadius: radiusMd,
    border: `0.5px solid ${borderDefault}`,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: fontSizeLg,
    fontWeight: fontWeightBold,
    marginBottom: spaceMd,
    color: textSecondary,
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100%' }}>
      <Card style={{ marginBottom: spaceMd, ...sectionStyle }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/port/${id}`)}>
            Quay lại
          </Button>
          <Title level={5} style={{ margin: 0 }}>
            Chỉnh sửa {entityData.portCode} — {entityData.portName}
          </Title>
        </Space>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ maxWidth: 960, margin: '0 auto' }}
        scrollToFirstError
      >
        {/* ═══ Section 1: Thông tin chung ═══ */}
        <Card title={<span style={sectionTitleStyle}>1. Thông tin chung</span>} style={sectionStyle}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Mã cảng" name="portCode" style={{ marginBottom: spaceFormField }}>
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cảng"
                name="portName"
                style={{ marginBottom: spaceFormField }}
                rules={[{ max: 255, message: 'Tên cảng tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Tỉnh/thành phố" name="province" style={{ marginBottom: spaceFormField }}>
                <Select
                  showSearch
                  placeholder="Chọn tỉnh/thành phố..."
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Địa điểm chi tiết" name="detailedLocation" style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: Khu bến cảng Lạch Huyện" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Phạm vi vùng nước" name="waterAreaScope" style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Mô tả phạm vi vùng nước" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phân cấp cảng" name="portClass" style={{ marginBottom: spaceFormField }}>
                <Select
                  placeholder="Chọn phân cấp cảng"
                  allowClear
                  options={[
                    { label: 'Cảng biển loại I', value: 1 },
                    { label: 'Cảng biển loại II', value: 2 },
                    { label: 'Cảng biển loại III', value: 3 },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ═══ Section 2: Thông tin địa lý & GIS ═══ */}
        <Card title={<span style={sectionTitleStyle}>2. Thông tin địa lý & GIS</span>} style={sectionStyle}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Loại đối tượng"
                name="geometryType"
                rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Select placeholder="Chọn loại đối tượng" options={[
                  { value: 'POINT', label: 'Đối tượng điểm' },
                  { value: 'LINE', label: 'Đối tượng đường' },
                  { value: 'POLYGON', label: 'Đối tượng vùng' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mã ký hiệu (Symbol ID)" name="mapSymbolId" style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: port_symbol_01" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Hệ quy chiếu" name="coordinateSystem" style={{ marginBottom: spaceFormField }}>
                <Select
                  placeholder="Chọn hệ quy chiếu"
                  allowClear
                  options={[
                    { label: 'WGS-84 (VN-2000)', value: 1 },
                    { label: 'VN-2000 (3 độ múi)', value: 2 },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Quy tắc hiển thị" name="displayRule" style={{ marginBottom: spaceFormField }}>
                <Select
                  placeholder="Chọn quy tắc hiển thị"
                  allowClear
                  options={[
                    { label: 'Hiển thị mặc định', value: 1 },
                    { label: 'Chỉ hiển thị khi zoom ≥ 10', value: 2 },
                    { label: 'Chỉ hiển thị khi zoom ≥ 12', value: 3 },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="gisLocation" style={{ marginBottom: 0 }}>
                <GisLocationSelector defaultGeometryType={updateGeometryType} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ═══ Section 3: Thống kê ═══ */}
        <Card title={<span style={sectionTitleStyle}>3. Thống kê</span>} style={sectionStyle}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Diện tích (m²)"
                name="area"
                style={{ marginBottom: spaceFormField }}
                rules={[]}
              >
                <InputNumber min={0.01} step={0.01} precision={2} placeholder="VD: 100.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Khả năng tiếp nhận" name="maxVesselCapacity" style={{ marginBottom: spaceFormField }}>
                <InputNumber step={0.01} precision={2} placeholder="VD: 500000" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ═══ Section 4: Chỉ số tổng hợp ═══ */}
        <Card title={<span style={sectionTitleStyle}>4. Chỉ số tổng hợp</span>} style={sectionStyle}>
          <Row gutter={[spaceMd, spaceFormField]}>
            {COMPOSITE_INDEX_FIELDS.map((field) => (
              <Col xs={24} sm={12} md={8} key={field.name}>
                {field.name === 'otherWaterAreas' ? (
                  <Form.Item
                    name={field.name}
                    label={field.label}
                    style={{ marginBottom: spaceFormField }}
                  >
                    <Input placeholder="Nhập mô tả" style={{ borderRadius: radiusMd, height: 40 }} />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name={field.name}
                    label={field.label}
                    style={{ marginBottom: spaceFormField }}
                  >
                    <InputNumber
                      style={{ width: '100%', borderRadius: radiusMd }}
                      min={0}
                      placeholder="0"
                    />
                  </Form.Item>
                )}
              </Col>
            ))}
          </Row>
        </Card>

        {/* ═══ Section 5: Tọa độ GPS ═══ */}
        <Card title={<span style={sectionTitleStyle}>5. Tọa độ GPS</span>} style={sectionStyle}>
          <Text
            style={{
              ...metaStyle,
              display: 'block',
              marginBottom: spaceSm,
            }}
          >
            Thêm tọa độ GPS (WGS-84)
          </Text>
          <Table
            columns={gpsColumns}
            dataSource={coordinates}
            rowKey="key"
            pagination={false}
            size="small"
            locale={{ emptyText: 'Chưa có tọa độ GPS. Nhấn "Thêm tọa độ" để bắt đầu.' }}
            style={{ marginBottom: spaceSm }}
          />
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addCoordinate}
            style={{ borderRadius: radiusMd, height: 40 }}
          >
            Thêm tọa độ
          </Button>
        </Card>

        {/* ═══ Section 6: Công trình KCHT ═══ */}
        <Card title={<span style={sectionTitleStyle}>6. Công trình KCHT</span>} style={sectionStyle}>
          <Text
            style={{
              ...metaStyle,
              display: 'block',
              marginBottom: spaceSm,
            }}
          >
            Danh sách các công trình kết cấu hạ tầng hàng hải trực thuộc
          </Text>
          <Table
            columns={infraColumns}
            dataSource={infrastructures}
            rowKey="key"
            pagination={false}
            size="small"
            locale={{ emptyText: 'Chưa có công trình KCHT. Nhấn "Thêm công trình" để bắt đầu.' }}
            style={{ marginBottom: spaceSm }}
          />
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addInfrastructure}
            style={{ borderRadius: radiusMd, height: 40 }}
          >
            Thêm công trình
          </Button>
        </Card>

        {/* ═══ Section 7: File đính kèm ═══ */}
        <Card title={<span style={sectionTitleStyle}>7. File đính kèm</span>} style={sectionStyle}>
          <Text
            style={{
              ...metaStyle,
              display: 'block',
              marginBottom: spaceSm,
            }}
          >
            Tối đa {MAX_FILES} tệp, mỗi tệp ≤ 20MB. Định dạng: PDF, DOC, DOCX, XLS, XLSX,
            JPG, PNG, TIFF.
          </Text>

          {/* Existing attachments */}
          {existingAttachments.length > 0 && (
            <div style={{ marginBottom: spaceMd }}>
              <Text strong style={{ fontSize: fontSizeMd, display: 'block', marginBottom: spaceXs }}>
                Tệp đã tải lên
              </Text>
              {existingAttachments.map((att) => (
                <Space
                  key={att.uid}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: `${spaceXs}px ${spaceSm}px`,
                    marginBottom: spaceXs,
                    background: surfaceCard,
                    borderRadius: radiusMd,
                    border: `0.5px solid ${borderDefault}`,
                  }}
                >
                  <Space>
                    <Text style={{ fontSize: fontSizeMd }}>{att.name}</Text>
                    <Text style={{ ...metaStyle }}>
                      ({(att.size / 1024 / 1024).toFixed(1)} MB)
                    </Text>
                  </Space>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveExistingAttachment(att)}
                  >
                    Xóa
                  </Button>
                </Space>
              ))}
            </div>
          )}

          {/* Upload new files */}
          <Upload.Dragger
            multiple
            fileList={fileList}
            beforeUpload={handleBeforeUpload}
            onChange={handleFileChange}
            onRemove={(file) => {
              setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
            }}
            accept={ALLOWED_EXTENSIONS}
            showUploadList
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kéo tệp vào đây hoặc nhấp để chọn</p>
            <p className="ant-upload-hint">
              Hỗ trợ PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF (tối đa 20MB)
            </p>
          </Upload.Dragger>
        </Card>

        {/* ═══ Section 8: Ghi chú ═══ */}
        <Card title={<span style={sectionTitleStyle}>8. Ghi chú</span>} style={sectionStyle}>
          <Form.Item name="remarks" style={{ marginBottom: 0 }}>
            <TextArea
              rows={4}
              placeholder="Nhập ghi chú (nếu có)"
              maxLength={2000}
              showCount
              style={{ borderRadius: radiusSm, resize: 'vertical' }}
            />
          </Form.Item>
        </Card>

        {/* ═══ Section 9: Trạng thái ═══ */}
        <Card title={<span style={sectionTitleStyle}>9. Trạng thái</span>} style={sectionStyle}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="operationalStatus" style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn trạng thái" options={TRANG_THAI_HOAT_DONG_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt" style={{ marginBottom: 0 }}>
                <Input disabled value={entityData.approvalStatus || '—'} aria-readonly="true" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ═══ Footer ═══ */}
        <Divider style={dividerStyle} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spaceMd,
            padding: `${spaceMd}px 0 ${spaceXl}px`,
          }}
        >
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            style={{
              borderRadius: radiusPill,
              height: 44,
              minWidth: 160,
              fontSize: fontSizeMd,
              fontWeight: fontWeightMedium,
              background: actionPrimary,
              borderColor: actionPrimary,
            }}
          >
            Cập nhật
          </Button>
          <Button
            onClick={() => navigate(`/Port/${id}`)}
            style={{
              borderRadius: radiusPill,
              height: 44,
              minWidth: 120,
              fontSize: fontSizeMd,
              borderColor: borderDefault,
              color: textSecondary,
            }}
          >
            Hủy
          </Button>
        </div>
      </Form>
    </div>
  );
}
