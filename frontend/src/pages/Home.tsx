import { Row, Col, Typography, Progress, Table, Tag } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { FilterProvider } from '../context/FilterContext';
import FilterBar from '../components/FilterBar';
import KpiCard from '../components/KpiCard';
import TrendChartCard from '../components/TrendChartCard';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const { Title, Text } = Typography;

// ============================================================
// Types for mock data
// ============================================================
interface CargoMonth {
  month: string;
  noiDia: number;
  xuatKhau: number;
  nhapKhau: number;
  chuyenTai: number;
}

interface PassengerMonth {
  month: string;
  denCang: number;
  roiCang: number;
}

interface ExploitationItem {
  name: string;
  dangKhaiThac: number;
  chuaKhaiThac: number;
  dungKhaiThac: number;
}

interface InfraRow {
  stt: number;
  loai: string;
  ten: string;
  diaDiem: string;
  trangThai: string;
  ghiChu: string;
}

// ============================================================
// Mock data — Cargo (nghìn tấn) by month
// ============================================================
const cargoData: CargoMonth[] = [
  { month: 'T1',  noiDia: 5800, xuatKhau: 3400, nhapKhau: 2300, chuyenTai: 1250 },
  { month: 'T2',  noiDia: 5200, xuatKhau: 3000, nhapKhau: 2100, chuyenTai: 1100 },
  { month: 'T3',  noiDia: 6100, xuatKhau: 3600, nhapKhau: 2500, chuyenTai: 1350 },
  { month: 'T4',  noiDia: 6300, xuatKhau: 3800, nhapKhau: 2600, chuyenTai: 1400 },
  { month: 'T5',  noiDia: 6500, xuatKhau: 3900, nhapKhau: 2700, chuyenTai: 1450 },
  { month: 'T6',  noiDia: 6700, xuatKhau: 4000, nhapKhau: 2800, chuyenTai: 1500 },
  { month: 'T7',  noiDia: 6800, xuatKhau: 4100, nhapKhau: 2850, chuyenTai: 1520 },
  { month: 'T8',  noiDia: 6650, xuatKhau: 3950, nhapKhau: 2780, chuyenTai: 1480 },
  { month: 'T9',  noiDia: 6400, xuatKhau: 3800, nhapKhau: 2650, chuyenTai: 1420 },
  { month: 'T10', noiDia: 6900, xuatKhau: 4200, nhapKhau: 2900, chuyenTai: 1580 },
  { month: 'T11', noiDia: 7100, xuatKhau: 4300, nhapKhau: 3000, chuyenTai: 1620 },
  { month: 'T12', noiDia: 7300, xuatKhau: 4500, nhapKhau: 3100, chuyenTai: 1700 },
];

// ============================================================
// Mock data — Passengers by month
// ============================================================
const passengerData: PassengerMonth[] = [
  { month: 'T1',  denCang: 26800, roiCang: 24200 },
  { month: 'T2',  denCang: 22500, roiCang: 20500 },
  { month: 'T3',  denCang: 28500, roiCang: 26000 },
  { month: 'T4',  denCang: 29200, roiCang: 26800 },
  { month: 'T5',  denCang: 30500, roiCang: 28000 },
  { month: 'T6',  denCang: 31800, roiCang: 29300 },
  { month: 'T7',  denCang: 32800, roiCang: 30200 },
  { month: 'T8',  denCang: 32200, roiCang: 29700 },
  { month: 'T9',  denCang: 30300, roiCang: 27800 },
  { month: 'T10', denCang: 33500, roiCang: 31000 },
  { month: 'T11', denCang: 34200, roiCang: 31800 },
  { month: 'T12', denCang: 35500, roiCang: 32800 },
];

// ============================================================
// Mock data — Exploitation status
// ============================================================
const exploitationData: ExploitationItem[] = [
  { name: 'Cảng biển',       dangKhaiThac: 12, chuaKhaiThac: 3, dungKhaiThac: 2 },
  { name: 'Khu neo đậu',     dangKhaiThac: 8,  chuaKhaiThac: 4, dungKhaiThac: 1 },
  { name: 'Luồng HH',        dangKhaiThac: 32, chuaKhaiThac: 5, dungKhaiThac: 0 },
  { name: 'Bến cảng',        dangKhaiThac: 28, chuaKhaiThac: 7, dungKhaiThac: 3 },
  { name: 'Khu chuyển tải',  dangKhaiThac: 6,  chuaKhaiThac: 2, dungKhaiThac: 1 },
];

// ============================================================
// Mock data — Infrastructure table (10 rows)
// ============================================================
const infraData: InfraRow[] = [
  { stt: 1,  loai: 'Cảng biển',       ten: 'Cảng Hải Phòng',            diaDiem: 'Hải Phòng',            trangThai: 'Đang vận hành',  ghiChu: 'Cảng tổng hợp quốc gia' },
  { stt: 2,  loai: 'Cảng biển',       ten: 'Cảng Cái Mép – Thị Vải',    diaDiem: 'Bà Rịa - Vũng Tàu',    trangThai: 'Đang vận hành',  ghiChu: 'Cảng nước sâu cửa ngõ' },
  { stt: 3,  loai: 'Luồng HH',        ten: 'Luồng Sông Chanh',          diaDiem: 'Quảng Ninh',           trangThai: 'Đang vận hành',  ghiChu: 'Độ sâu -10.5m CDL' },
  { stt: 4,  loai: 'Bến cảng',        ten: 'Bến cảng Nhà Rồng',         diaDiem: 'TP. Hồ Chí Minh',      trangThai: 'Chưa khai thác', ghiChu: 'Đang nâng cấp mở rộng' },
  { stt: 5,  loai: 'Khu neo đậu',     ten: 'Khu neo đậu Vịnh Vân Phong', diaDiem: 'Khánh Hòa',           trangThai: 'Đang vận hành',  ghiChu: 'Tránh bão, chờ luồng' },
  { stt: 6,  loai: 'Khu chuyển tải',  ten: 'Khu chuyển tải Hòn La',     diaDiem: 'Quảng Bình',           trangThai: 'Đang vận hành',  ghiChu: 'Phục vụ cảng Hòn La' },
  { stt: 7,  loai: 'Cảng biển',       ten: 'Cảng Đà Nẵng',              diaDiem: 'Đà Nẵng',              trangThai: 'Dừng khai thác', ghiChu: 'Đang sửa chữa cầu tàu' },
  { stt: 8,  loai: 'Luồng HH',        ten: 'Luồng Định An – Cần Thơ',   diaDiem: 'Trà Vinh',             trangThai: 'Đang vận hành',  ghiChu: 'Độ sâu -6.5m CDL' },
  { stt: 9,  loai: 'Bến cảng',        ten: 'Bến phao xăng dầu B12',     diaDiem: 'Quảng Ninh',           trangThai: 'Đang vận hành',  ghiChu: 'Bến phao chuyên dùng' },
  { stt: 10, loai: 'Khu neo đậu',     ten: 'Khu neo đậu Cửa Việt',      diaDiem: 'Quảng Trị',            trangThai: 'Chưa khai thác', ghiChu: 'Đang hoàn thiện thủ tục' },
];

// ============================================================
// Status → Tag color mapping
// ============================================================
const STATUS_COLOR: Record<string, string> = {
  'Đang vận hành':  'green',
  'Chưa khai thác': 'gold',
  'Dừng khai thác': 'red',
};

// ============================================================
// Table column definition
// ============================================================
const infraColumns = [
  { title: 'STT',       dataIndex: 'stt',       key: 'stt',       width: 60 },
  { title: 'Loại KCHT', dataIndex: 'loai',      key: 'loai',      width: 130 },
  { title: 'Tên',       dataIndex: 'ten',       key: 'ten' },
  { title: 'Địa điểm',  dataIndex: 'diaDiem',   key: 'diaDiem',   width: 150 },
  {
    title: 'Trạng thái',
    dataIndex: 'trangThai',
    key: 'trangThai',
    width: 140,
    render: (status: string) => (
      <Tag color={STATUS_COLOR[status] ?? 'default'}>{status}</Tag>
    ),
  },
  { title: 'Ghi chú',   dataIndex: 'ghiChu',    key: 'ghiChu',    ellipsis: true },
];

// ============================================================
// Shared style tokens
// ============================================================
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 500,
  marginBottom: 8,
  margin: 0,
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 10,
};

const tooltipStyle: React.CSSProperties = {
  borderRadius: 4,
  border: '1px solid #E5E7EB',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

// ============================================================
// HomeDashboard — inner component with access to hooks
// ============================================================
function HomeDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      {/* ================================================== */}
      {/* Phase 2 — FilterBar                                 */}
      {/* ================================================== */}
      <FilterBar />

      {/* ================================================== */}
      {/* Phase 3 — KPI Row: 5 cards                         */}
      {/* ================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <KpiCard
          label="Lượt tàu qua cảng"
          value={28450}
          trend={{ value: 8.9, isUp: true }}
        />
        <KpiCard
          label="Hàng hóa (nghìn tấn)"
          value={112480}
          trend={{ value: 13.9, isUp: true }}
        />
        <KpiCard
          label="Lượt hành khách"
          value={345200}
          trend={{ value: 15.6, isUp: true }}
        />
        <KpiCard
          label="KCHT đang vận hành"
          value={187}
          subLabel="trên tổng 215"
        />
        <KpiCard
          label="Hồ sơ chờ duyệt"
          value={23}
          variant="action"
          subLabel="Cần xử lý"
          onClick={() => navigate('/asset/increase')}
        />
      </div>

      {/* ================================================== */}
      {/* Phase 4 — Charts Row: 2 TrendChartCards            */}
      {/* ================================================== */}
      <Row gutter={[12, 12]} style={sectionStyle}>
        {/* --- Left: Stacked BarChart — Hàng hóa qua cảng   --- */}
        <Col xs={24} md={12}>
          <TrendChartCard
            title="Hàng hóa qua cảng theo tháng"
            legendItems={[
              { color: '#2A78D6', label: 'Nội địa' },
              { color: '#1BAF7A', label: 'Xuất khẩu' },
              { color: '#EDA100', label: 'Nhập khẩu' },
              { color: '#E87BA4', label: 'Chuyển tải' },
            ]}
            height={240}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cargoData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      noiDia: 'Nội địa',
                      xuatKhau: 'Xuất khẩu',
                      nhapKhau: 'Nhập khẩu',
                      chuyenTai: 'Chuyển tải',
                    };
                    return [value.toLocaleString('vi-VN'), labels[name] ?? name];
                  }}
                />
                <Bar dataKey="noiDia"     name="Nội địa"     stackId="a" fill="#2A78D6" />
                <Bar dataKey="xuatKhau"   name="Xuất khẩu"   stackId="a" fill="#1BAF7A" />
                <Bar dataKey="nhapKhau"   name="Nhập khẩu"   stackId="a" fill="#EDA100" />
                <Bar dataKey="chuyenTai"  name="Chuyển tải"  stackId="a" fill="#E87BA4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TrendChartCard>
        </Col>

        {/* --- Right: LineChart — Lượt hành khách            --- */}
        <Col xs={24} md={12}>
          <TrendChartCard
            title="Lượt hành khách qua cảng"
            legendItems={[
              { color: '#1BAF7A', label: 'Đến cảng' },
              { color: '#E34948', label: 'Rời cảng' },
            ]}
            height={240}
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={passengerData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      denCang: 'Đến cảng',
                      roiCang: 'Rời cảng',
                    };
                    return [value.toLocaleString('vi-VN'), labels[name] ?? name];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="denCang"
                  name="Đến cảng"
                  stroke="#1BAF7A"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="roiCang"
                  name="Rời cảng"
                  stroke="#E34948"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TrendChartCard>
        </Col>
      </Row>

      {/* ================================================== */}
      {/* Phase 5 — Approval & Exploitation                 */}
      {/* ================================================== */}
      <Title level={5} style={sectionTitleStyle}>
        Phê duyệt &amp; Khai thác
      </Title>
      <Row gutter={[12, 12]} style={sectionStyle}>
        {/* --- Left: Progress bars --- */}
        <Col xs={24} md={12}>
          <div
            style={{
              background: '#FFFFFF',
              border: '0.5px solid #E5E7EB',
              borderRadius: 12,
              padding: 20,
              height: '100%',
            }}
          >
            {/* KCHT progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 6, color: '#6B7280' }}>
                KCHT
              </div>
              <Progress percent={92} strokeColor="#1BAF7A" showInfo={false} />
            </div>

            {/* Tài sản progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 6, color: '#6B7280' }}>
                Tài sản
              </div>
              <Progress percent={78} strokeColor="#EDA100" showInfo={false} />
            </div>

            {/* Status counts */}
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#EDA100' }}>
                23 chờ duyệt
              </span>
              <span style={{ fontSize: 12, color: '#E34948' }}>
                5 từ chối
              </span>
            </div>
          </div>
        </Col>

        {/* --- Right: Horizontal stacked BarChart --- */}
        <Col xs={24} md={12}>
          <div
            style={{
              background: '#FFFFFF',
              border: '0.5px solid #E5E7EB',
              borderRadius: 12,
              padding: 14,
              height: '100%',
            }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={exploitationData}
                layout="vertical"
                margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  width={100}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      dangKhaiThac: 'Đang khai thác',
                      chuaKhaiThac: 'Chưa khai thác',
                      dungKhaiThac: 'Dừng khai thác',
                    };
                    return [value.toLocaleString('vi-VN'), labels[name] ?? name];
                  }}
                />
                <Bar dataKey="dangKhaiThac" stackId="a" fill="#1BAF7A" name="Đang khai thác" />
                <Bar dataKey="chuaKhaiThac" stackId="a" fill="#EDA100" name="Chưa khai thác" />
                <Bar dataKey="dungKhaiThac" stackId="a" fill="#E34948" name="Dừng khai thác" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>

      {/* ================================================== */}
      {/* Phase 6 — Map & Table Section                      */}
      {/* ================================================== */}
      <Title level={5} style={sectionTitleStyle}>
        Bản đồ &amp; Chi tiết
      </Title>

      {/* Map placeholder */}
      <div
        style={{
          height: 300,
          background: '#F3F4F6',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <EnvironmentOutlined style={{ fontSize: 32, color: '#9CA3AF' }} />
        <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
          Bản đồ KCHTGT hàng hải
        </Text>
      </div>

      {/* Infrastructure Table */}
      <div
        style={{
          background: '#FFFFFF',
          border: '0.5px solid #E5E7EB',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Table
          columns={infraColumns}
          dataSource={infraData}
          rowKey="stt"
          scroll={{ y: 300 }}
          pagination={false}
          size="small"
        />
      </div>
    </div>
  );
}

// ============================================================
// HomePage — wraps everything in FilterProvider
// ============================================================
export default function HomePage() {
  return (
    <FilterProvider>
      <HomeDashboard />
    </FilterProvider>
  );
}
