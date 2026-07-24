import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Card,
  Table,
  Spin,
  Empty,
  Descriptions,
  Space,
  Breadcrumb,
  Modal,
  Row,
  Col,
} from 'antd';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { navigationChannelCRUD, navigationChannelApproval } from '../../services/navigationChannelService';
import { organizationService } from '../../services/organizationService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type {
  NavigationChannelResponse,
  CreateNavigationChannelRequest,
  UpdateNavigationChannelRequest,
  PheDuyetRequest,
  ApprovalStatus,
} from '../../types/navigationChannel';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

export interface NavigationChannelFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function NavigationChannelForm({ open, editId, mode, onCancel, onSuccess }: NavigationChannelFormProps = {}) {
  const navigate = useNavigate();
  const routeParams = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isIframe = window.self !== window.top;
  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeParams.id;
  const isEditMode = isModalMode ? (mode === 'edit') : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? (mode === 'detail') : (!!id && !isEditMode);
  const isCreateMode = isModalMode ? (mode === 'create') : !id;

  const [record, setRecord] = useState<NavigationChannelResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [chiTietList, setChiTietList] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        setOrganizations(resp.data || []);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    })();
  }, []);

  // Fetch detail data
  useEffect(() => {
    if (id) {
      const loadData = async () => {
        setIsLoading(true);
        setFormError(null);
        try {
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await navigationChannelCRUD.getById(id);
          setRecord(data);
          form.setFieldsValue({
            channelName: data.channelName,
            channelCode: data.channelCode,
            stationAmountt: data.stationAmountt,
            latestStationRepairDate: data.latestStationRepairDate ? dayjs(data.latestStationRepairDate) : null,
            seaportId: data.seaportId,
            operatingUnitId: data.operatingUnitId,
            location: data.location,
            detailedLocation: data.detailedLocation,
            channelManagementStation: data.channelManagementStation,
            stationStaffAmount: data.stationStaffAmount,
            latestMaintenanceYear: data.latestMaintenanceYear,
            dredgingVolume: data.dredgingVolume,
            buoyAmount: data.buoyAmount,
            beaconAmount: data.beaconAmount,
            status: data.status,
            clearanceHeight: data.clearanceHeight,
            stationArea: data.stationArea,
            note: data.note,
            orgUnitId: data.orgUnitId,
            spatialData: {
              loaiHinhHoc: data.loaiHinhHoc,
              toaDo: data.toaDo,
            }
          });
          if (data.chiTietTuyenLuongList) {
            setChiTietList(data.chiTietTuyenLuongList);
          }
        } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      form.resetFields();
      setRecord(null);
      setChiTietList([]);
    }
  }, [id, isEditMode, form, open]);

  // Fetch history
  useEffect(() => {
    if (id && isDetailMode) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          const hist = await navigationChannelApproval.getHistory(id);
          setHistory(hist);
        } catch (err) {
          setHistoryError(err instanceof Error ? err.message : 'Không tải được lịch sử');
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [id, isDetailMode, open]);

  // Chi tiết tuyến luồng handlers
  const updateChiTietField = (index: number, field: string, value: any) => {
    setChiTietList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRow = () => {
    setChiTietList((prev) => [
      ...prev,
      {
        ten: '',
        phanLoai: '',
        loaiTuyenLuong: undefined,
        chieuDai: undefined,
        rongLonNhat: undefined,
        rongNhoNhat: undefined,
        doSau: undefined,
        doSauHienTai: '',
        maiDocThietKe: '',
        khoiLuongNaoVet: undefined,
      },
    ]);
  };

  const deleteRow = (index: number) => {
    setChiTietList((prev) => prev.filter((_, i) => i !== index));
  };

  const chiTietColumns = [
    {
      title: 'STT',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Tên tuyến luồng',
      dataIndex: 'ten',
      width: 150,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateChiTietField(index, 'ten', e.target.value)}
          placeholder="Nhập tên"
          size="small"
        />
      ),
    },
    {
      title: 'Phân loại',
      dataIndex: 'phanLoai',
      width: 120,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateChiTietField(index, 'phanLoai', e.target.value)}
          placeholder="Nhập phân loại"
          size="small"
        />
      ),
    },
    {
      title: 'Loại tuyến luồng',
      dataIndex: 'loaiTuyenLuong',
      width: 150,
      render: (value: number, _: any, index: number) => (
        <Select
          value={value}
          onChange={(v) => updateChiTietField(index, 'loaiTuyenLuong', v)}
          placeholder="Chọn loại"
          size="small"
          style={{ width: '100%' }}
        >
          <Select.Option value={1}>Tuyến công cộng</Select.Option>
          <Select.Option value={2}>Tuyến chuyên dùng</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Chiều dài (km)',
      dataIndex: 'chieuDai',
      width: 120,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(v) => updateChiTietField(index, 'chieuDai', v)}
          placeholder="Chiều dài"
          size="small"
          style={{ width: '100%' }}
          min={0}
        />
      ),
    },
    {
      title: 'Rộng LN (m)',
      dataIndex: 'rongLonNhat',
      width: 110,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(v) => updateChiTietField(index, 'rongLonNhat', v)}
          placeholder="Rộng LN"
          size="small"
          style={{ width: '100%' }}
          min={0}
        />
      ),
    },
    {
      title: 'Rộng NN (m)',
      dataIndex: 'rongNhoNhat',
      width: 110,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(v) => updateChiTietField(index, 'rongNhoNhat', v)}
          placeholder="Rộng NN"
          size="small"
          style={{ width: '100%' }}
          min={0}
        />
      ),
    },
    {
      title: 'Độ sâu TK (m)',
      dataIndex: 'doSau',
      width: 110,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(v) => updateChiTietField(index, 'doSau', v)}
          placeholder="Độ sâu TK"
          size="small"
          style={{ width: '100%' }}
          min={0}
        />
      ),
    },
    {
      title: 'Độ sâu HT',
      dataIndex: 'doSauHienTai',
      width: 110,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateChiTietField(index, 'doSauHienTai', e.target.value)}
          placeholder="Độ sâu HT"
          size="small"
        />
      ),
    },
    {
      title: 'Mái dốc TK',
      dataIndex: 'maiDocThietKe',
      width: 110,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateChiTietField(index, 'maiDocThietKe', e.target.value)}
          placeholder="Mái dốc TK"
          size="small"
        />
      ),
    },
    {
      title: 'KL nạo vét (m³)',
      dataIndex: 'khoiLuongNaoVet',
      width: 120,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(v) => updateChiTietField(index, 'khoiLuongNaoVet', v)}
          placeholder="KL nạo vét"
          size="small"
          style={{ width: '100%' }}
          min={0}
        />
      ),
    },
    {
      title: 'Thao tác',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteRow(index)} />
      ),
    },
  ];

  const handleSubmitForm = async (values: any) => {
    setIsSubmitting(true);
    try {
      const spatialData = values.spatialData;
      const payload = {
        channelName: values.channelName,
        channelCode: values.channelCode,
        stationAmountt: values.stationAmountt,
        latestStationRepairDate: values.latestStationRepairDate ? values.latestStationRepairDate.format('YYYY-MM-DD') : undefined,
        seaportId: values.seaportId,
        operatingUnitId: values.operatingUnitId,
        location: values.location,
        detailedLocation: values.detailedLocation,
        channelManagementStation: values.channelManagementStation,
        stationStaffAmount: values.stationStaffAmount,
        latestMaintenanceYear: values.latestMaintenanceYear,
        dredgingVolume: values.dredgingVolume,
        buoyAmount: values.buoyAmount,
        beaconAmount: values.beaconAmount,
        status: values.status,
        clearanceHeight: values.clearanceHeight,
        stationArea: values.stationArea,
        note: values.note,
        orgUnitId: values.orgUnitId,
        loaiHinhHoc: spatialData?.loaiHinhHoc,
        toaDo: spatialData?.toaDo,
        chiTietTuyenLuongList: chiTietList,
      };

      if (isCreateMode) {
        await navigationChannelCRUD.create(payload as CreateNavigationChannelRequest);
        toast.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/navigation-channel');
        }
      } else if (id && isEditMode) {
        const res = await navigationChannelCRUD.update(id, payload as UpdateNavigationChannelRequest);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/navigation-channel');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
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
          nguoiPheDuyet: currentUser?.username || 'unknown',
          trangThai: 'APPROVED',
        };
        const res = await navigationChannelApproval.approveC1(id, pheDuyetData);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Phê duyệt C1 thành công');
        setRecord({ ...record, approvalStatus: 'UNDER_REVIEW' });
      } else if (action === 'approveC2') {
        const pheDuyetData: PheDuyetRequest = {
          nguoiPheDuyet: currentUser?.username || 'unknown',
          trangThai: 'APPROVED',
        };
        const res = await navigationChannelApproval.approveC2(id, pheDuyetData);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Phê duyệt C2 thành công');
        setRecord({ ...record, approvalStatus: 'APPROVED' });
      } else if (action === 'reject') {
        const pheDuyetData: PheDuyetRequest = {
          nguoiPheDuyet: currentUser?.username || 'unknown',
          trangThai: 'REJECTED',
          lyDo: payload?.lyDo as string,
        };

        let updatedRecord;
        if (record.approvalStatus === 'PROPOSED' || record.approvalStatus === 'REJECTED') {
          updatedRecord = await navigationChannelApproval.approveC1(id, pheDuyetData);
        } else if (record.approvalStatus === 'UNDER_REVIEW') {
          updatedRecord = await navigationChannelApproval.approveC2(id, pheDuyetData);
        }
        if (updatedRecord && window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updatedRecord;
        }

        toast.success('Từ chối thành công');
        setRecord({ ...record, approvalStatus: 'REJECTED', rejectionReason: payload?.lyDo as string });
      } else if (action === 'delete') {
        await navigationChannelCRUD.delete(id);
        toast.success('Xóa thành công');
        if (isModalMode && onSuccess) {
          onSuccess();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/navigation-channel');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Luồng hàng hải', onClick: () => navigate('/navigation-channel') },
    { title: isCreateMode ? 'Tạo mới' : isEditMode ? 'Chỉnh sửa' : 'Chi tiết' },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Spin fullscreen description="Đang tải..." />
      </div>
    );
  }

  if (formError) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Empty description={formError} style={{ marginTop: '50px' }} />
          <Button onClick={() => navigate('/navigation-channel')} style={{ marginTop: '16px' }}>
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  // Detail/Read-only view
  if (isDetailMode) {
    const detailContent = (
      <Spin spinning={isLoading}>
        <Card style={{ marginBottom: '24px' }} bordered={!isModalMode}>
          {!isModalMode && <h2>Chi tiết Luồng Hàng Hải</h2>}
          {record && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Tên luồng hàng hải">{record.channelName}</Descriptions.Item>
              <Descriptions.Item label="Mã luồng hàng hải">{record.channelCode ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Số lượng trạm">{record.stationAmountt ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Thời điểm sửa chữa trạm gần nhất">
                {record.latestStationRepairDate ? dayjs(record.latestStationRepairDate).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cảng biển ID">{record.seaportId ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Đơn vị vận hành ID">{record.operatingUnitId ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Địa điểm">{record.location ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Địa điểm chi tiết">{record.detailedLocation ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Trạm quản lý luồng">{record.channelManagementStation ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Số lượng nhân sự tại trạm">{record.stationStaffAmount ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Năm bảo trì gần nhất">{record.latestMaintenanceYear ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Khối lượng nạo vét">{record.dredgingVolume ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Số lượng phao">{record.buoyAmount ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Số lượng tiêu">{record.beaconAmount ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Tình trạng">{record.status ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Chiều cao tĩnh không">{record.clearanceHeight ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Diện tích trạm">{record.stationArea ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {record.note ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn vị quản lý" span={2}>
                {record.orgUnitId ? organizations.find(o => o.id === record.orgUnitId)?.name || record.orgUnitId : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <ApprovalStatusBadge status={record.approvalStatus} />
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>

        {/* Chi tiết tuyến luồng — read-only table for detail view */}
        {isDetailMode && chiTietList.length > 0 && (
          <Card size="small" title="Chi tiết tuyến luồng" style={{ marginBottom: 16 }} bordered={!isModalMode}>
            <Table
              dataSource={chiTietList}
              pagination={false}
              size="small"
              rowKey={(_, index) => index!.toString()}
              scroll={{ x: 'max-content' }}
              columns={[
                { title: 'STT', width: 50, render: (_: any, __: any, index: number) => index + 1 },
                { title: 'Tên tuyến luồng', dataIndex: 'ten', width: 200, ellipsis: true },
                { title: 'Phân loại', dataIndex: 'phanLoai', width: 100 },
                {
                  title: 'Loại tuyến', width: 130,
                  render: (_: any, record: any) => record.loaiTuyenLuong === 1 ? 'Công cộng' : record.loaiTuyenLuong === 2 ? 'Chuyên dùng' : '—'
                },
                { title: 'Dài (km)', dataIndex: 'chieuDai', width: 100 },
                { title: 'Rộng LN (m)', dataIndex: 'rongLonNhat', width: 110 },
                { title: 'Rộng NN (m)', dataIndex: 'rongNhoNhat', width: 110 },
                { title: 'Độ sâu (m)', dataIndex: 'doSau', width: 100 },
                { title: 'Mái dốc', dataIndex: 'maiDocThietKe', width: 100 },
                { title: 'Độ sâu HT (m)', dataIndex: 'doSauHienTai', width: 110 },
                { title: 'KL nạo vét (m³)', dataIndex: 'khoiLuongNaoVet', width: 130 },
                {
                  title: 'Công cộng', width: 90,
                  render: (_: any, record: any) => record.congCong ? '✓' : ''
                },
                {
                  title: 'Chuyên dùng', width: 90,
                  render: (_: any, record: any) => record.chuyenDung ? '✓' : ''
                },
              ]}
            />
          </Card>
        )}

        {/* Tài liệu đính kèm */}
        {record?.attachments && record.attachments.length > 0 && (
          <Card style={{ marginBottom: '24px' }} bordered={!isModalMode}>
            <h3>Tài liệu đính kèm</h3>
            <AttachmentList attachments={record.attachments} readonly={true} />
          </Card>
        )}

        {/* Approval Action Bar */}
        {record && (
          <Card style={{ marginBottom: '24px' }} bordered={!isModalMode}>
            <ApprovalActionBar
              currentStatus={record.approvalStatus as ApprovalStatus}
              permissions={userPermissions}
              entityPermissionPrefix="navigationchannel"
              currentUserId={currentUser?.username}
              nguoiPheDuyetC1={record.approverLevel1}
              onAction={handleApprovalAction}
              loading={isSubmitting}
            />
          </Card>
        )}

        {/* History Timeline */}
        {record && (
          <Card bordered={!isModalMode}>
            <h3>Lịch sử phê duyệt</h3>
            <HistoryTimeline
              history={history}
              loading={isLoadingHistory}
              error={historyError || undefined}
              onRetry={() => {
                setIsLoadingHistory(true);
                navigationChannelApproval
                  .getHistory(id)
                  .then(setHistory)
                  .catch((err) => setHistoryError(err instanceof Error ? err.message : 'Lỗi'))
                  .finally(() => setIsLoadingHistory(false));
              }}
            />
          </Card>
        )}
      </Spin>
    );

    if (isModalMode) {
      return (
        <Modal
          title="Chi tiết Luồng Hàng Hải"
          open={open}
          onCancel={onCancel}
          footer={null}
          width={900}
          destroyOnClose
          maskClosable={false}
        >
          {detailContent}
        </Modal>
      );
    }

    return (
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />
        {detailContent}
      </div>
    );
  }

  if (isModalMode) {
    return (
      <Modal
        title={isCreateMode ? 'Tạo mới Luồng Hàng Hải' : 'Chỉnh sửa Luồng Hàng Hải'}
        open={open}
        onCancel={onCancel}
        footer={null}
        destroyOnClose
        maskClosable={false}
        width={1000}
      >
        <Spin spinning={isLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitForm}
            autoComplete="off"
          >
            <Form.Item
              label="Tên luồng hàng hải"
              name="channelName"
              rules={[{ required: true, message: 'Vui lòng nhập tên luồng hàng hải' }]}
            >
              <Input placeholder="Nhập tên luồng hàng hải" />
            </Form.Item>

            <Form.Item
              label="Mã luồng hàng hải"
              name="channelCode"
              rules={[{ required: true, message: 'Vui lòng nhập mã luồng hàng hải' }]}
            >
              <Input placeholder="Nhập mã luồng hàng hải" />
            </Form.Item>

            <Form.Item
              label="Số lượng trạm"
              name="stationAmountt"
              rules={[
                { pattern: /^\d+$/, message: 'Phải là số nguyên' },
                {
                  validator: (_, value) => {
                    if (value === null || value === undefined || value === '') return Promise.resolve();
                    if (Number(value) > 2147483647) {
                      return Promise.reject(new Error('Số lượng không được vượt quá 2,147,483,647'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber min={0} max={2147483647} placeholder="Nhập số lượng trạm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Thời điểm sửa chữa trạm gần nhất"
              name="latestStationRepairDate"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (dayjs(value).isAfter(dayjs())) {
                      return Promise.reject(new Error('Thời điểm sửa chữa không được là ngày tương lai'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker placeholder="Chọn thời điểm sửa chữa" />
            </Form.Item>

            <Form.Item
              label="Trạm quản lý luồng"
              name="channelManagementStation"
            >
              <Input placeholder="Nhập trạm quản lý luồng" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Cảng biển" name="seaportId">
                  <Input placeholder="Nhập ID cảng biển" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Đơn vị vận hành" name="operatingUnitId">
                  <Input placeholder="Nhập ID đơn vị vận hành" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Địa điểm" name="location">
                  <Input placeholder="Nhập địa điểm" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Địa điểm chi tiết" name="detailedLocation">
                  <Input placeholder="Nhập địa điểm chi tiết" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Tình trạng" name="status">
                  <Select placeholder="Chọn tình trạng" allowClear>
                    <Select.Option value={1}>Hoạt động</Select.Option>
                    <Select.Option value={2}>Ngừng hoạt động</Select.Option>
                    <Select.Option value={3}>Đang bảo trì</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Chiều cao tĩnh không" name="clearanceHeight">
                  <Input placeholder="Nhập chiều cao tĩnh không" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Số lượng nhân sự tại trạm"
              name="stationStaffAmount"
            >
              <InputNumber min={0} placeholder="Nhập số lượng nhân sự" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Năm bảo trì gần nhất"
              name="latestMaintenanceYear"
            >
              <InputNumber min={1900} max={2100} placeholder="Nhập năm bảo trì" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Khối lượng nạo vét"
              name="dredgingVolume"
            >
              <InputNumber min={0} placeholder="Nhập khối lượng nạo vét" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Số lượng phao"
              name="buoyAmount"
            >
              <InputNumber min={0} placeholder="Nhập số lượng phao" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Số lượng tiêu"
              name="beaconAmount"
            >
              <InputNumber min={0} placeholder="Nhập số lượng tiêu" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Diện tích trạm"
              name="stationArea"
            >
              <InputNumber min={0} placeholder="Nhập diện tích trạm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Đơn vị quản lý"
              name="orgUnitId"
            >
              <Select
                placeholder="Chọn đơn vị quản lý"
                allowClear
                options={organizations.map((org) => ({
                  value: org.id,
                  label: org.code ? `${org.code} - ${org.name}` : org.name,
                }))}
              />
            </Form.Item>

            <Form.Item label="Ghi chú" name="note">
              <Input.TextArea
                placeholder="Nhập ghi chú"
                maxLength={500}
                showCount
                rows={4}
              />
            </Form.Item>

            <Card size="small" title="Thông tin chi tiết luồng" style={{ marginTop: 16, marginBottom: 16 }}>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addRow} style={{ marginBottom: 8 }}>
                Thêm tuyến luồng
              </Button>
              <Table
                dataSource={chiTietList}
                columns={chiTietColumns}
                pagination={false}
                size="small"
                rowKey={(_, index) => index!.toString()}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            <Form.Item>
              <Space style={{ display: 'flex', justifyContent: 'end', marginTop: 16 }}>
                <Button onClick={onCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    );
  }

  // Create/Edit form view
  return (
    <div style={isIframe ? { padding: '16px 24px', background: '#fff', minHeight: '100vh' } : { padding: '24px' }}>
      {!isIframe && <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />}
      <Card
        style={isIframe ? { border: 'none', boxShadow: 'none', padding: 0 } : { maxWidth: '800px' }}
        styles={isIframe ? { body: { padding: 0 } } : undefined}
      >
        {!isIframe && <h2>{isCreateMode ? 'Tạo mới Luồng Hàng Hải' : 'Chỉnh sửa Luồng Hàng Hải'}</h2>}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
        >
          <Form.Item
            label="Tên luồng hàng hải"
            name="channelName"
            rules={[{ required: true, message: 'Vui lòng nhập tên luồng hàng hải' }]}
          >
            <Input placeholder="Nhập tên luồng hàng hải" />
          </Form.Item>

          <Form.Item
            label="Mã luồng hàng hải"
            name="channelCode"
            rules={[{ required: true, message: 'Vui lòng nhập mã luồng hàng hải' }]}
          >
            <Input placeholder="Nhập mã luồng hàng hải" />
          </Form.Item>

          <Form.Item
            label="Số lượng trạm"
            name="stationAmountt"
            rules={[
              { pattern: /^\d+$/, message: 'Phải là số nguyên' },
              {
                validator: (_, value) => {
                  if (value === null || value === undefined || value === '') return Promise.resolve();
                  if (Number(value) > 2147483647) {
                    return Promise.reject(new Error('Số lượng không được vượt quá 2,147,483,647'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber min={0} max={2147483647} placeholder="Nhập số lượng trạm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Thời điểm sửa chữa trạm gần nhất"
            name="latestStationRepairDate"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (dayjs(value).isAfter(dayjs())) {
                    return Promise.reject(new Error('Thời điểm sửa chữa không được là ngày tương lai'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker placeholder="Chọn thời điểm sửa chữa" />
          </Form.Item>

          <Form.Item
            label="Trạm quản lý luồng"
            name="channelManagementStation"
          >
            <Input placeholder="Nhập trạm quản lý luồng" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Cảng biển" name="seaportId">
                <Input placeholder="Nhập ID cảng biển" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Đơn vị vận hành" name="operatingUnitId">
                <Input placeholder="Nhập ID đơn vị vận hành" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Địa điểm" name="location">
                <Input placeholder="Nhập địa điểm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Địa điểm chi tiết" name="detailedLocation">
                <Input placeholder="Nhập địa điểm chi tiết" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tình trạng" name="status">
                <Select placeholder="Chọn tình trạng" allowClear>
                  <Select.Option value={1}>Hoạt động</Select.Option>
                  <Select.Option value={2}>Ngừng hoạt động</Select.Option>
                  <Select.Option value={3}>Đang bảo trì</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Chiều cao tĩnh không" name="clearanceHeight">
                <Input placeholder="Nhập chiều cao tĩnh không" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Số lượng nhân sự tại trạm"
            name="stationStaffAmount"
          >
            <InputNumber min={0} placeholder="Nhập số lượng nhân sự" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Năm bảo trì gần nhất"
            name="latestMaintenanceYear"
          >
            <InputNumber min={1900} max={2100} placeholder="Nhập năm bảo trì" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Khối lượng nạo vét"
            name="dredgingVolume"
          >
            <InputNumber min={0} placeholder="Nhập khối lượng nạo vét" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Số lượng phao"
            name="buoyAmount"
          >
            <InputNumber min={0} placeholder="Nhập số lượng phao" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Số lượng tiêu"
            name="beaconAmount"
          >
            <InputNumber min={0} placeholder="Nhập số lượng tiêu" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Diện tích trạm"
            name="stationArea"
          >
            <InputNumber min={0} placeholder="Nhập diện tích trạm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Đơn vị quản lý"
            name="orgUnitId"
          >
            <Select
              placeholder="Chọn đơn vị quản lý"
              allowClear
              options={organizations.map((org) => ({
                value: org.id,
                label: org.code ? `${org.code} - ${org.name}` : org.name,
              }))}
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea
              placeholder="Nhập ghi chú"
              maxLength={500}
              showCount
              rows={4}
            />
          </Form.Item>

            <Form.Item label="Vị trí/Hình vẽ bản đồ" name="spatialData">
              <GisLocationSelector defaultGeometryType="LINE" />
            </Form.Item>

            <Card size="small" title="Thông tin chi tiết luồng" style={{ marginTop: 16, marginBottom: 16 }}>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addRow} style={{ marginBottom: 8 }}>
                Thêm tuyến luồng
              </Button>
              <Table
                dataSource={chiTietList}
                columns={chiTietColumns}
                pagination={false}
                size="small"
                rowKey={(_, index) => index!.toString()}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
                </Button>
                <Button onClick={isIframe ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*') : () => navigate('/navigation-channel')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
