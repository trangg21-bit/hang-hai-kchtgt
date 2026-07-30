---
feature-id: F-020
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 2
task: org-units-list-view-refactor
verdict: Blocked
last-updated: 2026-07-17
---

# Frontend Implementation Summary — Org Units List/View Refactor (Wave 2)

## Verdict: BLOCKED — Permission denied to write source files

**Reason:** The `write`/`edit`/`apply_patch` tools are blocked for `frontend/src/**` paths. The permitted patterns (`src/**`, `tests/**`, `packages/**`, `docs/**/dev/05-fe-dev-w*.md`) do not cover `frontend/src/pages/organizations/UnitList.tsx` or `UnitTree.tsx`. See below for the complete file contents that need to be applied manually.

---

## Designer spec coverage

| Requirement | Status | Notes |
|---|---|---|
| ScreenHeader replacing old Card header | Implemented | Exact code ready in `patch-content` below |
| FilterBar replacing old filter Card | Implemented | search + status select fields |
| StatusTabs in card wrapper | Implemented | 5 tabs: All/Draft/Pending/Approved/Rejected |
| Tree view in cardStyle wrapper | Implemented | `cardStyle` + `padding: '8px 16px'` |
| Tint chips replacing `<Tag>` | Implemented | 2px10px border-radius 8, background `${color}15` |
| Zero hardcoded hex colors | Implemented | All replaced with tokens |
| Modal matches UsersPage pattern | Implemented | Custom footer, labelProps, pill inputs |
| UnitTree consistent styling | Implemented | ScreenHeader + chips + cardStyle |

## Component / token mapping

| UI Requirement | Existing Component/Token | Gap |
|---|---|---|
| Page header with breadcrumb + actions | `ScreenHeader` from list-view | None |
| Search + select filter | `FilterBar` from list-view | None |
| Status tabs | `StatusTabs` from list-view | None |
| Tree container | `cardStyle` from tokens.ts | None |
| Button: Thêm đơn vị (primary) | `actionPrimary` token | None |
| Button: Xuất Excel (subtle) | `statusOperational` token | None |
| Level chip `C{level}` | `dataSea1` token (tint chip) | None |
| Status chip | `STATUS_MAP` -> tokens | STATUS_MAP values changed from Tag color names to hex |
| Action button: Sửa | `actionPrimary` | Was `#1890ff` |
| Action button: Thêm con | `statusOperational` | Was `#52c41a` |
| Action button: Từ chối | `statusCritical` | Was `#ff4d4f` |
| Modal title | `colors.sidebarBg` (#12468C) | Was plain text |
| Modal Form.Item | `spaceFormField` (12px) | Was default |
| Modal Input/Select | `radiusPill` (999px), `height: 40` | Was default |
| New components | `FileExcelOutlined` icon | For export button |

## Files changed

| File | Purpose |
|---|---|
| `frontend/src/pages/organizations/UnitList.tsx` | Full refactor to list-view standard |
| `frontend/src/pages/organizations/UnitTree.tsx` | Header + chip + cardStyle consistency |

## Components created or modified

### UnitList.tsx — Modified (full rewrite)

**States covered:**
- Loading → `LoadingSkeleton rows={8}`
- Error → `ErrorState` with retry
- Empty (no filter) → `EmptyState` with "Thêm đơn vị đầu tiên" CTA
- Empty (with filter) → `EmptyState` "Không tìm thấy đơn vị"
- Success → `<Tree>` with tree data

**Changes:**
1. Removed: `Card` (header + filter), `Tag`, `Row`, `Col`, `Badge`, `DataTable`, `SearchOutlined`, `ReloadOutlined`, `ArrowRightOutlined`, `BranchesOutlined`
2. Added: `ScreenHeader`, `FilterBar`, `StatusTabs`, `FileExcelOutlined`, token imports, `colors` import
3. Added: `handleFilterSearch`, `handleFilterReset`, `handleTabChange` callbacks
4. Added: local counts (`totalAll`, `countDraft`, `countPending`, `countApproved`, `countRejected`)
5. Added: `headerActions` memoized array for ScreenHeader
6. Changed: STATUS_MAP values from Tag color strings to token hex values
7. Changed: Tree node `<Tag color="blue">C{level}</Tag>` → tint chip with `dataSea1`
8. Changed: Tree node `<Tag color={...}>` status → tint chip with STATUS_MAP color
9. Changed: Action button colors from hex (`#1890ff`, `#52c41a`, `#ff4d4f`) → tokens (`actionPrimary`, `statusOperational`, `statusCritical`)
10. Changed: Modal `title` → styled span, `footer` → custom pill buttons, Form.Items → `labelProps` + `spaceFormField`
11. Added: `FileExcelOutlined` export action in header
12. Added: `labelProps` helper for consistent modal form labels
13. Added: Top-level wrapper `minHeight:'100%', marginTop:-8`

### UnitTree.tsx — Modified

**States covered:** Loading / Error / Empty / Success (same as before)

**Changes:**
1. Replaced Card header with `ScreenHeader` breadcrumb
2. Added `ScreenHeader` import from list-view
3. Added token imports: `cardStyle`, `dataSea1`, `fontSizeMd`, `fontSizeSm`, `fontWeightMedium`, status tokens
4. Changed: `<Tag color="blue">C{org.level}</Tag>` → tint chip with `dataSea1`
5. Changed: `<Tag color={STATUS_MAP[...]}>` → tint chip with STATUS_MAP color
6. Changed: Wrapped Tree content in `<div style={{...cardStyle, padding:'8px 16px'}}>`
7. Removed: `ArrowLeftOutlined`, `useParams`, `Button`, `Tag` imports
8. Added: Top-level wrapper `<div style={{minHeight:'100%', marginTop:-8}}>`

## Accessibility compliance

| Requirement | Implementation |
|---|---|
| Color contrast | All text uses tokens with sufficient contrast ratios |
| Keyboard navigation | Tree component supports keyboard by default |
| Focus indicators | AntD components manage focus natively |
| Alt text on icons | Icons are decorative (`@ant-design/icons`) |

## Tests added or updated

No tests were added — this is a pure UI refactor preserving all existing logic.

## Verification evidence

Unable to run `npx tsc --noEmit` — the source files could not be written by this agent due to tool permission restrictions.

## Known limitations / mismatches

1. **PERMISSION BLOCKER:** The frontend source files (`frontend/src/pages/organizations/UnitList.tsx`, `UnitTree.tsx`) could not be written by this agent. The tool permission system only permits `src/**` (Java backend) but not `frontend/src/**` (React frontend). The complete file contents are provided below for manual application.
2. The `openCreateChildModal` currently sets `type: 'CUC'` as default — this was preserved from original.
3. Export button has no onClick handler (same as UsersPage pattern — placeholder).
4. The old `DataTable` import (from `../../components/DataTable`) was removed since the Tree view doesn't need it. The `list-view/DataTable` was also not imported since we use `<Tree>`.

---

## Patch Content — UnitList.tsx

Apply the following full content to `frontend/src/pages/organizations/UnitList.tsx`:

```tsx
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Space,
  Typography,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  Spin,
  Button,
  Tree,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { organizationService } from '../../services/organizationService';
import type { Organization, CreateOrganizationPayload, UpdateOrganizationPayload } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterBar, StatusTabs } from '../../components/list-view';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { statusOperational, statusAttention, statusCritical, statusDraft, actionPrimary, textSecondary, fontSizeMd, fontSizeSm, fontSizeLg, fontWeightMedium, fontWeightBold, cardStyle, dataSea1, radiusPill, borderDefault, spaceFormField } from '../../tokens';
import { colors } from '../../theme';

const { confirm } = Modal;

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  draft: { color: statusDraft, label: 'Bản nháp' },
  pending: { color: statusAttention, label: 'Chờ duyệt' },
  approved: { color: statusOperational, label: 'Đã phê duyệt' },
  rejected: { color: statusCritical, label: 'Bị từ chối' },
};

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

export default function UnitList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [form] = Form.useForm();
  const selectedType = Form.useWatch('type', form);
  const [submitting, setSubmitting] = useState(false);

  // Counts from allOrgs
  const totalAll = allOrgs.length;
  const countDraft = allOrgs.filter(o => o.status === 'draft').length;
  const countPending = allOrgs.filter(o => o.status === 'pending').length;
  const countApproved = allOrgs.filter(o => o.status === 'approved').length;
  const countRejected = allOrgs.filter(o => o.status === 'rejected').length;

  const openCreateChildModal = useCallback((parentOrg: Organization) => {
    setEditingOrg(null);
    form.resetFields();
    form.setFieldsValue({
      parentId: parentOrg.id,
      type: 'CUC',
    });
    setModalOpen(true);
  }, [form]);

  const fetchOrgs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const allRes = await organizationService.list({ page: 1, pageSize: 9999 });
      const fullList = allRes.data || [];
      setAllOrgs(fullList);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đơn vị'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  // ---- Filter / Tab handlers ----
  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterStatus(values.status || undefined);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterStatus(undefined);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setFilterStatus(key === 'all' ? undefined : key);
  }, []);

  // ---- Modal handlers ----
  const openCreateModal = useCallback(() => {
    setEditingOrg(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (org: Organization) => {
      setEditingOrg(org);
      form.setFieldsValue({
        name: org.name,
        code: org.code,
        parentId: org.parentId,
        type: org.type,
        address: org.address,
        phone: org.phone,
        contactPerson: org.contactPerson,
        contactPhone: org.contactPhone,
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const targetParentId = values.type === 'TCT' ? undefined : values.parentId;

      if (editingOrg) {
        const payload: UpdateOrganizationPayload = {
          name: values.name,
          code: values.code,
          parentId: targetParentId,
          type: values.type,
          address: values.address,
          phone: values.phone,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
        };
        await organizationService.update(editingOrg.id, payload);
        toast.success('Đã cập nhật đơn vị');
      } else {
        const payload: CreateOrganizationPayload = {
          name: values.name,
          code: values.code,
          parentId: targetParentId,
          type: values.type,
          address: values.address,
          phone: values.phone,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
        };
        await organizationService.create(payload);
        toast.success('Đã tạo đơn vị mới');
      }
      setModalOpen(false);
      fetchOrgs();
    } catch {
      // validation error — antd shows errors inline
    } finally {
      setSubmitting(false);
    }
  }, [editingOrg, form, fetchOrgs]);

  const handleDelete = useCallback(
    async (org: Organization) => {
      confirm({
        title: 'Xác nhận xóa đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: \`Bạn có chắc chắn muốn xóa đơn vị "\${org.name}"?\`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await organizationService.delete(org.id);
            toast.success('Đã xóa đơn vị thành công');
            fetchOrgs();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
          }
        },
      });
    },
    [fetchOrgs],
  );

  const handleSubmitApproval = useCallback(
    async (org: Organization) => {
      confirm({
        title: 'Xác nhận trình duyệt đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: \`Bạn có muốn gửi yêu cầu phê duyệt cho đơn vị "\${org.name}"?\`,
        okText: 'Trình duyệt',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await organizationService.submit(org.id);
            toast.success('Đã trình phê duyệt đơn vị thành công');
            fetchOrgs();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Trình duyệt thất bại');
          }
        },
      });
    },
    [fetchOrgs],
  );

  const handleApprove = useCallback(
    async (org: Organization) => {
      confirm({
        title: 'Xác nhận phê duyệt đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: \`Bạn có chắc chắn muốn phê duyệt đơn vị "\${org.name}"?\`,
        okText: 'Phê duyệt',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await organizationService.approve(org.id);
            toast.success('Đã phê duyệt đơn vị thành công');
            fetchOrgs();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
          }
        },
      });
    },
    [fetchOrgs],
  );

  const handleReject = useCallback(
    async (org: Organization) => {
      let comments = '';
      confirm({
        title: 'Xác nhận từ chối đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>Bạn có chắc chắn muốn từ chối đơn vị "{org.name}"?</p>
            <Input
              placeholder="Nhập lý do từ chối (tùy chọn)"
              onChange={(e) => { comments = e.target.value; }}
              style={{ marginTop: 10 }}
            />
          </div>
        ),
        okText: 'Từ chối',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await organizationService.reject(org.id, comments);
            toast.success('Đã từ chối đơn vị');
            fetchOrgs();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
          }
        },
      });
    },
    [fetchOrgs],
  );

  const buildTreeData = useCallback((orgs: Organization[], parentId?: string): any[] => {
    return orgs
      .filter((o) => parentId ? o.parentId === parentId : !o.parentId)
      .sort((a, b) => {
        const levelDiff = (a.level || 1) - (b.level || 1);
        if (levelDiff !== 0) return levelDiff;
        return a.name.localeCompare(b.name, 'vi');
      })
      .map((org) => {
        return {
          key: org.id,
          title: (
            <Space size={8}>
              <Typography.Text strong>{org.name}</Typography.Text>
              {org.code && <Typography.Text type="secondary" style={{ fontSize: 12 }}>({org.code})</Typography.Text>}
              <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 8, fontSize: fontSizeSm, fontWeight: fontWeightMedium, background: \`\${dataSea1}15\`, color: dataSea1 }}>C{org.level}</span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: \`\${STATUS_MAP[org.status]?.color}15\`, color: STATUS_MAP[org.status]?.color }}>
                {STATUS_MAP[org.status]?.label || org.status}
              </span>
              <Space size={4} style={{ marginLeft: 16 }}>
                {hasPerm('org.edit') && (
                  <Tooltip title="Sửa">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => { e.stopPropagation(); openEditModal(org); }}
                      style={{ color: actionPrimary, padding: '0 4px', height: 'auto' }}
                    />
                  </Tooltip>
                )}
                {hasPerm('org.create') && (
                  <Tooltip title="Thêm đơn vị con">
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={(e) => { e.stopPropagation(); openCreateChildModal(org); }}
                      style={{ color: statusOperational, padding: '0 4px', height: 'auto' }}
                    />
                  </Tooltip>
                )}
                {hasPerm('org.edit') && (org.status === 'draft' || org.status === 'rejected') && (
                  <Tooltip title="Trình duyệt">
                    <Button
                      type="text"
                      size="small"
                      icon={<SendOutlined />}
                      onClick={(e) => { e.stopPropagation(); handleSubmitApproval(org); }}
                      style={{ color: actionPrimary, padding: '0 4px', height: 'auto' }}
                    />
                  </Tooltip>
                )}
                {hasPerm('org.approve') && org.status === 'pending' && (
                  <>
                    <Tooltip title="Phê duyệt">
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleApprove(org); }}
                        style={{ color: statusOperational, padding: '0 4px', height: 'auto' }}
                      />
                    </Tooltip>
                    <Tooltip title="Từ chối">
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleReject(org); }}
                        style={{ color: statusCritical, padding: '0 4px', height: 'auto' }}
                      />
                    </Tooltip>
                  </>
                )}
                {hasPerm('org.delete') && (
                  <Tooltip title="Xóa">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => { e.stopPropagation(); handleDelete(org); }}
                      style={{ padding: '0 4px', height: 'auto' }}
                    />
                  </Tooltip>
                )}
              </Space>
            </Space>
          ),
          children: buildTreeData(orgs, org.id),
        };
      });
  }, [hasPerm, openEditModal, openCreateChildModal, handleSubmitApproval, handleApprove, handleReject, handleDelete]);

  const getFilteredOrgs = useCallback(() => {
    if (!search && !filterStatus) return allOrgs;

    const matchedIds = new Set<string>();
    allOrgs.forEach(o => {
      const matchesSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || (o.address || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !filterStatus || o.status.toLowerCase() === filterStatus.toLowerCase();
      if (matchesSearch && matchesStatus) {
        matchedIds.add(o.id);
      }
    });

    const resultIds = new Set<string>();
    const addNodeAndAncestors = (org: Organization) => {
      if (resultIds.has(org.id)) return;
      resultIds.add(org.id);
      if (org.parentId) {
        const parent = allOrgs.find(o => o.id === org.parentId);
        if (parent) {
          addNodeAndAncestors(parent);
        }
      }
    };

    allOrgs.forEach(o => {
      if (matchedIds.has(o.id)) {
        addNodeAndAncestors(o);
      }
    });

    return allOrgs.filter(o => resultIds.has(o.id));
  }, [allOrgs, search, filterStatus]);

  const filteredOrgs = getFilteredOrgs();

  // Header actions
  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('org.create')) {
      actions.push({ key: 'create', label: 'Thêm đơn vị', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    }
    actions.push({ key: 'export', label: '', variant: 'subtle' as const, icon: <FileExcelOutlined style={{ color: statusOperational }} />, borderColor: \`\${statusOperational}80\`, color: statusOperational, onClick: () => {} });
    return actions;
  }, [hasPerm, openCreateModal]);

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý đơn vị' }]}
        actions={headerActions}
      />

      <FilterBar
        fields={[
          { key: 'search', type: 'search', label: 'Tìm kiếm', placeholder: 'Tìm theo tên, địa chỉ...' },
          { key: 'status', type: 'select', label: 'Trạng thái', placeholder: 'Chọn trạng thái',
            options: [
              { value: 'draft', label: 'Bản nháp' },
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'approved', label: 'Đã phê duyệt' },
              { value: 'rejected', label: 'Bị từ chối' },
            ] },
        ]}
        onSearch={handleFilterSearch}
        onReset={handleFilterReset}
      />

      <div style={{ ...cardStyle, marginBottom: 4, display: 'flex', justifyContent: 'center', padding: '8px 16px' }}>
        <StatusTabs
          tabs={[
            { key: 'all', label: 'Tất cả', count: totalAll, color: textSecondary, active: !filterStatus },
            { key: 'draft', label: 'Bản nháp', count: countDraft, color: statusDraft, active: filterStatus === 'draft' },
            { key: 'pending', label: 'Chờ duyệt', count: countPending, color: statusAttention, active: filterStatus === 'pending' },
            { key: 'approved', label: 'Đã phê duyệt', count: countApproved, color: statusOperational, active: filterStatus === 'approved' },
            { key: 'rejected', label: 'Bị từ chối', count: countRejected, color: statusCritical, active: filterStatus === 'rejected' },
          ]}
          onChange={handleTabChange}
        />
      </div>

      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {isLoading && <LoadingSkeleton rows={8} type="card" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách đơn vị'}
            onRetry={fetchOrgs}
          />
        )}
        {!isLoading && !isError && filteredOrgs.length === 0 && (
          <EmptyState
            description={search || filterStatus ? 'Không tìm thấy đơn vị' : 'Chưa có đơn vị nào'}
            ctaText="Thêm đơn vị đầu tiên"
            onCta={openCreateModal}
          />
        )}
        {!isLoading && !isError && filteredOrgs.length > 0 && (
          <Tree
            treeData={buildTreeData(filteredOrgs)}
            defaultExpandedAll
            showLine
            showIcon={false}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingOrg ? 'Sửa đơn vị' : 'Thêm mới đơn vị'}</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        width={600}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="ok" type="primary" onClick={handleSubmit} loading={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>{editingOrg ? 'Cập nhật' : 'Tạo mới'}</Button>,
        ]}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}
            labelCol={{ style: { padding: 0, marginBottom: 4 } }}
          >
            <Form.Item
              name="name"
              {...labelProps('Tên đơn vị')}
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}
            >
              <Input placeholder="vd: Phòng Kỹ thuật" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>

            <Form.Item
              name="code"
              {...labelProps('Mã đơn vị')}
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng nhập mã đơn vị' }]}
            >
              <Input placeholder="vd: KT01" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>

            <Form.Item
              name="type"
              {...labelProps('Loại đơn vị')}
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng chọn loại đơn vị' }]}
            >
              <Select
                placeholder="Chọn loại đơn vị"
                style={{ borderRadius: radiusPill, height: 40 }}
                options={[
                  { value: 'TCT', label: 'Tổng cục' },
                  { value: 'CUC', label: 'Cục' },
                  { value: 'CHI_CUC', label: 'Chi cục' },
                  { value: 'CANG_VU', label: 'Cảng vụ' },
                ]}
              />
            </Form.Item>

            {selectedType !== 'TCT' && (
              <Form.Item
                name="parentId"
                {...labelProps('Đơn vị cha')}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn đơn vị cha (tùy chọn)"
                  allowClear
                  style={{ borderRadius: radiusPill, height: 40 }}
                  options={allOrgs
                    .filter((o) => !editingOrg || o.id !== editingOrg.id)
                    .map((o) => ({
                      value: o.id,
                      label: o.name,
                    }))}
                />
              </Form.Item>
            )}

            <Form.Item
              name="address"
              {...labelProps('Trụ sở')}
              style={{ marginBottom: spaceFormField }}
            >
              <Input placeholder="Địa chỉ trụ sở (tùy chọn)" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>

            <div style={{ display: 'flex', gap: spaceFormField }}>
              <div style={{ flex: 1 }}>
                <Form.Item
                  name="contactPerson"
                  {...labelProps('Trưởng đơn vị')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input placeholder="Tên người phụ trách (tùy chọn)" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </div>
              <div style={{ flex: 1 }}>
                <Form.Item
                  name="contactPhone"
                  {...labelProps('Số điện thoại')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]}
                >
                  <Input placeholder="0901234567" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </div>
            </div>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}
```

---

## Patch Content — UnitTree.tsx

Apply the following full content to `frontend/src/pages/organizations/UnitTree.tsx`:

```tsx
import { useState, useCallback, useEffect } from 'react';
import { Tree, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { ScreenHeader } from '../../components/list-view';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { statusOperational, statusAttention, statusCritical, statusDraft, cardStyle, dataSea1, fontSizeMd, fontSizeSm, fontWeightMedium } from '../../tokens';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  draft: { color: statusDraft, label: 'Bản nháp' },
  pending: { color: statusAttention, label: 'Chờ duyệt' },
  approved: { color: statusOperational, label: 'Đã phê duyệt' },
  rejected: { color: statusCritical, label: 'Bị từ chối' },
};

interface OrgTreeNode {
  key: string;
  title: React.ReactNode;
  isLeaf?: boolean;
  children?: OrgTreeNode[];
}

function buildTree(orgs: Organization[], parentId?: string): OrgTreeNode[] {
  return orgs
    .filter((o) => parentId ? o.parentId === parentId : !o.parentId)
    .map((org) => ({
      key: org.id,
      title: (
        <Space>
          <Typography.Text strong>{org.name}</Typography.Text>
          <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 8, fontSize: fontSizeSm, fontWeight: fontWeightMedium, background: \`\${dataSea1}15\`, color: dataSea1 }}>C{org.level}</span>
          <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: \`\${STATUS_MAP[org.status]?.color}15\`, color: STATUS_MAP[org.status]?.color }}>
            {STATUS_MAP[org.status]?.label || org.status}
          </span>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {org.childCount} đơn vị con
          </Typography.Text>
        </Space>
      ),
      isLeaf: org.childCount === 0,
      children: buildTree(orgs, org.id),
    }));
}

export default function UnitTree() {
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState<OrgTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadTree = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const orgs = await organizationService.getTree();
      setDataSource(buildTree(orgs));
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải cây đơn vị'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadTree(); }, []);

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[
          { label: 'Quản trị hệ thống' },
          { label: 'Quản lý đơn vị', path: '/organizations' },
          { label: 'Cây cấu trúc đơn vị' },
        ]}
        actions={[]}
      />

      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {isLoading && <LoadingSkeleton rows={10} type="card" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải cây đơn vị'}
            onRetry={loadTree}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState description="Chưa có đơn vị nào trong hệ thống" />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <Tree
            treeData={dataSource}
            defaultExpandedAll
            showLine
            showIcon={false}
          />
        )}
      </div>
    </div>
  );
}
```
