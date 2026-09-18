export interface StationTypeConfig {
  type: string;
  types: string;
  resource: string | string[];
  title: string;
  stationFieldName: string;
  stationLabel: string;
  stationPlaceholder: string;
  codePrefix: string;
  breadcrumbGroup: string;
  breadcrumbItem: string;
  drawerClassName?: string;
}

export const LRIT_CONFIG: StationTypeConfig = {
  type: 'LRIT_STATION',
  types: 'LRIT_STATION',
  resource: ['lritasset', 'lrit', 'coastalstationlrit', 'specialstation', 'coastalstation', 'infraasset'],
  title: 'Tài sản đài LRIT',
  stationFieldName: 'lritStationId',
  stationLabel: 'Mã đài',
  stationPlaceholder: 'Chọn đài LRIT',
  codePrefix: 'TS-LRIT-',
  breadcrumbGroup: 'Quản lý tài sản KCHT hàng hải',
  breadcrumbItem: 'Tài sản đài LRIT',
};

export const TTDH_CONFIG: StationTypeConfig = {
  type: 'TTDH_STATION',
  types: 'TTDH_STATION',
  resource: ['daittdhasset', 'daittdh', 'coastalstation', 'specialstation', 'infraasset'],
  title: 'Tài sản đài TTDH',
  stationFieldName: 'ttdhStationId',
  stationLabel: 'Mã đài TTDH',
  stationPlaceholder: 'Chọn đài TTDH',
  codePrefix: 'TS-TTDH-',
  breadcrumbGroup: 'Quản lý tài sản KCHT hàng hải',
  breadcrumbItem: 'Tài sản đài TTDH',
};

export const INMARSAT_CONFIG: StationTypeConfig = {
  type: 'INMARSAT_STATION',
  types: 'INMARSAT_STATION',
  resource: ['inmarsatasset', 'inmarsat', 'coastalstationinmarsat', 'specialstation', 'coastalstation', 'infraasset'],
  title: 'Tài sản đài Inmarsat',
  stationFieldName: 'inmarsatStationId',
  stationLabel: 'Mã đài Inmarsat',
  stationPlaceholder: 'Chọn đài Inmarsat',
  codePrefix: 'TS-INMARSAT-',
  breadcrumbGroup: 'Quản lý tài sản KCHT hàng hải',
  breadcrumbItem: 'Tài sản đài Inmarsat',
};

export const COSPAS_SARSAT_CONFIG: StationTypeConfig = {
  type: 'COSPAS_SARSAT_STATION',
  types: 'COSPAS_SARSAT_STATION',
  resource: ['cospassarsatasset', 'cospassarsat', 'coastalstationcospassarsat', 'specialstation', 'coastalstation', 'infraasset'],
  title: 'Tài sản đài Cospas-Sarsat',
  stationFieldName: 'cospasSarsatStationId',
  stationLabel: 'Mã đài Cospas-Sarsat',
  stationPlaceholder: 'Chọn đài Cospas-Sarsat',
  codePrefix: 'TS-COSPAS-',
  breadcrumbGroup: 'Quản lý tài sản KCHT hàng hải',
  breadcrumbItem: 'Tài sản đài Cospas-Sarsat',
};

export const TTXLTT_CONFIG: StationTypeConfig = {
  type: 'TTXLTT_STATION',
  types: 'TTXLTT_STATION',
  resource: ['ttxlttasset', 'infraasset'],
  title: 'Tài sản đài TTXLTT',
  stationFieldName: 'ttxlttStationId',
  stationLabel: 'Mã đài TTXLTT',
  stationPlaceholder: 'Chọn đài TTXLTT',
  codePrefix: 'TS-TTXLTT-',
  breadcrumbGroup: 'Quản lý tài sản KCHT hàng hải',
  breadcrumbItem: 'Tài sản đài TTXLTT',
};
