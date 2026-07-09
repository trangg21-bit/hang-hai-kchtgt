import { Row, Col, Typography, Space } from 'antd';
import {
  ContainerOutlined,
  EnvironmentOutlined,
  AimOutlined,
  UserOutlined,
  CompassOutlined,
  BarChartOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
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

  // KPI stats — dùng class .kpi-card từ theme chuẩn
  const kpiStats = [
    {
      key: 'ports', label: 'CẢNG BIỂN', value: 48, delta: { text: '8.2%', up: true },
      icon: <ContainerOutlined />, iconBg: 'var(--icon-bg-blue)', iconColor: 'var(--color-primary)',
    },
    {
      key: 'beacons', label: 'ĐÈN BIỂN', value: 235, delta: { text: '5.1%', up: true },
      icon: <AimOutlined />, iconBg: 'var(--icon-bg-green)', iconColor: 'var(--color-success)',
    },
    {
      key: 'channels', label: 'LUỒNG HÀNG HẢI', value: 32, delta: { text: '2.3%', up: false },
      icon: <EnvironmentOutlined />, iconBg: 'var(--icon-bg-orange)', iconColor: 'var(--color-warning)',
    },
    {
      key: 'users', label: 'NGƯỜI DÙNG', value: 16, delta: { text: '12.5%', up: true },
      icon: <UserOutlined />, iconBg: 'var(--icon-bg-purple)', iconColor: 'var(--color-info)',
    },
  ];

  // Module feature cards — dùng class .feature-card từ theme chuẩn
  const modules = [
    {
      key: 'gis', title: 'GIS & Bản đồ hàng hải',
      desc: 'Tra cứu tọa độ, hải đồ S-57/S-63, lớp bản đồ, giấy phép S-63',
      icon: <CompassOutlined />, perm: 'data:read', link: '/gis/map',
      color: 'var(--color-primary)', iconBg: 'var(--icon-bg-blue)',
    },
    {
      key: 'beacon', title: 'Báo hiệu hàng hải',
      desc: 'Đèn biển, phao tiêu, nhà trạm, lịch sử thay đổi thiết bị báo hiệu',
      icon: <AimOutlined />, perm: 'data:read', link: '/beacons',
      color: 'var(--color-success)', iconBg: 'var(--icon-bg-green)',
    },
    {
      key: 'port', title: 'Tài sản KCHTGT',
      desc: 'Cảng biển, bến cảng, cầu cảng, cảng cạn, vùng nước',
      icon: <ContainerOutlined />, perm: 'data:read', link: '/cangbien',
      color: 'var(--color-warning)', iconBg: 'var(--icon-bg-orange)',
    },
    {
      key: 'vts', title: 'Khu nước & VTS',
      desc: 'Luồng, đê/kè, cơ sở sửa chữa, trạm radar, hệ thống VTS',
      icon: <ThunderboltOutlined />, perm: 'data:read', link: '/luong-hang-hai',
      color: 'var(--color-error)', iconBg: 'var(--icon-bg-red)',
    },
    {
      key: 'reports', title: 'Báo cáo & Thống kê',
      desc: '49 mẫu báo cáo KCHTGT, xuất PDF/Excel, lưu trữ lịch sử',
      icon: <BarChartOutlined />, perm: 'report:read', link: '/reports',
      color: 'var(--color-info)', iconBg: 'var(--icon-bg-purple)',
    },
    {
      key: 'connect', title: 'Liên thông & Tích hợp',
      desc: 'Kết nối LGSP, NDXP, dịch vụ công, giám sát trạng thái',
      icon: <ApiOutlined />, perm: 'connection:read', link: '/connections',
      color: 'var(--color-primary)', iconBg: 'var(--icon-bg-blue)',
    },
  ];

  const visibleModules = modules.filter((m) => hasPerm(m.perm));

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* ===== Welcome ===== */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 2, fontWeight: 700, letterSpacing: -0.3 }}>
          {getGreeting()}, {user?.fullName || 'Người dùng'}
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Hệ thống Quản trị kết cấu hạ tầng giao thông đường thủy và hàng hải
        </Text>
      </div>

      {/* ===== KPI Cards ===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {kpiStats.map((s) => (
          <Col xs={24} sm={12} md={6} key={s.key}>
            <div className="kpi-card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div className="kpi-card__label">{s.label}</div>
                  <div className="kpi-card__value">{s.value.toLocaleString()}</div>
                  {s.delta && (
                    <div className={`kpi-card__delta ${s.delta.up ? 'kpi-card__delta--up' : 'kpi-card__delta--down'}`}>
                      <ArrowUpOutlined style={{ fontSize: 10, transform: s.delta.up ? 'none' : 'rotate(180deg)' }} />
                      {s.delta.text}
                    </div>
                  )}
                </div>
                <div className="kpi-card__icon-box" style={{ background: s.iconBg, color: s.iconColor, fontSize: 22 }}>
                  {s.icon}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ===== Section Title ===== */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
          Chức năng chính
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>{visibleModules.length} chức năng khả dụng</Text>
      </div>

      {/* ===== Feature Cards ===== */}
      <Row gutter={[16, 16]}>
        {visibleModules.map((m) => (
          <Col xs={24} sm={12} lg={8} key={m.key}>
            <div className="feature-card" onClick={() => navigate(m.link)}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div className="kpi-card__icon-box" style={{ background: m.iconBg, color: m.color, fontSize: 22, minWidth: 44 }}>
                  {m.icon}
                </div>
                <div>
                  <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>{m.title}</Text>
                  <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5 }}>{m.desc}</Text>
                </div>
              </div>
              <span className="feature-card__link" style={{ color: m.color }}>
                Truy cập <ArrowUpOutlined style={{ fontSize: 10, transform: 'rotate(45deg)' }} />
              </span>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}
