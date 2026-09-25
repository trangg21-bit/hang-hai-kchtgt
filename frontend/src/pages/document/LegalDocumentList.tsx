import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Form, Input, DatePicker, Button, Spin, Select, Alert, Row, Col, Tabs } from 'antd';
import AppDrawer from '../../components/shared/AppDrawer';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import {
  fetchLegalDocumentList,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  uploadLegalDocumentAttachment,
  deleteLegalDocumentAttachment,
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
import CommonHistoryDrawer from '../../components/shared/CommonHistoryDrawer';
import Pagination from '../../components/list-view/Pagination';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import toast from '../../components/ToastNotification';
import {
  textPrimary,
  textSecondary,
  fontWeightBold,
  fontWeightMedium,
  fontSizeMd,
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
  drawerTitleStyle,
  selectStyle,
  detailLabelColStyle,
  detailValueStyle,
} from '../../tokens';
import { colors } from '../../theme';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import {
  cellTitleStyle,
  getDatePickerProps,
  getSidebarRangePickerProps,
  drawerTabsStyle,
  requiredMarkStyle,
  textAreaStyle,
  DRAWER_WIDTH,
  primaryButtonStyle,
  outlineButtonStyle,
} from '../../themetokenchk';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';

function getErrorMessage(err: unknown, defaultMsg: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return defaultMsg;
}

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
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [isDraftSubmit, setIsDraftSubmit] = useState(false);

  const [dataSource, setDataSource] = useState<LegalDocumentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [countAll, setCountAll] = useState(0);
  const [countDraft, setCountDraft] = useState(0);
  const [countEffective, setCountEffective] = useState(0);
  const [countExpiring, setCountExpiring] = useState(0);
  const [countExpired, setCountExpired] = useState(0);
  const [isError, setIsError] = useState(false);
  const [, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [drawerTabKey, setDrawerTabKey] = useState('general');
  const [editingItem, setEditingItem] = useState<LegalDocumentResponse | null>(null);
  const [history, setHistory] = useState<LegalDocumentHistoryResponse[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<LegalDocumentResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<InfrastructureAttachmentItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const combinedAttachments = useMemo<InfrastructureAttachmentItem[]>(() => {
    const existing: InfrastructureAttachmentItem[] = (editingItem?.attachedDocuments || []).map((doc) => ({
      id: String(doc.id),
      fileName: doc.documentName,
      fileSize: doc.fileSize,
      uploadedDate: doc.uploadedAt ? dayjs(doc.uploadedAt).format('YYYY-MM-DD') : undefined,
      uploadedByName: editingItem?.updatedByName || 'Cán bộ quản lý',
      filePath: doc.filePath,
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
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'Không thể tải danh sách văn bản pháp lý'));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, issuingAuthority, documentType, status, applicationArea, issueDateStart, issueDateEnd]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  const handleView = useCallback((record: LegalDocumentResponse) => {
    setEditingItem(record);
    setIsViewing(true);
    setDrawerTabKey('general');
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((record: LegalDocumentResponse) => {
    setEditingItem(record);
    setIsViewing(false);
    setDrawerTabKey('general');
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
    setIsModalOpen(true);
  }, [form]);

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    setIsViewing(false);
    setDrawerTabKey('general');
    setPendingAttachments([]);
    form.resetFields();
    setIsModalOpen(true);
  }, [form]);

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    setIsViewing(false);
    setDrawerTabKey('general');
    setPendingAttachments([]);
    form.resetFields();
  }, [form]);

  const handleSubmit = useCallback(async (isDraft = false) => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      setIsDraftSubmit(isDraft);
      const payload: LegalDocumentCreateRequest = {
        ...values,
        issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : '',
        effectiveDate: values.effectiveDate ? values.effectiveDate.format('YYYY-MM-DD') : '',
        expirationDate: values.expirationDate ? values.expirationDate.format('YYYY-MM-DD') : undefined,
        draft: isDraft,
        validityStatus: isDraft ? 'DRAFT' : (editingItem ? values.validityStatus : 'EFFECTIVE'),
      };

      let documentId: string;
      if (editingItem) {
        await updateLegalDocument(editingItem.id, payload);
        documentId = editingItem.id;
        toast.success(isDraft ? 'Lưu tạm văn bản pháp lý thành công!' : 'Cập nhật văn bản pháp lý thành công!');
      } else {
        const created = await createLegalDocument(payload);
        documentId = created.id;
        setEditingItem(created);
        toast.success(isDraft ? 'Lưu tạm văn bản pháp lý thành công!' : 'Tạo văn bản pháp lý thành công!');
      }

      for (const pendingFile of pendingAttachments) {
        if (!pendingFile.originFileObj) continue;
        try {
          await uploadLegalDocumentAttachment(documentId, pendingFile.originFileObj);
        } catch (err: unknown) {
          toast.error(getErrorMessage(err, 'Lỗi tải lên tệp đính kèm'));
        }
      }

      setIsModalOpen(false);
      setPendingAttachments([]);
      form.resetFields();
      loadData();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'errorFields' in err) {
        setDrawerTabKey('general');
        return;
      }
      toast.error(getErrorMessage(err, 'Có lỗi xảy ra khi lưu văn bản'));
    } finally {
      setSubmitting(false);
      setIsDraftSubmit(false);
    }
  }, [editingItem, form, pendingAttachments, loadData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteLegalDocument(id);
      toast.success('Xóa văn bản pháp lý thành công!');
      loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Lỗi khi xóa văn bản'));
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Lỗi tải PDF'));
    }
  }, []);

  const handleAttachmentUpload = useCallback(async (file: File) => {
    const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTS.includes(ext)) {
      toast.error('Định dạng tệp không được hỗ trợ (chỉ chấp nhận PDF, Word, ảnh)');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước mỗi tệp không được vượt quá 10MB');
      return false;
    }

    if (editingItem?.id) {
      try {
        const result = await uploadLegalDocumentAttachment(editingItem.id, file);
        if (result) {
          setEditingItem((prev) => prev ? {
            ...prev,
            attachedDocuments: [...(prev.attachedDocuments || []), result],
          } : prev);
          toast.success(`Đã tải lên: ${file.name}`);
        }
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, 'Lỗi tải lên tệp đính kèm'));
        return false;
      }
      return;
    }

    const nowIso = dayjs().toISOString();
    const newUid = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setPendingAttachments((prev) => [
      ...prev,
      {
        id: newUid,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedByName: 'Cán bộ quản lý',
        uploadedDate: nowIso,
        originFileObj: file,
        file,
      },
    ]);
    toast.success(`Đã thêm tệp: ${file.name}`);
  }, [editingItem]);

  const handleAttachmentDelete = useCallback(async (attachmentId: string) => {
    const isLocal = pendingAttachments.some((f) => f.id === attachmentId);
    if (isLocal) {
      setPendingAttachments((prev) => prev.filter((f) => f.id !== attachmentId));
      toast.success('Đã xóa tệp đính kèm');
      return;
    }

    if (editingItem?.id) {
      try {
        await deleteLegalDocumentAttachment(editingItem.id, attachmentId);
        setEditingItem((prev) => prev ? {
          ...prev,
          attachedDocuments: (prev.attachedDocuments || []).filter((d) => d.id !== attachmentId),
        } : prev);
        toast.success('Đã xóa tệp đính kèm');
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, 'Lỗi khi xóa tệp đính kèm'));
      }
    }
  }, [editingItem, pendingAttachments]);

  const handleDownloadAttachment = useCallback(async (attachmentId: string, fileName: string) => {
    const pending = pendingAttachments.find((f) => f.id === attachmentId || f.fileName === fileName);
    if (pending?.originFileObj) {
      const url = URL.createObjectURL(pending.originFileObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    if (!editingItem?.id) return;
    try {
      const resp = await api.get(`/v1/legal-documents/${editingItem.id}/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([resp.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể tải xuống tệp đính kèm'));
    }
  }, [editingItem, pendingAttachments]);

  const handleLoadPreviewAttachment = useCallback(async (attachmentId: string): Promise<Blob | string> => {
    if (!editingItem?.id) throw new Error('Chưa có ID văn bản');
    const resp = await api.get(`/v1/legal-documents/${editingItem.id}/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return resp.data;
  }, [editingItem]);

  const handleHistory = useCallback(async (record: LegalDocumentResponse) => {
    setSelectedHistoryRecord(record);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      setHistory(await fetchLegalDocumentHistory(record.id));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể tải lịch sử văn bản'));
    } finally {
      setHistoryLoading(false);
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
      render: (text: string, record: LegalDocumentResponse) => (
        <div
          style={{
            cursor: hasPerm('document:read') ? 'pointer' : 'default',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          onClick={() => {
            if (hasPerm('document:read')) handleView(record);
          }}
          title={text || ''}
        >
          <span style={cellTitleStyle}>{text || '—'}</span>
        </div>
      ),
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
      key: 'validityStatus', label: 'Trạng thái', dataIndex: 'validityStatus', width: 150, align: 'left' as const,
      render: (val: string) => {
        const color = VALIDITY_STATUS_COLOR[val] || textSecondary;
        const label = VALIDITY_STATUS_MAP[val] || val || '';
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spaceXs,
              padding: '2px 10px',
              border: `1px solid ${color}40`,
              borderRadius: radiusPill,
              fontSize: fontSizeMd,
              fontWeight: fontWeightMedium,
              background: `${color}15`,
              color,
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 150, sortable: true, align: 'center' as const,
      render: (val: string) => formatDate(val)
    },
  ], [page, pageSize, hasPerm, handleView]);

  const rowActions = useCallback((record: LegalDocumentResponse) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    if (hasPerm('document:read')) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => handleView(record) });
    }
    if (hasPerm('document:update') && record.validityStatus !== 'EXPIRED') {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => handleEdit(record) });
    }
    if (hasPerm('document:history')) {
      actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => handleHistory(record) });
    }
    if (hasPerm('document:read')) {
      actions.push({ key: 'export-pdf', label: 'Xuất PDF', icon: <DownloadOutlined />, onClick: () => handleExportPdf(record.id) });
    }
    if (hasPerm('document:delete')) {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.id) });
    }
    return actions;
  }, [hasPerm, handleView, handleEdit, handleHistory, handleExportPdf, handleDelete]);

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
        <Input placeholder="Nhập số hiệu, tên văn bản" allowClear
          value={keywordInput}
          maxLength={200}
          onChange={(e) => setKeywordInput(e.target.value)}
          onPressEnter={handleFilterSearch}
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

      {/* Bộ lọc nâng cao: chỉ mở khi bấm nút phễu lọc ở footer Sidebar */}
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Cơ quan ban hành</div>
            <Input placeholder="Nhập cơ quan ban hành" allowClear
              value={issuingAuthorityInput}
              maxLength={200}
              onChange={(e) => setIssuingAuthorityInput(e.target.value)}
              onPressEnter={handleFilterSearch}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Phạm vi áp dụng</div>
            <Input placeholder="Nhập phạm vi áp dụng" allowClear
              value={applicationAreaInput}
              maxLength={100}
              onChange={(e) => setApplicationAreaInput(e.target.value)}
              onPressEnter={handleFilterSearch}
              style={{ borderRadius: radiusPill, height: 40 }} />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Khoảng ngày ban hành</div>
            <DatePicker.RangePicker
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              allowClear
              {...getSidebarRangePickerProps({
                value: issueDateStartInput && issueDateEndInput ? [dayjs(issueDateStartInput), dayjs(issueDateEndInput)] : null,
                onChange: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
                  setIssueDateStartInput(dates?.[0] ? dates[0].format('YYYY-MM-DD') : null);
                  setIssueDateEndInput(dates?.[1] ? dates[1].format('YYYY-MM-DD') : null);
                },
                style: { width: '100%', borderRadius: radiusPill, height: 40 },
              })}
            />
          </div>
        </>
      )}
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
      <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
    </>;
  };

  const headerActions = useMemo(() => {
    const actions: Array<{
      key: string;
      label: string;
      variant: 'primary' | 'outline' | 'subtle';
      icon?: React.ReactNode;
      onClick: () => void;
    }> = [];
    if (hasPerm('document:create')) {
      actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary', icon: <PlusOutlined />, onClick: handleCreate });
    }
    return actions;
  }, [hasPerm, handleCreate]);

  const documentDetailItems: Array<[string, React.ReactNode]> = editingItem ? [
    ['Số hiệu văn bản', editingItem.documentNumber || '—'],
    ['Tên văn bản', <Typography.Text strong style={{ color: colors.sidebarBg }}>{editingItem.documentName || '—'}</Typography.Text>],
    ['Loại văn bản', DOCUMENT_TYPE_MAP[editingItem.documentType] || editingItem.documentType || '—'],
    ['Cơ quan ban hành', editingItem.issuingAuthority || '—'],
    ['Người ký', editingItem.signer || '—'],
    ['Ngày ban hành', formatDateShort(editingItem.issueDate)],
    ['Ngày có hiệu lực', formatDateShort(editingItem.effectiveDate)],
    ['Ngày hết hiệu lực', formatDateShort(editingItem.expirationDate)],
    ['Phạm vi áp dụng', editingItem.applicationArea || '—'],
    ['Trạng thái', (() => {
      const color = VALIDITY_STATUS_COLOR[editingItem.validityStatus] || textSecondary;
      const label = VALIDITY_STATUS_MAP[editingItem.validityStatus] || editingItem.validityStatus || '';
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: spaceXs, padding: `${spaceXs}px ${spaceSm}px`, border: `1px solid ${color}40`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color }}>{label}</span>;
    })()],
    ['Mô tả', editingItem.description || '—'],
    ['Ngày cập nhật', formatDate(editingItem.updatedDate)],
  ] : [];

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5 }}>
      <div className="legal-documents-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .legal-documents-page-wrapper,
          .legal-documents-page-wrapper .ant-table,
          .legal-documents-page-wrapper .ant-table-cell,
          .legal-documents-page-wrapper .ant-table-thead > tr > th,
          .legal-documents-page-wrapper .ant-table-tbody > tr > td,
          .legal-documents-page-wrapper .ant-input,
          .legal-documents-page-wrapper .ant-select,
          .legal-documents-page-wrapper .ant-select-selection-item,
          .legal-documents-page-wrapper .ant-btn,
          .legal-documents-page-wrapper .ant-pagination,
          .legal-documents-page-wrapper .ant-pagination-item,
          .legal-documents-page-wrapper .ant-pagination-total-text,
          .legal-documents-page-wrapper .ant-breadcrumb,
          .legal-documents-page-wrapper .ant-form-item-label > label,
          .legal-documents-drawer-scope,
          .legal-documents-drawer-scope .ant-drawer-content,
          .legal-documents-drawer-scope .ant-tabs-tab,
          .legal-documents-drawer-scope .chk-detail-label,
          .legal-documents-drawer-scope .chk-detail-value,
          .legal-documents-drawer-scope .ant-table,
          .legal-documents-drawer-scope .ant-table-cell,
          .legal-documents-drawer-scope .ant-btn,
          .legal-documents-drawer-scope .ant-select,
          .legal-documents-drawer-scope .ant-input,
          .legal-documents-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }

          /* Nhãn form Drawer chuẩn KCHT: navy đậm #1a3f83, font-weight 600 */
          .legal-documents-drawer-scope .ant-form-item-label > label {
            color: #1a3f83 !important;
            font-weight: 600 !important;
            font-size: 13.5px !important;
          }
          .legal-documents-drawer-scope .ant-form-item-required::before {
            display: inline-block !important;
            margin-left: 4px !important;
            order: 1 !important;
          }
          .legal-documents-drawer-scope .ant-form-item-required::after {
            display: none !important;
          }

          /* Input affix wrapper bo tròn viên thuốc cho single-line Input (có showCount) */
          .legal-documents-drawer-scope .ant-input-affix-wrapper:not(:has(textarea)) {
            border-radius: 999px !important;
            height: 40px !important;
            padding: 0 16px !important;
            display: inline-flex !important;
            align-items: center !important;
          }
          .legal-documents-drawer-scope .ant-input-affix-wrapper:not(:has(textarea)) > input.ant-input {
            border-radius: 0 !important;
            height: 38px !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }

          /* Textarea bo tròn thanh lịch 20px chuẩn KCHT, chiều cao tự nhiên 3 dòng, không bị đè chữ */
          .legal-documents-drawer-scope .ant-input-affix-wrapper:has(textarea),
          .legal-documents-drawer-scope .ant-input-textarea-affix-wrapper {
            border-radius: 20px !important;
            height: auto !important;
            min-height: 88px !important;
            padding: 10px 16px 8px 16px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .legal-documents-drawer-scope .ant-input-affix-wrapper:has(textarea) > textarea.ant-input,
          .legal-documents-drawer-scope .ant-input-textarea-affix-wrapper > textarea.ant-input {
            border-radius: 0 !important;
            height: auto !important;
            min-height: 60px !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            resize: none !important;
          }
          .legal-documents-drawer-scope textarea.ant-input:not(.ant-input-affix-wrapper textarea) {
            border-radius: 20px !important;
            padding: 10px 16px !important;
            resize: none !important;
          }
          .legal-documents-drawer-scope .ant-input-data-count {
            font-size: 11px !important;
            color: #94a3b8 !important;
            user-select: none !important;
          }

          /* Ẩn panel thứ 2 cho RangePicker gọn 1 panel tại sidebar */
          .chk-sidebar-range-datepicker-popup .ant-picker-panel + .ant-picker-panel,
          .chk-range-datepicker-popup .ant-picker-panel + .ant-picker-panel,
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child {
            display: none !important;
          }

          /* Responsive StatusTabs */
          .legal-documents-page-wrapper div:has(> button[aria-pressed]) {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            justify-content: safe center !important;
            align-items: center !important;
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 #f8fafc !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            padding: 2px 8px 4px 8px !important;
            gap: 8px !important;
            border-radius: 999px !important;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04) !important;
          }
          .legal-documents-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 4px !important;
          }
          .legal-documents-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f8fafc !important;
            border-radius: 4px !important;
          }
          .legal-documents-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 4px !important;
          }
          .legal-documents-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .legal-documents-page-wrapper div:has(> button[aria-pressed]) button[aria-pressed] {
            flex-shrink: 0 !important;
            white-space: nowrap !important;
          }
        `}</style>
        <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Văn bản pháp lý' }]} actions={headerActions} />
        <FilterTableLayout
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed((v) => !v)}
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

        <AppDrawer
          width={DRAWER_WIDTH}
          rootClassName="legal-documents-drawer-scope"
          className="legal-documents-drawer-scope"
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              {isViewing
                ? 'Chi tiết văn bản pháp lý'
                : (editingItem ? 'Chỉnh sửa văn bản pháp lý' : 'Thêm mới văn bản pháp lý')}
            </span>
          }
          open={isModalOpen}
          onClose={handleCancel}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          footer={
            isViewing ? null : (
              editingItem?.validityStatus !== 'EXPIRED' && (
                <>
                  {!editingItem && (
                    <Button
                      onClick={() => handleSubmit(true)}
                      loading={submitting && isDraftSubmit}
                      disabled={submitting && !isDraftSubmit}
                      style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
                    >
                      Lưu tạm
                    </Button>
                  )}
                  <Button
                    type="primary"
                    onClick={() => handleSubmit(false)}
                    loading={submitting && !isDraftSubmit}
                    disabled={submitting && isDraftSubmit}
                    style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
                  >
                    {editingItem ? 'Cập nhật' : 'Lưu'}
                  </Button>
                </>
              )
            )
          }
        >
          <style>{requiredMarkStyle}</style>
        <Spin spinning={submitting}>
          {isViewing && editingItem ? (
            <Tabs
              activeKey={drawerTabKey}
              onChange={setDrawerTabKey}
              tabBarStyle={drawerTabsStyle}
              items={[
                {
                  key: 'general',
                  label: 'Thông tin chung',
                  children: (
                    <div style={{ paddingTop: spaceMd }}>
                      <div style={{ borderTop: `1px solid ${borderDefault}` }}>
                        {Array.from({ length: Math.ceil(documentDetailItems.length / 2) }, (_, rowIndex) => {
                          const left = documentDetailItems[rowIndex * 2];
                          const right = documentDetailItems[rowIndex * 2 + 1];
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
                  ),
                },
                {
                  key: 'attachments',
                  label: `Tệp đính kèm (${combinedAttachments.length})`,
                  children: (
                    <InfrastructureAttachmentTab
                      attachments={combinedAttachments}
                      readonly={true}
                      onDownload={handleDownloadAttachment}
                      loadPreviewAttachment={handleLoadPreviewAttachment}
                      emptyText="Chưa có tệp đính kèm nào"
                    />
                  ),
                },
              ]}
            />
          ) : (
            <>
              {editingItem?.validityStatus === 'EXPIRED' && (
                <Alert
                  message="Văn bản đã hết hiệu lực"
                  description="Văn bản ở trạng thái Đã hết hiệu lực không được phép chỉnh sửa nội dung."
                  type="warning"
                  showIcon
                  style={{ marginTop: 8, marginBottom: 8 }}
                />
              )}
              <Form form={form} layout="vertical" disabled={editingItem?.validityStatus === 'EXPIRED'} style={{ marginTop: 8 }}>
                <Tabs
                  activeKey={drawerTabKey}
                  onChange={setDrawerTabKey}
                  tabBarStyle={drawerTabsStyle}
                  items={[
                    {
                      key: 'general',
                      label: 'Thông tin chung',
                      children: (
                        <div style={{ paddingTop: spaceMd }}>
                          <Row gutter={[spaceLg, 0]}>
                            <Col xs={24} md={12}>
                              <Form.Item name="documentNumber" {...labelProps('Số hiệu văn bản')} rules={[
                                { required: true, message: 'Vui lòng nhập số hiệu văn bản' },
                                { max: 50, message: 'Số hiệu văn bản không được vượt quá 50 ký tự' },
                              ]}
                                style={{ marginBottom: spaceFormField }}>
                                <Input placeholder="Nhập số hiệu văn bản" maxLength={50} showCount style={{ borderRadius: radiusPill, height: 40 }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name="documentName" {...labelProps('Tên văn bản')} rules={[
                                { required: true, message: 'Vui lòng nhập tên văn bản' },
                                { max: 200, message: 'Tên văn bản không được vượt quá 200 ký tự' },
                              ]}
                                style={{ marginBottom: spaceFormField }}>
                                <Input placeholder="Nhập tên văn bản" maxLength={200} showCount style={{ borderRadius: radiusPill, height: 40 }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name="documentType" {...labelProps('Loại văn bản')} rules={[{ required: true, message: 'Vui lòng chọn loại văn bản' }]}
                                style={{ marginBottom: spaceFormField }}>
                                <Select placeholder="Chọn loại văn bản" style={{ borderRadius: radiusPill, height: 40 }}>
                                  <Select.Option value="LAW">Luật</Select.Option>
                                  <Select.Option value="DECREE">Nghị định</Select.Option>
                                  <Select.Option value="CIRCULAR">Thông tư</Select.Option>
                                  <Select.Option value="DECISION">Quyết định</Select.Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name="issuingAuthority" {...labelProps('Cơ quan ban hành')} rules={[
                                { required: true, message: 'Vui lòng nhập cơ quan ban hành' },
                                { max: 200, message: 'Cơ quan ban hành không được vượt quá 200 ký tự' },
                              ]}
                                style={{ marginBottom: spaceFormField }}>
                                <Input placeholder="Nhập cơ quan ban hành" maxLength={200} showCount style={{ borderRadius: radiusPill, height: 40 }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name="signer" {...labelProps('Người ký')} rules={[
                                { max: 100, message: 'Người ký không được vượt quá 100 ký tự' },
                              ]} style={{ marginBottom: spaceFormField }}>
                                <Input placeholder="Nhập người ký" maxLength={100} showCount style={{ borderRadius: radiusPill, height: 40 }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name="issueDate" {...labelProps('Ngày ban hành')} rules={[{ required: true, message: 'Vui lòng chọn ngày ban hành' }]}
                                style={{ marginBottom: spaceFormField }}>
                                <DatePicker placeholder="Chọn ngày ban hành" {...getDatePickerProps({ style: { width: '100%', borderRadius: radiusPill, height: 40 } })} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name="effectiveDate" {...labelProps('Ngày có hiệu lực')} rules={[{ required: true, message: 'Vui lòng chọn ngày có hiệu lực' }]}
                                style={{ marginBottom: spaceFormField }}>
                                <DatePicker placeholder="Chọn ngày có hiệu lực" {...getDatePickerProps({ style: { width: '100%', borderRadius: radiusPill, height: 40 } })} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name="expirationDate" {...labelProps('Ngày hết hiệu lực')} style={{ marginBottom: spaceFormField }}>
                                <DatePicker placeholder="Chọn ngày hết hiệu lực" {...getDatePickerProps({ style: { width: '100%', borderRadius: radiusPill, height: 40 } })} />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item name="applicationArea" {...labelProps('Phạm vi áp dụng')} rules={[
                                { max: 100, message: 'Phạm vi áp dụng không được vượt quá 100 ký tự' },
                              ]} style={{ marginBottom: spaceFormField }}>
                                <Input placeholder="Nhập phạm vi áp dụng" maxLength={100} showCount style={{ borderRadius: radiusPill, height: 40 }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item name="description" {...labelProps('Mô tả')} rules={[
                                { max: 500, message: 'Mô tả không được vượt quá 500 ký tự' },
                              ]} style={{ marginBottom: spaceFormField }}>
                                <Input.TextArea placeholder="Nhập mô tả" rows={3} style={textAreaStyle} maxLength={500} showCount />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      ),
                    },
                    {
                      key: 'attachments',
                      label: `Tệp đính kèm (${combinedAttachments.length})`,
                      children: (
                        <InfrastructureAttachmentTab
                          attachments={combinedAttachments}
                          readonly={editingItem?.validityStatus === 'EXPIRED'}
                          onUpload={handleAttachmentUpload}
                          onDelete={handleAttachmentDelete}
                          onDownload={handleDownloadAttachment}
                          loadPreviewAttachment={handleLoadPreviewAttachment}
                          emptyText="Chưa có tệp đính kèm nào"
                        />
                      ),
                    },
                  ]}
                />
              </Form>
            </>
          )}
        </Spin>
      </AppDrawer>

      <CommonHistoryDrawer
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setSelectedHistoryRecord(null);
        }}
        title="Lịch sử văn bản"
        entityName={selectedHistoryRecord?.documentName || selectedHistoryRecord?.documentNumber}
        records={history}
        loading={historyLoading}
      />
    </div>
  </ThemeTokenProvider>
);
}
