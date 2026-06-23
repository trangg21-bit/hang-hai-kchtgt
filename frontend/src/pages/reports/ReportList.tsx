import { useState, useMemo } from 'react';
import { Card, Input, Space, Tag, Row, Col, Typography, List, Badge, Empty } from 'antd';
import { SearchOutlined, FileTextOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export interface ReportTemplate {
  code: string;
  name: string;
  category: 'assets' | 'infrastructure' | 'vessels' | 'cargo' | 'capacity' | 'maintenance';
  status: 'active' | 'proposed';
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  // Assets
  { code: 'F-141', name: 'Báo cáo tăng giảm tài sản', category: 'assets', status: 'active' },
  { code: 'F-142', name: 'Mẫu B03/CCTT: Thông tin tài chính tài sản KCHT', category: 'assets', status: 'active' },
  { code: 'F-143', name: 'Mẫu số 02: Báo cáo kê khai tài sản KCHT', category: 'assets', status: 'active' },
  { code: 'F-144', name: 'Mẫu số 03: Báo cáo tình hình quản lý tài sản KCHT', category: 'assets', status: 'active' },
  { code: 'F-145', name: 'Mẫu số 04: Báo cáo tình hình xử lý tài sản KCHT', category: 'assets', status: 'active' },
  { code: 'F-146', name: 'Mẫu số 05: Báo cáo tình hình khai thác tài sản KCHT', category: 'assets', status: 'active' },
  { code: 'F-147', name: 'Mẫu số 06: Tổng hợp danh mục TS KCHTGT đề nghị xử lý', category: 'assets', status: 'active' },
  { code: 'F-181', name: 'Biểu tổng hợp thông tin KCHTGT hàng hải', category: 'assets', status: 'active' },
  { code: 'F-188', name: 'Báo cáo kê khai, tình hình quản lý TS KCHTGT hàng hải', category: 'assets', status: 'active' },

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
  { code: 'F-182', name: 'Biểu tổng hợp thông tin bảo trì KCHTGT', category: 'maintenance', status: 'active' },
  { code: 'F-183', name: 'Biểu tổng hợp bảo trì KCHTGT - Cầu cảng', category: 'maintenance', status: 'active' },
  { code: 'F-184', name: 'Biểu tổng hợp bảo trì KCHTGT - Luồng hàng hải', category: 'maintenance', status: 'active' },
  { code: 'F-185', name: 'Biểu tổng hợp bảo trì KCHTGT - Phao tiêu', category: 'maintenance', status: 'active' },
  { code: 'F-186', name: 'Biểu tổng hợp bảo trì KCHTGT - Đèn biển', category: 'maintenance', status: 'active' },
  { code: 'F-187', name: 'Biểu tổng hợp bảo trì KCHTGT - Đê, kè', category: 'maintenance', status: 'active' },
  { code: 'F-189', name: 'Báo cáo tình hình hoạt động báo hiệu hàng hải và đê, kè', category: 'maintenance', status: 'active' },
];

export const CATEGORY_MAP = {
  assets: { label: 'Tài sản kết cấu hạ tầng', color: 'blue' },
  infrastructure: { label: 'Cơ sở hạ tầng hàng hải', color: 'purple' },
  vessels: { label: 'Hoạt động tàu thuyền & Thuyền viên', color: 'cyan' },
  cargo: { label: 'Khối lượng hàng hóa & Hành khách', color: 'orange' },
  capacity: { label: 'Năng lực vận tải & Dịch vụ', color: 'magenta' },
  maintenance: { label: 'Bảo trì & Báo cáo tổng hợp', color: 'green' },
};

export default function ReportList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredReports = useMemo(() => {
    if (!search.trim()) return REPORT_TEMPLATES;
    const lower = search.toLowerCase();
    return REPORT_TEMPLATES.filter(
      (r) => r.code.toLowerCase().includes(lower) || r.name.toLowerCase().includes(lower)
    );
  }, [search]);

  // Group by category
  const groupedReports = useMemo(() => {
    const groups: Record<string, ReportTemplate[]> = {
      assets: [],
      infrastructure: [],
      vessels: [],
      cargo: [],
      capacity: [],
      maintenance: [],
    };
    filteredReports.forEach((r) => {
      if (groups[r.category]) {
        groups[r.category].push(r);
      }
    });
    return groups;
  }, [filteredReports]);

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

      {/* Group Lists */}
      <Row gutter={[16, 16]}>
        {Object.entries(CATEGORY_MAP).map(([key, info]) => {
          const list = groupedReports[key] || [];
          if (list.length === 0) return null;

          return (
            <Col xs={24} lg={12} key={key}>
              <Card
                title={
                  <Space>
                    <Tag color={info.color} style={{ margin: 0 }}>
                      {list.length} biểu mẫu
                    </Tag>
                    <Typography.Text strong>{info.label}</Typography.Text>
                  </Space>
                }
                styles={{ body: { padding: 0 } }}
                style={{ height: '100%', minHeight: 300 }}
              >
                <List
                  dataSource={list}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        item.status === 'active' ? (
                          <ArrowRightOutlined
                            style={{ color: '#1677ff', cursor: 'pointer' }}
                            onClick={() => navigate(`/reports/${item.code}`)}
                          />
                        ) : (
                          <Tag color="default">Proposed</Tag>
                        ),
                      ]}
                      style={{
                        padding: '12px 16px',
                        cursor: item.status === 'active' ? 'pointer' : 'default',
                        backgroundColor: item.status === 'active' ? '#fafafa' : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                      onClick={() => {
                        if (item.status === 'active') {
                          navigate(`/reports/${item.code}`);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (item.status === 'active') {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (item.status === 'active') {
                          e.currentTarget.style.backgroundColor = '#fafafa';
                        }
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Badge dot={item.status === 'active'} status="success">
                            <FileTextOutlined style={{ fontSize: 20, color: item.status === 'active' ? '#1677ff' : '#8c8c8c' }} />
                          </Badge>
                        }
                        title={
                          <Space>
                            <Typography.Text code>{item.code}</Typography.Text>
                            <Typography.Text strong={item.status === 'active'} delete={item.status !== 'active' && false}>
                              {item.name}
                            </Typography.Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      {filteredReports.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px 0' }}>
          <Empty description="Không tìm thấy biểu mẫu báo cáo nào khớp với từ khóa tìm kiếm" />
        </Card>
      )}
    </Space>
  );
}
