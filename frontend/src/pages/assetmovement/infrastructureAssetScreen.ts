import type { InfrastructureAssetType } from '../../services/assetmovement/types';

export const INFRASTRUCTURE_ASSET_TYPE = {
  PortTerminal: 'PORT_TERMINAL',
  Anchorage: 'ANCHORAGE',
  Lighthouse: 'LIGHTHOUSE',
  DikeRevetment: 'DIKE_REVETMENT',
} as const;

export type InfrastructureRelationField = 'berthId' | 'anchorageId' | 'beaconStationId' | 'dikeRevetmentId';

export interface InfrastructureReferenceOption {
  id: string;
  code: string;
  name: string;
}

export interface InfrastructureAssetScreenConfig {
  assetType: InfrastructureAssetType;
  title: string;
  subjectLabel: string;
  relationField: InfrastructureRelationField;
  relationCodeLabel: string;
  relationNameLabel: string;
  relationColumnTitle: string;
  relationColumnWidth: number;
  relationPlaceholder: string;
  pageClassName: string;
  drawerClassName: string;
}

export const PORT_TERMINAL_ASSET_SCREEN: InfrastructureAssetScreenConfig = {
  assetType: INFRASTRUCTURE_ASSET_TYPE.PortTerminal,
  title: 'Tài sản bến cảng',
  subjectLabel: 'tài sản bến cảng',
  relationField: 'berthId',
  relationCodeLabel: 'Mã bến cảng',
  relationNameLabel: 'Tên bến cảng',
  relationColumnTitle: 'MÃ BẾN CẢNG',
  relationColumnWidth: 190,
  relationPlaceholder: 'Chọn bến cảng',
  pageClassName: 'port-terminal-asset-page-wrapper',
  drawerClassName: 'berth-drawer-scope',
};

export const ANCHORAGE_ASSET_SCREEN: InfrastructureAssetScreenConfig = {
  assetType: INFRASTRUCTURE_ASSET_TYPE.Anchorage,
  title: 'Tài sản khu neo đậu',
  subjectLabel: 'tài sản khu neo đậu',
  relationField: 'anchorageId',
  relationCodeLabel: 'Mã khu neo đậu',
  relationNameLabel: 'Tên khu neo đậu',
  relationColumnTitle: 'MÃ KHU NEO ĐẬU',
  relationColumnWidth: 190,
  relationPlaceholder: 'Chọn khu neo đậu',
  pageClassName: 'anchorage-asset-page-wrapper',
  drawerClassName: 'anchorage-asset-drawer-scope',
};

export const LIGHTHOUSE_ASSET_SCREEN: InfrastructureAssetScreenConfig = {
  assetType: INFRASTRUCTURE_ASSET_TYPE.Lighthouse,
  title: 'Tài sản đèn biển và nhà trạm gắn liền đèn biển',
  subjectLabel: 'tài sản đèn biển và nhà trạm gắn liền đèn biển',
  relationField: 'beaconStationId',
  relationCodeLabel: 'Mã đèn biển và nhà trạm gắn liền với đèn biển',
  relationNameLabel: 'Tên đèn biển và nhà trạm gắn liền với đèn biển',
  relationColumnTitle: 'MÃ ĐÈN BIỂN VÀ NHÀ TRẠM GẮN LIỀN ĐÈN BIỂN',
  relationColumnWidth: 380,
  relationPlaceholder: 'Chọn đèn biển/nhà trạm',
  pageClassName: 'lighthouse-asset-page-wrapper',
  drawerClassName: 'lighthouse-asset-drawer-scope',
};

export const DIKE_REVETMENT_ASSET_SCREEN: InfrastructureAssetScreenConfig = {
  assetType: INFRASTRUCTURE_ASSET_TYPE.DikeRevetment,
  title: 'Tài sản đê/kè',
  subjectLabel: 'tài sản đê/kè',
  relationField: 'dikeRevetmentId',
  relationCodeLabel: 'Mã đê kè',
  relationNameLabel: 'Tên đê kè',
  relationColumnTitle: 'MÃ ĐÊ KÈ',
  relationColumnWidth: 190,
  relationPlaceholder: 'Chọn đê/kè',
  pageClassName: 'dike-revetment-asset-page-wrapper',
  drawerClassName: 'dike-revetment-asset-drawer-scope',
};
