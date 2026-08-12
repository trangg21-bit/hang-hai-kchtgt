import { useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Modal, Form, Input, Select, Spin, Button, Space, Dropdown, Row, Col, Drawer } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, SendOutlined, CheckOutlined, CloseOutlined, MoreOutlined, CaretRightOutlined, EyeOutlined } from '@ant-design/icons';
import { organizationService } from '../../services/organizationService';

import type { Organization, CreateOrganizationPayload, UpdateOrganizationPayload } from '../../services/organizationService';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { statusOperational, statusAttention, statusCritical, statusDraft, actionPrimary, textSecondary, textTertiary, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold, cardStyle, dataSea1, radiusPill, borderDefault, spaceFormField, spaceMd, drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle } from '../../tokens';
import { colors } from '../../theme';

const { confirm } = Modal;

const STATUS_COLORS: Record<string, string> = { pending: statusAttention, approved: statusOperational, inactive: statusCritical };
const STATUS_LABELS: Record<string, string> = { pending: 'Chờ phê duyệt', approved: 'Sử dụng', inactive: 'Không sử dụng' };
const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function fmtUser(s?: string) { if (!s) return '—'; return UUID_RE.test(s) ? 'Hệ thống' : s; }

// --- Column widths (px) ---
const COL_UPDATED_BY = 175;
const COL_UPDATED_AT = 175;
const COL_STATUS = 145;
const COL_ACTION = 56;
const COL_GAP = 10;

function fmtDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UnitList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);
  const canViewUpdateMetadata = currentUser?.email?.trim().toLowerCase() === 'cuc@vimawa.gov.vn' || currentUser?.username?.trim().toLowerCase() === 'cuc@vimawa.gov.vn';
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const toggleExpand = useCallback((id: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const fetchOrgs = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const tree = await organizationService.getTree();
      setAllOrgs(tree);
      // Auto-expand L1 + L2 (root Cục + all Cảng vụ)
      const toExpand = new Set<string>();
      for (const o of tree) {
        if (o.level !== undefined && o.level <= 2 && tree.some(c => c.parentId === o.id)) {
          toExpand.add(o.id);
        }
      }
      setExpandedKeys(toExpand);
    } catch (err: unknown) { setIsError(true); setError(err instanceof Error ? err : new Error('Không thể tải danh sách đơn vị')); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const openCreateModal = useCallback(() => {
    setIsViewing(false);
    setEditingOrg(null);
    form.resetFields();
    form.setFieldsValue({ operationalStatus: 'active' });
    setModalOpen(true);
  }, [form]);
  const openEditModal = useCallback((org: Organization) => {
    setIsViewing(false);
    setEditingOrg(org);
    const opStatus = (org.operationalStatus || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';
    form.setFieldsValue({
      code: org.code, name: org.name,
      parentId: org.parentId,
      address: org.address, detailAddress: (org as any).detailAddress ?? '',
      phone: org.phone, description: org.description,
      status: org.status,
      operationalStatus: opStatus,
    });
    setModalOpen(true);
  }, [form]);

  const openViewModal = useCallback((org: Organization) => {
    setIsViewing(true);
    setEditingOrg(org);
    const opStatus = (org.operationalStatus || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';
    form.setFieldsValue({
      code: org.code, name: org.name,
      parentId: org.parentId,
      address: org.address, detailAddress: (org as any).detailAddress ?? '',
      phone: org.phone, description: org.description,
      status: org.status,
      operationalStatus: opStatus,
    });
    setModalOpen(true);
  }, [form]);
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields(); setSubmitting(true);
      const parentId = values.parentId || undefined;
      if (editingOrg) {
        await organizationService.update(editingOrg.id, {
          name: values.name, code: values.code,
          parentId,
          address: values.address, detailAddress: values.detailAddress,
          phone: values.phone, description: values.description,
          operationalStatus: values.operationalStatus,
        });
        toast.success('Đã cập nhật');
      } else {
        await organizationService.create({
          name: values.name, code: values.code,
          parentId,
          address: values.address, detailAddress: values.detailAddress,
          phone: values.phone, description: values.description,
          operationalStatus: values.operationalStatus,
        });
        toast.success('Đã tạo mới');
      }
      setModalOpen(false); fetchOrgs();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      toast.error(msg);
    } finally { setSubmitting(false); }
  }, [editingOrg, form, fetchOrgs]);

  const parentOptions = useMemo(() => {
    const parentLevel = editingOrg?.level && editingOrg.level > 1 ? editingOrg.level - 1 : undefined;

    const isDescendantOfEditingUnit = (candidateId: string) => {
      if (!editingOrg) return false;
      let current = allOrgs.find((org) => org.id === candidateId);
      const visited = new Set<string>();
      while (current?.parentId && !visited.has(current.parentId)) {
        if (current.parentId === editingOrg.id) return true;
        visited.add(current.parentId);
        current = allOrgs.find((org) => org.id === current?.parentId);
      }
      return false;
    };

    return allOrgs
      .filter((org) => !editingOrg || (org.id !== editingOrg.id && !isDescendantOfEditingUnit(org.id)))
      .filter((org) => org.operationalStatus !== 'inactive')
      .filter((org) => parentLevel === undefined ? (org.level ?? 0) < 3 : org.level === parentLevel)
      .map((org) => ({ value: org.id, label: `${org.name}${org.level ? ` (Cấp ${org.level})` : ''}` }));
  }, [allOrgs, editingOrg]);

  const handleDelete = useCallback((org: Organization) => {
    confirm({ title: 'Xác nhận xóa', icon: <ExclamationCircleOutlined />, content: `Xóa "${org.name}"?`, okText: 'Xóa', okType: 'danger', cancelText: 'Hủy', onOk: async () => { try { await organizationService.delete(org.id); toast.success('Đã xóa'); fetchOrgs(); } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Xóa thất bại'); } } });
  }, [fetchOrgs]);
  const handleSubmitApproval = useCallback((org: Organization) => {
    confirm({ title: 'Trình duyệt', icon: <ExclamationCircleOutlined />, content: `Gửi duyệt "${org.name}"?`, okText: 'Trình duyệt', cancelText: 'Hủy', onOk: async () => { try { await organizationService.submit(org.id); toast.success('Đã trình'); fetchOrgs(); } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Lỗi'); } } });
  }, [fetchOrgs]);
  const handleApprove = useCallback((org: Organization) => {
    confirm({ title: 'Phê duyệt', icon: <ExclamationCircleOutlined />, content: `Duyệt "${org.name}"?`, okText: 'Phê duyệt', cancelText: 'Hủy', onOk: async () => { try { await organizationService.approve(org.id); toast.success('Đã duyệt'); fetchOrgs(); } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Lỗi'); } } });
  }, [fetchOrgs]);
  const handleReject = useCallback((org: Organization) => {
    const commentsRef = { current: '' };
    confirm({
      title: 'Từ chối',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Từ chối "{org.name}"?</p>
          <Input placeholder="Lý do" onChange={(e) => { commentsRef.current = e.target.value; }} style={{ marginTop: 10, borderRadius: radiusPill, height: 40 }} />
        </div>
      ),
      okText: 'Từ chối',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try { await organizationService.reject(org.id, commentsRef.current); toast.success('Đã từ chối'); fetchOrgs(); }
        catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Lỗi'); }
      },
    });
  }, [fetchOrgs]);

  const getActions = (record: Organization) => {
    const items: any[] = [];
    items.push({ key: 'view', label: 'Xem', icon: <EyeOutlined />, onClick: () => openViewModal(record) });
    if (hasPerm('orgunit:manage')) items.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
    if (hasPerm('orgunit:manage') && (record.status === 'draft' || record.status === 'rejected')) items.push({ key: 'submit', label: 'Trình duyệt', icon: <SendOutlined />, onClick: () => handleSubmitApproval(record) });
    if (hasPerm('orgunit:approve') && record.status === 'pending') { items.push({ key: 'approve', label: 'Phê duyệt', icon: <CheckOutlined />, onClick: () => handleApprove(record) }); items.push({ key: 'reject', label: 'Từ chối', icon: <CloseOutlined />, onClick: () => handleReject(record), danger: true }); }
    if (hasPerm('orgunit:manage')) items.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
    return items;
  };

  // --- Build flat ordered rows with depth from org hierarchy ---
  const visibleRows = useMemo(() => {
    type Row = { org: Organization; depth: number; hasChildren: boolean };
    const rows: Row[] = [];

    const walk = (parentId: string | undefined, depth: number) => {
      const siblings = allOrgs
        .filter(o => parentId ? o.parentId === parentId : !o.parentId)
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      for (const org of siblings) {
        const children = allOrgs.filter(o => o.parentId === org.id);
        const hasChildren = children.length > 0;
        rows.push({ org, depth, hasChildren });
        if (expandedKeys.has(org.id) && hasChildren) {
          walk(org.id, depth + 1);
        }
      }
    };
    walk(undefined, 0);
    // Apply status filter after building tree
    if (filterStatus) {
      return rows.filter(r => {
        const stKey = r.org.operationalStatus === 'inactive' ? 'inactive' : (r.org.status === 'pending' ? 'pending' : 'approved');
        return stKey === filterStatus;
      });
    }
    return rows;
  }, [allOrgs, expandedKeys, filterStatus]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterStatus(values.status || '');
  }, []);
  const handleFilterReset = useCallback(() => { setSearch(''); setFilterStatus(''); }, []);

  // --- Search mode: flat list ---
  const searchResults = useMemo(() => {
    const q = search.toLowerCase();
    const hasFilter = q || filterStatus;
    if (!hasFilter) return null;
    return allOrgs
      .filter(o => {
        if (q && !(o.name.toLowerCase().includes(q) || (o.code || '').toLowerCase().includes(q))) return false;
        if (filterStatus) {
          const stKey = o.operationalStatus === 'inactive' ? 'inactive' : (o.status === 'pending' ? 'pending' : 'approved');
          if (stKey !== filterStatus) return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .map(org => {
        const parts: string[] = [org.name];
        let cur = org;
        while (cur.parentId) { const p = allOrgs.find(o => o.id === cur.parentId); if (p) { parts.unshift(p.name); cur = p; } else break; }
        return { ...org, _path: parts.join(' › ') };
      });
  }, [allOrgs, search, filterStatus]);

  const filterContent = (
    <>
      <div style={{ marginBottom: 12, marginTop: 16 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 4 }}>Tìm kiếm</div>
        <Input placeholder="Tìm theo tên, mã..." allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => {}}
          style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 4 }}>Trạng thái</div>
        <Select placeholder="Chọn trạng thái" allowClear
          value={filterStatus}
          onChange={(val) => setFilterStatus(val)}
          options={[
            { value: 'approved', label: 'Sử dụng' },
            { value: 'inactive', label: 'Không sử dụng' },
            { value: 'pending', label: 'Chờ phê duyệt' },
          ]}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>
    </>
  );

  const statusTabs = [
    { key: 'all', label: 'Tất cả', count: allOrgs.length, color: textSecondary, active: !filterStatus },
    { key: 'approved', label: 'Sử dụng', count: allOrgs.filter(o => (o.operationalStatus === 'inactive' ? 'inactive' : (o.status === 'pending' ? 'pending' : 'approved')) === 'approved').length, color: statusOperational, active: filterStatus === 'approved' },
    { key: 'inactive', label: 'Không sử dụng', count: allOrgs.filter(o => (o.operationalStatus === 'inactive' ? 'inactive' : (o.status === 'pending' ? 'pending' : 'approved')) === 'inactive').length, color: statusCritical, active: filterStatus === 'inactive' },
    { key: 'pending', label: 'Chờ phê duyệt', count: allOrgs.filter(o => (o.operationalStatus === 'inactive' ? 'inactive' : (o.status === 'pending' ? 'pending' : 'approved')) === 'pending').length, color: statusAttention, active: filterStatus === 'pending' },
  ];
  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('orgunit:manage')) actions.push({ key: 'create', label: 'Thêm đơn vị', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    return actions;
  }, [hasPerm, openCreateModal]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý đơn vị' }]} actions={headerActions} />
      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={() => {}}
        onFilterReset={() => { setSearch(''); setFilterStatus(''); }}
        loading={isLoading}
        error={isError}
        onRetry={fetchOrgs}
        filterContent={filterContent}
        statusTabs={statusTabs}
        onStatusTabChange={(key) => {
          setFilterStatus(key === 'all' ? '' : key);
        }}
      >
        <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {/* Table header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: COL_GAP, padding: '8px 0', borderBottom: `1px solid ${borderDefault}`, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 300, fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg, textTransform: 'uppercase', paddingLeft: 24, whiteSpace: 'nowrap' }}>Tên đơn vị</div>
          <div style={{ display: canViewUpdateMetadata ? undefined : 'none', width: COL_UPDATED_BY, minWidth: COL_UPDATED_BY, fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Cán bộ cập nhật</div>
          <div style={{ display: canViewUpdateMetadata ? undefined : 'none', width: COL_UPDATED_AT, minWidth: COL_UPDATED_AT, fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Ngày cập nhật</div>
          <div style={{ width: COL_STATUS, minWidth: COL_STATUS, fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Trạng thái</div>
          <div style={{ width: COL_ACTION, minWidth: COL_ACTION }} />
        </div>

        {isLoading && <LoadingSkeleton rows={8} />}
        {isError && <ErrorState message={error?.message || 'Không thể tải danh sách đơn vị'} onRetry={fetchOrgs} />}
        {!isLoading && !isError && allOrgs.length === 0 && (
          <EmptyState description="Chưa có đơn vị nào" />
        )}
        {!isLoading && !isError && allOrgs.length > 0 && (
          <>
            {search ? (
              searchResults.length === 0 ? (
                <EmptyState description="Không tìm thấy đơn vị nào phù hợp" />
              ) : (
                <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                  {searchResults.map((org) => {
                    const s = STATUS_COLORS[org.status] || textTertiary;
                    const sl = STATUS_LABELS[org.status] || org.status;
                    return (
                      <div key={org.id} style={{ display: 'flex', alignItems: 'center', gap: COL_GAP, padding: '10px 0', borderBottom: `1px solid ${borderDefault}` }}>
                        <div style={{ flex: 1, minWidth: 300, flexShrink: 0 }}>
                          <Typography.Text strong style={{ fontSize: fontSizeMd }}>{org.name}</Typography.Text>
                          <Typography.Text style={{ display: 'block', fontSize: 11, color: textTertiary }}>{(org as any)._path}</Typography.Text>
                        </div>
                        <div style={{ display: canViewUpdateMetadata ? undefined : 'none', width: COL_UPDATED_BY, minWidth: COL_UPDATED_BY, fontSize: fontSizeMd, color: textSecondary }}>
                          {fmtUser(org.updatedBy)}
                        </div>
                        <div style={{ display: canViewUpdateMetadata ? undefined : 'none', width: COL_UPDATED_AT, minWidth: COL_UPDATED_AT, fontSize: fontSizeMd, color: textTertiary }}>
                          {fmtDate(org.updatedAt)}
                        </div>
                        <div style={{ width: COL_STATUS, minWidth: COL_STATUS }}>
                          <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s}15`, color: s }}>{sl}</span>
                        </div>
                        <div style={{ width: COL_ACTION, minWidth: COL_ACTION, textAlign: 'center' }}>
                          <Dropdown menu={{ items: getActions(org) }} trigger={['click']}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', border: `1px solid ${borderDefault}`, color: textSecondary, cursor: 'pointer' }}><MoreOutlined /></span>
                          </Dropdown>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                {visibleRows.map(({ org, depth, hasChildren }) => {
                  const isRoot = depth === 0;
                  const stKey = org.operationalStatus === 'inactive' ? 'inactive' : (org.status === 'pending' ? 'pending' : 'approved');
                  const s = STATUS_COLORS[stKey] || statusOperational;
                  const sl = STATUS_LABELS[stKey] || 'Sử dụng';
                  const indentW = depth * 24;
                  return (
                    <div key={org.id} style={{ display: 'flex', alignItems: 'center', gap: COL_GAP, padding: '10px 0', borderBottom: `1px solid ${borderDefault}` }}>
                      {/* Column 1: Name — indent ONLY here */}
                      <div style={{ flex: 1, minWidth: 300, flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: indentW }}>
                        <span
                          onClick={() => hasChildren && toggleExpand(org.id)}
                          style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: hasChildren ? 'pointer' : 'default', color: textTertiary, flexShrink: 0, transition: 'transform 0.15s', transform: expandedKeys.has(org.id) ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        >
                          <CaretRightOutlined style={{ fontSize: 10 }} />
                        </span>
                        <Typography.Text strong style={{ fontSize: fontSizeMd, fontWeight: isRoot ? 700 : 600, color: isRoot ? colors.sidebarBg : 'inherit', marginLeft: 4 }}>
                          {org.name}
                        </Typography.Text>
                      </div>
                      {/* Column 2: Cán bộ cập nhật */}
                      <div style={{ display: canViewUpdateMetadata ? undefined : 'none', width: COL_UPDATED_BY, minWidth: COL_UPDATED_BY, flexShrink: 0, fontSize: fontSizeMd, color: textSecondary }}>
                        {fmtUser(org.updatedBy)}
                      </div>
                      {/* Column 3: Ngày cập nhật */}
                      <div style={{ display: canViewUpdateMetadata ? undefined : 'none', width: COL_UPDATED_AT, minWidth: COL_UPDATED_AT, flexShrink: 0, fontSize: fontSizeMd, color: textTertiary }}>
                        {fmtDate(org.updatedAt)}
                      </div>
                      {/* Column 4: Status — fixed position */}
                      <div style={{ width: COL_STATUS, minWidth: COL_STATUS, flexShrink: 0 }}>
                        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s}15`, color: s, whiteSpace: 'nowrap' }}>
                          {sl}
                        </span>
                      </div>
                      {/* Column 5: Actions — fixed position */}
                      <div style={{ width: COL_ACTION, minWidth: COL_ACTION, flexShrink: 0, textAlign: 'center' }}>
                        <Dropdown menu={{ items: getActions(org) }} trigger={['click']}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', border: `1px solid ${borderDefault}`, color: textSecondary, cursor: 'pointer', fontSize: fontSizeMd }}>
                            <MoreOutlined />
                          </span>
                        </Dropdown>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      </FilterTableLayout>

      <Drawer
        {...drawerProps}
        title={<span style={drawerTitleStyle}>{isViewing ? 'Chi tiết đơn vị' : (editingOrg ? 'Sửa thông tin đơn vị' : 'Thêm mới đơn vị')}</span>}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        extra={<Button type="text" onClick={() => setModalOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            {isViewing ? (
              <Button type="primary" onClick={() => setModalOpen(false)} style={primaryButtonStyle}>Đóng</Button>
            ) : (
              <>
                <Button onClick={() => setModalOpen(false)} style={outlineButtonStyle}>Hủy</Button>
                <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>{editingOrg ? 'Cập nhật' : 'Tạo mới'}</Button>
              </>
            )}
          </div>
        }
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }} labelCol={{ style: { padding: 0, marginBottom: 4 } }} disabled={isViewing}>
            <Form.Item name="code" {...labelProps('Mã đơn vị')} style={{ marginBottom: spaceFormField }}>
              <Input disabled placeholder={editingOrg ? undefined : 'Tự động sinh khi tạo mới'} style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="name" {...labelProps('Tên đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}>
              <Input placeholder="Nhập tên đơn vị" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="parentId" {...labelProps('Đơn vị cha')} style={{ marginBottom: spaceFormField }}>
              <Select
                placeholder="Chọn đơn vị cha (Để trống = Đơn vị cấp cao nhất)"
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ borderRadius: radiusPill, height: 40 }}
                options={parentOptions}
              />
            </Form.Item>
            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item name="address" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập địa điểm (Tỉnh/Thành phố)' }]}>
                  <Input placeholder="vd: Hải Phòng" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="detailAddress" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Số nhà, đường, phường/xã..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="phone" {...labelProps('Số điện thoại')} style={{ marginBottom: spaceFormField }} rules={[{ pattern: /^0\d{9,10}$/, message: 'SĐT không hợp lệ' }]}>
              <Input placeholder="0901234567" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="operationalStatus" {...labelProps('Trạng thái')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
              <Select style={{ borderRadius: radiusPill, height: 40 }} options={[{ value: 'active', label: 'Sử dụng' }, { value: 'inactive', label: 'Không sử dụng' }]} />
            </Form.Item>
            <Form.Item name="description" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={2} placeholder="Ghi chú thêm..." />
            </Form.Item>
          </Form>
        </Spin>
      </Drawer>
    </div>
  );
}
