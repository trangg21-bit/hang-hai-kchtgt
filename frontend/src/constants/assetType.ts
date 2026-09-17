/**
 * Danh mục 11 Loại tài sản Kết cấu hạ tầng giao thông hàng hải (KCHTHH)
 * Theo quy định quản lý, sử dụng và khai thác tài sản kết cấu hạ tầng giao thông hàng hải.
 */
export const MaritimeAssetType = {
  PORT_BUOY: 'Bến cảng, bến phao',
  PORT_FACILITIES: 'Trụ sở, cơ sở dịch vụ, kho, bãi, nhà xưởng và các công trình phụ trợ khác trong khu vực bến cảng',
  PORT_UTILITIES: 'Hệ thống thông tin giao thông, thông tin liên lạc và hệ thống điện, nước trong khu vực bến cảng',
  LIGHTHOUSE_STATION: 'Đèn biển và nhà trạm gắn với đèn biển; đăng tiêu độc lập',
  BUOY_STATION_PIER: 'Phao, tiêu, nhà trạm và cầu tàu phục vụ quản lý vận hành phao tiêu',
  VTS_SYSTEM: 'Hệ thống giám sát và điều phối giao thông hàng hải (VTS)',
  BREAKWATER_REVETMENT: 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ',
  NAVIGATION_CHANNEL: 'Luồng hàng hải, vùng đón trả hoa tiêu, vùng kiểm dịch',
  TRANSFER_ANCHORAGE_SHELTER: 'Khu chuyển tải, khu neo đậu, khu tránh, trú bão trong vùng nước cảng biển',
  COASTAL_INFO_SYSTEM: 'Hệ thống thông tin duyên hải Việt Nam',
  OTHER_MARITIME_ASSETS: 'Các tài sản KCHTHH khác',
} as const;

export type MaritimeAssetType = (typeof MaritimeAssetType)[keyof typeof MaritimeAssetType];

export interface MaritimeAssetTypeItem {
  code: number;
  value: MaritimeAssetType;
  label: string;
}

export const MARITIME_ASSET_TYPE_ITEMS: MaritimeAssetTypeItem[] = [
  {
    code: 1,
    value: MaritimeAssetType.PORT_BUOY,
    label: 'Bến cảng, bến phao',
  },
  {
    code: 2,
    value: MaritimeAssetType.PORT_FACILITIES,
    label: 'Trụ sở, cơ sở dịch vụ, kho, bãi, nhà xưởng và các công trình phụ trợ khác trong khu vực bến cảng',
  },
  {
    code: 3,
    value: MaritimeAssetType.PORT_UTILITIES,
    label: 'Hệ thống thông tin giao thông, thông tin liên lạc và hệ thống điện, nước trong khu vực bến cảng',
  },
  {
    code: 4,
    value: MaritimeAssetType.LIGHTHOUSE_STATION,
    label: 'Đèn biển và nhà trạm gắn với đèn biển; đăng tiêu độc lập',
  },
  {
    code: 5,
    value: MaritimeAssetType.BUOY_STATION_PIER,
    label: 'Phao, tiêu, nhà trạm và cầu tàu phục vụ quản lý vận hành phao tiêu',
  },
  {
    code: 6,
    value: MaritimeAssetType.VTS_SYSTEM,
    label: 'Hệ thống giám sát và điều phối giao thông hàng hải (VTS)',
  },
  {
    code: 7,
    value: MaritimeAssetType.BREAKWATER_REVETMENT,
    label: 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ',
  },
  {
    code: 8,
    value: MaritimeAssetType.NAVIGATION_CHANNEL,
    label: 'Luồng hàng hải, vùng đón trả hoa tiêu, vùng kiểm dịch',
  },
  {
    code: 9,
    value: MaritimeAssetType.TRANSFER_ANCHORAGE_SHELTER,
    label: 'Khu chuyển tải, khu neo đậu, khu tránh, trú bão trong vùng nước cảng biển',
  },
  {
    code: 10,
    value: MaritimeAssetType.COASTAL_INFO_SYSTEM,
    label: 'Hệ thống thông tin duyên hải Việt Nam',
  },
  {
    code: 11,
    value: MaritimeAssetType.OTHER_MARITIME_ASSETS,
    label: 'Các tài sản KCHTHH khác',
  },
];

/**
 * Options chuẩn dùng cho Ant Design Select / TableFilter / DynamicFormSidebar
 */
export const MARITIME_ASSET_TYPE_OPTIONS = MARITIME_ASSET_TYPE_ITEMS.map((item) => ({
  value: item.value,
  label: item.label,
}));

/**
 * Options hiển thị kèm số thứ tự (ví dụ: "1. Bến cảng, bến phao")
 */
export const MARITIME_ASSET_TYPE_NUMBERED_OPTIONS = MARITIME_ASSET_TYPE_ITEMS.map((item) => ({
  value: item.value,
  label: `${item.code}. ${item.label}`,
}));
