import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  Card,
  Spin,
  Empty,
  Descriptions,
  Space,
  message,
  Breadcrumb,
} from 'antd';
import { tramRadarCRUD, tramRadarApproval } from '../../services/tramRadarService';
import type {
  TramRadarResponse,
  CreateTramRadarRequest,
  UpdateTramRadarRequest,
  PheDuyetRequest,
} from '../../types/tramRadar';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

export default function TramRadarForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isEditMode = searchParams.get('mode') === 'edit';
  const isDetailMode = !!id && !isEditMode;
  const isCreateMode = !id;

  const [record, setRecord] = useState<TramRadarResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch detail data
  useEffect(() => {
    if (id) {
      const loadData = async () => {
        setIsLoading(true);
        setFormError(null);
        try {
          const data = await tramRadarCRUD.getById(id);
          setRecord(data);
          if (!isEditMode) {
            form.setFieldsValue({
              tenTram: data.tenTram,
              viTri: data.viTri,
              kinhDo: data.kinhDo,
              viDo: data.viDo,
              loaiTram: data.loaiTram,
              coTrinh: data.coTrinh,
              dienTichPhaXa: data.dienTichPhaXa,
              nguonGoc: data.nguonGoc,
              tinhTrang: data.tinhTrang,
            });
          }
        } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [id, isEditMode, form]);

  // Fetch history
  useEffect(() => {
    if (id && isDetailMode) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          const hist = await tramRadarApproval.getHistory(id);
          setHistory(hist);
        } catch (err) {
          setHistoryError(err instanceof Error ? err.message : 'Không tải được lịch sử');
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [id, isDetailMode]);

  const handleSubmitForm = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload: CreateTramRadarRequest = {
        tenTram: values.tenTram,
        viTri: values.viTri,
        kinhDo: values.kinhDo,
        viDo: values.viDo,
        loaiTram: values.loaiTram,
        coTrinh: values.coTrinh,
        dienTichPhaXa: values.dienTichPhaXa,
        nguonGoc: values.nguonGoc,
        tinhTrang: values.tinhTrang,
      };

      if (isCreateMode) {
        const newRecord = await tramRadarCRUD.create(payload);
        message.success('Tạo mới thành công');
        navigate(`/tram-radar/${newRecord.id}`);
      } else if (id && isEditMode) {
        await tramRadarCRUD.update(id, payload as UpdateTramRadarRequest);
        message.success('Cập nhật thành công');
        navigate(`/tram-radar/${id}`);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalAction = async (
    action: 'approveC1' | 'approveC2' | 'reject' | 'delete',
    payload?: Record<string, unknown>
  ) => {
    if (!id || !record) return;

    setIsSubmitting(true);
    try {
      if (action === 'approveC1') {
        const pheDuyetData: PheDuyetRequest = {
          quyetDinh: 'APPROVED',
        };
        await tramRadarApproval.approveC1(id, pheDuyetData);
        message.success('Phê duyệt C1 thành công');
        setRecord({ ...record, trangThai: 'UNDER_REVIEW' });
      } else if (action === 'approveC2') {
        const pheDuyetData: PheDuyetRequest = {
          quyetDinh: 'APPROVED',
        };
        await tramRadarApproval.approveC2(id, pheDuyetData);
        message.success('Phê duyệt C2 thành công');
        setRecord({ ...record, trangThai: 'APPROVED' });
      } else if (action === 'reject') {
        const pheDuyetData: PheDuyetRequest = {
          quyetDinh: 'REJECTED',
          lyDo: payload?.lyDo as string,
        };

        if (record.trangThai === 'PROPOSED' || record.trangThai === 'REJECTED') {
          await tramRadarApproval.approveC1(id, pheDuyetData);
        } else if (record.trangThai === 'UNDER_REVIEW') {
          await tramRadarApproval.approveC2(id, pheDuyetData);
        }

        message.success('Từ chối thành công');
        setRecord({
          ...record,
          trangThai: 'REJECTED',
          lyDoTuChoi: payload?.lyDo as string,
        });
      } else if (action === 'delete') {
        await tramRadarCRUD.delete(id);
        message.success('Xóa thành công');
        navigate('/tram-radar');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Trạm Radar', onClick: () => navigate('/tram-radar') },
    { title: isCreateMode ? 'Tạo mới' : isEditMode ? 'Chỉnh sửa' : 'Chi tiết' },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Spin fullscreen tip="Đang tải..." />
      </div>
    );
  }

  if (formError) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Empty description={formError} style={{ marginTop: '50px' }} />
          <Button onClick={() => navigate('/tram-radar')} style={{ marginTop: '16px' }}>
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  // Detail/Read-only view
  if (isDetailMode) {
    return (
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />
        <Card style={{ marginBottom: '24px' }}>
          <h2>Chi tiết Trạm Radar</h2>
          {record && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Tên trạm">{record.tenTram ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{record.viTri}</Descriptions.Item>
              <Descriptions.Item label="Kinh độ">
                {record.kinhDo !== undefined ? record.kinhDo.toFixed(6) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Vĩ độ">
                {record.viDo !== undefined ? record.viDo.toFixed(6) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Loại trạm">{record.loaiTram ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Cơ trình">{record.coTrinh ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Diện tích phát xạ (m²)">
                {record.dienTichPhaXa !== undefined ? record.dienTichPhaXa : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Nguồn gốc">{record.nguonGoc ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Tình trạng">
                {record.tinhTrang ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <ApprovalStatusBadge status={record.trangThai} />
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>

        {/* Tài liệu đính kèm */}
        {record?.attachments && record.attachments.length > 0 && (
          <Card style={{ marginBottom: '24px' }}>
            <h3>Tài liệu đính kèm</h3>
            <AttachmentList attachments={record.attachments} readonly={true} />
          </Card>
        )}

        {/* Approval Action Bar */}
        {record && (
          <Card style={{ marginBottom: '24px' }}>
            <ApprovalActionBar
              currentStatus={record.trangThai as any}
              permissions={userPermissions}
              entityPermissionPrefix="tramradar"
              currentUserId={currentUser?.username}
              nguoiPheDuyetC1={record.nguoiPheDuyetC1}
              onAction={handleApprovalAction}
              loading={isSubmitting}
            />
          </Card>
        )}

        {/* History Timeline */}
        {record && (
          <Card>
            <h3>Lịch sử phê duyệt</h3>
            <HistoryTimeline
              history={history}
              loading={isLoadingHistory}
              error={historyError || undefined}
              onRetry={() => {
                setIsLoadingHistory(true);
                tramRadarApproval
                  .getHistory(id)
                  .then(setHistory)
                  .catch((err) => setHistoryError(err instanceof Error ? err.message : 'Lỗi'))
                  .finally(() => setIsLoadingHistory(false));
              }}
            />
          </Card>
        )}
      </div>
    );
  }

  // Create/Edit form view
  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />
      <Card style={{ maxWidth: '800px' }}>
        <h2>{isCreateMode ? 'Tạo mới Trạm Radar' : 'Chỉnh sửa Trạm Radar'}</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
        >
          <Form.Item label="Tên trạm" name="tenTram">
            <Input placeholder="Nhập tên trạm (không bắt buộc)" />
          </Form.Item>

          <Form.Item
            label="Vị trí"
            name="viTri"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
          >
            <Input placeholder="Nhập vị trí" />
          </Form.Item>

          <Form.Item
            label="Kinh độ"
            name="kinhDo"
            rules={[
              {
                validator: (_, value) => {
                  if (!value && value !== 0) return Promise.resolve();
                  if (value < -180 || value > 180) {
                    return Promise.reject(new Error('Kinh độ phải trong khoảng -180 đến 180'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            validateTrigger="onChange"
          >
            <InputNumber
              min={-180}
              max={180}
              step={0.000001}
              precision={6}
              placeholder="Nhập kinh độ (WGS84)"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Vĩ độ"
            name="viDo"
            rules={[
              {
                validator: (_, value) => {
                  if (!value && value !== 0) return Promise.resolve();
                  if (value < -90 || value > 90) {
                    return Promise.reject(new Error('Vĩ độ phải trong khoảng -90 đến 90'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            validateTrigger="onChange"
          >
            <InputNumber
              min={-90}
              max={90}
              step={0.000001}
              precision={6}
              placeholder="Nhập vĩ độ (WGS84)"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Loại trạm" name="loaiTram">
            <Select
              placeholder="Chọn loại trạm"
              options={[
                { label: 'Trạm radar chính', value: 'MAIN' },
                { label: 'Trạm radar phụ', value: 'SECONDARY' },
                { label: 'Trạm radar hỗ trợ', value: 'ASSIST' },
                { label: 'Khác', value: 'KAC' },
              ]}
            />
          </Form.Item>

          <Form.Item label="Cơ trình" name="coTrinh">
            <Input placeholder="Nhập cơ trình" />
          </Form.Item>

          <Form.Item
            label="Diện tích phát xạ (m²)"
            name="dienTichPhaXa"
            rules={[
              {
                validator: (_, value) => {
                  if (!value && value !== 0) return Promise.resolve();
                  if (value <= 0) return Promise.reject(new Error('Phải > 0'));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              step={1}
              placeholder="Nhập diện tích phát xạ"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Nguồn gốc" name="nguonGoc">
            <Input placeholder="Nhập nguồn gốc" />
          </Form.Item>

          <Form.Item label="Tình trạng" name="tinhTrang">
            <Select
              placeholder="Chọn tình trạng"
              options={[
                { label: 'Hoạt động tốt', value: 'TOT' },
                { label: 'Hoạt động kém', value: 'KEM' },
                { label: 'Ngừng hoạt động', value: 'NGUNG' },
              ]}
            />
          </Form.Item>

          <Form.Item label="Tài liệu đính kèm">
            <AttachmentList
              attachments={record?.attachments || []}
              readonly={false}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
              </Button>
              <Button onClick={() => navigate('/tram-radar')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
