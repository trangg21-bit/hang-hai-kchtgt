import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Grid,
  Space,
  Typography,
  Button,
  Select,
  Form,
  Input,
  Tag,
  List,
  Drawer,
  Checkbox,
  Radio,
  Modal,
} from 'antd';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  InfoCircleOutlined,
  FilterOutlined,
  AppstoreOutlined,
  SearchOutlined,
  ReloadOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { chartService } from '../../services/chartService';
import type { ChartCell, ChartFeature } from '../../services/chartService';
import api from '../../services/api';
import {
  portCRUD,
  berthCRUD,
  pierCRUD,
  dryPortCRUD,
  waterZoneCRUD
} from '../../services/portService';
import { beaconStationCRUD, buoyCRUD } from '../../services/beaconService';
import { fetchBuoyStationById } from '../../services/buoy-station/api';
import { dikeRevetmentCRUD } from '../../services/dikeRevetmentService';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import { radarStationCRUD } from '../../services/radarStationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { shipRepairFacilityCRUD } from '../../services/shipRepairFacilityService';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { userService } from '../../services/userService';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import {
  getKchtGisTypeByCategoryId,
  getKchtGisTypeLabelByCategoryId,
  KCHT_GIS_TYPE_OPTIONS,
  LEGACY_KCHT_TYPE_MAP,
  type KchtGisSearchPage,
  type KchtGisSearchResult,
} from '../../types/gisSearch';
import toast, { modal } from '../../components/ToastNotification';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { DataTable, Pagination } from '../../components/list-view';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import {
  actionPrimary,
  actionHover,
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  borderDefault,
  sidebarBg,
  radiusSm,
  radiusMd,
  radiusLg,
  radiusPill,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceFormField,
  spaceLg,
  spaceXl,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontSizeXl,
  fontSizeHeading,
  fontWeightNormal,
  fontWeightMedium,
  fontWeightBold,
  cardStyle,
  controlHeight,
  drawerProps,
  drawerCloseBtnStyle,
  drawerTitleStyle,
  drawerFooterStyle,
  filterLabelStyle,
  formFieldStyle,
  inputStyle,
  primaryButtonStyle,
  selectStyle,
  shadowSm,
  shadowMd,
  shadowLg,
  surfaceCard,
  surfacePage,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSans,
} from '../../tokens';
import { colors } from '../../theme';
import Flatbush from 'flatbush';
import MapToolbar from '../../components/gis/MapToolbar';
import DrawSaveModal from '../../components/gis/DrawSaveModal';
import type { DrawResult } from '../../components/gis/DrawSaveModal';
import { pointObjectService } from '../../services/pointObjectService';
import { lineObjectService } from '../../services/lineObjectService';
import { polygonObjectService } from '../../services/polygonObjectService';
import {
  normalizeLineCoordinates,
  normalizePointCoordinates,
  normalizePolygonCoordinates,
  parseWktToCoords,
  resolveMapGeometryLocation,
} from '../../utils/gisGeometry';
import {
  DEFAULT_SHOW_PLANNING,
  GIS_LAYER_INTERACTION_POLICY,
  getPlanningFeatureKey,
  getPlanningLeafletColorStyle,
  getPlanningStatusPresentation,
  getPlanningStyleZoomBand,
  getPlanningVisualStyle,
  PLANNING_STATUS_COLORS,
  shouldRenderPlanningFeature,
} from '../../utils/planningGis';
import Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

declare global {
  interface Window {
    L: any;
    handleKchtAction: (id: string, type: string, action: 'view' | 'edit') => void;
  }
}

let leafletRuntime: any;

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

const ENC_LAYER_DETAILS = [
  { code: 'ACHARE', label: 'Vùng neo đậu (ACHARE)', icon: '⚓' },
  { code: 'ACHBRT', label: 'Vùng cập tàu (ACHBRT)', icon: '⛵' },
  { code: 'BRIDGE', label: 'Cầu (BRIDGE)', icon: '🌉' },
  { code: 'CTNARE', label: 'Vùng Container (CTNARE)', icon: '📦' },
  { code: 'DEPARE', label: 'Vùng độ sâu (DEPARE)', icon: '🌊' },
  { code: 'FAIRWY', label: 'Luồng hàng hải (FAIRWY)', icon: '🛣️' },
  { code: 'M_COVR', label: 'Vùng phủ bản đồ (M_COVR)', icon: '🗺️' },
  { code: 'MARCUL', label: 'Vùng nuôi trồng thủy sản (MARCUL)', icon: '🐟' },
  { code: 'OBSTRN', label: 'Vật chướng ngại (OBSTRN)', icon: '⚠️' },
  { code: 'OFSPLF', label: 'Giàn khoan ngoài khơi (OFSPLF)', icon: '🏗️' },
  { code: 'PILBOP', label: 'Trạm hoa tiêu (PILBOP)', icon: '🧭' },
  { code: 'SLCONS', label: 'Công trình bờ biển (SLCONS)', icon: '🧱' },
  { code: 'RESARE', label: 'Vùng hạn chế (RESARE)', icon: '🚫' },
  { code: 'WRECKS', label: 'Xác tàu đắm (WRECKS)', icon: '☠️' },
  { code: 'CBLOHD', label: 'Cáp treo trên cao (CBLOHD)', icon: '⚡' },
  { code: 'CBLSUB', label: 'Cáp ngầm dưới biển (CBLSUB)', icon: '🔌' },
  { code: 'DEPCNT', label: 'Đường đẳng sâu (DEPCNT)', icon: '〰️' },
  { code: 'FSHFAC', label: 'Công trình đánh bắt cá (FSHFAC)', icon: '🎣' },
  { code: 'NAVLNE', label: 'Tuyến hàng hải (NAVLNE)', icon: '🚢' },
  { code: 'BOYCAR', label: 'Phao phương vị (BOYCAR)', icon: '🧭' },
  { code: 'BOYLAT', label: 'Phao bên - Lateral (BOYLAT)', icon: '🔴' },
  { code: 'BOYSAW', label: 'Phao nước an toàn (BOYSAW)', icon: '⚪' },
  { code: 'BOYSPP', label: 'Phao đặc biệt (BOYSPP)', icon: '🟡' },
  { code: 'LNDMRK', label: 'Vật định hướng trên đất (LNDMRK)', icon: '🏢' },
  { code: 'MORFAC', label: 'Công trình neo buộc (MORFAC)', icon: '⚓' },
  { code: 'PILPNT', label: 'Trạm hoa tiêu điểm (PILPNT)', icon: '☸️' },
  { code: 'TOPMAR', label: 'Tiêu đỉnh (TOPMAR)', icon: '🚩' },
  { code: 'BCNLAT', label: 'Tiêu bên (VIEW_BCNLAT)', icon: '🔺' },
  { code: 'BCNSPP', label: 'Tiêu đặc biệt (VIEW_BCNSPP)', icon: '📍' },
  { code: 'LIGHTS', label: 'Đèn báo hiệu (VIEW_LIGHTS)', icon: '💡' },
] as const;

const BASE_MAP_OPTIONS = [
  {
    value: 'google-m',
    label: 'Bản đồ nền Google Map (Online) M',
    icon: '🗺️',
    url: 'https://mt{s}.google.com/vt/lyrs=m&hl=vi&gl=vn&x={x}&y={y}&z={z}',
  },
  {
    value: 'google-y',
    label: 'Bản đồ nền Google Map (Online) Y',
    icon: '🛰️',
    url: 'https://mt{s}.google.com/vt/lyrs=y&hl=vi&gl=vn&x={x}&y={y}&z={z}',
  },
  {
    value: 'google-p',
    label: 'Bản đồ nền Google Map (Online) P',
    icon: '⛰️',
    url: 'https://mt{s}.google.com/vt/lyrs=p&hl=vi&gl=vn&x={x}&y={y}&z={z}',
  },
] as const;

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

const formatDateTime = (dtStr?: string) => {
  if (!dtStr) return '—';
  try {
    const d = new Date(dtStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return dtStr;
  }
};

const formatDate = (dStr?: string) => {
  if (!dStr) return '—';
  try {
    const d = new Date(dStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dStr;
  }
};

const getLoaiBenText = (val?: string) => {
  if (!val) return '—';
  const v = val.toUpperCase();
  if (v === 'BEN_CONTAINER') return 'Bến Container';
  if (v === 'BEN_TONG_HOP') return 'Bến tổng hợp';
  if (v === 'BEN_CHUYEN_DUNG') return 'Bến chuyên dụng';
  if (v === 'BEN_HANH_KHACH') return 'Bến hành khách';
  if (v === 'BEN_PHAO') return 'Bến phao';
  if (v === 'BEN_THUY_NOI_DIA') return 'Bến thủy nội địa';
  return val;
};

const getLoaiCauText = (val?: string) => {
  if (!val) return '—';
  const v = val.toUpperCase();
  if (v === 'CONTAINER') return 'Cầu cảng container';
  if (v === 'TONG_HOP') return 'Cầu cảng tổng hợp';
  if (v === 'HANH_KHACH') return 'Cầu cảng hành khách';
  if (v === 'CHUYEN_DUNG_XANG_DAU') return 'Cầu cảng chuyên dụng xăng dầu';
  if (v === 'CHUYEN_DUNG_ROI_QUANG') return 'Cầu cảng chuyên dụng rời quặng';
  if (v === 'KHAC') return 'Khác';
  return val;
};

const resolvedNamesCache = new Map<string, string>();
let orgUnitsGlobalCache: any[] = [];

const resolveName = async (id: string, type: 'org' | 'Port' | 'Berth' | 'User') => {
  if (!id) return '';
  const cacheKey = `${type}:${id}`;
  if (resolvedNamesCache.has(cacheKey)) return resolvedNamesCache.get(cacheKey)!;
  try {
    let name = '';
    if (type === 'org') {
      const matched = orgUnitsGlobalCache.find(o => String(o.id) === String(id));
      name = matched ? matched.name : '';
      if (!name) {
        const org = await organizationService.getById(id);
        name = org.name;
      }
    } else if (type === 'Port') {
      const cb = await portCRUD.findById(id);
      name = cb.portName;
    } else if (type === 'Berth') {
      const bc = await berthCRUD.findById(id);
      name = bc.berthName;
    } else if (type === 'User') {
      const response = await userService.getById(id);
      name = response.data?.fullName || response.data?.username || '';
    }
    if (name) {
      resolvedNamesCache.set(cacheKey, name);
      return name;
    }
  } catch (err) {
    console.error(`Failed to resolve name for ID: ${id}`, err);
  }
  return type === 'User' ? '' : id;
};

const getOrderedKeysAndLabels = (type: string): { key: string; label: string }[] => {
  const normType = type.trim();
  
  if (normType === 'Cảng biển') {
    return [
      { key: 'portCode', label: 'Mã cảng biển' },
      { key: 'portName', label: 'Tên cảng biển' },
      { key: 'province', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'area', label: 'Diện tích (ha)' },
      { key: 'khaNangTiepNhan', label: 'Khả năng tiếp nhận (tấn)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }
  
  if (normType === 'Bến cảng') {
    return [
      { key: 'berthCode', label: 'Mã bến cảng' },
      { key: 'berthName', label: 'Tên bến cảng' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'provinceId', label: 'Địa điểm (Tỉnh/Thành phố)' },
      { key: 'detailedLocation', label: 'Địa điểm chi tiết' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'waterway', label: 'Thuộc luồng hàng hải' },
      { key: 'structureType', label: 'Loại kết cấu cầu cảng' },
      { key: 'operationalFunction', label: 'Công năng khai thác' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'operator', label: 'Đơn vị khai thác' },
      { key: 'totalArea', label: 'Tổng diện tích (ha)' },
      { key: 'designThroughput', label: 'Năng lực thông qua thiết kế' },
      { key: 'currentThroughput', label: 'Năng lực thông qua hiện trạng (tấn/năm)' },
      { key: 'maxVesselSize', label: 'Cỡ tàu tiếp nhận lớn nhất theo quy hoạch (DWT)' },
      { key: 'plannedThroughput', label: 'Quy hoạch năng lực thông qua (tấn/năm)' },
      { key: 'latestCargoVolume', label: 'Sản lượng hàng hóa thực tế thông qua trong năm gần nhất' },
      { key: 'openingAnnouncementDate', label: 'Thời điểm công bố mở, đưa vào sử dụng' },
      { key: 'openingDecision', label: 'Quyết định công bố/Văn bản cho phép khai thác' },
      { key: 'investmentAgreement', label: 'Văn bản thỏa thuận đầu tư xây dựng' },
      { key: 'geometryType', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Cầu cảng') {
    return [
      { key: 'pierCode', label: 'Mã cầu cảng' },
      { key: 'pierName', label: 'Tên cầu cảng' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'location', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'diaDiemChiTiet', label: 'Địa điểm chi tiết' },
      { key: 'ngayCapNhat', label: 'Ngày cập nhật' },
      { key: 'canBoCapNhat', label: 'Cán bộ cập nhật' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'navigationChannelId', label: 'Thuộc luồng hàng hải' },
      { key: 'structureType', label: 'Loại kết cấu cầu cảng' },
      { key: 'operationalCapacity', label: 'Công năng khai thác' },
      { key: 'operationalStatus', label: 'Tình trạng' },
      { key: 'approvalStatus', label: 'Trạng thái' },
      { key: 'thoiDiemCongBoMo', label: 'Thời điểm công bố mở, đưa vào sử dụng' },
      { key: 'quyetDinhCongBo', label: 'Quyết định công bố/ Văn bản cho phép khai thác' },
      { key: 'vanBanThoaThuanDauTu', label: 'Văn bản thỏa thuận đầu tư xây dựng' },
      { key: 'berthId', label: 'Thuộc bến cảng' },
      { key: 'phanCap', label: 'Phân cấp công trình' },
      { key: 'length', label: 'Chiều dài (m)' },
      { key: 'width', label: 'Chiều rộng (m)' },
      { key: 'thoiDiemPheDuyetQuyTrinhBaoTriCongTrinh', label: 'Thời điểm phê duyệt quy trình bảo trì công trình' },
      { key: 'thoiDiemDuocChapThuanHoSoBaoCaoDanhGiaAnToanCongTrinh', label: 'Thời điểm được chấp thuận hồ sơ báo cáo đánh giá an toàn công trình (gần nhất)' },
      { key: 'thoiDiemKiemDinhGanNhat', label: 'Thời điểm kiểm định gần nhất' },
      { key: 'quantityCauCangDangKhaiThac', label: 'Số lượng cầu cảng đang khai thác' },
      { key: 'quantityCauCangDaCongBo', label: 'Số lượng cầu cảng đã công bố' },
      { key: 'quantityCauCangDangDuocThoaThuanDauTuXayDung', label: 'Số lượng cầu cảng đang được thỏa thuận đầu tư xây dựng' },
      { key: 'sanLuongHangThongQua', label: 'Sản lượng hàng thông qua' },
      { key: 'tiepNhanTauCoTrongTaiLonHonThongSoTaiQuyetDinhCongBo', label: 'Tiếp nhận tàu có trọng tải lớn hơn thông số tại quyết định công bố' },
      { key: 'soVanBan', label: 'Số văn bản' },
      { key: 'ngayVanBan', label: 'Ngày văn bản' },
      { key: 'phamViKhuNuocNeoBuocTau', label: 'Phạm vi khu nước neo buộc tàu' }
    ];
  }

  if (normType === 'Cảng cạn') {
    return [
      { key: 'dryPortCode', label: 'Mã cảng cạn' },
      { key: 'dryPortName', label: 'Tên cảng cạn' },
      { key: 'viTri', label: 'Vị trí' },
      { key: 'dienTichDat', label: 'Diện tích đất (ha)' },
      { key: 'dienTichNuoc', label: 'Diện tích nước (ha)' },
      { key: 'nangLucThongQua', label: 'Năng lực thông qua' },
      { key: 'congSuatTEU', label: 'Công suất (TEU)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (
    normType === 'Vùng nước' ||
    normType === 'Khu neo đậu' ||
    normType === 'Khu chuyển tải' ||
    normType === 'Khu tránh trú bão' ||
    normType === 'Khu tránh, trú bão' ||
    normType === 'Bến phao'
  ) {
    return [
      { key: 'waterZoneCode', label: 'Mã vùng nước' },
      { key: 'waterZoneName', label: 'Tên vùng nước' },
      { key: 'loaiVungNuoc', label: 'Loại vùng nước' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'chieuDaiVungNuoc', label: 'Chiều dài vùng nước (m)' },
      { key: 'chieuRongVungNuoc', label: 'Chiều rộng vùng nước (m)' },
      { key: 'doSauVungNuoc', label: 'Độ sâu vùng nước (m)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Đèn biển') {
    return [
      { key: 'code', label: 'Mã đèn biển' },
      { key: 'name', label: 'Tên đèn biển' },
      { key: 'type', label: 'Loại đèn biển' },
      { key: 'lightRange', label: 'Tầm hiệu lực (hải lý)' },
      { key: 'lightColor', label: 'Màu sắc ánh sáng' },
      { key: 'lightCharacteristic', label: 'Đặc tính ánh sáng' },
      { key: 'description', label: 'Mô tả vị trí' },
      { key: 'unitId', label: 'Đơn vị quản lý' },
      { key: 'isActive', label: 'Trạng thái hoạt động' },
      { key: 'status', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Phao tiêu') {
    return [
      { key: 'code', label: 'Mã phao tiêu' },
      { key: 'name', label: 'Tên phao tiêu' },
      { key: 'type', label: 'Loại phao tiêu' },
      { key: 'range', label: 'Bán kính hoạt động (hải lý)' },
      { key: 'color', label: 'Màu sắc phao' },
      { key: 'unitId', label: 'Đơn vị quản lý' },
      { key: 'isActive', label: 'Trạng thái hoạt động' },
      { key: 'status', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Đê kè') {
    return [
      { key: 'maDeKe', label: 'Mã đê kè' },
      { key: 'tenDeKe', label: 'Tên đê kè' },
      { key: 'loaiDe', label: 'Loại đê/kè' },
      { key: 'ketCau', label: 'Kết cấu đê/kè' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Luồng hàng hải') {
    return [
      { key: 'maLuong', label: 'Mã luồng hàng hải' },
      { key: 'tenLuong', label: 'Tên luồng hàng hải' },
      { key: 'chieuDaiLuong', label: 'Chiều dài luồng (km)' },
      { key: 'doSauThietKe', label: 'Độ sâu thiết kế (m)' },
      { key: 'chieuRongThietKe', label: 'Chiều rộng thiết kế (m)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Trạm radar') {
    return [
      { key: 'maTram', label: 'Mã trạm' },
      { key: 'tenTram', label: 'Tên trạm radar' },
      { key: 'radarModel', label: 'Model radar' },
      { key: 'frequencyBand', label: 'Băng tần' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Hệ thống VTS') {
    return [
      { key: 'code', label: 'Mã hệ thống' },
      { key: 'systemName', label: 'Tên hệ thống VTS' },
      { key: 'scope', label: 'Phạm vi hoạt động' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'conditionStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'geometryType', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Cơ sở sửa chữa' || normType === 'Cơ sở sửa chữa/đóng tàu') {
    return [
      { key: 'maCoSo', label: 'Mã cơ sở sửa chữa, đóng tàu' },
      { key: 'facilityName', label: 'Tên cơ sở sửa chữa, đóng tàu' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'province', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'address', label: 'Địa điểm chi tiết' },
      { key: 'updatedDate', label: 'Ngày cập nhật' },
      { key: 'updatedBy', label: 'Cán bộ cập nhật' },
      { key: 'remarks', label: 'Ghi chú' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'operationalStatus', label: 'Tình trạng' },
      { key: 'approvalStatus', label: 'Trạng thái' },
      { key: 'cauCangId', label: 'Thuộc cầu cảng' },
      { key: 'congNangSuDung', label: 'Công năng sử dụng' },
      { key: 'dienTichNhaXuongKhoBai', label: 'Diện tích nhà xưởng, kho bãi' },
      { key: 'loaiTauDongMoiSuaChua', label: 'Loại tàu đóng mới, sửa chữa' },
      { key: 'coTau', label: 'Cỡ tàu' },
      { key: 'loaiHinhDoanhNghiep', label: 'Loại hình doanh nghiệp' },
      { key: 'hoatDong', label: 'Hoạt động' },
      { key: 'quantityTrienDa', label: 'Số lượng triền đà' }
    ];
  }

  return [];
};

const fetchAndFormatPopupDetails = async (record: any) => {
  const type = record.kchtTypeLabel || '';
  const id = record.id;
  
  const headerHtml = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 450px; padding: 4px;">
      <div style="max-height: 450px; overflow-y: auto; padding-right: 6px;">
        <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 13px; line-height: 1.5; color: #0c2438;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(11,46,79,0.09);">
              <th style="text-align: left; padding: 10px 8px; font-weight: 600; width: 40%; color: #12468C;">Thông tin</th>
              <th style="text-align: left; padding: 10px 8px; font-weight: 600; width: 60%; color: #12468C;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span>Giá trị</span>
                  <div style="display: inline-flex; gap: 12px; align-items: center;">
                    <button onclick="window.handleKchtAction('${id}', '${type}', 'view')" title="Xem chi tiết" style="border: none; background: none; padding: 2px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; outline: none;">
                      <svg viewBox="0 0 24 24" width="16px" height="16px" fill="none" stroke="#0E6FD6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
  `;
  
  const footerHtml = `
          </tbody>
        </table>
      </div>
    </div>
  `;

  const getStatusText = (status?: string) => {
    if (!status) return '—';
    const s = status.toUpperCase();
    if (s === 'HIEN_HANH' || s === 'ACTIVE' || s === 'OPERATIONAL') return 'Đang khai thác/vận hành';
    if (s === 'TAM_NGUNG' || s === 'INACTIVE' || s === 'STOPPED') return 'Tạm ngừng';
    if (s === 'MAINTENANCE') return 'Đang bảo trì';
    if (s === 'UNDER_CONSTRUCTION') return 'Đang xây dựng';
    return status;
  };

  const getApprovalStatusText = (status?: string) => {
    if (!status) return '—';
    const s = status.toUpperCase();
    if (s === 'DUOC_PHE_DUYET' || s === 'APPROVED') return 'Đã phê duyệt';
    if (s === 'CHO_PHE_DUYET' || s === 'PENDING') return 'Chờ phê duyệt';
    if (s === 'DRAFT') return 'Bản nháp';
    if (s === 'PENDING_APPROVAL') return 'Chờ phê duyệt';
    if (s === 'APPROVED_L1') return 'Đã duyệt L1';
    if (s === 'APPROVED_L2') return 'Đã duyệt L2';
    if (s === 'PUBLISHED') return 'Đã công bố';
    if (s === 'REJECTED') return 'Từ chối';
    if (s === 'DELETED') return 'Đã xóa';
    return status;
  };

  const getBeaconLightTypeText = (val?: string) => {
    if (!val) return '—';
    const v = val.toUpperCase();
    if (v === 'LIGHTHOUSE' || v === '1') return 'Hải đăng';
    if (v === 'BEACON_LIGHT' || v === '2') return 'Đèn báo';
    if (v === 'BEACON_MARK' || v === '3') return 'Cọc tiêu';
    return val;
  };

  const getBuoyTypeText = (val?: string) => {
    if (!val) return '—';
    const v = val.toUpperCase();
    if (v === 'CARDINAL') return 'Phao hướng (Cardinal)';
    if (v === 'SECTOR') return 'Phao phân khu (Sector)';
    if (v === 'SPECIAL') return 'Phao đặc biệt (Special)';
    if (v === 'SAFE_WATER') return 'Phao vùng nước an toàn (Safe water)';
    if (v === 'ISOLATED_DANGER') return 'Phao nguy hiểm cô lập (Isolated danger)';
    return val;
  };

  const getLoaiVungNuocText = (val?: string) => val || '—';

  const getGeometryTypeText = (val?: string) => {
    if (!val) return '—';
    const v = val.toUpperCase();
    if (v === 'POINT') return 'Điểm';
    if (v === 'LINE' || v === 'LINESTRING' || v === 'POLYLINE') return 'Đường';
    if (v === 'POLYGON' || v === 'MULTIPOLYGON' || v === 'AREA') return 'Vùng';
    return val;
  };

  const formatVal = (val: any) => {
    if (val === undefined || val === null || val === '') return '—';
    return String(val);
  };

  const tdLabelStyle = 'padding: 8px; border: 1px solid rgba(11,46,79,0.09); font-weight: 500; background: #f8fafc; color: #566a7c; font-size: 13px; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;';
  const tdValStyle = 'padding: 8px; border: 1px solid rgba(11,46,79,0.09); color: #0c2438; font-size: 13px; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;';

  const KEY_LABELS: Record<string, string> = {
    // Common
    id: 'ID',
    code: 'Mã',
    code: 'Mã',
    name: 'Tên',
    name: 'Tên',
    orgName: 'Đơn vị quản lý',
    orgUnitName: 'Đơn vị quản lý',
    owningOrgName: 'Đơn vị chủ sở hữu',
    operatingOrgName: 'Đơn vị vận hành',
    kchtTypeLabel: 'Loại KCHT',
    securityLevel: 'Mức độ bảo mật',
    recordSecurityLevel: 'Mức độ bảo mật',
    location: 'Địa điểm',
    diaChiChiTiet: 'Địa chỉ chi tiết',
    diaDiemChiTiet: 'Địa điểm chi tiết',
    latitude: 'Vĩ độ',
    longitude: 'Kinh độ',
    latitude: 'Vĩ độ',
    longitude: 'Kinh độ',
    createdAt: 'Ngày tạo',
    createdDate: 'Ngày tạo',
    updatedAt: 'Ngày cập nhật',
    updatedDate: 'Ngày cập nhật',
    createdBy: 'Người tạo',
    updatedBy: 'Người cập nhật',
    submittedForApprovalAt: 'Ngày gửi phê duyệt',
    submittedForApprovalBy: 'Người gửi phê duyệt',
    submittedDate: 'Ngày gửi phê duyệt',
    submittedByName: 'Người gửi phê duyệt',
    portAuthorityApprovedAt: 'Ngày duyệt cấp Cảng vụ/Chi cục',
    portAuthorityApprovedBy: 'Người duyệt cấp Cảng vụ/Chi cục',
    departmentApprovedAt: 'Ngày duyệt cấp Cục',
    departmentApprovedBy: 'Người duyệt cấp Cục',
    approverLevel1: 'Người duyệt cấp 1',
    approvedDateLevel1: 'Ngày duyệt cấp 1',
    approvalContentLevel1: 'Nội dung duyệt cấp 1',
    approverLevel2: 'Người duyệt cấp 2',
    approvedDateLevel2: 'Ngày duyệt cấp 2',
    approvalContentLevel2: 'Nội dung duyệt cấp 2',
    ngayCapNhat: 'Ngày cập nhật',
    canBoCapNhat: 'Cán bộ cập nhật',
    operationalStatus: 'Trạng thái hoạt động',
    conditionStatus: 'Trạng thái hoạt động',
    activityStatus: 'Trạng thái xử lý',
    approvalStatus: 'Trạng thái phê duyệt',
    province: 'Tỉnh / Thành phố',
    provinceId: 'Tỉnh / Thành phố',
    tinhThanh: 'Tỉnh / Thành phố',
    orgUnitId: 'Đơn vị quản lý',
    orgUnitId: 'Đơn vị quản lý',
    unitId: 'Đơn vị quản lý',
    donViQuanLy: 'Đơn vị quản lý',
    portId: 'Thuộc cảng biển',
    portName: 'Thuộc cảng biển',
    tenCangBien: 'Thuộc cảng biển',
    berthId: 'Thuộc bến cảng',
    tenBenCang: 'Thuộc bến cảng',
    loaiHinhHoc: 'Loại hình học',
    geomType: 'Loại hình học',

    // Cầu cảng
    pierCode: 'Mã cầu cảng',
    pierName: 'Tên cầu cảng',
    loaiCau: 'Loại cầu cảng',
    operationalCapacity: 'Công năng khai thác',
    tenBenCang: 'Thuộc bến cảng',
    length: 'Chiều dài (m)',

    // Cảng biển
    portCode: 'Mã cảng biển',
    portName: 'Tên cảng biển',
    portGroup: 'Nhóm cảng biển',
    area: 'Diện tích (ha)',
    khaNangTiepNhan: 'Khả năng tiếp nhận (tấn)',

    // Bến cảng
    berthCode: 'Mã bến cảng',
    berthName: 'Tên bến cảng',
    detailedLocation: 'Địa điểm chi tiết',
    waterway: 'Luồng hàng hải',
    operationalFunction: 'Công năng khai thác',
    channelDepth: 'Độ sâu luồng (m)',
    coordinateSystem: 'Hệ tọa độ',
    displayRule: 'Quy tắc hiển thị',
    structureType: 'Loại kết cấu cầu cảng',
    operator: 'Đơn vị khai thác',
    totalArea: 'Tổng diện tích (ha)',
    designThroughput: 'Năng lực thông qua thiết kế',
    currentThroughput: 'Năng lực thông qua hiện trạng (tấn/năm)',
    maxVesselSize: 'Cỡ tàu tiếp nhận lớn nhất (DWT)',
    plannedThroughput: 'Quy hoạch năng lực thông qua (tấn/năm)',
    latestCargoVolume: 'Sản lượng hàng hóa năm gần nhất',
    openingAnnouncementDate: 'Thời điểm công bố mở',
    openingDecision: 'Quyết định công bố',
    investmentAgreement: 'Văn bản thỏa thuận đầu tư',
    geometryType: 'Loại hình học',
    portAuthorityApprovalContent: 'Nội dung duyệt cấp Cảng vụ/Chi cục',
    departmentApprovalContent: 'Nội dung duyệt cấp Cục',
    rejectionReason: 'Lý do từ chối',
    tuyenDuongThuy: 'Tuyến đường thủy',
    width: 'Chiều rộng (m)',
    berthType: 'Loại bến',
    doSauLuong: 'Độ sâu luồng (m)',
    donViKhaiThac: 'Đơn vị khai thác',
    tongDienTich: 'Tổng diện tích (ha)',
    nangLucThongQuaThietKe: 'Năng lực thông qua thiết kế',
    nangLucThongQuaHienTrang: 'Năng lực thông qua hiện trạng (tấn/ năm)',
    coTauTiepNhanLonNhat: 'Cỡ tàu tiếp nhận lớn nhất theo quy hoạch (DWT)',
    quyHoachNangLucThongQua: 'Quy hoạch năng lực thông qua (tấn/ năm)',
    sanLuongHangHoaNamGanNhat: 'Sản lượng hàng hóa thực tế thông qua trong năm gần nhất',
    thoiDiemCongBoMo: 'Thời điểm công bố mở, đưa vào sử dụng',
    quyetDinhCongBo: 'Quyết định công bố/ Văn bản cho phép khai thác',
    vanBanThoaThuanDauTu: 'Văn bản thỏa thuận đầu tư xây dựng',
    structureType: 'Loại kết cấu cầu cảng',
    province: 'Địa điểm (Tỉnh/ Thành phố)',
    diaDiemChiTiet: 'Địa điểm chi tiết',
    navigationChannelId: 'Thuộc luồng hàng hải',

    // Cảng cạn
    dryPortCode: 'Mã cảng cạn',
    dryPortName: 'Tên cảng cạn',
    congSuatTEU: 'Công suất (TEU)',

    // Vùng nước
    waterZoneCode: 'Mã vùng nước',
    waterZoneName: 'Tên vùng nước',
    doSauMax: 'Độ sâu lớn nhất (m)',
    doSauTrungBinh: 'Độ sâu trung bình (m)',
    loaiVungNuoc: 'Loại vùng nước',

    // Đèn biển
    beaconCode: 'Mã đèn biển',
    beaconName: 'Tên đèn biển',
    beaconType: 'Loại đèn biển',
    positionDescription: 'Mô tả vị trí',
    height: 'Chiều cao (m)',
    rangeOfVisibility: 'Tầm hiệu lực (hải lý)',
    lightCharacteristic: 'Đặc tính ánh sáng',
    color: 'Màu sắc',
    frequency: 'Tần số',

    // Phao tiêu
    buoyCode: 'Mã phao tiêu',
    buoyName: 'Tên phao tiêu',
    buoyType: 'Loại phao tiêu',
    shape: 'Hình dạng',

    // Đê kè
    maDeKe: 'Mã đê kè',
    tenDeKe: 'Tên đê kè',
    loaiDe: 'Loại đê/kè',
    ketCau: 'Kết cấu',

    // Luồng hàng hải
    maLuong: 'Mã luồng hàng hải',
    tenLuong: 'Tên luồng hàng hải',
    chieuDaiLuong: 'Chiều dài luồng (km)',
    doSauThietKe: 'Độ sâu thiết kế (m)',
    chieuRongThietKe: 'Chiều rộng thiết kế (m)',

    // Trạm Radar
    maTram: 'Mã trạm',
    tenTram: 'Tên trạm radar',
    radarModel: 'Model radar',
    frequencyBand: 'Băng tần',

    // Hệ thống VTS
    maHeThong: 'Mã hệ thống',
    systemName: 'Tên hệ thống VTS',
    vtsCenter: 'Trung tâm VTS',

    // Cơ sở đóng sửa tàu
    maCoSo: 'Mã cơ sở',
    facilityName: 'Tên cơ sở đóng/sửa tàu',
    nangLucNang: 'Năng lực nâng (tấn)',
    kichThuocDoc: 'Kích thước đốc (m)',

    // Missing stats / GIS fields
    loaiHinhHoc: 'Loại hình học',
    diaDiemChiTiet: 'Địa điểm chi tiết',
    phanCap: 'Phân cấp',
    phamViVungNuoc: 'Phạm vi vùng nước',
    tongSoBenCang: 'Tổng số bến cảng',
    tongSoKhuNeoDauChuyenTai: 'Tổng số khu neo đậu chuyển tải',
    tongSoTuyenLuongCongCong: 'Tổng số tuyến luồng công cộng',
    tongSoTuyenLuongChuyenDung: 'Tổng số tuyến luồng chuyên dùng',
    tongChieuDaiLuongCongCong: 'Tổng chiều dài luồng công cộng',
    tongChieuDaiLuongChuyenDung: 'Tổng chiều dài luồng chuyên dùng',
    tongSoPhaoTieuBaoHieu: 'Tổng số phao tiêu báo hiệu',
    tongSoDeKe: 'Tổng số đê kè',
    tongChieuDaiDeKe: 'Tổng chiều dài đê kè',
    tongSoDenBienDangTieu: 'Tổng số đèn biển đăng tiêu',
    quantityBenPhao: 'Số lượng bến phao',
    quantityKhuNeoDau: 'Số lượng khu neo đậu',
    quantityKhuChuyenTai: 'Số lượng khu chuyển tải',
    cacKhuNuocKhac: 'Các khu nước khác',
    remarks: 'Ghi chú',
  };

  const USER_REFERENCE_FIELDS = new Set([
    'createdBy',
    'updatedBy',
    'submittedForApprovalBy',
    'portAuthorityApprovedBy',
    'departmentApprovedBy',
    'approverLevel1',
    'approverLevel2',
  ]);
  const USER_NAME_FIELD_BY_REFERENCE: Record<string, string> = {
    createdBy: 'createdByName',
    updatedBy: 'updatedByName',
    submittedForApprovalBy: 'submittedByName',
    portAuthorityApprovedBy: 'approverLevel1Name',
    departmentApprovedBy: 'approverLevel2Name',
    approverLevel1: 'approverLevel1Name',
    approverLevel2: 'approverLevel2Name',
  };
  const DATE_TIME_FIELDS = new Set([
    'createdAt',
    'createdDate',
    'updatedAt',
    'updatedDate',
    'submittedForApprovalAt',
    'submittedDate',
    'portAuthorityApprovedAt',
    'departmentApprovedAt',
    'approvedDateLevel1',
    'approvedDateLevel2',
    'openingAnnouncementDate',
  ]);
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  try {
    let rowsHtml = '';
    let data: any = null;
    let displayType = type;

    if (type === 'Cầu cảng') {
      data = await pierCRUD.findById(id);
    } else if (type === 'Cảng biển') {
      data = await portCRUD.findById(id);
    } else if (type === 'Bến cảng') {
      data = await berthCRUD.findById(id);
    } else if (type === 'Cảng cạn') {
      data = await dryPortCRUD.findById(id);
    } else if (
      type === 'Vùng nước' ||
      type === 'Khu neo đậu' ||
      type === 'Khu chuyển tải' ||
      type === 'Khu tránh trú bão' ||
      type === 'Khu tránh, trú bão' ||
      type === 'Bến phao'
    ) {
      data = await waterZoneCRUD.findById(id);
    } else if (type === 'Đèn biển') {
      data = await beaconStationCRUD.findById(id);
    } else if (type === 'Phao tiêu' || type === 'Phao, tiêu') {
      data = await buoyCRUD.findById(id);
      displayType = 'Phao tiêu';
    } else if (type === 'Nhà trạm phao tiêu') {
      data = await fetchBuoyStationById(id);
      displayType = 'Phao tiêu';
    } else if (type === 'Đê kè') {
      data = await dikeRevetmentCRUD.getById(id);
    } else if (type === 'Luồng hàng hải') {
      data = await navigationChannelCRUD.getById(id);
    } else if (type === 'Trạm radar') {
      data = await radarStationCRUD.getById(id);
    } else if (type === 'Hệ thống VTS') {
      data = await vtsSystemCRUD.getById(id);
    } else if (type === 'Cơ sở sửa chữa' || type === 'Cơ sở sửa chữa/đóng tàu') {
      data = await shipRepairFacilityCRUD.getById(id);
    } else if (
      type === 'Đài TTDH' ||
      type.toLowerCase().includes('duyên hải') ||
      type.toLowerCase().includes('coastal')
    ) {
      const res = await api.get(`/v1/stations/coastal/${id}`);
      data = res.data;
    } else if (type.toLowerCase().includes('inmarsat') || type.toLowerCase().includes('vệ tinh')) {
      const res = await api.get(`/v1/stations/inmarsat/${id}`);
      data = res.data;
    } else if (type.toLowerCase().includes('cospas')) {
      const res = await api.get(`/v1/stations/cospas-sarsat/${id}`);
      data = res.data;
    } else if (type.toLowerCase().includes('lrit') || type.toLowerCase().includes('nhận dạng')) {
      const res = await api.get(`/v1/stations/lrit/${id}`);
      data = res.data;
    } else if (type.toLowerCase().includes('hà nội') || type.toLowerCase().includes('hải phòng') || type.toLowerCase().includes('haiphong') || type.toLowerCase().includes('duyên hải')) {
      const res = await api.get(`/v1/stations/haiphong/${id}`);
      data = res.data;
    }

    if (data) {
      (window as any).kchtDetailCache = (window as any).kchtDetailCache || {};
      (window as any).kchtDetailCache[id] = data;
      console.log('[ParentCache] Stored details for ID:', id, 'Data:', data);

      if (!data.maCoSo && record.code) {
        data.maCoSo = record.code;
      }

      const customOrdered = getOrderedKeysAndLabels(displayType);
      const renderedKeys = new Set<string>();

      // Lazy-resolve only the specific parent IDs present in data
      let orgUnitNameResolved = '';
      let cangBienNameResolved = '';
      let benCangNameResolved = '';
      
      const orgId = data.orgUnitId || data.orgUnitId || data.unitId || data.donViQuanLy || data.unitId;
      if (orgId) {
        orgUnitNameResolved = data.donViQuanLy || data.orgName || data.orgUnitName || '';
      }
      if (data.portId || data.tenCangBien) {
        cangBienNameResolved = data.tenCangBien || (data.portId ? await resolveName(data.portId, 'Port') : '');
      }
      if (data.berthId || data.tenBenCang) {
        benCangNameResolved = data.tenBenCang || (data.berthId ? await resolveName(data.berthId, 'Berth') : '');
      }

      const userNamesResolved: Record<string, string> = {};
      await Promise.all(Array.from(USER_REFERENCE_FIELDS).map(async field => {
        const rawValue = data[field];
        if (rawValue === undefined || rawValue === null || rawValue === '') return;
        const pairedName = data[USER_NAME_FIELD_BY_REFERENCE[field]];
        if (pairedName) {
          userNamesResolved[field] = String(pairedName);
          return;
        }
        const rawText = String(rawValue);
        if (!UUID_PATTERN.test(rawText)) {
          userNamesResolved[field] = rawText;
          return;
        }
        userNamesResolved[field] = await resolveName(rawText, 'User') || 'Không xác định';
      }));

      const formatDetailFieldValue = (field: string, value: any) => {
        if (USER_REFERENCE_FIELDS.has(field)) {
          return userNamesResolved[field] || 'Không xác định';
        }
        if (field === 'provinceId') {
          return getProvinceNameById(Number(value)) || value;
        }
        if (DATE_TIME_FIELDS.has(field)) {
          return formatDateTime(value);
        }
        if (field === 'operationalStatus' || field === 'conditionStatus' || field === 'tinhTrang' || field === 'isActive') {
          return getStatusText(field === 'isActive' ? (value ? 'ACTIVE' : 'INACTIVE') : value);
        }
        if (field === 'approvalStatus' || field === 'trangThai' || field === 'status') {
          return getApprovalStatusText(value);
        }
        if (field === 'geometryType' || field === 'loaiHinhHoc' || field === 'geomType') {
          return getGeometryTypeText(value);
        }
        return value;
      };

      if (customOrdered.length > 0) {
        customOrdered.forEach(({ key: k, label }) => {
          const valExists = data[k] !== undefined && data[k] !== null && data[k] !== '';
          let val = valExists ? data[k] : '';
          
          if (['orgUnitId', 'orgUnitId', 'unitId', 'donViQuanLy', 'unitId', 'unitName'].includes(k)) {
            val = orgUnitNameResolved || val;
          } else if (k === 'portId') {
            val = cangBienNameResolved || val;
          } else if (k === 'berthId') {
            val = benCangNameResolved || val;
          }
          
          if (valExists) {
            if (k === 'type') {
              if (displayType === 'Đèn biển') {
                val = getBeaconLightTypeText(val);
              } else if (displayType === 'Phao tiêu') {
                val = getBuoyTypeText(val);
              }
            }
            if (k === 'loaiVungNuoc') val = getLoaiVungNuocText(val);
            if (k === 'berthType') val = getLoaiBenText(val);
            if (k === 'loaiCau') val = getLoaiCauText(val);
            if (k === 'thoiDiemCongBoMo') val = formatDate(val);
            if (k === 'ngaySuaDoi' || k === 'updatedDate') val = formatDateTime(val);
            val = formatDetailFieldValue(k, val);
          }
          
          rowsHtml += `<tr><td style="${tdLabelStyle}">${label}:</td><td style="${tdValStyle}">${formatVal(val)}</td></tr>`;
          renderedKeys.add(k);
        });
      } else {
        const orderedKeys = [
          'code', 'portCode', 'berthCode', 'pierCode', 'waterZoneCode', 'maDeKe', 'maLuong', 'maTram', 'maHeThong', 'maCoSo', 'code', 'beaconCode', 'buoyCode',
          'name', 'name', 'portName', 'berthName', 'pierName', 'waterZoneName', 'tenDeKe', 'tenLuong', 'tenTram', 'systemName', 'facilityName', 'beaconName', 'buoyName',
          'orgName', 'orgUnitName', 'donViQuanLy', 'orgUnitId', 'orgUnitId', 'unitId',
          'portId', 'tenCangBien', 'berthId', 'tenBenCang',
          'province', 'location', 'diaChiChiTiet', 'diaDiemChiTiet',
          'operationalStatus', 'status', 'tinhTrang',
          'approvalStatus',
          'loaiHinhHoc', 'geomType',
        ];
        
        orderedKeys.forEach(k => {
          const valExists = data[k] !== undefined && data[k] !== null && data[k] !== '';
          if (valExists) {
            const label = KEY_LABELS[k] || k;
            let val = data[k];
            
            if (['orgUnitId', 'orgUnitId', 'unitId', 'donViQuanLy'].includes(k)) {
              val = orgUnitNameResolved || val;
            } else if (k === 'portId') {
              val = cangBienNameResolved || val;
            } else if (k === 'berthId') {
              val = benCangNameResolved || val;
            }
            
            if (k === 'loaiVungNuoc') val = getLoaiVungNuocText(val);
            if (k === 'berthType') val = getLoaiBenText(val);
            if (k === 'loaiCau') val = getLoaiCauText(val);
            if (k === 'thoiDiemCongBoMo') val = formatDate(val);
            val = formatDetailFieldValue(k, val);
            
            rowsHtml += `<tr><td style="${tdLabelStyle}">${label}:</td><td style="${tdValStyle}">${formatVal(val)}</td></tr>`;
            renderedKeys.add(k);
          }
        });
      }

      Object.entries(data).forEach(([k, val]) => {
        if (renderedKeys.has(k)) return;
        
        const lowerK = k.toLowerCase();
        if (
          lowerK === 'id' || lowerK === 'uuid' || lowerK === 'geom' || lowerK === 'geometry' ||
          lowerK === 'toado' || lowerK === 'coordinates' ||
          lowerK === 'attachments' || lowerK === 'zones' ||
          lowerK === 'bieutuongid' || lowerK === 'iconid' ||
          lowerK === 'symbolid' || lowerK === 'khonggianid' || lowerK === 'spatialid' || lowerK === 'deletedat' ||
          lowerK === 'tencangbien' || lowerK === 'tenbencang' || lowerK === 'portname' || lowerK === 'orgname' ||
          lowerK === 'orgunitname' || lowerK === 'parentorgname' || lowerK === 'donviid' ||
          lowerK === 'unitid' || lowerK === 'orgunitid' || lowerK === 'portid' ||
          lowerK === 'berthid' || lowerK === 'waterwayid' || lowerK === 'owningorgid' ||
          lowerK === 'operatingorgid' || lowerK === 'donviquanly' || lowerK === 'updatedat' ||
          lowerK === 'updatedby' || lowerK === 'updatedbyname' || lowerK === 'createdbyname' ||
          lowerK === 'approverlevel1name' || lowerK === 'approverlevel2name' ||
          lowerK === 'canbocapnhat' || lowerK === 'ngaycapnhat'
        ) {
          return;
        }

        if (val !== undefined && val !== null && val !== '') {
          const label = KEY_LABELS[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          let displayVal = val;
          if (['orgUnitId', 'orgUnitId', 'unitId', 'donViQuanLy'].includes(k)) {
            displayVal = orgUnitNameResolved || val;
          } else if (k === 'portId') {
            displayVal = cangBienNameResolved || val;
          } else if (k === 'berthId') {
            displayVal = benCangNameResolved || val;
          }
          if (k === 'type') {
            if (displayType === 'Đèn biển') {
              displayVal = getBeaconLightTypeText(val);
            } else if (displayType === 'Phao tiêu') {
              displayVal = getBuoyTypeText(val);
            }
          }
          if (k === 'loaiVungNuoc') displayVal = getLoaiVungNuocText(val);
          if (k === 'berthType') displayVal = getLoaiBenText(val);
          if (k === 'loaiCau') displayVal = getLoaiCauText(val);
          displayVal = formatDetailFieldValue(k, displayVal);

          rowsHtml += `<tr><td style="${tdLabelStyle}">${label}:</td><td style="${tdValStyle}">${formatVal(displayVal)}</td></tr>`;
        }
      });

      if (data.updatedAt || data.ngayCapNhat) {
        const updateDate = data.updatedAt || data.ngayCapNhat;
        if (!renderedKeys.has('updatedDate') && !renderedKeys.has('ngaySuaDoi') && !renderedKeys.has('ngayCapNhat') && !renderedKeys.has('updatedAt')) {
          rowsHtml += `<tr><td style="${tdLabelStyle}">Ngày cập nhật:</td><td style="${tdValStyle}">${formatDateTime(updateDate)}</td></tr>`;
        }
      }
      if (data.updatedBy || data.canBoCapNhat) {
        const updater = data.updatedBy || data.canBoCapNhat;
        const updaterName = data.updatedByName || userNamesResolved.updatedBy ||
          (UUID_PATTERN.test(String(updater)) ? 'Không xác định' : updater);
        if (!renderedKeys.has('nguoiSuaDoi') && !renderedKeys.has('canBoCapNhat') && !renderedKeys.has('updatedBy')) {
          rowsHtml += `<tr><td style="${tdLabelStyle}">Cán bộ cập nhật:</td><td style="${tdValStyle}">${formatVal(updaterName)}</td></tr>`;
        }
      }
    } else {
      // Fallback
      rowsHtml += `
        <tr><td style="${tdLabelStyle}">Tên kết cấu:</td><td style="${tdValStyle}">${formatVal(record.name)}</td></tr>
        <tr><td style="${tdLabelStyle}">Mã kết cấu:</td><td style="${tdValStyle}">${formatVal(record.code)}</td></tr>
        <tr><td style="${tdLabelStyle}">Loại KCHT:</td><td style="${tdValStyle}">${formatVal(record.kchtTypeLabel)}</td></tr>
        <tr><td style="${tdLabelStyle}">Đơn vị quản lý:</td><td style="${tdValStyle}">${formatVal(record.orgName)}</td></tr>
        <tr><td style="${tdLabelStyle}">Địa điểm:</td><td style="${tdValStyle}">${formatVal(record.location)}</td></tr>
      `;
    }
    return headerHtml + rowsHtml + footerHtml;
  } catch (err) {
    console.error('Failed to build detailed popup:', err);
    return `
      <div style="font-family: sans-serif; padding: 4px; min-width: 180px;">
        <h4 style="margin: 0 0 6px 0; color: #ff4d4f; font-size: 14px;">Lỗi tải chi tiết</h4>
        <p style="margin: 0; font-size: 12px;">Không thể tải dữ liệu chi tiết của kết cấu hạ tầng này.</p>
      </div>
    `;
  }
};


function getFeatureNameVi(featureCode: string, originalName?: string): string {
  if (originalName && originalName !== featureCode && !originalName.startsWith('UNKNOWN_')) {
    return originalName;
  }
  const cleanCode = featureCode.toUpperCase();
  return FEATURE_NAMES_VI[cleanCode] || featureCode;
}

const parseWktToLatLngs = (wkt: string, _geomType: string): [number, number][] =>
  resolveMapGeometryLocation(wkt)?.coordinates.map(([lng, lat]) => [lat, lng]) || [];

const isVietnamMapCoordinate = ([lng, lat]: [number, number]) =>
  lat >= 5 && lat <= 26 && lng >= 95 && lng <= 120;

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
  const screens = Grid.useBreakpoint();
  const searchPanelWidth = screens.md ? 560 : '100%';
  const navigate = useNavigate();
  const [activeModalUrl, setActiveModalUrl] = useState<string | null>(null);

  const activePopupRef = useRef<any>(null);
  const activePopupRecordRef = useRef<any>(null);

  const refreshActivePopup = useCallback(() => {
    const popup = activePopupRef.current;
    const record = activePopupRecordRef.current;
    if (popup && record && mapRef.current && mapRef.current.hasLayer(popup)) {
      fetchAndFormatPopupDetails(record).then((detailsHtml) => {
        popup.setContent(detailsHtml);
      }).catch((err) => console.error('Failed to refresh popup:', err));
    }
  }, []);

  const handleIframeLoad = useCallback((e: any) => {
    try {
      const iframe = e.target;
      if (!iframe || !iframe.contentWindow) return;
      const pathname = iframe.contentWindow.location.pathname;
      const search = iframe.contentWindow.location.search || '';

      // If the iframe URL has action or mode query params, it's a detail/edit view — do NOT close
      if (search.includes('action=') || search.includes('mode=')) {
        return;
      }

      // Also skip closing if the pathname includes an ID segment (e.g. /beacon-stations/123)
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length >= 2) {
        return;
      }

      const isListPage = [
        '/radar-station',
        '/dike-revetment',
        '/navigation-channel',
        '/vts-system',
        '/ship-repair-facility',
        '/beacon-stations',
        '/buoys',
        '/port',
        '/berth',
        '/pier',
        '/dry-port',
        '/water-zone'
      ].includes(pathname);

      if (isListPage) {
        setActiveModalUrl(null);
        refreshActivePopup();
        if (fetchFeaturesInViewportRef.current) {
          fetchFeaturesInViewportRef.current();
        }
        if (fetchCustomGisFeaturesRef.current) {
          fetchCustomGisFeaturesRef.current();
        }
      }
    } catch (err) {
      // Cross-origin iframe — ignore
    }
  }, []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CLOSE_KCHT_MODAL') {
        setActiveModalUrl(null);
        refreshActivePopup();
        if (fetchFeaturesInViewportRef.current) {
          fetchFeaturesInViewportRef.current();
        }
        if (fetchCustomGisFeaturesRef.current) {
          fetchCustomGisFeaturesRef.current();
        }
      }
    };
    window.addEventListener('message', handleMessage);

    (window as any).handleKchtAction = (id: string, typeLabel: string, action: 'view' | 'edit') => {
      const label = (typeLabel || '').trim().toLowerCase();
      let path = '';
      if (label === 'nhà trạm phao tiêu' || label === 'nha tram phao tieu') {
        path = `/buoy-station?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('đèn biển') || label.includes('den bien')) {
        path = `/beacons/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('phao tiêu') || label.includes('phao tieu') || label.includes('phao, tiêu')) {
        path = `/buoys/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('cảng biển') || label.includes('cang bien')) {
        path = `/port?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('bến cảng') || label.includes('ben cang')) {
        path = `/berth?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('cầu cảng') || label.includes('cau cang')) {
        path = `/pier?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('cảng cạn') || label.includes('cang can')) {
        path = `/dry-port?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (
        label.includes('vùng nước') || label.includes('vung nuoc') ||
        label.includes('khu neo đậu') || label.includes('khu neo dau') ||
        label.includes('khu chuyển tải') || label.includes('khu chuyen tai') ||
        label.includes('tránh, trú bão') || label.includes('tránh trú bão') || label.includes('tranh tru bao') ||
        label.includes('bến phao') || label.includes('ben phao')
      ) {
        path = `/water-zone?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('luồng hàng hải') || label.includes('luong hang hai')) {
        path = `/navigation-channel/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('đê') || label.includes('kè') || label.includes('de') || label.includes('ke')) {
        path = `/dike-revetment/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('cơ sở sửa chữa') || label.includes('co so sua chua')) {
        path = `/ship-repair-facility/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('radar')) {
        path = `/radar-station/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('hệ thống vts') || label.includes('he thong vts')) {
        path = `/vts-system/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('inmarsat') || label.includes('cospas') || label.includes('lrit') || label.includes('vệ tinh') || label.includes('trung tâm xử lý') || label.includes('hà nội')) {
        path = `/station/special?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('đài ttdh') || label.includes('dai ttdh') || label.includes('đài duyên hải') || label.includes('dai duyen hai')) {
        path = `/station/coastal?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      }

      if (path) {
        setActiveModalUrl(path);
      } else {
        toast.error('Không tìm thấy đường dẫn hợp lệ cho loại KCHT này');
      }
    };

    return () => {
      window.removeEventListener('message', handleMessage);
      delete (window as any).handleKchtAction;
    };
  }, []);

  const [loading, setLoading] = useState(false);
  const [cells, setCells] = useState<ChartCell[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<string | undefined>();
  const [palette, setPalette] = useState<string>('DAY');
  const [features, setFeatures] = useState<ChartFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<ChartFeature | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({});
  const [showChart, setShowChart] = useState(false);
  const [activeBaseMap, setActiveBaseMap] = useState<(typeof BASE_MAP_OPTIONS)[number]['value']>('google-m');

  const uniqueFeatureCodes = useMemo(() => {
    return ENC_LAYER_DETAILS.map((detail) => detail.code);
  }, []);

  // Initialize visibleLayers when uniqueFeatureCodes is loaded/updated
  useEffect(() => {
    setVisibleLayers(prev => {
      const next = { ...prev };
      let changed = false;
      uniqueFeatureCodes.forEach(code => {
        if (next[code] === undefined) {
          next[code] = false;
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

  const [searchParams] = useSearchParams();
  const urlProvince = searchParams.get('province') || '';
  const urlKchtType = searchParams.get('kchtType')
    ? searchParams.get('kchtType')!.split(',').map((type) => LEGACY_KCHT_TYPE_MAP[type] || type)
    : [];
  const urlSearch = searchParams.get('search') || '';

  // Infrastructure Search States
  const [searchForm] = Form.useForm();
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const searchVal = Form.useWatch('search', searchForm) || '';
  const [orgUnits, setOrgUnits] = useState<Organization[]>([]);
  const [searchingInfrastructure, setSearchingInfrastructure] = useState(false);
  const [infrastructureResults, setInfrastructureResults] = useState<KchtGisSearchResult[]>([]);
  const [totalSearchElements, setTotalSearchElements] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string>();
  const [searchPage, setSearchPage] = useState(1);
  const [searchPageSize, setSearchPageSize] = useState(20);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchPanelVisible, setSearchPanelVisible] = useState(true);
  const compactPanelHandledRef = useRef(false);
  const [tableHeight, setTableHeight] = useState(350);
  const [showPlanning, setShowPlanning] = useState(DEFAULT_SHOW_PLANNING);
  const [planningFeatures, setPlanningFeatures] = useState<any[]>([]);
  const selectedInfrastructureResults = useMemo(
    () => infrastructureResults.filter((record) => selectedRowKeys.includes(record.id)),
    [infrastructureResults, selectedRowKeys],
  );

  useEffect(() => {
    if (screens.md === false && !compactPanelHandledRef.current) {
      compactPanelHandledRef.current = true;
      const hasSearchUrlParams = !!urlProvince || urlKchtType.length > 0 || !!urlSearch;
      if (!hasSearchUrlParams) {
        setSearchPanelVisible(false);
      }
    }
  }, [screens.md, urlProvince, urlKchtType.length, urlSearch]);

  const infrastructureColumns = useMemo<DataTableColumn[]>(() => [
    {
      key: 'index', label: 'STT', width: 52, align: 'center',
      render: (_value, _record, index = 0) => (searchPage - 1) * searchPageSize + index + 1,
    },
    { key: 'orgName', dataIndex: 'orgName', label: 'Đơn vị quản lý', width: 170 },
    { key: 'kchtTypeLabel', dataIndex: 'kchtTypeLabel', label: 'Loại KCHT', width: 170 },
    {
      key: 'province', label: 'Tỉnh/Thành phố', width: 140,
      render: (_value, record: KchtGisSearchResult) =>
        getProvinceNameById(record.provinceId) || record.location || '—',
    },
    { key: 'diaChiChiTiet', dataIndex: 'diaChiChiTiet', label: 'Địa điểm chi tiết', width: 180 },
    { key: 'name', dataIndex: 'name', label: 'Kết cấu hạ tầng', width: 200 },
  ], [searchPage, searchPageSize]);

  // Drawing state
  const [drawnGeometry, setDrawnGeometry] = useState<{
    type: string;
    wkt: string;
    coordinates: Array<{ lat: number; lng: number }>;
  } | null>(null);

  // Save modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [pendingDrawResult, setPendingDrawResult] = useState<DrawResult | null>(null);
  const [editingCustomGisRecord, setEditingCustomGisRecord] = useState<any | null>(null);

  // Measure actual available height for table body using ResizeObserver on the wrapper div
  useEffect(() => {
    const el = tableWrapperRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Keep the table body inside the card. Pagination is a sibling of the
        // table shell, so reserve its measured height as well as the header and
        // horizontal scrollbar; otherwise the bottom controls are pushed below
        // the visible map panel when the empty state is tall.
        const paginationHeight = el.querySelector<HTMLElement>('[data-gis-pagination]')
          ?.getBoundingClientRect().height ?? 0;
        const available = entry.contentRect.height - paginationHeight - 55;
        setTableHeight(Math.max(100, Math.floor(available)));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [searchPanelVisible]);

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000 });
      setSymbols(res.data || []);
    } catch (err) {
      console.error('Failed to load symbols in map', err);
    }
  }, []);

  const handleSearchInfrastructure = useCallback(async (targetPage = 1, targetPageSize = searchPageSize) => {
    setSearchingInfrastructure(true);
    setSelectedRowKeys([]);
    setSearchError(undefined);
    setHasSearched(true);
    hasSearchedRef.current = true;
    try {
      const values = searchForm.getFieldsValue();
      const selectedOrgId = values?.orgUnitId;
      const orgUnitId = !selectedOrgId || selectedOrgId === '__all__' ? undefined : selectedOrgId;
      const kchtTypeVal = !values || !values.kchtType ? [] : values.kchtType;
      const kchtTypes = Array.isArray(kchtTypeVal) ? kchtTypeVal : [kchtTypeVal];
      const provinceValue = !values ? '' : values.province;
      const provinceId = provinceValue && /^\d+$/.test(String(provinceValue))
        ? Number(provinceValue)
        : undefined;
      const province = provinceId ? getProvinceNameById(provinceId) : provinceValue;
      const search = !values ? '' : values.search;
      const objectType = !values || !values.objectType ? undefined : values.objectType;

      const res = await api.get('/v1/kchtgis/kchtgis_155/search', {
        params: {
          orgUnitId,
          kchtType: kchtTypes.length > 0 ? kchtTypes.join(',') : undefined,
          provinceId,
          province,
          search,
          objectType,
          page: targetPage - 1,
          size: targetPageSize,
        }
      });

      const payload = res.data.data as KchtGisSearchPage | KchtGisSearchResult[];
      const rawData = Array.isArray(payload) ? payload : (payload?.content || []);
      const totalElements = Array.isArray(payload) ? payload.length : (payload?.totalElements || 0);

      const list: KchtGisSearchResult[] = rawData.map((x: KchtGisSearchResult) => {
        const mapLocation = resolveMapGeometryLocation(x.coordinates, x.longitude, x.latitude);
        return {
          ...x,
          location: x.location || getProvinceNameById(x.provinceId) || '',
          toaDo: x.coordinates,
          loaiHinhHoc: x.geometryType,
          latitude: mapLocation?.center[1],
          longitude: mapLocation?.center[0],
        };
      });

      setInfrastructureResults(list);
      setSelectedRowKeys([]);
      setTotalSearchElements(totalElements);
      setSearchPage(targetPage);
      setSearchPageSize(targetPageSize);
    } catch (err) {
      console.error(err);
      setInfrastructureResults([]);
      setTotalSearchElements(0);
      setSearchError('Không thể tải dữ liệu kết cấu hạ tầng. Vui lòng thử lại.');
    } finally {
      setSearchingInfrastructure(false);
    }
  }, [searchForm, searchPageSize]);

  // Load Org Units & Symbols on Mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        const data = resp.data || [];
        setOrgUnits(data);
        orgUnitsGlobalCache = data;
      } catch (err) {
        console.error('Failed to load org units', err);
      }
    })();
    void fetchSymbols();
  }, [fetchSymbols]);

  useEffect(() => {
    (window as any).kchtOrgUnits = orgUnits;
  }, [orgUnits]);

  useEffect(() => {
    (window as any).kchtSymbols = symbols;
  }, [symbols]);

  const hasSearchedRef = useRef(false);

  // Trigger search on mount if url params exist
  useEffect(() => {
    const hasUrlParams = !!urlProvince || urlKchtType.length > 0 || !!urlSearch;
    if (searchPanelVisible && hasUrlParams) {
      handleSearchInfrastructure();
    }
  }, [handleSearchInfrastructure, searchPanelVisible, urlProvince, urlKchtType.length, urlSearch]);

  // Update map size when search panel is shown/hidden
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 200);
    }
  }, [searchPanelVisible]);

  const handleRowClick = useCallback(async (record: KchtGisSearchResult) => {
    const mapLocation = resolveMapGeometryLocation(
      record.coordinates || record.toaDo,
      record.longitude,
      record.latitude,
    );
    const validCoordinates = mapLocation?.coordinates.filter(isVietnamMapCoordinate) || [];

    if (!mapLocation || validCoordinates.length === 0) {
      toast.info('Đối tượng này chưa được cấu hình tọa độ trên bản đồ');
      return;
    }

    setSelectedRowKeys((prev) => (
      prev.includes(record.id) ? prev : [...prev, record.id]
    ));

    const map = mapRef.current;
    if (!map) return;

    const latLngs = validCoordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 14);
    } else {
      map.fitBounds(latLngs, { padding: [50, 50], maxZoom: 14 });
    }

    // Ở màn hình hẹp panel che toàn bộ bản đồ, đóng panel sau khi chọn
    // để người dùng nhìn thấy ngay icon và vị trí vừa được focus.
    if (screens.md === false) {
      setSearchPanelVisible(false);
    }
  }, [screens.md, setSelectedRowKeys]);

  // Map elements refs
  const mapRef = useRef<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const baseMapLayerRef = useRef<any>(null);
  const geoJsonGroupRef = useRef<any>(null);
  const searchMarkersGroupRef = useRef<any>(null);
  const searchVertexMarkersGroupRef = useRef<any>(null);
  const planningGroupRef = useRef<any>(null);
  const calibratorMarkerRef = useRef<any>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const renderChartFeaturesRef = useRef<() => void>();
  const renderVertexMarkersRef = useRef<() => void>();
  const renderSearchMarkersRef = useRef<() => void>();
  const fetchFeaturesInViewportRef = useRef<() => Promise<void>>();
  const fetchPlanningFeaturesRef = useRef<() => Promise<void>>();
  const moveEndTimeoutRef = useRef<any>(null);
  const planningLayersCacheRef = useRef<Record<string, any>>({});
  const planningStyleZoomBandRef = useRef<number>();
  const [customGisFeatures, setCustomGisFeatures] = useState<any[]>([]);
  const customGisFeaturesDataRef = useRef<any[]>([]);
  const fetchCustomGisFeaturesRef = useRef<() => Promise<void>>();
  const customGisGroupRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    customGisFeaturesDataRef.current = customGisFeatures;
  }, [customGisFeatures]);

  // 1. Load Leaflet plugins from local dependencies so the map does not depend on a CDN.
  useEffect(() => {
    let active = true;

    const loadLeafletPlugins = async () => {
      window.L = Leaflet;

      try {
        await import('leaflet.markercluster');
        await import('@geoman-io/leaflet-geoman-free');

        if (!(window.L as any).markerClusterGroup || !(window.L as any).PM) {
          throw new Error('Leaflet plugins were not initialized');
        }

        leafletRuntime = window.L;

        if (active) {
          setLeafletLoaded(true);
        }
      } catch (error) {
        console.error('Không thể khởi tạo thư viện bản đồ', error);
        if (active) {
          toast.error('Không thể khởi tạo bản đồ');
        }
      }
    };

    void loadLeafletPlugins();

    return () => {
      active = false;
    };
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
    if (!mapRef.current || !showChart) {
      setFeatures(prev => prev.length === 0 ? prev : []);
      return;
    }
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
  }, [palette, showChart]);

  const fetchPlanningFeatures = useCallback(async () => {
    if (!mapRef.current || !showPlanning) {
      setPlanningFeatures(prev => prev.length === 0 ? prev : []);
      return;
    }
    const zoom = mapRef.current.getZoom();
    const bounds = mapRef.current.getBounds();
    const pad = 0.02;
    const minLat = bounds.getSouth() - pad;
    const maxLat = bounds.getNorth() + pad;
    const minLon = bounds.getWest() - pad;
    const maxLon = bounds.getEast() + pad;

    try {
      const res = await api.get('/gis/planning/features', {
        params: { minLon, minLat, maxLon, maxLat, zoom }
      });
      setPlanningFeatures(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch planning features', err);
    }
  }, [showPlanning]);

  useEffect(() => {
    fetchFeaturesInViewportRef.current = fetchFeaturesInViewport;
  }, [fetchFeaturesInViewport]);

  useEffect(() => {
    fetchPlanningFeaturesRef.current = fetchPlanningFeatures;
  }, [fetchPlanningFeatures]);

  // Load planning features on load or visibility change
  useEffect(() => {
    if (leafletLoaded && mapInstance && showPlanning) {
      void fetchPlanningFeatures();
    } else {
      setPlanningFeatures([]);
    }
  }, [leafletLoaded, mapInstance, showPlanning, fetchPlanningFeatures]);

  const getOrgNameByUnitId = (unitId?: string) => {
    if (!unitId) return '—';
    const pathList: string[] = [];
    let currentId: string | undefined = unitId;
    let limit = 10;
    while (currentId && limit > 0) {
      const found = orgUnits.find(u => u.id === currentId);
      if (found) {
        pathList.unshift(found.name);
        currentId = found.parentId;
      } else {
        break;
      }
      limit--;
    }
    return pathList.length > 0 ? pathList.join(' > ') : '—';
  };

  const getObjectTypeLabel = (type: string, objectType: string, categoryId?: number) => {
    const categoryLabel = getKchtGisTypeLabelByCategoryId(categoryId);
    if (categoryLabel) return categoryLabel;

    const t = (type || '').toLowerCase();
    const ot = (objectType || '').toUpperCase();

    if (t === 'point') {
      if (ot === 'PORT') return 'Cảng biển';
      if (ot === 'LIGHTHOUSE') return 'Đèn biển';
      if (ot === 'BUOY') return 'Phao tiêu';
      if (ot === 'BEACON') return 'Tiêu / Biển báo';
      return 'Đối tượng điểm';
    }
    if (t === 'linestring') {
      if (ot === 'SHIPPING_ROUTE') return 'Luồng hàng hải';
      if (ot === 'COASTLINE') return 'Đê kè';
      return 'Đối tượng đường';
    }
    if (t === 'polygon') {
      if (ot === 'WATER_ZONE') return 'Vùng nước';
      if (ot === 'ANCHORAGE') return 'Khu neo đậu / Khu chuyển tải';
      if (ot === 'STORM_SHELTER') return 'Khu tránh trú bão';
      return 'Đối tượng vùng';
    }
    return objectType || 'Khác';
  };

  // Fetch manually drawn spatial features
  const fetchCustomGisFeatures = useCallback(async () => {
    try {
      const [points, lines, polygons] = await Promise.all([
        pointObjectService.getByStatus('PUBLISHED'),
        lineObjectService.getByStatus('PUBLISHED'),
        polygonObjectService.getByStatus('PUBLISHED'),
      ]);

      const allFeatures: any[] = [];

      // Map points
      (points || []).forEach((item: any) => {
        if (Number.isFinite(item.latitude) && Number.isFinite(item.longitude)) {
          allFeatures.push({
            id: item.id,
            name: item.name,
            code: item.code,
            type: 'Point',
            coordinates: [item.longitude, item.latitude],
            objectType: item.objectType,
            categoryId: item.categoryId,
            unitId: item.unitId,
            description: item.description,
            status: item.status,
            refId: item.refId,
            refType: item.refType,
            purpose: item.purpose,
            restrictionLevel: item.restrictionLevel,
          });
        }
      });

      // Map lines
      (lines || []).forEach((item: any) => {
        if (item.coordinates) {
          const coords = parseWktToCoords(item.coordinates);
          if (coords) {
            allFeatures.push({
              id: item.id,
              name: item.name,
              code: item.code,
              type: 'LineString',
              coordinates: coords,
              objectType: item.objectType,
              categoryId: item.categoryId,
              unitId: item.unitId,
              description: item.description,
              status: item.status,
              refId: item.refId,
              refType: item.refType,
              purpose: item.purpose,
              restrictionLevel: item.restrictionLevel,
            });
          }
        }
      });

      // Map polygons
      (polygons || []).forEach((item: any) => {
        if (item.coordinates) {
          const coords = parseWktToCoords(item.coordinates);
          if (coords) {
            allFeatures.push({
              id: item.id,
              name: item.name,
              code: item.code,
              type: 'Polygon',
              coordinates: coords,
              objectType: item.objectType,
              categoryId: item.categoryId,
              unitId: item.unitId,
              description: item.description,
              status: item.status,
              refId: item.refId,
              refType: item.refType,
              purpose: item.purpose,
              restrictionLevel: item.restrictionLevel,
            });
          }
        }
      });

      setCustomGisFeatures(allFeatures);
    } catch (err) {
      console.error('Failed to load custom GIS features:', err);
    }
  }, []);

  useEffect(() => {
    fetchCustomGisFeaturesRef.current = fetchCustomGisFeatures;
  }, [fetchCustomGisFeatures]);

  // Load custom GIS features on mount
  useEffect(() => {
    if (leafletLoaded) {
      void fetchCustomGisFeatures();
    }
  }, [leafletLoaded, fetchCustomGisFeatures]);

  // Render custom manual GIS features on the Leaflet map
  useEffect(() => {
    const L = leafletRuntime;
    if (!L || !mapRef.current || !customGisGroupRef.current) return;

    customGisGroupRef.current.clearLayers();
    if (customGisFeatures.length === 0) return;

    customGisFeatures.forEach((feature) => {
      try {
        let layer: any = null;
        let interactionPosition: [number, number] | null = null;
        if (feature.type === 'Point') {
          const coordinates = normalizePointCoordinates(feature.coordinates);
          if (!coordinates) return;
          interactionPosition = [coordinates[1], coordinates[0]];
          layer = L.circleMarker([coordinates[1], coordinates[0]], {
            radius: 7,
            color: actionPrimary,
            fillColor: actionPrimary,
            fillOpacity: 0.85,
            pane: GIS_LAYER_INTERACTION_POLICY.kchtGeometryPane,
            weight: 2,
            pmIgnore: true,
          });
        } else if (feature.type === 'LineString') {
          const coordinates = normalizeLineCoordinates(feature.coordinates);
          if (!coordinates) return;
          const latlngs = coordinates.map((coordinate) => [coordinate[1], coordinate[0]]);
          const center = L.latLngBounds(latlngs).getCenter();
          interactionPosition = [center.lat, center.lng];
          layer = L.polyline(latlngs, {
            color: statusAttention,
            weight: 3,
            opacity: 0.9,
            pane: GIS_LAYER_INTERACTION_POLICY.kchtGeometryPane,
            pmIgnore: true,
          });
        } else if (feature.type === 'Polygon') {
          const coordinates = normalizePolygonCoordinates(feature.coordinates);
          if (!coordinates) return;
          const latlngs = coordinates.map((ring) => ring.map((coordinate) => [coordinate[1], coordinate[0]]));
          const center = L.latLngBounds(latlngs.flat()).getCenter();
          interactionPosition = [center.lat, center.lng];
          layer = L.polygon(latlngs, {
            color: actionPrimary,
            fillColor: actionPrimary,
            fillOpacity: 0.25,
            pane: GIS_LAYER_INTERACTION_POLICY.kchtGeometryPane,
            weight: 2,
            pmIgnore: true,
          });
        }

        if (layer && interactionPosition) {
          // Keep KCHT geometry in the default overlay pane. Only its compact
          // interaction marker uses Leaflet's markerPane, exactly like VMD.
          // This avoids the previous all-or-nothing z-index conflict with QHCB.
          const interactionMarker = L.marker(interactionPosition, {
            icon: L.divIcon({
              className: 'gis-kcht-click-target-wrapper',
              html: '<span class="gis-kcht-click-target" aria-hidden="true"></span>',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              popupAnchor: [0, -14],
            }),
            keyboard: true,
            pane: GIS_LAYER_INTERACTION_POLICY.kchtMarkerPane,
            pmIgnore: true,
            riseOnHover: true,
            title: feature.name,
          });
          const clickableLayers = [layer, interactionMarker];

          clickableLayers.forEach((clickableLayer) => clickableLayer.bindTooltip(
            `<div style="font-weight: 600;">${feature.name}</div>`,
            { direction: 'top', offset: [0, -5], opacity: 0.9 }
          ));

          const getPopupHtml = (portName: string) => `
            <div style="min-width: 250px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px;">
              <!-- Header -->
              <div style="font-size: 14px; font-weight: 600; color: ${colors.sidebarBg}; border-bottom: 1px solid rgba(11,46,79,0.09); padding-bottom: 6px; margin-bottom: 8px; word-break: break-all;">
                ${feature.name}
              </div>

              <!-- Fields table -->
              <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #566a7c;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #888;">Mã:</span>
                  <span style="color: #222;">${feature.code}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #888;">Loại KCHT:</span>
                  <span style="font-weight: bold; color: #fa8c16;">${getObjectTypeLabel(feature.type, feature.objectType, feature.categoryId)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #888;">Địa điểm:</span>
                  <span style="color: #222;">${feature.purpose || '—'}</span>
                </div>
                ${feature.restrictionLevel ? `
                <div style="display: flex; flex-direction: column; border-bottom: 1px solid #f9f9f9; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #888;">Địa điểm chi tiết:</span>
                  <span style="color: #666; font-style: italic;">${feature.restrictionLevel}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #888;">Cảng biển:</span>
                  <span style="color: #222;">${portName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #888;">Đơn vị QL:</span>
                  <span style="color: #222; text-align: right; max-width: 140px; word-break: break-word;">${getOrgNameByUnitId(feature.unitId)}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="font-weight: 600; color: #888;">Ghi chú:</span>
                  <span style="color: #666; font-style: italic; word-break: break-word;">${feature.description || 'Không có ghi chú'}</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                <button class="btn-delete-custom-gis" data-id="${feature.id}" data-type="${feature.type}" data-name="${feature.name}" style="font-size: 13px; border-radius: 4px; padding: 4px 10px; cursor: pointer; border: 1px solid #E34948; background: #E34948; color: white; font-weight: 500; outline: none; transition: background 0.2s;">
                  Xóa
                </button>
                <button class="btn-edit-custom-gis" data-id="${feature.id}" data-type="${feature.type}" data-name="${feature.name}" style="font-size: 13px; border-radius: 4px; padding: 4px 10px; cursor: pointer; border: 1px solid #0E6FD6; background: transparent; color: #0E6FD6; font-weight: 500; outline: none; transition: background 0.2s;">
                  Chỉnh sửa
                </button>
              </div>
            </div>
          `;

          clickableLayers.forEach((clickableLayer) => {
            clickableLayer.bindPopup(getPopupHtml(feature.refId ? 'Đang tải...' : '—'));

            if (feature.refId) {
              clickableLayer.on('popupopen', async () => {
                try {
                  const port = await portCRUD.findById(feature.refId);
                  clickableLayer.setPopupContent(getPopupHtml(port?.portName || '—'));
                } catch (err) {
                  console.error(err);
                  clickableLayer.setPopupContent(getPopupHtml('—'));
                }
              });
            }
          });

          customGisGroupRef.current.addLayer(layer);
          customGisGroupRef.current.addLayer(interactionMarker);
        }
      } catch (err) {
        console.error('Failed to draw custom feature:', feature, err);
      }
    });

  }, [customGisFeatures]);

  // Render planning features as vector layers on the map
  useEffect(() => {
    const L = leafletRuntime;
    if (!L || !mapRef.current || !planningGroupRef.current) return;

    planningGroupRef.current.clearLayers();

    if (!showPlanning || planningFeatures.length === 0) return;

    const layers: any[] = [];
    const zoom = mapRef.current.getZoom();
    const styleZoomBand = getPlanningStyleZoomBand(zoom);
    if (planningStyleZoomBandRef.current !== styleZoomBand) {
      planningLayersCacheRef.current = {};
      planningStyleZoomBandRef.current = styleZoomBand;
    }
    
    planningFeatures.forEach((feature) => {
      if (!feature.geojson) return;
      if (!shouldRenderPlanningFeature(feature.geomType, feature.tableName, zoom)) return;

      // Check cache first!
      const featureKey = getPlanningFeatureKey(
        feature.geomType,
        feature.schemaName,
        feature.tableName,
        feature.fid,
      );
      const cached = planningLayersCacheRef.current[featureKey];
      if (cached) {
        layers.push(cached);
        return;
      }

      try {
        const geojsonObj = JSON.parse(feature.geojson);
        const visualStyle = getPlanningVisualStyle(
          feature.geomType,
          feature.tableName,
          feature.status,
          feature.color,
          zoom,
        );
        
        const layer = L.geoJSON(geojsonObj, {
          pane: GIS_LAYER_INTERACTION_POLICY.planningPane,
          pmIgnore: true,
          style: () => ({
            color: visualStyle.color,
            dashArray: visualStyle.dashArray,
            fillColor: visualStyle.fillColor,
            fillOpacity: visualStyle.fillOpacity,
            opacity: visualStyle.opacity,
            weight: visualStyle.weight,
          }),
          pointToLayer: (geoJsonFeature: any, latlng: any) => {
            return L.circleMarker(latlng, {
              pane: GIS_LAYER_INTERACTION_POLICY.planningPane,
              radius: visualStyle.radius,
              fillColor: visualStyle.fillColor,
              color: '#ffffff',
              weight: 1,
              fillOpacity: visualStyle.opacity,
              opacity: visualStyle.opacity,
              pmIgnore: true,
            });
          }
        });

        // Direct click event to open aggregated details popup
        layer.on('click', async (e: any) => {
          L.DomEvent.stopPropagation(e); // stop event bubbling to map
          
          const latlng = e.latlng;
          
          try {
            const res = await api.get('/gis/planning/features/at-point', {
              params: { lat: latlng.lat, lon: latlng.lng }
            });
            const featuresAtPoint = res.data?.data || [];
            if (featuresAtPoint.length === 0) return;

            const itemsHtml = featuresAtPoint.map((feat: any, idx: number) => {
              const statusPresentation = getPlanningStatusPresentation(
                feat.geomType,
                feat.tableName,
                feat.status,
                feat.color,
              );
              const cleanStatus = statusPresentation.label;
              const formattedLat = feat.lat ? `${feat.lat.toFixed(5)}°N` : '—';
              const formattedLon = feat.lon ? `${feat.lon.toFixed(5)}°E` : '—';
              const agencyName = feat.agency || 'Cục Hàng hải và Đường thủy Việt Nam';
              const statusOptionsHtml = statusPresentation.options.map((option) => {
                const isActive = statusPresentation.kind === option.kind;
                return `
                  <div class="planning-status-option ${isActive ? 'active-opt' : ''}"
                       data-status="${option.status}" data-color="${option.color}" data-fid="${feat.fid}" data-geomtype="${feat.geomType}"
                       data-schema="${feat.schemaName || ''}" data-table="${feat.tableName || ''}"
                       style="cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid ${isActive ? '#0E6FD6' : 'rgba(11,46,79,0.09)'}; background-color: ${isActive ? 'rgba(14,111,214,0.1)' : '#ffffff'}; border-radius: 4px; transition: all 0.2s;">
                    <div style="width: 16px; height: 16px; border-radius: 4px; background-color: ${option.swatchColor}; border: 1px solid rgba(11,46,79,0.09); flex-shrink: 0;"></div>
                    <span style="font-size: 13px; font-weight: ${isActive ? '600' : 'normal'};">${option.label}</span>
                  </div>
                `;
              }).join('');

              return `
                <div style="border-left: 3px solid #0E6FD6; padding-left: 12px; margin-bottom: ${idx === featuresAtPoint.length - 1 ? '0' : '20px'}; position: relative;">
                  <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <span style="border: 1px solid rgba(14,111,214,0.3); background-color: rgba(14,111,214,0.1); color: #0E6FD6; padding: 4px 10px; border-radius: 999px; font-weight: 500; font-size: 13px; max-width: 190px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${feat.name || 'Đối tượng quy hoạch'}">
                      ${feat.name || 'Đối tượng quy hoạch'}
                    </span>
                    <span style="background-color: #f8fafc; border: 1px solid rgba(11,46,79,0.09); padding: 2px 8px; border-radius: 999px; font-size: 10px; color: #566a7c; font-weight: 500;">
                      ${feat.geomType === 'AREA' ? 'Quy hoạch' : 'Hiện trạng'}
                    </span>
                  </div>

                  <div style="font-size: 12px; color: #666; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                    <span>📍</span> <span>${formattedLat}, ${formattedLon}</span>
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; margin-bottom: 12px;">
                    <div style="display: flex;">
                      <span style="width: 100px; color: #888; flex-shrink: 0;">Tên đối tượng:</span>
                      <span style="font-weight: 500;">${feat.name || '—'}</span>
                    </div>
                    <div style="display: flex;">
                      <span style="width: 100px; color: #888; flex-shrink: 0;">Cơ quan QL:</span>
                      <span>${agencyName}</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                      <span style="width: 100px; color: #888; flex-shrink: 0;">Trạng thái QH:</span>
                      <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: ${statusPresentation.swatchColor}33; border: 1px solid ${statusPresentation.swatchColor}; color: rgba(0, 0, 0, 0.85);">
                        ${cleanStatus}
                      </span>
                    </div>
                  </div>

                  ${statusOptionsHtml ? `
                    <div style="border-top: 1px dashed #d9d9d9; margin: 12px 0;"></div>

                    <div style="font-size: 10px; font-weight: 600; color: #12468C; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                      CẬP NHẬT TRẠNG THÁI QUY HOẠCH
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 8px; user-select: none; -webkit-user-select: none;">
                      ${statusOptionsHtml}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('');

            const aggregatedContent = `
              <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px; width: 330px; color: #0c2438; max-height: 380px; overflow-y: auto; padding-right: 6px;">
                ${itemsHtml}
              </div>
            `;

            if (mapRef.current) {
              L.popup({ minWidth: 340, maxWidth: 360, autoPanPadding: [50, 100] })
                .setLatLng(latlng)
                .setContent(aggregatedContent)
                .openOn(mapRef.current);
            }

          } catch (err) {
            console.error('Failed to load planning details at click point', err);
          }
        });

        // Cache the fully parsed and built layer
        planningLayersCacheRef.current[featureKey] = layer;
        layers.push(layer);
      } catch (err) {
        // skip
      }
    });

    if (layers.length > 0) {
      const tempGroup = L.layerGroup(layers);
      planningGroupRef.current.addLayer(tempGroup);
    }
  }, [planningFeatures, showPlanning]);



  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    if (mapRef.current) {
      setMapInstance(mapRef.current);
      return;
    }

    const L = leafletRuntime;
    // Create map centered on Vietnam (incorporating East Sea / Sovereignty area)
    const map = L.map(mapContainerRef.current, {
      preferCanvas: true,
      attributionControl: false,
      maxZoom: 20,
    }).setView([16.0, 108.0], 5);
    mapRef.current = map;
    setMapInstance(map);

    // Create a high-priority pane for QHCB planning layers so they render above ENC layers
    const planningPane = map.createPane(GIS_LAYER_INTERACTION_POLICY.planningPane);
    planningPane.style.zIndex = String(GIS_LAYER_INTERACTION_POLICY.planningPaneZIndex);

    // Track map zoom and move events for viewport filtering with 300ms debounce
    map.on('moveend', () => {
      if (moveEndTimeoutRef.current) {
        clearTimeout(moveEndTimeoutRef.current);
      }
      moveEndTimeoutRef.current = setTimeout(() => {
        if (fetchFeaturesInViewportRef.current) {
          void fetchFeaturesInViewportRef.current();
        }
        if (fetchPlanningFeaturesRef.current) {
          void fetchPlanningFeaturesRef.current();
        }
        if (renderVertexMarkersRef.current) {
          renderVertexMarkersRef.current();
        }
        if (renderSearchMarkersRef.current) {
          renderSearchMarkersRef.current();
        }
      }, 300);
    });

    // Feature group for vector charts
    geoJsonGroupRef.current = L.featureGroup().addTo(map);

    // Feature group for search markers
    searchMarkersGroupRef.current = (L as any).markerClusterGroup 
      ? (L as any).markerClusterGroup({ showCoverageOnHover: false }) 
      : L.featureGroup();
    searchMarkersGroupRef.current.addTo(map);

    // Plain feature group for vertex markers (zoom-controlled to prevent lag)
    searchVertexMarkersGroupRef.current = L.layerGroup().addTo(map);

    map.on('zoomend', () => {
      if (renderVertexMarkersRef.current) {
        renderVertexMarkersRef.current();
      }
      if (renderSearchMarkersRef.current) {
        renderSearchMarkersRef.current();
      }
    });

    // Feature group for planning features
    planningGroupRef.current = L.featureGroup().addTo(map);

    // Feature group for manually drawn GIS features (Point, Line, Polygon objects)
    customGisGroupRef.current = L.featureGroup().addTo(map);





    // Global capture-phase click listener for planning status options and custom GIS actions
    const handleGlobalClick = async (evt: any) => {
      const opt = evt.target.closest('.planning-status-option');
      if (opt) {
        evt.preventDefault();
        evt.stopPropagation();

        const status = opt.getAttribute('data-status');
        const color = opt.getAttribute('data-color');
        const fid = opt.getAttribute('data-fid');
        const geomType = opt.getAttribute('data-geomtype');
        const schemaName = opt.getAttribute('data-schema');
        const tableName = opt.getAttribute('data-table');

        if (!status || !color || !fid || !geomType || !schemaName || !tableName) {
          return;
        }

        try {
          const colorInt = parseInt(color, 10);
          await api.put(`/gis/planning/features/${geomType}/${fid}/status`, null, {
            params: { schemaName, tableName, status, color: colorInt }
          });
          toast.success('Cập nhật trạng thái quy hoạch thành công');
          
          if (mapRef.current) {
            mapRef.current.closePopup();
          }
          // Clear cache for this feature so it gets re-rendered with new color!
          if (fid && planningLayersCacheRef.current) {
            const featureKey = getPlanningFeatureKey(geomType, schemaName, tableName, fid);
            const currentLayer = planningLayersCacheRef.current[featureKey];
            currentLayer?.setStyle?.(
              getPlanningLeafletColorStyle(geomType, colorInt, tableName, status),
            );
            delete planningLayersCacheRef.current[featureKey];
          }
          if (fetchPlanningFeaturesRef.current) {
            await fetchPlanningFeaturesRef.current();
          }
        } catch (err) {
          toast.error('Lỗi khi cập nhật trạng thái quy hoạch');
        }
        return;
      }

      // Intercept delete custom GIS object click
      const deleteBtn = evt.target.closest('.btn-delete-custom-gis');
      if (deleteBtn) {
        evt.preventDefault();
        evt.stopPropagation();

        const id = deleteBtn.getAttribute('data-id');
        const type = deleteBtn.getAttribute('data-type');
        const name = deleteBtn.getAttribute('data-name');
        if (!id || !type) return;

        modal.confirm({
          title: 'Xóa đối tượng KCHT',
          content: `Bạn có chắc chắn muốn xóa đối tượng "${name}" không?`,
          okText: 'Xóa',
          okType: 'danger',
          cancelText: 'Hủy',
          onOk: async () => {
            try {
              if (type === 'Point') {
                await pointObjectService.delete(id);
              } else if (type === 'LineString') {
                await lineObjectService.delete(id);
              } else if (type === 'Polygon') {
                await polygonObjectService.delete(id);
              }
              toast.success('Xóa đối tượng KCHT thành công');
              
              if (mapRef.current) {
                mapRef.current.closePopup();
              }
              if (fetchCustomGisFeaturesRef.current) {
                await fetchCustomGisFeaturesRef.current();
              }
            } catch (err) {
              toast.error('Lỗi khi xóa đối tượng KCHT');
            }
          }
        });
        return;
      }

      // Intercept edit custom GIS object click
      const editBtn = evt.target.closest('.btn-edit-custom-gis');
      if (editBtn) {
        evt.preventDefault();
        evt.stopPropagation();
        
        const id = editBtn.getAttribute('data-id');
        if (!id) return;

        const feature = customGisFeaturesDataRef.current.find((f: any) => String(f.id) === id);
        if (feature) {
          const editRecord = {
            id: feature.id,
            type: feature.type,
            name: feature.name,
            code: feature.code,
            loaiKcht: getKchtGisTypeByCategoryId(feature.categoryId),
            unitId: feature.unitId,
            Port: feature.refId,
            location: feature.purpose,
            diaDiemChiTiet: feature.restrictionLevel,
            moTa: feature.description,
            status: feature.status || 'PUBLISHED',
            coordinates: feature.coordinates,
          };

          setEditingCustomGisRecord(editRecord);
          setSaveModalOpen(true);

          if (mapRef.current) {
            mapRef.current.closePopup();
          }
        }
        return;
      }
    };

    document.addEventListener('click', handleGlobalClick, true);

    // Invalidate size once after container renders to ensure correct sizing
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      if (moveEndTimeoutRef.current) {
        clearTimeout(moveEndTimeoutRef.current);
      }
      if (mapRef.current) {
        mapRef.current.off('moveend');
        mapRef.current.remove();
        mapRef.current = null;
        baseMapLayerRef.current = null;
      }
    };
  }, [leafletLoaded]);

  useEffect(() => {
    if (!leafletLoaded || !mapInstance || !leafletRuntime) return;
    const selectedBaseMap = BASE_MAP_OPTIONS.find((option) => option.value === activeBaseMap)
      || BASE_MAP_OPTIONS[0];
    if (baseMapLayerRef.current) {
      mapInstance.removeLayer(baseMapLayerRef.current);
    }
    baseMapLayerRef.current = leafletRuntime.tileLayer(selectedBaseMap.url, {
      maxZoom: 20,
      subdomains: '0123',
      attribution: '© Google Maps',
      keepBuffer: 4,
      updateWhenZooming: false,
      updateWhenIdle: true,
    }).addTo(mapInstance);
    baseMapLayerRef.current.bringToBack?.();
  }, [activeBaseMap, leafletLoaded, mapInstance]);

  // 3.1 Initialize Geoman Drawing Controls when map is ready and Leaflet loads
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const pm = (map as any).pm;
    if (!pm) return;

    if (map.pm) {
      if (typeof map.pm.removeControls === 'function') {
        try {
          map.pm.removeControls();
        } catch (e) {
          console.error(e);
        }
      }
      pm.setLang('vi');
      // Do not add default Geoman controls since we are rendering the custom MapToolbar

      let activeDrawnLayer: any = null;

      const updateDrawnGeometry = (layer: any, shape: string) => {
        let geometryTypeVi = 'Điểm';
        if (shape === 'Line' || shape === 'Polyline') geometryTypeVi = 'Đường';
        if (shape === 'Polygon') geometryTypeVi = 'Vùng Đa giác';
        if (shape === 'Rectangle') geometryTypeVi = 'Vùng Chữ nhật';

        let result;
        if (shape === 'Marker') {
          const latlng = layer.getLatLng();
          result = {
            wkt: `POINT(${latlng.lng.toFixed(6)} ${latlng.lat.toFixed(6)})`,
            coordinates: [{ lat: latlng.lat, lng: latlng.lng }]
          };
        } else if (shape === 'Line' || shape === 'Polyline') {
          const latlngs = layer.getLatLngs();
          const coords = latlngs.map((ll: any) => ({ lat: ll.lat, lng: ll.lng }));
          const wktStr = coords.map((c: any) => `${c.lng.toFixed(6)} ${c.lat.toFixed(6)}`).join(', ');
          result = {
            wkt: `LINESTRING(${wktStr})`,
            coordinates: coords
          };
        } else if (shape === 'Polygon' || shape === 'Rectangle') {
          const rawLatLngs = layer.getLatLngs();
          const latlngs = Array.isArray(rawLatLngs[0]) ? rawLatLngs[0] : rawLatLngs;
          const coords = latlngs.map((ll: any) => ({ lat: ll.lat, lng: ll.lng }));
          if (coords.length > 0) {
            const first = coords[0];
            const last = coords[coords.length - 1];
            if (first.lat !== last.lat || first.lng !== last.lng) {
              coords.push({ ...first });
            }
          }
          const wktStr = coords.map((c: any) => `${c.lng.toFixed(6)} ${c.lat.toFixed(6)}`).join(', ');
          result = {
            wkt: `POLYGON((${wktStr}))`,
            coordinates: coords
          };
        }

        if (result) {
          setDrawnGeometry({
            type: geometryTypeVi,
            wkt: result.wkt,
            coordinates: result.coordinates
          });
        }
      };

      map.on('pm:create', (e: any) => {
        const { layer, shape } = e;
        
        // Disable draw mode asynchronously to return cursor to normal navigation and prevent Geoman race conditions
        setTimeout(() => {
          if (pm && typeof pm.disableDraw === 'function') {
            pm.disableDraw();
          }
        }, 0);

        if (activeDrawnLayer && map.hasLayer(activeDrawnLayer)) {
          map.removeLayer(activeDrawnLayer);
        }
        activeDrawnLayer = layer;

        updateDrawnGeometry(layer, shape);

        const geo = layer.toGeoJSON();
        const geomTypeMap: Record<string, 'draw-point' | 'draw-line' | 'draw-polygon'> = {
          'Marker': 'draw-point',
          'Line': 'draw-line',
          'Polyline': 'draw-line',
          'Polygon': 'draw-polygon',
          'Rectangle': 'draw-polygon'
        };
        const drawResult: DrawResult = {
          geojson: geo,
          type: geomTypeMap[shape] || 'draw-point'
        };
        setPendingDrawResult(drawResult);
        setSaveModalOpen(true);

        layer.on('pm:edit', () => {
          updateDrawnGeometry(layer, shape);
          const updatedGeo = layer.toGeoJSON();
          setPendingDrawResult({
            geojson: updatedGeo,
            type: geomTypeMap[shape] || 'draw-point'
          });
        });

        layer.on('pm:remove', () => {
          setDrawnGeometry(null);
          activeDrawnLayer = null;
          setPendingDrawResult(null);
          setSaveModalOpen(false);
        });
      });

      (window as any).clearDrawnShape = () => {
        if (activeDrawnLayer && map.hasLayer(activeDrawnLayer)) {
          map.removeLayer(activeDrawnLayer);
        }
        setDrawnGeometry(null);
        activeDrawnLayer = null;
      };
    }
  }, [leafletLoaded, mapInstance]);

  const renderVertexMarkers = useCallback(() => {
    const L = leafletRuntime;
    if (!L || !mapRef.current || !searchVertexMarkersGroupRef.current) return;
    
    searchVertexMarkersGroupRef.current.clearLayers();

    const selectedRecords = selectedInfrastructureResults;
    const zoom = mapRef.current.getZoom();
    if (zoom < 10) return;

    const bounds = mapRef.current.getBounds();
    const visibleRecords = selectedRecords.filter(record => {
      if (!record.toaDo || !record.loaiHinhHoc) return false;
      const geomType = record.loaiHinhHoc.toUpperCase();
      return geomType === 'LINE' || geomType === 'POLYLINE' || geomType === 'POLYGON' || geomType === 'AREA';
    });

    const vertexMarkers: any[] = [];
    let renderedCount = 0;
    const maxVertices = 1000;

    visibleRecords.forEach(record => {
      if (renderedCount >= maxVertices) return;

      const shapeCoordinates = parseWktToLatLngs(record.toaDo, record.loaiHinhHoc);
      if (shapeCoordinates.length === 0) return;
      
      const lineLatLngs = shapeCoordinates.map(c => L.latLng(c[0], c[1]));
      const lineBounds = L.latLngBounds(lineLatLngs);
      if (!bounds.intersects(lineBounds)) return;

      // Find symbol based on kchtTypeLabel (for infrastructureResults) or loaiKcht (for customGisFeatures)
      const loai = (record.kchtTypeLabel || record.loaiKcht || '').toUpperCase();
      let sym = null;
      if (loai.includes('CẢNG BIỂN') || loai.includes('CANGBIEN') || loai.includes('CANG_BIEN')) {
        sym = symbols.find(s => s.code === 'SEAPORT');
      } else if (loai.includes('BẾN CẢNG')) {
        sym = symbols.find(s => s.code === 'TERMINAL');
      } else if (loai.includes('CẢNG CẠN')) {
        sym = symbols.find(s => s.code === 'DRY_PORT');
      } else if (loai.includes('CẦU CẢNG')) {
        sym = symbols.find(s => s.code === 'QUAY');
      } else if (loai.includes('KHU NEO ĐẬU')) {
        sym = symbols.find(s => s.code === 'ANCHORAGE');
      } else if (loai.includes('BẾN PHAO')) {
        sym = symbols.find(s => s.code === 'MOORING');
      } else if (loai.includes('TRÚ BÃO') || loai.includes('TRÁNH BÃO') || loai.includes('TRÁNH, TRÚ BÃO')) {
        sym = symbols.find(s => s.code === 'SHELTER');
      } else if (loai.includes('CHUYỂN TẢI')) {
        sym = symbols.find(s => s.code === 'TRANSSHIP');
      } else if (loai.includes('SỬA CHỮA') || loai.includes('ĐÓNG TÀU')) {
        sym = symbols.find(s => s.code === 'SHIPYARD');
      } else if (loai.includes('ĐÈN BIỂN') || loai.includes('DENBIEN')) {
        sym = symbols.find(s => s.code === 'LIGHTHOUSE');
      } else if (loai.includes('PHAO') || loai.includes('TIÊU') || loai.includes('PHAOTIEU')) {
        sym = symbols.find(s => s.code === 'BUOY');
      } else if (loai.includes('LUỒNG HÀNG HẢI') || loai.includes('LUONGHANGHAI')) {
        sym = symbols.find(s => s.code === 'CHANNEL');
      } else if (loai.includes('ĐÊ') || loai.includes('KÈ') || loai.includes('DEKE')) {
        sym = symbols.find(s => s.code === 'BREAKWATER');
      } else if (loai.includes('VTS')) {
        sym = symbols.find(s => s.code === 'VTS' || s.code === 'VTS_INFRA');
      } else if (loai.includes('RADAR')) {
        sym = symbols.find(s => s.code === 'RADAR');
      } else if (loai.includes('AIS')) {
        sym = symbols.find(s => s.code === 'AIS');
      } else if (loai.includes('CCTV')) {
        sym = symbols.find(s => s.code === 'CCTV');
      } else if (loai.includes('SCADA')) {
        sym = symbols.find(s => s.code === 'SCADA');
      }
      
      let markerIcon: any;
      if (sym && sym.image) {
        markerIcon = L.divIcon({
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              background: white;
              border: 2px solid #1890ff;
              border-radius: 50%;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              overflow: hidden;
            ">
              <img src="${sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}"
                   style="width: 22px; height: 22px; object-fit: contain;" />
            </div>
          `,
          className: 'custom-map-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });
      } else {
        markerIcon = L.divIcon({
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              background: #1890ff;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
              <span style="color: white; font-size: 10px; font-weight: bold;">
                ${record.kchtTypeLabel ? record.kchtTypeLabel.charAt(0) : '•'}
              </span>
            </div>
          `,
          className: 'default-map-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        });
      }

      shapeCoordinates.forEach((coord: [number, number]) => {
        if (renderedCount >= maxVertices) return;
        if (!bounds.contains(L.latLng(coord[0], coord[1]))) return;

        const vertexMarker = L.marker(coord, {
          icon: markerIcon,
          pane: GIS_LAYER_INTERACTION_POLICY.kchtMarkerPane,
          pmIgnore: true,
        });
        vertexMarker.on('click', async (e: any) => {
          L.DomEvent.stopPropagation(e);
          const popup = L.popup({ minWidth: 460, maxWidth: 500, autoPanPadding: [50, 100] })
            .setLatLng(coord)
            .setContent('<div style="padding: 10px; font-size: 13px; font-family: sans-serif;">Đang tải thông tin chi tiết...</div>')
            .openOn(mapRef.current);
          
          activePopupRef.current = popup;
          activePopupRecordRef.current = record;
          popup.on('close', () => {
            if (activePopupRef.current === popup) {
              activePopupRef.current = null;
              activePopupRecordRef.current = null;
            }
          });

          const detailsHtml = await fetchAndFormatPopupDetails(record);
          popup.setContent(detailsHtml);
        });
        vertexMarkers.push(vertexMarker);
        renderedCount++;
      });
    });

    if (vertexMarkers.length > 0) {
      const tempGroup = L.layerGroup(vertexMarkers);
      searchVertexMarkersGroupRef.current.addLayer(tempGroup);
    }
  }, [selectedInfrastructureResults, symbols]);

  const renderSearchMarkers = useCallback(() => {
    const L = leafletRuntime;
    if (!L || !mapRef.current || !searchMarkersGroupRef.current) return;

    const startTime = performance.now();

    // Clear old search markers and vertex markers
    searchMarkersGroupRef.current.clearLayers();
    if (searchVertexMarkersGroupRef.current) {
      searchVertexMarkersGroupRef.current.clearLayers();
    }

    const selectedRecords = selectedInfrastructureResults;
    if (selectedRecords.length === 0) return;

    const zoom = mapRef.current.getZoom();
    const markers: any[] = [];

    selectedRecords.forEach((record) => {
      const mapLocation = resolveMapGeometryLocation(
        record.coordinates || record.toaDo,
        record.longitude,
        record.latitude,
      );
      const center = mapLocation?.center;

      if (center && isVietnamMapCoordinate(center)) {
        const [lon, lat] = center;

          // Find symbol based on kchtTypeLabel (for infrastructureResults) or loaiKcht (for customGisFeatures)
          const loai = (record.kchtTypeLabel || record.loaiKcht || '').toUpperCase();
          let sym = null;
          if (loai.includes('CẢNG BIỂN') || loai.includes('CANGBIEN') || loai.includes('CANG_BIEN')) {
            sym = symbols.find(s => s.code === 'SEAPORT');
          } else if (loai.includes('BẾN CẢNG')) {
            sym = symbols.find(s => s.code === 'TERMINAL');
          } else if (loai.includes('CẢNG CẠN')) {
            sym = symbols.find(s => s.code === 'DRY_PORT');
          } else if (loai.includes('CẦU CẢNG')) {
            sym = symbols.find(s => s.code === 'QUAY');
          } else if (loai.includes('KHU NEO ĐẬU')) {
            sym = symbols.find(s => s.code === 'ANCHORAGE');
          } else if (loai.includes('BẾN PHAO')) {
            sym = symbols.find(s => s.code === 'MOORING');
          } else if (loai.includes('TRÚ BÃO') || loai.includes('TRÁNH BÃO') || loai.includes('TRÁNH, TRÚ BÃO')) {
            sym = symbols.find(s => s.code === 'SHELTER');
          } else if (loai.includes('CHUYỂN TẢI')) {
            sym = symbols.find(s => s.code === 'TRANSSHIP');
          } else if (loai.includes('SỬA CHỮA') || loai.includes('ĐÓNG TÀU')) {
            sym = symbols.find(s => s.code === 'SHIPYARD');
          } else if (loai.includes('ĐÈN BIỂN') || loai.includes('DENBIEN')) {
            sym = symbols.find(s => s.code === 'LIGHTHOUSE');
          } else if (loai.includes('PHAO') || loai.includes('TIÊU') || loai.includes('PHAOTIEU')) {
            sym = symbols.find(s => s.code === 'BUOY');
          } else if (loai.includes('LUỒNG HÀNG HẢI') || loai.includes('LUONGHANGHAI')) {
            sym = symbols.find(s => s.code === 'CHANNEL');
          } else if (loai.includes('ĐÊ') || loai.includes('KÈ') || loai.includes('DEKE')) {
            sym = symbols.find(s => s.code === 'BREAKWATER');
          } else if (loai.includes('VTS')) {
            sym = symbols.find(s => s.code === 'VTS' || s.code === 'VTS_INFRA');
          } else if (loai.includes('RADAR')) {
            sym = symbols.find(s => s.code === 'RADAR');
          } else if (loai.includes('AIS')) {
            sym = symbols.find(s => s.code === 'AIS');
          } else if (loai.includes('CCTV')) {
            sym = symbols.find(s => s.code === 'CCTV');
          } else if (loai.includes('SCADA')) {
            sym = symbols.find(s => s.code === 'SCADA');
          }

          let marker;
          let markerIcon: any;
          if (sym && sym.image) {
            markerIcon = L.divIcon({
              html: `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 32px;
                  height: 32px;
                  background: white;
                  border: 2px solid #1890ff;
                  border-radius: 50%;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                  overflow: hidden;
                ">
                  <img src="${sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}"
                       style="width: 22px; height: 22px; object-fit: contain;" />
                </div>
              `,
              className: 'custom-map-icon',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16],
            });
          } else {
            markerIcon = L.divIcon({
              html: `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 24px;
                  height: 24px;
                  background: #1890ff;
                  border: 2px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                ">
                  <span style="color: white; font-size: 10px; font-weight: bold;">
                    ${record.kchtTypeLabel ? record.kchtTypeLabel.charAt(0) : '•'}
                  </span>
                </div>
              `,
              className: 'default-map-icon',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
              popupAnchor: [0, -12],
            });
          }
          
          // Always create a point marker for all record types (including LINE/POLYLINE)
          // At low zoom, users see the marker icon; at high zoom >= 10, the full polyline/polygon shape is also drawn
          marker = L.marker([lat, lon], {
            icon: markerIcon,
            pane: GIS_LAYER_INTERACTION_POLICY.kchtMarkerPane,
            pmIgnore: true,
          });
            marker.on('click', async (e: any) => {
              L.DomEvent.stopPropagation(e);
              const popup = L.popup({ minWidth: 460, maxWidth: 500, autoPanPadding: [50, 100] })
                .setLatLng([lat, lon])
                .setContent('<div style="padding: 10px; font-size: 13px; font-family: sans-serif;">Đang tải thông tin chi tiết...</div>')
                .openOn(mapRef.current);

              activePopupRef.current = popup;
              activePopupRecordRef.current = record;
              popup.on('close', () => {
                if (activePopupRef.current === popup) {
                  activePopupRef.current = null;
                  activePopupRecordRef.current = null;
                }
              });

              const detailsHtml = await fetchAndFormatPopupDetails(record);
              popup.setContent(detailsHtml);
            });
            markers.push(marker);

          // Draw spatial shape (polyline / polygon) if coordinates exist
          // Optimization: Only render complex vector shapes at zoom >= 10 to prevent map rendering lag at low zoom levels
          if (record.toaDo && record.loaiHinhHoc && zoom >= 10) {
            const shapeCoordinates = parseWktToLatLngs(record.toaDo, record.loaiHinhHoc);
            if (shapeCoordinates.length > 0) {
              let shapeLayer;
              const geomType = record.loaiHinhHoc.toUpperCase();
              if (geomType === 'LINE' || geomType === 'POLYLINE') {
                shapeLayer = L.polyline(shapeCoordinates, {
                  color: '#1890ff',
                  weight: 4,
                  opacity: 0.85,
                  pane: GIS_LAYER_INTERACTION_POLICY.kchtGeometryPane,
                  pmIgnore: true,
                });

                shapeLayer.on('click', async (e: any) => {
                  L.DomEvent.stopPropagation(e);
                  const popup = L.popup({ minWidth: 460, maxWidth: 500, autoPanPadding: [50, 100] })
                    .setLatLng(e.latlng)
                    .setContent('<div style="padding: 10px; font-size: 13px; font-family: sans-serif;">Đang tải thông tin chi tiết...</div>')
                    .openOn(mapRef.current);

                  activePopupRef.current = popup;
                  activePopupRecordRef.current = record;
                  popup.on('close', () => {
                    if (activePopupRef.current === popup) {
                      activePopupRef.current = null;
                      activePopupRecordRef.current = null;
                    }
                  });

                  const detailsHtml = await fetchAndFormatPopupDetails(record);
                  popup.setContent(detailsHtml);
                });
              } else if (geomType === 'POLYGON' || geomType === 'AREA') {
                shapeLayer = L.polygon(shapeCoordinates, {
                  color: '#1890ff',
                  weight: 2,
                  fillColor: '#1890ff',
                  fillOpacity: 0.35,
                  pane: GIS_LAYER_INTERACTION_POLICY.kchtGeometryPane,
                  pmIgnore: true,
                });

                shapeLayer.on('click', async (e: any) => {
                  L.DomEvent.stopPropagation(e);
                  const popup = L.popup({ minWidth: 460, maxWidth: 500, autoPanPadding: [50, 100] })
                    .setLatLng(e.latlng)
                    .setContent('<div style="padding: 10px; font-size: 13px; font-family: sans-serif;">Đang tải thông tin chi tiết...</div>')
                    .openOn(mapRef.current);

                  activePopupRef.current = popup;
                  activePopupRecordRef.current = record;
                  popup.on('close', () => {
                    if (activePopupRef.current === popup) {
                      activePopupRef.current = null;
                      activePopupRecordRef.current = null;
                    }
                  });

                  const detailsHtml = await fetchAndFormatPopupDetails(record);
                  popup.setContent(detailsHtml);
                });
              }
              if (shapeLayer) {
                markers.push(shapeLayer);
              }
            }
          }
      }
    });

    if (markers.length > 0) {
      if (searchMarkersGroupRef.current.addLayers) {
        searchMarkersGroupRef.current.addLayers(markers);
      } else {
        const tempGroup = L.layerGroup(markers);
        searchMarkersGroupRef.current.addLayer(tempGroup);
      }
    }

    // Render dynamic vertex markers for lines in current viewport if zoom level is met
    renderVertexMarkers();

    const endTime = performance.now();
    console.log(`[Map] Draw completed in ${(endTime - startTime).toFixed(2)} ms. Rendered ${selectedRecords.length} records (${markers.length} main layers).`);
  }, [selectedInfrastructureResults, symbols, renderVertexMarkers]);

  useEffect(() => {
    renderVertexMarkersRef.current = renderVertexMarkers;
  }, [renderVertexMarkers]);

  useEffect(() => {
    renderSearchMarkersRef.current = renderSearchMarkers;
  }, [renderSearchMarkers]);

  // Trigger search result rendering whenever data or selections change
  useEffect(() => {
    renderSearchMarkers();
  }, [selectedInfrastructureResults, symbols, renderSearchMarkers]);

  // Run fitBounds ONCE when the list of selected records changes (to avoid movement loop)
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const selectedRecords = selectedInfrastructureResults;
    if (selectedRecords.length === 0) return;

    try {
      const L = leafletRuntime;
      const pts: Array<[number, number]> = [];
      selectedRecords.forEach(record => {
        const mapLocation = resolveMapGeometryLocation(
          record.coordinates || record.toaDo,
          record.longitude,
          record.latitude,
        );
        mapLocation?.coordinates
          .filter(isVietnamMapCoordinate)
          .forEach(([lng, lat]) => pts.push([lat, lng]));
      });
      if (pts.length > 0) {
        const bounds = L.latLngBounds(pts);
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    } catch (e) {
      // ignore
    }
  }, [selectedInfrastructureResults, leafletLoaded]);

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
    const L = leafletRuntime;
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
              pmIgnore: true,
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
            pmIgnore: true,
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
            pmIgnore: true,
          });
        }

        if (layer) {
          const attribs = {
            'Mã S-57': featureCode,
            'Hình học': geometryType,
            ...(feature.attributes || {})
          };

          const attribsHtml = `<div style="max-height: 180px; overflow-y: auto; margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px; font-size: 11px; line-height: 1.4;">
            ${Object.entries(attribs)
              .map(([k, v]) => `<div style="display: flex; justify-content: space-between; gap: 10px; margin-bottom: 2px;">
                <strong style="color: #666;">${k}:</strong>
                <span style="color: #333; text-align: right; word-break: break-all;">${String(v)}</span>
              </div>`)
              .join('')}
           </div>`;

          layer.bindPopup(`
            <div style="min-width: 180px; max-width: 280px; font-family: sans-serif;">
              <strong style="font-size: 13px; color: #1890ff; display: block; margin-bottom: 4px;">
                ${getFeatureNameVi(featureCode, featureName)}
              </strong>
              ${attribsHtml}
            </div>
          `, {
            maxWidth: 300
          });
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
    const L = leafletRuntime;
    if (!L || !mapRef.current || !geoJsonGroupRef.current) return;

    geoJsonGroupRef.current.clearLayers();

    if (!showChart) return;

    const zoom = mapRef.current.getZoom();
    if (zoom < 12) return;

    if (parsedLayers.length === 0) return;

    const activeLayers: any[] = [];
    parsedLayers.forEach(({ minZoom, layer, featureCode }) => {
      const isVisible = visibleLayers[featureCode] ?? false;
      if (zoom >= minZoom && isVisible) {
        activeLayers.push(layer);
      }
    });

    if (activeLayers.length > 0) {
      const tempGroup = L.layerGroup(activeLayers);
      geoJsonGroupRef.current.addLayer(tempGroup);
    }
  }, [parsedLayers, visibleLayers, showChart]);

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
  }, [leafletLoaded, parsedLayers, renderChartFeatures, visibleLayers, showChart]);

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
          const L = leafletRuntime;
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
    <div style={{ position: 'relative', height: 'calc(100vh - 64px)', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%' }}>
        {/* Main Map Viewer */}
        <div style={{ position: 'relative', zIndex: 0, width: '100%', height: '100%' }}>
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
              {mapInstance && (
                <MapToolbar
                  map={mapInstance}
                  onClearAll={() => {
                    if ((window as any).clearDrawnShape) {
                      (window as any).clearDrawnShape();
                    }
                  }}
                />
              )}
              {mapInstance && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '8px'
                  }}
                >
                  {legendOpen && (
                    <div
                      style={{
                        background: surfaceCard,
                        borderRadius: radiusMd,
                        boxShadow: shadowLg,
                        border: `1px solid ${borderDefault}`,
                        padding: spaceMd,
                        width: '320px',
                        fontFamily: fontSans,
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg, letterSpacing: '0.5px', borderBottom: `1px solid ${borderDefault}`, paddingBottom: spaceSm, marginBottom: spaceMd }}>
                        GHI CHÚ QUY HOẠCH:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Bến cảng hiện hữu */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '24px', height: '12px', background: PLANNING_STATUS_COLORS.existingPort, border: `1px solid ${PLANNING_STATUS_COLORS.existingPort}`, borderRadius: '2px' }} />
                          <span style={{ fontSize: '13px', color: '#444' }}>Bến cảng hiện hữu</span>
                        </div>
                        {/* Bến cảng quy hoạch đến năm 2030 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '24px', height: '12px', background: PLANNING_STATUS_COLORS.planned2030, border: `1px solid ${PLANNING_STATUS_COLORS.planned2030}`, borderRadius: '2px' }} />
                          <span style={{ fontSize: '13px', color: '#444' }}>Bến cảng quy hoạch đến năm 2030</span>
                        </div>
                        {/* Bến cảng phát triển có điều kiện */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '24px', height: '12px', background: PLANNING_STATUS_COLORS.conditionalDevelopment, border: `1px solid ${PLANNING_STATUS_COLORS.conditionalDevelopment}`, borderRadius: '2px' }} />
                          <span style={{ fontSize: '13px', color: '#444' }}>Bến cảng phát triển có điều kiện</span>
                        </div>
                        {/* Bến cảng quy hoạch tầm nhìn đến năm 2050 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '24px', height: '12px', background: PLANNING_STATUS_COLORS.vision2050, border: `1px solid ${PLANNING_STATUS_COLORS.vision2050}`, borderRadius: '2px' }} />
                          <span style={{ fontSize: '13px', color: '#444' }}>Bến cảng quy hoạch tầm nhìn đến năm 2050</span>
                        </div>
                        {/* Vùng đón trả hoa tiêu quy hoạch */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <svg width="24" height="12" viewBox="0 0 24 12" style={{ display: 'block' }}>
                            <line x1="2" y1="10" x2="22" y2="2" stroke={PLANNING_STATUS_COLORS.plannedPilotArea} strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#444' }}>Vùng đón trả hoa tiêu quy hoạch</span>
                        </div>
                        {/* Vùng đón trả hoa tiêu hiện trạng */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <svg width="24" height="12" viewBox="0 0 24 12" style={{ display: 'block' }}>
                            <line x1="2" y1="10" x2="22" y2="2" stroke={PLANNING_STATUS_COLORS.existingPilotArea} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#444' }}>Vùng đón trả hoa tiêu hiện trạng</span>
                        </div>
                        {/* Vùng neo hiện trạng */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <svg width="24" height="12" viewBox="0 0 24 12" style={{ display: 'block' }}>
                            <line x1="2" y1="10" x2="22" y2="2" stroke={PLANNING_STATUS_COLORS.existingAnchorage} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#444' }}>Vùng neo hiện trạng</span>
                        </div>
                        {/* Vùng neo quy hoạch */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <svg width="24" height="12" viewBox="0 0 24 12" style={{ display: 'block' }}>
                            <line x1="2" y1="10" x2="22" y2="2" stroke={PLANNING_STATUS_COLORS.plannedAnchorage} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#444' }}>Vùng neo quy hoạch</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    type={legendOpen ? 'primary' : 'default'}
                    shape="circle"
                    icon={<InfoCircleOutlined style={{ fontSize: fontSizeLg }} />}
                    onClick={() => setLegendOpen(!legendOpen)}
                    style={{
                      width: controlHeight,
                      height: controlHeight,
                      boxShadow: shadowMd,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: legendOpen ? actionPrimary : surfaceCard,
                      color: legendOpen ? surfaceCard : actionPrimary,
                      border: `1px solid ${borderDefault}`,
                    }}
                  />
                </div>
              )}


              {saveModalOpen && (
                <DrawSaveModal
                  open={saveModalOpen}
                  drawResult={pendingDrawResult}
                  editRecord={editingCustomGisRecord}
                  onClose={() => {
                    setSaveModalOpen(false);
                    setPendingDrawResult(null);
                    setEditingCustomGisRecord(null);
                    if ((window as any).clearDrawnShape) {
                      (window as any).clearDrawnShape();
                    }
                  }}
                  onSaved={() => {
                    setSaveModalOpen(false);
                    setPendingDrawResult(null);
                    setEditingCustomGisRecord(null);
                    if ((window as any).clearDrawnShape) {
                      (window as any).clearDrawnShape();
                    }
                    // Reload active GIS features in map viewport
                    if (fetchFeaturesInViewportRef.current) {
                      void fetchFeaturesInViewportRef.current();
                    }
                    // Reload custom GIS features
                    if (fetchCustomGisFeaturesRef.current) {
                      void fetchCustomGisFeaturesRef.current();
                    }
                  }}
                  onRedraw={(type) => {
                    if ((window as any).clearDrawnShape) {
                      (window as any).clearDrawnShape();
                    }
                    const pm = (mapRef.current as any)?.pm;
                    if (pm) {
                      pm.disableDraw();
                      if (type === 'draw-point') pm.enableDraw('Marker');
                      else if (type === 'draw-line') pm.enableDraw('Line');
                      else if (type === 'draw-polygon') pm.enableDraw('Polygon');
                    }
                  }}
                />
              )}
              {/* Overlay Grid Button (AppstoreOutlined) */}
              <Button
                type="primary"
                icon={<AppstoreOutlined style={{ fontSize: fontSizeLg }} />}
                onClick={() => setDrawerVisible(true)}
                style={{
                  position: 'absolute',
                  top: spaceSm,
                  right: spaceSm,
                  zIndex: 1000,
                  width: controlHeight,
                  height: controlHeight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: shadowMd,
                  backgroundColor: actionPrimary,
                  borderRadius: radiusMd,
                }}
              />
              {/* Floating Search Button when panel is hidden */}
              {!searchPanelVisible && (
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => setSearchPanelVisible(true)}
                  style={{
                    ...primaryButtonStyle,
                    position: 'absolute',
                    top: spaceSm,
                    left: controlHeight + spaceMd,
                    zIndex: 1000,
                    boxShadow: shadowMd,
                  }}
                >
                  Tìm kiếm
                </Button>
              )}
        </div>
      </div>

        {/* Sidebar panels */}
        {searchPanelVisible && (
          <div
            className="gis-search-panel"
            style={{
              position: 'absolute',
              inset: '0 auto 0 0',
              zIndex: 1,
              width: searchPanelWidth,
              maxWidth: '100%',
              display: 'flex',
              overflow: 'hidden',
              background: surfacePage,
              boxShadow: shadowLg,
            }}
          >
                    <div style={{
                      display: 'grid',
                      gridTemplateRows: 'auto minmax(0, 1fr)',
                      height: '100%',
                      minHeight: 0,
                      overflow: 'hidden',
                      width: '100%',
                      maxWidth: '100%',
                      minWidth: 0,
                    }}>
                      <div style={{
                        flexShrink: 0,
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        padding: spaceMd,
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spaceMd }}>
                        <Typography.Title level={4} style={{ ...drawerTitleStyle, margin: 0 }}>
                          Tra cứu thông tin kết cấu hạ tầng hàng hải trên bản đồ
                        </Typography.Title>
                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => setSearchPanelVisible(false)}
                          style={drawerCloseBtnStyle}
                          title="Đóng"
                        />
                      </div>
                      <Form
                        form={searchForm}
                        layout="vertical"
                        onFinish={() => void handleSearchInfrastructure(1, searchPageSize)}
                        initialValues={{ orgUnitId: '__all__', kchtType: urlKchtType, province: urlProvince || undefined, search: urlSearch, objectType: undefined }}
                        style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}
                      >
                        <Form.Item name="orgUnitId" label={<span style={filterLabelStyle}>Đơn vị quản lý</span>} style={formFieldStyle}>
                        <OrgUnitTreeSelect
                          organizations={orgUnits}
                          placeholder="Chọn đơn vị quản lý..."
                          allLabel="Tất cả đơn vị"
                          showPath
                          showSearch
                          allowClear
                          treeDefaultExpandAll={false}
                          listHeight={256}
                          style={{ ...selectStyle, width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item name="kchtType" label={<span style={filterLabelStyle}>Loại kết cấu hạ tầng</span>} style={formFieldStyle}>
                        <Select
                          mode="multiple"
                          showSearch
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                          placeholder="Chọn loại kết cấu..."
                          style={selectStyle}
                          options={KCHT_GIS_TYPE_OPTIONS}
                        />
                      </Form.Item>

                      <Form.Item name="province" label={<span style={filterLabelStyle}>Địa điểm (Tỉnh/Thành phố)</span>} style={formFieldStyle}>
                        <Select
                          showSearch
                          placeholder="Chọn tỉnh/thành phố..."
                          style={selectStyle}
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                          options={VIETNAM_PROVINCE_OPTIONS}
                        />
                      </Form.Item>

                      <div style={{ display: showAdvancedSearch ? 'block' : 'none' }}>
                        <Form.Item name="search" label={<span style={filterLabelStyle}>Kết cấu hạ tầng</span>} style={formFieldStyle}>
                          <Input
                            placeholder="Kết cấu hạ tầng"
                            maxLength={255}
                            suffix={
                              <span style={{ fontSize: fontSizeSm, color: textTertiary }}>
                                {searchVal.length} / 255
                              </span>
                            }
                            allowClear
                            style={inputStyle}
                          />
                        </Form.Item>

                        <Form.Item name="objectType" label={<span style={filterLabelStyle}>Loại đối tượng</span>} style={formFieldStyle}>
                          <Select
                            placeholder="Tất cả loại đối tượng"
                            allowClear
                            style={selectStyle}
                            options={[
                              { value: 'POINT', label: 'Đối tượng điểm' },
                              { value: 'LINE', label: 'Đối tượng đường' },
                              { value: 'POLYGON', label: 'Đối tượng vùng' }
                            ]}
                          />
                        </Form.Item>
                      </div>

                      <div style={{ display: 'flex', gap: spaceSm, justifyContent: 'center', alignItems: 'center', marginTop: spaceMd }}>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => {
                            hasSearchedRef.current = false;
                            setHasSearched(false);
                            setSearchError(undefined);
                            setSearchPage(1);
                            searchForm.resetFields();
                            setInfrastructureResults([]);
                            setTotalSearchElements(0);
                            setSelectedRowKeys([]);
                            if (searchMarkersGroupRef.current) {
                              searchMarkersGroupRef.current.clearLayers();
                            }
                            if (searchVertexMarkersGroupRef.current) {
                              searchVertexMarkersGroupRef.current.clearLayers();
                            }
                          }}
                          shape="circle"
                          title="Đặt lại bộ lọc"
                          aria-label="Đặt lại bộ lọc"
                          style={{
                            color: textSecondary,
                            borderColor: borderDefault,
                            width: 38,
                            height: 38,
                            fontSize: fontSizeMd,
                            flexShrink: 0,
                          }}
                        />
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SearchOutlined />}
                          loading={searchingInfrastructure}
                          style={{
                            ...primaryButtonStyle,
                            flex: '0 0 auto',
                            paddingInline: spaceMd,
                          }}
                        >
                          Tìm kiếm
                        </Button>
                        <Button 
                          icon={<FilterOutlined />}
                          onClick={() => setShowAdvancedSearch(prev => !prev)}
                          shape="circle"
                          title={showAdvancedSearch ? 'Thu gọn bộ lọc nâng cao' : 'Mở rộng bộ lọc nâng cao'}
                          aria-label={showAdvancedSearch ? 'Thu gọn bộ lọc nâng cao' : 'Mở rộng bộ lọc nâng cao'}
                          style={{
                            color: showAdvancedSearch ? actionPrimary : textSecondary,
                            borderColor: showAdvancedSearch ? actionPrimary : borderDefault,
                            width: 38,
                            height: 38,
                            fontSize: fontSizeMd,
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    </Form>

                      </div>
                      <div
                        ref={tableWrapperRef}
                        style={{
                          ...cardStyle,
                          minHeight: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          margin: `0 ${spaceMd}px ${spaceMd}px`,
                          padding: spaceSm,
                          overflow: 'hidden',
                          '--list-table-scroll-y': `${tableHeight}px`,
                        } as React.CSSProperties}
                      >
                        {searchError ? (
                          <ErrorState message={searchError} onRetry={() => void handleSearchInfrastructure(searchPage, searchPageSize)} />
                        ) : (
                          <>
                            <DataTable
                              columns={infrastructureColumns}
                              dataSource={infrastructureResults}
                              rowKey="id"
                              loading={searchingInfrastructure}
                              dense
                              fill
                              scroll={{ x: 'max-content', y: tableHeight }}
                              emptyState={<EmptyState description={hasSearched ? 'Không tìm thấy kết cấu hạ tầng phù hợp' : 'Nhập điều kiện và chọn Tìm kiếm'} />}
                              rowSelection={{
                                columnWidth: 44,
                                selectedRowKeys,
                                onChange: (keys: React.Key[]) => {
                                  const hasNewSelection = keys.some((key) => !selectedRowKeys.includes(key));
                                  setSelectedRowKeys(keys);
                                  if (hasNewSelection && screens.md === false) {
                                    setSearchPanelVisible(false);
                                  }
                                },
                              }}
                              onRow={(record: KchtGisSearchResult) => ({
                                onClick: () => void handleRowClick(record),
                              })}
                            />
                            <div
                              data-gis-pagination
                              style={{
                                flex: '0 0 auto',
                                paddingTop: spaceLg,
                                background: surfaceCard,
                              }}
                            >
                              <Pagination
                                total={totalSearchElements}
                                current={searchPage}
                                pageSize={searchPageSize}
                                onChange={(page, pageSize) => void handleSearchInfrastructure(page, pageSize)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                {/*
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
  
                        <Collapse 
                          size="small" 
                          bordered={false} 
                          style={{ marginBottom: 16 }}
                          items={[
                            {
                              key: '1',
                              label: 'Sai số hiệu chuẩn (Calibration offset)',
                              children: (
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
                              )
                            }
                          ]}
                        />
  
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
                */}
        </div>
        )}

      {/* Drawer for Map Layer Management */}
      <Drawer
        closable={drawerProps.closable}
        push={drawerProps.push}
        styles={drawerProps.styles}
        size={screens.md ? 420 : '100%'}
        title={
          <span style={drawerTitleStyle}>
            Quản lý lớp bản đồ
          </span>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Button type="text" onClick={() => setDrawerVisible(false)} style={drawerCloseBtnStyle}>
            ✕
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={spaceMd}>
          <div>
            <Typography.Text style={{ display: 'block', marginBottom: spaceSm, fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
              Bản đồ nền
            </Typography.Text>
            <Radio.Group
              value={activeBaseMap}
              onChange={(event) => setActiveBaseMap(event.target.value)}
              style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}
            >
              {BASE_MAP_OPTIONS.map((option) => (
                <Radio key={option.value} value={option.value}>
                  <Space size={spaceSm} style={{ fontSize: fontSizeMd, color: textPrimary }}>
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </Space>
                </Radio>
              ))}
            </Radio.Group>
          </div>

          <div>
            <Typography.Text style={{ display: 'block', marginBottom: spaceSm, fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
              Lớp dữ liệu (Overlay)
            </Typography.Text>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
              <Checkbox 
                checked={showChart}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowChart(checked);
                  const next: Record<string, boolean> = {};
                  uniqueFeatureCodes.forEach(code => {
                    next[code] = checked;
                  });
                  setVisibleLayers(next);
                }}
              >
                <Space size={spaceXs} style={{ fontSize: fontSizeMd, color: textPrimary }}>
                  <span>🗺️</span>
                  <span>ENC - Hải đồ điện tử</span>
                </Space>
              </Checkbox>

              <Checkbox 
                checked={showPlanning}
                onChange={(e) => setShowPlanning(e.target.checked)}
              >
                <Space size={spaceXs} style={{ fontSize: fontSizeMd, color: textPrimary }}>
                  <span>🏢</span>
                  <span>QHCB - Quy hoạch cảng biển</span>
                </Space>
              </Checkbox>
            </div>
          </div>

          <Typography.Text style={{ display: 'block', fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
            Chi tiết Hải đồ (Lọc theo lớp)
          </Typography.Text>

          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {ENC_LAYER_DETAILS.map(({ code, label, icon }) => {
              const isChecked = visibleLayers[code] ?? false;

              return (
                <div key={code} style={{ padding: `${spaceXs}px 0`, display: 'flex', alignItems: 'center' }}>
                  <Checkbox 
                    checked={isChecked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleToggleLayer(code, checked);
                      if (checked) {
                        setShowChart(true);
                      }
                    }}
                  >
                    <Space size={spaceSm} style={{ fontSize: fontSizeMd, color: textPrimary }}>
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

      <Modal
        open={!!activeModalUrl}
        footer={null}
        onCancel={() => setActiveModalUrl(null)}
        width={850}
        destroyOnHidden
        className="kcht-detail-modal"
        style={{ top: 30 }}
        styles={{
          body: { padding: 0, height: 'calc(100vh - 140px)', overflow: 'hidden' },
        }}
      >
        {activeModalUrl && (
          <iframe
            src={activeModalUrl}
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
            onLoad={handleIframeLoad}
          />
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .kcht-detail-modal .ant-modal-close {
          top: 6px;
          right: 24px;
          z-index: 10;
          background: #fff;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .kcht-detail-modal .ant-modal-close:hover {
          background: #f5f5f5;
        }
        .gis-kcht-click-target-wrapper {
          background: transparent;
          border: 0;
        }
        .gis-kcht-click-target {
          align-items: center;
          background: var(--color-primary);
          border: 2px solid var(--bg-container);
          border-radius: 999px;
          box-shadow: var(--shadow-card-hover);
          box-sizing: border-box;
          cursor: pointer;
          display: flex;
          height: 24px;
          justify-content: center;
          width: 24px;
        }
      `}} />
    </div>
  );
}

function DescriptionsPanel({ feature }: { feature: ChartFeature }) {
  const { featureName, featureCode, geometryType, coordinates, attributes } = feature;
  return (
    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
      <Typography.Paragraph style={{ marginBottom: spaceXs, color: textPrimary, fontSize: fontSizeMd }}>
        <strong style={{ color: colors.sidebarBg }}>Tên:</strong> {getFeatureNameVi(featureCode, featureName)}
      </Typography.Paragraph>
      <Typography.Paragraph style={{ marginBottom: spaceXs, color: textPrimary, fontSize: fontSizeMd }}>
        <strong style={{ color: colors.sidebarBg }}>Mã đối tượng:</strong>{' '}
        <span style={{
          display: 'inline-flex',
          padding: `${spaceXs}px ${spaceSm}px`,
          border: `1px solid ${actionPrimary}40`,
          borderRadius: radiusPill,
          fontSize: fontSizeSm,
          fontWeight: fontWeightMedium,
          background: `${actionPrimary}15`,
          color: actionPrimary,
        }}>{featureCode}</span>
      </Typography.Paragraph>
      <Typography.Paragraph style={{ marginBottom: spaceXs, color: textPrimary, fontSize: fontSizeMd }}>
        <strong style={{ color: colors.sidebarBg }}>Kiểu hình học:</strong> <code>{geometryType}</code>
      </Typography.Paragraph>
      <Typography.Paragraph style={{ marginBottom: spaceSm, fontSize: fontSizeSm, color: textTertiary }}>
        <strong style={{ color: textSecondary }}>Tọa độ:</strong> <code>{coordinates.length > 50 ? `${coordinates.substring(0, 50)}...` : coordinates}</code>
      </Typography.Paragraph>

      <Typography.Text strong style={{ display: 'block', marginBottom: spaceXs, color: colors.sidebarBg, fontSize: fontSizeMd }}>
        Thuộc tính S-57:
      </Typography.Text>
      {attributes && Object.keys(attributes).length > 0 ? (
        <List
          size="small"
          bordered
          style={{ borderColor: borderDefault, borderRadius: radiusSm }}
          dataSource={Object.entries(attributes)}
          renderItem={([key, val]) => (
            <List.Item style={{ padding: `${spaceXs}px ${spaceSm}px`, fontSize: fontSizeSm, borderColor: borderDefault }}>
              <strong style={{ color: textSecondary }}>{key}:</strong> <span style={{ color: textPrimary }}>{String(val)}</span>
            </List.Item>
          )}
        />
      ) : (
        <Typography.Text type="secondary" italic style={{ fontSize: fontSizeSm, color: textTertiary }}>Không có thuộc tính</Typography.Text>
      )}
    </div>
  );
}
