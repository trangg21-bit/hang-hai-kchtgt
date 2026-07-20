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
  Cascader,
  Modal,
} from 'antd';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  CloseOutlined,
  CopyOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { chartService } from '../../services/chartService';
import type { ChartCell, ChartFeature } from '../../services/chartService';
import api from '../../services/api';
import {
  cangBienCRUD,
  benCangCRUD,
  cauCangCRUD,
  cangCanCRUD,
  vungNuocCRUD
} from '../../services/cangbenService';
import { beaconLightCRUD, buoyCRUD } from '../../services/beaconService';
import { fetchNhaTramDenById, fetchNhaTramPhaoById } from '../../services/nhatram/api';
import { dekeCRUD } from '../../services/deKeService';
import { luongHangHaiCRUD } from '../../services/luongHangHaiService';
import { tramRadarCRUD } from '../../services/tramRadarService';
import { heThongVTSCRUD } from '../../services/heThongVtsService';
import { coSuaChuaCRUD } from '../../services/coSuaChuaService';
import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import EmptyState from '../../components/EmptyState';
import Flatbush from 'flatbush';
import MapToolbar from '../../components/gis/MapToolbar';
import DrawSaveModal from '../../components/gis/DrawSaveModal';
import type { DrawResult } from '../../components/gis/DrawSaveModal';
import { pointObjectService } from '../../services/pointObjectService';
import { lineObjectService } from '../../services/lineObjectService';
import { polygonObjectService } from '../../services/polygonObjectService';

declare global {
  interface Window {
    L: any;
    handleKchtAction: (id: string, type: string, action: 'view' | 'edit') => void;
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

const resolveName = async (id: string, type: 'org' | 'cangbien' | 'bencang') => {
  if (!id) return '';
  if (resolvedNamesCache.has(id)) return resolvedNamesCache.get(id)!;
  try {
    let name = '';
    if (type === 'org') {
      const matched = orgUnitsGlobalCache.find(o => String(o.id) === String(id));
      name = matched ? matched.name : '';
      if (!name) {
        const org = await organizationService.getById(id);
        name = org.name;
      }
    } else if (type === 'cangbien') {
      const cb = await cangBienCRUD.findById(id);
      name = cb.tenCang;
    } else if (type === 'bencang') {
      const bc = await benCangCRUD.findById(id);
      name = bc.tenBen;
    }
    if (name) {
      resolvedNamesCache.set(id, name);
      return name;
    }
  } catch (err) {
    console.error(`Failed to resolve name for ID: ${id}`, err);
  }
  return id;
};

const getOrderedKeysAndLabels = (type: string): { key: string; label: string }[] => {
  const normType = type.trim();
  
  if (normType === 'Cảng biển') {
    return [
      { key: 'maCang', label: 'Mã cảng biển' },
      { key: 'tenCang', label: 'Tên cảng biển' },
      { key: 'tinhThanhPho', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'dienTich', label: 'Diện tích (ha)' },
      { key: 'khaNangTiepNhan', label: 'Khả năng tiếp nhận (tấn)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động' },
      { key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }
  
  if (normType === 'Bến cảng') {
    return [
      { key: 'maBen', label: 'Mã bến cảng' },
      { key: 'tenBen', label: 'Tên bến cảng' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'tinhThanhPho', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'diaDiemChiTiet', label: 'Địa điểm chi tiết' },
      { key: 'cangBienId', label: 'Thuộc cảng biển' },
      { key: 'luongHangHaiId', label: 'Thuộc luồng hàng hải' },
      { key: 'loaiKetCau', label: 'Loại kết cấu cầu cảng' },
      { key: 'congNangKhaiThac', label: 'Công năng khai thác' },
      { key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động' },
      { key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt' },
      { key: 'donViKhaiThac', label: 'Đơn vị khai thác' },
      { key: 'tongDienTich', label: 'Tổng diện tích (ha)' },
      { key: 'nangLucThongQuaThietKe', label: 'Năng lực thông qua thiết kế' },
      { key: 'nangLucThongQuaHienTrang', label: 'Năng lực thông qua hiện trạng (tấn/ năm)' },
      { key: 'coTauTiepNhanLonNhat', label: 'Cỡ tàu tiếp nhận lớn nhất theo quy hoạch (DWT)' },
      { key: 'quyHoachNangLucThongQua', label: 'Quy hoạch năng lực thông qua (tấn/ năm)' },
      { key: 'sanLuongHangHoaNamGanNhat', label: 'Sản lượng hàng hóa thực tế thông qua trong năm gần nhất' },
      { key: 'thoiDiemCongBoMo', label: 'Thời điểm công bố mở, đưa vào sử dụng' },
      { key: 'quyetDinhCongBo', label: 'Quyết định công bố/ Văn bản cho phép khai thác' },
      { key: 'vanBanThoaThuanDauTu', label: 'Văn bản thỏa thuận đầu tư xây dựng' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Cầu cảng') {
    return [
      { key: 'maCau', label: 'Mã cầu cảng' },
      { key: 'tenCau', label: 'Tên cầu cảng' },
      { key: 'loaiCau', label: 'Loại cầu cảng' },
      { key: 'congNangKhaiThac', label: 'Công năng khai thác' },
      { key: 'chieuDai', label: 'Chiều dài (m)' },
      { key: 'taiTrong', label: 'Trọng tải tiếp nhận (DWT)' },
      { key: 'benCangId', label: 'Thuộc bến cảng' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động' },
      { key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Cảng cạn') {
    return [
      { key: 'maCangCan', label: 'Mã cảng cạn' },
      { key: 'tenCangCan', label: 'Tên cảng cạn' },
      { key: 'viTri', label: 'Vị trí' },
      { key: 'dienTichDat', label: 'Diện tích đất (ha)' },
      { key: 'dienTichNuoc', label: 'Diện tích nước (ha)' },
      { key: 'nangLucThongQua', label: 'Năng lực thông qua' },
      { key: 'congSuatTEU', label: 'Công suất (TEU)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động' },
      { key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt' },
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
      { key: 'maVungNuoc', label: 'Mã vùng nước' },
      { key: 'tenVungNuoc', label: 'Tên vùng nước' },
      { key: 'loaiVungNuoc', label: 'Loại vùng nước' },
      { key: 'cangBienId', label: 'Thuộc cảng biển' },
      { key: 'chieuDaiVungNuoc', label: 'Chiều dài vùng nước (m)' },
      { key: 'chieuRongVungNuoc', label: 'Chiều rộng vùng nước (m)' },
      { key: 'doSauVungNuoc', label: 'Độ sâu vùng nước (m)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động' },
      { key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt' },
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
      { key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động' },
      { key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt' },
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
      { key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động' },
      { key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt' },
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
      { key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động' },
      { key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Hệ thống VTS') {
    return [
      { key: 'maHeThong', label: 'Mã hệ thống' },
      { key: 'tenHeThong', label: 'Tên hệ thống VTS' },
      { key: 'vtsCenter', label: 'Trung tâm VTS' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động' },
      { key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Cơ sở sửa chữa' || normType === 'Cơ sở sửa chữa/đóng tàu') {
    return [
      { key: 'maCoSo', label: 'Mã cơ sở' },
      { key: 'tenCoSo', label: 'Tên cơ sở đóng/sửa tàu' },
      { key: 'nangLucNang', label: 'Năng lực nâng (tấn)' },
      { key: 'kichThuocDoc', label: 'Kích thước đốc (m)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động' },
      { key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  return [];
};

const fetchAndFormatPopupDetails = async (record: any) => {
  const type = record.kchtTypeLabel || '';
  const id = record.id;
  
  const headerHtml = `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; min-width: 450px; padding: 4px;">
      <div style="max-height: 450px; overflow-y: auto; padding-right: 6px;">
        <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 13px; line-height: 1.5; color: #333;">
          <thead>
            <tr style="border-bottom: 1px solid #ccc;">
              <th style="text-align: left; padding: 10px 8px; font-weight: 600; width: 40%; color: #262626;">Thông tin</th>
              <th style="text-align: left; padding: 10px 8px; font-weight: 600; width: 60%; color: #262626;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span>Giá trị</span>
                  <div style="display: inline-flex; gap: 12px; align-items: center;">
                    <button onclick="window.handleKchtAction('${id}', '${type}', 'view')" title="Xem chi tiết" style="border: none; background: none; padding: 2px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; outline: none;">
                      <svg viewBox="0 0 24 24" width="16px" height="16px" fill="none" stroke="#722ed1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <button onclick="window.handleKchtAction('${id}', '${type}', 'edit')" title="Chỉnh sửa" style="border: none; background: none; padding: 2px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; outline: none;">
                      <svg viewBox="0 0 24 24" width="16px" height="16px" fill="none" stroke="#722ed1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
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
    if (s === 'HIEN_HANH' || s === 'ACTIVE') return 'Đang khai thác/vận hành';
    if (s === 'TAM_NGUNG' || s === 'INACTIVE') return 'Tạm ngừng';
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

  const getLoaiVungNuocText = (val?: string) => {
    if (!val) return '—';
    const v = val.toUpperCase();
    if (v === 'NEO_DAU') return 'Khu neo đậu';
    if (v === 'KIEM_DICH') return 'Khu kiểm dịch';
    if (v === 'DON_TRA_HOA_TIEU') return 'Khu đón trả hoa tiêu';
    if (v === 'QUAY_TRO_TAU') return 'Vùng quay trở tàu';
    if (v === 'BEN_PHAO') return 'Bến phao';
    if (v === 'CHUYEN_TAI') return 'Khu chuyển tải';
    if (v === 'TRANH_BAO') return 'Khu tránh trú bão';
    return val;
  };

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

  const tdLabelStyle = 'padding: 8px; border: 1px solid #f0f0f0; font-weight: 500; background: #fafafa; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;';
  const tdValStyle = 'padding: 8px; border: 1px solid #f0f0f0; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;';

  const KEY_LABELS: Record<string, string> = {
    // Common
    id: 'ID',
    code: 'Mã',
    ma: 'Mã',
    name: 'Tên',
    ten: 'Tên',
    orgName: 'Đơn vị quản lý',
    orgUnitName: 'Đơn vị quản lý',
    kchtTypeLabel: 'Loại KCHT',
    diaDiem: 'Địa điểm',
    diaChiChiTiet: 'Địa chỉ chi tiết',
    diaDiemChiTiet: 'Địa điểm chi tiết',
    latitude: 'Vĩ độ',
    longitude: 'Kinh độ',
    viDo: 'Vĩ độ',
    kinhDo: 'Kinh độ',
    createdAt: 'Ngày tạo',
    updatedAt: 'Ngày cập nhật',
    createdBy: 'Người tạo',
    updatedBy: 'Người cập nhật',
    ngayCapNhat: 'Ngày cập nhật',
    canBoCapNhat: 'Cán bộ cập nhật',
    trangThaiHoatDong: 'Trạng thái hoạt động',
    trangThaiPheDuyet: 'Trạng thái phê duyệt',
    tinhThanhPho: 'Tỉnh / Thành phố',
    tinhThanh: 'Tỉnh / Thành phố',
    orgUnitId: 'Đơn vị quản lý',
    donViId: 'Đơn vị quản lý',
    unitId: 'Đơn vị quản lý',
    donViQuanLy: 'Đơn vị quản lý',
    cangBienId: 'Thuộc cảng biển',
    tenCangBien: 'Thuộc cảng biển',
    benCangId: 'Thuộc bến cảng',
    tenBenCang: 'Thuộc bến cảng',
    loaiHinhHoc: 'Loại hình học',
    geomType: 'Loại hình học',

    // Cầu cảng
    maCau: 'Mã cầu cảng',
    tenCau: 'Tên cầu cảng',
    loaiCau: 'Loại cầu cảng',
    congNangKhaiThac: 'Công năng khai thác',
    tenBenCang: 'Thuộc bến cảng',
    chieuDai: 'Chiều dài (m)',

    // Cảng biển
    maCang: 'Mã cảng biển',
    tenCang: 'Tên cảng biển',
    nhomCangBien: 'Nhóm cảng biển',
    dienTich: 'Diện tích (ha)',
    khaNangTiepNhan: 'Khả năng tiếp nhận (tấn)',

    // Bến cảng
    maBen: 'Mã bến cảng',
    tenBen: 'Tên bến cảng',
    tuyenDuongThuy: 'Tuyến đường thủy',
    chieuRong: 'Chiều rộng (m)',
    loaiBen: 'Loại bến',
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
    loaiKetCau: 'Loại kết cấu cầu cảng',
    tinhThanhPho: 'Địa điểm (Tỉnh/ Thành phố)',
    diaDiemChiTiet: 'Địa điểm chi tiết',
    luongHangHaiId: 'Thuộc luồng hàng hải',

    // Cảng cạn
    maCangCan: 'Mã cảng cạn',
    tenCangCan: 'Tên cảng cạn',
    congSuatTEU: 'Công suất (TEU)',

    // Vùng nước
    maVungNuoc: 'Mã vùng nước',
    tenVungNuoc: 'Tên vùng nước',
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
    tenHeThong: 'Tên hệ thống VTS',
    vtsCenter: 'Trung tâm VTS',

    // Cơ sở đóng sửa tàu
    maCoSo: 'Mã cơ sở',
    tenCoSo: 'Tên cơ sở đóng/sửa tàu',
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
    soLuongBenPhao: 'Số lượng bến phao',
    soLuongKhuNeoDau: 'Số lượng khu neo đậu',
    soLuongKhuChuyenTai: 'Số lượng khu chuyển tải',
    cacKhuNuocKhac: 'Các khu nước khác',
    ghiChu: 'Ghi chú',
  };

  try {
    let rowsHtml = '';
    let data: any = null;
    let displayType = type;

    if (type === 'Cầu cảng') {
      data = await cauCangCRUD.findById(id);
    } else if (type === 'Cảng biển') {
      data = await cangBienCRUD.findById(id);
    } else if (type === 'Bến cảng') {
      data = await benCangCRUD.findById(id);
    } else if (type === 'Cảng cạn') {
      data = await cangCanCRUD.findById(id);
    } else if (
      type === 'Vùng nước' ||
      type === 'Khu neo đậu' ||
      type === 'Khu chuyển tải' ||
      type === 'Khu tránh trú bão' ||
      type === 'Khu tránh, trú bão' ||
      type === 'Bến phao'
    ) {
      data = await vungNuocCRUD.findById(id);
    } else if (type === 'Đèn biển') {
      data = await beaconLightCRUD.findById(id);
    } else if (type === 'Nhà trạm đèn biển') {
      data = await fetchNhaTramDenById(id);
      displayType = 'Đèn biển';
    } else if (type === 'Phao tiêu' || type === 'Phao, tiêu') {
      data = await buoyCRUD.findById(id);
      displayType = 'Phao tiêu';
    } else if (type === 'Nhà trạm phao tiêu') {
      data = await fetchNhaTramPhaoById(id);
      displayType = 'Phao tiêu';
    } else if (type === 'Đê kè') {
      data = await dekeCRUD.getById(id);
    } else if (type === 'Luồng hàng hải') {
      data = await luongHangHaiCRUD.getById(id);
    } else if (type === 'Trạm radar') {
      data = await tramRadarCRUD.getById(id);
    } else if (type === 'Hệ thống VTS') {
      data = await heThongVTSCRUD.getById(id);
    } else if (type === 'Cơ sở sửa chữa' || type === 'Cơ sở sửa chữa/đóng tàu') {
      data = await coSuaChuaCRUD.getById(id);
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
      
      const orgId = data.orgUnitId || data.donViId || data.unitId || data.donViQuanLy || data.unitId;
      if (orgId) {
        orgUnitNameResolved = data.donViQuanLy || data.orgName || data.orgUnitName || await resolveName(orgId, 'org');
      }
      if (data.cangBienId || data.tenCangBien) {
        cangBienNameResolved = data.tenCangBien || (data.cangBienId ? await resolveName(data.cangBienId, 'cangbien') : '');
      }
      if (data.benCangId || data.tenBenCang) {
        benCangNameResolved = data.tenBenCang || (data.benCangId ? await resolveName(data.benCangId, 'bencang') : '');
      }

      if (customOrdered.length > 0) {
        customOrdered.forEach(({ key: k, label }) => {
          const valExists = data[k] !== undefined && data[k] !== null && data[k] !== '';
          let val = valExists ? data[k] : '';
          
          if (['orgUnitId', 'donViId', 'unitId', 'donViQuanLy', 'unitId', 'unitName'].includes(k)) {
            val = orgUnitNameResolved || val;
          } else if (k === 'cangBienId') {
            val = cangBienNameResolved || val;
          } else if (k === 'benCangId') {
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
            if (k === 'trangThaiHoatDong' || k === 'tinhTrang' || k === 'isActive') {
              val = getStatusText(k === 'isActive' ? (val ? 'ACTIVE' : 'INACTIVE') : val);
            }
            if (k === 'trangThaiPheDuyet' || k === 'trangThai' || k === 'status' || k === 'approvalStatus') {
              val = getApprovalStatusText(val);
            }
            if (k === 'loaiVungNuoc') val = getLoaiVungNuocText(val);
            if (k === 'loaiHinhHoc' || k === 'geomType') val = getGeometryTypeText(val);
            if (k === 'loaiBen') val = getLoaiBenText(val);
            if (k === 'loaiCau') val = getLoaiCauText(val);
            if (k === 'thoiDiemCongBoMo') val = formatDate(val);
          }
          
          rowsHtml += `<tr><td style="${tdLabelStyle}">${label}:</td><td style="${tdValStyle}">${formatVal(val)}</td></tr>`;
          renderedKeys.add(k);
        });
      } else {
        const orderedKeys = [
          'ma', 'maCang', 'maBen', 'maCau', 'maVungNuoc', 'maDeKe', 'maLuong', 'maTram', 'maHeThong', 'maCoSo', 'code', 'beaconCode', 'buoyCode',
          'name', 'ten', 'tenCang', 'tenBen', 'tenCau', 'tenVungNuoc', 'tenDeKe', 'tenLuong', 'tenTram', 'tenHeThong', 'tenCoSo', 'beaconName', 'buoyName',
          'orgName', 'orgUnitName', 'donViQuanLy', 'orgUnitId', 'donViId', 'unitId',
          'cangBienId', 'tenCangBien', 'benCangId', 'tenBenCang',
          'tinhThanh', 'tinhThanhPho', 'diaDiem', 'diaChiChiTiet', 'diaDiemChiTiet',
          'trangThaiHoatDong', 'status', 'tinhTrang',
          'trangThaiPheDuyet', 'trangThai',
          'loaiHinhHoc', 'geomType',
        ];
        
        orderedKeys.forEach(k => {
          const valExists = data[k] !== undefined && data[k] !== null && data[k] !== '';
          if (valExists) {
            const label = KEY_LABELS[k] || k;
            let val = data[k];
            
            if (['orgUnitId', 'donViId', 'unitId', 'donViQuanLy'].includes(k)) {
              val = orgUnitNameResolved || val;
            } else if (k === 'cangBienId') {
              val = cangBienNameResolved || val;
            } else if (k === 'benCangId') {
              val = benCangNameResolved || val;
            }
            
            if (k === 'trangThaiHoatDong' || k === 'tinhTrang' || k === 'isActive') val = getStatusText(val);
            if (k === 'trangThaiPheDuyet' || k === 'trangThai' || k === 'status' || k === 'approvalStatus') val = getApprovalStatusText(val);
            if (k === 'loaiVungNuoc') val = getLoaiVungNuocText(val);
            if (k === 'loaiHinhHoc' || k === 'geomType') val = getGeometryTypeText(val);
            if (k === 'loaiBen') val = getLoaiBenText(val);
            if (k === 'loaiCau') val = getLoaiCauText(val);
            if (k === 'thoiDiemCongBoMo') val = formatDate(val);
            
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
          lowerK === 'bieutuongid' || lowerK === 'iconid' ||
          lowerK === 'symbolid' || lowerK === 'khonggianid' || lowerK === 'spatialid' || lowerK === 'deletedat' ||
          lowerK === 'tencangbien' || lowerK === 'tenbencang' || lowerK === 'orgname' ||
          lowerK === 'orgunitname' || lowerK === 'parentorgname' || lowerK === 'donviid' ||
          lowerK === 'unitid' || lowerK === 'orgunitid' || lowerK === 'cangbienid' ||
          lowerK === 'bencangid' || lowerK === 'donviquanly' || lowerK === 'updatedat' ||
          lowerK === 'updatedby' || lowerK === 'canbocapnhat' || lowerK === 'ngaycapnhat'
        ) {
          return;
        }

        if (val !== undefined && val !== null && val !== '') {
          const label = KEY_LABELS[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          let displayVal = val;
          if (['orgUnitId', 'donViId', 'unitId', 'donViQuanLy'].includes(k)) {
            displayVal = orgUnitNameResolved || val;
          } else if (k === 'cangBienId') {
            displayVal = cangBienNameResolved || val;
          } else if (k === 'benCangId') {
            displayVal = benCangNameResolved || val;
          }
          if (k === 'type') {
            if (displayType === 'Đèn biển') {
              displayVal = getBeaconLightTypeText(val);
            } else if (displayType === 'Phao tiêu') {
              displayVal = getBuoyTypeText(val);
            }
          }
          if (k === 'trangThaiHoatDong' || k === 'tinhTrang' || k === 'isActive') displayVal = getStatusText(val);
          if (k === 'trangThaiPheDuyet' || k === 'trangThai' || k === 'status' || k === 'approvalStatus') displayVal = getApprovalStatusText(val);
          if (k === 'loaiVungNuoc') displayVal = getLoaiVungNuocText(val);
          if (k === 'loaiHinhHoc' || k === 'geomType') displayVal = getGeometryTypeText(val);
          if (k === 'loaiBen') displayVal = getLoaiBenText(val);
          if (k === 'loaiCau') displayVal = getLoaiCauText(val);

          rowsHtml += `<tr><td style="${tdLabelStyle}">${label}:</td><td style="${tdValStyle}">${formatVal(displayVal)}</td></tr>`;
        }
      });

      if (data.updatedAt || data.ngayCapNhat) {
        const updateDate = data.updatedAt || data.ngayCapNhat;
        rowsHtml += `<tr><td style="${tdLabelStyle}">Ngày cập nhật:</td><td style="${tdValStyle}">${formatDateTime(updateDate)}</td></tr>`;
      }
      if (data.updatedBy || data.canBoCapNhat) {
        const updater = data.updatedBy || data.canBoCapNhat;
        rowsHtml += `<tr><td style="${tdLabelStyle}">Cán bộ cập nhật:</td><td style="${tdValStyle}">${formatVal(updater)}</td></tr>`;
      }
    } else {
      // Fallback
      rowsHtml += `
        <tr><td style="${tdLabelStyle}">Tên kết cấu:</td><td style="${tdValStyle}">${formatVal(record.name)}</td></tr>
        <tr><td style="${tdLabelStyle}">Mã kết cấu:</td><td style="${tdValStyle}">${formatVal(record.ma)}</td></tr>
        <tr><td style="${tdLabelStyle}">Loại KCHT:</td><td style="${tdValStyle}">${formatVal(record.kchtTypeLabel)}</td></tr>
        <tr><td style="${tdLabelStyle}">Đơn vị quản lý:</td><td style="${tdValStyle}">${formatVal(record.orgName)}</td></tr>
        <tr><td style="${tdLabelStyle}">Địa điểm:</td><td style="${tdValStyle}">${formatVal(record.diaDiem)}</td></tr>
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

const parseWktToLatLngs = (wkt: string, geomType: string): [number, number][] => {
  if (!wkt) return [];
  try {
    const type = (geomType || '').toUpperCase();
    if (type === 'POINT' && wkt.startsWith('POINT(')) {
      const match = wkt.match(/POINT\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(' ');
        return [[parseFloat(parts[1]), parseFloat(parts[0])]];
      }
    } else if ((type === 'LINE' || type === 'POLYLINE') && wkt.startsWith('LINESTRING(')) {
      const match = wkt.match(/LINESTRING\(([^)]+)\)/);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(' ');
          return [parseFloat(parts[1]), parseFloat(parts[0])];
        });
      }
    } else if ((type === 'POLYGON' || type === 'AREA') && wkt.startsWith('POLYGON((')) {
      const match = wkt.match(/POLYGON\(\(([^)]+)\)\)/);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(' ');
          return [parseFloat(parts[1]), parseFloat(parts[0])];
        });
      }
    }
  } catch (err) {
    console.error('Failed to parse WKT', wkt, err);
  }
  return [];
};

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

const buildTreeData = (items: any[]): any[] => {
  const itemMap = new Map<string, any>();
  const roots: any[] = [];

  // Create initial nodes
  items.forEach(item => {
    itemMap.set(item.id, {
      value: item.id,
      label: item.code ? `${item.code} - ${item.name}` : item.name,
      parentId: item.parentId,
      children: []
    });
  });

  // Link children
  items.forEach(item => {
    const mapped = itemMap.get(item.id);
    if (item.parentId && itemMap.has(item.parentId)) {
      const parent = itemMap.get(item.parentId);
      parent.children.push(mapped);
    } else {
      roots.push(mapped);
    }
  });

  // Clean up empty children and add "---Tất cả---" to nodes with children
  const processNodes = (nodes: any[]) => {
    nodes.forEach(node => {
      if (node.children.length === 0) {
        delete node.children;
      } else {
        // Prepend "---Tất cả---" option to children list
        node.children.unshift({
          value: node.value,
          label: '---Tất cả---'
        });
        // Process original children recursively
        processNodes(node.children.filter((n: any) => n.parentId !== undefined));
      }
    });
  };
  processNodes(roots);

  return roots;
};

export default function GISChartView() {
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

      // Also skip closing if the pathname includes an ID segment (e.g. /beacons/123)
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length >= 2) {
        return;
      }

      const isListPage = [
        '/tram-radar',
        '/de-ke',
        '/luong-hang-hai',
        '/he-thong-vts',
        '/co-so-sua-chua',
        '/beacons',
        '/buoys',
        '/cangbien',
        '/bencang',
        '/caucang',
        '/cangcan',
        '/vungnuoc'
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
      if (label === 'nhà trạm đèn biển' || label === 'nha tram den bien') {
        path = `/nhatram/den?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label === 'nhà trạm phao tiêu' || label === 'nha tram phao tieu') {
        path = `/nhatram/phao?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('đèn biển') || label.includes('den bien')) {
        path = `/beacons/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('phao tiêu') || label.includes('phao tieu') || label.includes('phao, tiêu')) {
        path = `/buoys/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('cảng biển') || label.includes('cang bien')) {
        path = `/cangbien?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('bến cảng') || label.includes('ben cang')) {
        path = `/bencang?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('cầu cảng') || label.includes('cau cang')) {
        path = `/caucang?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('cảng cạn') || label.includes('cang can')) {
        path = `/cangcan?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (
        label.includes('vùng nước') || label.includes('vung nuoc') ||
        label.includes('khu neo đậu') || label.includes('khu neo dau') ||
        label.includes('khu chuyển tải') || label.includes('khu chuyen tai') ||
        label.includes('tránh, trú bão') || label.includes('tránh trú bão') || label.includes('tranh tru bao') ||
        label.includes('bến phao') || label.includes('ben phao')
      ) {
        path = `/vungnuoc?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('luồng hàng hải') || label.includes('luong hang hai')) {
        path = `/luong-hang-hai/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('đê') || label.includes('kè') || label.includes('de') || label.includes('ke')) {
        path = `/de-ke/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('cơ sở sửa chữa') || label.includes('co so sua chua')) {
        path = `/co-so-sua-chua/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('radar')) {
        path = `/tram-radar/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('hệ thống vts') || label.includes('he thong vts')) {
        path = `/he-thong-vts/${id}${action === 'edit' ? '?mode=edit' : ''}`;
      } else if (label.includes('đài ttdh') || label.includes('dai ttdh') || label.includes('đài duyên hải') || label.includes('dai duyen hai') || label.includes('hải phòng') || label.includes('hà nội') || label.includes('haiphong')) {
        path = `/station/coastal?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
      } else if (label.includes('inmarsat') || label.includes('cospas') || label.includes('lrit') || label.includes('vệ tinh')) {
        path = `/station/special?action=${action === 'edit' ? 'edit' : 'detail'}&id=${id}`;
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
  const urlKchtType = searchParams.get('kchtType') ? searchParams.get('kchtType')!.split(',') : [];
  const urlSearch = searchParams.get('search') || '';

  // Infrastructure Search States
  const [searchForm] = Form.useForm();
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const selectedKchtType = Form.useWatch('kchtType', searchForm);
  const searchVal = Form.useWatch('search', searchForm) || '';
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const treeOptions = useMemo(() => {
    return [
      { value: 'all', label: '---Tất cả---' },
      ...buildTreeData(orgUnits)
    ];
  }, [orgUnits]);
  const [searchingInfrastructure, setSearchingInfrastructure] = useState(false);
  const [infrastructureResults, setInfrastructureResults] = useState<any[]>([]);
  const [totalSearchElements, setTotalSearchElements] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchPageSize, setSearchPageSize] = useState(20);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchPanelVisible, setSearchPanelVisible] = useState(true);
  const [tableHeight, setTableHeight] = useState(350);
  const [showPlanning, setShowPlanning] = useState(false);
  const [planningFeatures, setPlanningFeatures] = useState<any[]>([]);

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
        // Subtract ~55px for the table header row and horizontal scrollbar to prevent clipping
        const available = entry.contentRect.height - 55;
        setTableHeight(Math.max(100, Math.floor(available)));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000 });
      setSymbols(res.data || []);
    } catch (err) {
      console.error('Failed to load symbols in map', err);
    }
  }, []);

  const handleSearchInfrastructure = useCallback(async () => {
    setSearchingInfrastructure(true);
    setSelectedRowKeys([]);
    try {
      const values = searchForm.getFieldsValue();
      const orgUnitValue = !values ? undefined : values.orgUnitId;
      const selectedOrgId = Array.isArray(orgUnitValue) ? orgUnitValue[orgUnitValue.length - 1] : orgUnitValue;
      const orgUnitId = !selectedOrgId || selectedOrgId === 'all' ? undefined : selectedOrgId;
      const kchtTypeVal = !values || !values.kchtType ? [] : values.kchtType;
      const kchtTypes = Array.isArray(kchtTypeVal) ? kchtTypeVal : [kchtTypeVal];
      const tinhThanhPho = !values ? '' : values.tinhThanhPho;
      const search = !values ? '' : values.search;
      const objectType = !values || !values.objectType ? undefined : values.objectType;

      const res = await api.get('/v1/kchtgis/kchtgis_155/search', {
        params: {
          page: searchPage - 1,
          size: searchPageSize,
          orgUnitId,
          kchtType: kchtTypes.join(','),
          tinhThanhPho,
          search,
          objectType
        }
      });

      const pageData = res.data.data;
      const list = (pageData.content || []).map((x: any) => ({
        ...x,
        id: x.id,
        name: x.name,
        ma: x.ma,
        orgName: x.orgName,
        kchtTypeLabel: x.kchtTypeLabel,
        diaDiem: x.diaDiem,
        viDo: x.latitude,
        kinhDo: x.longitude,
        bieuTuongId: x.bieuTuongId
      }));

      setInfrastructureResults(list);
      setSelectedRowKeys([]);
      setTotalSearchElements(pageData.totalElements || list.length);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingInfrastructure(false);
    }
  }, [searchForm, searchPage, searchPageSize]);

  // Load Org Units & Symbols on Mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list();
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

  // Trigger search on pagination changes
  useEffect(() => {
    handleSearchInfrastructure();
  }, [searchPage, searchPageSize, handleSearchInfrastructure]);

  // Update map size when search panel is shown/hidden
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 200);
    }
  }, [searchPanelVisible]);

  const handleRowClick = useCallback(async (record: any) => {
    const rawLat = record.viDo ?? record.latitude;
    const rawLon = record.kinhDo ?? record.longitude;
    
    if (rawLat !== undefined && rawLat !== null && rawLon !== undefined && rawLon !== null) {
      const lat = parseFloat(rawLat as any);
      const lon = parseFloat(rawLon as any);
      
      if (!isNaN(lat) && !isNaN(lon) && lat >= 5.0 && lat <= 26.0 && lon >= 99.0 && lon <= 118.0 && mapRef.current) {
        mapRef.current.setView([lat, lon], 12);
        
        setSelectedRowKeys((prev) => {
          if (prev.includes(record.id)) return prev;
          return [...prev, record.id];
        });
      } else {
        toast.info(`Đối tượng này có tọa độ không hợp lệ trên bản đồ Việt Nam: [Vĩ độ: ${lat}, Kinh độ: ${lon}]`);
      }
    } else {
      toast.info('Đối tượng này chưa được cấu hình tọa độ trên bản đồ');
    }
  }, [setSelectedRowKeys]);

  // Map elements refs
  const mapRef = useRef<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geoJsonGroupRef = useRef<any>(null);
  const searchMarkersGroupRef = useRef<any>(null);
  const searchVertexMarkersGroupRef = useRef<any>(null);
  const planningGroupRef = useRef<any>(null);
  const calibratorMarkerRef = useRef<any>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const lastFittedCellIdRef = useRef<string | null>(null);
  const renderChartFeaturesRef = useRef<() => void>();
  const renderVertexMarkersRef = useRef<() => void>();
  const renderSearchMarkersRef = useRef<() => void>();
  const fetchFeaturesInViewportRef = useRef<() => Promise<void>>();
  const fetchPlanningFeaturesRef = useRef<() => Promise<void>>();
  const moveEndTimeoutRef = useRef<any>(null);
  const planningLayersCacheRef = useRef<Record<string, any>>({});
  const [customGisFeatures, setCustomGisFeatures] = useState<any[]>([]);
  const fetchCustomGisFeaturesRef = useRef<() => Promise<void>>();
  const customGisGroupRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // 1. Dynamic Leaflet Loader
  useEffect(() => {
    if (window.L && (window.L as any).markerClusterGroup && (window.L as any).PM) {
      setLeafletLoaded(true);
      return;
    }

    const loadStyle = (url: string) => {
      if (!document.querySelector(`link[href="${url}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
      }
    };

    const loadScript = (url: string, checkLoaded: () => boolean): Promise<void> => {
      return new Promise((resolve) => {
        if (checkLoaded()) {
          resolve();
          return;
        }
        let script = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement;
        if (script) {
          const handler = () => {
            if (checkLoaded()) {
              resolve();
            } else {
              const interval = setInterval(() => {
                if (checkLoaded()) {
                  clearInterval(interval);
                  resolve();
                }
              }, 50);
            }
          };
          script.addEventListener('load', handler);
          script.addEventListener('error', () => resolve());
          return;
        }
        script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => {
          const interval = setInterval(() => {
            if (checkLoaded()) {
              clearInterval(interval);
              resolve();
            }
          }, 50);
        };
        script.onerror = () => resolve();
        document.body.appendChild(script);
      });
    };

    const loadLeafletAndPlugins = async () => {
      loadStyle('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
      await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', () => !!window.L);

      loadStyle('https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css');
      loadStyle('https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css');
      loadStyle('https://unpkg.com/@geoman-io/leaflet-geoman-free@2.17.0/dist/leaflet-geoman.css');

      await Promise.all([
        loadScript('https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js', () => !!(window.L && (window.L as any).markerClusterGroup)),
        loadScript('https://unpkg.com/@geoman-io/leaflet-geoman-free@2.17.0/dist/leaflet-geoman.min.js', () => !!(window.L && (window.L as any).PM))
      ]);

      setLeafletLoaded(true);
    };

    void loadLeafletAndPlugins();

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
    if (zoom < 12) {
      setPlanningFeatures(prev => prev.length === 0 ? prev : []);
      return;
    }
    const bounds = mapRef.current.getBounds();
    const pad = 0.02;
    const minLat = bounds.getSouth() - pad;
    const maxLat = bounds.getNorth() + pad;
    const minLon = bounds.getWest() - pad;
    const maxLon = bounds.getEast() + pad;

    try {
      const res = await api.get('/gis/planning/features', {
        params: { minLon, minLat, maxLon, maxLat }
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
    if (leafletLoaded && showPlanning) {
      void fetchPlanningFeatures();
    } else {
      setPlanningFeatures([]);
    }
  }, [leafletLoaded, showPlanning, fetchPlanningFeatures]);

  // Helper to parse WKT geometries to GeoJSON coordinates (matching original project)
  const parseWktToCoords = useCallback((wkt: string) => {
    if (!wkt) return null;
    const cleanWkt = wkt.trim().toUpperCase();
    try {
      if (cleanWkt.startsWith('POINT')) {
        const match = cleanWkt.match(/\(([^)]+)\)/);
        if (match) {
          return match[1].trim().split(/\s+/).map(Number);
        }
      } else if (cleanWkt.startsWith('LINESTRING')) {
        const match = cleanWkt.match(/\(([^)]+)\)/);
        if (match) {
          return match[1].split(',').map(c => c.trim().split(/\s+/).map(Number));
        }
      } else if (cleanWkt.startsWith('POLYGON')) {
        const match = cleanWkt.match(/POLYGON\s*\((.*)\)/);
        if (match) {
          const ringsStr = match[1];
          const rings = ringsStr.split(/\)\s*,\s*\(/).map(r => r.replace(/[()]/g, '').trim());
          return rings.map(ring => ring.split(',').map(c => c.trim().split(/\s+/).map(Number)));
        }
      }
    } catch (e) {
      console.error('Error parsing WKT:', e);
    }
    return null;
  }, []);

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
    if (categoryId === 1) return 'Cảng biển';
    if (categoryId === 2) return 'Cơ sở sửa chữa';
    if (categoryId === 3) return 'Đê kè';
    if (categoryId === 4) return 'Đèn biển';
    if (categoryId === 5) return 'Hệ thống VTS';
    if (categoryId === 6) return 'Khu chuyển tải';
    if (categoryId === 7) return 'Khu neo đậu';
    if (categoryId === 8) return 'Khu tránh trú bão';
    if (categoryId === 9) return 'Luồng hàng hải';
    if (categoryId === 10) return 'Phao tiêu';
    if (categoryId === 11) return 'Trạm radar';
    if (categoryId === 12) return 'Vùng nước';
    if (categoryId === 13) return 'Cảng cạn';

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
      const [pointsRes, linesRes, polygonsRes] = await Promise.all([
        pointObjectService.list({ status: 'PUBLISHED' }),
        lineObjectService.list({ status: 'PUBLISHED' }),
        polygonObjectService.list({ status: 'PUBLISHED' }),
      ]);

      const allFeatures: any[] = [];

      // Map points
      (pointsRes.data || []).forEach((item: any) => {
        if (item.latitude && item.longitude) {
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
      (linesRes.data || []).forEach((item: any) => {
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
      (polygonsRes.data || []).forEach((item: any) => {
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
  }, [parseWktToCoords]);

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
    const L = window.L;
    if (!L || !mapRef.current || !customGisGroupRef.current) return;

    customGisGroupRef.current.clearLayers();
    if (customGisFeatures.length === 0) return;

    const tempGroup = L.featureGroup();

    customGisFeatures.forEach((feature) => {
      try {
        let layer: any = null;
        if (feature.type === 'Point') {
          layer = L.circleMarker([feature.coordinates[1], feature.coordinates[0]], {
            radius: 7,
            color: '#13c2c2', // Teal-cyan for points
            fillColor: '#13c2c2',
            fillOpacity: 0.85,
            weight: 2,
            pmIgnore: true,
          });
        } else if (feature.type === 'LineString') {
          const latlngs = feature.coordinates.map((c: any) => [c[1], c[0]]);
          layer = L.polyline(latlngs, {
            color: '#fa8c16', // Orange for lines
            weight: 3,
            opacity: 0.9,
            pmIgnore: true,
          });
        } else if (feature.type === 'Polygon') {
          const latlngs = feature.coordinates.map((ring: any) => ring.map((c: any) => [c[1], c[0]]));
          layer = L.polygon(latlngs, {
            color: '#1890ff', // Blue for polygons
            fillColor: '#1890ff',
            fillOpacity: 0.25,
            weight: 2,
            pmIgnore: true,
          });
        }

        if (layer) {
          layer.bindTooltip(
            `<div style="font-weight: 600;">${feature.name}</div>`,
            { direction: 'top', offset: [0, -5], opacity: 0.9 }
          );

          const getPopupHtml = (portName: string) => `
            <div style="min-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 4px;">
              <!-- Header -->
              <div style="font-size: 14px; font-weight: bold; color: #1890ff; border-bottom: 1px solid #e8e8e8; padding-bottom: 6px; margin-bottom: 8px; word-break: break-all;">
                ${feature.name}
              </div>

              <!-- Fields table -->
              <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #555;">
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
                <button class="btn-delete-custom-gis" data-id="${feature.id}" data-type="${feature.type}" data-name="${feature.name}" style="font-size: 11px; border-radius: 4px; padding: 4px 10px; cursor: pointer; border: 1px solid #ff4d4f; background: #ff4d4f; color: white; font-weight: 500; outline: none; transition: background 0.2s;">
                  Xóa
                </button>
                <button class="btn-edit-custom-gis" data-id="${feature.id}" data-type="${feature.type}" data-name="${feature.name}" style="font-size: 11px; border-radius: 4px; padding: 4px 10px; cursor: pointer; border: 1px solid #1890ff; background: transparent; color: #1890ff; font-weight: 500; outline: none; transition: background 0.2s;">
                  Chỉnh sửa
                </button>
              </div>
            </div>
          `;

          layer.bindPopup(getPopupHtml(feature.refId ? 'Đang tải...' : '—'));

          if (feature.refId) {
            layer.on('popupopen', async () => {
              try {
                const port = await cangBienCRUD.findById(feature.refId);
                if (port) {
                  layer.setPopupContent(getPopupHtml(port.tenCang || '—'));
                } else {
                  layer.setPopupContent(getPopupHtml('—'));
                }
              } catch (err) {
                console.error(err);
                layer.setPopupContent(getPopupHtml('—'));
              }
            });
          }

          tempGroup.addLayer(layer);
        }
      } catch (err) {
        console.error('Failed to draw custom feature:', feature, err);
      }
    });

    customGisGroupRef.current.addLayer(tempGroup);
  }, [customGisFeatures]);

  // Render planning features as vector layers on the map
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current || !planningGroupRef.current) return;

    planningGroupRef.current.clearLayers();

    if (!showPlanning || planningFeatures.length === 0) return;

    const layers: any[] = [];
    
    // AutoCAD Color Index mapping to Hex
    const getAciColor = (colorIndex?: number) => {
      if (!colorIndex) return '#1890ff';
      const ACI_COLORS: Record<number, string> = {
        1: '#ff4d4f', // Red
        2: '#faad14', // Yellow
        3: '#52c41a', // Green
        4: '#13c2c2', // Cyan
        5: '#2f54eb', // Blue
        6: '#eb2f96', // Magenta
        7: '#722ed1', // Purple
        8: '#595959', // Dark grey
        9: '#8c8c8c', // Grey
        10: '#d9d9d9', // Light grey
      };
      return ACI_COLORS[colorIndex] || '#1890ff';
    };

    planningFeatures.forEach((feature) => {
      if (!feature.geojson) return;

      // Check cache first!
      const cached = planningLayersCacheRef.current[feature.fid];
      if (cached) {
        layers.push(cached);
        return;
      }

      try {
        const geojsonObj = JSON.parse(feature.geojson);
        const color = getAciColor(feature.color);
        
        const layer = L.geoJSON(geojsonObj, {
          pane: 'planningPane',
          pmIgnore: true,
          style: () => ({
            color: color,
            weight: feature.geomType === 'LINE' ? 2 : 1.5,
            fillColor: color,
            fillOpacity: feature.geomType === 'AREA' ? 0.35 : 0,
          }),
          pointToLayer: (geoJsonFeature: any, latlng: any) => {
            return L.circleMarker(latlng, {
              pane: 'planningPane',
              radius: 5,
              fillColor: color,
              color: '#ffffff',
              weight: 1,
              fillOpacity: 0.8,
              pmIgnore: true,
            });
          }
        });

        // Direct click event to open aggregated details popup
        layer.on('click', async (e: any) => {
          L.DomEvent.stopPropagation(e); // stop event bubbling to map
          
          const latlng = e.latlng;
          
          const getStatusTagStyle = (statusText?: string) => {
            const txt = (statusText || '').toLowerCase();
            if (txt.includes('hiện hữu') || txt.includes('hiện trạng')) {
              return 'background-color: #fffb8f; border: 1px solid #fadb14; color: rgba(0, 0, 0, 0.85);';
            }
            if (txt.includes('2030')) {
              return 'background-color: #b7eb8f; border: 1px solid #73d13d; color: rgba(0, 0, 0, 0.85);';
            }
            if (txt.includes('điều kiện')) {
              return 'background-color: #ffccc7; border: 1px solid #ff7875; color: rgba(0, 0, 0, 0.85);';
            }
            if (txt.includes('2050')) {
              return 'background-color: #d3adf7; border: 1px solid #9254de; color: rgba(0, 0, 0, 0.85);';
            }
            return 'background-color: #fffb8f; border: 1px solid #fadb14; color: rgba(0, 0, 0, 0.85);';
          };

          const getStandardizedStatus = (statusText?: string) => {
            const txt = (statusText || '').toLowerCase();
            if (txt.includes('hiện hữu') || txt.includes('hiện trạng')) {
              return 'Bến cảng hiện hữu';
            }
            if (txt.includes('2030')) {
              return 'Bến cảng quy hoạch đến năm 2030';
            }
            if (txt.includes('điều kiện')) {
              return 'Bến cảng phát triển có điều kiện';
            }
            if (txt.includes('2050')) {
              return 'Bến cảng quy hoạch tầm nhìn đến năm 2050';
            }
            return statusText || 'Bến cảng hiện hữu';
          };

          try {
            const res = await api.get('/gis/planning/features/at-point', {
              params: { lat: latlng.lat, lon: latlng.lng }
            });
            const featuresAtPoint = res.data?.data || [];
            if (featuresAtPoint.length === 0) return;

            const itemsHtml = featuresAtPoint.map((feat: any, idx: number) => {
              const currentStatus = feat.status || 'Bến cảng hiện hữu';
              const cleanStatus = getStandardizedStatus(currentStatus);
              const formattedLat = feat.lat ? `${feat.lat.toFixed(5)}°N` : '—';
              const formattedLon = feat.lon ? `${feat.lon.toFixed(5)}°E` : '—';
              const agencyName = feat.agency || 'Cục Hàng hải và Đường thủy Việt Nam';
              
              const isAreaOrPoint = feat.geomType === 'AREA' || feat.geomType === 'POINT';

              const isActive = (optText: string) => {
                return cleanStatus === optText;
              };

              return `
                <div style="border-left: 3px solid #1890ff; padding-left: 12px; margin-bottom: ${idx === featuresAtPoint.length - 1 ? '0' : '20px'}; position: relative;">
                  <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <span style="border: 1px solid #1890ff; background-color: #e6f7ff; color: #1890ff; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 13px; max-width: 190px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${feat.name || 'Đối tượng quy hoạch'}">
                      ${feat.name || 'Đối tượng quy hoạch'}
                    </span>
                    <span style="background-color: #f5f5f5; border: 1px solid #d9d9d9; padding: 3px 8px; border-radius: 4px; font-size: 11px; color: #666; font-weight: 500;">
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
                      <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; ${getStatusTagStyle(cleanStatus)}">
                        ${cleanStatus}
                      </span>
                    </div>
                  </div>

                  ${isAreaOrPoint ? `
                    <div style="border-top: 1px dashed #d9d9d9; margin: 12px 0;"></div>

                    <div style="font-size: 11px; font-weight: bold; color: #8c8c8c; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                      CẬP NHẬT TRẠNG THÁI QUY HOẠCH
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 8px; user-select: none; -webkit-user-select: none;">
                      <div class="planning-status-option ${isActive('Bến cảng hiện hữu') ? 'active-opt' : ''}" 
                           data-status="Bến cảng hiện hữu" data-color="2" data-fid="${feat.fid}" data-geomtype="${feat.geomType}"
                           style="cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid ${isActive('Bến cảng hiện hữu') ? '#1890ff' : '#d9d9d9'}; background-color: ${isActive('Bến cảng hiện hữu') ? '#e6f7ff' : '#fff'}; border-radius: 6px; transition: all 0.2s;">
                        <div style="width: 16px; height: 16px; border-radius: 3px; background-color: #ffff00; border: 1px solid #d9d9d9; flex-shrink: 0;"></div>
                        <span style="font-size: 13px; font-weight: ${isActive('Bến cảng hiện hữu') ? '600' : 'normal'};">Bến cảng hiện hữu</span>
                      </div>

                      <div class="planning-status-option ${isActive('Bến cảng quy hoạch đến năm 2030') ? 'active-opt' : ''}" 
                           data-status="Bến cảng quy hoạch đến năm 2030" data-color="3" data-fid="${feat.fid}" data-geomtype="${feat.geomType}"
                           style="cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid ${isActive('Bến cảng quy hoạch đến năm 2030') ? '#1890ff' : '#d9d9d9'}; background-color: ${isActive('Bến cảng quy hoạch đến năm 2030') ? '#e6f7ff' : '#fff'}; border-radius: 6px; transition: all 0.2s;">
                        <div style="width: 16px; height: 16px; border-radius: 3px; background-color: #00ff00; border: 1px solid #d9d9d9; flex-shrink: 0;"></div>
                        <span style="font-size: 13px; font-weight: ${isActive('Bến cảng quy hoạch đến năm 2030') ? '600' : 'normal'};">Bến cảng quy hoạch đến năm 2030</span>
                      </div>

                      <div class="planning-status-option ${isActive('Bến cảng phát triển có điều kiện') ? 'active-opt' : ''}" 
                           data-status="Bến cảng phát triển có điều kiện" data-color="1" data-fid="${feat.fid}" data-geomtype="${feat.geomType}"
                           style="cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid ${isActive('Bến cảng phát triển có điều kiện') ? '#1890ff' : '#d9d9d9'}; background-color: ${isActive('Bến cảng phát triển có điều kiện') ? '#e6f7ff' : '#fff'}; border-radius: 6px; transition: all 0.2s;">
                        <div style="width: 16px; height: 16px; border-radius: 3px; background-color: #ff9999; border: 1px solid #d9d9d9; flex-shrink: 0;"></div>
                        <span style="font-size: 13px; font-weight: ${isActive('Bến cảng phát triển có điều kiện') ? '600' : 'normal'};">Bến cảng phát triển có điều kiện</span>
                      </div>

                      <div class="planning-status-option ${isActive('Bến cảng quy hoạch tầm nhìn đến năm 2050') ? 'active-opt' : ''}" 
                           data-status="Bến cảng quy hoạch tầm nhìn đến năm 2050" data-color="7" data-fid="${feat.fid}" data-geomtype="${feat.geomType}"
                           style="cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid ${isActive('Bến cảng quy hoạch tầm nhìn đến năm 2050') ? '#1890ff' : '#d9d9d9'}; background-color: ${isActive('Bến cảng quy hoạch tầm nhìn đến năm 2050') ? '#e6f7ff' : '#fff'}; border-radius: 6px; transition: all 0.2s;">
                        <div style="width: 16px; height: 16px; border-radius: 3px; background-color: #b399ff; border: 1px solid #d9d9d9; flex-shrink: 0;"></div>
                        <span style="font-size: 13px; font-weight: ${isActive('Bến cảng quy hoạch tầm nhìn đến năm 2050') ? '600' : 'normal'};">Bến cảng quy hoạch tầm nhìn đến năm 2050</span>
                      </div>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('');

            const aggregatedContent = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 4px; width: 330px; color: #333; max-height: 380px; overflow-y: auto; padding-right: 6px;">
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
        planningLayersCacheRef.current[feature.fid] = layer;
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

    const L = window.L;
    // Create map centered on Vietnam (incorporating East Sea / Sovereignty area)
    const map = L.map(mapContainerRef.current, { preferCanvas: true, attributionControl: false }).setView([16.0, 108.0], 5);
    mapRef.current = map;
    setMapInstance(map);

    // Create a high-priority pane for QHCB planning layers so they render above ENC layers
    const planningPane = map.createPane('planningPane');
    planningPane.style.zIndex = '550';

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

        if (!status || !color || !fid || !geomType) {
          return;
        }

        try {
          const colorInt = parseInt(color, 10);
          await api.put(`/gis/planning/features/${geomType}/${fid}/status`, null, {
            params: { status, color: colorInt }
          });
          toast.success('Cập nhật trạng thái quy hoạch thành công');
          
          if (mapRef.current) {
            mapRef.current.closePopup();
          }
          // Clear cache for this feature so it gets re-rendered with new color!
          if (fid && planningLayersCacheRef.current) {
            delete planningLayersCacheRef.current[fid];
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

        Modal.confirm({
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

        const feature = customGisFeatures.find((f: any) => f.id === id);
        if (feature) {
          const getLoaiKchtValue = (catId?: number) => {
            if (catId === 1) return 'CANGBIEN';
            if (catId === 2) return 'COSO_SUACHUA';
            if (catId === 3) return 'DEKE';
            if (catId === 4) return 'DENBIEN';
            if (catId === 5) return 'HE_THONG_VTS';
            if (catId === 6) return 'KHUCHUYEN_TAI';
            if (catId === 7) return 'KHUNEO_DAU';
            if (catId === 8) return 'KHUTRANH_TRU_BAO';
            if (catId === 9) return 'LUONGHANGHAI';
            if (catId === 10) return 'PHAOTIEU';
            if (catId === 11) return 'TRAM_RADAR';
            if (catId === 12) return 'VUNGNUOC';
            if (catId === 13) return 'CANGCAN';
            return 'OTHER';
          };

          const editRecord = {
            id: feature.id,
            type: feature.type,
            name: feature.name,
            code: feature.code,
            loaiKcht: getLoaiKchtValue(feature.categoryId),
            unitId: feature.unitId,
            cangBien: feature.refId,
            diaDiem: feature.purpose,
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
      }
    };
  }, [leafletLoaded]);

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
    const L = window.L;
    if (!L || !mapRef.current || !searchVertexMarkersGroupRef.current) return;
    
    searchVertexMarkersGroupRef.current.clearLayers();

    const selectedRecords = infrastructureResults.filter((record) => selectedRowKeys.includes(record.id));
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

      const symId = record.bieuTuongId || record.iconId;
      const sym = symbols.find((s) => s.id === symId);
      
      let markerIcon: any;
      if (sym && sym.hinhAnh) {
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
              <img src="${sym.hinhAnh.startsWith('data:') ? sym.hinhAnh : `data:image/png;base64,${sym.hinhAnh}`}"
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

        const vertexMarker = L.marker(coord, { icon: markerIcon, pmIgnore: true });
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
  }, [infrastructureResults, selectedRowKeys, symbols]);

  const renderSearchMarkers = useCallback(() => {
    const L = window.L;
    if (!L || !mapRef.current || !searchMarkersGroupRef.current) return;

    const startTime = performance.now();

    // Clear old search markers and vertex markers
    searchMarkersGroupRef.current.clearLayers();
    if (searchVertexMarkersGroupRef.current) {
      searchVertexMarkersGroupRef.current.clearLayers();
    }

    const selectedRecords = infrastructureResults.filter((record) => selectedRowKeys.includes(record.id));
    if (selectedRecords.length === 0) return;

    const bounds = mapRef.current.getBounds();
    const zoom = mapRef.current.getZoom();
    const markers: any[] = [];
    const useCircle = selectedRecords.length > 300 && zoom < 13;

    selectedRecords.forEach((record) => {
      const rawLat = record.viDo ?? record.latitude;
      const rawLon = record.kinhDo ?? record.longitude;
      
      if (rawLat !== undefined && rawLat !== null && rawLon !== undefined && rawLon !== null) {
        const lat = parseFloat(rawLat as any);
        const lon = parseFloat(rawLon as any);
        
        if (!isNaN(lat) && !isNaN(lon) && lat >= 5.0 && lat <= 26.0 && lon >= 99.0 && lon <= 118.0) {
          const latlng = L.latLng(lat, lon);
          
          // Viewport bounding box check: only render if visible in current viewport bounds (with 10% padding)
          const paddedBounds = bounds.pad(0.1);
          let isVisible = paddedBounds.contains(latlng);
          
          if (!isVisible && record.toaDo && record.loaiHinhHoc && zoom >= 10) {
            const shapeCoordinates = parseWktToLatLngs(record.toaDo, record.loaiHinhHoc);
            if (shapeCoordinates.length > 0) {
              const shapeBounds = L.latLngBounds(shapeCoordinates.map(c => L.latLng(c[0], c[1])));
              if (paddedBounds.intersects(shapeBounds)) {
                isVisible = true;
              }
            }
          }

          if (!isVisible) {
            return;
          }

          // Find symbol
          const symId = record.bieuTuongId || record.iconId;
          const sym = symbols.find((s) => s.id === symId);

          let marker;
          let markerIcon: any;
          if (sym && sym.hinhAnh) {
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
                  <img src="${sym.hinhAnh.startsWith('data:') ? sym.hinhAnh : `data:image/png;base64,${sym.hinhAnh}`}"
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
          marker = L.marker([lat, lon], { icon: markerIcon, pmIgnore: true });
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
    console.log(`[Map] Draw completed in ${(endTime - startTime).toFixed(2)} ms. Rendered ${selectedRecords.length} records (${markers.length} main layers in viewport).`);
  }, [infrastructureResults, symbols, selectedRowKeys, renderVertexMarkers]);

  useEffect(() => {
    renderVertexMarkersRef.current = renderVertexMarkers;
  }, [renderVertexMarkers]);

  useEffect(() => {
    renderSearchMarkersRef.current = renderSearchMarkers;
  }, [renderSearchMarkers]);

  // Trigger search result rendering whenever data or selections change
  useEffect(() => {
    renderSearchMarkers();
  }, [infrastructureResults, symbols, selectedRowKeys, renderSearchMarkers]);

  // Run fitBounds ONCE when the list of selected records changes (to avoid movement loop)
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const selectedRecords = infrastructureResults.filter((record) => selectedRowKeys.includes(record.id));
    if (selectedRecords.length === 0) return;

    try {
      const L = window.L;
      const pts: any[] = [];
      selectedRecords.forEach(record => {
        const rawLat = record.viDo ?? record.latitude;
        const rawLon = record.kinhDo ?? record.longitude;
        if (rawLat !== undefined && rawLat !== null && rawLon !== undefined && rawLon !== null) {
          const lat = parseFloat(rawLat);
          const lon = parseFloat(rawLon);
          if (lat >= 5 && lat <= 25 && lon >= 95 && lon <= 120) {
            pts.push([lat, lon]);
          }
        }
      });
      // Fallback if all selected records are outside Vietnam bounds
      if (pts.length === 0) {
        selectedRecords.forEach(record => {
          const rawLat = record.viDo ?? record.latitude;
          const rawLon = record.kinhDo ?? record.longitude;
          if (rawLat !== undefined && rawLat !== null && rawLon !== undefined && rawLon !== null) {
            pts.push([parseFloat(rawLat), parseFloat(rawLon)]);
          }
        });
      }
      if (pts.length > 0) {
        const bounds = L.latLngBounds(pts);
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
      }
    } catch (e) {
      // ignore
    }
  }, [selectedRowKeys, infrastructureResults, leafletLoaded]);

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
    <div style={{ padding: '16px', height: 'calc(100vh - 64px)', boxSizing: 'border-box', overflow: 'hidden' }}>
      <Row gutter={[16, 16]}>
        {/* Main Map Viewer */}
        <Col xs={24} lg={searchPanelVisible ? 17 : 24} style={{ order: 2 }}>
          <Card
            styles={{ body: { padding: 0 } }}
          >
            {/* The Map Div and Floating Control */}
            <div style={{ position: 'relative', height: 'calc(100vh - 98px)' }}>
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
                        background: 'rgba(255, 255, 255, 0.98)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        padding: '16px',
                        width: '320px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#333', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px', marginBottom: '12px' }}>
                        GHI CHÚ QUY HOẠCH:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Bến cảng hiện hữu */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '24px', height: '12px', background: '#faad14', border: '1px solid #d9d9d9', borderRadius: '2px' }} />
                          <span style={{ fontSize: '13px', color: '#444' }}>Bến cảng hiện hữu</span>
                        </div>
                        {/* Bến cảng quy hoạch đến năm 2030 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '24px', height: '12px', background: '#52c41a', border: '1px solid #d9d9d9', borderRadius: '2px' }} />
                          <span style={{ fontSize: '13px', color: '#444' }}>Bến cảng quy hoạch đến năm 2030</span>
                        </div>
                        {/* Bến cảng phát triển có điều kiện */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '24px', height: '12px', background: '#ffa39e', border: '1px solid #ff4d4f', borderRadius: '2px' }} />
                          <span style={{ fontSize: '13px', color: '#444' }}>Bến cảng phát triển có điều kiện</span>
                        </div>
                        {/* Bến cảng quy hoạch tầm nhìn đến năm 2050 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '24px', height: '12px', background: '#722ed1', border: '1px solid #d9d9d9', borderRadius: '2px' }} />
                          <span style={{ fontSize: '13px', color: '#444' }}>Bến cảng quy hoạch tầm nhìn đến năm 2050</span>
                        </div>
                        {/* Vùng đón trả hoa tiêu quy hoạch */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <svg width="24" height="12" viewBox="0 0 24 12" style={{ display: 'block' }}>
                            <line x1="2" y1="10" x2="22" y2="2" stroke="#eb2f96" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#444' }}>Vùng đón trả hoa tiêu quy hoạch</span>
                        </div>
                        {/* Vùng đón trả hoa tiêu hiện trạng */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <svg width="24" height="12" viewBox="0 0 24 12" style={{ display: 'block' }}>
                            <line x1="2" y1="10" x2="22" y2="2" stroke="#ffadd2" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#444' }}>Vùng đón trả hoa tiêu hiện trạng</span>
                        </div>
                        {/* Vùng neo hiện trạng */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <svg width="24" height="12" viewBox="0 0 24 12" style={{ display: 'block' }}>
                            <line x1="2" y1="10" x2="22" y2="2" stroke="#8c8c8c" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#444' }}>Vùng neo hiện trạng</span>
                        </div>
                        {/* Vùng neo quy hoạch */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <svg width="24" height="12" viewBox="0 0 24 12" style={{ display: 'block' }}>
                            <line x1="2" y1="10" x2="22" y2="2" stroke="#ffa940" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#444' }}>Vùng neo quy hoạch</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    type={legendOpen ? 'primary' : 'default'}
                    shape="circle"
                    icon={<InfoCircleOutlined style={{ fontSize: '18px' }} />}
                    onClick={() => setLegendOpen(!legendOpen)}
                    style={{
                      width: '40px',
                      height: '40px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: legendOpen ? '#1890ff' : '#ffffff',
                      color: legendOpen ? '#ffffff' : '#1890ff',
                      border: 'none',
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
              {/* Floating Search Button when panel is hidden */}
              {!searchPanelVisible && (
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => setSearchPanelVisible(true)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  Tìm kiếm
                </Button>
              )}
            </div>
          </Card>
        </Col>

        {/* Sidebar panels */}
        {searchPanelVisible && (
          <Col xs={24} lg={7} style={{ order: 1 }}>
            <Tabs
              className="gis-sidebar-tabs"
              defaultActiveKey="1"
              type="card"
              style={{ height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}
              items={[
                {
                  key: '1',
                  label: 'Tra cứu',
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0 }}>
                      {/* Fixed top section: title + form + pagination */}
                      <div style={{ flexShrink: 0, padding: '12px 12px 0 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <Typography.Title level={4} style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#111' }}>
                          Tra cứu thông tin kết cấu hạ tầng hàng hải trên bản đồ
                        </Typography.Title>
                        <Button
                          type="text"
                          icon={<CloseOutlined style={{ fontSize: '16px', color: '#999' }} />}
                          onClick={() => setSearchPanelVisible(false)}
                          style={{ padding: 0, border: 'none', background: 'transparent', height: 'auto', width: 'auto', display: 'flex', alignItems: 'center' }}
                          title="Đóng"
                        />
                      </div>
                      <Form form={searchForm} layout="vertical" onFinish={handleSearchInfrastructure} initialValues={{ orgUnitId: ['all'], kchtType: urlKchtType, tinhThanhPho: urlProvince, search: urlSearch, objectType: '' }}>
                        <Form.Item name="orgUnitId" label="Đơn vị quản lý">
                        <Cascader
                          options={treeOptions}
                          changeOnSelect
                          expandTrigger="hover"
                          placeholder="Chọn đơn vị quản lý..."
                          showSearch={{
                            filter: (inputValue, path) =>
                              path.some(option => (option.label as string).toLowerCase().includes(inputValue.toLowerCase()))
                          }}
                        />
                      </Form.Item>

                      <Form.Item name="kchtType" label="Loại kết cấu hạ tầng">
                        <Select
                          mode="multiple"
                          showSearch
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                          placeholder="Chọn loại kết cấu..."
                          options={[
                            { value: 'BENCANG', label: 'Bến cảng' },
                            { value: 'BENPHAO', label: 'Bến phao' },
                            { value: 'CANGBIEN', label: 'Cảng biển' },
                            { value: 'CAUCANG', label: 'Cầu cảng' },
                            { value: 'CANGCAN', label: 'Cảng cạn' },
                            { value: 'COSO_SUACHUA', label: 'Cơ sở sửa chữa, đóng tàu' },
                            { value: 'KHUCHUYEN_TAI', label: 'Khu chuyển tải' },
                            { value: 'DENBIEN', label: 'Đèn biển và nhà trạm gắn liền với đèn biển' },
                            { value: 'DEKE', label: 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ' },
                            { value: 'DAI_TTDH', label: 'Đài TTDH' },
                            { value: 'DAI_INMARSAT', label: 'Đài Thông tin Vệ tinh mặt đất Inmarsat Hải Phòng' },
                            { value: 'LUONGHANGHAI', label: 'Luồng hàng hải' },
                            { value: 'DAI_LRIT', label: 'Đài Thông tin nhận dạng và truy theo tầm xa (LRIT)' },
                            { value: 'KHUNEO_DAU', label: 'Khu neo đậu' },
                            { value: 'NHATRAM_PHAO', label: 'Nhà trạm quản lý vận hành phao tiêu' },
                            { value: 'PHAOTIEU', label: 'Phao, tiêu' },
                            { value: 'DAI_COSPAS_SARSAT', label: 'Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam' },
                            { value: 'KHUTRANH_TRU_BAO', label: 'Khu tránh, trú bão' },
                            { value: 'DAI_HANOI', label: 'Đài Trung tâm xử lý thông tin hàng hải Hà Nội' },
                            { value: 'HE_THONG_VTS', label: 'Hệ thống VTS' },
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

                      <div style={{ display: showAdvancedSearch ? 'block' : 'none' }}>
                        <Form.Item name="search" label="Kết cấu hạ tầng">
                          <Input
                            placeholder="Kết cấu hạ tầng"
                            maxLength={255}
                            suffix={
                              <span style={{ fontSize: '12px', color: '#999' }}>
                                {searchVal.length} / 255
                              </span>
                            }
                            allowClear
                          />
                        </Form.Item>

                        <Form.Item name="objectType" label="Loại đối tượng">
                          <Select
                            placeholder="Loại đối tượng"
                            allowClear
                            options={[
                              { value: '', label: '---Tất cả---' },
                              { value: 'POINT', label: 'Đối tượng điểm' },
                              { value: 'LINE', label: 'Đối tượng đường' },
                              { value: 'POLYGON', label: 'Đối tượng vùng' }
                            ]}
                          />
                        </Form.Item>
                      </div>

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
                        <Button 
                          icon={<SlidersOutlined />} 
                          onClick={() => setShowAdvancedSearch(prev => !prev)}
                          style={{
                            borderColor: showAdvancedSearch ? '#1890ff' : undefined,
                            color: showAdvancedSearch ? '#1890ff' : undefined,
                          }}
                        />
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
                            { value: 20, label: '20 / trang' },
                            { value: 50, label: '50 / trang' },
                            { value: 100, label: '100 / trang' },
                            { value: 5000, label: '5000 / trang' },
                          ]}
                          style={{ width: 120 }}
                        />
                      </Space>
                    </div>
                      </div>

                      {/* Table fills all remaining vertical space */}
                      <div ref={tableWrapperRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', width: '100%', maxWidth: '100%', padding: '0 12px 12px 12px' }}>
                    <Table
                      style={{ width: '100%' }}
                      loading={searchingInfrastructure}
                      rowSelection={{
                        type: 'checkbox',
                        fixed: true,
                        columnWidth: 50,
                        selectedRowKeys: selectedRowKeys,
                        onChange: (keys) => {
                          setSelectedRowKeys(keys);
                        },
                        getCheckboxProps: () => ({
                          disabled: searchingInfrastructure
                        })
                      }}
                      columns={[
                        {
                          title: 'STT',
                          dataIndex: 'stt',
                          key: 'stt',
                          width: 60,
                          render: (_text, _record, index) => (searchPage - 1) * searchPageSize + index + 1,
                        },
                        {
                          title: 'Đơn vị quản lý',
                          dataIndex: 'orgName',
                          key: 'orgName',
                          width: 200,
                        },
                        {
                          title: 'Loại KCHT',
                          dataIndex: 'kchtTypeLabel',
                          key: 'kchtTypeLabel',
                          width: 120,
                        },
                        {
                          title: 'Địa điểm (Tỉnh/Thành phố)',
                          dataIndex: 'diaDiem',
                          key: 'diaDiem',
                          width: 180,
                        },
                        {
                          title: 'Địa chỉ chi tiết',
                          dataIndex: 'diaChiChiTiet',
                          key: 'diaChiChiTiet',
                          width: 220,
                        },
                        {
                          title: 'KCHT',
                          dataIndex: 'name',
                          key: 'name',
                          width: 200,
                        }
                      ]}
                      dataSource={infrastructureResults}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      bordered
                      virtual={infrastructureResults.length > 100}
                      scroll={{ x: 980, y: tableHeight }}
                      onRow={(record) => ({
                        onClick: () => handleRowClick(record),
                        style: { cursor: 'pointer' }
                      })}
                    />
                      </div>
                    </div>
                  ),
                },
                /*
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
                */
              ]}
          />
        </Col>
        )}
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
          <div>
            <Typography.Text type="secondary" strong style={{ display: 'block', marginBottom: '12px', fontSize: '13px' }}>
              Lớp dữ liệu (Overlay)
            </Typography.Text>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                <Space size={6}>
                  <span>🗺️</span>
                  <span>ENC - Hải đồ điện tử</span>
                </Space>
              </Checkbox>

              <Checkbox 
                checked={showPlanning}
                onChange={(e) => setShowPlanning(e.target.checked)}
              >
                <Space size={6}>
                  <span>🏢</span>
                  <span>QHCB - Quy hoạch cảng biển</span>
                </Space>
              </Checkbox>
            </div>
          </div>

          <Typography.Text type="secondary" strong>
            Chi tiết Hải đồ (Lọc theo lớp)
          </Typography.Text>

          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {uniqueFeatureCodes.map(code => {
              const label = getFeatureNameVi(code);
              const icon = LAYER_ICONS[code] || '🌐';
              const isChecked = visibleLayers[code] ?? false;

              return (
                <div key={code} style={{ padding: '6px 0', display: 'flex', alignItems: 'center' }}>
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
      `}} />
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
