import { Card, Row, Col, Typography, Space, Button, Statistic } from 'antd';
import {
  CompassOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  ApiOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermissionStore } from '../store/permissionStore';

const { Title, Text } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 0 24px 0' }}>
      {/* Welcome Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          border: 'none',
          borderRadius: 12,
          color: '#fff',
          padding: '24px 16px',
          marginBottom: 24,
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.25)',
        }}
      >
        <Space direction="vertical" size="small">
          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
            {getGreeting()}, {user?.fullName || 'Người dùng'}
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16 }}>
            Chào mừng bạn đến với Hệ thống Quản trị kết cấu hạ tầng giao thông đường thủy và hàng hải.
          </Text>
        </Space>
      </Card>

      {/* Grid of Main Modules */}
      <Title level={4} style={{ marginBottom: 16 }}>Chức năng chính</Title>
      
      <Row gutter={[16, 16]}>
        {/* GIS & Bản đồ */}
        {hasPerm('data:read') && (
          <Col xs={24} sm={12} md={8}>
            <Card
              hoverable
              actions={[
                <Button 
                  type="primary" 
                  icon={<CompassOutlined />} 
                  onClick={() => navigate('/gis/map')}
                  key="go"
                >
                  Xem Bản đồ
                </Button>
              ]}
            >
              <Card.Meta
                avatar={<CompassOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
                title="GIS & Bản đồ hàng hải"
                description="Tra cứu tọa độ, xem hải đồ điện tử S-57/S-63 và thông tin không gian hàng hải."
              />
              <div style={{ marginTop: 16 }}>
                <Row gutter={8}>
                  <Col span={8}>
                    <Statistic title="Điểm" value={2540} valueStyle={{ fontSize: 16 }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Đường" value={120} valueStyle={{ fontSize: 16 }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Vùng" value={45} valueStyle={{ fontSize: 16 }} />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        )}

        {/* Thiết bị báo hiệu */}
        {hasPerm('data:read') && (
          <Col xs={24} sm={12} md={8}>
            <Card
              hoverable
              actions={[
                <Button 
                  type="primary" 
                  icon={<SettingOutlined />} 
                  onClick={() => navigate('/beacons')}
                  key="go"
                >
                  Xem Thiết bị
                </Button>
              ]}
            >
              <Card.Meta
                avatar={<SettingOutlined style={{ fontSize: 32, color: '#52c41a' }} />}
                title="Báo hiệu hàng hải"
                description="Quản lý thông số kỹ thuật, lịch sử thay đổi của hệ thống phao tiêu và đèn hiệu."
              />
              <div style={{ marginTop: 16 }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic title="Đèn biển" value={85} valueStyle={{ fontSize: 16 }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Phao tiêu" value={150} valueStyle={{ fontSize: 16 }} />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        )}

        {/* Quản trị đơn vị & người dùng */}
        {(hasPerm('user:manage') || hasPerm('user:read')) && (
          <Col xs={24} sm={12} md={8}>
            <Card
              hoverable
              actions={[
                <Button 
                  type="primary" 
                  icon={<UserOutlined />} 
                  onClick={() => navigate('/users')}
                  key="go"
                >
                  Quản lý tài khoản
                </Button>
              ]}
            >
              <Card.Meta
                avatar={<UserOutlined style={{ fontSize: 32, color: '#722ed1' }} />}
                title="Tài khoản & Đơn vị"
                description="Quản lý danh sách tài khoản người dùng, đơn vị tổ chức và phân quyền hệ thống."
              />
              <div style={{ marginTop: 16 }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic title="Người dùng" value={16} valueStyle={{ fontSize: 16 }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Vai trò" value={8} valueStyle={{ fontSize: 16 }} />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        )}

        {/* Liên thông & tích hợp */}
        {hasPerm('connection:read') && (
          <Col xs={24} sm={12} md={8}>
            <Card
              hoverable
              actions={[
                <Button 
                  type="primary" 
                  icon={<ApiOutlined />} 
                  onClick={() => navigate('/connections')}
                  key="go"
                >
                  Cấu hình kết nối
                </Button>
              ]}
            >
              <Card.Meta
                avatar={<ApiOutlined style={{ fontSize: 32, color: '#fa8c16' }} />}
                title="Liên thông dữ liệu"
                description="Quản lý và giám sát trạng thái kết nối các cổng dịch vụ công, LGSP, NDXP."
              />
              <div style={{ marginTop: 16 }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic title="Kết nối" value="12/15" valueStyle={{ fontSize: 16 }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Trạng thái" value="Ổn định" valueStyle={{ fontSize: 16, color: '#52c41a' }} />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        )}

        {/* Báo cáo thống kê */}
        {hasPerm('report:read') && (
          <Col xs={24} sm={12} md={8}>
            <Card
              hoverable
              actions={[
                <Button 
                  type="primary" 
                  icon={<BarChartOutlined />} 
                  onClick={() => navigate('/reports')}
                  key="go"
                >
                  Xem Báo cáo
                </Button>
              ]}
            >
              <Card.Meta
                avatar={<BarChartOutlined style={{ fontSize: 32, color: '#eb2f96' }} />}
                title="Báo cáo & Thống kê"
                description="Xuất báo cáo kết cấu hạ tầng giao thông hàng hải, lưu giữ lịch sử kiểm tra định kỳ."
              />
              <div style={{ marginTop: 16 }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic title="Báo cáo mẫu" value={6} valueStyle={{ fontSize: 16 }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Xuất file" value="PDF/Excel" valueStyle={{ fontSize: 16 }} />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        )}

        {/* Nhật ký hệ thống */}
        {hasPerm('log:manage') && (
          <Col xs={24} sm={12} md={8}>
            <Card
              hoverable
              actions={[
                <Button 
                  type="primary" 
                  icon={<DashboardOutlined />} 
                  onClick={() => navigate('/logs')}
                  key="go"
                >
                  Xem Nhật ký
                </Button>
              ]}
            >
              <Card.Meta
                avatar={<DashboardOutlined style={{ fontSize: 32, color: '#2f54eb' }} />}
                title="Nhật ký hệ thống"
                description="Theo dõi hoạt động của người dùng, log đăng nhập, các thao tác chỉnh sửa hạ tầng."
              />
              <div style={{ marginTop: 16 }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic title="Mức độ log" value="DEBUG" valueStyle={{ fontSize: 16 }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Trạng thái" value="Đang ghi" valueStyle={{ fontSize: 16, color: '#52c41a' }} />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* Quick guide card */}
      <Card style={{ marginTop: 24, borderRadius: 8 }}>
        <Space size="middle" align="start">
          <InfoCircleOutlined style={{ fontSize: 24, color: '#1890ff', marginTop: 4 }} />
          <div>
            <Title level={5} style={{ margin: 0 }}>Hướng dẫn nhanh</Title>
            <Text type="secondary">
              Sử dụng thanh menu bên trái để truy cập nhanh các chức năng tương ứng với quyền hạn của bạn. 
              Nếu cần thêm quyền hạn truy cập thông tin, vui lòng liên hệ với Quản trị viên của Cục Hàng Hải.
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
