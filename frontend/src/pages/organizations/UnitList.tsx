import { useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Modal, Form, Input, Select, Spin, Button, Row, Col, Drawer, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, SendOutlined, CheckOutlined, CloseOutlined, EyeOutlined, MoreOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { organizationService } from '../../services/organizationService';

import type { Organization } from '../../services/organizationService';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import EmptyState from '../../components/EmptyState';
import toast from '../../components/ToastNotification';
import { statusOperational, statusAttention, statusCritical, actionPrimary, textPrimary, textSecondary, textTertiary, surfaceCard, borderDefault, fontSizeSm, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold, radiusMd, radiusPill, spaceFormField, spaceMd, spaceLg, spaceSm, spaceXs, drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle } from '../../tokens';
import { colors } from '../../theme';
import { normalizeSearchText } from '../../components/org-unit';

const { confirm } = Modal;

const STATUS_COLORS: Record<string, string> = { pending: statusAttention, approved: statusOperational, inactive: statusCritical };
const STATUS_LABELS: Record<string, string> = { pending: 'Chờ phê duyệt', approved: 'Sử dụng', inactive: 'Không sử dụng' };
const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtUser(s?: string) { if (!s) return '—'; return UUID_RE.test(s) ? 'Hệ thống' : s; }

function fmtDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UnitList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);
  const canViewUpdateMetadata = currentUser?.email?.trim().toLowerCase() === 'cuc@vimawa.gov.vn' || currentUser?.username?.trim().toLowerCase() === 'cuc@vimawa.gov.vn';
  const [searchInput, setSearchInput] = useState('');
  const [filterStatusInput, setFilterStatusInput] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
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
    } catch { setIsError(true); }
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

    // The API returns only the user's allowed subtree. When the real parent
    // is outside that scope, the first visible descendant must be treated as
    // a root of the rendered tree; otherwise the status counts are non-zero
    // while the tree has no rows to render.
    const visibleIds = new Set(allOrgs.map((org) => org.id));

    const walk = (parentId: string | undefined, depth: number) => {
      const siblings = allOrgs
        .filter(o => parentId
          ? o.parentId === parentId
          : !o.parentId || !visibleIds.has(o.parentId))
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

  const handleFilterSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setFilterStatus(filterStatusInput);
  }, [filterStatusInput, searchInput]);
  const handleFilterReset = useCallback(() => {
    setSearchInput('');
    setFilterStatusInput('');
    setSearch('');
    setFilterStatus('');
  }, []);

  const getStatusKey = useCallback((org: Organization) => (
    org.operationalStatus === 'inactive' ? 'inactive' : (org.status === 'pending' ? 'pending' : 'approved')
  ), []);

  // --- Search mode: flat list ---
  const searchResults = useMemo(() => {
    const q = normalizeSearchText(search.trim());
    const hasFilter = q || filterStatus;
    if (!hasFilter) return null;
    return allOrgs
      .filter(o => {
        const searchable = normalizeSearchText(`${o.name} ${o.code || ''}`);
        if (q && !searchable.includes(q)) return false;
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
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleFilterSearch}
          style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 4 }}>Trạng thái</div>
        <Select placeholder="Tất cả" allowClear showSearch
          value={filterStatusInput || undefined}
          onChange={(val) => setFilterStatusInput(val || '')}
          filterOption={(input, option) => normalizeSearchText(String(option?.label ?? '')).includes(normalizeSearchText(input))}
          options={[
            { value: 'approved', label: 'Sử dụng' },
            { value: 'inactive', label: 'Không sử dụng' },
            { value: 'pending', label: 'Chờ phê duyệt' },
          ]}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>
    </>
  );

  // Status counts must follow the committed keyword filter. The status tab
  // itself is only a view filter, so counts remain comparable across tabs.
  const countSource = useMemo(() => {
    const keyword = normalizeSearchText(search.trim());
    if (!keyword) return allOrgs;
    return allOrgs.filter((org) => normalizeSearchText(`${org.name} ${org.code || ''}`).includes(keyword));
  }, [allOrgs, search]);
  const countByStatus = useCallback((status: string) => countSource.filter((org) => getStatusKey(org) === status).length, [countSource, getStatusKey]);

  const statusTabs = [
    { key: 'all', label: 'Tất cả', count: countSource.length, color: textSecondary, active: !filterStatus },
    { key: 'approved', label: 'Sử dụng', count: countByStatus('approved'), color: statusOperational, active: filterStatus === 'approved' },
    { key: 'inactive', label: 'Không sử dụng', count: countByStatus('inactive'), color: statusCritical, active: filterStatus === 'inactive' },
    { key: 'pending', label: 'Chờ phê duyệt', count: countByStatus('pending'), color: statusAttention, active: filterStatus === 'pending' },
  ];
  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('orgunit:manage')) actions.push({ key: 'create', label: 'Thêm đơn vị', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    return actions;
  }, [hasPerm, openCreateModal]);

  const treeRows = searchResults
    ? searchResults.map((org) => ({ org, depth: 0, hasChildren: false }))
    : visibleRows;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý đơn vị' }]} actions={headerActions} />
      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={handleFilterSearch}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={isError}
        onRetry={fetchOrgs}
        filterContent={filterContent}
        statusTabs={statusTabs}
        onStatusTabChange={(key) => {
          const status = key === 'all' ? '' : key;
          setFilterStatusInput(status);
          setFilterStatus(status);
        }}
      >
        {!isLoading && !isError && allOrgs.length === 0 && <EmptyState description="Chưa có đơn vị nào" />}
        {!isLoading && !isError && allOrgs.length > 0 && treeRows.length === 0 && (
          <EmptyState description="Không tìm thấy đơn vị nào phù hợp" />
        )}
        {!isLoading && !isError && treeRows.length > 0 && (
          <div style={{ width: '100%', border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: spaceSm, background: surfaceCard }}>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', minHeight: 40, borderBottom: `1px solid ${borderDefault}`, padding: `0 ${spaceMd}px` }}>
                <div style={{ flex: 1, minWidth: 0, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên đơn vị</div>
                {canViewUpdateMetadata && <>
                  <div style={{ width: 175, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Cán bộ cập nhật</div>
                  <div style={{ width: 160, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ngày cập nhật</div>
                </>}
                <div style={{ width: 160, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textAlign: 'center' }}>Trạng thái</div>
                <div style={{ width: 48 }} aria-hidden="true" />
              </div>
              {treeRows.map(({ org, depth, hasChildren }) => {
                const statusKey = getStatusKey(org);
                const color = STATUS_COLORS[statusKey] || textTertiary;
                return (
                  <div key={org.id} style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: `0 ${spaceMd}px`, borderBottom: `1px solid ${borderDefault}` }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', paddingLeft: depth * spaceLg }}>
                      <Button
                        type="text"
                        size="small"
                        disabled={!hasChildren}
                        onClick={() => { if (hasChildren) toggleExpand(org.id); }}
                        aria-label={hasChildren ? 'Mở hoặc thu gọn đơn vị con' : undefined}
                        icon={hasChildren
                          ? (expandedKeys.has(org.id) ? <DownOutlined /> : <RightOutlined />)
                          : undefined}
                        style={{ width: 24, minWidth: 24, height: 24, padding: 0, color: hasChildren ? actionPrimary : 'transparent', fontSize: fontSizeSm }}
                      >
                      </Button>
                      <Typography.Text style={{ marginLeft: spaceXs, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary, fontWeight: depth === 0 ? fontWeightBold : fontWeightMedium }}>
                        {org.name}
                      </Typography.Text>
                    </div>
                    {canViewUpdateMetadata && <>
                      <div style={{ width: 175, color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtUser(org.updatedBy)}</div>
                      <div style={{ width: 160, color: textTertiary }}>{fmtDate(org.updatedAt)}</div>
                    </>}
                    <div style={{ width: 160, textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', padding: `${spaceXs}px ${spaceSm}px`, borderRadius: radiusPill, color, background: `${color}15`, fontWeight: fontWeightMedium, whiteSpace: 'nowrap' }}>
                        {STATUS_LABELS[statusKey]}
                      </span>
                    </div>
                    <div style={{ width: 48, textAlign: 'center' }}>
                      <Dropdown menu={{ items: getActions(org) }} trigger={['click']}>
                        <Button type="text" aria-label="Thao tác" icon={<MoreOutlined />} style={{ width: 28, minWidth: 28, height: 28, padding: 0, color: textSecondary, border: `1px solid ${borderDefault}`, borderRadius: radiusPill }} />
                      </Dropdown>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
                filterOption={(input, option) => normalizeSearchText(String(option?.label ?? '')).includes(normalizeSearchText(input))}
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
