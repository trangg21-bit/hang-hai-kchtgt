import { useNavigate } from 'react-router-dom';
import { Row, Col, Tooltip } from 'antd';
import {
  ContainerOutlined,
  BankOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import {
  surfaceCard,
  surfacePage,
  textPrimary,
  textSecondary,
  textTertiary,
  actionPrimary,
  radiusXl,
  radiusLg,
  shadowMd,
  fontSizeLg,
  fontSizeMd,
  fontWeightBold,
  spaceSm,
  spaceLg,
  spaceMd,
  spaceXl,
} from '../themetokenchk';

// ============================================================
// Danh mục chức năng — trang đích của route '/'
// 6 khối (tile) điều hướng tới các phân hệ chính của hệ thống.
// ============================================================

interface DirectoryBlock {
  key: string;
  title: string;
  description: string;
  route?: string;
  icon: ReactNode;
  /** Khối chưa có màn hình/phân hệ — render mờ kèm tooltip 'Chưa triển khai', không điều hướng. */
  disabled?: boolean;
}

const BLOCKS: DirectoryBlock[] = [
  {
    key: 'kcht',
    title: 'Quản lý KCHT hàng hải',
    description: '28 loại kết cấu hạ tầng, phân cấp cha–con',
    route: '/kcht-directory',
    icon: <ContainerOutlined />,
  },
  {
    key: 'asset',
    title: 'Quản lý tài sản KCHT hàng hải',
    description: 'Tài sản, kiểm kê, xử lý tài sản',
    route: '/asset/inventory',
    icon: <BankOutlined />,
  },
  {
    key: 'planning',
    title: 'Quản lý quy hoạch & vận hành',
    description: 'Quy hoạch, vận hành, bảo trì, sự cố',
    route: '/gis/map',
    icon: <EnvironmentOutlined />,
  },
  {
    key: 'approval',
    title: 'Phê duyệt',
    description: 'Phê duyệt hồ sơ KCHT 2 cấp (C1/C2)',
    icon: <CheckCircleOutlined />,
    disabled: true,
  },
  {
    key: 'reports',
    title: 'Báo cáo thống kê',
    description: 'Các biểu mẫu báo cáo nghiệp vụ',
    route: '/reports',
    icon: <BarChartOutlined />,
  },
  {
    key: 'admin',
    title: 'Quản trị hệ thống',
    description: 'Người dùng, nhóm, đơn vị, tích hợp',
    route: '/users',
    icon: <SettingOutlined />,
  },
];

const BLOCK_BUTTON_STYLE: React.CSSProperties = {
  background: surfaceCard,
  borderRadius: radiusXl,
  padding: spaceLg,
  boxShadow: shadowMd,
  cursor: 'pointer',
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  textAlign: 'left',
  border: 'none',
  fontFamily: 'inherit',
  color: 'inherit',
  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
};

const ICON_BOX_STYLE: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: radiusLg,
  background: actionPrimary,
  color: surfaceCard,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: fontSizeLg,
  marginBottom: spaceMd,
  flexShrink: 0,
};

const TITLE_STYLE: React.CSSProperties = {
  color: textPrimary,
  fontSize: fontSizeLg,
  fontWeight: fontWeightBold,
  margin: 0,
  marginBottom: spaceSm,
};

const DESC_STYLE: React.CSSProperties = {
  color: textSecondary,
  fontSize: fontSizeMd,
  margin: 0,
  lineHeight: 1.5,
};

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: surfacePage,
        minHeight: '100%',
        padding: spaceXl,
      }}
    >
      <div style={{ marginBottom: spaceLg }}>
        <h2
          style={{
            color: textPrimary,
            fontSize: fontSizeLg,
            fontWeight: fontWeightBold,
            margin: 0,
            marginBottom: spaceSm,
          }}
        >
          Danh mục chức năng
        </h2>
        <p style={{ color: textTertiary, fontSize: fontSizeMd, margin: 0 }}>
          Chọn một phân hệ để bắt đầu thao tác
        </p>
      </div>

      <Row gutter={[spaceLg, spaceLg]}>
        {BLOCKS.map((block) => (
          <Col xs={24} md={8} key={block.key}>
            <Tooltip title={block.disabled ? 'Chưa triển khai' : undefined}>
              <button
                type="button"
                style={{
                  ...BLOCK_BUTTON_STYLE,
                  ...(block.disabled
                    ? { cursor: 'not-allowed', opacity: 0.6, filter: 'saturate(0.5)' }
                    : {}),
                }}
                disabled={block.disabled}
                onClick={() => block.route && navigate(block.route)}
              >
                <div style={ICON_BOX_STYLE}>{block.icon}</div>
                <h3 style={TITLE_STYLE}>{block.title}</h3>
                <p style={DESC_STYLE}>{block.description}</p>
              </button>
            </Tooltip>
          </Col>
        ))}
      </Row>
    </div>
  );
}
