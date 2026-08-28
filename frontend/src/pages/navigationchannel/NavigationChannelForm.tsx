import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Card,
  Table,
  Spin,
  Empty,
  Descriptions,
  Breadcrumb,
  Modal,
  Row,
  Col,
  Tabs,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { navigationChannelCRUD, navigationChannelApproval } from '../../services/navigationChannelService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { symbolService } from '../../services/symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import type {
  NavigationChannelResponse,
  CreateNavigationChannelRequest,
  UpdateNavigationChannelRequest,
  ApprovalRequest,
  ApprovalStatus,
  ConditionStatus,
  ChannelRouteDetailRequest,
  NavigationChannelCoordinateRequest,
} from '../../types/navigationChannel';
import { CONDITION_STATUS_OPTIONS, GIS_GEOMETRY_TYPE_OPTIONS } from '../../types/navigationChannel';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import {
  inputStyle,
  selectStyle,
  formFieldStyle,
  formRowGutter,
  primaryButtonStyle,
  outlineButtonStyle,
  spaceLg,
  spaceMd,
  spaceSm,
  spaceXs,
  textPrimary,
  textSecondary,
  textTertiary,
  fontWeightBold,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  cardStyle,
  drawerTabBarStyle,
  drawerTabContentStyle,
  radiusSm,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider, THEME_SCOPE_CLASS } from '../../context/ThemeTokenContext';

export interface NavigationChannelFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

const trimString = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;

// Loại tuyến luồng — mapping có sẵn trong codebase cũ (channelRouteType 1/2)
const ROUTE_TYPE_OPTIONS = [
  { value: 1, label: 'Công cộng' },
  { value: 2, label: 'Chuyên dùng' },
];

export default function NavigationChannelForm({ open, editId, mode, onCancel, onSuccess }: NavigationChannelFormProps = {}) {
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <NavigationChannelFormInner open={open} editId={editId} mode={mode} onCancel={onCancel} onSuccess={onSuccess} />
    </ThemeTokenProvider>
  );
}

function NavigationChannelFormInner({ open, editId, mode, onCancel, onSuccess }: NavigationChannelFormProps = {}) {
  const navigate = useNavigate();
  const routeParams = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isIframe = window.self !== window.top;
  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeParams.id;
  const isEditMode = isModalMode ? (mode === 'edit') : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? (mode === 'detail') : (!!id && !isEditMode);
  const isCreateMode = isModalMode ? (mode === 'create') : !id;

  const [record, setRecord] = useState<NavigationChannelResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [seaportOptions, setSeaportOptions] = useState<{ id: string; portCode?: string; portName?: string }[]>([]);
  const [symbolOptions, setSymbolOptions] = useState<{ value: string; label: string }[]>([]);

  const [routeRows, setRouteRows] = useState<ChannelRouteDetailRequest[]>([]);
  const [coordRows, setCoordRows] = useState<NavigationChannelCoordinateRequest[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [activeTabKey, setActiveTabKey] = useState('basic-info');

  // ── Load dropdown data (org tree, seaports, symbols) ───────────────
  useEffect(() => {
    if (isDetailMode) return;
    let isMounted = true;
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        if (isMounted) setOrganizations(orgs || []);
      } catch (err) {
        console.error('Không tải được cây đơn vị quản lý', err);
        if (isMounted) setOrganizations([]);
      }
      try {
        const ports = await vtsSystemCRUD.getScopedPortOptions();
        if (isMounted) setSeaportOptions(ports || []);
      } catch (err) {
        console.error('Không tải được danh sách cảng biển', err);
        if (isMounted) setSeaportOptions([]);
      }
      try {
        const res: any = await symbolService.list({ pageSize: 200 });
        const items = Array.isArray(res) ? res : res?.items || [];
        if (isMounted) {
          setSymbolOptions(items.map((s: any) => ({ value: s.id || s.code || '', label: s.name || s.code || s.id || '' })));
        }
      } catch (err) {
        console.error('Không tải được danh sách biểu tượng', err);
        if (isMounted) setSymbolOptions([]);
      }
    })();
    return () => { isMounted = false; };
  }, [isDetailMode]);

  // ── Load detail ────────────────────────────────────────────────────
  useEffect(() => {
    if (id) {
      const loadData = async () => {
        setIsLoading(true);
        setFormError(null);
        try {
          const cached = (window.parent as any)?.kchtDetailCache?.[id] as NavigationChannelResponse | undefined;
          const data = cached || await navigationChannelCRUD.getById(id);
          setRecord(data);
          form.setFieldsValue({
            orgUnitId: data.orgUnitId,
            seaportId: data.seaportId,
            operatingUnitId: data.operatingUnitId,
            channelCode: data.channelCode,
            channelName: data.channelName,
            provinceId: data.provinceId != null ? String(data.provinceId) : undefined,
            detailedLocation: data.detailedLocation,
            conditionStatus: data.conditionStatus,
            managementStation: data.managementStation,
            stationCount: data.stationCount,
            stationStaffCount: data.stationStaffCount,
            stationAreaSquareMeters: data.stationAreaSquareMeters,
            latestStationRepairMonth: data.latestStationRepairMonth ? dayjs(data.latestStationRepairMonth) : null,
            latestMaintenanceYear: data.latestMaintenanceYear ? dayjs(String(data.latestMaintenanceYear)) : null,
            latestDredgingVolumeCubicMeters: data.latestDredgingVolumeCubicMeters,
            buoyCount: data.buoyCount,
            beaconCount: data.beaconCount,
            notes: data.notes,
            announcementDecisionNumber: data.announcementDecisionNumber,
            announcementDecisionDate: data.announcementDecisionDate ? dayjs(data.announcementDecisionDate) : null,
            announcementDecisionIssuer: data.announcementDecisionIssuer,
            protectionScopeMeters: data.protectionScopeMeters,
            protectionNotes: data.protectionNotes,
            geometryType: data.geometryType,
            mapIconId: data.mapIconId,
            coordinateReferenceSystem: data.coordinateReferenceSystem,
            displayRule: data.displayRule,
            spatialData: {
              geometryType: data.geometryType || 'LINE',
              coordinates: data.coordinates?.map((c) => `${c.longitude},${c.latitude}`).join(';') || '',
              symbolId: data.mapIconId,
            },
          });
          setRouteRows(data.routeDetails || []);
          setCoordRows(data.coordinates || []);
          setUploadedFiles(
            (data.attachments || []).map((a, i) => ({
              uid: a.id || `att-${i}`,
              name: a.fileName,
              size: a.fileSize,
              type: a.contentType,
              status: 'done',
              url: a.fileUrl,
            })),
          );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };
      loadData();
    } else {
      form.resetFields();
      setRecord(null);
      setRouteRows([]);
      setCoordRows([]);
      setUploadedFiles([]);
    }
  }, [id, form]);

  // ── Fetch history (detail mode) ────────────────────────────────────
  useEffect(() => {
    if (id && isDetailMode) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          const hist = await navigationChannelApproval.getHistory(id);
          setHistory(hist);
        } catch (err) {
          setHistoryError(err instanceof Error ? err.message : 'Không tải được lịch sử');
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [id, isDetailMode]);

  // ── Route detail (#22-#38) handlers ────────────────────────────────
  const updateRouteRow = useCallback((index: number, field: keyof ChannelRouteDetailRequest, value: any) => {
    setRouteRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const addRouteRow = useCallback(() => setRouteRows((prev) => [...prev, { sequenceNo: prev.length + 1 }]), []);
  const deleteRouteRow = useCallback((index: number) => setRouteRows((prev) => prev.filter((_, i) => i !== index)), []);

  // ── Coordinates (#45) handlers ─────────────────────────────────────
  const updateCoordRow = useCallback((index: number, field: keyof NavigationChannelCoordinateRequest, value: any) => {
    setCoordRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const addCoordRow = useCallback(() => setCoordRows((prev) => [...prev, { sequenceNo: prev.length + 1 }]), []);
  const deleteCoordRow = useCallback((index: number) => setCoordRows((prev) => prev.filter((_, i) => i !== index)), []);

  const routeColumns = useMemo(() => {
    const inputCell = (style?: React.CSSProperties) => ({ ...inputStyle, width: '100%', ...(style || {}) });
    return [
      {
        title: 'STT',
        key: 'sequenceNo',
        width: 48,
        render: (_: any, __: any, index: number) => <span style={{ color: textSecondary, fontSize: fontSizeMd }}>{index + 1}</span>,
      },
      {
        title: 'Phân loại',
        dataIndex: 'routeClassification',
        width: 110,
        render: (text: string, _: any, index: number) => (
          <Input value={text} onChange={(e) => updateRouteRow(index, 'routeClassification', e.target.value)} placeholder="Phân loại" style={inputCell()} />
        ),
      },
      {
        title: 'Mã',
        dataIndex: 'routeCode',
        width: 120,
        render: (text: string) => (
          <Input value={text} disabled placeholder="Tự sinh" style={inputCell()} />
        ),
      },
      {
        title: 'Tên',
        dataIndex: 'routeName',
        width: 160,
        render: (text: string, _: any, index: number) => (
          <Input value={text} onChange={(e) => updateRouteRow(index, 'routeName', e.target.value)} placeholder="Nhập tên tuyến" style={inputCell()} />
        ),
      },
      {
        title: 'Loại tuyến',
        dataIndex: 'routeType',
        width: 130,
        render: (value: number | undefined, _: any, index: number) => (
          <Select value={value} onChange={(v) => updateRouteRow(index, 'routeType', v)} placeholder="Chọn loại" allowClear options={ROUTE_TYPE_OPTIONS} style={inputCell()} />
        ),
      },
      {
        title: 'Vị trí vũng quay tàu',
        dataIndex: 'turningBasinLocation',
        width: 150,
        render: (text: string, _: any, index: number) => (
          <Input value={text} onChange={(e) => updateRouteRow(index, 'turningBasinLocation', e.target.value)} placeholder="Vị trí" style={inputCell()} />
        ),
      },
      {
        title: 'Bán kính vũng quay (m)',
        dataIndex: 'turningBasinRadiusMeters',
        width: 140,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'turningBasinRadiusMeters', v)} placeholder="Bán kính" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Chiều cao tĩnh không (m)',
        dataIndex: 'verticalClearanceMeters',
        width: 150,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'verticalClearanceMeters', v)} placeholder="Chiều cao" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Chiều dài (km)',
        dataIndex: 'channelLengthKilometers',
        width: 130,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'channelLengthKilometers', v)} placeholder="Chiều dài" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Rộng TK lớn nhất (m)',
        dataIndex: 'maximumDesignWidthMeters',
        width: 140,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'maximumDesignWidthMeters', v)} placeholder="Rộng lớn nhất" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Rộng TK nhỏ nhất (m)',
        dataIndex: 'minimumDesignWidthMeters',
        width: 140,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'minimumDesignWidthMeters', v)} placeholder="Rộng nhỏ nhất" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Độ sâu TK (m)',
        dataIndex: 'designDepthMeters',
        width: 130,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'designDepthMeters', v)} placeholder="Độ sâu TK" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Độ sâu hiện tại (m)',
        dataIndex: 'currentDepthMeters',
        width: 140,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'currentDepthMeters', v)} placeholder="Độ sâu HT" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Mái dốc TK',
        dataIndex: 'designSlope',
        width: 110,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'designSlope', v)} placeholder="Mái dốc" style={inputCell()} />
        ),
      },
      {
        title: 'Bán kính cong NN (m)',
        dataIndex: 'minimumCurveRadiusMeters',
        width: 140,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'minimumCurveRadiusMeters', v)} placeholder="Bán kính cong" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'KL nạo vét (m³)',
        dataIndex: 'routeLatestDredgingVolumeCubicMeters',
        width: 130,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'routeLatestDredgingVolumeCubicMeters', v)} placeholder="KL nạo vét" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Năm bảo trì',
        dataIndex: 'routeLatestMaintenanceYear',
        width: 110,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'routeLatestMaintenanceYear', v)} placeholder="Năm" min={1990} max={2100} style={inputCell()} />
        ),
      },
      {
        title: 'Phân cấp',
        dataIndex: 'routeGrade',
        width: 100,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'routeGrade', v)} placeholder="Cấp" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 60,
        fixed: 'right' as const,
        render: (_: any, __: any, index: number) => (
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteRouteRow(index)} />
        ),
      },
    ];
  }, [updateRouteRow, deleteRouteRow]);

  const coordColumns = useMemo(() => [
    {
      title: 'STT',
      key: 'sequenceNo',
      width: 60,
      render: (_: any, __: any, index: number) => <span style={{ color: textSecondary, fontSize: fontSizeMd }}>{index + 1}</span>,
    },
    {
      title: 'Kinh độ (longitude)',
      dataIndex: 'longitude',
      width: 200,
      render: (value: number | undefined, _: any, index: number) => (
        <InputNumber value={value} onChange={(v) => updateCoordRow(index, 'longitude', v)} placeholder="Ví dụ: 106.7000000" style={{ ...inputStyle, width: '100%' }} />
      ),
    },
    {
      title: 'Vĩ độ (latitude)',
      dataIndex: 'latitude',
      width: 200,
      render: (value: number | undefined, _: any, index: number) => (
        <InputNumber value={value} onChange={(v) => updateCoordRow(index, 'latitude', v)} placeholder="Ví dụ: 20.8500000" style={{ ...inputStyle, width: '100%' }} />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteCoordRow(index)} />
      ),
    },
  ], [updateCoordRow, deleteCoordRow]);

  // ── Submit (trim + map + call API) ─────────────────────────────────
  const handleSubmitForm = async (values: any) => {
    setIsSubmitting(true);
    try {
      const spatialData = values.spatialData || {};
      const payload: CreateNavigationChannelRequest = {
        orgUnitId: values.orgUnitId,
        seaportId: values.seaportId,
        operatingUnitId: values.operatingUnitId,
        channelName: trimString(values.channelName) || '',
        provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
        detailedLocation: trimString(values.detailedLocation),
        conditionStatus: values.conditionStatus as ConditionStatus,
        managementStation: trimString(values.managementStation),
        stationCount: values.stationCount,
        stationStaffCount: values.stationStaffCount,
        stationAreaSquareMeters: values.stationAreaSquareMeters,
        latestStationRepairMonth: values.latestStationRepairMonth ? values.latestStationRepairMonth.format('YYYY-MM-DD') : undefined,
        latestMaintenanceYear: values.latestMaintenanceYear ? values.latestMaintenanceYear.year() : undefined,
        latestDredgingVolumeCubicMeters: values.latestDredgingVolumeCubicMeters,
        buoyCount: values.buoyCount,
        beaconCount: values.beaconCount,
        notes: trimString(values.notes),
        announcementDecisionNumber: trimString(values.announcementDecisionNumber),
        announcementDecisionDate: values.announcementDecisionDate ? values.announcementDecisionDate.format('YYYY-MM-DD') : undefined,
        announcementDecisionIssuer: trimString(values.announcementDecisionIssuer),
        protectionScopeMeters: values.protectionScopeMeters,
        protectionNotes: trimString(values.protectionNotes),
        geometryType: values.geometryType || spatialData.geometryType,
        mapIconId: values.mapIconId || spatialData.symbolId,
        coordinateReferenceSystem: trimString(values.coordinateReferenceSystem),
        displayRule: trimString(values.displayRule),
        routeDetails: routeRows.length > 0 ? routeRows.map((row, i) => ({
          ...row,
          sequenceNo: i + 1,
          routeClassification: trimString(row.routeClassification),
          routeName: trimString(row.routeName),
          turningBasinLocation: trimString(row.turningBasinLocation),
        })) : undefined,
        coordinates: coordRows.length > 0 ? coordRows.map((row, i) => ({
          ...row,
          sequenceNo: i + 1,
        })) : undefined,
        attachments: uploadedFiles.length > 0 ? uploadedFiles.map((f) => ({
          fileName: f.name,
          fileSize: f.size,
          contentType: f.type,
        })) : undefined,
      };

      if (isCreateMode) {
        await navigationChannelCRUD.create(payload);
        toast.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/navigation-channel');
        }
      } else if (id && isEditMode) {
        const updatePayload: UpdateNavigationChannelRequest = { ...payload, id };
        const res = await navigationChannelCRUD.update(id, updatePayload);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/navigation-channel');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Approval actions (detail mode — giữ nguyên luồng cũ) ───────────
  const handleApprovalAction = useCallback(
    async (action: 'approveC1' | 'approveC2' | 'reject' | 'delete', payload?: Record<string, unknown>) => {
      if (!id || !record) return;
      setIsSubmitting(true);
      try {
        if (action === 'approveC1') {
          const req: ApprovalRequest = { status: 'APPROVED' };
          const res = await navigationChannelApproval.approveC1(id, req);
          if (window.parent && (window.parent as any).kchtDetailCache) (window.parent as any).kchtDetailCache[id] = res;
          toast.success('Phê duyệt C1 thành công');
          setRecord({ ...record, approvalStatus: 'APPROVED_LEVEL1' });
        } else if (action === 'approveC2') {
          const req: ApprovalRequest = { status: 'APPROVED' };
          const res = await navigationChannelApproval.approveC2(id, req);
          if (window.parent && (window.parent as any).kchtDetailCache) (window.parent as any).kchtDetailCache[id] = res;
          toast.success('Phê duyệt C2 thành công');
          setRecord({ ...record, approvalStatus: 'APPROVED' });
        } else if (action === 'reject') {
          const reason = payload?.lyDo ? String(payload.lyDo).trim() : undefined;
          const req: ApprovalRequest = { status: 'REJECTED', reason };
          let updatedRecord: NavigationChannelResponse;
          if (record.approvalStatus === 'APPROVED_LEVEL1') {
            updatedRecord = await navigationChannelApproval.rejectLevel2(id, req);
          } else {
            updatedRecord = await navigationChannelApproval.rejectLevel1(id, req);
          }
          if (window.parent && (window.parent as any).kchtDetailCache) (window.parent as any).kchtDetailCache[id] = updatedRecord;
          toast.success('Từ chối thành công');
          setRecord({ ...record, approvalStatus: updatedRecord.approvalStatus, rejectionReason: reason });
        } else if (action === 'delete') {
          await navigationChannelCRUD.delete(id);
          toast.success('Xóa thành công');
          if (isModalMode && onSuccess) {
            onSuccess();
          } else if (isIframe) {
            window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
          } else {
            navigate('/navigation-channel');
          }
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, record, isModalMode, onSuccess, isIframe, navigate],
  );

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Luồng hàng hải', onClick: () => navigate('/navigation-channel') },
    { title: isCreateMode ? 'Tạo mới' : isEditMode ? 'Chỉnh sửa' : 'Chi tiết' },
  ];

  const sectionTitle = (text: string) => (
    <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg, marginBottom: spaceMd }}>{text}</div>
  );

  // ── Detail / read-only view (#1-#71, #47-#71 read-only) ────────────
  if (isDetailMode) {
    const fmtDateTime = (v?: string) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—');
    const fmtDate = (v?: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isModalMode ? 0 : `${spaceLg}px ${spaceLg}px` }}>
        {!isModalMode && <Breadcrumb items={breadcrumbs.map((b) => ({ title: <span>{b.title}</span> }))} style={{ marginBottom: 16 }} />}
        <Spin spinning={isLoading}>
          {formError ? (
            <Card>
              <Empty description={formError} style={{ marginTop: 24 }} />
              <Button onClick={() => (isModalMode ? onCancel?.() : navigate('/navigation-channel'))} style={{ marginTop: spaceLg, ...outlineButtonStyle }}>
                Quay lại
              </Button>
            </Card>
          ) : record ? (
            <>
              <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                {sectionTitle('Hồ sơ chính')}
                <Descriptions bordered size="small" column={2} labelStyle={{ width: 180 }}>
                  <Descriptions.Item label="Đơn vị quản lý">{record.orgUnitName || record.orgUnitId || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Thuộc cảng biển">{record.seaportName || record.seaportId || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Đơn vị vận hành">{record.operatingUnitId || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Mã luồng hàng hải">{record.channelCode || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Tên luồng hàng hải">{record.channelName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Địa điểm (Tỉnh/TP)">{record.provinceId != null ? String(record.provinceId) : '—'}</Descriptions.Item>
                  <Descriptions.Item label="Địa điểm chi tiết">{record.detailedLocation || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Tình trạng">
                    {record.conditionStatus ? <ApprovalStatusBadge status={record.conditionStatus} size="small" /> : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạm quản lý luồng">{record.managementStation || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Số lượng trạm">{record.stationCount ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Số lượng nhân sự tại trạm">{record.stationStaffCount ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Diện tích trạm m²">{record.stationAreaSquareMeters ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Sửa chữa trạm gần nhất">{fmtDate(record.latestStationRepairMonth)}</Descriptions.Item>
                  <Descriptions.Item label="Năm bảo trì gần nhất">{record.latestMaintenanceYear ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="KL nạo vét m³">{record.latestDredgingVolumeCubicMeters ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Số lượng phao">{record.buoyCount ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Số lượng tiêu">{record.beaconCount ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Quyết định công bố số">{record.announcementDecisionNumber || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ngày ra quyết định">{fmtDate(record.announcementDecisionDate)}</Descriptions.Item>
                  <Descriptions.Item label="Đơn vị ra quyết định" span={2}>{record.announcementDecisionIssuer || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ghi chú" span={2}>{record.notes || '—'}</Descriptions.Item>
                </Descriptions>
              </Card>

              <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                {sectionTitle('Phạm vi bảo vệ và bản đồ')}
                <Descriptions bordered size="small" column={2} labelStyle={{ width: 180 }}>
                  <Descriptions.Item label="Phạm vi bảo vệ luồng (m)">{record.protectionScopeMeters ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ghi chú">{record.protectionNotes || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Loại đối tượng">{record.geometryType || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Biểu tượng">{record.mapIconId || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Hệ quy chiếu">{record.coordinateReferenceSystem || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Quy tắc hiển thị">{record.displayRule || '—'}</Descriptions.Item>
                </Descriptions>
              </Card>

              {record.routeDetails && record.routeDetails.length > 0 && (
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Tuyến luồng')}
                  <Table
                    dataSource={record.routeDetails}
                    rowKey={(row, index) => row.id || String(index)}
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    columns={[
                      { title: 'STT', width: 50, render: (_: any, __: any, i: number) => i + 1 },
                      { title: 'Phân loại', dataIndex: 'routeClassification', width: 100 },
                      { title: 'Mã', dataIndex: 'routeCode', width: 110 },
                      { title: 'Tên', dataIndex: 'routeName', width: 180 },
                      { title: 'Loại tuyến', width: 110, render: (_: any, r: any) => (r.routeType === 1 ? 'Công cộng' : r.routeType === 2 ? 'Chuyên dùng' : '—') },
                      { title: 'Vị trí vũng quay tàu', dataIndex: 'turningBasinLocation', width: 150 },
                      { title: 'Bán kính vũng quay (m)', dataIndex: 'turningBasinRadiusMeters', width: 130 },
                      { title: 'Chiều cao tĩnh không (m)', dataIndex: 'verticalClearanceMeters', width: 140 },
                      { title: 'Chiều dài (km)', dataIndex: 'channelLengthKilometers', width: 110 },
                      { title: 'Rộng TK LN (m)', dataIndex: 'maximumDesignWidthMeters', width: 120 },
                      { title: 'Rộng TK NN (m)', dataIndex: 'minimumDesignWidthMeters', width: 120 },
                      { title: 'Độ sâu TK (m)', dataIndex: 'designDepthMeters', width: 110 },
                      { title: 'Độ sâu HT (m)', dataIndex: 'currentDepthMeters', width: 110 },
                      { title: 'Mái dốc TK', dataIndex: 'designSlope', width: 90 },
                      { title: 'Bán kính cong NN (m)', dataIndex: 'minimumCurveRadiusMeters', width: 130 },
                      { title: 'KL nạo vét (m³)', dataIndex: 'routeLatestDredgingVolumeCubicMeters', width: 120 },
                      { title: 'Năm bảo trì', dataIndex: 'routeLatestMaintenanceYear', width: 90 },
                      { title: 'Phân cấp', dataIndex: 'routeGrade', width: 80 },
                    ]}
                  />
                </Card>
              )}

              {record.coordinates && record.coordinates.length > 0 && (
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Tọa độ')}
                  <Table
                    dataSource={record.coordinates}
                    rowKey={(row, index) => row.id || String(index)}
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    columns={[
                      { title: 'STT', width: 60, render: (_: any, __: any, i: number) => i + 1 },
                      { title: 'Kinh độ', dataIndex: 'longitude', width: 160 },
                      { title: 'Vĩ độ', dataIndex: 'latitude', width: 160 },
                    ]}
                  />
                </Card>
              )}

              {record.attachments && record.attachments.length > 0 && (
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('File đính kèm')}
                  <AttachmentList
                    attachments={(record.attachments || []).map((a) => ({
                      id: a.id || '',
                      fileName: a.fileName,
                      filePath: a.fileUrl || '',
                    }))}
                    readonly={true}
                  />
                </Card>
              )}

              <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                {sectionTitle('Trạng thái và phê duyệt')}
                <Descriptions bordered size="small" column={2} labelStyle={{ width: 180 }}>
                  <Descriptions.Item label="Trạng thái">
                    <ApprovalStatusBadge status={record.approvalStatus} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày cập nhật">{fmtDateTime(record.updatedAt)}</Descriptions.Item>
                  <Descriptions.Item label="Cán bộ cập nhật">{record.updatedBy || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ngày gửi phê duyệt">{fmtDateTime(record.submittedAt)}</Descriptions.Item>
                  <Descriptions.Item label="Cán bộ gửi phê duyệt">{record.submittedBy || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ngày duyệt cấp Cảng vụ/Chi cục">{fmtDateTime(record.level1ApprovedAt)}</Descriptions.Item>
                  <Descriptions.Item label="Cán bộ duyệt cấp Cảng vụ/Chi cục">{record.level1ApprovedBy || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Nội dung duyệt cấp 1">{record.level1ApprovalContent || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ngày duyệt cấp Cục">{fmtDateTime(record.level2ApprovedAt)}</Descriptions.Item>
                  <Descriptions.Item label="Cán bộ duyệt cấp Cục">{record.level2ApprovedBy || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Nội dung duyệt cấp 2">{record.level2ApprovalContent || '—'}</Descriptions.Item>
                </Descriptions>
              </Card>

              <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                {sectionTitle('Thông tin liên quan')}
                <Descriptions bordered size="small" column={2} labelStyle={{ width: 180 }}>
                  <Descriptions.Item label="Tên KCHT">{record.relatedInfrastructureName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Loại KCHT">{record.relatedInfrastructureType || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Mã kế hoạch vận hành">{record.operationPlanCode || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Tên kế hoạch vận hành">{record.operationPlanName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ngày bắt đầu vận hành">{fmtDate(record.operationStartDate)}</Descriptions.Item>
                  <Descriptions.Item label="Ngày kết thúc vận hành">{fmtDate(record.operationEndDate)}</Descriptions.Item>
                  <Descriptions.Item label="Mã kế hoạch bảo trì">{record.maintenancePlanCode || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Tên kế hoạch bảo trì">{record.maintenancePlanName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Bảo trì bắt đầu">{record.maintenanceStartTime || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Bảo trì kết thúc">{record.maintenanceEndTime || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Mã sự cố">{record.incidentCode || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Loại sự cố">{record.incidentType || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Địa điểm sự cố">{record.incidentLocation || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Thời gian sự cố">{fmtDateTime(record.incidentTime)}</Descriptions.Item>
                </Descriptions>
              </Card>

              <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                <ApprovalActionBar
                  currentStatus={record.approvalStatus as ApprovalStatus}
                  permissions={userPermissions}
                  entityPermissionPrefix="navigationchannel"
                  currentUserId={currentUser?.username}
                  nguoiPheDuyetC1={record.approverLevel1}
                  onAction={handleApprovalAction}
                  loading={isSubmitting}
                />
              </Card>

              <Card style={{ ...cardStyle }}>
                {sectionTitle('Lịch sử phê duyệt')}
                <HistoryTimeline
                  history={history}
                  loading={isLoadingHistory}
                  error={historyError || undefined}
                  onRetry={() => {
                    if (!id) return;
                    setIsLoadingHistory(true);
                    setHistoryError(null);
                    navigationChannelApproval.getHistory(id)
                      .then((hist) => setHistory(hist))
                      .catch((err) => setHistoryError(err instanceof Error ? err.message : 'Không tải được lịch sử'))
                      .finally(() => setIsLoadingHistory(false));
                  }}
                />
              </Card>
            </>
          ) : (
            <Empty description="Không có dữ liệu" />
          )}
        </Spin>
      </div>
    );
  }

  // ── Create / Edit form (#1-#46) ────────────────────────────────────
  const formContent = (
    <Form form={form} layout="vertical" onFinish={handleSubmitForm} style={{ maxWidth: 1100 }}>
      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        tabBarStyle={drawerTabBarStyle}
        items={[
          {
            key: 'basic-info',
            label: 'Thông tin cơ bản',
            children: (
              <div style={drawerTabContentStyle}>
                {/* Hồ sơ chính */}
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Hồ sơ chính')}
                  <Row gutter={formRowGutter}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="orgUnitId"
                        label="Đơn vị quản lý"
                        style={formFieldStyle}
                        rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}
                      >
                        <OrgUnitTreeSelect organizations={organizations} placeholder="Chọn đơn vị quản lý..." showPath treeDefaultExpandAll={false} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="seaportId" label="Thuộc cảng biển" style={formFieldStyle}>
                        <Select
                          placeholder="Chọn cảng biển"
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          options={seaportOptions.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id }))}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="operatingUnitId" label="Đơn vị vận hành" style={formFieldStyle}>
                        <Select
                          placeholder="Chọn đơn vị vận hành"
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          options={organizations.map((org) => ({ value: org.id, label: org.code ? `${org.code} - ${org.name}` : org.name }))}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="channelCode" label="Mã luồng hàng hải" style={formFieldStyle}>
                        <Input disabled placeholder="Tự sinh khi lưu (LHH...)" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="channelName"
                        label="Tên luồng hàng hải"
                        style={formFieldStyle}
                        rules={[{ required: true, message: 'Tên luồng hàng hải là bắt buộc' }]}
                      >
                        <Input.TextArea rows={2} maxLength={100} showCount placeholder="Nhập tên luồng hàng hải" style={{ borderRadius: radiusSm, resize: 'vertical' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="provinceId" label="Địa điểm (Tỉnh/TP)" style={formFieldStyle}>
                        <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch optionFilterProp="label" options={VIETNAM_PROVINCE_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="detailedLocation" label="Địa điểm chi tiết" style={formFieldStyle}>
                        <Input.TextArea rows={2} maxLength={500} showCount placeholder="Nhập địa điểm chi tiết" style={{ borderRadius: radiusSm, resize: 'vertical' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="conditionStatus"
                        label="Tình trạng"
                        style={formFieldStyle}
                        rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}
                      >
                        <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="managementStation" label="Trạm quản lý luồng" style={formFieldStyle}>
                        <Input.TextArea rows={2} maxLength={500} placeholder="Nhập trạm quản lý luồng" style={{ borderRadius: radiusSm, resize: 'vertical' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="stationCount" label="Số lượng trạm" style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập số lượng trạm" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="stationStaffCount" label="Số lượng nhân sự tại trạm" style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập số lượng nhân sự" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="stationAreaSquareMeters" label="Diện tích trạm (m²)" style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập diện tích trạm" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="latestStationRepairMonth" label="Sửa chữa trạm gần nhất" style={formFieldStyle}>
                        <DatePicker picker="month" format="MM/YYYY" placeholder="Chọn tháng/năm" style={{ ...selectStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="latestMaintenanceYear" label="Năm bảo trì gần nhất" style={formFieldStyle}>
                        <DatePicker picker="year" format="YYYY" placeholder="Chọn năm" style={{ ...selectStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="latestDredgingVolumeCubicMeters" label="Khối lượng nạo vét (m³)" style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập khối lượng nạo vét" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="buoyCount" label="Số lượng phao" style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập số lượng phao" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="beaconCount" label="Số lượng tiêu" style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập số lượng tiêu" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="announcementDecisionNumber" label="Quyết định công bố số" style={formFieldStyle}>
                        <Input maxLength={100} placeholder="Nhập số quyết định công bố" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="announcementDecisionDate" label="Ngày ra quyết định công bố" style={formFieldStyle}>
                        <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ ...selectStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="announcementDecisionIssuer" label="Đơn vị ra quyết định công bố" style={formFieldStyle}>
                        <Input.TextArea rows={2} maxLength={500} placeholder="Nhập đơn vị ra quyết định" style={{ borderRadius: radiusSm, resize: 'vertical' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item name="notes" label="Ghi chú" style={formFieldStyle}>
                        <Input.TextArea rows={3} maxLength={500} showCount placeholder="Nhập ghi chú" style={{ borderRadius: radiusSm, resize: 'vertical' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </div>
            ),
          },
          {
            key: 'route-map',
            label: 'Tuyến luồng & Bản đồ',
            children: (
              <div style={drawerTabContentStyle}>
                {/* Tuyến luồng */}
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Tuyến luồng')}
                  <Button icon={<PlusOutlined />} onClick={addRouteRow} style={{ ...outlineButtonStyle, marginBottom: spaceSm }}>
                    Thêm tuyến luồng
                  </Button>
                  <Table
                    dataSource={routeRows}
                    columns={routeColumns}
                    rowKey={(_, index) => String(index)}
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: 'Chưa có tuyến luồng nào' }}
                  />
                </Card>
                {/* Phạm vi bảo vệ và bản đồ */}
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Phạm vi bảo vệ và bản đồ')}
                  <Row gutter={formRowGutter}>
                    <Col xs={24} md={12}>
                      <Form.Item name="protectionScopeMeters" label="Phạm vi bảo vệ luồng (m)" style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập phạm vi bảo vệ" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="protectionNotes" label="Ghi chú" style={formFieldStyle}>
                        <Input.TextArea rows={2} maxLength={500} placeholder="Nhập ghi chú phạm vi bảo vệ" style={{ borderRadius: radiusSm, resize: 'vertical' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="geometryType" label="Loại đối tượng" style={formFieldStyle}>
                        <Select placeholder="Chọn loại đối tượng" options={GIS_GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="mapIconId" label="Biểu tượng" style={formFieldStyle}>
                        <Select placeholder="Chọn biểu tượng" allowClear showSearch optionFilterProp="label" options={symbolOptions} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="coordinateReferenceSystem" label="Hệ quy chiếu" style={formFieldStyle}>
                        <Input maxLength={50} placeholder="Ví dụ: WGS 84" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="displayRule" label="Quy tắc hiển thị" style={formFieldStyle}>
                        <Input maxLength={500} placeholder="Nhập quy tắc hiển thị" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item name="spatialData" label="Bản đồ GIS" style={formFieldStyle}>
                        <GisLocationSelector defaultGeometryType="LINE" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
                {/* Tọa độ */}
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Tọa độ')}
                  <Button icon={<PlusOutlined />} onClick={addCoordRow} style={{ ...outlineButtonStyle, marginBottom: spaceSm }}>
                    Thêm tọa độ
                  </Button>
                  <Table
                    dataSource={coordRows}
                    columns={coordColumns}
                    rowKey={(_, index) => String(index)}
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: 'Chưa có tọa độ nào' }}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: 'attachments',
            label: 'File đính kèm',
            children: (
              <div style={drawerTabContentStyle}>
                {/* File đính kèm */}
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('File đính kèm')}
                  <Upload
                    multiple
                    beforeUpload={() => false}
                    fileList={uploadedFiles}
                    onChange={({ fileList }) => setUploadedFiles(fileList)}
                  >
                    <Button icon={<UploadOutlined />} style={{ ...outlineButtonStyle }}>
                      Chọn file đính kèm
                    </Button>
                  </Upload>
                  <div style={{ fontSize: fontSizeSm, color: textTertiary, marginTop: spaceXs }}>
                    Chọn file để đính kèm vào hồ sơ; file được tải lên cùng lúc lưu hồ sơ.
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />
      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: spaceSm, marginBottom: spaceMd }}>
        <Button
          htmlType="submit"
          type="primary"
          loading={isSubmitting}
          style={{ ...primaryButtonStyle, minWidth: 120 }}
        >
          {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
        </Button>
        <Button
          onClick={isIframe
            ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*')
            : isModalMode ? onCancel : () => navigate('/navigation-channel')}
          style={{ ...outlineButtonStyle, minWidth: 120 }}
        >
          Hủy
        </Button>
      </div>
    </Form>
  );

  if (isModalMode) {
    return (
      <Modal
        open={open}
        onCancel={onCancel}
        width={1080}
        footer={null}
        rootClassName={THEME_SCOPE_CLASS}
        title={
          <span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            {isCreateMode ? 'Tạo mới Luồng hàng hải' : isEditMode ? 'Chỉnh sửa Luồng hàng hải' : 'Chi tiết Luồng hàng hải'}
          </span>
        }
      >
        {formContent}
      </Modal>
    );
  }

  return (
    <div style={{ padding: '16px 24px' }}>
      <Breadcrumb items={breadcrumbs.map((b) => ({ title: <span style={{ color: textSecondary }}>{b.title}</span> }))} style={{ marginBottom: spaceMd }} />
      {formContent}
    </div>
  );
}
