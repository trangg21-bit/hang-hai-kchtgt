import { useState, useCallback, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { Typography, Form, Input, Select, Spin, Button, Row, Col, Drawer, Dropdown, Tabs } from 'antd';
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  DownOutlined,
  RightOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { organizationService, RANK_OPTIONS, RANK_LABELS, fromApiOperationalStatus } from '../../services/organizationService';
import { userService } from '../../services/userService';
import type { Organization, OrgUnitRankName } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import SidebarFilterField from '../../components/list-view/SidebarFilterField';
import toast, { modal } from '../../components/ToastNotification';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd,
  radiusMd, radiusPill, spaceFormField, spaceMd, spaceSm, spaceXs, spaceLg,
  statusOperational, statusCritical, surfaceCard, borderDefault,
  drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, drawerStyles, drawerFormScrollStyle, drawerTabBarStyle,
  primaryButtonStyle, outlineButtonStyle, inputStyle, selectStyle, textAreaStyle, icons,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { normalizeSearchText } from '../../components/org-unit';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';

const STATUS_COLORS: Record<string, string> = { active: statusOperational, inactive: statusCritical };
const STATUS_LABELS: Record<string, string> = { active: 'Sử dụng', inactive: 'Không sử dụng' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtUser(s?: string, userMap?: Map<string, string>) {
  if (!s) return '—';
  const resolved = userMap?.get(s);
  if (resolved) return resolved;
  return UUID_RE.test(s) ? 'Hệ thống' : s;
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    const d = dayjs(iso);
    return d.isValid() ? d.format('DD/MM/YYYY HH:mm:ss') : iso;
  } catch {
    return iso;
  }
}

type SortField = 'name' | 'rank' | 'updatedAt' | 'updatedBy' | 'status';
type SortOrder = 'ascend' | 'descend' | null;

export default function UnitList() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
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

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder('ascend');
    } else if (sortOrder === 'ascend') {
      setSortOrder('descend');
    } else {
      setSortField(null);
      setSortOrder(null);
    }
  };

  const getStatusKey = useCallback((org: Organization) => (
    fromApiOperationalStatus(org.operationalStatus) === 'inactive' ? 'inactive' : 'active'
  ), []);

  const compareOrgs = useCallback((a: Organization, b: Organization): number => {
    if (!sortField || !sortOrder) {
      return a.name.localeCompare(b.name, 'vi');
    }
    let cmp = 0;
    if (sortField === 'name') {
      cmp = a.name.localeCompare(b.name, 'vi');
    } else if (sortField === 'rank') {
      const rA = RANK_LABELS[a.rank as OrgUnitRankName] ?? '';
      const rB = RANK_LABELS[b.rank as OrgUnitRankName] ?? '';
      cmp = rA.localeCompare(rB, 'vi');
    } else if (sortField === 'updatedAt') {
      const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      cmp = tA - tB;
    } else if (sortField === 'updatedBy') {
      const uA = fmtUser(a.updatedBy, userMap);
      const uB = fmtUser(b.updatedBy, userMap);
      cmp = uA.localeCompare(uB, 'vi');
    } else if (sortField === 'status') {
      const sA = getStatusKey(a);
      const sB = getStatusKey(b);
      cmp = sA.localeCompare(sB, 'vi');
    }
    return sortOrder === 'descend' ? -cmp : cmp;
  }, [sortField, sortOrder, userMap, getStatusKey]);

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
  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const map = new Map<string, string>();
        resp.data.forEach((u) => { map.set(u.id, u.fullName || u.username || u.id); });
        setUserMap(map);
      } catch { }
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
    const opStatus = fromApiOperationalStatus(org.operationalStatus);
    form.setFieldsValue({
      name: org.name,
      parentId: org.parentId,
      provinceId: org.provinceId != null ? String(org.provinceId) : undefined,
      detailAddress: org.detailAddress ?? '',
      phone: org.phone,
      description: org.description,
      operationalStatus: opStatus,
      rank: org.rank,
    });
    setModalOpen(true);
  }, [form]);

  const openViewModal = useCallback((org: Organization) => {
    setIsViewing(true);
    setEditingOrg(org);
    const opStatus = fromApiOperationalStatus(org.operationalStatus);
    form.setFieldsValue({
      name: org.name,
      parentId: org.parentId,
      provinceId: org.provinceId != null ? String(org.provinceId) : undefined,
      detailAddress: org.detailAddress ?? '',
      phone: org.phone,
      description: org.description,
      operationalStatus: opStatus,
      rank: org.rank,
      updatedAt: fmtDate(org.updatedAt),
      updatedBy: fmtUser(org.updatedBy, userMap),
    });
    setModalOpen(true);
  }, [form, userMap]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const parentId = values.parentId || undefined;
      if (editingOrg) {
        await organizationService.update(editingOrg.id, {
          name: values.name,
          parentId,
          provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
          detailAddress: values.detailAddress,
          phone: values.phone,
          description: values.description,
          operationalStatus: values.operationalStatus,
          rank: values.rank,
        });
        toast.success('Đã cập nhật đơn vị thành công');
      } else {
        await organizationService.create({
          name: values.name,
          parentId,
          provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
          detailAddress: values.detailAddress,
          phone: values.phone,
          description: values.description,
          operationalStatus: values.operationalStatus,
          rank: values.rank,
        });
        toast.success('Đã tạo mới đơn vị thành công');
      }
      setModalOpen(false);
      fetchOrgs();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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
    modal.confirm({
      title: 'Xác nhận xóa đơn vị',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa đơn vị "${org.name}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await organizationService.delete(org.id);
          toast.success('Xóa đơn vị thành công');
          fetchOrgs();
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || 'Xóa đơn vị thất bại';
          toast.error(msg);
        }
      }
    });
  }, [fetchOrgs]);

  const getActions = (record: Organization) => {
    const items: any[] = [];
    if (hasPerm('orgunit:read')) {
      items.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openViewModal(record) });
    }
    if (hasPerm('orgunit:update') || hasPerm('orgunit:edit') || hasPerm('orgunit:manage')) {
      items.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => openEditModal(record) });
    }
    if (hasPerm('orgunit:delete') || hasPerm('orgunit:manage')) {
      items.push({ key: 'delete', label: 'Xóa bỏ', icon: icons.delete, onClick: () => handleDelete(record), danger: true });
    }
    return items;
  };

  const visibleRows = useMemo(() => {
    type Row = { org: Organization; depth: number; hasChildren: boolean };
    const rows: Row[] = [];
    const visibleIds = new Set(allOrgs.map((org) => org.id));

    const walk = (parentId: string | undefined, depth: number) => {
      const siblings = allOrgs
        .filter(o => parentId
          ? o.parentId === parentId
          : !o.parentId || !visibleIds.has(o.parentId))
        .sort(compareOrgs);
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
    if (filterStatus) {
      return rows.filter(r => {
        const stKey = getStatusKey(r.org);
        return stKey === filterStatus;
      });
    }
    return rows;
  }, [allOrgs, expandedKeys, filterStatus, compareOrgs, getStatusKey]);

  const handleFilterSearch = useCallback(() => {
    setSearchName(nameInput.trim());
  }, [nameInput]);

  const handleFilterReset = useCallback(() => {
    setNameInput('');
    setSearchName('');
    setFilterStatus('');
  }, []);

  const searchResults = useMemo(() => {
    const nameQuery = normalizeSearchText(searchName.trim());
    const hasFilter = nameQuery || filterStatus;
    if (!hasFilter) return null;
    return allOrgs
      .filter(o => {
        if (nameQuery && !normalizeSearchText(o.name).includes(nameQuery)) return false;
        if (filterStatus) {
          const stKey = getStatusKey(o);
          if (stKey !== filterStatus) return false;
        }
        return true;
      })
      .sort(compareOrgs)
      .map(org => {
        const parts: string[] = [org.name];
        let cur = org;
        while (cur.parentId) {
          const p = allOrgs.find(o => o.id === cur.parentId);
          if (p) {
            parts.unshift(p.name);
            cur = p;
          } else break;
        }
        return { ...org, _path: parts.join(' › ') };
      });
  }, [allOrgs, filterStatus, searchName, compareOrgs, getStatusKey]);

  const filterContent = (
    <>
      <SidebarFilterField label="Tên đơn vị" style={{ marginTop: spaceMd }}>
        <Input
          placeholder="Tìm theo tên đơn vị..."
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onPressEnter={handleFilterSearch}
          allowClear
          style={{ ...inputStyle, borderRadius: radiusPill, height: 38 }}
        />
      </SidebarFilterField>
    </>
  );

  const countByStatus = useCallback((st: string) => {
    if (!st) return allOrgs.length;
    return allOrgs.filter(o => getStatusKey(o) === st).length;
  }, [allOrgs, getStatusKey]);

  const statusTabs = [
    { key: 'all', label: 'Tất cả', count: countByStatus(''), color: colors.primary, active: !filterStatus },
    { key: 'active', label: 'Sử dụng', count: countByStatus('active'), color: statusOperational, active: filterStatus === 'active' },
    { key: 'inactive', label: 'Không sử dụng', count: countByStatus('inactive'), color: statusCritical, active: filterStatus === 'inactive' },
  ];

  const treeRows = searchResults
    ? searchResults.map((org) => ({ org, depth: 0, hasChildren: false }))
    : visibleRows;

  const renderSortHeader = (label: string, field: SortField, style: React.CSSProperties) => {
    const isActive = sortField === field;
    return (
      <div
        style={{ ...style, cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => handleSort(field)}
      >
        <span>{label}</span>
        <span style={{ display: 'inline-flex', flexDirection: 'column', fontSize: 9, lineHeight: 1 }}>
          <span style={{ color: isActive && sortOrder === 'ascend' ? actionPrimary : '#bfbfbf' }}>▲</span>
          <span style={{ color: isActive && sortOrder === 'descend' ? actionPrimary : '#bfbfbf' }}>▼</span>
        </span>
      </div>
    );
  };

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('orgunit:create') || hasPerm('orgunit:manage')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: openCreateModal,
      });
    }
    return actions;
  }, [hasPerm, openCreateModal]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        <ScreenHeader
          breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý đơn vị' }]}
          actions={headerActions}
        />
        <FilterTableLayout
          hideFilterToggle
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
          {!isLoading && !isError && treeRows.length === 0 && (
            <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', marginTop: 10, marginBottom: 10, fontSize: fontSizeMd, color: '#7E6B3F' }}>
                Không có kết quả tìm kiếm
              </div>
            </div>
          )}
          {!isLoading && !isError && treeRows.length > 0 && (
            <div style={{ width: '100%', height: '100%', flex: 1, minHeight: 0, overflowY: 'auto', border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: 0, background: surfaceCard }}>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', minHeight: 40, borderBottom: `1px solid ${borderDefault}`, padding: `0 ${spaceMd}px`, position: 'sticky', top: 0, background: '#FAFAFA', zIndex: 2 }}>
                  {renderSortHeader('TÊN ĐƠN VỊ', 'name', { flex: 1, minWidth: 0, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd })}
                  {renderSortHeader('CẤP ĐƠN VỊ', 'rank', { width: 220, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd })}
                  {renderSortHeader('NGÀY CẬP NHẬT', 'updatedAt', { width: 180, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd })}
                  {renderSortHeader('CÁN BỘ CẬP NHẬT', 'updatedBy', { width: 175, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd })}
                  {renderSortHeader('TRẠNG THÁI', 'status', { width: 140, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, justifyContent: 'center' })}
                  <div style={{ width: 60, textAlign: 'center', color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>THAO TÁC</div>
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
                        />
                        <Typography.Text style={{ flex: 1, minWidth: 0, marginLeft: spaceXs, whiteSpace: 'normal', wordBreak: 'break-word', color: textPrimary, fontWeight: depth === 0 ? fontWeightBold : fontWeightMedium }}>
                          {org.name}
                        </Typography.Text>
                      </div>
                      <div style={{ width: 220, color: textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{RANK_LABELS[org.rank as OrgUnitRankName] ?? '—'}</div>
                      <div style={{ width: 180, color: textTertiary }}>{fmtDate(org.updatedAt)}</div>
                      <div style={{ width: 175, color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtUser(org.updatedBy, userMap)}</div>
                      <div style={{ width: 140, textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: radiusPill,
                            fontSize: fontSizeSm,
                            fontWeight: fontWeightMedium,
                            backgroundColor: `${color}15`,
                            border: `1px solid ${color}40`,
                            color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {STATUS_LABELS[statusKey]}
                        </span>
                      </div>
                      <div style={{ width: 60, textAlign: 'center' }}>
                        <Dropdown menu={{ items: getActions(org) }} trigger={['click']}>
                          <Button
                            type="text"
                            aria-label="Thao tác"
                            icon={<MoreOutlined style={{ fontSize: 16 }} />}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: textSecondary,
                            }}
                          />
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
          size="50%"
          placement="right"
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          closable={false}
          styles={drawerStyles}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={drawerTitleStyle}>
                {isViewing ? `Xem chi tiết — ${editingOrg?.name || 'Đơn vị'}` : (editingOrg ? 'Chỉnh sửa đơn vị' : 'Thêm mới đơn vị')}
              </span>
              <Button
                type="text"
                onClick={() => setModalOpen(false)}
                style={{
                  ...drawerCloseBtnStyle,
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseOutlined style={{ fontSize: 14, color: textSecondary }} />
              </Button>
            </div>
          }
          footer={
            isViewing ? null : (
              <div style={drawerFooterStyle}>
                <Button onClick={() => setModalOpen(false)} style={outlineButtonStyle}>Hủy</Button>
                <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>{editingOrg ? 'Cập nhật' : 'Tạo mới'}</Button>
              </div>
            )
          }
        >
          <Spin spinning={submitting}>
            {isViewing && editingOrg ? (
              <Tabs
                tabBarStyle={drawerTabBarStyle}
                animated={false}
                items={[
                  {
                    key: 'general',
                    label: 'Thông tin chung',
                    children: (
                      <div style={drawerFormScrollStyle}>
                        <div style={{ paddingTop: spaceMd }}>
                          <div className="chk-detail-grid">
                            <div className="chk-detail-row"><span className="chk-detail-label">Tên đơn vị</span><span className="chk-detail-value">{editingOrg.name || '—'}</span></div>
                            <div className="chk-detail-row"><span className="chk-detail-label">Cấp đơn vị</span><span className="chk-detail-value">{RANK_LABELS[editingOrg.rank as OrgUnitRankName] ?? '—'}</span></div>
                            <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị cha</span><span className="chk-detail-value">{editingOrg.parentOrgName || '—'}</span></div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label">Trạng thái</span>
                              <span className="chk-detail-value">
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 10px',
                                    borderRadius: radiusPill,
                                    fontSize: fontSizeSm,
                                    fontWeight: fontWeightMedium,
                                    backgroundColor: editingOrg.operationalStatus === 'inactive' ? `${statusCritical}15` : `${statusOperational}15`,
                                    border: editingOrg.operationalStatus === 'inactive' ? `1px solid ${statusCritical}40` : `1px solid ${statusOperational}40`,
                                    color: editingOrg.operationalStatus === 'inactive' ? statusCritical : statusOperational,
                                  }}
                                >
                                  {editingOrg.operationalStatus === 'inactive' ? 'Không sử dụng' : 'Sử dụng'}
                                </span>
                              </span>
                            </div>
                            <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm (Tỉnh/TP)</span><span className="chk-detail-value">{editingOrg.provinceId ? (getProvinceNameById(editingOrg.provinceId) || String(editingOrg.provinceId)) : '—'}</span></div>
                            <div className="chk-detail-row"><span className="chk-detail-label">Số điện thoại</span><span className="chk-detail-value">{editingOrg.phone || '—'}</span></div>
                            <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Địa điểm chi tiết</span><span className="chk-detail-value">{editingOrg.detailAddress || '—'}</span></div>
                            <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Ghi chú</span><span className="chk-detail-value">{editingOrg.description || '—'}</span></div>
                          </div>

                          <div style={{ marginTop: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'inline-block', width: 4, height: 16, borderRadius: 2, backgroundColor: actionPrimary }} />
                            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Thông tin hệ thống
                            </span>
                          </div>

                          <div className="chk-detail-grid">
                            <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ cập nhật</span><span className="chk-detail-value">{fmtUser(editingOrg.updatedBy, userMap)}</span></div>
                            <div className="chk-detail-row"><span className="chk-detail-label">Ngày cập nhật</span><span className="chk-detail-value">{fmtDate(editingOrg.updatedAt)}</span></div>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            ) : (
              <div style={drawerFormScrollStyle}>
                <Form form={form} layout="vertical" style={{ marginTop: 16 }} labelCol={{ style: { padding: 0, marginBottom: 4 } }}>
                  <Row gutter={spaceMd}>
                    <Col span={24}>
                      <Form.Item name="name" {...labelProps('Tên đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}>
                        <Input placeholder="Nhập tên đơn vị" style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={spaceMd}>
                    <Col span={12}>
                      <Form.Item name="parentId" {...labelProps('Đơn vị cha')} style={{ marginBottom: spaceFormField }}>
                        <Select
                          placeholder="Chọn đơn vị cha (Để trống = Cấp cao nhất)"
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          filterOption={(input, option) => normalizeSearchText(String(option?.label ?? '')).includes(normalizeSearchText(input))}
                          style={{ ...selectStyle, borderRadius: radiusPill, height: 40, width: '100%' }}
                          options={parentOptions}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="rank" {...labelProps('Cấp đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn cấp đơn vị' }]}>
                        <Select placeholder="Chọn cấp đơn vị" style={{ ...selectStyle, borderRadius: radiusPill, height: 40, width: '100%' }} options={RANK_OPTIONS} />
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
                          style={{ ...selectStyle, borderRadius: radiusPill, height: 40, width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="detailAddress" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="Số nhà, đường, phường/xã..." style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={spaceMd}>
                    <Col span={12}>
                      <Form.Item name="phone" {...labelProps('Số điện thoại')} style={{ marginBottom: spaceFormField }} rules={[{ pattern: /^0\d{9,10}$/, message: 'SĐT không hợp lệ' }]}>
                        <Input placeholder="0901234567" style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="operationalStatus" {...labelProps('Trạng thái')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
                        <Select style={{ ...selectStyle, borderRadius: radiusPill, height: 40, width: '100%' }} options={[{ value: 'active', label: 'Sử dụng' }, { value: 'inactive', label: 'Không sử dụng' }]} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="description" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                    <Input.TextArea rows={3} placeholder="Ghi chú thêm..." maxLength={1000} showCount style={textAreaStyle} />
                  </Form.Item>
                </Form>
              </div>
            )}
          </Spin>
        </Drawer>
      </div>
    </ThemeTokenProvider>
  );
}

