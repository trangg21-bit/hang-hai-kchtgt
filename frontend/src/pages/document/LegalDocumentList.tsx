import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Modal, Form, Input, DatePicker, Button, Upload, Spin, Select, Alert, Drawer, Row, Col } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  fetchLegalDocumentList,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  uploadLegalDocumentAttachment,
  fetchLegalDocumentHistory,
} from '../../services/document/api';
import type {
  LegalDocumentResponse,
  LegalDocumentCreateRequest,
  LegalDocumentHistoryResponse,
} from '../../services/document/types';
import dayjs from 'dayjs';
import api from '../../services/api';
import { usePermissionStore } from '../../store/permissionStore';
import EmptyState from '../../components/EmptyState';
import {
  ScreenHeader,
  FilterTableLayout,
  DataTable,
} from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import toast from '../../components/ToastNotification';
import {
  actionPrimary,
  textSecondary,
  fontWeightBold,
  fontWeightMedium,
  fontSizeMd,
  fontSizeLg,
  cardStyle,
  radiusPill,
  borderDefault,
  spaceFormField,
  spaceLg,
  spaceMd,
  spaceSm,
  spaceXs,
  statusOperational,
  statusAttention,
  statusDraft,
  radiusSm,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  selectStyle,
} from '../../tokens';
import { colors } from '../../theme';

const { Dragger } = Upload;

const DOCUMENT_TYPE_MAP: Record<string, string> = {
  DECISION: 'Quyết định',
  CIRCULAR: 'Thông tư',
  DECREE: 'Nghị định',
  LAW: 'Luật',
};

const VALIDITY_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  EFFECTIVE: 'Còn hiệu lực',
  EXPIRING_SOON: 'Sắp hết hiệu lực',
  EXPIRED: 'Đã hết hiệu lực',
};

const HISTORY_ACTION_MAP: Record<string, string> = {
  CREATED: 'Tạo mới',
  UPDATED: 'Cập nhật',
  DELETED: 'Xóa',
  EXPIRED: 'Hết hiệu lực',
  DRAFT_SAVED: 'Lưu bản nháp',
  ATTACHMENT_UPLOADED: 'Tải lên tệp đính kèm',
  ATTACHMENT_DELETED: 'Xóa tệp đính kèm',
};

const VALIDITY_STATUS_COLOR: Record<string, string> = {
  DRAFT: textSecondary,
  EFFECTIVE: statusOperational,
  EXPIRING_SOON: statusAttention,
  EXPIRED: statusDraft,
};

function formatDate(value: string | undefined): string {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';
}

function formatDateShort(value: string | undefined): string {
  return value ? dayjs(value).format('DD/MM/YYYY') : '—';
}

export default function LegalDocumentList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [documentType, setDocumentType] = useState<string | undefined>(undefined);
  const [documentTypeInput, setDocumentTypeInput] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [statusInput, setStatusInput] = useState<string | undefined>(undefined);
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [issuingAuthorityInput, setIssuingAuthorityInput] = useState('');
  const [applicationArea, setApplicationArea] = useState('');
  const [applicationAreaInput, setApplicationAreaInput] = useState('');
  const [issueDateStart, setIssueDateStart] = useState<string | null>(null);
  const [issueDateEnd, setIssueDateEnd] = useState<string | null>(null);
  const [issueDateStartInput, setIssueDateStartInput] = useState<string | null>(null);
  const [issueDateEndInput, setIssueDateEndInput] = useState<string | null>(null);

  const [dataSource, setDataSource] = useState<LegalDocumentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LegalDocumentResponse | null>(null);
  const [history, setHistory] = useState<LegalDocumentHistoryResponse[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const attachedFileList = useMemo(() => {
    const existing = (editingItem?.attachedDocuments || []).map((doc) => ({
      uid: doc.id,
      name: doc.documentName,
      status: 'done' as const,
      size: doc.fileSize,
    }));
    return [...existing, ...pendingAttachments];
  }, [editingItem, pendingAttachments]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchLegalDocumentList({
        page: page - 1,
        size: pageSize,
        keyword: keyword.trim() || undefined,
        issuingAuthority: issuingAuthority.trim() || undefined,
        type: documentType || undefined,
        status: status || undefined,
        applicationArea: applicationArea.trim() || undefined,
        issueDateStart: issueDateStart || undefined,
        issueDateEnd: issueDateEnd || undefined,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
      const sc = res.statusCounts || {};
      const draft = Number(sc.DRAFT) || 0;
      const effective = Number(sc.EFFECTIVE) || 0;
      const expiring = Number(sc.EXPIRING_SOON) || 0;
      const expired = Number(sc.EXPIRED) || 0;
      setCountDraft(draft);
      setCountEffective(effective);
      setCountExpiring(expiring);
      setCountExpired(expired);
      setCountAll(draft + effective + expiring + expired);
      setIsError(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể tải danh sách văn bản pháp lý');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, issuingAuthority, documentType, status, applicationArea, issueDateStart, issueDateEnd]);

  useEffect(() => { loadData(); }, [loadData]);

  const [countAll, setCountAll] = useState(0);
  const [countDraft, setCountDraft] = useState(0);
  const [countEffective, setCountEffective] = useState(0);
  const [countExpiring, setCountExpiring] = useState(0);
  const [countExpired, setCountExpired] = useState(0);

  const handleOpenModal = useCallback((record?: LegalDocumentResponse) => {
    if (record) {
      setEditingItem(record);
      setPendingAttachments([]);
      form.setFieldsValue({
        documentNumber: record.documentNumber,
        documentName: record.documentName,
        documentType: record.documentType,
        signer: record.signer,
        issueDate: record.issueDate ? dayjs(record.issueDate) : null,
        effectiveDate: record.effectiveDate ? dayjs(record.effectiveDate) : null,
        expirationDate: record.expirationDate ? dayjs(record.expirationDate) : null,
        issuingAuthority: record.issuingAuthority,
        validityStatus: record.validityStatus,
        applicationArea: record.applicationArea,
        description: record.description,
      });
    } else {
      setEditingItem(null);
      setPendingAttachments([]);
      form.resetFields();
    }
    setIsModalOpen(true);
  }, [form]);

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    setPendingAttachments([]);
    form.resetFields();
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload: LegalDocumentCreateRequest = {
        ...values,
        issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : '',
        effectiveDate: values.effectiveDate ? values.effectiveDate.format('YYYY-MM-DD') : '',
        expirationDate: values.expirationDate ? values.expirationDate.format('YYYY-MM-DD') : undefined,
      };

      let documentId: string;
      if (editingItem) {
        await updateLegalDocument(editingItem.id, payload);
        documentId = editingItem.id;
        toast.success('Cập nhật văn bản pháp lý thành công!');
      } else {
        const created = await createLegalDocument(payload);
        documentId = created.id;
        setEditingItem(created);
        toast.success('Tạo văn bản pháp lý thành công!');
      }

      for (const pendingFile of pendingAttachments) {
        if (!pendingFile.originFileObj) continue;
        try {
          await uploadLegalDocumentAttachment(documentId, pendingFile.originFileObj);
        } catch (err: any) {
          toast.error(err.message || 'Lỗi tải lên tệp đính kèm');
        }
      }

      setIsModalOpen(false);
      setPendingAttachments([]);
      form.resetFields();
      loadData();
    } catch (err: any) {
      if (err.errorFields) return;
      toast.error(err.message || 'Có lỗi xảy ra khi lưu văn bản');
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, form, pendingAttachments, loadData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteLegalDocument(id);
      toast.success('Xóa văn bản pháp lý thành công!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa văn bản');
    }
  }, [loadData]);

  const handleExportPdf = useCallback(async (id: string) => {
    try {
      const resp = await api.get(`/v1/legal-documents/${id}/export`, {
        responseType: 'blob',
      });
      const blob = resp.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải PDF');
    }
  }, []);

  const handleHistory = useCallback(async (record: LegalDocumentResponse) => {
    try {
      setHistory(await fetchLegalDocumentHistory(record.id));
      setHistoryOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải lịch sử văn bản');
    }
  }, []);

  const handleFilterSearch = useCallback(() => {
    setKeyword(keywordInput.trim());
    setIssuingAuthority(issuingAuthorityInput.trim());
    setDocumentType(documentTypeInput);
    setStatus(statusInput);
    setApplicationArea(applicationAreaInput.trim());
    setIssueDateStart(issueDateStartInput);
    setIssueDateEnd(issueDateEndInput);
    setPage(1);
  }, [applicationAreaInput, documentTypeInput, issueDateEndInput, issueDateStartInput, issuingAuthorityInput, keywordInput, statusInput]);

  const handleFilterReset = useCallback(() => {
    setKeyword('');
    setKeywordInput('');
    setIssuingAuthority('');
    setIssuingAuthorityInput('');
    setDocumentType(undefined);
    setDocumentTypeInput(undefined);
    setStatus(undefined);
    setStatusInput(undefined);
    setApplicationArea('');
    setApplicationAreaInput('');
    setIssueDateStart(null);
    setIssueDateEnd(null);
    setIssueDateStartInput(null);
    setIssueDateEndInput(null);
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    const nextStatus = key === 'all' ? undefined : key;
    setStatus(nextStatus);
    setStatusInput(nextStatus);
    setPage(1);
  }, []);

  const columns = useMemo(() => [
    {
      key: 'stt', label: 'STT', width: 60, align: 'center' as const, fixed: 'left' as const,
      render: (_: unknown, __: unknown, idx: number) => (page - 1) * pageSize + idx + 1
    },
    { key: 'documentNumber', label: 'Số hiệu văn bản', dataIndex: 'documentNumber', width: 160, sortable: true },
    {
      key: 'documentName', label: 'Tên văn bản pháp lý', dataIndex: 'documentName', width: 280, sortable: true,
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>
    },
    {
      key: 'issueDate', label: 'Ngày ban hành', dataIndex: 'issueDate', width: 130, sortable: true, align: 'center' as const,
      render: (val: string) => formatDateShort(val)
    },
    {
      key: 'effectiveDate', label: 'Ngày hiệu lực', dataIndex: 'effectiveDate', width: 130, sortable: true, align: 'center' as const,
      render: (val: string) => formatDateShort(val)
    },
    {
      key: 'documentType', label: 'Loại văn bản', dataIndex: 'documentType', width: 130, sortable: true, align: 'center' as const,
      render: (val: string) => DOCUMENT_TYPE_MAP[val] || val || '—'
    },
    { key: 'issuingAuthority', label: 'Cơ quan ban hành', dataIndex: 'issuingAuthority', width: 200, sortable: true },
    { key: 'signer', label: 'Người ký', dataIndex: 'signer', width: 140 },
    {
      key: 'validityStatus', label: 'Trạng thái', dataIndex: 'validityStatus', width: 150, sortable: true, align: 'center' as const,
      render: (val: string) => {
        const color = VALIDITY_STATUS_COLOR[val] || textSecondary;
        const label = VALIDITY_STATUS_MAP[val] || val || '';
        return <span style={{
          display: 'inline-flex', alignItems: 'center', gap: spaceXs, padding: `${spaceXs}px ${spaceSm}px`,
          border: `1px solid ${color}40`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium,
          background: `${color}15`, color,
        }}>{label}</span>;
      }
    },
    {
      key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 150, sortable: true, align: 'center' as const,
      render: (val: string) => formatDate(val)
    },
  ], [page, pageSize]);

  const rowActions = useCallback((record: LegalDocumentResponse) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    if (hasPerm('document:read')) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => handleOpenModal(record) });
      actions.push({ key: 'history', label: 'Lịch sử', icon: <EyeOutlined />, onClick: () => handleHistory(record) });
      actions.push({ key: 'export-pdf', label: 'Xuất PDF', icon: <DownloadOutlined />, onClick: () => handleExportPdf(record.id) });
    }
    if (hasPerm('document:update') && record.validityStatus !== 'EXPIRED') {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => handleOpenModal(record) });
    }
    if (hasPerm('document:delete')) {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.id) });
    }
    return actions;
  }, [hasPerm, handleHistory, handleExportPdf, handleOpenModal, handleDelete]);

  const statusTabs = useMemo(() => [
    { key: 'all', label: 'Tất cả', count: countAll, color: textSecondary, active: !status },
    { key: 'DRAFT', label: 'Lưu tạm', count: countDraft, color: textSecondary, active: status === 'DRAFT' },
    { key: 'EFFECTIVE', label: 'Còn hiệu lực', count: countEffective, color: statusOperational, active: status === 'EFFECTIVE' },
    { key: 'EXPIRING_SOON', label: 'Sắp hết hiệu lực', count: countExpiring, color: statusAttention, active: status === 'EXPIRING_SOON' },
    { key: 'EXPIRED', label: 'Đã hết hiệu lực', count: countExpired, color: statusDraft, active: status === 'EXPIRED' },
  ], [status, countAll, countDraft, countEffective, countExpiring, countExpired]);

  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tìm kiếm</div>
        <Input placeholder="Tìm theo tên văn bản..." allowClear
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onPressEnter={handleFilterSearch}
          style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Cơ quan</div>
        <Input placeholder="Cơ quan ban hành..." allowClear
          value={issuingAuthorityInput}
          onChange={(e) => setIssuingAuthorityInput(e.target.value)}
          style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Phạm vi</div>
        <Input placeholder="Phạm vi áp dụng..." allowClear
          value={applicationAreaInput}
          onChange={(e) => setApplicationAreaInput(e.target.value)}
          style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Loại văn bản</div>
        <Select placeholder="Tất cả" allowClear
          value={documentTypeInput}
          onChange={setDocumentTypeInput}
          style={{ ...selectStyle, width: '100%' }}>
          <Select.Option value="LAW">Luật</Select.Option>
          <Select.Option value="DECREE">Nghị định</Select.Option>
          <Select.Option value="CIRCULAR">Thông tư</Select.Option>
          <Select.Option value="DECISION">Quyết định</Select.Option>
        </Select>
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Trạng thái</div>
        <Select placeholder="Tất cả" allowClear
          value={statusInput}
          onChange={setStatusInput}
          style={{ ...selectStyle, width: '100%' }}>
          <Select.Option value="DRAFT">Lưu tạm</Select.Option>
          <Select.Option value="EFFECTIVE">Còn hiệu lực</Select.Option>
          <Select.Option value="EXPIRING_SOON">Sắp hết hiệu lực</Select.Option>
          <Select.Option value="EXPIRED">Đã hết hiệu lực</Select.Option>
        </Select>
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Ngày ban hành</div>
        <DatePicker.RangePicker
          value={issueDateStartInput && issueDateEndInput ? [dayjs(issueDateStartInput), dayjs(issueDateEndInput)] : null}
          onChange={(dates) => {
            setIssueDateStartInput(dates ? dates[0]?.format('YYYY-MM-DD') || null : null);
            setIssueDateEndInput(dates ? dates[1]?.format('YYYY-MM-DD') || null : null);
          }}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>
    </>
  );

  const renderContent = () => {
    return <>
      <DataTable
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        rowActions={rowActions}
        loading={false}
        scroll={{ x: 'max-content' }}
        emptyState={<EmptyState description={keyword || issuingAuthority || documentType || status || applicationArea || issueDateStart || issueDateEnd
          ? 'Không tìm thấy văn bản pháp lý nào phù hợp'
          : 'Chưa có văn bản pháp lý nào'} />}
      />
      {dataSource.length > 0 && (
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      )}
    </>;
  };

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('document:create')) {
      actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => handleOpenModal() });
    }
    return actions;
  }, [hasPerm, handleOpenModal]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Văn bản pháp lý' }]} actions={headerActions} />
      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={handleFilterSearch}
        onFilterReset={handleFilterReset}
        loading={loading}
        error={isError}
        onRetry={loadData}
        filterContent={filterContent}
        statusTabs={statusTabs}
        onStatusTabChange={handleTabChange}
      >
        {renderContent()}
      </FilterTableLayout>

      <Drawer
        {...drawerProps}
        title={<span style={drawerTitleStyle}>{editingItem ? (editingItem.validityStatus === 'EXPIRED' ? 'Chi tiết văn bản (Đã hết hiệu lực)' : 'Chỉnh sửa văn bản pháp lý') : 'Thêm mới văn bản pháp lý'}</span>}
        open={isModalOpen}
        onClose={handleCancel}
        extra={<Button type="text" onClick={handleCancel} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={handleCancel} style={outlineButtonStyle}>Hủy</Button>
            {editingItem?.validityStatus !== 'EXPIRED' && (
              <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>Lưu</Button>
            )}
          </div>
        }
      >
        <Spin spinning={submitting}>
          {editingItem?.validityStatus === 'EXPIRED' && (
            <Alert
              message="Văn bản đã hết hiệu lực"
              description="Văn bản ở trạng thái Đã hết hiệu lực không được phép chỉnh sửa nội dung."
              type="warning"
              showIcon
              style={{ marginTop: 8, marginBottom: 8 }}
            />
          )}
          <Form form={form} layout="vertical" disabled={editingItem?.validityStatus === 'EXPIRED'} style={{ marginTop: 16 }}>
            <Row gutter={[spaceLg, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="documentNumber" label="Số hiệu văn bản" rules={[{ required: true, message: 'Vui lòng nhập số hiệu' }]}
                  style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Số hiệu văn bản..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="documentName" label="Tên văn bản" rules={[{ required: true, message: 'Vui lòng nhập tên văn bản' }]}
                  style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập tiêu đề văn bản..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="documentType" label="Loại văn bản" rules={[{ required: true, message: 'Vui lòng chọn loại văn bản' }]}
                  style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn loại văn bản..." style={{ borderRadius: radiusPill, height: 40 }}>
                    <Select.Option value="LAW">Luật</Select.Option>
                    <Select.Option value="DECREE">Nghị định</Select.Option>
                    <Select.Option value="CIRCULAR">Thông tư</Select.Option>
                    <Select.Option value="DECISION">Quyết định</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="issuingAuthority" label="Cơ quan ban hành" rules={[{ required: true, message: 'Vui lòng nhập cơ quan ban hành' }]}
                  style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Cơ quan ban hành..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="signer" label="Người ký" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Người ký (nếu có)..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="issueDate" label="Ngày ban hành" rules={[{ required: true, message: 'Vui lòng chọn ngày ban hành' }]}
                  style={{ marginBottom: spaceFormField }}>
                  <DatePicker style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="effectiveDate" label="Ngày có hiệu lực" rules={[{ required: true, message: 'Vui lòng chọn ngày có hiệu lực' }]}
                  style={{ marginBottom: spaceFormField }}>
                  <DatePicker style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="expirationDate" label="Ngày hết hiệu lực" style={{ marginBottom: spaceFormField }}>
                  <DatePicker style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="applicationArea" label="Phạm vi áp dụng" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Phạm vi áp dụng..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="description" label="Mô tả" style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea placeholder="Mô tả..." rows={3} style={{ borderRadius: radiusSm }} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Tệp đính kèm" style={{ marginBottom: spaceFormField }}>
                  <Dragger name="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    beforeUpload={(file) => {
                      if (file.size > 10 * 1024 * 1024) { toast.error('Kích thước mỗi tệp không được vượt quá 10MB'); return Upload.LIST_IGNORE; }
                      return true;
                    }}
                    fileList={attachedFileList}
                    showUploadList={{ showPreviewIcon: true, showRemoveIcon: true, showDownloadIcon: true }}
                    customRequest={async (options: any) => {
                      const { file, onSuccess, onError } = options;
                      const rcFile = file as RcFile;
                      if (!editingItem?.id) {
                        setPendingAttachments((current) => [...current, {
                          uid: rcFile.uid || String(Date.now()),
                          name: rcFile.name,
                          status: 'done' as const,
                          originFileObj: rcFile,
                          size: rcFile.size,
                        }]);
                        onSuccess?.({}, file);
                        return;
                      }
                      try {
                        const result = await uploadLegalDocumentAttachment(editingItem.id, rcFile);
                        onSuccess?.(result, file);
                        toast.success(`Đã tải lên: ${rcFile.name}`);
                      } catch (err: any) { onError?.(err); toast.error(`Lỗi tải lên: ${err?.message || 'Không xác định'}`); }
                    }}
                  >
                    <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                    <p className="ant-upload-text">Nhấp hoặc kéo thả tệp vào đây</p>
                    <p className="ant-upload-hint">Hỗ trợ PDF, Word, ảnh. Tối đa 10MB/tệp.</p>
                  </Dragger>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Drawer>

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Lịch sử văn bản</span>}
        open={historyOpen} onCancel={() => setHistoryOpen(false)} footer={null} width={880}
      >
        <DataTable
          columns={[
            { key: 'changedAt', label: 'Thời điểm', dataIndex: 'changedAt', width: 160, render: (val: string) => formatDate(val) },
            { key: 'action', label: 'Thao tác', dataIndex: 'action', width: 170, render: (val: string) => HISTORY_ACTION_MAP[val] || val || '—' },
            { key: 'changedBy', label: 'Người thực hiện', dataIndex: 'changedByName', width: 160, render: (val: string) => val || '—' },
            {
              key: 'note',
              label: 'Ghi chú',
              dataIndex: 'note',
              render: (val: string) => (
                <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', minWidth: 200, maxWidth: 340, padding: '4px 0' }}>
                  {val || '—'}
                </div>
              ),
            },
          ]}
          dataSource={history} rowKey="id" loading={false}
          scroll={{ y: 400 }}
        />
      </Modal>
    </div>
  );
}
