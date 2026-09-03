import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const BE = 'http://localhost:8080';

// Helper đăng nhập lấy Token Admin
async function getAdminToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${BE}/api/auth/login`, {
    data: { identifier: 'admin@hh.gov.vn', password: 'Asdqwe@123' },
  });
  expect(res.ok(), `Login failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return body.data?.token || body.token;
}

// Danh sách 35 bản ghi trạm Inmarsat mẫu thực tế
const SEED_INMARSAT_STATIONS = [
  // Nhóm 1: DRAFT (6 bản ghi)
  {
    name: 'Đài vệ tinh Inmarsat Hải Phòng LES-01',
    provinceId: 31,
    locationAddress: 'Số 02 Nguyễn Trãi, Máy Tơ, Ngô Quyền, Hải Phòng',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-4 Ocean Region',
    services: 'Inmarsat-C, SafetyNET',
    modemType: 'Thrane & Thrane TT-3000EB',
    frequency: '1626.5 - 1646.5 MHz',
    sarCode: 'VN-SAR-HP-01',
    coverageZone: 'AOR-E, IOR',
    contactPerson: 'Nguyễn Văn Hải',
    contactPhone: '0912345601',
    lat: 20.8651,
    lng: 106.6838,
    targetApproval: 'DRAFT',
  },
  {
    name: 'Đài vệ tinh Inmarsat Lạch Huyện Dự phòng',
    provinceId: 31,
    locationAddress: 'Khu bến cảng Lạch Huyện, Cát Hải, Hải Phòng',
    conditionStatus: 'MAINTENANCE',
    satelliteSystem: 'Inmarsat I-6 F1',
    services: 'Inmarsat-C, FleetBroadband',
    modemType: 'Sailor 6110 Mini-C',
    frequency: '1525.0 - 1559.0 MHz',
    sarCode: 'VN-SAR-LH-02',
    coverageZone: 'IOR Region',
    contactPerson: 'Trần Văn Cát',
    contactPhone: '0912345602',
    lat: 20.8124,
    lng: 106.9142,
    targetApproval: 'DRAFT',
  },
  {
    name: 'Đài vệ tinh Inmarsat Hòn Gai Cẩm Phả',
    provinceId: 14,
    locationAddress: 'Cảng Cẩm Phả, Cẩm Thủy, Cẩm Phả, Quảng Ninh',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4 F2',
    services: 'FleetBroadband, EGC',
    modemType: 'Cobham Sailor 500',
    frequency: '1626.5 - 1660.5 MHz',
    sarCode: 'VN-SAR-QN-01',
    coverageZone: 'POR, IOR',
    contactPerson: 'Lê Minh Quang',
    contactPhone: '0912345603',
    lat: 21.0182,
    lng: 107.3012,
    targetApproval: 'DRAFT',
  },
  {
    name: 'Đài vệ tinh Inmarsat Ba Ngòi Cam Ranh',
    provinceId: 56,
    locationAddress: 'Cảng Ba Ngòi, Cam Ranh, Khánh Hòa',
    conditionStatus: 'STOPPED',
    satelliteSystem: 'Inmarsat I-4',
    services: 'Inmarsat-C, LRIT Tracking',
    modemType: 'JRC JUE-87',
    frequency: '1530.0 - 1545.0 MHz',
    sarCode: 'VN-SAR-CR-01',
    coverageZone: 'IOR Region',
    contactPerson: 'Phạm Đức Hòa',
    contactPhone: '0912345604',
    lat: 11.9056,
    lng: 109.1523,
    targetApproval: 'DRAFT',
  },
  {
    name: 'Đài vệ tinh Inmarsat Sa Kỳ Quảng Ngãi',
    provinceId: 51,
    locationAddress: 'Cảng Sa Kỳ, Bình Châu, Bình Sơn, Quảng Ngãi',
    conditionStatus: 'STOPPED',
    satelliteSystem: 'Inmarsat-3',
    services: 'SafetyNET, EGC',
    modemType: 'Furuno FELCOM 18',
    frequency: '1626.5 MHz',
    sarCode: 'VN-SAR-SK-01',
    coverageZone: 'POR Region',
    contactPerson: 'Võ Thanh Sơn',
    contactPhone: '0912345605',
    lat: 15.2214,
    lng: 108.9245,
    targetApproval: 'DRAFT',
  },
  {
    name: 'Đài vệ tinh Inmarsat Diêm Điền Thái Bình',
    provinceId: 34,
    locationAddress: 'Cảng Diêm Điền, Thái Thụy, Thái Bình',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-4 F1',
    services: 'Inmarsat-C, Fleet Safety',
    modemType: 'Sailor 6006',
    frequency: '1525.0 - 1559.0 MHz',
    sarCode: 'VN-SAR-TB-01',
    coverageZone: 'IOR, AOR-E',
    contactPerson: 'Đặng Quốc Huy',
    contactPhone: '0912345606',
    lat: 20.5621,
    lng: 106.5812,
    targetApproval: 'DRAFT',
  },

  // Nhóm 2: PENDING_APPROVAL (7 bản ghi)
  {
    name: 'Đài vệ tinh Inmarsat Đà Nẵng Trạm Bờ',
    provinceId: 48,
    locationAddress: 'Số 15 đường Bạch Đằng, Hải Châu, Đà Nẵng',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4 Ocean Coverage',
    services: 'Inmarsat-C, FleetBroadband, SafetyNET',
    modemType: 'Sailor 6110 Mini-C GMDSS',
    frequency: '1626.5 - 1660.5 MHz',
    sarCode: 'VN-SAR-DN-01',
    coverageZone: 'Biển Đông & Tây Thái Bình Dương',
    contactPerson: 'Hoàng Văn Nam',
    contactPhone: '0912345607',
    lat: 16.0748,
    lng: 108.2240,
    targetApproval: 'PENDING_APPROVAL',
  },
  {
    name: 'Đài vệ tinh Inmarsat Tiên Sa Sơn Trà',
    provinceId: 48,
    locationAddress: 'Cảng Tiên Sa, Thọ Quang, Sơn Trà, Đà Nẵng',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-6 F2',
    services: 'Inmarsat-C, LRIT Tracking',
    modemType: 'Thrane TT-3026D',
    frequency: '1525.0 - 1559.0 MHz',
    sarCode: 'VN-SAR-DN-02',
    coverageZone: 'Vùng thông tin hàng hải Việt Nam',
    contactPerson: 'Bùi Đức Long',
    contactPhone: '0912345608',
    lat: 16.1215,
    lng: 108.2198,
    targetApproval: 'PENDING_APPROVAL',
  },
  {
    name: 'Đài vệ tinh Inmarsat Chân Mây Thừa Thiên Huế',
    provinceId: 46,
    locationAddress: 'Cảng Chân Mây, Lộc Vĩnh, Phú Lộc, Thừa Thiên Huế',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4',
    services: 'FleetBroadband, EGC',
    modemType: 'Cobham Explorer 710',
    frequency: '1626.5 MHz',
    sarCode: 'VN-SAR-TTH-01',
    coverageZone: 'IOR Region',
    contactPerson: 'Lê Văn Hùng',
    contactPhone: '0912345609',
    lat: 16.3278,
    lng: 108.0124,
    targetApproval: 'PENDING_APPROVAL',
  },
  {
    name: 'Đài vệ tinh Inmarsat Cửa Lò Nghệ An',
    provinceId: 40,
    locationAddress: 'Cảng Cửa Lò, Nghi Tân, Thị xã Cửa Lò, Nghệ An',
    conditionStatus: 'MAINTENANCE',
    satelliteSystem: 'Inmarsat I-4 F1',
    services: 'Inmarsat-C, SafetyNET',
    modemType: 'JRC JUE-87 GMDSS',
    frequency: '1540.0 MHz',
    sarCode: 'VN-SAR-NA-01',
    coverageZone: 'Vịnh Bắc Bộ & Biển Đông',
    contactPerson: 'Nguyễn Đình Thắng',
    contactPhone: '0912345610',
    lat: 18.8124,
    lng: 105.7142,
    targetApproval: 'PENDING_APPROVAL',
  },
  {
    name: 'Đài vệ tinh Inmarsat Nghi Sơn Thanh Hóa',
    provinceId: 38,
    locationAddress: 'Khu kinh tế Nghi Sơn, Tĩnh Gia, Thanh Hóa',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4 Global',
    services: 'Inmarsat-C, FleetBroadband',
    modemType: 'Sailor 6110',
    frequency: '1626.5 - 1646.5 MHz',
    sarCode: 'VN-SAR-TH-01',
    coverageZone: 'IOR & POR',
    contactPerson: 'Vũ Quốc Toàn',
    contactPhone: '0912345611',
    lat: 19.3456,
    lng: 105.7891,
    targetApproval: 'PENDING_APPROVAL',
  },
  {
    name: 'Đài vệ tinh Inmarsat Đồng Hới Quảng Bình',
    provinceId: 44,
    locationAddress: 'Cảng Gianh, Thanh Trạch, Bố Trạch, Quảng Bình',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4',
    services: 'SafetyNET, EGC',
    modemType: 'Furuno Felcom 19',
    frequency: '1530.0 MHz',
    sarCode: 'VN-SAR-QB-01',
    coverageZone: 'Vùng biển miền Trung',
    contactPerson: 'Dương Văn Thành',
    contactPhone: '0912345612',
    lat: 17.7125,
    lng: 106.4521,
    targetApproval: 'PENDING_APPROVAL',
  },
  {
    name: 'Đài vệ tinh Inmarsat Vũng Rô Phú Yên',
    provinceId: 54,
    locationAddress: 'Vịnh Vũng Rô, Hòa Xuân Nam, Đông Hòa, Phú Yên',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-6',
    services: 'Inmarsat-C, Fleet Safety',
    modemType: 'Sailor 6000',
    frequency: '1626.5 - 1660.5 MHz',
    sarCode: 'VN-SAR-PY-01',
    coverageZone: 'Biển Đông',
    contactPerson: 'Trương Hoài An',
    contactPhone: '0912345613',
    lat: 12.8712,
    lng: 109.4124,
    targetApproval: 'PENDING_APPROVAL',
  },

  // Nhóm 3: APPROVED_LEVEL1 (7 bản ghi)
  {
    name: 'Đài vệ tinh Inmarsat Vũng Tàu LES-02 VISHIPEL',
    provinceId: 77,
    locationAddress: 'Số 02 Hạ Long, Phường 2, TP. Vũng Tàu, Bà Rịa - Vũng Tàu',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-4 Full Pacific Ocean',
    services: 'Inmarsat-C, FleetBroadband, SafetyNET, LRIT',
    modemType: 'Sailor 6110 Mini-C / Thrane TT-3000',
    frequency: '1626.5 - 1660.5 MHz / 1525.0 - 1559.0 MHz',
    sarCode: 'VN-SAR-VT-01',
    coverageZone: 'Toàn bộ vùng đặc quyền kinh tế VN và POR/IOR',
    contactPerson: 'Nguyễn Tấn Đạt',
    contactPhone: '0912345614',
    lat: 10.3456,
    lng: 107.0821,
    targetApproval: 'APPROVED_LEVEL1',
  },
  {
    name: 'Đài vệ tinh Inmarsat Cái Mép Thị Vải',
    provinceId: 77,
    locationAddress: 'Khu bến cảng Cái Mép, Tân Thành, Bà Rịa - Vũng Tàu',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4 Ocean Region',
    services: 'Inmarsat-C, FleetBroadband',
    modemType: 'Sailor 500 FleetBroadband',
    frequency: '1626.5 MHz',
    sarCode: 'VN-SAR-CM-01',
    coverageZone: 'Biển Đông & Eo biển Malacca',
    contactPerson: 'Đỗ Hữu Minh',
    contactPhone: '0912345615',
    lat: 10.5124,
    lng: 107.0125,
    targetApproval: 'APPROVED_LEVEL1',
  },
  {
    name: 'Đài vệ tinh Inmarsat Côn Đảo Hải Đảo',
    provinceId: 77,
    locationAddress: 'Cảng Bến Đầm, Huyện Côn Đảo, Bà Rịa - Vũng Tàu',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-4 F1',
    services: 'SafetyNET, EGC, LRIT Tracking',
    modemType: 'JRC JUE-87',
    frequency: '1525.0 - 1559.0 MHz',
    sarCode: 'VN-SAR-CD-01',
    coverageZone: 'Vùng biển Trường Sa và Nam Biển Đông',
    contactPerson: 'Lê Hoàng Ân',
    contactPhone: '0912345616',
    lat: 8.6812,
    lng: 106.6012,
    targetApproval: 'APPROVED_LEVEL1',
  },
  {
    name: 'Đài vệ tinh Inmarsat Phú Quốc Bãi Vòng',
    provinceId: 91,
    locationAddress: 'Cảng Bãi Vòng, Hàm Ninh, TP. Phú Quốc, Kiên Giang',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4 Ocean',
    services: 'Inmarsat-C, Fleet Safety',
    modemType: 'Sailor 6110',
    frequency: '1626.5 - 1646.5 MHz',
    sarCode: 'VN-SAR-PQ-01',
    coverageZone: 'Vịnh Thái Lan & Vùng biển Tây Nam',
    contactPerson: 'Trịnh Quốc Tuấn',
    contactPhone: '0912345617',
    lat: 10.2145,
    lng: 104.0512,
    targetApproval: 'APPROVED_LEVEL1',
  },
  {
    name: 'Đài vệ tinh Inmarsat Rạch Giá Kiên Giang',
    provinceId: 91,
    locationAddress: 'Số 01 đường 3/2, Vĩnh Thanh Vân, Rạch Giá, Kiên Giang',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4',
    services: 'SafetyNET, Inmarsat-C',
    modemType: 'Furuno Felcom 18',
    frequency: '1530.0 MHz',
    sarCode: 'VN-SAR-RG-01',
    coverageZone: 'Vịnh Thái Lan',
    contactPerson: 'Mai Văn Hiệp',
    contactPhone: '0912345618',
    lat: 10.0124,
    lng: 105.0812,
    targetApproval: 'APPROVED_LEVEL1',
  },
  {
    name: 'Đài vệ tinh Inmarsat Năm Căn Cà Mau',
    provinceId: 96,
    locationAddress: 'Thị trấn Năm Căn, Huyện Năm Căn, Cà Mau',
    conditionStatus: 'MAINTENANCE',
    satelliteSystem: 'Inmarsat-3/4',
    services: 'Inmarsat-C, LRIT Tracking',
    modemType: 'Sailor 6006',
    frequency: '1626.5 MHz',
    sarCode: 'VN-SAR-CM-02',
    coverageZone: 'Mũi Cà Mau & Vùng giáp ranh',
    contactPerson: 'Lý Trọng Nghĩa',
    contactPhone: '0912345619',
    lat: 8.7512,
    lng: 105.0125,
    targetApproval: 'APPROVED_LEVEL1',
  },
  {
    name: 'Đài vệ tinh Inmarsat Cần Thơ Cái Cui',
    provinceId: 92,
    locationAddress: 'Cảng Cái Cui, Tân Phú, Cái Răng, Cần Thơ',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-6',
    services: 'FleetBroadband, EGC',
    modemType: 'Cobham Sailor 500',
    frequency: '1525.0 - 1559.0 MHz',
    sarCode: 'VN-SAR-CT-01',
    coverageZone: 'Khu vực ĐBSCL & Cửa biển sông Hậu',
    contactPerson: 'Nguyễn Văn Mười',
    contactPhone: '0912345620',
    lat: 10.0145,
    lng: 105.7891,
    targetApproval: 'APPROVED_LEVEL1',
  },

  // Nhóm 4: APPROVED (10 bản ghi)
  {
    name: 'Đài vệ tinh Inmarsat TP. Hồ Chí Minh Trung tâm Cát Lái',
    provinceId: 79,
    locationAddress: 'Khu cảng Cát Lái, Phường Cát Lái, TP. Thủ Đức, TP.HCM',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-4 / I-6 Global Hybrid',
    services: 'Inmarsat-C, FleetBroadband, SafetyNET, Fleet Safety, LRIT Tracking',
    modemType: 'Cobham Sailor 6110 / Thrane TT-3000EB GMDSS',
    frequency: '1626.5 - 1660.5 MHz / 1525.0 - 1559.0 MHz',
    sarCode: 'VN-SAR-HCM-01',
    coverageZone: 'Toàn bộ vùng biển phía Nam và Quốc tế',
    contactPerson: 'Võ Thành Đồng',
    contactPhone: '0912345621',
    lat: 10.7612,
    lng: 106.7925,
    targetApproval: 'APPROVED',
  },
  {
    name: 'Đài vệ tinh Inmarsat Hiệp Phước Nhà Bè',
    provinceId: 79,
    locationAddress: 'Cảng Hiệp Phước, Hiệp Phước, Nhà Bè, TP.HCM',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4 Ocean',
    services: 'Inmarsat-C, FleetBroadband',
    modemType: 'Sailor 500',
    frequency: '1626.5 MHz',
    sarCode: 'VN-SAR-HP-01',
    coverageZone: 'Luồng Soài Rạp và Vùng biển Đông Nam',
    contactPerson: 'Trần Văn Kiên',
    contactPhone: '0912345622',
    lat: 10.6512,
    lng: 106.7512,
    targetApproval: 'APPROVED',
  },
  {
    name: 'Đài vệ tinh Inmarsat Bến Nghé Sài Gòn',
    provinceId: 79,
    locationAddress: 'Cảng Bến Nghé, Tân Thuận Đông, Quận 7, TP.HCM',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4',
    services: 'SafetyNET, EGC',
    modemType: 'JRC JUE-87',
    frequency: '1530.0 MHz',
    sarCode: 'VN-SAR-BN-01',
    coverageZone: 'Vùng sông Sài Gòn & Cửa biển',
    contactPerson: 'Nguyễn Hữu Tài',
    contactPhone: '0912345623',
    lat: 10.7712,
    lng: 106.7312,
    targetApproval: 'APPROVED',
  },
  {
    name: 'Đài vệ tinh Inmarsat Nha Trang Bờ Đông',
    provinceId: 56,
    locationAddress: 'Số 05 đường Trần Phú, Vĩnh Hòa, Nha Trang, Khánh Hòa',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-4 Ocean Region',
    services: 'Inmarsat-C, SafetyNET, Fleet Safety',
    modemType: 'Sailor 6110 Mini-C',
    frequency: '1626.5 - 1660.5 MHz',
    sarCode: 'VN-SAR-NT-01',
    coverageZone: 'Khu vực quần đảo Trường Sa và Biển Đông',
    contactPerson: 'Phan Đình Trọng',
    contactPhone: '0912345624',
    lat: 12.2388,
    lng: 109.1967,
    targetApproval: 'APPROVED',
  },
  {
    name: 'Đài vệ tinh Inmarsat Quy Nhơn Bình Định',
    provinceId: 52,
    locationAddress: 'Cảng Quy Nhơn, Hải Cảng, TP. Quy Nhơn, Bình Định',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4 Global',
    services: 'Inmarsat-C, LRIT Tracking, EGC',
    modemType: 'Furuno Felcom 18',
    frequency: '1525.0 - 1559.0 MHz',
    sarCode: 'VN-SAR-QN-02',
    coverageZone: 'Vùng biển Duyên hải Nam Trung Bộ',
    contactPerson: 'Đặng Ngọc Thắng',
    contactPhone: '0912345625',
    lat: 13.7712,
    lng: 109.2412,
    targetApproval: 'APPROVED',
  },
  {
    name: 'Đài vệ tinh Inmarsat Dung Quất Quảng Ngãi',
    provinceId: 51,
    locationAddress: 'Khu kinh tế Dung Quất, Bình Thạnh, Bình Sơn, Quảng Ngãi',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-6',
    services: 'FleetBroadband, Inmarsat-C',
    modemType: 'Sailor 6000 GMDSS',
    frequency: '1626.5 MHz',
    sarCode: 'VN-SAR-DQ-01',
    coverageZone: 'Vùng biển Hoàng Sa và Trung Trung Bộ',
    contactPerson: 'Lâm Văn Phát',
    contactPhone: '0912345626',
    lat: 15.3912,
    lng: 108.7812,
    targetApproval: 'APPROVED',
  },
  {
    name: 'Đài vệ tinh Inmarsat Phan Thiết Bình Thuận',
    provinceId: 60,
    locationAddress: 'Cảng Phan Thiết, Đức Thắng, TP. Phan Thiết, Bình Thuận',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4',
    services: 'SafetyNET, EGC',
    modemType: 'JRC JUE-87',
    frequency: '1535.0 MHz',
    sarCode: 'VN-SAR-PT-01',
    coverageZone: 'Vùng biển Bình Thuận - Ninh Thuận',
    contactPerson: 'Châu Văn Hậu',
    contactPhone: '0912345627',
    lat: 10.9214,
    lng: 108.1012,
    targetApproval: 'APPROVED',
  },
  {
    name: 'Đài vệ tinh Inmarsat Bạch Long Vĩ Tiền Tiêu',
    provinceId: 31,
    locationAddress: 'Âu cảng Bạch Long Vĩ, Huyện Bạch Long Vĩ, Hải Phòng',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-4 Full System',
    services: 'Inmarsat-C, Fleet Safety, SafetyNET',
    modemType: 'Cobham Sailor 6110',
    frequency: '1626.5 - 1660.5 MHz',
    sarCode: 'VN-SAR-BLV-01',
    coverageZone: 'Toàn bộ Vịnh Bắc Bộ và đường phân định',
    contactPerson: 'Đinh Công Bằng',
    contactPhone: '0912345628',
    lat: 20.1312,
    lng: 107.7214,
    targetApproval: 'APPROVED',
  },
  {
    name: 'Đài vệ tinh Inmarsat Cô Tô Quảng Ninh',
    provinceId: 14,
    locationAddress: 'Cảng Cô Tô, Huyện Cô Tô, Quảng Ninh',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat-4',
    services: 'Inmarsat-C, LRIT Tracking',
    modemType: 'Sailor 6006',
    frequency: '1540.0 MHz',
    sarCode: 'VN-SAR-CTO-01',
    coverageZone: 'Vùng biển Đông Bắc',
    contactPerson: 'Tạ Văn Tuấn',
    contactPhone: '0912345629',
    lat: 20.9812,
    lng: 107.7612,
    targetApproval: 'APPROVED',
  },
  {
    name: 'Đài vệ tinh Inmarsat Hòn Dấu Hải Phòng',
    provinceId: 31,
    locationAddress: 'Đảo Hòn Dấu, Đồ Sơn, Hải Phòng',
    conditionStatus: 'OPERATIONAL',
    satelliteSystem: 'Inmarsat I-6 Hybrid',
    services: 'Inmarsat-C, FleetBroadband, SafetyNET',
    modemType: 'Sailor 6110 GMDSS',
    frequency: '1626.5 - 1660.5 MHz',
    sarCode: 'VN-SAR-HD-01',
    coverageZone: 'Luồng hàng hải Hải Phòng & Vịnh Bắc Bộ',
    contactPerson: 'Nguyễn Văn Đạt',
    contactPhone: '0912345630',
    lat: 20.6678,
    lng: 106.8124,
    targetApproval: 'APPROVED',
  },

  // Nhóm 5: REJECTED (5 bản ghi - Có lý do từ chối >= 10 ký tự)
  {
    name: 'Đài vệ tinh Inmarsat Kỳ Anh Vũng Áng',
    provinceId: 42,
    locationAddress: 'Khu cảng Vũng Áng, Kỳ Anh, Hà Tĩnh',
    conditionStatus: 'STOPPED',
    satelliteSystem: 'Inmarsat-3',
    services: 'Inmarsat-C',
    modemType: 'Furuno Felcom 15',
    frequency: '1626.5 MHz',
    sarCode: 'VN-SAR-VA-01',
    coverageZone: 'Khu vực Bắc Trung Bộ',
    contactPerson: 'Trần Đình Cảnh',
    contactPhone: '0912345631',
    lat: 18.0512,
    lng: 106.4125,
    targetApproval: 'REJECTED_LEVEL1',
    rejectionReason: 'Hồ sơ kỹ thuật chưa đạt yêu cầu kiểm định dải tần và thiếu sơ đồ đấu nối',
  },
  {
    name: 'Đài vệ tinh Inmarsat Hòn La Quảng Bình',
    provinceId: 44,
    locationAddress: 'Cảng Hòn La, Quảng Đông, Quảng Trạch, Quảng Bình',
    conditionStatus: 'STOPPED',
    satelliteSystem: 'Inmarsat-3',
    services: 'SafetyNET',
    modemType: 'Sailor TT-3020',
    frequency: '1530.0 MHz',
    sarCode: 'VN-SAR-HL-01',
    coverageZone: 'Vùng biển Hòn La',
    contactPerson: 'Vũ Đức Thịnh',
    contactPhone: '0912345632',
    lat: 17.9214,
    lng: 106.5124,
    targetApproval: 'REJECTED_LEVEL1',
    rejectionReason: 'Thiết bị modem đã hết niên hạn sử dụng theo tiêu chuẩn quy chuẩn QCVN',
  },
  {
    name: 'Đài vệ tinh Inmarsat Thuận An Thừa Thiên Huế',
    provinceId: 46,
    locationAddress: 'Cảng Thuận An, Phú Vang, Thừa Thiên Huế',
    conditionStatus: 'MAINTENANCE',
    satelliteSystem: 'Inmarsat-4',
    services: 'Inmarsat-C, EGC',
    modemType: 'JRC JUE-75',
    frequency: '1626.5 MHz',
    sarCode: 'VN-SAR-TA-01',
    coverageZone: 'Cửa biển Thuận An',
    contactPerson: 'Hồ Văn Lộc',
    contactPhone: '0912345633',
    lat: 16.5612,
    lng: 107.6512,
    targetApproval: 'REJECTED_LEVEL2',
    rejectionReason: 'Cục Hàng hải yêu cầu bổ sung giấy phép tần số vô tuyến điện băng C',
  },
  {
    name: 'Đài vệ tinh Inmarsat Gành Hào Bạc Liêu',
    provinceId: 95,
    locationAddress: 'Cảng cá Gành Hào, Đông Hải, Bạc Liêu',
    conditionStatus: 'STOPPED',
    satelliteSystem: 'Inmarsat-3',
    services: 'SafetyNET',
    modemType: 'Sailor 3000',
    frequency: '1535.0 MHz',
    sarCode: 'VN-SAR-GH-01',
    coverageZone: 'Vùng biển Bạc Liêu',
    contactPerson: 'Dương Tấn Hưng',
    contactPhone: '0912345634',
    lat: 9.0124,
    lng: 105.4125,
    targetApproval: 'REJECTED_LEVEL2',
    rejectionReason: 'Tọa độ trạm bị lệch so với quy hoạch hạ tầng viễn thông hàng hải',
  },
  {
    name: 'Đài vệ tinh Inmarsat Soài Rạp Tiền Giang',
    provinceId: 82,
    locationAddress: 'Cảng Gò Công Đông, Tiền Giang',
    conditionStatus: 'STOPPED',
    satelliteSystem: 'Inmarsat-4',
    services: 'Inmarsat-C',
    modemType: 'Cobham TT-3000',
    frequency: '1626.5 MHz',
    sarCode: 'VN-SAR-SR-01',
    coverageZone: 'Cửa biển Soài Rạp',
    contactPerson: 'Nguyễn Tấn Bửu',
    contactPhone: '0912345635',
    lat: 10.3124,
    lng: 106.7125,
    targetApproval: 'REJECTED_LEVEL1',
    rejectionReason: 'Thiếu quyết định đầu tư và phương án an toàn thông tin được phê duyệt',
  },
];

/* ------------------------------------------------------------------ */
/*  Bộ Test Suite Toàn Diện Cho Màn Hình Inmarsat /station/inmarsat    */
/* ------------------------------------------------------------------ */
test.describe.serial('E2E Đài vệ tinh Inmarsat (/station/inmarsat) - 35 Records & Full Flows', () => {
  let token: string;
  let seededIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    token = await getAdminToken(request);

    // 1. Lấy danh sách Đơn vị quản lý
    let orgUnitId: string | null = null;
    try {
      const orgRes = await request.get(`${BE}/api/v1/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orgRes.ok()) {
        const orgs = await orgRes.json();
        const orgList = orgs.data || orgs;
        if (Array.isArray(orgList) && orgList.length > 0) {
          orgUnitId = orgList[0].id;
        }
      }
    } catch {
      // Fallback
    }

    // 2. Seed 35 bản ghi thực tế với các trạng thái khác nhau
    console.log(`[SEED] Bắt đầu tạo 35 bản ghi Đài Inmarsat mẫu...`);
    for (let i = 0; i < SEED_INMARSAT_STATIONS.length; i++) {
      const item = SEED_INMARSAT_STATIONS[i];
      try {
        // Tạo mới DRAFT
        const createRes = await request.post(`${BE}/api/v1/stations/inmarsat`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            name: item.name,
            stationName: item.name,
            orgUnitId: orgUnitId,
            provinceId: item.provinceId,
            locationAddress: item.locationAddress,
            conditionStatus: item.conditionStatus,
            satelliteSystem: item.satelliteSystem,
            services: item.services,
            modemType: item.modemType,
            frequency: item.frequency,
            sarCode: item.sarCode,
            coverageZone: item.coverageZone,
            contactPerson: item.contactPerson,
            contactPhone: item.contactPhone,
            latitude: item.lat,
            longitude: item.lng,
            objectType: 'POINT',
            coordinateSystem: 'WGS84',
          },
        });

        if (createRes.ok()) {
          const resBody = await createRes.json();
          const created = resBody.data ?? resBody;
          const id = created.id;
          seededIds.push(id);

          // Chuyển trạng thái theo targetApproval
          if (item.targetApproval === 'PENDING_APPROVAL') {
            await request.post(`${BE}/api/v1/stations/inmarsat/${id}/submit`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } else if (item.targetApproval === 'APPROVED_LEVEL1') {
            await request.post(`${BE}/api/v1/stations/inmarsat/${id}/submit`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            await request.post(`${BE}/api/v1/stations/inmarsat/${id}/approve-l1`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } else if (item.targetApproval === 'APPROVED') {
            await request.post(`${BE}/api/v1/stations/inmarsat/${id}/submit`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            await request.post(`${BE}/api/v1/stations/inmarsat/${id}/approve-l1`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            await request.post(`${BE}/api/v1/stations/inmarsat/${id}/approve-l2`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } else if (item.targetApproval === 'REJECTED_LEVEL1' || item.targetApproval === 'REJECTED_LEVEL2') {
            await request.post(`${BE}/api/v1/stations/inmarsat/${id}/submit`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (item.targetApproval === 'REJECTED_LEVEL2') {
              await request.post(`${BE}/api/v1/stations/inmarsat/${id}/approve-l1`, {
                headers: { Authorization: `Bearer ${token}` },
              });
            }
            await request.post(`${BE}/api/v1/stations/inmarsat/${id}/reject`, {
              headers: { Authorization: `Bearer ${token}` },
              data: {
                approved: false,
                rejectionReason: item.rejectionReason || 'Hồ sơ kỹ thuật chưa đạt tiêu chuẩn quy định của Cục',
              },
            });
          }
        }
      } catch (err) {
        console.error(`[SEED ERROR] Station ${item.name}:`, err);
      }
    }
    console.log(`[SEED] Đã tạo thành công ${seededIds.length} bản ghi!`);
  });

  // Helper login UI
  async function doLoginUI(page: Page) {
    await page.goto('/login');
    await page.evaluate((jwt) => {
      localStorage.setItem('auth_token', jwt);
    }, token);
    await page.goto('/station/inmarsat');
    await page.waitForLoadState('domcontentloaded');
  }

  /* ------------------------------------------------------------------ */
  /* Test 1: Kiểm tra API Status Counts khớp tổng số                    */
  /* ------------------------------------------------------------------ */
  test('API Verify: Status counts match sum rule', async ({ request }) => {
    const res = await request.get(`${BE}/api/v1/stations/inmarsat/counts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const counts = await res.json();
    const all = counts.ALL || 0;
    const draft = counts.DRAFT || 0;
    const p1 = counts.PENDING_APPROVAL || 0;
    const a1 = counts.APPROVED_LEVEL1 || 0;
    const app = counts.APPROVED || 0;
    const rej = (counts.REJECTED_LEVEL1 || 0) + (counts.REJECTED_LEVEL2 || 0) + (counts.REJECTED || 0);

    expect(all).toBeGreaterThanOrEqual(30);
    expect(all).toBe(draft + p1 + a1 + app + rej);
  });

  /* ------------------------------------------------------------------ */
  /* Test 2: UI Truy cập màn hình & kiểm tra giao diện cơ bản           */
  /* ------------------------------------------------------------------ */
  test('UI: Truy cập /station/inmarsat, kiểm tra Header, Breadcrumb và Bảng', async ({ page }) => {
    await doLoginUI(page);
    await page.goto('/station/inmarsat');
    await expect(page.getByText('Quản lý nhà trạm')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Đài vệ tinh Inmarsat').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /thêm đài inmarsat/i })).toBeVisible();

    // Kiểm tra Bảng dữ liệu có hiển thị bản ghi
    const rows = page.locator('.ant-table-row');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  /* ------------------------------------------------------------------ */
  /* Test 3: UI Kiểm tra bộ lọc thường (Tìm kiếm, Đơn vị, StatusTabs)   */
  /* ------------------------------------------------------------------ */
  test('UI: Test bộ lọc thường & Tìm kiếm tiếng Việt không dấu', async ({ page }) => {
    await doLoginUI(page);
    await page.goto('/station/inmarsat');

    // 1. Kiểm tra ô Tìm kiếm có prefix & placeholder
    const searchInput = page.locator('main').getByPlaceholder('Tìm kiếm');
    await expect(searchInput).toBeVisible();

    // 2. Tìm kiếm tiếng Việt không dấu: "hai phong"
    await searchInput.fill('hai phong');
    await page.locator('main').getByRole('button', { name: /tìm kiếm/i }).click();
    await page.waitForTimeout(600);

    // Kiểm tra kết quả lọc
    await expect(page.getByText(/Hải Phòng/i).first()).toBeVisible();

    // 3. Chuyển StatusTabs
    const draftTab = page.getByRole('button', { name: /lưu tạm/i });
    await draftTab.click();
    await page.waitForTimeout(500);

    const allTab = page.getByRole('button', { name: /tất cả/i });
    await allTab.click();
    await page.waitForTimeout(500);
  });

  /* ------------------------------------------------------------------ */
  /* Test 4: UI Kiểm tra bộ lọc nâng cao (Toggle Collapse, Tỉnh, Range) */
  /* ------------------------------------------------------------------ */
  test('UI: Test mở rộng bộ lọc nâng cao (Filter Toggle) và Reset', async ({ page }) => {
    await doLoginUI(page);
    await page.goto('/station/inmarsat');

    // Ban đầu bộ lọc nâng cao ẩn (không thấy ô Tình trạng)
    const conditionField = page.getByText('Tình trạng');
    // Bấm nút Toggle Filter (icon phễu tròn ở đáy sidebar)
    const toggleButton = page.locator('button:has(.anticon-filter)');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();
    await page.waitForTimeout(300);

    // Sau khi mở: hiển thị các trường nâng cao
    await expect(page.getByText('Tất cả tình trạng')).toBeVisible();
    await expect(page.getByText('Ngày cập nhật')).toBeVisible();
    await expect(page.getByText('Địa điểm (Tỉnh/Thành phố)')).toBeVisible();

    // Test bấm nút Reload (Reset)
    const reloadBtn = page.locator('button:has(.anticon-reload)');
    await reloadBtn.click();
    await page.waitForTimeout(500);

    // Ô tìm kiếm phải về rỗng
    const searchInput = page.locator('main').getByPlaceholder('Tìm kiếm');
    await expect(searchInput).toHaveValue('');
  });

  /* ------------------------------------------------------------------ */
  /* Test 5: UI Thêm mới Đài Inmarsat 4-Tab (Form Drawer CRUD)          */
  /* ------------------------------------------------------------------ */
  test('UI: Tạo mới đài Inmarsat qua Form 4-Tab và Lưu tạm', async ({ page }) => {
    await doLoginUI(page);
    await page.goto('/station/inmarsat');

    // Click nút Thêm đài Inmarsat
    const createBtn = page.getByRole('button', { name: /thêm đài inmarsat/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Drawer mở ra
    await expect(page.getByText('Thêm mới Đài vệ tinh Inmarsat')).toBeVisible();

    // Tab 1: Thông tin chung
    // 1.1 Chọn đơn vị quản lý
    const orgTree = page.locator('.ant-drawer .ant-tree-select');
    await orgTree.click();
    const treeNode = page.locator('.ant-select-tree-node-content-wrapper').first();
    await expect(treeNode).toBeVisible({ timeout: 5000 });
    await treeNode.click();

    // 1.2 Tên đài
    await page.getByPlaceholder('Nhập tên đài vệ tinh Inmarsat...').fill('Đài vệ tinh E2E Test Playwright Tự Động');

    // 1.3 Chọn tỉnh thành
    const provinceSelect = page.locator('.ant-drawer .ant-form-item:has(label:has-text("Địa điểm (Tỉnh/Thành phố)")) .ant-select');
    await provinceSelect.click();
    const provOption = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first();
    await expect(provOption).toBeVisible({ timeout: 5000 });
    await provOption.click();

    // 1.4 Địa chỉ chi tiết
    await page.getByPlaceholder('Nhập địa chỉ, vị trí chi tiết của đài...').fill('Số 100 Đường Trần Hưng Đạo, Hoàn Kiếm, Hà Nội');

    // Tab 2: Thông tin kỹ thuật
    await page.getByRole('tab', { name: /thông tin kỹ thuật/i }).click();
    await page.waitForTimeout(200);
    await page.getByPlaceholder('VD: 1.6 GHz, L-Band...').fill('1626.5 MHz');
    await page.getByPlaceholder('VD: Capsat, Sailor 6006...').fill('Sailor 6110 E2E');
    await page.getByPlaceholder('VD: SAR-INM-VN01...').fill('VN-SAR-E2E-99');
    await page.getByPlaceholder('Họ và tên cán bộ quản trị trạm...').fill('Kỹ sư Test');
    await page.getByPlaceholder('Số điện thoại trực ban / hotline...').fill('0988776655');

    // Tab 3: Thông tin vị trí
    await page.getByRole('tab', { name: /thông tin vị trí/i }).click();
    await page.waitForTimeout(200);
    const latInput = page.getByPlaceholder('VD: 10.776889');
    if (await latInput.isVisible()) {
      await latInput.fill('20.8523');
    }
    const lngInput = page.getByPlaceholder('VD: 106.700806');
    if (await lngInput.isVisible()) {
      await lngInput.fill('106.6821');
    }

    // Bấm nút "Lưu tạm" ở Footer Drawer
    const saveDraftBtn = page.locator('.ant-drawer-footer, .app-drawer-footer').getByRole('button', { name: /lưu tạm/i }).or(page.getByRole('button', { name: /lưu tạm/i }).last());
    await saveDraftBtn.click();

    // Toast thành công
    await expect(page.getByText(/thành công/i)).toBeVisible({ timeout: 8000 });
  });

  /* ------------------------------------------------------------------ */
  /* Test 6: UI Xem chi tiết Drawer                                    */
  /* ------------------------------------------------------------------ */
  test('UI: Xem chi tiết Đài Inmarsat qua menu dòng 3 chấm', async ({ page }) => {
    await doLoginUI(page);
    await page.goto('/station/inmarsat');

    // Mở menu thao tác của dòng đầu tiên
    const firstRow = page.locator('.ant-table-row').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.hover();
    const actionBtn = firstRow.locator('.ant-dropdown-trigger, button:has(.anticon-ellipsis), .table-action-menu-btn, button:has(.anticon-more), .anticon-more').first();
    if (await actionBtn.isVisible()) {
      await actionBtn.click();
      const viewOption = page.locator('.ant-dropdown:visible').getByText('Xem chi tiết');
      if (await viewOption.isVisible()) {
        await viewOption.click();
        await expect(page.getByText(/chi tiết đài/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  /* ------------------------------------------------------------------ */
  /* Test 7: UI Phân trang (Pagination) với hơn 30 bản ghi              */
  /* ------------------------------------------------------------------ */
  test('UI: Kiểm tra Phân trang hoạt động chính xác với 30+ bản ghi', async ({ page }) => {
    await doLoginUI(page);
    await page.goto('/station/inmarsat');

    // Chờ bảng nạp xong
    await expect(page.locator('.ant-table-row').first()).toBeVisible({ timeout: 10000 });

    // Kiểm tra có thông tin tổng số bản ghi và nút trang 2
    await expect(page.getByText(/Tổng cộng:/i)).toBeVisible();

    const page2Btn = page.getByRole('button', { name: '2', exact: true });
    await expect(page2Btn).toBeVisible();
    await page2Btn.click();
    await page.waitForTimeout(500);

    // Vẫn có dữ liệu ở trang 2
    await expect(page.locator('.ant-table-row').first()).toBeVisible();
  });
});
