import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Typography, Form, Input, Select, Spin, Button, Row, Col, Drawer, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, EyeOutlined, MoreOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { organizationService, RANK_OPTIONS, RANK_LABELS } from '../../services/organizationService';
import { userService } from '../../services/userService';

import type { Organization, OrgUnitRankName } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import EmptyState from '../../components/EmptyState';
import toast, { modal } from '../../components/ToastNotification';
import { statusOperational, statusCritical, actionPrimary, textPrimary, textSecondary, textTertiary, surfaceCard, borderDefault, fontSizeSm, fontSizeMd, fontWeightMedium, fontWeightBold, radiusMd, radiusPill, spaceFormField, spaceMd, spaceLg, spaceSm, spaceXs, drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle, detailLabelColStyle, detailValueStyle } from '../../tokens';
import { colors } from '../../theme';
import { normalizeSearchText } from '../../components/org-unit';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';

const { confirm } = modal;

const STATUS_COLORS: Record<string, string> = { active: statusOperational, inactive: statusCritical };
const STATUS_LABELS: Record<string, string> = { active: 'Sử dụng', inactive: 'Không sử dụng' };
const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtUser(s?: string, userMap?: Map<string, string>) {
  if (!s) return '—';
  const resolved = userMap?.get(s);
  if (resolved) return resolved;
  return UUID_RE.test(s) ? 'Hệ thống' : s;
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UnitList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const [nameInput, setNameInput] = useState('');
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
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
  // UUID → tên cán bộ cho cột "Cán bộ cập nhật" (pattern giống BuoyList/BerthList)
  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const map = new Map<string, string>();
        resp.data.forEach((u) => { map.set(u.id, u.fullName || u.username || u.id); });
        setUserMap(map);
      } catch { /* giữ map rỗng, fallback fmtUser */ }
    })();
  }, []);

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
      name: org.name,
      parentId: org.parentId,
      provinceId: org.provinceId != null ? String(org.provinceId) : undefined,
      detailAddress: org.detailAddress ?? '',
      phone: org.phone, description: org.description,
      operationalStatus: opStatus,
      rank: org.rank,
    });
    setModalOpen(true);
  }, [form]);

  const openViewModal = useCallback((org: Organization) => {
    setIsViewing(true);
    setEditingOrg(org);
    const opStatus = (org.operationalStatus || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';
    form.setFieldsValue({
      name: org.name,
      parentId: org.parentId,
      provinceId: org.provinceId != null ? String(org.provinceId) : undefined,
      detailAddress: org.detailAddress ?? '',
      phone: org.phone, description: org.description,
      operationalStatus: opStatus,
      rank: org.rank,
      updatedAt: fmtDate(org.updatedAt),
      updatedBy: fmtUser(org.updatedBy, userMap),
    });
    setModalOpen(true);
  }, [form, userMap]);
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields(); setSubmitting(true);
      const parentId = values.parentId || undefined;
      if (editingOrg) {
        await organizationService.update(editingOrg.id, {
          name: values.name,
          parentId,
          provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
          detailAddress: values.detailAddress,
          phone: values.phone, description: values.description,
          operationalStatus: values.operationalStatus,
          rank: values.rank,
        });
        toast.success('Đã cập nhật');
      } else {
        await organizationService.create({
          name: values.name,
          parentId,
          provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
          detailAddress: values.detailAddress,
          phone: values.phone, description: values.description,
          operationalStatus: values.operationalStatus,
          rank: values.rank,
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
  const getActions = (record: Organization) => {
    const items: any[] = [];
    items.push({ key: 'view', label: 'Xem', icon: <EyeOutlined />, onClick: () => openViewModal(record) });
    if (hasPerm('orgunit:manage')) items.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
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
        const stKey = r.org.operationalStatus === 'inactive' ? 'inactive' : 'active';
        return stKey === filterStatus;
      });
    }
    return rows;
  }, [allOrgs, expandedKeys, filterStatus]);

  const handleFilterSearch = useCallback(() => {
    setSearchName(nameInput.trim());
  }, [nameInput]);
  const handleFilterReset = useCallback(() => {
    setNameInput('');
    setSearchName('');
    setFilterStatus('');
  }, []);

  const getStatusKey = useCallback((org: Organization) => (
    org.operationalStatus === 'inactive' ? 'inactive' : 'active'
  ), []);

  // --- Search mode: flat list ---
  const searchResults = useMemo(() => {
    const nameQuery = normalizeSearchText(searchName.trim());
    const hasFilter = nameQuery || filterStatus;
    if (!hasFilter) return null;
    return allOrgs
      .filter(o => {
        if (nameQuery && !normalizeSearchText(o.name).includes(nameQuery)) return false;
        if (filterStatus) {
          const stKey = o.operationalStatus === 'inactive' ? 'inactive' : 'active';
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
  }, [allOrgs, filterStatus, searchName]);

  const filterContent = (
    <>
      <div style={{ marginBottom: 12, marginTop: 16 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 4 }}>Tên đơn vị</div>
        <Input placeholder="Tìm theo tên đơn vị..." allowClear
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onPressEnter={handleFilterSearch}
          style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
    </>
  );

  // Status counts must follow the committed keyword filter. The status tab
  // itself is only a view filter, so counts remain comparable across tabs.
  const countSource = useMemo(() => {
    const nameQuery = normalizeSearchText(searchName.trim());
    if (!nameQuery) return allOrgs;
    return allOrgs.filter((org) => (
      !nameQuery || normalizeSearchText(org.name).includes(nameQuery)
    ));
  }, [allOrgs, searchName]);
  const countByStatus = useCallback((status: string) => countSource.filter((org) => getStatusKey(org) === status).length, [countSource, getStatusKey]);

  const statusTabs = [
    { key: 'all', label: 'Tất cả', count: countSource.length, color: textSecondary, active: !filterStatus },
    { key: 'active', label: 'Sử dụng', count: countByStatus('active'), color: statusOperational, active: filterStatus === 'active' },
    { key: 'inactive', label: 'Không sử dụng', count: countByStatus('inactive'), color: statusCritical, active: filterStatus === 'inactive' },
  ];
  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('orgunit:manage')) actions.push({ key: 'create', label: 'Thêm đơn vị', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    return actions;
  }, [hasPerm, openCreateModal]);

  const treeRows = searchResults
    ? searchResults.map((org) => ({ org, depth: 0, hasChildren: false }))
    : visibleRows;

  const unitDetailItems: Array<[string, ReactNode]> = editingOrg ? [
    ['Tên đơn vị', editingOrg.name || '—'],
    ['Đơn vị cha', editingOrg.parentId ? (allOrgs.find(o => o.id === editingOrg.parentId)?.name || '—') : '—'],
    ['Cấp đơn vị', RANK_LABELS[editingOrg.rank as OrgUnitRankName] ?? '—'],
    ['Địa điểm (Tỉnh/Thành phố)', editingOrg.provinceId != null ? (getProvinceNameById(editingOrg.provinceId) || '—') : '—'],
    ['Địa điểm chi tiết', editingOrg.detailAddress || '—'],
    ['Số điện thoại', editingOrg.phone || '—'],
    ['Trạng thái', (() => {
      const statusKey = getStatusKey(editingOrg);
      const color = STATUS_COLORS[statusKey] || textTertiary;
      return <span style={{ display: 'inline-flex', padding: `${spaceXs}px ${spaceSm}px`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color }}>{STATUS_LABELS[statusKey] || statusKey}</span>;
    })()],
    ['Ghi chú', editingOrg.description || '—'],
    ['Ngày cập nhật', fmtDate(editingOrg.updatedAt)],
    ['Cán bộ cập nhật', fmtUser(editingOrg.updatedBy, userMap)],
  ] : [];

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
          setFilterStatus(status);
        }}
      >
        {!isLoading && !isError && allOrgs.length === 0 && <EmptyState description="Chưa có đơn vị nào" />}
        {!isLoading && !isError && allOrgs.length > 0 && treeRows.length === 0 && (
          <EmptyState description="Không tìm thấy đơn vị nào phù hợp" />
        )}
        {!isLoading && !isError && treeRows.length > 0 && (
          <div style={{ width: '100%', flex: 1, minHeight: 0, overflowY: 'auto', border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: spaceSm, background: surfaceCard }}>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', minHeight: 40, borderBottom: `1px solid ${borderDefault}`, padding: `0 ${spaceMd}px` }}>
                <div style={{ flex: 1, minWidth: 0, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên đơn vị</div>
                <div style={{ width: 260, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Cấp đơn vị</div>
                <div style={{ width: 160, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ngày cập nhật</div>
                <div style={{ width: 175, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Cán bộ cập nhật</div>
                <div style={{ width: 140, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textAlign: 'center' }}>Trạng thái</div>
                <div style={{ width: 40 }} aria-hidden="true" />
              </div>
              {treeRows.map(({ org, depth, hasChildren }) => {
                const statusKey = getStatusKey(org);
                const color = STATUS_COLORS[statusKey] || textTertiary;
                return (
                  <div key={org.id} style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: `0 ${spaceMd}px`, borderBottom: `1px solid ${borderDefault}` }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', paddingLeft: depth * spaceLg, paddingRight: spaceSm }}>
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
                      <Typography.Text style={{ flex: 1, minWidth: 0, marginLeft: spaceXs, whiteSpace: 'normal', wordBreak: 'break-word', color: textPrimary, fontWeight: depth === 0 ? fontWeightBold : fontWeightMedium }}>
                        {org.name}
                      </Typography.Text>
                    </div>
                    <div style={{ width: 260, color: textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{RANK_LABELS[org.rank as OrgUnitRankName] ?? '—'}</div>
                    <div style={{ width: 160, color: textTertiary }}>{fmtDate(org.updatedAt)}</div>
                    <div style={{ width: 175, color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtUser(org.updatedBy, userMap)}</div>
                    <div style={{ width: 140, textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', padding: `${spaceXs}px ${spaceSm}px`, borderRadius: radiusPill, color, background: `${color}15`, fontWeight: fontWeightMedium, whiteSpace: 'nowrap' }}>
                        {STATUS_LABELS[statusKey]}
                      </span>
                    </div>
                    <div style={{ width: 40, textAlign: 'center' }}>
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
          {isViewing && editingOrg ? (
            <div style={{ paddingTop: spaceMd }}>
              <div style={{ borderTop: `1px solid ${borderDefault}` }}>
                {Array.from({ length: Math.ceil(unitDetailItems.length / 2) }, (_, rowIndex) => {
                  const left = unitDetailItems[rowIndex * 2];
                  const right = unitDetailItems[rowIndex * 2 + 1];
                  return (
                    <div key={`${left?.[0] || 'detail'}-${rowIndex}`} style={{ display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr) 180px minmax(0, 1fr)', borderBottom: `1px solid ${borderDefault}` }}>
                      {[left, right].map((item, itemIndex) => item ? (
                        <span key={item[0]} style={{ display: 'contents' }}>
                          <span style={{ ...detailLabelColStyle, width: 'auto', padding: `${spaceSm}px ${spaceFormField}px`, whiteSpace: 'normal' }}>{item[0]}:</span>
                          <span style={{ ...detailValueStyle, minWidth: 0, padding: `${spaceSm}px ${spaceFormField}px`, color: item[1] === '—' ? textSecondary : textPrimary, wordBreak: 'break-word' }}>{item[1]}</span>
                        </span>
                      ) : (
                        <span key={`empty-${itemIndex}`} style={{ gridColumn: 'span 2' }} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Form form={form} layout="vertical" style={{ marginTop: 16 }} labelCol={{ style: { padding: 0, marginBottom: 4 } }}>
            <Row gutter={spaceMd}>
              <Col span={24}>
                <Form.Item name="name" {...labelProps('Tên đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}>
                  <Input placeholder="Nhập tên đơn vị" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceMd}>
              <Col span={12}>
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
              </Col>
              <Col span={12}>
                <Form.Item name="rank" {...labelProps('Cấp đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn cấp đơn vị' }]}>
                  <Select placeholder="Chọn cấp đơn vị" style={{ borderRadius: radiusPill, height: 40 }} options={RANK_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn địa điểm (Tỉnh/Thành phố)' }]}>
                  <Select
                    showSearch
                    placeholder="Chọn địa điểm"
                    optionFilterProp="label"
                    filterOption={(input, option) => normalizeSearchText(String(option?.label ?? '')).includes(normalizeSearchText(input))}
                    options={VIETNAM_PROVINCE_OPTIONS}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="detailAddress" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Số nhà, đường, phường/xã..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item name="phone" {...labelProps('Số điện thoại')} style={{ marginBottom: spaceFormField }} rules={[{ pattern: /^0\d{9,10}$/, message: 'SĐT không hợp lệ' }]}>
                  <Input placeholder="0901234567" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operationalStatus" {...labelProps('Trạng thái')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
                  <Select style={{ borderRadius: radiusPill, height: 40 }} options={[{ value: 'active', label: 'Sử dụng' }, { value: 'inactive', label: 'Không sử dụng' }]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={2} placeholder="Ghi chú thêm..." />
            </Form.Item>
            </Form>
          )}
        </Spin>
      </Drawer>
    </div>
  );
}
