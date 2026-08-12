import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Form,
  Button,
  Input,
  Select,
  Card,
  Spin,
  Empty,
  Descriptions,
  Space,
  Breadcrumb,
  Drawer,
  Tabs,
  DatePicker,
  Table,
  Row,
  Col,
  Upload,
  message,
  Tag,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import { portCRUD } from '../../services/portService';
import { organizationService } from '../../services/organizationService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type {
  VtsSystemResponse,
  CreateVtsSystemRequest,
  UpdateVtsSystemRequest,
  ApprovalRequest,
} from '../../types/vtsSystem';
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle, requiredMarkStyle, spaceFormField, radiusPill, radiusMd, inputStyle, selectStyle, sidebarBg, fontWeightBold, fontWeightMedium, spaceMd, spaceSm, fontSizeMd, textSecondary, textTertiary, textPrimary, borderDefault, surfaceCard, uploadHintStyle, statusCritical, statusAttention, statusOperational, statusDraft, actionPrimary } from '../../tokens';
import { colors } from '../../theme';
import { VIETNAM_PROVINCES, getProvinceIdByName, getProvinceNameById } from '../../types/common';

import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

export interface VtsSystemFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: VtsSystemResponse | null;
  initialDataOnly?: boolean;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const renderConditionStatusBadge = (status?: ConditionStatus | string) => {
  if (!status) return '—';
  const label = CONDITION_STATUS_MAP[status as ConditionStatus] || status;
  const color = CONDITION_COLOR[status as ConditionStatus] || textSecondary;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        border: `1px solid ${color}40`,
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        background: `${color}15`,
        color,
        marginLeft: -6,
      }}
    >
      {label}
    </span>
  );
};

type VtsDetailCacheWindow = Window & {
  kchtDetailCache?: Record<string, VtsSystemResponse>;
};

// Deduplicate concurrent detail requests, including React StrictMode effect re-runs.
const pendingVtsDetailRequests = new Map<string, Promise<VtsSystemResponse>>();

const getVtsDetailCache = (): Record<string, VtsSystemResponse> => {
  try {
    const parentWindow = window.parent as VtsDetailCacheWindow;
    parentWindow.kchtDetailCache = parentWindow.kchtDetailCache || {};
    return parentWindow.kchtDetailCache;
  } catch {
    return {};
  }
};

const isCompleteVtsDetail = (data?: VtsSystemResponse | null): data is VtsSystemResponse =>
  Boolean(data?.id && Array.isArray(data.zones) && Array.isArray(data.attachments));

const loadVtsDetail = (
  id: string,
  options: { includeZones?: boolean; includeAttachments?: boolean } = {},
): Promise<VtsSystemResponse> => {
  const includeZones = options.includeZones ?? true;
  const includeAttachments = options.includeAttachments ?? true;
  const requestKey = `${id}:${includeZones}:${includeAttachments}`;
  const pending = pendingVtsDetailRequests.get(requestKey);
  if (pending) return pending;

  const request = vtsSystemCRUD.getById(id, { includeZones, includeAttachments }).then((data) => {
    if (includeZones && includeAttachments && isCompleteVtsDetail(data)) {
      getVtsDetailCache()[id] = data;
    }
    return data;
  }).finally(() => {
    pendingVtsDetailRequests.delete(requestKey);
  });

  pendingVtsDetailRequests.set(requestKey, request);
  return request;
};

export default function VtsSystemForm({ open, editId, initialData, initialDataOnly = false, mode, onCancel, onSuccess }: VtsSystemFormProps = {}) {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isIframe = window.self !== window.top;
  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeId;
  const isEditMode = isModalMode ? mode === 'edit' : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? mode === 'detail' : (!!id && !isEditMode);
  const isCreateMode = isModalMode ? mode === 'create' : !id;

  const [record, setRecord] = useState<VtsSystemResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [portOptions, setPortOptions] = useState<any[]>([]);
  const [tabKey, setTabKey] = useState('general');
  const [zoneList, setZoneList] = useState<any[]>([]);
  const [detailSectionsLoaded, setDetailSectionsLoaded] = useState({ zones: false, attachments: false });
  const [loadingDetailSection, setLoadingDetailSection] = useState<'zones' | 'attachments' | null>(null);

  const formInitialValues = useRef({ conditionStatus: ConditionStatus.OPERATIONAL });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isModalMode && !open) return;
    if (!isDetailMode) {
      (async () => {
        try {
          const resp = await organizationService.list({ pageSize: 1000 });
          setOrganizations(resp.data || []);
        } catch (err) {
          console.error('Không thể tải danh sách đơn vị', err);
        }
      })();
    }
    if (!isDetailMode) {
      (async () => {
        try {
          const opts = await portCRUD.getOptions();
          setPortOptions(opts.map((p: any) => ({ value: p.id, label: p.portName || p.name || p.id })));
        } catch (err) {
          console.error('Failed to load ports', err);
        }
      })();
    } else {
      setPortOptions([]);
    }
  }, [open, isDetailMode]);

  useEffect(() => {
    if (open && isCreateMode) {
      setHasChanges(false);
      setPendingFiles([]);
      setZoneList([]);
      form.resetFields();
    }
  }, [open, isCreateMode, form]);

  // Fetch detail data
  useEffect(() => {
    let cancelled = false;

    if (id && (isModalMode ? open : true)) {
      const loadData = async () => {
        setDetailSectionsLoaded({ zones: !isDetailMode, attachments: !isDetailMode });
        const cached = getVtsDetailCache()[id];
        const localData = initialDataOnly && isCompleteVtsDetail(initialData)
          ? initialData
          : (isCompleteVtsDetail(cached)
          ? cached
          : (isCompleteVtsDetail(initialData) ? initialData : null));

        // The list response is intentionally lightweight. Only reuse a full
        // detail response here so edit mode does not lose fields.
        setIsLoading(!localData);
        setFormError(null);
        try {
          const data = localData || await loadVtsDetail(id, {
            includeZones: !isDetailMode,
            includeAttachments: !isDetailMode,
          });
          if (cancelled) return;
          if (!data) throw new Error('Không tìm thấy dữ liệu Hệ thống VTS');
          setRecord(data);

          const provinceVal = data.province
            ? data.province
            : (data.provinceId ? getProvinceNameById(data.provinceId) : undefined);

          // Defer setFieldsValue to next frame so Form inside Drawer is mounted
          requestAnimationFrame(() => {
            form.setFieldsValue({
            systemName: data.systemName,
            location: data.address || data.province || '',
            conditionStatus: data.conditionStatus || ConditionStatus.OPERATIONAL,
            responsibilityLevel: data.responsibilityLevel,
            source: data.source,
            partner: data.partner,
            scope: data.scope,
            note: data.note,
            orgUnitId: data.orgUnitId,
            owningOrgId: data.owningOrgId,
            operatingOrgId: data.operatingOrgId,
            portId: data.portId,
            code: data.code,
            province: provinceVal,
            provinceId: data.provinceId,
            address: data.address,
            maritimeNotice: data.maritimeNotice,
            operationStartDate: data.operationStartDate ? dayjs(data.operationStartDate) : undefined,
            spatialData: {
              geometryType: data.geometryType,
              coordinates: data.coordinates,
            }
          });
          });
          if (data.zones && data.zones.length > 0) {
            setZoneList(data.zones.map((z: any) => ({
              ...z,
              status: z.status || z.conditionStatus || ConditionStatus.OPERATIONAL,
              conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
            })));
          } else {
            setZoneList([]);
          }
          setDetailSectionsLoaded({
            zones: !isDetailMode || Array.isArray(data.zones),
            attachments: !isDetailMode || Array.isArray(data.attachments),
          });
        } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      loadData();
    } else if (!id && isCreateMode && !isModalMode) {
      form.resetFields();
      setRecord(null);
      setFormError(null);
      setPendingFiles([]);
      setZoneList([]);
    }
    return () => {
      cancelled = true;
    };
  }, [id, open, isCreateMode, isModalMode, isDetailMode, initialData, initialDataOnly, form]);

  const loadDetailSection = async (section: 'zones' | 'attachments') => {
    if (!isDetailMode || !id || detailSectionsLoaded[section] || loadingDetailSection === section) return;

    setLoadingDetailSection(section);
    try {
      if (section === 'zones') {
        const zones = await vtsSystemCRUD.getZones(id);
        setZoneList(zones.map((z: any) => ({
          ...z,
          status: z.status || z.conditionStatus || ConditionStatus.OPERATIONAL,
          conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
        })));
        setRecord((current) => current ? { ...current, zones } : current);
      } else {
        const attachments = await vtsSystemCRUD.getAttachments(id);
        setRecord((current) => current ? { ...current, attachments } : current);
      }
      setDetailSectionsLoaded((current) => ({ ...current, [section]: true }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải dữ liệu chi tiết');
    } finally {
      setLoadingDetailSection(null);
    }
  };

  const handleSubmitForm = async (values: any) => {
    setIsSubmitting(true);
    try {
      const spatialData = values.spatialData;
      const payload: CreateVtsSystemRequest | UpdateVtsSystemRequest = {
        systemName: values.systemName,
        conditionStatus: values.conditionStatus,
        responsibilityLevel: values.responsibilityLevel,
        source: values.source,
        partner: values.partner,
        scope: values.scope,
        orgUnitId: values.orgUnitId,
        owningOrgId: values.owningOrgId,
        operatingOrgId: values.operatingOrgId,
        portId: values.portId,
        code: values.code,
        zones: zoneList,
        province: values.province,
        provinceId: values.provinceId || (values.province ? getProvinceIdByName(values.province) : undefined),
        address: values.address,
        maritimeNotice: values.maritimeNotice,
        operationStartDate: values.operationStartDate ? dayjs(values.operationStartDate).format('YYYY-MM-DD') : undefined,
        note: values.note,
        geometryType: spatialData?.geometryType,
        coordinates: spatialData?.coordinates,
      };

      if (isCreateMode) {
        const res = await vtsSystemCRUD.create(payload as CreateVtsSystemRequest);
        if (pendingFiles.length > 0 && res.id) {
          for (const file of pendingFiles) {
            try {
               await vtsSystemApproval.uploadAttachment(res.id, file);
            } catch (err) {
               console.error('Lỗi tải file lên:', file.name, err);
            }
          }
        }
        setPendingFiles([]);
        setZoneList([]);
        toast.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/vts-system');
        }
      } else if (id && isEditMode) {
        const res = await vtsSystemCRUD.update(id, payload as UpdateVtsSystemRequest);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/vts-system');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalAction = async (
    action: 'approveC1' | 'approveC2' | 'reject' | 'delete',
    payload?: Record<string, unknown>
  ) => {
    if (!id || !record) return;

    setIsSubmitting(true);
    try {
      if (action === 'approveC1') {
        const pheDuyetData: ApprovalRequest = {
          decision: 'APPROVED',
        };
        const updated = await vtsSystemApproval.approveC1(id, pheDuyetData);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updated;
        }
        toast.success('Phê duyệt C1 thành công');
        setRecord(updated);
        setHasChanges(true);
        if (onSuccess) onSuccess();
      } else if (action === 'approveC2') {
        const pheDuyetData: ApprovalRequest = {
          decision: 'APPROVED',
        };
        const updated = await vtsSystemApproval.approveC2(id, pheDuyetData);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updated;
        }
        toast.success('Phê duyệt C2 thành công');
        setRecord(updated);
        setHasChanges(true);
        if (onSuccess) onSuccess();
      } else if (action === 'reject') {
        const pheDuyetData: ApprovalRequest = {
          decision: 'REJECTED',
          reason: payload?.lyDo as string,
        };

        let updatedRecord: VtsSystemResponse | null = null;
        if (record.approvalStatus === ApprovalStatus.PROPOSED) {
          updatedRecord = await vtsSystemApproval.approveC1(id, pheDuyetData);
        } else if (record.approvalStatus === ApprovalStatus.UNDER_REVIEW) {
          updatedRecord = await vtsSystemApproval.approveC2(id, pheDuyetData);
        } else {
          throw new Error('Chỉ được từ chối bản ghi đang chờ C1 hoặc C2');
        }
        if (updatedRecord && window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updatedRecord;
        }

        toast.success('Từ chối thành công');
        setRecord(updatedRecord);
        setHasChanges(true);
        if (onSuccess) onSuccess();
      } else if (action === 'delete') {
        await vtsSystemCRUD.delete(id);
        toast.success('Xóa thành công');
        if (isModalMode && onSuccess) {
          onSuccess();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/vts-system');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadAttachment = async (file: File) => {
    if (isCreateMode) {
      setPendingFiles((prev) => [...prev, file]);
      return;
    }
    if (!id) throw new Error('Cần lưu hệ thống VTS trước khi tải tài liệu lên');
    const uploaded = await vtsSystemApproval.uploadAttachment(id, file);
    setRecord((prev) => prev ? { ...prev, attachments: [...(prev.attachments || []), uploaded] } : prev);
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (isCreateMode) {
      setPendingFiles((prev) => prev.filter((_, idx) => `temp-${idx}` !== attachmentId));
      return;
    }
    if (!id) return;
    await vtsSystemApproval.deleteAttachment(id, attachmentId);
    setRecord((prev) => prev ? { ...prev, attachments: (prev.attachments || []).filter((a) => a.id !== attachmentId) } : prev);
  };

  const handleCloseModal = () => {
    if (hasChanges && onSuccess) {
      onSuccess();
    } else if (onCancel) {
      onCancel();
    }
  };

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Hệ thống VTS', onClick: () => navigate('/vts-system') },
    { title: isCreateMode ? 'Tạo mới' : isEditMode ? 'Chỉnh sửa' : 'Chi tiết' },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Spin fullscreen description="Đang tải..." />
      </div>
    );
  }

  if (formError) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Empty description={formError} style={{ marginTop: '50px' }} />
          <Button onClick={() => navigate('/vts-system')} style={{ marginTop: '16px' }}>
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  // Detail/Read-only view
  if (isDetailMode) {
    const detailContent = (
      <div style={{ paddingTop: 16 }}>
        <style>{`.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; } .detail-row { display: flex; padding: 10px 12px; border-bottom: 1px solid ${borderDefault}; } .detail-label { width: 200px; flex-shrink: 0; color: ${colors.sidebarBg}; font-weight: ${fontWeightBold}; font-size: ${fontSizeMd}px; } .detail-label::after { content: ':'; margin-left: 2px; } .detail-value { color: ${textPrimary}; font-size: ${fontSizeMd}px; flex: 1; } .detail-value .ant-tag { margin-left: -6px !important; }`}</style>
        {record && (
          <Tabs
            defaultActiveKey="general"
            onChange={(key) => {
              if (key === 'zones' || key === 'files') {
                void loadDetailSection(key === 'zones' ? 'zones' : 'attachments');
              }
            }}
            tabBarStyle={{ marginBottom: 0, paddingTop: 0 }}
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div className="detail-grid">
                      {[
                        ['Đơn vị quản lý', record.orgUnitName || '—'],
                        ['Ghi chú', record.note || '—'],
                        ['Trạng thái', <ApprovalStatusBadge status={record.approvalStatus} />],
                        ['Ngày cập nhật', record.updatedDate ? dayjs(record.updatedDate).format('DD/MM/YYYY HH:mm:ss') : '—'],
                        ['Cán bộ cập nhật', record.updatedByName || '—'],
                      ].map(([label, value], i) => (
                        <div key={i} className="detail-row">
                          <span className="detail-label">{label}</span>
                          <span className="detail-value">{value}</span>
                        </div>
                      ))}
                    </div>

                    {record.rejectionReason && (
                      <div style={{ marginTop: 16, padding: '12px 16px', background: `${statusCritical}10`, border: `1px solid ${statusCritical}30`, borderRadius: radiusMd }}>
                        <div style={{ fontWeight: fontWeightBold, color: statusCritical, marginBottom: 4 }}>Lý do từ chối:</div>
                        <div>{record.rejectionReason}</div>
                      </div>
                    )}

                  </div>
                ),
              },
              {
                key: 'system_info',
                label: 'Thông tin hệ thống VTS',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div className="detail-grid">
                      {[
                        ['Đơn vị chủ quản', record.owningOrgName || '—'],
                        ['Đơn vị vận hành khai thác', record.operatingOrgName || '—'],
                        ['Thuộc cảng biển', record.portName || '—'],
                        ['Mã hệ thống VTS', record.code || '—'],
                        ['Tên hệ thống VTS', record.systemName || '—'],
                        ['Địa điểm (Tỉnh/Thành phố)', record.province || (record.provinceId ? getProvinceNameById(record.provinceId) : '—')],
                        ['Địa điểm chi tiết', record.address || '—'],
                        ['Thời gian bắt đầu hoạt động', record.operationStartDate ? dayjs(record.operationStartDate).format('DD/MM/YYYY') : '—'],
                        ['Phạm vi áp dụng', record.scope || '—'],
                        ['Thông báo hàng hải', record.maritimeNotice || '—'],
                        ['Tình trạng', renderConditionStatusBadge(record.conditionStatus)],
                      ].map(([label, value], i) => (
                        <div key={i} className="detail-row">
                          <span className="detail-label">{label}</span>
                          <span className="detail-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                key: 'zones',
                label: 'Thông tin vùng VTS',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    {loadingDetailSection === 'zones' ? (
                      <Spin />
                    ) : zoneList.length === 0 ? (
                      <Empty description="Không có dữ liệu" style={{ margin: '32px 0' }} />
                    ) : (
                      <Table
                        className="list-view-table"
                        dataSource={zoneList.map((z, i) => ({ ...z, key: i, _idx: i }))}
                        pagination={false}
                        size="middle"
                        bordered
                        scroll={{ x: 600 }}
                      >
                        <Table.Column title="STT" dataIndex="_idx" key="stt" width={60} align="center" render={(val: number) => val + 1} />
                        <Table.Column title="Mã vùng VTS" dataIndex="code" key="code" render={(val) => val || '—'} />
                        <Table.Column title="Tên vùng VTS" dataIndex="name" key="name" render={(val) => val || '—'} />
                        <Table.Column title="Tình trạng" dataIndex="conditionStatus" key="conditionStatus"
                          render={(val: ConditionStatus) => renderConditionStatusBadge(val)} />
                      </Table>
                    )}
                  </div>
                ),
              },
              {
                key: 'files',
                label: 'File đính kèm',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    {loadingDetailSection === 'attachments' ? (
                      <Spin />
                    ) : (
                      <AttachmentList attachments={record?.attachments || []} readonly={true} />
                    )}
                  </div>
                ),
              },
              {
                key: 'other_kcht',
                label: 'KCHT thuộc VTS',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Empty description="Không có dữ liệu" style={{ margin: '32px 0' }} />
                  </div>
                ),
              },
              {
                key: 'operation',
                label: 'Thông tin vận hành khai thác',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Empty description="Không có dữ liệu" style={{ margin: '32px 0' }} />
                  </div>
                ),
              },
              {
                key: 'maintenance',
                label: 'Thông tin bảo trì',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Empty description="Không có dữ liệu" style={{ margin: '32px 0' }} />
                  </div>
                ),
              },
              {
                key: 'incidents',
                label: 'Thông tin sự cố',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Empty description="Không có dữ liệu" style={{ margin: '32px 0' }} />
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    );

    if (isModalMode) {
      return (
        <Drawer
          {...drawerProps}
          title={
            <span style={drawerTitleStyle}>
              {record?.systemName ? `Xem chi tiết hệ thống VTS - ${record.systemName}` : 'Xem chi tiết hệ thống VTS'}
            </span>
          }
          open={open}
          onClose={handleCloseModal}
          extra={<Button type="text" onClick={handleCloseModal} style={drawerCloseBtnStyle}>✕</Button>}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          <Spin spinning={isLoading}>
            <Form form={form} component={false}>
              {detailContent}
            </Form>
          </Spin>
        </Drawer>
      );
    }

    return (
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />
        <Form form={form} component={false}>
          {detailContent}
        </Form>
      </div>
    );
  }

  if (isModalMode) {
    return (
      <Drawer
        {...drawerProps}
        title={
          <span style={drawerTitleStyle}>
            {isCreateMode
              ? 'Thêm mới hệ thống VTS'
              : (record?.systemName ? `Chỉnh sửa — ${record.systemName}` : 'Chỉnh sửa hệ thống VTS')}
          </span>
        }
        open={open}
        onClose={handleCloseModal}
        extra={<Button type="text" onClick={handleCloseModal} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={onCancel} style={outlineButtonStyle}>Hủy</Button>
            <Button type="primary" onClick={() => form.submit()} loading={isSubmitting} style={primaryButtonStyle}>
              {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
            </Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        afterOpenChange={(visible) => {
          if (visible) {
            setTabKey('general');
            if (isCreateMode) {
              form.resetFields();
              setZoneList([]);
            }
          }
        }}
      >
        <Spin spinning={isLoading}>
          <style>{requiredMarkStyle}</style>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitForm}
            autoComplete="off"
            initialValues={formInitialValues.current}
          >
            <Tabs activeKey={tabKey} onChange={setTabKey} tabBarStyle={{ marginBottom: 0, paddingTop: 0 }} items={[
              {
                key: 'general', label: 'Thông tin chung',
                children: <div style={{ paddingTop: spaceMd }}>
                  <Form.Item
                    label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị quản lý</span>}
                    name="orgUnitId"
                    rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                    style={{ marginBottom: spaceFormField }}
                  >
                    <Select
                      placeholder="Chọn đơn vị quản lý"
                      disabled={isEditMode}
                      showSearch
                      filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                      options={organizations.map((org) => ({
                        value: org.id,
                        label: org.code ? `${org.code} - ${org.name}` : org.name,
                      }))}
                      style={{ borderRadius: radiusPill, height: 40 }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                    name="note"
                    style={{ marginBottom: spaceFormField }}
                  >
                    <Input.TextArea rows={3} placeholder="Nhập ghi chú" showCount maxLength={2000} style={{ borderRadius: radiusMd }} />
                  </Form.Item>
                </div>,
              },
              {
                key: 'vts', label: 'Thông tin hệ thống VTS',
                children: <div style={{ paddingTop: spaceMd }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị chủ quản</span>}
                        name="owningOrgId"
                        rules={[{ required: true, message: 'Vui lòng chọn đơn vị chủ quản' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn đơn vị chủ quản"
                          showSearch
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                          options={organizations.map((org) => ({
                            value: org.id,
                            label: org.code ? `${org.code} - ${org.name}` : org.name,
                          }))}
                          style={{ borderRadius: radiusPill, height: 40 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị vận hành</span>}
                        name="operatingOrgId"
                        rules={[{ required: true, message: 'Vui lòng chọn đơn vị vận hành' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn đơn vị vận hành"
                          showSearch
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                          options={organizations.map((org) => ({
                            value: org.id,
                            label: org.code ? `${org.code} - ${org.name}` : org.name,
                          }))}
                          style={{ borderRadius: radiusPill, height: 40 }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thuộc cảng biển</span>}
                        name="portId"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn cảng biển"
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          options={portOptions}
                          style={{ borderRadius: radiusPill, height: 40 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã hệ thống VTS</span>}
                        name="code"
                        rules={[{ required: true, message: 'Vui lòng nhập mã hệ thống VTS' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Nhập mã hệ thống VTS" disabled={isEditMode} maxLength={50} showCount style={{ borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên hệ thống VTS</span>}
                        name="systemName"
                        rules={[{ required: true, message: 'Vui lòng nhập tên hệ thống VTS' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Nhập tên hệ thống VTS" maxLength={255} showCount style={{ borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm (Tỉnh/TP)</span>}
                        name="province"
                        rules={[{ required: true, message: 'Vui lòng chọn địa điểm' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          showSearch
                          placeholder="Chọn địa điểm"
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                          options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                          style={{ borderRadius: radiusPill, height: 40 }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                        name="address"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={{ borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thời gian bắt đầu hoạt động</span>}
                        name="operationStartDate"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <DatePicker
                          format="DD/MM/YYYY"
                          placeholder="Chọn thời gian bắt đầu hoạt động"
                          style={{ borderRadius: radiusPill, height: 40, width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Phạm vi áp dụng</span>}
                    name="scope"
                    style={{ marginBottom: spaceFormField }}
                  >
                    <Input.TextArea rows={3} placeholder="Nhập phạm vi áp dụng" showCount maxLength={2000} style={{ borderRadius: radiusMd }} />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thông báo hàng hải</span>}
                    name="maritimeNotice"
                    style={{ marginBottom: spaceFormField }}
                  >
                    <Input.TextArea rows={3} placeholder="Nhập thông báo hàng hải" showCount maxLength={2000} style={{ borderRadius: radiusMd }} />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tình trạng</span>}
                        name="conditionStatus"
                        rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn tình trạng"
                          options={CONDITION_STATUS_OPTIONS}
                          style={{ borderRadius: radiusPill, height: 40 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mức độ phụ trách</span>}
                        name="responsibilityLevel"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Nhập mức độ phụ trách" maxLength={255} style={{ borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Nguồn gốc</span>}
                        name="source"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Nhập nguồn gốc" maxLength={255} style={{ borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đối tác</span>}
                        name="partner"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Nhập đối tác" maxLength={255} style={{ borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>,
              },
              {
                key: 'zones', label: 'Danh sách vùng VTS',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Danh sách vùng VTS</span>
                      {zoneList.length > 0 && (
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setZoneList((prev) => [...prev, { code: '', name: '', status: ConditionStatus.OPERATIONAL }])} style={{ borderRadius: radiusPill }}>Thêm vùng VTS</Button>
                      )}
                    </div>
                    {zoneList.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                        <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có vùng VTS nào.</span>
                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => setZoneList((prev) => [...prev, { code: '', name: '', status: ConditionStatus.OPERATIONAL }])} style={{ borderRadius: radiusPill }}>Thêm vùng VTS</Button>
                      </div>
                    ) : (
                      <Table className="list-view-table" dataSource={zoneList.map((z, i) => ({ ...z, key: i, _idx: i }))}
                        pagination={false} size="middle" bordered scroll={{ x: 600 }}>
                        <Table.Column title="STT" dataIndex="_idx" key="stt" width={60} align="center"
                          render={(val: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{val + 1}</span>}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Mã vùng VTS" key="code"
                          render={(_: any, record: any) => <Input value={record.code} onChange={(e) => { const next = [...zoneList]; next[record._idx].code = e.target.value; setZoneList(next); }} placeholder="Mã vùng" maxLength={50} showCount style={{ borderRadius: radiusPill, height: 40 }} />}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Tên vùng VTS" key="name"
                          render={(_: any, record: any) => <Input value={record.name} onChange={(e) => { const next = [...zoneList]; next[record._idx].name = e.target.value; setZoneList(next); }} placeholder="Tên vùng" maxLength={255} showCount style={{ borderRadius: radiusPill, height: 40 }} />}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Tình trạng" key="status" width={200}
                          render={(_: any, record: any) => <Select value={record.status || record.conditionStatus || ConditionStatus.OPERATIONAL} onChange={(v) => { const next = [...zoneList]; next[record._idx].status = v; next[record._idx].conditionStatus = v; setZoneList(next); }} options={CONDITION_STATUS_OPTIONS} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="" key="actions" width={44} align="center"
                          render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => setZoneList((prev) => prev.filter((_, idx) => idx !== record._idx))} />}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
                      </Table>
                    )}
                  </div>
                ),
              },

              {
                key: 'files', label: 'File đính kèm',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
                      {(isCreateMode ? pendingFiles.length > 0 : record?.attachments && record.attachments.length > 0) && (
                        <Upload
                          beforeUpload={(file) => {
                            if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
                            const ext = file.name.split('.').pop()?.toLowerCase();
                            if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
                            handleUploadAttachment(file);
                            return false;
                          }}
                          showUploadList={false}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                          multiple
                        >
                          <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button>
                        </Upload>
                      )}
                    </div>
                    {((isCreateMode ? pendingFiles.length : (record?.attachments?.length || 0)) === 0) ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                        <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
                        <Upload
                          beforeUpload={(file) => {
                            if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
                            const ext = file.name.split('.').pop()?.toLowerCase();
                            if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
                            handleUploadAttachment(file);
                            return false;
                          }}
                          showUploadList={false}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                          multiple
                        >
                          <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
                        </Upload>
                      </div>
                    ) : (
                      <Table className="list-view-table" dataSource={isCreateMode ? pendingFiles.map((f, i) => ({ id: `temp-${i}`, fileName: f.name, _idx: i, key: i })) : record?.attachments?.map((f, i) => ({ ...f, _idx: i, key: i }))}
                        pagination={false} size="middle" bordered scroll={{ x: 400 }}>
                        <Table.Column title="STT" key="stt" width={60} align="center"
                          render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Tên file" key="fileName" dataIndex="fileName"
                          render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="" key="actions" width={44} align="center"
                          render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteAttachment(record.id)} />}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
                      </Table>
                    )}
                    <div style={{ marginTop: spaceSm }}>
                      <span style={uploadHintStyle}>
                        Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.
                      </span>
                    </div>
                  </div>
                ),
              },
            ]} />
          </Form>
        </Spin>
      </Drawer>
    );
  }
  // Create/Edit form view
  return (
    <div style={isIframe ? { padding: '16px 24px', background: '#fff', minHeight: '100vh' } : { padding: '24px' }}>
      {!isIframe && <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />}
      <Card
        style={isIframe ? { border: 'none', boxShadow: 'none', padding: 0 } : { maxWidth: '800px' }}
        styles={isIframe ? { body: { padding: 0 } } : undefined}
      >
        {!isIframe && <h2>{isCreateMode ? 'Tạo mới hệ thống VTS' : 'Chỉnh sửa hệ thống VTS'}</h2>}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
          initialValues={formInitialValues.current}
        >
          <Form.Item
            label="Tên hệ thống"
            name="systemName"
            rules={[{ required: true, message: 'Vui lòng nhập tên hệ thống' }]}
          >
            <Input placeholder="Nhập tên hệ thống" />
          </Form.Item>

          <Form.Item
            label="Vị trí"
            name="location"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
          >
            <Input placeholder="Nhập vị trí" />
          </Form.Item>

          <Form.Item
            label="Tình trạng"
            name="conditionStatus"
          >
            <Select
              placeholder="Chọn tình trạng"
              options={CONDITION_STATUS_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            label="Mức độ phủ trách"
            name="responsibilityLevel"
          >
            <Input placeholder="Nhập mức độ phủ trách" />
          </Form.Item>

          <Form.Item
            label="Nguồn gốc"
            name="source"
          >
            <Input placeholder="Nhập nguồn gốc" />
          </Form.Item>

          <Form.Item
            label="Đối tác"
            name="partner"
          >
            <Input placeholder="Nhập đối tác" />
          </Form.Item>

          <Form.Item label="Phạm vi áp dụng" name="scope">
            <Input.TextArea rows={3} placeholder="Nhập phạm vi áp dụng" />
          </Form.Item>

          <Form.Item
            label="Đơn vị quản lý"
            name="orgUnitId"
            rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
          >
            <Select
              placeholder="Chọn đơn vị quản lý"
              allowClear
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={organizations.map((org) => ({
                value: org.id,
                label: org.code ? `${org.code} - ${org.name}` : org.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Đơn vị chủ quản"
            name="owningOrgId"
            rules={[{ required: true, message: 'Vui lòng chọn đơn vị chủ quản' }]}
          >
            <Select
              placeholder="Chọn đơn vị chủ quản"
              allowClear
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={organizations.map((org) => ({
                value: org.id,
                label: org.code ? `${org.code} - ${org.name}` : org.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Đơn vị vận hành"
            name="operatingOrgId"
            rules={[{ required: true, message: 'Vui lòng chọn đơn vị vận hành' }]}
          >
            <Select
              placeholder="Chọn đơn vị vận hành"
              allowClear
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={organizations.map((org) => ({
                value: org.id,
                label: org.code ? `${org.code} - ${org.name}` : org.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Thuộc cảng biển"
            name="portId"
          >
            <Select placeholder="Chọn cảng biển" allowClear showSearch optionFilterProp="label" options={portOptions} />
          </Form.Item>

          <Form.Item
            label="Mã hệ thống VTS"
            name="code"
            rules={[{ required: true, message: 'Vui lòng nhập mã hệ thống VTS' }]}
          >
            <Input placeholder="Nhập mã hệ thống VTS" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            label="Địa điểm (Tỉnh/TP)"
            name="province"
            rules={[{ required: true, message: 'Vui lòng chọn địa điểm' }]}
          >
            <Select
              showSearch
              placeholder="Chọn địa điểm"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
            />
          </Form.Item>

          <Form.Item
            label="Địa điểm chi tiết"
            name="address"
          >
            <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            label="Thời gian bắt đầu hoạt động"
            name="operationStartDate"
          >
            <DatePicker format="DD/MM/YYYY" placeholder="Chọn thời gian bắt đầu hoạt động" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Thông báo hàng hải"
            name="maritimeNotice"
          >
            <Input.TextArea rows={3} placeholder="Nhập thông báo hàng hải" maxLength={2000} showCount />
          </Form.Item>

          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Danh sách vùng VTS</span>
            {zoneList.length > 0 && (
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setZoneList((prev) => [...prev, { code: '', name: '', status: ConditionStatus.OPERATIONAL }])} style={{ borderRadius: radiusPill }}>Thêm vùng VTS</Button>
            )}
          </div>
          {zoneList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có vùng VTS nào.</span>
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => setZoneList((prev) => [...prev, { code: '', name: '', status: ConditionStatus.OPERATIONAL }])} style={{ borderRadius: radiusPill }}>Thêm vùng VTS</Button>
            </div>
          ) : (
            <Table className="list-view-table" dataSource={zoneList.map((z, i) => ({ ...z, key: i, _idx: i }))}
              pagination={false} size="middle" bordered scroll={{ x: 600 }}>
              <Table.Column title="STT" dataIndex="_idx" key="stt" width={60} align="center"
                render={(val: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{val + 1}</span>}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Mã vùng VTS" key="code"
                render={(_: any, record: any) => <Input value={record.code} onChange={(e) => { const next = [...zoneList]; next[record._idx].code = e.target.value; setZoneList(next); }} placeholder="Mã vùng" maxLength={50} showCount style={{ borderRadius: radiusPill, height: 40 }} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Tên vùng VTS" key="name"
                render={(_: any, record: any) => <Input value={record.name} onChange={(e) => { const next = [...zoneList]; next[record._idx].name = e.target.value; setZoneList(next); }} placeholder="Tên vùng" maxLength={255} showCount style={{ borderRadius: radiusPill, height: 40 }} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Tình trạng" key="status" width={200}
                render={(_: any, record: any) => <Select value={record.status || record.conditionStatus || ConditionStatus.OPERATIONAL} onChange={(v) => { const next = [...zoneList]; next[record._idx].status = v; next[record._idx].conditionStatus = v; setZoneList(next); }} options={CONDITION_STATUS_OPTIONS} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="" key="actions" width={44} align="center"
                render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => setZoneList((prev) => prev.filter((_, idx) => idx !== record._idx))} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
            </Table>
          )}

          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
            {(isCreateMode ? pendingFiles.length > 0 : record?.attachments && record.attachments.length > 0) && (
              <Upload beforeUpload={(file) => { handleUploadAttachment(file); return false; }} showUploadList={false} multiple>
                <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button>
              </Upload>
            )}
          </div>
          {((isCreateMode ? pendingFiles.length : (record?.attachments?.length || 0)) === 0) ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
              <Upload beforeUpload={(file) => { handleUploadAttachment(file); return false; }} showUploadList={false} multiple>
                <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
              </Upload>
            </div>
          ) : (
            <Table className="list-view-table" dataSource={isCreateMode ? pendingFiles.map((f, i) => ({ id: `temp-${i}`, fileName: f.name, _idx: i, key: i })) : record?.attachments?.map((f, i) => ({ ...f, _idx: i, key: i }))}
              pagination={false} size="middle" bordered scroll={{ x: 400 }} style={{ marginBottom: 24 }}>
              <Table.Column title="STT" key="stt" width={60} align="center"
                render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Tên file" key="fileName" dataIndex="fileName"
                render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="" key="actions" width={44} align="center"
                render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteAttachment(record.id)} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
            </Table>
          )}

          <Form.Item label="Vị trí/Hình vẽ bản đồ" name="spatialData">
            <GisLocationSelector defaultGeometryType="POINT" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
              </Button>
              <Button onClick={isIframe ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*') : () => navigate('/vts-system')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

