import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Select,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InboxOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
  fetchLegalDocumentList,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  uploadLegalDocumentAttachment,
} from '../../services/document/api';
import type { LegalDocumentResponse, LegalDocumentCreateRequest } from '../../services/document/types';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg, spaceMd, spaceFormField, radiusPill } from '../../tokens';
import dayjs from 'dayjs';
import { usePermissionStore } from '../../store/permissionStore';

const { Dragger } = Upload;

export default function LegalDocumentList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const [dataSource, setDataSource] = useState<LegalDocumentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter states
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterCoQuan, setFilterCoQuan] = useState('');
  const [filterLoai, setFilterLoai] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterApplicationArea, setFilterApplicationArea] = useState('');
  const [filterIssueDateStart, setFilterIssueDateStart] = useState<string | null>(null);
  const [filterIssueDateEnd, setFilterIssueDateEnd] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LegalDocumentResponse | null>(null);
  const [form] = Form.useForm();

  const attachedFileList = (editingItem?.attachedDocuments || []).map((doc) => ({
    uid: doc.id,
    name: doc.documentName,
    status: 'done' as const,
    url: doc.filePath,
    size: doc.fileSize,
  }));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchLegalDocumentList({
        page: page - 1,
        size: pageSize,
        keyword: filterKeyword ? filterKeyword.trim() : undefined,
        issuingAuthority: filterCoQuan ? filterCoQuan.trim() : undefined,
        type: filterLoai || undefined,
        status: filterStatus || undefined,
        applicationArea: filterApplicationArea || undefined,
        yearStart: filterIssueDateStart || undefined,
        yearEnd: filterIssueDateEnd || undefined,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách văn bản pháp lý');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterCoQuan, filterLoai, filterStatus, filterApplicationArea, filterIssueDateStart, filterIssueDateEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record?: LegalDocumentResponse) => {
    if (record) {
      setEditingItem(record);
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
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: LegalDocumentCreateRequest = {
        ...values,
        issueDate: values.issueDate ? values.issueDate.toISOString() : '',
        effectiveDate: values.effectiveDate ? values.effectiveDate.toISOString() : '',
        expirationDate: values.expirationDate ? values.expirationDate.toISOString() : undefined,
      };

      if (editingItem) {
        await updateLegalDocument(editingItem.id, payload);
        message.success('Cập nhật văn bản pháp lý thành công!');
      } else {
        await createLegalDocument(payload);
        message.success('Tạo văn bản pháp lý thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra khi lưu văn bản');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLegalDocument(id);
      message.success('Xóa văn bản pháp lý thành công!');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa văn bản');
    }
  };

  const handleExportPdf = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const resp = await fetch(`/api/v1/legal-documents/${id}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error('Tải PDF thất bại');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      message.error(err.message || 'Lỗi tải PDF');
    }
  };

  const columns = [
    {
      title: 'Số hiệu văn bản',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
    },
    {
      title: 'Tên văn bản pháp lý',
      dataIndex: 'documentName',
      key: 'documentName',
    },
    {
      title: 'Loại văn bản',
      dataIndex: 'documentType',
      key: 'documentType',
      render: (val: string) => {
        if (val === 'DECISION') return 'Quyết định';
        if (val === 'CIRCULAR') return 'Thông tư';
        if (val === 'DECREE') return 'Nghị định';
        if (val === 'LAW') return 'Luật';
        return val || '';
      }
    },
    {
      title: 'Cơ quan ban hành',
      dataIndex: 'issuingAuthority',
      key: 'issuingAuthority',
    },
    {
      title: 'Người ký',
      dataIndex: 'signer',
      key: 'signer',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'validityStatus',
      key: 'validityStatus',
      render: (val: string) => {
        if (val === 'EFFECTIVE') return 'Còn hiệu lực';
        if (val === 'EXPIRING_SOON') return 'Sắp hết hiệu lực';
        if (val === 'EXPIRED') return 'Đã hết hiệu lực';
        return val || '';
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: LegalDocumentResponse) => (
        <Space size="middle">
          {hasPerm('document:read') && (
            <Tooltip title="Xuất PDF">
              <Button type="text" icon={<DownloadOutlined />} onClick={() => handleExportPdf(record.id)} />
            </Tooltip>
          )}
          {hasPerm('document:update') && (
            <Tooltip title="Chỉnh sửa">
              <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
            </Tooltip>
          )}
          {hasPerm('document:delete') && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa văn bản này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Tooltip title="Xóa">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Danh sách văn bản pháp lý"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          {hasPerm('document:create') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Tạo văn bản</Button>
          )}
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm theo tên/tóm tắt..."
            value={filterKeyword}
            onChange={(e) => {
              setFilterKeyword(e.target.value);
              setPage(1);
            }}
            style={{ width: 180 }}
          />
          <Input
            placeholder="Cơ quan ban hành..."
            value={filterCoQuan}
            onChange={(e) => {
              setFilterCoQuan(e.target.value);
              setPage(1);
            }}
            style={{ width: 150 }}
          />
          <Select
            placeholder="Loại văn bản"
            value={filterLoai}
            onChange={(val) => {
              setFilterLoai(val);
              setPage(1);
            }}
            style={{ width: 140 }}
            allowClear
            options={[
              { label: 'Quyết định', value: 'DECISION' },
              { label: 'Thông tư', value: 'CIRCULAR' },
              { label: 'Nghị định', value: 'DECREE' },
              { label: 'Luật', value: 'LAW' },
            ]}
          />
          <Select
            placeholder="Trạng thái hiệu lực"
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            style={{ width: 160 }}
            allowClear
            options={[
              { label: 'Còn hiệu lực', value: 'EFFECTIVE' },
              { label: 'Sắp hết hiệu lực', value: 'EXPIRING_SOON' },
              { label: 'Đã hết hiệu lực', value: 'EXPIRED' },
            ]}
          />
          <Input
            placeholder="Phạm vi áp dụng..."
            value={filterApplicationArea}
            onChange={(e) => {
              setFilterApplicationArea(e.target.value);
              setPage(1);
            }}
            style={{ width: 150 }}
          />
          <Input
            placeholder="Ngày ban hành từ..."
            value={filterIssueDateStart || ''}
            onChange={(e) => {
              setFilterIssueDateStart(e.target.value);
              setPage(1);
            }}
            type="date"
            style={{ width: 150 }}
          />
          <Input
            placeholder="Ngày ban hành đến..."
            value={filterIssueDateEnd || ''}
            onChange={(e) => {
              setFilterIssueDateEnd(e.target.value);
              setPage(1);
            }}
            type="date"
            style={{ width: 150 }}
          />
          <Button
            onClick={() => {
              setFilterKeyword('');
              setFilterCoQuan('');
              setFilterLoai(undefined);
              setFilterStatus(undefined);
              setFilterApplicationArea('');
              setFilterIssueDateStart(null);
              setFilterIssueDateEnd(null);
              setPage(1);
            }}
          >
            Xóa bộ lọc
          </Button>
        </Space>
      </div>

      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
          },
          showSizeChanger: true,
        }}
      />

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingItem ? 'Chỉnh sửa văn bản pháp lý' : 'Thêm mới văn bản pháp lý'}</span>}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="documentNumber"
            label="Số hiệu văn bản"
            rules={[{ required: true, message: 'Vui lòng nhập số hiệu' }]}
          >
            <Input placeholder="Ví dụ: QĐ-BGTVT-2026-01" />
          </Form.Item>

          <Form.Item
            name="documentName"
            label="Tên văn bản"
            rules={[{ required: true, message: 'Vui lòng nhập tên văn bản' }]}
          >
            <Input placeholder="Nhập tiêu đề văn bản..." />
          </Form.Item>

          <Form.Item
            name="documentType"
            label="Loại văn bản"
            rules={[{ required: true, message: 'Vui lòng chọn loại văn bản' }]}
          >
            <Select placeholder="Chọn loại văn bản...">
              <Select.Option value="DECISION">Quyết định</Select.Option>
              <Select.Option value="CIRCULAR">Thông tư</Select.Option>
              <Select.Option value="DECREE">Nghị định</Select.Option>
              <Select.Option value="LAW">Luật</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="issuingAuthority"
            label="Cơ quan ban hành"
            rules={[{ required: true, message: 'Vui lòng nhập cơ quan ban hành' }]}
          >
            <Input placeholder="Bộ Giao thông vận tải, Cục Hàng hải..." />
          </Form.Item>

          <Form.Item
            name="signer"
            label="Người ký"
            rules={[{ required: true, message: 'Vui lòng nhập người ký' }]}
          >
            <Input placeholder="Nhập họ và tên người ký..." />
          </Form.Item>

          <Form.Item name="issueDate" label="Ngày ban hành" rules={[{ required: true, message: 'Vui lòng chọn ngày ban hành' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="effectiveDate" label="Ngày có hiệu lực" rules={[{ required: true, message: 'Vui lòng chọn ngày có hiệu lực' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="expirationDate" label="Ngày hết hiệu lực">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="applicationArea" label="Phạm vi áp dụng">
            <Input placeholder="Nhập phạm vi áp dụng..." />
          </Form.Item>

          <Form.Item name="validityStatus" label="Trạng thái hiệu lực" initialValue="EFFECTIVE">
            <Select placeholder="Chọn trạng thái hiệu lực...">
              <Select.Option value="EFFECTIVE">Còn hiệu lực</Select.Option>
              <Select.Option value="EXPIRING_SOON">Sắp hết hiệu lực</Select.Option>
              <Select.Option value="EXPIRED">Đã hết hiệu lực</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả tóm tắt nội dung">
            <Input.TextArea placeholder="Tóm tắt nội dung văn bản..." rows={3} />
          </Form.Item>

          <Form.Item label="Tệp đính kèm">
            <Dragger
              name="file"
              multiple
              maxCount={5}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              fileList={attachedFileList}
              showUploadList={{ showPreviewIcon: true, showRemoveIcon: false, showDownloadIcon: true }}
              customRequest={async (options) => {
                const { file, onSuccess, onError } = options as any;
                if (!editingItem?.id) {
                  onError?.(new Error('Vui lòng lưu văn bản trước khi tải tệp đính kèm'));
                  return;
                }
                try {
                  const result = await uploadLegalDocumentAttachment(editingItem.id, file as File);
                  onSuccess?.(result, file);
                  message.success(`Đã tải lên: ${(file as File).name}`);
                } catch (err: any) {
                  onError?.(err);
                  message.error(`Lỗi tải lên: ${err?.message || 'Không xác định'}`);
                }
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Nhấp hoặc kéo thả tệp vào đây để tải lên</p>
              <p className="ant-upload-hint">Hỗ trợ PDF, Word, Excel. Tối đa 5 tệp.</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
