import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  fetchKeHoachKiemKeList,
  createKeHoachKiemKe,
  fetchBaoCaoKiemKeList,
  createBaoCaoKiemKe,
} from '../../services/assetmovement/api';
import type { KeHoachKiemKeResponse, KeHoachKiemKeRequest, BaoCaoKiemKeResponse, BaoCaoKiemKeRequest } from '../../services/assetmovement/types';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

export default function InventoryList() {
  const [activeTab, setActiveTab] = useState('1');
  const [plans, setPlans] = useState<KeHoachKiemKeResponse[]>([]);
  const [reports, setReports] = useState<BaoCaoKiemKeResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination states for Plans
  const [planPage, setPlanPage] = useState(1);
  const [planPageSize, setPlanPageSize] = useState(10);
  const [planTotal, setPlanTotal] = useState(0);

  // Pagination states for Reports
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(10);
  const [reportTotal, setReportTotal] = useState(0);

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [planForm] = Form.useForm();
  const [reportForm] = Form.useForm();

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchKeHoachKiemKeList({
        page: planPage - 1,
        size: planPageSize,
      });
      setPlans(res.content || []);
      setPlanTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách kế hoạch kiểm kê');
    } finally {
      setLoading(false);
    }
  }, [planPage, planPageSize]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBaoCaoKiemKeList({
        page: reportPage - 1,
        size: reportPageSize,
      });
      setReports(res.content || []);
      setReportTotal(res.totalElements || 0);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách báo cáo kiểm kê');
    } finally {
      setLoading(false);
    }
  }, [reportPage, reportPageSize]);

  useEffect(() => {
    if (activeTab === '1') {
      loadPlans();
    } else {
      loadReports();
    }
  }, [activeTab, loadPlans, loadReports]);

  const handleCreatePlan = async () => {
    try {
      const values = await planForm.validateFields();
      const payload: KeHoachKiemKeRequest = {
        ...values,
        ngayBatDau: values.ngayBatDau ? values.ngayBatDau.toISOString() : dayjs().toISOString(),
        ngayKetThuc: values.ngayKetThuc ? values.ngayKetThuc.toISOString() : dayjs().toISOString(),
      };
      await createKeHoachKiemKe(payload);
      message.success('Tạo kế hoạch kiểm kê thành công!');
      setIsPlanModalOpen(false);
      planForm.resetFields();
      loadPlans();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi tạo kế hoạch');
    }
  };

  const handleCreateReport = async () => {
    try {
      const values = await reportForm.validateFields();
      const payload: BaoCaoKiemKeRequest = {
        ...values,
      };
      await createBaoCaoKiemKe(payload);
      message.success('Tạo báo cáo kiểm kê thành công!');
      setIsReportModalOpen(false);
      reportForm.resetFields();
      loadReports();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi tạo báo cáo');
    }
  };

  const planColumns = [
    {
      title: 'Tên kế hoạch',
      dataIndex: 'tenKeHoach',
      key: 'tenKeHoach',
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
      key: 'moTa',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (status: string) => (
        <Tag color={status === 'COMPLETED' ? 'success' : 'warning'}>
          {status === 'COMPLETED' ? 'Hoàn thành' : 'Đang thực hiện'}
        </Tag>
      ),
    },
    {
      title: 'Người lập',
      dataIndex: 'createdByName',
      key: 'createdByName',
    },
  ];

  const reportColumns = [
    {
      title: 'Tên báo cáo',
      dataIndex: 'tenBaoCao',
      key: 'tenBaoCao',
    },
    {
      title: 'Tổng số lượng kiểm',
      dataIndex: 'tongSoLuong',
      key: 'tongSoLuong',
    },
    {
      title: 'Số lượng chênh lệch',
      dataIndex: 'soLuongChenhLech',
      key: 'soLuongChenhLech',
      render: (val: number) => (
        <span style={{ color: val !== 0 ? 'red' : 'inherit', fontWeight: val !== 0 ? 'bold' : 'normal' }}>
          {val}
        </span>
      ),
    },
    {
      title: 'Kết quả kiểm kê',
      dataIndex: 'ketQua',
      key: 'ketQua',
    },
    {
      title: 'Mô tả chi tiết',
      dataIndex: 'moTa',
      key: 'moTa',
    },
    {
      title: 'Người lập báo cáo',
      dataIndex: 'createdByName',
      key: 'createdByName',
    },
  ];

  return (
    <Card
      title="Kiểm kê tài sản KCHTGT"
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => (activeTab === '1' ? loadPlans() : loadReports())}
          />
          {activeTab === '1' ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsPlanModalOpen(true)}
            >
              Lập kế hoạch
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsReportModalOpen(true)}
            >
              Lập báo cáo
            </Button>
          )}
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
        <TabPane tab="Kế hoạch kiểm kê" key="1">
          <Table
            dataSource={plans}
            columns={planColumns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: planPage,
              pageSize: planPageSize,
              total: planTotal,
              onChange: (p, s) => {
                setPlanPage(p);
                setPlanPageSize(s);
              },
              showSizeChanger: true,
              showTotal: (totalCount) => `Tổng ${totalCount} kế hoạch`,
              locale: { items_per_page: '/ trang' },
            }}
          />
        </TabPane>
        <TabPane tab="Báo cáo kiểm kê" key="2">
          <Table
            dataSource={reports}
            columns={reportColumns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: reportPage,
              pageSize: reportPageSize,
              total: reportTotal,
              onChange: (p, s) => {
                setReportPage(p);
                setReportPageSize(s);
              },
              showSizeChanger: true,
              showTotal: (totalCount) => `Tổng ${totalCount} báo cáo`,
              locale: { items_per_page: '/ trang' },
            }}
          />
        </TabPane>
      </Tabs>

      {/* Plan Modal */}
      <Modal
        title="Lập kế hoạch kiểm kê mới"
        open={isPlanModalOpen}
        onOk={handleCreatePlan}
        onCancel={() => setIsPlanModalOpen(false)}
        okText="Tạo kế hoạch"
        cancelText="Hủy"
      >
        <Form form={planForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="tenKeHoach"
            label="Tên kế hoạch"
            rules={[{ required: true, message: 'Vui lòng nhập tên kế hoạch' }]}
          >
            <Input placeholder="Ví dụ: Kiểm kê định kỳ tài sản cảng năm 2026" />
          </Form.Item>

          <Form.Item
            name="phamVi"
            label="Phạm vi kiểm kê"
            rules={[{ required: true, message: 'Vui lòng nhập phạm vi' }]}
          >
            <Input placeholder="Ví dụ: Khu vực cảng Hải Phòng, các bến phao phụ cận" />
          </Form.Item>

          <Form.Item
            name="loaiKiemKe"
            label="Loại kiểm kê"
            initialValue="DINH_KY"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="DINH_KY">Định kỳ hàng năm</Select.Option>
              <Select.Option value="DOT_XUAT">Đột xuất / Bất thường</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="ngayBatDau"
            label="Ngày bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="ngayKetThuc"
            label="Ngày kết thúc"
            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="toTruongKiemKe"
            label="Tổ trưởng kiểm kê"
            rules={[{ required: true, message: 'Vui lòng nhập người phụ trách' }]}
          >
            <Input placeholder="Nhập tên người chỉ đạo..." />
          </Form.Item>

          <Form.Item name="moTa" label="Mô tả chi tiết">
            <Input.TextArea placeholder="Nhập mô tả thêm..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Report Modal */}
      <Modal
        title="Lập báo cáo kết quả kiểm kê"
        open={isReportModalOpen}
        onOk={handleCreateReport}
        onCancel={() => setIsReportModalOpen(false)}
        okText="Lập báo cáo"
        cancelText="Hủy"
      >
        <Form form={reportForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="keHoachId"
            label="Kế hoạch kiểm kê liên quan"
            rules={[{ required: true, message: 'Vui lòng chọn kế hoạch' }]}
          >
            <Select placeholder="Chọn kế hoạch đã lập...">
              {plans.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.tenKeHoach}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="tenBaoCao"
            label="Tên báo cáo kết quả"
            rules={[{ required: true, message: 'Vui lòng nhập tên báo cáo' }]}
          >
            <Input placeholder="Ví dụ: Báo cáo kết quả kiểm kê đợt 1 năm 2026" />
          </Form.Item>

          <Form.Item
            name="tongSoLuong"
            label="Tổng số lượng tài sản kiểm đếm"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          >
            <Input placeholder="Nhập tổng số lượng tài sản thực tế..." type="number" />
          </Form.Item>

          <Form.Item
            name="soLuongChenhLech"
            label="Số lượng chênh lệch (Thừa/Thiếu)"
            rules={[{ required: true, message: 'Vui lòng nhập chênh lệch' }]}
          >
            <Input placeholder="Ví dụ: -2 (thiếu 2), 0 (khớp), 1 (thừa 1)..." type="number" />
          </Form.Item>

          <Form.Item
            name="ketQua"
            label="Nhận xét / Kết luận kiểm kê"
            rules={[{ required: true, message: 'Vui lòng nhập kết quả' }]}
          >
            <Input placeholder="Ví dụ: Khớp số liệu, hoặc Có sai lệch cần làm rõ..." />
          </Form.Item>

          <Form.Item name="moTa" label="Mô tả/Ý kiến đề xuất">
            <Input.TextArea placeholder="Nhập các đề xuất khắc phục..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
