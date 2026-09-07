/**
 * SeaportThroughputDrawer — Drawer Thêm mới / Chỉnh sửa / Xem chi tiết số liệu
 * Sản lượng cảng biển (M-028 / F-301). EN identifiers, VI labels.
 *
 * - 24 ô InputDecimal (3 nhóm × 8) + passenger_trips + note + file đính kèm
 * - OrgUnitTreeSelect disabled khi sửa (SelectOrgCode convention); report_month = DatePicker tháng yyyy-MM
 * - Mục "Thông tin phê duyệt" nằm trong cùng Drawer (không tạo tab riêng)
 */
import { useEffect, useMemo, useState } from 'react';
import { Drawer, Form, Input, DatePicker, Row, Col, Button, Space, Spin, Divider } from 'antd';
import { UploadOutlined, DeleteOutlined, PaperClipOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
  spaceSm,
  spaceMd,
  spaceFormField,
  radiusPill,
  borderDefault,
  surfacePage,
  inputStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  statusBadgeStyle,
  getDatePickerProps,
} from '../../themetokenchk';
import InputDecimal from '../../components/InputDecimal';
import { FormOrgUnitTreeSelect } from '../../components/org-unit';
import toast from '../../components/ToastNotification';
import seaportThroughputService, {
  type SeaportThroughputRecord,
  type SeaportThroughputFileItem,
  type SeaportThroughputPayload,
  type SeaportThroughputNumbers,
} from '../../services/seaportThroughputService';
import type { Organization } from '../../services/organizationService';
import {
  THROUGHPUT_GROUPS,
  PASSENGER_FIELD,
  NOTE_LABEL,
  ORG_LABEL,
  MONTH_LABEL,
  STATUS_META,
  NUMBER_FIELD_NAMES,
} from './seaportThroughputMeta';

export type SeaportDrawerMode = 'create' | 'edit' | 'view';

export interface SeaportThroughputDrawerProps {
  open: boolean;
  mode: SeaportDrawerMode;
  record: SeaportThroughputRecord | null;
  organizations: Organization[];
  onClose: () => void;
  onSaved: (record: SeaportThroughputRecord) => void;
}

interface FormValues extends Partial<SeaportThroughputNumbers> {
  orgUnitId?: string;
  reportMonth?: Dayjs;
  note?: string;
}

interface PendingFile {
  name: string;
  file: File;
}

const formatNumber = (value: unknown): string => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(num);
};

const formatDateTime = (value?: string): string =>
  value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';

const monthOf = (value?: string): Dayjs | undefined => {
  if (!value) return undefined;
  const m = dayjs(value, 'YYYY-MM');
  return m.isValid() ? m : undefined;
};

/** Hàng nhãn/giá trị dùng cho chế độ Xem chi tiết. */
const InfoRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', marginBottom: spaceSm }}>
    <div
      style={{
        width: 280,
        flexShrink: 0,
        color: textSecondary,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
      }}
    >
      {label}
    </div>
    <div
      style={{
        flex: 1,
        color: textPrimary,
        fontSize: fontSizeMd,
        overflowWrap: 'anywhere',
      }}
    >
      {value ?? '—'}
    </div>
  </div>
);

const SeaportThroughputDrawer: React.FC<SeaportThroughputDrawerProps> = ({
  open,
  mode,
  record,
  organizations,
  onClose,
  onSaved,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<SeaportThroughputRecord | null>(record);
  const [fileList, setFileList] = useState<SeaportThroughputFileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const isView = mode === 'view';
  const isCreate = mode === 'create';
  const current = detail;

  const title =
    mode === 'create'
      ? 'Thêm mới số liệu sản lượng cảng biển'
      : mode === 'edit'
        ? 'Chỉnh sửa số liệu sản lượng cảng biển'
        : 'Chi tiết số liệu sản lượng cảng biển';

  const lockForm = isView || current?.approvalStatus === 'APPROVED';

  // Tạo: form trống. Edit/View: nạp chi tiết + file từ server theo id.
  useEffect(() => {
    if (!open) return;
    if (mode === 'create') {
      form.resetFields();
      setDetail(null);
      setFileList([]);
      setPendingFiles([]);
      return;
    }
    const id = record?.id;
    if (!id) return;
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const data = await seaportThroughputService.getById(id);
        if (cancelled) return;
        setDetail(data);
        // Danh sách file nằm trong response GET /{id} (files[]) — không có endpoint GET /files (design §3).
        setFileList(Array.isArray(data.files) ? data.files : []);
        if (mode === 'edit') {
          form.setFieldsValue({
            ...data,
            reportMonth: monthOf(data.reportMonth),
            note: data.note ?? '',
          });
        }
      } catch {
        if (!cancelled) toast.error('Không thể tải chi tiết số liệu sản lượng');
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, mode, record?.id, form]);

  const statusMeta = current?.approvalStatus ? STATUS_META[current.approvalStatus] : undefined;

  const submitForm = async () => {
    const values = await form.validateFields();
    const numbers: Record<string, number> = {};
    for (const name of NUMBER_FIELD_NAMES) {
      const raw = (values as unknown as Record<string, unknown>)[name];
      const num = typeof raw === 'number' ? raw : Number(raw ?? 0);
      numbers[name] = Number.isFinite(num) && num >= 0 ? num : 0;
    }
    const payload: SeaportThroughputPayload = {
      orgUnitId: values.orgUnitId as string,
      reportMonth: (values.reportMonth as Dayjs).format('YYYY-MM'),
      note: ((values.note as string | undefined) ?? '').trim() || undefined,
      ...(numbers as unknown as SeaportThroughputNumbers),
    };
    setSaving(true);
    try {
      const saved = current?.id
        ? await seaportThroughputService.update(current.id, payload)
        : await seaportThroughputService.create(payload);
      toast.success(current?.id ? 'Đã cập nhật số liệu sản lượng' : 'Đã lưu tạm số liệu sản lượng');
      onSaved(saved);
    } catch {
      // api.ts interceptor hiển thị message lỗi từ backend (unique / scope / validation)
    } finally {
      setSaving(false);
    }
  };

  /** Đọc lại detail để làm mới danh sách file đính kèm (files[] trong GET /{id}) — không đè form đang sửa. */
  const refreshFiles = async (id: string): Promise<void> => {
    try {
      const data = await seaportThroughputService.getById(id);
      setDetail(data);
      setFileList(Array.isArray(data.files) ? data.files : []);
    } catch {
      // giữ nguyên danh sách hiển thị cũ nếu refresh lỗi
    }
  };

  const uploadPending = async () => {
    if (!current?.id || pendingFiles.length === 0) return;
    setUploading(true);
    try {
      for (const p of pendingFiles) {
        await seaportThroughputService.uploadFile(current.id, p.file);
      }
      toast.success('Đã tải lên tệp đính kèm');
      setPendingFiles([]);
      if (current?.id) await refreshFiles(current.id);
    } catch {
      toast.error('Tải lên tệp đính kèm thất bại');
    } finally {
      setUploading(false);
    }
  };

  const removeUploaded = async (item: SeaportThroughputFileItem) => {
    if (!current?.id) return;
    try {
      await seaportThroughputService.deleteFile(current.id, item.id);
      if (current.id) await refreshFiles(current.id);
      toast.success('Đã xóa tệp đính kèm');
    } catch {
      toast.error('Xóa tệp đính kèm thất bại');
    }
  };

  const groupHeadStyle: React.CSSProperties = useMemo(
    () => ({
      fontSize: fontSizeMd,
      fontWeight: fontWeightBold,
      color: textPrimary,
      margin: `${spaceMd}px 0 ${spaceFormField}px`,
    }),
    [],
  );

  /** 24 ô nhập (create/edit) hoặc hàng nhãn/giá trị (view). */
  const renderNumbers = () => {
    if (isView) {
      return THROUGHPUT_GROUPS.map((group) => (
        <div key={group.key}>
          <div style={groupHeadStyle}>{group.title}</div>
          {group.fields.map((field) => (
            <InfoRow
              key={field.name}
              label={field.label}
              value={formatNumber((current as unknown as Record<string, unknown> | null)?.[field.name])}
            />
          ))}
        </div>
      ));
    }
    return THROUGHPUT_GROUPS.map((group) => (
      <div key={group.key}>
        <div style={groupHeadStyle}>{group.title}</div>
        <Row gutter={spaceMd}>
          {group.fields.map((field) => (
            <Col span={12} key={field.name}>
              <Form.Item
                name={field.name}
                label={field.label}
                style={{ marginBottom: spaceFormField }}
                rules={[{ validator: (_r, v) => (v == null || Number(v) >= 0 ? Promise.resolve() : Promise.reject(new Error('Giá trị không được nhỏ hơn 0'))) }]}
              >
                <InputDecimal disabled={lockForm} placeholder="0" />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </div>
    ));
  };

  const renderApprovalSection = () => {
    if (!current || mode === 'create') return null;
    return (
      <div>
        <Divider style={{ margin: `${spaceMd}px 0` }} />
        <div style={groupHeadStyle}>Thông tin phê duyệt</div>
        <InfoRow
          label="Trạng thái"
          value={
            statusMeta ? <span style={statusBadgeStyle(statusMeta.color)}>{statusMeta.label}</span> : '—'
          }
        />
        <InfoRow label="Ngày gửi phê duyệt" value={formatDateTime(current.submittedAt)} />
        <InfoRow label="Cán bộ gửi phê duyệt" value={current.submittedBy} />
        <InfoRow label="Ngày duyệt cấp Cảng vụ/Chi cục" value={formatDateTime(current.level1ApprovedAt)} />
        <InfoRow label="Cán bộ duyệt cấp Cảng vụ/Chi cục" value={current.level1ApprovedBy} />
        <InfoRow label="Nội dung phê duyệt cấp 1" value={current.level1ApprovalContent} />
        <InfoRow label="Ngày duyệt cấp Cục" value={formatDateTime(current.level2ApprovedAt)} />
        <InfoRow label="Cán bộ duyệt cấp Cục" value={current.level2ApprovedBy} />
        <InfoRow label="Nội dung phê duyệt cấp 2" value={current.level2ApprovalContent} />
        {current.rejectionReason ? <InfoRow label="Lý do từ chối" value={current.rejectionReason} /> : null}
      </div>
    );
  };

  const renderFiles = () => {
    if (mode === 'create') {
      return (
        <div style={{ marginTop: spaceMd }}>
          <div style={groupHeadStyle}>File đính kèm</div>
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
            Tệp đính kèm chỉ tải lên sau khi lưu bản ghi.
          </div>
        </div>
      );
    }
    const canManageFiles = !isView && !lockForm;
    return (
      <div style={{ marginTop: spaceMd }}>
        <div style={{ ...groupHeadStyle, display: 'flex', alignItems: 'center', gap: spaceSm }}>
          <PaperClipOutlined />
          File đính kèm
        </div>
        {fileList.length === 0 ? (
          <div
            style={{
              padding: `${spaceMd}px`,
              background: surfacePage,
              borderRadius: radiusPill,
              color: textTertiary,
              fontSize: fontSizeMd,
            }}
          >
            Chưa có tệp đính kèm
          </div>
        ) : (
          fileList.map((f, index) => (
            <div
              key={f.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spaceSm,
                padding: '6px 12px',
                marginBottom: spaceSm,
                border: `1px solid ${borderDefault}`,
                borderRadius: radiusPill,
                background: surfacePage,
              }}
            >
              <span style={{ color: textTertiary, fontSize: fontSizeMd, width: 32 }}>{index + 1}</span>
              <span
                style={{
                  flex: 1,
                  color: textPrimary,
                  fontSize: fontSizeMd,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.fileName}
              </span>
              {canManageFiles ? (
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{ color: textSecondary }}
                  onClick={() => void removeUploaded(f)}
                  aria-label={`Xóa tệp ${f.fileName}`}
                />
              ) : null}
            </div>
          ))
        )}
        {canManageFiles ? (
          <Space direction="vertical" style={{ width: '100%' }} size={spaceSm}>
            <Input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }}
              onChange={(e) => {
                setPendingFiles(Array.from(e.target.files ?? []).map((file) => ({ name: file.name, file })));
                e.target.value = '';
              }}
            />
            {pendingFiles.length > 0 ? (
              <Button
                icon={<UploadOutlined />}
                loading={uploading}
                onClick={() => void uploadPending()}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Tải lên ({pendingFiles.length} tệp)
              </Button>
            ) : null}
          </Space>
        ) : null}
      </div>
    );
  };

  const renderOrgMonthForm = () => {
    if (isView) {
      return (
        <>
          <InfoRow label={ORG_LABEL} value={current?.orgUnitName ?? current?.orgUnitId} />
          <InfoRow
            label={MONTH_LABEL}
            value={current?.reportMonth ? dayjs(current.reportMonth, 'YYYY-MM').format('MM/YYYY') : '—'}
          />
        </>
      );
    }
    return (
      <Row gutter={spaceMd}>
        <Col span={12}>
          <Form.Item
            name="orgUnitId"
            label={ORG_LABEL}
            style={{ marginBottom: spaceFormField }}
            rules={[{ required: true, message: 'Vui lòng chọn Đơn vị quản lý' }]}
          >
            <FormOrgUnitTreeSelect
              disabled={mode === 'edit' || lockForm}
              organizations={organizations}
              showPath
              placeholder="Chọn đơn vị quản lý"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="reportMonth"
            label={MONTH_LABEL}
            style={{ marginBottom: spaceFormField }}
            rules={[{ required: true, message: 'Vui lòng chọn Thời gian tổng hợp sản lượng' }]}
          >
            <DatePicker
              {...getDatePickerProps({ style: { width: '100%', height: 40, borderRadius: radiusPill } })}
              picker="month"
              format="MM/YYYY"
              placeholder="Chọn tháng"
              disabled={lockForm}
            />
          </Form.Item>
        </Col>
      </Row>
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={960}
      title={<span style={drawerTitleStyle}>{title}</span>}
      closeIcon={<span style={drawerCloseBtnStyle}>×</span>}
      destroyOnHidden
      footer={
        isView ? null : (
          <div style={drawerFooterStyle}>
            <Space>
              <Button style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }} onClick={onClose}>
                Hủy
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => void submitForm()}
                style={{
                  background: actionPrimary,
                  borderColor: actionPrimary,
                  borderRadius: radiusPill,
                  height: 40,
                }}
              >
                {isCreate ? 'Lưu tạm' : 'Lưu thay đổi'}
              </Button>
            </Space>
          </div>
        )
      }
    >
      {detailLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : isView ? (
        <div>
          {renderOrgMonthForm()}
          {renderNumbers()}
          <Divider style={{ margin: `${spaceMd}px 0` }} />
          <InfoRow label={PASSENGER_FIELD.label} value={formatNumber(current?.passengerTrips)} />
          <InfoRow label={NOTE_LABEL} value={current?.note} />
          <InfoRow label="Người tạo" value={current?.createdByName ?? current?.createdBy} />
          {renderApprovalSection()}
          {renderFiles()}
        </div>
      ) : (
        <Form form={form} layout="vertical" requiredMark={false}>
          {renderOrgMonthForm()}
          {renderNumbers()}
          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="passengerTrips" label={PASSENGER_FIELD.label} style={{ marginBottom: spaceFormField }}>
                <InputDecimal integer disabled={lockForm} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12} />
          </Row>
          <Form.Item name="note" label={NOTE_LABEL} style={{ marginBottom: spaceFormField }}>
            <Input.TextArea
              rows={3}
              placeholder="Nhập ghi chú"
              disabled={lockForm}
              style={{ ...inputStyle, borderRadius: radiusPill }}
            />
          </Form.Item>
          {renderApprovalSection()}
          {renderFiles()}
        </Form>
      )}
    </Drawer>
  );
};

export default SeaportThroughputDrawer;
