import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Tooltip,
  Badge,
  Modal,
  Form,
  Spin,
  Tree,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  BranchesOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  FolderOpenOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { organizationService } from '../../services/organizationService';
import type { Organization, CreateOrganizationPayload, UpdateOrganizationPayload } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: 'Bản nháp' },
  pending: { color: 'orange', label: 'Chờ duyệt' },
  approved: { color: 'green', label: 'Đã phê duyệt' },
  rejected: { color: 'red', label: 'Bị từ chối' },
};

const customStyles = `
  .custom-tree {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .custom-tree ul {
    list-style: none;
    padding-left: 28px;
    position: relative;
    margin: 0;
  }
  .custom-tree ul::before {
    content: '';
    position: absolute;
    left: 11px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e2e8f0;
    border-radius: 1px;
  }
  .custom-tree .node {
    position: relative;
    margin: 8px 0;
  }
  .custom-tree .node-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
    border: 1px solid #e2e8f0;
    transition: all 0.15s ease-in-out;
    position: relative;
  }
  .custom-tree .node-row:hover {
    border-color: #94a3b8;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .custom-tree .node-row.level-1 {
    border-left: 4px solid #1E40AF;
  }
  .custom-tree .node-row.level-2 {
    border-left: 4px solid #0D9488;
  }
  .custom-tree .node-row.level-3 {
    border-left: 4px solid #D97706;
  }
  .custom-tree .toggle {
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 5px;
    flex-shrink: 0;
    transition: transform 0.2s ease, background 0.2s ease;
    color: #64748b;
    font-size: 10px;
    user-select: none;
  }
  .custom-tree .toggle:hover {
    background: #f1f5f9;
  }
  .custom-tree .toggle.open {
    transform: rotate(90deg);
  }
  .custom-tree .toggle.leaf {
    visibility: hidden;
  }
  .custom-tree .badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 12px;
    flex-shrink: 0;
    letter-spacing: 0.5px;
    display: inline-block;
    line-height: 1.2;
  }
  .custom-tree .badge.l1 {
    background: #DBEAFE;
    color: #1E40AF;
  }
  .custom-tree .badge.l2 {
    background: #CCFBF1;
    color: #0D9488;
  }
  .custom-tree .badge.l3 {
    background: #FEF3C7;
    color: #D97706;
  }
  .custom-tree .name {
    font-size: 14px;
    font-weight: 600;
    flex: 1;
    color: #1e293b;
  }
  .custom-tree .code {
    font-size: 11px;
    color: #64748b;
    margin-left: 8px;
    font-weight: 400;
  }
  .custom-tree .actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .custom-tree .actions button {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    background: transparent;
    color: #64748b;
    font-size: 14px;
    padding: 0;
  }
  .custom-tree .actions .btn-view:hover {
    background: #DBEAFE;
    color: #2563EB;
  }
  .custom-tree .actions .btn-edit:hover {
    background: #FEF3C7;
    color: #D97706;
  }
  .custom-tree .actions .btn-delete:hover {
    background: #FEE2E2;
    color: #EF4444;
  }
  .custom-tree .actions .btn-add:hover {
    background: #D1FAE5;
    color: #059669;
  }
  .custom-tree .hidden {
    display: none !important;
  }
`;

export default function UnitList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const { modal } = App.useApp();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Expanded keys & Detail modal state
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [form] = Form.useForm();
  const selectedType = Form.useWatch('type', form);
  const [submitting, setSubmitting] = useState(false);

  const openCreateChildModal = useCallback((parentOrg: Organization) => {
    setEditingOrg(null);
    form.resetFields();
    form.setFieldsValue({
      parentId: parentOrg.id,
      type: 'CUC'
    });
    setModalOpen(true);
  }, [form]);

  const fetchOrgs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      // Fetch full list once to get all parent dropdown options and base data
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

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
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

  const openViewModal = useCallback((org: Organization) => {
    setViewingOrg(org);
    setDetailModalOpen(true);
  }, []);

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
      modal.confirm({
        title: 'Xác nhận xóa đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn xóa đơn vị "${org.name}"?`,
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
      modal.confirm({
        title: 'Xác nhận trình duyệt đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có muốn gửi yêu cầu phê duyệt cho đơn vị "${org.name}"?`,
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
      modal.confirm({
        title: 'Xác nhận phê duyệt đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn phê duyệt đơn vị "${org.name}"?`,
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
      modal.confirm({
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

  // Tải lại, mở hết, thu gọn
  const toggleNode = useCallback((id: string) => {
    setExpandedKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handleExpandAll = useCallback(() => {
    const keys: Record<string, boolean> = {};
    const walk = (orgs: Organization[]) => {
      orgs.forEach(o => {
        const hasChildren = allOrgs.some(child => child.parentId === o.id);
        if (hasChildren) {
          keys[o.id] = true;
        }
      });
    };
    walk(allOrgs);
    setExpandedKeys(keys);
  }, [allOrgs]);

  const handleCollapseAll = useCallback(() => {
    setExpandedKeys({});
  }, []);

  // Tự động bung rộng cây khi danh sách lọc thay đổi (ví dụ khi tìm kiếm)
  useEffect(() => {
    if (filteredOrgs.length > 0) {
      setExpandedKeys(prev => {
        const next = { ...prev };
        filteredOrgs.forEach(o => {
          next[o.id] = true;
        });
        return next;
      });
    }
  }, [filteredOrgs]);

  // Khởi tạo bung rộng cây lúc bắt đầu
  useEffect(() => {
    if (allOrgs.length > 0 && Object.keys(expandedKeys).length === 0) {
      const initialKeys: Record<string, boolean> = {};
      allOrgs.forEach(o => {
        initialKeys[o.id] = true;
      });
      setExpandedKeys(initialKeys);
    }
  }, [allOrgs, expandedKeys]);

  // Hàm render đệ quy cây đơn vị theo giao diện HTML
  const renderTreeNodes = (orgs: Organization[], parentId?: string): React.ReactNode => {
    const levelOrgs = orgs
      .filter((o) => parentId ? o.parentId === parentId : !o.parentId)
      .sort((a, b) => {
        const levelDiff = (a.level || 1) - (b.level || 1);
        if (levelDiff !== 0) return levelDiff;
        return a.name.localeCompare(b.name, 'vi');
      });

    if (levelOrgs.length === 0) return null;

    return (
      <ul className={parentId ? 'custom-tree-sub' : 'custom-tree-root'}>
        {levelOrgs.map((org) => {
          const hasChildren = orgs.some(child => child.parentId === org.id);
          const isExpanded = !!expandedKeys[org.id];
          const level = org.level || 1;
          const badgeLabel = `Cấp ${level}`;
          const badgeClass = level === 1 ? 'l1' : level === 2 ? 'l2' : 'l3';

          return (
            <li className="node" key={org.id}>
              <div className={`node-row level-${level}`}>
                <span 
                  className={`toggle ${hasChildren ? (isExpanded ? 'open' : '') : 'leaf'}`}
                  onClick={() => toggleNode(org.id)}
                >
                  ▶
                </span>
                <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                <span className="name">
                  {org.name}
                  {org.code && <span className="code">{org.code}</span>}
                </span>
                
                <span className="actions">
                  <button 
                    className="btn-view" 
                    title="Xem chi tiết" 
                    onClick={() => openViewModal(org)}
                  >
                    👁
                  </button>
                  {hasPerm('org.edit') && (
                    <button 
                      className="btn-edit" 
                      title="Sửa" 
                      onClick={() => openEditModal(org)}
                    >
                      ✏
                    </button>
                  )}
                  {hasPerm('org.create') && level < 3 && (
                    <button 
                      className="btn-add" 
                      title="Thêm đơn vị con" 
                      onClick={() => openCreateChildModal(org)}
                    >
                      ➕
                    </button>
                  )}
                  {hasPerm('org.delete') && (
                    <button 
                      className="btn-delete" 
                      title="Xóa" 
                      onClick={() => handleDelete(org)}
                    >
                      🗑
                    </button>
                  )}
                </span>
              </div>
              {hasChildren && isExpanded && renderTreeNodes(orgs, org.id)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, địa chỉ..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: 150 }}
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                options={[
                  { value: 'draft', label: 'Bản nháp' },
                  { value: 'pending', label: 'Chờ duyệt' },
                  { value: 'approved', label: 'Đã phê duyệt' },
                  { value: 'rejected', label: 'Bị từ chối' },
                ]}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchOrgs} />
              </Tooltip>
              {hasPerm('org.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                  Thêm đơn vị
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
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
          <div className="custom-tree">
            {renderTreeNodes(filteredOrgs)}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>👁 Chi tiết đơn vị</span>
            {viewingOrg && (
              <span 
                className={`custom-tree badge ${viewingOrg.level === 1 ? 'l1' : viewingOrg.level === 2 ? 'l2' : 'l3'}`}
                style={{ fontSize: 11, padding: '2px 8px' }}
              >
                Cấp {viewingOrg.level}
              </span>
            )}
          </div>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            Đóng
          </Button>,
          hasPerm('org.edit') && viewingOrg && (
            <Button 
              key="edit" 
              type="primary" 
              onClick={() => {
                setDetailModalOpen(false);
                openEditModal(viewingOrg);
              }}
            >
              Chỉnh sửa
            </Button>
          )
        ].filter(Boolean)}
        width={600}
      >
        {viewingOrg && (
          <div style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 700 }}>{viewingOrg.name}</h2>
            <div className="detail-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Mã đơn vị</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{viewingOrg.code}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Loại đơn vị</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{
                  viewingOrg.type === 'TCT' ? 'Tổng cục' :
                  viewingOrg.type === 'CUC' ? 'Cục' :
                  viewingOrg.type === 'CHI_CUC' ? 'Chi cục' :
                  viewingOrg.type === 'CANG_VU' ? 'Cảng vụ' : viewingOrg.type
                }</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Trưởng đơn vị</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{viewingOrg.contactPerson || '—'}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Số điện thoại</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{viewingOrg.contactPhone || '—'}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Trụ sở / Địa chỉ</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{viewingOrg.address || '—'}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Đơn vị cấp trên</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {allOrgs.find(o => o.id === viewingOrg.parentId)?.name || '— (Đơn vị gốc)'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Trạng thái</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  <Tag color={STATUS_MAP[viewingOrg.status]?.color || 'default'}>
                    {STATUS_MAP[viewingOrg.status]?.label || viewingOrg.status}
                  </Tag>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Modal */}
      <Modal
        title={editingOrg ? 'Sửa đơn vị' : 'Thêm mới đơn vị'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        okText={editingOrg ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={600}
        mask={{ closable: false }}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="name"
              label="Tên đơn vị"
              rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}
            >
              <Input placeholder="vd: Phòng Kỹ thuật" />
            </Form.Item>

            <Form.Item
              name="code"
              label="Mã đơn vị"
              rules={[{ required: true, message: 'Vui lòng nhập mã đơn vị' }]}
            >
              <Input placeholder="vd: KT01" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Loại đơn vị"
              rules={[{ required: true, message: 'Vui lòng chọn loại đơn vị' }]}
            >
              <Select
                placeholder="Chọn loại đơn vị"
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
                label="Đơn vị cha"
              >
                <Select
                  placeholder="Chọn đơn vị cha (tùy chọn)"
                  allowClear
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
              label="Trụ sở"
            >
              <Input placeholder="Địa chỉ trụ sở (tùy chọn)" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="contactPerson"
                  label="Trưởng đơn vị"
                >
                  <Input placeholder="Tên người phụ trách (tùy chọn)" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="contactPhone"
                  label="Số điện thoại"
                  rules={[{ pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]}
                >
                  <Input placeholder="0901234567" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
