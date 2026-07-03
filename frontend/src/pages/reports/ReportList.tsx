import { useState, useMemo, useEffect } from 'react';
import { Card, Input, Space, Tag, Typography, Empty, Tree } from 'antd';
import { SearchOutlined, FileTextOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export interface ReportTemplate {
  code: string;
  name: string;
  category: 'assets' | 'infrastructure' | 'vessels' | 'cargo' | 'capacity' | 'maintenance';
  status: 'active' | 'proposed';
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  // Assets
  { code: 'F-141', name: 'Báo cáo thống kê tăng giảm tài sản', category: 'assets', status: 'active' },
  { code: 'F-142', name: 'Mẫu B04a/BCTC: Thuyết minh chi tiết số liệu tài sản KCHT đơn vị được giao quản lý nhưng không trực tiếp khai thác, sử dụng', category: 'assets', status: 'active' },
  { code: 'F-143', name: 'Mẫu số 02: Báo cáo kê khai tài sản kết cấu hạ tầng hàng hải', category: 'assets', status: 'active' },
  { code: 'F-144', name: 'Mẫu số 03: Báo cáo tình hình quản lý tài sản kết cấu hạ tầng hàng hải', category: 'assets', status: 'active' },
  { code: 'F-145', name: 'Mẫu số 04: Báo cáo tình hình xử lý tài sản kết cấu hạ tầng hàng hải', category: 'assets', status: 'active' },
  { code: 'F-146', name: 'Mẫu số 05: Báo cáo tình hình khai thác tài sản kết cấu hạ tầng hàng hải', category: 'assets', status: 'active' },
  { code: 'F-147', name: 'Mẫu số 06: Tổng hợp danh mục TS KCHTGT hàng hải đề nghị xử lý', category: 'assets', status: 'active' },

  // Infrastructure
  { code: 'F-148', name: 'Biểu 01-N: Năng lực thông qua bến cảng, cầu cảng', category: 'infrastructure', status: 'active' },
  { code: 'F-149', name: 'Biểu 01B-N: Năng lực thông qua cảng biển', category: 'infrastructure', status: 'active' },
  { code: 'F-150', name: 'Biểu 02-N: Thống kê cầu cảng', category: 'infrastructure', status: 'active' },
  { code: 'F-151', name: 'Biểu 03-Q/N: Thống kê luồng hàng hải', category: 'infrastructure', status: 'active' },
  { code: 'F-152', name: 'Biểu 04-6T/N: Thống kê vùng đón/trả hoa tiêu, vùng quay trở', category: 'infrastructure', status: 'active' },
  { code: 'F-153', name: 'Biểu 04B-N: Thống kê khu chuyển tải, khu neo đậu', category: 'infrastructure', status: 'active' },
  { code: 'F-154', name: 'Biểu 05-N: Thống kê bến phao, khu neo đậu', category: 'infrastructure', status: 'active' },
  { code: 'F-155', name: 'Biểu 06-N: Thống kê hệ thống đèn biển', category: 'infrastructure', status: 'active' },
  { code: 'F-156', name: 'Biểu 07-6T/N: Thống kê hệ thống phao tiêu', category: 'infrastructure', status: 'active' },
  { code: 'F-157', name: 'Biểu 07B-6T/N: Thống kê phao tiêu báo hiệu', category: 'infrastructure', status: 'active' },
  { code: 'F-158', name: 'Biểu 08-N: Thống kê hệ thống giám sát VTS', category: 'infrastructure', status: 'active' },
  { code: 'F-159', name: 'Biểu 09-N: Hệ thống đài thông tin duyên hải', category: 'infrastructure', status: 'active' },
  { code: 'F-160', name: 'Biểu 10-N: Thống kê hệ thống đê, kè chắn sóng', category: 'infrastructure', status: 'active' },

  // Vessels
  { code: 'F-161', name: 'Biểu 11-T: Báo cáo chi tiết tàu biển ra vào cảng', category: 'vessels', status: 'active' },
  { code: 'F-162', name: 'Biểu 11B-T: Báo cáo chi tiết phương tiện thủy nội địa', category: 'vessels', status: 'active' },
  { code: 'F-163', name: 'Biểu 16-Q: Thống kê tàu biển nước ngoài đến, rời', category: 'vessels', status: 'active' },
  { code: 'F-164', name: 'Biểu 17-Q: Thống kê tàu biển VN vận tải quốc tế', category: 'vessels', status: 'active' },
  { code: 'F-167', name: 'Biểu 13-T: Lượt tàu thuyền vào rời cảng biển', category: 'vessels', status: 'active' },
  { code: 'F-171', name: 'Biểu 22-6T/N: Thống kê tàu biển quốc tịch VN', category: 'vessels', status: 'active' },
  { code: 'F-172', name: 'Biểu 23-N: Thống kê tàu thuyền hoạt động lai dắt', category: 'vessels', status: 'active' },
  { code: 'F-173', name: 'Biểu 31-N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu', category: 'vessels', status: 'active' },

  // Cargo
  { code: 'F-165', name: 'Biểu 12-T: Khối lượng hàng hóa, hành khách theo tháng', category: 'cargo', status: 'active' },
  { code: 'F-166', name: 'Biểu 12-N: Khối lượng hàng hóa theo năm', category: 'cargo', status: 'active' },
  { code: 'F-168', name: 'Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu', category: 'cargo', status: 'active' },
  { code: 'F-169', name: 'Biểu 15-T: Khối lượng hàng hóa trong khu quản lý', category: 'cargo', status: 'active' },
  { code: 'F-174', name: 'Biểu 45-6T/N: Báo cáo tổng hợp hàng hóa thông qua cảng', category: 'cargo', status: 'active' },
  { code: 'F-177', name: 'Biểu 28-T: Khối lượng hàng hóa theo tháng', category: 'cargo', status: 'active' },
  { code: 'F-178', name: 'Biểu 29-N: Khối lượng hàng hóa theo năm', category: 'cargo', status: 'active' },

  // Capacity
  { code: 'F-170', name: 'Biểu 21-6T/N: Thống kê thuyền viên, hiệu', category: 'capacity', status: 'active' },
  { code: 'F-175', name: 'Biểu số 06-N: Năng lực thông qua bến cảng (Thông tư 48)', category: 'capacity', status: 'active' },
  { code: 'F-176', name: 'Biểu 07-N: Năng lực thông qua cảng biển, thủy nội địa', category: 'capacity', status: 'active' },
  { code: 'F-179', name: 'Biểu 33-N: Sản lượng dịch vụ vận tải, doanh nghiệp', category: 'capacity', status: 'active' },

  // Maintenance
  { code: 'F-180', name: 'Biểu tổng hợp thông tin chung', category: 'maintenance', status: 'active' },
  { code: 'F-181', name: 'Biểu tổng hợp thông tin KCHTGT hàng hải', category: 'maintenance', status: 'active' },
  { code: 'F-182', name: 'Biểu tổng hợp thông tin bảo trì KCHTGT', category: 'maintenance', status: 'active' },
  { code: 'F-183', name: 'Biểu tổng hợp bảo trì KCHTGT - Cầu cảng', category: 'maintenance', status: 'active' },
  { code: 'F-184', name: 'Biểu tổng hợp bảo trì KCHTGT - Luồng hàng hải', category: 'maintenance', status: 'active' },
  { code: 'F-185', name: 'Biểu tổng hợp bảo trì KCHTGT - Phao tiêu', category: 'maintenance', status: 'active' },
  { code: 'F-186', name: 'Biểu tổng hợp bảo trì KCHTGT - Đèn biển', category: 'maintenance', status: 'active' },
  { code: 'F-187', name: 'Biểu tổng hợp bảo trì KCHTGT - Đê, kè', category: 'maintenance', status: 'active' },
  { code: 'F-188', name: 'Báo cáo kê khai, tình hình quản lý TS KCHTGT hàng hải', category: 'maintenance', status: 'active' },
  { code: 'F-189', name: 'Báo cáo tình hình hoạt động báo hiệu hàng hải và đê, kè', category: 'maintenance', status: 'active' },
];

export const CATEGORY_MAP = {
  assets: { label: 'Báo cáo thống kê chung', color: 'blue' },
  infrastructure: { label: 'Nhóm chỉ tiêu kết cấu hạ tầng', color: 'purple' },
  vessels: { label: 'Hoạt động tàu thuyền & Thuyền viên', color: 'cyan' },
  cargo: { label: 'Khối lượng hàng hóa & Hành khách', color: 'orange' },
  capacity: { label: 'Năng lực vận tải & Dịch vụ', color: 'magenta' },
  maintenance: { label: 'Bảo trì & Báo cáo tổng hợp', color: 'green' },
};

export default function ReportList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const filteredReports = useMemo(() => {
    if (!search.trim()) return REPORT_TEMPLATES;
    const lower = search.toLowerCase();
    return REPORT_TEMPLATES.filter(
      (r) => r.code.toLowerCase().includes(lower) || r.name.toLowerCase().includes(lower)
    );
  }, [search]);

  // Group by category and build tree data
  const treeData = useMemo(() => {
    const data: any[] = [];
    Object.entries(CATEGORY_MAP).forEach(([key, info]) => {
      const list = filteredReports.filter((r) => r.category === key);
      if (list.length > 0) {
        data.push({
          title: (
            <Space style={{ padding: '4px 0' }}>
              <Typography.Text strong style={{ fontSize: 15 }}>{info.label}</Typography.Text>
              <Tag color={info.color} style={{ margin: 0 }}>{list.length} biểu mẫu</Tag>
            </Space>
          ),
          key: key,
          icon: ({ expanded }: { expanded: boolean }) =>
            expanded ? (
              <FolderOpenOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            ) : (
              <FolderOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            ),
          children: list.map((item) => ({
            title: (
              <Space style={{ padding: '2px 0' }}>
                <Typography.Text code style={{ color: '#1677ff', fontWeight: 'bold' }}>{item.code}</Typography.Text>
                <Typography.Text style={{ fontSize: 14 }}>{item.name}</Typography.Text>
              </Space>
            ),
            key: item.code,
            isLeaf: true,
            icon: <FileTextOutlined style={{ color: '#52c41a', fontSize: 15 }} />,
          })),
        });
      }
    });
    return data;
  }, [filteredReports]);

  // Auto-expand all categories when searching
  useEffect(() => {
    if (search.trim()) {
      setExpandedKeys(Object.keys(CATEGORY_MAP));
    } else {
      setExpandedKeys([]);
    }
  }, [search]);

  const onSelect = (_selectedKeys: any, info: any) => {
    if (info.node.isLeaf) {
      navigate(`/reports/${info.node.key}`);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Search Header */}
      <Card>
        <Typography.Title level={4} style={{ margin: 0, marginBottom: 12 }}>
          Danh mục biểu mẫu báo cáo & thống kê
        </Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Hệ thống cung cấp 49 mẫu biểu thống kê chuyên ngành theo Thông tư 48, Thông tư 67 và Nghị định 43.
        </Typography.Text>
        <Input
          placeholder="Tìm theo mã biểu (F-141) hoặc tên biểu mẫu báo cáo..."
          allowClear
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 500 }}
          size="large"
        />
      </Card>

      {/* Tree list catalog */}
      {treeData.length > 0 ? (
        <Card styles={{ body: { padding: '16px 24px' } }}>
          <Tree
            showIcon
            blockNode
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys)}
            onSelect={onSelect}
            treeData={treeData}
            style={{ fontSize: 15 }}
          />
        </Card>
      ) : (
        <Card style={{ textAlign: 'center', padding: '40px 0' }}>
          <Empty description="Không tìm thấy biểu mẫu báo cáo nào khớp với từ khóa tìm kiếm" />
        </Card>
      )}
    </Space>
  );
}
