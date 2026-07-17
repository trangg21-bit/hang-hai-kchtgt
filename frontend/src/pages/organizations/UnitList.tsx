import { useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Modal, Form, Input, Select, Spin, Button, Space, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleOutlined, FileExcelOutlined, SendOutlined, CheckOutlined, CloseOutlined, MoreOutlined, CaretRightOutlined } from '@ant-design/icons';
import { organizationService } from '../../services/organizationService';

import type { Organization, CreateOrganizationPayload, UpdateOrganizationPayload } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterBar } from '../../components/list-view';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { statusOperational, statusAttention, statusCritical, statusDraft, actionPrimary, textSecondary, textTertiary, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold, cardStyle, dataSea1, radiusPill, borderDefault, spaceFormField } from '../../tokens';
import { colors } from '../../theme';

const { confirm } = Modal;

const STATUS_COLORS: Record<string, string> = { draft: statusDraft, pending: statusAttention, approved: statusOperational, rejected: statusCritical };
const STATUS_LABELS: Record<string, string> = { draft: 'Bản nháp', pending: 'Chờ duyệt', approved: 'Đã phê duyệt', rejected: 'Bị từ chối' };
const TYPE_LABELS: Record<string, string> = { CUC: 'Cục', TCT: 'Tổng cục', CHI_CUC: 'Chi cục', CANG_VU: 'Cảng vụ' };

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function fmtUser(s?: string) { if (!s) return '—'; return UUID_RE.test(s) ? 'Hệ thống' : s; }

// --- Column widths (px) ---
const COL_NAME = 780;
const COL_TYPE = 145;
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
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [form] = Form.useForm();
  const selectedType = Form.useWatch('type', form);
  const [submitting, setSubmitting] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

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

  const openCreateModal = useCallback(() => { setEditingOrg(null); form.resetFields(); setModalOpen(true); }, [form]);
  const openEditModal = useCallback((org: Organization) => {
    setEditingOrg(org);
    form.setFieldsValue({
      code: org.code, name: org.name, type: org.type,
      parentId: org.parentId,
      address: org.address, detailAddress: (org as any).detailAddress ?? '',
      phone: org.phone, description: org.description,
      status: org.status,
    });
    setModalOpen(true);
  }, [form]);
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields(); setSubmitting(true);
      const parentId = (selectedType && selectedType !== 'CUC') ? values.parentId : undefined;
      if (editingOrg) {
        await organizationService.update(editingOrg.id, {
          name: values.name, code: values.code, type: values.type,
          parentId,
          address: values.address, detailAddress: values.detailAddress,
          phone: values.phone, description: values.description,
          status: values.status,
        });
        toast.success('Đã cập nhật');
      } else {
        await organizationService.create({
          name: values.name, code: values.code, type: values.type,
          parentId,
          address: values.address, detailAddress: values.detailAddress,
          phone: values.phone, description: values.description,
        });
        toast.success('Đã tạo mới');
      }
      setModalOpen(false); fetchOrgs();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      toast.error(msg);
    } finally { setSubmitting(false); }
  }, [editingOrg, form, fetchOrgs, selectedType]);

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
    const items: any[] = [{ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => {} }];
    if (hasPerm('org.edit')) items.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
    if (hasPerm('org.edit') && (record.status === 'draft' || record.status === 'rejected')) items.push({ key: 'submit', label: 'Trình duyệt', icon: <SendOutlined />, onClick: () => handleSubmitApproval(record) });
    if (hasPerm('org.approve') && record.status === 'pending') { items.push({ key: 'approve', label: 'Phê duyệt', icon: <CheckOutlined />, onClick: () => handleApprove(record) }); items.push({ key: 'reject', label: 'Từ chối', icon: <CloseOutlined />, onClick: () => handleReject(record), danger: true }); }
    if (hasPerm('org.delete')) items.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
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
      return rows.filter(r => r.org.status === filterStatus);
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
        if (filterStatus && o.status !== filterStatus) return false;
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

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, mã...' },
    { key: 'status', type: 'select' as const, label: 'Trạng thái', width: 180, options: [
      { value: '', label: 'Tất cả' },
      { value: 'approved', label: 'Đã phê duyệt' },
      { value: 'pending', label: 'Chờ duyệt' },
      { value: 'draft', label: 'Bản nháp' },
      { value: 'rejected', label: 'Bị từ chối' },
    ]},
  ], []);
  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('org.create')) actions.push({ key: 'create', label: 'Thêm đơn vị', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    actions.push({ key: 'export', label: '', variant: 'subtle' as const, icon: <FileExcelOutlined style={{ color: statusOperational }} />, borderColor: `${statusOperational}80`, color: statusOperational, onClick: () => {} });
    return actions;
  }, [hasPerm, openCreateModal]);

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý đơn vị' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {/* Table header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: COL_GAP, padding: '8px 0', borderBottom: `1px solid ${borderDefault}`, marginBottom: 4 }}>
          <div style={{ width: COL_NAME, minWidth: COL_NAME, fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg, textTransform: 'uppercase', paddingLeft: 24, whiteSpace: 'nowrap' }}>Tên đơn vị</div>
          <div style={{ width: COL_TYPE, minWidth: COL_TYPE, fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Loại</div>
          <div style={{ width: COL_UPDATED_BY, minWidth: COL_UPDATED_BY, fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Cán bộ cập nhật</div>
          <div style={{ width: COL_UPDATED_AT, minWidth: COL_UPDATED_AT, fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Ngày cập nhật</div>
          <div style={{ width: COL_STATUS, minWidth: COL_STATUS, fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Trạng thái</div>
          <div style={{ width: COL_ACTION, minWidth: COL_ACTION }} />
        </div>

        {isLoading && <LoadingSkeleton rows={8} />}
        {isError && <ErrorState message={error?.message || 'Không thể tải danh sách đơn vị'} onRetry={fetchOrgs} />}
        {!isLoading && !isError && allOrgs.length === 0 && (
          <EmptyState description="Chưa có đơn vị nào" ctaText="Thêm đơn vị đầu tiên" onCta={openCreateModal} />
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
                        <div style={{ width: COL_NAME, minWidth: COL_NAME, flexShrink: 0 }}>
                          <Typography.Text strong style={{ fontSize: fontSizeMd }}>{org.name}</Typography.Text>
                          <Typography.Text style={{ display: 'block', fontSize: 11, color: textTertiary }}>{(org as any)._path}</Typography.Text>
                        </div>
                        <div style={{ width: COL_TYPE, minWidth: COL_TYPE }}>
                          <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${textSecondary}10`, color: textSecondary }}>{getTypeLabel(org.type)}</span>
                        </div>
                        <div style={{ width: COL_UPDATED_BY, minWidth: COL_UPDATED_BY, fontSize: fontSizeMd, color: textSecondary }}>
                          {fmtUser(org.updatedBy)}
                        </div>
                        <div style={{ width: COL_UPDATED_AT, minWidth: COL_UPDATED_AT, fontSize: fontSizeMd, color: textTertiary }}>
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
                  const s = STATUS_COLORS[org.status] || textTertiary;
                  const sl = STATUS_LABELS[org.status] || org.status;
                  const indentW = depth * 24;
                  return (
                    <div key={org.id} style={{ display: 'flex', alignItems: 'center', gap: COL_GAP, padding: '10px 0', borderBottom: `1px solid ${borderDefault}` }}>
                      {/* Column 1: Name — indent ONLY here */}
                      <div style={{ width: COL_NAME, minWidth: COL_NAME, flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: indentW }}>
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
                      {/* Column 2: Type — fixed position */}
                      <div style={{ width: COL_TYPE, minWidth: COL_TYPE, flexShrink: 0 }}>
                        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${textSecondary}10`, color: textSecondary, whiteSpace: 'nowrap' }}>
                          {getTypeLabel(org.type)}
                        </span>
                      </div>
                      {/* Column 3: Cán bộ cập nhật */}
                      <div style={{ width: COL_UPDATED_BY, minWidth: COL_UPDATED_BY, flexShrink: 0, fontSize: fontSizeMd, color: textSecondary }}>
                        {fmtUser(org.updatedBy)}
                      </div>
                      {/* Column 4: Ngày cập nhật */}
                      <div style={{ width: COL_UPDATED_AT, minWidth: COL_UPDATED_AT, flexShrink: 0, fontSize: fontSizeMd, color: textTertiary }}>
                        {fmtDate(org.updatedAt)}
                      </div>
                      {/* Column 5: Status — fixed position */}
                      <div style={{ width: COL_STATUS, minWidth: COL_STATUS, flexShrink: 0 }}>
                        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s}15`, color: s, whiteSpace: 'nowrap' }}>
                          {sl}
                        </span>
                      </div>
                      {/* Column 4: Actions — fixed position */}
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

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingOrg ? 'Sửa thông tin đơn vị' : 'Thêm mới đơn vị'}</span>}
        open={modalOpen} onCancel={() => setModalOpen(false)} destroyOnHidden confirmLoading={submitting} width={640} maskClosable={false}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="ok" type="primary" onClick={handleSubmit} loading={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>{editingOrg ? 'Cập nhật' : 'Tạo mới'}</Button>,
        ]}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }} labelCol={{ style: { padding: 0, marginBottom: 4 } }}>
            <Form.Item name="code" {...labelProps('Mã đơn vị')} style={{ marginBottom: spaceFormField }}>
              <Input disabled placeholder={editingOrg ? undefined : 'Tự động sinh khi tạo mới'} style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="name" {...labelProps('Tên đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}>
              <Input placeholder="Nhập tên đơn vị" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="type" {...labelProps('Cấp đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn cấp đơn vị' }]}>
              <Select placeholder="Chọn cấp đơn vị" style={{ borderRadius: radiusPill, height: 40 }} options={[{ value: 'CUC', label: 'Cục' }, { value: 'CANG_VU', label: 'Cảng vụ' }, { value: 'CHI_CUC', label: 'Chi cục' }, { value: 'TCT', label: 'Tổng cục' }]} />
            </Form.Item>
            {selectedType && selectedType !== 'CUC' && (
              <Form.Item name="parentId" {...labelProps('Đơn vị cha')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn đơn vị cha" allowClear style={{ borderRadius: radiusPill, height: 40 }} options={allOrgs.filter((o) => !editingOrg || o.id !== editingOrg.id).map((o) => ({ value: o.id, label: o.name }))} />
              </Form.Item>
            )}
            <Form.Item name="address" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} style={{ marginBottom: spaceFormField }}>
              <Input placeholder="vd: Hải Phòng" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="detailAddress" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
              <Input placeholder="Số nhà, đường, phường/xã..." style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="phone" {...labelProps('Số điện thoại')} style={{ marginBottom: spaceFormField }} rules={[{ pattern: /^0\d{9,10}$/, message: 'SĐT không hợp lệ' }]}>
              <Input placeholder="0901234567" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            {editingOrg && (
              <Form.Item name="status" {...labelProps('Trạng thái')} style={{ marginBottom: spaceFormField }}>
                <Select style={{ borderRadius: radiusPill, height: 40 }} options={[{ value: 'draft', label: 'Bản nháp' }, { value: 'pending', label: 'Chờ duyệt' }, { value: 'approved', label: 'Đã phê duyệt' }, { value: 'rejected', label: 'Bị từ chối' }]} />
              </Form.Item>
            )}
            <Form.Item name="description" {...labelProps('Ghi chú')} style={{ marginBottom: 6 }}>
              <Input.TextArea rows={2} placeholder="Ghi chú thêm..." style={{ borderRadius: 8 }} />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}
