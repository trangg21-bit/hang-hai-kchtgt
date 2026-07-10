import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Space,
  Typography,
  Button,
  Select,
  Form,
  Input,
  InputNumber,
  Tag,
  Radio,
  Tabs,
  Upload,
  Divider,
  List,
  Collapse,
  Drawer,
  Checkbox,
  Table,
} from 'antd';
import {
  CompassOutlined,
  UploadOutlined,
  ReloadOutlined,
  FilterOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  SlidersOutlined,
  AppstoreOutlined,
  SearchOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { chartService } from '../../services/chartService';
import type { ChartCell, ChartFeature } from '../../services/chartService';
import api from '../../services/api';
import { organizationService } from '../../services/organizationService';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';
import EmptyState from '../../components/EmptyState';
import Flatbush from 'flatbush';

declare global {
  interface Window {
    L: any;
  }
}

const CELL_COORDINATES: Record<string, [number, number]> = {
  'HP': [20.80, 106.70],     // Hải Phòng
  'HG': [20.95, 107.15],     // Hạ Long
  'HL': [17.90, 106.40],     // Hòn La
  'HTH': [10.00, 104.00],    // Hòn Thơm
  'DNA': [16.10, 108.20],    // Đà Nẵng
  'DQ': [15.40, 108.80],     // Dung Quất
  'KHA': [12.20, 109.20],    // Khánh Hòa
  'CLO': [18.80, 105.70],    // Cửa Lò
  'CM': [9.20, 104.90],      // Cà Mau
  'CVI': [16.90, 107.20],    // Cửa Việt
  'CGI': [17.70, 106.50],    // Cửa Gianh
  'CHO': [18.70, 105.80],    // Cửa Hội
  'DDI': [20.50, 106.60],    // Diêm Điền
  'LM': [16.10, 108.15],     // Liên Chiểu
  'NGS': [19.30, 105.80],    // Nghi Sơn
  'SKY': [21.00, 106.40],    // Sông Kinh Thầy
  'THA': [16.55, 107.65],    // Thuận An
  'VA': [18.10, 106.30],     // Vũng Áng
  'VG': [10.40, 107.10],     // Vũng Tàu / Gành Rái
  'V24CD': [8.70, 106.60],   // Côn Đảo
  'V24DM': [20.50, 106.60],  // Diêm Điền
  'V24DN': [16.10, 108.20],  // Đà Nẵng
  'V24GG': [9.20, 105.40],   // Gành Hào
  'V24HT': [10.40, 104.50],  // Hà Tiên
  'V24NC': [19.30, 105.80],  // Nghi Sơn
  'V24NT': [12.20, 109.20],  // Nha Trang
  'V24QN': [13.70, 109.25],  // Quy Nhơn
  'V24SD': [9.00, 104.80],   // Sông Đốc
  'V24SG': [10.70, 106.70],  // Sài Gòn
  'V24SH': [9.50, 106.30],   // Sông Hậu
  'V24SR': [20.90, 106.80],  // Sông Rút
  'V24ST': [9.60, 106.00],   // Sóc Trăng
  'V24TV': [9.70, 106.30],   // Trà Vinh
  'V24VR': [12.90, 109.40]   // Vũng Rô
};

function getCenterByCellName(cellName: string): [number, number] | null {
  if (!cellName) return null;
  const cleanName = cellName.toUpperCase().trim();
  
  if (CELL_COORDINATES[cleanName]) {
    return CELL_COORDINATES[cleanName];
  }
  
  const keys = Object.keys(CELL_COORDINATES).sort((a, b) => b.length - a.length);
  for (const prefix of keys) {
    if (cleanName.startsWith(prefix) || cleanName.includes(prefix)) {
      const baseCenter = CELL_COORDINATES[prefix];
      // Tách phần số cuối cùng của cell name (ví dụ: 'V24DN003' -> 3) để tạo ra độ lệch nhỏ (offset)
      // Giúp các mảnh hải đồ cùng khu vực không bị xếp đè khít lên nhau và bản đồ có thể di chuyển (flyTo) khi chuyển đổi
      const numberMatch = cleanName.match(/\d+$/);
      if (numberMatch) {
        const num = parseInt(numberMatch[0], 10);
        const latOffset = ((num % 3) - 1) * 0.05; // lệch vĩ độ
        const lonOffset = (Math.floor(num / 3) - 1) * 0.05; // lệch kinh độ
        return [baseCenter[0] + latOffset, baseCenter[1] + lonOffset];
      }
      return baseCenter;
    }
  }
  
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 10.0 + (Math.abs(hash) % 100) * 0.1;
  const lon = 105.0 + (Math.abs(hash >> 8) % 40) * 0.1;
  return [lat, lon];
}

const FEATURE_ZOOM_RULES: Record<string, number> = {
  // Level 0: Always show (general map view)
  'M_COVR': 0,
  'ACHARE': 0,
  'ACHBRT': 0,
  'FAIRWY': 0,

  // Level 1: Zoom >= 7 (areas, safety routes, wrecks/obstacles)
  'DEPARE': 7,
  'RESARE': 7,
  'WRECKS': 7,
  'OBSTRN': 7,
  'NAVLNE': 7,
  'PILPNT': 7,

  // Level 2: Zoom >= 10 (navigation signals, lights, depth contours)
  'BCNCAR': 10,
  'BCNLAT': 10,
  'BOYCAR': 10,
  'BOYLAT': 10,
  'BOYSAW': 10,
  'BOYSPP': 10,
  'LIGHTS': 10,
  'DEPCNT': 10,

  // Level 3: Zoom >= 13 (bridges, landmarks, sounding depths, details)
  'BRIDGE': 13,
  'LNDMRK': 13,
  'TOPMAR': 13,
  'SOUNDG': 13 // soundings are dense, only show when close
};

const FEATURE_NAMES_VI: Record<string, string> = {
  'ACHARE': 'Khu vực neo đậu',
  'ACHBRT': 'Điểm neo tàu',
  'BCNCAR': 'Tiêu báo hiệu Cardinal',
  'BCNLAT': 'Tiêu giới hạn luồng',
  'BCNSPP': 'Tiêu chuyên dùng',
  'BCNSAW': 'Tiêu vùng nước an toàn',
  'BRIDGE': 'Cầu',
  'BUAARE': 'Khu vực dân cư',
  'BOYCAR': 'Phao báo hiệu Cardinal',
  'BOYLAT': 'Phao giới hạn luồng',
  'BOYSAW': 'Phao vùng nước an toàn',
  'BOYSPP': 'Phao chuyên dùng',
  'BOYISD': 'Phao nguy hiểm cô lập',
  'COALNE': 'Đường bờ biển',
  'CTSARE': 'Khu vực hải quan',
  'DEPARE': 'Vùng độ sâu',
  'DEPCNT': 'Đường đẳng sâu',
  'DAYMAR': 'Mốc báo hiệu ban ngày',
  'FSHGRD': 'Ngư trường',
  'HRBFAC': 'Công trình cảng',
  'LNDARE': 'Đất liền / Đảo',
  'LNDELV': 'Điểm cao độ mặt đất',
  'LNDRGN': 'Vùng địa hình đặc trưng',
  'LIMITS': 'Giới hạn nguy hiểm',
  'LIGHTS': 'Đèn biển / Hải đăng',
  'LNDMRK': 'Mốc nhận dạng nổi bật',
  'MARCUL': 'Vùng nuôi trồng thủy sản',
  'MIPARE': 'Khu diễn tập quân sự',
  'MORFAC': 'Công trình buộc tàu',
  'NAVLNE': 'Tuyến luồng tàu chạy',
  'OBSTRN': 'Chướng ngại vật',
  'PILPNT': 'Điểm đón trả hoa tiêu',
  'PILBOP': 'Trạm hoa tiêu',
  'RECTRC': 'Tuyến luồng khuyến nghị',
  'RESARE': 'Khu vực hạn chế',
  'ROADWY': 'Đường bộ',
  'SBDARE': 'Chất đất đáy biển',
  'SEAARE': 'Vùng biển đặt tên',
  'SLCONS': 'Kè bờ / Đê chắn sóng',
  'SMCGDW': 'Trạm tín hiệu cảnh báo',
  'SOUNDG': 'Điểm đo độ sâu',
  'TSSLPT': 'Luồng phân luồng',
  'UWTROC': 'Bãi đá ngầm',
  'UNSARE': 'Vùng chưa khảo sát',
  'WRECKS': 'Xác tàu đắm',
  'M_COVR': 'Vùng bao phủ hải đồ',
  'M_QUAL': 'Vùng đánh giá chất lượng',
  'PIPOHC': 'Đường ống dẫn trên bờ',
  'PIPSOL': 'Đường ống dưới đáy biển',
  'PRCARE': 'Vùng cảnh báo phòng ngừa',
  'PRDARE': 'Vùng sản xuất / lưu chứa',
  'PRDPNT': 'Điểm khai thác / giếng dầu',
  'RADRFL': 'Thiết bị phản xạ radar',
  'RDOSTA': 'Trạm vô tuyến hàng hải',
  'CBLARE': 'Vùng cáp ngầm',
  'CBLOHD': 'Cáp treo trên cao',
  'CBLSUB': 'Cáp ngầm dưới biển',
  'TSSBND': 'Ranh giới phân làn giao thông',
  'TSEZNE': 'Khu vực phân làn giao thông',
  'RADRNG': 'Tầm phủ radar',
  'RDODFM': 'Trạm vô tuyến định vị',
  'RSCSTA': 'Trạm cứu hộ hàng hải',
  'OFSPLF': 'Giàn khoan ngoài khơi',
  'ZONEEX': 'Vùng đặc quyền kinh tế / đặc biệt',
};

const LAYER_ICONS: Record<string, string> = {
  'ACHARE': '⚓',
  'ACHBRT': '⛵',
  'BRIDGE': '🌉',
  'CTNARE': '📦',
  'DEPARE': '🌊',
  'FAIRWY': '🛣️',
  'M_COVR': '🗺️',
  'MARCUL': '🐟',
  'OBSTRN': '⚠️',
  'OFSPLF': '🏗️',
  'PILPNT': '☸️',
  'PILBOP': '🧭',
  'SLCONS': '🧱',
  'RESARE': '🚫',
  'WRECKS': '☠️',
  'CBLOHD': '⚡',
  'CBLSUB': '🔌',
  'DEPCNT': '〰️',
  'FSHFAC': '🎣',
  'NAVLNE': '🚢',
  'BOYCAR': '🧭',
  'BOYLAT': '🟢',
  'BOYSAW': '🛟',
  'BOYISD': '🛑',
  'BOYSPP': '🟡',
  'BCNCAR': '🗼',
  'BCNLAT': '🔴',
  'BCNSAW': '⛳',
  'BCNSPP': '🚩',
  'BUAARE': '🏡',
  'CBLARE': '🕸️',
  'CONVYR': '⚙️',
  'CTSARE': '🛂',
  'DAYMAR': '☀️',
  'LIGHTS': '💡',
  'LNDARE': '🏝️',
  'COALNE': '〰️',
  'LNDMRK': '🏰',
  'ROADWY': '🚗',
  'SBDARE': '🪨',
  'SEAARE': '🌐',
  'SMCGDW': '🚨',
  'SOUNDG': '📉',
  'TSSLPT': '🔄',
  'UWTROC': '🪨',
  'UNSARE': '❓',
  'LNDRGN': '⛰️',
  'MIPARE': '🪖',
  'MORFAC': '🪝',
  'M_NPUB': '📖',
  'M_NSYS': '📡',
  'M_QUAL': '🛡️',
  'PIPOHC': '🚰',
  'PIPSOL': '⛓️',
  'PRCARE': '🔔',
  'PRDARE': '🏭',
  'PRDPNT': '🔥',
  'RADRFL': '🎯',
  'RDOSTA': '📻',
  'RECTRC': '🛤️',
  'ZONEEX': '🔰',
  'TSSBND': '🚧',
};

function getFeatureNameVi(featureCode: string, originalName?: string): string {
  if (originalName && originalName !== featureCode && !originalName.startsWith('UNKNOWN_')) {
    return originalName;
  }
  const cleanCode = featureCode.toUpperCase();
  return FEATURE_NAMES_VI[cleanCode] || featureCode;
}

function getFeatureIcon(featureCode: string, fillColor: string, strokeColor: string): string {
  const codeUpper = featureCode.toUpperCase();
  const emoji = LAYER_ICONS[codeUpper] || '🌐';
  
  return `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-size: 20px;
      line-height: 1;
      filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.4));
    ">
      ${emoji}
    </div>
  `;
}
export default function GISChartView() {
  const [loading, setLoading] = useState(false);
  const [cells, setCells] = useState<ChartCell[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<string | undefined>();
  const [palette, setPalette] = useState<string>('DAY');
  const [features, setFeatures] = useState<ChartFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<ChartFeature | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({});

  // Get static S-57 feature codes from translation map dictionary keys
  const uniqueFeatureCodes = useMemo(() => {
    return Object.keys(FEATURE_NAMES_VI).sort();
  }, []);

  // Initialize visibleLayers when uniqueFeatureCodes is loaded/updated
  useEffect(() => {
    setVisibleLayers(prev => {
      const next = { ...prev };
      let changed = false;
      uniqueFeatureCodes.forEach(code => {
        if (next[code] === undefined) {
          next[code] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [uniqueFeatureCodes]);

  const handleToggleLayer = useCallback((code: string, checked: boolean) => {
    setVisibleLayers(prev => ({
      ...prev,
      [code]: checked
    }));
  }, []);

  // Coordinate Calibrator State
  const [calibrationForm] = Form.useForm();
  const [calibrating, setCalibrating] = useState(false);
  const [calibratedPoint, setCalibratedPoint] = useState<{ lon: number; lat: number } | null>(null);

  // Infrastructure Search States
  const [searchForm] = Form.useForm();
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [searchingInfrastructure, setSearchingInfrastructure] = useState(false);
  const [infrastructureResults, setInfrastructureResults] = useState<any[]>([]);
  const [totalSearchElements, setTotalSearchElements] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchPageSize, setSearchPageSize] = useState(20);

  const handleSearchInfrastructure = useCallback(async () => {
    setSearchingInfrastructure(true);
    try {
      const values = searchForm.getFieldsValue();
      const orgUnitId = !values || values.orgUnitId === 'all' ? undefined : values.orgUnitId;
      const kchtType = !values || !values.kchtType ? 'CANGBIEN' : values.kchtType;
      const tinhThanhPho = !values ? '' : values.tinhThanhPho;

      let list: any[] = [];
      let total = 0;

      if (kchtType === 'CANGBIEN') {
        const res = await api.get('/v1/cang-bien', {
          params: {
            page: searchPage - 1,
            size: searchPageSize,
            orgUnitId,
            tinhThanhPho
          }
        });
        const pageData = res.data.data;
        list = (pageData.content || []).map((x: any) => ({
          ...x,
          id: x.id,
          orgName: x.orgUnitName || 'Cục Hàng hải và Đường thủy Việt Nam',
          kchtTypeLabel: 'Cảng biển',
          diaDiem: x.tinhThanhPho || x.address || ''
        }));
        total = pageData.totalElements || list.length;
      } else if (kchtType === 'BENCANG') {
        const res = await api.get('/v1/ben-cang', {
          params: {
            page: searchPage - 1,
            size: searchPageSize,
            orgUnitId
          }
        });
        const pageData = res.data.data;
        list = (pageData.content || []).map((x: any) => ({
          ...x,
          id: x.id,
          orgName: x.orgUnitName || 'Cục Hàng hải và Đường thủy Việt Nam',
          kchtTypeLabel: 'Bến cảng',
          diaDiem: x.diaDiem || x.address || ''
        }));
        total = pageData.totalElements || list.length;
      } else if (kchtType === 'CAUCANG') {
        const res = await api.get('/v1/cau-cang', {
          params: {
            page: searchPage - 1,
            pageSize: searchPageSize,
            orgUnitId
          }
        });
        const pageData = res.data.data;
        list = (pageData.content || []).map((x: any) => ({
          ...x,
          id: x.id,
          orgName: x.orgUnitName || 'Cục Hàng hải và Đường thủy Việt Nam',
          kchtTypeLabel: 'Cầu cảng',
          diaDiem: x.diaChi || x.address || ''
        }));
        total = pageData.totalElements || list.length;
      } else if (kchtType === 'CANGCAN') {
        const res = await api.get('/v1/cang-can', {
          params: {
            page: searchPage - 1,
            size: searchPageSize,
            orgUnitId
          }
        });
        const pageData = res.data.data;
        list = (pageData.content || []).map((x: any) => ({
          ...x,
          id: x.id,
          orgName: x.orgUnitName || 'Cục Hàng hải và Đường thủy Việt Nam',
          kchtTypeLabel: 'Cảng cạn',
          diaDiem: x.address || ''
        }));
        total = pageData.totalElements || list.length;
      } else if (kchtType === 'VUNGNUOC') {
        const res = await api.get('/v1/vung-nuoc', {
          params: {
            page: searchPage - 1,
            size: searchPageSize,
            orgUnitId
          }
        });
        const pageData = res.data.data;
        list = (pageData.content || []).map((x: any) => ({
          ...x,
          id: x.id,
          name: x.tenVungNuoc || x.name || `Vùng nước ${x.id}`,
          orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
          kchtTypeLabel: 'Vùng nước',
          diaDiem: x.address || ''
        }));
        total = pageData.totalElements || list.length;
      } else if (kchtType === 'LUONGHANGHAI') {
        const res = await api.get('/v1/luong-hang-hai', {
          params: {
            page: 0,
            size: 9999
          }
        });
        const listData = Array.isArray(res.data.data) ? res.data.data : [];
        list = listData.map((x: any) => ({
          ...x,
          id: x.id,
          name: x.tenLuong || x.name || `Luồng hàng hải ${x.id}`,
          orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
          kchtTypeLabel: 'Luồng hàng hải',
          diaDiem: x.address || ''
        }));
        total = list.length;
      } else if (kchtType === 'DEKE') {
        const res = await api.get('/v1/de-ke', {
          params: {
            page: 0,
            size: 9999
          }
        });
        const listData = Array.isArray(res.data.data) ? res.data.data : [];
        list = listData.map((x: any) => ({
          ...x,
          id: x.id,
          name: x.tenDe || x.name || `Đê kè ${x.id}`,
          orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
          kchtTypeLabel: 'Đê kè',
          diaDiem: x.viTri || x.address || ''
        }));
        total = list.length;
      } else if (kchtType === 'DENBIEN') {
        const res = await api.get('/v1/nhatram/den');
        const listData = Array.isArray(res.data.data) ? res.data.data : [];
        list = listData.map((x: any) => ({
          ...x,
          id: x.id,
          name: x.tenTram || x.name || `Đèn biển ${x.id}`,
          orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
          kchtTypeLabel: 'Đèn biển',
          diaDiem: x.diaDiemDatTram || x.address || ''
        }));
        total = list.length;
      } else if (kchtType === 'PHAOTIEU') {
        const res = await api.get('/v1/nhatram/phao');
        const listData = Array.isArray(res.data.data) ? res.data.data : [];
        list = listData.map((x: any) => ({
          ...x,
          id: x.id,
          name: x.tenTram || x.name || `Phao tiêu ${x.id}`,
          orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
          kchtTypeLabel: 'Phao tiêu',
          diaDiem: x.diaDiemDatTram || x.address || ''
        }));
        total = list.length;
      } else if (kchtType === 'BENPHAO') {
        const res = await api.get('/v1/vung-nuoc', {
          params: { page: 0, size: 9999, orgUnitId }
        });
        const pageData = res.data.data;
        const allVungNuoc = pageData?.content || [];
        list = allVungNuoc
          .filter((x: any) => x.loaiVungNuoc?.toLowerCase().includes('phao'))
          .map((x: any) => ({
            ...x,
            id: x.id,
            name: x.tenVungNuoc || x.name || `Bến phao ${x.id}`,
            orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
            kchtTypeLabel: 'Bến phao',
            diaDiem: x.address || ''
          }));
        total = list.length;
      } else if (kchtType === 'KHUNEO_DAU') {
        const res = await api.get('/v1/vung-nuoc', {
          params: { page: 0, size: 9999, orgUnitId }
        });
        const pageData = res.data.data;
        const allVungNuoc = pageData?.content || [];
        list = allVungNuoc
          .filter((x: any) => x.loaiVungNuoc?.toLowerCase().includes('neo'))
          .map((x: any) => ({
            ...x,
            id: x.id,
            name: x.tenVungNuoc || x.name || `Khu neo đậu ${x.id}`,
            orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
            kchtTypeLabel: 'Khu neo đậu',
            diaDiem: x.address || ''
          }));
        total = list.length;
      } else if (kchtType === 'KHUCHUYEN_TAI') {
        const res = await api.get('/v1/vung-nuoc', {
          params: { page: 0, size: 9999, orgUnitId }
        });
        const pageData = res.data.data;
        const allVungNuoc = pageData?.content || [];
        list = allVungNuoc
          .filter((x: any) => x.loaiVungNuoc?.toLowerCase().includes('chuyển'))
          .map((x: any) => ({
            ...x,
            id: x.id,
            name: x.tenVungNuoc || x.name || `Khu chuyển tải ${x.id}`,
            orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
            kchtTypeLabel: 'Khu chuyển tải',
            diaDiem: x.address || ''
          }));
        total = list.length;
      } else if (kchtType === 'KHUTRANH_TRU_BAO') {
        const res = await api.get('/v1/vung-nuoc', {
          params: { page: 0, size: 9999, orgUnitId }
        });
        const pageData = res.data.data;
        const allVungNuoc = pageData?.content || [];
        list = allVungNuoc
          .filter((x: any) => x.loaiVungNuoc?.toLowerCase().includes('tránh') || x.loaiVungNuoc?.toLowerCase().includes('bão') || x.loaiVungNuoc?.toLowerCase().includes('trú'))
          .map((x: any) => ({
            ...x,
            id: x.id,
            name: x.tenVungNuoc || x.name || `Khu tránh trú bão ${x.id}`,
            orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
            kchtTypeLabel: 'Khu tránh trú bão',
            diaDiem: x.address || ''
          }));
        total = list.length;
      } else if (kchtType === 'COSO_SUACHUA') {
        const res = await api.get('/v1/co-so-sua-chua', {
          params: {
            page: 0,
            size: 9999
          }
        });
        const listData = Array.isArray(res.data.data) ? res.data.data : [];
        list = listData.map((x: any) => ({
          ...x,
          id: x.id,
          name: x.tenCoSo || x.name || `Cơ sở sửa chữa ${x.id}`,
          orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
          kchtTypeLabel: 'Cơ sở sửa chữa',
          diaDiem: x.diaChi || x.address || ''
        }));
        total = list.length;
      } else if (kchtType === 'HE_THONG_VTS') {
        const res = await api.get('/v1/he-thong-vts', {
          params: {
            page: searchPage - 1,
            size: searchPageSize
          }
        });
        const pageData = res.data.data;
        list = (pageData.content || []).map((x: any) => ({
          ...x,
          id: x.id,
          name: x.tenHeThong || x.name || `Hệ thống VTS ${x.id}`,
          orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
          kchtTypeLabel: 'Hệ thống VTS',
          diaDiem: x.viTri || x.address || ''
        }));
        total = pageData.totalElements || list.length;
      } else if (kchtType === 'TRAM_RADAR') {
        const res = await api.get('/v1/tram-radar', {
          params: {
            page: 0,
            size: 9999
          }
        });
        const listData = Array.isArray(res.data.data) ? res.data.data : [];
        list = listData.map((x: any) => ({
          ...x,
          id: x.id,
          name: x.tenTram || x.name || `Trạm Radar ${x.id}`,
          orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
          kchtTypeLabel: 'Trạm radar',
          diaDiem: x.viTri || x.address || ''
        }));
        total = list.length;
      } else {
        const res = await api.get('/v1/cang-bien', {
          params: {
            page: searchPage - 1,
            size: searchPageSize,
            orgUnitId,
            tinhThanhPho
          }
        });
        const pageData = res.data.data;
        list = (pageData.content || []).map((x: any) => ({
          ...x,
          id: x.id,
          name: x.tenCang || x.name || `Cảng biển ${x.id}`,
          orgName: x.orgUnitName || 'Cục Hàng hải Việt Nam',
          kchtTypeLabel: 'Cảng biển',
          diaDiem: x.tinhThanhPho || x.address || ''
        }));
        total = pageData.totalElements || list.length;
      }

      // For APIs that return full datasets without server-side pagination,
      // apply client-side pagination by slicing the list
      const needsClientPagination = [
        'LUONGHANGHAI', 'DEKE', 'DENBIEN', 'PHAOTIEU', 'TIEU_SONG', 'CHAM_TIEU',
        'KHUNEO_DAU', 'KHUCHUYEN_TAI', 'KHUTRANH_TRU_BAO', 'BENPHAO',
        'COSO_SUACHUA', 'TRAM_RADAR'
      ].includes(kchtType);

      if (needsClientPagination && list.length > 0) {
        total = list.length;
        const startIdx = (searchPage - 1) * searchPageSize;
        const endIdx = startIdx + searchPageSize;
        list = list.slice(startIdx, endIdx);
      }

      setInfrastructureResults(list);
      setTotalSearchElements(total);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingInfrastructure(false);
    }
  }, [searchForm, searchPage, searchPageSize]);

  // Load Org Units on Mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list();
        setOrgUnits(resp.data || []);
      } catch (err) {
        console.error('Failed to load org units', err);
      }
    })();
  }, []);

  // Trigger search on pagination changes
  useEffect(() => {
    handleSearchInfrastructure();
  }, [searchPage, searchPageSize, handleSearchInfrastructure]);

  const handleRowClick = useCallback((record: any) => {
    const rawLat = record.viDo ?? record.latitude;
    const rawLon = record.kinhDo ?? record.longitude;
    
    if (rawLat !== undefined && rawLat !== null && rawLon !== undefined && rawLon !== null) {
      const lat = parseFloat(rawLat as any);
      const lon = parseFloat(rawLon as any);
      
      if (!isNaN(lat) && !isNaN(lon) && mapRef.current) {
        mapRef.current.setView([lat, lon], 15);
        
        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px; min-width: 180px;">
            <h4 style="margin: 0 0 6px 0; color: #1890ff; font-size: 14px;">${record.tenCang || record.tenBen || record.tenCau || record.tenCangCan || record.tenVungNuoc || 'Chi tiết'}</h4>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><b>Loại KCHT:</b> ${record.kchtTypeLabel}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><b>Đơn vị quản lý:</b> ${record.orgName}</p>
            <p style="margin: 0; font-size: 12px;"><b>Địa điểm:</b> ${record.diaDiem || '—'}</p>
          </div>
        `;
        
        if (window.L) {
          window.L.popup()
            .setLatLng([lat, lon])
            .setContent(popupContent)
            .openOn(mapRef.current);
        }
      } else {
        toast.info('Đối tượng này chưa cấu hình tọa độ trên bản đồ');
      }
    } else {
      toast.info('Đối tượng này chưa cấu hình tọa độ trên bản đồ');
    }
  }, []);

  // Map elements refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geoJsonGroupRef = useRef<any>(null);
  const calibratorMarkerRef = useRef<any>(null);
  const lastFittedCellIdRef = useRef<string | null>(null);
  const renderChartFeaturesRef = useRef<() => void>();
  const fetchFeaturesInViewportRef = useRef<() => Promise<void>>();
  const moveEndTimeoutRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // 1. Dynamic Leaflet Loader
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    let script = document.querySelector('script[src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]') as HTMLScriptElement;
    if (script) {
      const handleLoad = () => setLeafletLoaded(true);
      script.addEventListener('load', handleLoad);
      return () => {
        script.removeEventListener('load', handleLoad);
      };
    }

    // Load Leaflet CSS
    if (!document.querySelector('link[href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);

    return () => {};
  }, []);

  // 2. Fetch Chart Cells
  const fetchCells = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chartService.getAllCells();
      setCells(data);
    } catch {
      toast.error('Không thể tải danh sách cell hải đồ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCells();
  }, [fetchCells]);

  const fetchFeaturesInViewport = useCallback(async () => {
    if (!mapRef.current) return;
    const zoom = mapRef.current.getZoom();
    if (zoom < 12) {
      // Only trigger re-render if features are not already empty
      setFeatures(prev => prev.length === 0 ? prev : []);
      return;
    }

    const bounds = mapRef.current.getBounds();
    const pad = 0.02;
    const minLat = bounds.getSouth() - pad;
    const maxLat = bounds.getNorth() + pad;
    const minLon = bounds.getWest() - pad;
    const maxLon = bounds.getEast() + pad;

    try {
      const data = await chartService.getAllS52StyledFeatures(palette, {
        minLon,
        minLat,
        maxLon,
        maxLat
      });
      setFeatures(data);
    } catch (err) {
      console.error('Failed to load chart features in bounds', err);
    }
  }, [palette]);

  useEffect(() => {
    fetchFeaturesInViewportRef.current = fetchFeaturesInViewport;
  }, [fetchFeaturesInViewport]);



  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return;

    const L = window.L;
    // Create map centered on Vietnam (incorporating East Sea / Sovereignty area)
    const map = L.map(mapContainerRef.current, { preferCanvas: true }).setView([16.0, 108.0], 5);
    mapRef.current = map;

    // Use Google Maps tile layer with Vietnamese localization (hl=vi, gl=vn)
    // Use {s} subdomain rotation (mt0-mt3) for parallel tile downloads (4x6=24 concurrent connections)
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=vi&gl=vn&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: '0123',
      attribution: '© Google Maps',
      keepBuffer: 4,               // Cache 4 screen-widths of tiles offscreen
      updateWhenZooming: false,     // Don't load new tiles mid-zoom animation
      updateWhenIdle: true,         // Only load tiles after movement stops
    }).addTo(map);

    // Track map zoom and move events for viewport filtering with 300ms debounce
    map.on('moveend', () => {
      if (moveEndTimeoutRef.current) {
        clearTimeout(moveEndTimeoutRef.current);
      }
      moveEndTimeoutRef.current = setTimeout(() => {
        if (fetchFeaturesInViewportRef.current) {
          void fetchFeaturesInViewportRef.current();
        }
      }, 300);
    });

    // Feature group for vector charts
    geoJsonGroupRef.current = L.featureGroup().addTo(map);

    // Invalidate size once after container renders to ensure correct sizing
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (moveEndTimeoutRef.current) {
        clearTimeout(moveEndTimeoutRef.current);
      }
      if (mapRef.current) {
        mapRef.current.off('moveend');
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded]);

  const [parsedLayers, setParsedLayers] = useState<Array<{
    minZoom: number;
    layer: any;
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
    featureCode: string;
  }>>([]);
  
  const flatbushIndexRef = useRef<Flatbush | null>(null);
  const layersCacheRef = useRef<Record<string, any>>({});
  const prevPaletteRef = useRef<string>('DAY');

  // Pre-build Leaflet layers once when features are loaded or palette changes
  useEffect(() => {
    const L = window.L;
    if (!L || features.length === 0) {
      setParsedLayers([]);
      flatbushIndexRef.current = null;
      return;
    }

    if (prevPaletteRef.current !== palette) {
      layersCacheRef.current = {};
      prevPaletteRef.current = palette;
    }

    const tempLayers: Array<{
      minZoom: number;
      layer: any;
      minLat: number;
      minLon: number;
      maxLat: number;
      maxLon: number;
      featureCode: string;
    }> = [];

    features.forEach((feature) => {
      // Check cache first!
      const cached = layersCacheRef.current[feature.id];
      if (cached) {
        tempLayers.push(cached);
        return;
      }

      const { geometryType, coordinates, s52Style, featureName, featureCode } = feature;
      const minZoom = FEATURE_ZOOM_RULES[featureCode] ?? 13;
      const { fillColor, strokeColor, strokeWidth, strokeDashArray, iconSymbol, fillOpacity } = s52Style;

      // Determine circle radius dynamically based on feature type
      let radius = 5;
      const codeUpper = featureCode.toUpperCase();
      if (codeUpper === 'LIGHTS') {
        radius = 7;
      } else if (['ACHBRT', 'PILPNT', 'PILBOP', 'WRECKS', 'OBSTRN'].includes(codeUpper)) {
        radius = 6;
      } else if (codeUpper.startsWith('BOY') || codeUpper.startsWith('BCN')) {
        radius = 6;
      }

      try {
        let layer: any = null;
        let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;

        if (geometryType === 'POINT') {
          const match = coordinates.match(/POINT\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)/i);
          if (match) {
            const lon = parseFloat(match[1]);
            const lat = parseFloat(match[2]);
            // Use circleMarker (rendered on Canvas via preferCanvas:true) instead of
            // L.marker+divIcon (DOM element) to avoid layout thrashing with thousands of points
            layer = L.circleMarker([lat, lon], {
              radius: radius,
              fillColor: fillColor || '#3388ff',
              color: strokeColor || '#333',
              weight: 1.5,
              fillOpacity: 0.85,
            });
            minLat = maxLat = lat;
            minLon = maxLon = lon;
          }
        } else if (geometryType === 'LINE') {
          const coordsStr = coordinates.replace(/LINESTRING\s*\(/i, '').replace(/\)/, '');
          const points = coordsStr.split(',').map((pStr: string) => {
            const parts = pStr.trim().split(/\s+/);
            const lat = parseFloat(parts[1]);
            const lon = parseFloat(parts[0]);
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            return [lat, lon];
          });
          layer = L.polyline(points, {
            color: strokeColor,
            weight: strokeWidth,
            dashArray: strokeDashArray,
          });
        } else if (geometryType === 'POLYGON') {
          const coordsStr = coordinates.replace(/POLYGON\s*\(\s*\(/i, '').replace(/\)\s*\)/, '');
          const points = coordsStr.split(',').map((pStr: string) => {
            const parts = pStr.trim().split(/\s+/);
            const lat = parseFloat(parts[1]);
            const lon = parseFloat(parts[0]);
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            return [lat, lon];
          });
          layer = L.polygon(points, {
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            color: strokeColor,
            weight: strokeWidth,
            dashArray: strokeDashArray,
            interactive: featureCode !== 'M_COVR' && featureCode !== 'M_QUAL',
          });
        }

        if (layer) {
          layer.bindPopup(`
            <strong>${getFeatureNameVi(featureCode, featureName)}</strong><br/>
            Mã S-57: <code>${featureCode}</code><br/>
            Hình học: <code>${geometryType}</code>
          `);
          layer.on('click', () => setSelectedFeature(feature));
          const parsedItem = { minZoom, layer, minLat, minLon, maxLat, maxLon, featureCode };
          
          // Write to cache
          layersCacheRef.current[feature.id] = parsedItem;
          tempLayers.push(parsedItem);
        }
      } catch (err) {
        // skip
      }
    });

    setParsedLayers(tempLayers);
  }, [features, leafletLoaded, palette]);

  // 4. Render S-57 Features onto Leaflet using S-52 Styling
  const renderChartFeatures = useCallback(() => {
    const L = window.L;
    if (!L || !mapRef.current || !geoJsonGroupRef.current) return;

    geoJsonGroupRef.current.clearLayers();

    const zoom = mapRef.current.getZoom();
    if (zoom < 12) return;

    if (parsedLayers.length === 0) return;

    const activeLayers: any[] = [];
    parsedLayers.forEach(({ minZoom, layer, featureCode }) => {
      const isVisible = visibleLayers[featureCode] ?? true;
      if (zoom >= minZoom && isVisible) {
        activeLayers.push(layer);
      }
    });

    if (activeLayers.length > 0) {
      const tempGroup = L.layerGroup(activeLayers);
      geoJsonGroupRef.current.addLayer(tempGroup);
    }
  }, [parsedLayers, visibleLayers]);

  useEffect(() => {
    renderChartFeaturesRef.current = renderChartFeatures;
  }, [renderChartFeatures]);

  // 5. Load features in viewport when cells list, palette, or map zoom changes
  useEffect(() => {
    if (cells.length === 0 || !leafletLoaded) return;
    void fetchFeaturesInViewport();
  }, [cells.length, palette, leafletLoaded, fetchFeaturesInViewport]);

  // Center and zoom map on cell selection with smooth panning/flying instead of instant jump
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !selectedCellId || cells.length === 0) return;

    const activeCell = cells.find((c) => c.id === selectedCellId);
    if (activeCell) {
      const center = (activeCell.latitude !== undefined && activeCell.latitude !== null &&
                     activeCell.longitude !== undefined && activeCell.longitude !== null)
        ? [activeCell.latitude, activeCell.longitude] as [number, number]
        : getCenterByCellName(activeCell.cellName);
      if (center) {
        mapRef.current.flyTo(center, 12, {
          animate: true,
          duration: 1.5, // 1.5 seconds smooth gliding transition
        });
      }
    }
  }, [selectedCellId, cells, leafletLoaded]);

  useEffect(() => {
    if (leafletLoaded && mapRef.current) {
      const timer = setTimeout(() => {
        renderChartFeatures();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [leafletLoaded, parsedLayers, renderChartFeatures, visibleLayers]);

  // 6. Coordinate Calibration Form Submission
  const handleCalibrate = useCallback(async (values: any) => {
    try {
      setCalibrating(true);
      
      const payload = {
        systemType: values.systemType,
        coord1: values.coord1,
        coord2: values.coord2,
        zoneOrCm: values.zoneOrCm,
        dx: values.dx || 0.0,
        dy: values.dy || 0.0,
      };

      const result = await chartService.calibrate(payload);
      if (result.valid) {
        setCalibratedPoint({ lon: result.longitude, lat: result.latitude });
        toast.success('Đã hiệu chỉnh tọa độ thành công sang WGS84');
        
        // Render Marker on Map
        try {
          const L = window.L;
          if (L && mapRef.current) {
            if (calibratorMarkerRef.current) {
              mapRef.current.removeLayer(calibratorMarkerRef.current);
            }
            
            calibratorMarkerRef.current = L.marker([result.latitude, result.longitude], {
              icon: L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                shadowSize: [41, 41],
              })
            })
              .addTo(mapRef.current)
              .bindPopup(`
                <strong>Tọa độ hiệu chỉnh (WGS84)</strong><br/>
                Kinh độ: ${result.longitude.toFixed(6)}°<br/>
                Vĩ độ: ${result.latitude.toFixed(6)}°<br/>
                Gốc: ${values.systemType} [X: ${values.coord1}, Y: ${values.coord2}]
              `)
              .openPopup();

            mapRef.current.setView([result.latitude, result.longitude], 13);
          }
        } catch (mapErr) {
          console.error('Lỗi vẽ marker bản đồ:', mapErr);
        }
      } else {
        toast.error(result.errorMessage || 'Tọa độ không hợp lệ');
      }
    } catch (err: any) {
      console.error('Lỗi hiệu chuẩn tọa độ:', err);
    } finally {
      setCalibrating(false);
    }
  }, []);

  // 7. File uploads for importing
  const handleUploadS57 = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      await chartService.importS57(file);
      toast.success(`Đã nhập hải đồ S-57 "${file.name}" thành công`);
      onSuccess(null, file);
      void fetchCells();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Nhập hải đồ S-57 thất bại');
      onError(err);
    }
  };

  const handleUploadS63 = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      await chartService.importS63(file);
      toast.success(`Đã nhập hải đồ bảo mật S-63 "${file.name}" thành công`);
      onSuccess(null, file);
      void fetchCells();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Giải mã hoặc nhập hải đồ S-63 thất bại');
      onError(err);
    }
  };

  return (
    <div style={{ padding: '0px' }}>
      <Row gutter={[16, 16]}>
        {/* Main Map Viewer */}
        <Col xs={24} lg={17} style={{ order: 2 }}>
          <Card
            title={
              <Space>
                <CompassOutlined style={{ color: '#1890ff' }} />
                <span>Bản đồ tích hợp hải đồ S-57/S-63 (S-52 display)</span>
              </Space>
            }
            extra={
              <Space>
                <Radio.Group value={palette} onChange={(e) => setPalette(e.target.value)} size="small">
                  <Radio.Button value="DAY">DAY (Ngày)</Radio.Button>
                  <Radio.Button value="DUSK">DUSK (Hoàng hôn)</Radio.Button>
                  <Radio.Button value="NIGHT">NIGHT (Đêm)</Radio.Button>
                </Radio.Group>
                <Button size="small" icon={<ReloadOutlined />} onClick={fetchCells} />
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            {/* The Map Div and Floating Control */}
            <div style={{ position: 'relative', height: 'calc(100vh - 180px)' }}>
              <div
                ref={mapContainerRef}
                id="leaflet-map-container"
                style={{
                  height: '100%',
                  width: '100%',
                  backgroundColor: palette === 'NIGHT' ? '#110000' : '#f0f2f5',
                  filter: palette === 'NIGHT' ? 'brightness(0.85) contrast(1.1)' : 'none',
                }}
              />
              {/* Overlay Grid Button (AppstoreOutlined) */}
              <Button
                type="primary"
                icon={<AppstoreOutlined style={{ fontSize: '18px' }} />}
                onClick={() => setDrawerVisible(true)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  zIndex: 1000,
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
            </div>
          </Card>
        </Col>

        {/* Sidebar panels */}
        <Col xs={24} lg={7} style={{ order: 1 }}>
          <Tabs
            className="gis-sidebar-tabs"
            defaultActiveKey="1"
            type="card"
            style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column' }}
            items={[
              {
                key: '1',
                label: 'Tra cứu',
                children: (
                  <Card variant="borderless" styles={{ body: { padding: '12px' } }}>
                    <Typography.Title level={4} style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#111' }}>
                      Tra cứu thông tin kết cấu hạ tầng hàng hải trên bản đồ
                    </Typography.Title>
                    <Form form={searchForm} layout="vertical" onFinish={handleSearchInfrastructure} initialValues={{ orgUnitId: 'all', kchtType: 'CANGBIEN', tinhThanhPho: '' }}>
                      <Form.Item name="orgUnitId" label="Đơn vị quản lý *" rules={[{ required: true }]}>
                        <Select
                          showSearch
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                          options={[
                            { value: 'all', label: '---Tất cả---' },
                            ...orgUnits.map(u => ({ value: u.id, label: u.name }))
                          ]}
                        />
                      </Form.Item>

                       <Form.Item name="kchtType" label="Loại kết cấu hạ tầng">
                        <Select
                          placeholder="Chọn loại kết cấu..."
                          options={[
                            { value: 'BENCANG', label: 'Bến cảng' },
                            { value: 'BENPHAO', label: 'Bến phao' },
                            { value: 'CANGBIEN', label: 'Cảng biển' },
                            { value: 'CANGCAN', label: 'Cảng cạn' },
                            { value: 'CAUCANG', label: 'Cầu cảng' },
                            { value: 'COSO_SUACHUA', label: 'Cơ sở sửa chữa' },
                            { value: 'DEKE', label: 'Đê kè' },
                            { value: 'DENBIEN', label: 'Đèn biển' },
                            { value: 'HE_THONG_VTS', label: 'Hệ thống VTS' },
                            { value: 'KHUCHUYEN_TAI', label: 'Khu chuyển tải' },
                            { value: 'KHUNEO_DAU', label: 'Khu neo đậu' },
                            { value: 'KHUTRANH_TRU_BAO', label: 'Khu tránh trú bão' },
                            { value: 'LUONGHANGHAI', label: 'Luồng hàng hải' },
                            { value: 'PHAOTIEU', label: 'Phao tiêu' },
                            { value: 'TRAM_RADAR', label: 'Trạm radar' },
                            { value: 'VUNGNUOC', label: 'Vùng nước' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item name="tinhThanhPho" label="Địa điểm (Tỉnh/Thành phố)">
                        <Select
                          showSearch
                          placeholder="Chọn tỉnh/thành phố..."
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                          options={[
                            { value: '', label: '---Tất cả---' },
                            ...VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))
                          ]}
                        />
                      </Form.Item>

                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          icon={<SearchOutlined />}
                          loading={searchingInfrastructure}
                          style={{ flex: 1 }}
                        >
                          Tìm kiếm
                        </Button>
                        <Button 
                          icon={<DeleteOutlined />} 
                          onClick={() => {
                            searchForm.resetFields();
                            setInfrastructureResults([]);
                            setTotalSearchElements(0);
                          }}
                          style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
                        >
                          Xóa tìm kiếm
                        </Button>
                        <Button icon={<SlidersOutlined />} />
                      </div>
                    </Form>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px 0', fontSize: '13px' }}>
                      <span>{totalSearchElements > 0 ? `${(searchPage - 1) * searchPageSize + 1}-${Math.min(searchPage * searchPageSize, totalSearchElements)} trong ${totalSearchElements}` : '0 trong 0'}</span>
                      <Space size={4}>
                        <Button 
                          size="small" 
                          disabled={searchPage <= 1} 
                          onClick={() => { setSearchPage(p => p - 1); }}
                        >
                          &lt;
                        </Button>
                        <Button 
                          size="small" 
                          disabled={searchPage * searchPageSize >= totalSearchElements} 
                          onClick={() => { setSearchPage(p => p + 1); }}
                        >
                          &gt;
                        </Button>
                        <Select
                          size="small"
                          value={searchPageSize}
                          onChange={(val) => { setSearchPageSize(val); setSearchPage(1); }}
                          options={[
                            { value: 10, label: '10 / trang' },
                            { value: 20, label: '20 / trang' },
                            { value: 50, label: '50 / trang' },
                          ]}
                          style={{ width: 105 }}
                        />
                      </Space>
                    </div>

                    <Table
                      rowSelection={{
                        type: 'checkbox',
                        onSelect: (record, selected) => {
                          if (selected) {
                            handleRowClick(record);
                          }
                        },
                        onSelectAll: (selected, selectedRows) => {
                          if (selected && selectedRows.length > 0) {
                            handleRowClick(selectedRows[0]);
                          }
                        }
                      }}
                      columns={[
                        {
                          title: 'STT',
                          dataIndex: 'stt',
                          key: 'stt',
                          width: 50,
                          render: (_text, _record, index) => (searchPage - 1) * searchPageSize + index + 1,
                        },
                        {
                          title: 'Đơn vị quản lý',
                          dataIndex: 'orgName',
                          key: 'orgName',
                        },
                        {
                          title: 'Loại KCHT',
                          dataIndex: 'kchtTypeLabel',
                          key: 'kchtTypeLabel',
                        },
                        {
                          title: 'Địa điểm',
                          dataIndex: 'diaDiem',
                          key: 'diaDiem',
                        }
                      ]}
                      dataSource={infrastructureResults}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      bordered
                      onRow={(record) => ({
                        onClick: () => handleRowClick(record),
                        style: { cursor: 'pointer' }
                      })}
                      style={{ marginTop: 12 }}
                    />
                  </Card>
                ),
              },
              {
                key: '2',
                label: 'Hiệu chỉnh tọa độ',
                children: (
                  <Card variant="borderless">
                    <Form form={calibrationForm} layout="vertical" onFinish={handleCalibrate} initialValues={{ systemType: 'VN2000', dx: 0, dy: 0 }}>
                      <Form.Item name="systemType" label="Hệ tọa độ nguồn" rules={[{ required: true }]}>
                        <Radio.Group style={{ width: '100%' }}>
                          <Radio.Button value="VN2000" style={{ width: '33.3%' }}>VN-2000</Radio.Button>
                          <Radio.Button value="UTM" style={{ width: '33.3%' }}>UTM</Radio.Button>
                          <Radio.Button value="WGS84" style={{ width: '33.4%' }}>WGS84</Radio.Button>
                        </Radio.Group>
                      </Form.Item>

                      <Form.Item noStyle shouldUpdate={(prev, curr) => prev.systemType !== curr.systemType}>
                        {({ getFieldValue }) => {
                          const type = getFieldValue('systemType');
                          return (
                            <>
                              <Form.Item
                                name="coord1"
                                label={type === 'WGS84' ? 'Kinh độ (Decimal / DMS / DDM)' : 'Tọa độ X (Easting)'}
                                rules={[{ required: true, message: 'Vui lòng điền tọa độ 1' }]}
                              >
                                <Input placeholder={type === 'WGS84' ? 'Ví dụ: 106°37\'46" E' : 'Ví dụ: 568390.0'} />
                              </Form.Item>

                              <Form.Item
                                name="coord2"
                                label={type === 'WGS84' ? 'Vĩ độ (Decimal / DMS / DDM)' : 'Tọa độ Y (Northing)'}
                                rules={[{ required: true, message: 'Vui lòng điền tọa độ 2' }]}
                              >
                                <Input placeholder={type === 'WGS84' ? 'Ví dụ: 20°40\'0" N' : 'Ví dụ: 2322890.0'} />
                              </Form.Item>

                              {type !== 'WGS84' && (
                                <Form.Item
                                  name="zoneOrCm"
                                  label={type === 'VN2000' ? 'Kinh tuyến trục (Central Meridian)' : 'Múi chiếu (UTM Zone)'}
                                  rules={[{ required: true, message: 'Vui lòng chọn múi/kinh tuyến trục' }]}
                                >
                                  <Input placeholder={type === 'VN2000' ? 'Ví dụ: 105.0 hoặc 108.5' : 'Ví dụ: 48N'} />
                                </Form.Item>
                              )}
                            </>
                          );
                        }}
                      </Form.Item>

                      <Collapse size="small" bordered={false} style={{ marginBottom: 16 }}>
                        <Collapse.Panel header="Sai số hiệu chuẩn (Calibration offset)" key="1">
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item name="dx" label="Độ lệch dX (m / deg)">
                                <InputNumber style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="dy" label="Độ lệch dY (m / deg)">
                                <InputNumber style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Collapse.Panel>
                      </Collapse>

                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<GlobalOutlined />}
                          loading={calibrating}
                          style={{ width: '100%' }}
                        >
                          Hiệu chuẩn & Chuyển WGS84
                        </Button>
                      </Form.Item>
                    </Form>

                    {calibratedPoint && (
                      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                        <Typography.Text strong>Kết quả hiệu chuẩn (EPSG:4326):</Typography.Text><br/>
                        <Typography.Text>Kinh độ: <code>{calibratedPoint.lon.toFixed(7)}°</code></Typography.Text><br/>
                        <Typography.Text>Vĩ độ: <code>{calibratedPoint.lat.toFixed(7)}°</code></Typography.Text>
                      </div>
                    )}
                  </Card>
                ),
              },
              {
                key: '3',
                label: 'Nhập hải đồ',
                children: (
                  <Card variant="borderless">
                    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                      <Card size="small" title="Nhập hải đồ thường (S-57)" style={{ width: '100%' }}>
                        <Typography.Paragraph type="secondary" style={{ fontSize: '13px' }}>
                          Tải lên file hải đồ định dạng tiêu chuẩn S-57 (`.000`). Hệ thống sẽ tự động phân tích và trích xuất các đối tượng.
                        </Typography.Paragraph>
                        <Upload customRequest={handleUploadS57} showUploadList={false}>
                          <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
                            Chọn file S-57 (.000)
                          </Button>
                        </Upload>
                      </Card>

                      <Card size="small" title="Nhập hải đồ bảo mật (S-63)" style={{ width: '100%' }}>
                        <Typography.Paragraph type="secondary" style={{ fontSize: '13px' }}>
                          Nhập file hải đồ mã hóa S-63 (`.000`). File yêu cầu phải có giấy phép Cell Permit tương ứng đã được đăng ký trước.
                        </Typography.Paragraph>
                        <Upload customRequest={handleUploadS63} showUploadList={false}>
                          <Button icon={<UploadOutlined />} style={{ width: '100%' }} type="dashed">
                            Chọn file S-63 (.000)
                          </Button>
                        </Upload>
                      </Card>
                    </Space>
                  </Card>
                ),
              },
            ]}
          />
        </Col>
      </Row>

      {/* Drawer for Map Layer Management */}
      <Drawer
        title="Quản lý lớp bản đồ"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        size="default"
      >
        <Space orientation="vertical" style={{ width: '100%' }} size={16}>
          <Checkbox 
            checked={uniqueFeatureCodes.length > 0 && uniqueFeatureCodes.every(code => visibleLayers[code] ?? true)}
            indeterminate={
              uniqueFeatureCodes.some(code => visibleLayers[code] ?? true) && 
              !uniqueFeatureCodes.every(code => visibleLayers[code] ?? true)
            }
            onChange={(e) => {
              const checked = e.target.checked;
              const next: Record<string, boolean> = {};
              uniqueFeatureCodes.forEach(code => {
                next[code] = checked;
              });
              setVisibleLayers(next);
            }}
          >
            <strong>ENC - Hải đồ điện tử</strong>
          </Checkbox>

          <Divider style={{ margin: '8px 0' }} />

          <Typography.Text type="secondary" strong>
            Chi tiết Hải đồ (Lọc theo lớp)
          </Typography.Text>

          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {uniqueFeatureCodes.map(code => {
              const label = getFeatureNameVi(code);
              const icon = LAYER_ICONS[code] || '🌐';
              const isChecked = visibleLayers[code] ?? true;

              return (
                <div key={code} style={{ padding: '6px 0', display: 'flex', alignItems: 'center' }}>
                  <Checkbox 
                    checked={isChecked}
                    onChange={(e) => handleToggleLayer(code, e.target.checked)}
                  >
                    <Space size={8}>
                      <span>{icon}</span>
                      <span>{label}</span>
                    </Space>
                  </Checkbox>
                </div>
              );
            })}
          </div>
        </Space>
      </Drawer>
    </div>
  );
}

function DescriptionsPanel({ feature }: { feature: ChartFeature }) {
  const { featureName, featureCode, geometryType, coordinates, attributes } = feature;
  return (
    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
      <Typography.Paragraph style={{ marginBottom: 4 }}>
        <strong>Tên:</strong> {getFeatureNameVi(featureCode, featureName)}
      </Typography.Paragraph>
      <Typography.Paragraph style={{ marginBottom: 4 }}>
        <strong>Mã đối tượng:</strong> <Tag color="orange">{featureCode}</Tag>
      </Typography.Paragraph>
      <Typography.Paragraph style={{ marginBottom: 4 }}>
        <strong>Kiểu hình học:</strong> <code>{geometryType}</code>
      </Typography.Paragraph>
      <Typography.Paragraph style={{ marginBottom: 12, fontSize: '11px', color: '#888' }}>
        <strong>Tọa độ:</strong> <code>{coordinates.length > 50 ? `${coordinates.substring(0, 50)}...` : coordinates}</code>
      </Typography.Paragraph>

      <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Thuộc tính S-57:</Typography.Text>
      {attributes && Object.keys(attributes).length > 0 ? (
        <List
          size="small"
          bordered
          dataSource={Object.entries(attributes)}
          renderItem={([key, val]) => (
            <List.Item style={{ padding: '4px 8px', fontSize: '12px' }}>
              <strong style={{ color: '#555' }}>{key}:</strong> <span>{String(val)}</span>
            </List.Item>
          )}
        />
      ) : (
        <Typography.Text type="secondary" italic style={{ fontSize: '12px' }}>Không có thuộc tính</Typography.Text>
      )}
    </div>
  );
}
